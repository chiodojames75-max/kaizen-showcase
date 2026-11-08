/* Nov 5: kzplanlock-1105 = 1028 without the multiplier toast. */
/* Oct 28 · James: "the whole point is for you to plan your tomorrow". A task added to a day's plan on that day itself
   (after the day starts at 2 am) is a same-day add: it shows, you can tick it, and it earns +3 XP like any to-do,
   but it never counts toward that day's plan: not the task count for the multiplier, not "all done", not the Plan ring.
   Tasks planned the day before (or any earlier day, or before 2 am for today) count exactly as before. */
(function () {
  var K = window.KZ; if (!K || !K.planStats || !K.savePlan || K.__planlock) return; K.__planlock = 1;
  function lockAt(day) { var d = new Date(day + 'T00:00:00'); d.setHours(K.PLAN_ROLL || 2, 0, 0, 0); return d.getTime(); }
  function all() { try { return (K._getRO ? K._getRO('plans', {}) : K.plans()) || {}; } catch (e) { return {}; } }
  var told = false;
  var sp = K.savePlan;
  K.savePlan = function (day, items) {
    var late = 0;
    try {
      var old = ((all()[day] || {}).items) || [], had = {}; old.forEach(function (x) { had[x.id] = x; });
      var now = Date.now();
      (items || []).forEach(function (x) {
        if (!x || !x.id) return;
        if (!had[x.id]) { if (now >= lockAt(day)) { x.sameDay = 1; late++; } }
        else if (had[x.id].sameDay) x.sameDay = 1;   // an edit keeps it a same-day add
      });
    } catch (e) {}
    var r = sp.apply(this, arguments);
    // Nov 5: the "counts toward your multiplier" toast is gone (there's no multiplier anymore)
    return r;
  };
  K.planStats = function (day) {
    var p = all()[day] || null, items = p && p.items ? p.items : [], counted = items.filter(function (x) { return !x.sameDay; });
    var n = counted.length, d = counted.filter(function (x) { return x.done; }).length, cap = K.planCap(n);
    var mult = n ? Math.round((1 + (cap - 1) * d / n) * 10) / 10 : 1, full = n >= K.PLAN_MIN && d === n;
    return { n: n, done: d, cap: cap, mult: mult, full: full, valid: n >= K.PLAN_MIN, points: full ? Math.round(n * K.PLAN_PTS * cap) : 0, potential: Math.round(n * K.PLAN_PTS * cap), extra: items.length - n };
  };
  // same-day adds that are done earn what a to-do earns
  var tx = K.todoXP;
  if (tx) K.todoXP = function () {
    var x = tx.apply(this, arguments), a = all(), per = (K.XP && K.XP.todo) || 3;
    for (var d in a) ((a[d] && a[d].items) || []).forEach(function (it) { if (it.sameDay && it.done) x += per; });
    return x;
  };
  // Plan tab: a same-day add says so under its name
  function label() {
    var week = document.querySelector('[data-p="week"]'), list = document.querySelector('[data-p="day-list"]'); if (!week || !list) return;
    var b = week.querySelector('[aria-selected="true"]'), day = b && b.getAttribute('data-day'); if (!day) return;
    var p = all()[day], late = {}; ((p && p.items) || []).forEach(function (it) { if (it.sameDay) late['p:' + it.id] = 1; });
    Array.prototype.forEach.call(list.querySelectorAll(':scope > li.kz-todo[data-kzk^="p:"] .kzq-raw'), function (s) {
      var k = s.closest('li').getAttribute('data-kzk'), t = s.textContent;
      if (late[k] && / · from your plan$/.test(t)) s.textContent = t.replace(/ · from your plan$/, ' · added today');
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { label(); } catch (e) {} }); }
  function boot() { soon(); var l = document.querySelector('[data-p="day-list"]'); if (l) new MutationObserver(soon).observe(l, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
