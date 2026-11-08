
/* Oct 21: backdrop parallax + launch morph (loading triangle grows into the backdrop, gold dust scatters off it) */
(function () { if (window.__kzBd) return; window.__kzBd = 1;
  var RM = false; try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var tri = document.querySelector('#kz-bd .kz-bd-tri');
  if (tri && /growth/.test(location.pathname)) tri.style.opacity = '.4'; /* Growth's chart is a triangle too: keep the backdrop quieter there */
  var DRIFT = 0.14, MAXD = 90, lastY = -1, q = 0;
  var place = function () { q = 0; if (!tri) return; var y = Math.min(MAXD, Math.max(0, window.scrollY || 0) * DRIFT); if (y === lastY) return; lastY = y;
    tri.style.transform = 'translate3d(-50%, calc(-50% - ' + y.toFixed(1) + 'px), 0)'; };
  if (tri && !RM) { window.addEventListener('scroll', function () { if (!q) q = requestAnimationFrame(place); }, { passive: true }); place(); }

  /* gold dust along the triangle's lines; half drift outward, half fall inward */
  function dust(cv, rect) {
    var dpr = Math.min(3, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    var x = cv.getContext('2d'); if (!x) return; x.scale(dpr, dpr);
    var sx = rect.width / 88, sy = rect.height / 78, ox = rect.left - 56 * sx, oy = rect.top - 52 * sy, cx = 100, cy = 101;
    var seg = [[64, 122, 136, 122], [136, 122, 100, 60], [100, 60, 82, 91]], len = [72, 71.7, 35.8], tot = 179.5, P = [];
    for (var i = 0; i < 170; i++) { var r = Math.random() * tot, k = 0; while (k < 2 && r > len[k]) { r -= len[k]; k++; } var s = seg[k], f = Math.min(1, r / len[k]);
      var px = s[0] + (s[2] - s[0]) * f, py = s[1] + (s[3] - s[1]) * f, dx = px - cx, dy = py - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, dir = Math.random() < .55 ? 1 : -.7, sp = 18 + Math.random() * 70;
      P.push({ x: ox + px * sx, y: oy + py * sy, vx: dx / d * sp * dir + (Math.random() - .5) * 24, vy: dy / d * sp * dir + (Math.random() - .5) * 24 - 10, life: 700 + Math.random() * 600, r: .5 + Math.random() * 1.5, c: px < 100 ? '184,144,46' : '233,197,90' }); }
    var t0 = performance.now(), last = t0;
    (function frame(now) { var dt = Math.min(40, now - last) / 1000; last = now; x.clearRect(0, 0, W, H); var alive = 0;
      for (var j = 0; j < P.length; j++) { var p = P[j], age = now - t0; if (age > p.life) continue; alive++; p.vx *= .985; p.vy *= .985; p.x += p.vx * dt; p.y += p.vy * dt;
        var a = 1 - age / p.life; x.globalAlpha = a * a * .9; x.fillStyle = 'rgb(' + p.c + ')'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.2832); x.fill(); }
      if (alive && cv.isConnected) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H); })(t0);
  }

  window.__kzBdMorph = function (s, opt) { opt = opt || {};
    var end = function () { if (s.isConnected) s.remove(); };
    var sv = s.querySelector('svg'), word = s.querySelector('span'), bg = s.querySelector('.kz-sp-bg');
    if (RM || !sv || !tri || !bg || !Element.prototype.animate) { s.classList.add('out'); setTimeout(end, 550); return; }
    place(); var a = sv.getBoundingClientRect(), b = tri.getBoundingClientRect(); if (!a.width || !b.width) { s.classList.add('out'); setTimeout(end, 550); return; }
    var m = document.createElement('div'); m.className = 'kz-sp-morph'; m.innerHTML = tri.innerHTML;
    var rr = m.querySelector('.kz-bd-runs'); if (rr) rr.remove();
    m.style.left = b.left + 'px'; m.style.top = b.top + 'px'; m.style.width = b.width + 'px'; m.style.height = b.height + 'px';
    var k = a.width / b.width, dx = (a.left + a.width / 2) - (b.left + b.width / 2), dy = (a.top + a.height / 2) - (b.top + b.height / 2);
    var from = 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + k + ')', to = 'translate3d(0,0,0) scale(1)';
    var line = m.querySelector('.kz-bd-line'), glow = m.querySelector('.kz-bd-glow');
    m.style.transform = from; line.style.opacity = '1'; glow.style.opacity = '.45';
    s.appendChild(m); sv.style.visibility = 'hidden';
    var EASE = 'cubic-bezier(.65,0,.15,1)', T = 950, R = 520;
    m.animate([{ transform: from }, { transform: to }], { duration: T, easing: EASE, fill: 'forwards' });
    line.animate([{ opacity: 1 }, { opacity: .06 }], { duration: T, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    glow.animate([{ opacity: .45 }, { opacity: .05 }], { duration: T, easing: 'ease-out', fill: 'forwards' });
    if (word) word.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    var cv = document.createElement('canvas'); cv.className = 'kz-sp-dust'; s.appendChild(cv);
    if (!opt.noDust) setTimeout(function () { try { dust(cv, b); } catch (e) {} }, T * .62);
    setTimeout(function () {
      /* the backdrop triangle is already in the same spot underneath: fade the cover and the copy together so nothing pops */
      bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: R, easing: 'linear', fill: 'forwards' });
      m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: R, easing: 'linear', fill: 'forwards' });
      cv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: R + 250, easing: 'ease-in', fill: 'forwards' });
      s.style.pointerEvents = 'none';
      setTimeout(end, R + 280);
    }, T);
  };
})();
