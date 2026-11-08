/* Nov 3 · James: the "Day complete" line under Today no longer talks about the retired tree; it says how far today climbed
   ("Day complete. You climbed 393 ft." — 131 ft for each habit checked off today). */
(function () {
  var K = window.KZ; if (!K || K.__kzdone1102) return; K.__kzdone1102 = 1;
  function run() {
    q = 0; var el = document.querySelector('[data-kzdn]'); if (!el) return;
    var ft = 0; try { (K.goals() || []).forEach(function (g) { if (g.kind === 'daily' && K.isDone(g.id)) ft += 131; }); } catch (e) {}
    var b = el.querySelector('b'), t = ft.toLocaleString(); if (b.textContent !== t) b.textContent = t; if (el.hidden !== !ft) el.hidden = !ft;
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  ['kz:changed', 'kz:alldone', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (!(ms[i].target.closest && ms[i].target.closest('[data-kzdn]'))) { soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  soon();
})();
