
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
