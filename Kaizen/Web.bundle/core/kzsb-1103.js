/* Nov 3 · James: the tab bar (Today / Plan / Growth / Progress / Me) sometimes showed on top of a sheet (timer, quick menu,
   goal menu) and the sheets left room for it at the bottom. While any sheet is open the bar now goes away (html.kzsb), and
   it comes back a moment after the sheet closes so it can't flash through the closing animation. Styles: kzsb-1103.css */
(function () {
  if (window.__kzsb1103) return; window.__kzsb1103 = 1;
  var de = document.documentElement, off = 0, q = 0;
  var KNOWN = '.kztm-pick.on, .kz-planmodal:not([hidden]), .kzm:not([hidden]), .kzf-qs.on, .kzf-qs:not([hidden]) .kzf-qs-in';
  function vis(x) {
    for (var e = x; e && e !== document.body; e = e.parentElement) { var c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; }
    return true;
  }
  function sheetOpen() {
    var vh = innerHeight, vw = innerWidth, k = document.querySelectorAll(KNOWN);
    for (var i = 0; i < k.length; i++) { var r = k[i].getBoundingClientRect(); if (r.height > 40 && vis(k[i])) return true; }
    var all = document.body.querySelectorAll('div, section, aside, dialog, form');
    for (var j = 0; j < all.length; j++) { var x = all[j];
      if (x.closest('.kz-tabbar')) continue;
      var r2 = x.getBoundingClientRect(); if (r2.width < vw * .9 || r2.height < vh * .22 || r2.top < vh * .12 || Math.abs(r2.bottom - vh) > 3) continue;
      var c = getComputedStyle(x); if (c.position !== 'fixed' && c.position !== 'absolute') continue;
      if ((parseInt(c.zIndex, 10) || 0) < 50) continue;
      if (vis(x)) return true; }
    return false;
  }
  function run() {
    q = 0; var o = sheetOpen();
    if (o) { clearTimeout(off); off = 0; if (!de.classList.contains('kzsb')) de.classList.add('kzsb'); }
    else if (de.classList.contains('kzsb') && !off) off = setTimeout(function () { off = 0; if (!sheetOpen()) de.classList.remove('kzsb'); }, 380);
  }
  function soon() { if (!q) { q = 1; requestAnimationFrame(run); } }
  function start() {
    run();
    new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) { var t = m[i].target; if (t === de) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style', 'open', 'aria-hidden'] });
    document.addEventListener('click', function () { soon(); setTimeout(soon, 120); setTimeout(soon, 400); }, true);
    addEventListener('resize', soon);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
