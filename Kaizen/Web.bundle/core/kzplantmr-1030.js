/* Oct 30 · James: "make it so when you edit plan it automatically makes it so you're editing your plan for tomorrow".
   On the Plan tab, while Today is the selected day, the gold button by "N of M done" always shows and opens tomorrow's
   plan: "Plan tomorrow" (nothing planned yet) or "Edit tomorrow" (already planned). Today's list still takes new tasks
   from the bar at the bottom. Pick any other day in the week strip and the button works as before (that day's plan).
   The label is drawn with CSS (kzplantmr-1030.css) so kzpm-1025l's own label updates never fight it. */
(function () {
  var K = window.KZ; if (!K || K.__kzplantmr) return; K.__kzplantmr = 1;
  var de = document.documentElement;
  function td() { return K.key(K.today()); }
  function tm() { return K.key(K.addDays(K.today(), 1)); }
  function sel() { var b = document.querySelector('#kz-plan-s1 [data-p="week"] [aria-selected="true"]'); return b && b.getAttribute('data-day'); }
  function hasPlan(k) { try { return !!(K.plan && K.plan(k)); } catch (e) { return false; } }
  function paint() {
    q = 0;
    var on = sel() === td(), ed = document.querySelector('.kzpb-edit');
    if (de.classList.contains('kzpt-today') !== on) de.classList.toggle('kzpt-today', on);
    var lab = hasPlan(tm()) ? 'Edit tomorrow' : 'Plan tomorrow';
    if (de.getAttribute('data-kzpt') !== lab) de.setAttribute('data-kzpt', lab);
    if (ed) { var al = on ? lab + "'s plan" : ''; if ((ed.getAttribute('aria-label') || '') !== al) { if (al) ed.setAttribute('aria-label', al); else ed.removeAttribute('aria-label'); } }
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('.kzpb-edit'); if (!b) return;
    if (sel() !== td() || !K.openPlanner) return;
    e.preventDefault(); e.stopImmediatePropagation(); K.openPlanner(tm());
  }, true);
  function boot() {
    paint();
    new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { if (l[i].target === de) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    ['kz:changed', 'kz:plan'].forEach(function (n) { document.addEventListener(n, soon); });
    addEventListener('pageshow', soon); document.addEventListener('visibilitychange', soon);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
