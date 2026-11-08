/* Oct 27 · Long-term goal roadmap (James: "allow expansion of long-term goals to lay out the road map and check one off in
   the expansion"). Tap a long-term goal on Today / My goals: it unfolds (clipped height, 0.32 s, no springs) into a
   timeline of its milestones (g.ms from kzbd-1025zc). Each milestone has the glass check; tapping it calls K.bd.toggle
   (same as the goal page), the timeline repaints in place and the row's own heading/ring update through kzbd's events.
   Tap the goal again to fold. Goals without milestones show "No roadmap yet" and a pill to the goal page to set one.
   Taps are taken at window capture, so the old fold-to-title and the tap-opens-goal-page behaviours don't also run.
   Styles: kzroad-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzroad) return; K.__kzroad = 1;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var openId = null, DUR = 320, EASE = 'cubic-bezier(.25,.1,.25,1)';
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>';
  function goal(id) { return (K.get('goals', []) || []).filter(function (g) { return g.id === id; })[0]; }
  function dt(s) { var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s || ''); if (!m) return null; return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : new Date(+m[1], +m[2], 0).getDate()); }
  function fmt(d, wk) { return d.toLocaleDateString('en-US', wk ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' }); }
  function today() { var t = K.today ? K.today() : new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function isLong(row) { var g = goal(row.getAttribute('data-goal')); return g && g.kind !== 'daily' && g.kind !== 'quit'; }

  function html(g) {
    var ms = g.ms || [], done = ms.filter(function (m) { return m.d; }).length, t0 = today();
    if (!ms.length) return '<div class="kzrd-empty"><b>No roadmap yet</b><span>Give it a finish date and Kaizen lays out the milestones.</span></div>' +
      '<a class="kzrd-pill gold" href="/pages/goal?id=' + encodeURIComponent(g.id) + '">Set a finish date</a>';
    var nextI = -1; for (var i = 0; i < ms.length; i++) if (!ms[i].d) { nextI = i; break; }
    var by = dt(g.by) || dt(ms[ms.length - 1].by);
    var h = '<div class="kzrd-head"><b>Roadmap</b><span>' + done + ' of ' + ms.length + (by ? ' · finish ' + esc(fmt(by)) : '') + '</span></div>' +
      '<i class="kzrd-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + ms.length + '" aria-valuenow="' + done + '"><i style="width:' + Math.round(done / ms.length * 100) + '%"></i></i><ol class="kzrd-list">';
    ms.forEach(function (m, i) {
      var due = dt(m.by), sub, cls = m.d ? 'done' : i === nextI ? 'next' : '';
      if (m.d) { var dd = dt(m.d); sub = 'Done' + (dd ? ' ' + fmt(dd) : ''); }
      else if (due) {
        var left = Math.round((due - t0) / 864e5);
        sub = left < 0 ? 'Overdue · was due ' + fmt(due) : left === 0 ? 'Due today' : left === 1 ? 'Due tomorrow' : 'Due ' + fmt(due, true) + ' · ' + left + ' days';
        if (left < 0) cls += ' late'; else if (left === 0) cls += ' today';
      } else sub = 'No date';
      h += '<li class="kzrd-m ' + cls + '"><button type="button" class="kzrd-ck" data-rd-ck="' + esc(m.id) + '" aria-pressed="' + (m.d ? 'true' : 'false') + '" aria-label="' + (m.d ? 'Undo: ' : 'Check off: ') + esc(m.t) + '">' + TICK + '</button>' +
        '<span class="kzrd-t"><b>' + esc(m.t) + '</b><em>' + esc(sub) + '</em></span></li>';
    });
    h += '</ol>' + (done === ms.length ? '<p class="kzrd-won">★ Every milestone done</p>' : '') +
      '<a class="kzrd-pill" href="/pages/goal?id=' + encodeURIComponent(g.id) + '">View goal →</a>';
    return h;
  }
  function panelFor(row) { return row.querySelector(':scope > .kzrd'); }
  function build(row) {
    var g = goal(row.getAttribute('data-goal')); if (!g) return null;
    var p = document.createElement('div'); p.className = 'kzrd'; p.setAttribute('role', 'region'); p.setAttribute('aria-label', 'Roadmap for ' + g.name);
    p.innerHTML = html(g); row.appendChild(p); row.classList.add('kzrd-open'); return p;
  }
  function unfold(p) { if (calm || !p.animate) return; var h = p.offsetHeight; p.style.overflow = 'hidden'; var a = p.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: DUR, easing: EASE }); a.onfinish = a.oncancel = function () { p.style.overflow = ''; }; }
  function fold(row, p) {
    row.classList.remove('kzrd-open');
    if (calm || !p.animate) { p.remove(); return; }
    var h = p.offsetHeight; p.style.overflow = 'hidden';
    var a = p.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: Math.round(DUR * .85), easing: EASE, fill: 'forwards' });
    a.onfinish = function () { p.remove(); };
  }
  function closeAll(except) { [].forEach.call(document.querySelectorAll('.kz-grow.kzrd-open'), function (r) { if (r !== except) { var p = panelFor(r); if (p) fold(r, p); else r.classList.remove('kzrd-open'); } }); }

  addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    // a milestone check inside the roadmap
    var ck = t.closest('.kzrd [data-rd-ck]');
    if (ck) {
      e.stopImmediatePropagation(); e.preventDefault();
      var row = ck.closest('.kz-grow'), gid = row && row.getAttribute('data-goal'); if (!gid || !K.bd) return;
      ck.classList.add('pop');
      K.bd.toggle(gid, ck.getAttribute('data-rd-ck'));
      setTimeout(function () { var r = document.querySelector('.kz-grow[data-goal="' + gid + '"].kzrd-open') || row, p = r && panelFor(r), g = goal(gid); if (p && g) p.innerHTML = html(g); }, 0);
      try { K.track('kz_ms_check', { via: 'roadmap' }); } catch (er) {}
      return;
    }
    if (t.closest('.kzrd')) { if (!t.closest('a')) e.stopImmediatePropagation(); return; }   // taps inside the panel never fold it
    var row2 = t.closest('.kz-grow'); if (!row2 || row2.closest('[data-no-expand]')) return;
    if (t.closest('button, a, input, textarea, .kz-gswipe, .kz-editbox, .kz-delbox') || row2.classList.contains('kz-swopen') || row2.classList.contains('kzr-open')) return;
    if (!isLong(row2)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    var id = row2.getAttribute('data-goal'), p0 = panelFor(row2);
    if (p0) { openId = null; fold(row2, p0); return; }
    closeAll(row2); openId = id;
    var p = build(row2); if (p) unfold(p);
    post({ type: 'tick' });
  }, true);

  // rows are re-rendered when data changes: keep the open roadmap open (no animation)
  new MutationObserver(function () {
    if (!openId) return;
    var r = document.querySelector('.kz-grow[data-goal="' + openId + '"]:not([data-no-expand])');
    if (r && !panelFor(r) && r.isConnected) build(r);
  }).observe(document.body, { childList: true, subtree: true });
})();
