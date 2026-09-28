// Allen Brain Map API (RMA) access plus plain-language labels for students.
// Docs: https://help.brain-map.org/display/api/Allen+Brain+Atlas+API

export const API = "https://api.brain-map.org";
const RMA = `${API}/api/v2/data/query.json`;

const CELL_FIELDS = [
  "specimen__id", "specimen__name", "donor__species", "donor__age", "donor__sex", "donor__disease_state",
  "structure__acronym", "structure__name", "structure__layer", "structure_parent__acronym",
  "specimen__hemisphere", "tag__dendrite_type", "tag__apical", "line_name", "cell_reporter_status",
  "erwkf__id", "nrwkf__id", "morph_thumb_path", "ephys_thumb_path", "csl__normalized_depth",
  "ef__vrest", "ef__ri", "ef__tau", "ef__threshold_i_long_square", "ef__f_i_curve_slope",
  "ef__avg_firing_rate", "ef__avg_isi", "ef__adaptation", "ef__upstroke_downstroke_ratio_long_square",
  "ef__fast_trough_v_long_square", "ef__peak_t_ramp",
  "nr__max_euclidean_distance", "nr__number_bifurcations", "nr__number_stems",
];

async function rma(criteria, { only, signal } = {}) {
  let q = `criteria=${criteria},rma::options[num_rows$eqall]`;
  if (only) q += `[only$eq'${only.join(",")}']`;
  const res = await fetch(`${RMA}?${encodeURI(q).replace(/\$/g, "%24")}`, { signal });
  if (!res.ok) throw new Error(`The Allen API returned HTTP ${res.status}.`);
  const body = await res.json();
  if (!body.success) throw new Error(`The Allen API rejected the query: ${body.msg}`);
  return body.msg;
}

let cellsPromise = null;
export function getCells() {
  if (!cellsPromise) {
    cellsPromise = rma("model::ApiCellTypesSpecimenDetail", { only: CELL_FIELDS })
      .then((rows) => rows.map(decorate).sort((a, b) => a.id - b.id))
      .catch((err) => { cellsPromise = null; throw err; });
  }
  return cellsPromise;
}

export async function getCell(id) {
  const cells = await getCells();
  return cells.find((c) => c.id === Number(id)) || null;
}

const sweepCache = new Map();
export function getSweeps(specimenId) {
  if (!sweepCache.has(specimenId)) {
    const p = rma(`model::EphysSweep,rma::criteria,[specimen_id$eq${specimenId}]`)
      .then((rows) => rows
        // current clamp only; older files say "Amps", newer ones "pA"
        .filter((s) => (s.stimulus_units === "Amps" || s.stimulus_units === "pA") && s.stimulus_name && s.stimulus_name !== "Test")
        .map((s) => ({
          number: s.sweep_number,
          stimulus: s.stimulus_name,
          amplitude: s.stimulus_absolute_amplitude, // pA
          start: s.stimulus_start_time, // s
          duration: s.stimulus_duration, // s
          spikes: s.num_spikes || 0,
        }))
        .sort((a, b) => a.number - b.number))
      .catch((err) => { sweepCache.delete(specimenId); throw err; });
    sweepCache.set(specimenId, p);
  }
  return sweepCache.get(specimenId);
}

export const nwbUrl = (cell) => `${API}/api/v2/well_known_file_download/${cell.nwbId}`;
export const portalUrl = (cell) => `https://celltypes.brain-map.org/experiment/electrophysiology/${cell.id}`;
export const thumbUrl = (path) => (path ? `${API}${path}` : null);

// ---------- plain-language labels ----------

export const REGIONS = {
  VISp: "Primary visual cortex",
  VISl: "Lateral visual area",
  VISpm: "Posteromedial visual area",
  VISpor: "Postrhinal visual area",
  VISpl: "Posterolateral visual area",
  VISli: "Laterointermediate visual area",
  VISal: "Anterolateral visual area",
  VISam: "Anteromedial visual area",
  VISa: "Anterior visual area",
  VISrl: "Rostrolateral visual area",
  RSPagl: "Retrosplenial cortex (lateral)",
  RSPd: "Retrosplenial cortex (dorsal)",
  RSPv: "Retrosplenial cortex (ventral)",
  SSp: "Primary somatosensory cortex",
  "SSp-bfd": "Somatosensory cortex (barrel field)",
  "SSp-tr": "Somatosensory cortex (trunk)",
  "SSp-n": "Somatosensory cortex (nose)",
  "SSp-un": "Somatosensory cortex (unassigned)",
  TEa: "Temporal association area",
  AUDp: "Primary auditory cortex",
  AUDpo: "Posterior auditory area",
  MTG: "Middle temporal gyrus",
  MFG: "Middle frontal gyrus",
  SFG: "Superior frontal gyrus",
  IFG: "Inferior frontal gyrus",
  ITG: "Inferior temporal gyrus",
  FroL: "Frontal lobe",
  TemL: "Temporal lobe",
  AnG: "Angular gyrus",
  PLP: "Planum polare",
};

// Cre driver lines mark genetically defined cell classes (mouse only).
const FAMILIES = [
  { key: "pv", label: "PV interneuron", genes: ["Pvalb"], blurb: "Parvalbumin-expressing inhibitory cells. Usually fast-spiking." },
  { key: "sst", label: "SST interneuron", genes: ["Sst", "Chrna2", "Nos1"], blurb: "Somatostatin-expressing inhibitory cells. Often target dendrites." },
  { key: "vip", label: "VIP interneuron", genes: ["Vip", "Vipr2", "Chat"], blurb: "VIP-expressing inhibitory cells. Often inhibit other interneurons." },
  { key: "inh", label: "Other inhibitory", genes: ["Htr3a", "Ndnf", "Nkx2-1", "Gad2", "Slc32a1"], blurb: "Other genetically labeled inhibitory populations." },
  { key: "exc", label: "Excitatory line", genes: ["Rorb", "Scnn1a", "Rbp4", "Nr5a1", "Cux2", "Ntsr1", "Ctgf", "Tlx3", "Sim1", "Glt25d2", "Slc17a6"], blurb: "Lines that label excitatory (mostly pyramidal) neurons in specific layers." },
];
export const FAMILY_LIST = [
  ...FAMILIES,
  { key: "other", label: "Other Cre line", blurb: "A labeled line not grouped here. See the line name." },
  { key: "none", label: "No line / human", blurb: "Human cells and unlabeled mouse cells have no Cre line." },
];

function familyOf(line, reporter) {
  if (!line) return "none";
  const gene = line.split("|")[0].split(/[-_]/)[0];
  const fam = FAMILIES.find((f) => f.genes.includes(gene));
  if (!fam) return "other";
  // A reporter-negative cell was recorded in that mouse but is NOT a labeled cell.
  return reporter === "positive" ? fam.key : "other";
}

export const DENDRITES = {
  spiny: { label: "Spiny", blurb: "Dendrites covered in spines. Almost always excitatory, like pyramidal cells." },
  aspiny: { label: "Aspiny", blurb: "Smooth dendrites without spines. Almost always inhibitory interneurons." },
  "sparsely spiny": { label: "Sparsely spiny", blurb: "A few spines. Usually inhibitory; a mixed group." },
};

function decorate(r) {
  const parent = r.structure_parent__acronym || r.structure__acronym || "";
  return {
    id: r.specimen__id,
    name: r.specimen__name,
    species: r.donor__species === "Homo Sapiens" ? "Human" : "Mouse",
    age: r.donor__age,
    sex: r.donor__sex,
    disease: r.donor__disease_state,
    regionCode: parent,
    region: REGIONS[parent] || parent,
    structure: (r.structure__name || "").replace(/"/g, ""),
    layer: r.structure__layer || "",
    hemisphere: r.specimen__hemisphere,
    dendrite: r.tag__dendrite_type || "",
    apical: r.tag__apical,
    line: r.line_name || "",
    reporter: r.cell_reporter_status,
    family: familyOf(r.line_name, r.cell_reporter_status),
    nwbId: r.erwkf__id,
    hasMorph: Boolean(r.nrwkf__id),
    morphThumb: r.morph_thumb_path,
    ephysThumb: r.ephys_thumb_path,
    depth: r.csl__normalized_depth,
    f: {
      vrest: r.ef__vrest,
      ri: r.ef__ri,
      tau: r.ef__tau,
      rheobase: r.ef__threshold_i_long_square,
      fislope: r.ef__f_i_curve_slope,
      rate: r.ef__avg_firing_rate,
      isi: r.ef__avg_isi,
      adapt: r.ef__adaptation,
      updown: r.ef__upstroke_downstroke_ratio_long_square,
      trough: r.ef__fast_trough_v_long_square,
      ramp: r.ef__peak_t_ramp,
      reach: r.nr__max_euclidean_distance,
      branches: r.nr__number_bifurcations,
      stems: r.nr__number_stems,
    },
  };
}

// Feature definitions shared by the cell page, table, and compare view.
export const FEATURES = [
  { key: "vrest", label: "Resting potential", unit: "mV", digits: 1, term: "resting-potential",
    explain: "Membrane voltage with no current injected." },
  { key: "ri", label: "Input resistance", unit: "MΩ", digits: 0, term: "input-resistance",
    explain: "How much the voltage changes per unit of injected current. Small cells tend to be higher." },
  { key: "tau", label: "Membrane time constant", unit: "ms", digits: 1, term: "time-constant",
    explain: "How quickly the membrane charges. Larger means slower." },
  { key: "rheobase", label: "Rheobase", unit: "pA", digits: 0, term: "rheobase",
    explain: "Smallest 1 s current step that made the cell fire." },
  { key: "fislope", label: "F–I slope", unit: "Hz/pA", digits: 3, term: "fi-curve",
    explain: "How much the firing rate rises for each extra pA of current." },
  { key: "rate", label: "Average firing rate", unit: "Hz", digits: 1, term: "firing-rate",
    explain: "Mean spike rate on a strong long square step." },
  { key: "isi", label: "Average ISI", unit: "ms", digits: 1, term: "isi",
    explain: "Mean time between spikes on that same step." },
  { key: "adapt", label: "Adaptation index", unit: "", digits: 3, term: "adaptation-index",
    explain: "Allen's measure of slowing. Near 0 is steady firing; positive means the cell slows down." },
  { key: "updown", label: "Upstroke/downstroke", unit: "", digits: 2, term: "upstroke-downstroke",
    explain: "Spike shape. Fast-spiking cells repolarize fast, giving low values (under ~2)." },
  { key: "trough", label: "Fast trough", unit: "mV", digits: 1, term: "trough",
    explain: "Lowest voltage right after a spike." },
];
export const FEATURE = Object.fromEntries(FEATURES.map((f) => [f.key, f]));

export function fmt(v, digits = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const s = Number(v).toFixed(digits);
  return s.replace("-", "−");
}
