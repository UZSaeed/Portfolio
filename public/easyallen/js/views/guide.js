import { lessonSweep } from "../lesson-data.js";
import { detectSpikes } from "../analysis.js";
import { C, FONT, fitCanvas, dotted } from "../plot.js";
import { h, esc } from "../util.js";

const TERMS = [
  ["patch-clamp", "Whole-cell patch clamp", "", "A glass pipette seals onto a single neuron and breaks into it, so the rig can inject current and record the voltage across the membrane. Every recording in the Allen Cell Types Database was made this way, in slices of mouse or human cortex."],
  ["sweep", "Sweep", "", "One trial of a recording: a single stimulus and the cell's response. A cell usually has 40 to 100 sweeps with different stimuli and amplitudes."],
  ["long-square", "Long square", "stimulus", "A 1 second step of constant current. Allen runs it at many amplitudes, from negative (hyperpolarizing) to well above threshold. This is the best stimulus for studying firing patterns."],
  ["resting-potential", "Resting membrane potential", "mV", "The voltage inside the cell relative to outside when no current is injected. Typically −65 to −80 mV, set mostly by K⁺ leak channels."],
  ["action-potential", "Action potential (spike)", "", "A fast, all-or-none rise and fall of the membrane potential, driven by voltage-gated Na⁺ channels opening and then K⁺ channels repolarizing the cell."],
  ["threshold", "Spike threshold", "mV", "EasyAllen counts a spike each time the voltage rises through a fixed level: −20 mV by default, the same rule as the original course notebook. Real spike initiation starts lower (around −50 mV), but −20 mV reliably catches every spike without false alarms."],
  ["isi", "Inter-spike interval (ISI)", "ms", "The time between two consecutive spikes. A spike train with n spikes has n − 1 ISIs."],
  ["ifr", "Instantaneous firing rate (IFR)", "Hz", "1 ÷ ISI, plotted at the midpoint between the two spikes. It shows how the firing rate changes from moment to moment during the step."],
  ["adaptation-ratio", "Adaptation ratio", "", "Mean of the last 3 ISIs divided by the mean of the first 3. Above 1 means the cell slowed down during the step (spike-frequency adaptation). About 1 means steady firing. EasyAllen computes this from the sweep you are viewing."],
  ["cv", "ISI coefficient of variation (CV)", "", "Standard deviation of all ISIs divided by their mean. Low values (under ~0.15) mean very regular, clock-like firing; high values mean irregular firing or large changes in rate."],
  ["adaptation-index", "Adaptation index (Allen)", "", "Allen's own adaptation measure, averaged over consecutive ISI pairs: (ISIₙ₊₁ − ISIₙ) ÷ (ISIₙ₊₁ + ISIₙ). Near 0 means no adaptation; positive means slowing. It is on a different scale from the adaptation ratio, so compare like with like."],
  ["firing-rate", "Average firing rate", "Hz", "Allen's value: the mean spike rate on a strong long square sweep."],
  ["rheobase", "Rheobase", "pA", "The smallest long square current that made the cell fire at least one spike. Low rheobase means an easily excited cell."],
  ["fi-curve", "F–I curve", "Hz vs. pA", "Firing rate plotted against injected current. The slope says how strongly the cell turns more input into more output. Fast-spiking cells usually have steep F–I curves that reach very high rates."],
  ["input-resistance", "Input resistance", "MΩ", "How much the membrane voltage changes per unit of injected current (Ohm's law: R = ΔV ÷ I). Measured on small negative steps. Smaller cells and cells with fewer open channels have higher input resistance."],
  ["time-constant", "Membrane time constant (τ)", "ms", "How long the membrane takes to charge to about 63% of its final voltage after a step. Equal to resistance × capacitance."],
  ["upstroke-downstroke", "Upstroke/downstroke ratio", "", "Peak rate of rise of a spike divided by its peak rate of fall. Fast-spiking PV cells repolarize very quickly (Kv3 channels), so their ratio is low, often under 2. Pyramidal cells are usually 3 or higher."],
  ["trough", "Fast trough", "mV", "The lowest voltage right after a spike (the fast afterhyperpolarization)."],
  ["dendrite-type", "Dendrite type", "", "Allen's classification from looking at the filled cell. Spiny cells (covered in dendritic spines) are nearly all excitatory: pyramidal and spiny stellate cells. Aspiny and sparsely spiny cells are nearly all inhibitory interneurons."],
  ["cre-line", "Cre line", "", "A transgenic mouse in which one genetically defined cell class (for example, Pvalb-expressing cells) makes a fluorescent reporter. Recording from glowing cells targets that class. “Reporter positive” means the recorded cell was labeled. Human cells have no Cre line."],
];

export function render(main, { params }) {
  main.appendChild(h(`
    <div class="guide">
      <div>
        <h1>Guide</h1>
        <p style="margin-top:10px">What the plots show, what each number means, and where the data comes from.</p>
      </div>

      <section>
        <h2>Reading a recording</h2>
        <div class="diagram"><canvas id="diagram" role="img" aria-label="Annotated membrane potential trace showing baseline, threshold, spikes, and an inter-spike interval"></canvas></div>
        <ol style="margin-top:12px;padding-left:20px">
          <li><b>Top track, membrane potential.</b> White is the voltage. The dashed cyan line is the spike threshold; each cyan tick at the top marks a counted spike.</li>
          <li><b>Middle track, instantaneous firing rate.</b> One square per pair of neighboring spikes. A downward trend means the cell is slowing (adapting).</li>
          <li><b>Bottom track, injected current.</b> The stimulus the rig delivered. For a long square it is a flat 1 s step.</li>
        </ol>
      </section>

      <section>
        <h2>Terms</h2>
        <div class="terms">
          ${TERMS.map(([id, name, unit, text]) => `<div class="term" id="term-${id}" tabindex="-1"><h3>${esc(name)}${unit ? ` <small>${esc(unit)}</small>` : ""}</h3><p>${esc(text)}</p></div>`).join("")}
        </div>
      </section>

      <section>
        <h2>Where the numbers come from</h2>
        <ul style="padding-left:20px">
          <li><b>At a glance</b> values on a cell page (resting potential, rheobase, and so on) are Allen's own measurements, loaded from the Allen Brain Map API.</li>
          <li><b>Recording</b> values (spikes, ISIs, adaptation ratio, CV) are computed by EasyAllen in your browser from the raw trace, so they change if you change the threshold.</li>
          <li>Raw traces are read straight from Allen's NWB files. EasyAllen downloads only the parts it needs for one sweep, typically under 1 MB.</li>
        </ul>
      </section>

      <section>
        <h2>For instructors</h2>
        <p>Every view has a shareable link. For example:</p>
        <ul style="padding-left:20px">
          <li><a href="#/cells?family=pv&species=Mouse">#/cells?family=pv&amp;species=Mouse</a>: mouse PV interneurons</li>
          <li><a href="#/cells?dendrite=spiny&layer=5">#/cells?dendrite=spiny&amp;layer=5</a>: spiny layer 5 cells</li>
          <li><a href="#/cell/469801138?sweep=53">#/cell/469801138?sweep=53</a>: one specific sweep</li>
          <li><a href="#/compare?x=updown&y=rate&by=family">#/compare?x=updown&amp;y=rate&amp;by=family</a>: a preset comparison</li>
        </ul>
      </section>

      <section>
        <h2>Data and credit</h2>
        <p>All data comes from the Allen Cell Types Database, © 2015 Allen Institute for Brain Science, available from <a href="https://celltypes.brain-map.org/" target="_blank" rel="noopener">celltypes.brain-map.org</a>. Please follow Allen's <a href="https://alleninstitute.org/citation-policy/" target="_blank" rel="noopener">citation policy</a> when you use it in reports. EasyAllen is an independent teaching tool and is not made by the Allen Institute.</p>
      </section>
    </div>`));

  const target = params[0] && main.querySelector(`#term-${params[0]}`);
  if (target) {
    target.style.background = "var(--ink)";
    target.style.color = "var(--paper)";
    requestAnimationFrame(() => { target.scrollIntoView({ block: "center" }); target.focus({ preventScroll: true }); });
  }

  const cv = main.querySelector("#diagram");
  let data = null;
  const draw = () => data && diagram(cv, data);
  lessonSweep("pyramidal").then((d) => { data = d; draw(); }).catch(() => {});
  window.addEventListener("resize", draw);
  return () => window.removeEventListener("resize", draw);
}

function diagram(cv, d) {
  const { ctx: g, w, h: H } = fitCanvas(cv);
  g.fillStyle = C.ink;
  g.fillRect(0, 0, w, H);
  const a = 0.97, b = 1.16;
  const lo = -80, hi = 50;
  const X = (t) => 20 + ((t - a) / (b - a)) * (w - 40);
  const Y = (v) => H - 20 - ((v - lo) / (hi - lo)) * (H - 40);
  for (let v = -80; v <= 40; v += 20) dotted(g, 0, Y(v), w, Y(v), C.dark);
  g.fillStyle = C.paper;
  let prev = null;
  for (let px = 0; px < w - 40; px++) {
    const t0 = a + (px / (w - 40)) * (b - a), t1 = a + ((px + 1) / (w - 40)) * (b - a);
    let mn = Infinity, mx = -Infinity;
    for (let i = Math.floor((t0 - d.t0) * d.rate); i <= Math.floor((t1 - d.t0) * d.rate); i++) { const v = d.response[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    let y0 = Y(mx), y1 = Y(mn);
    if (prev) { y0 = Math.min(y0, prev[0]); y1 = Math.max(y1, prev[1]); }
    g.fillRect(20 + px, Math.floor(y0), 2, Math.max(2, Math.ceil(y1 - y0)));
    prev = [Y(mx), Y(mn)];
  }
  const ty = Math.round(Y(-20));
  g.fillStyle = C.cyan;
  for (let x = 0; x < w; x += 8) g.fillRect(x, ty, 4, 1);
  const spikes = detectSpikes(d.response, d.rate, { t0: d.t0, from: a, to: b });
  spikes.forEach((s) => g.fillRect(Math.round(X(s)) - 1, 8, 3, 7));

  g.font = `700 11px ${FONT}`;
  g.textBaseline = "middle";
  const tag = (text, x, y, color = C.paper) => {
    const tw = g.measureText(text).width + 10;
    g.fillStyle = C.ink;
    g.fillRect(x, y - 9, tw, 18);
    g.fillStyle = color;
    g.fillText(text, x + 5, y);
  };
  tag("baseline (rest)", 26, Y(-60));
  tag("threshold −20 mV", w - 150, ty - 12, C.cyan);
  if (spikes.length >= 3) {
    const s1 = X(spikes[1]), s2 = X(spikes[2]);
    const y = Y(44);
    g.fillStyle = C.cyan;
    g.fillRect(s1, y, s2 - s1, 2);
    g.fillRect(s1, y - 5, 2, 12);
    g.fillRect(s2 - 2, y - 5, 2, 12);
    tag(`ISI ${((spikes[2] - spikes[1]) * 1000).toFixed(1)} ms`, s1 + (s2 - s1) / 2 - 42, y - 16, C.cyan);
    tag("spike", X(spikes[0]) + 8, Y(30));
  }
  tag("step starts", X(1.02) - 40, H - 12, C.light);
}
