/* Oct 27 c (replaces kzpull-1027b): on the phone the sheet didn't move with the finger: the sheets' own CSS sets
   transform with !important, which beat the inline style. The drag now sets transform/transition as important.
   The grab area is the top 96 px (the bar and the title row), not just 56.
   Oct 27 b (replaces kzpull-1027): James: "once it's below 60% if you let go it snaps away, if it's over 60% it snaps back".
   Let go with less than 60% of the sheet still showing (dragged down more than 40% of its height) → it closes; otherwise
   it springs back open. No flick rule any more, the position alone decides.
   Oct 27 · kzpull-1027 (all pages): hold the top of a sheet (the grey bar) and swipe down to close it, like iOS sheets
   (James: "make it so you can hold that at the top and swipe down and it will close").
   Any sheet with a grabber bar (a ::before or a small bar element, 30–64 × 3–8 px) can be pulled from its top 56 px.
   The sheet follows your finger; let go past 110 px (or with a quick flick) and it slides away and closes through its own
   close button (so whatever the close does, saving drafts etc., still happens); otherwise it springs back. */
(function () {
  var K = window.KZ || {}; if (window.__kzpull) return; window.__kzpull = 1;
  var ZONE = 96, KEEP = 0.6;
  function st(p, k, v) { if (v === '') p.style.removeProperty(k); else p.style.setProperty(k, v, 'important'); }
  function isBar(w, h) { return w >= 30 && w <= 64 && h >= 3 && h <= 8; }
  function panelFor(el) {
    for (var i = 0; el && el !== document.body && i < 14; i++, el = el.parentElement) {
      var b = getComputedStyle(el, '::before');
      if (b && b.content && b.content !== 'none' && isBar(parseFloat(b.width), parseFloat(b.height))) return el;
      var r = el.getBoundingClientRect(); if (!el.children.length && isBar(r.width, r.height) && el.parentElement) return el.parentElement;
      var g = el.querySelector && el.querySelector(':scope > .kz-grab, :scope > .kz-grabber, :scope > [data-grab]'); if (g) return el;
    }
    return null;
  }
  function closeBtn(panel) {
    var roots = [panel, panel.closest('.kz-sheet49, [role=dialog], .kz-gsheet, .kz-pm, .kzn-sheet, .kz-sheet') || panel.parentElement];
    for (var i = 0; i < roots.length; i++) {
      var r = roots[i]; if (!r) continue;
      var b = r.querySelector('[aria-label="Close"], [aria-label^="Close"], [data-t$="close"], [data-close], .kz-iconbtn[aria-label*="lose"], .kz-x');
      if (b) return b;
    }
    return null;
  }
  var d = null;
  document.addEventListener('touchstart', function (e) {
    d = null; if (e.touches.length !== 1) return;
    var t = e.touches[0], p = panelFor(e.target); if (!p) return;
    var r = p.getBoundingClientRect(); if (t.clientY - r.top > ZONE || t.clientY < r.top - 4) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    d = { h: Math.max(80, Math.min(p.offsetHeight, window.innerHeight - r.top)), p: p, y0: t.clientY, x0: t.clientX, t0: Date.now(), dy: 0, on: false, lastY: t.clientY, lastT: Date.now(), v: 0 };
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!d) return; var t = e.touches[0], dy = t.clientY - d.y0, dx = t.clientX - d.x0;
    if (!d.on) { if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return; if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { d = null; return; } d.on = true; st(d.p, 'transition', 'none'); st(d.p, 'will-change', 'transform'); }
    e.preventDefault(); e.stopPropagation();
    var now = Date.now(); d.v = (t.clientY - d.lastY) / Math.max(1, now - d.lastT); d.lastY = t.clientY; d.lastT = now;
    d.dy = Math.max(0, dy); st(d.p, 'transform', 'translate3d(0,' + d.dy + 'px,0)');
  }, { capture: true, passive: false });
  function end() {
    if (!d || !d.on) { d = null; return; }
    var p = d.p, go = d.dy > d.h * (1 - KEEP); d = null;
    if (go) {
      var b = closeBtn(p);
      st(p, 'transition', 'transform .22s cubic-bezier(.3,.7,.4,1)'); st(p, 'transform', 'translate3d(0,' + Math.max(window.innerHeight, p.offsetHeight) + 'px,0)');
      try { navigator.vibrate && navigator.vibrate(0); } catch (er) {}
      setTimeout(function () {
        if (b) b.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        setTimeout(function () { st(p, 'transition', ''); st(p, 'transform', ''); st(p, 'will-change', ''); }, 380);
      }, 200);
    } else {
      st(p, 'transition', 'transform .32s cubic-bezier(.2,1.25,.4,1)'); st(p, 'transform', 'translate3d(0,0,0)');
      setTimeout(function () { st(p, 'transition', ''); st(p, 'transform', ''); st(p, 'will-change', ''); }, 340);
    }
  }
  document.addEventListener('touchend', end, true);
  document.addEventListener('touchcancel', end, true);
})();
