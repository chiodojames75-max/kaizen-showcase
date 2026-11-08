/* Oct 27 · kztoday-1027 (all pages). James:
   1. "Lock in my plan should be fixed below Repeat every day": in Plan today the gold button was sticky to the bottom and sat on
      top of the Repeat row. It now comes right after the Repeat row (moved in the page), in the normal flow.
   2. "This, the zoom on the Today tab, should be replaced by the second picture's view": tapping your plan on Today opens
      Plan today (the editor: tasks, ×, Repeat, Lock in my plan) instead of the "Last night's plan" view.
      After you lock it in, the view still closes straight back to Today (kzplanfix-1027).
   3. "Line all these up": the long-term milestone circle (kzseg) is moved sideways so its centre is exactly under the
      daily checks' centres in the same list. Styles: kztoday-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kztoday) return; K.__kztoday = 1;   // 1027b replaces kztoday-1027
  function wrap() {
    if (K.openPlanView && !K.openPlanView.__kzt && K.openPlanner) {
      var f = function (day) { try { return K.openPlanner(day); } catch (e) {} };
      f.__kzt = 1; f.__orig = K.openPlanView; K.openPlanView = f;
    }
  }
  function lockBelow() {
    [].forEach.call(document.querySelectorAll('.kz-pm-in'), function (box) {
      var b = box.querySelector('[data-t="pm-save"]'), rep = box.querySelector('.kz-pm-rep');
      if (!b || !rep || rep.parentNode !== box || b.parentNode !== box) return;
      if (rep.nextElementSibling !== b) box.insertBefore(b, rep.nextSibling);
      b.classList.add('kzt-lock');
    });
  }
  function align() {
    var ref = [].filter.call(document.querySelectorAll('button.kz-check'), function (x) { return x.offsetParent; })[0]; if (!ref) return;
    var rr = ref.getBoundingClientRect(), cx = rr.left + rr.width / 2;
    [].forEach.call(document.querySelectorAll('.kzseg'), function (s) {
      if (!s.offsetParent) return;
      var cur = parseFloat(s.style.getPropertyValue('--kzt-dx')) || 0, g = s.querySelector('.kzseg-g') || s, r = g.getBoundingClientRect();
      var dx = Math.round((cur + cx - (r.left + r.width / 2)) * 2) / 2;
      if (Math.abs(dx) > 24) return;   // a different column (another layout): leave it
      if (dx !== cur) s.style.setProperty('--kzt-dx', dx + 'px');
    });
  }
  var at = 0; function run() { q = 0; wrap(); lockBelow(); clearTimeout(at); at = setTimeout(align, 160); }   // 1027b: align measures positions (forces layout), so it runs once the page has been still for 160 ms, not on every frame of a check-off glide
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i]; if (t.type === 'attributes' && t.attributeName === 'style') continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', soon);
  soon(); setTimeout(soon, 400); setTimeout(soon, 1500);
})();
