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
