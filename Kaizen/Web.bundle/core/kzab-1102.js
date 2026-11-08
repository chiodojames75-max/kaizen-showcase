/* Nov 3 · Add sheet (James): Long-term, Daily habit and Quit use mockup B "Big question + settings list" (the question is the big
   field, suggestions under it, then each option as one row); To-do uses mockup A "Plain form". Every option is kept. This file only
   adds the Area row (shows the area picked; tap to open the chips) and keeps its value up to date. Styles: kzab-1102.css */
(function () {
  if (window.__kzab1102) return; window.__kzab1102 = 1;
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kz-addsheet'), function (sh) {
      sh.classList.add('kzab');
      // option fields become rows only when this kind of goal shows them (each kind hides the others' fields)
      [].forEach.call(sh.querySelectorAll('#kz-add-more > label.kz-field49:not(.kz-steprow), .kzq-box > label.kz-field49, .kzbd-in > label.kz-field49'), function (l) {
        l.setAttribute('data-kzab', ''); var had = l.classList.contains('kzab-r'); if (had) l.classList.remove('kzab-r');
        var vis = !l.hidden && l.getClientRects().length > 0; if (vis) l.classList.add('kzab-r');
      });
      var area = [].filter.call(sh.querySelectorAll('.kz-field49'), function (f) { return f.querySelector(':scope > .kz-chips49 [data-p]'); })[0];
      if (!area) return; area.classList.add('kzab-area');
      var h = area.querySelector(':scope > .kzab-ah');
      if (!h) { h = document.createElement('button'); h.type = 'button'; h.className = 'kzab-ah'; h.setAttribute('aria-expanded', 'false');
        h.addEventListener('click', function () { var o = !area.classList.contains('kzab-open'); area.classList.toggle('kzab-open', o); h.setAttribute('aria-expanded', String(o)); });
        area.insertBefore(h, area.firstChild); }
      var on = area.querySelector('[data-p][aria-pressed="true"], [data-p].on, [data-p][aria-checked="true"]'), nm = on ? on.textContent.trim() : 'None';
      var c = on ? getComputedStyle(on).getPropertyValue('--c') || getComputedStyle(on).getPropertyValue('--pc') : '';
      var html = '<span>Area</span><em>' + (on ? '<i style="background:' + (c.trim() || '#8E8E93') + '"></i>' : '') + nm + '</em>';
      if (h.__h !== html) { h.innerHTML = html; h.__h = html; }
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzab-ah')) continue; if (ms[i].type === 'attributes' && t.hasAttribute && t.hasAttribute('data-kzab')) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'hidden'] });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.kzab-area [data-p]')) setTimeout(function () { var a = e.target.closest('.kzab-area'); if (a) { a.classList.remove('kzab-open'); } soon(); }, 120); }, true);
  soon();
})();
