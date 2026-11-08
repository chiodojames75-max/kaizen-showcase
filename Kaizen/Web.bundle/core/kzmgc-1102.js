/* Nov 2 · My goals, mockup C "Each climb as a bar" (James): each habit is one line, "Day N of 66 · X ft" under it and a thin bar
   in its area's colour showing how far up its mountain it is. The 7-day dots and the stage pill are hidden; tapping the row
   still opens its details, and the handle, timer, ••• and check stay. Long-term goals keep their own milestone bar. */
(function () {
  var K = window.KZ; if (!K || K.__kzmgc1102) return; K.__kzmgc1102 = 1;
  function run() {
    q = 0; if (!K.mtn) return;
    [].forEach.call(document.querySelectorAll('.kz-goal[data-goal]:not(.kzbd-row):not(.kzlt)'), function (row) {
      var o = null; try { o = K.mtn(row.getAttribute('data-goal')); } catch (e) {} if (!o || o.kind !== 'climb') return;
      var body = row.querySelector(':scope > .kz-gbody'); if (!body) return; row.classList.add('kzmgc');
      var sub = o.mountain > 1 ? 'Mountain ' + o.mountain + ' of 7 · day ' + o.within + ' · ' + o.totalFt : o.atTop ? 'At the top · ' + o.ft : 'Day ' + (o.within || 0) + ' of 66 · ' + o.ft;
      var pct = Math.max(o.within ? 3 : 0, Math.round(Math.min(1, o.frac || 0) * 100));
      var s = body.querySelector(':scope > .kzmgc-sub'); if (!s) { s = document.createElement('span'); s.className = 'kzmgc-sub'; var nm = body.querySelector('.kz-gname'); body.insertBefore(s, nm ? nm.nextSibling : body.firstChild); }
      if (s.textContent !== sub) s.textContent = sub;
      var b = body.querySelector(':scope > .kzmgc-bar'); if (!b) { b = document.createElement('i'); b.className = 'kzmgc-bar'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = '<i></i>'; s.parentNode.insertBefore(b, s.nextSibling); }
      var w = pct + '%'; if (b.firstChild.style.width !== w) b.firstChild.style.width = w;
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && (t.closest('.kzmgc-sub') || t.closest('.kzmgc-bar'))) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
  document.addEventListener('kz:changed', soon); soon();
})();
