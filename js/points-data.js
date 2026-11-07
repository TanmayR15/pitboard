/* Points tables for the points guide. */
const TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const POINT_TABLES = [
  { id: "sprint", title: "Sprint Cup", sub: "1-hour races, two per round. Points count for every race.", c: "var(--c-sprint)",
    pts: [16.5, 12, 9.5, 7.5, 6, 4, 3, 2, 1, 0.5], pole: "1 point per pole", max: 2 * (16.5 + 1), maxNote: "both races + 2 poles",
    note: "Used at the Sprint rounds." },
  { id: "e3", title: "Endurance, 3 hours", sub: "One race per round, 3-hour distance", c: "var(--c-endurance)",
    pts: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], pole: "1 point for pole", max: 26, maxNote: "win + pole",
    note: "Monza, Nürburgring and Portimão." },
  { id: "e6", title: "Endurance, 6 hours", sub: "One race per round, 6-hour distance", c: "var(--c-endurance)",
    pts: [33, 24, 19, 15, 12, 9, 6, 4, 2, 1], pole: "1 point for pole", max: 34, maxNote: "win + pole",
    note: "Paul Ricard." },
  { id: "spa", title: "24 Hours of Spa", sub: "Points at 6 hours, 12 hours and the finish", c: "var(--c-long)",
    cols: ["6 hrs", "12 hrs", "Finish"], multi: [[12, 9, 7, 6, 5, 4, 3, 2, 1, 0], [12, 9, 7, 6, 5, 4, 3, 2, 1, 0], [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]],
    pole: "Super Pole: 3, 2 and 1 points", max: 12 + 12 + 25 + 3, maxNote: "all three + Super Pole",
    note: "The biggest points haul of the season." },
];

const F1_TABLES = [
  { id: "gp", title: "Grand Prix", sub: "The Sunday race. Top 10 score.", c: "var(--c-endurance)",
    pts: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], max: 25, maxNote: "a win", note: "Every round." },
  { id: "sprint", title: "Sprint", sub: "The short Saturday race. Top 8 score.", c: "var(--c-sprint)",
    pts: [8, 7, 6, 5, 4, 3, 2, 1], max: 8, maxNote: "a win", note: "Sprint weekends only." },
];
const WEC_TABLES = [
  { id: "r6", title: "6-hour races", sub: "The usual race length. Top 10 score.", c: "var(--c-endurance)",
    pts: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], pole: "1 point for pole", max: 26, maxNote: "win + pole",
    note: "Imola, Spa, São Paulo, Lone Star Le Mans, Fuji, Barcelona and Monza." },
  { id: "lm", title: "24 Hours of Le Mans", sub: "Double-length race, the biggest points haul", c: "var(--c-long)",
    pts: [50, 36, 30, 24, 20, 16, 12, 8, 4, 2], pole: "1 point for pole", max: 51, maxNote: "win + pole",
    note: "Worth twice as much as a normal round." },
];
const POINT_GUIDES = {
  gtwc: { tables: POINT_TABLES },
  wec: { tables: WEC_TABLES,
    intro: "How the championship points are awarded. Hypercar and LMGT3 are scored separately, each with the same scale for its own class positions.",
    legend: [["var(--c-endurance)", "6 hours"], ["var(--c-long)", "24 hours"], ["var(--c-hypercar)", "Hypercar"], ["var(--c-lmgt3)", "LMGT3"]],
    rules: ["Points are awarded for class positions, and the winner of each class gets the top score.",
      "One bonus point goes to the pole position of each class.",
      "Hypercar manufacturers score with the two best-placed cars of each brand in a race.",
      "LMGT3 has its own teams' and drivers' trophies. Hypercar has a drivers' title and a manufacturers' title.",
      "Scales shown are the ones used in the 2026 standings. Longer races, such as an 8-hour round, may use a different scale. Check the official regulations for the final word."] },
  f1: { tables: F1_TABLES,
    intro: "How the championship points are awarded. Each driver scores for the drivers' title, and a constructor adds up the points of both its cars.",
    legend: [["var(--c-endurance)", "Grand Prix"], ["var(--c-sprint)", "Sprint"]],
    rules: ["Sprint points are only awarded on sprint weekends, on top of the Grand Prix points.",
      "There is no point for pole position or for the fastest lap.",
      "The drivers' champion is the driver with the most points; constructors are ranked on the combined points of their cars.",
      "Source: published Formula 1 scoring rules. Check the official regulations for the final word."] },
};
function fmtPts(v) { return Number.isInteger(v) ? String(v) : v.toFixed(1); }
