/* Oct 28 · a bottom sheet that closes slides down instead of vanishing (styles: kzsheetmo-1028.css). The app hides a
   sheet by setting its hidden attribute; this keeps it drawn for 260 ms with class kz-closing (taps pass through), so
   every check of sheet.hidden still sees it closed right away. Reopening mid-slide just opens it again. */
(function () {
  if (window.__kzsmo) return; window.__kzsmo = 1;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var RMO = window.__RealMO || MutationObserver;
  function seen(el, was) {
    if (!el.classList || !el.classList.contains('kz-sheet49')) return;
    if (el.hasAttribute('hidden')) {
      if (was !== null || el.classList.contains('kz-closing')) return;   // only a sheet that was showing
      el.classList.add('kz-closing'); clearTimeout(el.__kzsmo);
      el.__kzsmo = setTimeout(function () { el.classList.remove('kz-closing'); }, 270);
    } else if (el.classList.contains('kz-closing')) { clearTimeout(el.__kzsmo); el.classList.remove('kz-closing'); }
  }
  function boot() {
    new RMO(function (recs) { for (var i = 0; i < recs.length; i++) seen(recs[i].target, recs[i].oldValue); })
      .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['hidden'], attributeOldValue: true });
  }
  if (document.documentElement) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
