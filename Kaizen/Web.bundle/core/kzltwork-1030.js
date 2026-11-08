/* Oct 30 · James: "make it an optional extra. But make it easier to check off so you don't have to expand it. Like 10
   minutes a day, or just that you work towards it."
   Every long-term goal with a roadmap (kzbd isMs) gets a small "Worked on it today" pill right in its row on Today and
   My goals, under the roadmap bar, so it's one tap without unfolding anything. It's optional: it isn't the goal's daily
   check, so it never counts toward the day, the streak, reminders or "missed"; skipping it changes nothing.
   Tapped: gold "✓ Worked on it today" (the days this week are in its VoiceOver label). Tap again to undo.
   Stored on the goal as wk: ['YYYY-MM-DD', …] (newest last, at most 400). Replaces the roadmap's "Today's progress"
   row (kzroadday-1027.js, which used the daily check). Loaded before kzroad-1028.js so its tap never unfolds the row. */
(function () {
  var K = window.KZ; if (!K || K.__kzltwork) return; K.__kzltwork = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>';
  function tk() { return K.key(K.today()); }
  function goals() { return K.get('goals', []) || []; }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0]; }
  function isMs(g) { return !!(g && K.bd && K.bd.isMs && K.bd.isMs(g)); }
  function wk(g) { return Array.isArray(g && g.wk) ? g.wk.filter(function (d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); }) : []; }
  function week(g) {   // days worked in the last 7 (today included)
    var from = K.key(K.addDays(K.today(), -6)), t = tk(); return wk(g).filter(function (d) { return d >= from && d <= t; }).length;
  }
  function toggle(id) {
    var t = tk(), on = false, all = goals().map(function (g) {
      if (g.id !== id) return g; var a = wk(g), i = a.indexOf(t);
      if (i >= 0) a.splice(i, 1); else { a.push(t); on = true; }
      g.wk = a.slice(-400); return g;
    });
    K.set('goals', all); return on;
  }
  function paint() {
    q = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.kz-goal[data-goal] > .kz-gbody'), function (body) {
      var row = body.parentNode, id = row.getAttribute('data-goal'), g = goal(id), el = body.querySelector('.kzlw');
      if (!isMs(g)) { if (el) el.remove(); return; }
      var on = wk(g).indexOf(tk()) >= 0, n = week(g), sig = on + '|' + n + '|' + g.name;
      if (!el) { el = document.createElement('button'); el.type = 'button'; el.className = 'kzlw'; body.appendChild(el); }
      if (el.__s === sig) return; el.__s = sig;
      el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on)); el.setAttribute('data-lw', id);
      el.setAttribute('aria-label', (on ? 'You worked on ' : 'Mark that you worked on ') + g.name + ' today. Optional' + (n ? ', ' + n + ' of the last 7 days' : ''));
      el.innerHTML = '<i>' + TICK + '</i><span>Worked on it today</span>';
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  function hit(e) { return e.target && e.target.closest && e.target.closest('.kzlw[data-lw]'); }
  // keep the row's own handlers (unfold, open, drag, swipe) from seeing taps on the pill
  ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(function (n) {
    addEventListener(n, function (e) { if (hit(e)) e.stopPropagation(); }, true);
  });
  addEventListener('click', function (e) {
    var b = hit(e); if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    var on = toggle(b.getAttribute('data-lw'));
    post({ type: 'haptic', n: on ? 1 : 2 });
    b.classList.remove('pop'); void b.offsetWidth; if (on) b.classList.add('pop');
    b.__s = ''; paint();
  }, true);
  function boot() {
    paint();
    new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && t.closest('.kzlw')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
    ['kz:changed', 'kz:goals', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
    addEventListener('pageshow', soon); document.addEventListener('visibilitychange', soon);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
