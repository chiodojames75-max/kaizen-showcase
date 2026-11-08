/* Nov 2 · Note to self, mockup C "Writing first" (James): the page is for writing; under it three small buttons: an Apple-style mic
   (dictate), Area (shows the area picked; tap to pick) and the reminder (shows the time; tap to set). The same chips and reminder
   controls open under the buttons, so nothing is lost. */
(function () {
  if (window.__kzntc1102) return; window.__kzntc1102 = 1;
  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.6" y="2.4" width="6.8" height="12" rx="3.4" fill="currentColor"/><path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 17.8v3.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  var BELL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  function label(body) {
    var on = body.querySelector('.kznt-chip.on'), ar = body.querySelector('.kzntc-area');
    if (ar) { var c = on && on.getAttribute('data-nt-path') ? (on.style.getPropertyValue('--c') || '#8E8E93') : ''; var t = on && on.getAttribute('data-nt-path') ? on.textContent.trim() : 'Area';
      var h = '<i style="background:' + (c || '#5A5A5E') + '"></i>' + t; if (ar.__h !== h) { ar.innerHTML = h; ar.__h = h; } ar.classList.toggle('kzntc-set', !!c); }
    var rp = body.querySelector('.kznrp'), rb = body.querySelector('.kzntc-rem');
    if (rp && rb) { var tx = rp.textContent || '', tm = /\b\d{1,2}:\d{2}\s?[AP]M\b/i.exec(tx), rep = rp.querySelector('[aria-pressed="true"], .on'), ti = rp.querySelector('input[type="time"]');
      if (!tm && ti && ti.value) { var hm = ti.value.split(':'), hh = +hm[0]; tm = [((hh % 12) || 12) + ':' + hm[1] + (hh < 12 ? ' AM' : ' PM')]; }
      var nT = rp.querySelectorAll('input[type="time"]').length;
      var s = tm ? tm[0] + (rep && rep.textContent.trim().length < 16 ? ' · ' + rep.textContent.trim() : '') + (nT > 1 ? ' +' + (nT - 1) : '') : 'Remind me';
      if (rb.__s !== s) { rb.innerHTML = BELL + '<span>' + s + '</span>'; rb.__s = s; } rb.classList.toggle('kzntc-set', !!tm); }
    var mic = body.querySelector('.kznt-mic .kz-mic'), mb = body.querySelector('.kzntc-mic');
    if (mic && mb) mb.setAttribute('aria-pressed', mic.getAttribute('aria-pressed') || 'false');
  }
  function dress(body) {
    if (body.__kzntc) { label(body); return; } body.__kzntc = 1; body.classList.add('kzntc');
    var ta = body.querySelector('.kznt-txt'); if (!ta) return;
    var bar = document.createElement('div'); bar.className = 'kzntc-bar';
    bar.innerHTML = '<button type="button" class="kzntc-mic" aria-label="Dictate" aria-pressed="false">' + MIC + '</button><button type="button" class="kzntc-area" aria-label="Area" aria-expanded="false"></button><button type="button" class="kzntc-rem" aria-label="Reminder" aria-expanded="false"></button>';
    ta.parentNode.insertBefore(bar, ta.nextSibling);
    body.addEventListener('change', function () { label(body); }); body.addEventListener('input', function (e) { if (e.target.type === 'time') label(body); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('kzntc-mic')) { var m = body.querySelector('.kznt-mic .kz-mic'); if (m) m.click(); setTimeout(function () { label(body); }, 60); return; }
      if (b.classList.contains('kzntc-area')) { var o = !body.classList.contains('kzntc-oa'); body.classList.toggle('kzntc-oa', o); body.classList.remove('kzntc-or'); b.setAttribute('aria-expanded', String(o)); return; }
      if (b.classList.contains('kzntc-rem')) { var r = !body.classList.contains('kzntc-or'); body.classList.toggle('kzntc-or', r); body.classList.remove('kzntc-oa');
        b.setAttribute('aria-expanded', String(r)); var rp = body.querySelector('.kznrp'); if (r && rp && !/\d:\d\d/.test(rp.textContent)) { var add = rp.querySelector('[data-nrp-add]'); if (add) add.click(); } setTimeout(function () { label(body); }, 60); }
    });
    label(body);
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kznt-sheet .kznt-body'), dress); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzntc-bar')) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class'] });
  soon();
})();
