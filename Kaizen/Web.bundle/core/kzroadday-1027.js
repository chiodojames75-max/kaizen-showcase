/* Oct 27 · James: "for long-term goals, check off daily progress without checking off a milestone, on the roadmap".
   A long-term goal with milestones shows a progress ring instead of its daily check, so there was no way to log a day
   of work. The roadmap now starts with a "Today" row: its check is the goal's own daily check (the same XP, streak,
   tree growth and undo as any goal), and the milestones below stay as they are.
   Loaded before kzroad-1027.js, so this tap is handled before the roadmap keeps taps inside its panel to itself. */
(function () {
  var K = window.KZ; if (!K || window.__kzrdd) return; window.__kzrdd = 1;
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>';
  function goal(id) { return (K.get('goals', []) || []).filter(function (g) { return g.id === id; })[0]; }
  function done(id) { try { return K.isDone ? !!K.isDone(id) : false; } catch (e) { return false; } }
  function paint() {
    q = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.kz-grow[data-goal] > .kzrd'), function (p) {
      var row = p.parentNode, id = row.getAttribute('data-goal'), g = goal(id); if (!g || !g.ms || !g.ms.length) return;
      var d = done(id), el = p.querySelector('.kzrd-day');
      var step = K.stepFor ? K.stepFor(g) : (g.step || '');
      var sig = d + '|' + step;
      if (!el) { el = document.createElement('div'); el.className = 'kzrd-day'; p.insertBefore(el, p.firstChild); }
      if (el.__s !== sig) {
        el.__s = sig; el.classList.toggle('on', d);
        el.innerHTML = '<button type="button" class="kzrd-dck" data-rd-day="' + esc(id) + '" aria-pressed="' + d + '" aria-label="' + (d ? 'Undo today’s progress: ' : 'Log today’s progress: ') + esc(g.name) + '">' + TICK + '</button>' +
          '<span class="kzrd-t"><b>' + (d ? 'Worked on it today' : 'Today’s progress') + '</b><em>' + esc(step || 'A day of work on it. Milestones stay as they are.') + '</em></span>';
      }
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rd-day]'); if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    var id = b.getAttribute('data-rd-day'), row = b.closest('.kz-grow'), ck = row && row.querySelector('.kz-check[data-kz-done="' + id + '"]');
    b.classList.add('pop'); setTimeout(function () { b.classList.remove('pop'); }, 400);
    if (ck) ck.click();
    setTimeout(soon, 0); setTimeout(soon, 250);
  }, true);
  function boot() { paint(); new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && t.closest('.kzrd-day')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
    ['kz:changed', 'kz:step', 'kz:goals'].forEach(function (n) { document.addEventListener(n, soon); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
