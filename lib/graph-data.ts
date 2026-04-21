export type Category = "center" | "code" | "research" | "outreach" | "creativity";

export interface SubItem {
  id: string;
  label: string;
  blurb: string;
  stack?: string[];
  link?: { label: string; href: string };
}

export interface GraphNode {
  id: string;
  label: string;
  category: Category;
  /** Mass proxy — drives size + collision radius. */
  mass: number;
  /** If present, this is a primary category node and has sub-items. */
  sub?: SubItem[];
  /** Terminal-style short tag shown in the side panel. */
  tag?: string;
  /** Long-form blurb used in the modal. */
  description?: string;
  /** Child node marker — used for styling and physics. */
  parent?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  /** 0..1 — lower values = weaker/longer spring. */
  strength: number;
  /** Base distance for the link (pixels). */
  distance: number;
  /** Optional flag for the specifically "weak" Code<->Outreach link. */
  weak?: boolean;
}

/* ------------------------------------------------------------------ */
/* Primary nodes                                                      */
/* ------------------------------------------------------------------ */

export const CENTER_ID = "uzair";

export const primaryNodes: GraphNode[] = [
  {
    id: CENTER_ID,
    label: "Uzair Saeed",
    category: "center",
    mass: 42,
    tag: "~/uzair",
    description:
      "Student at UT Dallas. I build software that sits between systems and people — adaptive learning tools, neuro-research instruments, and the occasional terminal rice.",
  },
  {
    id: "code",
    label: "Code",
    category: "code",
    mass: 26,
    tag: "~/code",
    description:
      "Software engineering: adaptive learning, full-stack products, developer tools. Shipping things people actually open twice.",
  },
  {
    id: "research",
    label: "Research",
    category: "research",
    mass: 24,
    tag: "~/research",
    description:
      "Neuroscience at UTD. Interests spanning oculoplastics, cardiology, and EMG-driven interfaces.",
  },
  {
    id: "outreach",
    label: "Outreach & Advocacy",
    category: "outreach",
    mass: 22,
    tag: "~/outreach",
    description:
      "Teaching, coaching, and lowering the activation energy for the next person who wants to build something.",
  },
  {
    id: "creativity",
    label: "Creativity",
    category: "creativity",
    mass: 18,
    tag: "~/creativity",
    description:
      "Ricing terminals, obsessing over horology and automotive design. Taste, compounded.",
  },
];

/* ------------------------------------------------------------------ */
/* Sub-items per category                                             */
/* ------------------------------------------------------------------ */

export const subItems: Record<Exclude<Category, "center">, SubItem[]> = {
  code: [
    {
      id: "soma",
      label: "Soma",
      blurb:
        "Flashcard + study OS built on FSRS. Flutter front-end, Go backend, pragmatic spaced-repetition math.",
      stack: ["Flutter", "Go", "FSRS", "Postgres"],
    },
    {
      id: "spikeprep",
      label: "SpikePrep",
      blurb:
        "Adaptive SAT platform — item-response theory driven difficulty, diagnostic-first onboarding.",
      stack: ["Next.js", "TypeScript", "IRT", "Supabase"],
    },
    {
      id: "locus",
      label: "Locus",
      blurb:
        "AI-assisted credentialing for healthcare. Structured extraction, verification loops, audit trails.",
      stack: ["TypeScript", "LLMs", "RAG", "Postgres"],
    },
  ],
  research: [
    {
      id: "neuro-utd",
      label: "Neuroscience @ UTD",
      blurb:
        "Coursework + lab rotations. Focus on systems neuroscience and translational interfaces.",
      stack: ["MATLAB", "Python", "Signal Processing"],
    },
    {
      id: "oculo-cardio",
      label: "Oculoplastics & Cardiology",
      blurb:
        "Clinical interests at the boundary of surgical reconstruction and cardiovascular physiology.",
    },
    {
      id: "emg",
      label: "EMG Sensor Projects",
      blurb:
        "Surface EMG rigs for gesture + rehab signal capture. Hardware + DSP + real-time viz.",
      stack: ["C++", "Arduino", "Python", "DSP"],
    },
  ],
  outreach: [
    {
      id: "robotics",
      label: "Title I Robotics Coach",
      blurb:
        "Coaching a Title I middle-school robotics team. Build seasons, demos, and a lot of zip ties.",
    },
    {
      id: "sat-tutor",
      label: "SAT Tutoring",
      blurb:
        "One-on-one SAT tutoring — the feedback loop that eventually turned into SpikePrep.",
    },
    {
      id: "neuro-demos",
      label: "Neuro Outreach Demos",
      blurb:
        "Bringing EEG / EMG demos into classrooms. Brains are a surprisingly good hook.",
    },
  ],
  creativity: [
    {
      id: "ricing",
      label: "Terminal Ricing",
      blurb:
        "Ghostty + Starship + tmux. Tokyo Night everything. The dotfiles are the portfolio.",
      stack: ["Ghostty", "Starship", "tmux", "Neovim"],
    },
    {
      id: "horology",
      label: "Horology",
      blurb:
        "Mechanical watches — caliber nerdery, finishing, and why a second hand sweeps.",
    },
    {
      id: "auto",
      label: "Automotive Design",
      blurb:
        "Proportions, stance, interior ergonomics. The original UX.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Layout targets — computed in PIXEL space at runtime.               */
/*                                                                    */
/* This is the key architectural choice: targets are not an abstract  */
/* coordinate system scaled later — they're the actual on-screen      */
/* positions. Combined with the camera locked at zoom(1) + centerAt   */
/* (0,0) in ForceGraph, what we write here is what the user sees.     */
/* ------------------------------------------------------------------ */

/** 22.5° — breaks perfect N/E/S/W symmetry. */
const LAYOUT_ROTATION = Math.PI / 8;

export const PRIMARY_ANGLES: Record<Exclude<Category, "center">, number> = {
  code: -Math.PI / 2 + LAYOUT_ROTATION,
  research: LAYOUT_ROTATION,
  outreach: Math.PI / 2 + LAYOUT_ROTATION,
  creativity: Math.PI + LAYOUT_ROTATION,
};

/** Fraction of min(viewport width, height) used for the primary ring. */
const PRIMARY_RADIUS_FRAC = 0.38;
/** Fraction of min(viewport width, height) used for the sub-node ring. */
const SUB_RADIUS_FRAC = 0.45;
/** Half-width of the fan that holds a primary's three sub-nodes (radians). */
const SUB_FAN_HALF = 1.1;

/** Stable per-id hash, used to seed small wobble. */
function hash(id: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < id.length; i++) {
    h = (h * 33 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 10000) / 10000;
}

/** Large per-node angle offset — breaks the clean quadrant layout. */
function angleWobble(id: string): number {
  return (hash(id, 5381) - 0.5) * 1.4;
}

/** Wide radial variation so nodes land at very different distances. */
function radialScale(id: string): number {
  return 0.55 + hash(id, 7919) * 0.9;
}

export interface Target {
  x: number;
  y: number;
}

/**
 * Compute target positions for every node, in pixel space, centered at (0,0).
 * Called on first paint and on every viewport resize. Primary ring radius and
 * sub-node ring radius both scale proportionally to min(w,h), so the graph
 * uses the available space on any screen without being crushed into the
 * center on small ones.
 */
export function computeTargets(
  width: number,
  height: number,
): Map<string, Target> {
  const out = new Map<string, Target>();
  out.set(CENTER_ID, { x: 0, y: 0 });

  const refDim = Math.min(width, height);
  const rPrimary = refDim * PRIMARY_RADIUS_FRAC;
  const rSub = refDim * SUB_RADIUS_FRAC;

  for (const cat of Object.keys(PRIMARY_ANGLES) as Exclude<
    Category,
    "center"
  >[]) {
    const baseAngle = PRIMARY_ANGLES[cat] + angleWobble(cat);
    const r = rPrimary * radialScale(cat);
    out.set(cat, {
      x: Math.cos(baseAngle) * r,
      y: Math.sin(baseAngle) * r,
    });

    const items = subItems[cat];
    items.forEach((s, idx) => {
      const t = items.length === 1 ? 0 : idx / (items.length - 1) - 0.5;
      const angle = baseAngle + t * 2 * SUB_FAN_HALF + angleWobble(s.id);
      const rr = rSub * radialScale(s.id);
      out.set(s.id, {
        x: Math.cos(angle) * rr,
        y: Math.sin(angle) * rr,
      });
    });
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Build full graph                                                   */
/* ------------------------------------------------------------------ */

export function buildGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [...primaryNodes];
  const links: GraphLink[] = [];

  const primaryIds: Exclude<Category, "center">[] = [
    "code",
    "research",
    "outreach",
    "creativity",
  ];

  // Center → primary edges (visual only; physics is driven by anchors).
  for (const id of primaryIds) {
    links.push({ source: CENTER_ID, target: id, strength: 0, distance: 200 });
  }

  // Attach sub-items.
  for (const cat of primaryIds) {
    for (const s of subItems[cat]) {
      nodes.push({
        id: s.id,
        label: s.label,
        category: cat,
        mass: 10,
        parent: cat,
        description: s.blurb,
      });
      links.push({ source: cat, target: s.id, strength: 0, distance: 160 });
    }
  }

  // Cross-links — all primary pairs for a fully connected, messy mesh.
  const crossPairs: [string, string, boolean?][] = [
    ["code", "research"],
    ["research", "outreach"],
    ["outreach", "creativity"],
    ["creativity", "code"],
    ["code", "outreach", true],
    ["research", "creativity", true],
  ];
  for (const [a, b, weak] of crossPairs) {
    links.push({ source: a, target: b, strength: 0, distance: 300, weak });
  }

  // A handful of sub→primary cross-category links for extra web density.
  const subCross: [string, string][] = [
    ["soma", "research"],
    ["emg", "code"],
    ["neuro-demos", "research"],
    ["spikeprep", "outreach"],
    ["ricing", "code"],
  ];
  for (const [a, b] of subCross) {
    links.push({ source: a, target: b, strength: 0, distance: 250, weak: true });
  }

  return { nodes, links };
}

/* ------------------------------------------------------------------ */
/* Theme map                                                          */
/* ------------------------------------------------------------------ */

export const categoryColor: Record<Category, string> = {
  center: "#c0caf5",
  code: "#7aa2f7",
  research: "#bb9af7",
  outreach: "#9ece6a",
  creativity: "#ff9e64",
};

export const categoryGlow: Record<Category, string> = {
  center: "rgba(192, 202, 245, 0.55)",
  code: "rgba(122, 162, 247, 0.55)",
  research: "rgba(187, 154, 247, 0.55)",
  outreach: "rgba(158, 206, 106, 0.55)",
  creativity: "rgba(255, 158, 100, 0.55)",
};
