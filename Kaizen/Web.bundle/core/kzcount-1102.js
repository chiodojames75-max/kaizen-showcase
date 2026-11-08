/* Nov 2 · Today's section counts include what's already done (James: "if I have 6 goals and complete 5 then it should be
   5/6 not 0/1"). A finished goal moves down to Done today, so the Daily habits / Long-term goals counts used to see only the
   rows still in the section. Now each count = done / all of that section's goals, counting the ones in Done today too.
   Same rows as before are left out of the count: the Kaizen 66 (its own card), Quit habits (their own section) and
   long-term goals with milestones (nothing to check off today). Runs last and only writes when the text changes. */
(function () {
  var K = window.KZ; if (!K || K.__kzcount) return; K.__kzcount = 1;
  var SKIP = '.kzf-is66, .kzq-hide, .kzbd-row';
  function kindOf(id) { var g = (K.goals() || []).filter(function (x) { return x.id === id; })[0]; return g ? (g.kind === 'daily' ? 'daily' : 'long') : ''; }
  function on(r) { var b = r.querySelector('.kz-check'); return b ? b.getAttribute('aria-pressed') === 'true' : !!(K.isDone && K.isDone(r.getAttribute('data-goal'))); }
  function run() {
    var host = document.querySelector('#kz-today-s1 [data-t="goals"]'), dl = document.querySelector('#kz-today-s1 [data-t="donelist"]'); if (!host) return;
    var done = dl ? [].slice.call(dl.querySelectorAll(':scope > .kz-goal[data-goal]')).filter(function (r) { return !r.matches(SKIP); }) : [];
    [].forEach.call(host.querySelectorAll('.kz-gsec'), function (sec) {
      var n = sec.querySelector('.kz-tsec-n'); if (!n) return; var kind = sec.getAttribute('data-kind');
      var rows = [].slice.call(sec.querySelectorAll('.kz-goal[data-goal]')).filter(function (r) { return !r.matches(SKIP); });
      var gone = done.filter(function (r) { return kindOf(r.getAttribute('data-goal')) === kind; });
      var all = rows.length + gone.length, dn = rows.filter(on).length + gone.length;
      var want = all ? dn + ' of ' + all : '';
      if (n.textContent !== want) n.textContent = want;
      n.classList.toggle('full', !!all && dn === all);
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { run(); } catch (e) {} }); }
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
