/* ==========================================================================
   App shell: header, series chips, page tabs, render loop
   ========================================================================== */

const PAGES = [
  { key: "home",      label: "Home" },
  { key: "standings", label: "Standings" },
  { key: "results",   label: "Results" },
  { key: "schedule",  label: "Schedule" },
  { key: "progress",  label: "Progression" },
  { key: "points",    label: "Points guide" },
];
const VIEWS = { home: renderHome, standings: renderStandings, results: renderResults, schedule: renderSchedule, points: renderPoints, progress: renderProgression };

function go(page) { state.page = page; render(); window.scrollTo(0, 0); }
function openSchedule(roundNo) {
  if (roundNo != null) state.schedOpen.add(roundNo);
  else { const n = nextRound(nowMs()); if (n) state.schedOpen.add(n.round); }
  go("schedule");
  if (roundNo != null) { const node = document.getElementById("round-" + roundNo); if (node) node.scrollIntoView(); }
}

function renderHeader(onHome) {
  const updated = state.standings ? state.standings.updated : "";
  return el("header", { class: "site-header" }, [el("div", { class: "wrap" }, [
    el("div", {}, [
      el("div", { class: "brand-row" }, [
        el("button", { class: "wordmark", type: "button", title: "Home", "aria-label": "pitboard, home", onclick: () => go("home") }, ["pitboard", el("span", { class: "stop", text: "." })]),
        onHome
          ? el("span", { class: "brand-cap", text: "2026 Motorsport standings" })
          : el("button", { class: "back-link", type: "button", text: "\u2190 Home", onclick: () => go("home") }),
      ]),
      el("p", { class: "tagline", text: "Know where every championship stands." }),
    ]),
    el("div", { class: "header-meta" }, [
      el("span", { class: "tz", title: "All times are shown in India Standard Time", text: "IST, UTC+5:30" }),
      updated ? el("span", { text: "Updated " + updated }) : null,
    ]),
  ])]);
}

function renderNav() {
  const chips = el("div", { class: "chips", role: "group", "aria-label": "Series" },
    SERIES.map((x) => el("button", { class: "chip", type: "button", "aria-pressed": String(x.id === state.series), text: x.label, onclick: () => setSeries(x.id) })));
  const tabs = el("nav", { class: "tabs", "aria-label": "Pages" },
    PAGES.map((p) => el("button", { class: "tab", type: "button", text: p.label, ...(state.page === p.key ? { "aria-current": "page" } : {}), onclick: () => go(p.key) })));
  return el("div", { class: "site-nav" }, [el("div", { class: "wrap" }, [chips, tabs])]);
}

function pageHead() {
  const p = PAGES.find((x) => x.key === state.page);
  const sub = curSeries().label + (state.page === "schedule" ? ". All times are in IST (India Standard Time, UTC+5:30)." : "");
  return el("div", { class: "page-head" }, [el("h1", { class: "page-title", text: p ? p.label : "" }), el("p", { class: "page-sub", text: sub })]);
}

function render() {
  if (state.timer) { clearInterval(state.timer); state.timer = null; }
  const app = document.getElementById("app");
  app.innerHTML = "";

  const onHome = state.page === "home";
  app.appendChild(renderHeader(onHome));
  app.appendChild(renderNav());

  const main = el("main", { id: "main" });
  app.appendChild(main);
  const page = (nodes) => main.appendChild(el("div", { class: "wrap page" }, nodes));

  if (state.noData) {
    const box = panel(seriesInfo(state.series).label);
    box.appendChild(el("div", { class: "empty", text: "No data for this series yet. It will show up here once its updater has been added." }));
    page([box]);
    return;
  }
  if (state.error) {
    page([el("div", { class: "panel err" }, [el("div", { text: "Could not load data (" + state.error + "). If you opened this file directly, run a local server instead: python -m http.server" })])]);
    return;
  }
  if (!state.standings) {
    page([el("div", { class: "loading", text: "Loading..." })]);
    return;
  }
  const view = VIEWS[state.page]();
  if (view.classList.contains("bleed")) main.appendChild(view);
  else page([pageHead(), view]);
}

render();
loadData();
