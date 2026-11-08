/* Oct 29 · James: today said "Rough day" in red on Progress at 3:48 PM. A day isn't rough until it's over, so today is never
   a setback: K.dayInfo reports 'today' for it instead (calendar cell stays neutral with its outline, the day card says
   "In progress"). Green (over half) and gold (every goal) still show today. Past days are unchanged. Wraps K.dayInfo on
   top of kzfix-1023q's wrapper, and keeps wrapping when a page assigns its own copy later. */
(function () {
  var K = window.KZ; if (!K || K.__kztoday) return; K.__kztoday = 1;
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
