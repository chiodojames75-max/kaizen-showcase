/* Oct 24 · One pop-up at a time (bug fix). On launch the quote card, an unlock reveal, a streak milestone and the tree
   welcome could all open together and pile on top of each other (the quote card covered the unlock's buttons).
   This keeps the first one that opened in front and holds the others back (hidden, untouchable) until it closes,
   then shows the next. It never opens or closes anything itself. */
(function () {
  if (window.__kzq) return; window.__kzq = 1;
  var SEL = '.kz-qcard, .kz-reveal, .kz-qmodal, .kz-p3, .kz-p4, .kzc-over, .kz-twelcome, .kz66-over', order = [], obs = [], tick = 0, raf = 0;
  var open = function (e) { // our own hold (visibility) is ignored here on purpose
    if (!e.isConnected || e.hidden || e.classList.contains('out')) return false;
    return getComputedStyle(e).display !== 'none';
  };
  function scan() {
    raf = 0;
    var now = Array.prototype.filter.call(document.querySelectorAll(SEL), open);
    order = order.filter(function (e) { return now.indexOf(e) > -1; });
    now.forEach(function (e) { if (order.indexOf(e) < 0) order.push(e); });
    order.forEach(function (e, i) { if (i) e.setAttribute('data-kzq-wait', ''); else e.removeAttribute('data-kzq-wait'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-kzq-wait]'), function (e) { if (order.indexOf(e) < 1) e.removeAttribute('data-kzq-wait'); });
    if (order.length) document.body.classList.add('kz-noscroll'); // a closing pop-up unlocks scrolling even when another is still up
    watch();
    if (order.length > 1 && !tick) tick = setInterval(function () { soon(); if (order.length < 2) { clearInterval(tick); tick = 0; } }, 400);
  }
  function soon() { if (!raf) raf = requestAnimationFrame(scan); }
  function watch() {
    Array.prototype.forEach.call(document.querySelectorAll(SEL), function (e) {
      if (e.__kzq) return; e.__kzq = 1;
      var m = new MutationObserver(soon); m.observe(e, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] }); obs.push(m);
    });
  }
  function start() {
    new MutationObserver(soon).observe(document.body, { childList: true });
    document.addEventListener('click', function () { setTimeout(soon, 0); setTimeout(soon, 260); }, true);
    soon(); // first check on the next frame, so it never forces an extra layout while the page is still loading
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
