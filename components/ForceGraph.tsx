"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import {
  buildGraph,
  CENTER_ID,
  categoryColor,
  categoryGlow,
  computeTargets,
  type GraphLink,
  type GraphNode,
  type Target,
} from "@/lib/graph-data";
import { LAYOUT_BLOOM } from "@/lib/layout-scale";
import { seedJitterPx } from "@/lib/layout-jitter";

type SimNode = GraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
};

interface Props {
  onSelectPrimary: (node: GraphNode) => void;
  expandedCategory: string | null;
}

/* ------------------------------------------------------------------ */
/* Architecture                                                       */
/* ------------------------------------------------------------------ */
/*                                                                    */
/* Custom canvas renderer + d3-force simulation. No camera, no zoom,  */
/* no coordinate transforms beyond (0,0) = viewport center.           */
/*                                                                    */
/*   sizeRef         — latest viewport width/height in CSS pixels      */
/*   nodesRef        — mutable SimNode array owned by d3-force         */
/*   targetsRef      — computeTargets() output, refreshed on resize    */
/*   simRef          — d3 Simulation driving node velocities           */
/*   rafRef          — single animation frame driving tick + draw      */
/*                                                                    */
/* Pointer events are converted from client coords to graph coords:   */
/*   graphX = clientX - rect.left - width/2                            */
/*   graphY = clientY - rect.top  - height/2                           */
/* so the center of the canvas is graph (0,0) — the same origin the   */
/* simulation uses. No mental gymnastics.                              */
/* ------------------------------------------------------------------ */

export default function ForceGraph({ onSelectPrimary, expandedCategory }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  }));
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hasPanned, setHasPanned] = useState(false);

  const sizeRef = useRef({ w: 0, h: 0 });
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const hoverRef = useRef<string | null>(null);
  useEffect(() => {
    hoverRef.current = hoverId;
  }, [hoverId]);

  const expandedRef = useRef<string | null>(expandedCategory);
  useEffect(() => {
    expandedRef.current = expandedCategory;
  }, [expandedCategory]);

  const initial = useMemo(() => buildGraph(), []);

  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const targetsRef = useRef<Map<string, Target>>(new Map());
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const rafRef = useRef<number>(0);

  const dragRef = useRef<{
    node: SimNode;
    downX: number;
    downY: number;
    moved: boolean;
  } | null>(null);

  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
  const isPanningRef = useRef(false);
  const panAnimRef = useRef<{ fromX: number; fromY: number; startTime: number } | null>(null);

  /* --------------------------- sizing --------------------------- */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* ---------------------- simulation init ----------------------- */
  useEffect(() => {
    const nodes: SimNode[] = initial.nodes.map((n) => ({
      ...n,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      fx: n.id === CENTER_ID ? 0 : null,
      fy: n.id === CENTER_ID ? 0 : null,
    }));
    nodesRef.current = nodes;
    linksRef.current = initial.links;

    const getTarget = (n: SimNode): Target => {
      const t = targetsRef.current.get(n.id);
      if (!t) return { x: 0, y: 0 };
      const bloomed =
        n.parent &&
        expandedRef.current &&
        n.parent === expandedRef.current;
      const bloom = bloomed ? LAYOUT_BLOOM : 1;
      return { x: t.x * bloom, y: t.y * bloom };
    };

    const sim = forceSimulation<SimNode>(nodes)
      .force(
        "charge",
        forceManyBody<SimNode>()
          .strength((n) => {
            if (n.id === CENTER_ID) return -4000;
            if (!n.parent) return -2400;
            return -600;
          })
          .distanceMax(2000),
      )
      .force(
        "collide",
        forceCollide<SimNode>((n) => {
          if (n.id === CENTER_ID) return nodeRadius(n) + 60;
          if (!n.parent) return nodeRadius(n) + 72;
          return nodeRadius(n) + 38;
        })
          .strength(0.95)
          .iterations(2),
      )
      .force(
        "anchor-x",
        forceX<SimNode>((n) => getTarget(n).x).strength((n) =>
          n.id === CENTER_ID ? 0 : n.parent ? 0.28 : 0.40,
        ),
      )
      .force(
        "anchor-y",
        forceY<SimNode>((n) => getTarget(n).y).strength((n) =>
          n.id === CENTER_ID ? 0 : n.parent ? 0.28 : 0.40,
        ),
      )
      .alphaDecay(0.01)
      .velocityDecay(0.22)
      .alphaTarget(0.04) // keep the graph faintly jiggly forever
      .alpha(1);

    sim.stop(); // we tick manually from the raf loop
    simRef.current = sim;

    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [initial]);

  /* --------------- size → canvas + targets sync ----------------- */
  useEffect(() => {
    if (!size.w || !size.h) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;

    targetsRef.current = computeTargets(size.w, size.h);

    // Snap every node onto its fresh target (center pinned, others jittered).
    for (const n of nodesRef.current) {
      const t = targetsRef.current.get(n.id);
      if (!t) continue;
      if (n.id === CENTER_ID) {
        n.fx = 0;
        n.fy = 0;
        n.x = 0;
        n.y = 0;
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.fx = null;
      n.fy = null;
      n.x = t.x + seedJitterPx(String(n.id), 10);
      n.y = t.y + seedJitterPx(`${String(n.id)}:y`, 10);
      n.vx = 0;
      n.vy = 0;
    }

    // Pre-run the sim synchronously so the first painted frame is already
    // in the settled/expanded state — no "slowly opening" on load or deploy.
    const sim = simRef.current;
    if (sim) {
      sim.alpha(1);
      for (let i = 0; i < 220; i++) sim.tick();
    }
  }, [size]);

  /* ------------------- bloom (category expanded) ---------------- */
  useEffect(() => {
    simRef.current?.alpha(0.6);
  }, [expandedCategory]);

  /* ---------------------- render loop --------------------------- */
  useEffect(() => {
    const DURATION = 650; // ms

    const tick = (now: number) => {
      // Animate pan back to origin if active.
      const anim = panAnimRef.current;
      if (anim) {
        const t = Math.min((now - anim.startTime) / DURATION, 1);
        // Cubic ease-out.
        const e = 1 - Math.pow(1 - t, 3);
        panRef.current = {
          x: anim.fromX * (1 - e),
          y: anim.fromY * (1 - e),
        };
        if (t >= 1) {
          panRef.current = { x: 0, y: 0 };
          panAnimRef.current = null;
        }
      }

      const sim = simRef.current;
      if (sim) sim.tick();
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pan = panRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, (w / 2 + pan.x) * dpr, (h / 2 + pan.y) * dpr);
    ctx.clearRect(-w / 2 - pan.x, -h / 2 - pan.y, w, h);

    const hover = hoverRef.current;
    const expanded = expandedRef.current;

    const nodesById = new Map<string, SimNode>();
    for (const n of nodesRef.current) nodesById.set(n.id, n);

    // Links first, so nodes paint over them.
    for (const l of linksRef.current) {
      const s = nodesById.get(l.source);
      const t = nodesById.get(l.target);
      if (!s || !t) continue;
      drawLink(ctx, s, t, l, hover, expanded);
    }

    // Nodes — paint active/hovered last so they float on top.
    const ordered = [...nodesRef.current].sort((a, b) => {
      const aTop = a.id === hover || a.id === expanded ? 2 : a.parent ? 0 : 1;
      const bTop = b.id === hover || b.id === expanded ? 2 : b.parent ? 0 : 1;
      return aTop - bTop;
    });
    for (const n of ordered) drawNode(ctx, n, hover, expanded);
  }, []);

  /* ----------------------- pointer events ----------------------- */
  const toGraphCoords = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2 - panRef.current.x,
      y: clientY - rect.top - rect.height / 2 - panRef.current.y,
    };
  }, []);

  const hitTest = useCallback((gx: number, gy: number): SimNode | null => {
    // Reverse iterate so topmost (rendered last) nodes win ties.
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = nodeRadius(n) * 1.8; // generous hit target
      const dx = gx - n.x;
      const dy = gy - n.y;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const { x, y } = toGraphCoords(e.clientX, e.clientY);
      const node = hitTest(x, y);
      (e.target as Element).setPointerCapture?.(e.pointerId);

      if (!node) {
        // Empty space — start panning, cancel any return animation.
        isPanningRef.current = true;
        panAnimRef.current = null;
        panStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        };
        return;
      }

      dragRef.current = { node, downX: x, downY: y, moved: false };
      if (node.id !== CENTER_ID) {
        node.fx = node.x;
        node.fy = node.y;
      }
      simRef.current?.alphaTarget(0.3).alpha(0.5);
    },
    [toGraphCoords, hitTest],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanningRef.current) {
        const start = panStartRef.current;
        panRef.current = {
          x: start.panX + (e.clientX - start.clientX),
          y: start.panY + (e.clientY - start.clientY),
        };
        return;
      }

      const { x, y } = toGraphCoords(e.clientX, e.clientY);
      const drag = dragRef.current;
      if (drag) {
        const dx = x - drag.downX;
        const dy = y - drag.downY;
        if (dx * dx + dy * dy > 9) drag.moved = true;
        if (drag.node.id !== CENTER_ID) {
          drag.node.fx = x;
          drag.node.fy = y;
        }
        return;
      }
      const node = hitTest(x, y);
      setHoverId(node?.id ?? null);
    },
    [toGraphCoords, hitTest],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        const { x, y } = panRef.current;
        if (Math.abs(x) > 4 || Math.abs(y) > 4) setHasPanned(true);
        return;
      }

      const drag = dragRef.current;
      dragRef.current = null;
      simRef.current?.alphaTarget(0.04);
      if (!drag) return;

      const n = drag.node;
      if (n.id !== CENTER_ID) {
        n.fx = null;
        n.fy = null;
        const t = targetsRef.current.get(n.id);
        if (t) {
          const bloomed =
            n.parent &&
            expandedRef.current &&
            n.parent === expandedRef.current;
          const bloom = bloomed ? LAYOUT_BLOOM : 1;
          n.vx += (t.x * bloom - n.x) * 0.18;
          n.vy += (t.y * bloom - n.y) * 0.18;
        }
      }

      if (!drag.moved) {
        if (n.id === CENTER_ID) {
          simRef.current?.alpha(0.8);
          return;
        }
        if (!n.parent) onSelectPrimary(n);
      }
      void e;
    },
    [onSelectPrimary],
  );

  const resetView = useCallback(() => {
    panAnimRef.current = {
      fromX: panRef.current.x,
      fromY: panRef.current.y,
      startTime: performance.now(),
    };
    setHasPanned(false);
  }, []);

  /* ------------------------------ JSX --------------------------- */
  return (
    <div
      ref={wrapRef}
      className="graph-host absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => {
        if (!dragRef.current) setHoverId(null);
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {hasPanned && (
        <button
          onClick={resetView}
          className="absolute top-3 right-3 font-mono text-xs px-3 py-1.5 rounded border border-tn-comment/40 bg-tn-bg/80 text-tn-comment hover:text-tn-fg hover:border-tn-comment/70 transition-colors backdrop-blur-sm"
          style={{ pointerEvents: "all" }}
        >
          ⌂ home
        </button>
      )}
    </div>
  );
}

/* -------------------------- drawing -------------------------- */

function nodeRadius(n: SimNode) {
  if (n.category === "center") return 90;
  if (!n.parent) return 26 + (n.mass - 18) * 0.7;
  return 13;
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  n: SimNode,
  hoverId: string | null,
  expanded: string | null,
) {
  const color = categoryColor[n.category];
  const isHover = hoverId === n.id;
  const x = n.x;
  const y = n.y;

  // Center node: render as plain text, no circle.
  if (n.category === "center") {
    ctx.save();
    const fontSize = 34;
    ctx.font = `700 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = "❯ Uzair Saeed";
    const metrics = ctx.measureText(text);
    const pad = 12;
    const bgW = metrics.width + pad * 2;
    const bgH = fontSize + 14;

    // Soft glow behind text.
    const glowR = bgW * 0.7;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    grad.addColorStop(0, "rgba(192, 202, 245, 0.12)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Pill background.
    ctx.fillStyle = isHover ? "rgba(30, 31, 46, 0.95)" : "rgba(22, 22, 30, 0.88)";
    roundRect(ctx, x - bgW / 2, y - bgH / 2, bgW, bgH, 6);
    ctx.fill();

    // Border — dimmer when not hovered.
    ctx.strokeStyle = isHover ? "rgba(192, 202, 245, 0.6)" : "rgba(192, 202, 245, 0.2)";
    ctx.lineWidth = 1;
    roundRect(ctx, x - bgW / 2, y - bgH / 2, bgW, bgH, 6);
    ctx.stroke();

    // Text.
    ctx.fillStyle = isHover ? "#e0e5ff" : "#c0caf5";
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  }

  const glow = categoryGlow[n.category];
  const r = nodeRadius(n);
  const scale = isHover ? 1.2 : 1;
  const isExpanded = expanded === n.id;
  const isSub = !!n.parent;
  const isSubActive = isSub && expanded === n.parent;
  const isDimmed =
    isSub && expanded !== null && !isSubActive && !isHover;

  ctx.save();
  if (isDimmed) ctx.globalAlpha = 0.35;

  // Glow.
  const glowMult = isHover ? 3.2 : isSub && !isSubActive ? 1.4 : 2.4;
  const glowRadius = r * glowMult * scale;
  const grad = ctx.createRadialGradient(x, y, r * 0.3, x, y, glowRadius);
  grad.addColorStop(0, glow);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Ring.
  ctx.lineWidth = isExpanded ? 2.2 : isHover ? 1.8 : 1.3;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * scale, 0, Math.PI * 2);
  ctx.stroke();

  // Core.
  ctx.fillStyle = "rgba(26,27,38,0.92)";
  ctx.beginPath();
  ctx.arc(x, y, r * scale * 0.72, 0, Math.PI * 2);
  ctx.fill();

  // Inner dot.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1.4, r * 0.24), 0, Math.PI * 2);
  ctx.fill();

  // Label.
  const showLabel = !isSub || isHover || isSubActive;
  if (showLabel) {
    const fontSize = isSub ? 18 : 22;
    ctx.font = `500 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelY = y + r * scale + 10;

    const prefix = !isSub ? "» " : "· ";
    const text = `${prefix}${n.label}`;

    const metrics = ctx.measureText(text);
    const pad = 7;
    const bgW = metrics.width + pad * 2;
    const bgH = fontSize + 8;
    ctx.fillStyle = "rgba(22, 22, 30, 0.85)";
    roundRect(ctx, x - bgW / 2, labelY - 3, bgW, bgH, 4);
    ctx.fill();

    ctx.fillStyle = isHover || isExpanded ? color : "#c0caf5";
    ctx.fillText(text, x, labelY);
  }

  ctx.restore();
}

function drawLink(
  ctx: CanvasRenderingContext2D,
  s: SimNode,
  t: SimNode,
  l: GraphLink,
  hoverId: string | null,
  expanded: string | null,
) {
  const involved =
    (hoverId && (hoverId === s.id || hoverId === t.id)) ||
    (expanded && (expanded === s.id || expanded === t.id));

  ctx.save();
  ctx.lineWidth = l.weak ? (involved ? 1.3 : 0.7) : involved ? 1.9 : 0.9;

  if (l.weak) {
    ctx.strokeStyle = involved
      ? "rgba(247, 118, 142, 0.85)"
      : "rgba(247, 118, 142, 0.35)";
    ctx.setLineDash([5, 7]);
  } else {
    ctx.strokeStyle = involved
      ? "rgba(122, 162, 247, 0.9)"
      : "rgba(86, 95, 137, 0.55)";
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(t.x, t.y);
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
