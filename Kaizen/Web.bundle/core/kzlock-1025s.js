
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
