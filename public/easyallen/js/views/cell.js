import { getCell, getCells, getSweeps, nwbUrl, portalUrl, thumbUrl, FEATURES, DENDRITES, FAMILY_LIST, fmt } from "../api.js";
import { loadSweep } from "../nwb.js";
import { detectSpikes, spikeStats, levels, findStimulus, rollingMean, DEFAULT_THRESHOLD } from "../analysis.js";
import { Scope, C, FONT, fitCanvas, niceTicks, tickLabel, dotted } from "../plot.js";
import { spriteSVG } from "../pixel.js";
import { h, esc, status, setQuery, bytes, download } from "../util.js";

let ctx = null; // per-page state

export async function render(main, { params, query }) {
  const id = Number(params[0]);
  status("Loading cell…", "busy");
  let cell;
  try {
    cell = await getCell(id);
  } catch (err) {
    main.appendChild(h(`<div class="wrap"><div class="error-box"><div><b>Could not reach the Allen API.</b><p>${esc(err.message)} Check your internet connection and reload.</p></div></div></div>`));
    status("Could not reach the Allen API.", "error");
    return;
  }
  if (!cell) {
    main.appendChild(h(`<div class="wrap"><div class="empty"><p>No cell with ID ${esc(id)} is in the Cell Types Database.</p><a class="btn small" href="#/cells">Browse cells</a></div></div>`));
    status("Cell not found", "error");
    return;
  }
  const all = await getCells();
  const fam = FAMILY_LIST.find((f) => f.key === cell.family);
  const dend = DENDRITES[cell.dendrite];

  main.appendChild(h(`
    <div class="wrap">
      <header class="cell-head">
        <div>
          <div class="crumbs"><a href="#/cells">Cells</a> / ${esc(cell.name)}</div>
          <h1>Cell ${cell.id}</h1>
          <div class="tags">
            <span class="chip solid">${cell.species}</span>
            <span class="chip" title="${esc(cell.structure)}">${esc(cell.region)}</span>
            ${cell.layer ? `<span class="chip">Layer ${esc(cell.layer)}</span>` : ""}
            ${dend ? `<span class="chip">${spriteSVG(cell.dendrite === "spiny" ? "spiny" : "aspiny", 2)}${dend.label}</span>` : ""}
            ${cell.family !== "none" ? `<span class="chip blue">${esc(fam.label)}</span>` : ""}
          </div>
        </div>
        <div class="actions">
          <a class="btn small ghost" href="#/compare?highlight=${cell.id}">Show in compare</a>
          <a class="btn small ghost" href="${portalUrl(cell)}" target="_blank" rel="noopener">Open on Allen site</a>
        </div>
      </header>

      <div class="cell-grid">
        <aside class="cell-side">
          <section class="panel">
            <div class="panel-head"><h2>At a glance</h2><span class="aside">Bar shows rank among all ${all.length.toLocaleString()} cells</span></div>
            <div class="panel-body feat">${FEATURES.map((f) => featRow(cell, f, all)).join("")}</div>
          </section>
          ${cell.morphThumb ? `
          <section class="panel">
            <div class="panel-head"><h2>Morphology</h2><span class="aside">Dendrites and axon, traced in 3D</span></div>
            <div class="morph"><img src="${thumbUrl(cell.morphThumb)}" alt="Reconstructed shape of cell ${cell.id}" loading="lazy"></div>
          </section>` : ""}
          <section class="panel">
            <div class="panel-head"><h2>About this cell</h2></div>
            <div class="panel-body" style="font-size:12px;display:grid;gap:6px">
              ${aboutRow("Location", esc(cell.structure) || "—")}
              ${aboutRow("Hemisphere", esc(cell.hemisphere || "—"))}
              ${aboutRow("Donor", `${cell.species}${cell.age ? `, ${esc(cell.age)}` : ""}${cell.sex ? `, ${esc(cell.sex)}` : ""}`)}
              ${cell.species === "Human" && cell.disease ? aboutRow("Tissue source", `Surgery (${esc(cell.disease)})`) : ""}
              ${cell.line ? aboutRow("Cre line", `${esc(cell.line)} <span class="muted">(reporter ${esc(cell.reporter || "unknown")})</span>`) : ""}
              ${fam && cell.family !== "none" ? `<p class="muted" style="margin:4px 0 0">${esc(fam.blurb)}</p>` : ""}
              ${dend ? `<p class="muted" style="margin:0">${esc(dend.blurb)}</p>` : ""}
            </div>
          </section>
        </aside>

        <div class="cell-main">
          <section class="panel">
            <div class="panel-head">
              <h2>Recordings</h2>
              <span class="aside" id="sweep-aside">Loading sweep list…</span>
            </div>
            <div class="sweep-layout">
              <nav class="sweeps" id="sweeps" aria-label="Sweeps"><div class="panel-body"><div class="loading-line indeterminate"><i></i></div></div></nav>
              <div class="scope-wrap">
                <div class="scope-tools">
                  <div class="seg" role="group" aria-label="Zoom">
                    <button type="button" data-z="in" title="Zoom in (+)">Zoom in</button>
                    <button type="button" data-z="out" title="Zoom out (−)">Out</button>
                    <button type="button" data-z="reset" title="Back to the stimulus (0)">Stimulus</button>
                    <button type="button" data-z="full">Whole sweep</button>
                  </div>
                  <span class="spacer"></span>
                  <label class="inline" title="A spike is counted each time the voltage rises through this level">Spike threshold
                    <input type="number" id="thr" value="${DEFAULT_THRESHOLD}" step="1" min="-60" max="20"> mV</label>
                  <label class="inline"><input type="checkbox" id="smooth"> Smooth rate</label>
                </div>
                <div class="scope" id="scope"></div>
                <div class="scope-hint">
                  <span>Drag across the plot to zoom</span><span>Double-click to reset</span><span><span class="kbd">+</span> <span class="kbd">−</span> <span class="kbd">←</span> <span class="kbd">→</span> when the plot is focused</span>
                </div>
              </div>
            </div>
            <div class="readout" id="readout"></div>
            <div class="scope-tools" style="border-bottom:0;border-top:0">
              <span class="muted" style="font-size:12px" id="source-note"></span>
              <span class="spacer"></span>
              <button class="btn small ghost" type="button" data-dl="spikes" disabled>Spike times (CSV)</button>
              <button class="btn small ghost" type="button" data-dl="sweep" disabled>Full sweep (CSV)</button>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head"><h2>F–I curve</h2><span class="aside">Firing rate on every 1 s current step. Click a point to plot that sweep.</span></div>
            <div class="fi">
              <canvas id="fi" aria-label="Firing rate versus injected current"></canvas>
              <div class="fi-side" id="fi-side"></div>
            </div>
          </section>
        </div>
      </div>
    </div>`));

  const scope = new Scope(main.querySelector("#scope"), [
    { id: "v", label: "Membrane potential", unit: "mV", weight: 3, digits: 1, minSpan: 10 },
    { id: "ifr", label: "Instantaneous firing rate", unit: "Hz", weight: 1.4, kind: "points", digits: 1, empty: "Needs at least 2 spikes" },
    { id: "i", label: "Injected current", unit: "pA", weight: 0.9, digits: 0, color: C.light, includeZero: true, minSpan: 20 },
  ], { height: 520, ariaLabel: `Recording from cell ${cell.id}` });

  ctx = { cell, main, scope, sweeps: [], current: null, data: null, token: 0, threshold: DEFAULT_THRESHOLD, smooth: false };

  main.querySelectorAll("[data-z]").forEach((b) => b.addEventListener("click", () => {
    if (!scope.data) return;
    const z = b.dataset.z;
    if (z === "in") scope.zoom(0.5);
    else if (z === "out") scope.zoom(2);
    else if (z === "reset") scope.reset();
    else scope.full();
  }));
  main.querySelector("#thr").addEventListener("change", (e) => {
    const v = Number(e.target.value);
    ctx.threshold = Number.isFinite(v) ? v : DEFAULT_THRESHOLD;
    analyze();
  });
  main.querySelector("#smooth").addEventListener("change", (e) => { ctx.smooth = e.target.checked; analyze(); });
  main.querySelector("[data-dl=spikes]").addEventListener("click", dlSpikes);
  main.querySelector("[data-dl=sweep]").addEventListener("click", dlSweep);
  window.addEventListener("resize", drawFI);

  try {
    ctx.sweeps = await getSweeps(cell.id);
  } catch (err) {
    main.querySelector("#sweeps").innerHTML = `<div class="panel-body"><b>Could not load sweeps.</b><p class="muted">${esc(err.message)}</p></div>`;
    status("Could not load the sweep list.", "error");
    return cleanupFn;
  }
  renderSweepList();
  drawFI();
  const wanted = Number(query.sweep);
  const first = ctx.sweeps.find((s) => s.number === wanted) || defaultSweep(ctx.sweeps);
  if (first) selectSweep(first.number);
  else status("This cell has no current-clamp sweeps to show.", "ok");
  return cleanupFn;
}

function cleanupFn() {
  if (!ctx) return;
  ctx.scope.destroy();
  window.removeEventListener("resize", drawFI);
  ctx = null;
}

export function onQuery(query) {
  if (!ctx) return;
  const n = Number(query.sweep);
  if (n && (!ctx.current || ctx.current.number !== n)) selectSweep(n);
}

function aboutRow(k, v) {
  return `<div style="display:grid;grid-template-columns:96px 1fr;gap:8px"><span class="muted">${k}</span><span>${v}</span></div>`;
}

function featRow(cell, f, all) {
  const v = cell.f[f.key];
  let pct = null;
  if (v != null) {
    const vals = all.map((c) => c.f[f.key]).filter((x) => x != null);
    pct = vals.filter((x) => x < v).length / vals.length;
  }
  return `<div class="feat-row">
    <div class="top">
      <span class="name"><a href="#/guide/${f.term}" style="color:inherit">${f.label}</a></span>
      <span class="val">${fmt(v, f.digits)}${f.unit && v != null ? ` <small>${f.unit}</small>` : ""}</span>
    </div>
    ${pct != null ? `<div class="meter" title="Higher than ${Math.round(pct * 100)}% of cells"><i style="width:${pct * 100}%"></i><b style="left:${pct * 100}%"></b></div>` : ""}
    <span class="explain">${f.explain}</span>
  </div>`;
}

// Default to a step ~60 pA above the first one that fired: a clear spike train
// that is still close to threshold, which is where firing patterns differ most.
function defaultSweep(sweeps) {
  const ls = sweeps.filter((s) => s.stimulus === "Long Square");
  const spiking = ls.filter((s) => s.spikes > 0);
  if (!spiking.length) return ls[ls.length - 1] || sweeps[0];
  const target = Math.min(...spiking.map((s) => s.amplitude)) + 60;
  return spiking.slice().sort((a, b) => Math.abs(a.amplitude - target) - Math.abs(b.amplitude - target) || b.spikes - a.spikes)[0];
}

const STIM_HELP = {
  "Long Square": "1 s current step. The standard test of how a cell fires.",
  "Short Square": "3 ms pulse. Finds the current needed for a single spike.",
  "Short Square - Triple": "Three short pulses in a row.",
  Ramp: "Current that rises slowly until the cell fires.",
  "Noise 1": "Fluctuating current, like synaptic input.",
  "Noise 2": "Fluctuating current, like synaptic input.",
  "Square - 2s Suprathreshold": "2 s step above threshold.",
  "Square - 0.5ms Subthreshold": "Brief pulse used to check the recording.",
};

function renderSweepList() {
  const groups = new Map();
  ctx.sweeps.forEach((s) => {
    if (!groups.has(s.stimulus)) groups.set(s.stimulus, []);
    groups.get(s.stimulus).push(s);
  });
  const order = ["Long Square", "Short Square", "Ramp", "Noise 1", "Noise 2"];
  const names = [...groups.keys()].sort((a, b) => ((order.indexOf(a) + 1) || 99) - ((order.indexOf(b) + 1) || 99));
  const el = ctx.main.querySelector("#sweeps");
  el.innerHTML = names.map((n) => `
    <h4 title="${esc(STIM_HELP[n] || "")}">${esc(n)} <span style="font-weight:400;color:var(--light)">(${groups.get(n).length})</span></h4>
    ${groups.get(n).sort((a, b) => a.amplitude - b.amplitude || a.number - b.number).map((s) => `
      <button type="button" data-sweep="${s.number}" title="Sweep ${s.number}">
        <span>#${s.number}</span><span>${fmt(s.amplitude, 0)} pA</span><span class="spk">${s.spikes ? `${s.spikes} spk` : "–"}</span>
      </button>`).join("")}`).join("");
  el.querySelectorAll("[data-sweep]").forEach((b) => b.addEventListener("click", () => selectSweep(Number(b.dataset.sweep))));
  ctx.main.querySelector("#sweep-aside").textContent = `${ctx.sweeps.length} sweeps. Pick one to load it from the Allen server.`;
}

async function selectSweep(n) {
  const s = ctx.sweeps.find((x) => x.number === n);
  if (!s) return;
  const my = ++ctx.token;
  const local = ctx;
  ctx.current = s;
  setQuery({ sweep: n });
  ctx.main.querySelectorAll("[data-sweep]").forEach((b) => b.setAttribute("aria-current", String(Number(b.dataset.sweep) === n)));
  const btn = ctx.main.querySelector(`[data-sweep="${n}"]`);
  const list = ctx.main.querySelector("#sweeps");
  if (btn && list) {
    // scroll only the sweep list, never the page
    const top = btn.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    const bottom = top + btn.offsetHeight;
    if (top < list.scrollTop + 28) list.scrollTop = top - 28;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }
  drawFI();

  const host = ctx.main.querySelector("#scope");
  host.querySelector(".overlay-msg")?.remove();
  const overlay = h(`<div class="overlay-msg"><div class="box">
      <span data-sprite="pipette" data-scale="3"></span>
      <b>Reading sweep ${n}</b>
      <div class="loading-line"><i style="--p:0.04"></i></div>
      <span class="muted" style="color:var(--light);font-size:12px" data-p>Opening the recording file…</span>
    </div></div>`);
  if (!ctx.scope.data) host.appendChild(overlay);
  else {
    overlay.style.background = "rgba(0,0,0,0.55)";
    host.appendChild(overlay);
  }
  status(`Reading sweep ${n} of cell ${ctx.cell.id} from the Allen server…`, "busy");
  const t0 = performance.now();
  try {
    const expected = 900 * 1024; // typical transfer for a first sweep
    const d = await loadSweep(nwbUrl(ctx.cell), n, (b) => {
      if (my !== local.token) return;
      overlay.querySelector("[data-p]").textContent = `${bytes(b)} downloaded`;
      overlay.querySelector(".loading-line i").style.setProperty("--p", Math.min(0.95, 0.04 + (b / expected) * 0.9));
    });
    if (ctx !== local || my !== ctx.token) return;
    overlay.remove();
    ctx.data = d;
    const win = s.start && s.duration ? [s.start, s.start + s.duration] : (() => {
      const f = findStimulus(d.stimulus, d.rate, 0);
      return f ? [f.start, f.end] : null;
    })();
    ctx.window = win;
    const pad = win ? Math.max(0.05, (win[1] - win[0]) * 0.15) : 0;
    const view = win ? [Math.max(0, win[0] - pad), win[1] + pad] : null;
    ctx.scope.setData({ t0: 0, rate: d.rate, series: { v: d.response, i: d.stimulus }, points: { ifr: { x: [], y: [] } }, window: win }, view);
    analyze();
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    ctx.main.querySelector("#source-note").textContent = `Sweep ${n}: ${s.stimulus}, ${fmt(s.amplitude, 0)} pA, sampled at ${(d.rate / 1000).toFixed(0)} kHz`;
    ctx.main.querySelectorAll("[data-dl]").forEach((b) => (b.disabled = false));
    status(`Loaded sweep ${n} in ${secs} s`, "ok");
  } catch (err) {
    if (ctx !== local || my !== ctx.token) return;
    overlay.innerHTML = `<div class="box"><b>Could not read sweep ${n}.</b><span style="font-size:12px">${esc(err.message)}</span><span style="font-size:12px;color:var(--light)">The Allen server may be busy. Try again, or pick another sweep.</span><button class="btn small primary" type="button">Try again</button></div>`;
    overlay.querySelector("button").addEventListener("click", () => selectSweep(n));
    status(`Could not read sweep ${n}: ${err.message}`, "error");
  }
}

function analyze() {
  if (!ctx || !ctx.data) return;
  const d = ctx.data;
  const spikes = detectSpikes(d.response, d.rate, { threshold: ctx.threshold });
  const st = spikeStats(spikes);
  const ifr = ctx.smooth ? rollingMean(st.ifr, 5) : st.ifr;
  ctx.stats = st;
  ctx.scope.setOverlay({ spikes, threshold: ctx.threshold, points: { ifr: { x: st.tIfr, y: ifr } } });

  const win = ctx.window;
  const lv = win ? levels(d.response, d.rate, 0, win[0], win[1]) : {};
  const amp = ctx.current.amplitude;
  const inWin = win ? spikes.filter((t) => t >= win[0] && t <= win[1]) : spikes;
  const rate = win && inWin.length ? inWin.length / (win[1] - win[0]) : null;
  const latency = win && inWin.length ? (inWin[0] - win[0]) * 1000 : null;
  const dv = lv.baseline != null && lv.steady != null ? lv.steady - lv.baseline : null;
  const rin = dv != null && amp && !spikes.length ? (dv / amp) * 1000 : null; // mV/pA -> MΩ
  const list = (a) => (a.length ? a.map((x) => x.toFixed(1)).join(", ") : "—");

  const cells = [
    ["Spikes", `${st.count}`, win ? `${inWin.length} during the step` : ""],
    ["Mean rate", rate != null ? `${fmt(rate, 1)} <small>Hz</small>` : "—", "spikes ÷ step length"],
    ["First spike latency", latency != null ? `${fmt(latency, 1)} <small>ms</small>` : "—", "from step onset"],
    ["Adaptation ratio", st.ar != null ? fmt(st.ar, 2) : "—", st.ar != null ? (st.ar > 1.3 ? "slows down over the step" : st.ar < 0.8 ? "speeds up over the step" : "fairly steady") : "needs 6+ spikes"],
    ["First 3 ISIs", `${list(st.firstIsi)} <small>ms</small>`, ""],
    ["Last 3 ISIs", `${list(st.lastIsi)} <small>ms</small>`, ""],
    ["ISI CV", st.cv != null ? fmt(st.cv, 3) : "—", st.cv != null ? (st.cv < 0.15 ? "very regular" : st.cv < 0.4 ? "somewhat irregular" : "irregular") : "needs 3+ spikes"],
    ["Firing rate, first → last", st.ifrFirst != null ? `${fmt(st.ifrFirst, 0)} → ${fmt(st.ifrLast, 0)} <small>Hz</small>` : "—", "instantaneous rate"],
    ["Baseline Vm", lv.baseline != null ? `${fmt(lv.baseline, 1)} <small>mV</small>` : "—", "just before the step"],
    ["Steady-state Vm", lv.steady != null ? `${fmt(lv.steady, 1)} <small>mV</small>` : "—", "end of the step"],
    ["Step amplitude", `${fmt(amp, 0)} <small>pA</small>`, ctx.current.stimulus],
    ["Input resistance", rin != null && rin > 0 ? `${fmt(rin, 0)} <small>MΩ</small>` : "—", rin != null && rin > 0 ? "ΔV ÷ I on this sweep" : "use a step with no spikes"],
  ];
  ctx.main.querySelector("#readout").innerHTML = cells.map(([k, v, sub]) => `
    <div><span class="k">${k}</span><span class="v">${v}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ""}</div>`).join("");
}

function drawFI() {
  if (!ctx) return;
  const canvas = ctx.main.querySelector("#fi");
  const side = ctx.main.querySelector("#fi-side");
  const pts = ctx.sweeps
    .filter((s) => s.stimulus === "Long Square" && s.duration)
    .map((s) => ({ x: s.amplitude, y: s.spikes / s.duration, s }));
  const { ctx: g, w, h: H } = fitCanvas(canvas);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, w, H);
  if (!pts.length) {
    g.fillStyle = C.dark;
    g.font = `500 12px ${FONT}`;
    g.textAlign = "center";
    g.fillText("No long square sweeps for this cell", w / 2, H / 2);
    side.innerHTML = "";
    return;
  }
  const L = 52, R = 16, T = 14, B = 34;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(0, ...xs), x1 = Math.max(...xs) * 1.05 || 1;
  const y1 = Math.max(10, ...ys) * 1.1;
  const X = (v) => L + ((v - x0) / (x1 - x0)) * (w - L - R);
  const Y = (v) => T + (1 - v / y1) * (H - T - B);
  g.font = `500 11px ${FONT}`;
  g.textBaseline = "middle";
  const xt = niceTicks(x0, x1, Math.floor(w / 90));
  const yt = niceTicks(0, y1, 4);
  g.textAlign = "center";
  xt.ticks.forEach((v) => { dotted(g, X(v), T, X(v), H - B, C.light); g.fillStyle = C.dark; g.fillText(tickLabel(v, xt.step), X(v), H - B + 14); });
  g.textAlign = "right";
  yt.ticks.forEach((v) => { dotted(g, L, Y(v), w - R, Y(v), C.light); g.fillStyle = C.dark; g.fillText(tickLabel(v, yt.step), L - 8, Y(v)); });
  g.fillStyle = C.ink;
  g.fillRect(L, H - B, w - L - R, 2);
  g.fillRect(L - 2, T, 2, H - B - T);
  g.textAlign = "left";
  g.fillText("pA", w - R - 16, H - B - 10);
  g.fillText("Hz", L + 6, T + 4);
  // connecting line through mean rate per amplitude
  const byAmp = new Map();
  pts.forEach((p) => { const k = Math.round(p.x); if (!byAmp.has(k)) byAmp.set(k, []); byAmp.get(k).push(p.y); });
  const line = [...byAmp.entries()].sort((a, b) => a[0] - b[0]);
  g.strokeStyle = C.ink;
  g.lineWidth = 1;
  g.beginPath();
  line.forEach(([x, arr], i) => { const yy = Y(arr.reduce((a, b) => a + b, 0) / arr.length); if (i) g.lineTo(X(x), yy); else g.moveTo(X(x), yy); });
  g.stroke();
  pts.forEach((p) => {
    const cur = ctx.current && p.s.number === ctx.current.number;
    const px = Math.round(X(p.x)), py = Math.round(Y(p.y));
    g.fillStyle = cur ? C.blue : C.ink;
    g.fillRect(px - (cur ? 5 : 3), py - (cur ? 5 : 3), cur ? 11 : 7, cur ? 11 : 7);
    if (!cur) { g.fillStyle = C.paper; g.fillRect(px - 1, py - 1, 3, 3); }
  });

  canvas.onclick = (e) => {
    const b = canvas.getBoundingClientRect();
    const mx = e.clientX - b.left, my = e.clientY - b.top;
    let best = null, bd = 400;
    pts.forEach((p) => { const d = (X(p.x) - mx) ** 2 + (Y(p.y) - my) ** 2; if (d < bd) { bd = d; best = p; } });
    if (best) selectSweep(best.s.number);
  };
  const rheo = pts.filter((p) => p.y > 0).sort((a, b) => a.x - b.x)[0];
  const maxP = pts.reduce((a, b) => (b.y > a.y ? b : a));
  side.innerHTML = `
    <div style="display:grid;gap:10px">
      <div><span class="muted">First step that fired</span><br><b class="num">${rheo ? `${fmt(rheo.x, 0)} pA` : "none"}</b></div>
      <div><span class="muted">Highest rate</span><br><b class="num">${fmt(maxP.y, 1)} Hz at ${fmt(maxP.x, 0)} pA</b></div>
      <p class="muted" style="margin:0">Rates here use the spike counts Allen computed for each sweep, so they are available before any recording is downloaded. <a href="#/guide/fi-curve">About F–I curves</a></p>
    </div>`;
}

function dlSpikes() {
  const st = ctx.stats;
  const lines = ["spike,time_s,isi_ms,instantaneous_rate_hz"];
  st.spikes.forEach((t, i) => lines.push([i + 1, t.toFixed(6), i ? (st.isi[i - 1] * 1000).toFixed(3) : "", i ? st.ifr[i - 1].toFixed(3) : ""].join(",")));
  download(`cell${ctx.cell.id}_sweep${ctx.current.number}_spikes.csv`, lines.join("\n"), "text/csv");
}

function dlSweep() {
  const d = ctx.data;
  const n = d.response.length;
  const parts = ["time_s,membrane_potential_mV,current_pA\n"];
  const chunk = [];
  for (let i = 0; i < n; i++) {
    chunk.push(`${(i / d.rate).toFixed(6)},${d.response[i].toFixed(3)},${d.stimulus[i].toFixed(2)}`);
    if (chunk.length === 50000) { parts.push(chunk.join("\n") + "\n"); chunk.length = 0; }
  }
  parts.push(chunk.join("\n"));
  const url = URL.createObjectURL(new Blob(parts, { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `cell${ctx.cell.id}_sweep${ctx.current.number}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  status(`Saved ${n.toLocaleString()} samples`, "ok");
}
