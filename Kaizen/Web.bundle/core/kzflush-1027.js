/* Oct 27 · no in-between frames.
   Many add-ons tidy the screen after the app redraws it: they watch for changes (MutationObserver, or the app's
   kz:changed / kz:step events) and fix things up on the next frame (requestAnimationFrame). When the app redraws
   from a timer, or one fix-up triggers another, the phone could paint the half-fixed screen for a frame or three —
   the "other screen for a few milliseconds" after a check-off (Quit jumping above Goals, a heading flipping).
   This file loads first. A frame callback asked for while reacting to a change now runs right away, before the
   phone paints, so the whole chain of fixes lands together. Animation loops that re-arm themselves keep one step per
   frame, and the chain is capped so nothing can spin. */
(function () {
  var W = window; if (W.__kzFlush) return; W.__kzFlush = 1;
  var rRAF = W.requestAnimationFrame && W.requestAnimationFrame.bind(W), rCAF = W.cancelAnimationFrame && W.cancelAnimationFrame.bind(W), RMO = W.MutationObserver;
  if (!rRAF || !rCAF || !RMO || typeof queueMicrotask !== 'function') return;
  var inMO = 0, inFlush = 0, q = [], scheduled = false, passes = 0, map = {}, current = null, MAX = 10;
  function flush() {
    scheduled = false; if (!q.length) return;
    if (passes++ === 0) rRAF(function () { passes = 0; });
    var list = q; q = []; inFlush++;
    for (var i = 0; i < list.length; i++) {
      var e = list[i]; if (e.done) continue; e.done = true; delete map[e.id]; rCAF(e.id);
      var prev = current; current = e;
      try { e.cb(performance.now()); } catch (err) { setTimeout(function () { throw err; }, 0); }
      current = prev;
    }
    inFlush--;
  }
  W.requestAnimationFrame = function (cb) {
    var e = { cb: cb, done: false }, id = rRAF(function (t) { if (e.done) return; e.done = true; delete map[id]; var prev = current; current = e; try { cb(t); } finally { current = prev; } });
    e.id = id; map[id] = e;
    if ((inMO || inFlush) && passes < MAX && !(current && current.cb === cb)) { q.push(e); if (!scheduled) { scheduled = true; queueMicrotask(flush); } }
    return id;
  };
  W.cancelAnimationFrame = function (id) { var e = map[id]; if (e) { e.done = true; delete map[id]; } rCAF(id); };
  var MO = function (cb) { return new RMO(function (a, b) { inMO++; try { return cb.call(this, a, b); } finally { inMO--; } }); };
  MO.prototype = RMO.prototype;
  try { W.MutationObserver = MO; } catch (e) {}
  try {
    var ET = W.EventTarget && W.EventTarget.prototype, rDE = ET && ET.dispatchEvent;
    if (rDE) ET.dispatchEvent = function (ev) { var kz = ev && typeof ev.type === 'string' && ev.type.indexOf('kz:') === 0; if (kz) inMO++; try { return rDE.call(this, ev); } finally { if (kz) inMO--; } };
  } catch (e) {}
})();
