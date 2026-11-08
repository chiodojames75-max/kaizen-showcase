/* Nov 2 b · James: only the bar stays (no "Today's climb", no N of M, no feet); the count and feet stay in its spoken label.
   Nov 2 · Today, mockup C "Today's climb" (James). A line above the Kaizen 66 card adds up today: everything checked off out of
   everything on the list (habits, long-term, to-dos; the same counts the section headers show) and the feet today's habit
   check-offs climbed (131 ft each), with one gold-to-orange bar. The sections below sit on the black page (kzclimb-1102.css). */
(function () {
  var K = window.KZ; if (!K || K.__kzcl1102b) return; K.__kzcl1102b = 1;
  function counts() {
    var root = document.querySelector('#kz-today-s1 .kz-tgroups'), d = 0, t = 0; if (!root) return null;
    [].forEach.call(root.querySelectorAll('.kz-tsec .kz-tsec-n'), function (n) { var m = /(\d+)\s+of\s+(\d+)/.exec(n.textContent || ''); if (m && !n.closest('[hidden]')) { d += +m[1]; t += +m[2]; } });
    var ft = 0; try { (K.goals() || []).forEach(function (g) { if (g.kind === 'daily' && K.isDone(g.id)) ft += 131; }); } catch (e) {}
    return { d: d, t: t, ft: ft };
  }
  var last = '';
  function run() {
    var top = document.querySelector('#kz-today-s1 .kz-wrap49'), k66 = top && top.querySelector(':scope > .kzf-66'), anchor = k66 || (top && top.querySelector(':scope > .kz-tgroups'));
    if (!top || !anchor) return; var c = counts(); if (!c || !c.t) { var old = top.querySelector(':scope > .kzcl'); if (old) old.hidden = true; return; }
    var box = top.querySelector(':scope > .kzcl');
    if (!box) { box = document.createElement('div'); box.className = 'kzcl'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Today’s climb'); }
    if (box.nextElementSibling !== anchor) top.insertBefore(box, anchor);
    box.hidden = false;
    var pct = Math.round(c.d / c.t * 100), sig = c.d + '/' + c.t + '/' + c.ft; if (sig === last && box.firstChild) return; last = sig;
    box.classList.add('kzcl-only');
    box.innerHTML = '<span class="kzcl-bar" role="img" aria-label="Today’s climb: ' + c.d + ' of ' + c.t + ' done' + (c.ft ? ', ' + c.ft.toLocaleString() + ' feet' : '') + '"><i style="width:' + pct + '%"></i></span>';
  }
  K.__kzclimbRun = run;
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { run(); } catch (e) { console.error("kzclimb", e); } }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzcl')) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
  ['kz:changed', 'kz:step', 'kz:todos', 'kz:plan'].forEach(function (n) { document.addEventListener(n, soon); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
