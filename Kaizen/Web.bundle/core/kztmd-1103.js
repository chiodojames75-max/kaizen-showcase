/* Nov 3 b · James: the dial becomes a ruler you drag left and right. It fills the width, its ticks and numbers grow toward the
   middle, it starts at 0, you slide it to any number of minutes (up to 3 hours), and each minute gives a haptic tick (navigator.vibrate is
   bridged to iPhone haptics). Quick picks, the When-it-ends row and Start work as before.
   Nov 3 · Timer sheet, mockup A "Dial" (James): drag around the ring to set the time (keeps going past 60 for longer timers, up to
   3 hours), quick picks 5 · 10 · 25 · 45 · 60 under it, "When it ends" as one row (tap to switch between Notification + buzz and Buzz
   only), gold-to-orange ring, Start. Uses the sheet's own chips and Custom boxes underneath, so starting works exactly as before. */
(function () {
  if (window.__kztmd1103) return; window.__kztmd1103 = 1;
  var QUICK = { 5: 1, 10: 1, 25: 1, 45: 1, 60: 1 }, R = 92, C = 120, MAX = 180;
  function mins(ps) {
    var on = ps.querySelector('.kztm-chip.on:not(.kztm-cchip)'); if (on) return +on.getAttribute('data-kztm-pm');
    var h = ps.querySelector('[data-kztm-ch]'), m = ps.querySelector('[data-kztm-cm]'); return h && m ? (+h.value || 0) * 60 + (+m.value || 0) : 0;
  }
  function fmt(v) { var h = Math.floor(v / 60), m = v % 60; return h ? h + ':' + (m < 10 ? '0' : '') + m + ':00' : m + ':00'; }
  var PPM = 16;
  function label(v) { var h = Math.floor(v / 60), m = v % 60; return h ? (h + ' h' + (m ? ' ' + m : '')) : String(m); }
  function unit(v) { var h = Math.floor(v / 60), m = v % 60; return h ? (m ? 'min' : '') : (v === 1 ? 'min' : 'min'); }
  function draw(ps, f) {
    var d = ps.querySelector('.kztmd'); if (!d) return; var cv = d.querySelector('canvas'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return; if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    var cx = W / 2, base = H - 34, lo = Math.max(0, Math.floor(f - cx / PPM) - 1), hi = Math.min(MAX, Math.ceil(f + cx / PPM) + 1);
    for (var m = lo; m <= hi; m++) {
      var px = cx + (m - f) * PPM, dd = Math.min(1, Math.abs(px - cx) / cx), k = 1 + 1.3 * Math.pow(1 - dd, 2), big = m % 5 === 0;
      var h = (big ? 22 : 11) * k, a = 0.25 + 0.75 * Math.pow(1 - dd, 1.5);
      x.strokeStyle = m <= f + 1e-6 ? 'rgba(255,138,61,' + a + ')' : 'rgba(255,255,255,' + (a * .55) + ')'; x.lineWidth = big ? 2.4 : 1.6; x.lineCap = 'round';
      x.beginPath(); x.moveTo(px, base); x.lineTo(px, base - h); x.stroke();
      if (big) { x.fillStyle = 'rgba(255,255,255,' + a + ')'; x.font = '600 ' + Math.round(11 * k) + 'px -apple-system, Inter, sans-serif'; x.textAlign = 'center'; x.fillText(label(m), px, base + 16 + 4 * k); }
    }
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#F2CF5B'); g.addColorStop(1, '#FF6A1A');
    x.fillStyle = g; x.beginPath(); if (x.roundRect) x.roundRect(cx - 2, base - 64, 4, 70, 2); else x.rect(cx - 2, base - 64, 4, 70); x.fill();
  }
  function paint(ps, v) {
    var d = ps.querySelector('.kztmd'); if (!d) return; if (!ps.__drag && !ps.__anim) ps.__f = v;
    var t = d.querySelector('.kztmd-n'), u = d.querySelector('.kztmd-u'), lb = label(v), un = v >= 60 && v % 60 === 0 ? '' : 'min';
    if (t.textContent !== lb) t.textContent = lb; if (u.textContent !== un) u.textContent = un;
    d.setAttribute('aria-valuenow', v); d.setAttribute('aria-valuetext', v + ' minutes');
    [].forEach.call(ps.querySelectorAll('.kztm-chip[data-kztm-pm]'), function (c) { c.classList.toggle('kztmd-q', !!QUICK[c.getAttribute('data-kztm-pm')]); });
    draw(ps, ps.__f == null ? v : ps.__f);
  }
  function setV(ps, v) {
    v = Math.max(0, Math.min(MAX, Math.round(v)));
    if (ps.__v !== undefined && v !== ps.__v) { try { navigator.vibrate && navigator.vibrate(1); } catch (e) {} }
    var chip = v ? ps.querySelector('.kztm-chip[data-kztm-pm="' + v + '"]') : null;
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
      var w = document.createElement('div'); w.className = 'kztmd'; w.setAttribute('role', 'slider'); w.tabIndex = 0; w.setAttribute('aria-label', 'Timer length'); w.setAttribute('aria-valuemin', '0'); w.setAttribute('aria-valuemax', String(MAX));
      w.innerHTML = '<div class="kztmd-big"><b class="kztmd-n">0</b><span class="kztmd-u">min</span></div><canvas></canvas><p class="kztmd-s">slide to set</p>';
      var seg = ps.querySelector('.kztm-seg'); ps.insertBefore(w, seg ? seg.nextSibling : ps.firstChild);
      var cv = w.querySelector('canvas'), x0 = 0, f0 = 0, lastX = 0, lastT = 0, vel = 0;
      // starts at zero each time the sheet opens
      ps.__f = 0; setTimeout(function () { setV(ps, 0); }, 0);
      function anim() { if (!ps.__anim) return; vel *= 0.92; var f = Math.max(0, Math.min(MAX, ps.__f + vel)); ps.__f = f; if (f === 0 || f === MAX) vel = 0;
        if (Math.abs(vel) < 0.02) { ps.__anim = false; ps.__f = Math.round(f); setV(ps, ps.__f); var c = ps.querySelector('.kztm-chip[data-kztm-pm="' + ps.__f + '"]'); if (c && !c.classList.contains('on')) setV(ps, ps.__f); return; }
        setV(ps, f); draw(ps, f); requestAnimationFrame(anim); }
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); ps.__drag = true; ps.__anim = false; x0 = lastX = e.clientX; lastT = e.timeStamp; f0 = ps.__f || 0; vel = 0; });
      cv.addEventListener('pointermove', function (e) { if (!ps.__drag) return; e.preventDefault(); var f = Math.max(0, Math.min(MAX, f0 - (e.clientX - x0) / PPM)); var dt = Math.max(1, e.timeStamp - lastT); vel = -(e.clientX - lastX) / PPM * (16 / dt); lastX = e.clientX; lastT = e.timeStamp; ps.__f = f; setV(ps, f); draw(ps, f); });
      function up(e) { if (!ps.__drag) return; ps.__drag = false; if (e && e.timeStamp - lastT > 90) vel = 0; vel = Math.max(-3, Math.min(3, vel)); if (Math.abs(vel) > 0.25) { ps.__anim = true; requestAnimationFrame(anim); } else { ps.__f = Math.round(ps.__f); setV(ps, ps.__f); } }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      w.addEventListener('keydown', function (e) { var v = mins(ps) || 0; if (/Arrow(Right|Up)/.test(e.key)) { e.preventDefault(); ps.__f = v + 1; setV(ps, v + 1); } if (/Arrow(Left|Down)/.test(e.key)) { e.preventDefault(); ps.__f = Math.max(0, v - 1); setV(ps, v - 1); } });
      ps.addEventListener('click', function (e) { var c = e.target.closest('.kztm-chip[data-kztm-pm]'); if (c && c.getAttribute('data-kztm-pm') !== 'c') { ps.__anim = false; vel = 0; ps.__f = +c.getAttribute('data-kztm-pm'); setTimeout(function () { paint(ps, ps.__f); }, 30); } });
      window.addEventListener('resize', function () { draw(ps, ps.__f || 0); });
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
    if (!ps.__drag && !ps.__anim) paint(ps, mins(ps));
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kztm-pick .kztm-ps'), dress); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && (t.closest('.kztmd') || t.closest('.kztmd-al'))) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  soon();
})();
