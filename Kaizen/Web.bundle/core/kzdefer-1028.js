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
