/* Nov 3 · Progress calendar, mockup A "Month pager" (James): one month at a time with ‹ › to go back through every month you've
   used Kaizen (the earlier months used to be a folded "Earlier" list). Days are circles (kzcal-1102.css). Tapping a day still opens
   its day card. */
(function () {
  if (window.__kzcal1102) return; window.__kzcal1102 = 1;
  var cur = null, MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function months(box) { return [].slice.call(box.querySelectorAll(':scope > .kz-calmonth[data-month]')); }
  function run() {
    q = 0; var cal = document.getElementById('kz-cal'); if (!cal) return;
    var box = cal.querySelector('.kz-calmonths'), minis = cal.querySelector('.kz-calminis'), ew = cal.querySelector('.kz-calearlierwrap'); if (!box) return;
    if (minis && minis.firstElementChild) [].slice.call(minis.querySelectorAll(':scope > .kz-calmonth[data-month]')).forEach(function (m) { box.appendChild(m); });
    if (ew && !ew.classList.contains('kzcal-gone')) ew.classList.add('kzcal-gone');
    var ms = months(box); if (!ms.length) return;
    ms.sort(function (a, b) { var x = a.dataset.month.split('-'), y = b.dataset.month.split('-'); return (+y[0] * 12 + +y[1]) - (+x[0] * 12 + +x[1]); });
    var now = months(box); if (now.some(function (m, k) { return m !== ms[k]; })) ms.forEach(function (m) { box.appendChild(m); });
    if (!cur || !ms.some(function (m) { return m.dataset.month === cur; })) cur = ms[0].dataset.month;
    var i = 0; ms.forEach(function (m, k) { var on = m.dataset.month === cur; if (on) i = k; if (m.classList.contains('kzcal-on') !== on) m.classList.toggle('kzcal-on', on); });
    var nav = cal.querySelector('.kzcal-nav');
    if (!nav) { nav = document.createElement('div'); nav.className = 'kzcal-nav';
      nav.innerHTML = '<button type="button" class="kzcal-prev" aria-label="Earlier month">‹</button><b aria-live="polite"></b><button type="button" class="kzcal-next" aria-label="Later month">›</button>';
      nav.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; var list = months(cal.querySelector('.kz-calmonths')), j = list.findIndex(function (m) { return m.dataset.month === cur; });
        j += b.classList.contains('kzcal-prev') ? 1 : -1; if (list[j]) { cur = list[j].dataset.month; run(); } }); }
    if (nav.nextElementSibling !== box) box.parentNode.insertBefore(nav, box);
    var p = cur.split('-'), t = MON[+p[1] - 1] + ' ' + p[0];
    if (nav.querySelector('b').textContent !== t) nav.querySelector('b').textContent = t;
    nav.querySelector('.kzcal-prev').disabled = i >= ms.length - 1; nav.querySelector('.kzcal-next').disabled = i <= 0;
  }
  // swipe left/right on the month to change it
  var sx = null, sy = 0;
  document.addEventListener('touchstart', function (e) { var m = e.target.closest && e.target.closest('#kz-cal .kz-calmonths'); sx = m ? e.touches[0].clientX : null; sy = m ? e.touches[0].clientY : 0; }, { passive: true });
  document.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { var b = document.querySelector('#kz-cal .kzcal-' + (dx > 0 ? 'prev' : 'next')); if (b && !b.disabled) b.click(); } }, { passive: true });
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzcal-nav')) continue; if (ms[i].type === 'attributes' && t.classList && t.classList.contains('kz-calmonth')) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true });
  soon();
})();
