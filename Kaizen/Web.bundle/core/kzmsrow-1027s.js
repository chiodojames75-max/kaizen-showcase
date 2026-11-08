/* Oct 27 s · Long-term goals with milestones, on Today (James): the row's heading is what you have to get done next (the
   next open milestone, e.g. "App done with final-looking product"), and the line under it says when it's due
   ("Due Fri, Nov 14 · 22 days left"; "Due tomorrow"; "Due today"; "Overdue · was due Oct 20"). The goal's own name stays in
   the row for screen readers and on the goal page; when every milestone is done the heading goes back to the goal's name.
   Works on top of kzbd-1025zc (which marks these rows .kzbd-row and keeps the progress ring); nothing is stored. */
(function () {
  var K = window.KZ; if (!K || K.__kzmsrow) return; K.__kzmsrow = 1;
  function day(s) { s = String(s || ''); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T12:00:00'); if (/^\d{4}-\d{2}$/.test(s)) { var p = s.split('-'); return new Date(+p[0], +p[1], 0, 12); } return null; }
  function goal(id) { try { return (K.goals() || []).filter(function (g) { return g.id === id; })[0] || null; } catch (e) { return null; } }
  function due(d) {
    var t = K.today ? new Date(K.today()) : new Date(); t.setHours(12, 0, 0, 0);
    var n = Math.round((d - t) / 864e5), when = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), md = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (n < 0) return { t: 'Overdue · was due ' + md, c: 'late' };
    if (n === 0) return { t: 'Due today', c: 'soon' };
    if (n === 1) return { t: 'Due tomorrow · ' + when, c: 'soon' };
    return { t: 'Due ' + when + ' · ' + n + ' days left', c: n <= 3 ? 'soon' : '' };
  }
  function paint() {
    document.querySelectorAll('#kz-today-s1 .kz-goal.kzbd-row[data-goal]').forEach(function (row) {
      var g = goal(row.getAttribute('data-goal')), body = row.querySelector('.kz-gbody'), nm = row.querySelector('.kz-gname'); if (!g || !body || !nm) return;
      var ms = Array.isArray(g.ms) ? g.ms : [], next = ms.filter(function (m) { return m && !m.d && String(m.t || '').trim(); })[0];
      var head = next ? String(next.t).trim() : g.name, dd = next ? day(next.by) || day(g.by) : null, line = next ? (dd ? due(dd) : { t: 'No due date', c: '' }) : { t: '★ Every milestone done', c: 'done' };
      var t = body.querySelector('.kzms-t'), l = body.querySelector('.kzms-d');
      if (!t) { t = document.createElement('span'); t.className = 'kzms-t'; nm.parentNode.insertBefore(t, nm.nextSibling); }
      if (!l) { l = document.createElement('span'); l.className = 'kzms-d'; t.parentNode.insertBefore(l, t.nextSibling); }
      if (t.textContent !== head) t.textContent = head;
      if (l.textContent !== line.t) l.textContent = line.t;
      var cls = 'kzms-d' + (line.c ? ' ' + line.c : ''); if (l.className !== cls) l.className = cls;
      if (!row.hasAttribute('data-kzms')) row.setAttribute('data-kzms', '');
      var al = head + ', ' + line.t + (next ? '. Goal: ' + g.name : '') + '. Tap to show more.'; if (body.getAttribute('aria-label') !== al) body.setAttribute('aria-label', al);
    });
    // a row that stopped being broken down loses the extra lines
    document.querySelectorAll('#kz-today-s1 .kz-goal[data-kzms]:not(.kzbd-row)').forEach(function (row) { row.removeAttribute('data-kzms'); row.querySelectorAll('.kzms-t, .kzms-d').forEach(function (x) { x.remove(); }); });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { paint(); } catch (e) {} }); }
  function boot() {
    paint();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.nodeType === 1 && t.closest && t.closest('.kzms-t, .kzms-d')) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    ['kz:goals', 'kz:changed', 'kz:sync'].forEach(function (ev) { document.addEventListener(ev, soon); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
