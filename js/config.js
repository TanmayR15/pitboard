/* ==========================================================================
   Config + app state
   Same structure and behaviour as the original; colours now point at the
   design tokens in css/tokens.css and labels are sentence case (the CSS adds
   capitals where the design calls for them).
   ========================================================================== */

const CUPS = [
  { key: "overall",   label: "Overall",       accent: "var(--text)" },
  { key: "sprint",    label: "Sprint Cup",    accent: "var(--c-sprint)" },
  { key: "endurance", label: "Endurance Cup", accent: "var(--c-endurance)" },
];

// Class colours drive the left edge of each table and the class filter chips.
const CLASSES = [
  { key: "overall",     label: "Overall",         accent: "var(--text)" },
  { key: "gold",        label: "Gold",            accent: "var(--c-gold)" },
  { key: "silver",      label: "Silver",          accent: "var(--c-silver)" },
  { key: "bronze",      label: "Bronze",          accent: "var(--c-bronze)" },
  { key: "hypercar",    label: "Hypercar",        accent: "var(--c-hypercar)" },
  { key: "lmgt3",       label: "LMGT3",           accent: "var(--c-lmgt3)" },
  { key: "independent", label: "Independent Cup", accent: "var(--c-independent)" },
];

const CLASS_STYLE = {   // race-result class names -> colour
  "all":         { accent: "var(--text)" },
  "pro cup":     { accent: "var(--text)" },
  "gold cup":    { accent: "var(--c-gold)" },
  "silver cup":  { accent: "var(--c-silver)" },
  "bronze cup":  { accent: "var(--c-bronze)" },
  "pro-am cup":  { accent: "var(--c-pro-am)" },
  "hypercar":    { accent: "var(--c-hypercar)" },
  "lmgt3":       { accent: "var(--c-lmgt3)" },
  "pro":         { accent: "var(--text)" },
  "gold":        { accent: "var(--c-gold)" },
  "silver":      { accent: "var(--c-silver)" },
  "bronze":      { accent: "var(--c-bronze)" },
  "pro-am":      { accent: "var(--c-pro-am)" },
  "am":          { accent: "var(--c-lmgt3)" },
  "independent": { accent: "var(--c-independent)" },
};
function classStyle(label) { return CLASS_STYLE[(label || "").toLowerCase()] || CLASS_STYLE["all"]; }

const ENTITIES = [
  { key: "drivers", label: "Drivers" },
  { key: "teams",   label: "Teams" },
];

// Series the site can show. GTWC keeps its files in data/; the others use their own folder.
const SERIES = [
  { id: "gtwc", label: "GTWC Europe", dir: "data", cups: ["overall", "sprint", "endurance"], classes: ["overall", "gold", "silver", "bronze"],
    tags: { sprint: "Sprint Cup", endurance: "Endurance Cup" } },
  { id: "f1",   label: "Formula 1",   dir: "data/f1", cups: ["overall"], classes: ["overall"],
    tags: { sprint: "Sprint weekend", endurance: "Grand Prix" } },
  { id: "wec",  label: "WEC",         dir: "data/wec", cups: ["overall"], classes: ["hypercar", "lmgt3"], resultClass: "Hypercar",
    tags: { sprint: "Sprint", endurance: "Race" } },
];
function seriesInfo(id) { return SERIES.find((x) => x.id === id) || SERIES[0]; }
function curSeries() { return seriesInfo(state.series); }
// Only the championships and classes the current series has.
function cupList() { return CUPS.filter((c) => curSeries().cups.includes(c.key)); }
function classList() { return CLASSES.filter((c) => curSeries().classes.includes(c.key)); }
function tagLabel(key) { return curSeries().tags[key] || key; }
// Standings entities. In the WEC the Hypercar "teams" table is the manufacturers' championship.
function entList() {
  return ENTITIES.map((e) => (e.key === "teams" && (state.series === "wec" && state.cls === "hypercar"))
    ? { key: "teams", label: "Manufacturers" } : e);
}
function isGtwc() { return state.series === "gtwc"; }
function initialSeries() {
  try {
    const q = new URLSearchParams(location.search).get("series");
    if (q && SERIES.some((x) => x.id === q)) return q;
    const v = localStorage.getItem("gtwcSeries");
    if (v && SERIES.some((x) => x.id === v)) return v;
  } catch (e) { /* storage blocked: use the default */ }
  return "gtwc";
}

const state = {
  series: initialSeries(), noData: false,
  page: "home",               // "home" | "standings" | "results" | "schedule" | "points" | "progress"
  cup: "overall", cls: seriesInfo(initialSeries()).classes[0], entity: "drivers",
  roundId: null, sessionId: null, resultClass: seriesInfo(initialSeries()).resultClass || "ALL",
  stdQuery: "", resQuery: "",
  standings: null, results: null, history: null, error: null,
  teamByDriver: {}, entryMaps: null, schedule: null, schedOpen: new Set(), timer: null,
};
