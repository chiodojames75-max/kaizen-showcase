/* Nov 3 · Plan week strip, mockup B "Progress rings" (James). Each day with tasks gets a thin ring around its date that fills
   gold as the day's tasks get done; days with nothing are dimmed; no dots. Reads the same tasks the strip already counts
   (to-dos for that day + that day's plan). Styles: kzwk-1103.css */
(function () {
  if (window.__kzwk1103) return; window.__kzwk1103 = 1;
  function pct(k) {
    var K = window.KZ; if (!K || !K.todosFor) return null;
    var td = [], pl = [];
    try { td = K.todosFor(k) || []; } catch (e) {}
    try { var p = K.plan && K.plan(k); pl = p && p.items ? p.items : []; } catch (e) {}
    var tot = td.length + pl.length, dn = td.filter(function (t) { return t.done; }).length + pl.filter(function (x) { return x.done; }).length;
    if (!tot) { var past = 0; try { past = K.todosDoneOn ? K.todosDoneOn(k).length : 0; } catch (e) {} return past ? 100 : -1; }
    return Math.round(dn / tot * 100);
  }
  function run() {
    [].forEach.call(document.querySelectorAll('.kz-week7 > button[data-day]'), function (b) {
      var p = pct(b.getAttribute('data-day')); if (p === null) return;
      var v = p < 0 ? 'none' : p >= 100 ? 'full' : 'some', s = String(Math.max(p, 0));
      if (b.getAttribute('data-kzwr') !== v) b.setAttribute('data-kzwr', v);
      var n = b.querySelector('b'); if (n && n.style.getPropertyValue('--kzwr') !== s + '%') n.style.setProperty('--kzwr', s + '%');
    });
  }
  var q = 0; function soon() { if (!q) { q = 1; requestAnimationFrame(function () { q = 0; run(); }); } }
  function start() {
    run();
    new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) if (m[i].type === 'childList') { soon(); return; } }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', function () { setTimeout(run, 60); }, true);
    document.addEventListener('visibilitychange', run);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
