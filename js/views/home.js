/* ==========================================================================
   Home
   One layout replaces the old "arcade" and "paddock" styles:
   next-race band -> countdown + sessions up next -> season rounds -> top of the standings
   ========================================================================== */

function shortRound(r) { return (r.name || "").replace(/^CrowdStrike 24 Hours of /i, "24H ").replace(/^Circuit (?!de )/i, ""); }

function homeFacts() {
  const now = nowMs();
  const rounds = scheduleRounds();
  const nxt = nextRound(now);
  const tables = (state.standings || {}).tables || {};
  const all = (((tables.overall || {})[curSeries().classes[0]] || {}));
  return { now, rounds, nxt, doneCount: rounds.filter((r) => roundStatus(r, now) === "done").length,
    target: nxt ? countdownTarget(nxt, now) : null, drivers: (all.drivers || []).slice(0, 5), teams: (all.teams || []).slice(0, 5) };
}

function cupColor(r) {
  const c = roundCup(r);
  return c === "sprint" ? "var(--c-sprint)" : (c === "endurance" ? "var(--c-endurance)" : "");
}

function renderHome() {
  const f = homeFacts();
  const root = el("div", { class: "bleed" });
  const isLive = !!(f.nxt && roundStatus(f.nxt, f.now) === "live");

  /* ---- band: the one place the accent fills a whole row ---- */
  root.appendChild(el("div", { class: "week-band" }, [el("div", { class: "wrap" }, [
    el("div", { class: "week-label" }, [
      el("span", { class: "dot" + (isLive ? " live" : "") }),
      isLive ? "Race weekend live" : (f.nxt ? "Next race" : (f.rounds.length ? "Season complete" : "Schedule")),
    ]),
    el("span", { class: "panel-sub", text: f.nxt ? `Round ${f.nxt.round} of ${f.rounds.length}` : (f.rounds.length ? `${f.rounds.length} rounds finished` : "") }),
  ])]));

  const main = el("div", { class: "wrap page" });
  root.appendChild(main);

  if (!f.rounds.length) {
    main.appendChild(emptyPanel("Schedule not loaded yet. It appears after the next scheduled update."));
  } else {
    /* ---- countdown + sessions up next ---- */
    const cols = el("div", { class: "home-cols" });
    const left = el("div");
    if (!f.nxt) {
      left.appendChild(el("h2", { class: "next-name", text: "See you next season" }));
      left.appendChild(el("p", { class: "next-meta", text: "Every round of the season has finished." }));
    } else {
      left.appendChild(el("h2", { class: "next-name" }, [f.nxt.name, cupTag(f.nxt)]));
      left.appendChild(el("p", { class: "next-meta", text: `${f.nxt.country || ""}${f.nxt.country ? ", " : ""}${rangeLabel(f.nxt)}` }));
      if (f.target) {
        const cells = {};
        const row = el("div", { class: "count", role: "timer", "aria-label": "Time until " + f.target.label });
        [["d", "days"], ["h", "hours"], ["m", "min"], ["s", "sec"]].forEach(([k, lab]) => {
          const b = el("b", { text: "00" }); cells[k] = b;
          row.appendChild(el("div", { class: "count-cell" }, [b, el("span", { text: lab })]));
        });
        left.appendChild(row);
        left.appendChild(el("p", { class: "count-target" }, ["Until ", el("b", { text: f.target.label }), ` on ${istDayLabel(f.target.ms)} at ${istTime(f.target.ms)} IST`]));
        const tick = () => {
          const c = splitCountdown(f.target.ms - nowMs());
          cells.d.textContent = pad2(c.d); cells.h.textContent = pad2(c.h); cells.m.textContent = pad2(c.m); cells.s.textContent = pad2(c.s);
        };
        tick(); state.timer = setInterval(tick, 1000);
      }
    }
    cols.appendChild(left);

    const right = el("div");
    right.appendChild(el("div", { class: "label upnext-title", text: "Sessions up next (IST)" }));
    const up = f.nxt ? (f.nxt.sessions || []).filter((x) => sessionMs(x) > f.now).sort((a, b) => sessionMs(a) - sessionMs(b)).slice(0, 4) : [];
    if (up.length) {
      const list = el("ul", { class: "upnext" });
      up.forEach((x) => list.appendChild(el("li", {}, [
        kindBadge(x.kind),
        el("div", {}, [el("div", { class: "u-name", text: x.name }), el("div", { class: "u-when", text: `${istDayLabel(sessionMs(x))}, ${istTime(sessionMs(x))}` })]),
      ])));
      right.appendChild(list);
    } else {
      right.appendChild(el("div", { class: "empty", text: f.nxt ? "No more sessions left this weekend." : "Nothing scheduled." }));
    }
    if (f.nxt) {
      right.appendChild(el("div", { class: "upnext-foot" }, [el("button", { class: "week-link", type: "button", text: "Full schedule", onclick: () => openSchedule(f.nxt.round) })]));
    }
    cols.appendChild(right);
    main.appendChild(cols);

    /* ---- season: one tile per round ---- */
    const season = panel("Season", `${f.doneCount} of ${f.rounds.length} rounds done`);
    season.appendChild(el("div", { class: "meter", "aria-hidden": "true" }, [el("i", { style: `width:${Math.round((f.doneCount / f.rounds.length) * 100)}%` })]));
    const grid = el("div", { class: "rounds-grid" });
    f.rounds.forEach((r) => {
      const st = roundStatus(r, f.now);
      const cls = st === "done" ? "done" : (f.nxt && f.nxt.round === r.round ? "now" : "");
      const col = cupColor(r);
      grid.appendChild(el("button", { class: ("rtile " + cls).trim(), type: "button", style: col ? `--c:${col}` : "", onclick: () => openSchedule(r.round) }, [
        el("span", { class: "rn", text: `Round ${r.round}` }),
        el("span", { class: "rt", text: shortRound(r) }),
      ]));
    });
    season.appendChild(grid);
    season.appendChild(el("div", { class: "legend" }, [
      el("span", {}, [el("i", { style: "--c:var(--c-sprint)" }), tagLabel("sprint")]),
      el("span", {}, [el("i", { style: "--c:var(--c-endurance)" }), tagLabel("endurance")]),
      el("span", { text: "A tick marks a finished round." }),
    ]));
    main.appendChild(season);
  }

  /* ---- championship snapshot ---- */
  const clsInfo = CLASSES.find((c) => c.key === curSeries().classes[0]);
  const teamsLabel = (state.series === "wec" && curSeries().classes[0] === "hypercar") ? "Manufacturers" : "Teams";
  const board = (title, rows, withTeam) => {
    const p = panel(title, clsInfo ? clsInfo.label : "");
    const lead = rows.length ? (rows[0].total || 1) : 1;
    rows.forEach((d, i) => {
      const team = withTeam ? (state.teamByDriver[normName(d.name)] || "") : "";
      p.appendChild(el("div", { class: "board-row p" + (i + 1) }, [
        el("div", { class: "fill", style: `width:${Math.max(4, Math.round(((d.total || 0) / lead) * 100))}%` }),
        el("div", { class: "b-pos", text: String(i + 1) }),
        el("div", { class: "b-name" }, [d.name, team ? el("small", { text: team }) : null]),
        el("div", { class: "b-pts", text: fmtPoints(d.total || 0) }),
      ]));
    });
    return p;
  };
  if (f.drivers.length || f.teams.length) {
    const snap = el("div", { class: "snap-grid" });
    if (f.drivers.length) snap.appendChild(board("Drivers", f.drivers, true));
    if (f.teams.length) snap.appendChild(board(teamsLabel, f.teams, false));
    main.appendChild(snap);
    main.appendChild(el("div", {}, [el("button", { class: "week-link", type: "button", text: "Full standings", onclick: () => go("standings") })]));
  }
  return root;
}
