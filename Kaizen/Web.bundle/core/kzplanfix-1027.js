/* Oct 27 · James: "Lock in my plan should be the last screen; it brings you back to the Plan tab, it shouldn't prompt you
   again". 0cd2dcca6304 closes the planner and then opens the full plan view ("Last night's plan", Add tasks / Done). Right
   after that same tap (bubble phase, before anything is painted) the view is closed again with its own Close button. */
(function () {
  if (window.__kzplanfix) return; window.__kzplanfix = 1;
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('[data-t="pm-save"]')) return;
    var v = document.querySelector('[data-t="pview"]'), x = document.querySelector('[data-t="pv-close"]');
    if (v && !v.hidden && x) x.click();
  });
})();
