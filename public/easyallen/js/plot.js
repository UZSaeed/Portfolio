// Canvas plotting in a 2-bit "scope" style: black screen, white trace,
// dotted pixel grid, cyan markers. No plotting library needed.

export const C = {
  ink: "#000000",
  dark: "#555555",
  light: "#aaaaaa",
  paper: "#ffffff",
  blue: "#0070ec",
  cyan: "#3cbcfc",
};
export const FONT = '"JetBrains Mono", ui-monospace, monospace';

export function niceTicks(min, max, count = 5) {
  if (!(max > min)) return { step: 1, ticks: [min] };
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { step, ticks };
}

export function tickLabel(v, step) {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return v.toFixed(Math.min(d, 6)).replace("-", "−");
}

// Size a canvas for the device pixel ratio; returns a context in CSS pixels.
export function fitCanvas(canvas, cssHeight) {
  const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = cssHeight || canvas.clientHeight;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  if (cssHeight) canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return { ctx, w, h, dpr };
}

// Pixel-dotted line (every other 2px), the 2-bit substitute for alpha grids.
export function dotted(ctx, x0, y0, x1, y1, color, gap = 4) {
  ctx.fillStyle = color;
  if (y0 === y1) {
    const y = Math.round(y0);
    for (let x = Math.round(x0); x <= x1; x += gap) ctx.fillRect(x, y, 1, 1);
  } else {
    const x = Math.round(x0);
    for (let y = Math.round(y0); y <= y1; y += gap) ctx.fillRect(x, y, 1, 1);
  }
}

export function ditherRect(ctx, x, y, w, h, color, step = 2) {
  ctx.fillStyle = color;
  const x0 = Math.round(x), y0 = Math.round(y);
  for (let yy = 0; yy < h; yy += step) {
    for (let xx = (yy / step) % 2 ? step : 0; xx < w; xx += step * 2) ctx.fillRect(x0 + xx, y0 + yy, 1, 1);
  }
}

// ---------------------------------------------------------------------------
// Scope: stacked tracks sharing one time axis.
//
// tracks: [{ id, label, unit, weight, kind: "trace" | "points", digits, color,
//            includeZero, minSpan }]
// data:   { t0, rate, series: { id: Float32Array }, points: { id: {x, y} },
//           spikes: [s], threshold, window: [a, b] }
// ---------------------------------------------------------------------------
export class Scope {
  constructor(host, tracks, opts = {}) {
    this.host = host;
    this.tracks = tracks;
    this.height = opts.height || 460;
    this.onView = opts.onView || null;
    this.canvas = document.createElement("canvas");
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", opts.ariaLabel || "Recording plot");
    host.prepend(this.canvas);
    this.data = null;
    this.view = null;
    this.hover = null;
    this.drag = null;
    this.gutter = 62;
    this.right = 14;
    this.bottom = 30;
    this.top = 8;
    this._bind();
    this._ro = new ResizeObserver(() => this.draw());
    this._ro.observe(host);
    document.fonts && document.fonts.ready.then(() => this.draw());
  }

  destroy() { this._ro.disconnect(); }

  setData(data, view) {
    this.data = data;
    this._version = (this._version || 0) + 1;
    const n = Math.max(...Object.values(data.series).map((a) => a.length));
    this.extent = [data.t0, data.t0 + n / data.rate];
    this.home = view || data.window || this.extent;
    this.view = [...this.home];
    this.draw();
  }

  setOverlay(patch) {
    if (!this.data) return;
    Object.assign(this.data, patch);
    this._version++;
    this.draw();
  }

  setView(a, b) {
    const [e0, e1] = this.extent;
    const minSpan = 2 / (this.data.rate || 1000) * 20;
    let span = Math.max(minSpan, b - a);
    span = Math.min(span, e1 - e0);
    a = Math.max(e0, Math.min(a, e1 - span));
    this.view = [a, a + span];
    this.draw();
    if (this.onView) this.onView(this.view);
  }

  reset() { this.setView(...this.home); }
  full() { this.setView(...this.extent); }
  zoom(f, at) {
    const [a, b] = this.view;
    const c = at ?? (a + b) / 2;
    this.setView(c - (c - a) * f, c + (b - c) * f);
  }
  pan(frac) {
    const [a, b] = this.view;
    const d = (b - a) * frac;
    this.setView(a + d, b + d);
  }

  _layout(w, h) {
    const plotH = h - this.top - this.bottom;
    const gaps = (this.tracks.length - 1) * 10;
    const total = this.tracks.reduce((s, t) => s + (t.weight || 1), 0);
    let y = this.top;
    return this.tracks.map((t) => {
      const th = ((plotH - gaps) * (t.weight || 1)) / total;
      const r = { t, x: this.gutter, y, w: w - this.gutter - this.right, h: th };
      y += th + 10;
      return r;
    });
  }

  _xToT(x) {
    const r = this._rects[0];
    return this.view[0] + ((x - r.x) / r.w) * (this.view[1] - this.view[0]);
  }
  _tToX(t, r) { return r.x + ((t - this.view[0]) / (this.view[1] - this.view[0])) * r.w; }

  _range(r) {
    const { t } = r;
    const d = this.data;
    let lo = Infinity, hi = -Infinity;
    if (t.kind === "points") {
      const p = d.points && d.points[t.id];
      if (p) p.x.forEach((x, i) => {
        if (x >= this.view[0] && x <= this.view[1]) { lo = Math.min(lo, p.y[i]); hi = Math.max(hi, p.y[i]); }
      });
      if (!isFinite(lo)) { lo = 0; hi = 10; }
      lo = 0;
    } else {
      const a = d.series[t.id];
      if (!a) return [0, 1];
      const i0 = Math.max(0, Math.floor((this.view[0] - d.t0) * d.rate));
      const i1 = Math.min(a.length, Math.ceil((this.view[1] - d.t0) * d.rate));
      const stride = Math.max(1, Math.floor((i1 - i0) / 20000));
      for (let i = i0; i < i1; i += stride) { const v = a[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      // stride sampling can miss narrow spikes; widen with an exact pass if cheap
      if (stride > 1 && i1 - i0 < 2e6) for (let i = i0; i < i1; i++) { const v = a[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
    }
    if (t.includeZero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    const minSpan = t.minSpan || 1;
    if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
    const pad = (hi - lo) * 0.08;
    return [lo - pad, hi + pad];
  }

  // Static layer (grid, traces) is cached offscreen; hover and drag are drawn on top.
  invalidate() { this._baseKey = null; }

  draw() {
    const { ctx, w, h, dpr } = fitCanvas(this.canvas, this.height);
    this._w = w;
    const key = `${w}x${h}@${dpr}|` + (this.data ? `${this.view[0]}|${this.view[1]}|${this._version}` : "empty");
    if (key !== this._baseKey || !this._base) {
      this._base = this._base || document.createElement("canvas");
      this._base.width = w * dpr;
      this._base.height = h * dpr;
      const bctx = this._base.getContext("2d");
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._renderBase(bctx, w, h);
      this._baseKey = key;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this._base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.data) return;
    ctx.font = `500 11px ${FONT}`;
    ctx.textBaseline = "middle";
    this._drawHover(ctx);
    this._drawDrag(ctx);
  }

  _renderBase(ctx, w, h) {
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, w, h);
    this._rects = this._layout(w, h);
    if (!this.data) return;
    ctx.font = `500 11px ${FONT}`;
    ctx.textBaseline = "middle";
    const xt = niceTicks(this.view[0], this.view[1], Math.max(3, Math.floor(w / 110)));

    this._rects.forEach((r, idx) => {
      const [lo, hi] = this._range(r);
      r.lo = lo; r.hi = hi;
      const yOf = (v) => r.y + r.h - ((v - lo) / (hi - lo)) * r.h;
      r.yOf = yOf;

      // frame + grid
      ctx.fillStyle = C.dark;
      ctx.fillRect(r.x - 1, r.y, 1, r.h);
      const yt = niceTicks(lo, hi, Math.max(2, Math.floor(r.h / 34)));
      ctx.textAlign = "right";
      yt.ticks.forEach((v) => {
        const y = Math.round(yOf(v));
        if (y < r.y + 4 || y > r.y + r.h - 2) return;
        dotted(ctx, r.x, y, r.x + r.w, y, C.dark);
        ctx.fillStyle = C.light;
        ctx.fillText(tickLabel(v, yt.step), r.x - 8, y);
      });
      xt.ticks.forEach((t) => {
        const x = Math.round(this._tToX(t, r));
        if (x < r.x || x > r.x + r.w) return;
        dotted(ctx, x, r.y, x, r.y + r.h, C.dark);
      });

      // stimulus window shading (Vm track only)
      if (idx === 0 && this.data.window) {
        const a = this._tToX(this.data.window[0], r), b = this._tToX(this.data.window[1], r);
        const xa = Math.max(r.x, a), xb = Math.min(r.x + r.w, b);
        if (xb > xa) { ctx.fillStyle = C.dark; ctx.fillRect(xa, r.y + r.h - 3, xb - xa, 3); }
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y - 2, r.w, r.h + 4);
      ctx.clip();
      if (r.t.kind === "points") this._drawPoints(ctx, r);
      else this._drawTrace(ctx, r);

      // threshold + spike ticks
      if (idx === 0 && this.data.threshold != null) {
        const y = Math.round(yOf(this.data.threshold));
        for (let x = r.x; x < r.x + r.w; x += 6) { ctx.fillStyle = C.cyan; ctx.fillRect(x, y, 3, 1); }
      }
      if (idx === 0 && this.data.spikes) {
        ctx.fillStyle = C.cyan;
        for (const s of this.data.spikes) {
          const x = Math.round(this._tToX(s, r));
          if (x >= r.x && x <= r.x + r.w) ctx.fillRect(x - 1, r.y + 1, 3, 6);
        }
      }
      ctx.restore();

      // label
      ctx.textAlign = "left";
      const label = `${r.t.label}${r.t.unit ? ` (${r.t.unit})` : ""}`;
      const lw = ctx.measureText(label).width;
      ctx.fillStyle = C.ink;
      ctx.fillRect(r.x + 6, r.y + 4, lw + 10, 16);
      ctx.fillStyle = C.paper;
      ctx.fillText(label, r.x + 11, r.y + 12);
    });

    // time axis
    const last = this._rects[this._rects.length - 1];
    ctx.textAlign = "center";
    ctx.fillStyle = C.light;
    const ay = last.y + last.h + 14;
    xt.ticks.forEach((t) => {
      const x = this._tToX(t, last);
      if (x < last.x - 1 || x > last.x + last.w + 1) return;
      ctx.fillRect(Math.round(x), last.y + last.h + 2, 1, 4);
      ctx.fillText(tickLabel(t, xt.step), x, ay);
    });
    ctx.textAlign = "left";
    ctx.fillText("s", Math.min(w - 10, last.x + last.w + 4), ay);
  }

  _drawTrace(ctx, r) {
    const d = this.data;
    const a = d.series[r.t.id];
    if (!a) return;
    const color = r.t.color || C.paper;
    const span = this.view[1] - this.view[0];
    const spp = (span * d.rate) / r.w; // samples per pixel
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    if (spp > 2) {
      // min/max envelope per pixel column, joined to neighbours so edges stay continuous
      let prevLo = null, prevHi = null;
      for (let px = 0; px < r.w; px++) {
        const i0 = Math.max(0, Math.floor((this.view[0] + (px / r.w) * span - d.t0) * d.rate));
        const i1 = Math.min(a.length, Math.floor((this.view[0] + ((px + 1) / r.w) * span - d.t0) * d.rate) + 1);
        if (i1 <= i0) continue;
        let lo = Infinity, hi = -Infinity;
        for (let i = i0; i < i1; i++) { const v = a[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
        let y0 = r.yOf(hi), y1 = r.yOf(lo);
        if (prevLo !== null) { y0 = Math.min(y0, prevLo); y1 = Math.max(y1, prevHi); }
        const top = Math.floor(y0), bot = Math.ceil(y1);
        ctx.fillRect(r.x + px, top, 1.5, Math.max(1.5, bot - top));
        prevLo = r.yOf(hi); prevHi = r.yOf(lo);
      }
    } else {
      const i0 = Math.max(0, Math.floor((this.view[0] - d.t0) * d.rate) - 1);
      const i1 = Math.min(a.length, Math.ceil((this.view[1] - d.t0) * d.rate) + 2);
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "miter";
      ctx.beginPath();
      for (let i = i0; i < i1; i++) {
        const x = this._tToX(d.t0 + i / d.rate, r);
        const y = r.yOf(a[i]);
        if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (spp < 0.25) {
        for (let i = i0; i < i1; i++) ctx.fillRect(this._tToX(d.t0 + i / d.rate, r) - 1.5, r.yOf(a[i]) - 1.5, 3, 3);
      }
    }
  }

  _drawPoints(ctx, r) {
    const p = this.data.points && this.data.points[r.t.id];
    if (!p || !p.x.length) {
      ctx.fillStyle = C.dark;
      ctx.textAlign = "center";
      ctx.fillText(r.t.empty || "Not enough spikes", r.x + r.w / 2, r.y + r.h / 2);
      return;
    }
    const color = r.t.color || C.cyan;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    p.x.forEach((x, i) => {
      const X = this._tToX(x, r), Y = r.yOf(p.y[i]);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    });
    ctx.stroke();
    ctx.fillStyle = color;
    p.x.forEach((x, i) => {
      const X = Math.round(this._tToX(x, r)), Y = Math.round(r.yOf(p.y[i]));
      ctx.fillRect(X - 2, Y - 2, 5, 5);
    });
  }

  _valueAt(r, t) {
    const d = this.data;
    if (r.t.kind === "points") {
      const p = d.points && d.points[r.t.id];
      if (!p || !p.x.length) return null;
      let best = 0;
      p.x.forEach((x, i) => { if (Math.abs(x - t) < Math.abs(p.x[best] - t)) best = i; });
      return { t: p.x[best], v: p.y[best] };
    }
    const a = d.series[r.t.id];
    if (!a) return null;
    const i = Math.round((t - d.t0) * d.rate);
    if (i < 0 || i >= a.length) return null;
    return { t, v: a[i] };
  }

  _drawHover(ctx) {
    if (!this.hover || this.drag) return;
    const t = this._xToT(this.hover.x);
    if (t < this.view[0] || t > this.view[1]) return;
    ctx.font = `700 11px ${FONT}`;
    this._rects.forEach((r, idx) => {
      const x = Math.round(this._tToX(t, r));
      ctx.fillStyle = C.light;
      for (let y = r.y; y < r.y + r.h; y += 2) ctx.fillRect(x, y, 1, 1);
      const val = this._valueAt(r, t);
      if (!val) return;
      const y = r.yOf(val.v);
      ctx.fillStyle = C.cyan;
      ctx.fillRect(Math.round(this._tToX(val.t, r)) - 3, Math.round(y) - 3, 7, 7);
      const unit = r.t.unit ? ` ${r.t.unit}` : "";
      let txt = `${val.v.toFixed(r.t.digits ?? 1).replace("-", "−")}${unit}`;
      if (idx === 0) txt = `t ${t.toFixed(4)} s   ${txt}`;
      const tw = ctx.measureText(txt).width + 12;
      const bx = r.x + r.w - tw - 6; // top-right corner, clear of the track label
      ctx.fillStyle = C.paper;
      ctx.fillRect(bx, r.y + 4, tw, 18);
      ctx.fillStyle = C.ink;
      ctx.textAlign = "left";
      ctx.fillText(txt, bx + 6, r.y + 13);
    });
    ctx.font = `500 11px ${FONT}`;
  }

  _drawDrag(ctx) {
    if (!this.drag || Math.abs(this.drag.x1 - this.drag.x0) < 3) return;
    const a = Math.min(this.drag.x0, this.drag.x1), b = Math.max(this.drag.x0, this.drag.x1);
    const r0 = this._rects[0], rl = this._rects[this._rects.length - 1];
    ditherRect(ctx, a, r0.y, b - a, rl.y + rl.h - r0.y, C.cyan, 2);
    ctx.fillStyle = C.cyan;
    ctx.fillRect(Math.round(a), r0.y, 1, rl.y + rl.h - r0.y);
    ctx.fillRect(Math.round(b), r0.y, 1, rl.y + rl.h - r0.y);
  }

  _bind() {
    const cv = this.canvas;
    const pos = (e) => {
      const b = cv.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const inPlot = (p) => this._rects && p.x >= this.gutter && p.x <= this._w - this.right;
    cv.addEventListener("pointermove", (e) => {
      const p = pos(e);
      this.hover = inPlot(p) ? p : null;
      if (this.drag) this.drag.x1 = Math.max(this.gutter, Math.min(this._w - this.right, p.x));
      this.draw();
    });
    cv.addEventListener("pointerleave", () => { this.hover = null; if (!this.drag) this.draw(); });
    cv.addEventListener("pointerdown", (e) => {
      if (!this.data || e.button !== 0) return;
      const p = pos(e);
      if (!inPlot(p)) return;
      if (e.pointerType === "touch") return; // let touch users scroll; they get the buttons
      cv.setPointerCapture(e.pointerId);
      this.drag = { x0: p.x, x1: p.x };
    });
    cv.addEventListener("pointerup", () => {
      if (!this.drag) return;
      const { x0, x1 } = this.drag;
      this.drag = null;
      if (Math.abs(x1 - x0) > 4) this.setView(this._xToT(Math.min(x0, x1)), this._xToT(Math.max(x0, x1)));
      else this.draw();
    });
    cv.addEventListener("dblclick", () => this.data && this.reset());
    cv.addEventListener("wheel", (e) => {
      if (!this.data) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        this.zoom(Math.exp(e.deltaY * 0.01), this._xToT(pos(e).x));
      } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        this.pan((e.deltaX || e.deltaY) / 800);
      }
    }, { passive: false });
    cv.addEventListener("keydown", (e) => {
      if (!this.data) return;
      const k = e.key;
      if (k === "+" || k === "=") this.zoom(0.5);
      else if (k === "-" || k === "_") this.zoom(2);
      else if (k === "ArrowLeft") this.pan(-0.2);
      else if (k === "ArrowRight") this.pan(0.2);
      else if (k === "0") this.reset();
      else return;
      e.preventDefault();
    });
  }
}
