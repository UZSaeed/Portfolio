// EasyAllen NWB reader (Web Worker).
//
// Allen Cell Types recordings are NWB (HDF5) files of 30–200 MB. Instead of
// downloading the whole file, we hand h5wasm a "remote blob" whose slice()
// performs synchronous HTTP range requests (allowed inside workers). HDF5 then
// reads only the metadata and the compressed chunks for the sweep we ask for.

importScripts("https://cdn.jsdelivr.net/npm/h5wasm@0.10.3/dist/iife/h5wasm.js");

const BLOCK = 32 * 1024; // cache granularity; scattered metadata reads stay small
const MAX_RUN = 32; // sequential reads grow up to 32 blocks (1 MB) per request
const MAX_BLOCKS = 1600; // ~50 MB block cache per open file

let FS = null;
let current = null; // { url, dir, file, blob, version }
let mountCount = 0;
let bytesFetched = 0;
let requests = 0;
let activeRequestId = null;
let requestBase = 0; // bytesFetched when the active request began

class RemoteBlob {
  constructor(url, size) {
    this.url = url;
    this.size = size;
    this.name = "remote.nwb";
    this.blocks = new Map(); // insertion order doubles as LRU order
    this.nextSeq = -1; // block index right after the previous miss
    this.run = 1; // current read-ahead length, in blocks
  }
  block(i) {
    const hit = this.blocks.get(i);
    if (hit) {
      this.blocks.delete(i);
      this.blocks.set(i, hit);
      return hit;
    }
    // Read-ahead: consecutive misses mean HDF5 is streaming chunk data, so
    // double the request size; a jump elsewhere resets it.
    this.run = i === this.nextSeq ? Math.min(this.run * 2, MAX_RUN) : 1;
    const lastBlock = Math.ceil(this.size / BLOCK) - 1;
    let n = 1;
    while (n < this.run && i + n <= lastBlock && !this.blocks.has(i + n)) n++;
    const start = i * BLOCK;
    const end = Math.min(this.size, (i + n) * BLOCK) - 1;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", this.url, false);
    xhr.responseType = "arraybuffer";
    xhr.setRequestHeader("Range", `bytes=${start}-${end}`);
    xhr.send(null);
    if (xhr.status !== 206 && xhr.status !== 200) {
      throw new Error(`Allen server returned HTTP ${xhr.status}`);
    }
    let buf = new Uint8Array(xhr.response);
    // A server that ignores Range sends the whole file; keep only our span.
    if (xhr.status === 200 && buf.length > end - start + 1) buf = buf.slice(start, end + 1);
    bytesFetched += buf.length;
    requests++;
    progress();
    for (let k = 0; k < n; k++) {
      this.blocks.set(i + k, buf.subarray(k * BLOCK, Math.min(buf.length, (k + 1) * BLOCK)));
    }
    while (this.blocks.size > MAX_BLOCKS) this.blocks.delete(this.blocks.keys().next().value);
    this.nextSeq = i + n;
    return this.blocks.get(i);
  }
  slice(start = 0, end = this.size) {
    end = Math.min(end, this.size);
    if (end <= start) return new Blob([]);
    const out = new Uint8Array(end - start);
    let pos = start;
    while (pos < end) {
      const b = Math.floor(pos / BLOCK);
      const blk = this.block(b);
      const off = pos - b * BLOCK;
      const n = Math.min(blk.length - off, end - pos);
      out.set(blk.subarray(off, off + n), pos - start);
      pos += n;
    }
    return new Blob([out]);
  }
}

function progress() {
  if (activeRequestId != null) {
    postMessage({ id: activeRequestId, type: "progress", bytes: bytesFetched - requestBase });
  }
}

async function ready() {
  if (!FS) {
    const mod = await h5wasm.ready;
    FS = mod.FS;
  }
}

async function fileSize(url) {
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok) throw new Error(`Allen server returned HTTP ${res.status}`);
  const n = Number(res.headers.get("content-length"));
  if (!n) throw new Error("Allen server did not report the file size");
  return n;
}

async function open(url) {
  await ready();
  if (current && current.url === url) return current;
  close();
  const size = await fileSize(url);
  const blob = new RemoteBlob(url, size);
  const dir = `/remote${mountCount++}`;
  FS.mkdir(dir);
  FS.mount(FS.filesystems.WORKERFS, { blobs: [{ name: "f.nwb", data: blob }] }, dir);
  const file = new h5wasm.File(`${dir}/f.nwb`, "r");
  current = { url, dir, file, blob, version: pipelineVersion(file) };
  return current;
}

function close() {
  if (!current) return;
  try { current.file.close(); } catch (e) { /* already closed */ }
  try { FS.unmount(current.dir); FS.rmdir(current.dir); } catch (e) { /* ignore */ }
  current = null;
}

// Mirrors allensdk NwbDataSet.get_pipeline_version: files written by
// pipeline 1.0 store data already in SI units and carry a bogus conversion.
function pipelineVersion(file) {
  try {
    const gb = file.get("general/generated_by");
    const v = gb ? gb.value : null;
    const arr = Array.isArray(v) ? v : [v];
    const i = arr.indexOf("version");
    if (i >= 0 && arr[i + 1]) {
      const [maj, min] = String(arr[i + 1]).split(".").map(Number);
      return { major: maj || 0, minor: min || 0 };
    }
  } catch (e) { /* fall through */ }
  return { major: 0, minor: 0 };
}

function attr(ds, name) {
  const a = ds.attrs[name];
  return a === undefined ? undefined : a.value;
}

function readSeries(cur, path) {
  const ds = cur.file.get(path);
  if (!ds) throw new Error(`Sweep data not found at ${path}`);
  let data = ds.value;
  if (!(data instanceof Float32Array)) data = Float32Array.from(data);
  const { major, minor } = cur.version;
  if ((major === 1 && minor > 0) || major > 1) {
    const conv = Number(attr(ds, "conversion"));
    if (conv && conv !== 1) for (let i = 0; i < data.length; i++) data[i] *= conv;
  }
  return data;
}

function sweepRate(cur, n) {
  const paths = [
    `acquisition/timeseries/Sweep_${n}/starting_time`,
    `stimulus/presentation/Sweep_${n}/starting_time`,
  ];
  for (const p of paths) {
    const ds = cur.file.get(p);
    if (ds) {
      const r = Number(attr(ds, "rate"));
      if (r) return r;
    }
  }
  throw new Error(`Sampling rate missing for sweep ${n}`);
}

async function getSweep(url, n) {
  const cur = await open(url);
  const response = readSeries(cur, `acquisition/timeseries/Sweep_${n}/data`); // volts
  const stimulus = readSeries(cur, `stimulus/presentation/Sweep_${n}/data`); // amps
  const rate = sweepRate(cur, n);
  // Convert to the units students read on a rig: mV and pA.
  for (let i = 0; i < response.length; i++) response[i] *= 1e3;
  for (let i = 0; i < stimulus.length; i++) stimulus[i] *= 1e12;
  return { response, stimulus, rate, sweep: n, fileSize: cur.blob.size };
}

// Requests run one at a time so two files are never opened concurrently.
let queue = Promise.resolve();
self.onmessage = (ev) => {
  queue = queue.then(() => handle(ev));
};

async function handle(ev) {
  const { id, type, url, sweep } = ev.data;
  activeRequestId = id;
  requestBase = bytesFetched;
  try {
    if (type === "sweep") {
      const out = await getSweep(url, sweep);
      postMessage({ id, type: "done", result: out, bytes: bytesFetched - requestBase, requests }, [
        out.response.buffer,
        out.stimulus.buffer,
      ]);
    } else if (type === "close") {
      close();
      postMessage({ id, type: "done", result: null });
    }
  } catch (err) {
    postMessage({ id, type: "error", message: String((err && err.message) || err) });
  } finally {
    activeRequestId = null;
  }
}
