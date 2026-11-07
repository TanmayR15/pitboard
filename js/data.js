/* Data loading and series switching. Logic carried over unchanged from the original index.html. */
/* ---------- data loading ---------- */
async function loadData() {
  const mine = state.series;
  const dir = seriesInfo(mine).dir;
  const stale = () => state.series !== mine;      // the visitor switched series while this was loading
  try {
    const [s, r] = await Promise.all([
      fetch(dir + "/standings.json", { cache: "no-cache" }).then((x) => { if (!x.ok) throw new Error("standings.json " + x.status); return x.json(); }),
      fetch(dir + "/results.json", { cache: "no-cache" }).then((x) => { if (!x.ok) throw new Error("results.json " + x.status); return x.json(); }),
    ]);
    if (stale()) return;
    state.standings = s;
    state.results = r;
    // History and schedule are bonuses: the rest of the site still works without them.
    try {
      const hs = await fetch(dir + "/history.json", { cache: "no-cache" });
      if (hs.ok) state.history = await hs.json();
    } catch (e) { state.history = null; }
    try {
      const sc = await fetch(dir + "/schedule.json", { cache: "no-cache" });
      if (sc.ok) state.schedule = await sc.json();
    } catch (e) { state.schedule = null; }
    if (stale()) return;
    state.teamByDriver = buildTeamMap(r);
    state.entryMaps = buildEntryMaps(r);
    const rounds = (r.rounds || []);
    if (rounds.length) {
      const last = rounds[rounds.length - 1];
      state.roundId = last.id;                           // latest round by default
      state.sessionId = defaultSessionId(last);          // its first race
    }
  } catch (err) {
    if (stale()) return;
    if (mine === "gtwc") state.error = err.message;
    else state.noData = true;                            // other series: no data files yet
  }
  render();
}

function setSeries(id) {
  if (id === state.series) return;
  state.series = id;
  try { localStorage.setItem("gtwcSeries", id); } catch (e) { /* ignore */ }
  Object.assign(state, {
    standings: null, results: null, schedule: null, history: null, error: null, noData: false,
    roundId: null, sessionId: null, teamByDriver: {}, entryMaps: null, schedOpen: new Set(),
    cup: "overall", cls: seriesInfo(id).classes[0], entity: "drivers", stdQuery: "", resQuery: "", resultClass: seriesInfo(id).resultClass || "ALL",
  });
  render();          // shows "Loading..." straight away; the page the visitor is on stays the same
  loadData();
}
