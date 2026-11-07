/* ==========================================================================
   Standings + points progression
   ========================================================================== */

function standingsControls() {
  const cup = CUPS.find((c) => c.key === state.cup);
  const cls = CLASSES.find((c) => c.key === state.cls);
  return [
    cupList().length > 1 ? selectField("Championship", cupList(), state.cup, cup.accent, (k) => { state.cup = k; render(); }) : null,
    classList().length > 1 ? selectField("Class", classList(), state.cls, cls.accent, (k) => { state.cls = k; render(); }) : null,
    toggleField("Show", entList(), state.entity, (k) => { state.entity = k; render(); }),
  ];
}
function tableSub(cup, cls) {
  const parts = [cupList().length > 1 ? cup.label : "", classList().length > 1 ? cls.label : ""].filter(Boolean);
  return parts.filter((p, i) => parts.indexOf(p) === i).join(", ");
}

function renderStandings() {
  const wrap = el("div");

  const cup = CUPS.find((c) => c.key === state.cup);
  const cls = CLASSES.find((c) => c.key === state.cls);
  const ent = entList().find((e) => e.key === state.entity);
  const rows = (((state.standings.tables || {})[state.cup] || {})[state.cls] || {})[state.entity] || [];
  const teamOf = (r) => r.team || state.teamByDriver[normName(r.name)] || "";
  const carOf = (r) => { const m = state.entryMaps && state.entryMaps.driverCar[normName(r.name)]; return m ? m.car : ""; };
  const crewOf = (r) => carsForTeam(r.name);
  const crewText = (r) => crewOf(r).map((c) => c.car + " " + c.drivers.join(" ")).join(" ");
  // WEC driver names already start with the car number, so no extra column there.
  const numbered = rows.some((r) => /^#/.test(r.name || ""));
  const isDrivers = ent.key === "drivers";

  const holder = el("div");
  const paint = () => {
    holder.innerHTML = "";
    const shown = rows.filter((r) => matchesQuery(state.stdQuery, r.name, isDrivers ? teamOf(r) + " " + carOf(r) : crewText(r)));
    const box = panel(`${ent.label} championship`, tableSub(cup, cls), cls.accent);

    if (rows.length === 0) {
      box.appendChild(el("div", { class: "empty", text: "No data yet for this table. It fills in after the next scheduled update." }));
    } else if (shown.length === 0) {
      box.appendChild(el("div", { class: "empty", text: "No names match your search." }));
    } else {
      const body = shown.map((r) => el("tr", { class: r.pos <= 3 ? "p" + r.pos : "" }, [
        el("td", { class: "pos", text: String(r.pos) }),
        isDrivers && !numbered ? el("td", { class: "sub hide-sm" }, carOf(r) ? [el("span", { class: "carno", text: "#" + carOf(r) })] : []) : null,
        el("td", { class: "name", text: r.name }),
        isDrivers ? el("td", { class: "sub", text: teamOf(r) })
          : el("td", { class: "sub crew" }, crewOf(r).map((c) => el("div", {}, [el("b", { text: "#" + c.car }), " " + c.drivers.join(", ")]))),
        el("td", { class: "num", text: fmtPoints(r.total) }),
      ]));
      box.appendChild(dataTable([
        { text: "Pos" },
        isDrivers && !numbered ? { text: "No.", hide: true } : null,
        { text: isDrivers ? "Driver" : "Team" },
        { text: isDrivers ? "Team" : "Drivers" },
        { text: "Pts", num: true },
      ], body));
    }
    if (state.stdQuery.trim() && rows.length) box.appendChild(note(`Showing ${shown.length} of ${rows.length}. Positions are the official ones.`));
    if (state.series === "wec") {
      box.appendChild(note(state.cls === "hypercar" && ent.key === "teams"
        ? "Manufacturers: a manufacturer scores with its two best-placed cars in each race."
        : "Each crew is listed by car number and driver surnames. A driver who shared cars in different races has a separate line."));
    }
    if (isGtwc()) box.appendChild(note("Overall is the Pro-inclusive table. The official site does not publish a separate Pro table."));
    if (isDrivers && isGtwc()) box.appendChild(note("Team is the entry name from the driver's most recent race result. The official driver standings do not list teams."));
    holder.appendChild(box);
  };

  wrap.appendChild(pageControls(standingsControls().concat([
    searchField(state.stdQuery, isDrivers ? "Search driver, team or number" : "Search team or driver", (q) => { state.stdQuery = q; paint(); }),
  ])));
  paint();
  wrap.appendChild(holder);
  wrap.className = "stack";
  return wrap;
}

/* ---------- progression ---------- */
function renderProgression() {
  const wrap = el("div", { class: "stack" });
  const cup = CUPS.find((c) => c.key === state.cup);
  const cls = CLASSES.find((c) => c.key === state.cls);
  const ent = entList().find((e) => e.key === state.entity);
  const rows = (((state.standings.tables || {})[state.cup] || {})[state.cls] || {})[state.entity] || [];
  wrap.appendChild(pageControls(standingsControls()));
  if (!rows.length) {
    wrap.appendChild(emptyPanel("No data yet for this table. It fills in after the next scheduled update."));
    return wrap;
  }
  wrap.appendChild(renderProgress(rows, ent.key));

  // table: points earned in each round
  const hist = state.history && state.history.snapshots ? state.history.snapshots : [];
  const key = state.cup + "/" + state.cls;
  const snaps = hist.filter((h) => h.tables && h.tables[key] && h.tables[key][ent.key]);
  const box = panel("Points earned in each round", tableSub(cup, cls) ? `${ent.label}, ${tableSub(cup, cls)}` : ent.label, cls.accent);
  if (!snaps.length) {
    box.appendChild(el("div", { class: "empty", text: "No history for this table yet. It builds up after each round." }));
    wrap.appendChild(box);
    return wrap;
  }
  const body = rows.map((r) => {
    const k = normName(r.name);
    let prevTotal = 0, last = null;
    const cells = snaps.map((h) => {
      const v = h.tables[key][ent.key][k];
      if (v == null) return el("td", { class: "num muted", text: "-" });
      const earned = Math.round((v - prevTotal) * 100) / 100;
      prevTotal = v; last = v;
      return el("td", { class: "num", text: fmtPoints(earned) });
    });
    cells.push(el("td", { class: "num", style: "font-weight:700", text: last == null ? "-" : fmtPoints(last) }));
    return el("tr", { class: r.pos <= 3 ? "p" + r.pos : "" }, [
      el("td", { class: "pos", text: String(r.pos) }),
      el("td", { class: "name", text: r.name }),
    ].concat(cells));
  });
  box.appendChild(dataTable(
    [{ text: "Pos" }, { text: ent.key === "drivers" ? "Driver" : "Team" }]
      .concat(snaps.map((h) => ({ text: "R" + h.round + (h.estimated ? "*" : ""), num: true, title: h.name || "" })))
      .concat([{ text: "Total", num: true }]),
    body));
  box.appendChild(note(snaps.some((h) => h.estimated)
    ? "Points earned in each round (the change in the championship total). * = estimated from race results (poles and class rules not included); other rounds are the official standings."
    : "Points earned in each round, worked out from the official standings. Total is the current championship total."));
  wrap.appendChild(box);
  return wrap;
}

// ---- points progression chart ----
const PP_COLORS = ["var(--accent)", "var(--c-lmgt3)", "var(--c-gold)", "var(--c-endurance)", "var(--c-hypercar)", "var(--text)", "var(--c-silver)", "var(--c-bronze)"];
function escXml(t) { return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function renderProgress(rows, entKey) {
  const box = panel("Points progression", "Top 8 of this table", "var(--accent)");
  const hist = state.history && state.history.snapshots ? state.history.snapshots : [];
  const key = state.cup + "/" + state.cls;
  const snaps = hist.filter((h) => h.tables && h.tables[key] && h.tables[key][entKey]);
  const top = rows.slice(0, 8);
  if (!snaps.length || !top.length) {
    box.appendChild(el("div", { class: "empty", text: "No history for this table yet. It builds up after each round." }));
    return box;
  }
  const series = top.map((r, i) => ({
    name: r.name, color: PP_COLORS[i % PP_COLORS.length],
    pts: snaps.map((h) => { const v = h.tables[key][entKey][normName(r.name)]; return v == null ? 0 : v; }),
  }));
  const W = 800, H = 330, L = 44, R = 200, T = 16, B = 32;
  const maxV = Math.max(1, ...series.flatMap((s) => s.pts));
  const step = maxV <= 40 ? 10 : maxV <= 100 ? 20 : maxV <= 250 ? 50 : 100;
  const yMax = Math.ceil(maxV / step) * step;
  const xAt = (i) => L + (snaps.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (snaps.length - 1));
  const yAt = (v) => T + (H - T - B) * (1 - v / yMax);
  let g = "";
  for (let v = 0; v <= yMax; v += step) {
    g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${yAt(v)}" y2="${yAt(v)}"/>` +
         `<text x="${L - 8}" y="${yAt(v) + 4}" text-anchor="end">${v}</text>`;
  }
  snaps.forEach((h, i) => { g += `<text x="${xAt(i)}" y="${H - 8}" text-anchor="middle">R${h.round}${h.estimated ? "*" : ""}</text>`; });
  const ends = [];
  series.forEach((s) => {
    for (let i = 1; i < snaps.length; i++) {
      g += `<line x1="${xAt(i - 1)}" y1="${yAt(s.pts[i - 1])}" x2="${xAt(i)}" y2="${yAt(s.pts[i])}" style="stroke:${s.color}" stroke-width="2"` +
           `${snaps[i].estimated ? ' stroke-dasharray="6 4"' : ""}/>`;
    }
    s.pts.forEach((v, i) => { g += `<circle cx="${xAt(i)}" cy="${yAt(v)}" r="3" style="fill:${s.color}"/>`; });
    ends.push({ s, y: yAt(s.pts[s.pts.length - 1]) });
  });
  // end labels, nudged so they do not overlap
  ends.sort((a, b) => a.y - b.y);
  let prev = -99;
  ends.forEach((e) => { e.ly = Math.max(e.y, prev + 16); prev = e.ly; });
  ends.forEach((e) => {
    const short = entKey === "drivers" ? e.s.name.split(" ").slice(-1)[0] : e.s.name;
    g += `<text class="lab" x="${W - R + 12}" y="${e.ly + 4}" style="fill:${e.s.color}">${escXml(short.length > 13 ? short.slice(0, 12) + "." : short)} ${fmtPoints(e.s.pts[e.s.pts.length - 1])}</text>`;
  });
  const wrap = el("div", { class: "pp-wrap" });
  wrap.innerHTML = `<svg class="pp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Points progression chart">${g}</svg>`;
  box.appendChild(wrap);
  box.appendChild(el("div", { class: "pp-legend" }, series.map((s) => el("span", {}, [el("i", { style: "background:" + s.color }), s.name]))));
  box.appendChild(note(snaps.some((h) => h.estimated)
    ? "* and dashed lines: estimated from race results (poles and class rules not included). Rounds without an asterisk are the official standings."
    : "Using the official standings after each round."));
  return box;
}
