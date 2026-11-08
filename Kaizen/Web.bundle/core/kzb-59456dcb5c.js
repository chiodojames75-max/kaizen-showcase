/* ==== 978d80b77089.js ==== */
;try {

/* Oct 21: mark the page while a text field has focus (hides the tab bar so iOS can't carry it up with the keyboard) */
(function () { if (window.__kzTyping) return; window.__kzTyping = 1;
  var isText = function (el) { if (!el) return false; if (el.isContentEditable || el.tagName === 'TEXTAREA') return true; if (el.tagName !== 'INPUT') return false; var t = (el.type || 'text').toLowerCase(); return ['text', 'search', 'email', 'url', 'tel', 'number', 'password'].indexOf(t) >= 0; };
  var set = function () { document.documentElement.classList.toggle('kz-typing', isText(document.activeElement)); };
  document.addEventListener('focusin', set, true); document.addEventListener('focusout', function () { setTimeout(set, 60); }, true);
  // Goal note boxes get their Dictate button up front, so nothing appears (and shifts Save note) the moment you start typing
  var q = 0, prep = function () { q = 0; var K = window.KZ; if (!K || !K.dictate) return; document.querySelectorAll('.kz-gnbox').forEach(function (b) { if (b._mic) return; b._mic = 1; b._grow = 1; try { K.dictate(b); } catch (e) {} }); };
  var later = function () { if (!q) q = requestAnimationFrame(prep); };
  document.addEventListener('DOMContentLoaded', later); later();
  try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 65f652c6c320.js ==== */
;try {

/* Oct 22: robustness
   1) a new day while the app is open (or when you come back to it) refreshes the page, so dates, water and goals are never stale
   2) one automatic backup copy of your data per day, keeping the newest 3 (used to repair a damaged save)
   3) a clear notice if your data can't be saved */
(function () { if (window.__kzRobust) return; window.__kzRobust = 1;
  var K = window.KZ; if (!K || !K.key) return;
  var day0 = K.key(K.today());
  var busy = function () { var a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return true; return !!document.querySelector('[role="dialog"]:not([hidden]), .kz-noscroll, #kz-splash'); };
  var check = function () { if (K.key(K.today()) === day0) return; if (busy()) return; day0 = K.key(K.today()); try { location.reload(); } catch (e) {} };
  setInterval(check, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(check, 50); });
  setTimeout(function () {
    try { var t = 'kzbak_' + K.key(K.today()); if (localStorage.getItem(t) !== null) return; var o = {};
      Object.keys(localStorage).forEach(function (x) { if (/^(kz_|kzreset)/.test(x)) o[x] = localStorage.getItem(x); });
      var s = JSON.stringify(o); if (s.length > 1500000) return; localStorage.setItem(t, s);
      Object.keys(localStorage).filter(function (x) { return x.indexOf('kzbak_') === 0; }).sort().reverse().slice(3).forEach(function (x) { localStorage.removeItem(x); });
    } catch (e) {}
  }, 4000);
  document.addEventListener('kz:savefail', function () {
    if (document.querySelector('.kz-savefail')) return; var n = document.createElement('div'); n.className = 'kz-savefail'; n.setAttribute('role', 'alert');
    n.innerHTML = '<b>Kaizen couldn’t save your last change.</b>Its storage on this iPhone is full. Go to Me → Export my data to keep a copy, then delete old journal entries.';
    document.body.appendChild(n); n.addEventListener('click', function () { n.remove(); }); setTimeout(function () { if (n.isConnected) n.remove(); }, 12000);
  });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzlock-1025s.js ==== */
;try {

/* Oct 22 (reel plan): scroll memory, one-tap lock, tab direction, rating after a win, trial reminder hook */
(function () { if (window.__kzReel) return; window.__kzReel = 1;
  var K = window.KZ, ss = function () { try { return window.sessionStorage; } catch (e) { return null; } }();
  var native = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  var post = function (m) { try { if (native()) window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };

  /* 8. Scroll memory: each page remembers where you were for this session (a cold launch starts at the top) */
  var SK = 'kz_scroll:' + location.pathname;
  var save = function () { try { if (ss) ss.setItem(SK, String(Math.round(window.scrollY || 0))); } catch (e) {} };
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var want = 0; try { want = ss ? +(ss.getItem(SK) || 0) : 0; } catch (e) {}
  if (want > 0) {
    var tries = 0, stop = false, restore = function () {
      if (stop) return; var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max >= want - 2) { window.scrollTo(0, want); stop = true; return; }
      if (++tries < 25) setTimeout(restore, 60); else { window.scrollTo(0, Math.max(0, max)); stop = true; }
    };
    ['touchstart', 'wheel'].forEach(function (ev) { window.addEventListener(ev, function () { stop = true; }, { once: true, passive: true }); });
    if (document.readyState === 'complete') requestAnimationFrame(restore); else window.addEventListener('load', function () { requestAnimationFrame(restore); });
  }
  var st = 0; window.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(save, 120); }, { passive: true });
  window.addEventListener('pagehide', save); document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });

  /* 10. Tab direction: remember which way we're going, the next page reads it in <head> */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.kz-tabbar a'); if (!a || e.defaultPrevented) return;
    var tabs = [].slice.call(a.parentNode.querySelectorAll('a')), to = tabs.indexOf(a), cur = -1;
    tabs.forEach(function (x, i) { if (x.getAttribute('aria-current') === 'page') cur = i; });
    save(); if (cur < 0 || to === cur) return;
    try { if (ss) ss.setItem('kz_vtdir', JSON.stringify({ d: to > cur ? 'fwd' : 'back', t: Date.now() })); } catch (er) {}
  });

  /* 9. One-tap lock: a second tap on the same save / add / lock-in / check button within 600 ms is ignored */
  var last = null, lastT = 0, TEXT = /^(save|add|lock|create|done|continue|log|plant|start|finish|set|keep|confirm|send|update|delete|clear|turn)\b/i;
  var guarded = function (b) {
    if (b.matches('.kz-check, .kz-pcheck, [data-k66="check"], [data-q-clean], [data-q-undo], .kzf-check, [role="checkbox"]')) return false;   /* Oct 25 s (kzlock-1025s, from 12e29bd34a78): check boxes toggle on every tap, never locked (James: fast on/off tapping lagged) */
    if (b.matches('[data-t="pm-save"], [data-t="pm-add"], [type="submit"], .kz-btn, .kz-fab, [data-kz-once]')) return true;
    return TEXT.test(String(b.textContent || '').trim());
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, [role="button"], input[type="submit"]'); if (!b || b.closest('.kz-tabbar')) return;
    if (!guarded(b)) return; var now = Date.now(), key = b.getAttribute('data-kz-done') || b.getAttribute('data-t') || b.id || b; /* lists re-render, so match by what the button is, not the element */
    if (key === last && now - lastT < 600) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    last = key; lastT = now;
  }, true);

  if (!K) return;

  /* 5. Rating: moved to core/kzp4-1023h.js (Oct 23, Phase 4): right after every goal is done or a milestone, never in the first 3 days, at most once every 120 days. */

  /* 11. Free-trial reminder: 2 days before the trial ends, with the date and price.
     Nothing calls this yet - the paywall will, once it exists. */
  K.trialReminder = function (endsAt, price) { var t = +new Date(endsAt); if (!t || !price) return false; post({ type: 'trialReminder', ends: t, price: String(price) }); return true; };
  K.trialReminderOff = function () { post({ type: 'trialReminderOff' }); };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 1dddad8ca7f2.js ==== */
;try {

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

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
