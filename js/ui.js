/* ==========================================================================
   Shared UI builders (all markup uses classes from css/components.css)
   ========================================================================== */

/* Outlined tag for a round's format: Sprint / Endurance, or "6 hours" in the WEC. */
function cupTag(r) {
  const c = roundCup(r);
  if (!c) return null;
  const cup = CUPS.find((x) => x.key === c);
  let label = tagLabel(c);
  if (state.series === "wec") {
    const m = /(\d+)\s*(hours?|h)\b/i.exec(r.name || ""), k = /(\d+)\s*km/i.exec(r.name || "");
    label = m ? m[1] + " hours" : (k ? k[1] + " km" : "Race");
  }
  return el("span", { class: "tag", style: `--t-c:${cup.accent}`, text: label });
}

/* Filled badge for a session kind. */
const KIND = {
  race:       { label: "Race",       color: "var(--c-race)" },
  qualifying: { label: "Qualifying", color: "var(--c-quali)" },
  practice:   { label: "Practice",   color: "var(--c-practice)" },
};
function kindBadge(kind) {
  const k = KIND[kind];
  return k ? el("span", { class: "badge", style: `--b:${k.color}`, text: k.label })
           : el("span", { class: "badge ghost", text: kind ? kind : "Session" });
}

/* ---- fields: a caption above each control ---- */
function labelled(label, control, cls) {
  return el("div", { class: cls || "field" }, [el("span", { class: "label", text: label }), control]);
}
function selectField(label, items, value, edge, onChange) {
  const sel = el("select", { class: "select", "aria-label": label, style: `--edge:${edge}`, onchange: (e) => onChange(e.target.value) });
  items.forEach((it) => {
    const o = el("option", { value: it.key, text: it.label });
    if (it.key === value) o.selected = true;
    sel.appendChild(o);
  });
  return labelled(label, sel, "field sel");
}
function toggleField(label, items, value, onPick) {
  const seg = el("div", { class: "seg", role: "group", "aria-label": label });
  items.forEach((it) => seg.appendChild(el("button", {
    class: "btn", type: "button", "aria-pressed": String(it.key === value), text: it.label, onclick: () => onPick(it.key),
  })));
  return labelled(label, seg);
}
function searchField(value, placeholder, onInput) {
  const inp = el("input", { type: "search", class: "input", placeholder, value: value || "", autocomplete: "off", spellcheck: "false", "aria-label": placeholder });
  inp.addEventListener("input", () => onInput(inp.value));
  return labelled("Search", inp, "field grow");
}
function classChips(items, active, onPick) {
  const row = el("div", { class: "cls-chips", role: "group", "aria-label": "Class" });
  items.forEach((it) => row.appendChild(el("button", {
    class: "cls-chip", type: "button", style: `--c:${it.accent}`, "aria-pressed": String(it.key === active), text: it.label, onclick: () => onPick(it.key),
  })));
  return labelled("Class", row);
}

/* ---- panel (flat card) with an optional coloured left edge ---- */
function panel(title, sub, edge) {
  const box = el("div", { class: "panel" + (edge ? " edge" : ""), style: edge ? `--edge:${edge}` : "" });
  if (title) {
    box.appendChild(el("div", { class: "panel-head" }, [
      el("h2", { class: "panel-title", text: title }),
      sub ? el("span", { class: "panel-sub", text: sub }) : null,
    ]));
  }
  return box;
}
function emptyPanel(text) { return el("div", { class: "panel" }, [el("div", { class: "empty", text })]); }
function note(text, warn) { return el("div", { class: "note" + (warn ? " warn" : ""), text }); }

/* ---- data table: heads = [{text, num}], rows = arrays of <td> nodes ---- */
function dataTable(heads, rows) {
  const tr = el("tr", {}, heads.filter(Boolean).map((h) => el("th", { class: ((h.num ? "num " : "") + (h.hide ? "hide-sm" : "")).trim(), text: h.text, title: h.title || "" })));
  const body = el("tbody");
  rows.forEach((r) => body.appendChild(r));
  return el("div", { class: "tablewrap" }, [el("table", { class: "data-table" }, [el("thead", {}, [tr]), body])]);
}
function pageControls(nodes) { return el("div", { class: "controls" }, nodes); }
