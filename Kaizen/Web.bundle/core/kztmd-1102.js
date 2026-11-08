/* Nov 3 · Timer sheet, mockup A "Dial" (James): drag around the ring to set the time (keeps going past 60 for longer timers, up to
   3 hours), quick picks 5 · 10 · 25 · 45 · 60 under it, "When it ends" as one row (tap to switch between Notification + buzz and Buzz
   only), gold-to-orange ring, Start. Uses the sheet's own chips and Custom boxes underneath, so starting works exactly as before. */
(function () {
  if (window.__kztmd1102) return; window.__kztmd1102 = 1;
  var QUICK = { 5: 1, 10: 1, 25: 1, 45: 1, 60: 1 }, R = 92, C = 120, MAX = 180;
  function mins(ps) {
    var on = ps.querySelector('.kztm-chip.on:not(.kztm-cchip)'); if (on) return +on.getAttribute('data-kztm-pm');
    var h = ps.querySelector('[data-kztm-ch]'), m = ps.querySelector('[data-kztm-cm]'); return h && m ? (+h.value || 0) * 60 + (+m.value || 0) : 0;
  }
  function fmt(v) { var h = Math.floor(v / 60), m = v % 60; return h ? h + ':' + (m < 10 ? '0' : '') + m + ':00' : m + ':00'; }
  function arc(v) {
    var f = Math.min(v, 60) / 60, a = f * 2 * Math.PI - 1e-4, x = C + R * Math.sin(a), y = C - R * Math.cos(a);
    return { d: v <= 0 ? '' : 'M' + C + ' ' + (C - R) + ' A' + R + ' ' + R + ' 0 ' + (f > .5 ? 1 : 0) + ' 1 ' + x.toFixed(1) + ' ' + y.toFixed(1), x: x, y: y };
  }
  function paint(ps, v) {
    var d = ps.querySelector('.kztmd'); if (!d) return; var a = arc(v);
    d.querySelector('.kztmd-a').setAttribute('d', a.d); d.querySelector('.kztmd-a2').setAttribute('opacity', v > 60 ? '1' : '0');
    var k = d.querySelector('.kztmd-k'); k.setAttribute('cx', a.x.toFixed(1)); k.setAttribute('cy', a.y.toFixed(1));
    d.querySelector('.kztmd-t').textContent = fmt(v); d.querySelector('svg').setAttribute('aria-valuenow', v); d.querySelector('svg').setAttribute('aria-valuetext', v + ' minutes');
    [].forEach.call(ps.querySelectorAll('.kztm-chip[data-kztm-pm]'), function (c) { c.classList.toggle('kztmd-q', !!QUICK[c.getAttribute('data-kztm-pm')]); });
  }
  function setV(ps, v) {
    v = Math.max(1, Math.min(MAX, Math.round(v)));
    var chip = ps.querySelector('.kztm-chip[data-kztm-pm="' + v + '"]');
    if (chip && !ps.__drag) { if (!chip.classList.contains('on')) chip.click(); }
    else {
      if (!ps.querySelector('[data-kztm-cm]')) { var cc = ps.querySelector('.kztm-cchip'); if (cc) cc.click(); }
      var h = ps.querySelector('[data-kztm-ch]'), m = ps.querySelector('[data-kztm-cm]');
      if (h && m) { h.value = Math.floor(v / 60); m.value = v % 60; m.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    ps.__v = v; paint(ps, v);
  }
  function dress(ps) {
    var timer = ps.querySelector('[data-kztm-mode="timer"].on'); ps.classList.toggle('kztmd-on', !!timer);
    if (!timer) return;
    if (!ps.querySelector('.kztmd')) {
      var w = document.createElement('div'); w.className = 'kztmd';
      w.innerHTML = '<svg viewBox="0 0 240 240" role="slider" tabindex="0" aria-label="Timer length" aria-valuemin="1" aria-valuemax="' + MAX + '"><defs><linearGradient id="kztmd-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2CF5B"/><stop offset="1" stop-color="#FF6A1A"/></linearGradient></defs>' +
        '<circle cx="' + C + '" cy="' + C + '" r="' + R + '" fill="none" stroke="#2E2E33" stroke-width="16"/>' +
        Array.apply(null, Array(12)).map(function (_, i) { var a = i / 12 * 2 * Math.PI; return '<line x1="' + (C + (R - 22) * Math.sin(a)).toFixed(1) + '" y1="' + (C - (R - 22) * Math.cos(a)).toFixed(1) + '" x2="' + (C + (R - 28) * Math.sin(a)).toFixed(1) + '" y2="' + (C - (R - 28) * Math.cos(a)).toFixed(1) + '" stroke="#3A3A3E" stroke-width="2" stroke-linecap="round"/>'; }).join('') +
        '<circle class="kztmd-a2" cx="' + C + '" cy="' + C + '" r="' + R + '" fill="none" stroke="url(#kztmd-g)" stroke-width="16" opacity="0"/>' +
        '<path class="kztmd-a" fill="none" stroke="url(#kztmd-g)" stroke-width="16" stroke-linecap="round"/><circle class="kztmd-k" r="14" fill="#fff"/>' +
        '<text class="kztmd-t" x="' + C + '" y="' + (C + 12) + '" text-anchor="middle"></text><text class="kztmd-s" x="' + C + '" y="' + (C + 38) + '" text-anchor="middle">drag around to set</text></svg>';
      var seg = ps.querySelector('.kztm-seg'); ps.insertBefore(w, seg ? seg.nextSibling : ps.firstChild);
      var svg = w.querySelector('svg'), last = null, turns = 0;
      function ang(e) { var r = svg.getBoundingClientRect(), p = e.touches ? e.touches[0] : e, x = p.clientX - (r.left + r.width / 2), y = p.clientY - (r.top + r.height / 2); var a = Math.atan2(x, -y); return a < 0 ? a + 2 * Math.PI : a; }
      function mv(e) { if (!ps.__drag) return; e.preventDefault(); var a = ang(e) / (2 * Math.PI) * 60;
        if (last !== null) { if (last > 45 && a < 15) turns++; else if (last < 15 && a > 45) turns = Math.max(0, turns - 1); } last = a; setV(ps, turns * 60 + a); }
      function up() { if (!ps.__drag) return; ps.__drag = false; var v = ps.__v; if (v && ps.querySelector('.kztm-chip[data-kztm-pm="' + v + '"]')) setV(ps, v); }
      function down(e) { ps.__drag = true; var v = mins(ps) || 0; turns = Math.floor(v / 60); last = v % 60; mv(e); }
      svg.addEventListener('pointerdown', function (e) { svg.setPointerCapture && svg.setPointerCapture(e.pointerId); down(e); });
      svg.addEventListener('pointermove', mv); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
      svg.addEventListener('keydown', function (e) { var v = mins(ps) || 0; if (/Arrow(Right|Up)/.test(e.key)) { e.preventDefault(); setV(ps, v + 1); } if (/Arrow(Left|Down)/.test(e.key)) { e.preventDefault(); setV(ps, v - 1); } });
    }
    // "When it ends" as one row
    var al = ps.querySelector('.kztm-alert');
    if (al && !ps.querySelector('.kztmd-al')) {
      var row = document.createElement('button'); row.type = 'button'; row.className = 'kztmd-al';
      row.addEventListener('click', function () { var off = ps.querySelector('.kztm-alert button:not(.on)'); if (off) off.click(); setTimeout(function () { dress(ps); }, 30); });
      al.parentNode.insertBefore(row, al);
    }
    var rowE = ps.querySelector('.kztmd-al'), onA = ps.querySelector('.kztm-alert button.on');
    if (rowE && al && rowE.nextElementSibling !== al) al.parentNode.insertBefore(rowE, al);
    if (rowE) { var h = '<span>When it ends</span><em>' + (onA ? onA.textContent : '') + '</em>'; if (rowE.__h !== h) { rowE.innerHTML = h; rowE.__h = h; } }
    if (!ps.__drag) paint(ps, mins(ps));
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kztm-pick .kztm-ps'), dress); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && (t.closest('.kztmd') || t.closest('.kztmd-al'))) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  soon();
})();
