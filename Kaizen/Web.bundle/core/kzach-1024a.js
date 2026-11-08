/* Oct 24 · Progress: "Achievements" section under Balance and Shields (James, option G).
   Goals: every goal marked "Goal achieved" from its ••• menu (saved as g.won, then archived), newest first, filterable by branch.
   Milestones: K.MILESTONES against days shown up (K.daysShownUp). Nothing new is stored; every number comes from the app's own data.
   If anything throws, the section is removed and the page stays as it was. Styles: kzach-1024a.css */
(function () {
  var K = window.KZ; if (!K || K.__kzach) return; K.__kzach = 1;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CUP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';
  var el, f = 'all', sig = '';
  function nice(k) { return k ? new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''; }
  function data() {
    var done = K.get('done', {}) || {}, arch = (K.archived ? K.archived() : []) || [], paths = K.PATHS || [];
    var col = {}, nm = {}; paths.forEach(function (p) { col[p.id] = p.c2; nm[p.id] = p.name; });
    var won = arch.filter(function (g) { return g.won; }).map(function (g) {
      var pid = ''; try { pid = K.pathOf(g); } catch (e) {}
      var steps = Object.keys(done[g.id] || {}).length, days = g.created ? Math.max(1, Math.round((new Date(g.won + 'T12:00:00') - new Date(g.created + 'T12:00:00')) / 864e5) + 1) : 0;
      return { name: g.name, won: g.won, pid: pid, color: col[pid] || '#E2B93B', branch: nm[pid] || '', steps: steps, days: days };
    }).sort(function (a, b) { return a.won < b.won ? 1 : -1; });
    var up = 0; try { up = K.daysShownUp(); } catch (e) {}
    var ms = (K.MILESTONES || []).map(function (m) { return { n: m[0], label: m[1], msg: m[2], got: up >= m[0] }; });
    return { won: won, up: up, ms: ms };
  }
  function html(D) {
    var got = D.ms.filter(function (m) { return m.got; }), next = D.ms.filter(function (m) { return !m.got; })[0];
    var branches = []; D.won.forEach(function (g) { if (g.pid && branches.every(function (b) { return b.id !== g.pid; })) branches.push({ id: g.pid, name: g.branch }); });
    if (f !== 'all' && branches.every(function (b) { return b.id !== f; })) f = 'all';
    var list = D.won.filter(function (g) { return f === 'all' || g.pid === f; });
    var chips = branches.length > 1 ? '<div class="kza-chips" role="group" aria-label="Filter achieved goals">' + [{ id: 'all', name: 'All' }].concat(branches).map(function (b) {
      return '<button type="button" class="kza-chip' + (b.id === f ? ' on' : '') + '" data-f="' + esc(b.id) + '" aria-pressed="' + (b.id === f) + '">' + esc(b.name) + '</button>'; }).join('') + '</div>' : '';
    var rows = list.length ? list.map(function (g) {
      var meta = 'Done ' + nice(g.won) + (g.days ? ' · ' + g.days + (g.days === 1 ? ' day' : ' days') : '') + ' · ' + g.steps + (g.steps === 1 ? ' step' : ' steps');
      return '<a class="kza-goal" href="/pages/archived-goals"><span class="kza-ic" style="color:' + g.color + ';background:' + g.color + '24">' + CUP + '</span><span class="kza-gt"><b>' + esc(g.name) + '</b><small>' + meta + '</small></span>' + (g.branch ? '<em style="color:' + g.color + '">' + esc(g.branch) + '</em>' : '') + '</a>'; }).join('')
      : '<p class="kza-empty">Nothing finished yet. When you reach a goal, open its ••• menu and tap <b>Goal achieved</b>. It lands here for good.</p>';
    var shown = got.concat(D.ms.filter(function (m) { return !m.got; }).slice(0, Math.max(2, 6 - got.length)));
    var badges = shown.map(function (m) {
      return '<div class="kza-badge' + (m.got ? ' got' : '') + '" role="img" aria-label="' + esc(m.label) + (m.got ? ', earned' : ', locked') + '"><i>' + (m.n >= 1000 ? Math.round(m.n / 1000) + 'k' : m.n) + '</i><span>' + esc(m.label) + '</span></div>'; }).join('');
    return '<div class="kza-h"><h2>Achievements</h2><em>' + D.won.length + (D.won.length === 1 ? ' goal' : ' goals') + ' · ' + got.length + (got.length === 1 ? ' badge' : ' badges') + '</em></div>' +
      '<div class="kza-tiles"><div><b class="gold">' + D.won.length + '</b><span>goals achieved</span></div><div><b>' + D.up + '</b><span>days shown up</span></div><div><b>' + got.length + '</b><span>badges earned</span></div></div>' +
      chips + '<h3>Goals achieved</h3><div class="kza-goals">' + rows + '</div>' +
      '<h3>Milestones</h3><div class="kza-badges">' + badges + '</div>' +
      (next ? '<p class="kza-next">Next: <b>' + esc(next.label) + '</b> in ' + (next.n - D.up) + (next.n - D.up === 1 ? ' day' : ' days') + '</p>' : '');
  }
  function render(force) {
    var D = data(), s = JSON.stringify([D, f]); if (!force && s === sig) return; sig = s; el.innerHTML = html(D);
  }
  function setup() {
    var sec = document.getElementById('kz-prog-s1'); if (!sec) return;
    var after = sec.querySelector('.kzo-sh'), cal = sec.querySelector('#kz-cal');
    if (!after && !cal) return;
    el = document.createElement('section'); el.className = 'kza'; el.setAttribute('aria-label', 'Achievements');
    if (after) after.parentNode.insertBefore(el, after.nextSibling); else cal.parentNode.insertBefore(el, cal);
    try { render(true); } catch (e) { el.remove(); return; }
    el.addEventListener('click', function (e) { var c = e.target.closest('.kza-chip'); if (c) { f = c.getAttribute('data-f'); render(true); } });
    ['kz:changed', 'kz:step', 'kz:goals', 'kz:pillars'].forEach(function (ev) { document.addEventListener(ev, function () { try { render(); } catch (x) {} }); });
    window.addEventListener('pageshow', function () { try { render(); } catch (x) {} });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
