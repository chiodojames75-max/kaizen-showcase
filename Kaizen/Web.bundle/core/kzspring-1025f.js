/* Oct 25 f · Springs everywhere (James: "make pressing buttons and scrolling and jumping around as smooth as possible").
   iOS motion is damped harmonic motion (m·x'' = −k·x − c·x'), not fixed timers. This file samples three springs, tuned
   like SwiftUI's presets, into CSS linear() curves on :root (--kz-spr-smooth / --kz-spr-snappy / --kz-spr-bouncy, with
   matching durations), which kzspring-1025f.css applies to the app's existing sheets, rows, presses, toggles and the
   undo bar. CSS transitions already restart from wherever the element is when interrupted, so nothing jumps.
   Also exposes K.springCurve(name) for scripts. If linear() isn't supported, the original curves stay. */
(function () {
  var de = document.documentElement; if (de.__kzspr) return; de.__kzspr = 1;
  var P = { smooth: [0.42, 1, 520], snappy: [0.32, 0.86, 420], bouncy: [0.45, 0.68, 640] }; // response s, damping ratio, sample length ms
  function curve(p) {
    var r = p[0], z = p[1], ms = p[2], k = Math.pow(2 * Math.PI / r, 2), c = 4 * Math.PI * z / r, x = 0, v = 0, n = 40, dt = ms / 1000 / n / 8, out = [];
    for (var i = 0; i <= n; i++) { out.push(+x.toFixed(4)); for (var j = 0; j < 8; j++) { var a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; } }
    out[n] = 1; return 'linear(' + out.join(', ') + ')';
  }
  var ok = false; try { ok = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')); } catch (e) {}
  var C = {};
  Object.keys(P).forEach(function (n) { C[n] = curve(P[n]); if (ok) { de.style.setProperty('--kz-spr-' + n, C[n]); de.style.setProperty('--kz-spr-' + n + '-d', P[n][2] + 'ms'); } });
  if (ok) de.classList.add('kz-spr');
  if (window.KZ) window.KZ.springCurve = function (n) { return C[n] || C.smooth; };
})();
