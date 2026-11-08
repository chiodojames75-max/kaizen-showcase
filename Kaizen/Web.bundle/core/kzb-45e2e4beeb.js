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
