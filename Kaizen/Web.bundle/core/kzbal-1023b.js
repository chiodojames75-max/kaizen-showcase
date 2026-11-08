/* Oct 23 Phase 1: Growth shows the same balance as Progress. The balStar block below is copied from calendar.html
   (<script id="kz-oct22-balstar">) so both pages draw it from the same function and the same numbers (K.pathRates(14)). */
(function () {
  var K = window.KZ; if (!K || K.balStar) return;
  var st = { open: null, del: null, add: false, reset: false };
  var f1 = function (v) { return Math.round(v * 10) / 10; };
  var chev = '<svg class="kz-bst-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  function isPreset() { return JSON.stringify(K.PATHS.map(function (p) { return [p.id, p.name, p.c2]; })) === JSON.stringify(K.PRESETS.map(function (p) { return [p.id, p.name, p.c2]; })); }
  K.balStar = function (P) {
    var n = P.length, c = 100, cy = 84, R = 62, live = P.filter(function (o) { return o.goals; }).length;
    var sv = '<svg class="kz-bst-star" viewBox="0 0 200 168" role="img" aria-label="' + live + ' of ' + n + ' branches growing. ' + P.map(function (o) { return K.esc(o.name) + ' ' + (o.goals ? o.goals + (o.goals === 1 ? ' goal' : ' goals') : 'no goals'); }).join(', ') + '">';
    P.forEach(function (o, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n, x = c + Math.cos(a) * R, y = cy + Math.sin(a) * R, on = !!o.goals;
      sv += '<line x1="' + c + '" y1="' + cy + '" x2="' + f1(x) + '" y2="' + f1(y) + '" stroke="' + o.color + '" stroke-width="' + (on ? 4 : 1.5) + '" stroke-linecap="round" opacity="' + (on ? 1 : 0.4) + '"/>' +
        '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (on ? 7 : 4.5) + '" fill="' + (on ? o.color : '#060607') + '" stroke="' + o.color + '" stroke-width="' + (on ? 0 : 1.5) + '" opacity="' + (on ? 1 : 0.7) + '"/>';
    });
    sv += '<circle cx="' + c + '" cy="' + cy + '" r="9" fill="#E2B93B"/></svg>';
    var few = K.PATHS.length <= K.MIN_PILLARS, full = K.PATHS.length >= K.MAX_PILLARS;
    var rows = P.map(function (o) {
      var p = K.pillar(o.id) || {}, on = !!o.goals, open = st.open === o.id;
      var h = '<div class="kz-bst-row' + (on ? ' on' : '') + (open ? ' open' : '') + '" data-bid="' + o.id + '" style="--bc:' + o.color + '">' +
        '<button type="button" class="kz-bst-main" data-bopen aria-expanded="' + open + '"><i class="kz-bst-dot"></i><span class="kz-bst-nm">' + K.esc(o.name) + '</span><span class="kz-bst-ct">' + (on ? o.goals + (o.goals === 1 ? ' goal' : ' goals') : 'no goals') + '</span>' + chev + '</button>';
      if (open) {
        var all = K.goalsIn(o.id), others = K.PATHS.filter(function (x) { return x.id !== o.id; });
        h += '<div class="kz-bst-edit"><input class="kz-input kz-bst-in" data-bname value="' + K.esc(p.name || o.name) + '" maxlength="24" aria-label="Branch name">' +
          '<div class="kz-bst-sw">' + K.PILLAR_COLORS.map(function (cc, j) { return '<button type="button" data-bcol="' + j + '" class="' + (cc[1] === p.c2 ? 'sel' : '') + '" style="background:' + cc[1] + '" aria-label="Color ' + (j + 1) + '"></button>'; }).join('') + '</div>';
        if (st.del === o.id) {
          h += '<div class="kz-bst-del"><span>' + (all ? 'Move its ' + all + (all === 1 ? ' goal' : ' goals') + ' to' : 'Delete this branch?') + '</span>' +
            (all ? '<select data-bmove aria-label="Move goals to">' + others.map(function (x) { return '<option value="' + x.id + '">' + K.esc(x.name) + '</option>'; }).join('') + '</select>' : '') +
            '<div class="kz-bst-delbtns"><button type="button" class="kz-btn ghost" data-bno>Keep</button><button type="button" class="kz-btn kz-danger" data-byes>Delete branch</button></div></div>';
        } else {
          h += few ? '<p class="kz-bst-hint">Keep at least ' + K.MIN_PILLARS + ' branches.</p>' : '<button type="button" class="kz-bst-dellink" data-bdel>Delete branch</button>';
        }
        h += '</div>';
      }
      return h + '</div>';
    }).join('');
    var add = full ? '' : '<div class="kz-bst-row kz-bst-add' + (st.add ? ' open' : '') + '"><button type="button" class="kz-bst-main" data-badd aria-expanded="' + st.add + '"><i class="kz-bst-dot"></i><span class="kz-bst-nm">Grow a new branch</span></button>' +
      (st.add ? '<form class="kz-bst-edit kz-bst-form" data-bform><input class="kz-input kz-bst-in" maxlength="24" placeholder="Faith, Career, Fitness" aria-label="New branch name"><button type="submit" class="kz-btn">Add</button></form>' : '') + '</div>';
    var W = K.pathRates ? K.pathRates(7) : P, wt = W.reduce(function (a, o) { return a + (o.done || 0); }, 0), top = W.slice().sort(function (a, b) { return (b.done || 0) - (a.done || 0); })[0], hit = W.filter(function (o) { return o.done; });
    var line = !wt ? 'No check-offs yet this week.' : hit.length === 1 ? 'This week, every check-off went to ' + K.esc(top.name) + '.' : hit.length === W.filter(function (o) { return o.goals; }).length && hit.length > 1 ? 'This week, your check-offs reached every branch with goals.' : 'This week, most check-offs went to ' + K.esc(top.name) + ' (' + top.done + ' of ' + wt + ').';
    return '<div class="kz-bst"><div class="kz-bst-grow">' + live + ' of ' + n + ' growing</div>' + sv + '<p class="kz-bst-line">' + line + '</p>' +
      '<div class="kz-bst-trunk">' + rows + add + '</div>' +
      '<p class="kz-bst-foot">Tap a branch to rename, recolor or delete' + (isPreset() ? '' : ' · <button type="button" data-breset>' + (st.reset ? 'Tap again to reset' : 'Reset to starter branches') + '</button>') + '</p></div>';
  };
  function repaint() { var el = document.querySelector('.kz-bst'); if (!el || !K.pathRates) return; el.outerHTML = K.balStar(K.pathRates(14)); }
  document.addEventListener('click', function (e) {
    var box = e.target.closest && e.target.closest('.kz-bst'); if (!box) return;
    var row = e.target.closest('[data-bid]'), id = row && row.dataset.bid, t;
    if (e.target.closest('[data-badd]')) { st.add = !st.add; st.open = null; repaint(); if (st.add) { t = document.querySelector('.kz-bst-form input'); if (t) t.focus(); } return; }
    if (e.target.closest('[data-breset]')) { if (st.reset) { st.reset = false; st.open = null; K.resetPillars(); K.track && K.track('kz_pillars_reset'); } else { st.reset = true; repaint(); } return; }
    if (!row) return;
    if (e.target.closest('[data-bopen]')) { st.open = st.open === id ? null : id; st.del = null; st.add = false; repaint(); return; }
    t = e.target.closest('[data-bcol]'); if (t) { K.updatePillar(id, { color: K.PILLAR_COLORS[+t.dataset.bcol] }); K.track && K.track('kz_pillar_color'); return; }
    if (e.target.closest('[data-bdel]')) { st.del = id; repaint(); return; }
    if (e.target.closest('[data-bno]')) { st.del = null; repaint(); return; }
    if (e.target.closest('[data-byes]')) { var sel = row.querySelector('[data-bmove]'); st.open = null; st.del = null; K.deletePillar(id, sel ? sel.value : ''); K.track && K.track('kz_pillar_deleted'); return; }
  });
  document.addEventListener('change', function (e) {
    var inp = e.target.closest && e.target.closest('.kz-bst [data-bname]'); if (!inp) return;
    var id = inp.closest('[data-bid]').dataset.bid;
    if (inp.value.trim()) { K.updatePillar(id, { name: inp.value }); K.track && K.track('kz_pillar_renamed'); } else inp.value = K.pillar(id).name;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.closest && e.target.closest('.kz-bst [data-bname]')) { e.preventDefault(); e.target.blur(); } });
  document.addEventListener('submit', function (e) {
    var fm = e.target.closest && e.target.closest('.kz-bst [data-bform]'); if (!fm) return; e.preventDefault();
    var inp = fm.querySelector('input'); if (K.addPillar(inp.value)) { st.add = false; K.track && K.track('kz_pillar_added'); }
  });
})();

(function () {
  var K = window.KZ; if (!K || !K.balStar || document.querySelector('[data-p="wheel"]')) return;
  var w = document.querySelector('[data-g="wheel"]'); if (!w) return;
  var busy = false;
  function paint() { if (busy || !K.pathRates) return; busy = true; w.innerHTML = K.balStar(K.pathRates(14)); var bn = document.querySelector('[data-g="balnum"]'); if (bn) bn.textContent = ''; busy = false; }
  // the page's own code redraws the old wheel after edits: draw the new one over it each time
  new MutationObserver(function () { if (!busy && !w.querySelector('.kz-bst')) paint(); }).observe(w, { childList: true });
  paint();
})();
