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
