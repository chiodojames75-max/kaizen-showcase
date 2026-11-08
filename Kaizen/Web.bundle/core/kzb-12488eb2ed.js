/* ==== 5c4286b50740.js ==== */
;try {

// Text boxes on iPhone: a box focused by code (not by your finger) gets focus but no keyboard, and then your first tap
// on it does nothing. So in the app, code may only focus a text box while handling a real tap or key press.
(function () {
  if (!/KaizenApp|iPhone|iPad/.test(navigator.userAgent)) return;
  var f = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (o) {
    var t = this.tagName, typ = (this.type || '').toLowerCase();
    var text = (t === 'INPUT' && !/^(checkbox|radio|button|submit|range|color|file|reset|image)$/.test(typ)) || t === 'TEXTAREA' || this.isContentEditable;
    if (text) { var ev = window.event; if (!ev || !ev.isTrusted || !/^(click|touchend|pointerup|keydown|keyup|submit|change)$/.test(ev.type)) return; }
    return f.call(this, o);
  };
})();
window.KZ = (function () {
  var mem = {};
  function get(k, d) { var v = null; try { v = localStorage.getItem('kz_' + k); } catch (e) { return k in mem ? mem[k] : d; } if (v === null) return d; try { return JSON.parse(v); } catch (e) { return recover(k, v, d); } }
  // Oct 22: a damaged save is kept aside (kzbad_) and the newest daily backup copy of that item is put back
  var badSeen = {};
  function recover(k, raw, d) {
    if (!badSeen[k]) { badSeen[k] = 1; try { localStorage.setItem('kzbad_' + k + '_' + Date.now(), raw); Object.keys(localStorage).filter(function (x) { return x.indexOf('kzbad_') === 0; }).sort(function (a, b) { return +b.split('_').pop() - +a.split('_').pop(); }).slice(3).forEach(function (x) { localStorage.removeItem(x); }); } catch (e) {} }
    try { var bk = Object.keys(localStorage).filter(function (x) { return x.indexOf('kzbak_') === 0; }).sort().reverse();
      for (var i = 0; i < bk.length; i++) { var snap = JSON.parse(localStorage.getItem(bk[i]) || '{}'), s = snap['kz_' + k]; if (s == null) continue; var val = JSON.parse(s); localStorage.setItem('kz_' + k, s); return val; } } catch (e) {}
    return k in mem ? mem[k] : d;
  }
  // Oct 22: if storage is full, clear old backups and try once more; if it still fails, tell the person (once)
  function freeSpace() { var n = 0; try { Object.keys(localStorage).forEach(function (x) { if (/^(kzreset_backup_|kzbad_|kzbak_)/.test(x)) { localStorage.removeItem(x); n++; } }); } catch (e) {} return n > 0; }
  function saveFail() { if (window.__kzSaveFail) return; window.__kzSaveFail = 1; try { document.dispatchEvent(new CustomEvent('kz:savefail')); } catch (e) {} }
  function set(k, v) { mem[k] = v; rover++; var s; try { s = JSON.stringify(v); } catch (e) { return; } try { localStorage.setItem('kz_' + k, s); } catch (e) { var ok = false; if (freeSpace()) { try { localStorage.setItem('kz_' + k, s); ok = true; } catch (e2) {} } if (!ok) saveFail(); } if (window.KZ && window.KZ._onset) window.KZ._onset(k); }
  // Oct 22: read-only cache for hot read paths (never handed to code that edits and saves). Any storage write clears it.
  var ro = {}, rover = 0;
  function getRO(k, d) { var c = ro[k]; if (c && c.v === rover) return c.x; var x = get(k, d); ro[k] = { v: rover, x: x }; return x; }
  (function () { try { var S = Storage.prototype; if (S.__kzRo) return; S.__kzRo = 1; ['setItem', 'removeItem', 'clear'].forEach(function (m) { var f = S[m]; S[m] = function () { rover++; return f.apply(this, arguments); }; }); } catch (e) {} })();
  function today() { var t = new Date(); t.setHours(0, 0, 0, 0); return t; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function key(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function goals() { return get('goals', []); }
  function saveGoals(g) { set('goals', g); }
  // Up to 5 active goals: steps should reward keeping goals, not piling them on.
  // No limit on how many goals can be added (kept as functions so older code paths still work).
  var PER_DAY = Infinity;
  function addsToday() { return (get('adds', {}))[key(today())] || 0; }
  function addsLeft() { return Infinity; }
  function atCap() { return false; }
  function addGoal(o) {
    var g = goals(); var id = 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    g.push({ id: id, name: String(o.name).slice(0, 90), kind: o.kind === 'daily' ? 'daily' : 'long', step: String(o.step || '').slice(0, 140), cue: String(o.cue || '').trim().slice(0, 80), mini: String(o.mini || '').trim().slice(0, 80), pub: !!o.pub, log: !!o.log, path: o.path || (window.KZ && KZ.guessPath ? KZ.guessPath(o.name) : ''), created: key(today()) });
    saveGoals(g); return id;
  }
  // Edit a goal in place. Same id, so every step, leaf and milestone stays with it.
  function updateGoal(id, o) {
    saveGoals(goals().map(function (g) {
      if (g.id !== id) return g;
      if (o.name != null && String(o.name).trim()) g.name = String(o.name).trim().slice(0, 90);
      if (o.step != null) g.step = String(o.step).trim().slice(0, 140);
      if (o.cue != null) g.cue = String(o.cue).trim().slice(0, 80);
      if (o.mini != null) g.mini = String(o.mini).trim().slice(0, 80);
      if (o.path) g.path = o.path;
      if (o.kind) g.kind = o.kind === 'daily' ? 'daily' : 'long';
      if (o.log != null) g.log = !!o.log;
      if (o.won) g.won = String(o.won).slice(0, 10);
      return g;
    }));
  }
  function archived() { return get('archived', []); }
  // Archive: the goal leaves your daily list but every step it earned is kept.
  function archiveGoal(id) { var g = goals().filter(function (x) { return x.id === id; })[0]; if (!g) return; g.archived = key(today()); var a = archived(); a.unshift(g); set('archived', a); saveGoals(goals().filter(function (x) { return x.id !== id; })); }
  function restoreGoal(id) { var a = archived(), g = a.filter(function (x) { return x.id === id; })[0]; if (!g) return false; delete g.archived; g.restored = key(today()); set('archived', a.filter(function (x) { return x.id !== id; })); var all = goals(); all.push(g); saveGoals(all); return true; }
  // Delete: the goal and its progress are erased for good.
  function removeGoal(id) { var tb = get('tomb', {}); tb[id] = key(today()); set('tomb', tb); saveGoals(goals().filter(function (x) { return x.id !== id; })); set('archived', archived().filter(function (x) { return x.id !== id; })); var d = get('done', {}); delete d[id]; set('done', d); }
  function done() { return get('done', {}); }
  function isDone(id, k) { var d = getRO('done', {}); return !!(d && d[id] && d[id][k || key(today())]); }
  function toggleDone(id) { var d = done(), k = key(today()); d[id] = d[id] || {}; if (d[id][k]) delete d[id][k]; else { d[id][k] = 1; track('kz_step_taken'); } set('done', d); updateStreak(); }
  function anyDone(k) { var d = getRO('done', {}) || {}; for (var id in d) { if (d[id] && d[id][k]) return true; } return false; }
  // A day counts as "showed up" if you rated, wrote, reflected or took a step.
  function showedUp(k) { var r = get('rate', {}), t = get('thought', {}), j = get('journal', {}); return !!(r[k] || t[k] || j[k] || anyDone(k)); }
  function shownDays() {
    var s = {}; [get('rate', {}), get('thought', {}), get('journal', {})].forEach(function (m) { for (var k in m) if (m[k]) s[k] = 1; });
    var d = getRO('done', {}) || {}; for (var id in d) for (var k in (d[id] || {})) s[k] = 1;   /* Oct 24 (speed): read-only */
    return Object.keys(s).sort();
  }
  function weekKey(d) { var x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return key(x); }
  // Streak, walked forward day by day. Today never breaks it.
  //  · streak shields: every full week you show up (7 days in a row) earns 1 shield (hold up to 2).
  //    A missed day spends a shield and becomes a rest day: the streak keeps going and the tree doesn't dry out.
  //    No shield left and you miss a day: the streak resets.
  var SHIELD_EVERY = 7, SHIELD_MAX = 2;
  // Oct 21: a day only counts toward the streak if the tree's water ended above 50% (same water rules as the tree).
  // Today counts as soon as it's above 50%, and never breaks the streak before it's over.
  // A day at 50% or less spends a shield if you have one (a rest day), otherwise the streak resets to 0.
  function streakInfo() {
    var t = today(), tk = key(t), out = { streak: 0, grace: 0, shields: 0, protectedDays: [], graceDays: [] }, KK = window.KZ || {};
    var dn = getRO('done', {}) || {}, gl = KK.allGoals ? KK.allGoals() : goals(), first = null;   /* Oct 24 (speed): read-only */
    for (var id0 in dn) for (var d0 in (dn[id0] || {})) if (!first || d0 < first) first = d0;
    if (!first || !KK.waterStep) return out;
    var due = function (k) { return gl.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); }); };
    var rate = function (k) { var a = due(k); if (!a.length) return null; return a.filter(function (g) { return dn[g.id] && dn[g.id][k]; }).length / a.length; };
    var nowD = new Date(), hr = nowD.getHours() + nowD.getMinutes() / 60, drainP = Math.max(0, Math.min(1, (hr - (KK.WATER_SAFE_UNTIL || 8)) / (KK.WATER_DRAIN_HOURS || 12)));
    var n = 0, run = 0, shields = 0, prot = [], W = 0, seeded = false, guard = 0, floor = addDays(t, -150), d = new Date(first + 'T00:00:00'); if (d < floor) d = floor;
    for (; guard++ < 400; d = addDays(d, 1)) {
      var k = key(d); if (k > tk) break;
      var r = rate(k); if (r === null) continue; // no goals due that day: neither counts nor breaks
      var isT = k === tk, end = !seeded ? r * 100 : KK.waterStep(W, r, isT ? drainP : 1);
      if (end > 50) { W = end; seeded = true; n++; run++; if (run % SHIELD_EVERY === 0 && shields < SHIELD_MAX) shields++; continue; }
      if (isT) break; // today isn't over
      if (shields > 0) { shields--; prot.push(k); continue; } // rest day: water and streak hold
      W = end; seeded = true; n = 0; run = 0; prot = [];
    }
    out.streak = n; out.shields = n ? shields : 0; out.protectedDays = prot;
    return out;
  }
  function streak() { return streakInfo().streak; }
  function updateStreak() {
    var s = streak(), n = shownDays().length;
    document.querySelectorAll('[data-kz-streak]').forEach(function (el) { el.textContent = s; });
    document.querySelectorAll('[data-kz-streak-pill]').forEach(function (el) { el.hidden = s < 1; });
    document.querySelectorAll('[data-kz-days]').forEach(function (el) { el.textContent = n; });
    var sh = streakInfo().shields; document.querySelectorAll('[data-kz-shields]').forEach(function (el) { el.hidden = !sh || s < 1; el.textContent = sh > 1 ? '×' + sh : ''; el.setAttribute('aria-label', sh + (sh === 1 ? ' streak shield' : ' streak shields')); });
  }
  // Demo mode (debug builds only) swaps in a fake account: nothing it does is counted or sent anywhere.
  var DEMO = (function () { try { return localStorage.getItem('kzdemo_on') === '1'; } catch (e) { return false; } })();
  function track(name, params) { if (DEMO) return; try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} }
  // Visits: first visit, return visits (day 1 / 7 / 30), and "welcome back" after a gap.
  var visit = (function () {
    var tk = key(today()), v = get('visit', null), dayMs = 864e5;
    function dd(a) { return Math.round((today() - new Date(a + 'T00:00:00')) / dayMs); }
    if (!v) { v = { first: tk, last: tk, gap: 0, isNew: true }; set('visit', { first: tk, last: tk, gap: 0 }); track('kz_first_visit'); return v; }
    if (v.last !== tk) {
      v.gap = dd(v.last); v.last = tk; set('visit', v);
      var since = dd(v.first); track('kz_return_visit', { days_since_first: since, gap_days: v.gap });
      if (since === 1 || since === 7 || since === 30) track('kz_return_day_' + since);
    }
    v.isNew = false; return v;
  })();
  // Backup / restore
  function exportData() {
    var o = { app: 'kaizen', v: 1, at: new Date().toISOString(), data: {} };
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('kz_') === 0 && !/^kz_(auth|syncmeta|sync)$/.test(k)) o.data[k.slice(3)] = JSON.parse(localStorage.getItem(k)); } } catch (e) { for (var m in mem) if (!/^(auth|syncmeta|sync)$/.test(m)) o.data[m] = mem[m]; }
    return o;
  }
  function importData(o) {
    if (!o || o.app !== 'kaizen' || !o.data) throw new Error('That file is not a Kaizen backup.');
    var d = o.data, n = 0;
    // Fresh install (nothing here yet): restore everything exactly as it was, tree, pillars, notes, unlocks included.
    var empty = !goals().length && !Object.keys(done()).length;
    if (empty) { for (var fk in d) { if (fk === 'sync' || fk === 'syncmeta') continue; set(fk, d[fk]); n++; } set('welcomed', 1); if (window.KZ && KZ.reloadPillars) KZ.reloadPillars(); updateStreak(); return n; }
    // Otherwise merge: nothing already here is overwritten.
    ['tree', 'treename', 'treeplanted'].forEach(function (k) { if (d[k] && !get(k, '')) set(k, d[k]); });
    if (d.treestress) set('treestress', Math.max(+get('treestress', 0) || 0, +d.treestress || 0));
    if (d.pillars && !get('pillars', null)) { set('pillars', d.pillars); if (window.KZ && KZ.reloadPillars) KZ.reloadPillars(); }
    ['unlocked', 'tomb'].forEach(function (k) { if (d[k]) { var c = get(k, {}) || {}; for (var x in d[k]) if (!c[x]) c[x] = d[k][x]; set(k, c); } });
    if (d.gnotes) { var gn = get('gnotes', {}) || {}; for (var gi in d.gnotes) { gn[gi] = gn[gi] || {}; for (var gd in d.gnotes[gi]) if (!gn[gi][gd]) { gn[gi][gd] = d.gnotes[gi][gd]; n++; } } set('gnotes', gn); }
    if (d.archived) { var ar = archived(), aid = {}; ar.forEach(function (x) { aid[x.id] = 1; }); d.archived.forEach(function (x) { if (!aid[x.id]) ar.push(x); }); set('archived', ar); }
    ['rate', 'thought', 'journal', 'liked'].forEach(function (k) { if (d[k]) { var cur = get(k, {}); for (var x in d[k]) if (!(x in cur) || !cur[x]) { if (d[k][x]) { cur[x] = d[k][x]; n++; } } set(k, cur); } });
    if (d.done) { var cd = done(); for (var id in d.done) { cd[id] = cd[id] || {}; for (var dk in d.done[id]) { if (!cd[id][dk]) n++; cd[id][dk] = 1; } } set('done', cd); }
    if (d.goals) { var g = goals(), ids = {}; g.forEach(function (x) { ids[x.id] = 1; }); d.goals.forEach(function (x) { if (!ids[x.id]) { g.push(x); n++; } }); saveGoals(g); }
    if (d.visit && d.visit.first) { var v = get('visit', {}); if (!v.first || d.visit.first < v.first) { v.first = d.visit.first; set('visit', v); } }
    set('welcomed', 1); updateStreak(); return n;
  }
  function stepFor(g) { return g.step || (g.kind === 'daily' ? 'Do it once today.' : 'Spend 10 minutes on the smallest next step toward it.'); }
  function dotsHTML(id) {
    var out = '', t = today();
    for (var i = 6; i >= 0; i--) { var k = key(addDays(t, -i)); out += '<span class="' + (isDone(id, k) ? 'on' : '') + (i === 0 ? ' today' : '') + '" title="' + k + '"></span>'; }
    return '<div class="kz-dots" aria-label="Last 7 days">' + out + '</div>';
  }
  function cardHTML(g, opts) {
    opts = opts || {}; var d = isDone(g.id);
    var tag = opts.showTag ? '<div class="kz-row" style="justify-content: center; flex-wrap: wrap"><span class="kz-label">' + (g.kind === 'daily' ? 'Daily habit' : 'Long-term') + '</span><span class="kz-tag' + (g.pub ? ' pub' : '') + '">' + (g.pub ? 'Public' : 'Private') + '</span></div>' : '';
    return '<div class="kz-card">' + tag +
      '<span class="kz-card-name">' + esc(g.name) + '</span>' +
      '<span class="kz-muted">' + esc(stepFor(g)) + '</span>' + dotsHTML(g.id) +
      '<button type="button" class="kz-step-btn' + (d ? ' done' : '') + '" data-kz-done="' + g.id + '">' + (d ? 'Completed ✓' : 'Complete') + '</button>' +
      (opts.removable ? '<button type="button" class="kz-link" style="border-color: var(--kz-line); color: var(--kz-muted)" data-kz-remove="' + g.id + '">Remove goal</button>' : '') +
      '</div>';
  }
  document.addEventListener('DOMContentLoaded', updateStreak);
  // Text boxes grow with what's written, so long entries never feel boxed in.
  function autoGrow(el) {
    var q = 0, last = -1, fit = function () { el.style.height = 'auto'; var h = Math.max(el.scrollHeight, 0); el.style.height = h + 'px'; last = h; };
    el.addEventListener('input', function () { if (q) return; q = requestAnimationFrame(function () { q = 0; fit(); }); }); setTimeout(fit, 0); return fit;
  }
  // Dictation: adds a mic button that types what's said (Chrome, Edge, Safari). Hidden where the browser can't do it.
  function dictate(el, holder) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kz-mic';
    b.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span>Dictate</span>';
    b.setAttribute('aria-pressed', 'false');
    (holder || el.parentNode).insertBefore(b, holder ? null : el.nextSibling);
    if (!SR) { b.hidden = true; return b; }
    var rec = null, on = false, base = '';
    var stop = function () { on = false; b.setAttribute('aria-pressed', 'false'); b.querySelector('span').textContent = 'Dictate'; if (rec) try { rec.stop(); } catch (e) {} };
    b.addEventListener('click', function () {
      if (on) return stop();
      rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || 'en-US';
      base = el.value ? el.value.replace(/\s*$/, ' ') : '';
      rec.onresult = function (e) {
        var fin = '', mid = '';
        for (var i = e.resultIndex; i < e.results.length; i++) { var t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t; else mid += t; }
        if (fin) base += fin.trim() + ' ';
        el.value = base + mid; el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onend = function () { if (on) try { rec.start(); } catch (e) { stop(); } };
      rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { b.querySelector('span').textContent = 'Mic blocked'; on = false; b.setAttribute('aria-pressed', 'false'); } };
      try { rec.start(); on = true; b.setAttribute('aria-pressed', 'true'); b.querySelector('span').textContent = 'Stop'; track('kz_dictate'); } catch (e) { stop(); }
    });
    return b;
  }
  // Year progress: how much of this year is gone and how many days are left to work on goals.
  function paintYear() {
    var t = today(), y = t.getFullYear(), start = new Date(y, 0, 1), end = new Date(y + 1, 0, 1);
    var total = Math.round((end - start) / 864e5), gone = Math.round((t - start) / 864e5) + 1, left = total - gone, pct = Math.round(100 * gone / total);
    document.querySelectorAll('[data-kz-year]').forEach(function (el) {
      el.innerHTML = '<div class="kz-year-top"><span><b>' + left + '</b> ' + (left === 1 ? 'day' : 'days') + ' left in ' + y + '</span><span>' + pct + '%</span></div>' +
        '<div class="kz-year-bar" role="progressbar" aria-label="' + y + ' is ' + pct + '% done" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width: ' + pct + '%"></i></div>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintYear); else setTimeout(paintYear, 0);
  return { demo: DEMO, autoGrow: autoGrow, dictate: dictate, get: get, set: set, _getRO: getRO, _rover: function () { return rover; }, today: today, addDays: addDays, key: key, esc: esc, goals: goals, addGoal: addGoal, removeGoal: removeGoal, updateGoal: updateGoal, archived: archived, archiveGoal: archiveGoal, restoreGoal: restoreGoal, atCap: atCap, addsLeft: addsLeft, PER_DAY: PER_DAY,
    isDone: isDone, toggleDone: toggleDone, streak: streak, streakInfo: streakInfo, updateStreak: updateStreak, cardHTML: cardHTML, stepFor: stepFor,
    showedUp: showedUp, shownDays: shownDays, weekKey: weekKey, track: track, visit: visit, exportData: exportData, importData: importData };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzcheck-1102.js ==== */
;try {
/* Nov 2 · copy of kzcheck-1028.js: a goal's stat line has no streak (streaks and shields are the Kaizen 66's): days done · ft climbed · since. */
/* kzcheck-1028.js · Oct 28 Stage C: replaces 871e20c7e358.js (same code; complete() reworked so a check-off paints first). */

(function () {
  var K = window.KZ; if (!K) return;
  var MI = (function () { var w = function (d) { return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
    return { eye: w('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'), pen: w('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/>'),
      up: w('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: w('<path d="M12 5v14M6 13l6 6 6-6"/>'), bin: w('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>') }; })();
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGES = [[1, 'First step', 'You started. Most people never do.'], [3, '3 days', 'Three times. It is becoming real.'], [5, '5 days', 'Five days. You are building trust with yourself.'], [7, '1 week', 'One week. This is who you are now.'], [14, '2 weeks', 'Two weeks. Your days are changing.'], [21, '3 weeks', 'Three weeks. It is starting to stick.'], [30, '1 month', 'A month. Look how far you have come.'], [50, '50 days', 'Fifty days of quiet, steady growth.'], [66, 'Habit', 'Habit formed. It is part of you now.'], [100, '100 days', 'One hundred days. A different person.'], [180, '6 months', 'Half a year of getting better.'], [365, '1 year', 'One year. Your tree is ancient now.']];
  function doneDays(id) { var d = (K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {}; return Object.keys(d[id] || {}).length; }
  function stage(n) {
    var cur = null, next = STAGES[0];
    for (var i = 0; i < STAGES.length; i++) { if (n >= STAGES[i][0]) { cur = STAGES[i]; next = STAGES[i + 1] || null; } }
    var from = cur ? cur[0] : 0, to = next ? next[0] : from;
    return { name: cur ? cur[1] : 'Not started', next: next, pct: next ? Math.round(((n - from) / (to - from)) * 100) : 100 };
  }
  function weekHTML(id) {
    var t = K.today(), out = '', L = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (var i = 6; i >= 0; i--) {
      var d = K.addDays(t, -i), k = K.key(d), on = K.isDone(id, k);
      out += '<span class="kz-day' + (on ? ' on' : '') + (i === 0 ? ' today' : '') + '" data-day="' + k + '"><i></i><b>' + L[d.getDay()] + '</b></span>';
    }
    return '<div class="kz-week" aria-label="Last 7 days">' + out + '</div>';
  }
  function msHTML(id) {
    var n = doneDays(id), s = stage(n);
    var left = s.next ? s.next[0] - n : 0;
    var txt = n === 0 ? 'Your first step starts it all.' : (s.next ? s.name + ' · ' + left + ' more ' + (left === 1 ? 'day' : 'days') + ' to ' + s.next[1] : s.name + ' · ' + n + ' days');
    return '<div class="kz-ms"><div class="kz-ms-bar"><i style="width: ' + s.pct + '%"></i></div><span class="kz-ms-t">' + txt + '</span></div>';
  }
  function pathTag(g) { var id = K.pathOf ? K.pathOf(g) : '', p = (K.PATHS || []).filter(function (x) { return x.id === id; })[0]; return p ? '<span class="kz-tag" style="color: ' + p.c1 + '; border-color: ' + p.c2 + '">' + p.name + '</span>' : ''; }
  // Inline edit form for one goal (hidden until the pencil is tapped).
  function editHTML(g) {
    var cur = K.pathOf ? K.pathOf(g) : '';
    var chips = (K.PATHS || []).map(function (p) { return '<button type="button" class="kz-pathchip" data-epath="' + p.id + '" aria-pressed="' + (p.id === cur) + '"><i style="background: ' + p.c2 + '"></i>' + p.name + '</button>'; }).join('');
    return '<form class="kz-editbox" data-kz-editform="' + g.id + '" hidden>' +
      '<label class="kz-label">Goal<input class="kz-input" name="name" maxlength="90" required value="' + K.esc(g.name) + '"></label>' +
      '<label class="kz-label">Daily small step <i class="kz-opt">(optional)</i><input class="kz-input" name="step" maxlength="140" placeholder="Ex. Run 2 easy miles" value="' + K.esc(g.step || '') + '"></label>' +
      '<label class="kz-label">When: after I… <i class="kz-opt">(optional)</i><input class="kz-input" name="cue" maxlength="80" placeholder="pour my morning coffee" value="' + K.esc(g.cue || '') + '"></label>' +
      '<label class="kz-label">Bad-day version <i class="kz-opt">(optional)</i><input class="kz-input" name="mini" maxlength="80" placeholder="Put on my running shoes" value="' + K.esc(g.mini || '') + '"></label>' +
      '<div class="kz-row" role="group" aria-label="Type" style="justify-content: center; gap: 8px"><button type="button" class="kz-chip" data-ekind="long" aria-pressed="' + (g.kind !== 'daily') + '">Long-term</button><button type="button" class="kz-chip" data-ekind="daily" aria-pressed="' + (g.kind === 'daily') + '">Daily habit</button></div>' +
      '<div class="kz-paths" role="group" aria-label="Branch">' + chips + '</div>' +
      '<div class="kz-logrow"><span><b>Keep a journal for this goal</b><small>A daily note box just for this goal. Private.</small></span><button type="button" class="kz-switch kz-sw2" role="switch" data-elog aria-checked="' + !!g.log + '" aria-label="Keep a journal for this goal"></button></div>' +
      '<span class="kz-note">Progress and notes stay with this goal.</span>' +
      '<div class="kz-row" style="justify-content: center; gap: 8px"><button type="button" class="kz-btn ghost" data-kz-edit-no>Cancel</button><button type="submit" class="kz-btn">Save</button></div>' +
      '</form>';
  }
  // ---------- Goal order: saved separately so it syncs as one unit (newest order wins) ----------
  var rawGoals = K.goals;
  K.goals = function () {
    var g = rawGoals(), o = (K.get('gorder', null) || {}).ids || [], pos = {};
    o.forEach(function (id, i) { pos[id] = i; });
    return g.map(function (x, i) { return { g: x, i: i, p: x.id in pos ? pos[x.id] : 1e6 + i }; }).sort(function (a, b) { return a.p - b.p; }).map(function (x) { return x.g; });
  };
  K.setGoalOrder = function (ids) { K.set('gorder', { t: Date.now(), ids: ids }); document.dispatchEvent(new Event('kz:goals')); };
  // Move within the goals the person can see (a pillar filter hides others; their slots stay put).
  K.reorderVisible = function (visibleIds) {
    var all = K.goals().map(function (g) { return g.id; }), vis = {}, q = visibleIds.slice();
    visibleIds.forEach(function (id) { vis[id] = 1; });
    K.setGoalOrder(all.map(function (id) { return vis[id] ? q.shift() : id; }));
  };
  K.moveGoal = function (id, dir, visibleIds) {
    var ids = (visibleIds || K.goals().map(function (g) { return g.id; })).slice(), i = ids.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return false;
    ids.splice(i, 1); ids.splice(j, 0, id); K.reorderVisible(ids); K.track('kz_goal_moved'); return true;
  };

  var CHECK = '<svg class="kz-chk" viewBox="0 0 24 24" aria-hidden="true"><circle class="kz-chk-ring" cx="12" cy="12" r="10.5"/><path class="kz-chk-mark" d="M7 12.6l3.3 3.3L17.2 8.8"/></svg>';
  function dotsHTML(id) {
    var t = K.today(), out = '';
    for (var i = 6; i >= 0; i--) { var k = K.key(K.addDays(t, -i)); out += '<i class="' + (K.isDone(id, k) ? 'on' : '') + (i === 0 ? ' today' : '') + '"></i>'; }
    return '<span class="kz-gdots" aria-label="Last 7 days">' + out + '</span>';
  }
  // ---------- Goal notes (a journal for each goal) and stats ----------
  K.gnotes = function (id) { return (K.get('gnotes', {}) || {})[id] || {}; };
  K.setGNote = function (id, day, text) {
    var all = K.get('gnotes', {}) || {}, v = String(text || '').replace(/\s+$/, '');
    all[id] = all[id] || {}; if (v.trim()) all[id][day] = v; else delete all[id][day];
    K.set('gnotes', all); document.dispatchEvent(new CustomEvent('kz:gnote', { detail: { id: id, day: day } }));
  };
  K.goalStats = function (g) {
    var d = (K.get('done', {}) || {})[g.id] || {}, days = Object.keys(d).filter(function (k) { return d[k]; }).sort(), set = {}, best = 0, run = 0, prev = null;
    days.forEach(function (k) { set[k] = 1; var dt = new Date(k + 'T12:00:00'); run = prev && Math.round((dt - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = dt; });
    var t = K.today(), c = set[K.key(t)] ? t : K.addDays(t, -1), cur = 0; while (set[K.key(c)]) { cur++; c = K.addDays(c, -1); }
    var since = (g.created || days[0] || K.key(t)).slice(0, 10);
    return { done: days.length, streak: cur, best: best, since: since, first: days[0] || null, set: set };
  };
  var fmtShort = function (k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
  K.goalFt = function (g) { var o = null; try { o = K.mtn && K.mtn(g.id || g); } catch (e) {} return o && o.kind === 'climb' ? (o.total || 0) * 131 : null; };
  K.goalStatLine = function (g) { var s = K.goalStats(g), ft = K.goalFt(g); return s.done + (s.done === 1 ? ' day' : ' days') + ' done' + (ft != null ? ' · ' + ft.toLocaleString() + ' ft climbed' : '') + ' · since ' + fmtShort(s.since); };
  K.noteBoxHTML = function (g, day) {
    day = day || K.key(K.today()); var v = K.gnotes(g.id)[day] || '';
    return '<div class="kz-gnote" data-gnote="' + g.id + '" data-day="' + day + '"><label class="kz-label" for="kz-gn-' + g.id + '-' + day + '">Today’s note</label>' +
      '<textarea id="kz-gn-' + g.id + '-' + day + '" class="kz-jbox kz-gnbox" rows="2" placeholder="How did ‘' + K.esc(K.stepFor(g) || g.name) + '’ go?">' + K.esc(v) + '</textarea>' +
      '<div class="kz-gnrow"><span class="kz-note kz-gnsaved" aria-live="polite"></span><button type="button" class="kz-btn kz-gnsave" data-gnsave>' + (v ? 'Update note' : 'Save note') + '</button></div></div>';
  };
  K.gxHTML = function (g) {
    var n66 = doneDays(g.id), p66 = Math.min(100, Math.round(n66 / 66 * 100));
    return '<div class="kz-gx"><span class="kz-gxstats">' + K.goalStatLine(g) + '</span>' +
      '<div class="kz-auto"><div class="kz-auto-top"><b>' + (n66 >= 66 ? 'Past day 66' : 'Day ' + n66 + ' of ~66') + '</b><span>' + (n66 >= 66 ? 'Most habits feel automatic by now.' : 'On average, a habit starts to feel automatic around day 66.') + '</span></div><div class="kz-auto-bar" role="progressbar" aria-label="Days toward an automatic habit" aria-valuemin="0" aria-valuemax="66" aria-valuenow="' + Math.min(66, n66) + '"><i style="width: ' + p66 + '%"></i></div></div>' +
      (g.mini && !K.isDone(g.id) ? '<button type="button" class="kz-btn ghost kz-minibtn" data-kz-mini="' + g.id + '">Did the 2-minute version: ' + K.esc(g.mini) + '</button>' : '') +
      (g.log ? K.noteBoxHTML(g) : '<button type="button" class="kz-quiet gold kz-gxlog" data-kz-logon="' + g.id + '">+ Keep a journal for this goal</button>') +
      '<a class="kz-quiet gold kz-gxview" href="/pages/goal?id=' + encodeURIComponent(g.id) + '">View goal →</a></div>';
  };
  var openId = null; // one expanded row at a time; stays open across re-renders this visit
  K.cardHTML = function (g, opts) {
    opts = opts || {}; var d = K.isDone(g.id), n = doneDays(g.id), s = stage(n);
    var pid = K.pathOf ? K.pathOf(g) : '', P = (K.PATHS || []).filter(function (x) { return x.id === pid; })[0];
    var left = s.next ? s.next[0] - n : 0, st = n ? s.name + (s.next ? ' · ' + left + (left === 1 ? ' day' : ' days') + ' to ' + s.next[1] : '') : 'Day one';
    var meta = opts.showTag && P ? '<b class="kz-gpill" style="color: ' + P.c1 + '"><i style="background: ' + P.c2 + '"></i>' + K.esc(P.name) + '</b>' : '';
    var open = openId === g.id, hasNotes = Object.keys(K.gnotes(g.id)).length > 0;
    var NOTE = hasNotes ? '<svg class="kz-gnicon" aria-label="Has notes" viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z M15 4v4h4 M8 12h8 M8 16h6"/></svg>' : '';
    var compact = g.kind !== 'daily' && !opts.noCompact && !!(K.get('gcompact', {}) || {})[g.id]; if (compact) open = false;
    return '<div class="kz-goal kz-grow' + (d ? ' is-done' : '') + (open ? ' open' : '') + (compact ? ' compact' : '') + '" data-goal="' + g.id + '"' + (P ? ' style="--pc: ' + P.c2 + '"' : '') + '>' +
      '<button type="button" class="kz-ghandle" data-kz-drag="' + g.id + '" aria-label="Reorder ' + K.esc(g.name) + '. Use arrow keys to move." title="Drag to reorder"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></button>' +
      '<div class="kz-gbody" role="button" tabindex="0" data-kz-expand aria-expanded="' + (g.kind === 'daily' ? open : !compact) + '" aria-label="' + K.esc(g.name) + (g.kind === 'daily' ? (open ? '. Tap to collapse.' : '. Tap to show more.') : (compact ? '. Tap to show today\u2019s step.' : '. Tap to fold to the title.')) + '"><span class="kz-gname">' + K.esc(g.name) + '</span>' + (g.cue ? '<span class="kz-gcue">After I ' + K.esc(g.cue.replace(/^after i\s+/i, '')) + '</span>' : '') + (K.miniToday && K.miniToday(g.id) ? '<span class="kz-gmini2">2-min version</span>' : '') + (g.kind === 'daily' ? '' : '<span class="kz-gstep kz-gsub"><i>Daily</i><span>' + K.esc(K.stepFor(g)) + '</span></span>') +
        '<span class="kz-gline">' + dotsHTML(g.id) + meta + NOTE + '<span class="kz-gstage">' + st + '</span><svg class="kz-gchev" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>' +
        '<span class="kz-gfloat" aria-live="polite"></span></div>' +
      '<button type="button" class="kz-gmore" data-kz-more="' + g.id + '" aria-haspopup="true" aria-expanded="false" aria-label="More for ' + K.esc(g.name) + '"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>' +
      '<button type="button" class="kz-check' + (d ? ' done' : '') + '" data-kz-done="' + g.id + '" aria-pressed="' + d + '" aria-label="' + (d ? 'Completed today. Tap to undo: ' : 'Complete today’s step: ') + K.esc(g.name) + '">' + CHECK + '<span class="kz-hold-lbl">' + (d ? 'Completed ✓' : 'Complete') + '</span></button>' +
      '<div class="kz-gmenu kz-gm2" role="menu" hidden>' +
        '<a role="menuitem" href="/pages/goal?id=' + encodeURIComponent(g.id) + '"><span>View goal</span>' + MI.eye + '</a>' +
        '<button type="button" role="menuitem" data-kz-edit="' + g.id + '"><span>Edit</span>' + MI.pen + '</button>' +
        (g.kind === 'daily' ? '' : '<button type="button" role="menuitem" class="kz-gm-won" data-kz-won="' + g.id + '"><span>Goal achieved</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 12v4M8 20h8M9.5 16h5v4h-5z"/></svg></button>') +
        '<div class="kz-gm-move" role="group" aria-label="Reorder"><button type="button" role="menuitem" data-kz-move="-1" aria-label="Move up">' + MI.up + '<span>Up</span></button><button type="button" role="menuitem" data-kz-move="1" aria-label="Move down">' + MI.down + '<span>Down</span></button></div>' +
        '<button type="button" role="menuitem" class="kz-gm-del" data-kz-del="' + g.id + '"><span>Archive or delete</span>' + MI.bin + '</button></div>' +
      '<div class="kz-gswipe" aria-hidden="true"><button type="button" tabindex="-1" class="arch" data-kz-sw-arch="' + g.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10h14V9M10 13h4"/></svg>Archive</button><button type="button" tabindex="-1" class="del" data-kz-sw-del="' + g.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>Delete</button></div>' +
      (open ? K.gxHTML(g) : '') +
      editHTML(g) +
      '<div class="kz-delbox" hidden><span class="kz-delq">Archive this goal instead?</span><span>Archiving keeps every step and leaf. Deleting erases this goal’s progress for good.</span><div class="kz-row" style="justify-content: center; gap: 8px; flex-wrap: wrap"><button type="button" class="kz-btn ghost" data-kz-del-no>Keep</button><button type="button" class="kz-btn" data-kz-arch="' + g.id + '">Archive</button><button type="button" class="kz-btn kz-danger" data-kz-del-yes="' + g.id + '">Delete</button></div><span class="kz-note" data-kz-del-sure hidden>Tap Delete again to erase it.</span></div>' +
      '</div>';
  };

  // Bonsai: one leaf for every step taken. Leaves fill five foliage pads.
  var PADS = [[98, 58, 30, 12], [62, 88, 22, 10], [138, 74, 19, 9], [74, 66, 16, 8], [124, 56, 16, 8]];
  var LEAVES = (function () {
    var per = 30, ga = Math.PI * (3 - Math.sqrt(5)), order = [], pts = [];
    for (var b = 0; b < 32; b++) { var r = parseInt(('00000' + b.toString(2)).slice(-5).split('').reverse().join(''), 2); if (r < per) order.push(r); }
    for (var k = 0; k < per; k++) for (var q = 0; q < PADS.length; q++) {
      var p = PADS[q], j = order[k], rr = Math.sqrt((j + 0.5) / per) * 0.92, a = j * ga + q;
      pts.push([p[0] + Math.cos(a) * rr * p[2], p[1] + Math.sin(a) * rr * p[3]]);
    }
    return pts;
  })();
  K.totalSteps = function () { var d = K.get('done', {}), n = 0; for (var id in d) n += Object.keys(d[id] || {}).length; return n; };
  K.bonsaiSVG = function (n, fresh) {
    // Detailed bonsai: bark-textured trunk with roots, layered foliage pads, real leaf shapes in three shades,
    // glazed pot. One leaf per step; past the last leaf, small blossoms open.
    var shown = Math.min(n, LEAVES.length), blossoms = Math.max(0, n - LEAVES.length), i;
    var rnd = function (s) { var x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
    var leafPath = 'M0 -5.2 C2.8 -3.2 3 1.8 0 5.2 C-3 1.8 -2.8 -3.2 0 -5.2Z';
    // foliage pads: dark underside clusters + lighter tops
    var pads = PADS.map(function (p, q) {
      var out = '';
      for (var c = 0; c < 7; c++) { var a = c / 7 * Math.PI * 2 + q, rx = p[2] * (0.55 + 0.25 * rnd(q * 9 + c)), cx = p[0] + Math.cos(a) * p[2] * 0.55, cy = p[1] + Math.sin(a) * p[3] * 0.5 + 2;
        out += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + (rx * 0.62).toFixed(1) + '" fill="#0C2A1C"/>'; }
      out += '<ellipse cx="' + p[0] + '" cy="' + (p[1] - p[3] * 0.25) + '" rx="' + (p[2] * 0.95) + '" ry="' + (p[3] * 0.85) + '" fill="#123A28"/>';
      out += '<ellipse cx="' + (p[0] - p[2] * 0.15) + '" cy="' + (p[1] - p[3] * 0.55) + '" rx="' + (p[2] * 0.6) + '" ry="' + (p[3] * 0.45) + '" fill="#18503A" opacity=".8"/>';
      return out;
    }).join('');
    var leaves = '';
    for (i = 0; i < shown; i++) {
      var L = LEAVES[i], pad = PADS[i % PADS.length], ang = Math.atan2(L[1] - pad[1] + 6, L[0] - pad[0]) * 180 / Math.PI + 90 + (rnd(i) - 0.5) * 50;
      var shade = L[1] < pad[1] - pad[3] * 0.2 ? 'a' : (L[1] > pad[1] + pad[3] * 0.3 ? 'c' : 'b'), sc = (n > 60 ? 0.95 : 1.15) * (0.85 + rnd(i + 3) * 0.3);
      var isNew = fresh && i === shown - 1;
      leaves += '<g transform="translate(' + L[0].toFixed(1) + ' ' + L[1].toFixed(1) + ')"><g class="' + (isNew ? 'kz-leaf new' : 'kz-leaf') + '"><path d="' + leafPath + '" transform="rotate(' + ang.toFixed(0) + ') scale(' + sc.toFixed(2) + ')" fill="url(#kzl' + shade + ')"/>' +
        '<path d="M0 -4 L0 4" transform="rotate(' + ang.toFixed(0) + ') scale(' + sc.toFixed(2) + ')" stroke="#0E3B27" stroke-width=".5" opacity=".55"/></g>' +
        (isNew ? '<circle class="kz-leaf-ring" r="9" fill="none" stroke="#9BEFC0" stroke-width="1.2"/><g class="kz-leaf-sparks"><circle cx="-5" cy="-2" r=".9" fill="#E9FFF3"/><circle cx="4" cy="-4" r=".7" fill="#E9FFF3"/><circle cx="1" cy="3" r=".8" fill="#E9FFF3"/></g>' : '') + '</g>';
    }
    var flowers = '';
    for (i = 0; i < Math.min(blossoms, 60); i++) {
      var B = LEAVES[(i * 7) % LEAVES.length], fx = B[0] + (rnd(i + 11) - 0.5) * 3, fy = B[1] - 1.5, pet = '';
      for (var k = 0; k < 5; k++) { var aa = k * 72 * Math.PI / 180; pet += '<circle cx="' + (fx + Math.cos(aa) * 1.5).toFixed(2) + '" cy="' + (fy + Math.sin(aa) * 1.5).toFixed(2) + '" r="1.25" fill="#FFF4F0"/>'; }
      flowers += pet + '<circle cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r=".8" fill="#E8C66A"/>';
    }
    var trunk =
      // roots flaring into the soil
      '<path d="M86 150 C 92 146, 95 140, 97 132 L 107 132 C 108 140, 111 146, 118 150 Z" fill="url(#kzbark)"/>' +
      // tapered trunk with a gentle S-curve
      '<path d="M96 134 C 92 122, 112 118, 103 104 C 97 95, 92 86, 97 66 L 101 66 C 98 86, 104 94, 109 103 C 118 118, 101 124, 108 134 Z" fill="url(#kzbark)"/>' +
      // main branches, tapering
      '<path d="M101 112 C 88 108, 75 101, 63 90" stroke="url(#kzbark)" stroke-width="4.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M105 101 C 118 97, 129 90, 138 77" stroke="url(#kzbark)" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M99 86 C 90 80, 82 74, 75 67" stroke="url(#kzbark)" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M101 78 C 110 72, 118 64, 124 57" stroke="url(#kzbark)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      // bark texture
      '<path d="M100 128 C 98 122, 104 118, 102 112 M104 100 C 101 95, 98 90, 99 80" stroke="#4E3518" stroke-width=".8" fill="none" opacity=".6"/>' +
      '<path d="M103 126 C 106 120, 108 116, 106 110" stroke="#C49A5B" stroke-width=".7" fill="none" opacity=".45"/>';
    var pot =
      '<ellipse cx="100" cy="150" rx="34" ry="3.5" fill="#24331F"/>' +   // soil
      '<path d="M76 149 C 84 145, 92 147, 98 148 C 106 146, 116 145, 124 149 Z" fill="#2F5A35" opacity=".9"/>' + // moss
      '<rect x="58" y="149" width="84" height="7" rx="1.5" fill="url(#kzrim)"/>' +
      '<path d="M62 156 H138 L132 171 C131.4 172.4 130.2 173 128.8 173 H71.2 C69.8 173 68.6 172.4 68 171 Z" fill="url(#kzpot)"/>' +
      '<path d="M66 159.5 H134" stroke="#D9CFB9" stroke-width="1.2"/>' +
      '<rect x="71" y="173" width="9" height="3" rx="1" fill="#B8912F"/><rect x="120" y="173" width="9" height="3" rx="1" fill="#B8912F"/>';
    return '<svg class="kz-bonsai" viewBox="30 30 140 150" role="img" aria-label="Bonsai with ' + n + ' leaves">' +
      '<defs>' +
      '<linearGradient id="kzla" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9F5D2"/><stop offset="1" stop-color="#3FBF7F"/></linearGradient>' +
      '<linearGradient id="kzlb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FDDA1"/><stop offset="1" stop-color="#1F9A62"/></linearGradient>' +
      '<linearGradient id="kzlc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3FBF7F"/><stop offset="1" stop-color="#0F6E44"/></linearGradient>' +
      '<linearGradient id="kzbark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A3D1E"/><stop offset=".55" stop-color="#8A6A33"/><stop offset="1" stop-color="#4A3218"/></linearGradient>' +
      '<linearGradient id="kzpot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F0E2"/><stop offset="1" stop-color="#D8CDB4"/></linearGradient>' +
      '<linearGradient id="kzrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0D57A"/><stop offset="1" stop-color="#B8912F"/></linearGradient>' +
      '<radialGradient id="kzglow"><stop offset="0" stop-color="#3FBF7F" stop-opacity=".22"/><stop offset="1" stop-color="#3FBF7F" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="100" cy="78" rx="72" ry="54" fill="url(#kzglow)"/>' + trunk + pads + leaves + flowers + pot + '</svg>';
  };

  // Sound (off by default): a soft two-note chime.
  K.sound = function () {
    if (!K.get('sound', 1)) return;
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      var ctx = K._ac || (K._ac = new C()), t = ctx.currentTime;
      [[660, 0], [990, 0.09]].forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = n[0]; g.gain.setValueAtTime(0.0001, t + n[1]);
        g.gain.exponentialRampToValueAtTime(0.07, t + n[1] + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.5);
        o.connect(g); g.connect(ctx.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.55);
      });
    } catch (e) {}
  };

  // ---------- One tap to complete ----------
  var LEAF = 'M0 -5 C2.6 -3 2.8 1.7 0 5 C-2.8 1.7 -2.6 -3 0 -5Z';
  function leafBurst(el) {
    if (reduce || !el.animate) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 6; i++) {
      var look = K.leafLook ? K.leafLook() : { path: LEAF, colors: ['#2FD38A', '#2FD38A', '#2FD38A'] };
      var p = document.createElement('span'); p.className = 'kz-leafp'; p.innerHTML = '<svg viewBox="-6 -6 12 12"><path d="' + look.path + '" fill="' + look.colors[i % 3] + '"/></svg>';
      p.style.left = cx + 'px'; p.style.top = cy + 'px'; document.body.appendChild(p);
      var a = -Math.PI / 2 + (i - 2.5) * 0.5 + (Math.random() - 0.5) * 0.3, d = 34 + Math.random() * 22, rot = (Math.random() - 0.5) * 220;
      var an = p.animate([{ transform: 'translate(-50%,-50%) rotate(0deg) scale(.6)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + (Math.cos(a) * d).toFixed(1) + 'px), calc(-50% + ' + (Math.sin(a) * d).toFixed(1) + 'px)) rotate(' + rot.toFixed(0) + 'deg) scale(1)', opacity: 0 }], { duration: 560 + Math.random() * 160, easing: 'cubic-bezier(.2,.8,.2,1)' });
      an.onfinish = (function (n) { return function () { n.remove(); }; })(p);
    }
  }
  var undoEl = null, undoT = null;
  function undoChip(id, name) {
    if (!undoEl) { undoEl = document.createElement('div'); undoEl.className = 'kz-undo'; undoEl.setAttribute('role', 'status'); document.body.appendChild(undoEl); }
    var g = K.goals().filter(function (x) { return x.id === id; })[0], note = g && g.log && !document.querySelector('[data-no-expand]');
    undoEl.innerHTML = '<span>Completed · ' + K.esc(name.length > (note ? 14 : 26) ? name.slice(0, note ? 13 : 25) + '…' : name) + '</span>' + (note ? '<button type="button" class="kz-undo-note" data-kz-addnote="' + id + '">Add note</button>' : '') + '<button type="button" data-kz-undo="' + id + '">Undo</button><button type="button" class="kz-undo-x" data-kz-undo-x aria-label="Dismiss"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg></button>';
    undoY = scrollY; undoEl.classList.add('show'); document.body.classList.add('kz-undo-on'); clearTimeout(undoT); undoT = setTimeout(hideUndo, note ? 6000 : 5000);   // Oct 23: 5 s, long enough to notice and reach Undo
  }
  var undoY = 0; addEventListener('scroll', function () { if (undoEl && undoEl.classList.contains('show') && Math.abs(scrollY - undoY) > 60) hideUndo(); }, { passive: true });
  function hideUndo() { clearTimeout(undoT); if (undoEl) undoEl.classList.remove('show'); document.body.classList.remove('kz-undo-on'); }
  function setRow(id, on) {
    document.querySelectorAll('.kz-grow[data-goal="' + id + '"]').forEach(function (row) {
      row.classList.toggle('is-done', on); var b = row.querySelector('.kz-check');
      b.classList.toggle('done', on); b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? 'Completed today. Tap to undo: ' : 'Complete today’s step: ') + row.querySelector('.kz-gname').textContent);
      b.querySelector('.kz-hold-lbl').textContent = on ? 'Completed ✓' : 'Complete';
      var dot = row.querySelector('.kz-gdots i.today'); if (dot) dot.classList.toggle('on', on);
    });
  }
  function grewText() {
    var due = K.goals().length || 1, n = K.treeNamed && K.treeNamed() ? K.treeName() : 'Your tree';
    var mx = K.growMult ? K.growMult(K.key(K.today())) : 1; /* Oct 21: plan multiplier boosts each check-off */
    return '+' + (K.treeInches ? K.treeInches(mx / due) : '1 step') + (mx > 1 ? ' · ×' + (Math.round(mx * 10) / 10) : '') + ' · ' + n + ' grew';
  }
  // Oct 28 · Stage C (kzcheck-1028.js replaces 871e20c7e358.js): a check-off draws in the very next frame.
  // Before, the tap did everything at once before the phone could paint: two forced layouts (to restart the pop
  // animation and the "+ grew" float), the chime, the leaf burst, the undo chip, the falling leaves and the rain over the
  // tree — 200 ms+ on a slow phone before the check even showed. Now the tap only saves, marks the row and starts the pop;
  // everything that reacts to the step (counts, headings, glide) still hears kz:step in the same frame so the screen
  // changes once, and the decorations follow right after that frame is on screen.
  function afterPaint(fn) { requestAnimationFrame(function () { setTimeout(fn, 0); }); }
  function restart(el, cls) {
    if (!el.classList.contains(cls)) { el.classList.add(cls); return; }
    el.classList.remove(cls); requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add(cls); }); });
  }
  function complete(btn) {
    var id = btn.dataset.kzDone, row = btn.closest('.kz-goal'), before = K.shownDays().length;
    K.toggleDone(id); var after = K.shownDays().length;
    setRow(id, true);
    restart(btn, 'pop');
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    // decorations asked for while the step is being handled wait until the check is on screen
    var q = [], lf = K.leafFall, rn = K.rain;
    if (lf) K.leafFall = function () { q.push([lf, arguments]); };
    if (rn) K.rain = function () { q.push([rn, arguments]); };
    try { document.dispatchEvent(new CustomEvent('kz:step', { detail: { id: id, newDay: after > before, newLeaf: true } })); }
    finally { if (lf) K.leafFall = lf; if (rn) K.rain = rn; }
    var all = K.goals(), tk = K.key(K.today()), allDone = false;
    if (all.length && all.every(function (x) { return K.isDone(x.id); }) && K.get('alldone', '') !== tk) { K.set('alldone', tk); allDone = true; }
    afterPaint(function () {
      K.sound(); leafBurst(btn);
      q.forEach(function (c) { try { c[0].apply(K, c[1]); } catch (e) {} });
      if (row) { var f = row.querySelector('.kz-gfloat'); if (f) { f.textContent = grewText(); restart(f, 'show'); } }
      var g = K.goals().filter(function (x) { return x.id === id; })[0]; if (K.isDone(id)) undoChip(id, g ? g.name : 'goal');
      // Every goal done today: one bigger moment, once a day.
      if (allDone) { document.dispatchEvent(new CustomEvent('kz:alldone')); K.track('kz_all_done', { goals: all.length }); }
    });
  }
  function undo(id) {
    if (!K.isDone(id)) return; K.toggleDone(id); var mm = K.get('mini', {}) || {}; if (mm[id]) { delete mm[id][K.key(K.today())]; K.set('mini', mm); } setRow(id, false); hideUndo();
    if (K.get('alldone', '') === K.key(K.today())) K.set('alldone', '');
    document.dispatchEvent(new CustomEvent('kz:changed'));
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('.kz-check'); if (c) { if (c.classList.contains('done')) undo(c.dataset.kzDone); else complete(c); return; }
    if (e.target.closest('[data-kz-undo-x]')) { hideUndo(); return; }
    var u = e.target.closest('[data-kz-undo]'); if (u) { undo(u.dataset.kzUndo); return; }
    var an = e.target.closest('[data-kz-addnote]'); if (an) { hideUndo(); K.openGoalNote(an.dataset.kzAddnote); return; }
  });

  // ---------- ⋯ opens a bottom sheet in the app's own style; each row presses the matching item in the goal's hidden menu ----------
  var GS = null;
  function goalSheet(more) {
    var card = more.closest('.kz-goal'), m = card && card.querySelector('.kz-gmenu'); if (!m) return;
    var g = K.goals().filter(function (x) { return x.id === card.dataset.goal; })[0] || {};
    if (!GS) {
      GS = document.createElement('div'); GS.className = 'kz-sheet49 kz-gsheet'; GS.setAttribute('role', 'dialog'); GS.setAttribute('aria-modal', 'true'); GS.hidden = true;
      document.body.appendChild(GS);
      GS.addEventListener('click', function (e) {
        if (e.target === GS || e.target.closest('[data-gs-x]')) { closeGS(); return; }
        // Oct 21: "Archive or delete" asks right here in the sheet; nothing scrolls or jumps
        if (e.target.closest('[data-gs-no]')) { var ak = GS.querySelector('.kz-gm-ask'); if (ak) { if (ak.previousElementSibling) ak.previousElementSibling.hidden = false; ak.remove(); } return; }
        var aA = e.target.closest('[data-gs-arch]'), aD = e.target.closest('[data-gs-del]');
        if (aA || aD) {
          if (aD && !aD.classList.contains('sure')) { aD.classList.add('sure'); aD.textContent = 'Delete for good'; try { navigator.vibrate(8); } catch (er) {} return; }
          var gc = GS._card, gid = gc && gc.dataset.goal; closeGS(); if (!gid) return; if (gc.isConnected) gc.classList.add('kz-gone');
          setTimeout(function () { if (aA) K.archiveGoal(gid); else K.removeGoal(gid); K.track(aA ? 'kz_goal_archived' : 'kz_goal_deleted'); document.dispatchEvent(new CustomEvent('kz:changed')); }, reduce ? 0 : 260);
          return;
        }
        var b = e.target.closest('[data-gs]'); if (!b || !GS._items) return; var orig = GS._items[+b.dataset.gs], c = GS._card;
        if (orig && orig.classList.contains('kz-gm-del')) {
          if (b.nextElementSibling && b.nextElementSibling.classList.contains('kz-gm-ask')) return;
          var ask = document.createElement('div'); ask.className = 'kz-gm-ask'; ask.setAttribute('role', 'group');
          ask.innerHTML = '<p>Archive or delete this goal?<small>Archive keeps every step and leaf. Delete erases its progress for good.</small></p><div><button type="button" data-gs-arch>Archive</button><button type="button" data-gs-del>Delete</button></div><button type="button" data-gs-no>Cancel</button>';
          b.hidden = true; b.parentNode.insertBefore(ask, b.nextSibling); try { navigator.vibrate(4); } catch (er) {} return;
        }
        closeGS();
        setTimeout(function () { orig.click(); var box = c && c.isConnected && c.querySelector('.kz-editbox:not([hidden]), .kz-delbox:not([hidden])'); if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, reduce ? 0 : 180);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && GS && !GS.hidden) closeGS(); });
    }
    var items = [], row = function (el, tone) { items.push(el); var sp = el.querySelector('span'), sv = el.querySelector('svg');
      return '<button type="button" class="kz-gs-row ' + (tone || '') + '" data-gs="' + (items.length - 1) + '"><i aria-hidden="true">' + (sv ? sv.outerHTML : '') + '</i><span>' + K.esc(sp ? sp.textContent : el.textContent) + '</span>' + (tone === 'nav' ? '<b class="kz-gs-chev" aria-hidden="true">›</b>' : '') + '</button>'; };
    var main = '', mv = '', danger = '';
    [].forEach.call(m.children, function (el) {
      if (el.classList.contains('kz-gm-move')) { [].forEach.call(el.querySelectorAll('button'), function (b) { items.push(b); mv += '<button type="button" class="kz-gs-mv" data-gs="' + (items.length - 1) + '">' + (b.querySelector('svg') || { outerHTML: '' }).outerHTML + '<span>' + K.esc(b.textContent.trim()) + '</span></button>'; }); return; }
      if (el.classList.contains('kz-gm-del')) { danger += row(el, 'red'); return; }
      main += row(el, el.classList.contains('kz-gm-won') ? 'gold' : el.tagName === 'A' ? 'nav' : '');
    });
    GS._items = items; GS._card = card;
    GS.innerHTML = '<div class="kz-sheet-in kz-gs-in"><div class="kz-gs-top"><div><span class="kz-label49">' + (g.kind === 'daily' ? 'Daily habit' : 'Long-term goal') + '</span><h2 class="kz-t49">' + K.esc(g.name || '') + '</h2>' + (g.kind !== 'daily' && g.step ? '<p>Daily: ' + K.esc(g.step) + '</p>' : '') + '</div><button type="button" class="kz-iconbtn" data-gs-x aria-label="Close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="kz-gs-list">' + main + '</div>' + (mv ? '<div class="kz-gs-mvrow" role="group" aria-label="Reorder">' + mv + '</div>' : '') + (danger ? '<div class="kz-gs-list">' + danger + '</div>' : '') + '</div>';
    GS.hidden = false; document.body.classList.add('kz-noscroll'); requestAnimationFrame(function () { GS.classList.add('on'); var f = GS.querySelector('[data-gs]'); if (f) f.focus({ preventScroll: true }); });
    try { navigator.vibrate(4); } catch (er) {}
  }
  function closeGS() { if (!GS) return; GS.classList.remove('on'); document.body.classList.remove('kz-noscroll'); setTimeout(function () { if (!GS.classList.contains('on')) GS.hidden = true; }, reduce ? 0 : 200); }
  K.closeGoalSheet = closeGS;

  // ---------- ⋯ menu, edit, archive/delete, move ----------
  function closeMenus(except) { document.querySelectorAll('.kz-gmenu').forEach(function (m) { if (m !== except) { m.hidden = true; var b = m.parentNode.querySelector('.kz-gmore'); if (b) b.setAttribute('aria-expanded', 'false'); } }); }
  function visibleIds(row) { return [].map.call(row.parentNode.querySelectorAll(':scope > .kz-grow'), function (r) { return r.dataset.goal; }); }
  function refocus(id, sel) { var f = function () { var r = document.querySelector('.kz-grow[data-goal="' + id + '"] ' + sel); if (r && document.activeElement !== r) r.focus(); }; f(); setTimeout(f, 30); }
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-kz-editform]'); if (!f) return; e.preventDefault();
    var pick = function (a) { var b = f.querySelector('[' + a + '][aria-pressed="true"]'); return b ? b.getAttribute(a) : ''; };
    var lg = f.querySelector('[data-elog]'); K.updateGoal(f.dataset.kzEditform, { name: f.elements.name.value, step: f.elements.step.value, cue: f.elements.cue ? f.elements.cue.value : undefined, mini: f.elements.mini ? f.elements.mini.value : undefined, path: pick('data-epath'), kind: pick('data-ekind'), log: lg ? lg.getAttribute('aria-checked') === 'true' : undefined });
    K.track('kz_goal_edited'); document.dispatchEvent(new CustomEvent('kz:changed'));
  });
  K.miniToday = function (id) { var m = (K.get('mini', {}) || {})[id]; return !!(m && m[K.key(K.today())]); };
  document.addEventListener('click', function (e) {
    var mb = e.target.closest('[data-kz-mini]');
    if (mb) {
      var id = mb.dataset.kzMini, m = K.get('mini', {}) || {}, k = K.key(K.today()); (m[id] = m[id] || {})[k] = 1; K.set('mini', m); K.track('kz_mini_done');
      var row = document.querySelector('.kz-grow[data-goal="' + id + '"] .kz-check'); if (row && !K.isDone(id)) row.click(); else if (!K.isDone(id)) { K.toggleDone(id); document.dispatchEvent(new CustomEvent('kz:changed')); }
      return;
    }
    var more = e.target.closest('[data-kz-more]');
    if (more) { goalSheet(more); return; }
    if (!e.target.closest('.kz-gmenu')) closeMenus();
    var mv = e.target.closest('[data-kz-move]');
    if (mv) { var row = mv.closest('.kz-grow'), id = row.dataset.goal; closeMenus(); if (K.moveGoal(id, +mv.dataset.kzMove, visibleIds(row))) refocus(id, '.kz-gmore'); return; }
    var ed = e.target.closest('[data-kz-edit]'), edNo = e.target.closest('[data-kz-edit-no]'), ep = e.target.closest('[data-epath]'), ek = e.target.closest('[data-ekind]');
    if (ed) { closeMenus(); var f = ed.closest('.kz-goal').querySelector('.kz-editbox'); f.hidden = !f.hidden; if (!f.hidden) { ed.closest('.kz-goal').querySelector('.kz-delbox').hidden = true; f.querySelector('input').focus(); } return; }
    if (edNo) { edNo.closest('.kz-editbox').hidden = true; return; }
    if (ep || ek) { var grp = (ep || ek).parentNode, attr = ep ? 'data-epath' : 'data-ekind'; grp.querySelectorAll('[' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', String(b === (ep || ek))); }); return; }
    var del = e.target.closest('[data-kz-del]'), yes = e.target.closest('[data-kz-del-yes]'), no = e.target.closest('[data-kz-del-no]'), arch = e.target.closest('[data-kz-arch]');
    var drop = function (btn, fn, ev) { var card = btn.closest('.kz-goal'); card.classList.add('kz-gone'); setTimeout(function () { fn(); K.track(ev); document.dispatchEvent(new CustomEvent('kz:changed')); }, reduce ? 0 : 260); };
    if (arch) { drop(arch, function () { K.archiveGoal(arch.dataset.kzArch); }, 'kz_goal_archived'); return; }
    var won = e.target.closest('[data-kz-won]');
    if (won) { closeMenus(); var wid = won.dataset.kzWon, wg = K.goals().filter(function (x) { return x.id === wid; })[0]; drop(won, function () { K.updateGoal(wid, { won: K.key(K.today()) }); K.archiveGoal(wid); if (K.toast && wg) K.toast('Achieved: ' + wg.name + '. It’s saved in Archived goals.'); try { navigator.vibrate([10, 40, 10]); } catch (er) {} }, 'kz_goal_won'); return; }
    if (yes && !yes.dataset.sure) { yes.dataset.sure = '1'; yes.textContent = 'Delete for good'; yes.closest('.kz-delbox').querySelector('[data-kz-del-sure]').hidden = false; return; }
    // Oct 21: from the ⋯ menu, Archive / Delete is asked right inside the menu (no jump to the card)
    var gmA = e.target.closest('[data-kz-gm-arch]'), gmD = e.target.closest('[data-kz-gm-del]'), gmN = e.target.closest('[data-kz-gm-no]');
    if (gmN) { var ask0 = gmN.closest('.kz-gm-ask'), d0 = ask0.previousElementSibling; if (d0) d0.hidden = false; ask0.remove(); return; }
    if (gmA) { closeMenus(); drop(gmA, function () { K.archiveGoal(gmA.dataset.kzGmArch); }, 'kz_goal_archived'); return; }
    if (gmD) { if (!gmD.classList.contains('sure')) { gmD.classList.add('sure'); gmD.textContent = 'Delete for good'; return; } closeMenus(); drop(gmD, function () { K.removeGoal(gmD.dataset.kzGmDel); }, 'kz_goal_deleted'); return; }
    if (del && del.closest('.kz-gmenu')) { var gid = del.dataset.kzDel, ask = document.createElement('div'); ask.className = 'kz-gm-ask'; ask.setAttribute('role', 'group');
      ask.innerHTML = '<p>Archive or delete this goal?<small>Archive keeps every step and leaf. Delete erases its progress for good.</small></p><div><button type="button" data-kz-gm-arch="' + gid + '">Archive</button><button type="button" data-kz-gm-del="' + gid + '">Delete</button></div><button type="button" data-kz-gm-no>Cancel</button>';
      del.hidden = true; del.parentNode.insertBefore(ask, del.nextSibling); try { navigator.vibrate(4); } catch (er) {} return; }
    if (del) { closeMenus(); var box = del.closest('.kz-goal').querySelector('.kz-delbox'); box.hidden = !box.hidden; return; }
    if (no) { no.closest('.kz-delbox').hidden = true; return; }
    if (yes) { drop(yes, function () { K.removeGoal(yes.dataset.kzDelYes); }, 'kz_goal_deleted'); return; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenus();
    var h = e.target.closest && e.target.closest('[data-kz-drag]');
    if (h && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); var row = h.closest('.kz-grow'), id = row.dataset.goal; if (K.moveGoal(id, e.key === 'ArrowUp' ? -1 : 1, visibleIds(row))) refocus(id, '[data-kz-drag]'); }
  });

  // ---------- Expand / collapse a row ----------
  function rerender() { document.dispatchEvent(new CustomEvent('kz:goals')); }
  function findGoal(id) { return K.goals().filter(function (g) { return g.id === id; })[0]; }
  function setOpen(row, on) {
    var x = row.querySelector('.kz-gx'), t = row.querySelector('[data-kz-expand]'), g = findGoal(row.dataset.goal);
    if (on && !x && g) { var tmp = document.createElement('div'); tmp.innerHTML = K.gxHTML(g); x = tmp.firstChild; var after = row.querySelector('.kz-gmenu'); row.insertBefore(x, after ? after.nextSibling : null); }
    if (!on && x) x.remove();
    row.classList.toggle('open', on); if (t) { t.setAttribute('aria-expanded', String(on)); }
  }
  // Expand in place: no list re-render, so nothing jumps or flashes.
  function toggle(row, focusNote) {
    var id = row.dataset.goal, opening = openId !== id;
    document.querySelectorAll('.kz-grow.open').forEach(function (r) { if (r !== row || !opening) setOpen(r, false); });
    openId = opening ? id : null;
    document.querySelectorAll('.kz-grow[data-goal="' + id + '"]').forEach(function (r) { if (!r.closest('[data-no-expand]')) setOpen(r, opening); });
    if (opening && focusNote) { var b = row.querySelector('.kz-gnbox'); if (b) { try { b.focus({ preventScroll: true }); } catch (e) {} b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    K.track(opening ? 'kz_goal_expand' : 'kz_goal_collapse');
  }
  K.openGoalNote = function (id) { var row = [].filter.call(document.querySelectorAll('.kz-grow[data-goal="' + id + '"]'), function (r) { return !r.closest('[data-no-expand]'); })[0]; if (!row) return; if (openId !== id) toggle(row, true); else { var b = row.querySelector('.kz-gnbox'); if (b) b.focus(); } };
  K.collapseGoals = function () { document.querySelectorAll('.kz-grow.open').forEach(function (r) { setOpen(r, false); }); openId = null; };
  // Long-term goals: tap the card to fold it to just its title (title, ⋯ and check all on one line), tap again to unfold.
  // Each goal remembers. The small chevron under the step still opens the stats / journal panel.
  function toggleCompact(row) {
    var id = row.dataset.goal, m = K.get('gcompact', {}) || {}, on = !m[id];
    if (on) m[id] = 1; else delete m[id]; K.set('gcompact', m);
    document.querySelectorAll('.kz-grow[data-goal="' + id + '"]').forEach(function (r) {
      if (r.closest('[data-no-expand]')) return;
      var h0 = r.offsetHeight; if (on) setOpen(r, false); r.classList.toggle('compact', on);
      var t = r.querySelector('[data-kz-expand]'); if (t) { t.setAttribute('aria-expanded', String(!on)); t.setAttribute('aria-label', (findGoal(id) || {}).name + (on ? '. Tap to show today\u2019s step.' : '. Tap to fold to the title.')); }
      var h1 = r.offsetHeight; if (r.animate && h0 !== h1 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { r.style.overflow = 'hidden'; var a = r.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' }); a.onfinish = a.oncancel = function () { r.style.overflow = ''; }; }
    });
    if (on && openId === id) openId = null;
    try { navigator.vibrate(4); } catch (er) {} K.track(on ? 'kz_goal_fold' : 'kz_goal_unfold');
  }
  K.toggleCompact = function (id) { var r = document.querySelector('.kz-grow[data-goal="' + id + '"]'); if (r) toggleCompact(r); };
  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-kz-expand]');
    if (x && !e.target.closest('a,button,textarea,input') && !x.closest('[data-no-expand]')) {
      var row = x.closest('.kz-grow'), g = findGoal(row.dataset.goal), longTerm = g && g.kind !== 'daily';
      if (longTerm && !e.target.closest('.kz-gchev')) { toggleCompact(row); return; }
      toggle(row); return;
    }
    var on = e.target.closest('[data-kz-logon]'); if (on) { var r0 = on.closest('.kz-grow'); K.updateGoal(on.dataset.kzLogon, { log: true }); K.track('kz_goal_journal_on'); if (r0) { setOpen(r0, false); setOpen(r0, true); var b = r0.querySelector('.kz-gnbox'); if (b) b.focus(); } return; }
    var sv = e.target.closest('[data-gnsave]'); if (sv) { saveNote(sv.closest('[data-gnote]').querySelector('.kz-gnbox'), true); return; }
    var sw = e.target.closest('[data-elog]'); if (sw) { sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true')); return; }
  });
  document.addEventListener('keydown', function (e) {
    var x = e.target.closest && e.target.closest('[data-kz-expand]');
    if (x && e.target === x && !x.closest('[data-no-expand]') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); var r = x.closest('.kz-grow'), g = findGoal(r.dataset.goal); if (g && g.kind !== 'daily') toggleCompact(r); else toggle(r); }
  });
  // Goal note boxes (rows and the goal page): grow, save on their own, say "Saved".
  var noteT = {};
  var NOTE_ICON = '<svg class="kz-gnicon" aria-label="Has notes" viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z M15 4v4h4 M8 12h8 M8 16h6"/></svg>';
  function saveNote(box, submit) {
    var w = box.closest('[data-gnote]'); if (!w) return; var had = !!box.value.trim(); K.setGNote(w.dataset.gnote, w.dataset.day, box.value);
    var s = w.querySelector('.kz-gnsaved'); if (s && !submit) { s.textContent = 'Saved'; clearTimeout(s._t); s._t = setTimeout(function () { s.textContent = ''; }, 1600); }
    if (!submit) return;
    var btn = w.querySelector('[data-gnsave]'); if (!had) { box.focus(); if (s) s.textContent = 'Write something first'; return; }
    if (s) s.textContent = '';
    btn.classList.remove('kz-saved-pop'); void btn.offsetWidth; btn.classList.add('kz-saved-pop'); btn.innerHTML = '✓ Saved'; btn.disabled = true;
    try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
    K.track('kz_goal_note_saved', { length: box.value.length });
    var row = w.closest('.kz-grow');
    if (row) { // the row gets its note icon, then folds away
      document.querySelectorAll('.kz-grow[data-goal="' + row.dataset.goal + '"] .kz-gline').forEach(function (l) { if (!l.querySelector('.kz-gnicon')) { var st = l.querySelector('.kz-gstage'); st.insertAdjacentHTML('beforebegin', NOTE_ICON); } });
      setTimeout(function () { if (row.isConnected && row.classList.contains('open')) { openId = null; setOpen(row, false); } }, 900);
    } else setTimeout(function () { btn.disabled = false; btn.textContent = 'Update note'; }, 1200);
  }
  document.addEventListener('input', function (e) {
    var box = e.target.closest && e.target.closest('.kz-gnbox'); if (!box) return;
    if (K.autoGrow && !box._grow) { box._grow = 1; K.autoGrow(box); }
    var w0 = box.closest('[data-gnote]'), s0 = w0 && w0.querySelector('.kz-gnsaved'), sb = w0 && w0.querySelector('[data-gnsave]'); if (s0 && s0.textContent === 'Write something first') s0.textContent = ''; if (sb && sb.disabled) { sb.disabled = false; sb.textContent = 'Update note'; }
    var key = box.id; clearTimeout(noteT[key]); noteT[key] = setTimeout(function () { saveNote(box); }, 600);
  });
  document.addEventListener('focusout', function (e) { var box = e.target.closest && e.target.closest('.kz-gnbox'); if (box) { clearTimeout(noteT[box.id]); saveNote(box); } });
  document.addEventListener('focusin', function (e) { var box = e.target.closest && e.target.closest('.kz-gnbox'); if (box && !box._grow && K.autoGrow) { box._grow = 1; K.autoGrow(box); if (K.dictate && !box._mic) { box._mic = 1; K.dictate(box); } } });

  // ---------- Drag to reorder (handle only) ----------
  var drag = null;
  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('[data-kz-drag]'); if (!h || e.button > 0) return;
    var row = h.closest('.kz-grow'); e.preventDefault();
    if (row.classList.contains('open')) { K.collapseGoals(); row = document.querySelector('.kz-grow[data-goal="' + row.dataset.goal + '"]') || row; h = row.querySelector('[data-kz-drag]') || h; }
    drag = { row: row, h: h, x0: e.clientX, y0: e.clientY, y: e.clientY, live: false, pid: e.pointerId, list: row.parentNode }; dragOn();
    drag.wait = setTimeout(function () { if (drag && !drag.live) start(); }, e.pointerType === 'mouse' ? 0 : 150);
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
  });
  // Press and hold a goal (no handle needed), then slide it up or down
  var LP = 420;
  document.addEventListener('pointerdown', function (e) {
    if (drag || e.button > 0 || e.pointerType === 'mouse') return;
    var row = e.target.closest('.kz-grow'); if (!row || row.classList.contains('open') || row.classList.contains('kz-swopen')) return;
    if (e.target.closest('[data-kz-drag], .kz-check, .kz-gmore, .kz-gmenu, .kz-gswipe, .kz-editbox, .kz-delbox, .kz-gx, a, input, textarea')) return;
    if (!row.parentNode.querySelectorAll(':scope > .kz-grow')[1]) return; // nothing to reorder against
    drag = { row: row, h: row, x0: e.clientX, y0: e.clientY, y: e.clientY, live: false, pid: e.pointerId, list: row.parentNode, lp: true }; dragOn();
    drag.wait = setTimeout(function () { if (drag && !drag.live && drag.lp) { start(); lpSwallow = true; } }, LP);
  });
  var lpSwallow = false;
  document.addEventListener('pointermove', function (e) {
    if (!drag || !drag.lp || drag.live || e.pointerId !== drag.pid) return;
    if (Math.abs(e.clientX - drag.x0) > 8 || Math.abs(e.clientY - drag.y0) > 8) { clearTimeout(drag.wait); drag = null; } // a scroll or a swipe, not a hold
  });
  var dragTM = function (e) { if (drag && drag.live) { e.preventDefault(); if (e.touches[0]) drag.y = e.touches[0].clientY; } };
  var dragOff = function () { document.removeEventListener('touchmove', dragTM, { passive: false }); };
  var dragOn = function () { document.addEventListener('touchmove', dragTM, { passive: false }); };
  document.addEventListener('touchend', function () { if (drag && drag.lp) end(); if (!drag) dragOff(); }, { passive: true });
  document.addEventListener('click', function (e) { if (lpSwallow) { lpSwallow = false; if (e.target.closest('.kz-grow')) { e.stopPropagation(); e.preventDefault(); } } }, true);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.kz-grow')) e.preventDefault(); });
  function start() {
    var row = drag.row, r = row.getBoundingClientRect(), ph = document.createElement('div');
    ph.className = 'kz-gph'; ph.style.height = r.height + 'px'; row.parentNode.insertBefore(ph, row);
    drag.ph = ph; drag.off = drag.y - r.top; drag.live = true;
    row.classList.add('kz-lift'); row.style.width = r.width + 'px'; row.style.left = r.left + 'px'; row.style.top = r.top + 'px';
    document.body.classList.add('kz-dragging');
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
    tick();
  }
  function place() {
    var y = drag.y, sibs = [].filter.call(drag.list.querySelectorAll(':scope > .kz-grow'), function (s) { return s !== drag.row; }), target = null;
    for (var i = 0; i < sibs.length; i++) { var r = sibs[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { target = sibs[i]; break; } }
    var cur = drag.ph.nextElementSibling === drag.row ? drag.row.nextElementSibling : drag.ph.nextElementSibling;
    if (target === cur || (!target && drag.ph === lastRow())) return;
    // FLIP: rows slide out of the way
    var before = sibs.map(function (s) { return s.getBoundingClientRect().top; });
    if (target) drag.list.insertBefore(drag.ph, target); else drag.list.appendChild(drag.ph);
    sibs.forEach(function (s, i) { var d = before[i] - s.getBoundingClientRect().top; if (d && s.animate && !reduce) s.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 160, easing: 'ease-out' }); });
  }
  function lastRow() { var all = drag.list.querySelectorAll(':scope > .kz-grow, :scope > .kz-gph'); return all[all.length - 1]; }
  function tick() {
    if (!drag || !drag.live) return;
    drag.row.style.top = (drag.y - drag.off) + 'px';
    var edge = 70, vh = window.innerHeight;
    if (drag.y < edge) window.scrollBy(0, -Math.ceil((edge - drag.y) / 6)); else if (drag.y > vh - edge) window.scrollBy(0, Math.ceil((drag.y - (vh - edge)) / 6));
    place(); requestAnimationFrame(tick);
  }
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pid) return; drag.y = e.clientY;
    if (!drag.live && Math.abs(e.clientY - drag.y0) > 6 && e.pointerType === 'mouse') { clearTimeout(drag.wait); start(); }
  });
  function end(e) {
    setTimeout(function () { if (!drag) dragOff(); }, 0);
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    if (e && e.type === 'pointercancel' && drag.lp && drag.live) return; // iPhone sends this mid-hold; the touchend finishes the move
    clearTimeout(drag.wait);
    var d = drag; drag = null; if (!d.live) return;
    d.list.insertBefore(d.row, d.ph); d.ph.remove();
    d.row.classList.remove('kz-lift'); d.row.style.width = d.row.style.left = d.row.style.top = '';
    document.body.classList.remove('kz-dragging');
    var ids = [].map.call(d.list.querySelectorAll(':scope > .kz-grow'), function (r) { return r.dataset.goal; });
    var id = d.row.dataset.goal; K.reorderVisible(ids); K.track('kz_goal_dragged', { via: d.lp ? 'hold' : 'handle' }); if (!d.lp) refocus(id, '[data-kz-drag]');
    try { if (navigator.vibrate) navigator.vibrate(6); } catch (x) {}
  }
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzp1-1023c.js ==== */
;try {
/* Oct 23 Phase 1 (all pages)
   6. Accounts are off in v1.0. The sign-up / log-in code stays, behind this flag. */
(function () {
  var K = window.KZ || {};
  K.ACCOUNTS_ON = false;   // v1.0 launches with no accounts; flip only when sync ships (and the privacy policy says so)
  if (!K.ACCOUNTS_ON) {
    var de = document.documentElement; de.classList.add('kz-nosync-cfg', 'kz-noacct');
    var note = function () {
      var si = document.getElementById('kz-signin'); if (!si || si.querySelector('.kz-v1acct')) return;
      var d = document.createElement('div'); d.className = 'kz-v1acct';
      d.innerHTML = '<h1 class="kz-si-t">No account needed</h1><p class="kz-si-sub">In this version everything stays on this iPhone. There’s nothing to sign up for.</p>';
      var box = si.querySelector('.kz-si-in') || si, out = box.querySelector('[data-si="out"]');
      box.insertBefore(d, out || box.firstChild);
      var sk = si.querySelector('[data-si="skip"]'); if (sk) sk.textContent = 'Back';
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', note); else note();
  }
})();
/* 2. Visitor speech on Today's small tree picture: the picture clips anything outside it (rounded, overflow hidden),
   so a line said there is lifted out and shown above the picture, kept on screen, with its tail still on the animal. */
(function () {
  var HOST = '.kz-pcard-tree', floats = [];
  function place(b, cr) {
    var r = cr.getBoundingClientRect(), w = b.offsetWidth, h = b.offsetHeight, vw = innerWidth, cx = r.left + r.width / 2;
    var x = Math.min(Math.max(cx, 10 + w / 2), vw - 10 - w / 2), top = r.top - h - 9, below = top < 64;
    if (below) top = r.bottom + 9;
    b.style.left = x + 'px'; b.style.top = top + 'px'; b.classList.toggle('below', below);
    b.style.setProperty('--kzt', Math.min(Math.max(50 + (cx - x) / w * 100, 12), 88).toFixed(1) + '%');
  }
  function lift(b) {
    var cr = b.parentElement; if (!cr || !cr.closest(HOST)) return;
    if (cr.__kzSay && cr.__kzSay !== b && cr.__kzSay.isConnected) cr.__kzSay.remove();
    cr.__kzSay = b; b.classList.add('kz-say-float'); document.body.appendChild(b); place(b, cr); floats.push(b);
  }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
      var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && n.classList.contains('kz-say') && !n.classList.contains('kz-say-float')) lift(n);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('scroll', function () { floats = floats.filter(function (b) { if (b.isConnected) b.remove(); return false; }); }, { passive: true });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzgs-1023d.js ==== */
;try {
/* Oct 23 Phase 1B: one goal sheet everywhere.
   The same bottom sheet as Today's "+" (same classes, same fields, same look), used to ADD a goal on every page except Today
   (Today keeps its own sheet, which also adds to-dos) and to EDIT a goal on every page, Today included.
   It writes through the same calls the old forms used: K.addGoal (add) and K.updateGoal (edit). */
(function () {
  var K = window.KZ; if (!K || K.goalSheet) return;
  var sheet = null, form = null, kind = 'long', path = '', editId = null, list = [];
  var onToday = function () { return !!document.querySelector('#kz-today-s1 [data-t="sheet"]'); };
  var $ = function (k) { return sheet.querySelector('[data-gx="' + k + '"]'); };
  var pillars = function () { return (K.PATHS || []).slice(0, 8); };
  var opt = ' <i class="kz-opt">(optional)</i>';
  function build() {
    sheet = document.createElement('div');
    sheet.className = 'kz-sheet49 kz-addsheet kz-goalsheet'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'kz-gs-t');
    sheet.innerHTML = '<form class="kz-sheet-in" data-gx="form" novalidate>' +
      '<div class="kz-sheet-top"><h2 class="kz-t49" id="kz-gs-t" data-gx="t">New goal</h2><button type="button" class="kz-iconbtn" data-gx="close" aria-label="Close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="kz-kindseg" role="radiogroup" aria-label="Type" data-gx="kinds"><button type="button" role="radio" data-kind="long" aria-checked="true">Long-term</button><button type="button" role="radio" data-kind="daily" aria-checked="false">Daily habit</button></div>' +
      '<label class="kz-field49"><span class="kz-label49" data-gx="gname-l">The goal</span><input data-gx="gname" maxlength="90" placeholder="Finish a sprint triathlon in June" autocomplete="off" required></label>' +
      '<button type="button" class="kz-morebtn" data-gx="more" aria-expanded="false" aria-controls="kz-gs-more"><span>Make it stick' + opt + '</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<div class="kz-moregrp" id="kz-gs-more" data-gx="moreBox" hidden>' +
        '<label class="kz-field49" data-gx="gstep-w"><span class="kz-label49">Daily habit for it' + opt + '</span><input data-gx="gstep" maxlength="140" placeholder="Run for 20 minutes" autocomplete="off"></label>' +
        '<label class="kz-field49"><span class="kz-label49">When will you do it?' + opt + '</span><span class="kz-cuein"><b>After I…</b><input data-gx="gcue" maxlength="80" placeholder="pour my morning coffee" autocomplete="off"></span><small class="kz-hint49">Tie it to something you already do. Plans like this make follow-through more likely.</small></label>' +
        '<label class="kz-field49"><span class="kz-label49">Bad-day version' + opt + '</span><input data-gx="gmini" maxlength="80" placeholder="Put on my running shoes" autocomplete="off"><small class="kz-hint49">A 2-minute version. On a rough day, doing it still counts. Never miss twice.</small></label>' +
        '<label class="kz-steprow kz-switchrow"><span><strong>Keep a log</strong><em>A note box for this goal, every day</em></span><input type="checkbox" class="kz-sw49" data-gx="glog"></label>' +
      '</div>' +
      '<div class="kz-field49" data-gx="picks-wrap"><span class="kz-label49 gold">Quick picks</span><div class="kz-picks49" data-gx="picks"></div><div class="kz-pdots49" data-gx="pdots" aria-hidden="true"></div></div>' +
      '<div class="kz-field49"><span class="kz-label49">Branch</span><div class="kz-chips49" data-gx="pillars" role="group" aria-label="Branch"></div></div>' +
      '<p class="kz-note kz-gs-keep" data-gx="keep" hidden>Progress and notes stay with this goal.</p>' +
      '<p class="kz-err49" data-gx="err" hidden>Name your goal first.</p>' +
      '<button type="submit" class="kz-btn gold"><svg data-gx="plus" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span data-gx="submit-l">Add goal</span></button>' +
      '</form>';
    document.body.appendChild(sheet); form = $('form');
    $('kinds').addEventListener('click', function (e) { var b = e.target.closest('[data-kind]'); if (!b) return; kind = b.dataset.kind; paintKind(); try { navigator.vibrate(4); } catch (er) {} });
    $('more').addEventListener('click', function () { setMore($('more').getAttribute('aria-expanded') !== 'true'); });
    $('close').addEventListener('click', close);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet && !sheet.hidden) close(); });
    var gT = 0; $('gname').addEventListener('input', function () { $('err').hidden = true; clearTimeout(gT); var v = this.value; gT = setTimeout(function () { guess(v); }, 180); });
    $('pillars').addEventListener('click', function (e) {
      var sg = e.target.closest('[data-psug]');
      if (sg) { var id = K.addPillar ? K.addPillar(sg.dataset.psug) : null; if (id) { path = id; K.track('kz_pillar_suggested', { name: sg.dataset.psug }); } paintPillars(); paintPicks(); return; }
      var b = e.target.closest('[data-p]'); if (!b) return; path = b.dataset.p; paintPillars(); paintPicks();
    });
    $('picks').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]'); if (!b || !b.classList.contains('on')) return; var x = list[+b.dataset.pick]; if (!x) return;
      if (kind === 'daily') { $('gname').value = x.s || x.n; $('gstep').value = ''; } else { $('gname').value = x.n; $('gstep').value = x.s || ''; }
      $('err').hidden = true; if ($('gstep').value) setMore(true);
    });
    picksCarousel();
    form.addEventListener('submit', submit);
  }
  // The quick-picks carousel: same behaviour as Today's (centre card is active; tapping a side card scrolls it in)
  function picksCarousel() {
    var c = $('picks'), d = $('pdots'), cur = -1, raf = 0;
    var cards = function () { return Array.prototype.slice.call(c.querySelectorAll('[data-pick]')); };
    var act = function () {
      var cs = cards(); if (!cs.length) { d.innerHTML = ''; return; }
      var m = c.scrollLeft + c.clientWidth / 2, best = 0, bd = 1e9;
      cs.forEach(function (b, i) { var x = b.offsetLeft + b.offsetWidth / 2, dd = Math.abs(x - m); if (dd < bd) { bd = dd; best = i; } });
      if (d.children.length !== cs.length) d.innerHTML = cs.map(function () { return '<span></span>'; }).join('');
      cs.forEach(function (b, i) { b.classList.toggle('on', i === best); }); Array.prototype.forEach.call(d.children, function (s, i) { s.classList.toggle('on', i === best); });
      if (best !== cur) { if (cur !== -1) { try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'tick' }); } catch (e) {} } cur = best; }
    };
    c.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; act(); }); }, { passive: true });
    new MutationObserver(function () { cur = -1; c.scrollLeft = 0; act(); }).observe(c, { childList: true });
    c.parentNode.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-pick]'); if (!b || !c.contains(b)) return; if (!b.classList.contains('on')) { e.stopPropagation(); e.preventDefault(); c.scrollTo({ left: b.offsetLeft - (c.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' }); } }, true);
  }
  var PSUG = [
    [/\b(run|running|gym|lift|lifting|bench|squat|triathlon|swim|bike|cycling|marathon|5k|10k|bulk|cut|muscle|workout|train|wrestl|jiu|bjj|sport|athlet|cardio|abs)\w*/i, 'Fitness'],
    [/\b(eat|diet|calorie|protein|meal|nutrition|cook|water|sugar|fast)\w*/i, 'Nutrition'],
    [/\b(study|class|gpa|exam|test|homework|school|college|grade|course|midterm|final|lecture|major)\w*/i, 'Education'],
    [/\b(save|saving|money|invest|budget|debt|stock|trade|trading|futures|finance|income|\$)\w*/i, 'Finances'],
    [/\b(job|career|internship|resume|interview|work|promotion|network|linkedin)\w*/i, 'Career'],
    [/\b(business|startup|brand|sell|selling|clothing|shop|store|client|marketing|tiktok|content)\w*/i, 'Business'],
    [/\b(read|reading|book|pages)\w*/i, 'Reading'],
    [/\b(pray|prayer|church|bible|faith|god|mass)\w*/i, 'Faith'],
    [/\b(mom|dad|family|brother|sister|grandma|grandpa|parents|home)\w*/i, 'Family'],
    [/\b(friend|girlfriend|boyfriend|date|dating|chapter|frat|social|call)\w*/i, 'Relationships'],
    [/\b(sleep|bed|wake|morning)\w*/i, 'Sleep'],
    [/\b(meditat|journal|mindful|therapy|calm|stress|phone|screen)\w*/i, 'Mind'],
    [/\b(guitar|piano|music|draw|paint|write|writing|design|photo|film|art|creat)\w*/i, 'Creativity'],
    [/\b(skin|skincare|style|groom|hair|clean|room|organiz)\w*/i, 'Self-care']
  ];
  function pillarSugs() {
    var txt = $('gname').value || '', have = (K.PATHS || []).map(function (p) { return p.name.toLowerCase(); }), out = [];
    if ((K.PATHS || []).length >= (K.MAX_PILLARS || 8)) return out;
    PSUG.forEach(function (x) { if (out.length < 3 && x[0].test(txt) && have.indexOf(x[1].toLowerCase()) < 0 && out.indexOf(x[1]) < 0) out.push(x[1]); });
    return out;
  }
  function paintPillars() {
    $('pillars').innerHTML = pillars().map(function (p) { return '<button type="button" data-p="' + p.id + '" aria-pressed="' + (p.id === path) + '" style="--pc: ' + p.c2 + '">' + K.esc(p.name) + '</button>'; }).join('') +
      pillarSugs().map(function (n) { return '<button type="button" class="sug" data-psug="' + K.esc(n) + '" aria-label="Add ' + K.esc(n) + ' as a branch">' + K.esc(n) + '</button>'; }).join('');
  }
  function paintPicks() {
    list = editId || !K.libraryList ? [] : K.libraryList(path || (pillars()[0] || {}).id) || [];
    $('picks-wrap').hidden = !list.length;
    $('picks').innerHTML = list.slice(0, 30).map(function (x, i) { return kind === 'daily' ? '<button type="button" data-pick="' + i + '"><b>' + K.esc(x.s || x.n) + '</b></button>' : '<button type="button" data-pick="' + i + '"><b>' + K.esc(x.n) + '</b>' + (x.s ? '<i>Daily</i><span>' + K.esc(x.s) + '</span>' : '') + '</button>'; }).join('');
  }
  function paintKind() {
    $('kinds').querySelectorAll('[data-kind]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.kind === kind)); });
    $('gstep-w').hidden = kind !== 'long';
    $('gname-l').textContent = kind === 'daily' ? 'The habit' : 'The goal';
    $('gname').placeholder = kind === 'daily' ? 'Read 10 pages' : 'Finish a sprint triathlon in June';
    paintPicks();
  }
  function setMore(on) { $('more').setAttribute('aria-expanded', String(on)); $('moreBox').hidden = !on; }
  function guess(v) {
    var gp = K.guessPath ? K.guessPath(v) : '';
    if (!editId && gp && gp !== path && v.length > 3 && pillars().some(function (p) { return p.id === gp; })) { path = gp; paintPicks(); }
    paintPillars();
  }
  function open(o) {
    o = o || {}; if (!sheet) build();
    form.reset(); $('err').hidden = true; setMore(false);
    var g = o.mode === 'edit' ? K.goals().filter(function (x) { return x.id === o.id; })[0] : null;
    editId = g ? g.id : null;
    if (g) {
      kind = g.kind === 'daily' ? 'daily' : 'long';
      path = (K.pathOf ? K.pathOf(g) : g.path) || (pillars()[0] || {}).id || '';
      $('gname').value = g.name || ''; $('gstep').value = g.step || ''; $('gcue').value = g.cue || ''; $('gmini').value = g.mini || ''; $('glog').checked = !!g.log;
      if (g.step || g.cue || g.mini || g.log) setMore(true);
    } else {
      kind = o.kind === 'daily' ? 'daily' : 'long';
      path = o.path && pillars().some(function (p) { return p.id === o.path; }) ? o.path : (pillars()[0] || {}).id || '';
      if (o.name) $('gname').value = o.name;
      if (o.step && kind === 'long') { $('gstep').value = o.step; setMore(true); }
    }
    $('t').textContent = g ? 'Edit goal' : 'New goal';
    $('submit-l').textContent = g ? 'Save' : 'Add goal';
    $('plus').style.display = g ? 'none' : '';
    $('keep').hidden = !g;
    paintPillars(); paintKind();
    sheet.hidden = false; document.body.classList.add('kz-noscroll');
    if (!g && !o.name) setTimeout(function () { $('gname').focus(); }, 60);
    K.track(g ? 'kz_edit_open' : 'kz_add_open', { from: 'sheet' });
  }
  function close() { if (!sheet) return; sheet.hidden = true; document.body.classList.remove('kz-noscroll'); }
  function submit(e) {
    e.preventDefault(); var name = $('gname').value.trim();
    if (!name) { $('err').hidden = false; $('gname').focus(); return; }
    var gk = kind === 'daily' ? 'daily' : 'long', st = gk === 'long' ? $('gstep').value.trim() : '', log = $('glog').checked;
    if (editId) {
      var g0 = K.goals().filter(function (x) { return x.id === editId; })[0] || {};
      if (gk === 'daily' && g0.kind === 'daily') st = g0.step || '';   // a daily habit's step isn't shown here; keep whatever it had
      K.updateGoal(editId, { name: name, step: st, cue: $('gcue').value, mini: $('gmini').value, path: path, kind: gk, log: log });
      K.track('kz_goal_edited', { from: 'sheet' });
      close(); document.dispatchEvent(new CustomEvent('kz:changed')); document.dispatchEvent(new Event('kz:goals'));
      if (K.toast) K.toast('Saved');
      return;
    }
    K.addGoal({ name: name, kind: gk, step: st, cue: $('gcue').value, mini: $('gmini').value, log: log, path: path || (K.guessPath ? K.guessPath(name + ' ' + st) : '') });
    K.track('kz_goal_added', { from: 'sheet', log: log, kind: gk });
    close(); document.dispatchEvent(new Event('kz:goals')); document.dispatchEvent(new CustomEvent('kz:changed'));
    if (K.toast) K.toast('Added: ' + name);
  }
  K.goalSheet = { open: open, close: close };
  // Every "Edit" in a goal's menu opens this sheet (the old inline edit form is no longer used)
  document.addEventListener('click', function (e) {
    var ed = e.target.closest && e.target.closest('[data-kz-edit]'); if (!ed) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var id = ed.getAttribute('data-kz-edit');
    document.body.click();   // closes the goal menu, as a tap outside it does
    setTimeout(function () { open({ mode: 'edit', id: id }); }, 30);
  }, true);
  // Every "Add a goal" link (to My goals #add, or Today's /#add-p=…) opens a goal sheet right where you are
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
    var h = u.hash || '', m = /^#add(?:-p=([\w-]+))?$/.exec(h); if (!m) return;
    if (u.pathname !== '/' && u.pathname.indexOf('my-goals') < 0) return;
    var p = m[1] || u.searchParams.get('pillar') || '';
    e.preventDefault(); e.stopImmediatePropagation();
    if (onToday() && K.openAdd) K.openAdd(p ? { path: p } : undefined); else open({ mode: 'add', path: p });
  }, true);
  if (!onToday()) K.openAdd = function (o) { open({ mode: 'add', path: typeof o === 'string' ? o : o && o.path, kind: o && o.kind }); };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kz1b-1023d.js ==== */
;try {
/* Oct 23 Phase 1B page helpers */
(function () {
  var K = window.KZ; if (!K) return;
  // Goal page: lay the day dots out one week per row (Sun-Sat), so each is a full 44 pt target
  var W = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  function weeks() {
    document.querySelectorAll('.kz-g1dots:not(.kz-1b-weeks)').forEach(function (box) {
      var dots = box.querySelectorAll('.kz-g1dot[data-jump]'); if (!dots.length) return;
      var first = dots[0].getAttribute('data-jump'), last = dots[dots.length - 1].getAttribute('data-jump');
      if (first > last) { var arr = Array.prototype.slice.call(dots).reverse(); arr.forEach(function (d) { box.appendChild(d); }); dots = box.querySelectorAll('.kz-g1dot[data-jump]'); first = dots[0].getAttribute('data-jump'); }
      var lead = new Date(first + 'T12:00:00').getDay(), pre = W.map(function (w) { return '<span class="kz-1b-wd" aria-hidden="true">' + w + '</span>'; }).join('');
      for (var i = 0; i < lead; i++) pre += '<span class="kz-1b-pad" aria-hidden="true"></span>';
      box.insertAdjacentHTML('afterbegin', pre); box.classList.add('kz-1b-weeks');
    });
  }
  new MutationObserver(function () { weeks(); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', weeks);
  // Progress opened from "See past days": bring the calendar up once it's drawn
  if (/#kz-cal$/.test(location.hash)) addEventListener('load', function () { setTimeout(function () { var c = document.getElementById('kz-cal'); if (c) c.scrollIntoView({ block: 'start' }); }, 120); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzp2-1023e.js ==== */
;try {
/* Oct 23 Phase 2: empty states */
(function () {
  var K = window.KZ; if (!K) return;
  function hint() {
    var cal = document.querySelector('#kz-cal.kz-progcal'); if (!cal) return;
    var none = !(K.shownDays && K.shownDays().length), h = cal.querySelector('.kz-p2-hint');
    if (none && !h) { var lg = cal.querySelector('.kz-callegend'); if (lg) lg.insertAdjacentHTML('afterend', '<p class="kz-p2-hint">Check off your first goal and today turns gold. Every day you show up fills in here.</p>'); }
    if (!none && h) h.remove();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hint); else hint();
  ['kz:step', 'kz:changed', 'kz:goals'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(hint, 0); }); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzp3-1102b.js ==== */
;try {
/* Nov 2 b · the weekly recap: no everyday-streak shields or rest days; Feet climbed, and the Kaizen 66's shields (or Perfect days). */
/* Nov 2 · replaces kzp3-1023g.js: the weekly recap's "Your tree grew +2.8 in" cell (tree inches) becomes "Shields held" (shields come from checkpoints). */
/* Oct 23 Phase 3: milestones (days 7, 30, 66, 100) and the Monday weekly recap.
   Both are one full-screen moment, shown once, closed with one tap. Nothing leaves the phone. */
(function () {
  var K = window.KZ; if (!K || K.__kzp3) return; K.__kzp3 = 1;
  var MS = [7, 30, 66, 100];
  var COPY = {
    7: ['One week of showing up.', 'Seven days in. This is where most people quit. You didn’t.'],
    30: ['A month of small steps.', '30 days of showing up. It’s starting to be who you are.'],
    66: ['66 days.', 'That’s about how long a habit takes to feel automatic. This one is yours now.'],
    100: ['100 days.', 'Triple digits. Your tree remembers every one of them.']
  };
  var quiet = function () { try { return sessionStorage.getItem('kz_quiet') === '1'; } catch (e) { return false; } };
  var native = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var busy = function () {   // never on top of setup, a sheet, an unlock reveal or another moment
    return document.documentElement.classList.contains('kz-setup') || document.querySelector('.kz-p3') ||
      document.visibilityState === 'hidden' ||
      Array.prototype.some.call(document.querySelectorAll('[role="dialog"], [aria-modal="true"], .kz-sheet49, .kz-appsheet'), function (e) {   // the quote card, a sheet, a reveal...
        if (e.closest('.kz-p3') || e.hidden || !e.getClientRects().length) return false; var s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && (+s.opacity > 0.05 || e.id === 'kz-reveal' || /\bin\b|open|show/.test(e.className));
      });
  };
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function overlay(cls, html, onClose) {
    var o = document.createElement('div'); o.className = 'kz-p3 ' + cls; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'kz-p3-t');
    o.innerHTML = '<div class="kz-p3-in"><button type="button" class="kz-p3-x" data-p3="close" aria-label="Close">' + X + '</button>' + html + '</div>';
    var prevFocus = document.activeElement;
    var close = function () { if (!o.isConnected) return; o.classList.add('out'); document.documentElement.classList.remove('kz-p3-on'); document.body.classList.remove('kz-noscroll'); setTimeout(function () { o.remove(); }, 180); if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) {} if (onClose) onClose(); };
    o.addEventListener('click', function (e) { if (e.target.closest('[data-p3="close-link"]')) { close(); return; } if (e.target === o || e.target.closest('[data-p3="close"]')) { e.preventDefault(); close(); } });
    o.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.body.appendChild(o); document.documentElement.classList.add('kz-p3-on'); document.body.classList.add('kz-noscroll');
    setTimeout(function () { var b = o.querySelector('.kz-p3-go'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }, 60);
    o._close = close; return o;
  }
  // ---------- milestones: days you showed up ----------
  function milestoneDue() {
    var n = K.shownDays ? K.shownDays().length : 0, seen = K.get('ms', {}) || {}, top = 0;
    MS.forEach(function (m) { if (n >= m && !seen[m]) top = m; });
    return top;
  }
  function showMilestone(m) {
    var seen = K.get('ms', {}) || {}; MS.forEach(function (x) { if (x <= m) seen[x] = seen[x] || K.key(K.today()); }); K.set('ms', seen);   // once each; reaching 66 also retires 7 and 30
    var art = ''; try { art = K.lifeTree({ mini: true, lite: true }).svg; } catch (e) {}
    var c = COPY[m];
    var o = overlay('kz-p3-ms', '<div class="kz-p3-art" aria-hidden="true">' + art + '<span class="kz-p3-big">' + m + '</span></div>' +
      '<span class="kz-p3-k">Day ' + m + '</span><h2 class="kz-p3-t" id="kz-p3-t">' + c[0] + '</h2><p class="kz-p3-p">' + c[1] + '</p>' +
      '<div class="kz-p3-act"><button type="button" class="kz-btn kz-p3-go" data-p3="close">Keep going</button><button type="button" class="kz-p3-share" data-p3="share">Share</button></div>', next);
    o.addEventListener('click', function (e) {
      if (!e.target.closest('[data-p3="share"]')) return;
      var text = 'Day ' + m + ' of showing up on Kaizen. One small step, every day.';
      K.track('kz_milestone_share', { day: m });
      if (K.shareMilestone) { K.shareMilestone(m, text); return; }   // Phase 4 swaps in a share image
      if (native()) post({ type: 'text', text: text }); else if (navigator.share) navigator.share({ text: text }).catch(function () {}); else try { navigator.clipboard.writeText(text); } catch (er) {}
    });
    if (native()) post({ type: 'haptic', n: 2 }); else try { navigator.vibrate([12, 60, 18]); } catch (e) {}
    K.track('kz_milestone', { day: m });
  }
  // ---------- weekly recap: last Monday-Sunday, shown on the first open of a new week (Mon-Wed) ----------
  var mondayOf = function (d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  K.lastWeekRecap = function () {   // the same day data the Progress calendar draws from
    var mon = K.addDays(mondayOf(K.today()), -7), sun = K.addDays(mon, 6), days = [], first = K.firstStepDay ? K.firstStepDay() : undefined;
    var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (k) { rest[k] = 1; });
    var wk = K.weekRecap ? K.weekRecap(sun) : { shown: 0, steps: 0 }, grew = 0, restN = 0;
    for (var i = 0; i < 7; i++) { var k = K.key(K.addDays(mon, i)), di = K.dayInfo(k, first); days.push({ k: k, s: di.status }); grew += di.rate || 0; if (rest[k]) restN++; }
    return { from: K.key(mon), to: K.key(sun), shown: wk.shown, steps: wk.steps, rest: restN, grew: grew, days: days };
  };
  function recapDue() {
    if (!document.querySelector('#kz-today-s1')) return false;   // Today only
    var t = K.today(), dow = (t.getDay() + 6) % 7; if (dow > 2) return false;   // Monday to Wednesday
    var wkKey = K.key(mondayOf(t)); if (K.get('recap', '') === wkKey) return false;
    var v = K.get('visit', {}) || {}, lastSun = K.key(K.addDays(mondayOf(t), -1));
    if (!K.goals().length || !v.first || v.first > lastSun) return false;   // only once there's a past week to look at
    return wkKey;
  }
  function showRecap(wkKey) {
    K.set('recap', wkKey);
    var r = K.lastWeekRecap(), fd = function (k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
    var L = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], lab = { full: 'every goal', grew: 'good day', setback: 'rough day', none: 'nothing', today: 'today', future: '' };
    var dots = r.days.map(function (d, i) { return '<span class="kz-p3-d"><i class="' + d.s + '" aria-label="' + fd(d.k) + ': ' + (lab[d.s] || d.s) + '"></i><b aria-hidden="true">' + L[i] + '</b></span>'; }).join('');
    var stat = function (n, l) { return '<div class="kz-p3-st"><b>' + n + '</b><span>' + l + '</span></div>'; };
    var k66 = null; try { var s6 = K.k66 && K.k66.state(); k66 = s6 && s6.run ? { sh: Math.min(2, s6.run.sh || 0) } : null; } catch (e) {}
    var line = r.shown >= 7 ? 'Every single day. That’s how habits stick.' : r.shown >= 4 ? 'More days than not. Let\u2019s make this week a full one.' : r.shown ? 'Every day you show up counts. Let’s add one today.' : 'A fresh week. One small step today starts it.';
    overlay('kz-p3-rc', '<span class="kz-p3-k">Last week</span><h2 class="kz-p3-t" id="kz-p3-t">' + fd(r.from) + ' – ' + fd(r.to) + '</h2>' +
      '<div class="kz-p3-dots" role="img" aria-label="' + r.shown + ' of 7 days">' + dots + '</div>' +
      '<div class="kz-p3-grid">' + stat(r.shown + '<small>/7</small>', 'Days you showed up') + stat(r.steps, r.steps === 1 ? 'Step taken' : 'Steps taken') + stat((r.steps * 131).toLocaleString() + '<small> ft</small>', 'Feet climbed') + (k66 ? stat(k66.sh + '<small>/2</small>', 'Kaizen 66 shields') : stat(r.days.filter(function (d) { return d.s === 'full'; }).length, 'Perfect days')) + '</div>' +
      '<p class="kz-p3-p">' + line + '</p>' +
      '<div class="kz-p3-act"><button type="button" class="kz-btn kz-p3-go" data-p3="close">Start this week</button><a class="kz-p3-share" href="/pages/calendar#kz-cal" data-p3="close-link">See it in Progress</a></div>', next);
    K.track('kz_week_recap', { shown: r.shown, steps: r.steps });
  }
  function next() { setTimeout(check, 400); }
  function check() {
    if (quiet() || busy()) return;
    var wk = recapDue(); if (wk) return showRecap(wk);
    var m = milestoneDue(); if (m) showMilestone(m);
  }
  K.p3check = check;
  // If an unlock reveal opens while a moment is up, the moment steps aside and comes back when the reveal closes
  var rv = document.getElementById('kz-reveal');
  if (rv) new MutationObserver(function () { var o = document.querySelector('.kz-p3'); if (o) o.style.display = rv.hidden ? '' : 'none'; }).observe(rv, { attributes: true, attributeFilter: ['hidden'] });
  var later = function (ms, n) { setTimeout(function () { if (busy()) { if ((n || 0) < 60) later(1500, (n || 0) + 1); return; } check(); }, ms); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { later(1200); }); else later(1200);
  document.addEventListener('kz:step', function () { later(4500); });   // after the check-off's leaf burst, sounds and any unlock reveal (which opens at 2.6 s)
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') later(600); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzp4-1023h.js ==== */
;try {
/* Oct 23 Phase 4: share images (tree, streak, milestones) and the rating prompt rules.
   Images are drawn on the phone (1080x1920, sans serif, gold on black) and handed to the iOS share sheet.
   Nothing is uploaded; the only personal detail on a card is your first name, and only if you leave it on. */
(function () {
  var K = window.KZ; if (!K || K.__kzp4) return; K.__kzp4 = 1;
  var native = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  var post = function (m) { try { if (native()) window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var W = 1080, H = 1920, GOLD = '#E2B93B', FONT = 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
  var f = function (w, s) { return w + ' ' + s + 'px ' + FONT; };
  var firstName = function () { var n = String(K.get('username', '') || '').trim(); return n ? n.split(/\s+/)[0].slice(0, 20) : ''; };
  // A picture drawn from an SVG can't load files, so the tree's painted layers (land, soil, the tree art) are inlined first
  var dataURLs = {};
  function inline(url) {
    if (dataURLs[url]) return dataURLs[url];
    return (dataURLs[url] = fetch(url).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      return b ? new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result)); }; fr.onerror = function () { res(''); }; fr.readAsDataURL(b); }) : '';
    }).catch(function () { return ''; }).then(function (d) { return d || viaImg(url); }));
  }
  function viaImg(url) {   // fallback: draw the file the page can already show, then read it back
    return new Promise(function (res) {
      var im = new Image(); im.onload = function () { try { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); res(c.toDataURL('image/png')); } catch (e) { res(''); } };
      im.onerror = function () { res(''); }; im.src = url;
    });
  }
  function svgImage(svg) {
    if (!svg) return Promise.resolve(null);
    var urls = []; svg.replace(/href="(\/[^"#]+)"/g, function (m, u) { if (urls.indexOf(u) < 0) urls.push(u); return m; });
    return Promise.all(urls.map(inline)).then(function (data) {
      urls.forEach(function (u, i) { if (data[i]) svg = svg.split('href="' + u + '"').join('href="' + data[i] + '"'); });
      var sp = svg.indexOf(' '); svg = svg.slice(0, sp) + ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' + svg.slice(sp);
      return new Promise(function (res) { var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    });
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); }
  function frame(x) {   // black, a soft gold glow, the kaizen mark and name at the top, the line at the bottom
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(W / 2, 700, 40, W / 2, 700, 900); g.addColorStop(0, 'rgba(226,185,59,0.16)'); g.addColorStop(1, 'rgba(226,185,59,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.translate(W / 2 - 52, 112); x.scale(104 / 88, 104 / 88); x.translate(-56, -52);
    x.strokeStyle = GOLD; x.lineWidth = 8; x.lineCap = 'square'; x.lineJoin = 'miter'; x.stroke(new Path2D('M64 122 H136 L100 60 L82 91')); x.restore();
    x.textAlign = 'center'; x.fillStyle = GOLD; x.font = f(800, 40);
    if ('letterSpacing' in x) { x.letterSpacing = '14px'; x.fillText('KAIZEN', W / 2 + 7, 290); x.letterSpacing = '0px'; } else x.fillText('K A I Z E N', W / 2, 290);
    x.fillStyle = '#8E8E93'; x.font = f(500, 40); x.fillText('One small step. Every day.', W / 2, 1830);
  }
  function fitText(x, t, max, weight, size) { x.font = f(weight, size); while (x.measureText(t).width > max && size > 24) { size -= 4; x.font = f(weight, size); } return size; }
  function treeBox(x, img, X, Y, w, h) {
    x.save(); rr(x, X, Y, w, h, 56); x.clip(); x.fillStyle = '#0b0b0d'; x.fillRect(X, Y, w, h);
    if (img) { var r = Math.max(w / img.width, h / img.height), iw = img.width * r, ih = img.height * r; x.drawImage(img, X + (w - iw) / 2, Y + (h - ih) / 2, iw, ih); }
    x.restore(); x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2; rr(x, X, Y, w, h, 56); x.stroke();
  }
  // ---------- the three cards ----------
  var MCOPY = { 7: 'One week of showing up.', 30: 'A month of small steps.', 66: 'About how long a habit takes to feel automatic.', 100: 'Triple digits.' };
  K.shareImage = function (kind, o) {
    o = o || {}; var name = o.name ? firstName() : '';
    var lt = null; try { lt = K.lifeTree({}); } catch (e) {}
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    var streak = K.streak ? K.streak() : 0, shown = K.shownDays ? K.shownDays().length : 0;
    return svgImage(lt && lt.svg).then(function (img) {
      frame(x); x.textAlign = 'center';
      if (kind === 'streak') {
        if (name) { x.fillStyle = '#fff'; x.font = f(600, 52); x.fillText(name, W / 2, 470); }
        x.fillStyle = GOLD; var sz = fitText(x, String(streak), 900, 800, 440); x.font = f(800, sz); x.fillText(String(streak), W / 2, 900);
        x.fillStyle = '#fff'; x.font = f(700, 76); x.fillText(streak === 1 ? 'day streak' : 'day streak', W / 2, 1010);
        // the last 14 days, as the calendar draws them
        var C = { full: GOLD, grew: '#5CD27A', setback: '#E5605A', rest: '#0A84FF', today: '#3A3A3C', none: '#1C1C1E', future: '#1C1C1E' }, s = 96, gap = 18, x0 = (W - (7 * s + 6 * gap)) / 2, first = K.firstStepDay ? K.firstStepDay() : undefined;
        for (var i = 0; i < 14; i++) { var k = K.key(K.addDays(K.today(), i - 13)), di = K.dayInfo(k, first), cx = x0 + (i % 7) * (s + gap), cy = 1160 + Math.floor(i / 7) * (s + gap);
          x.fillStyle = C[di.status] || '#1C1C1E'; rr(x, cx, cy, s, s, 22); x.fill(); if (di.status === 'today') { x.strokeStyle = '#fff'; x.lineWidth = 5; rr(x, cx + 2.5, cy + 2.5, s - 5, s - 5, 20); x.stroke(); } }
        x.fillStyle = '#8E8E93'; x.font = f(500, 40); x.fillText('My last two weeks', W / 2, 1460);
        x.fillStyle = '#fff'; x.font = f(600, 46); x.fillText(shown + (shown === 1 ? ' day' : ' days') + ' shown up in all', W / 2, 1640);
      } else if (kind === 'milestone') {
        var m = +o.day || shown;
        treeBox(x, img, 140, 380, 800, 640);
        x.fillStyle = GOLD; x.font = f(700, 44); x.fillText('DAY', W / 2, 1150);
        var sz2 = fitText(x, String(m), 900, 800, 340); x.font = f(800, sz2); x.fillText(String(m), W / 2, 1460);
        x.fillStyle = '#fff'; var sz3 = fitText(x, MCOPY[m] || 'Showing up, every day.', 940, 700, 56); x.font = f(700, sz3); x.fillText(MCOPY[m] || 'Showing up, every day.', W / 2, 1580);
        if (name) { x.fillStyle = '#8E8E93'; x.font = f(500, 42); x.fillText(name + ' on Kaizen', W / 2, 1660); }
      } else {   // tree
        treeBox(x, img, 90, 380, 900, 1000);
        x.fillStyle = '#fff'; var t = name ? name + '’s tree' : 'My tree', sz4 = fitText(x, t, 940, 800, 92); x.font = f(800, sz4); x.fillText(t, W / 2, 1500);
        x.fillStyle = '#8E8E93'; x.font = f(500, 46); x.fillText((lt ? lt.stage + ' · ' + lt.height + ' tall' : ''), W / 2, 1572);
        var chip = function (label, color, cxm) { x.font = f(700, 42); var w2 = x.measureText(label).width + 80; x.fillStyle = '#1C1C1E'; rr(x, cxm - w2 / 2, 1625, w2, 92, 46); x.fill(); x.strokeStyle = color; x.lineWidth = 4; rr(x, cxm - w2 / 2, 1625, w2, 92, 46); x.stroke(); x.fillStyle = color; x.fillText(label, cxm, 1686); };
        chip(streak + '-day streak', GOLD, W / 2 - 220); chip(shown + (shown === 1 ? ' day' : ' days') + ' grown', '#5CD27A', W / 2 + 220);
      }
      return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  };
  var TEXT = { tree: 'Growing a little every day on Kaizen.', streak: function () { return (K.streak ? K.streak() : 0) + '-day streak on Kaizen. One small step, every day.'; }, milestone: function (o) { return 'Day ' + o.day + ' of showing up on Kaizen.'; } };
  function shareBlob(blob, kind, o) {
    var text = typeof TEXT[kind] === 'function' ? TEXT[kind](o) : TEXT[kind], fname = 'kaizen-' + kind + '-' + K.key(K.today()) + '.png';
    K.track('kz_share', { kind: kind, name: !!(o && o.name) });
    if (native()) {
      return new Promise(function (res) { var r = new FileReader(); r.onload = function () { post({ type: 'file', name: fname, data: String(r.result).split(',')[1], text: text }); res(); }; r.readAsDataURL(blob); });
    }
    var file = new File([blob], fname, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text }).catch(function () {});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return Promise.resolve();
  }
  // ---------- the share sheet: a preview, a "show my first name" switch, Share ----------
  K.openShare = function (kind, o) {
    o = o || {}; var hasName = !!firstName(), opts = { day: o.day, name: hasName && K.get('sharename', 1) !== 0 };
    var el = document.createElement('div'); el.className = 'kz-p4'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Share');
    el.innerHTML = '<div class="kz-p4-in"><div class="kz-p4-top"><h2 class="kz-p4-t">Share</h2><button type="button" class="kz-p4-x" data-p4="close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="kz-p4-prev"><img alt="" data-p4="img"><span class="kz-p4-wait" data-p4="wait">Making your card…</span></div>' +
      (hasName ? '<label class="kz-steprow kz-switchrow kz-p4-name"><span><strong>Show my first name</strong><em>“' + K.esc(firstName()) + '” on the card</em></span><input type="checkbox" class="kz-sw49" data-p4="name"' + (opts.name ? ' checked' : '') + '></label>' : '') +
      '<button type="button" class="kz-btn gold kz-p4-go" data-p4="share" disabled>Share</button></div>';
    var blob = null, img = el.querySelector('[data-p4="img"]'), go = el.querySelector('[data-p4="share"]'), url = '';
    var draw = function () {
      go.disabled = true; el.querySelector('[data-p4="wait"]').hidden = false;
      K.shareImage(kind, opts).then(function (b) { blob = b; if (url) URL.revokeObjectURL(url); url = b ? URL.createObjectURL(b) : ''; img.src = url; img.alt = 'Preview of your ' + kind + ' card'; el.querySelector('[data-p4="wait"]').hidden = !!b; go.disabled = !b; });
    };
    var close = function () { el.remove(); if (url) URL.revokeObjectURL(url); document.body.classList.remove('kz-noscroll'); };
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.closest('[data-p4="close"]')) return close();
      if (e.target.closest('[data-p4="share"]') && blob) { go.disabled = true; go.textContent = 'Opening…'; shareBlob(blob, kind, opts).then(function () { go.disabled = false; go.textContent = 'Share'; }); }
    });
    el.addEventListener('change', function (e) { if (e.target.matches('[data-p4="name"]')) { opts.name = e.target.checked; K.set('sharename', opts.name ? 1 : 0); draw(); } });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.body.appendChild(el); document.body.classList.add('kz-noscroll'); draw();
    K.track('kz_share_open', { kind: kind });
    return el;
  };
  K.shareMilestone = function (m) { K.openShare('milestone', { day: m }); };
  // the tree view's Share button (on every page) opens the new sheet
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kz-share]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation(); K.openShare(b.getAttribute('data-kz-share') || 'tree');
  }, true);
  // Progress: "Share your streak" under the streak tiles
  function streakButton() {
    var t = document.querySelector('#kz-prog-s1 [data-p="tiles"]'); if (!t || document.querySelector('.kz-p4-sb')) return;
    t.insertAdjacentHTML('afterend', '<button type="button" class="kz-p4-sb" data-kz-share="streak"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>Share your streak</button>');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', streakButton); else streakButton();

  // ---------- 15. Rating prompt: right after a real win, never in the first 3 days, at most once every 120 days ----------
  var DAY = 864e5;
  var rp = function () { return K.get('rateprompt', {}) || {}; };
  (function () { var r = rp(); if (!r.first) { r.first = Date.now(); K.set('rateprompt', r); } })();   // first time Kaizen ran
  var overlayUp = function () { return !!document.querySelector('.kz-p3, .kz-p4, #kz-reveal:not([hidden]), .kz-qcard.in') || document.documentElement.classList.contains('kz-setup'); };
  K.rateCheck = function (why, now) {   // returns why it did or didn't ask (tests read this)
    now = now || Date.now(); var r = rp();
    if (!native()) return 'not-app';
    if (!r.first || now - r.first < 3 * DAY) return 'first-3-days';
    if (r.asked && now - r.asked < 120 * DAY) return 'asked-recently';
    r.asked = now; r.why = why; K.set('rateprompt', r); post({ type: 'review' }); K.track('kz_rate_prompt', { why: why }); return 'asked';
  };
  var pending = 0;
  var ask = function (why, tries) { clearTimeout(pending); pending = setTimeout(function () { if (overlayUp()) { if ((tries || 0) < 40) ask(why, (tries || 0) + 1); return; } K.lastRate = K.rateCheck(why); }, 1500); };
  document.addEventListener('kz:alldone', function () { ask('alldone'); });   // waits until any milestone or reveal has been closed
  var watch = function () { new MutationObserver(function (ms) {   // a milestone moment was just closed
    ms.forEach(function (m) { Array.prototype.forEach.call(m.removedNodes, function (n) { if (n.nodeType === 1 && n.classList.contains('kz-p3-ms')) ask('milestone'); }); });
  }).observe(document.body, { childList: true }); };
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzfx-1023j.js ==== */
;try {
/* Oct 23 fix pass: the Balance star in the app's style (labels on the star, editor behind one row), and Progress tidy-ups.
   K.balStar is defined by the page (Progress) or kzbal (Growth); whatever they assign is wrapped, so their own
   click handlers and numbers stay exactly as they were. */
(function () {
  var K = window.KZ; if (!K || K.__kzfx) return; K.__kzfx = 1;
  var editing = false;
  var f1 = function (v) { return Math.round(v * 10) / 10; };
  var short = function (s) { s = String(s); return s.length > 13 ? s.slice(0, 12) + '…' : s; };
  function star(P) {
    var n = P.length, W = 380, Hh = 280, cx = W / 2, cy = 140, R = 78, live = P.filter(function (o) { return o.goals; }).length;
    var s = '<svg class="kz-bst-star kz-bst2-star" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + live + ' of ' + n + ' branches growing. ' +
      P.map(function (o) { return K.esc(o.name) + ' ' + (o.goals ? o.goals + (o.goals === 1 ? ' goal' : ' goals') : 'no goals'); }).join(', ') + '">';
    var lab = '';
    P.forEach(function (o, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n, on = !!o.goals, r = on ? R : R * 0.62, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + f1(x) + '" y2="' + f1(y) + '" stroke="' + o.color + '" stroke-width="' + (on ? 7 : 3) + '" stroke-linecap="round" opacity="' + (on ? 1 : 0.32) + '"/>' +
        '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (on ? 9 : 4.5) + '" fill="' + o.color + '" opacity="' + (on ? 1 : 0.55) + '"/>';
      var lx = cx + Math.cos(a) * (R + 18), ly = cy + Math.sin(a) * (R + 18), cs = Math.cos(a), sn = Math.sin(a);
      var anc = cs > 0.3 ? 'start' : cs < -0.3 ? 'end' : 'middle', dy = sn < -0.6 ? -22 : sn > 0.6 ? 16 : 0;
      lab += '<text x="' + f1(lx) + '" y="' + f1(ly + dy) + '" text-anchor="' + anc + '" class="kz-bst2-n' + (on ? ' on' : '') + '">' + K.esc(short(o.name)) + '</text>' +
        '<text x="' + f1(lx) + '" y="' + f1(ly + dy + 17) + '" text-anchor="' + anc + '" class="kz-bst2-c" fill="' + (on ? o.color : '#636366') + '">' + (on ? o.goals + (o.goals === 1 ? ' goal' : ' goals') : 'no goals') + '</text>';
    });
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="#E2B93B" opacity=".18"/><circle cx="' + cx + '" cy="' + cy + '" r="9" fill="#E2B93B"/>' + lab + '</svg>';
    return s;
  }
  var wrap = function (orig) {
    if (!orig || orig.__fx) return orig;
    var w = function (P) {
      var h = orig.apply(this, arguments);
      h = h.replace(/<svg class="kz-bst-star"[\s\S]*?<\/svg>/, star(P));
      h = h.replace('<div class="kz-bst">', '<div class="kz-bst kz-bst2' + (editing ? ' editing' : '') + '">');
      h = h.replace('<div class="kz-bst-trunk">', '<button type="button" class="kz-bst2-edit" data-bst2-edit aria-expanded="' + editing + '"><span>Edit branches</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button><div class="kz-bst-trunk">');
      return h;
    };
    w.__fx = 1; return w;
  };
  var cur;
  try { cur = wrap(K.balStar); Object.defineProperty(K, 'balStar', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrap(v); } }); } catch (e) {}
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-bst2-edit]'); if (!b) return;
    editing = !editing; var box = b.closest('.kz-bst'); if (box) box.classList.toggle('editing', editing); b.setAttribute('aria-expanded', String(editing));
    if (editing) setTimeout(function () { var t = box && box.querySelector('.kz-bst-trunk'); if (t) t.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30);
  });
  // Progress: the share button becomes an icon in the stats card's corner
  function statsShare() {
    var t = document.querySelector('#kz-prog-s1 [data-p="tiles"]'), sb = document.querySelector('.kz-p4-sb'); if (!t || !sb || t.parentElement.classList.contains('kz-fx-stats')) return;
    var w = document.createElement('div'); w.className = 'kz-fx-stats'; t.parentElement.insertBefore(w, t); w.appendChild(t); w.appendChild(sb);
    sb.classList.add('kz-fx-share'); sb.setAttribute('aria-label', 'Share your streak');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', statsShare); else statsShare();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzux-1023l.js ==== */
;try {
/* Oct 23 · UX pass from the reels: new-user simplification and the one-time day-3 reminder card. Styles in kzux-1023l.css. */
(function () {
  var K = window.KZ, root = document.documentElement; if (!K || K.__kzux) return; K.__kzux = 1;
  var shown = function () { try { return K.shownDays().length; } catch (e) { return 0; } };
  // first 3 days shown up: Today keeps one daily card (Quote); Tomorrow waits until today is done, or 6 PM
  var mark = function () { root.classList.toggle('kz-ux-new', shown() < 3); root.classList.toggle('kz-ux-day', new Date().getHours() < 18); };
  mark(); document.addEventListener('kz:step', mark); window.addEventListener('pageshow', mark);

  // Day-3 reminder card: for people who said "Not now" in setup (they never saw Apple's prompt). Once, ever.
  function remOn() { var r = K.get('reminders', {}) || {}; return !!r.on; }
  function busy() { return !!document.querySelector('.kz-p3, #kz-reveal:not([hidden]), .kz-sheet49:not([hidden]).on, .kz-qcard.in, .kz-setup'); }
  function fmt(hm) { var p = String(hm || '07:30').split(':'), h = +p[0], m = +p[1] || 0; return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); }
  function card(tries) {
    if (!document.querySelector('.kz-today') || remOn() || shown() < 3) return;
    var seen = K.get('uxremcard', '');
    if (seen && seen !== K.key(K.today())) return;              // shown on an earlier day: never again
    if (seen === 'done') return;
    if (busy()) { if ((tries || 0) < 40) setTimeout(function () { card((tries || 0) + 1); }, 1500); return; }
    // below the goal list, so the check-offs (the screen's main action) stay where they were
    var chk = document.querySelector('.kz-today button.kz-check[data-kz-done]'), anchor = chk && chk.closest('.kz-rows, .kz-card49');
    if (!anchor) { anchor = document.querySelector('.kz-pcard-tree'); anchor = anchor && anchor.closest('.kz-card49, .kz-pcard'); }
    if (!anchor || document.querySelector('.kz-ux-rem')) return;
    var r = K.get('reminders', {}) || {}, t = fmt(r.morning);
    var el = document.createElement('div'); el.className = 'kz-ux-rem'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Reminder');
    el.innerHTML = '<b>Want a ' + t + ' nudge?</b><p>One reminder in the morning so you don’t miss a day. Never more than two a day.</p>' +
      '<div><button type="button" class="kz-btn gold" data-ux-rem="on">Turn on</button><button type="button" data-ux-rem="no">No thanks</button></div>';
    anchor.parentNode.insertBefore(el, anchor.nextSibling);
    if (!seen) K.set('uxremcard', K.key(K.today()));
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ux-rem]'); if (!b) return;
      K.set('uxremcard', 'done'); el.remove();
      if (b.dataset.uxRem === 'on' && K.openReminders) K.openReminders(false);
    });
  }
  var go = function () { setTimeout(card, 2600); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzgrove-1029.js ==== */
;try {
/* Oct 29 · replaces kzgrove-1025m.js: "Why 66 days?" adds how Kaizen 66 follows the study (pause, not reset). */
/* Oct 25 m (from 1025d): seedlings use the planted v2 art (soil + shadow in the image, leaves on the stem); one meaning per day
   number (K.dayLabel: "Day N" only for the Kaizen 66 run, other goals show days grown); the Grove lists every goal as a row
   (no "Closest" card), one-line header, a gold ring on the soil under the Kaizen 66 tree. */
/* Oct 24 · The grove (James): one goal = one tree, grown on the 66-day clock. Replaces the climb (kzclimb-1023ad) and
   the unlock road. Each goal gets its own species (stored in kz_grove; the first goal keeps the tree you already had).
   Its stage comes only from the days you checked that goal off: planted, sprout (3), seedling (7), sapling (14),
   young tree (30), tree (45), habit earned / full tree (66), then mature (100), strong (180), great (365), ancient (730).
   A missed day never shrinks it; it just doesn't grow. Milestones 66/100/180/365… are celebrated once (kz_climbseen,
   the same record the climb used, so nothing already celebrated replays).
   Where: Tree tab → "Your grove" (old tree hero, XP card and unlock road hidden, not deleted: html.kz-grove);
   Today → "Your trees" strip; goal page → that goal's growth line + change tree; Progress → "Your trees" rows.
   Research: Lally et al. 2010, habit automaticity plateaued after a median of 66 days (range 18–254). Styles: kzgrove-1025d.css (1025d = 1024b + no climbseen write with zero goals) */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzgrove) return; K.__kzgrove = 1;
  K.__kzclimb = 1; // the climb is retired; if its file is still linked somewhere it stays silent
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ART = (window.KZ_ART || '/art/') + 'trees/';
  var PEAKS = [66, 100, 180, 365];
  function peakAt(i) { return i < PEAKS.length ? PEAKS[i] : 365 * (i - PEAKS.length + 2); }
  function doneMap() { try { return (K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {}; } catch (e) { return {}; } }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function allGoals() { try { return (K.allGoals ? K.allGoals() : goals()) || []; } catch (e) { return goals(); } }

  // ---------- data ----------
  // kept from the climb so anything that asked for it still gets the same numbers
  K.climb = function (gid) {
    var d = doneMap()[gid] || {}, days = Object.keys(d).filter(function (k) { return d[k]; }).sort(), day = days.length;
    var i = 0; while (day >= peakAt(i)) i++;
    var from = i ? peakAt(i - 1) : 0, to = peakAt(i);
    return { day: day, metres: day * 40, peak: i + 1, from: from, to: to, frac: (day - from) / (to - from), summits: i,
      summitAt: days.length >= 66 ? days[65] : null, last: days[days.length - 1] || null };
  };
  // what the picture shows (finer than the named stages, so the first weeks change often)
  var VIS = [[0, 'seed', .26], [1, 'sd1', .34], [3, 'sd2', .40], [5, 'sd3', .45], [7, 'sd4', .50], [14, 's1', .58], [21, 's2', .64],
    [30, 's3', .71], [45, 's4', .78], [66, 's5', .86], [100, 's6', .91], [180, 's7', .95], [365, 's8', .98], [730, 's9', 1]];
  // the named milestones (the growth line)
  var MS = [[0, 'Planted', 'seed'], [3, 'Sprout', 'sd2'], [7, 'Seedling', 'sd4'], [14, 'Sapling', 's1'], [30, 'Young tree', 's3'],
    [45, 'Tree', 's4'], [66, 'Habit earned', 's5'], [100, 'Mature tree', 's6'], [180, 'Strong tree', 's7'], [365, 'Great tree', 's8'], [730, 'Ancient tree', 's9']];
  var ORDER = ['oak', 'cherry', 'maple', 'birch', 'golden', 'jade', 'frost', 'emerald', 'midnight', 'inferno', 'aurora', 'obsidian', 'celestial', 'phoenix', 'voidbloom'];
  function img(sp, key, big) { if (/^(seed|sd\d)$/.test(key)) return ART + sp + '/' + key + '_v2.webp'; return ART + sp + '/' + key + '_full' + (/^s\d/.test(key) && !big ? '_sm' : '') + '.webp'; }
  // one meaning per number: "Day N" is the Kaizen 66 run day; every other goal shows days grown
  function k66run() { try { var st = K.k66 && K.k66.state(), r = st && st.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  K.dayLabel = function (gid) {
    var r = k66run(), w = K.grow(gid), n = w.day, grown = n + (n === 1 ? ' day grown' : ' days grown');
    if (r && r.goal === gid) {
      var pend = r.state === 'pending', d = pend ? 0 : r.day, done = pend ? 0 : (r.todayDone ? r.day : r.day - 1);
      return { run: true, day: d, left: 66 - done, frac: done / 66, short: pend ? 'Kaizen 66 · starts soon' : 'Kaizen 66 · day ' + d, text: pend ? 'Kaizen 66 starts soon' : 'Kaizen 66 · day ' + d, grown: grown, aria: pend ? 'Kaizen 66 starts soon' : 'Kaizen 66 day ' + d + ' of 66' };
    }
    return { run: false, day: n, left: Math.max(0, 66 - n), frac: w.frac, short: (w.earned ? '★ ' : '') + grown, text: grown, grown: grown, aria: grown + (w.earned ? ', habit earned' : ' of 66') };
  };
  K.groveImg = img;
  // Oct 24 (speed): grove() was rebuilt from scratch for every single tree (it re-read and sorted every goal each time),
  // so 100 goals meant ~600 full reads of the goal list per screen. It's now reused until any of what it depends on changes.
  var gmemo = null;
  function groveRaw() { try { return [localStorage.getItem('kz_grove'), localStorage.getItem('kz_goals'), localStorage.getItem('kz_archived'), localStorage.getItem('kz_tree')].join('\u0001'); } catch (e) { return null; } }
  function grove() {
    var raw = groveRaw(); if (raw !== null && gmemo && gmemo.raw === raw) return gmemo.m;
    var m = groveBuild(); gmemo = raw === null ? null : { raw: groveRaw(), m: m }; return m;
  }
  function groveBuild() {
    var m = K.get('grove', null), ch = false; if (!m || typeof m !== 'object') { m = {}; ch = true; }
    var gs = allGoals().slice().sort(function (a, b) { return String(a.created || '').localeCompare(String(b.created || '')) || String(a.id).localeCompare(String(b.id)); });
    var used = {}; Object.keys(m).forEach(function (k) { used[m[k]] = (used[m[k]] || 0) + 1; });
    var first = K.treeSpecies ? K.treeSpecies() : 'oak';
    gs.forEach(function (g) {
      if (m[g.id] && K.SPECIES[m[g.id]]) return;
      var pick = null;
      if (!Object.keys(m).length && K.SPECIES[first]) pick = first; // your first goal keeps the tree you already had
      if (!pick) { var low = 1e9; ORDER.forEach(function (s) { if (K.SPECIES[s] && (used[s] || 0) < low) { low = used[s] || 0; pick = s; } }); }
      m[g.id] = pick; used[pick] = (used[pick] || 0) + 1; ch = true;
    });
    if (ch) K.set('grove', m);
    return m;
  }
  K.groveSpecies = function (gid) { return grove()[gid] || 'oak'; };
  K.setGroveSpecies = function (gid, sp) { if (!K.SPECIES[sp]) return; var m = grove(); m[gid] = sp; K.set('grove', m); };
  K.grow = function (gid) {
    var c = K.climb(gid), d = c.day, v = VIS[0], i, ms = MS[0], nx = null;
    for (i = 0; i < VIS.length; i++) if (d >= VIS[i][0]) v = VIS[i];
    for (i = 0; i < MS.length; i++) { if (d >= MS[i][0]) ms = MS[i]; else { nx = MS[i]; break; } }
    var sp = K.groveSpecies(gid);
    return { id: gid, sp: sp, species: (K.SPECIES[sp] || {}).name || 'Tree', day: d, key: v[1], scale: v[2],
      stage: d >= 66 && d < 100 ? 'Full tree' : ms[1], earned: d >= 66, frac: Math.min(1, d / 66),
      next: nx ? { at: nx[0], name: nx[1], left: nx[0] - d } : null, summits: c.summits };
  };

  // ---------- shared bits ----------
  function sigOf(list) { return list.map(function (g) { var w = K.grow(g.id); return g.id + ':' + w.day + ':' + w.sp + ':' + g.name; }).join('|'); }
  function dayLine(w) { try { return K.dayLabel(w.id).short; } catch (e) { return w.day + ' days grown'; } }
  function goalHref(g) { return '/pages/goal?id=' + encodeURIComponent(g.id); }
  function whySheet() {
    if (document.querySelector('.kzg-why')) return;
    var s = document.createElement('div'); s.className = 'kzg-why'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'kzg-why-t');
    s.innerHTML = '<div class="kzg-why-in"><h2 id="kzg-why-t">Why 66 days?</h2>' +
      '<p>In a 2010 study at University College London, people building a new daily habit took a median of <b>66 days</b> before it felt automatic. Some took 18, some took 254.</p>' +
      '<p>So 66 is the usual, not a promise. Missing one day didn\'t undo anyone\'s progress, which is why your tree never shrinks. It just waits for you.</p>' +
      '<p>Kaizen 66 works the same way. A missed day doesn\'t count, but it doesn\'t reset you either: your run waits, and your 66th check-off finishes it. Shields keep your in-a-row streak going.</p>' +
      '<button type="button" class="kzg-btn gold" data-kzg-x>Got it</button></div>';
    document.body.appendChild(s);
    s.addEventListener('click', function (e) { if (e.target === s || e.target.closest('[data-kzg-x]')) s.remove(); });
    var b = s.querySelector('[data-kzg-x]'); if (b) b.focus();
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-kzg-why]')) { e.preventDefault(); whySheet(); } });

  // ---------- Tree tab: your grove ----------
  function groveView() {
    var main = document.getElementById('kz-main'), hero = document.getElementById('kz-treehero'); if (!main || !hero) return;
    var gs = allGoals(), act = {}; goals().forEach(function (g) { act[g.id] = 1; });
    var sec = document.getElementById('kzg-grove');
    var r6 = k66run(), sig = sigOf(gs) + '#' + Object.keys(act).join(',') + '#' + (r6 ? r6.goal + ':' + r6.day + ':' + r6.state + ':' + !!r6.todayDone : '');
    if (sec && sec.__sig === sig) return;
    if (!sec) { sec = document.createElement('section'); sec.id = 'kzg-grove'; sec.className = 'kzg-grove'; sec.setAttribute('aria-label', 'Your grove'); main.insertBefore(sec, main.firstChild); }
    sec.__sig = sig;
    var tt = document.querySelector('.kz-htitle b'); if (tt && /^Tree$/.test(tt.textContent.trim())) tt.textContent = 'Grove';
    if (/^Tree\b/.test(document.title)) document.title = document.title.replace(/^Tree/, 'Grove');
    var ws = gs.map(function (g) { var w = K.grow(g.id); w.g = g; w.arch = !act[g.id]; return w; });
    var earned = ws.filter(function (w) { return w.earned; }).length;
    var h = '<div class="kzg-gh kzg-gh2"><p class="kzg-gs">' + (earned ? '<b>★ ' + earned + (earned === 1 ? ' habit' : ' habits') + ' earned</b>' : '') + '</p>' +
      '<a class="kzg-plus" href="/pages/my-goals#add" aria-label="Plant a new goal">+</a></div>';
    var run66 = k66run();
    if (!ws.length) {
      h += '<div class="kzg-empty"><img src="' + img(K.treeSpecies ? K.treeSpecies() : 'oak', 'seed') + '" alt=""><p>Every goal you add plants a tree. Check it off and it grows. At 66 days, the habit is yours.</p>' +
        '<a class="kzg-btn gold" href="/pages/my-goals#add">Plant your first goal</a></div>';
      sec.innerHTML = h; de.classList.add('kz-grove'); return;
    }
    // biggest trees at the back, rows of up to 4 (3 at the back), front rows lower and larger
    var order = ws.slice().sort(function (a, b) { return b.day - a.day; }), rows = [], k = 0, per = [3, 4];
    while (k < order.length) { var n = per[Math.min(rows.length, 1)]; rows.push(order.slice(k, k + n)); k += n; }
    var one = rows.length === 1, sz1 = function (w) { var t = Math.round(166 * w.scale); return /^(seed|sd\d)$/.test(w.key) ? Math.max(t, 92) : t; };
    var tall = one ? Math.max.apply(null, rows[0].map(sz1)) : 0, RH = one ? Math.max(150, Math.min(190, tall + 70)) : 160, H = 26 + rows.length * RH, sc = '';
    rows.forEach(function (row, r) {
      var base = 20 + (r + 1) * RH - 44, depth = one ? 1 : r / (rows.length - 1), size = one ? 166 : 100 + 18 * depth;
      row.forEach(function (w, i) {
        var x = ((i + .5) / row.length) * 100, th = /^(seed|sd\d)$/.test(w.key) ? Math.max(Math.round(size * w.scale), one ? 92 : 64) : Math.round(size * w.scale), tw = Math.round(th * 1.15);
        var dl = K.dayLabel(w.g.id), v2 = /^(seed|sd\d)$/.test(w.key), is66 = !!(run66 && run66.goal === w.g.id);
        sc += '<a class="kzg-tree' + (w.arch ? ' arch' : '') + (v2 ? ' v2' : '') + (is66 ? ' k66' : '') + '" href="' + goalHref(w.g) + '" style="left:' + x.toFixed(2) + '%;top:' + (base - th) + 'px;--cols:' + row.length + ';--dim:' + (0.78 + 0.22 * depth).toFixed(2) + '" aria-label="' +
          esc(w.g.name) + ': ' + w.species + ', ' + w.stage.toLowerCase() + ', ' + dl.aria + (w.arch ? ', archived' : '') + '">' +
          '<i class="kzg-sh" style="width:' + Math.round(tw * .8) + 'px;top:' + (th - 7) + 'px"></i>' +
          (is66 ? '<i class="kzg-ring" style="width:' + Math.round(Math.max(54, tw * (v2 ? .78 : .7))) + 'px;top:' + (th - (v2 ? 13 : 9)) + 'px"></i>' : '') +
          '<span class="kzg-art" style="width:' + tw + 'px;height:' + th + 'px;animation-delay:-' + ((i * 1.7 + r) % 6).toFixed(1) + 's"><img src="' + img(w.sp, w.key) + '" alt="" decoding="async" loading="lazy"></span>' +
          '<span class="kzg-lbl"><b>' + esc(w.g.name) + '</b><em class="' + (w.earned ? 'e' : '') + (is66 ? ' g' : '') + '">' + esc(dl.short) + (w.arch ? ' · archived' : '') + '</em></span></a>';
      });
    });
    h += '<div class="kzg-scene" style="height:' + H + 'px"><i class="kzg-ground" style="top:' + (20 + RH - 46) + 'px"></i>' + sc + '</div>';
    // every goal gets its own row: Kaizen 66 first, then fewest days left, habits already earned last
    var live = ws.filter(function (w) { return !w.arch; }).map(function (w) { w.dl = K.dayLabel(w.g.id); return w; });
    live.sort(function (a, b) { return (b.dl.run - a.dl.run) || ((a.earned ? 1 : 0) - (b.earned ? 1 : 0)) || (a.dl.left - b.dl.left) || a.g.name.localeCompare(b.g.name); });
    if (live.length) h += '<div class="kzg-rows" role="list">' + live.map(function (w) {
      var nx = w.next, sub = w.dl.run ? w.dl.grown : (w.earned ? w.stage : (nx ? nx.name + ' in ' + nx.left + (nx.left === 1 ? ' day' : ' days') : w.stage));
      var right = w.dl.run ? (w.dl.left > 0 ? w.dl.left + (w.dl.left === 1 ? ' day' : ' days') + ' to go' : 'Last day') : w.earned ? '★ Earned' : w.dl.left + (w.dl.left === 1 ? ' day' : ' days') + ' left';
      return '<a class="kzg-row' + (w.dl.run ? ' k66' : '') + (w.earned ? ' e' : '') + '" role="listitem" href="' + goalHref(w.g) + '" aria-label="' + esc(w.g.name) + ', ' + esc(w.dl.aria) + (nx && !w.earned ? ', ' + esc(nx.name.toLowerCase()) + ' in ' + nx.left + ' days' : '') + '">' +
        '<span class="kzg-rt"><img src="' + img(w.sp, w.key) + '" alt="" loading="lazy"></span>' +
        '<span class="kzg-rb"><span class="kzg-rh"><b>' + esc(w.g.name) + '</b><em>' + esc(right) + '</em></span>' +
        '<span class="kzg-rs">' + (w.dl.run ? '<i class="kzg-66">' + esc(w.dl.short) + '</i> · ' : '') + esc(sub) + '</span>' +
        '<span class="kzg-bar sm' + (w.dl.run ? ' gold' : '') + '"><i style="width:' + Math.max(2, Math.round(Math.min(1, w.dl.frac) * 100)) + '%"></i></span></span></a>';
    }).join('') + '</div>';
    h += '<a class="kzg-plant" href="/pages/my-goals#add">+ Plant a new goal</a><button type="button" class="kzg-link" data-kzg-why>Why 66 days?</button>';
    sec.innerHTML = h; de.classList.add('kz-grove', 'kz-grove2');
    var ht = document.querySelector('#kz-header .kz-htitle'); if (ht && !ht.querySelector('.kzpb-sub')) { var su = document.createElement('span'); su.className = 'kzpb-sub'; (ht.querySelector('span') || ht).appendChild(su); }
    var su2 = document.querySelector('#kz-header .kz-htitle .kzpb-sub'); if (su2) su2.textContent = ws.length + (ws.length === 1 ? ' tree' : ' trees');
  }

  // ---------- Today: your trees ----------
  var shown = {}; try { shown = JSON.parse(sessionStorage.getItem('kz_groveshown') || '{}'); } catch (e) {}
  function todayCard() {
    var host = document.querySelector('#kz-today-s1 .kz-tgroups'); if (!host) return;
    var gs = goals(), box = document.querySelector('.kzg-today');
    if (!gs.length) { if (box) box.remove(); return; }
    var sig = sigOf(gs); if (box && box.__sig === sig) return;
    if (!box) { box = document.createElement('section'); box.className = 'kzg-today'; box.setAttribute('aria-label', 'Your trees'); host.parentNode.insertBefore(box, host.nextSibling); }
    box.__sig = sig;
    var grew = [];
    box.innerHTML = '<div class="kzg-th"><span>Your trees</span><a href="/pages/profile">Grove ›</a></div><div class="kzg-strip">' + gs.map(function (g) {
      var w = K.grow(g.id), up = shown[g.id] != null && w.day > shown[g.id]; if (up) grew.push(g.id);
      return '<a class="kzg-mini' + (w.earned ? ' e' : '') + '" href="' + goalHref(g) + '" data-g="' + esc(g.id) + '" aria-label="' + esc(g.name) + ': ' + w.stage.toLowerCase() + ', day ' + w.day + (w.earned ? ', habit earned' : ' of 66') + '">' +
        '<span class="kzg-mt"><img src="' + img(w.sp, w.key) + '" alt="" style="height:' + Math.round(34 + 66 * w.scale) + '%"></span><b>' + esc(g.name) + '</b><em>' + (w.earned ? '★ ' : '') + dayLine(w) + '</em>' +
        '<span class="kzg-bar sm"><i style="width:' + Math.round(w.frac * 100) + '%"></i></span></a>';
    }).join('') + '</div><p class="kzg-tnote">Each check-off grows that goal\'s tree. Day 66 earns the habit.</p><button type="button" class="kzg-link" data-kzg-why>Why 66 days?</button>';
    if (!calm) grew.forEach(function (id) { var a = box.querySelector('.kzg-mini[data-g="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); if (a) { a.classList.add('pop'); } });
    gs.forEach(function (g) { shown[g.id] = K.grow(g.id).day; }); try { sessionStorage.setItem('kz_groveshown', JSON.stringify(shown)); } catch (e) {}
  }

  // ---------- goal page: this goal's tree ----------
  function goalCard() {
    var page = document.getElementById('kz-goalpage'); if (!page) return;
    var anchor = page.querySelector('.kz-g1stats'); if (!anchor) return;
    var id = new URLSearchParams(location.search).get('id'); if (!id) return;
    var g = allGoals().filter(function (x) { return x.id === id; })[0]; if (!g) return;
    var w = K.grow(id), box = page.querySelector('.kzg-goal'), sig = id + ':' + w.day + ':' + w.sp;
    if (box && box.__sig === sig) return;
    if (!box) { box = document.createElement('section'); box.className = 'kzg-goal'; box.setAttribute('aria-label', 'This goal\'s tree'); anchor.parentNode.insertBefore(box, anchor.nextSibling); }
    box.__sig = sig;
    var last = Math.max(66, w.next ? w.next.at : 66), rows = MS.filter(function (m) { return m[0] <= last; });
    var ticks = MS.filter(function (m) { return m[0] > 0 && m[0] < 66; }).map(function (m) { return '<i style="left:' + (m[0] / 66 * 100).toFixed(1) + '%"></i>'; }).join('');
    box.innerHTML = '<div class="kzg-hero"><i class="kzg-glow' + (w.earned ? ' e' : '') + '"></i><img class="kzg-sway" src="' + img(w.sp, w.key, true) + '" alt="' + esc(w.species) + ', ' + w.stage.toLowerCase() + '" style="height:' + Math.round(w.scale * 190) + 'px"></div>' +
      '<div class="kzg-dayrow"><b>' + w.day + '<small>' + (w.day === 1 ? ' day grown' : ' days grown') + (w.earned ? '' : ' of 66') + '</small></b><em' + (w.earned ? ' class="e"' : '') + '>' +
      (w.earned ? '★ HABIT EARNED' : (66 - w.day) + ' DAYS TO GO') + '</em></div>' +
      '<div class="kzg-bar big">' + ticks + '<i class="f" style="width:' + Math.round(w.frac * 100) + '%"></i><span class="kzg-end' + (w.earned ? ' e' : '') + '"></span></div>' +
      '<div class="kzg-ms">' + rows.map(function (m) {
        var done = w.day >= m[0], now = done && (!w.next || w.next.at > m[0]) && MS.filter(function (x) { return x[0] <= w.day; }).pop()[0] === m[0];
        var gold = m[0] === 66, left = m[0] - w.day;
        return '<div class="kzg-mr' + (now ? ' now' : '') + (done ? ' done' : ' todo') + (gold ? ' gold' : '') + '"><span class="kzg-mi"><img src="' + img(w.sp, m[2]) + '" alt="" loading="lazy"></span>' +
          '<span class="kzg-md">' + m[0] + (m[0] === 1 ? ' DAY' : ' DAYS') + '</span><span class="kzg-mn">' + m[1] + '</span><span class="kzg-mx">' + (now ? 'NOW' : done ? '✓' : 'in ' + left + (left === 1 ? ' day' : ' days')) + '</span></div>';
      }).join('') + '</div>' +
      '<p class="kzg-note">' + esc(w.species) + '. After 66 it keeps growing. A missed day only pauses it; it never shrinks.</p>' +
      '<div class="kzg-acts"><button type="button" class="kzg-btn ghost" data-kzg-pick>Change tree</button><button type="button" class="kzg-btn ghost" data-kzg-why>Why 66 days?</button></div>';
    box.querySelector('[data-kzg-pick]').addEventListener('click', function () { picker(id); });
  }
  function picker(gid) {
    var cur = K.groveSpecies(gid), s = document.createElement('div'); s.className = 'kzg-why kzg-pick'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'kzg-pick-t');
    s.innerHTML = '<div class="kzg-why-in"><h2 id="kzg-pick-t">Choose this goal\'s tree</h2><p>It keeps every day it has grown.</p><div class="kzg-pgrid">' +
      ORDER.filter(function (k) { return K.SPECIES[k]; }).map(function (k) {
        return '<button type="button" class="kzg-pc' + (k === cur ? ' on' : '') + '" data-sp="' + k + '" aria-pressed="' + (k === cur) + '"><img src="' + img(k, 's5') + '" alt="" loading="lazy"><span>' + esc(K.SPECIES[k].name) + '</span></button>';
      }).join('') + '</div><button type="button" class="kzg-btn ghost" data-kzg-x>Cancel</button></div>';
    document.body.appendChild(s);
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sp]');
      if (b) { K.setGroveSpecies(gid, b.getAttribute('data-sp')); s.remove(); run(); return; }
      if (e.target === s || e.target.closest('[data-kzg-x]')) s.remove();
    });
    var on = s.querySelector('.kzg-pc.on'); if (on) on.focus();
  }

  // ---------- Progress: your trees ----------
  function progRows() {
    var cal = document.querySelector('#kz-prog-s1 #kz-cal'); if (!cal) return;
    var gs = goals(), box = document.querySelector('.kzg-prog');
    if (!gs.length) { if (box) box.remove(); return; }
    var sig = sigOf(gs); if (box && box.__sig === sig) return;
    if (!box) { box = document.createElement('section'); box.className = 'kzg-prog'; box.setAttribute('aria-label', 'Your trees'); cal.parentNode.insertBefore(box, cal); }
    box.__sig = sig;
    var earned = gs.filter(function (g) { return K.grow(g.id).earned; }).length;
    box.innerHTML = '<div class="kzg-th"><span>Your trees</span><em>' + earned + ' of ' + gs.length + ' habits earned</em></div>' + gs.map(function (g) {
      var w = K.grow(g.id);
      return '<a class="kzg-pr" href="' + goalHref(g) + '"><span class="kzg-pt"><img src="' + img(w.sp, w.key) + '" alt=""></span><span class="kzg-pb"><span class="kzg-ph"><b>' + esc(g.name) + '</b><em' + (w.earned ? ' class="e"' : '') + '>' +
        (w.earned ? '★ ' + w.stage + ' · ' + w.day + ' days grown' : w.stage + ' · ' + w.day + ' of 66 days grown') + '</em></span><span class="kzg-bar sm"><i style="width:' + Math.round(w.frac * 100) + '%"></i></span></span></a>';
    }).join('');
  }

  // ---------- habit earned (66) and later milestones, once each ----------
  var seen = null;
  function getSeen() {
    if (seen) return seen; seen = K.get('climbseen', null);
    if (!seen) { seen = {}; var gs = allGoals(); if (!gs.length) { seen = null; return {}; } gs.forEach(function (g) { seen[g.id] = K.climb(g.id).summits; }); K.set('climbseen', seen); } // Oct 25 d: nothing is written while there are no goals (Delete all data leaves no key behind)
    return seen;
  }
  function busy() { return !!document.querySelector('.kz-p3, .kz-p4, #kz-reveal:not([hidden]), .kz-sheet49:not([hidden]).on, .kz-qcard.in, .kz-setup, .kzg-over, .kzg-why, .kz-qmodal:not([hidden])'); }
  function checkEarned(tries) {
    if (!document.querySelector('#kz-today-s1')) return;
    var s = getSeen(), hit = null;
    goals().forEach(function (g) { var c = K.climb(g.id); if (c.summits > (s[g.id] || 0) && !hit) hit = g; });
    if (!hit) return;
    if (busy()) { if ((tries || 0) < 40) setTimeout(function () { checkEarned((tries || 0) + 1); }, 1500); return; }
    var c = K.climb(hit.id); s[hit.id] = c.summits; K.set('climbseen', s);
    earnedMoment(hit, c.summits);
  }
  function earnedMoment(g, n) {
    var at = peakAt(n - 1), w = K.grow(g.id), key = at >= 730 ? 's9' : at >= 365 ? 's8' : at >= 180 ? 's7' : at >= 100 ? 's6' : 's5';
    var title = at === 66 ? 'Habit earned.' : at === 100 ? 'Mature tree.' : at === 180 ? 'Strong tree.' : at === 365 ? 'Great tree.' : 'Ancient tree.';
    var line = at === 66 ? '66 days is about how long a habit takes to stick. Your ' + esc(w.species) + ' is fully grown.' : 'Day ' + at + '. Still growing, still yours.';
    var nx = w.next;
    var o = document.createElement('div'); o.className = 'kzg-over' + (calm ? ' calm' : ''); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', title);
    o.innerHTML = '<div class="kzg-ov-in"><div class="kzg-ov-art"><i class="kzg-halo"></i>' +
      (calm ? '' : '<i class="kzg-leaf" style="left:24%;--dx:-30px;animation-delay:.8s"></i><i class="kzg-leaf" style="left:66%;--dx:24px;animation-delay:1.6s"></i><i class="kzg-leaf g" style="left:44%;--dx:-12px;animation-delay:2.4s"></i><i class="kzg-leaf g" style="left:78%;--dx:30px;animation-delay:3.1s"></i>') +
      '<img class="kzg-ov-tree" src="' + img(w.sp, key, true) + '" alt="' + esc(w.species) + ', fully grown"></div>' +
      '<div class="kzg-ov-tx"><span class="kzg-ov-k">' + esc(g.name).toUpperCase() + ' · DAY ' + at + '</span><h2>' + title + '</h2><p>' + line + '</p></div>' +
      (nx ? '<div class="kzg-ov-next"><img src="' + img(w.sp, nx.at >= 730 ? 's9' : nx.at >= 365 ? 's8' : nx.at >= 180 ? 's7' : 's6') + '" alt=""><span><b>It keeps growing</b><em>' + nx.name + ' at day ' + nx.at + ' · ' + nx.left + (nx.left === 1 ? ' day' : ' days') + '</em></span></div>' : '') +
      '<div class="kzg-ov-acts"><a class="kzg-btn gold" href="/pages/profile">See it in your grove</a><button type="button" class="kzg-btn ghost" data-kzg-done>Keep going</button></div></div>';
    document.body.appendChild(o); document.body.classList.add('kz-noscroll');
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
    var close = function () { o.remove(); if (!document.querySelector('.kz-sheet49:not([hidden]), .kz-reveal:not([hidden])')) document.body.classList.remove('kz-noscroll'); };
    o.addEventListener('click', function (e) { if (e.target.closest('[data-kzg-done]')) close(); });
    var b = o.querySelector('[data-kzg-done]'); if (b) setTimeout(function () { b.focus(); }, 50);
  }

  // ---------- the unlock road is retired: its "UNLOCKED" pop-up never shows ----------
  function noReveal() {
    var rv = document.getElementById('kz-reveal'); if (!rv || rv.__kzg) return; rv.__kzg = 1;
    var hide = function () { if (!rv.hidden) { rv.hidden = true; if (!document.querySelector('.kz-sheet49:not([hidden])')) document.body.classList.remove('kz-noscroll'); } };
    hide(); new MutationObserver(hide).observe(rv, { attributes: true, attributeFilter: ['hidden'] });
  }

  // ---------- run ----------
  var queued = false;
  function run() {
    queued = false;
    try { noReveal(); } catch (e) {}
    try { groveView(); } catch (e) { de.classList.remove('kz-grove'); }
    try { todayCard(); } catch (e) {}
    try { goalCard(); } catch (e) {}
    try { progRows(); } catch (e) {}
    try { if (document.querySelector('#kz-today-s1')) setTimeout(checkEarned, 1200); } catch (e) {}
  }
  function soon() { if (queued) return; queued = true; (window.requestAnimationFrame || setTimeout)(function () { setTimeout(run, 0); }); }
  ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync', 'kz:alldone', 'kz:k66'].forEach(function (ev) { document.addEventListener(ev, soon); window.addEventListener(ev, soon); });
  window.addEventListener('pageshow', soon); window.addEventListener('storage', soon);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) soon(); });
  // pages build themselves after load; watch the main column, but never react to our own nodes
  function watch() {
    var m = document.getElementById('kz-main'); if (!m || m.__kzgw) return; m.__kzgw = 1;
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) { var t = list[i].target; if (t.closest && t.closest('.kzg-grove, .kzg-today, .kzg-goal, .kzg-prog, #kz-header')) continue; soon(); return; }
    }).observe(m, { childList: true, subtree: true });
  }
  function boot() { watch(); run(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 600);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzspring-1025f.js ==== */
;try {
/* Oct 25 f · Springs everywhere (James: "make pressing buttons and scrolling and jumping around as smooth as possible").
   iOS motion is damped harmonic motion (m·x'' = −k·x − c·x'), not fixed timers. This file samples three springs, tuned
   like SwiftUI's presets, into CSS linear() curves on :root (--kz-spr-smooth / --kz-spr-snappy / --kz-spr-bouncy, with
   matching durations), which kzspring-1025f.css applies to the app's existing sheets, rows, presses, toggles and the
   undo bar. CSS transitions already restart from wherever the element is when interrupted, so nothing jumps.
   Also exposes K.springCurve(name) for scripts. If linear() isn't supported, the original curves stay. */
(function () {
  var de = document.documentElement; if (de.__kzspr) return; de.__kzspr = 1;
  var P = { smooth: [0.42, 1, 520], snappy: [0.32, 0.86, 420], bouncy: [0.45, 0.68, 640] }; // response s, damping ratio, sample length ms
  function curve(p) {
    var r = p[0], z = p[1], ms = p[2], k = Math.pow(2 * Math.PI / r, 2), c = 4 * Math.PI * z / r, x = 0, v = 0, n = 40, dt = ms / 1000 / n / 8, out = [];
    for (var i = 0; i <= n; i++) { out.push(+x.toFixed(4)); for (var j = 0; j < 8; j++) { var a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; } }
    out[n] = 1; return 'linear(' + out.join(', ') + ')';
  }
  var ok = false; try { ok = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')); } catch (e) {}
  var C = {};
  Object.keys(P).forEach(function (n) { C[n] = curve(P[n]); if (ok) { de.style.setProperty('--kz-spr-' + n, C[n]); de.style.setProperty('--kz-spr-' + n + '-d', P[n][2] + 'ms'); } });
  if (ok) de.classList.add('kz-spr');
  if (window.KZ) window.KZ.springCurve = function (n) { return C[n] || C.smooth; };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzmenu-1025n.js ==== */
;try {
/* Oct 25 n (from 1025i): when another goal has the Kaizen 66 run, the menu offers "Make this my Kaizen 66" (asks, then resets to day 0; kz66sw-1025n). */
/* Oct 25 i · Goal actions, option B (James): an iOS-style menu instead of the bottom sheet.
   - Press and hold a goal: it lifts and the menu appears beside it. Move your finger and the menu goes away so the existing
     hold-to-drag reorder carries on as before. Let go without moving: the menu stays.
   - The ••• button opens the same menu (people don't discover press-and-hold on their own).
   - Rows: View goal, Edit, Kaizen 66 (start one / see it), Mark achieved · Move up, Move down · Archive, Delete.
     Each row presses the goal's own hidden menu item (871e…), so every action keeps its existing behaviour; Archive and
     Delete use the same K.archiveGoal / K.removeGoal calls as the old sheet. Delete asks once more in place.
   Styles: kzmenu-1025i.css */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzmenu) return; K.__kzmenu = 1;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var I = {
    view: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    k66: '<circle cx="12" cy="12" r="8.5"/><path d="M9 14.5c0-3 1-5.5 3.5-6.5M9 14.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>',
    won: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    arch: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
  var menu = null, back = null, card = null, items = [], openedAt = 0, openY = 0, sameTouch = false;

  function k66For(gid) {
    var s = null; try { s = K.k66 ? K.k66.state() : null; } catch (e) {}
    var r = s && s.run;
    if (!K.k66) return null;
    var gg = (K.goals() || []).filter(function (x) { return x.id === gid; })[0]; if (gg && gg.kind !== 'daily' && !(r && r.goal === gid)) return null;  // Oct 25 o: Kaizen 66 is for daily habits
    if (r && r.goal === gid && (r.state === 'live' || r.state === 'pending')) return { label: 'Kaizen 66 · day ' + (r.day || 0), act: 'goal' };
    if (r && (r.state === 'live' || r.state === 'pending')) return K.k66.askSwitch ? { label: 'Make this my Kaizen 66', act: 'switch' } : null; // one at a time: switching asks first
    return { label: 'Start Kaizen 66', act: 'start' };
  }
  function build(c) {
    var m = c.querySelector('.kz-gmenu'); if (!m) return null;
    var gid = c.getAttribute('data-goal'); items = [];
    var row = function (key, label, cls, el, dis) { items.push(el || null); return '<button type="button" class="kzm-it ' + (cls || '') + '" role="menuitem" data-i="' + (items.length - 1) + '" data-k="' + key + '"' + (dis ? ' disabled' : '') + '><span>' + esc(label) + '</span>' + svg(key) + '</button>'; };
    var view = m.querySelector('a'), edit = m.querySelector('[data-kz-edit]'), won = m.querySelector('[data-kz-won]'), mv = m.querySelectorAll('.kz-gm-move button');
    var h = '';
    if (view) h += row('view', 'View goal', '', view);
    if (edit) h += row('edit', 'Edit', '', edit);
    var k = k66For(gid); if (k) h += row('k66', k.label, 'gold', null);
    if (won) h += row('won', 'Mark achieved', '', won);
    if (mv.length) h += '<i class="kzm-sep"></i>' + row('up', 'Move up', '', mv[0], mv[0].disabled) + (mv[1] ? row('down', 'Move down', '', mv[1], mv[1].disabled) : '');
    h += '<i class="kzm-sep"></i>' + row('arch', 'Archive', '', null) + row('del', 'Delete', 'red', null);
    return h;
  }
  function open(c, fromHold) {
    close(true);
    var h = build(c); if (!h) return;
    card = c; openedAt = Date.now(); openY = window.scrollY;
    back = document.createElement('div'); back.className = 'kzm-back' + (calm ? ' calm' : '');
    menu = document.createElement('div'); menu.className = 'kzm' + (calm ? ' calm' : ''); menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Actions for ' + ((c.querySelector('.kz-gname') || {}).textContent || 'goal'));
    menu.innerHTML = h;
    document.body.appendChild(back); document.body.appendChild(menu);
    c.classList.add('kzm-on');
    // place under the goal, or above it when there's no room below
    var r = c.getBoundingClientRect(), mh = menu.offsetHeight, vh = window.innerHeight, below = r.bottom + 10, top = below + mh < vh - 100 ? below : Math.max(60, r.top - 10 - mh);
    menu.style.top = Math.round(top) + 'px'; menu.style.left = Math.round(Math.max(12, Math.min(r.left + 4, window.innerWidth - menu.offsetWidth - 12))) + 'px';
    menu.style.transformOrigin = (top > r.top ? 'top' : 'bottom') + ' left';
    requestAnimationFrame(function () { back.classList.add('on'); menu.classList.add('on'); });
    post({ type: 'haptic', n: 1 }); try { if (!fromHold && navigator.vibrate) navigator.vibrate(6); } catch (e) {}
    sameTouch = !!fromHold;
    back.addEventListener('click', function () { if (sameTouch) { sameTouch = false; swallowUntil = Date.now() + 300; return; } if (Date.now() < swallowUntil) return; close(); }); // the finger lifting off a long press can send a stray click
    menu.addEventListener('click', onPick);
    var f = menu.querySelector('.kzm-it:not([disabled])'); if (f && !fromHold) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }
  function close(now) {
    var m = menu, b = back, c = card; menu = back = card = null;
    if (c) c.classList.remove('kzm-on');
    if (!m) return;
    if (now || calm) { m.remove(); b.remove(); return; }
    m.classList.remove('on'); b.classList.remove('on'); m.classList.add('out');
    setTimeout(function () { m.remove(); b.remove(); }, 220);
  }
  function onPick(e) {
    var b = e.target.closest('.kzm-it'); if (!b || b.disabled) return;
    if (sameTouch) { sameTouch = false; swallowUntil = Date.now() + 300; return; } // the lift-off of the press that opened the menu
    if (Date.now() < swallowUntil) return;
    var key = b.getAttribute('data-k'), orig = items[+b.getAttribute('data-i')], c = card, gid = c && c.getAttribute('data-goal');
    if (key === 'del' && !b.classList.contains('sure')) { b.classList.add('sure'); b.querySelector('span').textContent = 'Tap again to delete for good'; post({ type: 'haptic', n: 1 }); return; }
    close();
    if (!gid) return;
    if (key === 'arch' || key === 'del') {
      if (c.isConnected) c.classList.add('kz-gone');
      setTimeout(function () { if (key === 'arch') K.archiveGoal(gid); else K.removeGoal(gid); try { K.track(key === 'arch' ? 'kz_goal_archived' : 'kz_goal_deleted'); } catch (x) {} document.dispatchEvent(new CustomEvent('kz:changed')); }, calm ? 0 : 260);
      return;
    }
    if (key === 'k66') {
      var st = k66For(gid);
      if (st && st.act === 'goal') location.href = '/pages/goal?id=' + encodeURIComponent(gid);
      else if (st && st.act === 'switch') K.k66.askSwitch(gid);
      else { var t = document.createElement('button'); t.type = 'button'; t.setAttribute('data-k66-open', gid); t.hidden = true; document.body.appendChild(t); t.click(); t.remove(); }
      return;
    }
    // rows can be re-rendered while the menu is open: find the goal's menu item again, live
    if (!orig || !orig.isConnected) {
      var live = document.querySelector('.kz-goal[data-goal="' + (window.CSS && CSS.escape ? CSS.escape(gid) : gid) + '"] .kz-gmenu');
      if (live) { var mvs = live.querySelectorAll('.kz-gm-move button'); orig = key === 'view' ? live.querySelector('a') : key === 'edit' ? live.querySelector('[data-kz-edit]') : key === 'won' ? live.querySelector('[data-kz-won]') : key === 'up' ? mvs[0] : key === 'down' ? mvs[1] : null; c = live.closest('.kz-goal'); }
    }
    if (orig) setTimeout(function () { orig.click(); var box = c.isConnected && c.querySelector('.kz-editbox:not([hidden])'); if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, calm ? 0 : 120);
  }

  // ••• opens the menu instead of the sheet
  document.addEventListener('click', function (e) {
    var more = e.target.closest && e.target.closest('[data-kz-more]'); if (!more) return;
    var c = more.closest('.kz-goal.kz-grow, .kz-goal'); if (!c || !c.querySelector('.kz-gmenu')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    open(c, false);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu) close(); });

  // press and hold (~0.45 s, finger still) on a goal opens the menu. If the page's own hold-to-drag lifts the row too, the
  // menu sits beside it; moving the finger closes the menu and the drag carries on as before.
  var tx = 0, ty = 0, moved = false, timer = 0, holdCard = null;
  document.addEventListener('touchstart', function (e) {
    clearTimeout(timer); moved = false; holdCard = null; sameTouch = false;
    var t = e.touches[0]; tx = t.clientX; ty = t.clientY;
    if (e.touches.length > 1) return;
    var c = e.target.closest && e.target.closest('.kz-goal'); if (!c || !c.querySelector('.kz-gmenu')) return;
    if (e.target.closest('button, a, input, textarea, .kz-gswipe, .kz-editbox, .kz-delbox')) return;
    holdCard = c;
    timer = setTimeout(function () { if (!moved && holdCard && holdCard.isConnected && !menu) open(holdCard, true); }, 450);
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', function (e) {
    var t = e.touches[0]; if (Math.abs(t.clientX - tx) > 8 || Math.abs(t.clientY - ty) > 8) { moved = true; clearTimeout(timer); if (menu && Date.now() - openedAt < 4000 && holdCard) { holdCard = null; close(); } }
  }, { passive: true, capture: true });
  var swallowUntil = 0;
  document.addEventListener('pointerup', function (e) { if (sameTouch && menu && e.pointerType !== 'mouse') { sameTouch = false; swallowUntil = Date.now() + 450; } }, true);
  document.addEventListener('touchend', function (e) {
    clearTimeout(timer); holdCard = null;
    if (sameTouch && menu) {
      sameTouch = false; swallowUntil = Date.now() + 450;
      // the long press opened the menu: this lift-off is not a tap on the goal (unless the page lifted the row to drag it,
      // in which case its own touchend must run to drop the row back)
      if (!(card && card.classList.contains('kz-lift'))) { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); }
    }
  }, { passive: false, capture: true });
  // lifting the finger after a long press must not also "tap" whatever is under it (the goal row would open)
  document.addEventListener('click', function (e) { if (e.isTrusted && Date.now() < swallowUntil) { swallowUntil = 0; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener('touchcancel', function () { clearTimeout(timer); holdCard = null; }, { passive: true, capture: true });
  window.addEventListener('scroll', function () { if (menu && Math.abs(window.scrollY - openY) > 40) close(); }, { passive: true });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsheet-1027x.js ==== */
;try {
/* Oct 27 x (from 1027v) · fixes: no body.kz-noscroll (it jumped a scrolled page to the top, kzmenu read that as a scroll and
   closed the menu before it painted: the ••• on Done today rows 'glitched and never opened'); the tab bar is told directly.
   Kaizen 66 icon reads 66. No Archive row.
   Was: Oct 27 v · Goal actions as a bottom sheet (James: "like Instagram's"). kzmenu-1025n still builds the menu and runs every
   action; this only reshapes it when it appears: grab handle on top, rows grouped into rounded cards, icon on the left of
   each label. Drag the sheet down (or tap outside) to close it. Dark, to match the app. Styles: kzsheet-1027x.css */
(function () {
  var K = window.KZ; if (!K || K.__kzsheet) return; K.__kzsheet = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var K66 = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><text x="12" y="15.6" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor" stroke="none" font-family="-apple-system, system-ui, sans-serif" letter-spacing="-.3">66</text></svg>';
  function shape(m) {
    if (m.__kzs) return; m.__kzs = 1; m.classList.add('kzs');
    var kids = [].slice.call(m.children), grp = null, frag = document.createDocumentFragment();
    var grab = document.createElement('i'); grab.className = 'kzs-grab'; grab.setAttribute('aria-hidden', 'true'); frag.appendChild(grab);
    kids.forEach(function (el) {
      if (el.classList.contains('kzm-sep')) { el.remove(); grp = null; return; }
      if (!grp) { grp = document.createElement('div'); grp.className = 'kzs-grp'; grp.setAttribute('role', 'group'); frag.appendChild(grp); }
      if (el.getAttribute('data-k') === 'arch') { el.remove(); return; }   // archive is gone (James, Oct 27)
      if (el.getAttribute('data-k') === 'k66') { var o = el.querySelector('svg'); if (o) o.outerHTML = K66; }
      var ic = el.querySelector('svg'); if (ic) el.insertBefore(ic, el.firstChild);   // icon left, like Instagram
      grp.appendChild(el);
    });
    m.appendChild(frag);
    drag(m);
    // like every other sheet: the page behind holds still and the tab bar steps aside (1dddad8 tells the app)
    // the page holds still and the tab bar steps aside, told to the app directly (no body class: see top)
    var mine = !document.body.classList.contains('kz-noscroll');
    if (mine) post({ type: 'pageScroll', on: false });
    var done = function () { if (mine) { mine = false; if (!document.body.classList.contains('kz-noscroll')) post({ type: 'pageScroll', on: true }); } };
    new MutationObserver(function (r, o) { if (m.classList.contains('out') || !m.isConnected) { done(); o.disconnect(); } }).observe(m, { attributes: true, attributeFilter: ['class'] });
    m.__kzsDone = done;
  }
  // drag down to dismiss
  function drag(m) {
    var y0 = 0, t0 = 0, dy = 0, on = false, moved = false;
    m.addEventListener('touchstart', function (e) { if (e.touches.length > 1) return; on = true; moved = false; dy = 0; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
    m.addEventListener('touchmove', function (e) {
      if (!on) return; dy = e.touches[0].clientY - y0;
      if (!moved && Math.abs(dy) < 8) return;
      moved = true; m.classList.add('kzs-drag');
      m.style.transform = 'translateY(' + (dy > 0 ? dy : dy / 6) + 'px)';   // a little give upward, free downward
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    m.addEventListener('touchend', function () {
      if (!on) return; on = false; if (!moved) return;
      var fast = dy > 30 && dy / Math.max(1, Date.now() - t0) > 0.5;
      m.classList.remove('kzs-drag');
      if (dy > 90 || fast) { var b = document.querySelector('.kzm-back'); m.style.transform = 'translateY(' + Math.max(dy, 0) + 'px)'; if (b) b.click(); }
      else m.style.transform = '';
    });
    // a drag that ends over a row must not also press it
    m.addEventListener('click', function (e) { if (moved) { moved = false; e.stopPropagation(); e.preventDefault(); } }, true);
  }
  function scan(n) { if (n.nodeType === 1 && n.classList.contains('kzm') && n.getAttribute('role') === 'menu') shape(n); }
  new MutationObserver(function (ms) { ms.forEach(function (r) {
    [].forEach.call(r.addedNodes, scan);
    [].forEach.call(r.removedNodes, function (n) { if (n.__kzsDone) n.__kzsDone(); });   // closed at once (no "out" step)
  }); }).observe(document.body, { childList: true });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztidy-1027x.js ==== */
;try {
/* Oct 27 x · James's tidy-ups (styles: kztidy-1027x.css)
   1. Swipe a goal left: Edit + Delete. The Archive button becomes Edit (opens the goal's own editor, same as ••• → Edit).
   2. Archive is retired: "Archived goals" links only show while something is still archived, so old ones can be restored.
   (LATER divider → plain line and the glass checks are CSS only.) */
(function () {
  var K = window.KZ; if (!K || K.__kztidy) return; K.__kztidy = 1;
  var PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
  function patch(root) {
    [].forEach.call((root || document).querySelectorAll('.kz-gswipe .arch[data-kz-sw-arch]'), function (b) {
      var id = b.getAttribute('data-kz-sw-arch'); b.removeAttribute('data-kz-sw-arch');
      b.className = 'edit'; b.setAttribute('data-kz-sw-edit', id); b.innerHTML = PEN + 'Edit';
    });
  }
  function archLinks() {
    var n = 0; try { n = (K.archived() || []).length; } catch (e) {}
    document.documentElement.classList.toggle('kz-has-arch', n > 0);
  }
  patch(); archLinks();
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && (n.querySelector('.kz-gswipe .arch') || n.matches('.kz-gswipe, .kz-gswipe *'))) { patch(n.closest('.kz-goal') || n); } }
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('kz:changed', function () { setTimeout(archLinks, 0); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kz-sw-edit]'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    var c = b.closest('.kz-goal'), ed = c && c.querySelector('.kz-gmenu [data-kz-edit]');
    document.body.click();   // closes the open swipe the same way a tap elsewhere does
    if (ed) setTimeout(function () { ed.click(); var box = c.isConnected && c.querySelector('.kz-editbox:not([hidden])'); if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 200);
  }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzexp-1102.js ==== */
;try {
/* Nov 2 · copy of kzexp-1027z.js: the unfolded row's "day streak" tile is now feet climbed. */
/* Oct 27 z (from 1027y): the text lines in an opened goal become visuals (James: "take away the bland text, satisfying visuals"):
   ring to day 66, streak tile, days-done tile, last 14 days as dots; the green stat line and the grey "days grown" line are gone.
   Was: Oct 27 y · Opening / closing a goal (James: "they bounce around and get distorted", "show a preview of your growth").
   - The panel (.kz-gx from 871e) now unfolds and folds as one clipped box (0.32 s, no overshoot). Everything below moves
     with it in layout; no transforms on other rows. While it moves, K.spring (kzfocus-1025m's FLIP springs, which made
     the rows bounce and overlap) finishes instantly, the same trick the check-off glide uses.
   - Closing: the tap is taken here, the panel folds, then K.collapseGoals() (871e) closes it for real.
   - Growth preview at the top of the panel: this goal's tree now -> its next stage (faded), the stage name, days to the
     next stage and a gold bar. Uses K.grow (kzgrove-1025m) and the same tree art. Replaces the "Day N of ~66" card
     (its number is in the preview). Styles: kzexp-1027z.css */
(function () {
  var K = window.KZ; if (!K || K.__kzexp) return; K.__kzexp = 1;
  var FL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 3.2 4.8 5.6 4.8 10.4A4.8 4.8 0 0 1 12 17.7a4.8 4.8 0 0 1-4.8-4.8c0-2 .9-3.3 1.9-4.4.2 1.5.9 2.4 1.9 2.8-.3-3.3.9-6.4 1-8.8z"/></svg>';
  function ring(n) { var p = Math.min(1, n / 66), R = 21, L = 2 * Math.PI * R; return '<svg class="kzgv-ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="' + R + '" class="t"/><circle cx="26" cy="26" r="' + R + '" class="f" stroke-dasharray="' + (L * p).toFixed(1) + ' ' + L.toFixed(1) + '" transform="rotate(-90 26 26)"/></svg>'; }
  function days14(gid) { var d = ((K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {})[gid] || {}, t = K.today(), h = ''; for (var i = 13; i >= 0; i--) { var k = K.key(K.addDays(t, -i)); h += '<i class="' + (d[k] ? 'on' : '') + (i === 0 ? ' today' : '') + '"></i>'; } return h; }
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ART = (window.KZ_ART || '/art/') + 'trees/', EASE = 'cubic-bezier(.25,.1,.25,1)', DUR = 320;
  var MSKEY = { 'Planted': 'seed', 'Sprout': 'sd2', 'Seedling': 'sd4', 'Sapling': 's1', 'Young tree': 's3', 'Tree': 's4', 'Habit earned': 's5', 'Full tree': 's5', 'Mature tree': 's6' };
  function img(sp, key) { return /^(seed|sd\d)$/.test(key) ? ART + sp + '/' + key + '_v2.webp' : ART + sp + '/' + key + '_full_sm.webp'; }
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };

  // springs finish at once while a panel moves
  var quietUntil = 0;
  function quiet(ms) {
    quietUntil = Date.now() + ms;
    if (!K.spring || K.spring.__kzexp) return;
    var o = K.spring, w = function (key, from, to, apply, preset, end) {
      if (Date.now() < quietUntil) { try { apply(to); } catch (e) {} try { if (end) end(); } catch (e) {} return { v: 0, x: to, to: to }; }
      return o.apply(this, arguments);
    }; w.__kzexp = 1; w.__kzsk = o.__kzsk; K.spring = w;
  }

  function preview(gid) {
    if (!K.grow) return '';
    var w; try { w = K.grow(gid); } catch (e) { return ''; }
    var nxKey = w.next && MSKEY[w.next.name], prevAt = 0;
    var nm = w.day >= 66 ? 'Habit earned' : w.stage, left = w.next ? w.next.left : 0;
    // progress inside the current stage
    var steps = [0, 3, 7, 14, 30, 45, 66, 100, 180, 365, 730];
    for (var i = 0; i < steps.length; i++) if (w.day >= steps[i]) prevAt = steps[i];
    var frac = w.next ? Math.max(0.03, Math.min(1, (w.day - prevAt) / Math.max(1, w.next.at - prevAt))) : 1;
    return '<div class="kzgp" aria-label="Your growth">' +
      '<div class="kzgp-art"><img class="now" src="' + img(w.sp, w.key) + '" alt="' + esc(nm) + ' now">' +
      (nxKey ? '<svg class="kzgp-to" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg><img class="next" src="' + img(w.sp, nxKey) + '" alt="' + esc(w.next.name) + ' next">' : '') + '</div>' +
      '<div class="kzgp-txt"><b>' + esc(nm) + '</b>' +
      (w.next ? '<em>' + esc(w.next.name) + ' in ' + left + (left === 1 ? ' day' : ' days') + '</em>' : '') +
      '<i class="kzgp-bar"><i style="width:' + Math.round(frac * 100) + '%"></i></i></div></div>' + stats(gid, w.day);
  }
  function stats(gid, grown) {
    var g = (K.goals() || []).filter(function (q) { return q.id === gid; })[0], st = { done: grown, streak: 0 };
    try { if (g && K.goalStats) st = K.goalStats(g); } catch (e) {}
    var n = Math.min(66, st.done);
    var ft = null; try { ft = K.goalFt ? K.goalFt(g || gid) : null; } catch (e) {} if (ft == null) ft = st.done * 131;
    return '<div class="kzgv" aria-label="' + st.done + ' days done, ' + ft.toLocaleString() + ' feet climbed">' +
      '<div class="kzgv-t kzgv-66">' + ring(st.done) + '<span class="kzgv-in"><b>' + n + '</b><small>/66</small></span><em>to a habit</em></div>' +
      '<div class="kzgv-t kzgv-st' + (ft ? ' hot' : '') + '"><b>' + ft.toLocaleString() + '</b><em>ft climbed</em></div>' +
      '<div class="kzgv-t"><b class="big">' + st.done + '</b><em>' + (st.done === 1 ? 'day done' : 'days done') + '</em></div>' +
      '</div><div class="kzgv-14" aria-label="Last 14 days">' + days14(gid) + '</div>';
  }
  function dress(x) {
    if (x.__kzexp) return; x.__kzexp = 1;
    var row = x.closest('.kz-grow'), gid = row && row.getAttribute('data-goal'); if (!gid) return;
    var h = preview(gid); if (!h) return;
    var st = x.querySelector('.kz-gxstats'); if (st) st.insertAdjacentHTML('afterend', h); else x.insertAdjacentHTML('afterbegin', h);
    x.classList.add('kzgp-on', 'kzgv-on');
  }
  function unfold(x) {
    if (calm || !x.animate) return;
    quiet(DUR + 500);
    var h = x.offsetHeight; x.style.overflow = 'hidden';
    var a = x.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: DUR, easing: EASE });
    a.onfinish = a.oncancel = function () { x.style.overflow = ''; };
  }
  function fold(x, then) {
    if (calm || !x.animate) { then(); return; }
    quiet(DUR + 500);
    var h = x.offsetHeight; x.style.overflow = 'hidden';
    var a = x.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: Math.round(DUR * .85), easing: EASE, fill: 'forwards' });
    a.onfinish = function () { then(); };
  }

  // panels appear: dress + unfold (before the first paint: the observer runs in the same task)
  new MutationObserver(function (ms) {
    ms.forEach(function (r) { [].forEach.call(r.addedNodes, function (n) {
      if (n.nodeType !== 1) return;
      var xs = n.classList.contains('kz-gx') ? [n] : [].slice.call(n.querySelectorAll ? n.querySelectorAll('.kz-gx') : []);
      xs.forEach(function (x) { var fresh = !x.__kzexp; dress(x); if (fresh && n === x && tapping) unfold(x); });
    }); });
  }).observe(document.body, { childList: true, subtree: true });
  [].forEach.call(document.querySelectorAll('.kz-gx'), dress);   // a row already open on load

  // the tap that opens or closes a panel (same targets as 871e)
  var tapping = false, folding = false;
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var x = t.closest('[data-kz-expand]'), chev = t.closest('.kz-gchev');
    if (!x || x.closest('[data-no-expand]')) return;
    if (t.closest('a,textarea,input') || (t.closest('button') && !chev)) return;
    var row = x.closest('.kz-grow'); if (!row) return;
    quiet(DUR + 600);   // fold/unfold of a long-term card too: no springs
    var g = (K.goals() || []).filter(function (q) { return q.id === row.getAttribute('data-goal'); })[0];
    var opensPanel = !(g && g.kind !== 'daily') || chev;
    if (!opensPanel) return;
    if (row.classList.contains('open')) {   // closing: fold first, then let 871e close it
      e.stopImmediatePropagation(); e.preventDefault();
      if (folding) return; folding = true;
      var gx = row.querySelector('.kz-gx');
      if (!gx) { folding = false; K.collapseGoals(); return; }
      fold(gx, function () { folding = false; K.collapseGoals(); try { K.track('kz_goal_collapse'); } catch (er) {} });
      return;
    }
    tapping = true; setTimeout(function () { tapping = false; }, 0);
  }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzfix-1023q.js ==== */
;try {
/* Oct 23 QA fixes (1023q: same as 1023a plus a cached rest-day set): shield (rest) days count everywhere, not only in the header streak.
   - K.goalStats: a goal's streak and best streak bridge rest days (same rule as the main streak: a rest day doesn't add, doesn't break)
   - K.dayInfo: a day a shield covered reports status 'rest' (calendars, week strips, day cards) instead of 'grew'/'setback'
   Works whichever file defines K.dayInfo (core or an inline copy): the property is wrapped when it's assigned. */
(function () {
  var K = window.KZ; if (!K || K.__kzfix1023) return; K.__kzfix1023 = 1;
  // Oct 23 audit (perf): the rest-day set is computed once per storage change and day, not once per goal and day.
  // Before this, K.xp / goal stats / calendars called streakInfo() for every goal: ~10 s on a 400-goal, 2-year account.
  var gen = 0, bump = function () { gen++; }, cache = null;
  try {
    var SP = Storage.prototype;
    if (!SP.__kzgen) { ['setItem', 'removeItem', 'clear'].forEach(function (m) { var o = SP[m]; SP[m] = function () { gen++; return o.apply(this, arguments); }; }); SP.__kzgen = 1; }
  } catch (e) {}
  window.addEventListener('storage', bump); window.addEventListener('pageshow', bump); document.addEventListener('visibilitychange', bump);
  var restSet = function () {
    var day = K.key(K.today());
    if (cache && cache.gen === gen && cache.day === day) return cache.s;
    var s = {}; try { ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (k) { s[k] = 1; }); } catch (e) {}
    cache = { gen: gen, day: day, s: s }; return s;
  };
  K.restDays = restSet;
  var wrapStats = function (gs) {
    if (!gs || gs.__kzfix) return gs;
    var f = function (g) {
      var st = gs.apply(this, arguments), rest = restSet(), set = st.set || {}, t = K.today(), tk = K.key(t);
      var c = set[tk] ? t : K.addDays(t, -1), cur = 0, guard = 0;
      while (guard++ < 500) { var k = K.key(c); if (set[k]) cur++; else if (!rest[k]) break; c = K.addDays(c, -1); }
      var days = Object.keys(set).filter(function (k) { return set[k]; }).sort(), best = 0, run = 0, prev = null;
      days.forEach(function (k) {
        if (prev) { var d = K.addDays(new Date(prev + 'T12:00:00'), 1), ok = true, n = 0; while (K.key(d) < k && n++ < 400) { if (!rest[K.key(d)]) { ok = false; break; } d = K.addDays(d, 1); } run = ok ? run + 1 : 1; } else run = 1;
        if (run > best) best = run; prev = k;
      });
      st.streak = cur; st.best = Math.max(best, cur); st.rest = rest; return st;
    };
    f.__kzfix = 1; return f;
  };
  var wrapDay = function (di) {
    if (!di || di.__kzfix) return di;
    var f = function (k) { var r = di.apply(this, arguments); if (r && r.status !== 'full' && r.status !== 'future' && r.status !== 'today' && restSet()[k]) r.status = 'rest'; return r; };
    f.__kzfix = 1; return f;
  };
  [['goalStats', wrapStats], ['dayInfo', wrapDay]].forEach(function (p) {
    var name = p[0], wrap = p[1], cur = wrap(K[name]);
    try { Object.defineProperty(K, name, { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrap(v); } }); } catch (e) { K[name] = cur; }
  });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsec-1102.js ==== */
;try {
/* Nov 2 · copy of kzsec-1025n.js: sharing no longer mentions the everyday streak (gone); Kaizen 66 text unchanged. */
/* Oct 25 n · Security pass (red team). Loaded on every page, after the core files.
   1. Nothing leaves the phone by itself: K.track is a no-op, no gtag, the old website form (/contact) can't send.
   2. Share: no link (James, Oct 25: "No link for now"), no retired words (tree height, water); the card shows the
      Kaizen 66 run or the streak. The Shopify test-store address is removed from shares and calendar reminders.
   3. Restore from a backup only writes clean data: a Kaizen backup object, <= 8 MB, known shapes, no __proto__ /
      constructor / prototype keys, capped string lengths and depth, no auth / sync keys, key names [a-z0-9_].
   K.share / K.shareCard / K.track are locked so files loaded later can't put the old versions back. */
(function () {
  var K = window.KZ; if (!K || K.__kzsec) return; K.__kzsec = 1;
  function lock(name, fn) { try { Object.defineProperty(K, name, { configurable: false, enumerable: true, get: function () { return fn; }, set: function () {} }); } catch (e) { K[name] = fn; } }
  function wrapOnSet(name, wrap) {
    var cur = K[name] ? wrap(K[name]) : undefined;
    try { Object.defineProperty(K, name, { configurable: false, enumerable: true, get: function () { return cur; }, set: function (v) { cur = v ? wrap(v) : v; } }); } catch (e) {}
  }
  K.SHARE_URL = '';
  var BAD_URL = /https?:\/\/[^\s"'<>]*myshopify\.com[^\s"'<>]*/gi;

  // ---------- 1 · no tracking ----------
  lock('track', function () {});
  try { if (window.gtag) window.gtag = function () {}; } catch (e) {}

  // ---------- 2 · share ----------
  function esc(s) { return String(s == null ? '' : s); }
  function runInfo() {
    try {
      var st = K.k66 && K.k66.state(), r = st && st.run; if (!r || r.state !== 'live') return null;
      var g = (K.goals() || []).filter(function (x) { return x.id === r.goal; })[0]; if (!g) return null;
      return { name: g.name, day: r.day, gid: g.id };
    } catch (e) { return null; }
  }
  function streak() { try { var s = K.streakInfo && K.streakInfo(); return s && s.streak != null ? s.streak : (K.streak ? K.streak() : 0); } catch (e) { return 0; } }
  function earned() { var n = 0; try { (K.goals() || []).forEach(function (g) { try { if (K.grow(g.id).earned) n++; } catch (e) {} }); } catch (e) {} return n; }
  function shareText() {
    var r = runInfo(), s = streak();
    var t = r ? 'Day ' + r.day + ' of my Kaizen 66: ' + esc(r.name) + '.' : 'I’m building a habit with Kaizen, one day at a time.';
    return t + (K.SHARE_URL ? ' ' + K.SHARE_URL : '');
  }
  function shareCard() {
    var r = runInfo(), s = streak(), e = earned(), W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    var src = null; try { if (r && K.grow && K.groveImg) { var w = K.grow(r.gid); src = K.groveImg(w.sp, w.key, true); } } catch (er) {}
    var font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';
    return new Promise(function (res) {
      if (!src) return res(null);
      var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); }; img.src = src;
    }).then(function (img) {
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      var g = x.createRadialGradient(W / 2, 600, 40, W / 2, 600, 640); g.addColorStop(0, '#1C1C1E'); g.addColorStop(1, '#000000'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.textAlign = 'center'; x.fillStyle = '#E2B93B'; x.font = '800 40px ' + font; x.fillText('KAIZEN', W / 2, 110);
      if (img) { var k = Math.min(760 / img.width, 680 / img.height), iw = img.width * k, ih = img.height * k; x.drawImage(img, (W - iw) / 2, 200 + (680 - ih), iw, ih); }
      x.fillStyle = '#FFFFFF'; x.font = '800 92px ' + font;
      x.fillText(r ? 'Day ' + r.day + ' of 66' : s + (s === 1 ? ' day' : ' days'), W / 2, img ? 1010 : 640);
      x.fillStyle = '#AEAEB2'; x.font = '600 44px ' + font;
      var sub = r ? String(r.name) : 'in a row';
      if (x.measureText(sub).width > 940) { while (sub.length > 4 && x.measureText(sub + '…').width > 940) sub = sub.slice(0, -1); sub += '…'; }
      x.fillText(sub, W / 2, img ? 1080 : 710);
      var dsu = 0; try { dsu = K.daysShownUp() || 0; } catch (er) {} var chips = [[dsu + (dsu === 1 ? ' day shown up' : ' days shown up'), '#E2B93B']]; if (e) chips.push([e + (e === 1 ? ' habit earned' : ' habits earned'), '#30D158']);
      var cw = 400, gap = 30, tot = chips.length * cw + (chips.length - 1) * gap, cx = (W - tot) / 2;
      chips.forEach(function (c, i) { var bx = cx + i * (cw + gap), by = 1150; x.fillStyle = '#1C1C1E'; x.strokeStyle = c[1]; x.lineWidth = 5; x.beginPath(); if (x.roundRect) x.roundRect(bx, by, cw, 92, 46); else x.rect(bx, by, cw, 92); x.fill(); x.stroke(); x.fillStyle = c[1]; x.font = '800 36px ' + font; x.fillText(c[0], bx + cw / 2, by + 59); });
      return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  }
  function share() {
    var text = shareText();
    return shareCard().then(function (blob) {
      var file = blob && new File([blob], 'kaizen-' + K.key(K.today()) + '.png', { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text }).catch(function () {});
      if (navigator.share) return navigator.share({ text: text }).catch(function () {});
      try { navigator.clipboard.writeText(text); if (K.toast) K.toast('Copied'); } catch (e) {}
    }).catch(function () {});
  }
  lock('shareCard', shareCard); lock('share', share); K.shareText = shareText;
  // calendar reminders (.ics) carried the store address in DESCRIPTION and URL
  wrapOnSet('reminderICS', function (fn) { if (fn.__kzsec) return fn; var w = function () { var s = fn.apply(this, arguments); return typeof s === 'string' ? s.replace(/\\n?https?:\/\/[^\r\n\\]*myshopify\.com[^\r\n\\]*/gi, '').replace(/\r?\nURL:[^\r\n]*/g, '') : s; }; w.__kzsec = 1; return w; });
  // last line of defence: nothing handed to the share sheet carries the store address
  try {
    if (navigator.share && !navigator.share.__kzsec) {
      var ns = navigator.share.bind(navigator), clean = function (d) { if (!d) return d; var o = {}; for (var k in d) o[k] = d[k]; if (typeof o.text === 'string') o.text = o.text.replace(BAD_URL, '').replace(/\s+$/, ''); if (typeof o.url === 'string' && BAD_URL.test(o.url)) delete o.url; BAD_URL.lastIndex = 0; return o; };
      var wrapped = function (d) { return ns(clean(d)); }; wrapped.__kzsec = 1; navigator.share = wrapped;
    }
  } catch (e) {}

  // ---------- 3 · restore only clean data ----------
  var DENY = /^(auth|sync|syncmeta|appleid|kzdemo.*|demo.*)$/;
  var CAP = { name: 90, txt: 120, step: 160, cue: 160, mini: 160, username: 60, treename: 60, note: 5000 };
  function cleanVal(v, depth, keyName) {
    if (depth > 12) return undefined;
    if (v === null || typeof v === 'number' || typeof v === 'boolean') return typeof v === 'number' && !isFinite(v) ? 0 : v;
    if (typeof v === 'string') { var cap = CAP[keyName] || 5000; return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, cap); }
    if (Array.isArray(v)) { var a = []; for (var i = 0; i < v.length && i < 5000; i++) { var c = cleanVal(v[i], depth + 1, keyName); if (c !== undefined) a.push(c); } return a; }
    if (typeof v === 'object') {
      var o = {}, n = 0;
      for (var k in v) {
        if (!Object.prototype.hasOwnProperty.call(v, k) || k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        if (++n > 20000) break;
        var c2 = cleanVal(v[k], depth + 1, k); if (c2 !== undefined) o[k] = c2;
      }
      return o;
    }
    return undefined;
  }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function cleanBackup(o) {
    if (!isObj(o) || o.app !== 'kaizen' || !isObj(o.data)) throw new Error('That file is not a Kaizen backup.');
    var d = {}, src = o.data;
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k) || !/^[a-z0-9_]{1,40}$/.test(k) || DENY.test(k)) continue;
      var v = cleanVal(src[k], 0, k); if (v !== undefined) d[k] = v;
    }
    // shapes the restore code relies on
    var arr = { goals: 1, archived: 1, todos: 1 }, obj = { done: 1, gnotes: 1, journal: 1, rate: 1, thought: 1, liked: 1, unlocked: 1, tomb: 1, plans: 1, grove: 1, k66: 1, visit: 1, pillars: 0 };
    Object.keys(arr).forEach(function (k) { if (k in d && !Array.isArray(d[k])) delete d[k]; });
    Object.keys(obj).forEach(function (k) { if (obj[k] && k in d && !isObj(d[k])) delete d[k]; });
    ['goals', 'archived'].forEach(function (k) {
      if (!d[k]) return;
      d[k] = d[k].filter(function (g) { return isObj(g) && typeof g.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(g.id) && typeof g.name === 'string' && g.name.trim(); }).slice(0, 500);
    });
    if (d.todos) d.todos = d.todos.filter(function (t) { return isObj(t) && typeof t.txt === 'string'; }).slice(0, 2000);
    if (d.done) { for (var gid in d.done) { if (!isObj(d.done[gid])) { delete d.done[gid]; continue; } for (var day in d.done[gid]) if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) delete d.done[gid][day]; } }
    return { app: 'kaizen', v: o.v, at: o.at, data: d };
  }
  K.cleanBackup = cleanBackup;
  if (K.importData && !K.importData.__kzsec) {
    var imp = K.importData, wi = function (o) { return imp.call(this, cleanBackup(o)); }; wi.__kzsec = 1; K.importData = wi;
  }
  (function () {
    var rf = function (file) {
      if (!file || file.size > 8 * 1024 * 1024) return Promise.reject(new Error('That file is too big to be a Kaizen backup.'));
      return new Promise(function (res, rej) {
        var rd = new FileReader(); rd.onerror = function () { rej(new Error('That file could not be read.')); };
        rd.onload = function () { var o; try { o = JSON.parse(rd.result); } catch (e) { return rej(new Error('That file is not a Kaizen backup.')); } try { res(K.importData(o)); } catch (e) { rej(new Error(e && e.message ? e.message : 'That file could not be restored.')); } };
        rd.readAsText(file);
      });
    };
    rf.__kzsec = 1; lock('restoreFile', rf);
  })();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kz66sw-1025n.js ==== */
;try {
/* Oct 25 n · Change your Kaizen 66 goal (James). Only daily habits can be the Kaizen 66 goal (Oct 25 o).
   Switching always asks first ("Reset to day 0?") and then starts the new goal from zero: Day 1 is today if it's already
   checked off today, otherwise tomorrow (kz66's own start rules). The old run is kept in history as switched; every tree
   keeps all the days it has grown. Entry points: "Change goal" on Today's Kaizen 66 card, "Make this my Kaizen 66" on
   another goal's page, and the same row in the goal menu (kzmenu-1025n). Data stays kz_k66 (kz66-1024f). */
(function () {
  var K = window.KZ; if (!K || K.__kz66sw) return; K.__kz66sw = 1;
  var de = document.documentElement;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0] || null; }
  function run() { try { var s = K.k66 && K.k66.state(), r = s && s.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  function kindName(g) { return g.kind === 'long' ? 'Long-term goal' : g.kind === 'todo' ? 'One-time goal' : 'Daily habit'; }
  function thumb(g) { try { var w = K.grow(g.id); return K.groveImg(w.sp, w.key); } catch (e) { return ''; } }
  function fire() { ['kz:k66', 'kz:changed'].forEach(function (n) { try { document.dispatchEvent(new CustomEvent(n)); } catch (e) {} }); }

  // end the current run (kept in history as switched) and start the new goal from zero
  function switchTo(id) {
    attach(); if (!goal(id) || !K.k66) return false;
    var s = K.get('k66', null); if (!s || typeof s !== 'object') s = {}; s.runs = s.runs || []; s.seen = s.seen || {};
    var r = run();
    if (s.run) { s.runs.push({ goal: s.run.goal, start: s.run.start, end: K.key(K.today()), days: r ? (r.todayDone ? r.day : Math.max(0, (r.day || 1) - 1)) : 0, shields: r ? (r.used || 0) : 0, won: 0, quit: 1, switched: id }); }
    s.run = null; s.pending = null; K.set('k66', s);
    K.k66.start(id);
    post({ type: 'haptic', n: 2 }); fire();
    return true;
  }

  // ---------- the sheet ----------
  var layer = null, from = null;
  function close() {
    if (!layer) return; var l = layer; layer = null; l.classList.remove('on'); de.classList.remove('kzsw-open');
    post({ type: 'pageScroll', on: true }); setTimeout(function () { l.remove(); }, 280);
    if (from && from.focus) try { from.focus({ preventScroll: true }); } catch (e) {}
  }
  function open(html) {
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'kzsw-back'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
      layer.addEventListener('click', onClick); document.body.appendChild(layer);
      post({ type: 'pageScroll', on: false }); de.classList.add('kzsw-open');
      requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
    }
    layer.innerHTML = '<div class="kzsw"><i class="kzsw-grab" aria-hidden="true"></i>' + html + '</div>';
    var f = layer.querySelector('[data-sw-focus]') || layer.querySelector('button'); if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function pickStep() {
    var r = run(), cur = r && goal(r.goal), list = goals().filter(function (g) { return (!cur || g.id !== cur.id) && g.kind === 'daily'; });  // Oct 25 o: Kaizen 66 is for daily habits
    if (!list.length) { open('<h2 class="kzsw-t">No other daily habits yet</h2><p class="kzsw-p">Kaizen 66 is for daily habits. Add one, like "Read 10 pages", then you can make it your Kaizen 66.</p><div class="kzsw-acts"><a class="kzsw-btn gold" href="/pages/my-goals#add">Add a goal</a><button type="button" class="kzsw-btn ghost" data-sw="close">Close</button></div>'); return; }
    open('<h2 class="kzsw-t" id="kzsw-t">Change your Kaizen 66</h2>' +
      '<p class="kzsw-p">Pick the daily habit you\'ll do every day for 66 days.</p>' +
      (cur ? '<p class="kzsw-now">Now: <b>' + esc(cur.name) + '</b> · ' + (r.state === 'pending' ? 'starts soon' : 'day ' + r.day + ' of 66') + '</p>' : '') +
      '<div class="kzsw-list" role="list">' + list.map(function (g) {
        var t = thumb(g);
        return '<button type="button" class="kzsw-g" role="listitem" data-sw-pick="' + esc(g.id) + '"><span class="kzsw-gt">' + (t ? '<img src="' + esc(t) + '" alt="">' : '') + '</span><span class="kzsw-gb"><b>' + esc(g.name) + '</b><em>' + kindName(g) + '</em></span><i class="kzsw-chev" aria-hidden="true">›</i></button>';
      }).join('') + '</div>' +
      '<div class="kzsw-acts"><button type="button" class="kzsw-btn ghost" data-sw="close">Cancel</button></div>');
    layer.setAttribute('aria-labelledby', 'kzsw-t');
  }
  function sureStep(id) {
    var g = goal(id); if (!g) return pickStep();
    var r = run(), cur = r && goal(r.goal);
    var today = (function () { try { var d = K.get('done', {}) || {}; return !!(d[id] && d[id][K.key(K.today())]); } catch (e) { return false; } })();
    var day1 = today ? 'Day 1 is today, because you already checked it off.' : 'Day 1 is tomorrow.';
    open('<div class="kzsw-warn" aria-hidden="true">!</div><h2 class="kzsw-t" id="kzsw-t">Reset Kaizen 66 to day 0?</h2>' +
      (cur ? '<p class="kzsw-p">You\'re on <b>' + (r.state === 'pending' ? 'day 0' : 'day ' + r.day + ' of 66') + '</b> with <b>' + esc(cur.name) + '</b>. Switching to <b>' + esc(g.name) + '</b> starts your 66 days over from zero.</p>'
        : '<p class="kzsw-p"><b>' + esc(g.name) + '</b> becomes your Kaizen 66.</p>') +
      '<p class="kzsw-p dim">' + day1 + ' Your trees keep every day they\'ve grown.</p>' +
      '<div class="kzsw-acts"><button type="button" class="kzsw-btn red" data-sw-go="' + esc(id) + '">Reset and switch</button>' +
      '<button type="button" class="kzsw-btn ghost" data-sw="close" data-sw-focus>' + (cur ? 'Keep ' + esc(cur.name) : 'Cancel') + '</button></div>');
    layer.setAttribute('aria-labelledby', 'kzsw-t');
  }
  function onClick(e) {
    if (e.target === layer) { close(); return; }
    var b = e.target.closest('[data-sw], [data-sw-pick], [data-sw-go]'); if (!b) return;
    if (b.getAttribute('data-sw') === 'close') { close(); return; }
    if (b.hasAttribute('data-sw-pick')) { post({ type: 'tick' }); sureStep(b.getAttribute('data-sw-pick')); return; }
    if (b.hasAttribute('data-sw-go')) { var id = b.getAttribute('data-sw-go'); close(); setTimeout(function () { switchTo(id); if (K.toast) { var g = goal(id); K.toast(g ? g.name + ' is your Kaizen 66' : 'Switched'); } }, 120); }
  }
  document.addEventListener('keydown', function (e) { if (layer && e.key === 'Escape') close(); });
  function ask(toId) { from = document.activeElement; if (toId && goal(toId) && goal(toId).kind !== 'daily') { if (K.toast) K.toast('Kaizen 66 is for daily habits'); return; } if (toId && run() && run().goal === toId) return; if (toId) sureStep(toId); else pickStep(); }
  function attach() { if (K.k66 && !K.k66.askSwitch) { K.k66.switchTo = switchTo; K.k66.askSwitch = ask; } }  // kz66 loads after this file on some pages
  attach();

  // ---------- entry points ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-k66-switch]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); ask(b.getAttribute('data-k66-switch') || null);
  }, true);
  function inject() {
    attach();
    // Today: "Change goal" next to "Open goal" on the Kaizen 66 card
    var more = document.querySelector('#kz-today-s1 .kzf-more, .kzf-more');
    if (more && !more.querySelector('.kzsw-chg')) {
      var link = more.querySelector('.kzf-link'), row = document.createElement('div'); row.className = 'kzsw-row';
      var c = document.createElement('button'); c.type = 'button'; c.className = 'kzsw-chg'; c.setAttribute('data-k66-switch', ''); c.textContent = 'Change goal';
      if (link) { link.parentNode.insertBefore(row, link); row.appendChild(link); row.appendChild(c); } else more.appendChild(c);
    }
    // a goal's page while another goal has the run
    var gp = document.querySelector('.kz66-gp'), id = new URLSearchParams(location.search).get('id'), r = run();
    if (gp && id && r && r.goal !== id && goal(id) && goal(id).kind === 'daily' && !gp.querySelector('.kzsw-make')) {
      var m = document.createElement('button'); m.type = 'button'; m.className = 'kz66-go kzsw-make'; m.setAttribute('data-k66-switch', id); m.textContent = 'Make this my Kaizen 66';
      gp.appendChild(m);
    }
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { inject(); } catch (e) {} }); }
  function boot() { attach(); inject(); var m = document.getElementById('kz-main') || document.body; new MutationObserver(soon).observe(m, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kz:k66', 'kz:changed', 'kz:goals'].forEach(function (n) { document.addEventListener(n, soon); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzbd-1102.js ==== */
;try {
/* Nov 2 · copy of kzbd-1025zc.js; the section count is left to kzcount-1102.js */
/* Oct 25 r (from q): exact dates. "Finish by" and milestones are days (YYYY-MM-DD), not months; old month values become the
   last day of that month. Milestone rows are two lines so the sheet never scrolls sideways.
   Oct 25 q (from o): same features, faster with many goals (a goal map and the list of broken-down goals are cached per
   data change; with no broken-down goals Today, the calendar and the Grove skip all the extra work).
   Oct 25 o · "Break it down": long-term goals get a target date and milestones (James).
   - Goal sheet: for a Long-term goal the folded section is "Break it down": target month, milestones (suggested from the
     date, editable), and an optional daily habit for it (added as its own daily habit). Daily habits keep "Make it stick".
   - A long-term goal with a target date is tracked by its milestones, not by a daily check-off: on Today it shows the next
     milestone and a ring (tap opens the goal), and from the day it was broken down it no longer counts as "due" each day.
   - Goal page: the breakdown (countdown, milestones to tick, edit date, add a milestone).
   - Kaizen 66 is for daily habits only: the pickers list daily habits, the goal page / menu only offer it for daily habits,
     and if the current run is on a long-term goal Today asks once: make it a daily habit (keeps the run) or end the run.
   - Grove: a broken-down goal grows with its milestones ("2 of 5 milestones").
   Data on the goal: by 'YYYY-MM', ms [{id, t, by 'YYYY-MM', d 'YYYY-MM-DD'|''}], msFrom 'YYYY-MM-DD', habitFor (on the habit). */
(function () {
  var K = window.KZ; if (!K || K.__kzbd) return; K.__kzbd = 1;
  var de = document.documentElement;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function tk() { return K.key(K.today()); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  // a month (old) becomes the last day of that month; a day stays a day
  function nd(s) { s = String(s || ''); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; if (/^\d{4}-\d{2}$/.test(s)) { var p = s.split('-'); return ymd(new Date(+p[0], +p[1], 0)); } return ''; }
  function ym(d) { return ymd(d); }
  function ymDate(s) { s = nd(s); var p = s.split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); }
  function fmtYM(s, long) { s = nd(s); if (!s) return ''; var d = ymDate(s), y = d.getFullYear(), now = K.today(); return (long ? MONL : MON)[d.getMonth()] + ' ' + d.getDate() + (long || y !== now.getFullYear() ? ', ' + y : ''); }
  function addDaysD(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
  function monthsBetween(a, b) { return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth(); }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  var gc = { v: null, map: {}, ms: [] };
  function ver() { return K._rover ? K._rover() : Date.now(); }
  function cache() { var v = ver(); if (gc.v !== v) { var m = {}, ms = []; goals().forEach(function (g) { m[g.id] = g; if (isMs(g)) ms.push(g); }); gc = { v: v, map: m, ms: ms }; } return gc; }
  function goal(id) { return cache().map[id] || null; }
  function isMs(g) { return !!(g && g.kind !== 'daily' && g.kind !== 'quit' && nd(g.by) && Array.isArray(g.ms) && g.ms.length); }
  function prog(g) { var n = (g.ms || []).filter(function (m) { return m.d; }).length, t = (g.ms || []).length; return { n: n, t: t, frac: t ? n / t : 0, next: (g.ms || []).filter(function (m) { return !m.d; })[0] || null }; }
  function left(g) { var now = K.today(), end = ymDate(g.by); return Math.round((new Date(end.getFullYear(), end.getMonth(), end.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5); }
  function leftText(g) {
    var d = left(g); if (d < 0) return 'past ' + fmtYM(g.by); if (d === 0) return 'due today';
    return d >= 60 ? Math.round(d / 30.4) + ' months left' : d >= 14 ? Math.round(d / 7) + ' weeks left' : d + (d === 1 ? ' day' : ' days') + ' left';
  }
  function suggest(name, by) {
    var now = K.today(), end = ymDate(by), span = Math.max(1, Math.round((end - now) / 864e5)), n = span >= 270 ? 5 : span >= 120 ? 4 : span >= 45 ? 3 : 2;
    var words = n === 5 ? ['Get started', 'A quarter of the way', 'Halfway there', 'The last stretch'] : n === 4 ? ['Get started', 'Halfway there', 'The last stretch'] : n === 3 ? ['Get started', 'Halfway there'] : ['Get started'];
    var FR = { 'A quarter of the way': .25, 'Halfway there': .5, 'The last stretch': .8 };
    var out = words.map(function (w, i) { var at = i === 0 ? Math.max(3, Math.min(14, Math.round(span * .05))) : Math.round(span * (FR[w] || i / n)); return { id: 'm' + i + Date.now().toString(36), t: w, by: ymd(addDaysD(now, Math.max(1, at))), d: '' }; });
    out.push({ id: 'mz' + Date.now().toString(36), t: String(name || 'Done').slice(0, 90), by: nd(by), d: '' });
    return out;
  }
  function saveG(id, patch) {
    var all = K.get('goals', []) || [], hit = false;
    all = all.map(function (g) { if (g.id !== id) return g; hit = true; for (var k in patch) g[k] = patch[k]; return g; }); if (hit) K.set('goals', all);
    ['kz:goals', 'kz:changed'].forEach(function (n) { try { document.dispatchEvent(new CustomEvent(n)); } catch (e) {} });
    return hit;
  }
  K.bd = { isMs: isMs, prog: prog, left: left, leftText: leftText, fmtYM: fmtYM, suggest: suggest,
    toggle: function (gid, mid) { var g = goal(gid); if (!g) return; var ms = (g.ms || []).map(function (m) { if (m.id === mid) m.d = m.d ? '' : tk(); return m; }); saveG(gid, { ms: ms }); post({ type: 'haptic', n: 1 }); } };

  // ---------- 1 · the goal sheet: "Break it down" for long-term goals ----------
  var pending = null;
  function sheetKind(sh) { var b = sh.querySelector('[data-kind][aria-checked="true"]'); return b ? b.getAttribute('data-kind') : 'long'; }
  var lastEdit = null;
  function wrapSheetOpen() {
    if (!K.goalSheet || !K.goalSheet.open || K.goalSheet.open.__bd) return;
    var op = K.goalSheet.open, w = function (o) { lastEdit = o && o.mode === 'edit' ? o.id : null; document.querySelectorAll('.kz-goalsheet').forEach(function (sh) { sh.__bdFor = 0; }); var r = op.apply(this, arguments); setTimeout(sheets, 0); return r; };
    w.__bd = 1; K.goalSheet.open = w;
  }
  function editingGoal(sh) { return sh.classList.contains('kz-goalsheet') && lastEdit ? goal(lastEdit) : null; }
  function paintMs(box, ms) {
    var list = box.querySelector('.kzbd-ms');
    list.innerHTML = ms.map(function (m, i) {
      return '<div class="kzbd-mr" data-i="' + i + '"><span class="kzbd-mn">' + (i + 1) + '</span><input class="kzbd-mt" maxlength="90" value="' + esc(m.t) + '" aria-label="Milestone ' + (i + 1) + '">' +
        '<input class="kzbd-mb" type="date" value="' + esc(nd(m.by)) + '" aria-label="Milestone ' + (i + 1) + ' date"><button type="button" class="kzbd-mx" data-bd-del="' + i + '" aria-label="Remove milestone ' + (i + 1) + '">×</button></div>';
    }).join('');
  }
  function readMs(box) {
    return Array.prototype.map.call(box.querySelectorAll('.kzbd-mr'), function (r, i) { var o = (box.__ms || [])[i] || {}; return { id: o.id || 'm' + i + Date.now().toString(36), t: r.querySelector('.kzbd-mt').value.trim().slice(0, 90), by: r.querySelector('.kzbd-mb').value || '', d: o.d || '' }; }).filter(function (m) { return m.t; });
  }
  function ensureBox(sh) {
    var form = sh.querySelector('form'); if (!form) return null;
    var box = form.querySelector('.kzbd'); if (box) return box;
    var more = form.querySelector('.kz-morebtn'); if (!more) return null;
    box = document.createElement('div'); box.className = 'kzbd';
    box.innerHTML = '<button type="button" class="kz-morebtn kzbd-btn" aria-expanded="false"><span>Break it down <i class="kz-opt">(optional)</i></span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<div class="kzbd-in" hidden>' +
        '<label class="kz-field49"><span class="kz-label49">Finish by</span><input class="kzbd-by" type="date" aria-label="Finish by"><small class="kz-hint49">The day you want it done. Kaizen suggests milestones on the way; change any of them.</small></label>' +
        '<div class="kz-field49"><span class="kz-label49">Milestones</span><div class="kzbd-ms"></div><button type="button" class="kzbd-add">+ Add a milestone</button></div>' +
        '<label class="kz-field49"><span class="kz-label49">Daily habit for it <i class="kz-opt">(optional)</i></span><input class="kzbd-habit" maxlength="90" placeholder="Train for 30 minutes" autocomplete="off"><small class="kz-hint49">Added as its own daily habit. Daily habits can be your Kaizen 66.</small></label>' +
      '</div>';
    more.parentNode.insertBefore(box, more);
    var btn = box.querySelector('.kzbd-btn'), inn = box.querySelector('.kzbd-in'), by = box.querySelector('.kzbd-by');
    btn.addEventListener('click', function () { var on = btn.getAttribute('aria-expanded') !== 'true'; btn.setAttribute('aria-expanded', String(on)); inn.hidden = !on; if (on && !by.value) { by.value = ymd(addDaysD(K.today(), 182)); regen(); } });
    function regen() { var nm = form.querySelector('input[maxlength="90"]'); box.__ms = suggest(nm ? nm.value.trim() : '', by.value); paintMs(box, box.__ms); }
    by.addEventListener('change', function () { var cur = readMs(box); if (!cur.length || box.__auto !== false) regen(); else { cur[cur.length - 1].by = by.value; box.__ms = cur; paintMs(box, cur); } });
    box.addEventListener('input', function (e) { if (e.target.classList.contains('kzbd-mt') || e.target.classList.contains('kzbd-mb')) box.__auto = false; });
    box.addEventListener('click', function (e) {
      var d = e.target.closest('[data-bd-del]'); if (d) { var cur = readMs(box); cur.splice(+d.getAttribute('data-bd-del'), 1); box.__ms = cur; box.__auto = false; paintMs(box, cur); return; }
      if (e.target.closest('.kzbd-add')) { var c2 = readMs(box); c2.splice(Math.max(0, c2.length - 1), 0, { id: 'm' + Date.now().toString(36), t: '', by: by.value, d: '' }); box.__ms = c2; box.__auto = false; paintMs(box, c2); var ins = box.querySelectorAll('.kzbd-mt'); var tgt = ins[Math.max(0, c2.length - 2)]; if (tgt) tgt.focus(); }
    });
    // capture the breakdown right before the sheet's own submit handler adds or saves the goal
    form.addEventListener('submit', function () {
      var k = sheetKind(sh); if (k !== 'long' || !by.value) { pending = null; return; }
      var ms = readMs(box); if (!ms.length) ms = suggest((form.querySelector('input[maxlength="90"]') || {}).value, by.value);
      pending = { by: by.value, ms: ms, habit: box.querySelector('.kzbd-habit').value.trim(), at: Date.now() };
    }, true);
    return box;
  }
  function paintSheet(sh) {
    var box = ensureBox(sh); if (!box) return;
    var long = sheetKind(sh) === 'long', form = sh.querySelector('form');
    if (box.hidden !== !long) box.hidden = !long; if (sh.classList.contains('kzbd-long') !== long) sh.classList.toggle('kzbd-long', long);   // zc: only write on change (a same-value write still counts as a change and re-ran this 60x a second)
    // "Make it stick" (when, bad-day version, the old daily step) stays for daily habits only
    var more = form.querySelector('.kz-morebtn:not(.kzbd-btn)'), mbox = more && document.getElementById(more.getAttribute('aria-controls'));
    if (more && more.hidden !== long) more.hidden = long; if (mbox && long && !mbox.hidden) mbox.hidden = true;
    if (!sh.__bdFor && !sh.hidden) {
      sh.__bdFor = 1; var g = editingGoal(sh), by = box.querySelector('.kzbd-by'), btn = box.querySelector('.kzbd-btn'), inn = box.querySelector('.kzbd-in');
      if (g && isMs(g)) { by.value = nd(g.by); box.__ms = g.ms.map(function (m) { var o = {}; for (var k in m) o[k] = m[k]; o.by = nd(m.by); return o; }); box.__auto = false; paintMs(box, box.__ms); btn.setAttribute('aria-expanded', 'true'); inn.hidden = false; }
      else { by.value = ''; box.__ms = []; box.__auto = true; paintMs(box, []); btn.setAttribute('aria-expanded', 'false'); inn.hidden = true; box.querySelector('.kzbd-habit').value = ''; }
    }
    if (sh.hidden) sh.__bdFor = 0;
  }
  function wrapGoalWrites() {
    if (K.addGoal && !K.addGoal.__bd) {
      var add = K.addGoal, w = function (o) {
        var id = add.apply(this, arguments), p = pending; pending = null;
        if (p && o && o.kind !== 'daily' && Date.now() - p.at < 5000) {
          saveG(id, { by: p.by, ms: p.ms, msFrom: tk(), step: '' });
          if (p.habit) { var hid = add({ name: p.habit, kind: 'daily', path: o.path }); saveG(hid, { habitFor: id }); }
        }
        return id;
      }; w.__bd = 1; K.addGoal = w;
    }
    if (K.updateGoal && !K.updateGoal.__bd) {
      var up = K.updateGoal, u = function (id, o) {
        var r = up.apply(this, arguments), p = pending; pending = null;
        if (p && o && o.kind !== 'daily' && Date.now() - p.at < 5000) {
          var g = goal(id) || {}; saveG(id, { by: p.by, ms: p.ms, msFrom: g.msFrom || tk() });
          if (p.habit && K.addGoal) { var hid = K.addGoal({ name: p.habit, kind: 'daily', path: g.path }); saveG(hid, { habitFor: id }); }
        }
        return r;
      }; u.__bd = 1; K.updateGoal = u;
    }
  }
  wrapGoalWrites();

  // ---------- 2 · a broken-down goal isn't "due" every day from the day it was broken down ----------
  function wrapDayInfo(fn) {
    if (!fn || fn.__bd) return fn;
    var w = function (k) {
      var r = fn.apply(this, arguments); if (!r || r.status === 'future' || !cache().ms.length) return r;
      try {
        var ex = cache().ms.filter(function (g) { return g.msFrom && k >= g.msFrom && !(r.hit || []).some(function (h) { return h.id === g.id; }) && (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); }).length;
        if (ex) { var due = Math.max(0, r.due - ex); r.due = due; if (r.hit && r.hit.length) { r.rate = Math.min(1, r.hit.length / Math.max(due, r.hit.length)); if (r.rate >= 1) r.status = 'full'; } }
      } catch (e) {}
      return r;
    };
    w.__bd = 1; return w;
  }
  (function () { var cur = wrapDayInfo(K.dayInfo); try { Object.defineProperty(K, 'dayInfo', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrapDayInfo(v); } }); } catch (e) {} })();

  // ---------- 3 · grove: a broken-down goal grows with its milestones ----------
  function wrapGrow(fn) {
    if (!fn || fn.__bd) return fn;
    var w = function (gid) {
      var r = fn.apply(this, arguments), g = goal(gid); if (!r || !isMs(g)) return r;
      try {
        var p = prog(g); r.msN = p.n; r.msT = p.t;
        // the tree grows with the milestones: all done = a full tree (the same picture as day 66)
        var eq = Math.max(r.day || 0, Math.round(p.frac * 66)), VIS = [[0, 'seed', .26], [1, 'sd1', .34], [3, 'sd2', .40], [5, 'sd3', .45], [7, 'sd4', .50], [14, 's1', .58], [21, 's2', .64], [30, 's3', .71], [45, 's4', .78], [66, 's5', .86]], v = VIS[0];
        for (var i = 0; i < VIS.length; i++) if (eq >= VIS[i][0]) v = VIS[i];
        r.key = v[1]; r.scale = v[2]; r.frac = p.frac; if (p.t > 0 && p.n === p.t) r.stage = 'Goal reached';  // not "habit earned": that's for habits
      } catch (e) {}
      return r;
    }; w.__bd = 1; return w;
  }
  function wrapLabel(fn) {
    if (!fn || fn.__bd) return fn;
    var w = function (gid) {
      var r = fn.apply(this, arguments), g = goal(gid); if (!r || !isMs(g)) return r;
      var p = prog(g), t = p.n + ' of ' + p.t + ' milestones';
      r.run = false; r.short = (p.n === p.t ? '★ ' : '') + t; r.text = t; r.aria = t + ', finish by ' + fmtYM(g.by, true); r.frac = p.frac; r.left = Math.max(0, left(g)); r.ms = true;
      return r;
    }; w.__bd = 1; return w;
  }
  ['grow', 'dayLabel'].forEach(function (name) {
    var wrap = name === 'grow' ? wrapGrow : wrapLabel, cur = wrap(K[name]);
    try { Object.defineProperty(K, name, { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrap(v); } }); } catch (e) {}
  });

  // ---------- 4 · Today: milestone rows instead of a daily check ----------
  function ring(p) { var c = 2 * Math.PI * 15, off = c * (1 - p.frac); return '<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="t"/><circle cx="18" cy="18" r="15" class="f" style="stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + off.toFixed(1) + '"/></svg><b>' + p.n + '/' + p.t + '</b>'; }
  function today() {
    var host = document.querySelector('#kz-today-s1 .kz-tgroups'); if (!host) return;
    if (!cache().ms.length && !host.querySelector('.kzbd-row')) return;
    Array.prototype.forEach.call(host.querySelectorAll('.kz-goal[data-goal]'), function (row) {
      var g = goal(row.getAttribute('data-goal')), ms = isMs(g); row.classList.toggle('kzbd-row', ms);
      var r = row.querySelector('.kzbd-ring'), sub = row.querySelector('.kzbd-sub');
      if (!ms) { if (r) r.remove(); if (sub) sub.remove(); return; }
      var p = prog(g), sig = p.n + '/' + p.t + '/' + g.by + '/' + (p.next ? p.next.t : '');
      if (!r) { r = document.createElement('a'); r.className = 'kzbd-ring'; var ck = row.querySelector('.kz-check'); (ck ? ck.parentNode : row).insertBefore(r, ck || null); }
      r.href = '/pages/goal?id=' + encodeURIComponent(g.id); r.setAttribute('aria-label', esc(g.name) + ': ' + p.n + ' of ' + p.t + ' milestones, finish by ' + fmtYM(g.by, true) + '. Open goal');
      if (r.__s !== sig) { r.__s = sig; r.innerHTML = ring(p); }
      var body = row.querySelector('.kz-gbody'), st = row.querySelector('.kz-gstep');
      if (!sub) { sub = document.createElement('span'); sub.className = 'kzbd-sub'; if (st) st.parentNode.insertBefore(sub, st.nextSibling); else if (body) body.appendChild(sub); }
      var txt = (p.next ? 'Next: ' + p.next.t + (p.next.by ? ' · ' + fmtYM(p.next.by) : '') : '★ Every milestone done') + ' · ' + leftText(g);
      if (sub.textContent !== txt) sub.textContent = txt;
    });
    // section counts only count what can be checked off today
    Array.prototype.forEach.call(host.querySelectorAll('.kz-gsec'), function (sec) {
      var n = sec.querySelector('.kz-tsec-n'); if (!n) return;
      var rows = sec.querySelectorAll('.kz-goal[data-goal]:not(.kzbd-row):not(.kzf-is66)'), dn = 0;
      Array.prototype.forEach.call(rows, function (rw) { var b = rw.querySelector('.kz-check'); if (b && b.getAttribute('aria-pressed') === 'true') dn++; });
      var want = rows.length ? dn + ' of ' + rows.length : '';
      // Nov 2: kzcount-1102.js owns the section counts now (it also counts what moved to Done today)
    });
  }

  // ---------- 5 · the goal page: the breakdown ----------
  function goalPage() {
    var page = document.getElementById('kz-goalpage'); if (!page) return;
    var id = new URLSearchParams(location.search).get('id'), g = goal(id); if (!g) return;
    page.classList.toggle('kzbd-msgoal', isMs(g));
    var box = page.querySelector('.kzbd-gp');
    if (g.kind === 'daily') { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('section'); box.className = 'kzbd-gp'; box.setAttribute('aria-label', 'Break it down'); var a = page.querySelector('.kzg-goal') || page.querySelector('.kz-g1stats'); if (a && a.parentNode) a.parentNode.insertBefore(box, a); else page.appendChild(box); }
    var h;
    if (!isMs(g)) {
      h = '<h3>Break it down</h3><p class="kzbd-gpp">Pick the month you want <b>' + esc(g.name) + '</b> done by, and Kaizen breaks it into milestones.</p><button type="button" class="kzbd-gbtn" data-bd-start>Set a finish date</button>';
    } else {
      var p = prog(g);
      h = '<div class="kzbd-gh"><h3>Break it down</h3><span>' + p.n + ' of ' + p.t + '</span></div>' +
        '<div class="kzbd-gd"><b>' + esc(fmtYM(g.by, true)) + '</b><em>' + esc(leftText(g)) + '</em></div>' +
        '<span class="kzbd-bar"><i style="width:' + Math.round(p.frac * 100) + '%"></i></span>' +
        '<div class="kzbd-gl">' + g.ms.map(function (m) {
          return '<button type="button" class="kzbd-gm' + (m.d ? ' on' : '') + (p.next && p.next.id === m.id ? ' next' : '') + '" data-bd-tog="' + esc(m.id) + '" aria-pressed="' + !!m.d + '"><i aria-hidden="true"></i><span><b>' + esc(m.t) + '</b><em>' + (m.d ? 'Done ' + esc(m.d.slice(5).replace('-', '/')) : m.by ? 'By ' + esc(fmtYM(m.by)) : '') + '</em></span></button>';
        }).join('') + '</div>' +
        '<button type="button" class="kzbd-glink" data-bd-edit>Edit the breakdown</button>';
    }
    if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-bd-tog], [data-bd-start], [data-bd-edit]'); if (!t) return;
    var id = new URLSearchParams(location.search).get('id');
    if (t.hasAttribute('data-bd-tog')) { K.bd.toggle(id, t.getAttribute('data-bd-tog')); setTimeout(run, 0); return; }
    // open the goal's edit sheet with "Break it down" unfolded
    var g = goal(id); if (!g) return;
    if (K.goalSheet && K.goalSheet.open) { K.goalSheet.open({ mode: 'edit', id: id }); }
    else { var ed = document.querySelector('[data-kz-edit]'); if (ed) ed.click(); }
    setTimeout(function () { var sh = document.querySelector('.kz-goalsheet:not([hidden]), .kz-addsheet:not([hidden])'); if (!sh) return; var b = sh.querySelector('.kzbd-btn'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }, 250);
  });

  // ---------- 6 · Kaizen 66 is for daily habits ----------
  function k66Daily() {
    // kz66's picker: only daily habits
    var sh = document.querySelector('.kz66-sheet');
    if (sh && !sh.__bd) {
      sh.__bd = 1;
      var rows = sh.querySelectorAll('[data-k66-pick]'), keep = 0, sel = null;
      Array.prototype.forEach.call(rows, function (b) { var g = goal(b.getAttribute('data-k66-pick')); if (!g || g.kind !== 'daily') b.remove(); else { keep++; if (b.classList.contains('sel')) sel = b; } });
      var list = sh.querySelector('.kz66-list');
      if (!keep && list) { list.innerHTML = '<p class="kzbd-none">Kaizen 66 is for daily habits. Add a daily habit first, like "Read 10 pages" or "Walk 20 minutes".</p><a class="kz66-go kzbd-addh" href="/pages/my-goals#add">Add a daily habit</a>'; var go = sh.querySelector('[data-k66="start"]'); if (go) go.hidden = true; }
      else if (!sel) { var first = sh.querySelector('[data-k66-pick]'); if (first) first.click(); }
      var cap = sh.querySelector('.kz66-cap'); if (cap && keep) cap.textContent = 'Pick a daily habit';
    }
    // goal page: no "Start Kaizen 66" on a long-term goal
    var gp = document.querySelector('.kz66-gp'), id = new URLSearchParams(location.search).get('id'), g = id && goal(id);
    if (gp) gp.classList.toggle('kzbd-long', !!(g && g.kind !== 'daily' && !(run66() && run66().goal === id)));
    if (gp && g && g.kind !== 'daily') {
      Array.prototype.forEach.call(gp.querySelectorAll('[data-k66-open], .kzsw-make'), function (b) { b.remove(); });
      if (!gp.querySelector('.kzbd-k66n') && !(run66() && run66().goal === id)) { var p = document.createElement('p'); p.className = 'kz66-st kzbd-k66n'; p.innerHTML = '<span>Kaizen 66 is for daily habits. Give this goal a daily habit in “Break it down”, then use that.</span>'; gp.appendChild(p); }
    }
  }
  function run66() { try { var s = K.k66 && K.k66.state(), r = s && s.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  var migrated = false;
  function migrate() {
    if (migrated) return; migrated = true;
    var all = K.get('goals', []) || [], ch = false;
    all.forEach(function (g) { if (/^\d{4}-\d{2}$/.test(g.by || '')) { g.by = nd(g.by); ch = true; } (g.ms || []).forEach(function (m) { if (/^\d{4}-\d{2}$/.test(m.by || '')) { m.by = nd(m.by); ch = true; } }); });
    if (ch) K.set('goals', all);
  }
  var run = function () { try { migrate(); } catch (e) {} try { wrapGoalWrites(); wrapSheetOpen(); } catch (e) {} try { today(); } catch (e) {} try { goalPage(); } catch (e) {} try { k66Daily(); } catch (e) {} try { convertAsk(); } catch (e) {} try { sheets(); } catch (e) {} };
  function sheets() { Array.prototype.forEach.call(document.querySelectorAll('.kz-goalsheet, .kz-addsheet'), function (sh) { if (sh.querySelector('[data-kind]')) paintSheet(sh); }); }
  // the current run is on a long-term goal: ask once a day until it's settled
  function convertAsk() {
    if (!document.getElementById('kz-today-s1')) return;
    var r = run66(), g = r && goal(r.goal); if (!g || g.kind === 'daily') return;
    var seen = {}; try { seen = JSON.parse(sessionStorage.getItem('kzbd_conv') || '{}'); } catch (e) {}
    if (seen[g.id] === tk() || document.querySelector('.kzbd-conv') || document.querySelector('.kzsw-back, .kz66-over, .kz-qcard.in')) return;
    seen[g.id] = tk(); try { sessionStorage.setItem('kzbd_conv', JSON.stringify(seen)); } catch (e) {}
    var o = document.createElement('div'); o.className = 'kzsw-back kzbd-conv'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'kzbd-ct');
    o.innerHTML = '<div class="kzsw"><i class="kzsw-grab" aria-hidden="true"></i><h2 class="kzsw-t" id="kzbd-ct">Kaizen 66 is for daily habits now</h2>' +
      '<p class="kzsw-p">Your run is on <b>' + esc(g.name) + '</b> (day ' + (r.day || 0) + '), which is a long-term goal. A 66-day streak needs something you do every day.</p>' +
      '<p class="kzsw-p dim">Make it a daily habit and your run keeps going. Or end the run and start one on a daily habit.</p>' +
      '<div class="kzsw-acts"><button type="button" class="kzsw-btn gold" data-cv="keep">Make it a daily habit</button><button type="button" class="kzsw-btn ghost" data-cv="end">End the run</button><button type="button" class="kzsw-btn ghost" data-cv="later">Decide later</button></div></div>';
    document.body.appendChild(o); post({ type: 'pageScroll', on: false }); requestAnimationFrame(function () { o.classList.add('on'); });
    var done = function () { o.classList.remove('on'); post({ type: 'pageScroll', on: true }); setTimeout(function () { o.remove(); }, 280); };
    o.addEventListener('click', function (e) {
      if (e.target === o) { done(); return; }
      var b = e.target.closest('[data-cv]'); if (!b) return; var a = b.getAttribute('data-cv');
      if (a === 'keep') { saveG(g.id, { kind: 'daily', by: '', ms: [], msFrom: '' }); if (K.toast) K.toast(g.name + ' is a daily habit'); }
      if (a === 'end') {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tap again to end the run'; b.classList.add('red'); return; }
        var s = K.get('k66', null) || {}; s.runs = s.runs || []; if (s.run) s.runs.push({ goal: s.run.goal, start: s.run.start, end: tk(), days: r.todayDone ? r.day : Math.max(0, (r.day || 1) - 1), shields: r.used || 0, won: 0, quit: 1 }); s.run = null; s.pending = null; K.set('k66', s);
        try { document.dispatchEvent(new CustomEvent('kz:k66')); document.dispatchEvent(new CustomEvent('kz:changed')); } catch (er) {}
      }
      done();
    });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; run(); }); }
  function boot() {
    run();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzbd, .kzbd-gp, .kzbd-ring, .kzbd-sub')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-checked', 'aria-pressed'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kz:goals', 'kz:changed', 'kz:k66', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzrough-1030.js ==== */
;try {
/* Oct 30 · replaces kztoday-1029.js (same code, its own load flag). */
/* Oct 29 · James: today said "Rough day" in red on Progress at 3:48 PM. A day isn't rough until it's over, so today is never
   a setback: K.dayInfo reports 'today' for it instead (calendar cell stays neutral with its outline, the day card says
   "In progress"). Green (over half) and gold (every goal) still show today. Past days are unchanged. Wraps K.dayInfo on
   top of kzfix-1023q's wrapper, and keeps wrapping when a page assigns its own copy later. */
(function () {
  var K = window.KZ; if (!K || K.__kzrough) return; K.__kzrough = 1;   /* Oct 30: own flag. kztoday-1029 used K.__kztoday, the same flag as kztoday-1027b, which then never ran (Lock in my plan floated again, plan tap, milestone alignment) */
  var mine = function (f) {
    if (typeof f !== 'function' || f.__kzt) return f;
    var g = function (k) { var r = f.apply(this, arguments); try { if (r && r.status === 'setback' && k === K.key(K.today())) r.status = 'today'; } catch (e) {} return r; };
    g.__kzt = 1; return g;
  };
  var d = Object.getOwnPropertyDescriptor(K, 'dayInfo');
  try {
    if (d && d.get && d.set) { var cur = mine(d.get()); Object.defineProperty(K, 'dayInfo', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { d.set(v); cur = mine(d.get()); } }); }
    else { var c2 = mine(K.dayInfo); Object.defineProperty(K, 'dayInfo', { configurable: true, enumerable: true, get: function () { return c2; }, set: function (v) { c2 = mine(v); } }); }
  } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztap-1028.js ==== */
;try {
/* Oct 28 (kztap-1028, replaces kztap-1027): every pop-up hides the tab bar, Today's notes sheet included; a pop-up that
   opens over another re-sends the hide; showing a screen again re-sends its current state.
   Oct 27 (kztap-1027, replaces kztap-1025s): leaves/undo chip/toasts no longer re-run the overlay check; the leaf observer only works while a float exists.
   Oct 25 s (from p): the overlay check no longer runs a page-wide search after every class change (tapping a check
   toggles dozens of classes; that search was most of the delay when tapping a box quickly on and off). It runs only
   when something was added to / removed from the page, or an element that can be an overlay changed.
   Oct 25 p · Every button: the right thing on top, one scroll lock, no stuck states (James: "it only lets me add a habit
   after I exit out of that screen").
   1. Overlay manager. Every sheet, menu, full-screen moment and confirm in the app is watched here. Whatever opened last is
      on top (z-index by open order, not by whichever number each file picked). While anything is open the page behind
      can't scroll; when the last one closes the page scrolls again and the tab bar comes back. Escape closes the top one.
   2. Buttons do things, links go places. A link to "add a goal" pressed inside an overlay (the Kaizen 66 picker's "Add a
      daily habit", the Change goal sheet's "Add a goal") no longer opens the add sheet *underneath*: the overlay closes, the
      add sheet opens straight away with Daily habit picked, and after you save you're back in the Kaizen 66 picker with
      the new habit selected.
   Old files aren't edited; this file wraps them. */
(function () {
  var K = window.KZ; if (!K || K.__kztap) return; K.__kztap = 's';   // 1027: same guard (replaces kztap-1025s on every page)
  var de = document.documentElement;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  // what counts as an overlay, and how to close each one
  var OV = [
    { sel: '.kz66-over.on', close: '[data-k66="close"]' },
    { sel: '.kzsw-back.on', close: '[data-sw="close"], [data-cv="later"]' },
    { sel: '.kzm-back', close: null },
    { sel: '.kz-sheet49:not([hidden])', close: '[data-gx="close"], [data-t="close"], .kz-iconbtn[aria-label="Close"]' },
    { sel: '.kzg-over', close: '[data-kzg-done]' },
    { sel: '.kzg-why', close: '[data-kzg-x]' },
    { sel: '.kz-qmodal:not([hidden])', close: '.kz-iconbtn[aria-label="Close"]' },
    { sel: '.kzf-qsheet.on, .kzf-qs', close: '[data-q="close"], .kzf-qx, .kzf-qs-x' },   // Oct 28: Today's notes sheet has no .on class (it never hid the tab bar there)
    { sel: 'body > .kz-p3, body > .kz-p4, body > .kz-setup, #kz-reveal:not([hidden])', close: null }
  ];
  var ALL = OV.map(function (o) { return o.sel; }).join(',');
  var seq = 0, open = [], locked = false;
  function visible(el) { if (!el || !el.isConnected) return false; var cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden'; }
  function scan() {
    var now = Array.prototype.filter.call(document.querySelectorAll(ALL), function (el) { return el !== de && el !== document.body && visible(el); });  // html/body carry mode classes like kz-p4: never overlays
    var grew = false;
    now.forEach(function (el) { if (open.indexOf(el) < 0) { open.push(el); grew = true; el.__kzz = ++seq; el.style.setProperty('z-index', String(9000 + Math.min(seq, 900)), 'important'); } });
    open = open.filter(function (el) { return now.indexOf(el) >= 0; });
    var any = open.length > 0;
    if (any !== locked) {
      locked = any; de.classList.toggle('kz-layer-open', any);
      if (!any) { document.body.classList.remove('kz-noscroll'); post({ type: 'pageScroll', on: true }); }
      else post({ type: 'pageScroll', on: false });
    } else if (any && grew) post({ type: 'pageScroll', on: false });   // Oct 28: every new pop-up re-asks the app to hide the tab bar (one opened over another never did)
  }
  function top() { return open.slice().sort(function (a, b) { return (b.__kzz || 0) - (a.__kzz || 0); })[0] || null; }
  function closeEl(el) {
    if (!el) return false;
    for (var i = 0; i < OV.length; i++) {
      if (!el.matches(OV[i].sel)) continue;
      var c = OV[i].close && el.querySelector(OV[i].close);
      if (c) { c.click(); return true; }
      if (el.classList.contains('kzm-back')) { el.click(); return true; }
      el.click(); return true;   // the backdrop closes most of them
    }
    return false;
  }
  K.layer = { top: top, close: function () { return closeEl(top()); }, closeAll: function () { var n = 0; while (open.length && n++ < 6) { if (!closeEl(top())) break; scan(); } } };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open.length) { e.preventDefault(); closeEl(top()); } });

  // ---------- 2 · "add a habit" from inside an overlay ----------
  var backToK66 = 0;
  function openAddDaily() {
    if (document.getElementById('kz-today-s1') && K.openAdd) K.openAdd({ kind: 'daily' });
    else if (K.goalSheet && K.goalSheet.open) K.goalSheet.open({ mode: 'add', kind: 'daily' });
    else location.href = '/pages/my-goals#add';
  }
  // on window, capture: runs before kzgs-1023d's own #add link handler (document, capture), which opened the sheet underneath
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="my-goals#add"]'); if (!a) return;
    var ov = a.closest(ALL); if (!ov) return;
    e.preventDefault(); e.stopImmediatePropagation();
    backToK66 = ov.matches('.kz66-over, .kzsw-back') ? Date.now() : 0;
    post({ type: 'tick' });
    // outside this click's dispatch: close the overlay first, then open the add sheet on top of the page
    setTimeout(function () { closeEl(ov); setTimeout(function () { scan(); openAddDaily(); }, 90); }, 0);
  }, true);
  function wrapAdd() {
    if (!K.addGoal || K.addGoal.__tap) return;
    var add = K.addGoal, w = function (o) {
      var id = add.apply(this, arguments);
      if (backToK66 && Date.now() - backToK66 < 180000 && o && o.kind === 'daily') {
        backToK66 = 0;
        setTimeout(function () {
          scan(); if (open.length) K.layer.closeAll();
          var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-k66-open', id); document.body.appendChild(b); b.click(); b.remove();
        }, 320);
      }
      return id;
    }; w.__tap = 1; K.addGoal = w;
  }

  // ---------- 3 · no retired words in the little feedback after a tap ----------
  // The check-off float said "+0.3 in · Your tree grew" and some toasts said "+10 XP": inches and XP are gone.
  var RETIRED = /\b\d+\s*XP\b|\bXP\b|\bwater\b|\binch(es)?\b|\d\s*in\s*·/i;
  function wrapToast(fn) { if (!fn || fn.__tap) return fn; var w = function (m) { if (RETIRED.test(String(m))) return; return fn.apply(this, arguments); }; w.__tap = 1; return w; }
  (function () { var cur = wrapToast(K.toast); try { Object.defineProperty(K, 'toast', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrapToast(v); } }); } catch (e) {} })();
  function floats() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-gfloat'), function (f) {
      var t = f.textContent || ''; if (!t || !RETIRED.test(t)) return;
      var nt = /grew|grown|\bin\b/i.test(t) ? '+1 day grown' : ''; if (f.textContent !== nt) f.textContent = nt;
    });
  }

  // ---------- 4 · an Add button with nothing typed: say so instead of doing nothing ----------
  document.addEventListener('click', function (e) {
    var go = e.target.closest && e.target.closest('.kz-qadd-go'); if (!go) return;
    var f = go.closest('form'), inp = f && f.querySelector('input[data-p="qtxt"], input[type="text"], input:not([type])');
    if (inp && !inp.value.trim()) { e.preventDefault(); inp.focus(); f.classList.remove('kzt-shake'); void f.offsetWidth; f.classList.add('kzt-shake'); post({ type: 'tick' }); }
  }, true);

  // ---------- 5 · update a list in place: only rows that changed are replaced (no whole-list redraw after a tap) ----------
  K.morphList = function (el, html) {
    if (!el) return;
    var t = document.createElement('template'); t.innerHTML = html;   // goes through the safety net (kzsafe)
    var next = Array.prototype.slice.call(t.content.children), cur = Array.prototype.slice.call(el.children);
    var key = function (n) { return n.getAttribute && (n.getAttribute('data-goal') || n.getAttribute('data-id') || n.getAttribute('data-todo')) || ''; };
    if (next.length !== cur.length || next.some(function (n, i) { return key(n) !== key(cur[i]); })) { el.innerHTML = html; return; }
    next.forEach(function (n, i) { if (n.outerHTML !== cur[i].outerHTML) el.replaceChild(n, cur[i]); });
  };

  // ---------- 6 · speed: K.k66.state() and K.grow(id) are computed once per data change, not once per tree/row ----------
  // (the Grove with 400 goals called them thousands of times per paint). The cache key changes on every storage write,
  // on a storage event from another tab, and at midnight, so a stale answer is never served.
  var ext = 0; window.addEventListener('storage', function () { ext++; });
  function ver() { return (K._rover ? K._rover() : Date.now()) + ':' + ext + ':' + K.key(K.today()); }
  function memoState() {
    if (!K.k66 || !K.k66.state || K.k66.state.__memo) return;
    var f = K.k66.state, v = null, val = null, w = function () { var x = ver(); if (x !== v) { v = x; val = f.apply(this, arguments); } return val; }; w.__memo = 1; K.k66.state = w;
  }
  function wrapGrowMemo(fn) {
    if (!fn || fn.__memo) return fn;
    var v = null, m = {}, w = function (gid) { var x = ver(); if (x !== v) { v = x; m = {}; } if (!(gid in m)) m[gid] = fn.apply(this, arguments); var r = m[gid]; return r && typeof r === 'object' ? Object.assign({}, r) : r; };
    w.__memo = 1; return w;
  }
  // chains onto any wrapper already on K.grow (kzbd's milestone growth), whichever file sets K.grow later
  (function () {
    var prev = Object.getOwnPropertyDescriptor(K, 'grow'), raw = prev && !prev.get ? prev.value : undefined, lastF = null, memoF = null;
    var getF = function () { return prev && prev.get ? prev.get.call(K) : raw; };
    try { Object.defineProperty(K, 'grow', { configurable: true, enumerable: true,
      get: function () { var f = getF(); if (f !== lastF) { lastF = f; memoF = wrapGrowMemo(f); } return memoF; },
      set: function (v) { if (prev && prev.set) prev.set.call(K, v); else raw = v; } }); } catch (e) {}
  })();

  // ---------- watch ----------
  // the stacking is fixed in the same microtask the overlay appears in (before the next frame is painted)
  var OVQ = /kz66-over|kzsw-back|kzm-back|kz-sheet49|kzg-over|kzg-why|kz-qmodal|kzf-qsheet|kzf-qs\b|kz-p3|kz-p4|kz-setup|kz-reveal|kzn-sheet/;
  function relevant(muts) {
    if (!muts) return true;
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'childList') {   // 1027: falling leaves, the undo chip and toasts added to <body> on every check-off are not overlays
        var ov = function (n) { return n.nodeType === 1 && (OVQ.test(typeof n.className === 'string' ? n.className : '') || n.id === 'kz-reveal' || open.indexOf(n) >= 0 || (n.querySelector && n.querySelector('.kz-sheet49, .kz66-over, .kzsw-back, .kzm-back'))); };
        if (Array.prototype.some.call(m.addedNodes, ov) || Array.prototype.some.call(m.removedNodes, ov)) return true; continue; }
      var t = m.target; if (t === de || t === document.body) continue;
      if (OVQ.test(typeof t.className === 'string' ? t.className : '') || t.id === 'kz-reveal' || open.indexOf(t) >= 0) return true;
    }
    return false;
  }
  // Oct 27 (1027): the overlay check ran synchronously inside the observer, once per batch of changes, and it reads styles
  // (getComputedStyle), so a check-off on Today (hundreds of small changes while the row glides) forced the browser to
  // recompute the page's styles over and over: ~0.45 s of observer work and ~0.6 s of style work per tap on a slow phone.
  // Now every change only marks "look again" and the check runs once, in the next frame, still before that frame is
  // painted, so a sheet is stacked before you ever see it. The cheap list check (relevant) also only runs until a scan is due.
  // (revised) An overlay that really appeared or changed is still stacked at once, in the same moment it appears. What
  // changed is that the falling leaves, the undo chip and toasts no longer count as overlay changes (see relevant()),
  // and they were the changes that kept re-running this check during a check-off.
  var q = 0; function soon(muts) { if (!relevant(muts)) { if (!q) q = requestAnimationFrame(function () { q = 0; try { wrapAdd(); memoState(); floats(); } catch (e) {} }); return; } try { scan(); } catch (e) {} if (q) return; q = requestAnimationFrame(function () { q = 0; try { wrapAdd(); memoState(); scan(); floats(); } catch (e) {} }); }
  function boot() { wrapAdd(); memoState(); scan(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'hidden', 'style'] }); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] }); new MutationObserver(function (muts) { if (!document.querySelector('.kz-gfloat')) return; for (var i = 0; i < muts.length; i++) { var m = muts[i], t = m.target.nodeType === 1 ? m.target : m.target.parentElement; if ((t && t.closest && t.closest('.kz-gfloat')) || Array.prototype.some.call(m.addedNodes || [], function (n) { return n.nodeType === 1 && (n.classList.contains('kz-gfloat') || (n.querySelector && n.querySelector('.kz-gfloat'))); })) { floats(); return; } } }).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('visibilitychange', function () { if (!document.hidden && locked) post({ type: 'pageScroll', on: false }); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzquit-1102.js ==== */
;try {
/* Nov 2 · copy of kzquit-1027.js; the goal sections' counts are left to kzcount-1102.js */
/* Oct 27 · replaces kzquit-1025s.js: Strict / Forgiving Quit (slipMode), chosen in the add sheet. */
/* Oct 25 s (from r): mutation work only when there are Quit habits, sheet relabel once per frame (fast tapping).
   Oct 25 r · Quit a bad habit (James). A fourth kind in the add sheet: "Quit" → "What's your bad habit?" → the goal is
   "Quit <it>". Shown only on Today, in its own Quit section. The day's check-in is locked until 9 PM (James); then you
   answer Clean or I slipped. If you missed last night's check-in, the morning asks "Clean yesterday?". Clean days are
   stored in the same done-map as every check-off, so a Quit habit can be your Kaizen 66 (a slip works like a missed day:
   a shield covers it, otherwise the run ends). Slips are kept in g.slips; "I slipped" never shames.
   A Quit goal is a daily habit underneath (kind 'daily', quit: 1), so streaks, history and Kaizen 66 just work.
   It's hidden on Goals, the Grove and in share text, and its name never goes into reminders. Substance quits show one
   quiet helpline line on the goal's page. */
(function () {
  var K = window.KZ; if (!K || K.__kzquit) return; K.__kzquit = 1;
  var de = document.documentElement;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var OPEN_H = 21; // 9 PM
  function tk() { return K.key(K.today()); }
  function plus(k, n) { return K.key(K.addDays(new Date(k + 'T12:00:00'), n)); }
  function nowH() { var d = new Date(); try { if (K.now) d = K.now(); } catch (e) {} return d.getHours(); }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function quits() { return goals().filter(function (g) { return g.quit; }); }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0] || null; }
  function doneMap() { return K.get('done', {}) || {}; }
  function isDone(id, k) { var d = doneMap(); return !!(d[id] && d[id][k]); }
  function setDone(id, k, on) { var d = doneMap(); d[id] = d[id] || {}; if (on) d[id][k] = 1; else delete d[id][k]; K.set('done', d); }
  function fire() { ['kz:changed', 'kz:step', 'kz:k66'].forEach(function (n) { try { document.dispatchEvent(new CustomEvent(n)); } catch (e) {} }); }
  function saveG(id, patch) { var all = K.get('goals', []) || []; all = all.map(function (g) { if (g.id === id) for (var k in patch) g[k] = patch[k]; return g; }); K.set('goals', all); }
  function started(g) { return (g.created || tk()).slice(0, 10); }
  K.isQuit = function (g) { if (typeof g === 'string') g = goal(g); return !!(g && g.quit); };
  // days clean: consecutive clean check-ins ending today (if checked) or yesterday
  // Oct 27: two kinds of Quit, picked when you make it. Strict (slipMode 'reset', and every Quit made before today):
  // a slip resets the count to 0. Forgiving ('keep'): a slip doesn't count as a clean day but doesn't end the run.
  function strict(g) { return g.slipMode !== 'keep'; }
  K.quitStrict = function (g) { if (typeof g === 'string') g = goal(g); return !!(g && strict(g)); };
  function stats(g) {
    var slips = g.slips || [], hard = strict(g), t = tk(), sl = function (k) { return slips.indexOf(k) >= 0; };
    var k = (isDone(g.id, t) || (!hard && sl(t))) ? t : plus(t, -1), n = 0, s = started(g), g2 = 0;
    while (k >= s && g2++ < 4000) { if (isDone(g.id, k) && !sl(k)) n++; else if (!(sl(k) && !hard)) break; k = plus(k, -1); }
    var best = n, run = 0, d = s, guard = 0;
    while (d <= t && guard++ < 4000) { if (isDone(g.id, d) && !sl(d)) { run++; if (run > best) best = run; } else if (!(sl(d) && !hard)) run = 0; d = plus(d, 1); }
    return { clean: n, best: best, slips: slips.length, strict: hard };
  }
  K.quitStats = function (id) { var g = goal(id); return g ? stats(g) : null; };
  var SUBST = /\b(drug|drugs|weed|marijuana|cannabis|thc|vap(e|ing)|nicotine|smok(e|ing)|cigarette|cig|juul|alcohol|drink(ing)?|beer|liquor|cocaine|coke|pills|opioid|adderall|xanax|gambl(e|ing)|bet(ting)?|meth|heroin)\b/i;

  // ---------- 1 · the add sheet: a fourth kind ----------
  var quitOn = false, pending = null;
  var PICKS = ['Vaping', 'Doom-scrolling', 'Texting my ex', 'Drinking', 'Smoking', 'Junk food', 'Gambling', 'Nail biting'];
  function sheetOf(el) { return el.closest('.kz-sheet49'); }
  function q(sh, k) { return sh.querySelector('[data-t="' + k + '"], [data-gx="' + k + '"]'); }
  function addSeg() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-kindseg'), function (seg) {
      if (seg.querySelector('[data-kind="quit"]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('data-kind', 'quit'); b.setAttribute('aria-checked', 'false'); b.className = 'kzq-kind'; b.textContent = 'Quit';
      seg.appendChild(b); seg.classList.add('kzq-seg');
    });
  }
  function paintQuit(sh) {
    var on = sh.classList.contains('kzq-on');
    Array.prototype.forEach.call(sh.querySelectorAll('.kz-kindseg [data-kind]'), function (b) { if (on) b.setAttribute('aria-checked', String(b.getAttribute('data-kind') === 'quit')); else if (b.getAttribute('data-kind') === 'quit') b.setAttribute('aria-checked', 'false'); });
    var lab = q(sh, 'gname-l'), inp = q(sh, 'gname'), t = q(sh, 'sheet-t') || q(sh, 't'), sub = q(sh, 'submit-l');
    if (on) {
      if (lab) lab.textContent = 'What\'s your bad habit?'; if (inp) inp.placeholder = 'Vaping'; if (t) t.textContent = 'Quit something'; if (sub) sub.textContent = 'Start quitting';
      var box = sh.querySelector('.kzq-box');
      if (!box) {
        box = document.createElement('div'); box.className = 'kzq-box';
        box.innerHTML = '<div class="kzq-picks">' + PICKS.map(function (p) { return '<button type="button" data-q-pick="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>' +
          '<label class="kz-field49"><span class="kz-label49">Why I\'m quitting <i class="kz-opt">(optional)</i></span><input class="kzq-why" maxlength="120" placeholder="More money, better sleep" autocomplete="off"></label>' +
          '<button type="button" class="kzq-strict" role="switch" aria-checked="false"><span><b>Strict mode</b><small>Off: a slip doesn’t end your run</small></span><i aria-hidden="true"></i></button>' +
          '<p class="kz-hint49 kzq-hint">Every night from 9 PM you check in: clean, or slipped. It only shows on Today.</p>';
        var field = inp && inp.closest('label'); if (field && field.parentNode) field.parentNode.insertBefore(box, field.nextSibling);
      }
      box.hidden = false;
    } else { var bx = sh.querySelector('.kzq-box'); if (bx) bx.hidden = true; }
  }
  document.addEventListener('click', function (e) {
    var k = e.target.closest && e.target.closest('.kz-kindseg [data-kind]'); if (!k) {
      var st0 = e.target.closest && e.target.closest('.kzq-strict'); if (st0) { var on0 = st0.getAttribute('aria-checked') !== 'true'; st0.setAttribute('aria-checked', String(on0)); var sm = st0.querySelector('small'); if (sm) sm.textContent = on0 ? 'A slip resets your count to 0' : 'Off: a slip doesn’t end your run'; post({ type: 'tick' }); return; }
      var pk = e.target.closest && e.target.closest('[data-q-pick]'); if (pk) { var sh0 = sheetOf(pk), inp0 = sh0 && q(sh0, 'gname'); if (inp0) { inp0.value = pk.getAttribute('data-q-pick'); inp0.dispatchEvent(new Event('input', { bubbles: true })); } }
      return;
    }
    var sh = sheetOf(k); if (!sh) return;
    if (k.getAttribute('data-kind') === 'quit') {
      e.preventDefault(); e.stopImmediatePropagation();
      var daily = sh.querySelector('.kz-kindseg [data-kind="daily"]'); if (daily) daily.click();   // underneath it's a daily habit
      sh.classList.add('kzq-on'); paintQuit(sh); post({ type: 'tick' });
      var inp = q(sh, 'gname'); if (inp) setTimeout(function () { inp.focus(); }, 30);
    } else if (sh.classList.contains('kzq-on')) { sh.classList.remove('kzq-on'); setTimeout(function () { paintQuit(sh); }, 0); }
  }, true);
  // the sheet's own code repaints labels when it opens or the kind changes: put the Quit labels back
  var sq = 0;
  new MutationObserver(function () { if (sq) return; sq = requestAnimationFrame(function () { sq = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.kz-sheet49'), function (sh) {
      if (sh.hidden && sh.classList.contains('kzq-on')) { sh.classList.remove('kzq-on'); paintQuit(sh); }
      else if (!sh.hidden && sh.classList.contains('kzq-on')) { var lab = q(sh, 'gname-l'); if (lab && lab.textContent !== 'What\'s your bad habit?') paintQuit(sh); }
    });
    addSeg();
  }); }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'aria-checked'] });
  document.addEventListener('submit', function (e) {
    var sh = e.target.closest && e.target.closest('.kz-sheet49'); if (!sh || !sh.classList.contains('kzq-on')) { pending = null; return; }
    var why = sh.querySelector('.kzq-why'), stb = sh.querySelector('.kzq-strict'); pending = { why: why ? why.value.trim().slice(0, 120) : '', strict: !!(stb && stb.getAttribute('aria-checked') === 'true'), at: Date.now() };
    if (why) why.value = ''; if (stb) { stb.setAttribute('aria-checked', 'false'); var sm1 = stb.querySelector('small'); if (sm1) sm1.textContent = 'Off: a slip doesn’t end your run'; }
  }, true);
  function quitName(v) { v = String(v || '').trim(); if (!v) return v; if (/^(quit|stop|no)\b/i.test(v)) return v.charAt(0).toUpperCase() + v.slice(1); return 'Quit ' + v.charAt(0).toLowerCase() + v.slice(1); }
  function wrapAdd() {
    if (!K.addGoal || K.addGoal.__quit) return;
    var add = K.addGoal, w = function (o) {
      var p = pending; pending = null;
      if (p && Date.now() - p.at < 5000 && o && o.kind === 'daily') {
        var o2 = {}; for (var k in o) o2[k] = o[k]; o2.name = quitName(o.name).slice(0, 90); o2.step = ''; o2.cue = ''; o2.mini = '';
        var id = add.call(this, o2); saveG(id, { quit: 1, why: p.why, slips: [], created: tk(), slipMode: p.strict ? 'reset' : 'keep' }); setTimeout(fire, 0); return id;
      }
      return add.apply(this, arguments);
    }; w.__quit = 1; K.addGoal = w;
  }

  // ---------- 2 · Today: the Quit section ----------
  function rowHTML(g) {
    var s = stats(g), t = tk(), h = nowH(), today = isDone(g.id, t), slipped = (g.slips || []).indexOf(t) >= 0, y = plus(t, -1);
    var yAsk = !today && !slipped && h < OPEN_H && started(g) <= y && !isDone(g.id, y) && (g.slips || []).indexOf(y) < 0;
    var right;
    if (today) right = '<span class="kzq-st ok">✓ Clean today</span><button type="button" class="kzq-undo" data-q-undo="' + esc(g.id) + '">Undo</button>';
    else if (slipped) right = '<span class="kzq-st">' + (strict(g) ? 'Back to day 0' : 'Slip noted') + '</span><button type="button" class="kzq-undo" data-q-unslip="' + esc(g.id) + '">Undo</button>';
    else if (yAsk) right = '<span class="kzq-ask">Clean yesterday?</span><button type="button" class="kzq-btn ok" data-q-y="' + esc(g.id) + '">Yes</button><button type="button" class="kzq-btn" data-q-yslip="' + esc(g.id) + '">I slipped</button>';
    else if (h < OPEN_H) right = '<span class="kzq-lock" aria-label="Check-in opens at 9 PM"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>9 PM</span>';
    else right = '<button type="button" class="kzq-btn ok" data-q-clean="' + esc(g.id) + '">✓ Clean</button><button type="button" class="kzq-btn" data-q-slip="' + esc(g.id) + '">I slipped</button>';
    return '<div class="kzq-row" data-q="' + esc(g.id) + '"><a class="kzq-main" href="/pages/goal?id=' + encodeURIComponent(g.id) + '"><b>' + esc(g.name) + '</b><em>' + s.clean + (s.clean === 1 ? ' day' : ' days') + ' clean' + (s.best > s.clean ? ' · best ' + s.best : '') + '</em></a><div class="kzq-act">' + right + '</div></div>';
  }
  function today() {
    var host = document.querySelector('#kz-today-s1 .kz-tgroups'); if (!host) return;
    var qs = quits(), ids = {}; qs.forEach(function (g) { ids[g.id] = 1; });
    // hide the quit habits' own rows in the goal groups (and fix those groups' counts)
    Array.prototype.forEach.call(host.querySelectorAll('.kz-goal[data-goal]'), function (r) { r.classList.toggle('kzq-hide', !!ids[r.getAttribute('data-goal')]); });
    Array.prototype.forEach.call(host.querySelectorAll('.kz-gsec'), function (sec) {
      var rows = sec.querySelectorAll('.kz-goal[data-goal]'), vis = sec.querySelectorAll('.kz-goal[data-goal]:not(.kzq-hide)');
      sec.classList.toggle('kzq-empty', rows.length > 0 && vis.length === 0);
      // Nov 2: kzcount-1102.js owns the section counts now
    });
    // a Quit habit as Kaizen 66: its card's check is locked until 9 PM too
    var r6 = null; try { var st6 = K.k66 && K.k66.state(); r6 = st6 && st6.run; } catch (e) {}
    var lock66 = !!(r6 && ids[r6.goal] && nowH() < OPEN_H && !r6.todayDone);
    de.classList.toggle('kzq-66lock', lock66);
    var card = document.querySelector('.kzf-card, #kz-today-s1 .kzf-top'), sub = document.querySelector('.kzf-tx > span');
    if (r6 && ids[r6.goal] && sub) { var want = lock66 ? 'Check in tonight from 9 PM' : (r6.todayDone ? 'Clean today' : 'Clean today? Check in now'); if (sub.textContent !== want) sub.textContent = want; }
    var sec = document.querySelector('.kzq-sec');
    if (!qs.length) { if (sec) sec.remove(); return; }
    if (!sec) { sec = document.createElement('section'); sec.className = 'kz-tsec kzq-sec'; sec.setAttribute('aria-label', 'Quit'); host.appendChild(sec); }
    var h = '<div class="kz-tsec-h"><h2>Quit</h2><span class="kz-tsec-n">' + (nowH() < OPEN_H ? 'check in at 9 PM' : qs.filter(function (g) { return isDone(g.id, tk()) || (g.slips || []).indexOf(tk()) >= 0; }).length + ' of ' + qs.length) + '</span></div><div class="kzq-list">' + qs.map(rowHTML).join('') + '</div>';
    if (sec.__h !== h) { sec.__h = h; sec.innerHTML = h; }
  }
  function slip(id, k) { var g = goal(id); if (!g) return; var sl = (g.slips || []).slice(); if (sl.indexOf(k) < 0) sl.push(k); saveG(id, { slips: sl }); setDone(id, k, false); }
  function unslip(id, k) { var g = goal(id); if (!g) return; saveG(id, { slips: (g.slips || []).filter(function (x) { return x !== k; }) }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-q-clean],[data-q-slip],[data-q-undo],[data-q-unslip],[data-q-y],[data-q-yslip]'); if (!b) return;
    e.preventDefault(); var t = tk(), y = plus(t, -1), id;
    if ((id = b.getAttribute('data-q-clean'))) { setDone(id, t, true); unslip(id, t); post({ type: 'haptic', n: 2 }); if (K.toast) K.toast('Clean today. Keep going.'); }
    else if ((id = b.getAttribute('data-q-slip'))) { if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tap to confirm'; setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'I slipped'; } }, 3000); return; } slip(id, t); post({ type: 'haptic', n: 1 }); if (K.toast) K.toast('That\'s okay. Day 1 starts now.'); }
    else if ((id = b.getAttribute('data-q-undo'))) { setDone(id, t, false); }
    else if ((id = b.getAttribute('data-q-unslip'))) { unslip(id, t); }
    else if ((id = b.getAttribute('data-q-y'))) { setDone(id, y, true); post({ type: 'haptic', n: 2 }); }
    else if ((id = b.getAttribute('data-q-yslip'))) { slip(id, y); if (K.toast) K.toast('That\'s okay. Today counts.'); }
    fire(); setTimeout(run, 0);
  });

  // ---------- 3 · only on Today: hidden on Goals and in the Grove; names never shared ----------
  function hideElsewhere() {
    var ids = {}; quits().forEach(function (g) { ids[g.id] = 1; }); if (!Object.keys(ids).length) return;
    Array.prototype.forEach.call(document.querySelectorAll('#kz-my .kz-goal[data-goal], #kz-my [data-goal], .kzg-tree[href], .kzg-row[href], .kzg-mini[data-g], .kzpc-row[href]'), function (el) {
      var id = el.getAttribute('data-goal') || el.getAttribute('data-g'); if (!id) { var m = /[?&]id=([^&]+)/.exec(el.getAttribute('href') || ''); id = m ? decodeURIComponent(m[1]) : ''; }
      var hide = !!ids[id]; if (el.classList.contains('kzq-gone') !== hide) el.classList.toggle('kzq-gone', hide);
    });
  }
  function goalPage() {
    var page = document.getElementById('kz-goalpage'); if (!page) return;
    var id = new URLSearchParams(location.search).get('id'), g = goal(id); if (!g || !g.quit) return;
    page.classList.add('kzq-page');
    var box = page.querySelector('.kzq-gp');
    if (!box) { box = document.createElement('section'); box.className = 'kzq-gp'; var a = page.querySelector('.kz-g1stats'); if (a && a.parentNode) a.parentNode.insertBefore(box, a); else page.appendChild(box); }
    var s = stats(g), h = '<div class="kzq-big"><b>' + s.clean + '</b><span>' + (s.clean === 1 ? 'day clean' : 'days clean') + '</span></div>' +
      '<p class="kzq-gl">Best run: ' + s.best + (s.best === 1 ? ' day' : ' days') + (s.slips ? ' · ' + s.slips + (s.slips === 1 ? ' slip' : ' slips') + ', and you kept going' : '') + '</p>' +
      (g.why ? '<p class="kzq-why2">Why: ' + esc(g.why) + '</p>' : '') +
      (SUBST.test(g.name) ? '<a class="kzq-help" href="tel:18006624357">Need support? Free, confidential help, 24/7: 1-800-662-4357 (SAMHSA)</a>' : '');
    if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
  }
  // share text: a Kaizen 66 run on a Quit habit is never named
  function wrapShare() {
    if (!K.shareText || K.shareText.__quit) return;
    var f = K.shareText, w = function () { var t = f.apply(this, arguments); quits().forEach(function (g) { if (g.name && t.indexOf(g.name) >= 0) t = t.replace(': ' + g.name, '').split(g.name).join('a habit'); }); return t; };
    w.__quit = 1; K.shareText = w;
  }
  try { if (navigator.share && !navigator.share.__quit) { var ns = navigator.share, wq = function (d) { if (d && typeof d.text === 'string') { var t = d.text; quits().forEach(function (g) { t = t.replace(': ' + g.name, '').split(g.name).join('a habit'); }); var o = {}; for (var k in d) o[k] = d[k]; o.text = t; d = o; } return ns.call(navigator, d); }; wq.__quit = 1; navigator.share = wq; } } catch (e) {}

  var queued = 0;
  function run() { queued = 0; try { addSeg(); wrapAdd(); wrapShare(); today(); hideElsewhere(); goalPage(); } catch (e) {} }
  function soon() { if (queued) return; queued = requestAnimationFrame(run); }
  function boot() {
    run();
    new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && t.closest('.kzq-sec, .kzq-gp')) continue; if (quits().length) { try { today(); hideElsewhere(); } catch (e) {} } soon(); return; } }).observe(document.body, { childList: true, subtree: true });
    setInterval(function () { var h = nowH(); if (h !== boot.h) { boot.h = h; soon(); } }, 30000); boot.h = nowH();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kz:goals', 'kz:changed', 'kz:step', 'kz:k66'].forEach(function (n) { document.addEventListener(n, soon); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kznotify-1102.js ==== */
;try {
/* Oct 30 · replaces kznotify-1029.js: same, plus a habit set to only some days (kzdays-1030) is left out of reminders on its off days. */
/* Oct 29 · James: "make the reminder page easier to read and understand". Replaces kznotify-1025r.js (same settings, same
   reminders to the phone, same data-* hooks the note-reminder add-on uses). The sheet now reads top to bottom as plain
   questions: When? (each choice says what it does), On which days? (with "Every day" / "Weekdays"…), What should they
   remind you about? (each with a one-line meaning), Stop once it's all done, and a preview of the next one.
   "Repeating" no longer has a separate Quiet 10 PM–8 AM switch: Start and End are the quiet hours, so slots() ignores
   s.quiet (with the default 8 AM–10 PM window nothing changes). Styles: kznotify-1029.css */
/* Oct 25 r · Reminders you control, that stop once you're done (James).
   Me → Reminders opens a new sheet: style (Morning + evening · Just one · Every 15 min…3 h · Custom times), what to include,
   days, quiet hours, "Stop when everything's done". The page computes the exact reminders (time, title, body) for a
   rolling window and sends them to the phone (bridge type 'notifySync'); the phone only checks and schedules them.
   Every change (check-off, undo, add, edit, delete, a new day, opening the app) recomputes the window, so a reminder always
   lists what's actually left, and once everything is done today's remaining reminders are removed.
   iOS keeps at most 64 per app: this window never goes over 50 (timed to-dos keep their own). Quit habits are never named.
   Settings: kz_notify (backed up, cleared by Delete my data). Old reminder settings (kz_reminders) carry over. */
/* Nov 2 · James picked Reminders mockup C "Your day": the summary says how many a day; a bar shows your day, the gold-to-orange
   stretch is when reminders can come and each tick is one reminder; with Repeating you drag its two dots for start and end
   (the times under them still open the time picker). How often is one short row; days are outlined circles. Same settings,
   same reminders, nothing removed. Styles: kznotify-1102.css */
(function () {
  var K = window.KZ; if (!K || K.__kznotify) return; K.__kznotify = 1;
  var de = document.documentElement;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var CAP = 50;
  var DEF = { on: 0, style: 'twice', am: '08:00', pm: '20:00', amOn: 1, pmOn: 1, one: '20:00', every: 60, from: '08:00', to: '22:00', custom: ['08:00', '13:00', '20:00'],
    days: [1, 1, 1, 1, 1, 1, 1], quiet: 1, qFrom: '22:00', qTo: '08:00', stop: 1, inc: { k66: 1, habits: 1, todos: 1, quit: 1 } };
  function settings() {
    var s = K.get('notify', null);
    if (!s) { var old = K.get('reminders', {}) || {}; s = JSON.parse(JSON.stringify(DEF)); if (old.on) { s.on = 1; if (old.morning) s.am = old.morning; s.pmOn = old.evening ? 1 : 0; } }
    for (var k in DEF) if (!(k in s)) s[k] = JSON.parse(JSON.stringify(DEF[k]));
    return s;
  }
  K.notifySettings = settings;
  function save(s) { K.set('notify', s); }
  function mins(t) { var p = String(t || '0:0').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function hhmm(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function fmt(t) { var m = mins(t), h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h >= 12 ? ' PM' : ' AM'); }
  function slots(s) {
    var out = [];
    if (s.style === 'twice') { if (s.amOn) out.push(mins(s.am)); if (s.pmOn) out.push(mins(s.pm)); }
    else if (s.style === 'one') out.push(mins(s.one));
    else if (s.style === 'every') { var a = mins(s.from), b = mins(s.to), st = Math.max(15, +s.every || 60); if (b <= a) b += 1440; for (var m = a; m <= b && out.length < 96; m += st) out.push(m % 1440); }
    else (s.custom || []).slice(0, 8).forEach(function (t) { out.push(mins(t)); });
    out = out.filter(function (m, i, a) { return a.indexOf(m) === i; }).sort(function (x, y) { return x - y; });
    if (false && s.quiet && s.style === 'every') { var qa = mins(s.qFrom), qb = mins(s.qTo); out = out.filter(function (m) { return qa > qb ? !(m >= qa || m < qb) : !(m >= qa && m < qb); }); }
    return out;
  }
  K.notifySlots = slots;

  // ---------- what's left ----------
  function k66() { try { var st = K.k66 && K.k66.state(), r = st && st.run; return r && r.state === 'live' ? r : null; } catch (e) { return null; } }
  function left(dayKey, s, ahead) {
    var t = K.key(K.today()), isToday = dayKey === t, done = K.get('done', {}) || {}, gs = []; try { gs = K.goals() || []; } catch (e) {}
    var r = k66(), out = { k66: null, names: [], quit: 0, timed: [] };
    gs.forEach(function (g) {
      var d = !!(done[g.id] && done[g.id][dayKey]);
      if (g.quit) { if (!d && !((g.slips || []).indexOf(dayKey) >= 0)) out.quit++; return; }
      if (K.bd && K.bd.isMs && K.bd.isMs(g)) return;   // broken-down goals are tracked by milestones, not daily
      if (K.offDay && K.offDay(g, dayKey)) return;   // Oct 30: a habit's off day (Weekdays / picked days) isn't in that day's reminders
      if (r && r.goal === g.id) { if (!(isToday ? r.todayDone : false) && !d) out.k66 = { name: g.name, day: isToday ? r.day : Math.min(66, r.day + (ahead || 1)) }; return; }
      if (!d && s.inc.habits) out.names.push(g.name);
    });
    if (r && out.k66 && !s.inc.k66) out.k66 = null;
    if (s.inc.todos) {
      var p = K.plan ? K.plan(dayKey) : null;
      (p && p.items || []).forEach(function (x) { if (!x.done) out.names.push(x.txt); });
      (K.todosFor ? K.todosFor(dayKey) : []).forEach(function (x) { if (!x.done) { out.names.push(x.txt); if (x.time) out.timed.push(mins(x.time)); } });
    }
    if (!s.inc.quit) out.quit = 0;
    return out;
  }
  K.notifyLeft = left;
  var TITLES = ['%n left today', 'Still %n to go', '%n left. You’ve got this'];
  function message(l, slotMin, i, first) {
    var items = [], n = l.names.length + (l.k66 ? 1 : 0) + (slotMin >= 21 * 60 && l.quit ? 1 : 0);
    if (!n) return null;
    if (l.k66) items.push('Kaizen 66: ' + l.k66.name);
    if (slotMin >= 21 * 60 && l.quit) items.push(l.quit === 1 ? '1 quit check-in' : l.quit + ' quit check-ins');   // only checkable from 9 PM, so it goes near the top
    l.names.forEach(function (x) { items.push(x); });
    var body = items.slice(0, 4).map(function (x) { return String(x).slice(0, 60); }).join(', ') + (items.length > 4 ? ' +' + (items.length - 4) + ' more' : '');
    var title = l.k66 && (first || i % 3 === 0) ? 'Kaizen 66 · Day ' + l.k66.day + ' still open' : first ? (n === 1 ? '1 thing today' : n + ' things today') : TITLES[i % TITLES.length].replace('%n', n);
    return { title: title.slice(0, 80), body: body.slice(0, 240) };
  }
  // the reminders for the next days, newest-first-capped
  function plan(now) {
    var s = settings(); now = now || new Date();
    if (!s.on) return [];
    var sl = slots(s), out = [], t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (var d = 0; d < 7 && out.length < CAP; d++) {
      var day = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + d), dk = K.key(day);
      if (!s.days[day.getDay()]) continue;
      var l = left(dk, s, d), i = 0;
      if (d === 0 && s.stop && !l.names.length && !l.k66 && !(l.quit && sl.some(function (m) { return m >= 21 * 60; }))) continue;   // all done today: no more today
      sl.forEach(function (m, si) {
        if (out.length >= CAP) return;
        var at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60);
        if (at <= now) return;
        if (l.timed.some(function (tm) { return Math.abs(tm - m) <= 10; })) return;   // a timed to-do has its own reminder
        var msg = message(l, m, i++, si === 0); if (!msg) return;
        out.push({ id: 'kzn-' + dk.replace(/-/g, '') + '-' + hhmm(m).replace(':', ''), at: at.getTime(), title: msg.title, body: msg.body });
      });
    }
    return out;
  }
  K.notifyPlan = plan;
  var tm = 0, lastSig = '';
  function sync(ask) {
    clearTimeout(tm); tm = setTimeout(function () {
      var items = [], s = settings(); try { items = plan(); } catch (e) {}
      var sig = JSON.stringify([s.on, items]); if (sig === lastSig && !ask) return; lastSig = sig;
      post({ type: 'notifySync', on: !!s.on, ask: !!ask, items: items });
      window.__kzNotifyLast = { on: !!s.on, items: items };
    }, ask ? 0 : 400);
  }
  K.notifySync = sync;

  // ---------- the sheet ----------
  var layer = null;
  function summary(s) {
    if (!s.on) return 'Off';
    if (s.style === 'twice') return [s.amOn ? fmt(s.am) : '', s.pmOn ? fmt(s.pm) : ''].filter(Boolean).join(' + ') || 'Off';
    if (s.style === 'one') return fmt(s.one);
    if (s.style === 'every') return s.every < 60 ? 'Every ' + s.every + ' min' : s.every === 60 ? 'Every hour' : 'Every ' + (s.every / 60) + ' h';
    return (s.custom || []).length + ' times a day';
  }
  K.notifySummary = function () { return summary(settings()); };
  function perDay(s) { var n = slots(s).length; return n + (n === 1 ? ' a day' : ' a day'); }
  function chip(on, attr, label) { return '<button type="button" class="kzn-chip' + (on ? ' on' : '') + '" ' + attr + ' aria-pressed="' + !!on + '">' + label + '</button>'; }
  function body(s) {
    var D = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var row2 = function (t, sub, input) { return '<label class="kzn-row kzn2-r"><span><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + input + '</label>'; };
    var sw = function (attr, on) { return '<input type="checkbox" class="kz-sw49" ' + attr + (on ? ' checked' : '') + '>'; };
    var tm = function (attr, v, lab) { return '<input type="time" ' + attr + ' value="' + esc(v) + '" aria-label="' + lab + '">'; };
    var h = '<h2 class="kzsw-t" id="kzn-t">Reminders</h2><p class="kzsw-p dim">A nudge with what’s still left today. Check it all off and they stop.</p>';
    h += '<div class="kzn-card kzn2-master">' + row2('Send me reminders', s.on ? summary(s) + ' \u00b7 ' + perDay(s) : 'Off', sw('data-n="on"', s.on)).replace('kzn-row kzn2-r', 'kzn-row kzn2-r big2') + '</div>';
    h += '<div class="kzn-body"' + (s.on ? '' : ' hidden') + '>';
    var ST = [['one', 'Once', 'One reminder at a time you pick.'], ['twice', 'Twice', 'One in the morning, one in the evening.'], ['every', 'Repeat', 'Every so often, between a start and end time.'], ['custom', 'Pick times', 'Up to 8 times you choose.']];
    var cur = ST.filter(function (x) { return x[0] === s.style; })[0] || ST[0];
    // your day: 0:00 → 24:00; the active stretch; one tick per reminder; draggable ends for Repeating
    var pc = function (m) { return (Math.max(0, Math.min(1440, m)) / 1440 * 100).toFixed(2) + '%'; }, SL = slots(s), a0, b0;
    if (s.style === 'every') { a0 = mins(s.from); b0 = mins(s.to); if (b0 <= a0) b0 = 1440; } else if (SL.length) { a0 = SL[0]; b0 = SL[SL.length - 1]; }
    h += '<p class="kzn-lab">Your day</p><div class="kzn3-day" data-n3-day>' + '<i class="kzn3-bar"></i>' +
      (a0 != null ? '<i class="kzn3-on" style="left:' + pc(a0) + ';width:' + ((Math.max(0, b0 - a0)) / 1440 * 100).toFixed(2) + '%"></i>' : '') +
      SL.map(function (m) { return '<i class="kzn3-tk" style="left:' + pc(m) + '"></i>'; }).join('') +
      (s.style === 'every' ? '<span class="kzn3-h" data-n3-h="from" style="left:' + pc(a0) + '" role="slider" aria-label="Start" aria-valuetext="' + fmt(s.from) + '"></span><span class="kzn3-h" data-n3-h="to" style="left:' + pc(b0) + '" role="slider" aria-label="End" aria-valuetext="' + fmt(s.to) + '"></span>' +
        '<label class="kzn3-t" style="left:' + pc(a0) + '"><span>' + fmt(s.from) + '</span>' + tm('data-n="from"', s.from, 'Start time') + '</label><label class="kzn3-t" style="left:' + pc(b0) + '"><span>' + fmt(s.to) + '</span>' + tm('data-n="to"', s.to, 'End time') + '</label>'
        : '<span class="kzn3-ax" style="left:0">12 AM</span><span class="kzn3-ax" style="left:50%">Noon</span><span class="kzn3-ax r" style="left:100%">12 AM</span>') + '</div>';
    h += '<p class="kzn-lab">How often</p><div class="kzn-seg kzn2-style kzn3-style">' + ST.map(function (x) { return chip(s.style === x[0], 'data-n-style="' + x[0] + '"', x[1]); }).join('') + '</div><p class="kzn2-hint">' + cur[2] + '</p>';
    if (s.style === 'twice') h += '<div class="kzn-card">' + row2('Morning', '', tm('data-n="am"', s.am, 'Morning time') + sw('data-n="amOn"', s.amOn)) + row2('Evening', '', tm('data-n="pm"', s.pm, 'Evening time') + sw('data-n="pmOn"', s.pmOn)) + '</div>';
    if (s.style === 'one') h += '<div class="kzn-card">' + row2('Time', '', tm('data-n="one"', s.one, 'Reminder time')) + '</div>';
    if (s.style === 'every') h += '<div class="kzn-card"><div class="kzn2-every"><span class="kzn2-el">Every</span><div class="kzn-seg kzn2-int">' + [15, 30, 60, 120, 180].map(function (m) { return chip(+s.every === m, 'data-n-every="' + m + '" aria-label="Every ' + (m < 60 ? m + ' minutes' : m === 60 ? 'hour' : (m / 60) + ' hours') + '"', m < 60 ? m + ' min' : (m / 60) + ' hr'); }).join('') + '</div></div>' +
      '</div>' +
      (+s.every <= 30 ? '<p class="kzn-warn">That’s a lot of buzzing. Most people like every hour.</p>' : '');
    if (s.style === 'custom') h += '<div class="kzn-card">' + (s.custom || []).map(function (t, i) { return '<label class="kzn-row kzn2-r"><span><b>Time ' + (i + 1) + '</b></span>' + tm('data-n-c="' + i + '"', t, 'Time ' + (i + 1)) + '<button type="button" class="kzn-x" data-n-cdel="' + i + '" aria-label="Remove time ' + (i + 1) + '">×</button></label>'; }).join('') +
      ((s.custom || []).length < 8 ? '<button type="button" class="kzn-add" data-n-cadd>+ Add a time</button>' : '') + '</div>';
    var dn = s.days.filter(Boolean).length, wk = s.days.join('');
    var dl = dn === 7 ? 'Every day' : wk === '0111110' ? 'Weekdays' : wk === '1000001' ? 'Weekends' : dn === 1 ? DN[s.days.indexOf(1)] + 's only' : dn + ' days a week';
    h += '<div class="kzn2-labrow"><p class="kzn-lab">Days</p><span class="kzn2-dl">' + dl + '</span></div><div class="kzn-days">' + D.map(function (d, i) { return chip(s.days[i], 'data-n-day="' + i + '" aria-label="' + DN[i] + '"', d); }).join('') + '</div>';
    h += '<p class="kzn-lab">Remind me about</p><div class="kzn-card">' + [['k66', 'Kaizen 66', 'Your 66-day goal, if you’ve started one'], ['habits', 'Goals and habits', 'The ones not checked off yet'], ['todos', 'To-dos and plan', 'What’s still open on today’s list'], ['quit', 'Quit check-in', 'Added from 9 PM, when you can check in']].map(function (x) { return row2(x[1], x[2], sw('data-n-inc="' + x[0] + '"', s.inc[x[0]])); }).join('') +
      row2('Stop once it’s all done', 'No more reminders that day after you finish', sw('data-n="stop"', s.stop)) + '</div>';
    var nx = plan()[0];
    h += '<p class="kzn-lab">Next reminder</p><div class="kzn-prev">' + (nx ? '<span class="kzn-app">KAIZEN · ' + esc(new Date(nx.at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })) + '</span><b>' + esc(nx.title) + '</b><span>' + esc(nx.body) + '</span>' : '<span>Nothing left to remind you about today.</span>') + '</div>';
    h += '</div><div class="kzsw-acts"><button type="button" class="kzsw-btn gold" data-n-done>Done</button></div>';
    return h;
  }
  function paint() { if (!layer) return; var s = settings(), box = layer.querySelector('.kzsw'), y = box.scrollTop; box.innerHTML = '<i class="kzsw-grab" aria-hidden="true"></i>' + body(s); box.scrollTop = y; }
  function open() {
    if (layer) return;
    layer = document.createElement('div'); layer.className = 'kzsw-back kzn-sheet'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-labelledby', 'kzn-t');
    layer.innerHTML = '<div class="kzsw"></div>'; document.body.appendChild(layer); paint();
    requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
    layer.addEventListener('click', onClick); layer.addEventListener('change', onChange);
    layer.addEventListener('touchstart', onDown, { passive: false }); layer.addEventListener('mousedown', onDown);
    layer.addEventListener('touchmove', onMove, { passive: false }); document.addEventListener('mousemove', onMove);
    layer.addEventListener('touchend', onUp); layer.addEventListener('touchcancel', onUp); document.addEventListener('mouseup', onUp);
  }
  // drag the two ends of your day (Repeating): 15-minute steps, at least an hour apart; saved when you let go
  var dg = null;
  function dayX(e) { var t = e.touches ? e.touches[0] : e; return t.clientX; }
  function onDown(e) {
    var hnd = e.target.closest && e.target.closest('[data-n3-h]'); if (!hnd || !layer) return;
    var bar = layer.querySelector('[data-n3-day]'); if (!bar) return;
    dg = { k: hnd.getAttribute('data-n3-h'), el: hnd, bar: bar, r: bar.getBoundingClientRect(), v: null }; hnd.classList.add('drag'); e.preventDefault();
  }
  function onMove(e) {
    if (!dg) return; e.preventDefault();
    var s = settings(), m = Math.round(Math.max(0, Math.min(1, (dayX(e) - dg.r.left) / dg.r.width)) * 1440 / 15) * 15;
    if (dg.k === 'from') m = Math.min(m, mins(s.to) - 60); else m = Math.max(m, mins(s.from) + 60);
    m = Math.max(0, Math.min(1439, m)); if (m === dg.v) return; dg.v = m;
    var p = (m / 1440 * 100).toFixed(2) + '%'; dg.el.style.left = p;
    var lab = dg.bar.querySelectorAll('.kzn3-t')[dg.k === 'from' ? 0 : 1]; if (lab) { lab.style.left = p; lab.querySelector('span').textContent = fmt(hhmm(m)); }
    var on = dg.bar.querySelector('.kzn3-on'); if (on) { var a = dg.k === 'from' ? m : mins(s.from), b = dg.k === 'to' ? m : mins(s.to); on.style.left = (a / 1440 * 100).toFixed(2) + '%'; on.style.width = (Math.max(0, b - a) / 1440 * 100).toFixed(2) + '%'; }
    post({ type: 'tick' });
  }
  function onUp() { if (!dg) return; var d = dg; dg = null; d.el.classList.remove('drag'); if (d.v != null) set(function (s) { s[d.k] = hhmm(d.v); }); }
  function close() { if (!layer) return; var l = layer; layer = null; l.classList.remove('on'); setTimeout(function () { l.remove(); }, 280); paintRow(); }
  function set(fn) { var s = settings(); fn(s); save(s); paint(); paintRow(); sync(false); }
  function onClick(e) {
    if (e.target === layer || e.target.closest('[data-n-done]')) { close(); return; }
    if (e.target.closest('.kzsw-p')) return;
    var b;
    if ((b = e.target.closest('[data-n-style]'))) set(function (s) { s.style = b.getAttribute('data-n-style'); });
    else if ((b = e.target.closest('[data-n-every]'))) set(function (s) { s.every = +b.getAttribute('data-n-every'); });
    else if ((b = e.target.closest('[data-n-day]'))) set(function (s) { var i = +b.getAttribute('data-n-day'); s.days[i] = s.days[i] ? 0 : 1; if (!s.days.some(Boolean)) s.days[i] = 1; });
    else if ((b = e.target.closest('[data-n-cdel]'))) set(function (s) { s.custom.splice(+b.getAttribute('data-n-cdel'), 1); });
    else if (e.target.closest('[data-n-cadd]')) set(function (s) { var last = s.custom.length ? mins(s.custom[s.custom.length - 1]) : 7 * 60; s.custom.push(hhmm(Math.min(23 * 60, last + 120))); });
    else return;
    post({ type: 'tick' });
  }
  function onChange(e) {
    var t = e.target, k = t.getAttribute('data-n'), inc = t.getAttribute('data-n-inc'), c = t.getAttribute('data-n-c');
    if (k === 'on') { var s0 = settings(); s0.on = t.checked ? 1 : 0; save(s0); paint(); paintRow(); sync(!!t.checked); if (!t.checked) post({ type: 'remindersOff' }); return; }
    if (k) set(function (s) { s[k] = t.type === 'checkbox' ? (t.checked ? 1 : 0) : t.value; });
    else if (inc) set(function (s) { s.inc[inc] = t.checked ? 1 : 0; });
    else if (c != null) set(function (s) { s.custom[+c] = t.value; s.custom.sort(); });
  }
  // Me → Reminders: open this sheet instead of the old one, and show the summary on the row
  function remRow() { var rows = document.querySelectorAll('#kz-me .kz-set-row'); for (var i = 0; i < rows.length; i++) if (/^\s*Reminders/.test(rows[i].textContent)) return rows[i]; return null; }
  function paintRow() { var r = remRow(), em = r && r.querySelector('em'); if (em) { var v = summary(settings()); if (em.textContent !== v) em.textContent = v; } }
  document.addEventListener('click', function (e) { var r = remRow(); if (r && (e.target === r || r.contains(e.target))) { e.preventDefault(); e.stopImmediatePropagation(); post({ type: 'tick' }); open(); } }, true);
  K.openNotify = open;

  // ---------- keep the phone's reminders in step ----------
  ['kz:step', 'kz:changed', 'kz:goals', 'kz:todos', 'kz:k66', 'kz:plan'].forEach(function (n) { document.addEventListener(n, function () { sync(false); }); });
  window.addEventListener('pageshow', function () { sync(false); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(false); });
  var dayAt = K.key(K.today()); setInterval(function () { var k = K.key(K.today()); if (k !== dayAt) { dayAt = k; sync(false); } }, 60000);
  function boot() { paintRow(); if (document.getElementById('kz-today-s1') || document.getElementById('kz-me')) sync(false); var n = 0, t = setInterval(function () { paintRow(); if (++n > 10) clearInterval(t); }, 300); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzpick-1028.js ==== */
;try {
/* Oct 28 · replaces kzpick-1026g.js: repaints only on changes inside an add sheet (smoothness).
   Oct 26 (g, from 1025ze): Education and Fitness lists; any branch matched by name. Oct 25 s · Add sheet (Today's and the Goals sheet), James:
   1. Quick picks for Long-term and Daily habit are tappable chips under the name box, like Quit's (the big one-at-a-time
      carousel is hidden, its code is untouched). Chips follow the chosen branch; tap one to fill the name.
   2. "Make this my Kaizen 66" checkbox for a new daily habit or Quit. With no run it starts on save. With a run going,
      saving shows the usual "Reset Kaizen 66 to day 0?" question first (nothing resets without that yes). */
(function () {
  var K = window.KZ; if (!K || K.__kzpick) return; K.__kzpick = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var DAILY = {
    health: ['Drink 3 bottles of water', 'Walk 10k steps', 'Work out', 'Stretch 10 minutes', 'In bed by 11', 'No sugar', 'Eat a vegetable every meal', 'Take my vitamins'],
    mind: ['Read 10 pages', 'Meditate 5 minutes', 'Journal 3 lines', 'No phone the first hour', 'Plan tomorrow tonight', 'Learn one new thing'],
    wealth: ['Track every dollar', 'Save $5', 'No impulse buys', 'Study 30 minutes', 'Work on my business 30 min', 'Send one application'],
    relationships: ['Text a friend', 'Call family', 'Thank someone', 'Phone-free dinner', 'Give one compliment'],
    passion: ['Practice 20 minutes', 'Create something', 'Post once', 'Learn a skill 15 min'],
    education: ['Study 45 minutes', 'Review class notes', 'Do one assignment early', 'Read a chapter', 'Flashcards 15 minutes', 'Plan tomorrow\'s study'],
    fitness: ['Work out', 'Walk 10k steps', 'Stretch 10 minutes', 'Hit my protein', 'Drink 3 bottles of water', 'Go to the gym']
  };
  var LONG = {
    health: ['Run a half marathon', 'Bench my body weight', 'Run a 5K under 25 min', 'Do 20 pull-ups', 'Lose 10 lb', 'Gain 10 lb of muscle'],
    mind: ['Read 12 books', 'Finish an online course', 'Learn Spanish basics', 'Journal 100 days'],
    wealth: ['Save $2,000', 'Pay off a credit card', 'Land an internship', 'Make my first $1,000 online', 'Start a side business'],
    relationships: ['Make 3 new friends', 'Plan a trip with friends', 'Reconnect with an old friend', 'Family dinner every month'],
    passion: ['Learn guitar', 'Launch a project', 'Post 30 days in a row', 'Build an app'],
    education: ['Get a 3.5 GPA this semester', 'Ace my next exam', 'Finish an online course', 'Read 12 books', 'Get a certification', 'Land an internship'],
    fitness: ['Bench my body weight', 'Run a 5K under 25 min', 'Do 20 pull-ups', 'Gain 10 lb of muscle', 'Run a half marathon', 'Lose 10 lb']
  };
  function mix(o) { var out = []; Object.keys(o).forEach(function (k) { out = out.concat(o[k].slice(0, 2)); }); return out; }
  function sheets() { return document.querySelectorAll('.kz-sheet49'); }
  function q(sh, k) { return sh.querySelector('[data-t="' + k + '"], [data-gx="' + k + '"]'); }
  function kindOf(sh) { var b = sh.querySelector('.kz-kindseg [aria-checked="true"]'); return sh.classList.contains('kzq-on') ? 'quit' : b ? b.getAttribute('data-kind') : ''; }
  // g (Oct 26): a branch you named yourself gets the list that fits its name (Education, Fitness, Gym, School, Money...),
  // instead of a mix of every branch's suggestions
  function listFor(n) {
    n = String(n || '').toLowerCase().trim();
    if (DAILY[n]) return n;
    var M = [
      [/fit|gym|workout|lift|train|sport|run|muscle|strength|athlet|wrestl|jiu|bjj/, 'fitness'],
      [/educ|school|study|class|college|uni|learn|grade|exam|academ|course/, 'education'],
      [/health|body|sleep|diet|food|nutri|well/, 'health'],
      [/mind|mental|focus|calm|faith|spirit|medit|read/, 'mind'],
      [/wealth|money|financ|career|work|job|business|income|invest|trad/, 'wealth'],
      [/relat|friend|family|love|social|people|partner/, 'relationships'],
      [/person|passion|hobby|creat|art|music|content|side/, 'passion']
    ];
    for (var i = 0; i < M.length; i++) if (M[i][0].test(n)) return M[i][1];
    return n;
  }
  function branchOf(sh) { var b = sh.querySelector('[data-t="pillars"] [aria-pressed="true"], [data-gx="pillars"] [aria-pressed="true"]'); var id = b && b.getAttribute('data-p'); var p = (K.PATHS || []).filter(function (x) { return x.id === id; })[0]; var n = ((p && p.name) || id || '').toLowerCase(); return n === 'personal' ? 'passion' : n; }
  function isNew(sh) { var t = q(sh, 'sheet-t') || q(sh, 't'); return !t || !/^\s*Edit/i.test(t.textContent); }
  function run() { try { var st = K.k66 && K.k66.state(); return st && st.run; } catch (e) { return null; } }
  function goalName(id) { try { var g = K.goals().filter(function (x) { return x.id === id; })[0]; return g ? g.name : ''; } catch (e) { return ''; } }

  function paint(sh) {
    var k = kindOf(sh), inp = q(sh, 'gname'), field = inp && inp.closest('label'); if (!field) return;
    var fresh = isNew(sh);
    // chips
    var box = sh.querySelector('.kzp-box');
    var showChips = fresh && (k === 'daily' || k === 'long');
    sh.classList.toggle('kzp-on', showChips);
    if (showChips) {
      var br = listFor(branchOf(sh)), src = k === 'daily' ? DAILY : LONG, list = src[br] || mix(src), sig = k + '|' + br;
      if (!box) { box = document.createElement('div'); box.className = 'kzp-box'; field.parentNode.insertBefore(box, field.nextSibling); }
      if (box.getAttribute('data-sig') !== sig) { box.setAttribute('data-sig', sig); box.innerHTML = '<div class="kzp-picks" role="group" aria-label="Quick picks">' + list.map(function (x) { return '<button type="button" data-kzp-pick="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>'; }
      if (box.hidden) box.hidden = false;
    } else if (box && !box.hidden) box.hidden = true;
    // Kaizen 66 checkbox
    var row = sh.querySelector('.kzp-66'), show66 = fresh && (k === 'daily' || k === 'quit') && !!K.k66;
    if (show66) {
      if (!row) {
        row = document.createElement('label'); row.className = 'kzp-66';
        row.innerHTML = '<span class="kzp-66t"><b>Make this my Kaizen 66</b><em></em></span><input type="checkbox" class="kz-sw49" data-kzp-66>';
        var anchor = sh.querySelector('.kzq-box:not([hidden])') || box || field; anchor.parentNode.insertBefore(row, anchor.nextSibling);
      } else { var a2 = sh.querySelector('.kzq-box:not([hidden])') || (box && !box.hidden ? box : field); if (row.previousSibling !== a2) a2.parentNode.insertBefore(row, a2.nextSibling); }
      var r = run(), em = row.querySelector('em'), txt = r && r.goal ? 'Resets ' + goalName(r.goal) + ' (day ' + (r.state === 'pending' ? 0 : r.day) + ') to day 0' : '66 days, starting tomorrow';
      if (em.textContent !== txt) em.textContent = txt;
      if (row.hidden) row.hidden = false;
    } else if (row) { if (!row.hidden) row.hidden = true; var cb = row.querySelector('input'); if (cb) cb.checked = false; }
  }
  function paintAll() { Array.prototype.forEach.call(sheets(), function (sh) { if (sh.offsetParent || !sh.hidden) try { paint(sh); } catch (e) {} }); }

  document.addEventListener('click', function (e) {
    var pk = e.target.closest && e.target.closest('[data-kzp-pick]');
    if (pk) {
      var sh = pk.closest('.kz-sheet49'), inp = sh && q(sh, 'gname'); if (!inp) return;
      inp.value = pk.getAttribute('data-kzp-pick'); inp.dispatchEvent(new Event('input', { bubbles: true }));
      Array.prototype.forEach.call(sh.querySelectorAll('[data-kzp-pick]'), function (b) { b.classList.toggle('on', b === pk); });
      post({ type: 'tick' }); return;
    }
    if (e.target.closest && e.target.closest('.kz-sheet49 .kz-kindseg, .kz-sheet49 [data-t="pillars"], .kz-sheet49 [data-gx="pillars"]')) setTimeout(paintAll, 0);
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.matches || !t.matches('[data-t="gname"], [data-gx="gname"]')) return;
    var sh = t.closest('.kz-sheet49'); if (!sh) return;
    Array.prototype.forEach.call(sh.querySelectorAll('[data-kzp-pick]'), function (b) { b.classList.toggle('on', b.getAttribute('data-kzp-pick') === t.value); });
  });
  // on save: remember the box, find the new goal right after, then start (or ask to switch) the run
  document.addEventListener('submit', function (e) {
    var sh = e.target.closest && e.target.closest('.kz-sheet49'); if (!sh) return;
    var cb = sh.querySelector('[data-kzp-66]'); if (!cb || !cb.checked || cb.closest('[hidden]')) return;
    var before = {}; try { K.goals().forEach(function (g) { before[g.id] = 1; }); } catch (er) {}
    var name = (q(sh, 'gname') || {}).value || '';
    cb.checked = false;
    var tries = 0;
    (function look() {
      var g = null; try { g = K.goals().filter(function (x) { return !before[x.id] && x.kind === 'daily'; }).pop(); } catch (er) {}
      if (!g) { if (++tries < 20) setTimeout(look, 100); return; }
      setTimeout(function () {
        var r = run();
        if (r && r.goal && K.k66.askSwitch) K.k66.askSwitch(g.id);
        else if (K.k66.switchTo) { K.k66.switchTo(g.id); if (K.toast) K.toast(g.name + ' is your Kaizen 66'); }
        else if (K.k66.start) K.k66.start(g.id);
      }, 380);   // after the add sheet has closed
    })();
    void name;
  }, true);

  // zc (Oct 25): "Start quitting did nothing" on the phone. Log each add-button tap, whether the form really submitted,
  // and any field that blocked it, to the Xcode console (bridge "log", debug builds only) so the next report has evidence.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kz-addsheet button[type="submit"]'); if (!b) return;
    var f = b.form, bad = f ? [].filter.call(f.elements, function (x) { return x.willValidate && !x.checkValidity(); }).map(function (x) { return (x.getAttribute('data-t') || x.getAttribute('data-gx') || x.name || x.type) + ':' + x.validationMessage; }) : ['no form'];
    post({ type: 'log', msg: '[kz add] tap "' + b.textContent.trim() + '" kind=' + kindOf(b.closest('.kz-sheet49')) + ' blocked=' + JSON.stringify(bad) });
  }, true);
  document.addEventListener('submit', function (e) { if (e.target.closest && e.target.closest('.kz-addsheet')) post({ type: 'log', msg: '[kz add] submit ok' }); }, true);
  // Oct 28 (smoothness): only changes inside an add sheet repaint it. Watching every class change in the app re-measured
  // the closed sheets each frame of a check-off (a forced layout, ~40 ms a tap on a slow phone).
  var mo = new MutationObserver(function (ms) {
    if (mo.t) return; var hit = false;
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kz-sheet49')) { hit = true; break; } }
    if (!hit) return;
    mo.t = requestAnimationFrame(function () { mo.t = 0; paintAll(); });
  });   // ze: next frame, not 30 ms later (the old list flashed under the new chips)
  function boot() { paintAll(); mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-checked', 'aria-pressed', 'hidden', 'class'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztodo-1026c.js ==== */
;try {
/* Oct 26 (c, from b: only adds/removes rows; their place in the list is set by kzorder-1026f, which mirrors the Plan tab) (b, from a: to-dos follow the order set on the Plan tab): on Today, an added to-do ("Gym") is a row in the same list as the plan's to-dos:
   time on the left (its time, its part of the day, or "Anytime"), check on the right, added below.
   No remove button on Today (delete it on the Plan tab). One count in the header ("0 of 6").
   Each row is a stand-in: tapping its check taps the real to-do's check, so saving, points and the
   Plan tab work exactly as before. If there is no plan today, the to-dos still get the same list look. */
(function () {
  var K = window.KZ; if (!K || window.__kztd) return; window.__kztd = 1;
  window.addEventListener('storage', function (e) { if (e.key === 'kz_order') sync(); });
  var TICK = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  function label(t) {
    try {
      if (t.time && K.fmtTime) return K.fmtTime(t.time);
      if (t.part && t.part !== 'any' && K.partName) return K.partName(t.part);
    } catch (e) {}
    return 'Anytime';
  }
  function txt(el, s) { if (el && el.textContent !== s) el.textContent = s; }
  function sync() {
    var sec = document.querySelector('.kz-today .kz-todosec, .kz-todosec'); if (!sec) return;
    var ul = sec.querySelector('ul.kz-todos'); if (!ul) return;
    var card = sec.querySelector('.kz-plancard'), planOl = card && !card.hidden ? card.querySelector('.kz-plan-list') : null;
    var solo = sec.querySelector('.kztd-solo');
    var src = [].slice.call(ul.querySelectorAll('li.kz-todo[data-todo]'));
    var ol = planOl;
    if (!ol) {
      if (!src.length) { if (solo) solo.hidden = true; if (sec.classList.contains('kztd-on')) sec.classList.remove('kztd-on'); return; }
      if (!solo) { solo = document.createElement('div'); solo.className = 'kztd-solo'; solo.innerHTML = '<ol class="kz-plan-list"></ol>'; ul.parentNode.insertBefore(solo, ul); }
      solo.hidden = false; ol = solo.querySelector('ol');
    } else if (solo) { solo.hidden = true; [].slice.call(solo.querySelectorAll('li.kztd')).forEach(function (li) { li.remove(); }); }
    if (!sec.classList.contains('kztd-on')) sec.classList.add('kztd-on');   // add() on a class that's already there still counts as a change
    var byId = {}, rank = {}; try { (K.todos() || []).forEach(function (t, i) { byId[t.id] = t; rank[t.id] = i; }); } catch (e) {}
    // order = the order you set on the Plan tab (kz_order), then the order you added them; checking never moves rows
    var placed = {}; try { var od = (K.get('order', {}) || {})[K.key(K.today())] || []; od.forEach(function (k, i) { if (k.indexOf('t:') === 0) placed[k.slice(2)] = i; }); } catch (e) {}
    src.sort(function (x, y) {
      var ix = x.getAttribute('data-todo'), iy = y.getAttribute('data-todo');
      var px = placed[ix] != null ? placed[ix] : 1e6, py = placed[iy] != null ? placed[iy] : 1e6;
      if (px !== py) return px - py;
      var a = rank[ix], c = rank[iy]; return (a == null ? 1e9 : a) - (c == null ? 1e9 : c);
    });
    var ids = src.map(function (li) { return li.getAttribute('data-todo'); });
    [].slice.call(ol.querySelectorAll('li.kztd')).forEach(function (li) { if (ids.indexOf(li.getAttribute('data-kztd')) < 0) li.remove(); });
    var plans = ol.querySelectorAll(':scope > li:not(.kztd)'), prev = null;
    if (plans.length) prev = plans[plans.length - 1];
    src.forEach(function (s) {
      var id = s.getAttribute('data-todo'), t = byId[id] || {}, chk = s.querySelector('.kz-tcheck'), on = !!chk && chk.getAttribute('aria-pressed') === 'true';
      var name = (s.querySelector('.kz-tbody b') || s.querySelector('.kz-tbody') || {}).textContent || t.text || t.name || '';
      var li = ol.querySelector('li.kztd[data-kztd="' + id + '"]');
      if (!li) {
        li = document.createElement('li'); li.className = 'kztd'; li.setAttribute('data-kztd', id);
        li.innerHTML = '<time></time><span><i class="kz-tx"></i></span><button type="button" class="kz-pcheck kztd-check" data-kztd-check="' + id + '" aria-pressed="false">' + TICK + '</button>';
      }
      if (li.parentNode !== ol) { if (prev) prev.after(li); else ol.appendChild(li); }   // c: a new row starts below; kzorder-1026f then puts it where the Plan tab has it (rows already in the list are never moved here)
      prev = li;
      txt(li.querySelector('time'), label(t)); txt(li.querySelector('.kz-tx'), name.trim());
      var b = li.querySelector('button');
      li.classList.toggle('done', on); b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', (on ? 'Undo: ' : 'Done: ') + name.trim());
    });
    // one count: plan items + to-dos
    var all = ol.querySelectorAll(':scope > li'), done = ol.querySelectorAll(':scope > li.done').length;
    var h = sec.querySelector('.kz-tsec-h'), n = h && h.querySelector('.kztd-n');
    if (h && !n) { n = document.createElement('span'); n.className = 'kz-tsec-n kztd-n'; var h2 = h.querySelector('h2'); h2.parentNode.insertBefore(n, h2.nextSibling); }
    txt(n, done + ' of ' + all.length);
  }
  // the stand-in check taps the real one (before any other handler sees it)
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kztd-check]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var real = document.querySelector('ul.kz-todos .kz-tcheck[data-tdo="' + b.getAttribute('data-kztd-check') + '"]');
    if (real) real.click();
    sync();
  }, true);
  var q = 0, mo = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('li.kztd, .kztd-n, .kztd-solo')) continue; if (!q) q = requestAnimationFrame(function () { q = 0; sync(); }); return; }
  });
  function boot() { sync(); mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'hidden', 'class'], characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzorder-1028.js ==== */
;try {
/* Oct 28 · replaces kzorder-1026m.js: smoother hold-to-move (no per-frame re-measure, no-bounce glide). */
/* Oct 26 m (from f: drag a task anywhere in the day, across Morning, Afternoon, Evening, Night and Anytime, with a dashed outline where it will land). Oct 26 (f, from e: Today mirrors the Plan tab's order exactly, to-dos mixed in by part of day and your order) (e, from d: re-applies whenever anything re-sorts the rows, so card corners follow the final order) (d, from b: Plan tab redesign support: group ends, checks on plan tasks, trimmed subtitles). Reorder a day's tasks.
   Plan tab: press and hold a task (0.4 s), drag it up or down inside its part of the day (Morning, Afternoon,
   Evening, Night, Anytime), let go. The others slide out of the way; each step gives a light tap.
   The order is saved per day in kz_order {"2026-10-26": ["p:<plan item id>", "t:<to-do id>", ...]}.
   Tasks without a saved place keep their usual order, after the ones you placed (a new to-do lands at the bottom
   of its group). Today shows the plan's tasks and your added to-dos in that same order.
   m: dragging a task into another part of the day moves it there (see the drag below). */
(function () {
  var K = window.KZ; if (!K || window.__kzOrd) return; window.__kzOrd = 1;
  var GR = [['am', 'Morning'], ['pm', 'Afternoon'], ['eve', 'Evening'], ['night', 'Night'], ['any', 'Anytime']];
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  function today() { try { return K.key(K.today()); } catch (e) { return ''; } }
  function orders() { try { return K.get('order', {}) || {}; } catch (e) { return {}; } }
  function save(day, keys) {
    var m = orders(), cut = '';
    try { cut = K.key(K.addDays(K.today(), -14)); } catch (e) {}
    Object.keys(m).forEach(function (d) { if (cut && d < cut) delete m[d]; });   // keep two weeks back
    m[day] = keys; K.set('order', m);
    post({ type: 'dirty' });
  }
  function rankOf(day) { var r = {}; (orders()[day] || []).forEach(function (k, i) { r[k] = i; }); return r; }
  function sortedPlanIds(day) {
    try { var p = K.plan && K.plan(day); return p ? p.items.slice().sort(K.planSort).map(function (x) { return x.id; }) : []; } catch (e) { return []; }
  }

  /* ---------------- Plan tab ---------------- */
  function grpOf(li) {   // same rule the Plan tab uses to group (kzpm-1025l)
    var sm = li.querySelector('.kz-tbody small:not(.kzq-sub)'), tx = sm ? sm.textContent.split('·')[0].trim() : '';
    for (var i = 0; i < 4; i++) if (tx === GR[i][1] || (K.partName && tx === K.partName(GR[i][0]))) return i;
    var m = tx.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) { var h = +m[1] % 12 + (/pm/i.test(m[3] || '') ? 12 : 0); if (!m[3]) h = +m[1]; return h < 12 ? 0 : h < 17 ? 1 : h < 21 ? 2 : 3; }
    return 4;
  }
  var page, list, week;
  function planDay() { var b = week && week.querySelector('[aria-selected="true"]'); return b && b.getAttribute('data-day'); }
  function planItems() {
    var day = planDay(), ids = sortedPlanIds(day), pi = 0;
    return [].slice.call(list.querySelectorAll(':scope > li.kz-todo')).map(function (li, i) {
      var k = li.getAttribute('data-todo') ? 't:' + li.getAttribute('data-todo') : (li.classList.contains('plan') && ids[pi] ? 'p:' + ids[pi++] : '');
      if (k && li.getAttribute('data-kzk') !== k) li.setAttribute('data-kzk', k);
      return { li: li, k: k, g: grpOf(li), i: i };
    });
  }
  function applyPlan() {
    if (!list) return;
    var day = planDay(); if (!day) return;
    var r = rankOf(day), arr = planItems(), last = -1;
    arr.forEach(function (x) { x.r = x.k && r[x.k] != null ? r[x.k] : 1000 + x.i; });
    arr.sort(function (a, b) { return a.g - b.g || a.r - b.r || a.i - b.i; });
    arr.forEach(function (x, j) {
      if (x.li.style.order !== String(j)) x.li.style.order = String(j);
      var lab = x.g !== last ? GR[x.g][1] : ''; last = x.g;
      if ((x.li.getAttribute('data-kzlab') || '') !== lab) { if (lab) x.li.setAttribute('data-kzlab', lab); else x.li.removeAttribute('data-kzlab'); }
    });
    // d: the last task of each group closes its card; rows read the same
    arr.forEach(function (x, j) {
      var end = !arr[j + 1] || arr[j + 1].g !== x.g;
      if (x.li.hasAttribute('data-kzend') !== end) { if (end) x.li.setAttribute('data-kzend', ''); else x.li.removeAttribute('data-kzend'); }
      dress(x, day);
    });
    return arr;
  }
  var TICK = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  function dress(x, day) {
    var li = x.li, sm = li.querySelector('.kz-tbody small:not(.kzq-sub)'), grp = GR[x.g][1];
    // subtitle: drop what the group heading already says and "from your plan"; keep an exact time or a date span.
    // The original <small> stays untouched (hidden): the Plan tab's own grouping reads it.
    if (sm) {
      var parts = sm.textContent.split('·').map(function (t) { return t.trim(); }).filter(function (t) { return t && !/^from your plan$/i.test(t) && !GR.some(function (g) { return t === g[1]; }); });
      var shown = parts.join(' · '), sub = li.querySelector('.kzq-sub');
      if (!sm.classList.contains('kzq-raw')) sm.classList.add('kzq-raw');
      if (!sub) { sub = document.createElement('small'); sub.className = 'kzq-sub'; sm.parentNode.insertBefore(sub, sm.nextSibling); }
      if (sub.textContent !== shown) sub.textContent = shown;
      if (sub.hidden !== !shown) sub.hidden = !shown;
    }
    // plan tasks get the same check as to-dos (today only, like to-dos)
    if (x.k && x.k.indexOf('p:') === 0 && day === today()) {
      var id = x.k.slice(2), it = null; try { it = (K.plan(day).items || []).filter(function (y) { return y.id === id; })[0]; } catch (e) {}
      var b = li.querySelector('.kzq-chk');
      if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'kzq-chk'; b.setAttribute('data-kzq-pid', id); b.innerHTML = TICK; li.appendChild(b); }
      var on = !!(it && it.done);
      if (b.classList.contains('on') !== on) b.classList.toggle('on', on);
      if (li.classList.contains('done') !== on) li.classList.toggle('done', on);
      b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', (on ? 'Undo: ' : 'Done: ') + ((it && it.txt) || ''));
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzq-chk'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var day = planDay(); if (!day || !K.togglePlanItem) return;
    K.togglePlanItem(day, b.getAttribute('data-kzq-pid'));
    post({ type: 'haptic', n: b.classList.contains('on') ? 1 : 2 }); post({ type: 'dirty' });
  }, true);
  // m: drag anywhere. Hold a task, then drag it up or down the whole day. Inside a part of the day the rows swap when
  // you pass half of a neighbour; past the last row of a part (or the first), the task steps into the next part of the
  // day, empty parts included, and the headings move with it. A dashed outline shows where it will land; the other
  // rows spring aside. Letting go in another part moves the task there (an exact time is cleared, since the time is
  // what put it in its old part). Past days only reorder inside a part.
  var HOLD = 380, drag = null, hold = null, startY = 0, startX = 0, curY = 0, eatClick = false;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function visual() { return applyPlan() || []; }
  function layoutTop(li) { var p = li.offsetParent; return (p ? p.getBoundingClientRect().top + scrollY : 0) + li.offsetTop; }
  function relabel(a) {   // the working order on screen: flex order, group headings, card ends
    a.forEach(function (x, j) {
      if (x.li.style.order !== String(j)) x.li.style.order = String(j);
      var lab = !a[j - 1] || a[j - 1].g !== x.g ? GR[x.g][1] : '';
      if ((x.li.getAttribute('data-kzlab') || '') !== lab) { if (lab) x.li.setAttribute('data-kzlab', lab); else x.li.removeAttribute('data-kzlab'); }
      var end = !a[j + 1] || a[j + 1].g !== x.g;
      if (x.li.hasAttribute('data-kzend') !== end) { if (end) x.li.setAttribute('data-kzend', ''); else x.li.removeAttribute('data-kzend'); }
    });
  }
  function ghostAt() {
    var d = drag, li = d.m.li, p = li.offsetParent; if (!p || !d.ghost) return;
    var r = p.getBoundingClientRect(), s = d.ghost.style;
    var lab = li.getAttribute('data-kzlab') || ''; if ((d.ghost.getAttribute('data-lab') || '') !== lab) { if (lab) d.ghost.setAttribute('data-lab', lab); else d.ghost.removeAttribute('data-lab'); }
    d.gtop = li.offsetTop;
    s.position = 'absolute'; s.top = (r.top + scrollY + li.offsetTop) + 'px'; s.left = (r.left + scrollX + li.offsetLeft) + 'px';   // pinned to the page: scrolling never moves it s.width = li.offsetWidth + 'px'; s.height = li.offsetHeight + 'px';
  }
  function begin(li) {
    var all = visual(), me = all.filter(function (x) { return x.li === li; })[0]; if (!me || !me.k) return;
    var day = planDay(), cross = !!day && day >= today();
    if (!cross && all.filter(function (x) { return x.g === me.g && x.k; }).length < 2) return;
    var items = all.map(function (x) { return { li: x.li, k: x.k, g: x.g }; });
    drag = { li: li, items: items, day: day, cross: cross, sy0: scrollY, y0: startY, top0: layoutTop(li), orig: items.map(function (x) { return x.k + x.g; }).join() };
    drag.m = items.filter(function (x) { return x.li === li; })[0]; drag.g0 = drag.m.g;
    var gh = document.createElement('div'); gh.className = 'kzo-ghost'; gh.setAttribute('aria-hidden', 'true'); document.body.appendChild(gh); drag.ghost = gh;
    li.classList.add('kzo-lift'); document.documentElement.classList.add('kzo-dragging');
    try { var sel = getSelection(); if (sel) sel.removeAllRanges(); } catch (e) {}
    post({ type: 'haptic', n: 1 }); try { navigator.vibrate(8); } catch (e) {}
    curY = startY; ghostAt(); requestAnimationFrame(function () { if (drag && drag.ghost) drag.ghost.classList.add('on'); }); loop();
  }
  function follow() {
    var d = drag, dy = d.top0 + (curY - d.y0) + (scrollY - d.sy0) - layoutTop(d.li);
    d.dy = dy; d.li.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0) scale(1.02)';
  }
  function change(fn) {   // FLIP: everyone but the lifted row springs from where it was to its new place
    var d = drag, others = d.items.filter(function (x) { return x !== d.m; }), before = others.map(function (x) { return x.li.getBoundingClientRect().top; });
    fn(); relabel(d.items); follow(); ghostAt();
    others.forEach(function (x, j) {
      var dl = before[j] - x.li.getBoundingClientRect().top; if (Math.abs(dl) < .5 || reduce || !x.li.animate) return;
      x.li.animate([{ transform: 'translate3d(0,' + dl.toFixed(1) + 'px,0)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,.8,.24,1)' });   // Oct 28: glide, no bounce (same as sections)
    });
    post({ type: 'tick' }); try { navigator.vibrate(4); } catch (e) {}
  }
  function step() {
    var d = drag, a = d.items, m = d.m, i = a.indexOf(m), li = m.li;
    var T = li.offsetTop, H = li.offsetHeight, c = T + H / 2 + (d.dy || 0), D = Math.max(H * .55, 30);
    var prev = a[i - 1], next = a[i + 1];
    var mid = function (x) { return x.li.offsetTop + x.li.offsetHeight / 2; };
    if (next && next.g === m.g && c > mid(next)) return change(function () { a[i] = next; a[i + 1] = m; });
    if (prev && prev.g === m.g && c < mid(prev)) return change(function () { a[i] = prev; a[i - 1] = m; });
    if (!d.cross) return;
    // past the edge of its part of the day: step into the next part (headings move, nothing swaps)
    if (c > T + H / 2 + D && m.g < 4 && (!next || next.g > m.g)) return change(function () { m.g++; });
    if (c < T + H / 2 - D && m.g > 0 && (!prev || prev.g < m.g)) return change(function () { m.g--; });
  }
  function loop() {
    if (!drag) return;
    var edge = 90, vh = innerHeight, y = curY;
    if (y < edge) scrollBy(0, -Math.ceil((edge - y) / 5)); else if (y > vh - edge) scrollBy(0, Math.ceil((y - (vh - edge)) / 5));
    follow(); step(); if (drag && drag.li.offsetTop !== drag.gtop) ghostAt(); requestAnimationFrame(loop);   // Oct 28: the ghost re-measures only when the row's slot moved (it re-measured every frame: a layout per frame)
  }
  function move(y) { curY = y; }
  function end(commit) {
    var d = drag; drag = null; if (!d) return;
    var li = d.li, from = d.dy || 0, gh = d.ghost;
    li.classList.remove('kzo-lift'); document.documentElement.classList.remove('kzo-dragging');
    li.style.transform = '';
    if (gh) { gh.classList.remove('on'); setTimeout(function () { gh.remove(); }, 220); }
    if (li.animate && !reduce && Math.abs(from) > .5) li.animate([{ transform: 'translate3d(0,' + from.toFixed(1) + 'px,0) scale(1.02)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.25,1.05)' });
    var moved = d.items.map(function (x) { return x.k + x.g; }).join() !== d.orig;
    if (commit && moved) {
      save(d.day, d.items.filter(function (x) { return x.k; }).map(function (x) { return x.k; }));
      if (d.m.g !== d.g0) {
        var part = GR[d.m.g][0], t = findTask(d.day, d.m.k), had = !!(t && t.time);
        saveTask(d.day, d.m.k, d.m.k.indexOf('p:') === 0 ? { part: part, t: undefined } : { part: part, time: '' });
        try { K.toast('Moved to ' + GR[d.m.g][1] + (had ? ' · exact time cleared' : '')); } catch (e) {}
      }
      post({ type: 'haptic', n: 2 });
    }
    applyPlan();
  }
  function planBoot() {
    page = document.getElementById('kz-plan-s1'); if (!page) return;
    list = page.querySelector('[data-p="day-list"]'); week = page.querySelector('[data-p="week"]'); if (!list || !week) return;
    list.classList.add('kzo-list');
    // run after the Plan tab's own grouping pass (its observer may fire after ours in the same batch)
    var soonPlan = function () { if (!drag) queueMicrotask(function () { if (!drag) applyPlan(); }); };
    new MutationObserver(soonPlan).observe(list, { childList: true });
    new MutationObserver(soonPlan).observe(week, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    // e: the Plan tab's own grouping pass can run after ours and re-sort the rows (style order / data-kzlab).
    // Whenever a row's order or heading changes, apply ours again; our writes are no-ops when nothing differs, so this settles.
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.parentNode === list && (ms[i].attributeName === 'style' || ms[i].attributeName === 'data-kzlab')) { soonPlan(); return; } } })
      .observe(list, { subtree: true, attributes: true, attributeFilter: ['style', 'data-kzlab'] });
    applyPlan();
    list.addEventListener('touchstart', function (e) {
      var li = e.target.closest && e.target.closest('li.kz-todo'); if (!li || e.touches.length !== 1) return;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      clearTimeout(hold); hold = setTimeout(function () { hold = null; begin(li); }, HOLD);
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; if (!t) return;
      if (hold && (Math.abs(t.clientX - startX) > 8 || Math.abs(t.clientY - startY) > 8)) { clearTimeout(hold); hold = null; }
      if (drag) { e.preventDefault(); e.stopPropagation(); move(t.clientY); }
    }, { passive: false, capture: true });
    function up(e) { clearTimeout(hold); hold = null; if (drag) { eatClick = true; setTimeout(function () { eatClick = false; }, 400); if (e && e.cancelable) e.preventDefault(); end(e.type !== 'touchcancel'); } }
    document.addEventListener('touchend', up, { capture: true });
    document.addEventListener('touchcancel', up, { capture: true });
    window.addEventListener('click', function (e) { if (eatClick) { eatClick = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.kzo-list li')) e.preventDefault(); }, true);
  }

  /* ---------------- Today ---------------- */
  var tq = 0;
  function partIdx(part, time) {   // the Plan tab's grouping: exact time by the hour, else the part of the day; none = Anytime
    if (time) { var h = +String(time).split(':')[0]; return h < 12 ? 0 : h < 17 ? 1 : h < 21 ? 2 : 3; }
    return { am: 0, pm: 1, eve: 2, night: 3 }[part] != null ? { am: 0, pm: 1, eve: 2, night: 3 }[part] : 4;
  }
  function applyToday() {
    var ol = document.querySelector('.kz-todosec .kz-plancard:not([hidden]) .kz-plan-list'); if (!ol) return;
    var day = today(), r = rankOf(day), ids = sortedPlanIds(day);
    var lis = [].slice.call(ol.querySelectorAll(':scope > li')); if (!lis.length) return;
    var info = {}, timeOf = {};
    try { (K.plan(day) || { items: [] }).items.forEach(function (it) { info['p:' + it.id] = partIdx(it.part, it.t); if (it.t && K.fmtTime) timeOf['p:' + it.id] = K.fmtTime(it.t); }); } catch (e) {}
    var tlist = []; try { tlist = K.todos() || []; } catch (e) {}
    tlist.forEach(function (t) { info['t:' + t.id] = partIdx(t.part, t.time); });
    // default order when you haven't moved something: the plan's tasks as planned, then your to-dos as added (same as the Plan tab)
    var base = {}; ids.forEach(function (id, n) { base['p:' + id] = n; }); tlist.forEach(function (t, n) { base['t:' + t.id] = 500 + n; });
    function k(li) {
      if (li.classList.contains('kztd')) return 't:' + li.getAttribute('data-kztd');
      var b = li.querySelector('[data-pid]'); return b ? 'p:' + b.getAttribute('data-pid') : '';
    }
    // a plan task with an exact time shows that time (Today otherwise says only the part of the day)
    lis.forEach(function (li) { var key = k(li), tm = li.querySelector('time'); if (tm && timeOf[key] && tm.textContent !== timeOf[key]) tm.textContent = timeOf[key]; });
    var want = lis.map(function (li, n) {
      var key = k(li);
      return { li: li, g: info[key] != null ? info[key] : 4, r: key && r[key] != null ? r[key] : 1000 + (base[key] != null ? base[key] : n), n: n };
    }).sort(function (a, b) { return a.g - b.g || a.r - b.r || a.n - b.n; }).map(function (x) { return x.li; });
    for (var i = 0; i < want.length; i++) if (lis[i] !== want[i]) { want.forEach(function (li) { ol.appendChild(li); }); break; }
  }
  function todayBoot() {
    if (!document.querySelector('.kz-todosec')) return;
    applyToday();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) if (ms[i].target.closest && ms[i].target.closest('.kz-plan-list')) { if (!tq) tq = requestAnimationFrame(function () { tq = 0; applyToday(); }); return; }
    }).observe(document.body, { subtree: true, childList: true });
  }
  window.addEventListener('storage', function (e) { if (e.key === 'kz_order') { applyPlan(); applyToday(); } });

  /* ---------------- Edit a task (Plan tab: tap it) ----------------
     Rename it, move it to another part of the day or an exact time, or delete it. Plan tasks change for that day
     only (the repeating plan, if on, is untouched); to-dos change everywhere they show. */
  var PARTS = [['am', 'Morning'], ['pm', 'Afternoon'], ['eve', 'Evening'], ['night', 'Night'], ['any', 'Anytime']];
  function partFromTime(t) { var h = +String(t).split(':')[0]; return h < 12 ? 'am' : h < 17 ? 'pm' : h < 21 ? 'eve' : 'night'; }
  function findTask(day, key) {
    if (key.indexOf('p:') === 0) { var p = K.plan && K.plan(day); var it = p && p.items.filter(function (x) { return x.id === key.slice(2); })[0]; return it ? { kind: 'plan', it: it, txt: it.txt, part: it.part || 'any', time: it.t || '' } : null; }
    var t = (K.todos() || []).filter(function (x) { return x.id === key.slice(2); })[0];
    return t ? { kind: 'todo', it: t, txt: t.txt, part: t.part || 'any', time: t.time || '' } : null;
  }
  function saveTask(day, key, ch) {
    if (key.indexOf('p:') === 0) {
      var p = K.plan(day); if (!p) return;
      var items = p.items.map(function (x) { return x.id === key.slice(2) ? Object.assign({}, x, ch) : x; }).filter(function (x) { return !x.__del; });
      K.savePlan(day, items);
    } else {
      var all = K.todos().map(function (x) { return x.id === key.slice(2) ? Object.assign({}, x, ch) : x; }).filter(function (x) { return !x.__del; });
      K.set('todos', all); document.dispatchEvent(new CustomEvent('kz:todos')); document.dispatchEvent(new CustomEvent('kz:changed'));
    }
    post({ type: 'dirty' }); try { if (K.notifyPlan) K.notifyPlan(); } catch (e) {}
  }
  var sheet = null;
  function closeSheet() {
    if (!sheet) return; var s = sheet; sheet = null;
    s.classList.remove('in'); setTimeout(function () { s.remove(); }, 260);
    document.body.classList.remove('kz-noscroll'); post({ type: 'pageScroll', on: true });
  }
  function openSheet(day, key) {
    var t = findTask(day, key); if (!t) return;
    closeSheet();
    var el = document.createElement('div'); el.className = 'kzo-sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Edit task');
    el.innerHTML = '<div class="kzo-bd" data-kzo="x"></div><div class="kzo-card">' +
      '<div class="kzo-grab" aria-hidden="true"></div><div class="kzo-h"><b>Edit task</b><button type="button" class="kzo-x" data-kzo="x" aria-label="Close">✕</button></div>' +
      '<label class="kzo-f"><span>Task</span><input class="kzo-name" maxlength="90" autocomplete="off"></label>' +
      '<div class="kzo-f"><span>When</span><div class="kzo-parts" role="radiogroup" aria-label="Part of the day">' +
      PARTS.map(function (p) { return '<button type="button" role="radio" data-part="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="kzo-f kzo-timef"><span>Exact time</span><div class="kzo-trow"><input type="time" class="kzo-time"><button type="button" class="kzo-clear" data-kzo="clear">No exact time</button></div></div>' +
      '<button type="button" class="kzo-save" data-kzo="save">Save</button>' +
      '<button type="button" class="kzo-del" data-kzo="del">Delete task</button>' +
      (t.kind === 'plan' ? '<p class="kzo-note">Changes this day only.</p>' : '') + '</div>';
    document.body.appendChild(el); sheet = el;
    var name = el.querySelector('.kzo-name'), time = el.querySelector('.kzo-time'), part = t.part === 'night' || t.part === 'any' || t.part === 'am' || t.part === 'pm' || t.part === 'eve' ? t.part : 'any';
    name.value = t.txt || ''; time.value = t.time || '';
    function paint() {
      el.querySelectorAll('[data-part]').forEach(function (b) { var on = b.getAttribute('data-part') === part && !time.value; b.setAttribute('aria-checked', String(on)); b.classList.toggle('on', on); });
      el.querySelector('.kzo-clear').hidden = !time.value;
    }
    paint();
    el.addEventListener('input', function (e) { if (e.target === time) { if (time.value) part = partFromTime(time.value); paint(); } });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button,[data-kzo]'); if (!b) return;
      if (b.hasAttribute('data-part')) { part = b.getAttribute('data-part'); time.value = ''; paint(); post({ type: 'tick' }); return; }
      var a = b.getAttribute('data-kzo');
      if (a === 'x') return closeSheet();
      if (a === 'clear') { time.value = ''; paint(); return; }
      if (a === 'save') {
        var nm = name.value.trim(); if (!nm) { name.focus(); name.classList.add('kzo-need'); return; }
        var ch = t.kind === 'plan' ? { txt: nm, part: part, t: time.value || '' } : { txt: nm, part: part, time: time.value || '' };
        if (t.kind === 'plan' && !time.value) delete ch.t;
        saveTask(day, key, ch); post({ type: 'haptic', n: 2 }); closeSheet(); return;
      }
      if (a === 'del') {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tap again to delete'; setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Delete task'; } }, 3000); return; }
        saveTask(day, key, { __del: 1 }); post({ type: 'haptic', n: 1 }); closeSheet();
      }
    });
    document.body.classList.add('kz-noscroll'); post({ type: 'pageScroll', on: false });
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
  }
  function editBoot() {
    if (!list) return;
    list.addEventListener('click', function (e) {
      if (eatClick || drag) return;
      if (e.target.closest('button,a,input')) return;   // the check and × keep their own jobs
      var li = e.target.closest('li.kz-todo'); if (!li) return;
      var day = planDay(), key = li.getAttribute('data-kzk'); if (!day || !key || day < today()) return;
      openSheet(day, key);
    });
  }
  function boot() { planBoot(); editBoot(); todayBoot(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzmedal-1026l.js ==== */
;try {
/* Oct 26 l · Struck-metal medals (James: "more realistic and really cool"). One hidden SVG sprite holds six metals
   (bronze, silver, gold, rose gold, platinum, aurora); each medal is a <use> of one: ridged rim, bevel, domed face,
   engraved rings, laurel from gold up, a star from platinum up, and a soft specular light. The metal follows the
   milestone's difficulty (days): <7 bronze, <30 silver, <100 gold, <300 rose gold, <730 platinum, then aurora.
   K.medalMetal(n), K.medalSVG(n) for new markup; the Milestones card's existing medals (.kzpc-md) are re-skinned in
   place. Static: no looping animation. Styles: kzmedal-1026l.css. */
(function () {
  var K = window.KZ; if (!K || K.__kzmedal) return; K.__kzmedal = 1;
  var M = {
    bronze: { hi: '#F6D2AE', mid: '#B87442', lo: '#5A2F12', deep: '#3E1F0A' },
    silver: { hi: '#FFFFFF', mid: '#C2C9D3', lo: '#5D6571', deep: '#3A4049' },
    gold: { hi: '#FFF3C4', mid: '#E2B93B', lo: '#7A5A0E', deep: '#4A3605', laurel: 1 },
    rose: { hi: '#FFE6DA', mid: '#E2967E', lo: '#7E3426', deep: '#4A1A12', laurel: 1 },
    platinum: { hi: '#F7FCFF', mid: '#B3C7D8', lo: '#40566A', deep: '#24323F', laurel: 1, star: 1 },
    aurora: { hi: '#FFF4D6', mid: '#E2B93B', lo: '#6A4A12', deep: '#3A2706', laurel: 1, star: 1, iri: 1 }
  };
  K.medalMetal = function (n) { n = +n || 0; return n >= 730 ? 'aurora' : n >= 300 ? 'platinum' : n >= 100 ? 'rose' : n >= 30 ? 'gold' : n >= 7 ? 'silver' : 'bronze'; };
  K.medalName = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', rose: 'Rose gold', platinum: 'Platinum', aurora: 'Aurora' };
  function laurel(c) { // two sprays of leaves around the lower half of the face, like a struck wreath
    var out = '';
    [-1, 1].forEach(function (side) {
      for (var i = 0; i < 7; i++) {
        var deg = side < 0 ? 158 - i * 11 : 22 + i * 11, a = deg * Math.PI / 180, r = 31.5, x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a), rot = deg + 90 - side * 30;
        out += '<ellipse cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" rx="3.9" ry="1.55" transform="rotate(' + rot.toFixed(1) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')" fill="' + c.lo + '" fill-opacity=".42" stroke="' + c.hi + '" stroke-opacity=".45" stroke-width=".35"/>';
      }
    });
    return out;
  }
  function star(c) {
    var pts = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.9 : 4.4; pts.push((50 + r * Math.cos(a)).toFixed(2) + ',' + (19 + r * Math.sin(a)).toFixed(2)); }
    return '<polygon points="' + pts.join(' ') + '" fill="' + c.lo + '" fill-opacity=".5" stroke="' + c.hi + '" stroke-opacity=".6" stroke-width=".4"/>';
  }
  function symbol(id) {
    var c = M[id], p = 'kzm-' + id;
    var field = c.iri
      ? '<radialGradient id="' + p + '-f" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#FFF6DA"/><stop offset=".28" stop-color="#FFC2E6"/><stop offset=".5" stop-color="#B9A4FF"/><stop offset=".72" stop-color="#7FE0F5"/><stop offset="1" stop-color="#3D7F9C"/></radialGradient>'
      : '<radialGradient id="' + p + '-f" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="' + c.hi + '"/><stop offset=".5" stop-color="' + c.mid + '"/><stop offset="1" stop-color="' + c.lo + '"/></radialGradient>';
    return '<symbol id="' + p + '" viewBox="0 0 100 100"><defs>' +
      '<linearGradient id="' + p + '-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.hi + '"/><stop offset=".42" stop-color="' + c.mid + '"/><stop offset=".78" stop-color="' + c.lo + '"/><stop offset="1" stop-color="' + c.mid + '"/></linearGradient>' +
      '<linearGradient id="' + p + '-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.deep + '"/><stop offset=".5" stop-color="' + c.mid + '"/><stop offset="1" stop-color="' + c.hi + '"/></linearGradient>' + field +
      '<radialGradient id="' + p + '-s" cx=".3" cy=".22" r=".46"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".55" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<circle cx="50" cy="50" r="49.5" fill="url(#' + p + '-r)"/>' +
      '<circle cx="50" cy="50" r="47" fill="none" stroke="' + c.deep + '" stroke-opacity=".5" stroke-width="2.6" stroke-dasharray="1.05 1.25"/>' +
      '<circle cx="50" cy="50" r="44.2" fill="url(#' + p + '-b)"/>' +
      '<circle cx="50" cy="50" r="40.6" fill="url(#' + p + '-f)"/>' +
      '<circle cx="50" cy="50" r="37" fill="none" stroke="' + c.deep + '" stroke-opacity=".32" stroke-width=".9"/>' +
      '<circle cx="50" cy="50" r="36.1" fill="none" stroke="' + c.hi + '" stroke-opacity=".5" stroke-width=".55"/>' +
      (c.laurel ? laurel(c) : '') + (c.star ? star(c) : '') +
      '<circle cx="50" cy="50" r="49.5" fill="url(#' + p + '-s)"/>' +
      '<path d="M14 62 A38 38 0 0 0 86 62" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="1.2"/>' +
      '</symbol>';
  }
  function sprite() {
    if (document.getElementById('kzm-sprite') || !document.body) return;
    var d = document.createElement('div'); d.id = 'kzm-sprite'; d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0" focusable="false">' + Object.keys(M).map(symbol).join('') + '</svg>';
    document.body.appendChild(d);
  }
  K.medalSVG = function (n, cls) { sprite(); return '<svg class="kzm-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#kzm-' + K.medalMetal(n) + '"/></svg>'; };
  // ribbon above an earned medal, in its metal's colours
  var RIB = { bronze: ['#7A4B2A', '#E8C9A3'], silver: ['#1F3A66', '#E9EEF5'], gold: ['#8A1C24', '#F2D27A'], rose: ['#7A2230', '#F6C2A8'], platinum: ['#0F4E5C', '#DDF3F8'], aurora: ['#4B2A8C', '#F7A8E0'] };
  K.medalRibbon = function (n) {
    var m = K.medalMetal(n), c = RIB[m], id = 'kzr-' + m;
    return '<svg class="kzm-rib" viewBox="0 0 60 40" aria-hidden="true" focusable="false" preserveAspectRatio="none"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".3" stop-color="' + c[0] + '"/><stop offset=".3" stop-color="' + c[1] + '"/><stop offset=".42" stop-color="' + c[1] + '"/><stop offset=".42" stop-color="' + c[0] + '"/><stop offset=".58" stop-color="' + c[0] + '"/><stop offset=".58" stop-color="' + c[1] + '"/><stop offset=".7" stop-color="' + c[1] + '"/><stop offset=".7" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[0] + '"/></linearGradient>' +
      '<linearGradient id="' + id + '-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".6" stop-color="#000" stop-opacity="0"/></linearGradient></defs>' +
      '<polygon points="4,0 28,0 34,40 18,40" fill="url(#' + id + ')"/><polygon points="32,0 56,0 42,40 26,40" fill="url(#' + id + ')"/>' +
      '<polygon points="4,0 28,0 34,40 18,40" fill="url(#' + id + '-sh)"/><polygon points="32,0 56,0 42,40 26,40" fill="url(#' + id + '-sh)"/></svg>';
  };
  // re-skin the Milestones card's medals (.kzpc-md with a number); the "next" one keeps its progress ring look
  function num(el) { var b = el.querySelector('b'); if (!b) return 0; var t = b.textContent.trim().toLowerCase(); return /k$/.test(t) ? parseFloat(t) * 1000 : parseFloat(t) || 0; }
  function paint() {
    document.querySelectorAll('.kzpc-md:not(.nxt):not([data-kzm])').forEach(function (el) {
      if (el.closest('.kzm')) return; // the new milestones list draws its own
      var n = num(el); if (!n) return; el.setAttribute('data-kzm', K.medalMetal(n));
      el.insertAdjacentHTML('afterbegin', K.medalSVG(n));
    });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { sprite(); paint(); } catch (e) {} }); }
  function boot() { sprite(); paint(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzach-1026l.js ==== */
;try {
/* Oct 26 l · Milestones, reworked (James: "make the medals more realistic and really cool; mix the balance in with the
   consistency; rework the way the milestones are"). Replaces kzach-1026j. Struck-metal medals from kzmedal-1026l.js.
   Next up: the closest medal across every track, big, with how far there is to go.
   Two tabs: Streak (days shown up, K.MILESTONES) and Consistency (Balanced days and All-done days in one list, in order
   of difficulty, each marked with its sign). Earned medals hang from a ribbon; locked ones are dark blanks with a ring
   that fills as you get closer. The old grid, its heading and "Next:" line are hidden, not removed (kzach-1024a draws
   them). Nothing new is stored except which tab you last opened (kz_mstab). Styles: kzach-1026l.css. */
(function () {
  var K = window.KZ; if (!K || K.__kzach2) return; K.__kzach2 = 1;
  var MORE = [[10, '10 days', 'Double digits. Keep going.'], [45, '45 days', 'Forty-five days. Over halfway to a habit.'], [75, '75 days', 'Seventy-five days. Past the habit line.'],
    [120, '4 months', 'Four months of showing up.'], [150, '150 days', 'One hundred fifty days. Rare air.'], [200, '200 days', 'Two hundred days. This is just who you are.'],
    [250, '250 days', 'Two hundred fifty days.'], [300, '300 days', 'Three hundred days. Almost a year.'], [500, '500 days', 'Five hundred days.'], [730, '2 years', 'Two years. Ancient.'], [1000, '1,000 days', 'One thousand days.']];
  function extend() {
    var M = K.MILESTONES; if (!Array.isArray(M) || M.__kzs) return;
    MORE.forEach(function (m) { if (!M.some(function (x) { return x[0] === m[0]; })) M.push(m); });
    M.sort(function (a, b) { return a[0] - b[0]; }); try { Object.defineProperty(M, '__kzs', { value: 1 }); } catch (e) {}
  }
  extend();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var RANK = function (v) { return v >= 730 ? 'Mythic' : v >= 300 ? 'Legendary' : v >= 100 ? 'Epic' : ''; };
  var LOCK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z"/></svg>';
  var SIGN = { bal: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/></svg>',
    all: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l4.5 4.5L20 6"/></svg>' };
  var TRK = [[7, '1 week'], [30, '1 month'], [66, 'Habit'], [100, '100 days'], [200, '200 days'], [365, '1 year']];
  function num(n) { return n >= 1000 ? (n / 1000) + 'k' : String(n); }
  var cache = null;
  function counts() {
    var done = K.get('done', {}) || {}, plans = K.get('plans', {}) || {}, sig = JSON.stringify([Object.keys(done).length, K.get('goals', []).length, Object.keys(plans).length, K.key(K.today())]) + (localStorage.getItem('kz_done') || '').length + (localStorage.getItem('kz_plans') || '').length;
    if (cache && cache.sig === sig) return cache;
    var goals = K.allGoals ? K.allGoals() : (K.goals ? K.goals() : []), tk = K.key(K.today()), days = {};
    for (var id in done) for (var d in (done[id] || {})) if (done[id][d] && d <= tk) days[d] = 1;
    var on = function (g, k) { return (!g.created || String(g.created).slice(0, 10) <= k) && (!g.archived || k < g.archived); };
    var pathOf = function (g) { try { return K.pathOf(g); } catch (e) { return g.path || ''; } };
    var bal = 0, con = 0;
    Object.keys(days).forEach(function (k) {
      var act = goals.filter(function (g) { return on(g, k); }); if (!act.length) return;
      var hit = function (g) { return !!(done[g.id] && done[g.id][k]); };
      // Balance: every branch you had a goal in got at least one step that day (needs two or more branches)
      var br = {}; act.forEach(function (g) { var p = pathOf(g); br[p] = br[p] || hit(g); });
      var names = Object.keys(br); if (names.length > 1 && names.every(function (p) { return br[p]; })) bal++;
      // Consistency: every goal you had that day done, and every task in that day's plan checked off
      var pl = plans[k], items = (pl && pl.items) || [];
      if (act.every(hit) && items.every(function (x) { return x.done; })) con++;
    });
    cache = { sig: sig, bal: bal, con: con }; return cache;
  }

  function ring(p, big) { var r = big ? 47 : 47, C = 2 * Math.PI * r; return '<svg class="kzm-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="' + r + '" class="kzm-rt"/><circle cx="50" cy="50" r="' + r + '" class="kzm-rf" stroke-dasharray="' + (C * p).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg>'; }
  function medal(n, got, p, big) {
    return '<span class="kzm-hang' + (big ? ' big' : '') + '">' + (got ? K.medalRibbon(n) : '') + '<span class="kzm-coin m-' + K.medalMetal(n) + (got ? ' got' : ' lock') + '">' +
      K.medalSVG(n) + '<b' + (n > 99 ? ' class="w3"' : '') + '>' + num(n) + '</b>' + (got ? '' : ring(p, big) + '<i class="kzm-lk">' + LOCK + '</i>') + '</span></span>';
  }
  function items() {
    var up = 0; try { up = K.daysShownUp(); } catch (e) {}
    var c = counts(), streak = (K.MILESTONES || []).map(function (m) { return { trk: 'streak', n: m[0], label: m[1], have: up }; });
    var cons = [];
    TRK.forEach(function (t) { cons.push({ trk: 'cons', kind: 'bal', n: t[0], label: t[1], have: c.bal }); cons.push({ trk: 'cons', kind: 'all', n: t[0], label: t[1], have: c.con }); });
    return { up: up, bal: c.bal, con: c.con, streak: streak, cons: cons };
  }
  var tab = (function () { var t = K.get('mstab', 'streak'); return t === 'cons' ? 'cons' : 'streak'; })();
  function cell(m) {
    var got = m.have >= m.n, left = m.n - m.have, p = got ? 1 : Math.max(0, Math.min(1, m.have / m.n)), r = RANK(m.n), metal = K.medalName[K.medalMetal(m.n)];
    var kind = m.kind ? '<span class="kzm-kind k-' + m.kind + '">' + SIGN[m.kind] + (m.kind === 'bal' ? 'Balanced' : 'All done') + '</span>' : '';
    var aria = esc(m.label) + (m.kind ? (m.kind === 'bal' ? ', balanced days' : ', all-done days') : ', days shown up') + ', ' + metal + (r ? ', ' + r : '') + (got ? ', earned' : ', ' + left + (left === 1 ? ' day' : ' days') + ' to go');
    return '<div class="kzm-cell' + (got ? ' got' : ' lock') + (r ? ' r-' + r.toLowerCase() : '') + '" role="img" aria-label="' + aria + '">' + medal(m.n, got, p) +
      kind + '<span class="kzm-l">' + esc(m.label) + '</span><em class="kzm-s">' + (got ? esc(r || metal) : 'in ' + left + (left === 1 ? ' day' : ' days')) + '</em></div>';
  }
  function html() {
    var D = items(), all = D.streak.concat(D.cons), earned = all.filter(function (m) { return m.have >= m.n; }).length;
    var next = all.filter(function (m) { return m.have < m.n; }).sort(function (a, b) { return (a.n - a.have) - (b.n - b.have) || a.n - b.n; })[0];
    var h = '<div class="kzm-h"><h3>Milestones</h3><em><b>' + earned + '</b> of ' + all.length + ' earned</em></div>';
    if (next) {
      var left = next.n - next.have, p = Math.max(0, Math.min(1, next.have / next.n));
      h += '<div class="kzm-next">' + medal(next.n, false, p, true) + '<div class="kzm-nt"><span class="kzm-nk">Next up</span><b>' + esc(next.label) + '</b>' +
        '<span class="kzm-nd">' + (next.trk === 'streak' ? 'Streak' : next.kind === 'bal' ? 'Balanced days' : 'All-done days') + ' · ' + left + (left === 1 ? ' day' : ' days') + ' to go · ' + esc(K.medalName[K.medalMetal(next.n)]) + (RANK(next.n) ? ' · ' + RANK(next.n) : '') + '</span>' +
        '<span class="kzm-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + next.n + '" aria-valuenow="' + next.have + '"><i style="width:' + (p * 100).toFixed(1) + '%"></i></span></div></div>';
    }
    h += '<div class="kzm-tabs" role="tablist" aria-label="Milestone tracks"><button type="button" role="tab" data-mt="streak" aria-selected="' + (tab === 'streak') + '">Streak <span>' + D.up + '</span></button>' +
      '<button type="button" role="tab" data-mt="cons" aria-selected="' + (tab === 'cons') + '">Consistency <span>' + (D.bal + D.con) + '</span></button></div>';
    if (tab === 'cons') h += '<p class="kzm-p"><span class="kzm-kind k-bal">' + SIGN.bal + 'Balanced</span> every branch got a step: <b>' + D.bal + '</b> &nbsp; <span class="kzm-kind k-all">' + SIGN.all + 'All done</span> every goal and the whole plan: <b>' + D.con + '</b></p>';
    else h += '<p class="kzm-p">Days you showed up: at least one step on any goal. <b>' + D.up + '</b> so far.</p>';
    h += '<div class="kzm-grid">' + (tab === 'cons' ? D.cons : D.streak).map(cell).join('') + '</div>';
    return h;
  }
  function paint() {
    var g = document.querySelector('.kza-badges'); if (!g) return;
    extend();
    var sec = g.parentNode, box = sec.querySelector(':scope > .kzm');
    if (!box) { box = document.createElement('div'); box.className = 'kzm'; sec.insertBefore(box, g); }
    if (!sec.classList.contains('kzm-on')) sec.classList.add('kzm-on');
    var h = html(); if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzm [data-mt]'); if (!b) return;
    tab = b.getAttribute('data-mt'); try { K.set('mstab', tab); } catch (er) {} paint();
  });
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { paint(); } catch (e) {} }); }
  function boot() {
    extend(); paint();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzm')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kz:changed', 'kz:step', 'kz:goals', 'kz:plan'].forEach(function (n) { document.addEventListener(n, function () { soon(); }); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzlite-1025w.js ==== */
;try {
/* Oct 25 w · goal page: the 7-row stage table becomes one line ("Next: Sprout in 2 days"); Kaizen 66 card: "Ends Dec 26". */
(function () {
  var K = window.KZ; if (!K || K.__kzlite) return; K.__kzlite = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function goal() {
    var g = document.querySelector('#kz-goalpage .kzg-goal'); if (!g) return;
    var row = Array.prototype.filter.call(g.querySelectorAll('.kzg-ms .kzg-mr'), function (r) { return !r.classList.contains('done') && !r.classList.contains('now'); })[0];
    var txt = row ? ((row.querySelector('.kzg-mn') || {}).textContent || '') + ' ' + ((row.querySelector('.kzg-mx') || {}).textContent || '') : '';
    var line = g.querySelector('.kzl-next');
    if (!txt.trim()) { if (line) line.remove(); return; }
    if (!line) { line = document.createElement('p'); line.className = 'kzl-next'; var bar = g.querySelector('.kzg-bar') || g.querySelector('.kzg-dayrow'); if (bar && bar.parentNode) bar.parentNode.insertBefore(line, bar.nextSibling); else g.appendChild(line); }
    var h = 'Next: <b>' + esc(row.querySelector('.kzg-mn').textContent) + '</b> ' + esc(row.querySelector('.kzg-mx').textContent);
    if (line.__h !== h) { line.__h = h; line.innerHTML = h; }
  }
  function k66() {
    var e = document.querySelector('.kzf-end'); if (!e) return;
    var m = /lands on (.+)$/.exec(e.textContent || ''); if (m) e.textContent = 'Ends ' + m[1];
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { goal(); k66(); } catch (e) {} }); }
  function boot() { soon(); new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzl-next')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzrow-1028.js ==== */
;try {
/* Oct 28 · replaces kzrow-1027.js: the swipe opens wide enough for every action button (Edit + Delete).
   Oct 25 zb (from za): Delete is a narrow iOS-size button (88 pt, James drew it); the whole row slides (no inner wrapper,
   which left re-drawn parts like "Day 1 starts now · Undo" floating in place). za: Delete hidden until you swipe. */
(function () {
  var K = window.KZ; if (!K || K.__kzrow) return; K.__kzrow = 'zb';   // kzrow-1027 replaces kzrow-1025zb (divider measures only when still)
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  function goal(id) { try { return K.goals().filter(function (g) { return g.id === id; })[0]; } catch (e) { return null; } }
  // ---- B: the line above Tomorrow ----
  function divider() {
    var t = document.querySelector('#kz-today-s1 .kz-tomorrow, .kz-today .kz-tomorrow');
    var all = document.querySelectorAll('.kzdv'), d = all[0] || null;
    for (var i = 1; i < all.length; i++) all[i].remove();   // only ever one line (redraws used to add another each time)
    if (!t || !t.parentNode) { if (d) d.hidden = true; return; }
    if (!d) { d = document.createElement('div'); d.className = 'kzdv'; d.setAttribute('role', 'separator'); d.innerHTML = '<i></i><span>LATER</span><i></i>'; }
    if (d.nextElementSibling !== t || d.parentNode !== t.parentNode) t.parentNode.insertBefore(d, t);
    // 1027: measuring (getComputedStyle / offsetHeight) forces the page to lay out; during a check-off glide this ran every
    // frame. The line is placed right away; whether it shows is checked once things are still (120 ms).
    if (t.hidden) { if (!d.hidden) d.hidden = true; return; }
    clearTimeout(divider.t); divider.t = setTimeout(function () { if (!t.isConnected) return; var show = !t.hidden && getComputedStyle(t).display !== 'none' && t.offsetHeight > 0; if (d.hidden === show) d.hidden = !show; }, 120);
  }
  // ---- daily habits: Delete only ----
  function mark() {
    Array.prototype.forEach.call(document.querySelectorAll('#kz-today-s1 .kz-grow[data-goal]'), function (r) {
      var g = goal(r.getAttribute('data-goal')), daily = !!(g && (g.kind === 'daily' || g.quit));
      if (r.classList.contains('kzr-daily') !== daily) r.classList.toggle('kzr-daily', daily);
    });
  }
  // ---- swipe left → a red Delete that takes half the row (daily habits and Quit habits); swipe right on a habit = done ----
  var open = null;
  var DEL = 88, OPEN = 96;
  function wrapQuit() {
    Array.prototype.forEach.call(document.querySelectorAll('.kzq-row'), function (row) {
      if (row.querySelector(':scope > .kzr-qdel')) return;
      var del = document.createElement('button'); del.type = 'button'; del.className = 'kzr-qdel'; del.textContent = 'Delete'; del.setAttribute('aria-label', 'Delete this habit');
      row.appendChild(del);
    });
  }
  // Oct 28: the swipe opens as far as its buttons need (Edit + Delete since Oct 26), not a fixed 96 pt that cut Delete off
  var BTN = 76, GAP = 8;
  function nBtns(row) { var gs = row && row.querySelector('.kz-gswipe'); if (!gs) return 1; var n = 0; Array.prototype.forEach.call(gs.children, function (b) { if (b.tagName === 'BUTTON' && getComputedStyle(b).display !== 'none') n++; }); return Math.max(1, n); }
  function widthFor(row) { var n = row && row.classList.contains('kzq-row') ? 1 : nBtns(row); return n === 1 ? DEL : n * BTN + (n - 1) * GAP; }
  function half(row) { return row ? widthFor(row) + 8 : OPEN; }
  function place(row, x, anim) {
    row.style.transition = anim ? 'transform .3s cubic-bezier(.22,.8,.24,1)' : 'none';
    row.style.transform = x ? 'translate3d(' + x + 'px,0,0)' : '';
    row.style.setProperty('--swp', String(Math.max(0, Math.min(1, -(x || 0) / (half(row) * 0.6)))));
    var gs = row.querySelector('.kz-gswipe'); if (gs) { gs.style.width = widthFor(row) + 'px'; gs.style.left = 'calc(100% + 8px)'; }
  }
  function shut(row) { if (!row) return; place(row, 0, true); row.classList.remove('kzr-open', 'kz-swopen'); if (open === row) open = null; setTimeout(function () { if (!row.classList.contains('kzr-open')) row.classList.remove('kzr-drag', 'kz-swiping'); }, 320); }
  function rowAt(t) { return t.closest && (t.closest('.kzq-row') || t.closest('#kz-today-s1 .kz-grow.kzr-daily')); }
  // the old swipe on these rows stops at a fixed 168 pt: this one replaces it there
  window.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' && rowAt(e.target) && !e.target.closest('.kz-gswipe, .kzr-qdel')) e.stopImmediatePropagation(); }, true);
  var st = null;
  document.addEventListener('touchstart', function (e) {
    var row = rowAt(e.target); if (open && open !== row) shut(open);
    if (!row || e.target.closest('.kzr-qdel, .kz-gswipe, input, textarea') || e.touches.length !== 1) { st = null; return; }
    var p = e.touches[0]; st = { row: row, x: p.clientX, y: p.clientY, base: row === open ? -half(row) : 0, on: false, at: 0, t: Date.now() };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!st) return; var p = e.touches[0], dx = p.clientX - st.x, dy = p.clientY - st.y;
    if (!st.on) { if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) { st = null; return; } if (Math.abs(dx) < 8) return; st.on = true; st.x = p.clientX; dx = 0; st.row.classList.add('kzr-drag', 'kz-swiping'); }
    e.preventDefault();
    var h = half(st.row), x = st.base + dx, quit = st.row.classList.contains('kzq-row');
    st.at = x > 0 ? (quit || st.base ? x * 0.2 : Math.min(x, 120) + Math.max(0, x - 120) * 0.35) : x < -h ? -h + (x + h) * 0.3 : x;
    place(st.row, st.at, false);
  }, { passive: false });
  document.addEventListener('touchend', function (e) {
    if (!st) return; var s = st; st = null; if (!s.on) return;
    var h = half(s.row), quit = s.row.classList.contains('kzq-row');
    if (s.at > 92 && !quit && !s.base) { place(s.row, 0, true); s.row.classList.remove('kzr-drag', 'kz-swiping'); var ck = s.row.querySelector('.kz-check:not(.done)'); if (ck) ck.click(); return; }
    if (s.at < -h * 0.4) { place(s.row, -h, true); s.row.classList.add('kzr-open', 'kz-swopen'); open = s.row; post({ type: 'tick' }); }
    else shut(s.row);
    // the tap that ends a swipe never opens the goal underneath
    var swallow = function (ev) { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click', swallow, true); setTimeout(function () { document.removeEventListener('click', swallow, true); }, 350);
  });
  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('.kzr-qdel'); if (!d) { if (open && !(e.target.closest && e.target.closest('.kzr-open .kz-gswipe'))) { var r = open; shut(r); if (e.target.closest && e.target.closest('.kzr-open') === r) { e.preventDefault(); e.stopPropagation(); } } return; }
    e.preventDefault(); e.stopPropagation();
    var row = d.closest('.kzq-row'), id = row.getAttribute('data-q'), g = goal(id);
    if (!window.confirm('Delete “' + (g ? g.name : 'this habit') + '” for good?')) { shut(row); return; }
    shut(row); if (K.removeGoal) K.removeGoal(id);
    try { ['kz:goals', 'kz:changed'].forEach(function (n) { document.dispatchEvent(new CustomEvent(n)); }); } catch (er) {}
  }, true);
  // ---- add sheet: an empty name never fails silently (iOS shows no "fill out this field" bubble in the app) ----
  function hints() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-sheet49 [data-t="gname"], .kz-sheet49 [data-gx="gname"]'), function (i) {
      var p = i.getAttribute('placeholder') || ''; if (p && !/^e\.g\. /.test(p)) i.setAttribute('placeholder', 'e.g. ' + p);
    });
  }
  document.addEventListener('submit', function (e) {
    var sh = e.target.closest && e.target.closest('.kz-sheet49'); if (!sh) return;
    var inp = sh.querySelector('[data-t="gname"], [data-gx="gname"]'); if (!inp || inp.closest('[hidden]') || inp.value.trim()) { var o = sh.querySelector('.kzr-need'); if (o) o.remove(); return; }
    e.preventDefault(); e.stopImmediatePropagation();
    var f = inp.closest('label') || inp; f.classList.remove('kzt-shake'); void f.offsetWidth; f.classList.add('kzt-shake');
    var need = sh.querySelector('.kzr-need');
    if (!need) { need = document.createElement('p'); need.className = 'kzr-need'; need.setAttribute('role', 'alert'); f.parentNode.insertBefore(need, f.nextSibling); }
    need.textContent = sh.classList.contains('kzq-on') ? 'Type your bad habit, or tap one below.' : 'Give it a name first, or tap a quick pick.';
    try { inp.focus(); } catch (er) {}
    post({ type: 'haptic', n: 3 });
  }, true);
  document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('[data-t="gname"], [data-gx="gname"]') && e.target.value.trim()) { var sh = e.target.closest('.kz-sheet49'), o = sh && sh.querySelector('.kzr-need'); if (o) o.remove(); } });
  document.addEventListener('click', function (e) { var pk = e.target.closest && e.target.closest('[data-q-pick], [data-kzp-pick]'); if (pk) setTimeout(function () { var sh = pk.closest('.kz-sheet49'), o = sh && sh.querySelector('.kzr-need'); if (o) o.remove(); }, 0); });
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { divider(); mark(); wrapQuit(); hints(); } catch (e) {} }); }
  function boot() { soon(); new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzdv, .kzr-qwrap, .kzr-need')) continue; if (ms[i].attributeName === 'placeholder' && /^e\.g\. /.test(t.getAttribute('placeholder') || '')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'placeholder'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== aa48ba3eb8fb.js ==== */
;try {

(function () {
  var K = window.KZ; if (!K) return;
  // Pillars belong to each person. These five are only the presets: anyone can rename, recolor,
  // delete or add pillars (saved as kz_pillars, synced). Preset ids stay stable so saved goals,
  // the goal library and quote tags keep matching even after a rename.
  K.PRESETS = [
    { id: 'health', name: 'Health', c1: '#B9E3C6', c2: '#6FB58A' },
    { id: 'mind', name: 'Mind', c1: '#BFD6F5', c2: '#6E98D6' },
    { id: 'wealth', name: 'Wealth', c1: '#F7E7A6', c2: '#D4AF37' },
    { id: 'relationships', name: 'Relationships', c1: '#F3C2CF', c2: '#D27D94' },
    { id: 'passion', name: 'Personal', c1: '#F6D3A8', c2: '#D98E3F' }
  ];
  K.PILLAR_COLORS = [['#B9E3C6', '#6FB58A'], ['#BFD6F5', '#6E98D6'], ['#F7E7A6', '#D4AF37'], ['#F3C2CF', '#D27D94'], ['#F6D3A8', '#D98E3F'],
    ['#D9C8F5', '#9B7FD6'], ['#B8ECEC', '#4FB3B3'], ['#F5C2B8', '#D9705C'], ['#E8F0A8', '#A7B83A'], ['#DCE2EA', '#9AA6B8']];
  K.MAX_PILLARS = 8; K.MIN_PILLARS = 2;
  function loadPillars() {
    var p = K.get('pillars', null);
    K.PATHS = Array.isArray(p) && p.length >= K.MIN_PILLARS ? p.filter(function (x) { return x && x.id && x.name; }) : K.PRESETS.map(function (x) { return Object.assign({}, x); });
    // "School" pillar is now "Education" (Oct 20); rename it once in saved pillars
    if (Array.isArray(p) && K.PATHS.some(function (x) { return /^school$/i.test(x.name); })) { K.PATHS.forEach(function (x) { if (/^school$/i.test(x.name)) x.name = 'Education'; }); K.set('pillars', K.PATHS); }
  }
  loadPillars();
  K.reloadPillars = loadPillars;
  K.pillar = function (id) { return K.PATHS.filter(function (x) { return x.id === id; })[0] || null; };
  function savePillars(list) { K.set('pillars', list); loadPillars(); document.dispatchEvent(new CustomEvent('kz:pillars')); document.dispatchEvent(new CustomEvent('kz:changed')); }
  K.addPillar = function (name, color) {
    name = String(name || '').trim().slice(0, 24); if (!name || K.PATHS.length >= K.MAX_PILLARS) return null;
    var used = K.PATHS.map(function (p) { return p.c2; }), c = color || K.PILLAR_COLORS.filter(function (x) { return used.indexOf(x[1]) < 0; })[0] || K.PILLAR_COLORS[K.PATHS.length % K.PILLAR_COLORS.length];
    var id = 'p' + Date.now().toString(36);
    savePillars(K.PATHS.concat([{ id: id, name: name, c1: c[0], c2: c[1] }])); return id;
  };
  K.updatePillar = function (id, o) {
    savePillars(K.PATHS.map(function (p) { if (p.id !== id) return p; var q = Object.assign({}, p);
      if (o.name != null && String(o.name).trim()) q.name = String(o.name).trim().slice(0, 24);
      if (o.color) { q.c1 = o.color[0]; q.c2 = o.color[1]; } return q; }));
  };
  // Delete a pillar. Its goals (active and archived) move to another pillar, so no progress is lost.
  K.deletePillar = function (id, moveTo) {
    if (K.PATHS.length <= K.MIN_PILLARS) return false;
    var rest = K.PATHS.filter(function (p) { return p.id !== id; }); if (!rest.some(function (p) { return p.id === moveTo; })) moveTo = rest[0].id;
    var mv = function (list) { return list.map(function (g) { if (K.pathOf(g) === id) { g = Object.assign({}, g); g.path = moveTo; } return g; }); };
    K.set('goals', mv(K.goals())); K.set('archived', mv(K.archived ? K.archived() : []));
    savePillars(rest); return true;
  };
  K.resetPillars = function () {
    var ids = K.PRESETS.map(function (p) { return p.id; });
    var mv = function (list) { return list.map(function (g) { if (ids.indexOf(K.pathOf(g)) < 0) { g = Object.assign({}, g); g.path = K.guessPath(g.name); } return g; }); };
    K.set('goals', mv(K.goals())); K.set('archived', mv(K.archived ? K.archived() : []));
    savePillars(K.PRESETS.map(function (x) { return Object.assign({}, x); }));
  };
  K.goalsIn = function (id) { return K.allGoals().filter(function (g) { return K.pathOf(g) === id; }).length; };
  var OLD = { physical: 'health', mental: 'mind', creative: 'passion', work: 'wealth', people: 'relationships' };
  var WORDS = {
    passion: /hobby|hobbies|passion|dirt ?bike|motorcycle|reptile|snake|lizard|gecko|collect|fish(ing)?\b|hunt|surf|skate|snowboard|ski\b|paint|draw|music|guitar|piano|drum|\bsing(ing)?\b|\bsongs?\b|photo|film|\bart\b|craft|garden|bake|dance|\bgames?\b|\bcars?\b|woodwork|camp|hike/i,
    wealth: /save|saving|money|\$|invest|stock|real estate|business|income|job|work|career|intern|brand|shop|trad|budget|debt|side hustle|sell|client|grade|gpa/i,
    health: /run|gym|lift|walk|stretch|sport|swim|water|hydrat|sleep|workout|jiu|bjj|wrestl|bike|yoga|eat|food|diet|healthy|meal|cook|protein|veg|fruit|steps|mile|marathon|push.?up|exercise|weight/i,
    relationships: /call|family|friend|mom|dad|grandma|grandpa|brother|sister|text|girlfriend|boyfriend|partner|date|people|volunteer|trust|kind to|drama|social/i,
    mind: /read|study|learn|book|class|course|language|code|chess|focus|travel|meditat|journal|breath|gratitude|calm|pray|phone|screen|write/i };
  // Guess a pillar from a goal's words: a custom pillar whose name appears in the goal wins, then preset keywords.
  K.guessPath = function (name) {
    name = name || ''; var low = name.toLowerCase();
    var own = (K.PATHS || []).filter(function (p) { return !WORDS[p.id] && p.name.length > 2 && low.indexOf(p.name.toLowerCase()) > -1; })[0]; if (own) return own.id;
    for (var k in WORDS) if (WORDS[k].test(name) && K.pillar(k)) return k;
    return (K.pillar('mind') || K.PATHS[0]).id;
  };
  K.pathOf = function (g) {
    var p = g.path && (K.pillar(g.path) ? g.path : (OLD[g.path] && K.pillar(OLD[g.path]) ? OLD[g.path] : null));
    return p || K.guessPath(g.name);
  };
  var PM = [1, 3, 5, 10, 15, 25, 40, 60, 100, 150, 250, 400, 600, 1000, 1500, 2500];
  var GM = [[1, 'First step', 'You started. Most people never do.'], [3, '3 days', 'Three times. It is becoming real.'], [5, '5 days', 'Five days. You are building trust with yourself.'], [7, '1 week', 'One week. This is who you are now.'], [14, '2 weeks', 'Two weeks. Your days are changing.'], [21, '3 weeks', 'Three weeks. It is starting to stick.'], [30, '1 month', 'A month. Look how far you have come.'], [50, '50 days', 'Fifty days of quiet, steady growth.'], [66, 'Habit', 'Habit formed. It is part of you now.'], [100, '100 days', 'One hundred days. A different person.'], [180, '6 months', 'Half a year of getting better.'], [365, '1 year', 'One year. Your tree is ancient now.']];
  // Skill tree goal branches count steps toward each goal (not days or streaks).
  var GS = [1, 3, 5, 10, 15, 25, 40, 60, 100, 150, 250, 400].map(function (m) { return [m, m + (m === 1 ? ' step' : ' steps'), m === 1 ? 'Your first step toward this goal.' : m + ' steps toward this goal.']; });
  K.MILESTONES = GM;
  var ROW = 88, OFF = 70;
  function nice(k) { return k ? new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''; }
  function keysOn(m) { return Object.keys(m).filter(function (k) { return m[k]; }).sort(); }
  function short(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // A day is complete when every goal you had that day got its step.
  // Every goal that ever counted: today's goals plus archived ones (their progress is kept).
  K.allGoals = function () { return K.goals().concat(K.archived ? K.archived() : []); };
  var activeOn = function (g, k) { return (!g.created || g.created <= k) && (!g.archived || k < g.archived); };
  // Days shown up: any step on any goal that day (the headline number).
  K.daysShownUp = function () {
    var done = K.get('done', {}), days = {};
    for (var id in done) Object.keys(done[id] || {}).forEach(function (k) { days[k] = 1; });
    return Object.keys(days).length;
  };
  // Perfect days: every goal active that day was done (stricter, shown smaller).
  K.daysCompleted = function () {
    var goals = K.allGoals(), done = K.get('done', {}); if (!goals.length) return 0;
    var days = {}; goals.forEach(function (g) { Object.keys(done[g.id] || {}).forEach(function (k) { days[k] = 1; }); });
    return Object.keys(days).filter(function (k) {
      var active = goals.filter(function (g) { return activeOn(g, k); });
      return active.length && active.every(function (g) { return done[g.id] && done[g.id][k]; });
    }).length;
  };
  // Completion rate per path over the last 14 days, from what was actually done.
  // Only current goals count. Today counts only once its step is done, so mornings are not punished.
  K.pathRates = function (days) {
    days = days || 14;
    var done = K.get('done', {}), goals = K.goals(), t = K.key(K.today()), out = {};
    K.PATHS.forEach(function (p) { out[p.id] = { id: p.id, name: p.name, color: p.c2, goals: 0, done: 0, due: 0, rate: null }; });
    goals.forEach(function (g) {
      var o = out[K.pathOf(g)]; if (!o) return; o.goals++;
      for (var i = 0; i < days; i++) {
        var k = K.key(K.addDays(K.today(), -i)); if (g.created && k < g.created) break;
        var hit = !!(done[g.id] && done[g.id][k]);
        if (k === t && !hit) continue;
        o.due++; if (hit) o.done++;
      }
    });
    K.PATHS.forEach(function (p) { var o = out[p.id]; if (o.due) o.rate = Math.round(100 * o.done / o.due); });
    // Share: how much of all completed steps (last 14 days) landed in each pillar. Even = 20% each.
    var total = 0; K.PATHS.forEach(function (p) { total += out[p.id].done; });
    K.PATHS.forEach(function (p) { out[p.id].share = total ? Math.round(100 * out[p.id].done / total) : 0; });
    return K.PATHS.map(function (p) { return out[p.id]; });
  };
  // Balance: how EVENLY completed steps are spread across all five pillars (last 14 days).
  // 100% = each pillar gets 20% of the steps. All steps in one pillar = 0%.
  // Health 6 · Mind 4 · Wealth 1 · Relationships 1 · Personal 1 → 54%. Empty pillars count as 0 steps.
  K.balance = function () {
    var P = K.pathRates();
    if (!P.some(function (o) { return o.goals; })) return null;
    var total = P.reduce(function (a, o) { return a + o.done; }, 0); if (!total) return 0;
    var dev = P.reduce(function (a, o) { return a + Math.abs(o.done / total - 1 / P.length); }, 0), worst = 2 * (1 - 1 / P.length);
    return Math.max(0, Math.round(100 * (1 - dev / worst)));
  };
  // Skill tree: each pillar is a small tree. Its trunk grows with the pillar's total steps;
  // each goal fans out as its own branch, one node per milestone reached (no filler dots),
  // so longer branches mean more real progress and no two pillars look alike.
  K.skillTree = function (opt) {
    opt = opt || {};
    var done = K.get('done', {}), goals = K.allGoals(), nodes0 = 0, nexts = [], unlocked = 0;
    var GAP = opt.only ? 29 : 40, TG = opt.only ? 30 : 52, ATT = 64, LABEL = opt.only ? 74 : 84, rad = Math.PI / 180;
    var only = opt.only, narrow = !!opt.only;
    var lanes = K.PATHS.filter(function (p) { return !only || p.id === only; }).map(function (p) {
      var bs = goals.filter(function (g) { return K.pathOf(g) === p.id; }).map(function (g) {
        var dates = Object.keys(done[g.id] || {}).sort();
        var reached = GS.filter(function (m) { return dates.length >= m[0]; }).length;
        return { key: 'g' + g.id, name: g.name + (g.archived ? ' (archived)' : ''), dates: dates, reached: reached, show: Math.min(GS.length, reached + 1) };
      });
      var all = []; bs.forEach(function (b) { all = all.concat(b.dates); }); all.sort();
      var reachedT = PM.filter(function (m) { return all.length >= m; }).length;
      return { p: p, branches: bs, dates: all, reached: reachedT, tshow: Math.min(PM.length, reachedT + 1) };
    });
    // geometry, relative to each trunk base (0,0), y grows upward as negative
    lanes.forEach(function (L) {
      var n = L.branches.length, longest = 0;
      L.branches.forEach(function (b) { longest = Math.max(longest, GAP * 1.15 + (b.show - 1) * GAP); });
      L.T = Math.max(L.tshow * TG * 0.75, longest * 0.85, n * 34 + 60, 90);
      L.left = 70; L.right = 70; L.top = L.T;
      L.branches.forEach(function (b, i) {
        // spread attach points up the trunk; sides alternate and sit at different heights
        var side = i % 2 ? -1 : 1, f = n === 1 ? 0.35 : 0.14 + 0.62 * i / (n - 1), y0 = -L.T * f;
        var a0 = narrow ? 30 - 12 * f : 50 - 22 * f, x = 0, y = y0, pts = [];
        for (var j = 0; j < b.show; j++) {
          var a = side * a0 * (1 - 0.7 * (j + 1) / Math.max(2, b.show)) * rad, len = j === 0 ? GAP * 1.15 : GAP;
          x += Math.sin(a) * len; y -= Math.cos(a) * len; pts.push([x, y]);
        }
        b.side = side; b.y0 = y0; b.pts = pts;
        pts.forEach(function (q) {
          if (side > 0) L.right = Math.max(L.right, q[0] + LABEL); else L.left = Math.max(L.left, -q[0] + LABEL);
          L.top = Math.max(L.top, -q[1] + 40);
        });
      });
      var plateW = Math.max(118, L.p.name.length * 10.5 + 34);
      L.plateW = plateW;
      L.left = Math.max(L.left, plateW / 2 + 14); L.right = Math.max(L.right, plateW / 2 + 14);
    });
    var x = 20; lanes.forEach(function (L) { L.x = x + L.left; x += L.left + L.right; });
    var W = only ? x + 20 : Math.max(opt.width || 390, x + 20), shift = (W - x - 20) / 2;
    lanes.forEach(function (L) { L.x += shift; });
    var maxTop = Math.max.apply(null, lanes.map(function (L) { return L.top; }));
    var base = maxTop + 40, H = base + (only ? 66 : 170), cx = W / 2, root = [cx, base + 130];
    var S = ['<svg class="kz-skill" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Skill tree">', '<defs><filter id="kzsb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>'];
    lanes.forEach(function (L) { S.push('<linearGradient id="kzp-' + L.p.id + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + L.p.c2 + '"/><stop offset="1" stop-color="' + L.p.c1 + '"/></linearGradient><radialGradient id="kzg-' + L.p.id + '"><stop offset="0" stop-color="' + L.p.c2 + '" stop-opacity=".45"/><stop offset="1" stop-color="' + L.p.c2 + '" stop-opacity="0"/></radialGradient>'); });
    S.push('<radialGradient id="kzg-root"><stop offset="0" stop-color="#D4AF37" stop-opacity=".4"/><stop offset="1" stop-color="#D4AF37" stop-opacity="0"/></radialGradient></defs>');
    // smooth path through points (Catmull-Rom to Bezier)
    var smooth = function (P) {
      var d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
      for (var i = 0; i < P.length - 1; i++) {
        var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
        d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      return d;
    };
    var stroke = function (d, L, on, w, flat) {
      if (on && flat) return '<path d="' + d + '" stroke="' + L.p.c2 + '" stroke-width="' + (w + 5) + '" fill="none" opacity=".2" filter="url(#kzsb)"/><path d="' + d + '" stroke="' + L.p.c2 + '" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>';
      if (on) return '<path d="' + d + '" stroke="' + L.p.c2 + '" stroke-width="' + (w + 5) + '" fill="none" opacity=".2" filter="url(#kzsb)"/><path d="' + d + '" stroke="url(#kzp-' + L.p.id + ')" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>';
      return '<path d="' + d + '" stroke="' + L.p.c2 + '" stroke-opacity=".5" stroke-width="2" fill="none" stroke-dasharray="5 5" stroke-linecap="round"/>';
    };
    var node = function (L, xx, yy, r, st, label, sub, info, id, showLabel, side) {
      var g = '<g class="kz-node ' + st + '" data-node="' + id + '" tabindex="0" role="button" aria-label="' + K.esc(label + ', ' + info) + '" data-label="' + K.esc(label) + '" data-info="' + K.esc(info) + '">';
      if (st === 'on') { unlocked++; g += (showLabel ? '<circle cx="' + xx + '" cy="' + yy + '" r="' + (r + 10) + '" fill="url(#kzg-' + L.p.id + ')"/>' : '') + '<circle cx="' + xx + '" cy="' + yy + '" r="' + r + '" fill="url(#kzp-' + L.p.id + ')"/>' + (showLabel ? '<path d="M' + (xx - 4.5) + ' ' + yy + ' l3.5 3.5 l6.5 -7" stroke="#0B0D12" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''); }
      else g += '<circle class="kz-pulse" cx="' + xx + '" cy="' + yy + '" r="' + r + '" fill="#121726" stroke="' + L.p.c2 + '" stroke-width="2" stroke-dasharray="4 3"/>';
      g += '<circle cx="' + xx + '" cy="' + yy + '" r="22" fill="transparent"/>';
      if (showLabel && label) {
        var tx = xx + side * (r + 7), anc = side > 0 ? 'start' : 'end';
        g += '<text x="' + tx + '" y="' + (yy + (sub ? 0 : 4)) + '" text-anchor="' + anc + '" class="kz-nl ' + st + '"' + (st === 'next' ? ' style="fill: ' + L.p.c1 + '"' : '') + '>' + K.esc(label) + '</text>';
        if (sub) g += '<text x="' + tx + '" y="' + (yy + 13) + '" text-anchor="' + anc + '" class="kz-ns">' + K.esc(short(sub, 16)) + '</text>';
      }
      return g + '</g>';
    };
    var lines = [], dots = [], plates = [];
    lanes.forEach(function (L) {
      var bx = L.x, by = base, at = function (q) { return [bx + q[0], by + q[1]]; }, act = L.dates.length > 0;
      // root to plate
      if (!only) lines.push(stroke('M' + root[0] + ' ' + root[1] + ' C' + root[0] + ' ' + (root[1] - 50) + ' ' + bx + ' ' + (by + 110) + ' ' + bx + ' ' + (by + 64), L, act, 4));
      // trunk with its milestone nodes, evenly spread
      var tpts = []; for (var j = 0; j < L.tshow; j++) tpts.push([bx, by - (j + 1) * L.T / L.tshow]);
      var lastOn = L.reached ? tpts[L.reached - 1] : [bx, by];
      lines.push(stroke('M' + bx + ' ' + by + ' L' + bx + ' ' + lastOn[1], L, act, 6, true));
      if (L.reached < L.tshow) lines.push(stroke('M' + bx + ' ' + lastOn[1] + ' L' + bx + ' ' + tpts[L.reached][1], L, false, 2));
      tpts.forEach(function (q, j) {
        var m = PM[j], st = j < L.reached ? 'on' : 'next';
        var info = st === 'on' ? L.p.name + ' · ' + m + (m === 1 ? ' step' : ' steps') + ' · ' + nice(L.dates[m - 1]) : L.p.name + ' · ' + (m - L.dates.length) + ' more to ' + m + ' steps';
        dots.push(node(L, q[0], q[1], j === L.reached - 1 ? 9 : 6, st, m + (m === 1 ? ' step' : ' steps'), '', info, L.p.id + '-' + j, false, 1));
      });
      // goal branches
      L.branches.forEach(function (b) {
        var P = [[0, b.y0]].concat(b.pts).map(at), on = P.slice(0, b.reached + 1);
        if (on.length > 1) lines.push(stroke(smooth(on), L, true, 3));
        if (b.reached < b.show) lines.push(stroke(smooth(P.slice(b.reached, b.reached + 2)), L, false, 2));
        b.pts.forEach(function (q, k) {
          var m = GS[k], st = k < b.reached ? 'on' : 'next', pt = at(q), latest = k === b.reached - 1;
          var info = st === 'on' ? b.name + ' · ' + m[1] + ' · ' + nice(b.dates[m[0] - 1]) : b.name + ' · ' + (m[0] - b.dates.length) + ' more ' + (m[0] - b.dates.length === 1 ? 'step' : 'steps') + ' to ' + m[1];
          dots.push(node(L, pt[0], pt[1], latest ? 11 : (st === 'next' ? 10 : 5.5), st, m[1], latest || (st === 'next' && !b.reached) ? b.name : '', info, b.key + '-' + k, latest || st === 'next', b.side));
          if (st === 'next') nexts.push({ label: m[1], sub: b.name, x: pt[0], y: pt[1], path: L.p.name, left: m[0] - b.dates.length });
        });
      });
      if (!L.branches.filter(function (b) { return b.key.charAt(0) === 'g'; }).length) dots.push('<a href="/pages/my-goals?pillar=' + L.p.id + '#add" class="kz-addpath"><text x="' + bx + '" y="' + (by - L.T - 22) + '" text-anchor="middle" class="kz-ns" style="fill: ' + L.p.c2 + '">+ add a goal</text></a>');
      // plate sized to the name
      plates.push('<g class="kz-plate" data-pillar="' + L.p.id + '" role="button" tabindex="0" aria-label="Show ' + L.p.name + ' goals"><rect x="' + (bx - L.plateW / 2) + '" y="' + (by + 8) + '" width="' + L.plateW + '" height="50" rx="14" fill="#0B0D12" stroke="' + (act ? L.p.c2 : '#283149') + '" stroke-opacity=".6"/>' +
        '<text x="' + bx + '" y="' + (by + 27) + '" text-anchor="middle" class="kz-pl" style="fill: ' + L.p.c1 + '">' + L.p.name.toUpperCase() + '</text><text x="' + bx + '" y="' + (by + 49) + '" text-anchor="middle" class="kz-pv" style="fill: ' + (act ? L.p.c1 : '#4A5266') + '">' + L.dates.length + '<tspan class="kz-pvs" dx="4">' + (L.dates.length === 1 ? 'step' : 'steps') + '</tspan></text></g>');
    });
    S.push(lines.join(''), '<g>' + dots.join('') + '</g>', plates.join(''));
    if (!only) S.push('<circle cx="' + root[0] + '" cy="' + root[1] + '" r="30" fill="url(#kzg-root)"/><circle cx="' + root[0] + '" cy="' + root[1] + '" r="20" fill="#0B0D12" stroke="#D4AF37" stroke-width="2"/><path transform="translate(' + (root[0] - 10) + ' ' + (root[1] - 9) + ') scale(.24)" d="M8 70 H80 L44 8 L26 39" fill="none" stroke="#D4AF37" stroke-width="10" stroke-linecap="square"/>');
    S.push('</svg>');
    nexts.sort(function (a, b) { return a.left - b.left; });
    var nx = nexts[0], top = lanes.slice().sort(function (a, b) { return b.dates.length - a.dates.length; })[0];
    return { svg: S.join(''), width: W, height: H, unlocked: unlocked, next: nx || null, focusX: nx ? nx.x : (top ? top.x : cx), focusY: nx ? nx.y : base - 60,
      steps: (function () { var n = 0; for (var id in done) n += Object.keys(done[id] || {}).length; return n; })(), branches: goals.length,
      paths: lanes.map(function (L) { return { id: L.p.id, name: L.p.name, level: L.reached, color: L.p.c2, x: L.x }; }) };
  };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 0bdb9342413e.js ==== */
;try {

(function () {
  var K = window.KZ; if (!K) return;
  K.SPECIES = {
    emerald: { name: 'Weeping Willow', leaf: ['#C6F7DD', '#6FDDA5', '#2FAE73', '#147A4C'], mass: ['#082016', '#0F3B27', '#185C3C'], bark: ['#2E1F10', '#7A5A2C', '#3E2A14'], shape: 'lance', bloom: '#F4FFF8', fruit: '#E9C547' },
    birch: { name: 'Silver Birch', leaf: ['#E8F2C8', '#B6D27A', '#7EA846', '#4E7A2A'], mass: ['#121A0A', '#223212', '#33481C'], bark: ['#E8E6E0', '#BDB8AE', '#3A3632'], shape: 'lance', bloom: '#F6FAE8', fruit: '#B6A06A' },
    oak: { name: 'English Oak', leaf: ['#D4EAA6', '#94C25A', '#5A9233', '#2E5A1A'], mass: ['#0F1E0B', '#1D3A15', '#2C5620'], bark: ['#2A2016', '#6E5438', '#3A2C1E'], shape: 'oak', bloom: '#E4EFC0', fruit: '#8A5A2B' },
    cherry: { name: 'Japanese Cherry', leaf: ['#FFF4F7', '#FCCFDD', '#F09DB8', '#C9617F'], mass: ['#2E1720', '#5A2A3D', '#8E4462'], bark: ['#2A1616', '#6A3C3C', '#3A2020'], shape: 'petal', bloom: '#FFFFFF', fruit: '#B3243E' },
    maple: { name: 'Sugar Maple', leaf: ['#FFD9A0', '#F5A04E', '#DE5A2C', '#A3301A'], mass: ['#2E120A', '#5C2414', '#8A3519'], bark: ['#30221A', '#70533A', '#3E2C1F'], shape: 'maple', bloom: '#FFE3B0', fruit: '#B5452A' },
    golden: { name: 'Maidenhair', leaf: ['#FFF6C4', '#F5D865', '#DDB53C', '#A8832A'], mass: ['#272009', '#4C3D10', '#7A6219'], bark: ['#30251A', '#78603C', '#40331F'], shape: 'fan', bloom: '#FFF8DA', fruit: '#E59A3A' },
    frost: { name: 'Norway Spruce', leaf: ['#D7EEEA', '#6FA89C', '#2F6B60', '#173F38'], mass: ['#06191A', '#0D2B2A', '#164441'], bark: ['#2A2420', '#6A5A4E', '#3A322C'], shape: 'needle', bloom: '#EAF6FF', fruit: '#7A5230', snow: true },
    jade: { name: 'Bodhi Tree', leaf: ['#E2FFF0', '#5FE0A0', '#12A866', '#06603A'], mass: ['#02160D', '#053A22', '#0A5A36'], bark: ['#2A2410', '#8A7A3A', '#4A3F1E'], shape: 'lance', bloom: '#F5D774', fruit: '#E2B93B' },
    midnight: { name: 'Jacaranda', leaf: ['#F3E6FF', '#C9A2F2', '#9A64D9', '#5E2F9E'], mass: ['#140A22', '#2A1446', '#45206E'], bark: ['#1C1426', '#4A3A5E', '#2A1F38'], shape: 'petal', bloom: '#FFFFFF', fruit: '#E2B93B' },
    inferno: { name: 'Japanese Maple', leaf: ['#FFE08A', '#FF9A3A', '#E5381C', '#8E0F0F'], mass: ['#2A0606', '#5A0E0A', '#8A1A10'], bark: ['#1A0F0C', '#4A2A1E', '#2A1810'], shape: 'maple', bloom: '#FFD34A', fruit: '#FF5A1F' },
    aurora: { name: 'Blue Atlas Cedar', leaf: ['#CFFFF4', '#5FE3C8', '#3A8FD9', '#5B3FA8'], mass: ['#061A1E', '#0D2E36', '#123F4A'], bark: ['#20242A', '#5A6270', '#30353E'], shape: 'needle', bloom: '#E8FFFF', fruit: '#9AE8FF' },
    obsidian: { name: 'Copper Beech', leaf: ['#B88A84', '#7A3E4A', '#4E2232', '#2A1018'], mass: ['#12060A', '#260C14', '#3A1420'], bark: ['#2A2624', '#7A726A', '#4A443F'], shape: 'oak', bloom: '#E8C8C0', fruit: '#8A5A2B' },
    celestial: { name: 'Rainbow Eucalyptus', leaf: ['#D8F2D0', '#8CCB7A', '#4E9A52', '#2A6038'], mass: ['#081A0E', '#123A1E', '#1E5A2E'], bark: ['#3A6AD9', '#E85A9A', '#F5A83B'], shape: 'lance', bloom: '#F0FFE8', fruit: '#F5A83B' },
    phoenix: { name: 'Flame Tree', leaf: ['#FFE0A0', '#FF8A3A', '#E8401C', '#9A1A10'], mass: ['#1E2A0E', '#2E4214', '#3E5A1A'], bark: ['#2A1E14', '#6E5240', '#3E2E22'], shape: 'fan', bloom: '#FFD34A', fruit: '#E8401C' },
    voidbloom: { name: 'Bristlecone Pine', leaf: ['#DCE8EE', '#8AA8B6', '#506E7E', '#2A4050'], mass: ['#081218', '#102028', '#1A3038'], bark: ['#3A3430', '#A89A88', '#5E554C'], shape: 'needle', bloom: '#F2F6F8', fruit: '#8A6A4A' },
  };
  var DEFAULT_NAME = 'Your tree'; // no default name: people name their own tree
  K.treeSpecies = function () { var s = K.get('tree', 'oak'); if (s === 'sprig') s = 'oak'; return K.SPECIES[s] ? s : 'oak'; }; // everyone starts with an English Oak
  K.sproutDemo = function () { return 1 / Math.max(1, (K.PATHS || []).length); }; // a just-planted tree: the same size it is after your first full day
  // The tree is you: it isn't named separately. Its label is the first name you gave at setup; sentences just say "your tree".
  K.treeNamed = function () { return false; };
  K.treeRef = function () { return 'your tree'; }; // for use mid-sentence
  K.treeName = function () { return DEFAULT_NAME; };
  K.treeLabel = function () { var n = String(K.get('username', '') || '').trim(); return n || DEFAULT_NAME; };
  // Existing name or type from earlier versions counts as already planted.
  K.treePlanted = function () { return !!(K.get('treeplanted', 0) || K.get('treename', '') || K.get('tree', null)); };
  K.plantTree = function (name, species) {
    K.set('treename', String(name || '').trim().slice(0, 20) || DEFAULT_NAME); if (K.SPECIES[species]) K.set('tree', species); K.set('treeplanted', 1);
    document.dispatchEvent(new CustomEvent('kz:changed')); K.track('kz_tree_planted', { species: species });
  };
  // After planting, any change stresses the tree: 2% of its height, every time.
  K.editTree = function (name, species) {
    var n = '', changed = K.SPECIES[species] && species !== K.treeSpecies();
    if (!changed) return false;
    var firstName = !K.treeNamed() && n && !(K.SPECIES[species] && species !== K.treeSpecies());
    if (n) K.set('treename', n); if (K.SPECIES[species]) K.set('tree', species);
    if (!firstName) K.set('treestress', (K.get('treestress', 0) || 0) + 1); K.set('treeplanted', 1);
    document.dispatchEvent(new CustomEvent('kz:changed')); K.track('kz_tree_edited'); return true;
  };
  K.pillarSteps = function () {
    var done = K.get('done', {}), out = {}; K.PATHS.forEach(function (p) { out[p.id] = 0; });
    K.allGoals().forEach(function (g) { var id = K.pathOf(g); if (id in out) out[id] += Object.keys(done[g.id] || {}).length; });
    return out;
  };
  // Water and health.
  // Water is a slow reservoir, not a snapshot. A new tree starts half full (50%). Every finished day moves it 30% of the way
  // toward that day's completion rate, so one bad day costs ~15 points and it takes several to kill a tree. Today only counts
  // when it helps: finish every goal and it's full (100%) right away; partial days pull it up part of the way; an unfinished day isn't charged until it's over.
  // Animals feel the day as it goes (energy): a 0% evening leaves them exhausted even if the tree still has water.
  // ---------- Real sky: sunrise, day, sunset and night behind the tree, from your phone's clock ----------
  // Sun times use the date and your time zone (NOAA formula, about 40°N, longitude from the standard time zone).
  K.sunTimes = function (d) {
    d = d || new Date(); var rad = Math.PI / 180, y0 = new Date(d.getFullYear(), 0, 1), doy = Math.floor((d - y0) / 864e5) + 1;
    var std = Math.max(new Date(d.getFullYear(), 0, 1).getTimezoneOffset(), new Date(d.getFullYear(), 6, 1).getTimezoneOffset()), lng = -std / 4, lat = 40;
    var g = 2 * Math.PI / 365 * (doy - 1), eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var ha = Math.acos(Math.max(-1, Math.min(1, Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec)) - Math.tan(lat * rad) * Math.tan(dec)))) / rad;
    var off = -d.getTimezoneOffset(); return { rise: 720 - 4 * (lng + ha) - eq + off, set: 720 - 4 * (lng - ha) - eq + off };
  };
  K.sky = function (d) {
    d = d || new Date(); var m = d.getHours() * 60 + d.getMinutes(), t = K.sunTimes(d), r = t.rise, s2 = t.set;
    var KEYS = [ // minutes, [top, middle, horizon], stars
      [r - 100, ['#05070F', '#0B1226', '#141E3A'], 1], [r - 30, ['#141A3E', '#3A2F5E', '#8A4F66'], .5], [r + 15, ['#2C3D78', '#C0647A', '#FFB070'], .1],
      [r + 90, ['#3E7FD6', '#7DB4EA', '#CFE6F6'], 0], [s2 - 100, ['#3A78D2', '#78AEE6', '#CBE3F4'], 0], [s2 - 25, ['#3A3F86', '#C8607A', '#FF9A4D'], 0],
      [s2 + 20, ['#1E1A4A', '#5A2E5E', '#B0485A'], .35], [s2 + 90, ['#05070F', '#0B1226', '#141E3A'], 1]];
    var LAND = ['night', 'night', 'dawn', 'day', 'day', 'golden', 'dusk', 'night'], c, st, land = [['night', 1]]; // the landscape lit for each key, crossfaded in between
    if (m <= KEYS[0][0] || m >= KEYS[KEYS.length - 1][0]) { c = KEYS[0][1]; st = 1; }
    else for (var i = 0; i < KEYS.length - 1; i++) if (m >= KEYS[i][0] && m < KEYS[i + 1][0]) { var u = (m - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]); c = [0, 1, 2].map(function (j) { return mix(KEYS[i][1][j], KEYS[i + 1][1][j], u); }); st = KEYS[i][2] + (KEYS[i + 1][2] - KEYS[i][2]) * u; land = LAND[i] === LAND[i + 1] || u < .02 ? [[LAND[i], 1]] : [[LAND[i], 1], [LAND[i + 1], u]]; break; }
    var sunU = (m - r) / (s2 - r), night = m > s2 ? (m - s2) / (r + 1440 - s2) : m < r ? (m + 1440 - s2) / (r + 1440 - s2) : -1;
    var phase = st > .8 ? 'night' : m < 720 && st > .05 ? 'dawn' : st > .05 || (m > s2 - 40 && m < s2 + 90) ? 'dusk' : 'day';
    return { c: c, land: land, stars: st, sun: sunU > -0.08 && sunU < 1.08 ? sunU : null, moon: night >= 0 ? night : null, phase: phase, warm: Math.max(0, 1 - Math.abs(sunU < .5 ? sunU : 1 - sunU) * 6) };
  };
  // A real soil cross-section (grass fringe, loam, stones, roots), dimmed after dark. With clip, only a slice of it is drawn:
  // laid over the base of a plant, it makes the stem or trunk go down into the ground instead of standing on top of it.
  var soilN = 0;
  K.soilLayer = function (x0, y0, w, h, GY, S, clip) {
    var BG = window.KZ_BG; if (!BG || !BG.soil) return ''; S = S || K.sky();
    var art = (window.KZ_ART || '/art/') + 'bg/', sw = w + 4, sh = Math.max(sw * BG.soil[1] / BG.soil[0], (y0 + h - GY + 12) / 0.9), sy = GY + 2 - sh * 0.095, o = '', cid = '';
    if (clip) { cid = 'kzsc' + (++soilN); o += '<clipPath id="' + cid + '"><path d="M' + (clip[0]).toFixed(1) + ' ' + (GY + 2.6).toFixed(1) + ' Q ' + ((clip[0] + clip[1]) / 2).toFixed(1) + ' ' + (GY + 0.8).toFixed(1) + ' ' + clip[1].toFixed(1) + ' ' + (GY + 2.6).toFixed(1) + ' V ' + (GY + 80).toFixed(1) + ' H ' + clip[0].toFixed(1) + ' Z"/></clipPath><g clip-path="url(#' + cid + ')">'; }
    var simg = '<image class="kz-soil" href="' + art + 'soil.webp" x="' + (x0 - 2).toFixed(1) + '" y="' + sy.toFixed(1) + '" width="' + sw.toFixed(1) + '" height="' + sh.toFixed(1) + '" preserveAspectRatio="xMidYMin slice"';
    o += simg + '/>';
    if (!clip) o += K.mirrorSides(simg, x0 - 2, sw);
    var dim = S.stars > .8 ? .62 : S.stars * .55 + (S.phase === 'dusk' ? .18 : 0);
    if (dim > .02) o += '<rect x="' + (x0 - 2).toFixed(1) + '" y="' + (GY - 2).toFixed(1) + '" width="' + sw.toFixed(1) + '" height="' + (sh + 400).toFixed(1) + '" fill="#05070F" opacity="' + Math.min(.7, dim).toFixed(2) + '"/>';
    return clip ? o + '</g>' : o;
  };
  // Wide cards show more than the art's width: fill each side with a mirror image of the plate, reflected about its
  // edge, so the meadow and soil run seamlessly to the card's edges instead of stopping short.
  K.mirrorSides = function (img, x, w) {
    // reflected about a line just inside each edge, so the copies overlap by a hair and no light seam shows at small sizes
    return img + ' transform="translate(' + (2 * x + 1.4).toFixed(1) + ',0) scale(-1,1)"/>' + img + ' transform="translate(' + (2 * (x + w) - 1.4).toFixed(1) + ',0) scale(-1,1)"/>';
  };
  K.skySVG = function (id, x0, y0, w, h, GY) {
    var S = K.sky(), c = S.c, o = '<defs><linearGradient id="' + id + 'sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".62" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'sun"><stop offset="0" stop-color="#FFFBE8"/><stop offset=".22" stop-color="' + (S.warm > .4 ? '#FFC35A' : '#FFF4C0') + '"/><stop offset=".3" stop-color="' + (S.warm > .4 ? '#FF9A3D' : '#FFE79A') + '" stop-opacity=".55"/><stop offset="1" stop-color="' + (S.warm > .4 ? '#FF7A2A' : '#FFF2B0') + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'moon"><stop offset="0" stop-color="#F4F2E8"/><stop offset=".3" stop-color="#E8E6DA"/><stop offset=".34" stop-color="#C8D4F0" stop-opacity=".3"/><stop offset="1" stop-color="#8AA0D8" stop-opacity="0"/></radialGradient></defs>';
    var top = y0 - 400, bot = GY + 6, X0 = x0 - 400, W2 = w + 800;
    o += '<rect class="kz-sky" data-phase="' + S.phase + '" x="' + X0.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + W2.toFixed(1) + '" height="' + (bot - top + 2).toFixed(1) + '" fill="url(#' + id + 'sk)"/>';
    if (S.stars > .05) { var r = function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
      for (var i = 0; i < 46; i++) { var sx = x0 - 40 + r(i) * (w + 80), sy = y0 - 30 + r(i + 99) * (GY - 30 - y0 + 30) * .85; o += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="' + (0.5 + r(i + 7) * 1.1).toFixed(2) + '" fill="#fff" opacity="' + (S.stars * (0.35 + r(i + 3) * 0.65)).toFixed(2) + '"/>'; } }
    var arc = function (u, rad) { var cx = x0 + w * (0.08 + 0.84 * u), cy = GY + 4 - Math.sin(Math.max(0, Math.min(1, u)) * Math.PI) * (GY - y0) * 0.78 + (u < 0 || u > 1 ? rad * 0.7 : 0); return [cx, cy]; };
    var SZ = Math.min(1.2, Math.max(0.5, h / 440)); // sun and moon keep the same size on screen whatever the zoom
    if (S.sun !== null) { var p = arc(S.sun, 30), R2 = (26 + S.warm * 10) * SZ; o += '<circle class="kz-sun" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (R2 * 3.2).toFixed(1) + '" fill="url(#' + id + 'sun)"/>'; }
    if (S.moon !== null && arc(S.moon, 14)[1] < GY - 16) { var q = arc(S.moon, 14); o += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (40 * SZ).toFixed(1) + '" fill="url(#' + id + 'moon)"/><circle cx="' + (q[0] + 4 * SZ).toFixed(1) + '" cy="' + (q[1] - 3 * SZ).toFixed(1) + '" r="' + (10.5 * SZ).toFixed(1) + '" fill="' + c[0] + '" opacity=".55"/>'; }
    var BG = window.KZ_BG, art = (window.KZ_ART || '/art/') + 'bg/';
    if (BG && BG.land) { // realistic hills, tree lines and haze; their bottom tucks under the mound
      var lw = W2 > w + 400 ? w + 4 : w + 4, lh = lw * BG.land[1] / BG.land[0], lx = x0 - 2, ly = GY + 3 - lh;
      S.land.forEach(function (L) { var im = '<image class="kz-land" href="' + art + 'land_' + L[0] + '.webp" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" width="' + lw.toFixed(1) + '" height="' + lh.toFixed(1) + '" preserveAspectRatio="none"' + (L[1] < 1 ? ' opacity="' + L[1].toFixed(2) + '"' : ''); o += im + '/>' + K.mirrorSides(im, lx, lw); });
    }
    // the ground under the mound: the same soil, getting darker with depth (no separate band)
    o += '<defs><linearGradient id="' + id + 'deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33251A"/><stop offset=".35" stop-color="#2A1F15"/><stop offset=".7" stop-color="#1F170F"/><stop offset="1" stop-color="#16100A"/></linearGradient></defs>';
    o += '<rect x="' + X0.toFixed(1) + '" y="' + (GY + 2).toFixed(1) + '" width="' + W2.toFixed(1) + '" height="320" fill="url(#' + id + 'deep)"/><rect x="' + X0.toFixed(1) + '" y="' + (GY + 321).toFixed(1) + '" width="' + W2.toFixed(1) + '" height="900" fill="#16100A"/>';
    if (BG && BG.soil) o += K.soilLayer(x0, y0, w, h, GY, S);
    return '<g class="kz-skyg">' + o + '</g>';
  };
  // Oct 21 (9pm) water model: water = how much of your long-term goals you finished.
  // It is safe overnight until WATER_SAFE_UNTIL (8am), then sinks toward what you've checked off today,
  // reaching it WATER_DRAIN_HOURS later (8pm). Checking goals off raises it right away; all done = 100%.
  K.WATER_SAFE_UNTIL = 8; K.WATER_DRAIN_HOURS = 12;
  K.waterStep = function (w, r, p) { var t = r * 100; if (r >= 1) return 100; if (t > w) return w + (t - w) * 0.55; return w + (t - w) * p; };
  K.treeHealth = function () {
    var done = K.get('done', {}) || {}, goals = K.allGoals(), today = K.today(), tk = K.key(today);
    var due = function (k) { return goals.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); }); };
    var rate = function (k) { var d = due(k); if (!d.length) return null; return d.filter(function (g) { return done[g.id] && done[g.id][k]; }).length / d.length; };
    var dueT = due(tk), doneT = dueT.filter(function (g) { return done[g.id] && done[g.id][tk]; }).length, rT = dueT.length ? doneT / dueT.length : null;
    var all = {}; for (var id in done) for (var d in (done[id] || {})) all[d] = 1;
    var list = Object.keys(all).sort(), steps = list.length;
    // No water until your first check-off. From that first day on, each day moves it 30% of the way to that day's rate.
    var W = 0, first = list.length && list[0] < K.key(today) ? list[0] : null, from = first ? new Date(first + 'T00:00:00') : today, floor = K.addDays(today, -150); if (from < floor) from = floor;
    var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (k) { rest[k] = 1; }); // shield days are rest days: no water lost
    for (var day = from, guard = 0, seeded = false; day < today && guard < 200; day = K.addDays(day, 1), guard++) { if (rest[K.key(day)]) continue; var r = rate(K.key(day)); if (r === null) continue; if (!seeded) { W = r * 100; seeded = true; } else W = K.waterStep(W, r, 1); }
    var yW = Math.round(W);
    var nowD = new Date(), hr = nowD.getHours() + nowD.getMinutes() / 60, drainP = Math.max(0, Math.min(1, (hr - K.WATER_SAFE_UNTIL) / K.WATER_DRAIN_HOURS));
    if (rT !== null) W = seeded ? K.waterStep(W, rT, drainP) : rT * 100; // first day: water = what you did
    var water = Math.round(W), energy = water;
    var wInfo = { safe: hr < K.WATER_SAFE_UNTIL, drainP: drainP, target: rT === null ? null : Math.round(rT * 100), left: dueT.length - doneT, carried: yW };
    var missed = 0;
    if (list.length) { var cur = new Date(list[0] + 'T00:00:00'), end = K.addDays(today, -1); while (cur <= end) { if (!all[K.key(cur)] && !rest[K.key(cur)]) missed++; cur = K.addDays(cur, 1); } }
    var since = list.length ? Math.round((today - new Date(list[list.length - 1] + 'T00:00:00')) / 864e5) : 0;
    var stress = K.get('treestress', 0) || 0;
    var status = !steps && !goals.length ? 'seed' : water >= 60 ? 'healthy' : water >= 40 ? 'thirsty' : water >= 25 ? 'wilting' : (water > 3 || since < 7) ? 'dying' : 'dead';
    if (!steps && goals.length) status = 'thirsty'; // planted, waiting for its first water
    if (steps && list.length <= 3 && (status === 'dying' || status === 'dead' || status === 'wilting')) status = 'thirsty'; // a brand-new tree gets a few days before it can look sick
    return { water: water, yWater: yW, energy: energy, wInfo: wInfo, rToday: rT, todayDone: doneT, todayDue: dueT.length, missed: missed, stress: stress, factor: Math.pow(0.99, missed) * Math.pow(0.98, stress), since: since, status: status, fresh: !steps,
      vitality: status === 'seed' || !steps ? 0.7 : Math.max(list.length <= 3 ? 0.55 : 0, Math.min(1, (water - 15) / 55)) };
  };
  K.treeMood = function (h) {
    var n = K.treeName();
    if (h.status === 'seed') return n + ' is a seed, waiting for the first completed goal.';
    if (h.fresh) return n + ' is waiting for its first water. Check off a goal.';
    if (h.status === 'healthy') return h.water >= 85 ? n + ' is thriving.' : n + ' is reaching for the sun.';
    return { thirsty: n + ' is thirsty.', wilting: n + '’s leaves are curling.', dying: n + ' is hanging on.', dead: n + ' lost its leaves. One step brings it back.' }[h.status];
  };
  // Growth is measured in days of care: each day adds (goals completed ÷ goals due). A perfect day = 1 growth day = 1 inch.
  // Same speed whether someone has 1 goal or 8. Penalties (1% per day with nothing done, 2% per edit) apply to the total.
  // Oct 21: growth multiplier = that day's plan multiplier (x1 with no plan; climbs as plan tasks get checked off, up to the plan's cap)
  K.growMult = function (k) { try { if (!K.planCap) return 1; var all = K._getRO ? K._getRO('plans', {}) : K.get('plans', {}), p = all && all[k], it = p && p.items || [], n = it.length; if (!n || n < (K.PLAN_MIN || 2)) return 1; var d = it.filter(function (x) { return x.done; }).length, cap = K.planCap(n), m = Math.round((1 + (cap - 1) * d / n) * 10) / 10; return m > 1 ? m : 1; } catch (e) { return 1; } }; /* Oct 22: same math as planStats, read-only and fast */
  K.treeGrowth = function () {
    var done = K.get('done', {}), goals = K.allGoals(), start = null, id, d;
    goals.forEach(function (g) { if (g.created && (!start || g.created < start)) start = g.created; });
    for (id in done) for (d in (done[id] || {})) if (!start || d < start) start = d;
    var o = { G0: 0, today: 0, week: 0 }; if (!start || !goals.length) return o;
    var end = K.today(), tk = K.key(end), wk = K.key(K.addDays(end, -6)), day = new Date(start.slice(0, 10) + 'T00:00:00'), guard = 0;
    while (day <= end && guard++ < 40000) {
      var k = K.key(day), due = 0, cnt = 0;
      goals.forEach(function (g) { if ((!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived)) due++; if (done[g.id] && done[g.id][k]) cnt++; });
      var r = cnt ? Math.min(1, cnt / Math.max(due, cnt)) : 0;
      if (r && K.growMult) r *= K.growMult(k); // Oct 21: the day plan's multiplier multiplies that day's growth (replaces the small flat bonus)
      o.G0 += r; if (k >= wk) o.week += r; if (k === tk) o.today = r;
      day = K.addDays(day, 1);
    }
    return o;
  };
  // Long, never-ending progression, in days of perfect care.
  var STAGES = [[0, 'Seed'], [0.01, 'Sprout'], [7, 'Seedling'], [30, 'Sapling'], [90, 'Young tree'], [180, 'Tree'], [365, 'Mature tree'], [730, 'Mighty tree'], [1825, 'Ancient tree'], [3650, 'Elder tree'], [7300, 'World tree']];
  K.TREE_STAGES = STAGES;
  K.treeStage = function (G) { var n = 'Seed'; STAGES.forEach(function (x) { if (G >= x[0]) n = x[1]; }); return n; };
  K.treeRings = function (G) { return Math.floor(G / 365); };
  K.treeNext = function (G) {
    for (var i = 2; i < STAGES.length; i++) if (G < STAGES[i][0]) return { at: STAGES[i][0], left: Math.ceil(STAGES[i][0] - G), label: STAGES[i][1] };
    var r = K.treeRings(G) + 1; return { at: r * 365, left: Math.ceil(r * 365 - G), label: 'growth ring ' + r };
  };
  // How big it looks: quick, visible change every day in the first weeks, slower every month, still growing at 20 years and beyond.
  var VA = [[0, 0], [1, 1], [3, 2], [7, 4], [14, 7], [30, 14], [60, 28], [90, 40], [180, 100], [365, 200], [730, 365], [1825, 1000], [3650, 2500], [7300, 5000]];
  K.treeVisual = function (G) {
    if (G <= 0) return 0;
    for (var i = 1; i < VA.length; i++) if (G <= VA[i][0]) { var a = VA[i - 1], b = VA[i]; return a[1] + (b[1] - a[1]) * (G - a[0]) / (b[0] - a[0]); }
    return 5000 * G / 7300;
  };
  K.treeHeight = function (G) {
    if (G < 12) { var v = Math.round(G * 10) / 10; return (v % 1 ? v.toFixed(1) : String(v)) + (v === 1 ? ' inch' : ' inches'); }
    var S = Math.round(G), f = Math.floor(S / 12), i = S % 12; return f + (f === 1 ? ' foot' : ' feet') + (i ? ' ' + i + ' in' : '');
  };
  K.treeInches = function (x) { var v = Math.round(x * 10) / 10; return (v % 1 ? v.toFixed(1) : String(v)) + ' in'; };
  K.treeWeek = function () { return K.treeGrowth().week; };
  // ---------- Calendar data: one day, one week ----------
  // grew = at least one goal completed (tree grew); setback = a past day after the first completed goal with nothing done (tree lost 1%).
  K._getRO = K._getRO || function (k, d) { return K.get(k, d); }; K._rover = K._rover || function () { return 0; };
  K._allRO = function () { var c = K._agc; if (c && c.v === K._rover()) return c.g; var g = K.allGoals(); K._agc = { v: K._rover(), g: g }; return g; };
  K.firstStepDay = function () { var c = K._fsd; if (c && c.v === K._rover()) return c.f; var done = K._getRO('done', {}) || {}, f = null; for (var id in done) for (var d in (done[id] || {})) if (!f || d < f) f = d; K._fsd = { v: K._rover(), f: f }; return f; };
  K.dayInfo = function (k, first) {
    var done = K._getRO('done', {}) || {}, tk = K.key(K.today()); first = first === undefined ? K.firstStepDay() : first;
    var AG = K._allRO(); var due = AG.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); });
    var hit = AG.filter(function (g) { return done[g.id] && done[g.id][k]; });
    var rate = hit.length ? Math.min(1, hit.length / Math.max(due.length, hit.length)) : 0;
    // Oct 21: gold (full) = every goal done; green (grew) = water ended above 50%; red (setback) = 50% or below
    var wd = K.waterByDay ? K.waterByDay()[k] : undefined;
    var status = k > tk ? 'future' : (hit.length && rate >= 1) ? 'full' : (wd === undefined || !due.length) ? (k === tk ? 'today' : 'none') : wd > 50 ? 'grew' : 'setback';
    return { key: k, due: due.length, hit: hit, rate: rate, water: wd, status: status, journal: (K._getRO('journal', {}) || {})[k] || '' };
  };
  // Water at the end of each day (today = right now), same rules as the tree's water
  K.waterByDay = function () {
    var now = Date.now(); if (K._wbd && now - K._wbdAt < 1500) return K._wbd; if (K._wbdBusy) return {};
    K._wbdBusy = true;
    try {
      var done = K.get('done', {}) || {}, goals = K.allGoals(), today = K.today(), tk = K.key(today), out = {};
      var due = function (k) { return goals.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); }); };
      var rate = function (k) { var d = due(k); if (!d.length) return null; return d.filter(function (g) { return done[g.id] && done[g.id][k]; }).length / d.length; };
      var all = {}; for (var id in done) for (var d in (done[id] || {})) all[d] = 1; var list = Object.keys(all).sort();
      if (list.length) {
        var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (x) { rest[x] = 1; });
        var W = 0, seeded = false, day = new Date(list[0] + 'T00:00:00'), floor = K.addDays(today, -150); if (day < floor) day = floor;
        for (var g2 = 0; day < today && g2 < 200; day = K.addDays(day, 1), g2++) { var dk = K.key(day); if (rest[dk]) { if (seeded) out[dk] = Math.round(W); continue; } var r = rate(dk); if (r === null) continue; if (!seeded) { W = r * 100; seeded = true; } else W = K.waterStep(W, r, 1); out[dk] = Math.round(W); }
        out[tk] = K.treeHealth().water;
      }
      K._wbd = out; K._wbdAt = now; return out;
    } finally { K._wbdBusy = false; }
  };
  K.weekRecap = function (end) { // the 7 days ending on `end` (a Date)
    var days = [], steps = 0, d = K.get('done', {}), rate = K.get('rate', {}), journal = K.get('journal', {}), i, best = null;
    for (i = 6; i >= 0; i--) days.push(K.key(K.addDays(end, -i)));
    var shown = days.filter(function (k) { return K.showedUp(k); }).length;
    days.forEach(function (k) { for (var id in d) if (d[id] && d[id][k]) steps++; });
    days.forEach(function (k) { var j = journal[k]; if (!j) return; var sc = (rate[k] || 0) * 1000 + j.length; if (!best || sc > best.sc) best = { k: k, j: j, sc: sc }; });
    var q = best && window.KZQ ? (window.KZQ.all || []).filter(function (x) { return x.d === best.k; })[0] : null;
    return { from: days[0], to: days[6], shown: shown, steps: steps, best: best ? { k: best.k, a: best.j, q: q && q.n ? q.n : '' } : null };
  };

  var rnd = function (s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  var f1 = function (n) { return (Math.round(n * 10) / 10).toString(); };
  var ease = function (x, k) { return 1 - Math.exp(-x / k); };
  var mix = function (a, b, t) { t = Math.max(0, Math.min(1, t)); var p = function (h, i) { return parseInt(h.slice(1 + i * 2, 3 + i * 2), 16); }; return '#' + [0, 1, 2].map(function (i) { return ('0' + Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16)).slice(-2); }).join(''); };
  var SHAPES = {
    lance: 'M0 -1.3 C0.55 -0.85 0.62 0.45 0 1.3 C-0.62 0.45 -0.55 -0.85 0 -1.3Z',
    oak: 'M0 -1.3 C.3 -1.15 .55 -1 .42 -.74 C.75 -.66 .82 -.34 .5 -.22 C.84 -.08 .8 .3 .46 .36 C.62 .64 .36 .92 0 1.3 C-.36 .92 -.62 .64 -.46 .36 C-.8 .3 -.84 -.08 -.5 -.22 C-.82 -.34 -.75 -.66 -.42 -.74 C-.55 -1 -.3 -1.15 0 -1.3Z',
    maple: 'M0 -1.35 L.22 -.62 L.82 -.9 L.6 -.24 L1.15 .02 L.5 .24 L.56 .86 L0 .46 L-.56 .86 L-.5 .24 L-1.15 .02 L-.6 -.24 L-.82 -.9 L-.22 -.62Z',
    fan: 'M0 1.15 L-1.2 -.72 C-.7 -1.32 .7 -1.32 1.2 -.72Z',
    petal: 'M0 -1.1 C1.2 -1.35 1.35 .4 0 1.1 C-1.35 .4 -1.2 -1.35 0 -1.1Z',
    needle: 'M0 1.3 L-.56 -1.25 L-.42 -1.3 L-.02 .82 L-.07 -1.45 L.07 -1.45 L.02 .82 L.42 -1.3 L.56 -1.25Z'
  };
  var uid = 0;
  // Each species grows its own silhouette, not just its own colors.
  // h/w: trunk height/width · ang: branch angle [base, change up the trunk] in degrees · len: branch length
  // at: where branches leave the trunk [low, high] · crown: crown layout · cw: crown width · flat: squashes leaf clusters into pads
  K.TREE_FORMS = {
    oak:       { h: 1.0,  w: 1.2,  ang: [62, -20], len: 1.12, crown: 'round', cw: 1.2 },
    birch:     { h: 1.2,  w: 0.72, ang: [32, -8],  len: 0.82, crown: 'oval', cw: 0.7, bark: 'birch' },
    emerald:   { h: 0.95, w: 1.05, ang: [68, -18], len: 1.08, crown: 'dome', cw: 1.15, weep: true },
    maple:     { h: 1.05, w: 1.0,  ang: [46, -14], len: 1.0,  crown: 'oval', cw: 1.0 },
    cherry:    { h: 0.72, w: 1.1,  ang: [76, -8],  len: 1.38, at: [0.72, 0.95], crown: 'umbrella', cw: 1.6, flat: 0.68 },
    golden:    { h: 1.22, w: 0.82, ang: [26, -6],  len: 0.78, crown: 'column', cw: 0.6 },
    frost:     { h: 1.15, w: 0.9,  ang: [84, -4],  len: 0.5,  cone: true, coneW: 0.95, flat: 0.55 },
    jade:      { h: 0.95, w: 1.35, ang: [68, -16], len: 1.3,  crown: 'round', cw: 1.5, roots: true },
    midnight:  { h: 0.84, w: 0.95, ang: [70, -10], len: 1.3,  at: [0.66, 0.95], crown: 'umbrella', cw: 1.5, flat: 0.74 },
    inferno:   { h: 0.6,  w: 1.0,  ang: [79, -6],  len: 1.38, at: [0.25, 0.85], crown: 'tiers', cw: 1.45, flat: 0.45 },
    aurora:    { h: 1.1,  w: 1.0,  ang: [86, -4],  len: 0.5,  cone: true, coneW: 1.3, flatTiers: true, flat: 0.42 },
    obsidian:  { h: 1.05, w: 1.25, ang: [62, -18], len: 1.15, crown: 'dome', cw: 1.35 },
    celestial: { h: 1.48, w: 0.88, ang: [40, -10], len: 0.82, at: [0.72, 0.95], crown: 'high', cw: 0.85, bark: 'rainbow' },
    phoenix:   { h: 0.8,  w: 1.05, ang: [77, -8],  len: 1.42, at: [0.7, 0.95], crown: 'umbrella', cw: 1.75, flat: 0.6 },
    voidbloom: { h: 0.82, w: 1.3,  ang: [72, -34], len: 0.92, crown: 'tufts', cw: 0.9, bark: 'twist', gnarl: true, sparse: 0.5, flat: 0.75 }
  };

  // opt: { fresh: pillarId, mini: true, lite: true, species: id, demo: steps-per-pillar }
  K.lifeTree = function (opt) {
    opt = opt || {};
    var spId = opt.species || K.treeSpecies(), SP = K.SPECIES[spId], P = K.PATHS, HL = opt.health || (opt.demo && !opt.real ? { water: 100, vitality: 1, status: 'healthy', factor: 1 } : K.treeHealth());
    var raw = opt.demo ? (function () { var o = {}; P.forEach(function (p) { o[p.id] = opt.demo; }); return o; })() : K.pillarSteps();
    // Size comes from days of care (G); each pillar's branch gets the share of growth its completions earned.
    var GR = opt.demo ? { G0: opt.demo * P.length, today: 0, week: 0 } : (opt.growth || K.treeGrowth());
    var G0 = GR.G0, G = G0 * HL.factor, Gy = Math.max(0, G0 - GR.today) * HL.factor, rawSum = 0; P.forEach(function (p) { rawSum += raw[p.id] || 0; });
    var V = opt.demo ? G0 : K.treeVisual(G), Vy = opt.demo ? V : K.treeVisual(Gy), todayP = {};
    if (!opt.demo && GR.today > 0) { var dn = K.get('done', {}), tk = K.key(K.today()); K.allGoals().forEach(function (g) { if (dn[g.id] && dn[g.id][tk]) { var pid = K.pathOf(g); todayP[pid] = (todayP[pid] || 0) + 1; } }); }
    var S0 = G0 > 0 ? Math.max(V, 0.001) : 0, S = V, steps = {}, stepsY = {};
    P.forEach(function (p) { var sh = rawSum ? (raw[p.id] || 0) / rawSum : 0; steps[p.id] = V * sh; stepsY[p.id] = Vy * sh; });
    var FM = K.TREE_FORMS[spId] || K.TREE_FORMS.oak, FY = FM.flat || 1, ANIM = false; // the tree holds still: redrawing a full-screen tree every frame made taps lag. Life comes from the animals and drifting leaves.
    var LEAFK = 1, dry = 1 - HL.vitality, dead = HL.status === 'dead', lite = (opt.lite ? 0.5 : 1) * (FM.sparse || 1);
    var DRY = ['#E8D58F', '#CDB45A', '#A88A3A', '#7A6428'], BROWN = ['#B88A55', '#94683A', '#6E4A28', '#4A3018'];
    var leafC = SP.leaf.map(function (c, i) { return dry < 0.5 ? mix(c, DRY[i], dry * 2) : mix(DRY[i], BROWN[i], (dry - 0.5) * 2); });
    var massC = SP.mass.map(function (c) { return mix(c, '#24190E', dry); });
    // the tree is lit by the same light as the landscape behind it: moonlit blue at night, dim at dusk, warm at golden hour
    var SKL = (!opt.demo || opt.real) && !opt.nosky ? K.sky() : null, NK = SKL ? Math.min(.6, SKL.stars * .6 + (SKL.phase === 'dusk' ? .14 : 0)) : 0, WM = SKL && SKL.sun !== null && SKL.phase !== 'night' ? SKL.warm * .14 : 0;
    var lit = function (c) { if (WM) c = mix(c, '#E89A50', WM); return NK ? mix(c, '#0C1426', NK) : c; };
    leafC = leafC.map(lit); massC = massC.map(lit);
    var id = 'kzt' + (++uid), W = 360, H = 440, GY = 384, CX = 180, reach = 70;
    var out = [], shadowL = [], back = [], limbs = [], mid = [], front = [], extras = [], fallen = [], dots = [], pts = [];
    var bx0 = CX - 60, bx1 = CX + 60, by0 = GY - 40; var hit = function (x, y, r) { r = r || 0; bx0 = Math.min(bx0, x - r); bx1 = Math.max(bx1, x + r); by0 = Math.min(by0, y - r); };
    var LS = SHAPES[SP.shape];
    var barkTop = (dead ? ['#2A2622', '#6B6258', '#36312C'] : SP.bark).map(lit);
    var defs = '<defs><path id="' + id + 'lf" d="' + LS + '"/><path id="' + id + 'vn" d="M0 -1 L0 1' + (SP.shape === 'lance' || SP.shape === 'oak' ? ' M0 -.3 L.35 -.6 M0 .1 L-.35 -.2 M0 .4 L.32 .15' : '') + '"/>' +
      '<radialGradient id="' + id + 'sky" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="' + (dead ? '#5C6578' : '#E8D9A8') + '" stop-opacity=".08"/><stop offset=".5" stop-color="' + (dead ? '#5C6578' : '#A3A8B0') + '" stop-opacity=".03"/><stop offset="1" stop-color="#06070A" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + barkTop[2] + '"/><stop offset=".28" stop-color="' + barkTop[1] + '"/><stop offset=".62" stop-color="' + mix(barkTop[1], barkTop[0], .45) + '"/><stop offset="1" stop-color="' + barkTop[0] + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + lit('#45321F') + '"/><stop offset=".6" stop-color="' + lit('#3A2A1B') + '"/><stop offset="1" stop-color="' + lit('#33251A') + '"/></linearGradient>' +
      [0, 1, 2].map(function (i) { return '<linearGradient id="' + id + 'l' + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + leafC[i] + '"/><stop offset="1" stop-color="' + leafC[i + 1] + '"/></linearGradient>'; }).join('') +
      '<linearGradient id="' + id + 'lt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + lit(mix(SP.leaf[0], '#FFFFFF', .45)) + '"/><stop offset="1" stop-color="' + lit(mix(SP.leaf[1], '#E8FF9A', .4)) + '"/></linearGradient>' +
      (SP.snow ? '<linearGradient id="' + id + 'snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CFE3F2"/></linearGradient>' : '') +
      '<radialGradient id="' + id + 'sh"><stop offset="0" stop-color="#000" stop-opacity=".9"/><stop offset=".55" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      [1, 2].map(function (i) { return '<radialGradient id="' + id + 'm' + i + '"><stop offset="0" stop-color="' + massC[i] + '"/><stop offset=".6" stop-color="' + massC[i] + '" stop-opacity=".8"/><stop offset="1" stop-color="' + massC[i] + '" stop-opacity="0"/></radialGradient>'; }).join('') +
      // 3D light on every leaf cluster: lit from the upper left, core shadow lower right
      '<radialGradient id="' + id + 'vol" cx=".32" cy=".26" r=".85"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".30"/><stop offset=".38" stop-color="#FFF6D8" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>' +
      // trunk as a cylinder: rim light left, shadow right
      '<linearGradient id="' + id + 'cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".18" stop-color="#FFF2D8" stop-opacity=".22"/><stop offset=".42" stop-color="#FFF2D8" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>' +
      '<radialGradient id="' + id + 'gold"><stop offset="0" stop-color="#D4AF37" stop-opacity=".35"/><stop offset="1" stop-color="#D4AF37" stop-opacity="0"/></radialGradient></defs>';
    out.push('<rect x="-100" y="-100" width="' + (W + 200) + '" height="' + (H + 200) + '" fill="url(#' + id + 'sky)"/>');
    var leaf = function (x, y, sz, rot, shade, cls, vein) {
      return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + Math.round(rot) + ') scale(' + f1(sz) + ')"><use' + (cls ? ' class="' + cls + '"' : '') + ' href="#' + id + 'lf" fill="url(#' + id + 'l' + shade + ')"/>' +
        (vein && SP.shape !== 'petal' ? '<use href="#' + id + 'vn" stroke="' + mix(leafC[3], '#000000', .3) + '" stroke-width=".07" opacity=".6" fill="none"/>' : '') + '</g>';
    };
    var REALBG = !!(window.KZ_BG && (!opt.demo || opt.real) && !opt.nosky); // the rendered soil and meadow replace the drawn mound, pebbles and grass
    var ground = function () {
      if (REALBG) return '<ellipse cx="' + CX + '" cy="' + (GY + 1) + '" rx="' + f1(Math.max(18, reach * 0.35)) + '" ry="4" fill="url(#' + id + 'sh)" opacity=".45"/>';
      var g = '' +
        '<path d="M22 ' + (GY + 16) + ' C 80 ' + (GY - 13) + ', 280 ' + (GY - 13) + ', 338 ' + (GY + 16) + ' Z" fill="url(#' + id + 'soil)"/>' +
        ''; 
      for (var i = 0; i < 9; i++) g += '<ellipse cx="' + f1(60 + rnd(i + 400) * 240) + '" cy="' + f1(GY + 5 + rnd(i + 410) * 7) + '" rx="' + f1(1.6 + rnd(i + 420) * 2.6) + '" ry="' + f1(1.2 + rnd(i + 430) * 1.2) + '" fill="' + lit(mix('#5A4A3A', '#8A7A66', rnd(i + 440))) + '"/>';
      for (i = 0; i < 70; i++) { var gx = 40 + rnd(i + 900) * 280, gh = (5 + rnd(i + 950) * 11) * (0.45 + 0.55 * (1 - dry)), gy = GY + 4 - Math.sin(Math.max(0.03, Math.min(0.97, (gx - 22) / 316)) * Math.PI) * 15 + 7;
        g += '<path d="M' + f1(gx) + ' ' + f1(gy) + ' q ' + f1((rnd(i) - 0.5) * 5) + ' ' + f1(-gh * 0.6) + ' ' + f1((rnd(i + 7) - 0.5) * 7) + ' ' + f1(-gh) + '" stroke="' + lit(mix(['#1E4A2E', '#2C6A44', '#3E8456'][i % 3], '#6B5A33', dry)) + '" stroke-width="' + f1(0.8 + rnd(i + 3) * 0.6) + '" fill="none" stroke-linecap="round"/>'; }
      return g;
    };
    // tapered limb as a filled shape
    var seg = function (x, y, ang, len, w0, w1, bend) {
      var ex = x + Math.sin(ang) * len, ey = y - Math.cos(ang) * len, cx = x + Math.sin(ang - bend) * len * 0.55, cy = y - Math.cos(ang - bend) * len * 0.55;
      var nx = Math.cos(ang), ny = Math.sin(ang);
      var d = 'M' + f1(x - nx * w0 / 2) + ' ' + f1(y - ny * w0 / 2) + ' Q ' + f1(cx - nx * (w0 + w1) / 4) + ' ' + f1(cy - ny * (w0 + w1) / 4) + ' ' + f1(ex - nx * w1 / 2) + ' ' + f1(ey - ny * w1 / 2) +
        ' L' + f1(ex + nx * w1 / 2) + ' ' + f1(ey + ny * w1 / 2) + ' Q ' + f1(cx + nx * (w0 + w1) / 4) + ' ' + f1(cy + ny * (w0 + w1) / 4) + ' ' + f1(x + nx * w0 / 2) + ' ' + f1(y + ny * w0 / 2) + 'Z';
      limbs.push('<path d="' + d + '" fill="url(#' + id + 'bark)"/>');
      if (w0 > 3) limbs.push('<path d="' + d + '" fill="url(#' + id + 'cyl)"/>');
      hit(ex, ey, w0); return { x: ex, y: ey };
    };
    // branches fork 1 to 3 levels deep, bending upward, with side twigs
    var grow = function (x, y, ang, len, w, depth, maxDepth, seed, tips) {
      var e = seg(x, y, ang, len, w, w * 0.62, (rnd(seed) - 0.5) * 0.3 + (ang > 0 ? 0.18 : -0.18));
      if (depth >= maxDepth || len < 9) { tips.push({ x: e.x, y: e.y, w: 1 / (depth + 1) }); return; }
      var n = depth === 0 ? 2 : (rnd(seed + 5) > 0.5 ? 2 : 3);
      for (var i = 0; i < n; i++) {
        var spread = (i - (n - 1) / 2) * (0.5 + rnd(seed + i) * 0.25), up = ang * 0.82;
        grow(e.x, e.y, up + spread, len * (0.6 + rnd(seed + i * 3) * 0.16), w * 0.6, depth + 1, maxDepth, seed * 7 + i * 13, tips);
      }
      var tx = (x + e.x) / 2, ty = (y + e.y) / 2, ta = ang + (rnd(seed + 9) > 0.5 ? 0.7 : -0.7), t2 = seg(tx, ty, ta, len * 0.28, Math.max(0.8, w * 0.28), 0.6, 0.1);
      tips.push({ x: t2.x, y: t2.y, w: 0.25 });
    };
    // a foliage cluster: dark core, sunlit edge from the upper left, individual leaves on top
    var foliage = function (cx, cy, r, count, seed, freshMark, countY) {
      if (count <= 0) return;
      hit(cx, cy, r * 1.1);
      var keep = dead ? 0 : Math.round(count * (1 - Math.max(0, dry - 0.3) * 1.25)), drop = Math.min(30, count - keep);
      if (keep > 2) {
        if (r > 14 && shadowL.length < 14) shadowL.push('<ellipse cx="' + f1(cx + 8) + '" cy="' + f1(GY + 4) + '" rx="' + f1(r * 0.9) + '" ry="' + f1(r * 0.16) + '" fill="url(#' + id + 'sh)" opacity=".35"/>');
        for (var b = 0; b < 5; b++) { var a = b / 5 * Math.PI * 2 + seed, rr = r * (0.42 + 0.22 * rnd(seed + b));
          back.push('<ellipse cx="' + f1(cx + Math.cos(a) * r * 0.48) + '" cy="' + f1(cy + Math.sin(a) * r * 0.36 * FY + 3) + '" rx="' + f1(rr) + '" ry="' + f1(rr * 0.74 * FY) + '" fill="' + massC[0] + '"/>'); }
        mid.push('<ellipse cx="' + f1(cx - r * 0.1) + '" cy="' + f1(cy - r * 0.15) + '" rx="' + f1(r * 0.8) + '" ry="' + f1(r * 0.6 * FY) + '" fill="url(#' + id + 'm1)"/>' +
          '<ellipse cx="' + f1(cx - r * 0.3) + '" cy="' + f1(cy - r * 0.38) + '" rx="' + f1(r * 0.45) + '" ry="' + f1(r * 0.32) + '" fill="url(#' + id + 'm2)" opacity=".7"/>');
      }
      var base = (SP.shape === 'petal' ? 4.4 : SP.shape === 'maple' ? 5.6 : 5.4) * LEAFK;
      if (ANIM && keep > 0) front.push('<g class="kz-rustle" style="transform-origin: ' + f1(cx) + 'px ' + f1(cy + r * 0.6) + 'px; animation-delay: -' + f1(rnd(seed + 91) * 5) + 's; animation-duration: ' + f1(3.6 + rnd(seed + 93) * 2.4) + 's">');
      for (var m = 0; m < keep; m++) {
        var a2 = (seed + m) * 2.39996, r2 = Math.sqrt((m + 0.5) / keep) * r, lx = cx + Math.cos(a2) * r2, ly = cy + Math.sin(a2) * r2 * 0.75 * FY;
        var lit = (cx - lx) / r + (cy - ly) / r, shade = lit > 0.35 ? 0 : lit > -0.45 ? 1 : 2, near = m % 5 === 0 && shade < 2, isNew = freshMark && m === keep - 1, isToday = countY !== undefined && !dry && m >= Math.round(countY * keep / Math.max(1, count));
        front.push(leaf(lx, ly, base * (0.78 + rnd(seed * 3 + m) * 0.5), rnd(seed + m * 7) * 360, isToday ? 't' : shade, isNew ? 'kz-leaf new' : isToday ? 'kz-leaf today' : '', near)); if (shade < 2 && m % 3 === 0) pts.push([lx, ly]);
        if (isNew) front.push('<circle class="kz-leaf-ring" cx="' + f1(lx) + '" cy="' + f1(ly) + '" r="9" fill="none" stroke="' + leafC[0] + '" stroke-width="1.2"/>');
      }
      if (keep > 2 && !opt.mini) front.push('<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(r * 1.08) + '" ry="' + f1(r * 0.84 * FY) + '" fill="url(#' + id + 'vol)" pointer-events="none"/>');
      if (ANIM && keep > 0) front.push('</g>');
      // Snow pine: soft snow resting on top of every cluster
      if (SP.snow && !dead && keep > 2) front.push('<path d="M' + f1(cx - r * 0.85) + ' ' + f1(cy - r * 0.28) + ' Q ' + f1(cx - r * 0.5) + ' ' + f1(cy - r * 0.95) + ' ' + f1(cx) + ' ' + f1(cy - r * 0.82) + ' Q ' + f1(cx + r * 0.55) + ' ' + f1(cy - r * 0.92) + ' ' + f1(cx + r * 0.8) + ' ' + f1(cy - r * 0.3) + ' Q ' + f1(cx) + ' ' + f1(cy - r * 0.5) + ' ' + f1(cx - r * 0.85) + ' ' + f1(cy - r * 0.28) + 'Z" fill="url(#' + id + 'snow)"/>');
      for (var d2 = 0; d2 < drop; d2++) { var fx = cx + (rnd(seed + d2 * 13) - 0.5) * r * 3, fy = GY + 4 - Math.sin(Math.max(0.05, Math.min(0.95, (fx - 22) / 316)) * Math.PI) * 13 + rnd(d2 + seed) * 7;
        if (fx > 34 && fx < 326) fallen.push(leaf(fx, fy, 3.4, rnd(seed + d2) * 360, 2)); }
      if (dry > 0.35 && !dead) for (var fl = 0; fl < 2; fl++) extras.push('<g class="kz-fall" style="animation-delay: ' + f1(rnd(seed + fl) * 6) + 's">' + leaf(cx + (rnd(seed + fl * 5) - 0.5) * r, cy + r * 0.4, 3.6, rnd(seed + fl) * 360, 2) + '</g>');
    };

    out.push(ground());
    if (SP.snow && !REALBG) out.push('<path d="M22 ' + (GY + 16) + ' C 80 ' + (GY - 15) + ', 280 ' + (GY - 15) + ', 338 ' + (GY + 16) + ' Z" fill="#E6F0F8" opacity=".88"/><path d="M40 ' + (GY + 4) + ' C 110 ' + (GY - 9) + ', 250 ' + (GY - 9) + ', 320 ' + (GY + 4) + '" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".7"/>');
    // The seed and the first seedling days, rendered in Blender like the grown tree (when this species has them)
    // Growth must read as one continuous motion: neighbouring renders cross-fade near each boundary (never a pop),
    // and the seedling hands over to the first real-tree render at the same height.
    var xfade = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    var realSmall = function () {
      var TT = window.KZ_TREES && window.KZ_TREES[spId], SM = TT && TT.small; if (!SM || opt.svgTree || S >= 10) return null;
      var nm = S0 === 0 ? 'seed' : S < 1 ? 'sd1' : S < 3 ? 'sd2' : S < 6 ? 'sd3' : 'sd4', it = SM[nm]; if (!it) return null;
      var sh0 = 16 + (S < 1 ? 0.4 + 0.6 * S : S) * 7, Hs = 14 + Math.min(S, 10) * 4;
      var B = { sd1: [0, 1, 'sd2'], sd2: [1, 3, 'sd3'], sd3: [3, 6, 'sd4'], sd4: [6, 10, 's1'] }[nm], fz = 0, nx = null;
      if (B && S0 > 0) { var wv = (nm === 'sd4' ? 0.6 : 0.4) * (B[1] - B[0]); fz = xfade((S - (B[1] - wv)) / wv); nx = B[2]; }
      var lay = (dead ? 'bare' : 'full') + (opt.mini ? '_sm' : ''), RT0 = TT.stages && TT.stages[0];
      var layer = function (Wd, href, H, op) {
        var ztop = Wd[1] + Wd[3], kk = S0 === 0 ? 27 / Wd[2] : H / ztop;
        var b = { ix: CX + Wd[0] * kk, iy: GY + 3 - ztop * kk, iw: Wd[2] * kk, ih: Wd[3] * kk };
        b.box = ' x="' + f1(b.ix) + '" y="' + f1(b.iy) + '" width="' + f1(b.iw) + '" height="' + f1(b.ih) + '"';
        b.svg = '<image href="' + href + '"' + b.box + ' preserveAspectRatio="none"' + ((dead ? 0.55 : 1) * op < 0.999 ? ' opacity="' + ((dead ? 0.55 : 1) * op).toFixed(3) + '"' : '') + '/>';
        return b;
      };
      var A0 = layer(it.world, (window.KZ_ART || '/art/') + 'trees/' + spId + '/' + nm + '_full.webp', Hs, fz > 0 ? 1 - xfade((fz - 0.5) / 0.5) : 1), A1 = null;
      if (fz > 0.001) {
        if (nx === 's1' && RT0) A1 = layer(RT0.world, (window.KZ_ART || '/art/') + 'trees/' + spId + '/s1_' + lay + '.webp', Hs, fz);
        else if (SM[nx]) A1 = layer(SM[nx].world, (window.KZ_ART || '/art/') + 'trees/' + spId + '/' + nx + '_full.webp', Hs, fz);
      }
      var M = A1 && fz > 0.5 ? A1 : A0, box = M.box, o = '<g class="kz-rtree">';
      if (S0 === 0 && !REALBG) o += '<circle cx="' + CX + '" cy="' + (GY - 6) + '" r="24" fill="url(#' + id + 'gold)"/>';   // (the old glow sat under the real soil and showed as a dark box)
      o += A0.svg + (A1 ? A1.svg : '');
      var mh = M.svg.replace(/ opacity="[^"]*"/, '').replace('<image', '<image').replace(/ preserveAspectRatio="none"\/>/, ' preserveAspectRatio="none"/>');
      if (NK > 0.02 || dry > 0.05) o += '<mask id="' + id + 'sm" style="mask-type:alpha" maskUnits="userSpaceOnUse"' + box + '>' + mh + '</mask>' +
        (dry > 0.05 && S0 > 0 ? '<rect' + box + ' fill="' + mix('#C8A848', '#7A5228', dry) + '" opacity="' + Math.min(0.7, dry * 0.9).toFixed(2) + '" mask="url(#' + id + 'sm)"/>' : '') +
        (NK > 0.02 ? '<rect' + box + ' fill="#0C1426" opacity="' + NK.toFixed(2) + '" mask="url(#' + id + 'sm)"/>' : '');
      var ix = Math.min(A0.ix, A1 ? A1.ix : 1e9), iy = Math.min(A0.iy, A1 ? A1.iy : 1e9), iw = Math.max(A0.ix + A0.iw, A1 ? A1.ix + A1.iw : -1e9) - ix;
      hit(ix, iy, 0); hit(ix + iw, iy, 0);
      return { svg: o + '</g>' + (REALBG ? '%%SOIL' + f1(CX - Math.max(12, iw * .56)) + ',' + f1(CX + Math.max(12, iw * .56)) + '%%' : ''), reach: S0 === 0 ? 40 : sh0 + 40, top: iy };
    };
    var RS = realSmall();
    if (RS) { out.push(RS.svg); reach = RS.reach; var sh = GY - RS.top; }
    else if (S0 === 0) {
      out.push('<g><ellipse cx="' + CX + '" cy="' + (GY - 3) + '" rx="14" ry="9.5" fill="#6B4A2A"/><ellipse cx="' + CX + '" cy="' + (GY - 3) + '" rx="14" ry="9.5" fill="url(#' + id + 'cyl)"/>' +
        '<ellipse cx="' + (CX - 4) + '" cy="' + (GY - 7) + '" rx="6" ry="2.8" fill="#C09A68" opacity=".5"/><path d="M' + (CX + 2) + ' ' + (GY - 12) + ' l -2.4 5 l 3.2 2.2" stroke="#F0D57A" stroke-width="1.1" fill="none"/>' +
        '<circle cx="' + CX + '" cy="' + (GY - 8) + '" r="24" fill="url(#' + id + 'gold)"/></g>' +
        (REALBG ? '' : '<path d="M22 ' + (GY + 16) + ' C 80 ' + (GY - 2) + ', 280 ' + (GY - 2) + ', 338 ' + (GY + 16) + ' Z" fill="url(#' + id + 'soil)" opacity=".95"/>'));
      reach = 40;
    } else if (S < 10) {
      var sh = 16 + (S < 1 ? 0.4 + 0.6 * S : S) * 7, top = GY - sh, sx = CX + 3, stem = dead ? '#6B6258' : mix('#5E9E62', '#8A7A40', dry);
      out.push('<path d="M' + CX + ' ' + (GY + 2) + ' C ' + (CX - 5) + ' ' + (GY - sh * 0.4) + ', ' + (CX + 7) + ' ' + (GY - sh * 0.7) + ', ' + sx + ' ' + top + '" stroke="' + stem + '" stroke-width="' + (2.4 + S * 0.4) + '" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (CX - 1) + ' ' + (GY + 2) + ' C ' + (CX - 5) + ' ' + (GY - sh * 0.4) + ', ' + (CX + 5) + ' ' + (GY - sh * 0.7) + ', ' + (sx - 1) + ' ' + top + '" stroke="#CFEFC9" stroke-width=".6" fill="none" opacity=".5"/>');
      if (!dead) {
        out.push('<path d="M' + sx + ' ' + top + ' C ' + (sx - 9) + ' ' + (top - 12) + ', ' + (sx - 25) + ' ' + (top - 5) + ', ' + (sx - 27) + ' ' + (top + 2) + ' C ' + (sx - 18) + ' ' + (top + 7) + ', ' + (sx - 7) + ' ' + (top + 5) + ', ' + sx + ' ' + top + 'Z" fill="url(#' + id + 'l1)"/><path d="M' + sx + ' ' + top + ' Q ' + (sx - 14) + ' ' + (top - 3) + ' ' + (sx - 25) + ' ' + (top + 1) + '" stroke="' + leafC[3] + '" stroke-width=".7" fill="none" opacity=".6"/>');
        out.push('<path d="M' + sx + ' ' + top + ' C ' + (sx + 9) + ' ' + (top - 14) + ', ' + (sx + 25) + ' ' + (top - 9) + ', ' + (sx + 28) + ' ' + (top - 1) + ' C ' + (sx + 18) + ' ' + (top + 6) + ', ' + (sx + 7) + ' ' + (top + 4) + ', ' + sx + ' ' + top + 'Z" fill="url(#' + id + 'l2)"/><path d="M' + sx + ' ' + top + ' Q ' + (sx + 14) + ' ' + (top - 5) + ' ' + (sx + 26) + ' ' + (top - 1) + '" stroke="' + leafC[3] + '" stroke-width=".7" fill="none" opacity=".6"/>');
        var nq = Math.floor(S), gapq = Math.min(6.5, (sh - 16) / Math.max(1, nq)); // true leaves along the stem, newest at the tip
        for (var q = 2; q <= nq; q++) { var td = !opt.demo && q > Vy, ly2 = top + 5 + (nq - q) * gapq, lx2 = CX + 3 * (1 - (ly2 - top) / sh) + (q % 2 ? 5 : -5); out.push(leaf(lx2, ly2, 5.5 + Math.min(q, 6) * 0.7, q % 2 ? 52 : -52, td ? 't' : q % 3, td ? 'kz-leaf today' : '', true)); }
      }
      reach = sh + 40;
    } else {
      LEAFK = 1 + 0.3 * Math.log(1 + Math.max(0, S - 300) / 300) / Math.LN2; var g0 = S - 9, big = Math.log(1 + Math.max(0, S - 300) / 300) / Math.LN2, trunkH = (52 + 172 * ease(g0, 120) + 34 * big) * FM.h, w0 = (6 + 26 * ease(g0, 170) + 7 * big) * FM.w, w1 = Math.max(2, w0 * 0.3), topY = GY - trunkH;
      reach = Math.max(reach, trunkH + 100 * ease(S, 60) + 40 + 30 * big);
      var sway = FM.gnarl ? function (t) { return Math.sin(t * 2.6 + 0.6) * (3 + w0 * 0.22) + Math.sin(t * 7.5 + 1.2) * w0 * 0.32 + t * t * w0 * 0.9; } : function (t) { return Math.sin(t * 2.6 + 0.6) * (3 + w0 * 0.22); };
      var xAt = function (t) { return CX + sway(t); }, yAt = function (t) { return GY - trunkH * t; }, wAt = function (t) { return w0 + (w1 - w0) * Math.pow(t, 0.8); };
      var L = [], R = [];
      for (var i = 0; i <= 24; i++) { var t = i / 24; L.push([xAt(t) - wAt(t) / 2, yAt(t)]); R.push([xAt(t) + wAt(t) / 2, yAt(t)]); }
      var fl = w0 * 1.1;
      var trunk = 'M' + f1(L[0][0] - fl) + ' ' + (GY + 2) + ' Q ' + f1(L[0][0] - 1) + ' ' + f1(GY - 3) + ' ' + f1(L[3][0]) + ' ' + f1(L[3][1]) + L.slice(4).map(function (p) { return ' L' + f1(p[0]) + ' ' + f1(p[1]); }).join('') +
        R.slice(4).reverse().map(function (p) { return ' L' + f1(p[0]) + ' ' + f1(p[1]); }).join('') + ' L' + f1(R[3][0]) + ' ' + f1(R[3][1]) + ' Q ' + f1(R[0][0] + 1) + ' ' + f1(GY - 3) + ' ' + f1(R[0][0] + fl) + ' ' + (GY + 2) + ' Z';
      var roots = ''; for (var r = 0; r < 5; r++) { var side = r % 2 ? -1 : 1, rl = w0 * (1.2 + rnd(r + 60) * 1.3), rx = CX + side * (w0 * 0.25 + r * 1.5);
        roots += '<path d="M' + f1(rx) + ' ' + f1(GY - 2) + ' Q ' + f1(rx + side * rl * 0.5) + ' ' + f1(GY - 1) + ' ' + f1(rx + side * rl) + ' ' + f1(GY + 4 + rnd(r) * 3) + '" stroke="url(#' + id + 'bark)" stroke-width="' + f1(Math.max(1.2, w0 * (0.28 - r * 0.03))) + '" fill="none" stroke-linecap="round"/>'; }
      var n = P.length, allTips = [], want = 0, coneN = 0;
      P.forEach(function (p) { var s = steps[p.id] || 0, b = Math.log(1 + Math.max(0, s - 80) / 120) / Math.LN2; want += Math.min(300, s * 6) * (1 + 0.3 * b); });
      var budget = Math.min(1, 800 / Math.max(1, want)); // keeps the page light on phones however big the tree gets
      P.forEach(function (p, k) {
        var s = steps[p.id] || 0, sY = stepsY[p.id] || 0, AT = FM.at || [0.4, 0.9], f = n === 1 ? (AT[0] + AT[1]) / 2 : AT[0] + (AT[1] - AT[0]) * k / (n - 1), side = k % 2 ? -1 : 1;
        var ax = xAt(f) + side * wAt(f) * 0.3, ay = yAt(f);
        if (!s) { dots.push({ p: p, x: ax + side * 3, y: ay, bud: true }); return; }
        var gr = ease(s, 35), bigP = Math.log(1 + Math.max(0, s - 80) / 120) / Math.LN2, len = (16 + 64 * gr) * (0.6 + 0.4 * Math.min(1, trunkH / 224)) * (1 + 0.2 * bigP) * FM.len, ang = side * (FM.ang[0] + FM.ang[1] * f) * Math.PI / 180;
        var depth = s < 6 ? 1 : s < 25 ? 2 : 3, tips = [];
        grow(ax, ay, ang, len, Math.max(1.6, wAt(f) * (0.42 + 0.3 * gr)), 0, depth, k * 31 + 7, tips);
        var first = tips[0]; var far = function (tp) { return Math.hypot(tp.x - CX, tp.y - topY); }; tips = tips.slice(1).sort(function (a, b) { return far(b) - far(a); }); tips = [first].concat(tips.slice(0, 11)); // at most 10 leaf clusters per branch keeps phones fast
        var ramp = function (v) { return Math.min(1, 0.3 + Math.max(0, v - 10) / 50); }, nl = Math.round(Math.min(300, s * 6) * (1 + 0.3 * bigP) * lite * budget * ramp(S)), nlY = Math.min(nl, Math.round(Math.min(300, sY * 6) * (1 + 0.3 * bigP) * lite * budget * ramp(Vy))), usedY = 0, wsum = tips.reduce(function (a, tp) { return a + tp.w; }, 0), used = 0;
        tips.forEach(function (tp, ti) {
          var cnt = ti === tips.length - 1 ? Math.round(nl - used) : Math.round(nl * tp.w / wsum); used += cnt;
          var cY = ti === tips.length - 1 ? Math.round(nlY - usedY) : Math.round(nlY * tp.w / wsum); usedY += cY;
          if (ti === 0 && todayP[p.id]) cY = Math.min(cY, cnt - Math.min(cnt, todayP[p.id]));
          if (FM.cone) { coneN += cnt; return; }
          var rr = Math.min(32, 9 + Math.sqrt(Math.max(cnt, 1)) * 2.4) * (0.85 + 0.15 * Math.min(1, tp.w * 2)) * (1 + 0.32 * big);
          foliage(tp.x, tp.y - 2, rr, cnt, k * 101 + ti * 17, opt.fresh === p.id && ti === 0, opt.demo || (Vy >= V && !todayP[p.id]) ? undefined : Math.min(cnt, cY));
        });
        dots.push({ p: p, x: tips[0].x, y: tips[0].y - 2 }); allTips = allTips.concat(tips);
      });
      // Fill the gaps between neighbouring branch tips so the crown reads as one canopy, denser as the tree matures.
      if (S >= 30 && allTips.length > 2 && !FM.cone) {
        var oy = topY + 30, ang2 = function (tp) { return Math.atan2(tp.y - oy, tp.x - CX); };
        allTips.sort(function (a, b) { return ang2(a) - ang2(b); });
        var dens = Math.min(1, (S - 20) / 500), fid = 0;
        for (var ti2 = 0; ti2 < allTips.length - 1; ti2++) { var A = allTips[ti2], B = allTips[ti2 + 1], dd = Math.hypot(A.x - B.x, A.y - B.y);
          if (dd < 26 || dd > 120 || fid >= 14) continue;
          var mx = (A.x + B.x) / 2 + (CX - (A.x + B.x) / 2) * 0.12, my = (A.y + B.y) / 2 - 6 - dd * 0.08, fc = Math.round(Math.min(18, (6 + dd * 0.3) * (0.4 + 0.6 * dens)) * lite);
          foliage(mx, my, Math.min(30, 8 + dd * 0.22 + 8 * dens), fc, 4000 + fid++ * 23, false); }
        // close the hole in the middle of the crown, above the trunk
        var hi = allTips.filter(function (tp) { return tp.y < topY; }), minY = Math.min.apply(null, hi.map(function (tp) { return tp.y; }).concat([topY - 20]));
        for (var hc = 0; hc < 3; hc++) { var hy = topY - (topY - minY) * (0.3 + hc * 0.3), hx = xAt(1) + (hc - 1) * 10;
          foliage(hx, hy, Math.min(30, 12 + (topY - minY) * 0.18), Math.round((10 + 16 * dens) * lite), 5000 + hc * 37, false); }
      }
      var cn = Math.round(Math.min(150, S) * lite * Math.max(0.6, budget) * Math.min(1, 0.3 + Math.max(0, S - 10) / 50)), crr = Math.min(24, 8 + Math.sqrt(Math.min(150, S)) * 1.5) + 6 * big;
      var CR = {
        round: [[0, -10, .4, 1], [-0.95, 2, .3, .9], [0.95, 0, .3, .9]],
        oval: [[0, -crr * 1.4, .3, .9], [0, -10, .3, 1], [-0.7, 4, .2, .85], [0.7, 2, .2, .85]],
        dome: [[0, -crr * 0.7, .3, 1], [-1.1, -2, .2, .9], [1.1, -4, .2, .9], [-0.55, -crr * 0.5, .15, .8], [0.55, -crr * 0.55, .15, .8]],
        umbrella: [[0, -6, .24, 1], [-0.75, -2, .2, .95], [0.75, -3, .2, .95], [-1.45, 6, .18, .8], [1.45, 5, .18, .8]],
        column: [[0, -crr * 2.3, .22, .8], [0, -crr * 1.2, .3, .95], [0, -6, .3, 1], [-0.45, 10, .09, .7], [0.45, 10, .09, .7]],
        high: [[0, -crr * 0.5, .4, 1], [-0.8, 4, .3, .85], [0.8, 2, .3, .85]],
        tiers: [[0, -4, .3, 1], [-1.2, 10, .25, .9], [1.2, 8, .25, .9], [0, -crr * 0.9, .2, .75]],
        tufts: [[0.3, -6, .5, .8], [-0.9, 10, .25, .65], [1.1, 14, .25, .6]]
      }[FM.crown || 'round'];
      if (FM.cone) {
        // Conifer: a stack of drooping tiers, widest at the bottom, a spire on top
        var total = coneN + cn, apexY = topY - trunkH * (FM.flatTiers ? 0.12 : 0.24), baseY = GY - trunkH * (FM.flatTiers ? 0.3 : 0.14);
        var nT = Math.max(3, Math.min(FM.flatTiers ? 6 : 9, Math.round(trunkH / (FM.flatTiers ? 40 : 26)))), maxHW = (22 + trunkH * 0.44) * FM.coneW, per = Math.max(4, Math.round(total / nT));
        for (var ci2 = 0; ci2 < nT; ci2++) {
          var u = ci2 / nT, ty = baseY - (baseY - apexY) * u, hw = Math.max(10, maxHW * Math.pow(1 - u, FM.flatTiers ? 0.65 : 1)), tx0 = xAt(Math.min(1, (GY - ty) / trunkH)), th = FM.flatTiers ? 8 : 16 + hw * 0.2;
          if (FM.flatTiers) {
            [-1, 1].forEach(function (sd) { var pc = tx0 + sd * hw * 0.55, pw = hw * 0.5;
              back.push('<ellipse cx="' + f1(pc) + '" cy="' + f1(ty + 3) + '" rx="' + f1(pw) + '" ry="' + f1(7 + hw * 0.05) + '" fill="' + massC[0] + '"/>');
              limbs.push('<path d="M' + f1(tx0) + ' ' + f1(ty + 4) + ' Q ' + f1(tx0 + sd * pw * 0.5) + ' ' + f1(ty) + ' ' + f1(pc + sd * pw * 0.7) + ' ' + f1(ty + 2) + '" stroke="url(#' + id + 'bark)" stroke-width="' + f1(Math.max(1.2, w0 * 0.12)) + '" fill="none" stroke-linecap="round"/>');
              hit(pc - pw, ty, 6); hit(pc + pw, ty, 6);
              var np = Math.max(1, Math.round(pw / 14)); for (var pq = 0; pq < np; pq++) foliage(pc + (np === 1 ? 0 : -0.7 + 1.4 * pq / (np - 1)) * pw, ty - 2, Math.max(8, Math.min(18, pw / np + 6)), Math.round(per / 2 / np), 6000 + ci2 * 41 + pq * 7 + (sd > 0 ? 3 : 0), false); });
            continue;
          }
          back.push('<path d="M' + f1(tx0 - hw) + ' ' + f1(ty + 6) + ' Q ' + f1(tx0 - hw * 0.45) + ' ' + f1(ty - th * 0.55) + ' ' + f1(tx0) + ' ' + f1(ty - th) + ' Q ' + f1(tx0 + hw * 0.45) + ' ' + f1(ty - th * 0.55) + ' ' + f1(tx0 + hw) + ' ' + f1(ty + 6) + ' Q ' + f1(tx0) + ' ' + f1(ty + 13) + ' ' + f1(tx0 - hw) + ' ' + f1(ty + 6) + 'Z" fill="' + massC[0] + '"/>');
          hit(tx0 - hw, ty, 6); hit(tx0 + hw, ty, 6); hit(tx0, ty - th, 6);
          var nc = Math.max(1, Math.round(hw / 15));
          for (var cc = 0; cc < nc; cc++) { var fx2 = nc === 1 ? 0 : -0.78 + 1.56 * cc / (nc - 1); foliage(tx0 + fx2 * hw, ty - th * 0.3 * (1 - Math.abs(fx2)) + Math.abs(fx2) * 5, Math.max(9, Math.min(22, hw / nc + 7)), Math.round(per / nc), 6000 + ci2 * 41 + cc * 7, false); }
        }
        if (!FM.flatTiers) { foliage(xAt(1), apexY + 4, 8, Math.max(4, Math.round(per * 0.25)), 6999, false); limbs.push('<path d="M' + f1(xAt(1)) + ' ' + f1(topY) + ' L' + f1(xAt(1)) + ' ' + f1(apexY - 6) + '" stroke="url(#' + id + 'bark)" stroke-width="' + f1(Math.max(1.4, w1 * 0.6)) + '" stroke-linecap="round"/>'); hit(xAt(1), apexY - 8, 4); }
      } else CR.forEach(function (c, ci) { foliage(xAt(1) + c[0] * crr * FM.cw * (Math.abs(c[0]) > 2 ? 0 : 1) + (Math.abs(c[0]) > 2 ? c[0] : 0), topY + c[1], crr * c[3], Math.round(cn * c[2]), 777 + ci * 41, false); });
      // Weeping willow: long strands hang from the crown and swing in the wind
      if (FM.weep && !dead) {
        var ccx = (bx0 + bx1) / 2, half = Math.max(30, (bx1 - bx0) / 2 - 6), ctop = by0 + 6, cmid = topY + crr * 0.2;
        var ns = Math.min(opt.mini ? 18 : 44, Math.round(14 + S / 4)), hang = trunkH * 0.82;
        for (var si = 0; si < ns; si++) {
          var ux = -1 + 2 * (si + 0.5) / ns, sx0 = ccx + ux * half + (rnd(si + 1300) - 0.5) * 8, sy0 = cmid - (1 - ux * ux) * (cmid - ctop) * 0.55 + (rnd(si + 1310) - 0.5) * 8;
          var sl = hang * (0.5 + rnd(si + 1320) * 0.5) * (0.7 + 0.3 * Math.abs(ux)), out2 = ux * 10;
          var strand = '<path d="M' + f1(sx0) + ' ' + f1(sy0) + ' Q ' + f1(sx0 + out2 * 1.6) + ' ' + f1(sy0 + sl * 0.45) + ' ' + f1(sx0 + out2) + ' ' + f1(sy0 + sl) + '" stroke="' + mix(leafC[2], '#3A2A14', .25) + '" stroke-width="1.1" fill="none"/>';
          for (var sk = 1; sk <= Math.floor(sl / 5.5); sk++) { var tt = sk * 5.5 / sl, lx3 = sx0 + out2 * (2 * (1 - tt) * tt * 1.6 + tt * tt), ly3 = sy0 + sl * tt; strand += leaf(lx3, ly3, 4.4, 180 + (sk % 2 ? 26 : -26), sk % 3, '', false); }
          hit(sx0 + out2, sy0 + sl, 4);
          front.push(ANIM ? '<g class="kz-strand" style="transform-origin: ' + f1(sx0) + 'px ' + f1(sy0) + 'px; animation-delay: -' + f1(rnd(si + 1330) * 4) + 's">' + strand + '</g>' : strand);
        }
      }
      if (!dead && dry < 0.4 && S >= 100) {
        var nfl = Math.min(60, Math.floor((S - 90) / 4)), F = S >= 365 ? SP.fruit : SP.bloom;
        for (var b3 = 0; b3 < nfl && pts.length; b3++) { var pp0 = pts[Math.floor(rnd(b3 + 1200) * pts.length)], tx = pp0[0] + (rnd(b3) - .5) * 3, ty = pp0[1] + (rnd(b3 + 9) - .5) * 3;
          extras.push(S >= 365 ? '<circle cx="' + f1(tx) + '" cy="' + f1(ty) + '" r="2.8" fill="' + F + '"/><circle cx="' + f1(tx - .8) + '" cy="' + f1(ty - .9) + '" r=".9" fill="#fff" opacity=".5"/>'
            : [0, 1, 2, 3, 4].map(function (pp) { var a = pp * 1.2566; return '<circle cx="' + f1(tx + Math.cos(a) * 1.5) + '" cy="' + f1(ty + Math.sin(a) * 1.5) + '" r="1.25" fill="' + F + '" opacity=".95"/>'; }).join('') + '<circle cx="' + f1(tx) + '" cy="' + f1(ty) + '" r=".7" fill="#E9C547"/>'); }
      }
      // A real tree, rendered in Blender (when this species has been rendered): the growth stage nearest its size, scaled to the
      // exact height it has grown to. Thirst browns only the leaves (leaf mask), a dead tree drops them (bare layer), and the same
      // light as the landscape falls on it (tree mask). Birds perch on its real twigs.
      var RT = window.KZ_TREES && window.KZ_TREES[spId] && !opt.svgTree ? window.KZ_TREES[spId].stages : null, RTI = '';
      if (RT && RT.length) {
        var gq = Math.min(1, 0.06 + 0.94 * (1 - Math.exp(-(S - 10) / 330))), si = 0;
        RT.forEach(function (st0, i) { if (st0.g <= gq + 0.001) si = i; });
        var lay = (dead ? 'bare' : 'full') + (opt.mini ? '_sm' : ''); // thumbnails decode ~12x less
        // height: grows on from the seedling's height (54 at day 10) instead of jumping to the sapling's
        var Ht = Math.max(trunkH * 1.25, GY - by0); Ht = 54 + (Ht - 54) * xfade((S - 10) / 16);
        // cross-fade into the next render over the last 40% of each stage, so the shape changes smoothly
        var fz = 0; if (si + 1 < RT.length) { var g0s = RT[si].g, g1s = RT[si + 1].g, wv = 0.4 * (g1s - g0s); fz = xfade((gq - (g1s - wv)) / wv); }
        var rtLayer = function (k, op, sfx) {
          var ST = RT[k], Wd = ST.world, ztop = Wd[1] + Wd[3], kk = Ht / ztop;
          var ix = CX + Wd[0] * kk, iy = GY + 3 - ztop * kk, iw = Wd[2] * kk, ih = Wd[3] * kk, box = ' x="' + f1(ix) + '" y="' + f1(iy) + '" width="' + f1(iw) + '" height="' + f1(ih) + '"';
          var tb = (window.KZ_ART || '/art/') + 'trees/' + spId + '/s' + (k + 1) + '_', o = '<g class="kz-sway kz-rtree"' + (op < 0.999 ? ' opacity="' + op.toFixed(3) + '"' : '') + '><image href="' + tb + lay + '.webp"' + box + ' preserveAspectRatio="none"/>';
          if (!dead && dry > 0.02) o += '<mask id="' + id + 'lm' + sfx + '" style="mask-type:alpha" maskUnits="userSpaceOnUse"' + box + '><image href="' + tb + 'mask' + (opt.mini ? '_sm' : '') + '.webp"' + box + ' preserveAspectRatio="none"/></mask>' +
            '<rect' + box + ' fill="' + (dry < 0.5 ? mix('#D8BE5A', '#B08A3A', dry * 2) : mix('#B08A3A', '#7A5228', (dry - 0.5) * 2)) + '" opacity="' + Math.min(0.72, dry * 0.95).toFixed(2) + '" mask="url(#' + id + 'lm' + sfx + ')"/>';
          if (NK > 0.02 || WM > 0.01) o += '<mask id="' + id + 'tm' + sfx + '" style="mask-type:alpha" maskUnits="userSpaceOnUse"' + box + '><image href="' + tb + lay + '.webp"' + box + ' preserveAspectRatio="none"/></mask>' +
            (WM > 0.01 ? '<rect' + box + ' fill="#E89A50" opacity="' + (WM * 1.4).toFixed(2) + '" mask="url(#' + id + 'tm' + sfx + ')"/>' : '') +
            (NK > 0.02 ? '<rect' + box + ' fill="#0C1426" opacity="' + NK.toFixed(2) + '" mask="url(#' + id + 'tm' + sfx + ')"/>' : '');
          return { svg: o + '</g>', ix: ix, iy: iy, iw: iw, kk: kk };
        };
        var L0 = rtLayer(si, fz > 0 ? 1 - xfade((fz - 0.5) / 0.5) : 1, ''), L1 = fz > 0.001 ? rtLayer(si + 1, fz, 'n') : null, LM = L1 && fz > 0.5 ? L1 : L0;
        RTI = L0.svg + (L1 ? L1.svg : '');
        var iw = Math.max(L0.ix + L0.iw, L1 ? L1.ix + L1.iw : -1e9) - Math.min(L0.ix, L1 ? L1.ix : 1e9);
        RTI += (REALBG ? '%%SOIL' + f1(CX - Math.max(14, iw * 0.14)) + ',' + f1(CX + Math.max(14, iw * 0.14)) + '%%' : '');
        hit(Math.min(L0.ix, L1 ? L1.ix : 1e9), Math.min(L0.iy, L1 ? L1.iy : 1e9), 0); hit(Math.min(L0.ix, L1 ? L1.ix : 1e9) + iw, Math.min(L0.iy, L1 ? L1.iy : 1e9), 0);
        allTips = RT[LM === L1 ? si + 1 : si].perch.map(function (q) { return { x: CX + q[0] * LM.kk, y: GY - q[1] * LM.kk, w: 1 }; });
        dots = []; extras = [];
      }
      if (RTI) out.push(RTI); else
      out.push('<g class="kz-sway">' + back.join('') + limbs.join('') + roots + '<path d="' + trunk + '" fill="url(#' + id + 'bark)"/><path d="' + trunk + '" fill="url(#' + id + 'cyl)"/>' +
        '<path d="M' + f1(xAt(0.05) - w0 * 0.22) + ' ' + f1(yAt(0.05)) + ' Q ' + f1(xAt(0.5) - wAt(0.5) * 0.25) + ' ' + f1(yAt(0.5)) + ' ' + f1(xAt(0.9) - wAt(0.9) * 0.2) + ' ' + f1(yAt(0.9)) + '" stroke="' + mix(barkTop[1], '#FFFFFF', .2) + '" stroke-width="' + f1(Math.max(0.8, w0 * 0.08)) + '" opacity=".35" fill="none"/>' +
        (function () {
          var o = '', bt = FM.bark; if (!bt || dead) return '';
          for (var bi = 0; bi < 18; bi++) { var t3 = 0.06 + bi / 19 * 0.9, bx = xAt(t3), by = yAt(t3), bw = wAt(t3);
            if (bt === 'birch') o += '<path d="M' + f1(bx - bw * (0.15 + rnd(bi + 1500) * 0.3)) + ' ' + f1(by) + ' h' + f1(bw * (0.18 + rnd(bi + 1510) * 0.3)) + '" stroke="#1A1714" stroke-width="' + f1(1 + rnd(bi + 1520) * 1.4) + '" stroke-linecap="round" opacity=".8"/>';
            else if (bt === 'rainbow') o += '<path d="M' + f1(bx - bw * 0.42 + rnd(bi + 1530) * bw * 0.5) + ' ' + f1(by) + ' q' + f1(bw * 0.06) + ' ' + f1(trunkH * 0.04) + ' 0 ' + f1(trunkH * 0.07) + '" stroke="' + ['#3A6AD9', '#E85A9A', '#F5A83B', '#4EC27A', '#9A5AD9'][bi % 5] + '" stroke-width="' + f1(Math.max(1.2, bw * 0.2)) + '" stroke-linecap="round" opacity=".85"/>';
            else if (bt === 'twist') o += '<path d="M' + f1(bx - bw * 0.5) + ' ' + f1(by + 4) + ' Q ' + f1(bx) + ' ' + f1(by - 2) + ' ' + f1(bx + bw * 0.5) + ' ' + f1(by - 9) + '" stroke="#F2E6D2" stroke-width="' + f1(Math.max(0.8, bw * 0.06)) + '" fill="none" opacity=".35"/>';
          }
          return o;
        })() +
        mid.join('') + front.join('') + extras.join('') + '</g>');
    }
    if (HL.water >= 95 && S >= 5 && !dead && !opt.lite && !opt.mini) for (var dw = 0; dw < 7; dw++) out.push('<circle class="kz-dew" style="animation-delay: ' + f1(dw * 0.7) + 's" cx="' + f1(90 + rnd(dw + 70) * 180) + '" cy="' + f1(GY - 40 - rnd(dw + 80) * Math.min(220, reach)) + '" r="1.2" fill="#FFFFFF"/>');
    out.splice(1, 0, shadowL.join(''));
    out.push(fallen.join(''));
    if (!opt.mini && S >= 30) out.push(dots.map(function (o) { return o.bud ? '<ellipse cx="' + f1(o.x) + '" cy="' + f1(o.y) + '" rx="2.4" ry="3.4" fill="' + o.p.c2 + '" opacity=".6"/>' : '<circle cx="' + f1(o.x) + '" cy="' + f1(o.y) + '" r="3.2" fill="' + o.p.c2 + '" opacity=".45"/><circle cx="' + f1(o.x) + '" cy="' + f1(o.y) + '" r="1.8" fill="' + o.p.c1 + '"/>'; }).join(''));
    var needH = GY + 40 - Math.min(by0 - 18, GY - reach), needW = Math.max(CX - bx0, bx1 - CX) * 2 + 24;
    var vbH = Math.max(S0 === 0 ? 220 : 150 + Math.min(70, S * 7), needH, needW * H / W), vbW = vbH * W / H, vb = f1(CX - vbW / 2) + ' ' + f1(GY + 40 - vbH) + ' ' + f1(vbW) + ' ' + f1(vbH);
    for (var oi = 0; oi < out.length; oi++) if (out[oi].indexOf('%%SOIL') > -1) out[oi] = out[oi].replace(/%%SOIL([\d.-]+),([\d.-]+)%%/g, function (m0, a, b) { return K.soilLayer(CX - vbW / 2, GY + 40 - vbH, vbW, vbH, GY, null, [+a, +b]); });
    out[0] = (!opt.demo || opt.real) && !opt.nosky ? K.skySVG(id, CX - vbW / 2, GY + 40 - vbH, vbW, vbH, GY) : '<rect x="' + f1(CX - vbW / 2 - 2) + '" y="' + f1(GY + 38 - vbH) + '" width="' + f1(vbW + 4) + '" height="' + f1(vbH + 4) + '" fill="url(#' + id + 'sky)"/>';
    // ---------- Wildlife: a healthy tree attracts birds and a squirrel; an unhealthy one is left alone ----------
    var A = vbH / 185, wild = { birds: 0, squirrel: false, nest: false }, st = HL.status;
    if (S >= 10 && !opt.lite && !window.KZ_SPRITES && allTips && allTips.length) {
      // by stage (days of care): Sapling 1 bird · Young tree 2 + squirrel · Tree 3 + nest · Mighty 4
      var gd = opt.demo ? G0 : G;
      // Animals you've met (KZ.ANIMALS: robin 21 · squirrel 40 · bluebird 60 · nest 90 · goldfinch 130 · sparrow 180 days of care)
      var met = K.animalsMet && !opt.demo ? K.animalsMet(gd) : null, nb = 0;
      if (met) K.ANIMALS.forEach(function (a) { if (a.bird && met[a.id]) nb++; });
      else nb = gd < 21 ? 0 : gd < 60 ? 1 : gd < 130 ? 2 : gd < 180 ? 3 : 4;
      var sq = met ? met.squirrel : gd >= 40, ne = met ? met.nest : gd >= 90;
      if (st === 'healthy') { wild.birds = Math.min(4, nb); wild.squirrel = !!sq; wild.nest = false; }
      else if (st === 'thirsty' && nb) wild.birds = 1;
    }
    if (wild.birds || wild.squirrel) {
      var BIRDS = (K.birdColors && !opt.demo && K.birdColors().length) ? K.birdColors() : [['#6B4A32', '#E8793A', '#4A3222'], ['#3E6FC4', '#E9A15A', '#284A8A'], ['#B9952A', '#F2D25C', '#2A2A2A'], ['#5A5F6B', '#D9D2C4', '#3A3E48']]; // your rarest birds first
      var perch = allTips.slice().sort(function (a, b) { return a.y - b.y; }), spots = [];
      // spread perches out: pick tips far from the ones already chosen
      for (var pi = 0; pi < perch.length && spots.length < wild.birds; pi++) { var tp = perch[pi]; if (spots.every(function (s2) { return Math.abs(s2.x - tp.x) > 28 * A || Math.abs(s2.y - tp.y) > 22 * A; })) spots.push(tp); }
      var bird = function (c) {
        return '<g class="kz-bird-b"><path d="M-3.4 .2 L-7 -1.1 L-6.6 .4 L-7.2 1.5 Z" fill="' + c[2] + '"/>' +
          '<ellipse cx="0" cy="0" rx="4.1" ry="2.7" fill="' + c[0] + '"/><ellipse cx="1.2" cy=".9" rx="2.7" ry="1.7" fill="' + c[1] + '"/>' +
          '<g class="kz-bird-h"><circle cx="3.5" cy="-1.7" r="2" fill="' + c[0] + '"/><path d="M5.2 -2 L7.2 -1.55 L5.25 -1.05 Z" fill="#E9B44C"/><circle cx="4.1" cy="-2.1" r=".5" fill="#0B0D12"/><circle cx="4.25" cy="-2.25" r=".16" fill="#FFF"/></g>' +
          '<path class="kz-bird-w" d="M-2.6 -.6 Q .2 -2.6 2.2 -.7 Q -.1 .5 -2.6 -.6Z" fill="' + c[2] + '"/>' +
          '<path d="M.3 2.5 L-.1 4 M1.3 2.5 L1.2 4" stroke="#C9A06A" stroke-width=".45" stroke-linecap="round"/></g>';
      };
      var wl = [];
      if (wild.nest && spots.length) { var nt = perch[Math.min(perch.length - 1, Math.floor(perch.length * 0.55))];
        wl.push('<g transform="translate(' + f1(nt.x) + ' ' + f1(nt.y + 2) + ') scale(' + f1(A) + ')"><path d="M-6 0 Q0 6 6 0 Z" fill="#5A3B20"/><path d="M-6.5 -.3 Q0 2 6.5 -.3" stroke="#8A6236" stroke-width="1.2" fill="none"/><path d="M-5 .8 L4 -.6 M-4 -.4 L5 1.2" stroke="#3E2814" stroke-width=".5"/><ellipse cx="-1.4" cy="-.9" rx="1.3" ry="1" fill="#A9D4E8"/><ellipse cx="1.2" cy="-1" rx="1.3" ry="1" fill="#B9DEEE"/></g>'); }
      spots.forEach(function (sp2, bi) {
        var c = BIRDS[bi % BIRDS.length], face = sp2.x < CX ? -1 : 1, x = sp2.x, y = sp2.y - 3.2 * A;
        var fly = bi === 0 && spots.length > 1, to = spots[spots.length - 1], fx = to.x - sp2.x, fy = to.y - sp2.y;
        wl.push('<g transform="translate(' + f1(x) + ' ' + f1(y) + ')"><g class="kz-bird' + (fly ? ' kz-fly' : '') + '" style="animation-delay: ' + f1(bi * 1.7) + 's' + (fly ? '; --fx: ' + f1(fx) + 'px; --fy: ' + f1(fy) + 'px; --mx: ' + f1(fx / 2) + 'px; --my: ' + f1(Math.min(fy, 0) / 2 - 40 * A) + 'px' : '') + '"><g transform="scale(' + f1(A * face) + ' ' + f1(A) + ')">' + bird(c) + '</g></g></g>');
      });
      if (wild.squirrel) {
        var sx = CX + (typeof w0 === 'number' ? w0 : 10) * 0.9 + 8 * A, sy = GY + 1;
        wl.push('<g transform="translate(' + f1(sx) + ' ' + f1(sy) + ')"><g class="kz-squirrel" style="--sx: ' + f1(Math.min(30 * A, vbW * 0.17)) + 'px"><g class="kz-sq-flip"><g transform="scale(' + f1(A) + ')"><g class="kz-sq-hop">' +
          '<path class="kz-sq-tail" d="M-4 -2 C-11 -3 -12 -11 -8 -15 C-5 -18 -1 -16 -2 -13 C-5 -13 -7 -10 -5 -7 C-4 -5 -3 -4 -2 -3 Z" fill="#B0602E"/>' +
          '<path d="M-7.8 -14 C-6 -16.5 -3 -16 -2.6 -13.6" stroke="#D88B52" stroke-width="1" fill="none" opacity=".8"/>' +
          '<ellipse cx="0" cy="-3.6" rx="4.4" ry="3.3" fill="#B86A34"/><ellipse cx="1.4" cy="-2.6" rx="2.2" ry="2" fill="#F1D3B0"/>' +
          '<circle cx="3.9" cy="-6.6" r="2.4" fill="#B86A34"/><path d="M3 -8.6 L3.6 -10.6 L4.6 -8.6 Z" fill="#9A5226"/><circle cx="4.7" cy="-7" r=".55" fill="#0B0D12"/><circle cx="6.2" cy="-6.2" r=".45" fill="#3A2416"/>' +
          '<path d="M2 -.4 L2.6 .2 M-2.6 -.4 L-3.2 .2" stroke="#8A4A22" stroke-width=".9" stroke-linecap="round"/></g></g></g></g></g>');
      }
      out.push('<g class="kz-wild">' + wl.join('') + '</g>');
    }
    if (SP.snow && !opt.lite) { var fl = []; for (var sn = 0; sn < 16; sn++) fl.push('<circle class="kz-snow" style="animation-delay: ' + f1(rnd(sn + 500) * 9) + 's; animation-duration: ' + f1(7 + rnd(sn + 520) * 6) + 's" cx="' + f1(CX - vbW / 2 + rnd(sn + 540) * vbW) + '" cy="' + f1(GY + 40 - vbH) + '" r="' + f1((0.8 + rnd(sn + 560) * 1.2) * A) + '" fill="#FFFFFF" opacity=".85"/>'); out.push('<g style="--fall: ' + f1(vbH) + 'px">' + fl.join('') + '</g>'); }
    // Perches: where a companion can sit (branch tips, highest first; a seedling's top; the ground)
    var perchL = (allTips && allTips.length ? allTips.filter(function (t) { return t.y < GY - 24; }).sort(function (a, b) { return a.y - b.y; }).slice(0, 10) : []);
    if (!perchL.length) perchL = RS ? [{ x: CX + 34, y: GY - 1 }, { x: CX - 40, y: GY - 1 }] : S0 === 0 ? [{ x: CX + 30, y: GY - 1 }] : [{ x: CX + 4, y: GY - Math.max(12, typeof sh === 'number' ? sh : 16) + 2 }, { x: CX + 34, y: GY - 1 }];
    var perchA = perchL.map(function (t) { return f1(t.x) + ',' + f1(t.y); }).join(' ') + '|' + f1(CX + 46) + ',' + f1(GY) + ',' + f1(Math.max(CX - vbW * 0.44, 40)) + ',' + f1(Math.min(CX + vbW * 0.44, 320));
    return { vb: vb, wildlife: wild, perches: perchA, svg: '<svg class="kz-lifetree" data-perch="' + perchA + '" viewBox="' + vb + '" role="img" aria-label="' + K.esc(K.treeName() + ', ' + K.treeStage(G) + ', ' + K.treeHeight(G) + ' tall, ' + HL.water + '% water' + (wild.birds ? ', ' + wild.birds + (wild.birds === 1 ? ' bird' : ' birds') + (wild.squirrel ? ' and a squirrel' : '') + ' living there' : '')) + '">' + defs + out.join('') + '</svg>',
      steps: rawSum, growth: G, raw: G0, lost: G0 - G, today: GR.today, week: GR.week, visual: V, stage: K.treeStage(G), height: K.treeHeight(G), health: HL, perPillar: raw };
  };
})();
/* Oct 24 (speed): the tree's health was recomputed from the full history ~20 times per screen. Same answer until saved data,
   the day, or the minute changes (water drains through the day), so it's reused within that window. Each caller gets its own copy. */
(function () { var K = window.KZ; if (!K || !K.treeHealth || !K._rover || K.treeHealth.__memo) return;
  var raw = K.treeHealth, c = null;
  K.treeHealth = function () {
    if (arguments.length) return raw.apply(this, arguments);
    var v = K._rover(), d = K.key(K.today()), m = Math.floor(Date.now() / 60000);
    if (!c || c.v !== v || c.d !== d || c.m !== m) c = { v: v, d: d, m: m, x: raw() };
    return Object.assign({}, c.x);
  };
  K.treeHealth.__memo = 1;
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzdays-1102b.js ==== */
;try {
/* Nov 2 b · copy of kzdays-1102.js with SHIELD_MAX = 0: shields and rest days belong to the Kaizen 66 only. */
/* Nov 2 · replaces kzdays-1030.js. Streak shields now come at the climb's checkpoints: days 7, 14, 30 and 45 in a row (the count starts over every 66 days), still hold 2 (James: "no contradictions"). */
/* Oct 30 · Habits on chosen days (James: "make it so I can make my daily habit, like off devices in bed, only on weekdays").
   A daily habit can be Every day, Weekdays or picked days (g.wd = [0..6], 0 = Sunday; none = every day). On its off days the
   habit isn't due: it doesn't count against the day, the tree's water, the streak, the calendar or reminders, and it's
   hidden from Today (kzdays-1030b.js has the sheet picker, Today and the rest).
   K.dueOn(g, k) is the one rule: false on a habit's off day, and false for a long-term goal with a roadmap from the day it
   got one (kzbd already did that for the day's due count; now the water and streak follow it too).
   The day sums that decide water, streak and growth are copies of the core ones (0bdb9342413e.js, 5c4286b50740.js, the plan
   page's treeGrowth) with "&& K.dueOn(g, k)" added to their due test; the day summary (K.dayInfo) is wrapped instead, like
   kzbd does, so the other wrappers stay in place. Loaded right after the core on every page. */
(function () {
  var K = window.KZ; if (!K || K.__kzdays) return; K.__kzdays = 1;
  var DOW = {};
  function dow(k) { var v = DOW[k]; if (v === undefined) { var p = String(k).split('-'); v = DOW[k] = new Date(+p[0], +p[1] - 1, +p[2]).getDay(); } return v; }
  function days(g) { var w = g && g.wd; if (!Array.isArray(w)) return null; w = w.filter(function (d) { return d === +d && d >= 0 && d <= 6; }); return w.length && w.length < 7 ? w : null; }
  function offDay(g, k) { if (!g || g.quit || (g.kind && g.kind !== 'daily')) return false; var w = days(g); return !!(w && w.indexOf(dow(k)) < 0); }
  function msFrom(g, k) { try { return !!(K.bd && K.bd.isMs && K.bd.isMs(g) && g.msFrom && k >= g.msFrom); } catch (e) { return false; } }
  K.habitDays = days;
  K.offDay = offDay;
  K.dueOn = function (g, k) { return !offDay(g, k) && !msFrom(g, k); };

  var today = K.today, addDays = K.addDays, key = K.key, getRO = function (k, d) { return K._getRO ? K._getRO(k, d) : K.get(k, d); };
  var goals = function () { return K.get('goals', []) || []; }, shownDays = function () { return K.shownDays ? K.shownDays() : []; };
  var SHIELD_EVERY = 7, SHIELD_MAX = 0, CPS = [7, 14, 30, 45];   // Nov 2 b (James: shields "only with the kaizen 66"): the everyday streak earns no shields, so no rest days   // a shield at each checkpoint: day 7, 14, 30 and 45 in a row, then again each 66-day climb

  // ---- copies with the due test extended ----
  var rawTH = function () {
    var done = K.get('done', {}) || {}, goals = K.allGoals(), today = K.today(), tk = K.key(today);
    var due = function (k) { return goals.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived) && K.dueOn(g, k); }); };
    var rate = function (k) { var d = due(k); if (!d.length) return null; return d.filter(function (g) { return done[g.id] && done[g.id][k]; }).length / d.length; };
    var dueT = due(tk), doneT = dueT.filter(function (g) { return done[g.id] && done[g.id][tk]; }).length, rT = dueT.length ? doneT / dueT.length : null;
    var all = {}; for (var id in done) for (var d in (done[id] || {})) all[d] = 1;
    var list = Object.keys(all).sort(), steps = list.length;
    // No water until your first check-off. From that first day on, each day moves it 30% of the way to that day's rate.
    var W = 0, first = list.length && list[0] < K.key(today) ? list[0] : null, from = first ? new Date(first + 'T00:00:00') : today, floor = K.addDays(today, -150); if (from < floor) from = floor;
    var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (k) { rest[k] = 1; }); // shield days are rest days: no water lost
    for (var day = from, guard = 0, seeded = false; day < today && guard < 200; day = K.addDays(day, 1), guard++) { if (rest[K.key(day)]) continue; var r = rate(K.key(day)); if (r === null) continue; if (!seeded) { W = r * 100; seeded = true; } else W = K.waterStep(W, r, 1); }
    var yW = Math.round(W);
    var nowD = new Date(), hr = nowD.getHours() + nowD.getMinutes() / 60, drainP = Math.max(0, Math.min(1, (hr - K.WATER_SAFE_UNTIL) / K.WATER_DRAIN_HOURS));
    if (rT !== null) W = seeded ? K.waterStep(W, rT, drainP) : rT * 100; // first day: water = what you did
    var water = Math.round(W), energy = water;
    var wInfo = { safe: hr < K.WATER_SAFE_UNTIL, drainP: drainP, target: rT === null ? null : Math.round(rT * 100), left: dueT.length - doneT, carried: yW };
    var missed = 0;
    if (list.length) { var cur = new Date(list[0] + 'T00:00:00'), end = K.addDays(today, -1); while (cur <= end) { if (!all[K.key(cur)] && !rest[K.key(cur)]) missed++; cur = K.addDays(cur, 1); } }
    var since = list.length ? Math.round((today - new Date(list[list.length - 1] + 'T00:00:00')) / 864e5) : 0;
    var stress = K.get('treestress', 0) || 0;
    var status = !steps && !goals.length ? 'seed' : water >= 60 ? 'healthy' : water >= 40 ? 'thirsty' : water >= 25 ? 'wilting' : (water > 3 || since < 7) ? 'dying' : 'dead';
    if (!steps && goals.length) status = 'thirsty'; // planted, waiting for its first water
    if (steps && list.length <= 3 && (status === 'dying' || status === 'dead' || status === 'wilting')) status = 'thirsty'; // a brand-new tree gets a few days before it can look sick
    return { water: water, yWater: yW, energy: energy, wInfo: wInfo, rToday: rT, todayDone: doneT, todayDue: dueT.length, missed: missed, stress: stress, factor: Math.pow(0.99, missed) * Math.pow(0.98, stress), since: since, status: status, fresh: !steps,
      vitality: status === 'seed' || !steps ? 0.7 : Math.max(list.length <= 3 ? 0.55 : 0, Math.min(1, (water - 15) / 55)) };
  };
  K.treeGrowth = function (endK) { // Oct 22: optional endK = growth through that day (for past-day snapshots)
    var done = K.get('done', {}), goals = K.allGoals(), start = null, id, d;
    goals.forEach(function (g) { if (g.created && (!start || g.created < start)) start = g.created; });
    for (id in done) for (d in (done[id] || {})) if (!start || d < start) start = d;
    var o = { G0: 0, today: 0, week: 0 }; if (!start || !goals.length) return o;
    var end = endK ? new Date(endK + 'T00:00:00') : K.today(), tk = K.key(end), wk = K.key(K.addDays(end, -6)), day = new Date(start.slice(0, 10) + 'T00:00:00'), guard = 0;
    while (day <= end && guard++ < 40000) {
      var k = K.key(day), due = 0, cnt = 0;
      goals.forEach(function (g) { if ((!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived) && K.dueOn(g, k)) due++; if (done[g.id] && done[g.id][k]) cnt++; });
      var r = cnt ? Math.min(1, cnt / Math.max(due, cnt)) : 0;
      if (r && K.growMult) r *= K.growMult(k); // Oct 21: the day plan's multiplier multiplies that day's growth (replaces the small flat bonus)
      o.G0 += r; if (k >= wk) o.week += r; if (k === tk) o.today = r;
      day = K.addDays(day, 1);
    }
    return o;
  };
  K.waterByDay = function () {
    var now = Date.now(); if (K._wbd && now - K._wbdAt < 1500) return K._wbd; if (K._wbdBusy) return {};
    K._wbdBusy = true;
    try {
      var done = K.get('done', {}) || {}, goals = K.allGoals(), today = K.today(), tk = K.key(today), out = {};
      var due = function (k) { return goals.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived) && K.dueOn(g, k); }); };
      var rate = function (k) { var d = due(k); if (!d.length) return null; return d.filter(function (g) { return done[g.id] && done[g.id][k]; }).length / d.length; };
      var all = {}; for (var id in done) for (var d in (done[id] || {})) all[d] = 1; var list = Object.keys(all).sort();
      if (list.length) {
        var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (x) { rest[x] = 1; });
        var W = 0, seeded = false, day = new Date(list[0] + 'T00:00:00'), floor = K.addDays(today, -150); if (day < floor) day = floor;
        for (var g2 = 0; day < today && g2 < 200; day = K.addDays(day, 1), g2++) { var dk = K.key(day); if (rest[dk]) { if (seeded) out[dk] = Math.round(W); continue; } var r = rate(dk); if (r === null) continue; if (!seeded) { W = r * 100; seeded = true; } else W = K.waterStep(W, r, 1); out[dk] = Math.round(W); }
        out[tk] = K.treeHealth().water;
      }
      K._wbd = out; K._wbdAt = now; return out;
    } finally { K._wbdBusy = false; }
  };
  function streakInfo() {
    var t = today(), tk = key(t), out = { streak: 0, grace: 0, shields: 0, protectedDays: [], graceDays: [] }, KK = window.KZ || {};
    var dn = getRO('done', {}) || {}, gl = KK.allGoals ? KK.allGoals() : goals(), first = null;   /* Oct 24 (speed): read-only */
    for (var id0 in dn) for (var d0 in (dn[id0] || {})) if (!first || d0 < first) first = d0;
    if (!first || !KK.waterStep) return out;
    var due = function (k) { return gl.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived) && K.dueOn(g, k); }); };
    var rate = function (k) { var a = due(k); if (!a.length) return null; return a.filter(function (g) { return dn[g.id] && dn[g.id][k]; }).length / a.length; };
    var nowD = new Date(), hr = nowD.getHours() + nowD.getMinutes() / 60, drainP = Math.max(0, Math.min(1, (hr - (KK.WATER_SAFE_UNTIL || 8)) / (KK.WATER_DRAIN_HOURS || 12)));
    var n = 0, run = 0, shields = 0, prot = [], W = 0, seeded = false, guard = 0, floor = addDays(t, -150), d = new Date(first + 'T00:00:00'); if (d < floor) d = floor;
    for (; guard++ < 400; d = addDays(d, 1)) {
      var k = key(d); if (k > tk) break;
      var r = rate(k); if (r === null) continue; // no goals due that day: neither counts nor breaks
      var isT = k === tk, end = !seeded ? r * 100 : KK.waterStep(W, r, isT ? drainP : 1);
      if (end > 50) { W = end; seeded = true; n++; run++; if (CPS.indexOf(run % 66) >= 0 && shields < SHIELD_MAX) shields++; continue; }
      if (isT) break; // today isn't over
      if (shields > 0) { shields--; prot.push(k); continue; } // rest day: water and streak hold
      W = end; seeded = true; n = 0; run = 0; prot = [];
    }
    out.streak = n; out.shields = n ? shields : 0; out.protectedDays = prot;
    return out;
  }
  function streak() { return streakInfo().streak; }
  function updateStreak() {
    var s = streak(), n = shownDays().length;
    document.querySelectorAll('[data-kz-streak]').forEach(function (el) { el.textContent = s; });
    document.querySelectorAll('[data-kz-streak-pill]').forEach(function (el) { el.hidden = s < 1; });
    document.querySelectorAll('[data-kz-days]').forEach(function (el) { el.textContent = n; });
    var sh = streakInfo().shields; document.querySelectorAll('[data-kz-shields]').forEach(function (el) { el.hidden = !sh || s < 1; el.textContent = sh > 1 ? '×' + sh : ''; el.setAttribute('aria-label', sh + (sh === 1 ? ' streak shield' : ' streak shields')); });
  }

  // tree health: same memo as the core (same answer until data, the day or the minute changes)
  var memoC = null;
  K.treeHealth = function () {
    if (arguments.length || !K._rover) return rawTH.apply(this, arguments);
    var v = K._rover(), d = K.key(K.today()), m = Math.floor(Date.now() / 60000);
    if (!memoC || memoC.v !== v || memoC.d !== d || memoC.m !== m) memoC = { v: v, d: d, m: m, x: rawTH() };
    return Object.assign({}, memoC.x);
  };
  K.treeHealth.__memo = 1;
  K.streakInfo = streakInfo; K.streak = streak; K.updateStreak = updateStreak;

  // ---- the day summary: a habit off that day isn't due (unless you checked it anyway) ----
  function wrapDay(fn) {
    if (!fn || fn.__wd) return fn;
    var w = function (k) {
      var r = fn.apply(this, arguments); if (!r || r.status === 'future') return r;
      try {
        var hit = {}; (r.hit || []).forEach(function (h) { hit[h.id] = 1; });
        var ex = (K._allRO ? K._allRO() : K.allGoals()).filter(function (g) { return offDay(g, k) && !hit[g.id] && (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); }).length;
        if (ex) {
          var due = Math.max(0, r.due - ex); r.due = due;
          if (r.hit && r.hit.length) { r.rate = Math.min(1, r.hit.length / Math.max(due, r.hit.length)); if (r.rate >= 1) r.status = 'full'; }
          else if (!due && r.status === 'setback') r.status = 'none';
        }
      } catch (e) {}
      return r;
    };
    w.__wd = 1; return w;
  }
  // ---- a goal's own streak steps over its off days (like a rest day: doesn't add, doesn't break) ----
  function wrapStats(fn) {
    if (!fn || fn.__wd) return fn;
    var w = function (g) {
      var st = fn.apply(this, arguments); if (!st || !days(g)) return st;
      try {
        var set = st.set || {}, rest = {}, r0 = st.rest || {}, t = K.today(), tk = K.key(t), from = st.first || tk, d, k, n = 0;
        for (k in r0) rest[k] = r0[k];
        for (d = new Date(from + 'T12:00:00'); (k = K.key(d)) <= tk && n++ < 4000; d = K.addDays(d, 1)) if (offDay(g, k) && !set[k]) rest[k] = 1;
        var c = set[tk] ? t : K.addDays(t, -1), cur = 0, guard = 0;
        while (guard++ < 4000) { k = K.key(c); if (k < from) break; if (set[k]) cur++; else if (!rest[k]) break; c = K.addDays(c, -1); }
        var list = Object.keys(set).filter(function (x) { return set[x]; }).sort(), best = 0, run = 0, prev = null;
        list.forEach(function (x) {
          if (prev) { var dd = K.addDays(new Date(prev + 'T12:00:00'), 1), ok = true, m = 0; while (K.key(dd) < x && m++ < 400) { if (!rest[K.key(dd)]) { ok = false; break; } dd = K.addDays(dd, 1); } run = ok ? run + 1 : 1; } else run = 1;
          if (run > best) best = run; prev = x;
        });
        st.streak = cur; st.best = Math.max(best, cur); st.rest = rest;
      } catch (e) {}
      return st;
    };
    w.__wd = 1; return w;
  }
  [['dayInfo', wrapDay], ['goalStats', wrapStats]].forEach(function (p) {
    var name = p[0], wrap = p[1], cur = wrap(K[name]);
    try { Object.defineProperty(K, name, { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrap(v); } }); } catch (e) { K[name] = cur; }
  });
  try { K.updateStreak(); } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzdays-1030b.js ==== */
;try {
/* Oct 30 · Habits on chosen days, part 2 (part 1, kzdays-1030.js, is the rule: K.dueOn / K.offDay).
   - New / edit daily habit: "Which days": Every day · Weekdays · Pick days (S M T W T F S). Saved on the habit as wd
     (0 = Sunday … 6 = Saturday; Every day removes it). Picking all seven days is Every day; at least one day stays picked.
   - Today: a habit on its off day isn't shown.
   - Rows on Today / My goals: the "Daily" tag says the days instead ("Weekdays", "Mon, Wed, Fri").
   - Goal page: the history grid's title says the days, and off days show as rest days (part 1 adds them to the goal's rest set). */
(function () {
  var K = window.KZ; if (!K || K.__kzdaysb) return; K.__kzdaysb = 1;
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], DS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WK = [1, 2, 3, 4, 5];
  function goals() { return K.get('goals', []) || []; }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0]; }
  function norm(w) { if (!Array.isArray(w)) return null; var o = []; w.forEach(function (d) { d = +d; if (d >= 0 && d <= 6 && o.indexOf(d) < 0) o.push(d); }); o.sort(); return o.length && o.length < 7 ? o : null; }
  function same(a, b) { return String(a) === String(b); }
  function label(w) { w = norm(w); if (!w) return 'Every day'; if (same(w, WK)) return 'Weekdays'; if (same(w, [0, 6])) return 'Weekends'; return w.map(function (d) { return DS[d]; }).join(', '); }
  K.habitDaysLabel = label;
  function saveWd(id, w) {
    w = norm(w); var hit = false;
    var all = goals().map(function (g) { if (g.id !== id) return g; hit = true; if (w) g.wd = w; else delete g.wd; return g; });
    if (hit) K.set('goals', all);
  }

  // ---------- the sheet ----------
  var lastEdit = null, pending = null;
  function kind(sh) { var b = sh.querySelector('[data-kind][aria-checked="true"]'); return b ? b.getAttribute('data-kind') : ''; }
  function paintBox(box) {
    var w = box.__wd, mode = !w ? 'all' : same(w, WK) && !box.__pick ? 'wk' : 'pick';
    [].forEach.call(box.querySelectorAll('[data-wdm]'), function (b) { var on = b.getAttribute('data-wdm') === mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    var row = box.querySelector('.kzwd-days'); row.hidden = mode !== 'pick';
    [].forEach.call(row.querySelectorAll('[data-wdd]'), function (b) { var d = +b.getAttribute('data-wdd'), on = !w || w.indexOf(d) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  }
  function ensure(sh) {
    var form = sh.querySelector('form'); if (!form) return null;
    var box = sh.querySelector('.kzwd');
    if (!box) {
      box = document.createElement('div'); box.className = 'kz-field49 kzwd';
      box.innerHTML = '<span class="kz-label49" id="kzwd-l">Which days</span>' +
        '<div class="kzwd-seg" role="radiogroup" aria-labelledby="kzwd-l"><button type="button" role="radio" data-wdm="all">Every day</button><button type="button" role="radio" data-wdm="wk">Weekdays</button><button type="button" role="radio" data-wdm="pick">Pick days</button></div>' +
        '<div class="kzwd-days" role="group" aria-label="Days" hidden>' + DN.map(function (n, i) { return '<button type="button" data-wdd="' + i + '" aria-label="' + DL[i] + '">' + n + '</button>'; }).join('') + '</div>';
      form.appendChild(box);
      box.__wd = null;
      box.addEventListener('click', function (e) {
        var m = e.target.closest('[data-wdm]'), d = e.target.closest('[data-wdd]');
        if (m) { var v = m.getAttribute('data-wdm'); box.__pick = v === 'pick'; box.__wd = v === 'all' ? null : v === 'wk' ? WK.slice() : (box.__wd || WK.slice()); paintBox(box); }
        if (d) {
          var n = +d.getAttribute('data-wdd'), w = box.__wd ? box.__wd.slice() : [0, 1, 2, 3, 4, 5, 6], i = w.indexOf(n);
          if (i >= 0) { if (w.length > 1) w.splice(i, 1); } else w.push(n);
          box.__pick = true; box.__wd = norm(w); if (!box.__wd) box.__pick = true; paintBox(box);
        }
      });
    }
    // sits right above "Make this my Kaizen 66" (or "Make it stick"), never inside the long-term goal's "Break it down"
    var anchor = sh.querySelector('.kzp-66') || [].filter.call(sh.querySelectorAll('.kz-morebtn'), function (x) { return !x.closest('.kzbd'); })[0];
    if (anchor && anchor.parentNode && box.nextElementSibling !== anchor) anchor.parentNode.insertBefore(box, anchor);
    return box;
  }
  function sheets() {
    [].forEach.call(document.querySelectorAll('.kz-goalsheet'), function (sh) {
      var box = ensure(sh); if (!box) return;
      var daily = kind(sh) === 'daily';
      if (box.hidden !== !daily) box.hidden = !daily;
      if (sh.hidden) { sh.__wdFor = 0; return; }
      if (!sh.__wdFor) {
        sh.__wdFor = 1; var g = lastEdit ? goal(lastEdit) : null;
        box.__wd = g ? norm(g.wd) : null; box.__pick = !!(box.__wd && !same(box.__wd, WK)); paintBox(box);
        var f = sh.querySelector('form');
        if (f && !f.__wd) { f.__wd = 1; f.addEventListener('submit', function () { pending = kind(sh) === 'daily' ? { wd: box.__wd, at: Date.now() } : null; }, true); }
      }
    });
  }
  // carry the inner wrapper's own "already wrapped" marks (kzbd's __bd …) so the other add-ons don't wrap us again and again
  function keep(inner, outer) { for (var f in inner) if (/^__/.test(f)) outer[f] = inner[f]; }
  function wrapOpen() {
    if (!K.goalSheet || !K.goalSheet.open || K.goalSheet.open.__wd) return;
    var op = K.goalSheet.open, w = function (o) { lastEdit = o && o.mode === 'edit' ? o.id : null; [].forEach.call(document.querySelectorAll('.kz-goalsheet'), function (sh) { sh.__wdFor = 0; }); var r = op.apply(this, arguments); setTimeout(sheets, 0); return r; };
    keep(op, w); w.__wd = 1; K.goalSheet.open = w;
  }
  function wrapWrites() {
    ['addGoal', 'updateGoal'].forEach(function (name) {
      if (!K[name] || K[name].__wd) return;
      var fn = K[name], w = function (a, b) {
        var r = fn.apply(this, arguments), p = pending; pending = null;
        if (p && Date.now() - p.at < 5000) { var id = name === 'addGoal' ? r : a, o = name === 'addGoal' ? a : b; if (id && (!o || o.kind === undefined || o.kind === 'daily')) saveWd(id, p.wd); }
        return r;
      };
      keep(fn, w); w.__wd = 1; K[name] = w;
    });
  }

  // ---------- Today, rows, goal page ----------
  function paint() {
    q = 0; wrapOpen(); wrapWrites(); sheets();
    var tk = K.key(K.today());
    [].forEach.call(document.querySelectorAll('.kz-goal[data-goal]'), function (row) {
      var g = goal(row.getAttribute('data-goal')); if (!g) return;
      var onToday = !!row.closest('#kz-today-s1'), off = onToday && K.offDay && K.offDay(g, tk);
      if (row.classList.contains('kzwd-off') !== !!off) row.classList.toggle('kzwd-off', !!off);
      var w = (!g.kind || g.kind === 'daily') && !g.quit ? norm(g.wd) : null, tag = row.querySelector('.kz-gstep > i');
      if (tag && (!g.kind || g.kind === 'daily') && !g.quit) { var t = w ? label(w) : 'Daily'; if (tag.textContent !== t) tag.textContent = t; }
      // a daily habit row has no tag of its own: put the days next to its branch (My goals and other lists, not Today)
      var line = row.querySelector('.kz-gline'), chip = row.querySelector('.kzwd-tag');
      if (w && line && !onToday && !tag) {
        if (!chip) { chip = document.createElement('b'); chip.className = 'kzwd-tag'; line.insertBefore(chip, line.querySelector('.kz-gpill') || line.firstChild); }
        var t3 = label(w); if (chip.textContent !== t3) chip.textContent = t3;
      } else if (chip) chip.remove();
    });
    var hist = document.querySelector('.kz-g1hist > .kz-label');
    if (hist) {
      var id = (location.search.match(/[?&]id=([^&#]+)/) || [])[1], g2 = id ? goal(decodeURIComponent(id)) : null, w2 = g2 && norm(g2.wd), t2 = w2 ? label(w2) : 'Every day';
      if (hist.textContent !== t2) hist.textContent = t2;
    }
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  function boot() {
    paint();
    new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && (t.closest('.kzwd') || t.closest('.kzwd-tag'))) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-checked'] });
    ['kz:changed', 'kz:goals', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
    addEventListener('pageshow', soon); document.addEventListener('visibilitychange', soon);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 5760cf871c7f.js ==== */
;try {

/* Kaizen · tree UI: Profile hero, home overview card, first-meeting welcome, Edit tree. */
(function () {
  var K = window.KZ; if (!K || !K.lifeTree) return;
  var DROP = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/></svg>';
  var pl = function (n, a, b) { return n + ' ' + (n === 1 ? a : b); };
  K.treeWaterLine = function (h) {
    if (h.status === 'seed') return 'Complete a goal to give ' + K.treeRef() + ' its first water.';
    return (h.todayDue ? h.todayDone + ' of ' + pl(h.todayDue, 'goal', 'goals') + ' done today · ' : '') + h.water + '% water';
  };
  var later = function () { try { return sessionStorage.getItem('kz_treelater') === '1'; } catch (e) { return false; } };
  var onboarding = function () { var w = document.querySelector('.kz-welcome'); return w && !w.hidden; };
  var lockScroll = function (on) { document.documentElement.style.overflow = on ? 'hidden' : ''; };
  var spButtons = function (cur, cls) {
    return (K.pickerSpecies ? K.pickerSpecies(cur) : Object.keys(K.SPECIES)).map(function (k) { var sp = K.SPECIES[k];
      var lock = K.speciesUnlocked && !K.speciesUnlocked(k); return '<button type="button" class="' + cls + (lock ? ' is-locked' : '') + '" data-sp="' + k + '" aria-pressed="' + (k === cur) + '"' + (lock ? ' disabled aria-label="' + sp.name + ', unlocks at ' + K.speciesNeed(k) + '"' : '') + '>' + (cls === 'kz-twsp' ? '<span class="kz-twsp-art">' + K.lifeTree({ species: k, demo: 6, mini: true, lite: true }).svg + '</span>' : '<i style="background: linear-gradient(135deg, ' + sp.leaf[0] + ', ' + sp.leaf[2] + ')"></i>') + '<span>' + (lock ? '🔒 ' + K.speciesNeed(k) : sp.name) + '</span></button>'; }).join('');
  };
  var pick = function (box, k) { box.querySelectorAll('[data-sp]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sp === k)); }); };

  // ---------- First meeting: full screen, needs a name ----------
  var welcomeOpen = false;
  K.openTreeWelcome = function () {
    if (welcomeOpen) return; welcomeOpen = true;
    var sp = K.treeSpecies(), el = document.createElement('div');
    el.className = 'kz-twelcome'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'kz-tw-h');
    el.innerHTML = '<div class="kz-twin">' +
      '<span class="kz-label gold">Your tree</span><h1 class="kz-serif-title" id="kz-tw-h">Something just sprouted.</h1>' +
      '<p class="kz-soft">Every goal you complete waters it. Skip days and it dries out. Look after it and it grows for years.</p>' +
      '<div class="kz-twprev" data-tw="prev"></div>' +
      '<label class="kz-twlab" for="kz-tw-name">Name it</label>' +
      '<input id="kz-tw-name" class="kz-input" maxlength="20" autocomplete="off" placeholder="Give it a name" required>' +
      '<p class="kz-twerr" data-tw="err" aria-live="polite"></p>' +
      '<span class="kz-twlab">Choose what it grows into</span>' +
      '<div class="kz-twgrid" role="group" aria-label="Tree type" data-tw="sp">' + spButtons(sp, 'kz-twsp') + '</div>' +
      '<button type="button" class="kz-btn navy pill wide" data-tw="plant">Plant it</button>' +
      '<button type="button" class="kz-quiet" data-tw="later">Decide later</button></div>';
    document.body.appendChild(el); lockScroll(true);
    var q = function (k) { return el.querySelector('[data-tw="' + k + '"]'); }, inp = el.querySelector('#kz-tw-name');
    var prev = function () { q('prev').innerHTML = K.treeHealth().status === 'seed' ? K.lifeTree({ species: sp, demo: K.sproutDemo(), mini: true }).svg : K.lifeTree({ species: sp, mini: true }).svg; }; // your tree, at its real size, in the new species
    prev();
    q('sp').addEventListener('click', function (e) { var b = e.target.closest('[data-sp]'); if (!b) return; sp = b.dataset.sp; pick(q('sp'), sp); prev(); });
    inp.addEventListener('input', function () { q('err').textContent = ''; });
    var close = function () { el.remove(); lockScroll(false); welcomeOpen = false; document.dispatchEvent(new CustomEvent('kz:changed')); };
    q('plant').addEventListener('click', function () {
      var n = inp.value.trim(); if (!n) { q('err').textContent = 'Give it a name first.'; inp.focus(); return; }
      K.plantTree(n, sp); close();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); q('plant').click(); } });
    q('later').addEventListener('click', function () { try { sessionStorage.setItem('kz_treelater', '1'); } catch (e) {} K.track('kz_tree_later'); close(); });
    // No other way out: Escape does nothing until it has a name or "Decide later" is chosen.
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } });
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 50);
    K.track('kz_tree_welcome');
  };
  var maybeWelcome = function (delay) { if (K.treePlanted() || later() || welcomeOpen || /[?&](account|signedin)=/.test(location.search) || /access_token=/.test(location.hash)) return; setTimeout(function () { if (!K.treePlanted() && !later() && !onboarding()) K.openTreeWelcome(); }, delay || 0); };
  document.addEventListener('kz:step', function () { maybeWelcome(1300); });

  // ---------- Edit tree: costs 2% of its height ----------
  K.openTreeEdit = function (done) {
    var name = K.treeName(), sp = K.treeSpecies(), el = document.createElement('div');
    el.className = 'kz-tmodal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'kz-te-h');
    el.innerHTML = '<div class="kz-tmbox"><h2 class="kz-h2" id="kz-te-h">Edit tree</h2>' +
      '<p class="kz-twarn" data-te="warn">Replanting as a different tree stresses it. It will lose 2% of its height.</p>' +
      '<span class="kz-twlab">Tree type</span><div class="kz-species" role="group" aria-label="Tree type" data-te="sp">' + spButtons(sp, 'kz-sp') + '</div>' +
      '<div class="kz-row" style="gap: 10px; justify-content: center; width: 100%"><button type="button" class="kz-btn ghost" data-te="cancel">Cancel</button><button type="button" class="kz-btn kz-danger" data-te="ok">Confirm</button></div></div>';
    document.body.appendChild(el); lockScroll(true);
    var q = function (k) { return el.querySelector('[data-te="' + k + '"]'); }, chosen = sp;
    var close = function () { el.remove(); lockScroll(false); };
    q('sp').addEventListener('click', function (e) { var b = e.target.closest('[data-sp]'); if (b) { chosen = b.dataset.sp; pick(q('sp'), chosen); } });
    q('cancel').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    q('ok').addEventListener('click', function () {
      var changed = K.editTree('', chosen); close();
      if (done) done(changed && chosen !== sp);
    });
    setTimeout(function () { q('cancel').focus(); }, 30);
  };

  // ---------- Profile hero ----------
  // Branches: one row per pillar. The bar is that pillar's share of the tree's growth; the number is days of growth from it. (Shown on Progress.)
  K.branchesHTML = function (lt) {
          var tot = 0, mx = 0; K.PATHS.forEach(function (p) { var v = lt.perPillar[p.id] || 0; tot += v; mx = Math.max(mx, v); });
          return '<div class="kz-brbar" data-t="legend"><div class="kz-brbar-h"><span>Branches</span><small>What each branch has grown</small></div>' +
            K.PATHS.map(function (p) { var has = K.goalsIn(p.id) > 0, v = lt.perPillar[p.id] || 0;
              return '<a class="kz-br-row' + (has ? '' : ' idle') + '" href="/pages/my-goals?pillar=' + p.id + (has ? '' : '#add') + '" data-pillar="' + p.id + '"><i style="background: ' + p.c2 + '"></i><span class="kz-br-n">' + K.esc(p.name) + '</span>' +
                (has ? '<span class="kz-br-bar"><b style="width: ' + (mx ? Math.max(4, Math.round(100 * v / mx)) : 0) + '%; background: ' + p.c2 + '"></b></span><span class="kz-br-v">' + (v ? (Math.round(v * 10) / 10) + (v === 1 ? ' day' : ' days') : 'Not yet') + '</span>' : '<span class="kz-br-add">+ Add a goal</span>') + '</a>'; }).join('') + '</div>';
  };
  K.mountTreeHero = function (el) {
    var fresh = null, note = false;
    try { if (!K.get('treev35', 0) && K.totalSteps && K.totalSteps() > 0) { note = true; K.set('treev35', 1); } } catch (e) {}
    var paint = function (regrow) {
      var lt = K.lifeTree({ fresh: fresh }), h = lt.health, st = h.status, nm = K.treeName(), wk = lt.week, td = lt.today; fresh = null;
      var lostTxt = ''; if (lt.lost) { var bits = []; if (h.missed) bits.push(pl(h.missed, 'missed day', 'missed days')); if (h.stress) bits.push(pl(h.stress, 'edit', 'edits')); lostTxt = 'Lost ' + K.treeHeight(lt.lost) + ' so far (' + bits.join(' · ') + ').'; }
      var chips = K.PATHS.map(function (p) { var has = K.goalsIn(p.id) > 0;
        return '<a class="kz-pathchip' + (has ? '' : ' kz-idlechip') + '" href="/pages/my-goals?pillar=' + p.id + (has ? '' : '#add') + '" data-pillar="' + p.id + '"><i style="background: ' + p.c2 + (has ? '' : '; opacity: .5') + '"></i>' + K.esc(p.name) + ' <b>' + (has ? (lt.perPillar[p.id] || 0) : '+') + '</b></a>'; }).join('');
      el.innerHTML = '<div class="kz-treecard kz-treehero">' +
        '<span class="kz-label gold">Your tree</span>' +
        '<h1 class="kz-treename" data-t="name">' + K.esc(K.treeLabel()) + '</h1>' +
        '<div class="kz-treeart" data-t="art">' + lt.svg + '</div>' +
        '<div class="kz-water ' + st + '" data-t="water">' + DROP + '<div class="kz-waterbar"><i style="width: ' + h.water + '%"></i></div><span>' + h.water + '%</span></div>' +
        '<p class="kz-wline" data-t="wline">' + K.treeWaterLine(h) + '</p>' +
        '<p class="kz-treemood" data-t="mood">' + K.esc(K.treeMood(h)) + '</p>' +
        (function () { var w = lt.wildlife || {}, r = K.treeNamed() ? K.treeName() : 'your tree', parts = [];
          if (w.birds) parts.push(w.birds === 1 ? 'A bird' : w.birds + ' birds'); if (w.squirrel) parts.push(parts.length ? 'a squirrel' : 'A squirrel');
          if (parts.length) return '<p class="kz-twild" data-t="wild">' + parts.join(' and ') + (parts.length > 1 || w.birds > 1 ? ' live in ' : ' lives in ') + K.esc(r) + (w.nest ? ', with a nest' : '') + '.</p>';
          if (lt.steps && lt.visual >= 10 && ['wilting', 'dying', 'dead'].indexOf(st) > -1) return '<p class="kz-twild gone" data-t="wild">The birds moved away. Water ' + K.esc(r) + ' and they’ll come back.</p>';
          return ''; })() +
        (note ? '<p class="kz-tnote" data-t="note">Your tree now grows with your days, not your goal count. A fully completed day adds 1 inch.</p>' : '') +
        '<div class="kz-tstats"><span data-t="week">' + (td > 0 ? '+' + K.treeInches(td) + ' today · ' : '') + (wk > 0 ? '+' + K.treeInches(wk) + ' this week' : 'No growth yet this week') + '</span>' + (lostTxt ? '<span class="lost" data-t="lost">' + lostTxt + '</span>' : '') + '</div>' +
        '</div>';
      var hsv = el.querySelector('.kz-treeart .kz-lifetree'); if (hsv) hsv.setAttribute('preserveAspectRatio', 'xMidYMax meet'); // ground on the bottom edge, sky fills the top
      if (regrow) { var sv = el.querySelector('.kz-lifetree'); if (sv) sv.classList.add('kz-regrow'); }
      var eb = el.querySelector('[data-t="edit"]'); if (eb) eb.addEventListener('click', function () { K.openTreeEdit(function (sp) { paint(sp); }); });
    };
    paint(false);
    document.addEventListener('kz:step', function (e) { var g = K.allGoals().filter(function (x) { return x.id === (e.detail && e.detail.id); })[0]; if (g) fresh = K.pathOf(g); setTimeout(function () { paint(false); }, 900); });
    ['kz:changed', 'kz:goals', 'kz:pillars', 'kz:sky'].forEach(function (ev) { document.addEventListener(ev, function () { if (!document.querySelector('.kz-tmodal')) paint(false); }); });
    maybeWelcome(250);
  };

  // ---------- Home overview card ----------
  K.mountTreeCard = function (el) {
    var paint = function () {
      var lt = K.lifeTree({ mini: true, lite: true }), h = lt.health, nm = K.treeName(), seed = h.status === 'seed';
      el.className = 'kz-tcard' + (seed ? '' : h.water < 20 ? ' red' : h.water < 50 ? ' amber' : '');
      el.innerHTML = '<span class="kz-tcard-art">' + lt.svg + '</span>' +
        '<span class="kz-tcard-txt"><b data-t="name">' + K.esc(K.treeLabel()) + '</b><span data-t="mood">' + K.esc(K.treeMood(h)) + '</span>' +
        '<span class="kz-tcard-w ' + h.status + '" data-t="water">' + DROP + (seed ? 'No water yet' : h.water + '% water') + '</span>' +
        '<span class="kz-tcard-g" data-t="grow">' + (lt.today > 0 ? '+' + K.treeInches(lt.today) + ' today' : h.todayDue ? 'One goal today grows ' + K.esc(K.treeRef()) + ' ' + K.treeInches(1 / h.todayDue) : '') + '</span>' +
        '<a class="kz-tcard-go" href="/pages/profile#tree" data-t="visit">Visit ' + (K.treeNamed() ? K.esc(nm) : 'your tree') + ' →</a></span>';
    };
    paint();
    var cele = 0;
    document.addEventListener('kz:step', function () { setTimeout(function () { if (Date.now() - cele > 2500) paint(); }, 900); });
    ['kz:changed', 'kz:goals'].forEach(function (ev) { document.addEventListener(ev, paint); });
    // Every goal done today: the card pulses and says so (once a day; fired by the goal list).
    document.addEventListener('kz:alldone', function () {
      setTimeout(function () {
        paint(); cele = Date.now(); el.classList.remove('kz-celebrate'); void el.offsetWidth; el.classList.add('kz-celebrate');
        var m = el.querySelector('[data-t="mood"]'); if (m) m.textContent = 'Every goal done. ' + (K.treeNamed() ? K.treeName() : 'Your tree') + ' drank it all up.';
      }, 950);
    });
  };
  var boot = function () {
    document.querySelectorAll('[data-kz-treehero]').forEach(K.mountTreeHero);
    document.querySelectorAll('[data-kz-treecard]').forEach(K.mountTreeCard);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== c25879d1ff95.js ==== */
;try {

(function () {
  var K = window.KZ; if (!K) return;
  var L = {
    health: {
      Movement: [
        { n: 'Run my first 5K', s: 'Jog or walk for 10 minutes', k: 'long' },
        { n: 'Walk 8,000 steps a day', s: 'A 10-minute walk after dinner', k: 'daily' },
        { n: 'Do 50 push-ups in a row', s: 'One set of push-ups before a shower', k: 'long' },
        { n: 'Lift three times a week', s: 'Pack the gym bag the night before', k: 'long' }
      ],
      Food: [
        { n: 'Eat a vegetable with every lunch', s: 'Add one vegetable to lunch', k: 'daily' },
        { n: 'Cook dinner at home most nights', s: 'Pick tomorrow’s dinner before bed', k: 'long' },
        { n: 'Drink water before coffee', s: 'A full glass of water first thing', k: 'daily' },
        { n: 'Cut back on late-night snacks', s: 'Kitchen closes an hour before bed', k: 'daily' }
      ],
      Sleep: [
        { n: 'Sleep 8 hours on weeknights', s: 'In bed by 11', k: 'long' },
        { n: 'Wake up at the same time daily', s: 'Alarm across the room, same time', k: 'daily' },
        { n: 'No screens in bed', s: 'Phone charges outside the bedroom', k: 'daily' },
        { n: 'Build a wind-down routine', s: '10 minutes of no screens before sleep', k: 'long' }
      ],
      Recovery: [
        { n: 'Touch my toes again', s: 'Stretch for 5 minutes after waking up', k: 'long' },
        { n: 'Take one real rest day a week', s: 'Plan this week’s rest day', k: 'long' },
        { n: 'Foam roll after workouts', s: 'Two minutes on the tightest spot', k: 'daily' },
        { n: 'Fix my posture', s: 'Shoulders back, chin tucked for one minute', k: 'daily' }
      ]
    },
    mind: {
      Learning: [
        { n: 'Read 12 books this year', s: 'Read 10 pages before bed', k: 'long' },
        { n: 'Learn conversational Spanish', s: 'One lesson in a language app', k: 'long' },
        { n: 'Learn to code a simple app', s: '15 minutes of a coding tutorial', k: 'long' },
        { n: 'Learn one new thing every day', s: 'Write down one thing learned today', k: 'daily' }
      ],
      Focus: [
        { n: 'Spend less time on my phone', s: 'No phone for the first 30 minutes of the day', k: 'long' },
        { n: 'Do one hour of deep work daily', s: 'Phone in another room for 25 minutes', k: 'daily' },
        { n: 'Finish what I start', s: 'Finish one small thing before starting another', k: 'daily' },
        { n: 'Plan each day the night before', s: 'Write tomorrow’s top three tasks', k: 'daily' }
      ],
      Calm: [
        { n: 'Meditate every day', s: 'Two minutes of slow breathing each morning', k: 'daily' },
        { n: 'Worry less about what others think', s: 'Name one worry and let it go on paper', k: 'long' },
        { n: 'Handle stress better', s: 'Three slow breaths before reacting', k: 'long' },
        { n: 'Spend time outside every day', s: '10 minutes outside, no headphones', k: 'daily' }
      ],
      Reflection: [
        { n: 'Keep a daily journal', s: 'Write three lines about today', k: 'daily' },
        { n: 'Be kinder to myself', s: 'Write one thing done well today', k: 'long' },
        { n: 'Know what I want from life', s: 'Answer the daily question honestly', k: 'long' },
        { n: 'Practice gratitude', s: 'Name three good things before sleep', k: 'daily' }
      ]
    },
    wealth: {
      Saving: [
        { n: 'Save $1,000 emergency fund', s: 'Move $5 into savings', k: 'long' },
        { n: 'Track every dollar for a month', s: 'Write down every purchase today', k: 'long' },
        { n: 'Stop impulse buying', s: 'Wait 24 hours before buying anything over $20', k: 'daily' },
        { n: 'Pay off my credit card', s: 'Check the balance and pay something extra', k: 'long' }
      ],
      Earning: [
        { n: 'Start a side hustle', s: 'Spend 20 minutes building it', k: 'long' },
        { n: 'Make my first $100 online', s: 'Send one message to a possible customer', k: 'long' },
        { n: 'Ask for a raise', s: 'Write down one win at work this week', k: 'long' },
        { n: 'Grow my brand to 1,000 followers', s: 'Post or engage for 15 minutes', k: 'long' }
      ],
      Career: [
        { n: 'Land an internship', s: 'Send one application or one outreach message', k: 'long' },
        { n: 'Build a strong resume', s: 'Improve one line on the resume', k: 'long' },
        { n: 'Grow my network', s: 'Reach out to one person in the field', k: 'long' },
        { n: 'Get better grades this semester', s: 'Review notes for 15 minutes', k: 'long' }
      ],
      Investing: [
        { n: 'Open an investment account', s: 'Read for 10 minutes about index funds', k: 'long' },
        { n: 'Invest every month', s: 'Check the plan and move one small amount', k: 'long' },
        { n: 'Understand how the market works', s: 'Read one page about investing', k: 'long' },
        { n: 'Learn to make a budget', s: 'Fill in one line of a monthly budget', k: 'long' }
      ]
    },
    relationships: {
      Family: [
        { n: 'Call my family every week', s: 'Call or text family for 5 minutes', k: 'long' },
        { n: 'Be closer with my siblings', s: 'Send a sibling something funny', k: 'long' },
        { n: 'Have dinner with family more', s: 'Ask when the next family dinner is', k: 'long' },
        { n: 'Visit my grandparents more', s: 'Send grandma or grandpa a message', k: 'long' }
      ],
      Friends: [
        { n: 'Stay in touch with old friends', s: 'Text one friend not talked to in a while', k: 'long' },
        { n: 'Make one new friend', s: 'Start one conversation with someone new', k: 'long' },
        { n: 'Be a better listener', s: 'Ask a follow-up question before talking', k: 'daily' },
        { n: 'Plan more time with friends', s: 'Suggest one plan for this week', k: 'long' }
      ],
      Partner: [
        { n: 'Be a better partner', s: 'Say one specific thing appreciated today', k: 'long' },
        { n: 'Plan a date every week', s: 'Pick a day and an idea for the next date', k: 'long' },
        { n: 'Argue less, talk more', s: 'Pause and breathe before replying when upset', k: 'daily' },
        { n: 'Put the phone away together', s: 'Phones away for dinner', k: 'daily' }
      ],
      Community: [
        { n: 'Volunteer once a month', s: 'Look up one place to volunteer', k: 'long' },
        { n: 'Do one kind thing a day', s: 'Hold a door, give a compliment, help someone', k: 'daily' },
        { n: 'Join a club or team', s: 'Look up one club and when it meets', k: 'long' },
        { n: 'Cut out drama', s: 'Walk away from one gossip conversation', k: 'daily' }
      ]
    },
    passion: { // shown as "Personal"
      Adventure: [
        { n: 'Ride my dirt bike more', s: 'Check the bike or plan the next ride', k: 'long' },
        { n: 'Go fishing twice a month', s: 'Prep one piece of gear or pick a spot', k: 'long' },
        { n: 'Hike 10 new trails this year', s: 'Look up one new trail', k: 'long' },
        { n: 'Learn to surf or snowboard', s: 'Watch one technique video', k: 'long' }
      ],
      Making: [
        { n: 'Get better at guitar', s: 'Play guitar for 10 minutes', k: 'long' },
        { n: 'Draw or paint every week', s: 'Sketch something for 10 minutes', k: 'long' },
        { n: 'Make content I am proud of', s: 'Write one idea or film one clip', k: 'long' },
        { n: 'Build something with my hands', s: 'Work on the project for 15 minutes', k: 'long' }
      ],
      Collecting: [
        { n: 'Take great care of my reptiles', s: 'Check heat, water and humidity', k: 'daily' },
        { n: 'Set up a new reptile enclosure', s: 'Research or build one part of it', k: 'long' },
        { n: 'Grow my collection', s: 'Spend 10 minutes learning about the next piece', k: 'long' },
        { n: 'Start a plant collection', s: 'Water and check one plant', k: 'daily' }
      ],
      Dreams: [
        { n: 'Make time for hobbies every week', s: '15 minutes on something loved, no phone', k: 'long' },
        { n: 'Try one new thing each month', s: 'Look up one new thing to try', k: 'long' },
        { n: 'Travel somewhere I have never been', s: 'Save $5 or research one place', k: 'long' },
        { n: 'Write down my biggest dream', s: 'Add one line to the plan for it', k: 'long' }
      ]
    }
  };

  // ---------- More ideas (v48): 5 more per category + new categories. Same shape as above. ----------
  var MORE = {
    health: {
      Movement: [['Run a half marathon', 'Run or walk for 20 minutes', 'long'], ['Do a pull-up', 'Hang from a bar for 20 seconds', 'long'], ['Hike a big trail this year', 'Take the stairs everywhere today', 'long'], ['Move every hour at work', 'Stand and stretch once an hour', 'daily'], ['Bike to class or work', 'Check the tires and route tonight', 'long']],
      Food: [['Eat protein at every meal', 'Add one protein to breakfast', 'daily'], ['Meal prep on Sundays', 'Write this week’s grocery list', 'long'], ['Cut down on soda', 'Swap one soda for sparkling water', 'daily'], ['Eat slower and stop at full', 'Put the fork down between bites', 'daily'], ['Learn five healthy recipes', 'Save one recipe to try', 'long']],
      Sleep: [['Fall asleep without my phone', 'Read paper for 10 minutes in bed', 'daily'], ['Stop hitting snooze', 'Feet on the floor at the first alarm', 'daily'], ['Get morning sunlight', 'Five minutes outside after waking up', 'daily'], ['Cut caffeine after 2 pm', 'Last coffee before lunch', 'daily'], ['Nap smarter', 'Set a 20-minute timer for naps', 'daily']],
      Recovery: [['Do yoga twice a week', 'Ten minutes of a yoga video', 'long'], ['Get my mobility back', 'Hip openers for 5 minutes', 'long'], ['Drink enough water', 'Refill the bottle every time it’s empty', 'daily'], ['Take care of my skin', 'Wash face and sunscreen in the morning', 'daily'], ['Book the checkups I’ve skipped', 'Make one appointment call', 'long']],
      Strength: [['Squat my bodyweight', 'Three sets of goblet squats', 'long'], ['Hold a 2-minute plank', 'Plank for as long as I can, once', 'long'], ['Gain 10 pounds of muscle', 'Hit today’s protein and one lift', 'long'], ['Never skip leg day', 'Lunges while the coffee brews', 'daily'], ['Learn proper deadlift form', 'Watch one form video and practice', 'long']]
    },
    mind: {
      Learning: [['Finish an online course', 'One lesson of the course', 'long'], ['Learn to play chess well', 'One chess puzzle', 'daily'], ['Understand investing basics', 'Read one page about investing', 'long'], ['Learn to type faster', 'Five minutes of typing practice', 'daily'], ['Read the news less, books more', 'Swap one scroll for one chapter', 'daily']],
      Focus: [['Get my screen time under 2 hours', 'Delete one time-wasting app for a day', 'long'], ['Single-task my mornings', 'One task, one tab, 25 minutes', 'daily'], ['Keep a clean desk', 'Clear the desk for 2 minutes', 'daily'], ['Stop procrastinating on hard tasks', 'Start the hardest task for 5 minutes', 'daily'], ['Turn off notifications', 'Silence one more app today', 'long']],
      Calm: [['Handle stress better', 'Box breathing for one minute', 'daily'], ['Spend time in nature every week', 'Ten minutes outside without the phone', 'long'], ['Be kinder to myself', 'Write one thing I did well today', 'daily'], ['Cut back on doom scrolling', 'Phone down at the first bad headline', 'daily'], ['Have quiet mornings', 'Five minutes of silence with coffee', 'daily']],
      Reflection: [['Journal every day', 'Three lines about today', 'daily'], ['Know my values', 'Write one thing that matters to me', 'long'], ['Review my week every Sunday', 'Five minutes: wins, misses, next week', 'long'], ['Practice gratitude', 'Write one thing I’m grateful for', 'daily'], ['Write a letter to future me', 'Add one paragraph', 'long']],
      Creativity: [['Write a short story', 'Write 100 words', 'long'], ['Fill a sketchbook', 'One quick sketch', 'daily'], ['Come up with one idea a day', 'Write one idea down', 'daily'], ['Learn to take great photos', 'Take one intentional photo', 'daily'], ['Start a blog or newsletter', 'Draft one paragraph', 'long']]
    },
    wealth: {
      Saving: [['Build a $1,000 emergency fund', 'Move $5 into savings', 'long'], ['Save for a car', 'Skip one purchase and save it', 'long'], ['Stop impulse buying', 'Wait 24 hours before buying', 'daily'], ['Pack lunch instead of buying', 'Pack tomorrow’s lunch tonight', 'daily'], ['Cancel subscriptions I don’t use', 'Check one subscription', 'long']],
      Earning: [['Start a side hustle', '20 minutes on the side project', 'long'], ['Make my first $100 online', 'One step on something that could sell', 'long'], ['Ask for a raise', 'Write down one win from this month', 'long'], ['Sell things I don’t use', 'List one item for sale', 'long'], ['Pick up more shifts', 'Ask about one extra shift', 'long']],
      Career: [['Land an internship', 'Send one application or message', 'long'], ['Build my LinkedIn', 'Improve one section', 'long'], ['Get better at interviews', 'Practice one answer out loud', 'long'], ['Find a mentor', 'Reach out to one person', 'long'], ['Raise my GPA', 'Review notes for 20 minutes', 'long']],
      Investing: [['Open a Roth IRA', 'Read one guide on getting started', 'long'], ['Invest every month', 'Check the plan for this month', 'long'], ['Understand index funds', 'Read one page on index funds', 'long'], ['Track my net worth', 'Update the tracker', 'long'], ['Learn to read a stock chart', 'Study one chart for 10 minutes', 'long']],
      Money: [['Make a budget and stick to it', 'Write down every purchase today', 'daily'], ['Pay off my credit card', 'Pay a little extra this week', 'long'], ['Check my bank balance daily', 'Open the bank app every morning', 'daily'], ['Spend on what matters', 'Ask: do I need it or want it?', 'daily'], ['Learn to do my own taxes', 'Read one page about taxes', 'long']]
    },
    relationships: {
      Family: [['Have dinner with family weekly', 'Text the family to plan dinner', 'long'], ['Call my grandparents', 'Five-minute call', 'long'], ['Be more patient at home', 'Pause before reacting once today', 'daily'], ['Help out around the house', 'Do one chore nobody asked for', 'daily'], ['Learn my family’s story', 'Ask one question about the past', 'long']],
      Friends: [['Make new friends', 'Say hi to one new person', 'long'], ['Reconnect with old friends', 'Message one old friend', 'long'], ['Be the friend who plans things', 'Propose one plan', 'long'], ['Remember birthdays', 'Add one birthday to my calendar', 'long'], ['Show up when friends need me', 'Check on one friend', 'daily']],
      Partner: [['Plan a date every week', 'Plan or suggest one date', 'long'], ['Listen better', 'Ask a follow-up question', 'daily'], ['Say I appreciate them', 'Tell them one thing I appreciate', 'daily'], ['Put my phone down together', 'Phone away during time together', 'daily'], ['Grow together', 'Share one goal with each other', 'long']],
      Community: [['Volunteer once a month', 'Look up one place to volunteer', 'long'], ['Join a club or team', 'Find one club to try', 'long'], ['Be kind to strangers', 'One small kind act', 'daily'], ['Support local businesses', 'Buy one thing local this week', 'long'], ['Mentor someone younger', 'Offer help to one person', 'long']],
      Confidence: [['Speak up more in groups', 'Share one thought out loud', 'daily'], ['Get better at small talk', 'Ask one person about their day', 'daily'], ['Set healthy boundaries', 'Say no to one thing I don’t want', 'daily'], ['Make eye contact', 'Hold eye contact in one conversation', 'daily'], ['Give a speech without fear', 'Practice speaking for 2 minutes', 'long']]
    },
    passion: {
      Adventure: [['Visit 3 new states this year', 'Research one trip', 'long'], ['Go camping', 'Get one piece of gear ready', 'long'], ['Learn to surf', 'Watch one surf lesson', 'long'], ['See a sunrise every month', 'Set an early alarm for this week', 'long'], ['Say yes to new experiences', 'Say yes to one new thing', 'daily']],
      Making: [['Learn guitar', 'Practice for 15 minutes', 'long'], ['Make a short film', 'Film or edit for 15 minutes', 'long'], ['Cook a new dish every week', 'Pick this week’s dish', 'long'], ['Design my own clothing', 'Sketch one design', 'long'], ['Learn to DJ or make beats', '15 minutes in the app', 'long']],
      Collecting: [['Build a record collection', 'Listen to one album start to finish', 'long'], ['Grow a garden', 'Water and check the garden', 'daily'], ['Restore something old', '15 minutes on the project', 'long'], ['Start a sneaker collection', 'Research one pair', 'long'], ['Keep a photo journal', 'Print or save one photo', 'daily']],
      Dreams: [['Write my bucket list', 'Add one item', 'long'], ['Start my own business', 'One step on the business plan', 'long'], ['Live abroad for a while', 'Research one city', 'long'], ['Run a marathon someday', 'Run for 20 minutes', 'long'], ['Build a life I’m proud of', 'Do one thing future me will thank me for', 'daily']],
      Play: [['Get good at a video game', 'One focused practice session', 'long'], ['Play a sport again', 'Find a pickup game or court', 'long'], ['Learn a magic trick', 'Practice one trick for 10 minutes', 'long'], ['Have a weekly game night', 'Invite one person', 'long'], ['Laugh more', 'Watch or read something funny', 'daily']]
    }
  };
  Object.keys(MORE).forEach(function (p) { L[p] = L[p] || {}; Object.keys(MORE[p]).forEach(function (c) { L[p][c] = (L[p][c] || []).concat(MORE[p][c].map(function (x) { return { n: x[0], s: x[1], k: x[2] }; })); }); });
  K.LIBRARY = L;
  // Flat list with pillar and category on each item.
  K.libraryList = function (pillar) {
    var out = [];
    Object.keys(L).forEach(function (p) {
      if (pillar && p !== pillar) return;
      Object.keys(L[p]).forEach(function (c) { L[p][c].forEach(function (g) { out.push({ p: p, c: c, n: g.n, s: g.s, k: g.k }); }); });
    });
    return out;
  };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 1a12b3b6421c.js ==== */
;try {

(function () {
  // Suggestions for any branch, including ones you name yourself (Sleep, Fitness, School...).
  // A custom branch's name is matched to topics; built-in branches also get every matching topic on top of their own list.
  var K = window.KZ; if (!K || !K.libraryList) return;
  var T = {"fitness": {"re": "fit|gym|workout|train|exercis|lift|strength|run|sport|athlet|wrestl|jiu|bjj|martial|box|swim|cycl|bike|yoga|body|muscle|cardio|marathon|physique|move|movement|active", "items": [["Bench press my body weight", "Do your bench sets, add 2.5 lb when it feels easy"], ["Run a 5K under 25 minutes", "Run 20 minutes, last 5 at race pace"], ["Lift 4 days a week", "Pack the gym bag the night before"], ["Do 20 pull-ups in a row", "3 sets of pull-ups to near failure"], ["Gain 10 lb of muscle", "Lift, then eat a real meal within 2 hours"], ["Touch my toes", "10 minutes of stretching after training"], ["Run a half marathon", "Run or walk for 30 minutes"], ["Squat 1.5x my body weight", "Squat day: work up to a heavy triple"], ["Hold a 3-minute plank", "Plank to failure, beat yesterday"], ["Train a martial art 3x a week", "Drill one technique for 10 minutes"], ["Swim a mile without stopping", "Swim 20 laps"], ["Walk 10,000 steps", "Walk 10 minutes after every meal", "d"], ["Never miss two workouts in a row", "Show up, even for 15 minutes", "d"], ["Do a muscle-up", "Explosive pull-ups and dips"], ["Bike a 100-mile ride", "Ride for 45 minutes"], ["Fix my posture", "Wall angels and face pulls, 5 minutes", "d"], ["Do 100 push-ups in one day", "5 sets of push-ups spread through the day"], ["Stretch every morning", "5 minutes of mobility before your phone", "d"]]}, "nutrition": {"re": "nutri|diet|eat|eating|food|meal|cook|protein|calor|weight|cut|bulk|lean|hydrat|water", "items": [["Hit my protein goal every day", "Protein with every meal", "d"], ["Cook dinner 5 nights a week", "Pick tomorrow's dinner tonight"], ["Drink 3 liters of water a day", "Refill your bottle 4 times", "d"], ["Cut out soda", "Swap soda for sparkling water", "d"], ["Eat vegetables at every meal", "One vegetable on every plate", "d"], ["Meal prep on Sundays", "Write this week's grocery list"], ["Stop eating after 9pm", "Kitchen closes at 9", "d"], ["Lose 10 lb", "Track today's food honestly"], ["Eat breakfast every day", "Something with protein by 9am", "d"], ["Cut fast food to once a week", "Pack lunch tonight"], ["Learn 10 healthy recipes", "Try one new recipe this week"], ["Eat fruit instead of dessert", "Fruit after dinner", "d"], ["Bulk 10 lb the right way", "Hit today's calories, mostly real food"], ["Learn to cook 5 meals by heart", "Cook one of them tonight"]]}, "sleep": {"re": "sleep|bed|bedtime|recover|recovery|night|wake|morning routine|energy|tired", "items": [["Sleep 8 hours on weeknights", "Lights out by 11"], ["Wake up at 6:30 every day", "Alarm across the room, same time daily", "d"], ["No phone in bed", "Phone charges outside the bedroom", "d"], ["Fall asleep in under 20 minutes", "No screens the last 30 minutes"], ["Stop hitting snooze", "Get up on the first alarm", "d"], ["Keep a wind-down routine", "Dim lights and read 10 pages"], ["No caffeine after 2pm", "Last coffee before lunch", "d"], ["Make my room a sleep cave", "Cool, dark, quiet: fix one thing"], ["Go to bed before midnight", "Start winding down at 11", "d"], ["Wake up without an alarm", "Same bedtime every night"], ["Morning sunlight every day", "5 minutes outside after waking", "d"], ["Keep the same wake time on weekends", "Weekend alarm within an hour of weekdays"]]}, "school": {"re": "school|educat|learn|class|study|studies|gpa|grade|exam|college|universit|homework|course|academ|semester|test|student|major", "items": [["Get a 3.5 GPA this semester", "Study 1 focused hour"], ["Ace the next exam", "Do 10 practice problems"], ["Never miss a class", "Pack your bag the night before", "d"], ["Turn every assignment in early", "Work on the next assignment for 25 minutes"], ["Read every assigned chapter", "Read 10 pages"], ["Go to office hours weekly", "Write one question for the professor"], ["Make the dean's list", "Review today's notes for 15 minutes"], ["Start a study group", "Message one classmate"], ["Master my hardest class", "One problem set, no phone"], ["Keep a clean planner", "Plan tomorrow's study blocks", "d"], ["Finish the semester with no all-nighters", "Start assignments the day they're given"], ["Take better notes", "Rewrite today's notes in your own words"], ["Get ahead on the reading", "Read tomorrow's chapter today"], ["Score high on my entrance exam", "10 minutes of practice questions"]]}, "reading": {"re": "read|reading|book|books|learn|learning|knowledge|mind|brain|language|spanish|french|wisdom|smart|educat", "items": [["Read 24 books this year", "Read 10 pages", "d"], ["Finish one book a month", "Read 20 minutes before bed"], ["Learn a new language", "10 minutes of practice", "d"], ["Read one long article a day", "Read one in place of a scroll", "d"], ["Read more nonfiction", "One chapter of a nonfiction book"], ["Take notes on every book", "Write one takeaway"], ["Listen to audiobooks on walks", "Listen during your walk", "d"], ["Read the classics I skipped", "15 pages of a classic"], ["Learn something new every week", "20 minutes on this week's topic"], ["Keep a reading list", "Add one book you want next"]]}, "discipline": {"re": "disciplin|habit|routine|productiv|focus|consisten|grind|hustle|self.?improv|growth|better|goal|time|procrastinat|phone|screen", "items": [["Wake up before 7 every day", "Same alarm, feet on the floor", "d"], ["Cut screen time in half", "App limits on, check screen time", "d"], ["Do deep work every morning", "One 45-minute block, phone in another room", "d"], ["Stop procrastinating on hard things", "Do the hardest task first, 25 minutes"], ["Plan every day the night before", "Write tomorrow's top 3", "d"], ["Keep a 30-day streak", "Check off today, even a small version", "d"], ["No social media before noon", "Phone stays on airplane mode until you're dressed", "d"], ["Make my bed every morning", "Make it before you leave the room", "d"], ["Do a weekly review", "15 minutes: what worked, what to change"], ["Finish what I start", "Pick one open thing and close it"], ["Cold shower every morning", "Last 30 seconds cold", "d"], ["One hour a day with no phone", "Put it in a drawer for an hour", "d"]]}, "selfcare": {"re": "self.?care|skin|groom|style|hygiene|look|looks|confiden|appearance|fashion|glow", "items": [["Build a skincare routine", "Morning and night skincare", "d"], ["Dress better", "Plan tomorrow's outfit", "d"], ["Get a haircut every 3 weeks", "Book the next cut"], ["Keep my room clean", "10-minute reset before bed", "d"], ["Feel more confident", "Do one thing that scares you a little"], ["Floss every night", "Floss before bed", "d"], ["Build a signature look", "Pick one piece to upgrade this month"]]}, "faith": {"re": "faith|god|church|pray|prayer|bible|spirit|spiritual|relig|worship|mass|soul|christ|jesus|lord|islam|quran|muslim|jewish|torah|temple|mosque", "items": [["Pray every day", "Pray for 5 minutes in the morning", "d"], ["Read the whole Bible", "Read one chapter"], ["Go to service every week", "Plan the morning the night before"], ["Memorize 12 verses this year", "Repeat this week's verse 3 times"], ["Keep a gratitude journal", "Write 3 things you're grateful for", "d"], ["Serve my community monthly", "Look up one volunteer spot"], ["Join a small group", "Reach out to one group leader"], ["Fast once a month", "Plan the next fast day"], ["Read a book on faith", "Read 10 pages"], ["Pray before every meal", "Pause before you eat", "d"], ["Be kinder to strangers", "One small kindness today", "d"], ["Start each day in silence", "5 minutes of quiet before your phone", "d"]]}, "finances": {"re": "financ|money|save|saving|savings|invest|budget|debt|wealth|rich|trad|stock|futures|credit|income|cash|retire", "items": [["Save $2,000", "Move $5 into savings", "d"], ["Build a 3-month emergency fund", "Automate one transfer"], ["Pay off my credit card", "Pay a little extra today"], ["Invest every month", "Put $25 into your index fund"], ["Track every purchase", "Log today's purchases", "d"], ["Learn to trade with a written plan", "Journal every trade", "d"], ["Learn to read financial statements", "Read one section of a 10-K"], ["Spend less on eating out", "Cook one meal you'd have bought"], ["Max out a Roth IRA", "Check this month's contribution"], ["Make a real budget", "Set this week's limits"], ["Raise my credit score", "Pay on time, check your balance"], ["No impulse buys for 30 days", "Wait 48 hours before buying anything over $20", "d"], ["Hit my first $10,000 saved", "Move today's amount into savings"], ["Learn how investing actually works", "15 minutes of one book or course"]]}, "business": {"re": "business|brand|startup|company|client|sell|selling|shop|store|market|marketing|content|tiktok|instagram|youtube|creator|resell|side hustle|entrepren|founder|ecom", "items": [["Hit $1,000 in monthly revenue", "Do one thing that brings in money"], ["Post content every day", "Film and post one video", "d"], ["Get my first 100 customers", "Reach out to 5 people"], ["Launch my product", "One task on the launch list"], ["Grow to 10k followers", "Reply to every comment today", "d"], ["Build a website that sells", "Fix one thing on the site"], ["Write a real business plan", "One section of the plan"], ["Learn marketing", "Study one ad or post that worked"], ["Network with founders", "Message one founder"], ["Get my first brand deal", "Pitch one brand"], ["Track every dollar in and out", "Log today's numbers", "d"], ["Make a content calendar", "Plan next week's posts"], ["Start a side hustle", "30 minutes on it tonight"], ["Get 10 five-star reviews", "Ask one happy customer"]]}, "career": {"re": "career|job|work|intern|internship|resume|interview|promot|network|linkedin|profession|office|boss|salary|raise", "items": [["Land an internship", "Apply to one role"], ["Build a strong resume", "Improve one bullet"], ["Grow my LinkedIn network", "Connect with 3 people"], ["Ace interviews", "Practice one interview question out loud"], ["Get a promotion", "Do one thing beyond your role"], ["Learn a skill employers want", "30 minutes on the course"], ["Find a mentor", "Reach out to one person"], ["Get certified", "One study session for the cert"], ["Ask for a raise", "Write down one result you delivered this month"], ["Get my dream job", "Research one company you'd love to work at"], ["Become great at Excel", "One Excel lesson or exercise"], ["Show up early every workday", "Leave 10 minutes earlier", "d"]]}, "family": {"re": "family|mom|dad|parent|brother|sister|kids|son|daughter|relation|relationship|friend|friends|girlfriend|boyfriend|partner|wife|husband|marriage|love|dating", "items": [["Call home every week", "Call or text one family member"], ["Plan a date night weekly", "Plan the next date"], ["Be a better friend", "Check in on one friend", "d"], ["Have dinner with family weekly", "Set the next dinner"], ["Remember every birthday", "Add birthdays to your calendar"], ["Write letters to people I love", "Write one short note"], ["Listen more than I talk", "Ask one good follow-up question", "d"], ["Fix a relationship that slipped", "Send one honest message"], ["Be present at dinner", "Phones away at the table", "d"], ["Tell people I appreciate them", "Send one thank-you text", "d"]]}, "social": {"re": "social|people|confiden|charisma|community|network|outgoing|public speak|speaking|lonely|meet", "items": [["Make 3 new friends this year", "Say yes to one invite"], ["Get comfortable speaking up", "Share one idea in class or at work", "d"], ["Talk to one new person a week", "Start one conversation"], ["Join a club or team", "Look up one club and message them"], ["Give a speech without notes", "Practice your opening out loud"], ["Host a get-together", "Pick a date and invite 3 people"], ["Remember people's names", "Use their name once in the conversation", "d"], ["Be the one who reaches out", "Text one person first", "d"]]}, "creativity": {"re": "creat|creativ|art|artist|music|guitar|piano|drum|sing|song|draw|paint|write|writing|writer|design|photo|film|video|craft|hobby|passion|personal|fun|dance|poetry", "items": [["Learn guitar", "15 minutes of practice", "d"], ["Draw every day", "One sketch", "d"], ["Write a short story", "Write 200 words"], ["Start a photography habit", "Take one photo you're proud of", "d"], ["Make a song", "Work on the beat or lyrics for 15 minutes"], ["Finish a creative project", "30 minutes on the project"], ["Learn to edit video", "Edit one short clip"], ["Fill a sketchbook", "Fill one page", "d"], ["Learn piano", "10 minutes of scales and a song", "d"], ["Design my own clothing piece", "Sketch one idea"], ["Write every day", "Write 300 words before you check your phone", "d"], ["Share my work publicly", "Post one piece you made"], ["Learn to paint", "One small study, 20 minutes"], ["Make a short film", "Shoot or edit for 30 minutes"]]}, "adventure": {"re": "travel|adventure|explore|outdoor|outdoors|hike|hiking|camp|nature|trip|world|fun", "items": [["Visit 3 new places this year", "Research one trip for 10 minutes"], ["Hike every weekend", "Pick this weekend's trail"], ["Save for a big trip", "Move $10 into the trip fund", "d"], ["Try one new thing a month", "Pick this month's first"], ["Camp under the stars", "Gear list: check one item off"], ["Learn to surf, ski or climb", "Book the first lesson"]]}, "mindfulness": {"re": "mental|calm|stress|meditat|journal|peace|mindful|happy|happiness|wellbe|well.?be|anxi|balance|gratitude|present", "items": [["Meditate every day", "10 minutes of breathing", "d"], ["Journal every night", "Write 3 lines before bed", "d"], ["Walk with no phone", "10 minutes outside, phone at home", "d"], ["Take one full rest day a week", "Plan something restful for Sunday"], ["Spend more time outside", "20 minutes outdoors", "d"], ["Talk it out when things are heavy", "Write down one thing on your mind", "d"], ["Say no more often", "Turn down one thing you don't want to do"], ["Keep a gratitude list", "Write 3 good things from today", "d"], ["Breathe before I react", "Three slow breaths before you answer", "d"]]}};
  var base = K.libraryList, PRE = { health: ['fitness', 'nutrition', 'sleep'], mind: ['reading', 'mindfulness', 'discipline', 'school'], wealth: ['finances', 'career', 'business'], relationships: ['family', 'social'], passion: ['creativity', 'adventure', 'selfcare'] };
  K.topicsFor = function (name, id) { var n = String(name || '').toLowerCase(), out = []; Object.keys(T).forEach(function (k) { if (new RegExp('(?:^|[^a-z])(?:' + T[k].re + ')', 'i').test(n)) out.push(k); }); /* matches at the start of a word only */ (PRE[id] || []).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); }); return out; };
  K.libraryList = function (pillar) {
    if (!pillar) return base();
    var p = (K.PATHS || []).filter(function (x) { return x.id === pillar; })[0], own = base(pillar), seen = {}, out = [];
    var add = function (x) { var key = x.n.toLowerCase(); if (seen[key]) return; seen[key] = 1; out.push(x); };
    var topics = K.topicsFor(p ? p.name : pillar, pillar), extra = [];
    topics.forEach(function (k) { T[k].items.forEach(function (it) { extra.push({ p: pillar, c: k, n: it[0], s: it[1], k: it[2] === 'd' ? 'daily' : 'long' }); }); });
    // mix: the branch's own topic first, then the built-in library, so the first picks fit the name you gave it
    extra.slice(0, 12).forEach(add); own.forEach(add); extra.slice(12).forEach(add);
    if (!out.length) base().forEach(add);
    return out;
  };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 008b5330d733.js ==== */
;try {

window.KZ_SYNC_CFG = { url: "", key: "", lib: "/kaizen-supabase.js" };
(function () {
  var K = window.KZ; if (!K) return;
  var CFG = window.KZ_SYNC_CFG || {};
  // Accounts aren't switched on until there's a Supabase project: hide Sign up / Log in rather than show buttons that can't work.
  if (!CFG.url || !CFG.key) document.documentElement.classList.add('kz-nosync-cfg');
  var KEYS = ['pillars', 'tree', 'treename', 'treeplanted', 'treestress', 'goals', 'archived', 'done', 'rate', 'thought', 'journal', 'liked', 'tomb', 'adds', 'gorder', 'gnotes', 'unlocked', 'plans', 'companion', 'friends', 'wild', 'bond', 'seen', 'username', 'chats', 'fedlog', 'todos', 'petnames'];
  var META = 'kz_syncmeta', listeners = [], client = null, user = null, timer = null, busy = false;
  var S = K.sync = { enabled: !!(CFG.url && CFG.key), user: function () { return user; }, lastSync: function () { return meta().last || null; } };
  function meta() { try { return JSON.parse(localStorage.getItem(META)) || { seen: {}, dirty: {} }; } catch (e) { return { seen: {}, dirty: {} }; } }
  function saveMeta(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} }
  function raw(k) { try { var v = localStorage.getItem('kz_' + k); return v === null ? undefined : JSON.parse(v); } catch (e) { return undefined; } }
  function rawSet(k, v) { try { localStorage.setItem('kz_' + k, JSON.stringify(v)); } catch (e) {} }
  function emit() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); document.dispatchEvent(new CustomEvent('kz:sync')); }
  S.on = function (f) { listeners.push(f); };

  // ---------- merging (used only when the same key changed on two devices) ----------
  var obj = function (x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; };
  var arr = function (x) { return Array.isArray(x) ? x : []; };
  function unionMap(a, b) { var o = {}, k; a = obj(a); b = obj(b); for (k in b) o[k] = b[k]; for (k in a) if (a[k] !== '' && a[k] != null) o[k] = a[k]; return o; }
  function unionGoals(a, b, tomb) { var seen = {}, out = []; arr(a).concat(arr(b)).forEach(function (g) { if (g && g.id && !seen[g.id] && !tomb[g.id]) { seen[g.id] = 1; out.push(g); } }); return out; }
  S.merge = function (k, a, b, ctx) {
    var tomb = obj(ctx && ctx.tomb);
    if (k === 'tomb') return unionMap(a, b);
    if (k === 'chats') { var seenT = {}, out = []; arr(b).concat(arr(a)).forEach(function (x) { if (x && x.t && !seenT[x.t]) { seenT[x.t] = 1; out.push(x); } }); return out.sort(function (p, q) { return p.t < q.t ? -1 : 1; }).slice(-300); }
    if (k === 'pillars') return arr(a).length ? a : b;
    if (k === 'tree' || k === 'treename' || k === 'treeplanted') return a || b;
    if (k === 'treestress') return Math.max(+a || 0, +b || 0);
    if (k === 'gnotes') { var gn = {}, gi, dd; [obj(b), obj(a)].forEach(function (src) { for (gi in src) { gn[gi] = gn[gi] || {}; for (dd in obj(src[gi])) { var v = String(src[gi][dd] || ''); if (!gn[gi][dd] || v.length > String(gn[gi][dd]).length) gn[gi][dd] = v; } } }); return gn; } // per goal, per day; longer text wins
    if (k === 'plans') { var pl = {}, pd; [obj(b), obj(a)].forEach(function (src) { for (pd in src) { var cur = pl[pd], nx = src[pd]; if (!cur || (nx && nx.items && nx.items.filter(function (x) { return x.done; }).length >= cur.items.filter(function (x) { return x.done; }).length)) pl[pd] = nx; } }); return pl; }
    if (k === 'gorder') return ((obj(a).t || 0) >= (obj(b).t || 0)) ? a : b; // newest order wins
    if (k === 'adds') { var o = obj(b), x; a = obj(a); for (x in a) o[x] = Math.max(a[x] || 0, o[x] || 0); return o; }
    if (k === 'goals' || k === 'archived') return unionGoals(a, b, tomb);
    if (k === 'done') { var d = {}, id; a = obj(a); b = obj(b);
      [b, a].forEach(function (m) { for (id in m) { if (tomb[id]) continue; d[id] = d[id] || {}; for (var day in obj(m[id])) d[id][day] = 1; } }); return d; }
    return unionMap(a, b);
  };
  // A goal can't be both active and archived: keep the newest move (archive date vs restore date).
  function settleArchive() {
    var g = arr(raw('goals')), a = arr(raw('archived'));
    var arch = {}; a.forEach(function (x) { arch[x.id] = x; });
    var keep = g.filter(function (x) { var y = arch[x.id]; return !y || (x.restored && x.restored >= (y.archived || '')); });
    var act = {}; keep.forEach(function (x) { act[x.id] = 1; });
    var keepA = a.filter(function (x) { return !act[x.id]; });
    if (keep.length !== g.length) rawSet('goals', keep);
    if (keepA.length !== a.length) rawSet('archived', keepA);
  }

  // ---------- local change tracking ----------
  K._onset = function (k) {
    if (K.demo || KEYS.indexOf(k) < 0 || !user) return;   // demo mode never touches your cloud copy
    var m = meta(); m.dirty[k] = 1; saveMeta(m); schedule();
  };
  function schedule() { clearTimeout(timer); timer = setTimeout(function () { push(); }, 1500); }

  // ---------- pull / push ----------
  function pull() {
    if (K.demo || !client || !user) return Promise.resolve(false);
    return client.from('kz_state').select('k,v,updated_at').then(function (r) {
      if (r.error) throw r.error;
      var m = meta(), changed = false, rows = {}; (r.data || []).forEach(function (row) { rows[row.k] = row; });
      var order = ['pillars', 'tomb', 'archived'].concat(KEYS.filter(function (k) { return k !== 'tomb' && k !== 'archived'; }));
      order.forEach(function (k) {
        var row = rows[k]; if (!row) return;
        if (m.seen[k] && row.updated_at <= m.seen[k]) return;
        var local = raw(k), next = m.dirty[k] ? S.merge(k, local, row.v, { tomb: raw('tomb') }) : row.v;
        if (JSON.stringify(next) !== JSON.stringify(local)) { rawSet(k, next); changed = true; }
        m.seen[k] = row.updated_at;
      });
      saveMeta(m); if (changed) settleArchive();
      return changed;
    });
  }
  // Upload changed keys. Each write only succeeds if the cloud copy is still the one this device last saw;
  // if another device wrote in between, pull + merge and try again (so two devices saving at once both keep their work).
  function writeKey(k, v, now) {
    var m = meta(), seen = m.seen[k], tbl = client.from('kz_state');
    if (seen) return tbl.update({ v: v, updated_at: now }).eq('user_id', user.id).eq('k', k).eq('updated_at', seen).select('k')
      .then(function (r) { if (r.error) throw r.error; return r.data && r.data.length > 0; });
    return tbl.insert({ user_id: user.id, k: k, v: v, updated_at: now })
      .then(function (r) { if (r.error) { if (r.error.code === '23505') return false; throw r.error; } return true; });
  }
  function push(tries) {
    if (K.demo || !client || !user) return Promise.resolve();
    if (busy) { schedule(); return Promise.resolve(); }
    busy = true; tries = tries || 0;
    var anyChanged = false;
    return pull().then(function (changed) {
      anyChanged = changed;
      var m = meta(), now = new Date().toISOString(), keys = Object.keys(m.dirty).filter(function (k) { return KEYS.indexOf(k) > -1 && raw(k) !== undefined; });
      return keys.reduce(function (pr, k) { return pr.then(function (conflicts) {
        return writeKey(k, raw(k), now).then(function (ok) { var mm = meta(); if (ok) { mm.seen[k] = now; delete mm.dirty[k]; saveMeta(mm); return conflicts; } return conflicts + 1; });
      }); }, Promise.resolve(0)).then(function (conflicts) {
        busy = false;
        if (conflicts && tries < 4) return push(tries + 1);
        var mm = meta(); mm.last = new Date().toISOString(); saveMeta(mm); S.error = null; emit(); if (anyChanged) refresh();
      });
    }).catch(function (e) { busy = false; S.error = (e && e.message) || 'Sync failed'; emit(); });
  }
  S.now = function () { return push(); };
  // When data arrives from another device, re-render once so every section shows it.
  function refresh() {
    try { var t = +sessionStorage.getItem('kz_sync_reload') || 0; if (Date.now() - t < 15000) { document.dispatchEvent(new CustomEvent('kz:changed')); return; } sessionStorage.setItem('kz_sync_reload', Date.now()); } catch (e) {}
    location.reload();
  }
  // First sign-in on a device: everything already saved here counts as a change, so it merges instead of being replaced.
  function markAllDirty() { var m = meta(); KEYS.forEach(function (k) { if (raw(k) !== undefined) m.dirty[k] = 1; }); m.seen = {}; saveMeta(m); }

  // ---------- account (email + 6-digit code) ----------
  S.sendCode = function (email) { return ready().then(function () { return client.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + '/pages/profile?signedin=1' } }); }).then(function (r) { if (r.error) throw r.error; }); };
  S.verify = function (email, code) {
    return ready().then(function () { return client.auth.verifyOtp({ email: email, token: String(code).trim(), type: 'email' }); })
      .then(function (r) { if (r.error) throw r.error; user = r.data.user; var m = meta(); if (m.user !== user.id) { m.user = user.id; saveMeta(m); markAllDirty(); } K.track('kz_sync_signin'); return push(); });
  };
  // ---------- Sign in with Apple (iPhone app) ----------
  // The phone shows Apple's sheet and hands back the Apple ID (and, the first time only, name + email).
  // Without cloud sync it's a local account on this phone; with sync it signs into Supabase with Apple's token.
  S.appleUser = function () { return K.get('appleid', null); };
  S.canApple = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  K.appleResult = function (r) { var cb = K._appleCb; K._appleCb = null; if (cb) cb(r || {}); };
  S.apple = function () {
    return new Promise(function (res, rej) {
      if (!S.canApple()) { rej({ apple: 'web' }); return; }
      K._appleCb = function (r) { if (r.error != null) rej({ apple: r.error, message: r.message }); else res(r); };
      window.webkit.messageHandlers.kaizen.postMessage({ type: 'appleSignIn' });
    }).then(function (r) {
      var old = K.get('appleid', {}) || {}, name = [r.givenName, r.familyName].filter(Boolean).join(' ');
      K.set('appleid', { sub: r.user, email: r.email || (old.sub === r.user ? old.email : '') || '', name: name || (old.sub === r.user ? old.name : '') || '', at: new Date().toISOString() });
      if (r.givenName && !String(K.get('username', '') || '').trim()) K.set('username', r.givenName);
      K.track('kz_apple_signin', { cloud: S.enabled });
      if (!S.enabled || !r.idToken) { emit(); return { local: true }; }
      return ready().then(function () { return client.auth.signInWithIdToken({ provider: 'apple', token: r.idToken, nonce: r.rawNonce }); })
        .then(function (x) { if (x.error) throw x.error; user = x.data.user; var m = meta(); if (m.user !== user.id) { m.user = user.id; saveMeta(m); markAllDirty(); } return push(); });
    });
  };
  S.appleSignOut = function () { K.set('appleid', null); emit(); };
  // Delete my data: every synced row, then the account itself (SQL function delete_my_account, see SETUP-ACCOUNTS.md), then sign out.
  S.deleteAccount = function () {
    if (!S.enabled || !user) return Promise.resolve({ cloud: false });
    return ready().then(function () { return client.from('kz_state').delete().eq('user_id', user.id); })
      .then(function (r) { if (r.error) throw r.error; return client.rpc('delete_my_account'); })
      .then(function (r) { if (r.error) throw r.error; return client.auth.signOut(); })
      .then(function () { user = null; return { cloud: true }; });
  };
  S.signOut = function () { return ready().then(function () { return client.auth.signOut(); }).then(function () { user = null; var m = meta(); m.dirty = {}; saveMeta(m); emit(); }); };

  var loading = null;
  function ready() {
    if (client) return Promise.resolve(client);
    if (S._client) { client = S._client; return Promise.resolve(client); } // tests inject a client
    if (!S.enabled) return Promise.reject(new Error('Sync is not set up yet'));
    if (!loading) loading = new Promise(function (res, rej) {
      if (window.supabase) return res();
      var s = document.createElement('script'); s.src = CFG.lib; s.async = true; s.onload = res; s.onerror = function () { rej(new Error('Could not load sync')); }; document.head.appendChild(s);
    }).then(function () { client = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kz_auth' } }); return client; });
    return loading;
  }
  S.start = function () {
    return ready().then(function () { return client.auth.getSession(); }).then(function (r) {
      user = r && r.data && r.data.session ? r.data.session.user : null;
      if (user) { var m = meta(); if (m.user !== user.id) { m.user = user.id; saveMeta(m); markAllDirty(); S.justSignedIn = true; K.track('kz_sync_signin', { via: 'link' }); } }
      emit();
      if (user) return push();
    }).catch(function () { emit(); });
  };
  // Plain-words errors for the sign-in screen.
  S.friendly = function (err) {
    if (err && err.apple != null) { var a = err.apple; return a === 1001 ? '' : a === 'web' ? 'Sign in with Apple works in the Kaizen iPhone app.' : a === 1000 ? 'Sign in with Apple switches on when Kaizen’s Apple developer account goes live. Everything stays safe on this phone until then.' : 'Apple sign-in didn’t finish. Try again.'; }
    var m = String((err && (err.message || err.error_description)) || err || ''), st = err && err.status;
    if (typeof navigator !== 'undefined' && navigator.onLine === false || /Failed to fetch|NetworkError|network/i.test(m)) return 'You’re offline. Try again when you’re connected.';
    if (st === 429 || /rate limit|too many|security purposes|seconds/i.test(m)) return 'Too many tries. Wait a minute.';
    if (/expired/i.test(m) && !/invalid/i.test(m)) return 'That code expired. Send a new one.';
    if (/token|otp|code|invalid/i.test(m)) return 'That code didn’t work. Check the newest email.';
    if (/not set up/i.test(m)) return 'Accounts are being set up. Your data is safe on this phone.';
    return m || 'Something went wrong. Try again.';
  };
  // Returning from the email link (#access_token=… / ?code=… / ?token_hash=…) finishes sign-in on this page.
  var href = String(location.href), fromLink = /[#&?](access_token|refresh_token|code|token_hash)=/.test(href) || /[?&]signedin=1/.test(href);
  var linkErr = (href.match(/[#&]error_description=([^&]+)/) || [])[1];
  if (linkErr) S.linkError = decodeURIComponent(linkErr.replace(/\+/g, ' '));
  // Start only if this device signed in before, or is coming back from the email link (no library download for everyone else).
  var hasAuth = false; try { hasAuth = !!localStorage.getItem('kz_auth'); } catch (e) {}
  if (S.enabled && (hasAuth || fromLink)) S.start().then(function () {
    if (fromLink && user) { S.justSignedIn = true; emit(); }
    if (fromLink) try { history.replaceState(null, '', location.pathname + '#sync'); } catch (e) {}
  });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && user) push(); });
  window.addEventListener('online', function () { if (user) push(); });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
