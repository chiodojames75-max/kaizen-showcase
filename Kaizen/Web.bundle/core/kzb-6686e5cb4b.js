/* ==== kzflush-1027.js ==== */
;try {
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

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzbridge-1028.js ==== */
;try {
/* Oct 28 · the tab bar never blinks between two pop-ups. When one sheet closes and the next opens (notes → Note to self),
   the page said "show the tab bar" and "hide it" a moment apart, so it faded in and straight back out. A "show" now waits
   180 ms and is dropped if a "hide" arrives first. Loads right after kzflush, before anything posts. */
(function () {
  var w = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen; if (!w || w.__kzb) return;
  var orig = w.postMessage, timer = 0;
  try {
    w.postMessage = function (m) {
      if (m && m.type === 'pageScroll') {
        if (m.on === false) { if (timer) { clearTimeout(timer); timer = 0; } return orig.call(w, m); }
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () { timer = 0; orig.call(w, m); }, 180);
        return;
      }
      return orig.call(w, m);
    };
    w.__kzb = 1;
  } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzdefer-1028.js ==== */
;try {
/* Oct 28 · taps that answer at once. The Quit buttons (Clean, Undo, Yes, unslip) and a Plan/to-do tick
   change one row, then announce kz:changed / kz:plan, and every listener (the goal lists redraw, headers, counts, Kaizen 66,
   the grove…) ran inside the tap, so the phone showed nothing for 200–400 ms (4× slowed test). Now, while such a tap is
   being handled, those announcements wait until the tapped row has been painted; they then run together in the very next
   frame, so the rest of the screen still changes all at once. Loads right after kzflush (it wraps the same dispatch). */
(function () {
  var W = window; if (W.__kzdefer) return; W.__kzdefer = 1;
  var ET = W.EventTarget && W.EventTarget.prototype, rDE = ET && ET.dispatchEvent; if (!rDE) return;
  // (an un-check on Today is left out: the goal then slid back a moment later, and a quick second tap could land where it was)
  var SEL = '[data-q-clean], [data-q-undo], [data-q-unslip], [data-q-y], .kzq-chk, [data-tdo]';
  var on = false, q = [];
  function flush() { var l = q; q = []; for (var i = 0; i < l.length; i++) { try { rDE.call(l[i][0], l[i][1]); } catch (e) { setTimeout(function () { throw e; }, 0); } } }
  ET.dispatchEvent = function (ev) {
    // every kz: announcement made during the tap waits, all of them in their order (holding back only some let the others
    // run on half-updated state: a Quit row showed its old buttons for a frame)
    if (on && ev && typeof ev.type === 'string' && ev.type.indexOf('kz:') === 0 && (this === document || this === W)) { q.push([this, ev]); return true; }
    return rDE.call(this, ev);
  };
  W.addEventListener('click', function (e) {
    if (!e.isTrusted || !e.target.closest || !e.target.closest(SEL)) return;
    on = true;
    // the tap's own handlers (and their 0 ms timers) run first; the frame is painted; then the announcements go out
    requestAnimationFrame(function () { on = false; setTimeout(flush, 0); });
  }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzgate-1106.js ==== */
;try {
/* Nov 6 (James: "get rid of the chance to ever see old visuals"): copy of kzgate-1028 that waits up to 3 s (was 1.5 s) for a slow page to finish before it shows. */
/* Oct 28 · Stage A of the clean-up (James: "the app just feels glitchy"). A page draws in steps while its add-ons start
   up (some land ~1 s in), and the app showed it as soon as it was quiet for 90 ms, so you saw those late steps happen.
   Now the page stays invisible until nothing on it has changed for 160 ms (at most 1.5 s after it loaded), then fades in
   over 120 ms. The app swaps a refreshed tab in, and slides a new screen in, only after that, so every screen you see
   is already finished. Loads right after kzflush/kzbridge. Styles: kzgate-1028.css. */
(function () {
  var de = document.documentElement; if (window.__kzGate) return; window.__kzGate = 1;
  var QUIET = 160, CAP = 3000, last = Date.now(), t0 = 0, done = false, mo = null;
  function open() {
    if (done) return; done = true; if (mo) mo.disconnect();
    de.classList.add('kz-dressed');
    try { document.dispatchEvent(new CustomEvent('kz:dressed')); } catch (e) {}
  }
  function check() {
    if (done) return; var now = Date.now();
    var old = document.getElementById('kz-gate') && !de.classList.contains('kz-shown');   // Today's older gate (skeleton) must be done too
    if ((now - last >= QUIET && !old) || now - t0 >= CAP) { open(); return; }
    setTimeout(check, Math.max(16, QUIET - (now - last)));
  }
  function start() {
    t0 = Date.now(); last = t0;
    try {
      mo = new (window.MutationObserver)(function (ms) {
        for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t === de && ms[i].attributeName === 'class') continue; if (t.closest && t.closest('.kz-leafp, .kzlf')) continue; last = Date.now(); return; }
      });
      mo.observe(de, { subtree: true, childList: true, attributes: true, characterData: true });
    } catch (e) { open(); return; }
    setTimeout(check, QUIET);
  }
  // never stay hidden: if anything goes wrong, show the page anyway
  setTimeout(open, 5000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
