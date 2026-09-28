import { getCells, FEATURES, FEATURE, FAMILY_LIST, DENDRITES, fmt } from "../api.js";
import { C, FONT, fitCanvas, niceTicks, tickLabel, dotted } from "../plot.js";
import { h, esc, status, setQuery } from "../util.js";

// Group markers: 2-bit shapes instead of a rainbow palette.
const STYLES = [
  { shape: "square", fill: C.ink },
  { shape: "square", fill: C.blue },
  { shape: "hollow", fill: C.ink },
  { shape: "cross", fill: C.ink },
  { shape: "hollow", fill: C.blue },
  { shape: "square", fill: C.light },
  { shape: "cross", fill: C.blue },
];

const GROUPINGS = {
  dendrite: { label: "Dendrite type", groups: Object.entries(DENDRITES).map(([k, d]) => ({ key: k, label: d.label })), of: (c) => c.dendrite },
  family: { label: "Cell class (Cre line)", groups: FAMILY_LIST.map((f) => ({ key: f.key, label: f.label })), of: (c) => c.family },
  species: { label: "Species", groups: [{ key: "Mouse", label: "Mouse" }, { key: "Human", label: "Human" }], of: (c) => c.species },
};

const LOG_OK = new Set(["ri", "tau", "rate", "isi", "rheobase"]);
let S = null;

export async function render(main, { query }) {
  S = {
    x: FEATURE[query.x] ? query.x : "updown",
    y: FEATURE[query.y] ? query.y : "rate",
    by: GROUPINGS[query.by] ? query.by : "dendrite",
    species: query.species || "",
    logx: query.logx === "1",
    logy: query.logy === "1",
    hidden: new Set((query.hide || "").split(",").filter(Boolean)),
    highlight: Number(query.highlight) || null,
    main,
    all: [],
    pts: [],
  };
  const opts = (sel) => FEATURES.map((f) => `<option value="${f.key}" ${sel === f.key ? "selected" : ""}>${esc(f.label)}${f.unit ? ` (${f.unit})` : ""}</option>`).join("");
  main.appendChild(h(`
    <div class="compare">
      <aside class="rail" aria-label="Plot settings">
        <h2>Plot settings</h2>
        <label class="field"><span>Horizontal axis</span><select id="cx">${opts(S.x)}</select></label>
        <label class="check"><input type="checkbox" id="logx" ${S.logx ? "checked" : ""}> Log scale</label>
        <label class="field"><span>Vertical axis</span><select id="cy">${opts(S.y)}</select></label>
        <label class="check"><input type="checkbox" id="logy" ${S.logy ? "checked" : ""}> Log scale</label>
        <label class="field"><span>Group cells by</span><select id="by">${Object.entries(GROUPINGS).map(([k, g]) => `<option value="${k}" ${S.by === k ? "selected" : ""}>${g.label}</option>`).join("")}</select></label>
        <fieldset>
          <legend>Species</legend>
          ${[["", "All"], ["Mouse", "Mouse"], ["Human", "Human"]].map(([v, l]) => `<label class="check"><input type="radio" name="sp" value="${v}" ${S.species === v ? "checked" : ""}> ${l}</label>`).join("")}
        </fieldset>
        <div class="note plain" style="font-size:12px">
          <b>Try this:</b> put <i>Upstroke/downstroke</i> on one axis and <i>Average firing rate</i> on the other, grouped by cell class. PV cells sit apart from everything else.
        </div>
      </aside>
      <section class="plot-area">
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;justify-content:space-between">
          <h1 style="font-size:var(--fs-l)" id="ctitle"></h1>
          <span class="muted" style="font-size:12px" id="cnote"></span>
        </div>
        <div class="legend" id="legend" role="group" aria-label="Groups; click to show or hide"></div>
        <div class="scatter" id="scatter">
          <canvas id="sc" aria-label="Scatter plot of cells"></canvas>
          <div class="tip hidden" id="tip"></div>
        </div>
        <section class="panel">
          <div class="panel-head"><h2>Group medians</h2><span class="aside">Half the cells in each group are above the median, half below</span></div>
          <div class="table-scroll" id="medians"></div>
        </section>
      </section>
    </div>`));

  const bind = (sel, ev, fn) => main.querySelector(sel).addEventListener(ev, fn);
  bind("#cx", "change", (e) => { S.x = e.target.value; S.logx = false; main.querySelector("#logx").checked = false; draw(); });
  bind("#cy", "change", (e) => { S.y = e.target.value; S.logy = false; main.querySelector("#logy").checked = false; draw(); });
  bind("#logx", "change", (e) => { S.logx = e.target.checked; draw(); });
  bind("#logy", "change", (e) => { S.logy = e.target.checked; draw(); });
  bind("#by", "change", (e) => { S.by = e.target.value; S.hidden.clear(); draw(); });
  main.querySelectorAll("input[name=sp]").forEach((r) => r.addEventListener("change", () => { S.species = r.value; draw(); }));

  const cv = main.querySelector("#sc");
  const tip = main.querySelector("#tip");
  cv.addEventListener("pointermove", (e) => {
    const p = nearest(e);
    if (!p) { tip.classList.add("hidden"); cv.style.cursor = "crosshair"; return; }
    cv.style.cursor = "pointer";
    const c = p.c;
    tip.innerHTML = `<b>Cell ${c.id}</b><br>${esc(c.species)}, ${esc(c.region)}${c.layer ? `, L${esc(c.layer)}` : ""}<br>${esc(FEATURE[S.x].label)}: ${fmt(c.f[S.x], FEATURE[S.x].digits)}<br>${esc(FEATURE[S.y].label)}: ${fmt(c.f[S.y], FEATURE[S.y].digits)}`;
    tip.classList.remove("hidden");
    const box = cv.getBoundingClientRect();
    let left = p.px + 14, top = p.py + 14;
    if (left + 240 > box.width) left = p.px - 250;
    if (top + 90 > box.height) top = p.py - 96;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  });
  cv.addEventListener("pointerleave", () => tip.classList.add("hidden"));
  cv.addEventListener("click", (e) => { const p = nearest(e); if (p) location.hash = `#/cell/${p.c.id}`; });
  const onResize = () => draw();
  window.addEventListener("resize", onResize);

  status("Loading cells…", "busy");
  try {
    S.all = await getCells();
  } catch (err) {
    main.querySelector("#scatter").innerHTML = `<div class="error-box"><div><b>Could not load the cell list.</b><p>${esc(err.message)}</p></div></div>`;
    status("Could not reach the Allen API.", "error");
    return () => window.removeEventListener("resize", onResize);
  }
  status(`Plotting ${S.all.length.toLocaleString()} cells`, "ok");
  draw();
  return () => { window.removeEventListener("resize", onResize); S = null; };
}

function nearest(e) {
  const b = e.target.getBoundingClientRect();
  const mx = e.clientX - b.left, my = e.clientY - b.top;
  let best = null, bd = 64;
  for (const p of S.pts) {
    const d = (p.px - mx) ** 2 + (p.py - my) ** 2;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

function mark(g, style, x, y, size = 3) {
  g.fillStyle = style.fill;
  const X = Math.round(x), Y = Math.round(y);
  if (style.shape === "square") g.fillRect(X - size, Y - size, size * 2 + 1, size * 2 + 1);
  else if (style.shape === "hollow") {
    g.fillRect(X - size, Y - size, size * 2 + 1, 1.5);
    g.fillRect(X - size, Y + size, size * 2 + 1, 1.5);
    g.fillRect(X - size, Y - size, 1.5, size * 2 + 1);
    g.fillRect(X + size, Y - size, 1.5, size * 2 + 1);
  } else {
    g.fillRect(X - size, Y, size * 2 + 1, 1.5);
    g.fillRect(X, Y - size, 1.5, size * 2 + 1);
  }
}

function draw() {
  if (!S || !S.all.length) return;
  setQuery({
    x: S.x, y: S.y, by: S.by, species: S.species, logx: S.logx ? "1" : "", logy: S.logy ? "1" : "",
    hide: [...S.hidden].join(","), highlight: S.highlight || "",
  });
  const main = S.main;
  const G = GROUPINGS[S.by];
  const fx = FEATURE[S.x], fy = FEATURE[S.y];
  const logx = S.logx && LOG_OK.has(S.x), logy = S.logy && LOG_OK.has(S.y);
  main.querySelector("#logx").disabled = !LOG_OK.has(S.x);
  main.querySelector("#logy").disabled = !LOG_OK.has(S.y);
  const tx = (v) => (logx ? Math.log10(v) : v), ty = (v) => (logy ? Math.log10(v) : v);

  const rows = S.all.filter((c) => (!S.species || c.species === S.species)
    && c.f[S.x] != null && c.f[S.y] != null
    && (!logx || c.f[S.x] > 0) && (!logy || c.f[S.y] > 0));
  const groups = G.groups.filter((g) => rows.some((c) => G.of(c) === g.key));
  const styleOf = new Map(groups.map((g, i) => [g.key, STYLES[i % STYLES.length]]));

  main.querySelector("#ctitle").textContent = `${fy.label} vs. ${fx.label.toLowerCase()}`;
  const shown = rows.filter((c) => !S.hidden.has(G.of(c)));
  main.querySelector("#cnote").textContent = `${shown.length.toLocaleString()} cells plotted. Click a point to open that cell.`;

  // legend
  const legend = main.querySelector("#legend");
  legend.innerHTML = groups.map((g) => `<button type="button" class="chip" data-g="${esc(g.key)}" aria-pressed="${!S.hidden.has(g.key)}" style="cursor:pointer;background:${S.hidden.has(g.key) ? "var(--paper)" : "var(--paper)"};opacity:${S.hidden.has(g.key) ? 0.4 : 1}"><canvas width="14" height="14"></canvas>${esc(g.label)} <span class="muted">${rows.filter((c) => G.of(c) === g.key).length}</span></button>`).join("");
  legend.querySelectorAll("[data-g]").forEach((b) => {
    const cvs = b.querySelector("canvas");
    const g2 = cvs.getContext("2d");
    mark(g2, styleOf.get(b.dataset.g), 7, 7, 4);
    b.addEventListener("click", () => {
      const k = b.dataset.g;
      if (S.hidden.has(k)) S.hidden.delete(k); else S.hidden.add(k);
      draw();
    });
  });

  // scatter
  const cv = main.querySelector("#sc");
  const { ctx: g, w, h: H } = fitCanvas(cv);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, w, H);
  const L = 64, R = 18, T = 16, B = 44;
  const vx = shown.map((c) => tx(c.f[S.x])), vy = shown.map((c) => ty(c.f[S.y]));
  const src = vx.length ? { x0: Math.min(...vx), x1: Math.max(...vx), y0: Math.min(...vy), y1: Math.max(...vy) } : { x0: 0, x1: 1, y0: 0, y1: 1 };
  const px = (src.x1 - src.x0) * 0.04 || 1, py = (src.y1 - src.y0) * 0.04 || 1;
  const x0 = src.x0 - px, x1 = src.x1 + px, y0 = src.y0 - py, y1 = src.y1 + py;
  const X = (v) => L + ((v - x0) / (x1 - x0)) * (w - L - R);
  const Y = (v) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  g.font = `500 11px ${FONT}`;
  g.textBaseline = "middle";
  const axisTicks = (a, b, log, n) => {
    if (!log) return niceTicks(a, b, n).ticks.map((v) => ({ at: v, label: tickLabel(v, niceTicks(a, b, n).step) }));
    const out = [];
    for (let e = Math.floor(a); e <= Math.ceil(b); e++) [1, 2, 5].forEach((m) => { const v = Math.log10(m) + e; if (v >= a && v <= b) out.push({ at: v, label: String(+(m * 10 ** e).toPrecision(3)) }); });
    return out;
  };
  g.textAlign = "center";
  axisTicks(x0, x1, logx, Math.floor(w / 100)).forEach((t) => { dotted(g, X(t.at), T, X(t.at), H - B, C.light); g.fillStyle = C.dark; g.fillText(t.label.replace("-", "−"), X(t.at), H - B + 14); });
  g.textAlign = "right";
  axisTicks(y0, y1, logy, Math.floor(H / 70)).forEach((t) => { dotted(g, L, Y(t.at), w - R, Y(t.at), C.light); g.fillStyle = C.dark; g.fillText(t.label.replace("-", "−"), L - 8, Y(t.at)); });
  g.fillStyle = C.ink;
  g.fillRect(L, H - B, w - L - R, 2);
  g.fillRect(L - 2, T, 2, H - B - T);
  g.font = `700 12px ${FONT}`;
  g.textAlign = "center";
  g.fillText(`${fx.label}${fx.unit ? ` (${fx.unit})` : ""}${logx ? ", log" : ""}`, L + (w - L - R) / 2, H - 12);
  g.save();
  g.translate(14, T + (H - T - B) / 2);
  g.rotate(-Math.PI / 2);
  g.fillText(`${fy.label}${fy.unit ? ` (${fy.unit})` : ""}${logy ? ", log" : ""}`, 0, 0);
  g.restore();

  S.pts = [];
  // draw larger groups first so small groups stay visible on top
  const order = groups.slice().sort((a, b) => rows.filter((c) => G.of(c) === b.key).length - rows.filter((c) => G.of(c) === a.key).length);
  order.forEach((grp) => {
    const st = styleOf.get(grp.key);
    shown.filter((c) => G.of(c) === grp.key).forEach((c) => {
      const p = { c, px: X(tx(c.f[S.x])), py: Y(ty(c.f[S.y])) };
      S.pts.push(p);
      mark(g, st, p.px, p.py, 2.5);
    });
  });
  const hi = S.highlight && S.pts.find((p) => p.c.id === S.highlight);
  if (hi) {
    g.fillStyle = C.blue;
    const r = 9;
    const X0 = Math.round(hi.px), Y0 = Math.round(hi.py);
    g.fillRect(X0 - r, Y0 - r, r * 2 + 1, 3); g.fillRect(X0 - r, Y0 + r - 2, r * 2 + 1, 3);
    g.fillRect(X0 - r, Y0 - r, 3, r * 2 + 1); g.fillRect(X0 + r - 2, Y0 - r, 3, r * 2 + 1);
    const label = `Cell ${hi.c.id}`;
    g.font = `700 11px ${FONT}`;
    const tw = g.measureText(label).width + 10;
    g.fillRect(X0 + r + 4, Y0 - 9, tw, 18);
    g.fillStyle = C.paper;
    g.textAlign = "left";
    g.fillText(label, X0 + r + 9, Y0);
  }

  // medians
  const med = (a) => { const s = a.slice().sort((p, q) => p - q); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
  main.querySelector("#medians").innerHTML = `
    <table class="grid cmp-table">
      <thead><tr><th>Group</th><th class="r">Cells</th><th class="r">${esc(fx.label)}${fx.unit ? ` (${fx.unit})` : ""}</th><th class="r">${esc(fy.label)}${fy.unit ? ` (${fy.unit})` : ""}</th></tr></thead>
      <tbody>${groups.map((grp) => {
        const gs = rows.filter((c) => G.of(c) === grp.key);
        return `<tr><td>${esc(grp.label)}</td><td class="r">${gs.length}</td><td class="r">${fmt(med(gs.map((c) => c.f[S.x])), fx.digits)}</td><td class="r">${fmt(med(gs.map((c) => c.f[S.y])), fy.digits)}</td></tr>`;
      }).join("")}</tbody>
    </table>`;
}
