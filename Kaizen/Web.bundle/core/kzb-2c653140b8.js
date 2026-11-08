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
