/* Names, sessions, classes, DOM helper. Logic carried over unchanged from the original index.html. */
/* ---------- helpers for names, sessions, classes ---------- */
// Car numbers and line-ups from the race results.
//  driverCar: driver -> {car, team, cls} from their most recent result.
//  teamCars:  team  -> [{car, cls, drivers:[...]}] using the latest line-up each car number had for that team.
function buildEntryMaps(results) {
  const driverCar = {}, teams = {};
  const rounds = (results.rounds || []).slice().sort((a, b) => (a.round || 0) - (b.round || 0));
  rounds.forEach((round) => (round.sessions || []).forEach((sess) => (sess.rows || []).forEach((row) => {
    const names = (row.drivers || "").split(/,\s*/).map((x) => x.trim()).filter(Boolean);
    if (!names.length || !row.car) return;
    names.forEach((n) => { driverCar[normName(n)] = { car: String(row.car), team: row.team || "", cls: row.cls || "" }; });
    if (row.team) {
      const tk = normName(row.team);
      (teams[tk] = teams[tk] || {})[String(row.car)] = { car: String(row.car), cls: row.cls || "", drivers: names };
    }
  })));
  const teamCars = {};
  Object.keys(teams).forEach((k) => {
    teamCars[k] = Object.values(teams[k]).sort((a, b) => (parseInt(a.car, 10) || 0) - (parseInt(b.car, 10) || 0));
  });
  return { driverCar, teamCars };
}
function classMatches(entryCls) {          // is this car in the class table being shown?
  if (state.cls === "overall" || !entryCls) return true;
  return normName(entryCls).startsWith(state.cls);
}
// Cars for a standings team row. Exact name first, then a name that contains the other (WEC manufacturers).
function carsForTeam(name) {
  const maps = state.entryMaps || { teamCars: {} }, k = normName(name);
  let cars = maps.teamCars[k];
  if (!cars && k.length >= 3) {
    cars = [];
    Object.keys(maps.teamCars).forEach((tk) => {
      const a = " " + tk + " ", b = " " + k + " ";
      if (a.includes(b) || b.includes(a)) cars = cars.concat(maps.teamCars[tk]);
    });
    const seen = {};      // the same car can sit under two spellings of a team name: keep it once
    cars = cars.filter((c) => (seen[c.car] ? false : (seen[c.car] = true)));
  }
  return (cars || []).filter((c) => classMatches(c.cls));
}
function normName(s) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\u00f8/g, "o").replace(/\u00e6/g, "ae").replace(/\u0153/g, "oe")
    .replace(/\u00df/g, "ss").replace(/\u0142/g, "l").replace(/\u0111/g, "d")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
// Every word typed must appear somewhere in the searched fields (ignores capitals and accents).
function matchesQuery(query, ...fields) {
  const words = normName(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const hay = normName(fields.filter(Boolean).join(" "));
  return words.every((w) => hay.includes(w));
}
// Driver -> entry name from their most recent race result. Race results are the
// only place team names exist for drivers (the official driver standings omit them).
function buildTeamMap(results) {
  const map = {};
  const rounds = (results.rounds || []).slice().sort((a, b) => (a.round || 0) - (b.round || 0));
  rounds.forEach((round) => (round.sessions || []).forEach((sess) => (sess.rows || []).forEach((row) => {
    if (!row.team) return;
    (row.drivers || "").split(/,\s*/).forEach((d) => { const k = normName(d); if (k) map[k] = row.team; });
  })));
  return map;
}
// Interim snapshots of long races, e.g. "Main Race after 23h 30".
function isInterim(s) {
  const re = /after[\s-]+\d+\s*[h:\s-]\s*30/i;
  return re.test(s.name || "") || re.test(s.id || "");
}
// Points checkpoints at the 24 Hours of Spa, e.g. "Main Race after 6 hours".
function isCheckpoint(s) {
  return !isInterim(s) && /after[\s-]+\d+\s*(hours?|hrs?|h)\b/i.test((s.name || "") + " " + (s.id || ""));
}
// Opening choice for a round: its first race, preferring one called "Main Race".
function defaultSessionId(round) {
  const sessions = round.sessions || [];
  const finals = sessions.filter((s) => !isInterim(s) && !isCheckpoint(s));
  const main = finals.find((s) => /^main race$/i.test((s.name || "").trim()) || s.id === "main-race");
  const pick = main || finals[0] || sessions[0];
  return pick ? pick.id : null;
}
const CLASS_ORDER = ["pro cup", "pro-am cup", "gold cup", "silver cup", "bronze cup", "pro", "gold", "silver", "bronze", "pro-am", "am"];
function sortClasses(list) {
  const rank = (c) => { const i = CLASS_ORDER.indexOf(c.toLowerCase()); return i === -1 ? 99 : i; };
  return list.slice().sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/* ---------- tiny DOM helper ---------- */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "style") node.setAttribute("style", v);
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}
function fmtPoints(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
