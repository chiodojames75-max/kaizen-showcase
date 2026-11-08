/* Nov 2 · copy of kzprog-1025w.js without the "Rest day" legend (no everyday-streak shields, so no rest days). */
/* Oct 25 w (from s): fidget-proof toggles. Sections update in place (the same buttons stay under your finger; they were
   rebuilt on every tap) and opening something only scrolls to it once you stop tapping, and only if it's off screen.
   Oct 25 s (from n): heatmap starts at your first day on the left.
 Oct 25 n (from m): branch names and colours are escaped everywhere (aria-label, note, style). m (from l): habits earned show days grown, not "day N" (Day N means the Kaizen 66 run). l (from j): empty leftover sections under Progress no longer add blank scroll. j: Edit on Balance opens the branch editor (it toggled a hidden card); milestones are tiered medals on a path.
 Oct 25 g · Progress, clean-up option C (James): "This week" → Kaizen 66 → last 6 months → Balance → Habits earned →
   Milestones. Every number once; no water / inches / XP words left on the page.
   - This week: streak (+ "your best" when it is), the 7 days as bars, shields.
   - Kaizen 66: the run's card (tap → goal); with no run, "Start a Kaizen 66 ›" opens kz66's own sheet.
   - Last 6 months: a heatmap built from the History calendar's own day buttons; "Open calendar ›" (or tapping a day)
     opens the full History calendar in place, unchanged in behaviour (tap a day → its card). Earlier months fold.
   - Balance: one stacked bar from K.pathRates(14); tap it to open the 3D orbit card (kzorb) underneath; Edit = the orbit's
     own Edit branches. Habits earned: goals at day 66+ (grove). Milestones: earned badges + the next one; All › opens the
     Achievements card.
   Old cards stay in the page (hidden by html.kz-pc, added only after this builds), so if anything throws the old page shows.
   Styles: kzprog-1025g.css */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzpc) return; K.__kzpc = 1;
  var page = null; // found in setup(): this file can load before the page body exists
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var tk = function () { return K.key(K.today()); };
  var plus = function (k, n) { return K.key(K.addDays(new Date(k + 'T00:00:00'), n)); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  var SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/></svg>';
  var box = {}, sig = {}, raf = 0, calOpen = false, balOpen = false, achOpen = false, edOpen = false;

  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function goal(id) { var g = goals(); for (var i = 0; i < g.length; i++) if (g[i].id === id) return g[i]; return null; }
  // day status, read from the History calendar's own buttons (same truth as the calendar)
  function dayMap() {
    var m = {};
    Array.prototype.forEach.call(document.querySelectorAll('#kz-cal .kz-cald[data-day]'), function (b) {
      var c = b.classList; m[b.getAttribute('data-day')] = c.contains('full') ? 'c' : c.contains('rest') ? 'r' : c.contains('grew') ? 'p' : c.contains('setback') ? 'm' : 'n';
    });
    return m;
  }
  function section(cls, label) { var s = document.createElement('section'); s.className = 'kzpc ' + cls; if (label) s.setAttribute('aria-label', label); return s; }
  function col(c) { c = String(c || ''); return /^#[0-9a-fA-F]{3,8}$/.test(c) || /^rgba?\([0-9.,\s%]+\)$/.test(c) || /^[a-z]{3,20}$/i.test(c) ? c : '#8E8E93'; }
  // same shape: copy only what changed (attributes, text), so elements keep their identity; otherwise replace
  function same(a, b) { if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName || a.childNodes.length !== b.childNodes.length) return false; for (var i = 0; i < a.childNodes.length; i++) if (!same(a.childNodes[i], b.childNodes[i])) return false; return true; }
  function patch(a, b) {
    if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    if (a.nodeType !== 1) return;
    var i, at; for (i = a.attributes.length - 1; i >= 0; i--) { at = a.attributes[i].name; if (!b.hasAttribute(at)) a.removeAttribute(at); }
    for (i = 0; i < b.attributes.length; i++) { at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
    for (i = 0; i < a.childNodes.length; i++) patch(a.childNodes[i], b.childNodes[i]);
  }
  function put(name, html) {
    if (sig[name] === html) return; sig[name] = html;
    var el = box[name], t = document.createElement('div'); t.innerHTML = html;
    if (el.childNodes.length && same(el, t)) patch(el, t); else el.innerHTML = html;
  }
  var scrollT = 0;
  function revealLater(el, block) { clearTimeout(scrollT); scrollT = setTimeout(function () { if (!el) return; var r = el.getBoundingClientRect(); if (r.top > innerHeight - 120 || r.bottom < 80) el.scrollIntoView({ behavior: 'smooth', block: block || 'start' }); }, 450); }

  function week(dm) {
    var st = {}; try { st = K.streakInfo() || {}; } catch (e) {}
    var n = st.streak != null ? st.streak : (K.streak ? K.streak() : 0), best = 0; try { best = K.bestStreak(); } catch (e) {}
    var sh = st.shields || 0, t = tk(), d0 = new Date(t + 'T00:00:00'), sun = plus(t, -d0.getDay()), bars = '';
    for (var i = 0; i < 7; i++) { var k = plus(sun, i), v = k > t ? 'f' : (dm[k] || 'n'); if (k === t && v === 'n') v = 'tn'; bars += '<span class="kzpc-wd ' + v + '"><i></i><em>' + DL[i] + '</em></span>'; }
    put('week', '<div class="kzpc-card"><div class="kzpc-big"><b>' + n + '</b><span>' + (n === 1 ? 'day' : 'days') + ' in a row' + (best && n >= best && n > 1 ? ' · your best' : best ? ' · best ' + best : '') + '</span></div>' +
      '<div class="kzpc-week" role="img" aria-label="This week">' + bars + '</div>' +
      '<div class="kzpc-sub">This week · <span class="blue">' + (sh ? sh + (sh === 1 ? ' shield ready' : ' shields ready') : 'no shields yet') + '</span></div></div>');
  }
  function k66() {
    var s = null; try { s = K.k66 ? K.k66.state() : null; } catch (e) {}
    var r = s && s.run, g = r && goal(r.goal);
    if (!g || !(r.state === 'live' || r.state === 'pending')) {
      put('k66', goals().length && K.k66 ? '<button type="button" class="kzpc-start" data-k66-open="">Start a Kaizen 66 <span>›</span></button>' : '');
      box.k66.hidden = !box.k66.innerHTML; return;
    }
    var w = null; try { w = K.grow(r.goal); } catch (e) {}
    var pend = r.state === 'pending', doneN = pend ? 0 : (r.todayDone ? r.day : r.day - 1), end = new Date(r.end66 + 'T00:00:00');
    put('k66', '<a class="kzpc-card kzpc-66" href="/pages/goal?id=' + encodeURIComponent(g.id) + '">' +
      '<div class="kzpc-66t">' + (w ? '<img src="' + K.groveImg(w.sp, w.key) + '" alt="" decoding="async">' : '') +
      '<div><em>KAIZEN 66 · ' + (pend ? 'STARTS TOMORROW' : 'DAY ' + r.day) + '</em><b>' + esc(g.name) + '</b></div>' +
      '<span class="kzpc-66r">Ends ' + MON[end.getMonth()] + ' ' + end.getDate() + '<br><span class="blue">' + (r.sh || 0) + (r.sh === 1 ? ' shield' : ' shields') + '</span></span></div>' +
      '<span class="kzpc-bar"><i style="width:' + Math.max(1.5, 100 * doneN / 66).toFixed(1) + '%"></i></span></a>');
    box.k66.hidden = false;
  }
  function heat(dm) {
    // Oct 25 s (James): your days start on the left. The grid begins on the Sunday of your first day and fills toward the
    // right; once there's more than ~6 months of history it shows the latest 26 weeks (newest on the right, as before).
    var t = tk(), d0 = new Date(t + 'T00:00:00'), sat = plus(t, 6 - d0.getDay()), start = plus(sat, -26 * 7 + 1), cells = '', months = [], lastM = -1;
    var first = Object.keys(dm).filter(function (k) { return dm[k] && dm[k] !== 'n' && k <= t; }).sort()[0];
    var sinceMode = false;
    if (first && first > start) { var fd = new Date(first + 'T00:00:00'); start = plus(first, -fd.getDay()); sinceMode = true; }
    for (var i = 0; i < 26 * 7; i++) {
      var k = plus(start, i), v = k > t ? 'f' : (dm[k] || 'n'), dd = new Date(k + 'T00:00:00');
      if (i % 7 === 0 && dd.getMonth() !== lastM && (dd.getDate() <= 7 || (sinceMode && i === 0))) { months.push('<span style="grid-column:' + (i / 7 + 1) + '">' + MON[dd.getMonth()] + '</span>'); lastM = dd.getMonth(); }
      cells += '<i class="' + v + '" data-d="' + k + '"></i>';
    }
    var any = Object.keys(dm).some(function (k) { return dm[k] !== 'n'; });
    put('heat', '<div class="kzpc-lab"><span>' + (sinceMode ? 'SINCE ' + MON[new Date(start + 'T00:00:00').getMonth()].toUpperCase() + ' ' + new Date(start + 'T00:00:00').getDate() : 'LAST 6 MONTHS') + '</span><button type="button" class="kzpc-link" data-pc="cal" aria-expanded="' + calOpen + '">' + (calOpen ? 'Hide calendar' : 'Open calendar') + ' ›</button></div>' +
      '<div class="kzpc-card"><div class="kzpc-heat" role="img" aria-label="Last 6 months: gold days had every goal done">' + cells + '</div><div class="kzpc-mon">' + months.join('') + '</div>' +
      '<div class="kzpc-leg"><span><i class="c"></i>All done</span><span><i class="p"></i>Some</span><span><i class="m"></i>Few</span></div></div>');
    box.heat.hidden = !any;
  }
  function balance() {
    var R = []; try { R = K.pathRates(14) || []; } catch (e) {}
    var on = R.filter(function (r) { return r.goals > 0; }), empty = R.filter(function (r) { return !r.goals; });
    if (!on.length) { box.bal.hidden = true; return; }
    var tot = on.reduce(function (a, r) { return a + (r.share || 0); }, 0) || 1;
    var max = Math.max.apply(null, on.map(function (r) { return r.share || 0; })), min = Math.min.apply(null, on.map(function (r) { return r.share || 0; }));
    var note = on.length < 2 ? 'Add a second branch to see balance' : max - min <= 12 ? 'Even over the last 2 weeks' : on.slice().sort(function (a, b) { return b.share - a.share; })[0].name + ' is leading the last 2 weeks';
    put('bal', '<div class="kzpc-lab"><span>BALANCE</span><button type="button" class="kzpc-link" data-pc="edit" aria-expanded="' + edOpen + '">' + (edOpen ? 'Done' : 'Edit') + '</button></div>' +
      '<div class="kzpc-card"><button type="button" class="kzpc-balbtn" data-pc="orbit" aria-expanded="' + balOpen + '" aria-label="Balance: ' + on.map(function (r) { return esc(r.name) + ' ' + (r.share || 0) + '%'; }).join(', ') + '. ' + (balOpen ? 'Hide' : 'Show') + ' the orbit">' +
      '<span class="kzpc-bal">' + on.map(function (r) { return '<i style="flex:' + Math.max(2, r.share || 0) / tot + ';background:' + col(r.color) + '"></i>'; }).join('') + '</span>' +
      '<span class="kzpc-bl">' + on.map(function (r) { return '<span><b style="color:' + col(r.color) + '">●</b> ' + esc(r.name) + ' ' + (r.share || 0) + '%</span>'; }).join('') + '</span></button>' +
      '<div class="kzpc-sub">' + esc(note) + empty.map(function (r) { return ' · <a href="/pages/my-goals?pillar=' + encodeURIComponent(r.id) + '#add">+ ' + esc(r.name) + '</a>'; }).join('') + '</div></div>');
    box.bal.hidden = false;
  }
  function habits() {
    var L = [];
    goals().forEach(function (g) { try { var w = K.grow(g.id); if (w.earned) L.push({ g: g, w: w }); } catch (e) {} });
    if (!L.length) { box.hab.hidden = true; return; }
    L.sort(function (a, b) { return b.w.day - a.w.day; });
    put('hab', '<div class="kzpc-lab"><span>HABITS EARNED · ' + L.length + '</span><a class="kzpc-link" href="/pages/profile">Grove ›</a></div><div class="kzpc-card kzpc-list">' +
      L.map(function (x) { return '<a class="kzpc-row" href="/pages/goal?id=' + encodeURIComponent(x.g.id) + '"><img src="' + K.groveImg(x.w.sp, x.w.key) + '" alt="" decoding="async"><span>' + esc(x.g.name) + '</span><em>' + x.w.day + ' days grown</em></a>'; }).join('') + '</div>');
    box.hab.hidden = false;
  }
  function tier(v) { return v >= 365 ? 'aur' : v >= 100 ? 'emb' : v >= 30 ? 'gld' : v >= 7 ? 'slv' : 'brz'; }
  function short(m) { return m[0] === 1 ? 'Start' : m[1].replace(' days', 'd').replace(' weeks', ' wk').replace('1 week', '1 wk').replace(' months', ' mo').replace('1 month', '1 mo').replace('1 year', '1 yr'); }
  function miles() {
    var M = (K.MILESTONES || []).filter(function (m) { return m[0] !== 66; }), n = 0; try { n = K.daysShownUp(); } catch (e) {}
    var got = M.filter(function (m) { return n >= m[0]; }), next = M.filter(function (m) { return n < m[0]; })[0];
    if (!got.length && !next) { box.ms.hidden = true; return; }
    var prev = got.length ? got[got.length - 1][0] : 0, pct = next ? Math.max(0.04, Math.min(1, (n - prev) / (next[0] - prev))) : 1;
    var h = got.map(function (m, i) {
      var last = i === got.length - 1;
      return '<span class="kzpc-mi on' + (last ? ' last' : '') + '" title="' + esc(m[2] || m[1]) + '"><span class="kzpc-md t-' + tier(m[0]) + '"><b' + (m[0] > 99 ? ' class="w3"' : '') + '>' + m[0] + '</b></span><em>' + esc(short(m)) + '</em></span>';
    }).join('');
    if (next) h += '<span class="kzpc-mi nx" title="' + esc(next[1]) + '"><span class="kzpc-md nxt t-' + tier(next[0]) + '" style="--p:' + pct.toFixed(3) + '"><b' + (next[0] > 99 ? ' class="w3"' : '') + '>' + next[0] + '</b></span><em>' + esc(short(next)) + '</em></span>';
    var cur = got.length ? tier(got[got.length - 1][0]) : 'none', names = { brz: 'Bronze', slv: 'Silver', gld: 'Gold', emb: 'Ember', aur: 'Aurora', none: '' };
    put('ms', '<div class="kzpc-lab"><span>MILESTONES · ' + got.length + (got.length ? ' · <i class="kzpc-tier t-' + cur + '">' + names[cur] + '</i>' : '') + '</span><button type="button" class="kzpc-link" data-pc="ach" aria-expanded="' + achOpen + '">' + (achOpen ? 'Hide' : 'All') + ' ›</button></div>' +
      '<div class="kzpc-card kzpc-mcard"><div class="kzpc-path" role="list" aria-label="' + got.length + ' milestones earned' + (next ? '. Next: ' + esc(next[1]) + ' in ' + (next[0] - n) + ' days' : '') + '">' + h + '</div>' +
      (next ? '<div class="kzpc-mnext"><span>Next: <b>' + esc(next[1]) + '</b></span><span>' + (next[0] - n) + (next[0] - n === 1 ? ' day' : ' days') + '</span></div><span class="kzpc-bar"><i style="width:' + Math.round(pct * 100) + '%"></i></span>' : '<div class="kzpc-mnext"><span>Every milestone earned</span></div>') + '</div>');
    var pth = box.ms.querySelector('.kzpc-path'); if (pth) pth.scrollLeft = pth.scrollWidth;
    box.ms.hidden = false;
  }
  // History calendar: keep it, but say things the app still has (no water, inches or XP)
  function tidyHistory() {
    var cal = document.getElementById('kz-cal'); if (!cal) return;
    var L = cal.querySelector('.kz-callegend');
    if (L && !L.__kzpc) { L.__kzpc = 1; var map = { 'Every goal': 'All done', 'Over 50% water': 'Some', '50% or less': 'Few', 'Rest day': 'Rest day' }; Array.prototype.forEach.call(L.querySelectorAll('span'), function (s) { var tx = s.lastChild; if (tx && tx.nodeType === 3 && map[tx.textContent.trim()]) tx.textContent = map[tx.textContent.trim()]; }); }
    var sum = cal.querySelector('[data-c="sum2"]'); if (sum) { var want = sum.textContent.replace(/days grown/, 'days shown up'); if (want !== sum.textContent) sum.textContent = want; }
    Array.prototype.forEach.call(cal.querySelectorAll('.kz-ds-sec p'), function (p) { var t = p.textContent, w = t.replace(/,?\s*(not finished,\s*)?no XP\s*$/i, '').replace(/\s*·\s*(not finished|finished)\s*$/i, ''); if (w !== t) p.textContent = w; });
    var e = cal.querySelector('.kz-calearlierwrap'), h = e && e.querySelector('.kz-calearlier');
    if (h && !h.__kzpc) { h.__kzpc = 1; h.setAttribute('role', 'button'); h.setAttribute('tabindex', '0'); h.setAttribute('aria-expanded', 'false'); h.addEventListener('click', function () { var o = !e.classList.contains('kzpc-open'); e.classList.toggle('kzpc-open', o); h.setAttribute('aria-expanded', String(o)); }); }
  }

  function voids() {
    var m = document.getElementById('kz-main'); if (!m) return;
    [].forEach.call(m.children, function (s) { if (s.tagName !== 'SECTION' || s.id === 'kz-prog-s1' || s.id === 'kz-cal') return; var h = 0; [].forEach.call(s.children, function (k) { h += k.offsetHeight; }); s.classList.toggle('kzpc-void', h === 0); });
  }
  function paint() {
    raf = 0;
    try { voids(); } catch (e) {}
    try { tidyHistory(); } catch (e) {}
    var dm = dayMap();
    try { week(dm); } catch (e) {} try { k66(); } catch (e) {} try { heat(dm); } catch (e) {}
    try { balance(); } catch (e) {} try { habits(); } catch (e) {} try { miles(); } catch (e) {}
  }
  function soon() { if (!raf) raf = requestAnimationFrame(paint); }
  var tries = 0;
  function setup() {
    page = page || document.getElementById('kz-prog-s1'); if (!page) { if (tries++ < 40) setTimeout(setup, 150); return; }
    var top = page.querySelector('.kz-top49'), bal = page.querySelector('.kz-balcard'), cal = document.getElementById('kz-cal'), ach = page.querySelector('.kza');
    // the page builds its cards after load (orbit, achievements): wait for them, up to ~6 s
    if (!top || !cal || !cal.querySelector('.kz-cald') || ((!bal || !ach) && tries < 40)) { if (tries++ < 40) setTimeout(setup, 150); return; }
    if (box.week) return;
    var anchor = bal || top.querySelector('.kzp-title + *') || cal;
    [['week', 'kzpc-wk', 'This week'], ['k66', 'kzpc-k', 'Kaizen 66'], ['heat', 'kzpc-ht', 'Last 6 months']].forEach(function (x) { box[x[0]] = section(x[1], x[2]); top.insertBefore(box[x[0]], anchor); });
    top.insertBefore(cal, anchor); // the full History calendar sits right under the heatmap (opened from it)
    box.bal = section('kzpc-bals', 'Balance'); top.insertBefore(box.bal, anchor);
    var after = bal ? bal.nextSibling : anchor;
    box.hab = section('kzpc-hb', 'Habits earned'); top.insertBefore(box.hab, after);
    box.ms = section('kzpc-ms', 'Milestones'); top.insertBefore(box.ms, after);
    if (ach) top.insertBefore(ach, after);
    try { paint(); } catch (e) { Object.keys(box).forEach(function (k) { box[k].remove(); }); return; }
    top.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pc], .kzpc-heat i[data-d]'); if (!b) return;
      clearTimeout(scrollT);
      var a = b.getAttribute('data-pc');
      if (a === 'cal' || b.hasAttribute('data-d')) {
        calOpen = a === 'cal' ? !calOpen : true; de.classList.toggle('kz-pc-cal', calOpen); sig.heat = ''; paint();
        if (b.hasAttribute('data-d')) { var d = b.getAttribute('data-d'), btn = cal.querySelector('.kz-cald[data-day="' + d + '"]'); if (btn) { var ew = btn.closest('.kz-calearlierwrap'); if (ew) ew.classList.add('kzpc-open'); btn.click(); setTimeout(function () { var c = cal.querySelector('.kz-calday') || btn; c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); } }
        else if (calOpen) revealLater(cal, 'start');
      } else if (a === 'orbit') { balOpen = !balOpen; if (!balOpen && edOpen) { edOpen = false; de.classList.remove('kz-pc-ed'); var e2 = page.querySelector('.kz-bst.editing .kz-bst2-edit'); if (e2) e2.click(); } de.classList.toggle('kz-pc-orb', balOpen); sig.bal = ''; paint(); }
      else if (a === 'edit') {
        var ed = page.querySelector('.kz-bst2-edit'); if (!ed) { location.href = '/pages/my-goals'; return; }
        edOpen = !edOpen; balOpen = edOpen; de.classList.toggle('kz-pc-orb', balOpen); de.classList.toggle('kz-pc-ed', edOpen);
        var bx = ed.closest('.kz-bst'), on = !!(bx && bx.classList.contains('editing')); if (on !== edOpen) ed.click();
        sig.bal = ''; paint();
        if (edOpen) revealLater(page.querySelector('.kz-bst') || ed, 'center');
      }
      else if (a === 'ach') { achOpen = !achOpen; de.classList.toggle('kz-pc-ach', achOpen); sig.ms = ''; paint(); if (achOpen && ach) revealLater(ach, 'start'); }
    });
    de.classList.add('kz-pc');
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzpc')) continue; soon(); return; } }).observe(page, { childList: true, subtree: true, characterData: true });
    ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync', 'kz:k66', 'kz:pillars'].forEach(function (ev) { document.addEventListener(ev, soon); });
    window.addEventListener('pageshow', function () { sig = {}; soon(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { sig = {}; soon(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 0); }); else setTimeout(setup, 0);
})();
