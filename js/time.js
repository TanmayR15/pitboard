/* Time (everything in IST) and schedule logic. Carried over unchanged except cupTag, which moved to ui.js. */
/* ---------- time helpers (everything is shown in IST) ---------- */
const IST = "Asia/Kolkata";
// ?now=2026-10-10T12:00:00Z fakes the clock, handy for testing the countdown.
const FAKE_NOW = (() => { const v = new URLSearchParams(location.search).get("now"); const t = v ? Date.parse(v) : NaN; return isNaN(t) ? null : t; })();
const LOADED_AT = Date.now();
function nowMs() { return FAKE_NOW === null ? Date.now() : FAKE_NOW + (Date.now() - LOADED_AT); }
function istParts(ms, opts) {
  const o = {};
  new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: IST }, opts)).formatToParts(new Date(ms)).forEach((x) => { o[x.type] = x.value; });
  return o;
}
function istDateKey(ms) { const p = istParts(ms, { year: "numeric", month: "2-digit", day: "2-digit" }); return `${p.year}-${p.month}-${p.day}`; }
function istTime(ms) { const p = istParts(ms, { hour: "2-digit", minute: "2-digit", hour12: false }); return `${p.hour}:${p.minute}`; }
function istDayLabel(ms) {
  const p = istParts(ms, { weekday: "short", day: "2-digit", month: "short" });
  return `${p.weekday} ${p.day} ${p.month}`;
}
function dayDiff(aMs, bMs) { return Math.round((Date.parse(istDateKey(aMs) + "T00:00:00Z") - Date.parse(istDateKey(bMs) + "T00:00:00Z")) / 864e5); }
function rangeLabel(r) {
  const a = Date.parse(r.start + "T12:00:00Z"), b = Date.parse(r.end + "T12:00:00Z");
  const pa = istParts(a, { day: "numeric", month: "short" }), pb = istParts(b, { day: "numeric", month: "short" });
  return pa.month === pb.month ? `${pa.day}\u2013${pb.day} ${pb.month}` : `${pa.day} ${pa.month} \u2013 ${pb.day} ${pb.month}`;
}

/* ---------- schedule logic ---------- */
function sessionMs(x) { return Date.parse(x.utc); }
function roundStartMs(r) {
  const ss = r.sessions || [];
  return ss.length ? Math.min(...ss.map(sessionMs)) : Date.parse(r.start + "T00:00:00Z");
}
function roundEndMs(r) {
  const ss = r.sessions || [];
  if (!ss.length) return Date.parse(r.end + "T23:59:59Z");
  const last = Math.max(...ss.map((x) => (x.end_utc ? Date.parse(x.end_utc) : sessionMs(x))));
  return last + (/24\s*(hours?|h)\b/i.test(r.name || "") ? 26 : 4) * 36e5;   // allow for the race itself
}
function roundStatus(r, now) {
  if (now > roundEndMs(r)) return "done";
  if (now >= roundStartMs(r)) return "live";
  return "upcoming";
}
// Sprint rounds have two races (Race 1 and Race 2); Endurance rounds have a single Main Race.
function roundCup(r) {
  if (state.series === "f1") {                           // a Sprint session makes it a sprint weekend
    if (!(r.sessions || []).length) return "";
    return (r.sessions || []).some((x) => /^sprint$/i.test(x.name || "")) ? "sprint" : "endurance";
  }
  const races = (r.sessions || []).filter((x) => x.kind === "race").length;
  if (races >= 2) return "sprint";
  if (races === 1) return "endurance";
  return "";
}
function scheduleRounds() { return ((state.schedule || {}).rounds || []).slice().sort((a, b) => a.round - b.round); }
function nextRound(now) { return scheduleRounds().find((r) => roundStatus(r, now) !== "done") || null; }
// What the big countdown counts down to: the next race session, else the next session, else the first day.
function countdownTarget(r, now) {
  const upcoming = (r.sessions || []).filter((x) => sessionMs(x) > now).sort((a, b) => sessionMs(a) - sessionMs(b));
  const race = upcoming.find((x) => x.kind === "race");
  if (race) return { ms: sessionMs(race), label: race.name };
  if (upcoming.length) return { ms: sessionMs(upcoming[0]), label: upcoming[0].name };
  if (now < roundStartMs(r)) return { ms: roundStartMs(r), label: "Weekend start" };
  return null;
}
function splitCountdown(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}
function pad2(n) { return String(n).padStart(2, "0"); }
