/* ==========================================================================
   Results
   ========================================================================== */

function renderResults() {
  const wrap = el("div", { class: "stack" });
  const rounds = state.results.rounds || [];
  if (rounds.length === 0) {
    wrap.appendChild(emptyPanel("No race results yet."));
    return wrap;
  }
  const round = rounds.find((r) => r.id === state.roundId) || rounds[rounds.length - 1];
  const sessions = round.sessions || [];
  const session = sessions.find((s) => s.id === state.sessionId)
    || sessions.find((s) => s.id === defaultSessionId(round)) || sessions[0];

  /* ---- round + race pickers ---- */
  const roundSel = el("select", { class: "select", "aria-label": "Round", onchange: (e) => {
    state.roundId = e.target.value;
    const r = rounds.find((x) => x.id === state.roundId);
    state.sessionId = r ? defaultSessionId(r) : null;
    render();
  } });
  rounds.forEach((r) => {
    const o = el("option", { value: r.id, text: `R${r.round} ${r.name}${r.cup ? " (" + r.cup + ")" : ""}` });
    if (r.id === round.id) o.selected = true;
    roundSel.appendChild(o);
  });

  const controls = [labelled("Round", roundSel, "field sel")];

  if (session) {
    const idx = sessions.indexOf(session);
    const goTo = (i) => { state.sessionId = sessions[i].id; render(); };
    const raceSel = el("select", { class: "select", "aria-label": "Race", onchange: (e) => { state.sessionId = e.target.value; render(); } });
    sessions.forEach((s) => {
      const o = el("option", { value: s.id, text: s.name + (isCheckpoint(s) ? " (points checkpoint)" : "") });
      if (s === session) o.selected = true;
      raceSel.appendChild(o);
    });
    const prev = el("button", { class: "btn btn-step", type: "button", text: "<", "aria-label": "Previous race", onclick: () => goTo(idx - 1), ...(idx <= 0 ? { disabled: "" } : {}) });
    const next = el("button", { class: "btn btn-step", type: "button", text: ">", "aria-label": "Next race", onclick: () => goTo(idx + 1), ...(idx >= sessions.length - 1 ? { disabled: "" } : {}) });
    controls.push(labelled("Race", el("div", { class: "field-row" }, [
      prev, raceSel, next, el("span", { class: "panel-sub", text: `${idx + 1}/${sessions.length}` }),
    ]), "field grow"));
  }
  wrap.appendChild(pageControls(controls));

  if (!session) {
    wrap.appendChild(emptyPanel("No classification available for this round yet."));
    return wrap;
  }

  /* ---- class chips (the choice carries over when you change race, if that race has the class) ---- */
  const rows = session.rows || [];
  const classes = ["ALL", ...sortClasses(Array.from(new Set(rows.map((r) => (r.cls || "").trim()).filter(Boolean))))];
  const active = classes.includes(state.resultClass) ? state.resultClass : "ALL";

  const holder = el("div");
  const paint = () => {
    holder.innerHTML = "";
    const shown = rows.filter((r) => (active === "ALL" || (r.cls || "").trim() === active)
      && matchesQuery(state.resQuery, r.drivers, r.team, r.car, r.model));
    const tag = isInterim(session) ? " (interim)" : (isCheckpoint(session) ? " (points checkpoint)" : "");
    const box = panel(`${session.name}${tag}`, round.name, classStyle(active).accent);
    if (isInterim(session)) {
      box.appendChild(note("Interim classification during the race, not the final result. The first race in the list is the final.", true));
    } else if (isCheckpoint(session)) {
      box.appendChild(note("Classification at a points checkpoint during the race, not the final result.", true));
    }
    if (rows.length === 0) {
      box.appendChild(el("div", { class: "empty", text: "No classification available for this session yet." }));
    } else if (shown.length === 0) {
      box.appendChild(el("div", { class: "empty", text: "No cars match your search or class." }));
    } else {
      const body = shown.map((r, i) => {
        const pos = r.pos || i + 1;
        return el("tr", { class: pos <= 3 ? "p" + pos : "" }, [
          el("td", { class: "pos", text: String(pos) }),
          el("td", { class: "sub" }, r.car ? [el("span", { class: "carno", text: r.car })] : []),
          el("td", { class: "name" }, (r.drivers || "").split(/,\s*/).filter(Boolean).map((d) => el("div", { text: d }))),
          el("td", { class: "sub", text: r.team || "" }),
          el("td", { class: "sub hide-sm", text: r.model || "" }),
          el("td", { class: "num", text: r.time || "" }),
          el("td", { class: "num", text: r.laps != null ? String(r.laps) : "" }),
        ]);
      });
      box.appendChild(dataTable([
        { text: "Pos" }, { text: "No." }, { text: "Drivers" }, { text: "Team" },
        { text: isGtwc() ? "Car" : "", hide: true }, { text: isGtwc() ? "Best lap" : "Time / gap", num: true }, { text: "Laps", num: true },
      ], body));
      if (state.resQuery.trim() || active !== "ALL") {
        box.appendChild(note(`Showing ${shown.length} of ${rows.length}. ${isGtwc() ? "Positions are the official overall ones." : "Positions are the official class positions."}`));
      }
      box.appendChild(note(isGtwc()
        ? "Best lap is each car's fastest lap. The official table does not list total race times or gaps."
        : "Time / gap is the winner's race time, then each driver's gap behind the winner. Drivers who did not finish show their status."));
    }
    holder.appendChild(box);
  };

  const filters = [];
  if (classes.length > 1) {
    filters.push(classChips(classes.map((c) => ({ key: c, label: c, ...classStyle(c) })), active, (k) => { state.resultClass = k; render(); }));
  }
  filters.push(searchField(state.resQuery, "Search driver, team or car", (q) => { state.resQuery = q; paint(); }));
  wrap.appendChild(pageControls(filters));
  paint();
  wrap.appendChild(holder);
  return wrap;
}
