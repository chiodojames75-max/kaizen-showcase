/* Oct 27 · James: "for the long term goals instead of 0/4 make it the circle that's as big as the check for the daily habits,
   with however many splits in it like a loading bar". Replaces the "0/4" ring on long-term goals (Today: .kzbd-ring from
   kzbd-1025zc; My goals: .kzlt-ring from kzltrow-1027) with a 34px circle, the same size and glass as the daily check, whose
   edge is split into one segment per milestone. Done milestones are gold; when all are done the circle turns gold like a
   checked habit. No number is shown; the count stays in the aria-label. Tapping still opens the goal. Styles: kzseg-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzseg) return; K.__kzseg = 1;
  var C = 17, R = 15.2;
  function pt(a) { var r = (a - 90) * Math.PI / 180; return (C + R * Math.cos(r)).toFixed(2) + ' ' + (C + R * Math.sin(r)).toFixed(2); }
  function arc(a0, a1) { return 'M ' + pt(a0) + ' A ' + R + ' ' + R + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + pt(a1); }
  function svg(n, t) {
    var s = '<svg class="kzseg-s" viewBox="0 0 34 34" aria-hidden="true">';
    if (t <= 1 || t > 30) {
      var L = 2 * Math.PI * R, p = t ? n / t : 0;
      s += '<circle cx="17" cy="17" r="' + R + '" class="kzseg-o"/>';
      if (p > 0) s += '<circle cx="17" cy="17" r="' + R + '" class="kzseg-on" stroke-dasharray="' + (L * p).toFixed(2) + ' ' + L.toFixed(2) + '" transform="rotate(-90 17 17)"/>';
    } else {
      var gap = t > 20 ? 13 : t > 12 ? 15 : t > 6 ? 19 : 25, step = 360 / t;
      for (var i = 0; i < t; i++) { var a0 = i * step + gap / 2, a1 = (i + 1) * step - gap / 2; s += '<path d="' + arc(a0, a1) + '" class="' + (i < n ? 'kzseg-on' : 'kzseg-o') + '"/>'; }
    }
    return s + '<path class="kzseg-tick" d="M11.2 17.4l3.9 3.9 7.7-8.2"/></svg>';
  }
  function count(el) { var m = /(\d+) of (\d+) milestones/.exec(el.getAttribute('aria-label') || ''); if (m) return [+m[1], +m[2]]; var b = el.querySelector('b'); m = b && /(\d+)\s*\/\s*(\d+)/.exec(b.textContent); return m ? [+m[1], +m[2]] : null; }
  function paint() {
    document.querySelectorAll('.kzbd-ring, .kzlt-ring').forEach(function (el) {
      var c = count(el); if (!c) return;
      var sig = c[0] + '/' + c[1] + '|' + (el.__s || '');
      if (el.__kzseg === sig && el.querySelector('.kzseg-s')) return;
      el.__kzseg = sig; el.classList.add('kzseg'); el.classList.toggle('kzseg-done', c[1] > 0 && c[0] >= c[1]);
      el.innerHTML = '<span class="kzseg-g" aria-hidden="true"></span>' + svg(c[0], c[1]);
    });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { paint(); } catch (e) {} }); }
  function boot() {
    paint();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.nodeType === 1 && t.closest && t.closest('.kzseg-s, .kzseg-g')) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
    ['kz:goals', 'kz:changed', 'kz:sync'].forEach(function (ev) { document.addEventListener(ev, soon); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
