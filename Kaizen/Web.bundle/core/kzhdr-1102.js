/* Nov 2 · header C: the date reads "MON · NOV 2" (styled orange in kzhdr-1102.css) */
(function () {
  if (window.__kzhdr1102) return; window.__kzhdr1102 = 1;
  function run() { q = 0; var el = document.querySelector('.kz-hbar [data-kz-hdate]'); if (!el) return; var d = new Date();
    try { if (window.KZ && KZ.today) d = KZ.today(); } catch (e) {}
    var t = d.toLocaleDateString(undefined, { weekday: 'short' }) + ' · ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (el.textContent !== t) el.textContent = t; }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  soon();
})();
