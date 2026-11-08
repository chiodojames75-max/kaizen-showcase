/* Oct 23 Phase 2: empty states */
(function () {
  var K = window.KZ; if (!K) return;
  function hint() {
    var cal = document.querySelector('#kz-cal.kz-progcal'); if (!cal) return;
    var none = !(K.shownDays && K.shownDays().length), h = cal.querySelector('.kz-p2-hint');
    if (none && !h) { var lg = cal.querySelector('.kz-callegend'); if (lg) lg.insertAdjacentHTML('afterend', '<p class="kz-p2-hint">Check off your first goal and today turns gold. Every day you show up fills in here.</p>'); }
    if (!none && h) h.remove();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hint); else hint();
  ['kz:step', 'kz:changed', 'kz:goals'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(hint, 0); }); });
})();
