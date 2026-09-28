import { getCells, DENDRITES, FAMILY_LIST, FEATURE, fmt } from "../api.js";
import { spriteSVG } from "../pixel.js";
import { h, esc, status, setQuery, download } from "../util.js";

const PAGE = 50;
const LAYERS = ["1", "2/3", "2", "3", "4", "5", "6a", "6b", "6"];
const COLUMNS = [
  { key: "id", label: "Cell", get: (c) => c.id },
  { key: "species", label: "Species", get: (c) => c.species },
  { key: "region", label: "Region", get: (c) => c.region },
  { key: "layer", label: "Layer", get: (c) => c.layer },
  { key: "dendrite", label: "Dendrites", get: (c) => c.dendrite },
  { key: "family", label: "Class (Cre line)", get: (c) => familyLabel(c) },
  { key: "vrest", label: "Rest mV", num: true, digits: 1 },
  { key: "ri", label: "R in MΩ", num: true, digits: 0 },
  { key: "rheobase", label: "Rheobase pA", num: true, digits: 0 },
  { key: "rate", label: "Rate Hz", num: true, digits: 1 },
  { key: "updown", label: "Up/down", num: true, digits: 2 },
];

const familyLabel = (c) => FAMILY_LIST.find((f) => f.key === c.family)?.label || "";
const list = (s) => (s ? s.split(",") : []);

let state = null;
let all = [];
let root = null;

export async function render(main, { query }) {
  root = main;
  state = fromQuery(query);
  main.appendChild(h(`
    <div class="browser">
      <aside class="rail" aria-label="Filters">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <h2>Filters</h2>
          <button class="btn small ghost" type="button" data-act="clear">Clear all</button>
        </div>
        <div id="filters"><div class="loading-line indeterminate"><i></i></div></div>
      </aside>
      <section class="results">
        <div class="results-bar">
          <span class="count num" id="count">Loading cells…</span>
          <label class="search">
            <span class="hidden">Search cells</span>
            <input type="search" data-search placeholder="Search ID, region, or Cre line" value="${esc(state.q)}" aria-label="Search cells">
            <span class="kbd" aria-hidden="true">/</span>
          </label>
          <button class="btn small ghost" type="button" data-act="csv">Download table (CSV)</button>
        </div>
        <div class="table-scroll" id="table"></div>
        <div class="pager" id="pager"></div>
      </section>
    </div>`));

  main.querySelector("[data-search]").addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    state.page = 0;
    update();
  });
  main.querySelector("[data-act=clear]").addEventListener("click", () => {
    state = fromQuery({});
    main.querySelector("[data-search]").value = "";
    update(true);
  });
  main.querySelector("[data-act=csv]").addEventListener("click", exportCsv);

  status("Loading the cell list from the Allen API…", "busy");
  try {
    all = await getCells();
  } catch (err) {
    main.querySelector("#table").innerHTML = `<div class="wrap"><div class="error-box"><div><b>Could not load the cell list.</b><p>${esc(err.message)} Check your internet connection, then reload the page.</p></div></div></div>`;
    main.querySelector("#count").textContent = "Offline";
    status("Could not reach the Allen API.", "error");
    return () => { root = null; };
  }
  status(`Connected: ${all.length.toLocaleString()} cells in the Allen Cell Types Database`, "ok");
  update(true);
  return () => { root = null; };
}

export function onQuery(query) {
  if (!root) return;
  state = fromQuery(query);
  update(true);
}

function fromQuery(q) {
  return {
    q: q.q || "",
    species: q.species || "",
    dendrite: list(q.dendrite),
    family: list(q.family),
    layer: list(q.layer),
    region: q.region || "",
    morph: q.morph === "1",
    sort: q.sort || "id",
    dir: q.dir === "desc" ? "desc" : "asc",
    page: Number(q.page || 0),
  };
}

function toQuery() {
  return {
    q: state.q, species: state.species, dendrite: state.dendrite.join(","), family: state.family.join(","),
    layer: state.layer.join(","), region: state.region, morph: state.morph ? "1" : "",
    sort: state.sort === "id" ? "" : state.sort, dir: state.dir === "asc" ? "" : state.dir,
    page: state.page ? String(state.page) : "",
  };
}

// Apply all filters except `skip`, so each filter group can show live counts.
function filtered(skip) {
  const q = state.q.toLowerCase();
  return all.filter((c) => {
    if (skip !== "species" && state.species && c.species !== state.species) return false;
    if (skip !== "dendrite" && state.dendrite.length && !state.dendrite.includes(c.dendrite)) return false;
    if (skip !== "family" && state.family.length && !state.family.includes(c.family)) return false;
    if (skip !== "layer" && state.layer.length && !state.layer.includes(c.layer)) return false;
    if (skip !== "region" && state.region && c.regionCode !== state.region) return false;
    if (skip !== "morph" && state.morph && !c.hasMorph) return false;
    if (q) {
      const hay = `${c.id} ${c.name} ${c.region} ${c.regionCode} ${c.structure} ${c.line} ${familyLabel(c)} ${c.species}`.toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

function countBy(rows, fn) {
  const m = new Map();
  rows.forEach((r) => m.set(fn(r), (m.get(fn(r)) || 0) + 1));
  return m;
}

function renderFilters() {
  const bySpecies = countBy(filtered("species"), (c) => c.species);
  const byDend = countBy(filtered("dendrite"), (c) => c.dendrite);
  const byFam = countBy(filtered("family"), (c) => c.family);
  const byLayer = countBy(filtered("layer"), (c) => c.layer);
  const byRegion = countBy(filtered("region"), (c) => c.regionCode);
  const morphN = filtered("morph").filter((c) => c.hasMorph).length;
  const regions = [...new Set(all.map((c) => c.regionCode))]
    .map((code) => ({ code, name: all.find((c) => c.regionCode === code).region, n: byRegion.get(code) || 0 }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const speciesTotal = [...bySpecies.values()].reduce((a, b) => a + b, 0);

  const el = root.querySelector("#filters");
  el.innerHTML = `
    <div style="display:grid;gap:18px">
      <fieldset>
        <legend>Species</legend>
        ${[["", "All", speciesTotal], ["Mouse", "Mouse", bySpecies.get("Mouse") || 0], ["Human", "Human", bySpecies.get("Human") || 0]].map(([v, l, n]) => `
          <label class="check"><input type="radio" name="species" value="${v}" ${state.species === v ? "checked" : ""}> ${l}<small>${n}</small></label>`).join("")}
      </fieldset>
      <fieldset>
        <legend>Dendrite type</legend>
        <p class="hint">A quick proxy for excitatory vs. inhibitory. <a href="#/guide/dendrite-type">What is this?</a></p>
        ${Object.entries(DENDRITES).map(([k, d]) => `
          <label class="check" title="${esc(d.blurb)}"><input type="checkbox" name="dendrite" value="${k}" ${state.dendrite.includes(k) ? "checked" : ""}> ${d.label}<small>${byDend.get(k) || 0}</small></label>`).join("")}
      </fieldset>
      <fieldset>
        <legend>Cell class</legend>
        <p class="hint">From the mouse Cre line that labeled the cell. <a href="#/guide/cre-line">What is this?</a></p>
        ${FAMILY_LIST.map((f) => `
          <label class="check" title="${esc(f.blurb)}"><input type="checkbox" name="family" value="${f.key}" ${state.family.includes(f.key) ? "checked" : ""}> ${f.label}<small>${byFam.get(f.key) || 0}</small></label>`).join("")}
      </fieldset>
      <fieldset>
        <legend>Cortical layer</legend>
        <div class="layer-grid">
          ${LAYERS.filter((l) => all.some((c) => c.layer === l)).map((l) => `
            <label title="${byLayer.get(l) || 0} cells"><input type="checkbox" name="layer" value="${l}" ${state.layer.includes(l) ? "checked" : ""}><span>L${l}</span></label>`).join("")}
        </div>
      </fieldset>
      <label class="field">
        <span>Brain region</span>
        <select name="region">
          <option value="">All regions</option>
          ${regions.map((r) => `<option value="${esc(r.code)}" ${state.region === r.code ? "selected" : ""}>${esc(r.name)} (${r.n})</option>`).join("")}
        </select>
      </label>
      <label class="check"><input type="checkbox" name="morph" ${state.morph ? "checked" : ""}> Has a 3D reconstruction<small>${morphN}</small></label>
    </div>`;

  el.querySelectorAll("input, select").forEach((inp) => inp.addEventListener("change", () => {
    const n = inp.name;
    if (n === "species") state.species = inp.value;
    else if (n === "region") state.region = inp.value;
    else if (n === "morph") state.morph = inp.checked;
    else state[n] = [...el.querySelectorAll(`input[name="${n}"]:checked`)].map((x) => x.value);
    state.page = 0;
    update(true);
  }));
}

function sorted(rows) {
  const col = COLUMNS.find((c) => c.key === state.sort) || COLUMNS[0];
  const get = col.num ? (c) => c.f[col.key] : col.get;
  const dir = state.dir === "desc" ? -1 : 1;
  return rows.slice().sort((a, b) => {
    const x = get(a), y = get(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x < y ? -1 : x > y ? 1 : 0) * dir;
  });
}

function update(refreshFilters = false) {
  if (!all.length) return;
  setQuery(toQuery());
  if (refreshFilters) renderFilters();
  else requestAnimationFrame(renderFilters);
  const rows = sorted(filtered());
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  state.page = Math.min(state.page, pages - 1);
  const slice = rows.slice(state.page * PAGE, state.page * PAGE + PAGE);
  root.querySelector("#count").textContent = `${rows.length.toLocaleString()} of ${all.length.toLocaleString()} cells`;

  const table = root.querySelector("#table");
  if (!rows.length) {
    table.innerHTML = `<div class="empty"><p>No cells match these filters.</p><button class="btn small ghost" type="button" data-act="clear2">Clear all filters</button></div>`;
    table.querySelector("[data-act=clear2]").addEventListener("click", () => root.querySelector("[data-act=clear]").click());
    root.querySelector("#pager").innerHTML = "";
    return;
  }
  table.innerHTML = `
    <table class="grid">
      <thead><tr>${COLUMNS.map((c) => `
        <th class="${c.num ? "r" : ""}" ${state.sort === c.key ? `aria-sort="${state.dir === "asc" ? "ascending" : "descending"}"` : ""}>
          <button type="button" data-sort="${c.key}" ${c.num ? `title="${esc(FEATURE[c.key].label)}: ${esc(FEATURE[c.key].explain)}"` : ""}>${c.label}</button>
        </th>`).join("")}</tr></thead>
      <tbody>${slice.map(row).join("")}</tbody>
    </table>`;
  table.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.sort;
    if (state.sort === k) state.dir = state.dir === "asc" ? "desc" : "asc";
    else { state.sort = k; state.dir = COLUMNS.find((c) => c.key === k).num ? "desc" : "asc"; }
    update();
  }));
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const go = () => { location.hash = `#/cell/${tr.dataset.id}`; };
    tr.addEventListener("click", (e) => { if (e.target.tagName !== "A") go(); });
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });

  root.querySelector("#pager").innerHTML = `
    <button class="btn small ghost" type="button" data-page="-1" ${state.page === 0 ? "disabled" : ""}>Previous</button>
    <span class="num">Page ${state.page + 1} of ${pages}</span>
    <button class="btn small ghost" type="button" data-page="1" ${state.page >= pages - 1 ? "disabled" : ""}>Next</button>`;
  root.querySelectorAll("[data-page]").forEach((b) => b.addEventListener("click", () => {
    state.page += Number(b.dataset.page);
    update();
    root.querySelector(".results").scrollIntoView({ block: "start" });
  }));
}

function row(c) {
  const dend = c.dendrite ? `<span class="dend">${spriteSVG(c.dendrite === "spiny" ? "spiny" : "aspiny", 2)}${esc(DENDRITES[c.dendrite]?.label || c.dendrite)}</span>` : "—";
  const cls = c.family === "none" ? `<span class="muted">—</span>` : `${esc(familyLabel(c))}${c.line ? ` <span class="muted">${esc(c.line.split("|")[0].split("-")[0])}</span>` : ""}`;
  return `<tr tabindex="0" data-id="${c.id}">
    <td><a href="#/cell/${c.id}">${c.id}</a></td>
    <td>${c.species}</td>
    <td title="${esc(c.structure)}">${esc(c.region)}</td>
    <td>${c.layer ? `L${esc(c.layer)}` : "—"}</td>
    <td>${dend}</td>
    <td>${cls}</td>
    ${COLUMNS.filter((k) => k.num).map((k) => `<td class="r">${fmt(c.f[k.key], k.digits)}</td>`).join("")}
  </tr>`;
}

function exportCsv() {
  const rows = sorted(filtered());
  const head = ["specimen_id", "species", "region", "region_code", "layer", "dendrite_type", "cre_line", "reporter", "class",
    "vrest_mV", "input_resistance_MOhm", "tau_ms", "rheobase_pA", "fi_slope_Hz_per_pA", "avg_rate_Hz", "avg_isi_ms", "adaptation_index", "upstroke_downstroke"];
  const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((c) => [c.id, c.species, q(c.region), c.regionCode, c.layer, c.dendrite, q(c.line), c.reporter || "", q(familyLabel(c)),
    c.f.vrest, c.f.ri, c.f.tau, c.f.rheobase, c.f.fislope, c.f.rate, c.f.isi, c.f.adapt, c.f.updown].map((v) => v ?? "").join(","));
  download("easyallen-cells.csv", [head.join(","), ...lines].join("\n"), "text/csv");
  status(`Downloaded ${rows.length} cells as CSV`, "ok");
}
