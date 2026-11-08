
/* Oct 21: app opened fresh (fully closed before) -> "Shockwave": the logo draws, pulses once, a gold outline rushes out past the edges
   while the cover pulls back toward the logo, and the logo sinks into the background.
   Reopened from the background (app still running) -> "Draw behind": the background triangle draws itself behind the cards. No wait. */
(function () { if (window.__kzShock) return; window.__kzShock = 1;
  var RM = false; try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  // Draw behind on every return from the background
  var away = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { away = 1; return; }
    if (!away) return; away = 0;
    if (document.getElementById('kz-splash')) return;
    var h = document.documentElement; h.classList.remove('kz-bd-draw'); void h.offsetWidth; h.classList.add('kz-bd-draw');
  });
  var s = document.getElementById('kz-splash'); if (!s || !s.classList.contains('kz-shock')) return;
  var fade = function () { s.classList.add('out'); setTimeout(function () { if (s.isConnected) s.remove(); }, 550); };
  var sv = s.querySelector('svg'), word = s.querySelector('span'), bg = s.querySelector('.kz-sp-bg'), tri = document.querySelector('#kz-bd .kz-bd-tri');
  if (RM || !sv || !bg || !tri || !Element.prototype.animate) return; // the splash's own timer fades it out
  s.dataset.go = 1;
  var t0 = +s.dataset.t0 || Date.now(), started = 0;
  function run() {
    if (started || !s.isConnected) return; started = 1;
    var a = sv.getBoundingClientRect(), b = tri.getBoundingClientRect(); if (!a.width || !b.width) { fade(); return; }
    var cx = a.left + a.width / 2, cy = a.top + a.height / 2, ES = 'cubic-bezier(.65,0,.15,1)';
    // the copy that grows into the background triangle (same look as the real one underneath)
    var m = document.createElement('div'); m.className = 'kz-sp-morph'; m.innerHTML = tri.innerHTML;
    m.style.left = b.left + 'px'; m.style.top = b.top + 'px'; m.style.width = b.width + 'px'; m.style.height = b.height + 'px';
    var k = a.width / b.width, from = 'translate3d(' + (cx - (b.left + b.width / 2)) + 'px,' + (cy - (b.top + b.height / 2)) + 'px,0) scale(' + k + ')';
    var line = m.querySelector('.kz-bd-line'), glow = m.querySelector('.kz-bd-glow');
    m.style.transform = from; m.style.visibility = 'hidden'; if (line) line.style.opacity = '1'; if (glow) glow.style.opacity = '.45';
    // the shockwave outline
    var ring = document.createElement('div'); ring.className = 'kz-sp-morph';
    ring.style.left = a.left + 'px'; ring.style.top = a.top + 'px'; ring.style.width = a.width + 'px'; ring.style.height = a.height + 'px'; ring.style.opacity = '0';
    ring.innerHTML = '<svg viewBox="56 52 88 78" aria-hidden="true"><path d="M64 122 H136 L100 60 L82 91" fill="none" stroke="url(#kzbdg)" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
    s.appendChild(m); s.appendChild(ring);
    if (word) word.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
    // 1. pulse
    sv.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-in-out' });
    // 2. outline rushes out; the cover pulls back toward the logo
    ring.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(14)' }], { duration: 1000, delay: 200, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    var c0 = 'circle(150% at ' + cx + 'px ' + cy + 'px)', c1 = 'circle(0% at ' + cx + 'px ' + cy + 'px)';
    try { bg.animate([{ clipPath: c0, webkitClipPath: c0 }, { clipPath: c1, webkitClipPath: c1 }], { duration: 900, delay: 250, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }); } catch (e) { bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 250, fill: 'forwards' }); }
    s.style.pointerEvents = 'none';
    // 3. the logo sinks into the background
    setTimeout(function () {
      m.style.visibility = 'visible'; sv.style.visibility = 'hidden';
      m.animate([{ transform: from }, { transform: 'translate3d(0,0,0) scale(1)' }], { duration: 900, easing: ES, fill: 'forwards' });
      if (line) line.animate([{ opacity: 1 }, { opacity: .06 }], { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      if (glow) glow.animate([{ opacity: .45 }, { opacity: .05 }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
    }, 400);
    // 4. the copy lands exactly on the real triangle, then fades so only the real one (behind the cards) remains
    setTimeout(function () { m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'linear', fill: 'forwards' }); }, 1300);
    setTimeout(function () { if (s.isConnected) s.remove(); }, 1680);
  }
  var go = function () { setTimeout(run, Math.max(0, 1300 - (Date.now() - t0))); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  setTimeout(function () { if (!started) go(); }, 3500);
})();
