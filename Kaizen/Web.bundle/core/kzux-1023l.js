/* Oct 23 · UX pass from the reels: new-user simplification and the one-time day-3 reminder card. Styles in kzux-1023l.css. */
(function () {
  var K = window.KZ, root = document.documentElement; if (!K || K.__kzux) return; K.__kzux = 1;
  var shown = function () { try { return K.shownDays().length; } catch (e) { return 0; } };
  // first 3 days shown up: Today keeps one daily card (Quote); Tomorrow waits until today is done, or 6 PM
  var mark = function () { root.classList.toggle('kz-ux-new', shown() < 3); root.classList.toggle('kz-ux-day', new Date().getHours() < 18); };
  mark(); document.addEventListener('kz:step', mark); window.addEventListener('pageshow', mark);

  // Day-3 reminder card: for people who said "Not now" in setup (they never saw Apple's prompt). Once, ever.
  function remOn() { var r = K.get('reminders', {}) || {}; return !!r.on; }
  function busy() { return !!document.querySelector('.kz-p3, #kz-reveal:not([hidden]), .kz-sheet49:not([hidden]).on, .kz-qcard.in, .kz-setup'); }
  function fmt(hm) { var p = String(hm || '07:30').split(':'), h = +p[0], m = +p[1] || 0; return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); }
  function card(tries) {
    if (!document.querySelector('.kz-today') || remOn() || shown() < 3) return;
    var seen = K.get('uxremcard', '');
    if (seen && seen !== K.key(K.today())) return;              // shown on an earlier day: never again
    if (seen === 'done') return;
    if (busy()) { if ((tries || 0) < 40) setTimeout(function () { card((tries || 0) + 1); }, 1500); return; }
    // below the goal list, so the check-offs (the screen's main action) stay where they were
    var chk = document.querySelector('.kz-today button.kz-check[data-kz-done]'), anchor = chk && chk.closest('.kz-rows, .kz-card49');
    if (!anchor) { anchor = document.querySelector('.kz-pcard-tree'); anchor = anchor && anchor.closest('.kz-card49, .kz-pcard'); }
    if (!anchor || document.querySelector('.kz-ux-rem')) return;
    var r = K.get('reminders', {}) || {}, t = fmt(r.morning);
    var el = document.createElement('div'); el.className = 'kz-ux-rem'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Reminder');
    el.innerHTML = '<b>Want a ' + t + ' nudge?</b><p>One reminder in the morning so you don’t miss a day. Never more than two a day.</p>' +
      '<div><button type="button" class="kz-btn gold" data-ux-rem="on">Turn on</button><button type="button" data-ux-rem="no">No thanks</button></div>';
    anchor.parentNode.insertBefore(el, anchor.nextSibling);
    if (!seen) K.set('uxremcard', K.key(K.today()));
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ux-rem]'); if (!b) return;
      K.set('uxremcard', 'done'); el.remove();
      if (b.dataset.uxRem === 'on' && K.openReminders) K.openReminders(false);
    });
  }
  var go = function () { setTimeout(card, 2600); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
