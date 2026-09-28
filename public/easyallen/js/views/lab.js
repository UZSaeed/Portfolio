import { lessonSweep } from "../lesson-data.js";
import { detectSpikes, spikeStats, rollingMean, DEFAULT_THRESHOLD } from "../analysis.js";
import { Scope, C } from "../plot.js";
import { fmt } from "../api.js";
import { h, esc, status, setQuery, download } from "../util.js";

const CELLS = {
  pyramidal: {
    label: "Pyramidal",
    about: "Spiny, excitatory neuron. Human frontal lobe, layer 3.",
    view: [0.95, 2.1],
  },
  "fast-spiking": {
    label: "Fast-spiking",
    about: "Aspiny PV (parvalbumin) interneuron. Mouse primary visual cortex, layer 4.",
    view: [0.95, 2.1],
  },
};

let L = null;

export async function render(main, { query }) {
  L = { main, stats: {}, current: null, token: 0 };
  const which = CELLS[query.cell] ? query.cell : "pyramidal";

  main.appendChild(h(`
    <div class="wrap lab-page">
      <header class="lab-head">
        <div>
          <p class="muted" style="margin-bottom:6px;font-size:12px">Neurophysiology lab</p>
          <h1>Firing patterns: pyramidal vs. fast-spiking neurons</h1>
          <p class="lab-lede">Two cortical neurons, the same kind of 1 second current step. Watch how each one fires, then answer the questions on your handout.</p>
        </div>
        <div>
          <ol class="lab-steps">
            <li>Click <b>Pyramidal</b>, then look at the spacing between spikes and the firing-rate plot.</li>
            <li>Click <b>Fast-spiking</b> and compare.</li>
            <li>Read the numbers under the plot and in the comparison table.</li>
          </ol>
          <p style="margin:14px 0 0"><a class="btn small ghost" href="docs/Firing-patterns-lab-handout.docx" download>Download the handout (Word)</a></p>
        </div>
      </header>

      <div class="lab-switch">
        <div class="seg" role="group" aria-label="Choose a neuron">
          ${Object.entries(CELLS).map(([k, c]) => `<button type="button" data-cell="${k}" aria-pressed="false">${c.label}</button>`).join("")}
        </div>
        <span class="muted" style="font-size:12px" id="about"></span>
      </div>

      <section class="panel">
        <div class="scope-tools">
          <div class="seg" role="group" aria-label="Zoom">
            <button type="button" data-z="in">Zoom in</button>
            <button type="button" data-z="out">Out</button>
            <button type="button" data-z="reset">Whole step</button>
          </div>
          <span class="spacer"></span>
          <label class="inline"><input type="checkbox" id="smooth"> Smooth rate (5-point average)</label>
        </div>
        <div class="scope" id="scope"></div>
        <div class="scope-hint"><span>Drag across the plot to zoom</span><span>Double-click to reset</span><span>Hover to read exact values</span></div>
        <div class="readout" id="readout"></div>
        <div class="scope-tools" style="border:0">
          <span class="muted" style="font-size:12px" id="src"></span>
          <span class="spacer"></span>
          <a class="btn small ghost" id="open-cell" href="#/cells">Open this cell in the browser</a>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Comparison</h2><span class="aside">Fills in as you view each neuron</span></div>
        <div class="table-scroll" id="cmp"></div>
        <div class="scope-tools" style="border:0">
          <span class="muted" style="font-size:12px">Copy these numbers onto your handout.</span>
          <span class="spacer"></span>
          <button class="btn small ghost" type="button" id="dl-cmp">Download table (CSV)</button>
        </div>
      </section>
    </div>`));

  const scope = new Scope(main.querySelector("#scope"), [
    { id: "v", label: "Membrane potential", unit: "mV", weight: 3, digits: 1, minSpan: 10 },
    { id: "ifr", label: "Instantaneous firing rate", unit: "Hz", weight: 1.5, kind: "points", digits: 1 },
    { id: "i", label: "Injected current", unit: "pA", weight: 0.8, digits: 0, color: C.light, includeZero: true, minSpan: 20 },
  ], { height: 500, ariaLabel: "Lab recording" });
  L.scope = scope;

  main.querySelectorAll("[data-cell]").forEach((b) => b.addEventListener("click", () => show(b.dataset.cell)));
  main.querySelectorAll("[data-z]").forEach((b) => b.addEventListener("click", () => {
    if (!scope.data) return;
    ({ in: () => scope.zoom(0.5), out: () => scope.zoom(2), reset: () => scope.reset() })[b.dataset.z]();
  }));
  main.querySelector("#smooth").addEventListener("change", () => L.current && analyze(L.current));
  main.querySelector("#dl-cmp").addEventListener("click", exportTable);

  await show(which);
  return () => { scope.destroy(); L = null; };
}

async function show(key) {
  const my = ++L.token;
  const local = L;
  L.current = key;
  setQuery({ cell: key === "pyramidal" ? "" : key });
  L.main.querySelectorAll("[data-cell]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cell === key)));
  L.main.querySelector("#about").textContent = CELLS[key].about;
  status(`Loading the ${CELLS[key].label.toLowerCase()} recording…`, "busy");
  try {
    const d = await lessonSweep(key);
    if (local !== L || my !== L.token) return;
    L.data = d;
    L.scope.setData({
      t0: d.t0, rate: d.rate, series: { v: d.response, i: d.stimulus },
      points: { ifr: { x: [], y: [] } }, window: [1.02, 2.02],
    }, CELLS[key].view);
    analyze(key);
    L.main.querySelector("#src").textContent = `Allen cell ${d.specimen_id}, sweep ${d.sweep}: 1 s current step`;
    L.main.querySelector("#open-cell").href = `#/cell/${d.specimen_id}?sweep=${d.sweep}`;
    status(`Showing the ${CELLS[key].label.toLowerCase()} neuron`, "ok");
  } catch (err) {
    status(err.message, "error");
    L.main.querySelector("#scope").insertAdjacentHTML("beforeend", `<div class="overlay-msg"><div class="box"><b>Could not load the lab recording.</b><span style="font-size:12px">${esc(err.message)}</span></div></div>`);
  }
}

function analyze(key) {
  const d = L.data;
  const spikes = detectSpikes(d.response, d.rate, { threshold: DEFAULT_THRESHOLD, t0: d.t0 });
  const st = spikeStats(spikes);
  L.stats[key] = st;
  const smooth = L.main.querySelector("#smooth").checked;
  L.scope.setOverlay({ spikes, threshold: DEFAULT_THRESHOLD, points: { ifr: { x: st.tIfr, y: smooth ? rollingMean(st.ifr, 5) : st.ifr } } });
  const list = (a) => a.map((x) => x.toFixed(1)).join(", ");
  const cells = [
    ["Total spikes", `${st.count}`],
    ["First 3 ISIs", `${list(st.firstIsi)} <small>ms</small>`],
    ["Last 3 ISIs", `${list(st.lastIsi)} <small>ms</small>`],
    ["Adaptation ratio", st.ar != null ? fmt(st.ar, 2) : "—", "mean(last 3 ISIs) ÷ mean(first 3)"],
    ["ISI CV", st.cv != null ? fmt(st.cv, 3) : "—", "std ÷ mean of all ISIs"],
    ["Initial firing rate", `${fmt(st.ifrFirst, 1)} <small>Hz</small>`],
    ["Final firing rate", `${fmt(st.ifrLast, 1)} <small>Hz</small>`],
    ["Step amplitude", `${fmt(d.stimulus.reduce((m, x) => (x > m ? x : m), -Infinity), 0)} <small>pA</small>`],
  ];
  L.main.querySelector("#readout").innerHTML = cells.map(([k, v, sub]) => `<div><span class="k">${k}</span><span class="v">${v}</span>${sub ? `<span class="sub">${sub}</span>` : ""}</div>`).join("");
  renderComparison();
}

function comparisonRows() {
  const p = L.stats.pyramidal, f = L.stats["fast-spiking"];
  const list = (s, k) => (s ? s[k].map((x) => x.toFixed(1)).join(", ") : "—");
  return [
    ["Total spikes", p ? p.count : "—", f ? f.count : "—"],
    ["First 3 ISIs (ms)", list(p, "firstIsi"), list(f, "firstIsi")],
    ["Last 3 ISIs (ms)", list(p, "lastIsi"), list(f, "lastIsi")],
    ["Adaptation ratio", p ? fmt(p.ar, 2) : "—", f ? fmt(f.ar, 2) : "—"],
    ["ISI CV", p ? fmt(p.cv, 3) : "—", f ? fmt(f.cv, 3) : "—"],
    ["Initial firing rate (Hz)", p ? fmt(p.ifrFirst, 1) : "—", f ? fmt(f.ifrFirst, 1) : "—"],
    ["Final firing rate (Hz)", p ? fmt(p.ifrLast, 1) : "—", f ? fmt(f.ifrLast, 1) : "—"],
  ];
}

function renderComparison() {
  L.main.querySelector("#cmp").innerHTML = `
    <table class="grid cmp-table">
      <thead><tr><th>Measure</th><th class="r">Pyramidal</th><th class="r">Fast-spiking</th></tr></thead>
      <tbody>${comparisonRows().map((r) => `<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td></tr>`).join("")}</tbody>
    </table>`;
}

function exportTable() {
  const q = (s) => `"${String(s).replace(/−/g, "-")}"`;
  const lines = ["Measure,Pyramidal,Fast-spiking", ...comparisonRows().map((r) => r.map(q).join(","))];
  download("firing-patterns-comparison.csv", lines.join("\n"), "text/csv");
  status("Comparison table downloaded", "ok");
}
