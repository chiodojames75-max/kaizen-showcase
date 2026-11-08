/* Oct 26 l · Milestones, reworked (James: "make the medals more realistic and really cool; mix the balance in with the
   consistency; rework the way the milestones are"). Replaces kzach-1026j. Struck-metal medals from kzmedal-1026l.js.
   Next up: the closest medal across every track, big, with how far there is to go.
   Two tabs: Streak (days shown up, K.MILESTONES) and Consistency (Balanced days and All-done days in one list, in order
   of difficulty, each marked with its sign). Earned medals hang from a ribbon; locked ones are dark blanks with a ring
   that fills as you get closer. The old grid, its heading and "Next:" line are hidden, not removed (kzach-1024a draws
   them). Nothing new is stored except which tab you last opened (kz_mstab). Styles: kzach-1026l.css. */
(function () {
  var K = window.KZ; if (!K || K.__kzach2) return; K.__kzach2 = 1;
  var MORE = [[10, '10 days', 'Double digits. Keep going.'], [45, '45 days', 'Forty-five days. Over halfway to a habit.'], [75, '75 days', 'Seventy-five days. Past the habit line.'],
    [120, '4 months', 'Four months of showing up.'], [150, '150 days', 'One hundred fifty days. Rare air.'], [200, '200 days', 'Two hundred days. This is just who you are.'],
    [250, '250 days', 'Two hundred fifty days.'], [300, '300 days', 'Three hundred days. Almost a year.'], [500, '500 days', 'Five hundred days.'], [730, '2 years', 'Two years. Ancient.'], [1000, '1,000 days', 'One thousand days.']];
  function extend() {
    var M = K.MILESTONES; if (!Array.isArray(M) || M.__kzs) return;
    MORE.forEach(function (m) { if (!M.some(function (x) { return x[0] === m[0]; })) M.push(m); });
    M.sort(function (a, b) { return a[0] - b[0]; }); try { Object.defineProperty(M, '__kzs', { value: 1 }); } catch (e) {}
  }
  extend();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var RANK = function (v) { return v >= 730 ? 'Mythic' : v >= 300 ? 'Legendary' : v >= 100 ? 'Epic' : ''; };
  var LOCK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z"/></svg>';
  var SIGN = { bal: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/></svg>',
    all: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l4.5 4.5L20 6"/></svg>' };
  var TRK = [[7, '1 week'], [30, '1 month'], [66, 'Habit'], [100, '100 days'], [200, '200 days'], [365, '1 year']];
  function num(n) { return n >= 1000 ? (n / 1000) + 'k' : String(n); }
  var cache = null;
  function counts() {
    var done = K.get('done', {}) || {}, plans = K.get('plans', {}) || {}, sig = JSON.stringify([Object.keys(done).length, K.get('goals', []).length, Object.keys(plans).length, K.key(K.today())]) + (localStorage.getItem('kz_done') || '').length + (localStorage.getItem('kz_plans') || '').length;
    if (cache && cache.sig === sig) return cache;
    var goals = K.allGoals ? K.allGoals() : (K.goals ? K.goals() : []), tk = K.key(K.today()), days = {};
    for (var id in done) for (var d in (done[id] || {})) if (done[id][d] && d <= tk) days[d] = 1;
    var on = function (g, k) { return (!g.created || String(g.created).slice(0, 10) <= k) && (!g.archived || k < g.archived); };
    var pathOf = function (g) { try { return K.pathOf(g); } catch (e) { return g.path || ''; } };
    var bal = 0, con = 0;
    Object.keys(days).forEach(function (k) {
      var act = goals.filter(function (g) { return on(g, k); }); if (!act.length) return;
      var hit = function (g) { return !!(done[g.id] && done[g.id][k]); };
      // Balance: every branch you had a goal in got at least one step that day (needs two or more branches)
      var br = {}; act.forEach(function (g) { var p = pathOf(g); br[p] = br[p] || hit(g); });
      var names = Object.keys(br); if (names.length > 1 && names.every(function (p) { return br[p]; })) bal++;
      // Consistency: every goal you had that day done, and every task in that day's plan checked off
      var pl = plans[k], items = (pl && pl.items) || [];
      if (act.every(hit) && items.every(function (x) { return x.done; })) con++;
    });
    cache = { sig: sig, bal: bal, con: con }; return cache;
  }

  function ring(p, big) { var r = big ? 47 : 47, C = 2 * Math.PI * r; return '<svg class="kzm-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="' + r + '" class="kzm-rt"/><circle cx="50" cy="50" r="' + r + '" class="kzm-rf" stroke-dasharray="' + (C * p).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg>'; }
  function medal(n, got, p, big) {
    return '<span class="kzm-hang' + (big ? ' big' : '') + '">' + (got ? K.medalRibbon(n) : '') + '<span class="kzm-coin m-' + K.medalMetal(n) + (got ? ' got' : ' lock') + '">' +
      K.medalSVG(n) + '<b' + (n > 99 ? ' class="w3"' : '') + '>' + num(n) + '</b>' + (got ? '' : ring(p, big) + '<i class="kzm-lk">' + LOCK + '</i>') + '</span></span>';
  }
  function items() {
    var up = 0; try { up = K.daysShownUp(); } catch (e) {}
    var c = counts(), streak = (K.MILESTONES || []).map(function (m) { return { trk: 'streak', n: m[0], label: m[1], have: up }; });
    var cons = [];
    TRK.forEach(function (t) { cons.push({ trk: 'cons', kind: 'bal', n: t[0], label: t[1], have: c.bal }); cons.push({ trk: 'cons', kind: 'all', n: t[0], label: t[1], have: c.con }); });
    return { up: up, bal: c.bal, con: c.con, streak: streak, cons: cons };
  }
  var tab = (function () { var t = K.get('mstab', 'streak'); return t === 'cons' ? 'cons' : 'streak'; })();
  function cell(m) {
    var got = m.have >= m.n, left = m.n - m.have, p = got ? 1 : Math.max(0, Math.min(1, m.have / m.n)), r = RANK(m.n), metal = K.medalName[K.medalMetal(m.n)];
    var kind = m.kind ? '<span class="kzm-kind k-' + m.kind + '">' + SIGN[m.kind] + (m.kind === 'bal' ? 'Balanced' : 'All done') + '</span>' : '';
    var aria = esc(m.label) + (m.kind ? (m.kind === 'bal' ? ', balanced days' : ', all-done days') : ', days shown up') + ', ' + metal + (r ? ', ' + r : '') + (got ? ', earned' : ', ' + left + (left === 1 ? ' day' : ' days') + ' to go');
    return '<div class="kzm-cell' + (got ? ' got' : ' lock') + (r ? ' r-' + r.toLowerCase() : '') + '" role="img" aria-label="' + aria + '">' + medal(m.n, got, p) +
      kind + '<span class="kzm-l">' + esc(m.label) + '</span><em class="kzm-s">' + (got ? esc(r || metal) : 'in ' + left + (left === 1 ? ' day' : ' days')) + '</em></div>';
  }
  function html() {
    var D = items(), all = D.streak.concat(D.cons), earned = all.filter(function (m) { return m.have >= m.n; }).length;
    var next = all.filter(function (m) { return m.have < m.n; }).sort(function (a, b) { return (a.n - a.have) - (b.n - b.have) || a.n - b.n; })[0];
    var h = '<div class="kzm-h"><h3>Milestones</h3><em><b>' + earned + '</b> of ' + all.length + ' earned</em></div>';
    if (next) {
      var left = next.n - next.have, p = Math.max(0, Math.min(1, next.have / next.n));
      h += '<div class="kzm-next">' + medal(next.n, false, p, true) + '<div class="kzm-nt"><span class="kzm-nk">Next up</span><b>' + esc(next.label) + '</b>' +
        '<span class="kzm-nd">' + (next.trk === 'streak' ? 'Streak' : next.kind === 'bal' ? 'Balanced days' : 'All-done days') + ' · ' + left + (left === 1 ? ' day' : ' days') + ' to go · ' + esc(K.medalName[K.medalMetal(next.n)]) + (RANK(next.n) ? ' · ' + RANK(next.n) : '') + '</span>' +
        '<span class="kzm-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + next.n + '" aria-valuenow="' + next.have + '"><i style="width:' + (p * 100).toFixed(1) + '%"></i></span></div></div>';
    }
    h += '<div class="kzm-tabs" role="tablist" aria-label="Milestone tracks"><button type="button" role="tab" data-mt="streak" aria-selected="' + (tab === 'streak') + '">Streak <span>' + D.up + '</span></button>' +
      '<button type="button" role="tab" data-mt="cons" aria-selected="' + (tab === 'cons') + '">Consistency <span>' + (D.bal + D.con) + '</span></button></div>';
    if (tab === 'cons') h += '<p class="kzm-p"><span class="kzm-kind k-bal">' + SIGN.bal + 'Balanced</span> every branch got a step: <b>' + D.bal + '</b> &nbsp; <span class="kzm-kind k-all">' + SIGN.all + 'All done</span> every goal and the whole plan: <b>' + D.con + '</b></p>';
    else h += '<p class="kzm-p">Days you showed up: at least one step on any goal. <b>' + D.up + '</b> so far.</p>';
    h += '<div class="kzm-grid">' + (tab === 'cons' ? D.cons : D.streak).map(cell).join('') + '</div>';
    return h;
  }
  function paint() {
    var g = document.querySelector('.kza-badges'); if (!g) return;
    extend();
    var sec = g.parentNode, box = sec.querySelector(':scope > .kzm');
    if (!box) { box = document.createElement('div'); box.className = 'kzm'; sec.insertBefore(box, g); }
    if (!sec.classList.contains('kzm-on')) sec.classList.add('kzm-on');
    var h = html(); if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzm [data-mt]'); if (!b) return;
    tab = b.getAttribute('data-mt'); try { K.set('mstab', tab); } catch (er) {} paint();
  });
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { paint(); } catch (e) {} }); }
  function boot() {
    extend(); paint();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzm')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kz:changed', 'kz:step', 'kz:goals', 'kz:plan'].forEach(function (n) { document.addEventListener(n, function () { soon(); }); });
})();
