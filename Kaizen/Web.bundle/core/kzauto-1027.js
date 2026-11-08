/* Oct 27 · James: "update all these tabs that are hidden behind buttons to have the gradient pill background".
   Panels that only appear after a tap (day details on Progress, sheets, pickers, editors…) are too many to list, so any card
   drawn flat in the old greys (#1C1C1E / #2C2C2E family, rounded, card-sized) gets the to-do card surface the moment it
   shows up (class kzs-auto, styles in kzauto-1027.css). Skipped: anything inside a card that already has the surface (so
   stacked rows never become separate pills), buttons/inputs, small chips, and the Instagram-style ••• sheet's own groups. */
(function () {
  if (window.__kzauto) return; window.__kzauto = 1;
  var SEL = 'div, section, article, li, nav, form, a, aside, details, ul', SURF = '.kzs-auto, .kz-rows, .kzq-list, .kz-plancard, .kzsw, .kzs, .kzh, .kzgv, .kzgp, .kzrd, .kz-todo.plan';
  function flat(cs) {
    if (cs.backgroundImage !== 'none') return false;
    var m = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?/.exec(cs.backgroundColor); if (!m) return false;
    var r = +m[1], g = +m[2], b = +m[3], a = m[4] === undefined ? 1 : +m[4];
    return a >= .8 && r >= 18 && r <= 58 && Math.abs(r - g) <= 6 && Math.abs(g - b) <= 8;
  }
  function scan() {
    t = 0;
    var els = document.body.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.classList.contains('kzs-auto') || el.__kza) continue;
      if (el.matches(SURF)) { el.__kza = 1; continue; }
      var bw = el.offsetWidth, bh = el.offsetHeight; if (bw < 140 || bh < 40) continue;
      var cs = getComputedStyle(el); if (!flat(cs) || parseFloat(cs.borderTopLeftRadius) < 10) { continue; }
      var p = el.parentElement && el.parentElement.closest(SURF); if (p) { el.__kza = 1; continue; }
      el.classList.add('kzs-auto');
    }
  }
  var t = 0; function soon() { if (!t) t = setTimeout(function () { requestAnimationFrame(scan); }, 120); }
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', soon, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
  addEventListener('load', soon);
})();
