export type Category = "center" | "projects" | "research" | "clinical" | "services";

export interface SubItem {
  id: string;
  label: string;
  blurb: string;
  stack?: string[];
  link?: { label: string; href: string; external?: boolean };
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
    id: "projects",
    label: "Outreach + Projects",
    category: "projects",
    mass: 26,
    tag: "~/projects",
    description:
      "Software, hardware, and games built to teach and demo — open-sourced where it matters so the next person can pick it up and run with it.",
  },
  {
    id: "research",
    label: "Research",
    category: "research",
    mass: 24,
    tag: "~/research",
    description:
      "8 publications in cardiovascular surgery and structural heart disease — interventional cardiology, the Ross procedure, TAVR outcomes, and structural valve repair.",
  },
  {
    id: "clinical",
    label: "Clinical",
    category: "clinical",
    mass: 22,
    tag: "~/clinical",
    description:
      "1,000+ hours bedside and shadowing — electrophysiology, interventional and structural cardiology, cardiothoracic surgery, and the OR. Where the research meets the patient.",
  },
  {
    id: "services",
    label: "Services",
    category: "services",
    mass: 18,
    tag: "~/services",
    description:
      "Tutoring and development services — SAT, MCAT, and full-stack web work.",
  },
];

/* ------------------------------------------------------------------ */
/* Sub-items per category                                             */
/* ------------------------------------------------------------------ */

export const subItems: Record<Exclude<Category, "center">, SubItem[]> = {
  projects: [
    {
      id: "soma",
      label: "Soma",
      blurb:
        "Adaptive MCAT study platform built to be more frictionless than Anki — spaced repetition, active recall research, and a UX designed for pre-med students.",
      stack: ["Next.js", "TypeScript", "FSRS", "Supabase"],
    },
    {
      id: "brainbird",
      label: "BrainBird",
      blurb:
        "Open-source EMG exhibit: an ESP32 reads muscle electrical potentials and lets participants control a custom Flappy Bird clone via arm-squeeze signals. Full hardware schematics + source published.",
      stack: ["C++", "ESP32", "Python", "Arduino"],
      link: { label: "Open demo", href: "/brainbird", external: false },
    },
    {
      id: "the-long-road",
      label: "The Long Road",
      blurb:
        "2D pixel game traveling through U.S. drug-legislation history. Players stop at landmark laws to learn about their passage and downstream inequities; ends with a direct link to real-world advocacy orgs.",
      stack: ["GDScript", "Godot"],
      link: { label: "Play", href: "/thelongroad", external: false },
    },
    {
      id: "translatemyrx",
      label: "TranslateMyRX",
      blurb:
        "Multi-language medication tracker built to close the language gap in healthcare. Patients log their meds, get reminders, and read descriptions sourced from reputable references — all translated into their preferred language.",
      stack: ["Next.js", "TypeScript", "i18n"],
      link: { label: "Open", href: "https://www.translatemyrx.com", external: true },
    },
  ],
  research: [
    {
      id: "pub-tricuspid",
      label: "Functional Tricuspid Regurgitation",
      blurb:
        "Compared outcomes of atrial vs. ventricular functional tricuspid regurgitation in a contemporary structural heart population. Contributed clinical data collection and analysis.",
      link: { label: "JACC 2026", href: "https://www.jacc.org/doi/10.1016/S0735-1097%2826%2900000-0" },
    },
    {
      id: "pub-mals",
      label: "Median Arcuate Ligament Syndrome",
      blurb:
        "Multidisciplinary ultrasound-guided diagnosis of MALS, with a focus on the role of interventional cardiology and vascular surgery in robotic release. Contributed manuscript preparation and literature review.",
      link: { label: "JSCAI 2026", href: "https://www.jscai.org" },
    },
    {
      id: "pub-laa",
      label: "ICE-Guided LAA Occlusion Registry",
      blurb:
        "Single-center registry of intracardiac echocardiography-guided left atrial appendage occlusion procedures. Contributed data organization and manuscript drafting.",
      link: { label: "Cardiovascular Interventions 2026", href: "https://www.jacc.org/journal/interventions" },
    },
    {
      id: "pub-tavr-kccq",
      label: "TAVR: PPM & Quality of Life",
      blurb:
        "Examined the impact of patient-prosthetic mismatch stratified by flow status on KCCQ quality-of-life scores after transcatheter aortic valve replacement. Acknowledged contributor.",
      link: { label: "JACC 2025", href: "https://www.jacc.org" },
    },
    {
      id: "pub-mitral",
      label: "Functional Mitral Regurgitation (TCT)",
      blurb:
        "Compared outcomes of atrial vs. ventricular functional mitral regurgitation in a contemporary structural heart population. Acknowledged contributor; presented at TCT 2025.",
      link: { label: "JACC 2025", href: "https://www.jacc.org" },
    },
    {
      id: "pub-ross-age",
      label: "Ross Procedure: Age Stratification",
      blurb:
        "Multicenter North American Ross Consortium study comparing short and mid-term outcomes of the Ross procedure in patients above and below 50 years of age.",
      link: { label: "JTCVS Open 2026", href: "https://www.jtcvsopen.org" },
    },
    {
      id: "pub-ross-prior",
      label: "Ross Procedure After Prior AV Intervention",
      blurb:
        "Outcomes analysis from the North American Ross Consortium Database for patients undergoing the Ross procedure after a prior aortic valve intervention.",
      link: { label: "JTCVS Open 2026", href: "https://www.jtcvsopen.org" },
    },
    {
      id: "pub-ppm-qol",
      label: "Patient-Prosthesis Mismatch & QoL Post-TAVI",
      blurb:
        "Analyzed the impact of both measured and predicted patient-prosthesis mismatch on quality of life following transcatheter aortic valve implantation. Contributed data collection and analysis.",
      link: { label: "Structural Heart 2025", href: "https://www.structuralheart.org" },
    },
  ],
  clinical: [
    {
      id: "ep-ma",
      label: "Volunteer MA — Electrophysiology",
      blurb:
        "First direct patient care role at a rural cardiology subspecialty clinic — vitals, EKGs, H&P scribing, and shadowed an electrophysiologist through consults and procedures. 160 hrs.",
    },
    {
      id: "ic-ma",
      label: "Volunteer MA — Interventional Cardiology",
      blurb:
        "420 hours over a year in an interventional cardiology outpatient clinic — taking vitals, prepping rooms, scribing, and learning how patient communication actually works in a fast-paced subspecialty.",
    },
    {
      id: "bsw-shadow",
      label: "Structural Heart Shadowing",
      blurb:
        "250 hours at Baylor Scott & White The Heart Hospital across valve clinic, cath lab, general and preventative cardiology, and cardiothoracic surgery — the clinical side of the research I work on.",
    },
    {
      id: "retina-obs",
      label: "Retina Surgery Observation",
      blurb:
        "Observed vitrectomies and scleral buckles in the OR plus intravitreal injections and laser photocoagulation in clinic — stepping outside the cardiology comfort zone.",
    },
  ],
  services: [
    {
      id: "sat-tutoring",
      label: "SAT Tutoring",
      blurb:
        "One-on-one SAT prep — diagnostic-first approach, targeted content review, and test strategy. Proven track record of 100+ point score improvements.",
    },
    {
      id: "mcat-tutoring",
      label: "MCAT Tutoring",
      blurb:
        "MCAT prep from a 521 (98th percentile) scorer — spaced repetition strategy, content review, and passage-based reasoning for all four sections.",
    },
    {
      id: "web-dev",
      label: "Full Stack Web Dev",
      blurb:
        "Full-stack development and ongoing site maintenance — from greenfield builds to keeping existing products running, updated, and fast.",
      stack: ["Next.js", "TypeScript", "React", "Supabase"],
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
  projects: -Math.PI / 2 + LAYOUT_ROTATION,
  research: LAYOUT_ROTATION,
  clinical: Math.PI / 2 + LAYOUT_ROTATION,
  services: Math.PI + LAYOUT_ROTATION,
};

/** Fraction of min(viewport width, height) used for the primary ring. */
const PRIMARY_RADIUS_FRAC = 0.54;
/** Fraction of min(viewport width, height) used for the sub-node ring. */
const SUB_RADIUS_FRAC = 0.74;
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
    "projects",
    "research",
    "clinical",
    "services",
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
    ["projects", "research"],
    ["research", "clinical"],
    ["clinical", "services"],
    ["services", "projects"],
    ["projects", "clinical", true],
    ["research", "services", true],
  ];
  for (const [a, b, weak] of crossPairs) {
    links.push({ source: a, target: b, strength: 0, distance: 300, weak });
  }

  // A handful of sub→primary cross-category links for extra web density.
  const subCross: [string, string][] = [
    ["soma", "research"],
    ["brainbird", "clinical"],
    ["the-long-road", "clinical"],
    ["translatemyrx", "clinical"],
    ["mcat-tutoring", "research"],
    ["web-dev", "projects"],
    ["pub-tavr-kccq", "projects"],
    ["bsw-shadow", "research"],
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
  projects: "#7aa2f7",
  research: "#bb9af7",
  clinical: "#f7768e",
  services: "#2ac3de",
};

export const categoryGlow: Record<Category, string> = {
  center: "rgba(192, 202, 245, 0.55)",
  projects: "rgba(122, 162, 247, 0.55)",
  research: "rgba(187, 154, 247, 0.55)",
  clinical: "rgba(247, 118, 142, 0.55)",
  services: "rgba(42, 195, 222, 0.55)",
};
