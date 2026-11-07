/* ==========================================================================
   Schedule: one expandable card per round (raceweek's F1 page pattern)
   ========================================================================== */

// A session counts as finished once its end time has passed (or an hour after a start-only time).
function sessionDone(x, now) {
  const end = x.end_utc ? Date.parse(x.end_utc) : sessionMs(x) + 36e5;
  return now > end;
}

function renderSchedule() {
  const wrap = el("div", { class: "stack" });
  const now = nowMs();
  const rounds = scheduleRounds();
  if (!rounds.length) {
    wrap.appendChild(emptyPanel("No schedule yet. It appears after the next scheduled update."));
    return wrap;
  }
  const nxt = nextRound(now);
  const list = el("div");
  rounds.forEach((r) => {
    const st = roundStatus(r, now);
    const open = state.schedOpen.has(r.round);
    const isNext = nxt && nxt.round === r.round;
    const box = el("section", { class: "round" + (isNext ? " is-next" : "") + (st === "done" ? " is-done" : ""), id: "round-" + r.round });

    let status = el("span", { class: "status", text: "Done" });
    if (st === "live") status = el("span", { class: "status live" }, [el("span", { class: "dot live" }), "Live now"]);
    else if (st === "upcoming") {
      const n = dayDiff(roundStartMs(r), now);
      status = el("span", { class: "status" + (isNext ? " soon" : ""), text: n <= 0 ? "Today" : (n === 1 ? "In 1 day" : `In ${n} days`) });
    }
    box.appendChild(el("button", { class: "round-head", type: "button", "aria-expanded": String(open), onclick: () => {
      if (state.schedOpen.has(r.round)) state.schedOpen.delete(r.round); else state.schedOpen.add(r.round);
      render();
    } }, [
      el("span", { class: "chev", "aria-hidden": "true" }),
      el("span", { class: "r-no", text: `R${r.round}` }),
      el("span", { class: "r-main" }, [
        el("div", { class: "r-name" }, [r.name, cupTag(r)]),
        el("div", { class: "r-sub", text: r.country || "" }),
      ]),
      el("span", { class: "r-side" }, [status, el("span", { class: "r-date", text: rangeLabel(r) })]),
    ]));

    if (open) {
      const body = el("div", { class: "round-body" });
      const ss = (r.sessions || []).slice().sort((a, b) => sessionMs(a) - sessionMs(b));
      if (!ss.length) body.appendChild(el("div", { class: "day" }, [el("div", { class: "empty", text: "Session times are not published yet." })]));
      let day = null, lastDay = "";
      ss.forEach((x) => {
        const ms = sessionMs(x);
        const label = istDayLabel(ms);
        if (label !== lastDay) {
          day = el("div", { class: "day" }, [el("div", { class: "label day-head", text: label })]);
          body.appendChild(day); lastDay = label;
        }
        const when = istTime(ms) + (x.end_utc ? " - " + istTime(Date.parse(x.end_utc)) : "") + " IST";
        const k = KIND[x.kind];
        day.appendChild(el("div", { class: "srow" + (x.kind === "race" ? " race" : "") + (sessionDone(x, now) ? " done" : "") }, [
          el("span", { class: "dot", style: `--d:${k ? k.color : "var(--text-dim)"}` }),
          el("span", { class: "sname", text: x.name }),
          el("span", { class: "tag", style: k ? `--t-c:${k.color}` : "", text: k ? k.label : (x.kind || "Other") }),
          el("span", { class: "stime", text: when }),
        ]));
      });
      box.appendChild(body);
    }
    list.appendChild(box);
  });
  wrap.appendChild(list);
  return wrap;
}

/* ==========================================================================
   Points guide
   ========================================================================== */

function pgBar(v, max) {
  return el("div", { class: "pg-bar" }, [
    el("span", { text: fmtPts(v) }),
    el("div", { class: "track" }, [el("i", { style: "width:" + Math.round((v / max) * 100) + "%" })]),
  ]);
}

function pointsCard(t) {
  const rows = [];
  if (t.multi) {
    rows.push(el("div", { class: "pg-colh multi" }, [el("span", {})].concat(t.cols.map((c) => el("span", { text: c })))));
    TEN.forEach((p, i) => {
      rows.push(el("div", { class: "pg-row multi p" + p }, [el("div", { class: "pg-pos", text: String(p) })].concat(t.multi.map((col) => pgBar(col[i], 25)))));
    });
  } else {
    const top = t.pts[0];
    TEN.slice(0, t.pts.length).forEach((p, i) => {
      rows.push(el("div", { class: "pg-row p" + p }, [el("div", { class: "pg-pos", text: String(p) }), pgBar(t.pts[i], top)]));
    });
  }
  return el("div", { class: "pg-card", style: "--c:" + t.c }, [
    el("h3", { text: t.title }),
    el("div", { class: "pg-sub", text: t.sub }),
    el("div", { class: "pg-chips" }, [
      t.pole ? el("span", { class: "tag" }, ["Pole ", el("b", { text: t.pole })]) : null,
      el("span", { class: "tag" }, ["Max ", el("b", { text: fmtPts(t.max) + " (" + t.maxNote + ")" })]),
    ]),
    el("div", { class: "pg-rows" }, rows),
    el("div", { class: "pg-note", text: t.note }),
  ]);
}

function legendRow(items) {
  return el("div", { class: "legend" }, items.map(([c, t]) => el("span", {}, [el("i", { style: "--c:" + c }), t])));
}

function renderPoints() {
  const wrap = el("div", { class: "stack" });
  const guide = POINT_GUIDES[state.series];
  if (guide && guide.rules) {                              // a non-GTWC series with its own guide
    wrap.appendChild(el("div", { class: "panel" }, [el("div", { class: "pg-intro" }, [el("p", { text: guide.intro }), legendRow(guide.legend)])]));
    wrap.appendChild(el("div", { class: "pg-grid" }, guide.tables.map(pointsCard)));
    wrap.appendChild(el("div", { class: "panel" }, [el("ul", { class: "pg-rules" }, guide.rules.map((x) => el("li", { text: x })))]));
    return wrap;
  }
  wrap.appendChild(el("div", { class: "panel" }, [el("div", { class: "pg-intro" }, [
    el("p", { text: "How the championship points are awarded. Only the top 10 in each race score, and the Sprint and Endurance points are added together for the Overall title." }),
    legendRow([["var(--c-sprint)", "Sprint"], ["var(--c-endurance)", "Endurance"], ["var(--c-long)", "24H Spa"]]),
  ])]));
  wrap.appendChild(el("div", { class: "pg-grid" }, POINT_TABLES.map(pointsCard)));
  wrap.appendChild(el("div", { class: "panel" }, [el("ul", { class: "pg-rules" }, [
    el("li", { text: "A car must complete at least 75% of the winner's race distance to be classified and score." }),
    el("li", { text: "In Endurance races each driver must drive at least 25 minutes to earn points." }),
    el("li", { text: "Gold, Silver and Bronze are separate class championships based on driver categories. The tables above are the overall scale; class scoring follows the official regulations." }),
    el("li", { text: "Source: published 2026 season scoring tables. Check the official regulations for the final word." }),
  ])]));
  return wrap;
}
