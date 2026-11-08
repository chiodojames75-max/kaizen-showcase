/* Oct 27 · James: "why was it showing up as daily when it's a long-term goal with dates and deadlines, and you couldn't
   check it off daily". On My goals the milestone treatment (kzbd + kzmsrow) only ran on Today, so a broken-down goal fell
   back to the daily-step look with a daily check. Here every long-term goal with milestones gets: its name, then
   "Next: <milestone> · Due <date> · N days left" (gold today, red overdue), and the milestones ring (done/total, gold) in
   place of the daily check; the ring opens the goal. Tapping the row opens the roadmap (kzroad-1027). Styles: kzltrow-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzltrow) return; K.__kzltrow = 1;
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function goal(id) { return (K.get('goals', []) || []).filter(function (g) { return g.id === id; })[0]; }
  function dt(s) { var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s || ''); if (!m) return null; return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : new Date(+m[1], +m[2], 0).getDate()); }
  function today() { var t = K.today ? K.today() : new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function ring(a, b) { var p = b ? a / b : 0, R = 16, L = 2 * Math.PI * R; return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="' + R + '" class="t"/><circle cx="20" cy="20" r="' + R + '" class="f" stroke-dasharray="' + (L * p).toFixed(1) + ' ' + L.toFixed(1) + '" transform="rotate(-90 20 20)"/></svg>'; }
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kz-grow[data-goal]:not(.kzbd-row)'), function (r) {
      var g = goal(r.getAttribute('data-goal')), ms = g && g.kind !== 'daily' && g.kind !== 'quit' && g.ms && g.ms.length ? g.ms : null;
      var body = r.querySelector('.kz-gbody'); if (!body) return;
      var line = body.querySelector('.kzlt-d'), rg = r.querySelector('.kzlt-ring');
      if (!ms) { r.classList.remove('kzlt'); if (line) line.remove(); if (rg) rg.remove(); return; }
      var done = ms.filter(function (m) { return m.d; }).length, nx = ms.filter(function (m) { return !m.d; })[0], txt, cls = '';
      if (!nx) txt = '★ Every milestone done';
      else { var due = dt(nx.by) || dt(g.by), left = due ? Math.round((due - today()) / 864e5) : null;
        txt = 'Next: ' + nx.t + (due ? ' · ' + (left < 0 ? 'Overdue' : left === 0 ? 'Due today' : 'Due ' + due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + left + (left === 1 ? ' day' : ' days') + ' left') : '');
        cls = left != null && left < 0 ? ' late' : left === 0 ? ' today' : ''; }
      var sig = done + '/' + ms.length + '|' + txt;
      r.classList.add('kzlt');
      if (!line) { line = document.createElement('span'); line.className = 'kzlt-d'; var nm = body.querySelector('.kz-gname'); (nm && nm.nextSibling) ? body.insertBefore(line, nm.nextSibling) : body.appendChild(line); }
      if (line.__s !== sig) { line.__s = sig; line.className = 'kzlt-d' + cls; line.textContent = txt; }
      if (!rg) { rg = document.createElement('a'); rg.className = 'kzlt-ring'; var ck = r.querySelector('.kz-check'); (ck && ck.parentNode) ? ck.parentNode.insertBefore(rg, ck) : r.appendChild(rg); }
      if (rg.__s !== sig) { rg.__s = sig; rg.href = '/pages/goal?id=' + encodeURIComponent(g.id); rg.setAttribute('aria-label', done + ' of ' + ms.length + ' milestones. Open ' + g.name); rg.innerHTML = ring(done, ms.length) + '<b>' + done + '/' + ms.length + '</b>'; }
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzlt-d, .kzlt-ring')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  ['kz:goals', 'kz:changed'].forEach(function (n) { document.addEventListener(n, soon); });
  soon();
})();
