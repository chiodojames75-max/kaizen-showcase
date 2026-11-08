/* Oct 29 · replaces kzfocus-1028b.js for Kaizen 66 "pause, not reset" (kz66-1029): run days are check-offs, so the strip
   numbers them in order (a miss is not a day), the line under the bar shows "N to go · M in a row", and the end date reads
   "Without a miss, Day 66 lands on …". Nothing else changed. */
/* Oct 28 b · replaces kzfocus-1028.js: the tap glide no longer fades re-drawn blocks in from 0, and starts before the first paint. */
/* Oct 28 · replaces kzfocus-1027.js (no forced sync decode / img.decode() on the hidden tree picture; the phone logged WebP decode errors). Oct 27 · replaced kzfocus-1025m.js: the Kaizen 66 card opens in one quick 0.3 s motion with its pictures already decoded.
   Oct 25 m (from 1025e): the Kaizen 66 strip counts run days from the left (day 1 first) instead of the last 10 calendar days
   with today on the right; seedlings sit in their own soil, so the green glow under the tree is hidden for them. */
/* Oct 25 · Today, "focus" option A (James): less clutter, Kaizen 66 on top, to-dos right under it.
   - Kaizen 66 run (live or starting tomorrow): one compact card (tree, KAIZEN 66 · DAY n, goal, today's step, check, bar);
     tap the card to unfold the tree, the last 10 days, shields and the end date. The check is the run's own
     [data-k66="check"] (kz66-1024f handles it). With no run, kz66's own small invite shows as before.
   - Order: Kaizen 66 → To-dos → Other goals (the run's goal is not listed twice) → Done today.
   - Hidden on Today, not deleted: the Grove hero + "trees watered" bar, the reminder nudge card, the tree thumbnail and dot
     line on goal rows, Manage goals (now "Edit" on the goals header), the Quote / Question rows (now one header button).
   Rules and data are kz66's (kz_k66); this file only reads K.k66.state(), K.grow, K.groveImg. If anything throws, the
   page stays as it was (html.kz-fA is added only after the card is built). Styles: kzfocus-1025e.css
   Oct 25 c: the big "Today" title folds into the header row; the card updates in place (no blink); the card's details open
   with a height animation; check-offs and folds glide (FLIP: rows slide to their new place, new ones fade in); "Other goals" collapse fixed.
   Oct 25 e: motion runs on springs (damped harmonic, SwiftUI-like presets), interruptible with velocity; the quote sheet
   slides up on a spring and drags down to close with iOS rubber banding; K.spring() is shared. Pull-to-refresh removed. */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzfA) return; K.__kzfA = 1;
  var page = document.getElementById('kz-today-s1'); if (!page) return;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var tk = function () { return K.key(K.today()); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var fmt = function (k) { var d = new Date(k + 'T00:00:00'); return MON[d.getMonth()] + ' ' + d.getDate(); };
  var plus = function (k, n) { return K.key(K.addDays(new Date(k + 'T00:00:00'), n)); };
  var SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/></svg>';
  var card, qbtn, open = false, sig = '', raf = 0;
  try { open = sessionStorage.getItem('kz_fA_open') === '1'; } catch (e) {}

  function goal(id) { var gs = (K.goals ? K.goals() : []) || []; for (var i = 0; i < gs.length; i++) if (gs[i].id === id) return gs[i]; return null; }
  function state() { try { return K.k66 ? K.k66.state() : null; } catch (e) { return null; } }

  // The card is built once and then updated in place (no innerHTML swap, so the tree never blinks and nothing jumps).
  var el = {};
  function build() {
    card.innerHTML =
      '<div class="kzf-top"><button type="button" class="kzf-fold" aria-expanded="false">' +
        '<span class="kzf-th"><img alt="" decoding="async"></span>' +
        '<span class="kzf-tx"><em></em><b></b><span></span></span></button>' +
        '<button type="button" class="kzf-ck" data-k66="check"></button></div>' +
      '<div class="kzf-barrow"><span class="kzf-bar"><i></i></span><span class="kzf-left"></span></div>' +
      '<div class="kzf-morewrap"><div class="kzf-more">' +
        '<div class="kzf-tree"><i></i><img alt="" decoding="async"></div>' +
        '<div class="kzf-strip" role="img" aria-label="Run days">' + new Array(11).join('<i></i>') + '</div><div class="kzf-stripl"><span></span><span></span></div>' +
        '<div class="kzf-facts"><span class="kzf-sh">' + [0, 1].map(function () { return '<i>' + SHIELD + '</i>'; }).join('') + '<span></span></span><span class="kzf-end"></span></div>' +
        '<a class="kzf-link">Open goal</a></div></div>';
    var q = function (x) { return card.querySelector(x); };
    el = { fold: q('.kzf-fold'), th: q('.kzf-th img'), lab: q('.kzf-tx em'), name: q('.kzf-tx b'), sub: q('.kzf-tx > span'), ck: q('.kzf-ck'),
      bar: q('.kzf-bar i'), left: q('.kzf-left'), big: q('.kzf-tree img'), strip: card.querySelectorAll('.kzf-strip i'), stripBox: q('.kzf-strip'), stripL: card.querySelectorAll('.kzf-stripl span'), stripLBox: q('.kzf-stripl'), treeBox: q('.kzf-tree'),
      sh: card.querySelectorAll('.kzf-sh > i'), shBox: q('.kzf-sh'), shTx: q('.kzf-sh > span'), end: q('.kzf-end'), link: q('.kzf-link') };
  }
  function set(node, prop, v) { if (node && node[prop] !== v) node[prop] = v; }
  function attr(node, a, v) { if (node && node.getAttribute(a) !== v) node.setAttribute(a, v); }
  function paint() {
    raf = 0;
    try { todoCount(); } catch (e) {}
    var st = state(), r = st && st.run, g = r && goal(r.goal);
    var live = !!(g && (r.state === 'live' || r.state === 'pending'));
    de.classList.toggle('kz-fA-run', live);
    Array.prototype.forEach.call(page.querySelectorAll('.kz-tgroups .kz-goal[data-goal]'), function (row) { row.classList.toggle('kzf-is66', live && row.getAttribute('data-goal') === r.goal); });
    var h2 = page.querySelector('.kz-gsec .kz-tsec-h h2'); if (h2) { var want = live ? 'Other goals' : 'Goals'; if (h2.textContent !== want) h2.textContent = want; }
    if (!live) { card.hidden = true; sig = ''; return; }
    var w = null; try { w = K.grow(r.goal); } catch (e) {}
    var pend = r.state === 'pending', day = pend ? 0 : r.day, doneN = pend ? 0 : (r.todayDone ? r.day : r.day - 1), left = 66 - doneN;
    var s = [r.goal, g.name, g.step, r.state, day, !!r.todayDone, r.sh, w && w.key, w && w.sp, open, tk()].join('|');
    if (s === sig) return; sig = s;
    if (!el.fold) build();
    if (w) { var u = K.groveImg(w.sp, w.key); if (el.th.getAttribute('src') !== u) el.th.src = u; }
    set(el.lab, 'textContent', pend ? 'KAIZEN 66 · STARTS ' + fmt(r.start).toUpperCase() : 'KAIZEN 66 · DAY ' + day);
    set(el.name, 'textContent', g.name);
    set(el.sub, 'textContent', pend ? 'Check it off tomorrow for Day 1' : 'Today: ' + (g.step || 'check it off'));
    attr(el.fold, 'aria-expanded', String(open));
    attr(el.fold, 'aria-label', 'Kaizen 66, ' + g.name + ', ' + (pend ? 'starts ' + fmt(r.start) : 'day ' + day + ' of 66, ' + (r.todayDone ? 'done today' : 'not done yet')) + '. ' + (open ? 'Hide details' : 'Show details'));
    el.ck.hidden = pend; el.ck.classList.toggle('on', !!r.todayDone);
    attr(el.ck, 'aria-label', r.todayDone ? 'Day ' + day + ' done. Tap to undo.' : 'Check off Day ' + day + ' of Kaizen 66: ' + (g.step || g.name));
    el.bar.style.width = Math.max(1.5, 100 * doneN / 66).toFixed(1) + '%';
    set(el.left, 'textContent', (left > 0 ? left + ' to go' : 'Last one') + ((r.streak || 0) > 1 ? ' · ' + r.streak + ' in a row' : ''));
    if (w) { var ub = K.groveImg(w.sp, w.key, true); if (el.big.getAttribute('src') !== ub) { el.big.loading = 'eager'; el.big.src = ub; el.big.alt = w.species || 'Tree'; } }   /* Oct 27: loaded while closed too, so opening never waits for the picture */
    el.stripBox.hidden = pend;
    el.stripLBox.hidden = pend;
    if (!pend) {
      // run days, left to right: days 1-10 first; after day 10 the window slides so today is the last segment
      var d0 = day <= 10 ? 1 : day - 9, sum = { c: 0, s: 0 };
      for (var i = 0; i < 10; i++) {
        var n = d0 + i, k = plus(r.start, n - 1), v = r.log[k];
        var c = n < day ? 'c' : n === day ? (r.todayDone ? 'c' : 'now') : 'todo';
        if (c === 'c') sum.c++; if (c === 's') sum.s++;
        if (el.strip[i].className !== c) el.strip[i].className = c;
      }
      set(el.stripL[0], 'textContent', 'Day ' + d0); set(el.stripL[1], 'textContent', 'Day ' + (d0 + 9));
      attr(el.stripBox, 'aria-label', 'Kaizen 66, day ' + day + ' of 66, ' + doneN + ' done' + ((r.streak || 0) > 1 ? ', ' + r.streak + ' in a row' : '') + ((r.sh || 0) ? ', ' + r.sh + ' shields' : ''));
    }
    if (el.treeBox && w) el.treeBox.classList.toggle('v2', /^(seed|sd\d)$/.test(w.key));
    var shn = r.sh || 0; for (var j = 0; j < 2; j++) el.sh[j].classList.toggle('on', j < shn);
    attr(el.shBox, 'aria-label', shn + ' of 2 shields'); set(el.shTx, 'textContent', shn === 1 ? '1 shield' : shn + ' shields');
    set(el.end, 'textContent', 'Without a miss, Day 66 lands on ' + fmt(r.end66));
    attr(el.link, 'href', '/pages/goal?id=' + encodeURIComponent(g.id));
    card.hidden = false;
    var mw = card.querySelector('.kzf-morewrap'); if (mw && !mw.style.height) mw.style.height = open ? 'auto' : '0px';
    card.classList.toggle('open', open); card.classList.toggle('done', !!r.todayDone);
  }
  // To-dos: "N of M" next to the heading (read from the plan card's own count, which is hidden by CSS)
  function todoCount() {
    var sec = page.querySelector('.kz-todosec'); if (!sec) return;
    var h = sec.querySelector('[data-t="plan-h"]'), has = sec.querySelector('.kz-plan-list li'), hd = sec.querySelector('.kz-tsec-h h2');
    var t = has && h ? String(h.textContent || '').replace(/\s*done\s*$/i, '').trim() : '';
    var n = sec.querySelector('.kzf-tn');
    if (!t) { if (n) n.remove(); return; }
    if (!n && hd) { n = document.createElement('span'); n.className = 'kzf-tn'; hd.parentNode.insertBefore(n, hd.nextSibling); }
    if (n && n.textContent !== t) n.textContent = t;
  }
  function soon() { if (!raf) raf = requestAnimationFrame(paint); }

  function quoteSheet() {
    var q = page.querySelector('.kz-dailyrow [data-t="qstrip"]'), a = page.querySelector('.kz-dailyrow [data-r="strip"]');
    var s = document.createElement('div'); s.className = 'kzf-qs'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', 'Quote and question');
    s.innerHTML = '<div class="kzf-qs-in"><button type="button" data-q="q"><b>Quote of the day</b><span>' + esc((q && (q.querySelector('[data-t="q"]') || {}).textContent) || '') + '</span></button>' +
      '<button type="button" data-q="a"><b>Today\'s question</b><span>' + esc((a && (a.querySelector('[data-r="qline"]') || {}).textContent) || '') + '</span></button>' +
      '<button type="button" class="kzf-qs-x" data-q="x">Close</button></div>';
    document.body.appendChild(s);
    var pane = s.querySelector('.kzf-qs-in'), H = pane.getBoundingClientRect().height || 300, key = {};
    var put = function (y) { pane.style.transform = 'translateY(' + y.toFixed(1) + 'px)'; s.style.backgroundColor = 'rgba(0,0,0,' + (0.55 * Math.max(0, Math.min(1, 1 - y / H))).toFixed(3) + ')'; };
    if (calm) put(0); else { put(H); K.spring(key, H, 0, put, 'snappy'); }
    var gone = false, close = function (then) { if (gone) return; var fin = function () { if (gone) return; gone = true; live.delete(key); s.remove(); if (then) then(); }; if (calm) { fin(); return; } K.spring(key, 0, H + 90, function (y) { put(y); if (y >= H) fin(); }, 'snappy', fin); };
    // drag: down follows the finger, up resists like iOS (offset = (1 − 1/(c·x/d + 1))·d, c = 0.55)
    var y0 = null, dy = 0, t0 = 0;
    pane.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; live.delete(key); }, { passive: true });
    pane.addEventListener('touchmove', function (e) { if (y0 == null) return; var x = e.touches[0].clientY - y0; dy = x >= 0 ? x : -(1 - 1 / (0.55 * -x / H + 1)) * H; put(dy); }, { passive: true });
    pane.addEventListener('touchend', function () { if (y0 == null) return; var v = dy / Math.max(1, Date.now() - t0) * 1000; y0 = null; if (dy > H * 0.3 || v > 900) close(); else { var sp = K.spring(key, dy, 0, put, 'snappy'); sp.v = 0; } });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b && e.target !== s) return;
      if (!b) { close(); return; }
      var t = b.getAttribute('data-q'); close(function () { if (t === 'q' && q) q.click(); else if (t === 'a' && a) a.click(); });
    });
    var f = s.querySelector('button'); if (f) f.focus();
  }

  // ---------- motion: springs, not timers (Oct 25 e) ----------
  // Damped harmonic motion (m·x'' = −k·x − c·x'), tuned like SwiftUI's presets: response = how long it takes, damping 1 =
  // no overshoot. Every animation keeps its velocity when interrupted, so grabbing something mid-move never jumps.
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PRESET = { smooth: { response: 0.42, damping: 1 }, snappy: { response: 0.32, damping: 0.86 }, bouncy: { response: 0.45, damping: 0.7 } };
  function Spring(p) { var r = p.response, z = p.damping; this.k = Math.pow(2 * Math.PI / r, 2); this.c = 4 * Math.PI * z / r; this.x = 0; this.v = 0; this.to = 0; }
  Spring.prototype.step = function (dt) { // semi-implicit Euler, 4 substeps per frame: stable and cheap
    var h = dt / 4; for (var i = 0; i < 4; i++) { var a = -this.k * (this.x - this.to) - this.c * this.v; this.v += a * h; this.x += this.v * h; }
    return Math.abs(this.x - this.to) < 0.25 && Math.abs(this.v) < 0.5;
  };
  var live = new Map(), loopOn = false, last = 0;
  function loop(t) {
    var dt = Math.min(0.034, last ? (t - last) / 1000 : 0.016); last = t;
    live.forEach(function (sp, key) { var done = sp.step(dt); sp.apply(done ? sp.to : sp.x); if (done) { sp.v = 0; sp.x = sp.to; live.delete(key); if (sp.end) sp.end(); } });
    if (live.size) requestAnimationFrame(loop); else { loopOn = false; last = 0; }
  }
  function run(key, sp) { live.set(key, sp); if (!loopOn) { loopOn = true; last = 0; requestAnimationFrame(loop); } }
  K.spring = function (key, from, to, apply, preset, end) { // public: K.spring(id, from, to, fn(value), 'smooth'|'snappy'|'bouncy')
    var sp = live.get(key) || new Spring(PRESET[preset] || PRESET.smooth);
    if (!live.has(key)) { sp.x = from; sp.v = 0; }
    sp.to = to; sp.apply = apply; sp.end = end; run(key, sp); return sp;
  };
  // CSS can use the same curve: a spring sampled into linear() (for :active presses and the sheet)
  function linearOf(p, ms) { var sp = new Spring(p); sp.x = 0; sp.to = 1; var pts = [], n = 36; for (var i = 0; i <= n; i++) { pts.push(+sp.x.toFixed(4)); for (var k = 0; k < 4; k++) sp.step(ms / 1000 / n / 4 * 4 / 4 * 1); } pts[n] = 1; return 'linear(' + pts.join(', ') + ')'; }
  try {
    if (window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')) {
      de.style.setProperty('--kzf-snappy', linearOf(PRESET.snappy, 320)); de.style.setProperty('--kzf-smooth', linearOf(PRESET.smooth, 420));
    }
  } catch (e) {}

  // Rows and blocks that move after a tap slide there on a spring (FLIP). A second tap mid-slide starts from where the row
  // is right now, with its speed. Taps are never intercepted.
  var TRACK = '.kzf-66, .kz66-card, .kz-tgroups > .kz-tsec, .kz-tomorrow, .kz-goal[data-goal], .kz-plan-list > li, .kz-ux-undo, .kz-donesec';
  var offs = new WeakMap(); // element -> current spring (translateY)
  function snap() { var m = new Map(); Array.prototype.forEach.call(page.querySelectorAll(TRACK), function (e) { var r = e.getBoundingClientRect(); if (r.height) m.set(e, r.top); }); return m; }
  function play(before) {
    if (calm) return;
    var now = new Map(); Array.prototype.forEach.call(page.querySelectorAll(TRACK), function (e) { var r = e.getBoundingClientRect(); if (r.height) now.set(e, r.top); });
    now.forEach(function (top, e) {
      if (!before.has(e)) return;   // Oct 28 b: a block drawn anew was already on screen by now; fading it in from 0 made it vanish and come back (James's video: Long-term goals after a quit Undo)
      var d = before.get(e) - top, p = e.parentElement && e.parentElement.closest(TRACK);
      while (p && !(before.has(p) && now.has(p))) p = p.parentElement && p.parentElement.closest(TRACK);
      if (p) d -= before.get(p) - now.get(p);
      if (Math.abs(d) <= 1.5 || Math.abs(d) >= 900) return;
      var cur = offs.get(e), x0 = cur && live.has(cur.key) ? cur.x + d : d;
      var key = cur ? cur.key : {}; var sp = K.spring(key, x0, 0, function (x) { e.style.transform = Math.abs(x) < 0.3 ? '' : 'translateY(' + x.toFixed(2) + 'px)'; }, 'smooth', function () { e.style.transform = ''; });
      if (cur && live.has(key)) sp.x = x0; sp.key = key; offs.set(e, sp);
    });
  }
  function glide(fn) {
    var b = snap(); if (fn) fn();
    // Oct 28 b: measure in the frame the tap changes the page, before it is painted (two frames later it had already been drawn
    // in the new place and then jumped back to slide); later changes are still caught 380 ms on
    requestAnimationFrame(function () { play(b); var b2 = snap(); setTimeout(function () { play(b2); }, 380); });
  }
  function smooth(fn) { glide(fn); }
  page.addEventListener('click', function (e) {
    if (!e.isTrusted || !de.classList.contains('kz-fA')) return;
    if (e.target.closest && e.target.closest('button, [role="button"], a, label') && !e.target.closest('.kzf-fold')) glide(null);
  }, true);
  // The card's details open and close on a spring (height), interruptible both ways
  var foldKey = {};
  function foldTo(isOpen) {
    var wrap = card && card.querySelector('.kzf-morewrap'); if (!wrap) return;
    var inner = wrap.firstElementChild, h0 = wrap.getBoundingClientRect().height, h1 = isOpen ? inner.scrollHeight : 0;
    if (calm) { wrap.style.height = isOpen ? 'auto' : '0px'; return; }
    // Oct 27: one quick, even height animation (0.3 s). The old spring took ~1 s to settle and the rows below ran a
    // second slide on top of it, so on the phone the card looked open "to the bottom line" while the rest was still coming.
        clearTimeout(wrap.__t); wrap.style.transition = 'none'; wrap.style.height = h0 + 'px'; void wrap.offsetHeight;
    wrap.style.transition = 'height .3s cubic-bezier(.2,.8,.2,1)'; wrap.style.height = h1 + 'px';
    var end = function () { clearTimeout(wrap.__t); wrap.style.transition = ''; wrap.style.height = isOpen ? 'auto' : '0px'; wrap.removeEventListener('transitionend', end); };
    wrap.addEventListener('transitionend', end); wrap.__t = setTimeout(end, 380);
  }

  function setup() {
    var groups = page.querySelector('.kz-tgroups'); if (!groups) return;
    card = document.createElement('section'); card.className = 'kzf-66'; card.setAttribute('aria-label', 'Kaizen 66'); card.hidden = true;
    groups.parentNode.insertBefore(card, groups);
    try { paint(); } catch (e) { card.remove(); return; }
    card.addEventListener('click', function (e) {
      if (e.target.closest('.kzf-fold')) { open = !open; try { sessionStorage.setItem('kz_fA_open', open ? '1' : '0'); } catch (x) {} sig = ''; paint(); foldTo(open); }   /* Oct 27: no second (FLIP) slide for the rows below; they move with the card */
    });
    // goals header: Edit (Manage goals moves here)
    var gh = page.querySelector('.kz-gsec .kz-tsec-h');
    if (gh && !gh.querySelector('.kzf-edit')) { var ed = document.createElement('a'); ed.className = 'kzf-edit'; ed.href = '/pages/my-goals'; ed.textContent = 'Edit'; var fb = gh.querySelector('.kz-secfold'); gh.insertBefore(ed, fb || null); }
    // Quote / question: one button in the header, on Today only
    var hr = document.querySelector('#kz-header .kz-hright'), dr = page.querySelector('.kz-dailyrow');
    if (hr && dr && !hr.querySelector('.kzf-q')) {
      qbtn = document.createElement('button'); qbtn.type = 'button'; qbtn.className = 'kz-chip kzf-q'; qbtn.setAttribute('aria-label', 'Quote of the day and today\'s question');
      qbtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>';
      qbtn.addEventListener('click', quoteSheet); hr.insertBefore(qbtn, hr.firstChild);
    }
    de.classList.add('kz-fA');
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzf-66')) continue; if (t.nodeType === 1 && t.classList && t.classList.contains('kzf-tn')) continue; soon(); return; } }).observe(groups.parentNode, { childList: true, subtree: true });
    ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync', 'kz:k66'].forEach(function (ev) { document.addEventListener(ev, soon); });
    window.addEventListener('pageshow', function () { sig = ''; soon(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { sig = ''; soon(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 0); }); else setTimeout(setup, 0);
})();
