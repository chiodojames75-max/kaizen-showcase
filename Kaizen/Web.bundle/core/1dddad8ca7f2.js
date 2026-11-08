
/* Oct 22: keyboard - nothing moves. The app holds the view still from the tap until the keyboard is up;
   then, only if the keyboard covers the box, that box's own sheet (or the page content) lifts just enough. */
(function () { if (window.__kzKb) return; window.__kzKb = 1;
  var isText = function (el) { return !!el && (el.tagName === 'TEXTAREA' || el.isContentEditable || (el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range|file|hidden|color|date|time)$/i.test(el.type || ''))); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var vvH = function () { var vv = window.visualViewport; return vv ? vv.height + vv.offsetTop : window.innerHeight; };
  var kbH = function () { return Math.max(0, Math.round(window.innerHeight - vvH())); };
  var pinned = null, lifted = null;
  // A bottom sheet with the keyboard up: held at its current height and place, with room for the keyboard added
  // inside it, so it always scrolls on its own (even when it's short) and never moves.
  var pin = function (sc) {
    if (pinned === sc) return; unpin();
    var h = Math.round(sc.getBoundingClientRect().height);
    sc.dataset.kzPad = sc.style.paddingBottom || ''; sc.dataset.kzH = sc.style.height || '';
    sc.style.height = h + 'px'; sc.style.paddingBottom = 'calc(24px + env(safe-area-inset-bottom, 0px) + ' + kbH() + 'px)';
    sc.classList.add('kz-kbpin'); pinned = sc;
  };
  var unpin = function () { if (!pinned) return; var sc = pinned; pinned = null; sc.style.paddingBottom = sc.dataset.kzPad || ''; sc.style.height = sc.dataset.kzH || ''; sc.classList.remove('kz-kbpin'); };
  var drop = function () { unpin(); if (lifted) { lifted.style.translate = ''; var l = lifted; setTimeout(function () { if (l !== lifted) l.style.transition = ''; }, 260); lifted = null; } };
  var open = function () { return kbH() > 100; };
  var check = function () {
    var a = document.activeElement; if (!isText(a)) return;
    var sc = a.closest('.kz-sheet49') && a.closest('.kz-sheet-in');
    if (sc && open()) pin(sc);
    var need = Math.ceil(a.getBoundingClientRect().bottom + 12 - vvH()); if (need <= 0) return; // already visible: nothing moves
    if (sc) { sc.scrollBy({ top: need, behavior: 'smooth' }); return; } // only the sheet's own contents scroll
    var dlg = a.closest('[role="dialog"], .kz-qmodal, .kz-reveal, .kz-twelcome, .kz-welcome');
    if (dlg) { var panel = dlg.firstElementChild && dlg.firstElementChild.contains(a) ? dlg.firstElementChild : dlg;
      if (lifted && lifted !== panel) { lifted.style.translate = ''; } lifted = panel;
      var cur = parseFloat(String(panel.style.translate || '0 0').split(' ')[1]) || 0; /* 'translate', not 'transform': the sheet's own open animation holds transform */
      panel.style.transition = 'translate 200ms cubic-bezier(.2,.8,.2,1)'; panel.style.translate = '0 ' + Math.round(cur - need) + 'px'; return; }
    window.scrollBy({ top: need, behavior: 'smooth' }); // a box in the page itself: only the page content moves, never the background
  };
  window.__kzKbShown = check;
  document.addEventListener('focusin', function (e) {
    var t = e.target; if (!isText(t)) return;
    if (t.tagName === 'INPUT' && !t.hasAttribute('enterkeyhint')) t.setAttribute('enterkeyhint', 'done');
    post({ type: 'kbHold' }); if (open()) setTimeout(check, 350);
  }, true);
  document.addEventListener('focusout', function () { setTimeout(function () { if (!isText(document.activeElement)) drop(); }, 60); }, true);
  // Return puts the keyboard away. In the New goal sheet it does only that (no adding the goal by accident);
  // everywhere else the box keeps its Return action (add a to-do, save a name) and then the keyboard closes.
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.key !== 'Enter' || e.isComposing || !t || t.tagName !== 'INPUT' || !isText(t)) return;
    if (t.closest('.kz-addsheet')) { e.preventDefault(); e.stopPropagation(); t.blur(); return; }
    setTimeout(function () { var a = document.activeElement; if (a && a.tagName === 'INPUT' && isText(a)) a.blur(); }, 0);
  }, true);
  // While a sheet or pop-up is open, the page behind it can't scroll at all (the app turns that off natively).
  var bg = null, sync = function () { var on = !document.body.classList.contains('kz-noscroll'); if (on !== bg) { bg = on; post({ type: 'pageScroll', on: on }); } };
  try { new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
  sync();
})();
