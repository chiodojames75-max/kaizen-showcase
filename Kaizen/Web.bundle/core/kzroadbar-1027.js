/* Oct 27 · James: "the bar that shows how far complete the roadmap is should always be there". Every long-term goal row
   with milestones (kzbd) gets a thin gold bar under its due line = milestones done / total, kept in step on every redraw. */
(function () {
  var K = window.KZ; if (!K || K.__kzroadbar) return; K.__kzroadbar = 1;
  function goal(id) { return (K.get('goals', []) || []).filter(function (g) { return g.id === id; })[0]; }
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kz-grow[data-goal]'), function (r) {
      var g = goal(r.getAttribute('data-goal')), ms = g && g.kind !== 'daily' && g.ms && g.ms.length ? g.ms : null;
      var body = r.querySelector('.kz-gbody'), bar = r.querySelector('.kzrd-mini');
      if (!ms || !body) { if (bar) bar.remove(); return; }
      var done = ms.filter(function (m) { return m.d; }).length, w = Math.max(done ? 4 : 2, Math.round(done / ms.length * 100)) + '%';
      if (!bar) { bar = document.createElement('i'); bar.className = 'kzrd-mini'; bar.setAttribute('role', 'progressbar'); bar.innerHTML = '<i></i>'; body.appendChild(bar); }
      bar.setAttribute('aria-label', done + ' of ' + ms.length + ' milestones'); bar.setAttribute('aria-valuenow', String(done)); bar.setAttribute('aria-valuemax', String(ms.length));
      if (bar.firstChild.style.width !== w) bar.firstChild.style.width = w;
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzrd-mini')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  ['kz:goals', 'kz:changed', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
  soon();
})();
