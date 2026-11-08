/* Oct 27 x (from 1027v) · fixes: no body.kz-noscroll (it jumped a scrolled page to the top, kzmenu read that as a scroll and
   closed the menu before it painted: the ••• on Done today rows 'glitched and never opened'); the tab bar is told directly.
   Kaizen 66 icon reads 66. No Archive row.
   Was: Oct 27 v · Goal actions as a bottom sheet (James: "like Instagram's"). kzmenu-1025n still builds the menu and runs every
   action; this only reshapes it when it appears: grab handle on top, rows grouped into rounded cards, icon on the left of
   each label. Drag the sheet down (or tap outside) to close it. Dark, to match the app. Styles: kzsheet-1027x.css */
(function () {
  var K = window.KZ; if (!K || K.__kzsheet) return; K.__kzsheet = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var K66 = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><text x="12" y="15.6" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor" stroke="none" font-family="-apple-system, system-ui, sans-serif" letter-spacing="-.3">66</text></svg>';
  function shape(m) {
    if (m.__kzs) return; m.__kzs = 1; m.classList.add('kzs');
    var kids = [].slice.call(m.children), grp = null, frag = document.createDocumentFragment();
    var grab = document.createElement('i'); grab.className = 'kzs-grab'; grab.setAttribute('aria-hidden', 'true'); frag.appendChild(grab);
    kids.forEach(function (el) {
      if (el.classList.contains('kzm-sep')) { el.remove(); grp = null; return; }
      if (!grp) { grp = document.createElement('div'); grp.className = 'kzs-grp'; grp.setAttribute('role', 'group'); frag.appendChild(grp); }
      if (el.getAttribute('data-k') === 'arch') { el.remove(); return; }   // archive is gone (James, Oct 27)
      if (el.getAttribute('data-k') === 'k66') { var o = el.querySelector('svg'); if (o) o.outerHTML = K66; }
      var ic = el.querySelector('svg'); if (ic) el.insertBefore(ic, el.firstChild);   // icon left, like Instagram
      grp.appendChild(el);
    });
    m.appendChild(frag);
    drag(m);
    // like every other sheet: the page behind holds still and the tab bar steps aside (1dddad8 tells the app)
    // the page holds still and the tab bar steps aside, told to the app directly (no body class: see top)
    var mine = !document.body.classList.contains('kz-noscroll');
    if (mine) post({ type: 'pageScroll', on: false });
    var done = function () { if (mine) { mine = false; if (!document.body.classList.contains('kz-noscroll')) post({ type: 'pageScroll', on: true }); } };
    new MutationObserver(function (r, o) { if (m.classList.contains('out') || !m.isConnected) { done(); o.disconnect(); } }).observe(m, { attributes: true, attributeFilter: ['class'] });
    m.__kzsDone = done;
  }
  // drag down to dismiss
  function drag(m) {
    var y0 = 0, t0 = 0, dy = 0, on = false, moved = false;
    m.addEventListener('touchstart', function (e) { if (e.touches.length > 1) return; on = true; moved = false; dy = 0; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
    m.addEventListener('touchmove', function (e) {
      if (!on) return; dy = e.touches[0].clientY - y0;
      if (!moved && Math.abs(dy) < 8) return;
      moved = true; m.classList.add('kzs-drag');
      m.style.transform = 'translateY(' + (dy > 0 ? dy : dy / 6) + 'px)';   // a little give upward, free downward
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    m.addEventListener('touchend', function () {
      if (!on) return; on = false; if (!moved) return;
      var fast = dy > 30 && dy / Math.max(1, Date.now() - t0) > 0.5;
      m.classList.remove('kzs-drag');
      if (dy > 90 || fast) { var b = document.querySelector('.kzm-back'); m.style.transform = 'translateY(' + Math.max(dy, 0) + 'px)'; if (b) b.click(); }
      else m.style.transform = '';
    });
    // a drag that ends over a row must not also press it
    m.addEventListener('click', function (e) { if (moved) { moved = false; e.stopPropagation(); e.preventDefault(); } }, true);
  }
  function scan(n) { if (n.nodeType === 1 && n.classList.contains('kzm') && n.getAttribute('role') === 'menu') shape(n); }
  new MutationObserver(function (ms) { ms.forEach(function (r) {
    [].forEach.call(r.addedNodes, scan);
    [].forEach.call(r.removedNodes, function (n) { if (n.__kzsDone) n.__kzsDone(); });   // closed at once (no "out" step)
  }); }).observe(document.body, { childList: true });
})();
