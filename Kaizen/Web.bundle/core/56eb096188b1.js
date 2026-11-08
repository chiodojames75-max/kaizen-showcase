
/* Oct 21: tap the top-left triangle -> a small card drops from the top: the triangle is delta, the symbol for change */
(function () { if (window.__kzDelta) return; window.__kzDelta = 1;
  var MK = '<svg viewBox="56 52 88 78" aria-hidden="true"><defs><linearGradient id="kzdlg" gradientUnits="userSpaceOnUse" x1="64" y1="0" x2="136" y2="0"><stop offset="0" stop-color="#B8902E"/><stop offset=".5" stop-color="#B8902E"/><stop offset=".5" stop-color="#E9C55A"/><stop offset="1" stop-color="#E9C55A"/></linearGradient></defs><path d="M64 122 H136 L100 60 L82 91" fill="none" stroke="url(#kzdlg)" stroke-width="9" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
  var cur = null, tm = 0;
  function close() { var c = cur; if (!c) return; cur = null; clearTimeout(tm); c.classList.remove('on'); c.classList.add('off'); setTimeout(function () { c.remove(); }, 320); document.removeEventListener('click', outside, true); }
  function outside(e) { if (cur && !e.target.closest('.kz-delta-in')) { close(); if (e.target.closest('#kz-header .kz-mark')) { e.preventDefault(); e.stopImmediatePropagation(); } } }
  function open() {
    if (cur) { close(); return; }
    var c = document.createElement('div'); c.className = 'kz-delta'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'What the triangle means');
    c.innerHTML = '<div class="kz-delta-in"><span class="kz-delta-mk">' + MK + '</span><span class="kz-delta-tx"><small>Δ · Delta</small><b>The triangle is delta, the symbol for change.</b><span>Kaizen means small, steady change. Every goal you check off is a little Δ.</span></span></div>';
    document.body.appendChild(c); void c.offsetWidth; c.classList.add('on'); cur = c;
    try { navigator.vibrate(6); } catch (e) {}
    c.querySelector('.kz-delta-in').addEventListener('click', close);
    setTimeout(function () { document.addEventListener('click', outside, true); }, 0);
    tm = setTimeout(close, 7000);
    var y0 = null; c.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    c.addEventListener('touchmove', function (e) { if (y0 !== null && e.touches[0].clientY - y0 < -18) { y0 = null; close(); } }, { passive: true });
  }
  document.addEventListener('click', function (e) { var m = e.target.closest && e.target.closest('#kz-header .kz-mark'); if (!m || cur) return; e.preventDefault(); e.stopImmediatePropagation(); open(); }, true);
})();
