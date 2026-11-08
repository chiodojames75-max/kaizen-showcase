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
