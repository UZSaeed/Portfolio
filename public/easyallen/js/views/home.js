import { getCells } from "../api.js";
import { lessonSweep } from "../lesson-data.js";
import { C, FONT, fitCanvas, dotted } from "../plot.js";
import { h, status } from "../util.js";

export async function render(main) {
  main.appendChild(h(`
    <div>
      <section class="hero">
        <div class="hero-inner">
          <div>
            <h1>Explore real neuron recordings</h1>
            <p class="lede">Browse thousands of patch-clamp recordings from the Allen Cell Types Database, then plot and measure them right in your browser.</p>
            <div class="hero-actions">
              <a class="btn primary" href="#/lab">Start the firing patterns lab</a>
              <a class="btn ghost" href="#/cells">Browse cells</a>
            </div>
            <p class="hero-note">Doing the class assignment? The lab is the button above; everything else is here to explore afterwards.</p>
          </div>
          <figure class="hero-scope" style="margin:0">
            <canvas id="hero-canvas" role="img" aria-label="Membrane potential of a fast-spiking interneuron firing during a current step"></canvas>
            <figcaption><span><b>Live trace:</b> <span id="hero-cap">fast-spiking interneuron, mouse visual cortex</span></span><a href="#/cell/469801138?sweep=53">Open this cell</a></figcaption>
          </figure>
        </div>
      </section>

      <section class="doors" aria-label="Start here">
        <a class="door feature" href="#/lab">
          <span data-sprite="pipette" data-scale="3"></span>
          <span class="door-eyebrow">Class assignment</span>
          <h2>Firing patterns lab</h2>
          <p>Pyramidal versus fast-spiking neurons, spike-frequency adaptation, and what causes it. Two recordings, side by side.</p>
          <span class="door-go">Start the lab</span>
        </a>
        <a class="door" href="#/cells">
          <span data-sprite="neuron" data-scale="3"></span>
          <h2>Find a cell</h2>
          <p>Filter by species, brain region, layer, and cell class. Every row is a neuron someone actually recorded.</p>
          <span class="door-go">Browse cells</span>
        </a>
        <a class="door" href="#/compare">
          <span data-sprite="spiny" data-scale="6"></span>
          <h2>Compare cell types</h2>
          <p>Plot any two measurements against each other and see how excitatory and inhibitory cells separate.</p>
          <span class="door-go">Open compare</span>
        </a>
      </section>

      <section class="facts">
        <div>
          <h3>How a recording works</h3>
          <ol>
            <li>A glass pipette seals onto one neuron in a slice of brain tissue (whole-cell patch clamp).</li>
            <li>The rig injects a current step, usually 1 second long, at many different strengths.</li>
            <li>It records the membrane potential. Spikes appear when the voltage crosses threshold.</li>
            <li>Each step is one <a href="#/guide/sweep">sweep</a>. EasyAllen loads only the sweep you pick.</li>
          </ol>
        </div>
        <div>
          <h3>In the database right now</h3>
          <div class="stat-row" id="home-stats">
            <div><b class="num">…</b>cells</div>
            <div><b class="num">…</b>mouse</div>
            <div><b class="num">…</b>human</div>
          </div>
          <p class="muted" style="margin-top:10px;font-size:12px">Counts come live from the Allen Brain Map API.</p>
        </div>
      </section>
    </div>`));

  getCells().then((cells) => {
    const s = main.querySelectorAll("#home-stats b");
    if (!s.length) return;
    s[0].textContent = cells.length.toLocaleString();
    s[1].textContent = cells.filter((c) => c.species === "Mouse").length.toLocaleString();
    s[2].textContent = cells.filter((c) => c.species === "Human").length.toLocaleString();
    status(`Connected to the Allen Cell Types Database: ${cells.length.toLocaleString()} cells`, "ok");
  }).catch(() => status("Could not reach the Allen API. Browsing needs an internet connection.", "error"));

  return heroTrace(main.querySelector("#hero-canvas"));
}

// A slowly scrolling scope view of the bundled fast-spiking sweep.
function heroTrace(canvas) {
  let raf = 0;
  let stopped = false;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  lessonSweep("fast-spiking").then((d) => {
    if (stopped) return;
    const win = 0.16; // seconds visible
    const a0 = 1.0, a1 = 2.05;
    let t = a0;
    let last = performance.now();
    const frame = (now) => {
      if (stopped) return;
      t += ((now - last) / 1000) * 0.012; // 0.012 s of recording per second: ~75 s for one pass
      last = now;
      if (t > a1 - win) t = a0;
      draw(canvas, d, still ? 1.2 : t, win);
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }).catch(() => {});
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

function draw(canvas, d, t, win) {
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, w, h);
  for (let y = 20; y < h; y += 40) dotted(ctx, 0, y, w, y, C.dark);
  for (let x = 0; x < w; x += 60) dotted(ctx, x, 0, x, h, C.dark);
  const lo = -82, hi = 32;
  const yOf = (v) => h - 12 - ((v - lo) / (hi - lo)) * (h - 24);
  const i0 = Math.floor((t - d.t0) * d.rate);
  const n = Math.floor(win * d.rate);
  ctx.fillStyle = C.paper;
  let py = null;
  for (let px = 0; px < w; px++) {
    const a = i0 + Math.floor((px / w) * n), b = i0 + Math.floor(((px + 1) / w) * n) + 1;
    let mn = Infinity, mx = -Infinity;
    for (let i = a; i < b && i < d.response.length; i++) { const v = d.response[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    if (!isFinite(mn)) continue;
    let y0 = yOf(mx), y1 = yOf(mn);
    if (py !== null) { y0 = Math.min(y0, py[0]); y1 = Math.max(y1, py[1]); }
    ctx.fillRect(px, Math.floor(y0), 2, Math.max(2, Math.ceil(y1 - y0)));
    py = [yOf(mx), yOf(mn)];
  }
  // threshold marker
  const ty = Math.round(yOf(-20));
  ctx.fillStyle = C.cyan;
  for (let x = 0; x < w; x += 8) ctx.fillRect(x, ty, 4, 1);
  ctx.font = `700 11px ${FONT}`;
  ctx.fillStyle = C.ink;
  ctx.fillRect(8, 8, 124, 18);
  ctx.fillStyle = C.paper;
  ctx.textBaseline = "middle";
  ctx.fillText(`t = ${t.toFixed(3)} s`, 12, 17);
  ctx.fillStyle = C.ink;
  ctx.fillRect(w - 136, ty - 18, 128, 16);
  ctx.fillStyle = C.cyan;
  ctx.fillText("−20 mV threshold", w - 130, ty - 10);
}
