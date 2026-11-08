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
  var SHIELD_EVERY = 7, SHIELD_MAX = 2;

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
