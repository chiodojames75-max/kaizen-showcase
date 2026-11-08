/* ==== kzq-1028.js ==== */
;try {
/* Oct 28 · replaces kzq-1024c.js: check-off taps skip the click re-scan (smoothness).
   Oct 24 · One pop-up at a time (bug fix). On launch the quote card, an unlock reveal, a streak milestone and the tree
   welcome could all open together and pile on top of each other (the quote card covered the unlock's buttons).
   This keeps the first one that opened in front and holds the others back (hidden, untouchable) until it closes,
   then shows the next. It never opens or closes anything itself. */
(function () {
  if (window.__kzq) return; window.__kzq = 1;
  var SEL = '.kz-qcard, .kz-reveal, .kz-qmodal, .kz-p3, .kz-p4, .kzc-over, .kz-twelcome, .kz66-over', order = [], obs = [], tick = 0, raf = 0;
  var open = function (e) { // our own hold (visibility) is ignored here on purpose
    if (!e.isConnected || e.hidden || e.classList.contains('out')) return false;
    return getComputedStyle(e).display !== 'none';
  };
  function scan() {
    raf = 0;
    var now = Array.prototype.filter.call(document.querySelectorAll(SEL), open);
    order = order.filter(function (e) { return now.indexOf(e) > -1; });
    now.forEach(function (e) { if (order.indexOf(e) < 0) order.push(e); });
    order.forEach(function (e, i) { if (i) e.setAttribute('data-kzq-wait', ''); else e.removeAttribute('data-kzq-wait'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-kzq-wait]'), function (e) { if (order.indexOf(e) < 1) e.removeAttribute('data-kzq-wait'); });
    if (order.length) document.body.classList.add('kz-noscroll'); // a closing pop-up unlocks scrolling even when another is still up
    watch();
    if (order.length > 1 && !tick) tick = setInterval(function () { soon(); if (order.length < 2) { clearInterval(tick); tick = 0; } }, 400);
  }
  function soon() { if (!raf) raf = requestAnimationFrame(scan); }
  function watch() {
    Array.prototype.forEach.call(document.querySelectorAll(SEL), function (e) {
      if (e.__kzq) return; e.__kzq = 1;
      var m = new MutationObserver(soon); m.observe(e, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] }); obs.push(m);
    });
  }
  function start() {
    // Oct 28: only a pop-up coming or going re-scans (the falling leaves and toasts added to the page did it on every check-off)
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var L = [ms[i].addedNodes, ms[i].removedNodes];
        for (var j = 0; j < 2; j++) for (var k = 0; k < L[j].length; k++) { var n = L[j][k]; if (n.nodeType === 1 && (n.matches(SEL) || (n.firstElementChild && n.querySelector(SEL)))) { soon(); return; } }
      }
    }).observe(document.body, { childList: true });
    document.addEventListener('click', function (e) {
      // Oct 28 (smoothness): a check-off tap doesn't re-scan (a pop-up it opens is a new element, which the body watcher
      // already sees); re-scanning meant two style recalcs in the middle of the check-off animation
      var t = e.target; if (t && t.closest && t.closest('.kz-check, .kzq-chk, [data-kzq-pid], [data-tdo], .kz-pcheck, [data-k66="check"]')) return;
      setTimeout(soon, 0); setTimeout(soon, 260);
    }, true);
    soon(); // first check on the next frame, so it never forces an extra layout while the page is still loading
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztoday-1024e.js ==== */
;try {
/* Oct 24 · Today, option A "Grove on top" (James). The Grove replaced the single tree, so Today shows the grove:
   - a "Your grove" card under the title: every goal's own tree, watered (checked off today) or thirsty; tap → Grove tab
   - "N of M trees watered" + bar
   - each goal row gets its tree as a thumbnail
   - the old single-tree card (sky picture, water, "grew today"), the "Your trees" strip and the visitors are hidden
   - Quote of the day / Today's question move to the bottom
   Nothing is deleted from the page: old parts are hidden only after this has built (html.kz-tA), so if anything here
   fails, Today stays exactly as it was. Header (every page): the streak replaces water, the visitor feed button goes.
   Styles: kztoday-1024e.css */
(function () {
  var K = window.KZ; if (!K || K.__kztA) return; K.__kztA = 1;
  var de = document.documentElement;
  de.classList.add('kz-hA'); // header: streak instead of water, no visitor feed (CSS)
  var page = document.getElementById('kz-today-s1'); if (!page) return;
  if (!K.grow || !K.groveImg) return; // needs the Grove
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var hero, prog, sig = '', raf = 0;
  var tk = function () { return K.key(K.today()); };
  var src = function (w) { return K.groveImg(w.sp, w.key); };
  var h = function (w, box) { return Math.round(box * (0.34 + 0.66 * w.scale)); };

  function data() {
    var gs = (K.goals ? K.goals() : []) || [], k = tk();
    return gs.map(function (g) { var w = K.grow(g.id); return { g: g, w: w, done: !!(K.isDone && K.isDone(g.id, k)) }; });
  }
  function paint() {
    raf = 0;
    var L = data(), s = JSON.stringify(L.map(function (x) { return [x.g.id, x.g.name, x.w.day, x.w.key, x.w.sp, x.done]; }));
    if (s !== sig) {
      sig = s;
      if (!L.length) { hero.hidden = true; prog.hidden = true; }
      else {
        hero.hidden = false; prog.hidden = false;
        var many = L.length > 4;
        hero.innerHTML = '<span class="kzt-hh"><span>Your grove</span><b>Open ›</b></span><span class="kzt-ground" aria-hidden="true"></span>' +
          '<span class="kzt-row' + (many ? ' many' : '') + '">' + L.map(function (x) {
            return '<span class="kzt-tree' + (x.done ? ' on' : '') + '"><span class="kzt-art"><img src="' + src(x.w) + '" alt="" style="height:' + h(x.w, 104) + 'px" decoding="async"></span>' +
              '<b>' + esc(x.g.name) + '</b><em>Day ' + x.w.day + ' · ' + (x.done ? 'Watered' : 'Thirsty') + '</em></span>';
          }).join('') + '</span>';
        hero.setAttribute('aria-label', 'Your grove: ' + L.map(function (x) { return x.g.name + ', day ' + x.w.day + ', ' + (x.done ? 'watered today' : 'not checked off yet'); }).join('; ') + '. Open the Grove.');
        var n = L.filter(function (x) { return x.done; }).length, left = L.length - n;
        prog.innerHTML = '<span class="kzt-pl"><b>' + n + ' of ' + L.length + (L.length === 1 ? ' tree' : ' trees') + ' watered</b><em>' + (left ? left + ' left' : 'All done today') + '</em></span>' +
          '<span class="kzt-bar" role="progressbar" aria-label="Trees watered today" aria-valuemin="0" aria-valuemax="' + L.length + '" aria-valuenow="' + n + '"><i style="width:' + Math.round(100 * n / L.length) + '%"></i></span>';
        prog.classList.toggle('all', !left);
      }
    }
    thumbs(L);
  }
  // each goal row on Today gets its own tree
  function thumbs(L) {
    var by = {}; L.forEach(function (x) { by[x.g.id] = x; });
    Array.prototype.forEach.call(page.querySelectorAll('.kz-goal[data-goal]'), function (row) {
      var x = by[row.getAttribute('data-goal')]; if (!x) return;
      var u = src(x.w), t = row.querySelector(':scope > .kzt-th');
      if (t && t.dataset.u === u) return;
      if (!t) { t = document.createElement('span'); t.className = 'kzt-th'; t.setAttribute('aria-hidden', 'true'); var body = row.querySelector(':scope > .kz-gbody'); row.insertBefore(t, body || row.firstChild); }
      row.classList.add('kzt-has'); t.dataset.u = u; t.innerHTML = '<img src="' + u + '" alt="" style="height:' + h(x.w, 40) + 'px" decoding="async">';
    });
  }
  function soon() { if (!raf) raf = requestAnimationFrame(paint); }

  function setup() {
    var title = page.querySelector('.kzp-title'), groups = page.querySelector('.kz-tgroups'); if (!title || !groups) return;
    hero = document.createElement('a'); hero.className = 'kzt-hero'; hero.href = '/pages/profile';
    prog = document.createElement('div'); prog.className = 'kzt-prog';
    var daily = page.querySelector('.kz-dailyrow');
    title.parentNode.insertBefore(hero, title.nextSibling); title.parentNode.insertBefore(prog, hero.nextSibling);
    try { paint(); } catch (e) { hero.remove(); prog.remove(); return; }
    // Quote of the day / Today's question: to the bottom, under the lists
    if (daily) { var man = page.querySelector('.kz-manage'); if (man && man.parentNode) man.parentNode.insertBefore(daily, man); else groups.parentNode.insertBefore(daily, groups.nextSibling); daily.classList.add('kzt-dailylow'); }
    de.classList.add('kz-tA');
    new MutationObserver(soon).observe(groups, { childList: true, subtree: true });
    ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync'].forEach(function (ev) { document.addEventListener(ev, soon); });
    window.addEventListener('pageshow', soon);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { sig = ''; soon(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kz66-1102.js ==== */
;try {
/* Nov 2 · replaces kz66-1030.js. James: "make it so you get a shield when you hit a checkpoint, make those in cahoots with each other". Shields now come from the checkpoints on the climb: reaching one (check-off 7, 14, 30, 45) earns one (still hold 2), instead of every 7 check-offs. */
/* Oct 30 · replaces kz66-1029b.js. A Kaizen 66 habit that only runs on some days (Weekdays, picked days; kzdays-1030) skips
   its off days: they're logged 'o', never a miss, never spend a shield, and don't break "in a row". "Day 66 lands on" counts
   only the habit's days. Checking it off on an off day still counts as a check-off. */
/* Oct 29 b · replaces kz66-1029.js: the Today invite said "66 days in a row", which the pause-not-reset rule no longer means. */
/* Oct 29 · Kaizen 66, "pause, not reset" (James: "it shouldn't reset"). Replaces kz66-1024f.js.
   One goal, 66 check-offs. A missed day doesn't count and the run waits: you're still on the same Day N tomorrow.
   You finish on your 66th check-off. Shields (one per 7 check-offs, hold 2) are a bonus: a shield covers a miss so your
   in-a-row streak keeps going; it doesn't add a day. A run only ends by finishing, switching goals or "End this run".
   This matches "Why 66 days?": missing a day didn't undo anyone's progress (Lally et al. 2010).
   Same data as before: kz_k66 = { run: {goal, start} | null, runs: [{goal, start, end, days, shields, won}], seen, off }.
   Runs that ended under the old rule stay in history as they were. evalRun adds: miss (days missed), streak (in a row now),
   best (best in a row this run), log[k] = 'c' | 's' | 'm'; end66 is the earliest finish if you don't miss again.
   Styles: kz66-1024f.css + kz66-1029.css */
(function () {
  var K = window.KZ; if (!K || K.__k66) return; K.__k66 = 1;
  var LEN = 66, CAMPS = [7, 14, 30, 45], MAXSH = 2;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var buzz = function (n) { post({ type: 'haptic', n: n || 1 }); };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var D = function (k) { return new Date(k + 'T00:00:00'); };
  var fmt = function (k) { var d = D(k); return MON[d.getMonth()] + ' ' + d.getDate(); };
  var fmtLong = function (k) { var d = D(k); return DAYS[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate(); };
  var tk = function () { return K.key(K.today()); };
  var plus = function (k, n) { return K.key(K.addDays(D(k), n)); };

  function store() { var s = K.get('k66', null); if (!s || typeof s !== 'object') s = {}; s.runs = s.runs || []; s.seen = s.seen || {}; if (!('run' in s)) s.run = null; return s; }
  function save(s) { K.set('k66', s); try { document.dispatchEvent(new CustomEvent('kz:k66')); } catch (e) {} }
  function goal(id) { var gs = (K.goals ? K.goals() : []) || []; for (var i = 0; i < gs.length; i++) if (gs[i].id === id) return gs[i]; return null; }
  function done(id, k) { return !!(K.isDone && K.isDone(id, k)); }
  function tree(id) { try { var w = K.grow(id); return { src: K.groveImg(w.sp, w.key), species: w.species, day: w.day, scale: w.scale }; } catch (e) { return null; } }

  // Walk the run day by day. Today is never a miss until it's over. A miss never ends the run.
  function evalRun(r) {
    var t = tk(), out = { goal: r.goal, start: r.start, end66: plus(r.start, LEN - 1), covered: 0, sh: 0, used: 0, miss: 0, streak: 0, best: 0, log: {}, state: 'live' };
    if (r.start > t) { out.state = 'pending'; out.day = 0; return out; }
    var k = r.start, since = 0, guard = 0, G = goal(r.goal), off = function (d) { try { return !!(G && K.offDay && K.offDay(G, d)); } catch (e) { return false; } };
    var earn = function () { if (CAMPS.indexOf(out.covered) >= 0 && out.sh < MAXSH) out.sh++; };   // out.covered already counts this check-off
    while (k < t && guard++ < 5000) {
      if (done(r.goal, k)) { out.covered++; out.streak++; out.log[k] = 'c'; earn(); }
      else if (off(k)) { out.log[k] = 'o'; }
      else if (out.sh > 0) { out.sh--; out.used++; out.log[k] = 's'; }
      else { out.miss++; out.streak = 0; out.log[k] = 'm'; }
      if (out.streak > out.best) out.best = out.streak;
      if (out.covered >= LEN) { out.state = 'won'; out.end = k; return out; }
      k = plus(k, 1);
    }
    out.todayDone = done(r.goal, t);
    if (out.todayDone) { out.covered++; out.streak++; out.log[t] = 'c'; earn(); if (out.streak > out.best) out.best = out.streak; if (out.covered >= LEN) { out.state = 'won'; out.end = t; return out; } }
    out.day = out.todayDone ? out.covered : out.covered + 1;
    var need = LEN - out.covered, dd = out.todayDone ? plus(t, 1) : t, g2 = 0; out.end66 = dd;
    while (need > 0 && g2++ < 2000) { if (!off(dd)) { need--; out.end66 = dd; } dd = plus(dd, 1); }
    return out;
  }

  // The run's state can change only by a new day or a check-off: settle it (end or win) and queue the one-time moment.
  function settle() {
    var s = store(); if (!s.run) return null;
    if (!goal(s.run.goal)) { s.runs.push({ goal: s.run.goal, start: s.run.start, end: tk(), days: 0, removed: 1 }); s.run = null; save(s); return null; }
    var e = evalRun(s.run);
    if (e.state === 'won') {
      var w = { goal: s.run.goal, start: s.run.start, end: e.end, days: LEN, shields: e.used, won: 1 };
      s.runs.push(w); s.run = null; s.pending = { kind: 'won', rec: w }; save(s); return null;
    }
    return e;
  }
  function startFor(id) { return done(id, tk()) ? tk() : plus(tk(), 1); }
  function start(id) {
    var s = store(); if (s.run || !goal(id)) return;
    s.run = { goal: id, start: startFor(id) }; s.pending = null; save(s); buzz(2);
    if (K.track) try { K.track('kz_k66_start', { today: s.run.start === tk() }); } catch (e) {}
    paintAll();
  }
  function giveUp() { var s = store(); if (!s.run) return; var e = evalRun(s.run); s.runs.push({ goal: s.run.goal, start: s.run.start, end: tk(), days: e.covered || 0, shields: e.used || 0, won: 0, quit: 1 }); s.run = null; save(s); paintAll(); }
  K.k66 = { state: function () { var s = store(); return { run: s.run ? evalRun(s.run) : null, runs: s.runs }; }, start: start };

  // ---------- full-screen layers (start sheet, the run ending, Day 66) ----------
  var layer = null;
  function open(html, cls) {
    close(true);
    layer = document.createElement('div'); layer.className = 'kz66-over ' + cls; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
    layer.innerHTML = '<div class="kz66-in">' + html + '</div>';
    document.body.appendChild(layer); document.body.classList.add('kz-noscroll'); post({ type: 'pageScroll', on: false });
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (layer) layer.classList.add('on'); }); });
    var f = layer.querySelector('[data-k66-focus]') || layer.querySelector('button'); if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function close(now) {
    if (!layer) return; var l = layer; layer = null; l.classList.remove('on'); l.classList.add('out');
    document.body.classList.remove('kz-noscroll'); setTimeout(function () { post({ type: 'pageScroll', on: true }); }, 200);
    setTimeout(function () { l.remove(); }, now ? 0 : 260);
  }
  var X = '<button type="button" class="kz66-x" data-k66="close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
  var SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/></svg>';
  var pick = null;
  function sheet(pre) {
    var gs = (K.goals ? K.goals() : []) || []; if (!gs.length) return;
    pick = pre && goal(pre) ? pre : (pick && goal(pick) ? pick : gs[0].id);
    var rows = gs.map(function (g) { var t = tree(g.id);
      return '<button type="button" class="kz66-g' + (g.id === pick ? ' sel' : '') + '" data-k66-pick="' + esc(g.id) + '" aria-pressed="' + (g.id === pick) + '"><span class="kz66-gt">' + (t ? '<img src="' + t.src + '" alt="">' : '') + '</span><b>' + esc(g.name) + '</b><i aria-hidden="true"></i></button>'; }).join('');
    var st = startFor(pick), today = st === tk();
    open(X + '<div class="kz66-hd"><span class="kz66-num" aria-hidden="true">66</span><h2>Kaizen 66</h2><p>One goal. 66 check-offs.<br>Miss a day and the run waits for you.</p></div>' +
      '<p class="kz66-cap">Pick your goal</p><div class="kz66-list">' + rows + '</div>' +
      '<p class="kz66-cap">The rules</p><ul class="kz66-rules">' +
      '<li><i class="c" aria-hidden="true"></i><span>Check it off every day you can. Your 66th check-off finishes it.</span></li>' +
      '<li><i class="s" aria-hidden="true"></i><span>Reach a checkpoint (day 7, 14, 30 and 45) and you earn a shield (hold 2). A shield covers a missed day so your in-a-row streak keeps going.</span></li>' +
      '<li><i class="t" aria-hidden="true"></i><span>Miss with no shield and that day doesn’t count. Nothing resets: you pick up on the same day.</span></li></ul>' +
      '<div class="kz66-foot"><button type="button" class="kz66-go" data-k66="start" data-k66-focus>' + startLabel(st) + '</button>' +
      '<p data-k66-end>' + endLabel(st) + '</p></div>', 'kz66-sheet');
  }
  function startLabel(st) { return st === tk() ? 'Start today · Day 1 is done' : 'Start tomorrow · ' + esc(fmtLong(st).replace(/^(\w{3})\w*/, '$1')); }
  function endLabel(st) { return 'Without a miss, Day 66 lands on ' + esc(fmtLong(plus(st, LEN - 1))); }
  // Oct 24 fix: picking a goal only moves the selection and updates the start/end lines (it used to rebuild the
  // whole screen, which faded it out and back in: the flicker)
  function choose(id) {
    if (!layer || !layer.classList.contains('kz66-sheet') || !goal(id)) { sheet(id); return; }
    pick = id;
    Array.prototype.forEach.call(layer.querySelectorAll('[data-k66-pick]'), function (b) { var on = b.getAttribute('data-k66-pick') === id; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on)); });
    var st = startFor(id), go = layer.querySelector('[data-k66="start"]'), en = layer.querySelector('[data-k66-end]');
    if (go) go.innerHTML = startLabel(st); if (en) en.innerHTML = endLabel(st);
    post({ type: 'tick' });
  }
  function moment() {
    var s = store(), p = s.pending; if (!p || layer) return;
    if (document.querySelector('.kz-qcard, .kz-reveal:not([hidden]), .kz-p3, .kz-p4, .kz-twelcome, #kz-welcome:not([hidden])')) { setTimeout(moment, 1500); return; } // after the other pop-ups
    var r = p.rec, g = goal(r.goal) || { name: 'Your goal' }, t = tree(r.goal);
    var art = '<div class="kz66-art' + (p.kind === 'won' ? ' won' : '') + '"><svg viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="102" class="tr"/><circle cx="110" cy="110" r="102" class="pr" stroke-dasharray="' + (641 * Math.min(1, r.days / LEN)).toFixed(0) + ' 641" transform="rotate(-90 110 110)"/></svg>' +
      '<span class="kz66-scene"><i></i>' + (t ? '<img src="' + t.src + '" alt="">' : '') + '</span>' + (p.kind === 'won' ? '<b class="kz66-pill">66 / 66</b>' : '') + '</div>';
    if (p.kind === 'won') {
      open('<p class="kz66-tag gold">Kaizen 66 · complete</p>' + art + '<h2 class="kz66-h">' + esc(g.name) + '<br>is a habit now.</h2><p class="kz66-p">66 check-offs. Its tree wears a gold badge in your Grove for good.</p>' +
        '<div class="kz66-stats"><span><b>66</b><small>days</small></span><span><b class="bl">' + (r.shields || 0) + '</b><small>' + ((r.shields || 0) === 1 ? 'shield used' : 'shields used') + '</small></span><span><b class="sm">' + esc(fmt(r.start)) + '–' + esc(fmt(r.end)) + '</b><small>' + D(r.end).getFullYear() + '</small></span></div>' +
        '<div class="kz66-foot"><button type="button" class="kz66-go" data-k66="share" data-k66-focus>Share my 66</button><button type="button" class="kz66-alt" data-k66="again">Start another Kaizen 66</button></div>', 'kz66-won');
      buzz(2);
    } else {
      var n = r.days || 0, sp = t ? t.species : 'tree';
      open('<p class="kz66-tag">Kaizen 66</p>' + art + '<h2 class="kz66-h">' + (n >= 3 ? n + ' days. That’s real.' : 'This run ended early.') + '</h2>' +
        '<p class="kz66-p">You missed ' + esc(DAYS[D(r.end).getDay()]) + ' with no shield left, so this run ended at Day ' + n + '. Your ' + esc(sp) + ' keeps all its growth.</p>' +
        '<div class="kz66-rows"><span><em>Best run</em><b class="g">' + best() + (best() === 1 ? ' day' : ' days') + '</b></span><span><em>' + esc(g.name) + '</em><b class="ok">' + (t ? 'Day ' + t.day + ' · kept' : 'kept') + '</b></span><span><em>Next run</em><b>first shield after 7 days</b></span></div>' +
        '<div class="kz66-foot"><button type="button" class="kz66-go" data-k66="restart" data-k66-focus>' + (goal(r.goal) && startFor(r.goal) === tk() ? 'Start again today' : 'Start Day 1 tomorrow') + '</button><button type="button" class="kz66-alt q" data-k66="later">Not now</button></div>', 'kz66-break');
    }
    s.pending = null; s.seen[p.kind + ':' + r.goal + ':' + r.start] = tk(); save(s);
  }
  function best() { return store().runs.reduce(function (m, r) { return Math.max(m, r.days || 0); }, 0); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-k66], [data-k66-pick], [data-k66-open]'); if (!b) { if (layer && e.target === layer) close(); return; }
    if (b.hasAttribute('data-k66-open')) { e.preventDefault(); sheet(b.getAttribute('data-k66-open') || null); return; }
    if (b.hasAttribute('data-k66-pick')) { choose(b.getAttribute('data-k66-pick')); return; }
    var a = b.getAttribute('data-k66'), s = store();
    if (a === 'close' || a === 'later') close();
    else if (a === 'start') { if (pick) { close(); start(pick); } }
    else if (a === 'again') { close(); setTimeout(function () { sheet(null); }, 280); }
    else if (a === 'restart') { var last = s.runs[s.runs.length - 1]; close(); if (last && goal(last.goal)) start(last.goal); }
    else if (a === 'share') {
      var last2 = s.runs[s.runs.length - 1], g2 = last2 && goal(last2.goal), txt = 'I just finished Kaizen 66: “' + (g2 ? g2.name : 'my goal') + '”, checked off on 66 days.';
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen) post({ type: 'text', text: txt });
      else if (navigator.share) navigator.share({ text: txt }).catch(function () {});
    }
    else if (a === 'check') { var r = s.run, c = r && document.querySelector('.kz-check[data-kz-done="' + (window.CSS && CSS.escape ? CSS.escape(r.goal) : r.goal) + '"]'); if (c) c.click(); else if (r && K.toggleDone && !done(r.goal, tk())) { K.toggleDone(r.goal); document.dispatchEvent(new CustomEvent('kz:changed')); } }
    else if (a === 'hide') { s.off = tk(); save(s); paintAll(); }
    else if (a === 'quit') { if (b.dataset.sure) giveUp(); else { b.dataset.sure = '1'; b.textContent = 'Tap again to end this run'; setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'End this run'; } }, 3500); } }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && layer) close(); });

  // ---------- Today: the run card, or a small invite ----------
  function ring(pct, size, sw) { var r = (size - sw) / 2, C = 2 * Math.PI * r; return '<svg viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="tr" stroke-width="' + sw + '"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="pr" stroke-width="' + sw + '" stroke-dasharray="' + (C * Math.max(0.01, Math.min(1, pct))).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>'; }
  function leftToday() { var n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); var mins = Math.max(1, Math.round((m - n) / 6e4)); return Math.floor(mins / 60) + ' h ' + (mins % 60) + ' m left today'; }
  function todayCard() {
    var page = document.getElementById('kz-today-s1'); if (!page) return;
    var s = store(), e = s.run ? settle() : null, box = page.querySelector('.kz66-card');
    s = store();
    var gs = (K.goals ? K.goals() : []) || [];
    var html = '', cls = '';
    if (s.run && e) {
      var g = goal(s.run.goal), t = tree(s.run.goal);
      if (e.state === 'pending') {
        cls = 'pend';
        html = '<div class="kz66-top"><span class="kz66-lbl">Kaizen 66</span></div><div class="kz66-mid"><div class="kz66-ring">' + ring(0, 104, 8) + '<span class="kz66-scene sm"><i></i>' + (t ? '<img src="' + t.src + '" alt="">' : '') + '</span></div>' +
          '<div class="kz66-txt"><span>' + esc(g.name) + '</span><b>Starts tomorrow</b><em>Check it off ' + esc(fmtLong(s.run.start).split(',')[0]) + ' for Day 1</em></div></div>';
      } else {
        var strip = '', k0 = plus(tk(), -9);
        for (var i = 0; i < 10; i++) { var k = plus(k0, i), v = e.log[k]; strip += '<i class="' + (k < s.run.start ? 'pre' : v === 'c' ? 'c' : v === 's' ? 's' : v === 'm' ? 'm' : k === tk() ? 'now' : 'pre') + '"></i>'; }
        var shields = '<span class="kz66-sh" role="img" aria-label="' + e.sh + ' of 2 shields">' + [0, 1].map(function (j) { return '<i class="' + (j < e.sh ? 'on' : '') + '">' + SHIELD + '</i>'; }).join('') + '<em>' + (e.sh === 1 ? '1 shield' : e.sh + ' shields') + '</em></span>';
        var left = LEN - e.day;
        html = '<div class="kz66-top"><span class="kz66-lbl">Kaizen 66</span>' + shields + '</div>' +
          '<div class="kz66-mid"><div class="kz66-ring">' + ring((e.todayDone ? e.day : e.day - 1) / LEN, 104, 8) + '<span class="kz66-scene sm"><i></i>' + (t ? '<img src="' + t.src + '" alt="">' : '') + '</span></div>' +
          '<div class="kz66-txt"><span>' + esc(g.name) + '</span><b>Day ' + e.day + '</b><em>' + (left > 0 ? left + ' to go' : 'Last one') + (e.streak > 1 ? ' · ' + e.streak + ' in a row' : '') + '</em></div></div>' +
          '<div class="kz66-strip" role="img" aria-label="Last 10 days">' + strip + '</div>' +
          (e.todayDone ? '<button type="button" class="kz66-go ok" data-k66="check" aria-label="Day ' + e.day + ' done. Tap to undo.">Day ' + e.day + ' done</button>'
            : '<button type="button" class="kz66-go" data-k66="check">Check off Day ' + e.day + '</button><p class="kz66-left">' + leftToday() + '</p>');
      }
    } else if (gs.length && s.off !== tk() && !(s.off && s.off > plus(tk(), -7))) {
      cls = 'invite';
      html = '<button type="button" class="kz66-inv" data-k66-open=""><span class="kz66-num sm" aria-hidden="true">66</span><span class="kz66-it"><b>Kaizen 66</b><em>One goal, 66 check-offs. Miss a day, nothing resets.</em></span><span class="kz66-start">Start</span></button><button type="button" class="kz66-hide" data-k66="hide" aria-label="Hide for a week"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
    }
    if (!html) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('section'); box.setAttribute('aria-label', 'Kaizen 66'); var hero = page.querySelector('.kzt-hero'), title = page.querySelector('.kzp-title'); var at = hero || (title && title.nextSibling); if (at) at.parentNode.insertBefore(box, at); else page.insertBefore(box, page.firstChild); }
    box.className = 'kz66-card ' + cls;
    if (box.__h !== html) { box.__h = html; box.innerHTML = html; }
  }

  // ---------- goal page: start / status / past runs ----------
  function goalPage() {
    var page = document.getElementById('kz-goalpage'); if (!page) return;
    var id = new URLSearchParams(location.search).get('id'); if (!id || !goal(id)) return;
    var s = store(), e = s.run ? settle() : null; s = store();
    var box = page.querySelector('.kz66-gp'); if (!box) { box = document.createElement('section'); box.className = 'kz66-gp'; box.setAttribute('aria-label', 'Kaizen 66'); var a = page.querySelector('.kzg-goal') || page.querySelector('.kz-g1stats'); if (a && a.parentNode) a.parentNode.insertBefore(box, a.nextSibling); else page.appendChild(box); }
    var mine = s.runs.filter(function (r) { return r.goal === id && !r.removed; }), html = '<h3>Kaizen 66</h3>';
    if (s.run && s.run.goal === id && e) html += '<p class="kz66-st"><b>' + (e.state === 'pending' ? 'Starts ' + esc(fmtLong(s.run.start)) : 'Day ' + e.day + ' of 66') + '</b><span>' + (e.state === 'pending' ? 'Check it off that day for Day 1' : (e.streak > 1 ? e.streak + ' in a row · ' : '') + e.sh + (e.sh === 1 ? ' shield' : ' shields') + ' · Day 66 ' + esc(fmt(e.end66)) + ' without a miss') + '</span></p><button type="button" class="kz66-quit" data-k66="quit">End this run</button>';
    else if (s.run) html += '<p class="kz66-st"><span>Another goal has the Kaizen 66 run right now. One at a time.</span></p>';
    else html += '<button type="button" class="kz66-go" data-k66-open="' + esc(id) + '">Start Kaizen 66 with this goal</button>';
    if (mine.length) html += '<ul class="kz66-hist">' + mine.slice().reverse().map(function (r, i) { return '<li><span>Run ' + (mine.length - i) + ' · ' + esc(fmt(r.start)) + '</span><b class="' + (r.won ? 'g' : '') + '">' + (r.won ? '66 ✓' : (r.days || 0) + (r.days === 1 ? ' day' : ' days')) + '</b></li>'; }).join('') + '</ul>';
    if (box.__h !== html) { box.__h = html; box.innerHTML = html; }
  }

  // ---------- Grove: a gold badge on the run's tree ----------
  function grove() {
    var trees = document.querySelectorAll('a.kzg-tree'); if (!trees.length) return;
    var s = store(), live = s.run ? s.run.goal : null, won = {}; s.runs.forEach(function (r) { if (r.won) won[r.goal] = 1; });
    Array.prototype.forEach.call(trees, function (a) {
      var m = /[?&]id=([^&]+)/.exec(a.getAttribute('href') || ''), id = m ? decodeURIComponent(m[1]) : null; if (!id) return;
      var kind = won[id] ? 'won' : id === live ? 'live' : '', b = a.querySelector('.kz66-badge');
      if (!kind) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('span'); b.className = 'kz66-badge'; b.setAttribute('aria-hidden', 'true'); a.appendChild(b); }
      b.className = 'kz66-badge ' + kind; b.textContent = kind === 'won' ? '66 ✓' : '66';
    });
  }

  var raf = 0;
  function paintAll() { raf = 0; try { todayCard(); } catch (e) {} try { goalPage(); } catch (e) {} try { grove(); } catch (e) {} try { moment(); } catch (e) {} }
  function soon() { if (!raf) raf = requestAnimationFrame(paintAll); }
  function boot() {
    if (store().run) settle();
    paintAll();
    ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync', 'kz:k66'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(soon, 30); }); });
    window.addEventListener('pageshow', soon);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { if (store().run) settle(); soon(); } });
    var main = document.getElementById('kz-main') || document.body;
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kz66-card, .kz66-gp, .kz66-over')) continue; soon(); return; } }).observe(main, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztweak-1026k.js ==== */
;try {
/* Oct 26 k (from j): the Reminders X is placed where the sheet will land (its layout box, not its sliding image) and only
   fades in once the sheet has landed, so it never drifts up the screen.
   Oct 26 j · James's night list (behaviour; styles in kztweak-1026k.css).
   3 · Done today: completed rows always show their day dots (a folded long-term goal unfolds there) and can't be folded.
   5 · Reminders: an X pinned to the sheet's top-right closes it (it is a Done button underneath: [data-n-done]). */
(function () {
  if (window.__kzTweakK) return; window.__kzTweakK = 1;
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function done() {
    var s = document.querySelector('#kz-today-s1 .kz-donesec'); if (!s) return;
    s.querySelectorAll('.kz-grow.compact').forEach(function (r) { r.classList.remove('compact'); });
    s.querySelectorAll('[data-kz-expand]').forEach(function (t) {
      if (t.getAttribute('aria-expanded') !== 'true') t.setAttribute('aria-expanded', 'true');
      if (t.getAttribute('role') === 'button') t.removeAttribute('role');
      if (t.getAttribute('tabindex') !== '-1') t.setAttribute('tabindex', '-1');
    });
  }
  function rem() {
    var l = document.querySelector('.kzn-sheet'), w = l && l.querySelector('.kzsw'); if (!w) return;
    var b = l.querySelector(':scope > .kzn-x');
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'kzn-x'; b.setAttribute('data-n-done', ''); b.setAttribute('aria-label', 'Close'); b.innerHTML = X; l.appendChild(b); }
    // layout position (offsetTop/Left ignore the slide-up transform): where the sheet's corner ends up
    var t = Math.max(8, w.offsetTop + 14) + 'px', rt = Math.max(8, l.clientWidth - (w.offsetLeft + w.offsetWidth) + 14) + 'px';
    if (b.style.top !== t) b.style.top = t; if (b.style.right !== rt) b.style.right = rt;
  }
  window.addEventListener('resize', function () { soon(); });
  // a tap on a done row's body does nothing (its buttons and links still work); runs before the row's own fold handler
  function swallow(e) {
    var t = e.target; if (!t.closest) return;
    if (!t.closest('#kz-today-s1 .kz-donesec [data-kz-expand]') || t.closest('a, button, textarea, input')) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    e.stopPropagation();
  }
  document.addEventListener('click', swallow, true); document.addEventListener('keydown', swallow, true);
  var q = 0;
  function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { done(); } catch (e) {} try { rem(); } catch (e) {} }); }
  function boot() { soon(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kznotes-1029.js ==== */
;try {
/* kznotes-1029.js · Oct 29: replaces kznotes-1026j.js (Edit note no longer opens with the keyboard up). */
/* Oct 26 j · Note to self (James): a short thought, typed or dictated, at any time, optionally tagged with a branch.
   Saved on the phone as kz_notes: [{ id, t: created ISO, u: edited ISO, txt, path: branch id or '' }], newest first.
   Open it from the + sheet ("Note to self") or Journal → Notes ("New note"). Journal → Notes lists them by month,
   filters by branch, and opens one to edit or delete. Styles: kznotes-1026j.css (self-contained: every page loads it). */
(function () {
  var K = window.KZ; if (!K || K.__kznotes) return; K.__kznotes = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>';
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // ---------- data ----------
  function all() { var a = K.get('notes', []); return Array.isArray(a) ? a.filter(function (n) { return n && n.id && typeof n.txt === 'string'; }) : []; }
  function save(list) { K.set('notes', list); document.dispatchEvent(new CustomEvent('kz:notes')); }
  function paths() { return (K.PATHS || []).filter(function (p) { return p && p.id && p.name; }); }
  function pathOf(id) { return paths().filter(function (p) { return p.id === id; })[0] || null; }
  function newId() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  K.notes = all;
  K.addNote = function (txt, path) { txt = String(txt || '').trim(); if (!txt) return null; var now = new Date().toISOString(), n = { id: newId(), t: now, u: now, txt: txt.slice(0, 4000), path: path || '' }; var l = all(); l.unshift(n); save(l); try { K.track('kz_note_add'); } catch (e) {} return n; };
  K.updateNote = function (id, txt, path) { var l = all(), n = l.filter(function (x) { return x.id === id; })[0]; if (!n) return; n.txt = String(txt || '').trim().slice(0, 4000); n.path = path || ''; n.u = new Date().toISOString(); save(l); };
  K.deleteNote = function (id) { save(all().filter(function (x) { return x.id !== id; })); };

  // ---------- the sheet ----------
  var layer = null;
  function chips(sel) {
    return '<button type="button" class="kznt-chip' + (!sel ? ' on' : '') + '" data-nt-path="" aria-pressed="' + !sel + '">None</button>' +
      paths().map(function (p) { var on = p.id === sel; return '<button type="button" class="kznt-chip' + (on ? ' on' : '') + '" data-nt-path="' + esc(p.id) + '" aria-pressed="' + on + '" style="--c:' + esc(p.c2 || '#E2B93B') + '"><i aria-hidden="true"></i>' + esc(p.name) + '</button>'; }).join('');
  }
  K.openNote = function (id) {
    if (layer) return;
    var n = id ? all().filter(function (x) { return x.id === id; })[0] : null, path = n ? n.path : '';
    layer = document.createElement('div'); layer.className = 'kznt-back'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-labelledby', 'kznt-t');
    layer.innerHTML = '<div class="kznt-sheet">' +
      '<div class="kznt-bar"><button type="button" class="kznt-cancel" data-nt="cancel">Cancel</button><h2 id="kznt-t">' + (n ? 'Edit note' : 'Note to self') + '</h2><button type="button" class="kznt-save" data-nt="save" disabled>Save</button></div>' +
      '<div class="kznt-body"><textarea class="kznt-txt" rows="4" maxlength="4000" placeholder="What’s on your mind?" aria-label="Note">' + (n ? esc(n.txt) : '') + '</textarea>' +
      '<div class="kznt-mic"></div>' +
      '<p class="kznt-lab">Branch</p><div class="kznt-chips" role="group" aria-label="Branch">' + chips(path) + '</div>' +
      (n ? '<button type="button" class="kznt-del" data-nt="del">Delete note</button>' : '') + '</div></div>';
    document.body.appendChild(layer); document.body.classList.add('kz-noscroll');
    var ta = layer.querySelector('.kznt-txt'), sv = layer.querySelector('[data-nt="save"]');
    var check = function () { sv.disabled = !ta.value.trim(); };
    ta.addEventListener('input', check); check();
    try { if (K.autoGrow) K.autoGrow(ta); } catch (e) {}
    try { if (K.dictate) K.dictate(ta, layer.querySelector('.kznt-mic')); } catch (e) {}
    layer.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nt-path]');
      if (b) { path = b.getAttribute('data-nt-path'); layer.querySelectorAll('[data-nt-path]').forEach(function (c) { var on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); }); return; }
      var a = e.target.closest('[data-nt]'); var act = a && a.getAttribute('data-nt');
      if (e.target === layer || act === 'cancel') { close(); return; }
      if (act === 'save' && ta.value.trim()) { if (n) K.updateNote(n.id, ta.value, path); else K.addNote(ta.value, path); close(); try { K.toast(n ? 'Note saved' : 'Saved to Journal → Notes'); } catch (er) {} return; }
      if (act === 'del') { if (a.classList.contains('sure')) { K.deleteNote(n.id); close(); try { K.toast('Note deleted'); } catch (er) {} } else { a.classList.add('sure'); a.textContent = 'Tap again to delete'; } }
    });
    layer.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
    // Oct 29 (James): editing a note opens it to read first; the keyboard comes up only when you tap the text. A new note opens ready to type.
    if (!n) { try { ta.focus({ preventScroll: true }); var v = ta.value; ta.setSelectionRange(v.length, v.length); } catch (e) {} }
  };
  function close() {
    if (!layer) return; var l = layer; layer = null; l.classList.remove('on');
    try { if (document.activeElement && l.contains(document.activeElement)) document.activeElement.blur(); } catch (e) {}
    setTimeout(function () { l.remove(); if (!document.querySelector('.kz-sheet49:not([hidden]), .kzsw-back, .kznt-back')) document.body.classList.remove('kz-noscroll'); }, 260);
  }

  // ---------- entry 1: the + sheet ----------
  function addEntry() {
    var sh = document.querySelector('.kz-addsheet'); if (!sh) return;
    var seg = sh.querySelector('.kz-kindseg'), cur = sh.querySelector('.kznt-entry'), t = sh.querySelector('[id^="kz-add-t"], h2');
    var editing = !!(t && /^\s*Edit/i.test(t.textContent)); // the same sheet edits a goal: no note entry there
    if (editing) { if (cur) cur.remove(); return; }
    if (!seg || cur) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kznt-entry'; b.innerHTML = PEN + '<span>Note to self</span><em>Just a thought? Write it down</em>';
    seg.parentNode.insertBefore(b, seg.nextSibling);
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.kznt-entry')) return;
    e.preventDefault(); e.stopPropagation();
    var sh = e.target.closest('.kz-addsheet'), x = sh && sh.querySelector('.kz-iconbtn[aria-label="Close"]');
    if (x) x.click(); K.openNote();
  }, true);

  // ---------- entry 2: Journal → Notes ----------
  var filter = '';
  function when(iso) { var d = new Date(iso); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function month(iso) { return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
  function pane() {
    var el = document.getElementById('kz-nlist'); if (!el) return;
    var l = all(), used = {}; l.forEach(function (n) { if (n.path && pathOf(n.path)) used[n.path] = 1; });
    if (filter && !used[filter]) filter = '';
    var shown = l.filter(function (n) { return !filter || n.path === filter; }), last = '';
    var fl = Object.keys(used).length ? '<div class="kznt-filter" role="group" aria-label="Filter notes by branch"><button type="button" class="kznt-chip' + (!filter ? ' on' : '') + '" data-nt-filter="" aria-pressed="' + !filter + '">All</button>' +
      paths().filter(function (p) { return used[p.id]; }).map(function (p) { var on = filter === p.id; return '<button type="button" class="kznt-chip' + (on ? ' on' : '') + '" data-nt-filter="' + esc(p.id) + '" aria-pressed="' + on + '" style="--c:' + esc(p.c2 || '#E2B93B') + '"><i aria-hidden="true"></i>' + esc(p.name) + '</button>'; }).join('') + '</div>' : '';
    var h = '<button type="button" class="kznt-new" data-nt-new>' + PEN + '<span>New note</span></button>' + fl;
    if (!l.length) h += '<div class="kznt-empty"><b>No notes yet</b><span>Write or dictate a thought any time. Tag it with a branch to find it later.</span></div>';
    shown.forEach(function (n) {
      var m = month(n.t), p = pathOf(n.path);
      if (m !== last) { h += '<h3 class="kznt-month">' + esc(m) + '</h3>'; last = m; }
      h += '<article class="kznt-card" data-nt-id="' + esc(n.id) + '"' + (p ? ' style="--c:' + esc(p.c2 || '#E2B93B') + '"' : '') + '><div class="kznt-meta">' + (p ? '<span class="kznt-tag"><i aria-hidden="true"></i>' + esc(p.name) + '</span>' : '') + '<time>' + esc(when(n.t)) + '</time></div>' +
        '<p class="kznt-p">' + esc(n.txt) + '</p><button type="button" class="kznt-edit" data-nt-edit="' + esc(n.id) + '" aria-label="Edit this note">' + PEN + '<span>Edit</span></button></article>';
    });
    if (el.__h !== h) { el.__h = h; el.innerHTML = h; }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-nt-new],[data-nt-edit],[data-nt-filter]'); if (!t || !t.closest('#kz-nlist')) return;
    if (t.hasAttribute('data-nt-new')) K.openNote();
    else if (t.hasAttribute('data-nt-edit')) K.openNote(t.getAttribute('data-nt-edit'));
    else { filter = t.getAttribute('data-nt-filter'); pane(); }
  });
  document.addEventListener('kz:notes', pane);
  document.addEventListener('kz:pillars', pane);

  var q = 0;
  function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { addEntry(); } catch (e) {} }); }
  function boot() {
    pane(); addEntry();
    if (document.getElementById('kz-nlist') && location.hash === '#notes') { var b = document.querySelector('[data-jtab="notes"]'); if (b) b.click(); }
    new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzqnote-1027q.js ==== */
;try {
/* Oct 27 q · Quote/question sheet (the chat button at the top of every tab) gets a third choice (James): "Note to self".
   It closes the sheet and opens the same note page as the + sheet and Journal → Notes (K.openNote, kznotes-1026j):
   type or dictate, tag a branch if you like, Save → it's in Journal → Notes.
   Works with both sheets (Today's from kzfocus-1025m, the other tabs' from kzdaily-1026m): the row is added the moment
   the sheet is created, before it is drawn. */
(function () {
  var K = window.KZ; if (!K || K.__kzqnote) return; K.__kzqnote = 1;
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>';
  function add(s) {
    var pane = s.querySelector('.kzf-qs-in'), x = pane && pane.querySelector('[data-q="x"]'); if (!pane || !x || pane.querySelector('.kzqn-b') || !K.openNote) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kzqn-b';
    b.innerHTML = '<b>' + PEN + 'Note to self</b><span>A quick thought, typed or dictated. Saved to Journal → Notes.</span>';
    pane.insertBefore(b, x);
    b.addEventListener('click', function (e) {
      e.stopPropagation(); x.click();   // the sheet closes the way it always does
      setTimeout(function () { try { K.openNote(); } catch (er) {} }, 300);
    });
  }
  function scan() { document.querySelectorAll('.kzf-qs').forEach(add); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && n.classList.contains('kzf-qs')) add(n); } }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzgrowth-1026m.js ==== */
;try {
/* Oct 26 m · The Grove tab is called Growth (James), and its header counts only the goals you're growing now
   (it counted archived ones too: "10 trees" with 7 on screen). The count is shown from a data attribute so the
   grove's own redraw (which writes the old text) and this file never fight. Links that said "Grove ›" say "Growth ›". */
(function () {
  var K = window.KZ; if (!K || window.__kzGrowth) return; window.__kzGrowth = 1;
  function run() {
    var b = document.querySelector('#kz-header .kz-htitle b'); if (b && b.textContent.trim() === 'Grove') b.textContent = 'Growth';
    if (/^(Grove|Tree)\b/.test(document.title)) document.title = document.title.replace(/^(Grove|Tree)/, 'Growth');
    var sub = document.querySelector('#kz-header .kz-htitle .kzpb-sub'), rows = document.querySelectorAll('.kzg-rows > .kzg-row');
    if (sub && document.querySelector('.kzg-rows')) { var n = rows.length, t = n + (n === 1 ? ' tree' : ' trees'); if (sub.getAttribute('data-n') !== t) sub.setAttribute('data-n', t); }
    document.querySelectorAll('a[href="/pages/profile"]').forEach(function (a) { if (a.textContent.trim() === 'Grove ›') a.textContent = 'Growth ›'; });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { run(); } catch (e) {} }); }
  function boot() { run(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 52fe2d066330.js ==== */
;try {

window.KZQ = window.KZQ || (function () {
  var Q = [{"d": "2026-10-03", "q": "Who you are isn't decided once. It's decided daily, in small, boring choices.", "a": "", "n": "What did your first hour today say about who you're becoming?", "p": "mind"}, {"d": "2026-10-04", "q": "The person you're becoming is built in the hours nobody sees.", "a": "", "n": "What do you do when no one's watching that you're proud of?", "p": "mind"}, {"d": "2026-10-05", "q": "Most of what you call 'stuck' is a decision you haven't admitted you made.", "a": "", "n": "Where in your life are you waiting for permission?", "p": "mind"}, {"d": "2026-10-06", "q": "If your habits stayed exactly the same for five years, would you like who that makes you?", "a": "", "n": "Which habit would you keep? Which would you drop?", "p": "mind"}, {"d": "2026-10-07", "q": "Comfort isn't the enemy. Staying there long after it stopped teaching you is.", "a": "", "n": "What has stopped teaching you anything?", "p": "mind"}, {"d": "2026-10-08", "q": "You don't have to feel ready. You have to be willing to move before the feeling shows up.", "a": "", "n": "What would you start today if you didn't need to feel ready?", "p": "mind"}, {"d": "2026-10-09", "q": "Be careful what you practice on bad days. That's who you are when it counts.", "a": "", "n": "How do you treat yourself on a bad day?", "p": "mind"}, {"d": "2026-10-10", "q": "Discipline is remembering what you want when what you want right now is louder.", "a": "", "n": "What do you want more than what's in front of you?", "p": "mind"}, {"d": "2026-10-11", "q": "You're allowed to outgrow the version of you that other people got used to.", "a": "", "n": "Who are you still performing for?", "p": "mind"}, {"d": "2026-10-12", "q": "Progress feels like nothing until the day you look back.", "a": "", "n": "What's something you do easily now that used to be hard?", "p": "mind"}, {"d": "2026-10-13", "q": "A small promise kept to yourself is worth more than a big one made to everyone.", "a": "", "n": "What's one promise you can keep to yourself today?", "p": "mind"}, {"d": "2026-10-14", "q": "Envy is information. It points at something you want but haven't claimed.", "a": "", "n": "Who did you envy lately, and what were you actually wanting?", "p": "mind"}, {"d": "2026-10-15", "q": "Some rooms are too small for who you're becoming.", "a": "", "n": "Where do you feel smaller than you really are?", "p": "mind"}, {"d": "2026-10-16", "q": "The opposite of lost isn't found. It's curious.", "a": "", "n": "What are you curious about right now, even a little?", "p": "mind"}, {"d": "2026-10-17", "q": "You don't find yourself. You notice yourself, one honest day at a time.", "a": "", "n": "What did you notice about yourself this week that surprised you?", "p": "mind"}, {"d": "2026-10-18", "q": "Boredom is where most people quit, and where most results begin.", "a": "", "n": "What did you quit right before it could have gotten interesting?", "p": "mind"}, {"d": "2026-10-19", "q": "Your attention is the rent you pay for your life.", "a": "", "n": "What took most of your attention today, and did it deserve it?", "p": "mind"}, {"d": "2026-10-20", "q": "Rest is part of the work. Burnout isn't a badge.", "a": "", "n": "What would real rest look like for you this week?", "p": "mind"}, {"d": "2026-10-21", "q": "Silence isn't always peace. Sometimes it's a hard thing you haven't said kindly yet.", "a": "", "n": "What conversation have you been avoiding?", "p": "mind"}, {"d": "2026-10-22", "q": "You won't always be motivated. Build a life that doesn't need you to be.", "a": "", "n": "What's one good thing you could make automatic?", "p": "mind"}, {"d": "2026-10-23", "q": "Not every season is for blooming. Some are for roots.", "a": "", "n": "If this season is for roots, what's growing underneath?", "p": "mind"}, {"d": "2026-10-24", "q": "Failure is just data with feelings attached.", "a": "", "n": "What did your last mistake actually teach you?", "p": "mind"}, {"d": "2026-10-25", "q": "Busy is easy. Honest is hard.", "a": "", "n": "What are you staying busy to avoid?", "p": "mind"}, {"d": "2026-10-26", "q": "Compare yourself to who you were, and be kind about who that was.", "a": "", "n": "What would you tell yourself from a year ago?", "p": "mind"}, {"d": "2026-10-27", "q": "You don't need a new life. You need a new next hour.", "a": "", "n": "What will you do with the next hour?", "p": "mind"}, {"d": "2026-10-28", "q": "What you tolerate quietly becomes what you expect.", "a": "", "n": "What have you been tolerating?", "p": "mind"}, {"d": "2026-10-29", "q": "Gratitude doesn't erase the hard part. It keeps the hard part from being the only part.", "a": "", "n": "Name one good thing from today, however small.", "p": "mind"}, {"d": "2026-10-30", "q": "Courage is mostly quiet. It looks like showing up again.", "a": "", "n": "Where did you show up today when you didn't want to?", "p": "mind"}, {"d": "2026-10-31", "q": "The story you tell about yourself is a draft. You're allowed to edit it.", "a": "", "n": "What line in your story do you want to rewrite?", "p": "mind"}, {"d": "2026-11-01", "q": "If it only lives on 'someday,' it isn't real yet.", "a": "", "n": "What's been living on 'someday' too long?", "p": "mind"}, {"d": "2026-11-02", "q": "People change in small, unglamorous ways long before anyone notices.", "a": "", "n": "What's quietly changing in you?", "p": "mind"}, {"d": "2026-11-03", "q": "Feelings are visitors. Let them in. Don't hand them the keys.", "a": "", "n": "What feeling has been driving lately?", "p": "mind"}, {"d": "2026-11-04", "q": "Your phone is full of other people's lives. Spend some time in yours.", "a": "", "n": "What would you do with one hour away from your phone?", "p": "mind"}, {"d": "2026-11-05", "q": "Strength isn't never falling apart. It's knowing how to come back to yourself.", "a": "", "n": "What helps you come back to yourself?", "p": "mind"}, {"d": "2026-11-06", "q": "Ask for help before you need to be rescued.", "a": "", "n": "Who could you lean on a little more?", "p": "mind"}, {"d": "2026-11-07", "q": "Clarity comes from doing, not from thinking longer.", "a": "", "n": "What small step would teach you more than another week of thinking?", "p": "mind"}, {"d": "2026-11-08", "q": "You already know more than you're admitting to yourself.", "a": "", "n": "What do you know that you've been pretending not to?", "p": "mind"}, {"d": "2026-11-09", "q": "You can be a work in progress and still be worth something today.", "a": "", "n": "What's one thing you like about who you are right now?", "p": "mind"}, {"d": "2026-11-10", "q": "Effort nobody claps for still counts. Especially that.", "a": "", "n": "What are you proud of that no one saw?", "p": "mind"}, {"d": "2026-11-11", "q": "Do fewer things. Do them like they matter.", "a": "", "n": "What could you stop doing to make room for what matters?", "p": "mind"}, {"d": "2026-11-12", "q": "Your values are what you do when it costs you something.", "a": "", "n": "What did you choose this week that cost you something?", "p": "mind"}, {"d": "2026-11-13", "q": "Growth can feel like loss at first. You're letting go of who you were.", "a": "", "n": "What are you ready to let go of?", "p": "mind"}, {"d": "2026-11-14", "q": "The mountain you're climbing is made of ordinary Tuesdays.", "a": "", "n": "What does an ordinary good day look like for you?", "p": "mind"}, {"d": "2026-11-15", "q": "Every person you admire once felt as lost as you might feel now.", "a": "", "n": "Whose path do you admire, and what did their first year look like?", "p": "mind"}, {"d": "2026-11-16", "q": "Quiet the noise long enough to hear what you actually want.", "a": "", "n": "If no one would judge you, what would you go after?", "p": "mind"}, {"d": "2026-11-17", "q": "Your future self is watching what you do with today. Not judging. Just learning.", "a": "", "n": "What would your future self thank you for doing today?", "p": "mind"}, {"d": "2026-11-18", "q": "The things you avoid don't disappear. They wait, and they get heavier.", "a": "", "n": "What's one thing you've been avoiding that you could do in five minutes?", "p": "mind"}, {"d": "2026-11-19", "q": "You can't steer a parked car. Move a little, then adjust.", "a": "", "n": "Where are you waiting for a perfect plan instead of starting?", "p": "mind"}, {"d": "2026-11-20", "q": "Loneliness isn't proof you're unlovable. It's a signal to reach out.", "a": "", "n": "Who's one person you could message today, just to say hi?", "p": "mind"}, {"d": "2026-11-21", "q": "Saying no to the wrong things is how you say yes to your life.", "a": "", "n": "What did you say yes to that you wish you hadn't?", "p": "mind"}, {"d": "2026-11-22", "q": "Your mood is weather. Your values are climate.", "a": "", "n": "What do you still believe in, even on a gray day?", "p": "mind"}, {"d": "2026-11-23", "q": "Most people overestimate a week and underestimate a year.", "a": "", "n": "What could a year of small, steady effort turn into for you?", "p": "mind"}, {"d": "2026-11-24", "q": "Confidence is a receipt for things you've already done.", "a": "", "n": "What have you done that proves you can do hard things?", "p": "mind"}, {"d": "2026-11-25", "q": "You get to be a beginner more than once in your life.", "a": "", "n": "What would you try if being bad at it first was okay?", "p": "mind"}, {"d": "2026-11-26", "q": "The way you talk to yourself is the voice you'll hear the most.", "a": "", "n": "What did your inner voice say today? Would you say it to a friend?", "p": "mind"}, {"d": "2026-11-27", "q": "A quiet morning is a decision you make the night before.", "a": "", "n": "What could you set up tonight to make tomorrow easier?", "p": "mind"}, {"d": "2026-11-28", "q": "Busy feels good. Progress is good. They're not the same thing.", "a": "", "n": "What actually moved forward today?", "p": "mind"}, {"d": "2026-11-29", "q": "Your environment is stronger than your willpower. Design it.", "a": "", "n": "What in your space pulls you away from who you want to be?", "p": "mind"}, {"d": "2026-11-30", "q": "Old habits don't die. They get replaced.", "a": "", "n": "What habit could take the place of one you want to drop?", "p": "mind"}, {"d": "2026-12-01", "q": "You don't have to see the whole path to take the next step.", "a": "", "n": "What's the next step you can see right now?", "p": "mind"}, {"d": "2026-12-02", "q": "The hardest part of growing is admitting you need to.", "a": "", "n": "Where are you too proud to grow?", "p": "mind"}, {"d": "2026-12-03", "q": "If you're always waiting for the weekend, look at your weekdays.", "a": "", "n": "What would make an ordinary weekday worth looking forward to?", "p": "mind"}, {"d": "2026-12-04", "q": "Kindness to yourself is harder to see than kindness to others. It counts the same.", "a": "", "n": "How can you be a little kinder to yourself today?", "p": "mind"}, {"d": "2026-12-05", "q": "Every 'I'll start Monday' is a small vote for not starting.", "a": "", "n": "What can you start today, in the smallest possible way?", "p": "mind"}, {"d": "2026-12-06", "q": "Sleep, water, food, movement. Most bad days start with skipping one.", "a": "", "n": "Which basic have you been skipping lately?", "p": "mind"}, {"d": "2026-12-07", "q": "Good friends ask how you are. Great friends ask a second time.", "a": "", "n": "Who in your life might need you to ask twice?", "p": "mind"}, {"d": "2026-12-08", "q": "Patience isn't waiting. It's how you act while you wait.", "a": "", "n": "What are you waiting on, and how are you spending the wait?", "p": "mind"}, {"d": "2026-12-09", "q": "When you stop comparing, you start noticing your own path.", "a": "", "n": "What part of your path is only yours?", "p": "mind"}, {"d": "2026-12-10", "q": "Some days the win is just not quitting.", "a": "", "n": "What kept you going on your last hard day?", "p": "mind"}, {"d": "2026-12-11", "q": "You're not behind. There's no single clock everyone runs on.", "a": "", "n": "Whose timeline have you been measuring yourself against?", "p": "mind"}, {"d": "2026-12-12", "q": "The truth you avoid usually costs more than the truth you face.", "a": "", "n": "What truth would make your life lighter if you finally said it?", "p": "mind"}, {"d": "2026-12-13", "q": "Curiosity is a better teacher than fear.", "a": "", "n": "What's a question you'd love to know the answer to?", "p": "mind"}, {"d": "2026-12-14", "q": "A thought on paper is a thought you can work with.", "a": "", "n": "What's been spinning in your head that you could write down right now?", "p": "mind"}, {"d": "2026-12-15", "q": "You can love where you came from and still choose where you're going.", "a": "", "n": "What did your past give you that you want to keep?", "p": "mind"}, {"d": "2026-12-16", "q": "Small wins are still wins. Count them.", "a": "", "n": "Name three small wins from this week.", "p": "mind"}, {"d": "2026-12-17", "q": "Discomfort is often the feeling of growing, not the feeling of failing.", "a": "", "n": "What felt uncomfortable lately that might actually be growth?", "p": "mind"}, {"d": "2026-12-18", "q": "The goal isn't to never fall off. It's to get back on faster.", "a": "", "n": "When you fall off, what helps you get back on?", "p": "mind"}, {"d": "2026-12-19", "q": "Don't let one bad hour become a bad day.", "a": "", "n": "What's one way you can reset when an hour goes wrong?", "p": "mind"}, {"d": "2026-12-20", "q": "Whatever you practice grows stronger. Worry included.", "a": "", "n": "What have you been practicing without meaning to?", "p": "mind"}, {"d": "2026-12-21", "q": "Listening is a way of saying 'you matter' without words.", "a": "", "n": "When did you last really listen to someone?", "p": "mind"}, {"d": "2026-12-22", "q": "Keep going after it stops being fun. That's where it starts to count.", "a": "", "n": "What's worth continuing even now that it's not exciting?", "p": "mind"}, {"d": "2026-12-23", "q": "Learn one small thing a day and you'll be a different person in a year.", "a": "", "n": "What did you learn today, even something tiny?", "p": "mind"}, {"d": "2026-12-24", "q": "Forgiveness isn't saying it was okay. It's deciding it won't run your life.", "a": "", "n": "What are you still carrying that you could set down?", "p": "mind"}, {"d": "2026-12-25", "q": "Plans are guesses. Adjust them without guilt.", "a": "", "n": "What plan needs adjusting, and what's the new guess?", "p": "mind"}, {"d": "2026-12-26", "q": "Don't wait for your energy to refill itself. Go find what refills it.", "a": "", "n": "What actually refills you?", "p": "mind"}, {"d": "2026-12-27", "q": "Notice what's going right. It's easy to miss because it's quiet.", "a": "", "n": "What's going right that you haven't noticed?", "p": "mind"}, {"d": "2026-12-28", "q": "Mistakes prove you're trying. Repeating them proves you're not listening.", "a": "", "n": "What mistake keeps showing up for you?", "p": "mind"}, {"d": "2026-12-29", "q": "Big trust is built from small promises kept.", "a": "", "n": "What small promise can you keep to someone today?", "p": "mind"}, {"d": "2026-12-30", "q": "It's okay to change your mind. That's what minds are for.", "a": "", "n": "What have you changed your mind about this year?", "p": "mind"}, {"d": "2026-12-31", "q": "Rest before you're empty, not after.", "a": "", "n": "Where do you need rest before it gets to that point?", "p": "mind"}, {"d": "2027-01-01", "q": "Your phone will always have something new. Today only happens once.", "a": "", "n": "What would make today feel full, offline?", "p": "mind"}, {"d": "2027-01-02", "q": "Hard conversations get easier the moment they start.", "a": "", "n": "What's the first sentence of a conversation you've been putting off?", "p": "mind"}, {"d": "2027-01-03", "q": "Don't confuse a hard season with a hard life.", "a": "", "n": "What season are you in right now, and what is it teaching you?", "p": "mind"}, {"d": "2027-01-04", "q": "Effort without direction is tiring. Direction without effort is a daydream.", "a": "", "n": "Which do you need more of right now: effort or direction?", "p": "mind"}, {"d": "2027-01-05", "q": "Look at how far you've come before you measure how far you have to go.", "a": "", "n": "How far have you come since this time last year?", "p": "mind"}, {"d": "2027-01-06", "q": "Ask yourself better questions and your life gives better answers.", "a": "", "n": "What's a better question you could be asking yourself?", "p": "mind"}, {"d": "2027-01-07", "q": "You become what you repeat.", "a": "", "n": "What do you repeat most days, and where is it taking you?", "p": "mind"}, {"d": "2027-01-08", "q": "Generosity isn't about having a lot. It's about noticing someone.", "a": "", "n": "Who could use a little of your time this week?", "p": "mind"}, {"d": "2027-01-09", "q": "Anxiety asks 'what if.' Courage asks 'what now.'", "a": "", "n": "What's the 'what now' in your situation?", "p": "mind"}, {"d": "2027-01-10", "q": "The best routine is the one you'll still do on a bad day.", "a": "", "n": "What's the smallest version of your routine that still counts?", "p": "mind"}, {"d": "2027-01-11", "q": "Your worth isn't a grade, a number or a follower count.", "a": "", "n": "Where do you look for proof that you're enough?", "p": "mind"}, {"d": "2027-01-12", "q": "Finishing is a skill. Practice it today.", "a": "", "n": "What's one thing you can finish today?", "p": "mind"}, {"d": "2027-01-13", "q": "Comfort zones don't grow. They just get more comfortable.", "a": "", "n": "What's one step just outside your comfort zone?", "p": "mind"}, {"d": "2027-01-14", "q": "Want a different result? Change one input. Just one.", "a": "", "n": "What's the one input you could change this week?", "p": "mind"}, {"d": "2027-01-15", "q": "You leave a little of yourself in every room. Make it something good.", "a": "", "n": "How did you make someone feel today?", "p": "mind"}, {"d": "2027-01-16", "q": "Not everything that weighs on you is yours to carry.", "a": "", "n": "What are you carrying that belongs to someone else?", "p": "mind"}, {"d": "2027-01-17", "q": "Slow progress is still faster than standing still.", "a": "", "n": "Where are you making slow progress that deserves credit?", "p": "mind"}, {"d": "2027-01-18", "q": "Being honest about what you don't know is the start of knowing it.", "a": "", "n": "What don't you know yet that you'd like to?", "p": "mind"}, {"d": "2027-01-19", "q": "A walk won't fix everything. It fixes more than you'd think.", "a": "", "n": "When did you last move just for how it makes you feel?", "p": "mind"}, {"d": "2027-01-20", "q": "What happened to you is part of your story. It isn't the whole thing.", "a": "", "n": "What part of your story are you writing now?", "p": "mind"}, {"d": "2027-01-21", "q": "Ambition is good. Ambition with patience is better.", "a": "", "n": "What are you rushing that deserves more time?", "p": "mind"}, {"d": "2027-01-22", "q": "Clear one small space and your head often follows.", "a": "", "n": "What small space could you clear today?", "p": "mind"}, {"d": "2027-01-23", "q": "Fear is loud about what could go wrong and silent about what could go right.", "a": "", "n": "What did fear talk you out of recently?", "p": "mind"}, {"d": "2027-01-24", "q": "Spend time with people who make you want to grow, not just people who make it easy to stay.", "a": "", "n": "Who makes you want to be better?", "p": "mind"}, {"d": "2027-01-25", "q": "Joy doesn't need a reason. Let it in when it shows up.", "a": "", "n": "What made you smile this week?", "p": "mind"}, {"d": "2027-01-26", "q": "The work you're proud of usually started as work you were scared of.", "a": "", "n": "What scared you once and now makes you proud?", "p": "mind"}, {"d": "2027-01-27", "q": "Your best ideas need a little boredom to show up.", "a": "", "n": "When did you last let yourself be bored, without your phone?", "p": "mind"}, {"d": "2027-01-28", "q": "You can't change people. You can change how close you stand.", "a": "", "n": "Who do you need a little more distance from, or a little more closeness with?", "p": "mind"}, {"d": "2027-01-29", "q": "A setback is a detour, not a dead end.", "a": "", "n": "What detour are you on right now?", "p": "mind"}, {"d": "2027-01-30", "q": "Show up as yourself. The right people will recognize you.", "a": "", "n": "Where do you hide who you really are?", "p": "mind"}, {"d": "2027-01-31", "q": "Thinking about your goals is not the same as working on them.", "a": "", "n": "What's one thing you can do, not plan, today?", "p": "mind"}, {"d": "2027-02-01", "q": "The quiet things you do every day become the loud things people see later.", "a": "", "n": "What quiet habit are you building right now?", "p": "mind"}, {"d": "2027-02-02", "q": "You don't need everyone to understand your path.", "a": "", "n": "Whose approval are you still waiting for?", "p": "mind"}, {"d": "2027-02-03", "q": "Your energy is limited. Spend it like money.", "a": "", "n": "What drained your energy today that wasn't worth it?", "p": "mind"}, {"d": "2027-02-04", "q": "Every day you show up, you tell yourself what matters.", "a": "", "n": "What did showing up today say about what matters to you?", "p": "mind"}, {"d": "2027-02-05", "q": "Breathe before you answer. Most regrets are fast.", "a": "", "n": "When did reacting too fast cost you something?", "p": "mind"}, {"d": "2027-02-06", "q": "Feedback is a gift you only get to open by listening.", "a": "", "n": "What feedback have you gotten that you haven't used yet?", "p": "mind"}, {"d": "2027-02-07", "q": "Being young isn't a reason to wait. It's a reason to try.", "a": "", "n": "What would you try if you knew you had time to recover from failing?", "p": "mind"}, {"d": "2027-02-08", "q": "Easy days are earned on the hard ones.", "a": "", "n": "What hard day made a later day easier?", "p": "mind"}, {"d": "2027-02-09", "q": "Who you're becoming matters more than what you're getting.", "a": "", "n": "Who are you becoming, honestly?", "p": "mind"}, {"d": "2027-02-10", "q": "Compare your life to your own last month, not someone else's highlight reel.", "a": "", "n": "What's different about you compared to a month ago?", "p": "mind"}, {"d": "2027-02-11", "q": "Endings make room. Even the sad ones.", "a": "", "n": "What ending made room for something new in your life?", "p": "mind"}, {"d": "2027-02-12", "q": "Steady beats intense. Every time.", "a": "", "n": "Where are you going too hard, then stopping?", "p": "mind"}, {"d": "2027-02-13", "q": "You're allowed to start over as many times as it takes.", "a": "", "n": "What do you want to start fresh this week?", "p": "mind"}, {"d": "2027-02-14", "q": "Love the people in your life out loud. Yourself included.", "a": "", "n": "Who do you love that should hear it today?", "p": "mind"}];
  (function () { var n = Q.length; if (!n) return; Q.sort(function (a, b) { return a.d < b.d ? -1 : 1; }); var last = new Date(Q[n - 1].d + 'T12:00:00'), end = window.KZ.addDays(window.KZ.today(), 1), i = 0; for (var d = window.KZ.addDays(last, 1); d <= end && i < 5000; d = window.KZ.addDays(d, 1), i++) { var b = Q[i % n]; Q.push({ d: window.KZ.key(d), q: b.q, a: b.a, n: b.n, p: b.p }); } })();
  var tk = window.KZ.key(window.KZ.today());
  if (!Q.length) Q = [{ d: tk, q: 'Get 1% better than yesterday.', a: '', n: '' }];
  Q.forEach(function (x) { if (/^\s*kaizen\s*$/i.test(x.a || '')) x.a = ''; }); // no "— Kaizen" signature on our own quotes
  Q.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  var unlocked = Q.filter(function (x) { return x.d <= tk; });
  if (!unlocked.length) unlocked = [Q[0]];
  return { all: Q, unlocked: unlocked, today: unlocked[unlocked.length - 1], dayNo: function (x) { return String(Q.indexOf(x) + 1).padStart(3, '0'); } };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzdaily-1030.js ==== */
;try {
/* Oct 30 · replaces kzdaily-1026m.js: before 5 PM the question popup says "Tonight's question" (same as Today, index.html). */
/* Oct 26 m · The header on every tab matches Today (James): the quote / today's-question button and the gold + (add a goal).
   Today keeps its own (index.html + kzfocus-1025m). On the other tabs this file adds both buttons to #kz-header .kz-hright.
   The quote button opens the same chooser: Quote of the day (the face-down card that flips, then Rate & reflect) or
   Today's question. Everything is saved exactly as Today saves it: kz_qflip, kz_rate, kz_thought, kz_journal, kz_qseen
   is untouched (only Today opens things by itself). Needs window.KZQ (core/52fe2d066330.js) for the quote; without it
   only the + shows. Styles: kzdaily-1026m.css. */
(function () {
  var K = window.KZ; if (!K || K.__kzdaily) return; K.__kzdaily = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var X = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var STAR = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  function tk() { return K.key(K.today()); }
  function cur() { return window.KZQ && window.KZQ.today; }
  function noscroll(on) {
    if (on) { document.body.classList.add('kz-noscroll'); post({ type: 'pageScroll', on: false }); return; }
    if (!document.querySelector('.kz-qcard, .kzdy-modal:not([hidden]), .kzf-qs, .kz-sheet49:not([hidden])')) { document.body.classList.remove('kz-noscroll'); post({ type: 'pageScroll', on: true }); }
  }
  function changed() { try { if (K.updateStreak) K.updateStreak(); } catch (e) {} post({ type: 'dirty' }); document.dispatchEvent(new CustomEvent('kz:changed')); }

  // ---------- Quote of the day: the card ----------
  function openCard() {
    var q = cur(); if (!q || document.querySelector('.kz-qcard')) return;
    var f = K.get('qflip', '') === tk(), o = document.createElement('div');
    o.className = 'kz-qcard' + (f ? ' up' : ''); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Quote of the day');
    o.innerHTML = '<button type="button" class="kz-qc-card" aria-label="' + (f ? 'Quote of the day' : 'Turn the card over') + '">' +
      '<span class="kz-qc-face kz-qc-back" aria-hidden="true"><svg viewBox="56 52 88 78"><defs><linearGradient id="kzdyg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E7A6"/><stop offset=".35" stop-color="#D4AF37"/><stop offset=".6" stop-color="#9A7424"/><stop offset=".8" stop-color="#E8CC78"/><stop offset="1" stop-color="#C9A13A"/></linearGradient></defs><path d="M64 122 H136 L100 60 L82 91" fill="none" stroke="url(#kzdyg)" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/></svg><b>KAIZEN</b><i>Tap to turn over</i></span>' +
      '<span class="kz-qc-face kz-qc-front"><span class="kz-qc-l">Quote of the day</span><span class="kz-qc-q"></span><span class="kz-qc-a"></span></span></button>' +
      '<div class="kz-qc-acts"><button type="button" class="kz-btn gold" data-qc="reflect">Rate &amp; reflect</button><button type="button" class="kz-qc-done" data-qc="close">Done</button></div>';
    o.querySelector('.kz-qc-q').textContent = '“' + q.q + '”'; o.querySelector('.kz-qc-a').textContent = q.a ? '— ' + q.a : '';
    document.body.appendChild(o); noscroll(true); try { K.track('kz_quote_card_open', { flipped: f }); } catch (e) {}
    requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add('in'); }); });
    var close = function (then) { o.classList.add('out'); setTimeout(function () { o.remove(); noscroll(false); if (then) then(); }, 320); };
    var card = o.querySelector('.kz-qc-card');
    card.addEventListener('click', function () {
      if (o.classList.contains('up')) return;
      o.classList.add('up', 'flip'); card.setAttribute('aria-label', 'Quote of the day'); post({ type: 'haptic', n: 1 }); try { if (K.sound) K.sound(); } catch (e) {}
      K.set('qflip', tk()); post({ type: 'dirty' }); try { K.track('kz_quote_card_flip'); } catch (e) {}
      setTimeout(function () { var b = o.querySelector('[data-qc=reflect]'); if (b) b.focus({ preventScroll: true }); }, 700);
    });
    o.addEventListener('click', function (e) { var b = e.target.closest('[data-qc]'); if (b && b.dataset.qc === 'reflect') close(openRate); else if (b || e.target === o) close(); });
    setTimeout(function () { card.focus({ preventScroll: true }); }, 60);
  }
  K.openQuoteCard = K.openQuoteCard || openCard;

  // ---------- popups: Rate & reflect, Today's question (same look as Today's) ----------
  function modal(inner, label) {
    var m = document.createElement('div'); m.className = 'kz-qmodal kzdy-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', label);
    m.innerHTML = '<div class="kz-qm-in">' + inner + '</div>'; document.body.appendChild(m); noscroll(true);
    var close = function () { if (!m.isConnected) return; m.remove(); noscroll(false); };
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-dy="close"]')) close(); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    setTimeout(function () { var c = m.querySelector('[data-dy="close"]'); if (c) c.focus({ preventScroll: true }); }, 30);
    return { el: m, close: close };
  }
  function openRate() {
    var q = cur(); if (!q) return; var day = tk(), stars = (K.get('rate', {}) || {})[day] || 0;
    var M = modal('<div class="kz-sheet-top"><span class="kz-label49 gold">Quote of the day</span><button type="button" class="kz-iconbtn" data-dy="close" aria-label="Close">' + X + '</button></div>' +
      '<blockquote class="kz-qm-quote"><p>' + esc('“' + q.q + '”') + '</p><cite>' + (q.a ? esc('— ' + q.a) : '') + '</cite></blockquote>' +
      '<div class="kz-qm-rate"><span class="kz-label49">How much did it land?</span><div class="kz-stars49" role="radiogroup" aria-label="Rate today\'s quote">' +
      [1, 2, 3, 4, 5].map(function (v) { return '<button type="button" role="radio" aria-checked="false" data-v="' + v + '" aria-label="' + v + ' star' + (v > 1 ? 's' : '') + '">' + STAR + '</button>'; }).join('') + '</div></div>' +
      '<label class="kz-field49"><span class="kz-label49">Your take <em>(optional)</em></span><textarea data-dy="note" rows="3" maxlength="600" placeholder="What does it mean for your day?"></textarea></label>' +
      '<button type="button" class="kz-btn gold" data-dy="save" disabled>Save to my journal</button><p class="kz-note49" data-dy="msg" aria-live="polite"></p>', 'Quote of the day');
    var el = M.el, note = el.querySelector('[data-dy="note"]'), save = el.querySelector('[data-dy="save"]'), msg = el.querySelector('[data-dy="msg"]');
    note.value = (K.get('thought', {}) || {})[day] || ''; msg.textContent = stars ? 'Saved. You can change it any time today.' : ''; save.textContent = stars ? 'Update' : 'Save to my journal';
    var paint = function () { el.querySelectorAll('[data-v]').forEach(function (b) { var on = +b.dataset.v <= stars; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(+b.dataset.v === stars)); }); save.disabled = !stars && !note.value.trim(); };
    paint();
    el.querySelector('.kz-stars49').addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b) return; stars = +b.dataset.v; paint(); post({ type: 'tick' }); });
    note.addEventListener('input', paint);
    save.addEventListener('click', function () {
      var r = K.get('rate', {}) || {}, t = K.get('thought', {}) || {}, v = note.value.trim();
      if (stars) r[day] = stars; K.set('rate', r);
      if (v) t[day] = v; else delete t[day]; K.set('thought', t);
      changed(); save.textContent = 'Update'; msg.textContent = 'Saved to Quote notes in your journal.';
      try { K.track('kz_quote_rated', { stars: stars, note: !!v }); } catch (e) {} post({ type: 'haptic', n: 2 });
      setTimeout(M.close, 1200);
    });
  }
  function openQuestion() {
    var q = cur(), day = tk(), ans = function () { return ((K.get('journal', {}) || {})[day] || '').trim(); };
    var early = new Date().getHours() < 17, LBL = early ? 'Tonight\u2019s question' : 'Today\u2019s question';   // Oct 30: the questions ask about "today"
    var PRIV = early ? 'Think about it today and answer tonight. Private to you, saved to your journal.' : 'Private to you. It\'s saved to your journal next to today\'s quote.';
    var M = modal('<div class="kz-sheet-top"><span class="kz-label49 gold">' + LBL + '</span><button type="button" class="kz-iconbtn" data-dy="close" aria-label="Close">' + X + '</button></div>' +
      '<h2 class="kz-rq" id="kzdy-rq">' + esc((q && q.n) || 'What did the quote change for you today?') + '</h2>' +
      '<textarea class="kz-jbox kz-rbox" data-dy="ta" rows="4" maxlength="2000" placeholder="Anything on your mind." aria-labelledby="kzdy-rq"></textarea>' +
      '<button type="button" class="kz-btn gold" data-dy="save" disabled>Save to my journal</button><p class="kz-note49" data-dy="msg" aria-live="polite"></p>', LBL);
    M.el.classList.add('kz-rmodal');
    var el = M.el, ta = el.querySelector('[data-dy="ta"]'), save = el.querySelector('[data-dy="save"]'), msg = el.querySelector('[data-dy="msg"]');
    ta.value = ans(); msg.textContent = ans() ? 'Saved. You can change it any time today.' : PRIV; save.textContent = ans() ? 'Update' : 'Save to my journal';
    ta.addEventListener('input', function () { var v = ta.value.trim(); save.disabled = !v || v === ans(); });
    save.addEventListener('click', function () {
      var v = ta.value.trim(); if (!v) return;
      var m = K.get('journal', {}) || {}; m[day] = v; K.set('journal', m); changed();
      try { K.track('kz_reflection_saved', { length: v.length }); } catch (e) {} post({ type: 'haptic', n: 2 });
      save.textContent = 'Update'; save.disabled = true; msg.textContent = 'Saved to your journal.';
      setTimeout(M.close, 1100);
    });
    try { K.track('kz_question_open'); } catch (e) {}
  }
  K.openQuestion = K.openQuestion || openQuestion;

  // ---------- the chooser (same sheet as Today's) ----------
  function chooser() {
    if (document.querySelector('.kzf-qs')) return;
    var q = cur(), day = tk(), flipped = K.get('qflip', '') === day, rated = (K.get('rate', {}) || {})[day], answered = !!((K.get('journal', {}) || {})[day] || '').trim();
    var s = document.createElement('div'); s.className = 'kzf-qs kzdy-qs'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', 'Quote and question');
    s.innerHTML = '<div class="kzf-qs-in"><button type="button" data-q="q"><b>Quote of the day' + (rated ? ' <i>' + rated + '★</i>' : flipped ? ' <i>✓</i>' : '') + '</b><span>' + esc(flipped ? '“' + q.q + '”' : 'Tap to turn over today’s card') + '</span></button>' +
      '<button type="button" data-q="a"><b>Today\'s question' + (answered ? ' <i>✓</i>' : '') + '</b><span>' + esc(q.n || '') + '</span></button>' +
      '<button type="button" class="kzf-qs-x" data-q="x">Close</button></div>';
    document.body.appendChild(s); noscroll(true);
    var pane = s.querySelector('.kzf-qs-in'), H = pane.getBoundingClientRect().height || 300, key = {};
    var put = function (y) { pane.style.transform = 'translateY(' + y.toFixed(1) + 'px)'; s.style.backgroundColor = 'rgba(0,0,0,' + (0.55 * Math.max(0, Math.min(1, 1 - y / H))).toFixed(3) + ')'; };
    var spring = function (a, b, fn, end) { if (K.spring && !calm) return K.spring(key, a, b, fn, 'snappy', end); fn(b); if (end) end(); return { v: 0 }; };
    put(calm ? 0 : H); spring(H, 0, put);
    var gone = false, close = function (then) { if (gone) return; var fin = function () { if (gone) return; gone = true; s.remove(); noscroll(false); if (then) then(); }; spring(0, H + 90, function (y) { put(y); if (y >= H) fin(); }, fin); };
    var y0 = null, dy = 0, t0 = 0;
    pane.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; }, { passive: true });
    pane.addEventListener('touchmove', function (e) { if (y0 == null) return; var x = e.touches[0].clientY - y0; dy = x >= 0 ? x : -(1 - 1 / (0.55 * -x / H + 1)) * H; put(dy); }, { passive: true });
    pane.addEventListener('touchend', function () { if (y0 == null) return; var v = dy / Math.max(1, Date.now() - t0) * 1000; y0 = null; if (dy > H * 0.3 || v > 900) close(); else spring(dy, 0, put); });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b && e.target !== s) return;
      if (!b) { close(); return; }
      var t = b.getAttribute('data-q'); close(function () { if (t === 'q') openCard(); else if (t === 'a') openQuestion(); });
    });
    var f = s.querySelector('button'); if (f) f.focus({ preventScroll: true });
  }

  // ---------- the header buttons ----------
  var QI = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>';
  var PI = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  function place() {
    if (document.getElementById('kz-today-s1')) return;   // Today has its own
    var hr = document.querySelector('#kz-header .kz-hright'); if (!hr) return;
    var burger = hr.querySelector('.kz-burger');
    if (!hr.querySelector('.kz-hadd') && K.openAdd) {
      var a = document.createElement('button'); a.type = 'button'; a.className = 'kz-hadd kzdy-add'; a.setAttribute('aria-label', 'Add a goal'); a.innerHTML = PI;
      a.addEventListener('click', function () { try { K.openAdd(); } catch (e) {} });
      hr.insertBefore(a, burger || null);
    }
    if (cur() && !hr.querySelector('.kzf-q')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'kz-chip kzf-q kzdy-q'; b.setAttribute('aria-label', 'Quote of the day and today\'s question'); b.innerHTML = QI;
      b.addEventListener('click', chooser); hr.insertBefore(b, hr.firstChild);
    }
    document.documentElement.classList.add('kzdy-on');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(place, 0); }); else setTimeout(place, 0);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztidy-1027x.js ==== */
;try {
/* Oct 27 x · James's tidy-ups (styles: kztidy-1027x.css)
   1. Swipe a goal left: Edit + Delete. The Archive button becomes Edit (opens the goal's own editor, same as ••• → Edit).
   2. Archive is retired: "Archived goals" links only show while something is still archived, so old ones can be restored.
   (LATER divider → plain line and the glass checks are CSS only.) */
(function () {
  var K = window.KZ; if (!K || K.__kztidy) return; K.__kztidy = 1;
  var PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
  function patch(root) {
    [].forEach.call((root || document).querySelectorAll('.kz-gswipe .arch[data-kz-sw-arch]'), function (b) {
      var id = b.getAttribute('data-kz-sw-arch'); b.removeAttribute('data-kz-sw-arch');
      b.className = 'edit'; b.setAttribute('data-kz-sw-edit', id); b.innerHTML = PEN + 'Edit';
    });
  }
  function archLinks() {
    var n = 0; try { n = (K.archived() || []).length; } catch (e) {}
    document.documentElement.classList.toggle('kz-has-arch', n > 0);
  }
  patch(); archLinks();
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && (n.querySelector('.kz-gswipe .arch') || n.matches('.kz-gswipe, .kz-gswipe *'))) { patch(n.closest('.kz-goal') || n); } }
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('kz:changed', function () { setTimeout(archLinks, 0); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kz-sw-edit]'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    var c = b.closest('.kz-goal'), ed = c && c.querySelector('.kz-gmenu [data-kz-edit]');
    document.body.click();   // closes the open swipe the same way a tap elsewhere does
    if (ed) setTimeout(function () { ed.click(); var box = c.isConnected && c.querySelector('.kz-editbox:not([hidden])'); if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 200);
  }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsurf-1028.js ==== */
;try {
/* Oct 27 z · see kzsurf-1027z.css. Groups Plan's to-do rows (a group starts at a row with a rounded top corner and ends at a
   row with a rounded bottom corner) and tells each row the group's height and its offset, so one gradient spans the group. */
(function () {
  if (window.__kzsurf) return; window.__kzsurf = 1;   /* Oct 28: replaces kzsurf-1027z.js — Plan's to-dos (not only its plan tasks) join the card groups, so a plan task followed by a to-do no longer gets a full-width edge line between them */
  var raf = 0;
  function run() {
    raf = 0;
    var rows = [].filter.call(document.querySelectorAll('li.kz-todo.plan, [data-p="day-list"] li.kz-todo'), function (x) { return x.offsetParent !== null; }), grp = [];
    // Plan puts each to-do into its part of the day with CSS order, so group in the order they appear on screen, not DOM order
    var tops = new Map(); rows.forEach(function (x) { tops.set(x, x.getBoundingClientRect().top); }); rows.sort(function (a, b) { return tops.get(a) - tops.get(b); });
    var flush = function () {
      if (!grp.length) return;
      var top = grp[0].getBoundingClientRect().top, bot = grp[grp.length - 1].getBoundingClientRect().bottom, h = Math.max(1, Math.round(bot - top));
      grp.forEach(function (r, i) { if (!r.classList.contains('kzs-row')) r.classList.add('kzs-row'); r.__kza = 1; if (r.classList.contains('kzs-auto')) r.classList.remove('kzs-auto');   /* a row of a card is never a card of its own (kzauto) */
        r.style.setProperty('--kzs-h', h); r.style.setProperty('--kzs-y', Math.round(r.getBoundingClientRect().top - top));
        r.classList.toggle('kzs-first', i === 0); r.classList.toggle('kzs-last', i === grp.length - 1);
      });
      grp = [];
    };
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], cs = getComputedStyle(r);
      if (r.offsetParent === null) continue;
      var tl = parseFloat(cs.borderTopLeftRadius) > 0, bl = parseFloat(cs.borderBottomLeftRadius) > 0;
      if (tl) flush();
      grp.push(r);
      if (bl) flush();
    }
    flush();
  }
  function soon() { if (!raf) raf = requestAnimationFrame(run); }
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', soon); document.addEventListener('DOMContentLoaded', soon); soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzauto-1028b.js ==== */
;try {
/* Oct 28 b · replaces kzauto-1028.js: scans in the next frame, not 120 ms later.
   Oct 28 · replaces kzauto-1027.js: remembers panels it already judged (it re-measured hundreds of them 120 ms after every
   change, right in the middle of a check-off glide). */
/* Oct 27 · James: "update all these tabs that are hidden behind buttons to have the gradient pill background".
   Panels that only appear after a tap (day details on Progress, sheets, pickers, editors…) are too many to list, so any card
   drawn flat in the old greys (#1C1C1E / #2C2C2E family, rounded, card-sized) gets the to-do card surface the moment it
   shows up (class kzs-auto, styles in kzauto-1027.css). Skipped: anything inside a card that already has the surface (so
   stacked rows never become separate pills), buttons/inputs, small chips, and the Instagram-style ••• sheet's own groups. */
(function () {
  if (window.__kzauto) return; window.__kzauto = 1;
  var SEL = 'div, section, article, li, nav, form, a, aside, details, ul', SURF = '.kzs-auto, .kz-rows, .kzq-list, .kz-plancard, .kzsw, .kzs, .kzh, .kzgv, .kzgp, .kzrd, .kz-todo.plan';
  function flat(cs) {
    if (cs.backgroundImage !== 'none') return false;
    var m = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?/.exec(cs.backgroundColor); if (!m) return false;
    var r = +m[1], g = +m[2], b = +m[3], a = m[4] === undefined ? 1 : +m[4];
    return a >= .8 && r >= 18 && r <= 58 && Math.abs(r - g) <= 6 && Math.abs(g - b) <= 8;
  }
  function scan() {
    t = 0;
    var els = document.body.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.classList.contains('kzs-auto') || el.__kza || el.__kzn === el.className) continue;   // Oct 28: a panel already judged not-flat is skipped until its class changes
      if (el.matches(SURF)) { el.__kza = 1; continue; }
      var bw = el.offsetWidth, bh = el.offsetHeight; if (bw < 140 || bh < 40) continue;
      var cs = getComputedStyle(el); if (!flat(cs) || parseFloat(cs.borderTopLeftRadius) < 10) { el.__kzn = el.className; continue; }
      var p = el.parentElement && el.parentElement.closest(SURF); if (p) { el.__kza = 1; continue; }
      el.classList.add('kzs-auto');
    }
  }
  var t = 0; function soon() { if (!t) t = requestAnimationFrame(scan); }   // Oct 28 b: same frame (it landed 120 ms+ late: a flat card turning into a gradient one you could see)
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', soon, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
  addEventListener('load', soon);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kznoterem-1103.js ==== */
;try {
/* Nov 3 · kznoterem-1103 = 1029 + James: "send the quit reminders, the to-do reminders and the goals and habits reminders
   separately so they look cleaner". Each reminder time now goes out as up to three notifications, only the ones with
   something left: Goals and habits (Kaizen 66 first), To-dos and plan, and from 9 PM the quit check-in (quit habits are
   still never named). Same times, same settings, same 'stop once it's all done'. The sheet's Next reminder shows all three. */
/* Oct 29 · replaces kznoterem-1028b.js: only the Reminders sheet wording is clearer (Notes to self). */
/* Oct 28 b · kznoterem-1028b.js replaces kznoterem-1028.js: James got a note he didn't pick — the rotating "Remind me of my
   notes" was still on next to his chosen note's reminder. While any note has its own reminder, the rotation pauses (and
   says so); its text now says it sends a different note each time.
   Oct 28 · kznoterem-1028.js replaces kznoterem-1027.js. James: "allow you to choose which note is the one you get reminded of
   and allow it to be multiple at different times". Each note can carry its own reminders (Edit note → "Remind me of this
   note": any number of times, each Once · Daily · Every 2 days · Weekly), saved as kz_noterems { noteId: [{ at: 'HH:MM',
   f: 'once'|'daily'|'2d'|'weekly', d0: 'YYYY-MM-DD' }] }. They go to the phone with the other reminders (ids "kzn-np-…",
   that note's own text); Journal → Notes shows a bell with the times on each such note. The rotating "Remind me of my notes"
   switch below is unchanged.
   Oct 27 · James: "in Reminders you can also get notifications for your notes to self; set how often in Reminders, and in
   the Notes tab set if you want them or not. And clean up the notifications so they're a list of what you haven't done."
   - Settings kz_noterem { on, freq: 'daily' | '2d' | 'weekly', at: 'HH:MM' }. Notes tab (Journal → Notes): a "Remind me of
     my notes" switch. Me → Reminders: a "Notes to self" section (Off · Daily · Every 2 days · Weekly, and the time).
   - Note reminders go out with the rest (bridge 'notifySync', ids "kzn-note-…"): title "Note to self", body = one of your
     notes, newest first, taking turns. At most 7 are scheduled ahead; the task reminders keep the rest of the 50.
   - Task reminders: the body is rewritten as a list, one thing per line ("• Stretch 10 minutes"), Kaizen 66 first, up to 6
     then "+N more", built from K.notifyLeft for that reminder's day (kznotify-1025r), so it lists exactly what's left.
   kznotify-1025r is untouched: its message to the phone is adjusted on the way out. Styles: kznoterem-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kznoterem) return; K.__kznoterem = 1;   // 1103 replaces 1029
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var DEF = { on: 0, freq: 'daily', at: '12:00' }, STEP = { daily: 1, '2d': 2, weekly: 7 };
  function cfg() { var c = K.get('noterem', null) || {}; for (var k in DEF) if (!(k in c)) c[k] = DEF[k]; return c; }
  function save(c) { K.set('noterem', c); resync(); }
  function resync() {   // kznotify skips a send when its own list hasn't changed, so the full message is sent from here
    clearTimeout(rt); rt = setTimeout(function () {
      var s = K.notifySettings ? K.notifySettings() : { on: 0 }, items = []; try { items = K.notifyPlan ? K.notifyPlan() : []; } catch (e) {}
      var m = rewrite({ type: 'notifySync', on: !!s.on, ask: false, items: items });
      try { (raw || window.webkit.messageHandlers.kaizen.postMessage.bind(window.webkit.messageHandlers.kaizen))(m); } catch (e) {}
    }, 300);
  }
  var rt = 0;
  function pad(n) { return String(n).padStart(2, '0'); }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmt(t) { var p = String(t).split(':'), h = +p[0], m = +p[1] || 0; return (h % 12 || 12) + (m ? ':' + pad(m) : '') + (h >= 12 ? ' PM' : ' AM'); }

  function noteItems(now) {
    var c = cfg(), notes = (K.notes ? K.notes() : []) || [];
    if (!c.on || !notes.length || pinned()) return [];   // Oct 28 b: notes with their own reminders replace the rotation
    var p = String(c.at || '12:00').split(':'), step = STEP[c.freq] || 1, out = [], d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var first = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), +p[0] || 12, +p[1] || 0); if (first <= now) first.setDate(first.getDate() + 1);
    // which note: keep turns stable by the day number, so a resync doesn't reshuffle what you'll see
    for (var i = 0; out.length < 7 && i < 70; i++) {
      var at = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i * step, first.getHours(), first.getMinutes());
      var dayN = Math.floor(at.getTime() / 864e5), n = notes[dayN % notes.length], txt = String(n.txt || '').replace(/\s+/g, ' ').trim();
      if (!txt) continue;
      out.push({ id: 'kzn-note-' + key(at).replace(/-/g, '') + '-' + pad(at.getHours()) + pad(at.getMinutes()), at: at.getTime(), title: 'Note to self', body: txt.length > 220 ? txt.slice(0, 217) + '…' : txt });
    }
    return out;
  }
  // ---------- Oct 28: reminders on a chosen note ----------
  var FQ = { once: 0, daily: 1, '2d': 2, weekly: 7 }, FQN = { once: 'Once', daily: 'Daily', '2d': 'Every 2 days', weekly: 'Weekly' };
  function rems() { var r = K.get('noterems', null); return r && typeof r === 'object' ? r : {}; }
  function remsFor(id) { var r = rems()[id]; return Array.isArray(r) ? r.filter(function (x) { return x && /^\d{2}:\d{2}$/.test(x.at) && x.f in FQ; }) : []; }
  function pinned() { var ns = (K.notes ? K.notes() : []) || []; for (var i = 0; i < ns.length; i++) if (remsFor(ns[i].id).length) return true; return false; }
  function setRems(id, list) { var r = rems(); if (list && list.length) r[id] = list; else delete r[id]; K.set('noterems', r); resync(); }
  function dayOf(k) { var p = String(k || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function pinItems(now) {
    var notes = (K.notes ? K.notes() : []) || [], all = [], horizon = now.getTime() + 7.5 * 864e5;
    notes.forEach(function (n) {
      remsFor(n.id).forEach(function (r) {
        var p = r.at.split(':'), d = dayOf(r.d0) || new Date(now.getFullYear(), now.getMonth(), now.getDate()), step = FQ[r.f];
        var t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1]);
        if (step) { var guard = 0; while (t <= now && guard++ < 400) t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + step, +p[0], +p[1]); }
        var txt = String(n.txt || '').replace(/\s+/g, ' ').trim(); if (!txt) return;
        for (var i = 0; i < 8 && t.getTime() < horizon; i++) {
          if (t > now) all.push({ id: 'kzn-np-' + String(n.id).replace(/[^A-Za-z0-9]/g, '').slice(0, 14) + '-' + key(t).replace(/-/g, '') + pad(t.getHours()) + pad(t.getMinutes()), at: t.getTime(), title: 'Note to self', body: txt.length > 220 ? txt.slice(0, 217) + '…' : txt });
          if (!step) break; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + step, +p[0], +p[1]);
        }
      });
    });
    all.sort(function (a, b) { return a.at - b.at; });
    var seen = {}; return all.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; }).slice(0, 24);
  }
  function remText(list) { return list.map(function (r) { return fmt(r.at) + (r.f === 'once' ? ' · ' + (dayOf(r.d0) ? dayOf(r.d0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '') : ' ' + (r.f === 'weekly' && dayOf(r.d0) ? 'every ' + dayOf(r.d0).toLocaleDateString('en-US', { weekday: 'short' }) : FQN[r.f].toLowerCase())); }).join(' · '); }
  K.noteReminders = remsFor;

  function listBody(it) {
    var m = /^kzn-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(it.id || ''); if (!m || !K.notifyLeft || !K.notifySettings) return it;
    var day = new Date(+m[1], +m[2] - 1, +m[3]), dk = m[1] + '-' + m[2] + '-' + m[3], slot = (+m[4]) * 60 + (+m[5]);
    var t = K.today ? K.today() : new Date(), ahead = Math.round((day - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
    var l; try { l = K.notifyLeft(dk, K.notifySettings(), ahead); } catch (e) { return it; }
    var items = [];
    if (l.k66) items.push('Kaizen 66: ' + l.k66.name);
    if (slot >= 21 * 60 && l.quit) items.push(l.quit === 1 ? 'Quit check-in' : l.quit + ' quit check-ins');
    (l.names || []).forEach(function (x) { items.push(x); });
    if (!items.length) return it;
    var shown = items.slice(0, 6).map(function (x) { return '• ' + String(x).slice(0, 60); });
    if (items.length > 6) shown.push('+' + (items.length - 6) + ' more');
    it.body = shown.join('\n').slice(0, 400);
    return it;
  }
  // Nov 3 · one reminder time → separate notifications per kind
  function groups(it) {
    var m = /^kzn-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(it.id || ''); if (!m || !K.notifyLeft || !K.notifySettings) return null;
    var day = new Date(+m[1], +m[2] - 1, +m[3]), dk = m[1] + '-' + m[2] + '-' + m[3], slot = (+m[4]) * 60 + (+m[5]), s = K.notifySettings();
    var t = K.today ? K.today() : new Date(), ahead = Math.round((day - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
    var l; try { l = K.notifyLeft(dk, s, ahead); } catch (e) { return null; }
    var todo = [];
    if (s.inc && s.inc.todos) {
      try { var p = K.plan ? K.plan(dk) : null; (p && p.items || []).forEach(function (x) { if (!x.done) todo.push(x.txt); }); } catch (e) {}
      try { (K.todosFor ? K.todosFor(dk) : []).forEach(function (x) { if (!x.done) todo.push(x.txt); }); } catch (e) {}
    }
    var names = l.names || [], hab = names.slice(0, Math.max(0, names.length - todo.length)), tdo = names.slice(names.length - todo.length);
    var list = function (a) { var sh = a.slice(0, 6).map(function (x) { return '• ' + String(x).slice(0, 60); }); if (a.length > 6) sh.push('+' + (a.length - 6) + ' more'); return sh.join('\n').slice(0, 400); };
    var out = [];
    var hl = (l.k66 ? ['Kaizen 66: ' + l.k66.name] : []).concat(hab);
    if (hl.length) out.push({ id: it.id + '-h', at: it.at, title: (l.k66 && !hab.length ? 'Kaizen 66 · Day ' + l.k66.day + ' still open' : hl.length === 1 ? '1 goal left today' : hl.length + ' goals and habits left'), body: list(hl) });
    if (tdo.length) out.push({ id: it.id + '-t', at: it.at + 1, title: tdo.length === 1 ? '1 to-do left' : tdo.length + ' to-dos left', body: list(tdo) });
    if (slot >= 21 * 60 && l.quit) out.push({ id: it.id + '-q', at: it.at + 2, title: l.quit === 1 ? 'Quit check-in' : l.quit + ' quit check-ins', body: 'Clean today, or slipped? Tap to check in.' });
    return out;
  }
  K.notifyGroups = groups;
  function rewrite(msg) {
    if (!msg || msg.type !== 'notifySync') return msg;
    var now = new Date(), notes = pinItems(now).concat(noteItems(now)), items = [];
    (msg.items || []).filter(function (x) { return !/^kzn-(note|np)-/.test(x.id); }).forEach(function (x) { var g = null; try { g = groups(x); } catch (e) {} if (g) items = items.concat(g); else items.push(listBody(x)); });
    items = items.slice(0, Math.max(0, 50 - notes.length)).concat(notes).sort(function (a, b) { return a.at - b.at; });
    msg.items = items; msg.on = !!(msg.on || notes.length);
    return msg;
  }
  // adjust the reminder message on its way to the phone
  var h = null; try { h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen; } catch (e) {}
  var raw = null;
  if (h && h.postMessage && !h.__kznr) {
    raw = h.postMessage.bind(h);
    try { h.postMessage = function (m) { try { m = rewrite(m); } catch (e) {} return raw(m); }; h.__kznr = 1; } catch (e) { raw = null; }
  }
  // with task reminders off, notes still need a message of their own
  function send() {
    var notes = pinItems(new Date()).concat(noteItems(new Date())); if (!raw && !h) return;
    var m = { type: 'notifySync', on: !!notes.length, ask: false, items: notes };
    try { (raw || h.postMessage.bind(h))(m); } catch (e) {}
  }
  K.noteRemind = cfg;

  // ---------- Me → Reminders: "Notes to self" ----------
  function chip(on, v, label) { return '<button type="button" class="kzn-chip' + (on ? ' on' : '') + '" data-nr-f="' + v + '" aria-pressed="' + !!on + '">' + label + '</button>'; }
  function section() {
    var c = cfg(), cur = c.on ? c.freq : 'off';
    return '<p class="kzn-lab">Notes to self</p><p class="kznr-hint">' + (pinned() ? 'Off for now: you set a reminder on a specific note, so that note comes instead.' : 'Get one of your own notes as a reminder, a different one each time. Want one note at a set time? Open it in Journal → Notes, tap Edit, then Add a reminder.') + '</p><div class="kzn-seg kznr-seg">' +
      chip(cur === 'off', 'off', 'Off') + chip(cur === 'daily', 'daily', 'Daily') + chip(cur === '2d', '2d', 'Every 2 days') + chip(cur === 'weekly', 'weekly', 'Weekly') + '</div>' +
      (c.on ? '<div class="kzn-card"><label class="kzn-row"><span>Time</span><input type="time" data-nr-at value="' + esc(c.at) + '"></label></div>' : '');
  }
  function paintPreview() {   // the sheet's "Next reminder" card shows the same list the phone will show
    [].forEach.call(document.querySelectorAll('.kzn-sheet .kzn-prev'), function (pv) {
      if (!pv.querySelector('b')) return;
      var gs = null, at = 0; try { var pl = K.notifyPlan ? K.notifyPlan() : []; if (pl[0]) { at = pl[0].at; gs = groups(pl[0]); } } catch (e) {}
      if (!gs || !gs.length) return;
      var when = new Date(at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
      var html = gs.map(function (g) { return '<div class="kznr-one"><span class="kzn-app">KAIZEN · ' + esc(when) + '</span><b>' + esc(g.title) + '</b><span class="kznr-list">' + esc(g.body) + '</span></div>'; }).join('');
      if (pv.__h !== html) { pv.__h = html; pv.innerHTML = html; pv.classList.add('kznr-split'); }
    });
  }
  function paintSheet() {
    paintPreview();
    [].forEach.call(document.querySelectorAll('.kzn-sheet .kzsw'), function (sh) {
      var box = sh.querySelector('.kznr'), html = section();
      if (!box) { box = document.createElement('div'); box.className = 'kznr'; var acts = sh.querySelector('.kzsw-acts') || sh.querySelector('.kzsw-btn'); acts = acts && acts.closest('.kzsw-acts') || acts; if (acts && acts.parentNode === sh) sh.insertBefore(box, acts); else sh.appendChild(box); }
      if (box.__h !== html) { box.__h = html; box.innerHTML = html; }
    });
  }
  // ---------- Journal → Notes: "Remind me of my notes" ----------
  function paintNotes() {
    var nw = document.querySelector('.kznt-new'); if (!nw || !nw.parentNode) return;
    var row = document.querySelector('.kznr-notes'), c = cfg();
    if (!row) { row = document.createElement('label'); row.className = 'kznr-notes'; nw.parentNode.insertBefore(row, nw.nextSibling); }
    var html = '<span><b>Remind me of my notes</b><small>' + (c.on && pinned() ? 'Paused: the notes you set reminders on come instead' : c.on ? ({ daily: 'Daily', '2d': 'Every 2 days', weekly: 'Weekly' }[c.freq] || 'Daily') + ' at ' + fmt(c.at) + ' · a different note each time. For one note, open it and add a reminder' : 'Off · a different note each time. For one note, open it and add a reminder') + '</small></span>' +
      '<input type="checkbox" class="kz-sw49" data-nr-on' + (c.on ? ' checked' : '') + ' aria-label="Remind me of my notes">';
    if (row.__h !== html) { row.__h = html; row.innerHTML = html; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-nr-f]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var c = cfg(), v = b.getAttribute('data-nr-f');
    if (v === 'off') c.on = 0; else { c.on = 1; c.freq = v; }
    save(c); paintSheet(); paintNotes();
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches) return;
    if (t.matches('[data-nr-on]')) { var c = cfg(); c.on = t.checked ? 1 : 0; save(c); paintNotes(); paintSheet(); if (t.checked && !(K.notifySettings && K.notifySettings().on)) { try { var hh = window.webkit.messageHandlers.kaizen; (raw || hh.postMessage.bind(hh))({ type: 'notifySync', on: true, ask: true, items: noteItems(new Date()) }); } catch (er) {} } }
    else if (t.matches('[data-nr-at]') && t.value) { var c2 = cfg(); c2.at = t.value; save(c2); paintNotes(); }
  }, true);
  document.addEventListener('kz:notes', function () { resync(); paintNotes(); });
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; paintSheet(); paintNotes(); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kznr, .kznr-notes')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  soon();

  // ---------- Oct 28: "Remind me of this note" in the note editor ----------
  var BELL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/></svg>';
  var XS = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  var cur = null;   // { id, draft: [...], dirty }
  function todayKey() { var t = K.today ? K.today() : new Date(); return key(t); }
  function nextHour() { var d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return pad(d.getHours()) + ':00'; }
  function onceDay(at) { var p = at.split(':'), d = new Date(), t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1]); if (t <= d) t.setDate(t.getDate() + 1); return key(t); }
  function rowHTML(r, i) {
    var chips = ['once', 'daily', '2d', 'weekly'].map(function (f) { var on = r.f === f; return '<button type="button" class="kznt-chip' + (on ? ' on' : '') + '" data-nrp-f="' + f + '" data-i="' + i + '" aria-pressed="' + on + '">' + FQN[f] + '</button>'; }).join('');
    return '<div class="kznrp-row"><div class="kznrp-top"><input type="time" class="kznrp-at" data-i="' + i + '" value="' + esc(r.at) + '" aria-label="Reminder time"><span class="kznrp-when">' + esc(r.f === 'once' ? 'on ' + (dayOf(r.d0) ? dayOf(r.d0).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '') : r.f === 'weekly' && dayOf(r.d0) ? 'every ' + dayOf(r.d0).toLocaleDateString('en-US', { weekday: 'short' }) : '') + '</span>' +
      '<button type="button" class="kznrp-x" data-nrp-x="' + i + '" aria-label="Remove this reminder">' + XS + '</button></div><div class="kznrp-fq" role="group" aria-label="How often">' + chips + '</div></div>';
  }
  function paintPin() {
    var sh = document.querySelector('.kznt-back .kznt-body'); if (!sh || !cur) return;
    var box = sh.querySelector('.kznrp');
    if (!box) { box = document.createElement('div'); box.className = 'kznrp'; var del = sh.querySelector('.kznt-del'); sh.insertBefore(box, del || null); }
    box.innerHTML = '<p class="kznt-lab">Remind me of this note</p>' + (cur.draft.length ? '<div class="kznrp-list">' + cur.draft.map(rowHTML).join('') + '</div>' : '') +
      '<button type="button" class="kznrp-add" data-nrp-add>' + BELL + '<span>' + (cur.draft.length ? 'Add another time' : 'Add a reminder') + '</span></button>';
  }
  if (K.openNote && !K.openNote.__kznrp) {
    var o0 = K.openNote;
    K.openNote = function (id) {
      var had = !!document.querySelector('.kznt-back');
      var r = o0.apply(this, arguments);
      if (!had && document.querySelector('.kznt-back')) { cur = { id: id || null, draft: remsFor(id || '').map(function (x) { return { at: x.at, f: x.f, d0: x.d0 }; }), dirty: false }; paintPin(); }
      return r;
    };
    K.openNote.__kznrp = 1;
  }
  function commit(id) { if (!cur || !cur.dirty || !id) return; setRems(id, cur.draft.slice()); var c = cur; cur = null; if (c.draft.length && !(K.notifySettings && K.notifySettings().on)) { try { var hh = window.webkit.messageHandlers.kaizen; (raw || hh.postMessage.bind(hh))({ type: 'notifySync', on: true, ask: true, items: pinItems(new Date()).concat(noteItems(new Date())) }); } catch (er) {} } }
  if (K.addNote && !K.addNote.__kznrp) { var a0 = K.addNote; K.addNote = function () { var n = a0.apply(this, arguments); try { if (n && document.querySelector('.kznt-back')) commit(n.id); } catch (e) {} return n; }; K.addNote.__kznrp = 1; }
  if (K.updateNote && !K.updateNote.__kznrp) { var u0 = K.updateNote; K.updateNote = function (id) { var r = u0.apply(this, arguments); try { if (cur && cur.id === id) commit(id); } catch (e) {} return r; }; K.updateNote.__kznrp = 1; }
  if (K.deleteNote && !K.deleteNote.__kznrp) { var d0 = K.deleteNote; K.deleteNote = function (id) { var r = d0.apply(this, arguments); try { if (remsFor(id).length) setRems(id, []); } catch (e) {} cur = null; return r; }; K.deleteNote.__kznrp = 1; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-nrp-add],[data-nrp-x],[data-nrp-f]'); if (!t || !cur) return;
    e.preventDefault(); e.stopPropagation();
    if (t.hasAttribute('data-nrp-add')) { var at = nextHour(); cur.draft.push({ at: at, f: 'daily', d0: todayKey() }); }
    else if (t.hasAttribute('data-nrp-x')) cur.draft.splice(+t.getAttribute('data-nrp-x'), 1);
    else { var r = cur.draft[+t.getAttribute('data-i')]; if (r) { r.f = t.getAttribute('data-nrp-f'); r.d0 = r.f === 'once' ? onceDay(r.at) : todayKey(); } }
    cur.dirty = true; paintPin(); enableSave();
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches || !t.matches('.kznrp-at') || !cur) return;
    var r = cur.draft[+t.getAttribute('data-i')]; if (!r || !t.value) return;
    r.at = t.value; if (r.f === 'once') r.d0 = onceDay(r.at); cur.dirty = true; paintPin(); enableSave();
  }, true);
  function enableSave() { var ta = document.querySelector('.kznt-back .kznt-txt'), sv = document.querySelector('.kznt-back [data-nt="save"]'); if (sv && ta) sv.disabled = !ta.value.trim(); }
  // a note's sheet closed without saving: forget the draft
  new MutationObserver(function () { if (cur && !document.querySelector('.kznt-back')) cur = null; }).observe(document.body, { childList: true });

  // ---------- Journal → Notes: a bell with the times on each note that has them ----------
  function paintBadges() {
    [].forEach.call(document.querySelectorAll('#kz-nlist .kznt-card[data-nt-id]'), function (c) {
      var l = remsFor(c.getAttribute('data-nt-id')), b = c.querySelector('.kznrp-badge'), txt = l.length ? remText(l) : '';
      if (!txt) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('span'); b.className = 'kznrp-badge'; var m = c.querySelector('.kznt-meta'); (m || c).appendChild(b); }
      if (b.__t !== txt) { b.__t = txt; b.innerHTML = BELL + '<span>' + esc(txt) + '</span>'; }
    });
  }
  document.addEventListener('kz:notes', function () { requestAnimationFrame(paintBadges); });
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kznrp-badge, .kznrp')) continue; requestAnimationFrame(paintBadges); return; } }).observe(document.body, { childList: true, subtree: true });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztimer-1030b.js ==== */
;try {
/* Oct 30 b · replaces kztimer-1030.js. James: "instead of sound + buzz do notification + buzz because that's what it is".
   The choices are now "Notification + buzz" and "Buzz only", and Buzz only is really silent: its "Time's up" notification is
   sent with sound: false (ContentView.swift todoSync honours it), so neither the in-app chime nor the notification sound plays;
   with the app open the phone keeps buzzing, and on a locked phone the notification arrives silently (iOS doesn't vibrate a
   notification without a sound). */
/* Oct 30 · replaces kztimer-1029.js. James: "is there any way for the timer to have a ringer but it's just haptics". The Timer side
   has an Alert choice: Sound + buzz, or Buzz only. When a timer ends with the app open it keeps buzzing (the phone's vibration
   motor, bridge type "buzz") every 1.2 s, plus the chime with Sound, until you tap Close / Again or for 60 s. The phone's
   "Time's up" notification for a locked phone keeps its sound: iOS only vibrates for a notification that has one
   (on silent mode it vibrates only). */
/* Oct 29 · Timer and stopwatch (James: "make it just a little button you can press, and you can start a timer or a
   stopwatch, one or the other", next to the quote / notes button in the header). One small clock button in every tab's
   header (#kz-header .kz-hright, before the quote button). It opens a sheet: Timer | Stopwatch.
   - Timer: pick 1–90 minutes or Custom (hours + minutes, up to 23 h 59 min), Start. Full-screen countdown with a gold ring, Pause / Resume, End. At zero: chime + buzz.
   - Stopwatch: Start counts up; Pause / Resume, Reset.
   Only one runs at a time (kz_timer). It keeps start/end times, so leaving the app or locking the phone doesn't lose it:
   the phone gets a "Time's up" notification for a timer (sent with the to-do reminders, id "kzt-timer"), and any tab
   shows the running one again. While one runs, the header button turns gold. Nothing is checked off; it's just a clock.
   Styles: kztimer-1029.css */
(function () {
  var K = window.KZ; if (!K || K.__kztimer) return; K.__kztimer = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var CHOICES = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 90];
  var CLOCK = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.6M9.5 2.8h5M12 2.8V6"/></svg>';

  // ---------- state: { mode: 'timer'|'watch', mins, total, end, started, acc, paused, left, done } ----------
  function len(m) { var hh = Math.floor(m / 60), mm = m % 60; return (hh ? hh + ' hr' + (mm ? ' ' : '') : '') + (mm || !hh ? mm + ' min' : ''); }
  function st() { var s = K.get('timer', null); return s && typeof s === 'object' && s.mode ? s : null; }
  function save(s) { K.set('timer', s || null); syncNotify(); paintBtn(); }
  function remain(s) { return s.paused ? s.left : Math.max(0, s.end - Date.now()); }
  function elapsed(s) { return (s.acc || 0) + (s.paused ? 0 : Date.now() - s.started); }

  // the timer's "Time's up" notification rides along with the to-do reminders (the phone keeps exactly the list it's sent)
  try {
    var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen;
    if (h && h.postMessage && !h.__kztm) {
      var raw = h.postMessage.bind(h);
      h.postMessage = function (m) {
        try {
          if (m && m.type === 'todoSync') {
            var s = st(), items = (m.items || []).filter(function (x) { return x.id !== 'timer'; });
            if (s && s.mode === 'timer' && !s.paused && !s.done && s.end > Date.now() + 1500) items.unshift({ id: 'timer', at: s.end, title: 'Time’s up', body: 'Your ' + len(s.mins) + ' timer is done.', sound: s.alert !== 'buzz' });
            m = { type: 'todoSync', items: items, ask: !!m.ask };
          }
        } catch (e) {}
        return raw(m);
      };
      h.__kztm = 1;
    }
  } catch (e) {}
  function syncNotify(ask) { try { if (K.syncReminders) K.syncReminders(!!ask); } catch (e) {} }

  // ---------- the header button ----------
  function paintBtn() {
    var s = st(), on = !!(s && !s.done);
    [].forEach.call(document.querySelectorAll('.kztm-hb'), function (b) {
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', on ? (s.mode === 'timer' ? 'Timer running' : 'Stopwatch running') + '. Open it.' : 'Timer and stopwatch');
    });
  }
  function addBtn() {
    var hr = document.querySelector('#kz-header .kz-hright'); if (!hr || hr.querySelector('.kztm-hb')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kztm-hb'; b.innerHTML = CLOCK;
    var q = hr.querySelector('.kzf-q'); hr.insertBefore(b, q || hr.firstChild); paintBtn();
  }

  // ---------- the picker sheet ----------
  var sheet = null, pickMode = 'timer', pickMins = 5, custom = false, pickAlert = 'sound';
  function openSheet() {
    closeSheet(true); try { var last = K.get('timerlast', null); if (last) { pickMode = last.mode === 'watch' ? 'watch' : 'timer'; pickMins = +last.mins || 5; pickAlert = last.alert === 'buzz' ? 'buzz' : 'sound'; } } catch (e) {} custom = CHOICES.indexOf(pickMins) < 0;
    sheet = document.createElement('div'); sheet.className = 'kztm-pick'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Timer and stopwatch');
    sheet.innerHTML = '<div class="kztm-ps"><div class="kztm-seg" role="tablist">' +
      '<button type="button" role="tab" data-kztm-mode="timer">Timer</button><button type="button" role="tab" data-kztm-mode="watch">Stopwatch</button></div>' +
      '<div class="kztm-body"></div><div class="kztm-pacts"><button type="button" class="kztm-btn gold" data-kztm-go>Start</button><button type="button" class="kztm-btn" data-kztm-px>Cancel</button></div></div>';
    document.body.appendChild(sheet); post({ type: 'pageScroll', on: false }); paintSheet();
    requestAnimationFrame(function () { if (sheet) sheet.classList.add('on'); });
    sheet.addEventListener('input', function (e) { if (e.target.closest('[data-kztm-ch], [data-kztm-cm]')) { readCustom(); var go = sheet.querySelector('[data-kztm-go]'); if (go) go.disabled = !(pickMins >= 1); } });
    sheet.addEventListener('change', function (e) { if (e.target.closest('[data-kztm-ch], [data-kztm-cm]')) { readCustom(); paintCustom(); } });
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || e.target.closest('[data-kztm-px]')) { closeSheet(); return; }
      var m = e.target.closest('[data-kztm-mode]'); if (m) { pickMode = m.getAttribute('data-kztm-mode'); post({ type: 'tick' }); paintSheet(); return; }
      var al = e.target.closest('[data-kztm-al]'); if (al) { pickAlert = al.getAttribute('data-kztm-al'); post({ type: al.getAttribute('data-kztm-al') === 'buzz' ? 'buzz' : 'tick' }); paintSheet(); return; }
      var c = e.target.closest('[data-kztm-pm]'); if (c) { var v = c.getAttribute('data-kztm-pm'); if (v === 'c') { custom = true; post({ type: 'tick' }); paintSheet(); var hi = sheet.querySelector('[data-kztm-cm]'); if (hi) try { hi.focus(); hi.select(); } catch (er) {} return; } custom = false; pickMins = +v; post({ type: 'tick' }); paintSheet(); return; }
      if (e.target.closest('[data-kztm-go]')) { if (pickMode === 'timer' && custom) readCustom(); if (pickMode === 'timer' && !(pickMins >= 1)) return; K.set('timerlast', { mode: pickMode, mins: pickMins, alert: pickAlert }); closeSheet(true); start(pickMode, pickMins, pickAlert); }
    });
  }
  function paintSheet() {
    if (!sheet) return;
    [].forEach.call(sheet.querySelectorAll('[data-kztm-mode]'), function (b) { var on = b.getAttribute('data-kztm-mode') === pickMode; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    var body = sheet.querySelector('.kztm-body');
    body.innerHTML = pickMode === 'timer'
      ? '<p class="kztm-pp">How long?</p><div class="kztm-chips" role="group" aria-label="How long">' + CHOICES.map(function (m) { var on = !custom && m === pickMins; return '<button type="button" class="kztm-chip' + (on ? ' on' : '') + '" data-kztm-pm="' + m + '" aria-pressed="' + on + '">' + m + ' min</button>'; }).join('') +
        '<button type="button" class="kztm-chip kztm-cchip' + (custom ? ' on' : '') + '" data-kztm-pm="c" aria-pressed="' + custom + '">Custom</button></div>' +
        (custom ? '<div class="kztm-custom"><label><input type="number" inputmode="numeric" min="0" max="23" step="1" data-kztm-ch value="' + Math.floor(pickMins / 60) + '" aria-label="Hours" enterkeyhint="done"><span>hr</span></label>' +
          '<label><input type="number" inputmode="numeric" min="0" max="59" step="1" data-kztm-cm value="' + (pickMins % 60) + '" aria-label="Minutes" enterkeyhint="done"><span>min</span></label></div>' : '') +
        '<p class="kztm-pp kztm-alab">When it ends</p><div class="kztm-seg kztm-alert" role="group" aria-label="When it ends">' +
        [['sound', 'Notification + buzz'], ['buzz', 'Buzz only']].map(function (x) { var on = pickAlert === x[0]; return '<button type="button" data-kztm-al="' + x[0] + '" aria-pressed="' + on + '"' + (on ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>'
      : '<p class="kztm-pp">Counts up from 0:00 until you stop it.</p>';
    var go = sheet.querySelector('[data-kztm-go]'); if (go) go.disabled = pickMode === 'timer' && !(pickMins >= 1);
  }
  function readCustom() {
    if (!sheet) return; var hi = sheet.querySelector('[data-kztm-ch]'), mi = sheet.querySelector('[data-kztm-cm]'); if (!hi || !mi) return;
    var hh = Math.max(0, Math.min(23, parseInt(hi.value, 10) || 0)), mm = Math.max(0, Math.min(1439, parseInt(mi.value, 10) || 0));
    pickMins = Math.min(23 * 60 + 59, hh * 60 + mm);
  }
  function paintCustom() {   // tidy the boxes after typing (75 min becomes 1 hr 15 min)
    if (!sheet) return; var hi = sheet.querySelector('[data-kztm-ch]'), mi = sheet.querySelector('[data-kztm-cm]'); if (!hi || !mi) return;
    hi.value = Math.floor(pickMins / 60); mi.value = pickMins % 60; var go = sheet.querySelector('[data-kztm-go]'); if (go) go.disabled = !(pickMins >= 1);
  }
  function closeSheet(now) { if (!sheet) return; var s = sheet; sheet = null; s.classList.remove('on'); if (!layer) setTimeout(function () { if (!layer) post({ type: 'pageScroll', on: true }); }, 120); setTimeout(function () { s.remove(); }, now ? 0 : 260); }

  // ---------- the full-screen clock ----------
  var layer = null, tick = 0, R = 118, C = 2 * Math.PI * R;
  function fmt(ms, up) {
    var t = up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000), hh = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sec = t % 60;
    return (hh ? hh + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  function render() {
    var s = st(); if (!s) { closeLayer(); return; }
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'kztm-over'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-labelledby', 'kztm-n');
      layer.innerHTML = '<div class="kztm-in"><p class="kztm-tag" id="kztm-n"></p>' +
        '<div class="kztm-ring"><svg viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="' + R + '" class="tr"/><circle cx="130" cy="130" r="' + R + '" class="pr" stroke-dasharray="' + C.toFixed(1) + '" transform="rotate(-90 130 130)"/></svg>' +
        '<div class="kztm-mid"><b class="kztm-t" role="timer" aria-live="off"></b><span class="kztm-sub"></span></div></div>' +
        '<div class="kztm-acts"></div><button type="button" class="kztm-min" data-kztm="hide">Hide (keeps running)</button></div>';
      document.body.appendChild(layer); document.body.classList.add('kz-noscroll'); post({ type: 'pageScroll', on: false });
      requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
      layer.addEventListener('click', onClick);
    }
    var watch = s.mode === 'watch', ms = watch ? elapsed(s) : remain(s);
    var frac = watch ? (ms % 60000) / 60000 : (s.done ? 1 : 1 - ms / s.total);
    layer.querySelector('.kztm-tag').textContent = watch ? 'STOPWATCH' : 'TIMER · ' + len(s.mins).toUpperCase();
    layer.querySelector('.pr').setAttribute('stroke-dashoffset', (C * (1 - frac)).toFixed(1));
    layer.classList.toggle('done', !!s.done); layer.classList.toggle('paused', !!s.paused); layer.classList.toggle('watch', watch);
    var t = layer.querySelector('.kztm-t'), sub = layer.querySelector('.kztm-sub'), acts = layer.querySelector('.kztm-acts'), a = '', sig;
    if (s.done) { t.textContent = 'Done'; sub.textContent = len(s.mins); sig = 'd'; a = '<button type="button" class="kztm-btn gold" data-kztm="close">Close</button><button type="button" class="kztm-btn" data-kztm="again">Again</button>'; }
    else {
      t.textContent = fmt(ms, watch); sub.textContent = s.paused ? 'Paused' : (watch ? 'Running' : 'Left'); sig = (s.paused ? 'p' : 'r') + (watch ? 'w' : 't');
      a = '<button type="button" class="kztm-btn gold" data-kztm="' + (s.paused ? 'resume' : 'pause') + '">' + (s.paused ? 'Resume' : 'Pause') + '</button>' +
        '<button type="button" class="kztm-btn" data-kztm="' + (watch ? 'reset' : 'end') + '">' + (watch ? 'Reset' : 'End') + '</button>';
    }
    t.setAttribute('aria-label', s.done ? 'Done' : fmt(ms, watch) + (watch ? ' elapsed' : ' left'));
    if (acts.__s !== sig) { acts.__s = sig; acts.innerHTML = a; }
    layer.querySelector('.kztm-min').hidden = !!s.done;
  }
  function closeLayer() {
    stopAlarm(); clearInterval(tick); tick = 0; if (!layer) return; var l = layer; layer = null; l.classList.remove('on');
    document.body.classList.remove('kz-noscroll'); setTimeout(function () { if (!layer && !sheet) post({ type: 'pageScroll', on: true }); }, 120);
    setTimeout(function () { l.remove(); }, 240);
  }
  var alarm = 0, alarmEnd = 0;
  function stopAlarm() { clearInterval(alarm); alarm = 0; }
  function ring() {
    var s = st(), sound = !s || s.alert !== 'buzz', n = 0; stopAlarm(); alarmEnd = Date.now() + 60000;
    var pulse = function () {
      if (Date.now() > alarmEnd || document.hidden) { stopAlarm(); return; }
      post({ type: 'buzz' });
      if (sound && n % 2 === 0) try { if (K.sound) { K.sound(); setTimeout(K.sound, 700); } } catch (e) {}
      n++;
    };
    pulse(); alarm = setInterval(pulse, 1200);
  }
  function loop() {
    var s = st(); if (!s || document.hidden || !layer) { if (s && s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); ring(); if (!document.hidden) render(); } return; }
    if (s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); ring(); }
    render();
  }
  function run() { render(); clearInterval(tick); tick = setInterval(loop, 200); }
  // hidden but running: keep a slow check so the chime still plays when a timer ends while the clock is hidden
  setInterval(function () { var s = st(); if (s && !layer && !document.hidden && s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); ring(); run(); } }, 1000);
  function start(mode, mins, alert) {
    stopAlarm(); var now = Date.now(), s = mode === 'watch' ? { mode: 'watch', started: now, acc: 0 } : { mode: 'timer', mins: mins, total: mins * 60000, end: now + mins * 60000, started: now, alert: alert === 'buzz' ? 'buzz' : 'sound' };
    K.set('timer', s); syncNotify(mode === 'timer'); paintBtn();   // the first timer asks for notifications
    post({ type: 'tick' }); run();
  }
  K.startTimer = start;
  function onClick(e) {
    var b = e.target.closest('[data-kztm]'); if (!b) return; var a = b.getAttribute('data-kztm'), s = st(); post({ type: 'tick' });
    if (a === 'hide') { closeLayer(); return; }
    stopAlarm();
    if (!s) { closeLayer(); return; }
    if (a === 'pause') { if (s.mode === 'timer') s.left = remain(s); else s.acc = elapsed(s); s.paused = 1; save(s); }
    else if (a === 'resume') { if (s.mode === 'timer') s.end = Date.now() + s.left; else s.started = Date.now(); s.paused = 0; save(s); }
    else if (a === 'end' || a === 'reset' || a === 'close') { save(null); closeLayer(); return; }
    else if (a === 'again') { var mm = s.mins, aa = s.alert; save(null); start('timer', mm, aa); return; }
    render();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kztm-hb'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); post({ type: 'tick' });
    if (st()) run(); else openSheet();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (sheet) closeSheet(); else if (layer) closeLayer(); } });

  // ---------- coming back: a timer that finished while you were away shows Done ----------
  function resume() { var s = st(); if (!s || document.hidden) return; if (s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); run(); } paintBtn(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) resume(); });
  window.addEventListener('pageshow', resume);
  var raf = 0; function soon() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; addBtn(); }); }
  function boot() {
    addBtn(); resume();
    new MutationObserver(function () { if (!document.querySelector('#kz-header .kztm-hb')) soon(); }).observe(document.getElementById('kz-header') || document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztmd-1103.js ==== */
;try {
/* Nov 3 b · James: the dial becomes a ruler you drag left and right. It fills the width, its ticks and numbers grow toward the
   middle, it starts at 0, you slide it to any number of minutes (up to 3 hours), and each minute gives a haptic tick (navigator.vibrate is
   bridged to iPhone haptics). Quick picks, the When-it-ends row and Start work as before.
   Nov 3 · Timer sheet, mockup A "Dial" (James): drag around the ring to set the time (keeps going past 60 for longer timers, up to
   3 hours), quick picks 5 · 10 · 25 · 45 · 60 under it, "When it ends" as one row (tap to switch between Notification + buzz and Buzz
   only), gold-to-orange ring, Start. Uses the sheet's own chips and Custom boxes underneath, so starting works exactly as before. */
(function () {
  if (window.__kztmd1103) return; window.__kztmd1103 = 1;
  var QUICK = { 5: 1, 10: 1, 25: 1, 45: 1, 60: 1 }, R = 92, C = 120, MAX = 180;
  function mins(ps) {
    var on = ps.querySelector('.kztm-chip.on:not(.kztm-cchip)'); if (on) return +on.getAttribute('data-kztm-pm');
    var h = ps.querySelector('[data-kztm-ch]'), m = ps.querySelector('[data-kztm-cm]'); return h && m ? (+h.value || 0) * 60 + (+m.value || 0) : 0;
  }
  function fmt(v) { var h = Math.floor(v / 60), m = v % 60; return h ? h + ':' + (m < 10 ? '0' : '') + m + ':00' : m + ':00'; }
  var PPM = 16;
  function label(v) { var h = Math.floor(v / 60), m = v % 60; return h ? (h + ' h' + (m ? ' ' + m : '')) : String(m); }
  function unit(v) { var h = Math.floor(v / 60), m = v % 60; return h ? (m ? 'min' : '') : (v === 1 ? 'min' : 'min'); }
  function draw(ps, f) {
    var d = ps.querySelector('.kztmd'); if (!d) return; var cv = d.querySelector('canvas'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return; if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    var cx = W / 2, base = H - 34, lo = Math.max(0, Math.floor(f - cx / PPM) - 1), hi = Math.min(MAX, Math.ceil(f + cx / PPM) + 1);
    for (var m = lo; m <= hi; m++) {
      var px = cx + (m - f) * PPM, dd = Math.min(1, Math.abs(px - cx) / cx), k = 1 + 1.3 * Math.pow(1 - dd, 2), big = m % 5 === 0;
      var h = (big ? 22 : 11) * k, a = 0.25 + 0.75 * Math.pow(1 - dd, 1.5);
      x.strokeStyle = m <= f + 1e-6 ? 'rgba(255,138,61,' + a + ')' : 'rgba(255,255,255,' + (a * .55) + ')'; x.lineWidth = big ? 2.4 : 1.6; x.lineCap = 'round';
      x.beginPath(); x.moveTo(px, base); x.lineTo(px, base - h); x.stroke();
      if (big) { x.fillStyle = 'rgba(255,255,255,' + a + ')'; x.font = '600 ' + Math.round(11 * k) + 'px -apple-system, Inter, sans-serif'; x.textAlign = 'center'; x.fillText(label(m), px, base + 16 + 4 * k); }
    }
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#F2CF5B'); g.addColorStop(1, '#FF6A1A');
    x.fillStyle = g; x.beginPath(); if (x.roundRect) x.roundRect(cx - 2, base - 64, 4, 70, 2); else x.rect(cx - 2, base - 64, 4, 70); x.fill();
  }
  function paint(ps, v) {
    var d = ps.querySelector('.kztmd'); if (!d) return; if (!ps.__drag && !ps.__anim) ps.__f = v;
    var t = d.querySelector('.kztmd-n'), u = d.querySelector('.kztmd-u'), lb = label(v), un = v >= 60 && v % 60 === 0 ? '' : 'min';
    if (t.textContent !== lb) t.textContent = lb; if (u.textContent !== un) u.textContent = un;
    d.setAttribute('aria-valuenow', v); d.setAttribute('aria-valuetext', v + ' minutes');
    [].forEach.call(ps.querySelectorAll('.kztm-chip[data-kztm-pm]'), function (c) { c.classList.toggle('kztmd-q', !!QUICK[c.getAttribute('data-kztm-pm')]); });
    draw(ps, ps.__f == null ? v : ps.__f);
  }
  function setV(ps, v) {
    v = Math.max(0, Math.min(MAX, Math.round(v)));
    if (ps.__v !== undefined && v !== ps.__v) { try { navigator.vibrate && navigator.vibrate(1); } catch (e) {} }
    var chip = v ? ps.querySelector('.kztm-chip[data-kztm-pm="' + v + '"]') : null;
    if (chip && !ps.__drag) { if (!chip.classList.contains('on')) chip.click(); }
    else {
      if (!ps.querySelector('[data-kztm-cm]')) { var cc = ps.querySelector('.kztm-cchip'); if (cc) cc.click(); }
      var h = ps.querySelector('[data-kztm-ch]'), m = ps.querySelector('[data-kztm-cm]');
      if (h && m) { h.value = Math.floor(v / 60); m.value = v % 60; m.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    ps.__v = v; paint(ps, v);
  }
  function dress(ps) {
    var timer = ps.querySelector('[data-kztm-mode="timer"].on'); ps.classList.toggle('kztmd-on', !!timer);
    if (!timer) return;
    if (!ps.querySelector('.kztmd')) {
      var w = document.createElement('div'); w.className = 'kztmd'; w.setAttribute('role', 'slider'); w.tabIndex = 0; w.setAttribute('aria-label', 'Timer length'); w.setAttribute('aria-valuemin', '0'); w.setAttribute('aria-valuemax', String(MAX));
      w.innerHTML = '<div class="kztmd-big"><b class="kztmd-n">0</b><span class="kztmd-u">min</span></div><canvas></canvas><p class="kztmd-s">slide to set</p>';
      var seg = ps.querySelector('.kztm-seg'); ps.insertBefore(w, seg ? seg.nextSibling : ps.firstChild);
      var cv = w.querySelector('canvas'), x0 = 0, f0 = 0, lastX = 0, lastT = 0, vel = 0;
      // starts at zero each time the sheet opens
      ps.__f = 0; setTimeout(function () { setV(ps, 0); }, 0);
      function anim() { if (!ps.__anim) return; vel *= 0.92; var f = Math.max(0, Math.min(MAX, ps.__f + vel)); ps.__f = f; if (f === 0 || f === MAX) vel = 0;
        if (Math.abs(vel) < 0.02) { ps.__anim = false; ps.__f = Math.round(f); setV(ps, ps.__f); var c = ps.querySelector('.kztm-chip[data-kztm-pm="' + ps.__f + '"]'); if (c && !c.classList.contains('on')) setV(ps, ps.__f); return; }
        setV(ps, f); draw(ps, f); requestAnimationFrame(anim); }
      cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); ps.__drag = true; ps.__anim = false; x0 = lastX = e.clientX; lastT = e.timeStamp; f0 = ps.__f || 0; vel = 0; });
      cv.addEventListener('pointermove', function (e) { if (!ps.__drag) return; e.preventDefault(); var f = Math.max(0, Math.min(MAX, f0 - (e.clientX - x0) / PPM)); var dt = Math.max(1, e.timeStamp - lastT); vel = -(e.clientX - lastX) / PPM * (16 / dt); lastX = e.clientX; lastT = e.timeStamp; ps.__f = f; setV(ps, f); draw(ps, f); });
      function up(e) { if (!ps.__drag) return; ps.__drag = false; if (e && e.timeStamp - lastT > 90) vel = 0; vel = Math.max(-3, Math.min(3, vel)); if (Math.abs(vel) > 0.25) { ps.__anim = true; requestAnimationFrame(anim); } else { ps.__f = Math.round(ps.__f); setV(ps, ps.__f); } }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      w.addEventListener('keydown', function (e) { var v = mins(ps) || 0; if (/Arrow(Right|Up)/.test(e.key)) { e.preventDefault(); ps.__f = v + 1; setV(ps, v + 1); } if (/Arrow(Left|Down)/.test(e.key)) { e.preventDefault(); ps.__f = Math.max(0, v - 1); setV(ps, v - 1); } });
      ps.addEventListener('click', function (e) { var c = e.target.closest('.kztm-chip[data-kztm-pm]'); if (c && c.getAttribute('data-kztm-pm') !== 'c') { ps.__anim = false; vel = 0; ps.__f = +c.getAttribute('data-kztm-pm'); setTimeout(function () { paint(ps, ps.__f); }, 30); } });
      window.addEventListener('resize', function () { draw(ps, ps.__f || 0); });
    }
    // "When it ends" as one row
    var al = ps.querySelector('.kztm-alert');
    if (al && !ps.querySelector('.kztmd-al')) {
      var row = document.createElement('button'); row.type = 'button'; row.className = 'kztmd-al';
      row.addEventListener('click', function () { var off = ps.querySelector('.kztm-alert button:not(.on)'); if (off) off.click(); setTimeout(function () { dress(ps); }, 30); });
      al.parentNode.insertBefore(row, al);
    }
    var rowE = ps.querySelector('.kztmd-al'), onA = ps.querySelector('.kztm-alert button.on');
    if (rowE && al && rowE.nextElementSibling !== al) al.parentNode.insertBefore(rowE, al);
    if (rowE) { var h = '<span>When it ends</span><em>' + (onA ? onA.textContent : '') + '</em>'; if (rowE.__h !== h) { rowE.innerHTML = h; rowE.__h = h; } }
    if (!ps.__drag && !ps.__anim) paint(ps, mins(ps));
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kztm-pick .kztm-ps'), dress); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && (t.closest('.kztmd') || t.closest('.kztmd-al'))) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzfix3-1027.js ==== */
;try {
/* Oct 27 · James:
   1. Taps inside an opened goal (the growth preview, the tiles, the 14 days) no longer fall through and open the goal page;
      only the panel's own buttons and links act.
   2. My goals → Add a goal: after Quit, switching back to Long-term / Daily habit left "Quit something / Start quitting"
      (kzquit only set its texts one way). The title and button follow the chosen kind.
   3. Goal page: the tree (growth line + Change tree) sits at the top, right under the goal's name.
   4. Me: tap your picture to set a profile photo (photo library or camera). Resized on the phone to 256 px, kept only on the
      phone (kz_avatar), shown in the Me card. Tap again to change or remove it. */
(function () {
  var K = window.KZ; if (!K || K.__kzfix3) return; K.__kzfix3 = 1;
  // 1
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var gx = t.closest('.kz-gx'); if (!gx) return;
    if (t.closest('a, button, input, textarea, select, label, [role="button"]')) return;
    e.stopPropagation();
  }, true);
  // 2
  var TXT = { long: ['New long-term goal', 'Add goal'], daily: ['New daily habit', 'Add habit'], todo: ['New to-do', 'Add to-do'] };
  document.addEventListener('click', function (e) {
    var r = e.target.closest && e.target.closest('.kz-sheet49 [role="radio"][data-kind]'); if (!r) return;
    var sh = r.closest('.kz-sheet49'), k = r.getAttribute('data-kind');
    setTimeout(function () {
      if (sh.classList.contains('kzq-on') || !TXT[k]) return;
      var h = sh.querySelector('h2'), b = sh.querySelector('.kz-btn.gold'), edit = /edit/i.test(h ? h.textContent : '');
      if (h && !edit && /^(new |quit)/i.test(h.textContent.trim())) h.textContent = TXT[k][0];
      if (b && !edit && /^(\+\s*)?(add|start quitting)/i.test(b.textContent.trim()) && b.textContent.trim().replace(/^\+\s*/, '') !== TXT[k][1]) { var plus = b.querySelector('svg'); b.textContent = edit ? 'Save' : TXT[k][1]; if (plus && !edit) b.insertBefore(plus, b.firstChild); }
    }, 0);
  }, true);
  window.addEventListener('click', function (e) {   // back to Quit (kzquit stops the click below window): its own words again
    var q = e.target.closest && e.target.closest('.kz-sheet49 .kzq-kind'); if (!q) return;
    var sh = q.closest('.kz-sheet49');
    setTimeout(function () {
      if (!(sh.classList.contains('kzq-on') || q.getAttribute('aria-checked') === 'true')) return;
      var h = sh.querySelector('h2'), b = sh.querySelector('.kz-btn.gold'), edit = /edit/i.test(h ? h.textContent : '');
      if (edit) return;
      if (h && /^(new |quit)/i.test(h.textContent.trim())) h.textContent = 'Quit something';
      if (b && /^(\+\s*)?add/i.test(b.textContent.trim())) { var plus = b.querySelector('svg'); b.textContent = 'Start quitting'; if (plus) b.insertBefore(plus, b.firstChild); }
    }, 30);
  }, true);
  // 3
  function treeTop() {
    var g = document.querySelector('#kz-goalpage .kzg-goal'), nm = document.querySelector('#kz-goalpage .kz-g1name');
    if (g && nm && nm.parentNode === g.parentNode && nm.nextElementSibling !== g) nm.parentNode.insertBefore(g, nm.nextSibling);
  }
  // 4
  function avatar() { return K.get('avatar', '') || ''; }
  function paintAv() {
    [].forEach.call(document.querySelectorAll('.kz-set-av'), function (a) {
      var u = avatar(); a.classList.add('kzav');
      if (u) { a.style.setProperty('--kzav', 'url("' + u + '")'); a.classList.add('has'); } else { a.style.removeProperty('--kzav'); a.classList.remove('has'); }
      if (!a.querySelector('.kzav-cam')) { var c = document.createElement('i'); c.className = 'kzav-cam'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>'; a.appendChild(c); }
      a.setAttribute('role', 'button'); a.setAttribute('aria-label', u ? 'Change profile photo' : 'Add a profile photo');
    });
  }
  var inp = null;
  function pick() {
    if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none'; document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0]; if (!f) return;
        var img = new Image(), url = URL.createObjectURL(f);
        img.onload = function () {
          var S = 256, c = document.createElement('canvas'); c.width = c.height = S; var x = c.getContext('2d');
          var s = Math.min(img.naturalWidth, img.naturalHeight); x.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, S, S);
          try { K.set('avatar', c.toDataURL('image/jpeg', 0.85)); } catch (er) {}
          URL.revokeObjectURL(url); inp.value = ''; paintAv();
          try { document.dispatchEvent(new CustomEvent('kz:changed')); } catch (er) {}
        };
        img.onerror = function () { URL.revokeObjectURL(url); inp.value = ''; };
        img.src = url;
      });
    }
    inp.click();
  }
  function sheet() {
    var o = document.createElement('div'); o.className = 'kzsw-back kzav-sheet';
    o.innerHTML = '<div class="kzsw" role="dialog" aria-label="Profile photo"><i class="kzsw-grab"></i><h2 class="kzsw-t">Profile photo</h2><div class="kzsw-acts">' +
      '<button type="button" class="kzsw-btn gold" data-av="pick">Choose a photo</button>' + (avatar() ? '<button type="button" class="kzsw-btn ghost" data-av="rm">Remove photo</button>' : '') +
      '<button type="button" class="kzsw-btn ghost" data-av="x">Cancel</button></div></div>';
    document.body.appendChild(o); requestAnimationFrame(function () { o.classList.add('on'); });
    var close = function () { o.classList.remove('on'); setTimeout(function () { o.remove(); }, 300); };
    o.addEventListener('click', function (e) {
      var b = e.target.closest('[data-av]'); if (e.target === o) return close(); if (!b) return;
      var v = b.getAttribute('data-av'); close();
      if (v === 'pick') pick(); else if (v === 'rm') { K.set('avatar', ''); paintAv(); }
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.kz-set-av'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    if (avatar()) sheet(); else pick();
  }, true);
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; treeTop(); paintAv(); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kz-set-av')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzseg-1027.js ==== */
;try {
/* Oct 27 · James: "for the long term goals instead of 0/4 make it the circle that's as big as the check for the daily habits,
   with however many splits in it like a loading bar". Replaces the "0/4" ring on long-term goals (Today: .kzbd-ring from
   kzbd-1025zc; My goals: .kzlt-ring from kzltrow-1027) with a 34px circle, the same size and glass as the daily check, whose
   edge is split into one segment per milestone. Done milestones are gold; when all are done the circle turns gold like a
   checked habit. No number is shown; the count stays in the aria-label. Tapping still opens the goal. Styles: kzseg-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzseg) return; K.__kzseg = 1;
  var C = 17, R = 15.2;
  function pt(a) { var r = (a - 90) * Math.PI / 180; return (C + R * Math.cos(r)).toFixed(2) + ' ' + (C + R * Math.sin(r)).toFixed(2); }
  function arc(a0, a1) { return 'M ' + pt(a0) + ' A ' + R + ' ' + R + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + pt(a1); }
  function svg(n, t) {
    var s = '<svg class="kzseg-s" viewBox="0 0 34 34" aria-hidden="true">';
    if (t <= 1 || t > 30) {
      var L = 2 * Math.PI * R, p = t ? n / t : 0;
      s += '<circle cx="17" cy="17" r="' + R + '" class="kzseg-o"/>';
      if (p > 0) s += '<circle cx="17" cy="17" r="' + R + '" class="kzseg-on" stroke-dasharray="' + (L * p).toFixed(2) + ' ' + L.toFixed(2) + '" transform="rotate(-90 17 17)"/>';
    } else {
      var gap = t > 20 ? 13 : t > 12 ? 15 : t > 6 ? 19 : 25, step = 360 / t;
      for (var i = 0; i < t; i++) { var a0 = i * step + gap / 2, a1 = (i + 1) * step - gap / 2; s += '<path d="' + arc(a0, a1) + '" class="' + (i < n ? 'kzseg-on' : 'kzseg-o') + '"/>'; }
    }
    return s + '<path class="kzseg-tick" d="M11.2 17.4l3.9 3.9 7.7-8.2"/></svg>';
  }
  function count(el) { var m = /(\d+) of (\d+) milestones/.exec(el.getAttribute('aria-label') || ''); if (m) return [+m[1], +m[2]]; var b = el.querySelector('b'); m = b && /(\d+)\s*\/\s*(\d+)/.exec(b.textContent); return m ? [+m[1], +m[2]] : null; }
  function paint() {
    document.querySelectorAll('.kzbd-ring, .kzlt-ring').forEach(function (el) {
      var c = count(el); if (!c) return;
      var sig = c[0] + '/' + c[1] + '|' + (el.__s || '');
      if (el.__kzseg === sig && el.querySelector('.kzseg-s')) return;
      el.__kzseg = sig; el.classList.add('kzseg'); el.classList.toggle('kzseg-done', c[1] > 0 && c[0] >= c[1]);
      el.innerHTML = '<span class="kzseg-g" aria-hidden="true"></span>' + svg(c[0], c[1]);
    });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { paint(); } catch (e) {} }); }
  function boot() {
    paint();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.nodeType === 1 && t.closest && t.closest('.kzseg-s, .kzseg-g')) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
    ['kz:goals', 'kz:changed', 'kz:sync'].forEach(function (ev) { document.addEventListener(ev, soon); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzpull-1027c.js ==== */
;try {
/* Oct 27 c (replaces kzpull-1027b): on the phone the sheet didn't move with the finger: the sheets' own CSS sets
   transform with !important, which beat the inline style. The drag now sets transform/transition as important.
   The grab area is the top 96 px (the bar and the title row), not just 56.
   Oct 27 b (replaces kzpull-1027): James: "once it's below 60% if you let go it snaps away, if it's over 60% it snaps back".
   Let go with less than 60% of the sheet still showing (dragged down more than 40% of its height) → it closes; otherwise
   it springs back open. No flick rule any more, the position alone decides.
   Oct 27 · kzpull-1027 (all pages): hold the top of a sheet (the grey bar) and swipe down to close it, like iOS sheets
   (James: "make it so you can hold that at the top and swipe down and it will close").
   Any sheet with a grabber bar (a ::before or a small bar element, 30–64 × 3–8 px) can be pulled from its top 56 px.
   The sheet follows your finger; let go past 110 px (or with a quick flick) and it slides away and closes through its own
   close button (so whatever the close does, saving drafts etc., still happens); otherwise it springs back. */
(function () {
  var K = window.KZ || {}; if (window.__kzpull) return; window.__kzpull = 1;
  var ZONE = 96, KEEP = 0.6;
  function st(p, k, v) { if (v === '') p.style.removeProperty(k); else p.style.setProperty(k, v, 'important'); }
  function isBar(w, h) { return w >= 30 && w <= 64 && h >= 3 && h <= 8; }
  function panelFor(el) {
    for (var i = 0; el && el !== document.body && i < 14; i++, el = el.parentElement) {
      var b = getComputedStyle(el, '::before');
      if (b && b.content && b.content !== 'none' && isBar(parseFloat(b.width), parseFloat(b.height))) return el;
      var r = el.getBoundingClientRect(); if (!el.children.length && isBar(r.width, r.height) && el.parentElement) return el.parentElement;
      var g = el.querySelector && el.querySelector(':scope > .kz-grab, :scope > .kz-grabber, :scope > [data-grab]'); if (g) return el;
    }
    return null;
  }
  function closeBtn(panel) {
    var roots = [panel, panel.closest('.kz-sheet49, [role=dialog], .kz-gsheet, .kz-pm, .kzn-sheet, .kz-sheet') || panel.parentElement];
    for (var i = 0; i < roots.length; i++) {
      var r = roots[i]; if (!r) continue;
      var b = r.querySelector('[aria-label="Close"], [aria-label^="Close"], [data-t$="close"], [data-close], .kz-iconbtn[aria-label*="lose"], .kz-x');
      if (b) return b;
    }
    return null;
  }
  var d = null;
  document.addEventListener('touchstart', function (e) {
    d = null; if (e.touches.length !== 1) return;
    var t = e.touches[0], p = panelFor(e.target); if (!p) return;
    var r = p.getBoundingClientRect(); if (t.clientY - r.top > ZONE || t.clientY < r.top - 4) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    d = { h: Math.max(80, Math.min(p.offsetHeight, window.innerHeight - r.top)), p: p, y0: t.clientY, x0: t.clientX, t0: Date.now(), dy: 0, on: false, lastY: t.clientY, lastT: Date.now(), v: 0 };
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!d) return; var t = e.touches[0], dy = t.clientY - d.y0, dx = t.clientX - d.x0;
    if (!d.on) { if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return; if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { d = null; return; } d.on = true; st(d.p, 'transition', 'none'); st(d.p, 'will-change', 'transform'); }
    e.preventDefault(); e.stopPropagation();
    var now = Date.now(); d.v = (t.clientY - d.lastY) / Math.max(1, now - d.lastT); d.lastY = t.clientY; d.lastT = now;
    d.dy = Math.max(0, dy); st(d.p, 'transform', 'translate3d(0,' + d.dy + 'px,0)');
  }, { capture: true, passive: false });
  function end() {
    if (!d || !d.on) { d = null; return; }
    var p = d.p, go = d.dy > d.h * (1 - KEEP); d = null;
    if (go) {
      var b = closeBtn(p);
      st(p, 'transition', 'transform .22s cubic-bezier(.3,.7,.4,1)'); st(p, 'transform', 'translate3d(0,' + Math.max(window.innerHeight, p.offsetHeight) + 'px,0)');
      try { navigator.vibrate && navigator.vibrate(0); } catch (er) {}
      setTimeout(function () {
        if (b) b.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        setTimeout(function () { st(p, 'transition', ''); st(p, 'transform', ''); st(p, 'will-change', ''); }, 380);
      }, 200);
    } else {
      st(p, 'transition', 'transform .32s cubic-bezier(.2,1.25,.4,1)'); st(p, 'transform', 'translate3d(0,0,0)');
      setTimeout(function () { st(p, 'transition', ''); st(p, 'transform', ''); st(p, 'will-change', ''); }, 340);
    }
  }
  document.addEventListener('touchend', end, true);
  document.addEventListener('touchcancel', end, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzav-1027.js ==== */
;try {
/* Oct 27 · kzav-1027 (all pages; works with kzfix3-1027's profile photo). James: "for the profile picture allow it to be
   cropped into the circle wherever on the image you want and make it so you can line it up to be centered" and "change
   the little camera with the gold pill to be a floating gold pencil".
   - After you pick a photo, a full-screen editor opens: the photo behind a circle. Drag to move it, pinch to zoom (the photo
     always fills the circle). While you move it, faint thirds lines show; when the middle of the photo lines up with the
     middle of the circle (across or up-and-down) it snaps there and a gold centre line lights up. Use photo saves exactly
     what's in the circle (512 px JPEG, only on the phone); Cancel keeps your old picture.
   - The badge on the picture is a floating gold pencil (no pill). Styles: kzav-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzav) return; K.__kzav = 1;
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="kzav-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6DE8D"/><stop offset=".5" stop-color="#E2B93B"/><stop offset="1" stop-color="#B8902E"/></linearGradient></defs>' +
    '<path class="b" d="M15.2 4.3l4.5 4.5L9 19.5 3.6 20.4l.9-5.4z"/><path class="t" d="M15.2 4.3l1.6-1.6a1.6 1.6 0 0 1 2.3 0l2.2 2.2a1.6 1.6 0 0 1 0 2.3l-1.6 1.6z"/><path class="n" d="M4.5 15l4.5 4.5-5.4.9z"/></svg>';
  function pens() {
    [].forEach.call(document.querySelectorAll('.kzav-cam'), function (c) { if (!c.classList.contains('kzav-pen')) { c.classList.add('kzav-pen'); c.innerHTML = PEN; } });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; pens(); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzav-pen, .kzcr')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  soon();

  // take over the photo picker's file (kzfix3 centre-crops it; we open the editor instead)
  document.addEventListener('change', function (e) {
    var inp = e.target;
    if (!inp || inp.type !== 'file' || inp.parentNode !== document.body || inp.style.display !== 'none' || !/image/.test(inp.accept || '')) return;
    var f = inp.files && inp.files[0]; if (!f) return;
    e.stopImmediatePropagation(); e.stopPropagation();
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () { inp.value = ''; editor(img, url); };
    img.onerror = function () { URL.revokeObjectURL(url); inp.value = ''; };
    img.src = url;
  }, true);

  function editor(img, url) {
    var W = window.innerWidth, H = window.innerHeight, D = Math.min(W - 48, 330), cx = W / 2, cy = Math.max(D / 2 + 110, H * 0.44);
    var iw = img.naturalWidth, ih = img.naturalHeight, min = D / Math.min(iw, ih), s = min, x = cx, y = cy;   // x,y = where the photo's middle is
    var o = document.createElement('div'); o.className = 'kzcr'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Move and scale your photo');
    o.innerHTML = '<p class="kzcr-t">Move and scale</p><img class="kzcr-img" alt="" draggable="false">' +
      '<div class="kzcr-hole"><i class="kzcr-g v1"></i><i class="kzcr-g v2"></i><i class="kzcr-g h1"></i><i class="kzcr-g h2"></i><i class="kzcr-c v"></i><i class="kzcr-c h"></i></div>' +
      '<p class="kzcr-hint">Drag to move · pinch to zoom<br>The gold line shows when it’s centred</p>' +
      '<div class="kzcr-acts"><button type="button" class="kzcr-b" data-cr="x">Cancel</button><button type="button" class="kzcr-b gold" data-cr="ok">Use photo</button></div>';
    document.body.appendChild(o);
    var el = o.querySelector('.kzcr-img'), hole = o.querySelector('.kzcr-hole'), cV = o.querySelector('.kzcr-c.v'), cH = o.querySelector('.kzcr-c.h');
    el.src = url;
    hole.style.cssText = 'width:' + D + 'px;height:' + D + 'px;left:' + (cx - D / 2) + 'px;top:' + (cy - D / 2) + 'px';
    document.documentElement.classList.add('kzcr-on');
    var SNAP = 8, snapX = true, snapY = true;
    function clamp() {
      s = Math.max(min, Math.min(min * 6, s));
      var hw = iw * s / 2, hh = ih * s / 2;
      x = Math.min(cx - D / 2 + hw, Math.max(cx + D / 2 - hw, x));
      y = Math.min(cy - D / 2 + hh, Math.max(cy + D / 2 - hh, y));
      snapX = Math.abs(x - cx) < SNAP; snapY = Math.abs(y - cy) < SNAP;
      if (snapX) x = cx; if (snapY) y = cy;
    }
    function draw() {
      clamp();
      el.style.width = iw * s + 'px'; el.style.height = ih * s + 'px';
      el.style.transform = 'translate3d(' + (x - iw * s / 2) + 'px,' + (y - ih * s / 2) + 'px,0)';
      cV.classList.toggle('on', snapX); cH.classList.toggle('on', snapY);
    }
    draw();
    // touch: one finger moves, two fingers pinch (zoom about the point between them)
    var g = null;
    function pts(e) { return [].map.call(e.touches, function (t) { return [t.clientX, t.clientY]; }); }
    function start(p) {
      if (p.length >= 2) { var mx = (p[0][0] + p[1][0]) / 2, my = (p[0][1] + p[1][1]) / 2; g = { two: 1, d: Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), s: s, mx: mx, my: my, x: x, y: y }; }
      else if (p.length === 1) g = { two: 0, px: p[0][0], py: p[0][1], x: x, y: y };
      o.classList.add('moving');
    }
    o.addEventListener('touchstart', function (e) { if (e.target.closest('.kzcr-acts')) return; e.preventDefault(); start(pts(e)); }, { passive: false });
    o.addEventListener('touchmove', function (e) {
      if (!g) return; e.preventDefault(); var p = pts(e);
      if (g.two && p.length >= 2) {
        var d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), mx = (p[0][0] + p[1][0]) / 2, my = (p[0][1] + p[1][1]) / 2, ns = Math.max(min, Math.min(min * 6, g.s * d / g.d)), k = ns / g.s;
        s = ns; x = mx + (g.x - g.mx) * k; y = my + (g.y - g.my) * k;
      } else if (!g.two && p.length === 1) { x = g.x + p[0][0] - g.px; y = g.y + p[0][1] - g.py; }
      draw();
    }, { passive: false });
    o.addEventListener('touchend', function (e) { var p = pts(e); if (p.length) start(p); else { g = null; o.classList.remove('moving'); } });
    // mouse (and the test browser): drag + wheel
    o.addEventListener('mousedown', function (e) { if (e.target.closest('.kzcr-acts')) return; g = { two: 0, px: e.clientX, py: e.clientY, x: x, y: y, m: 1 }; o.classList.add('moving'); });
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    function mm(e) { if (g && g.m) { x = g.x + e.clientX - g.px; y = g.y + e.clientY - g.py; draw(); } }
    function mu() { if (g && g.m) { g = null; o.classList.remove('moving'); } }
    o.addEventListener('wheel', function (e) { e.preventDefault(); var ns = Math.max(min, Math.min(min * 6, s * Math.exp(-e.deltaY / 400))), k = ns / s; s = ns; x = cx + (x - cx) * k; y = cy + (y - cy) * k; draw(); }, { passive: false });
    function done() {
      window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu);
      document.documentElement.classList.remove('kzcr-on'); o.classList.add('out');
      setTimeout(function () { o.remove(); URL.revokeObjectURL(url); }, 220);
    }
    o.querySelector('[data-cr="x"]').addEventListener('click', done);
    o.querySelector('[data-cr="ok"]').addEventListener('click', function () {
      var S = 512, c = document.createElement('canvas'); c.width = c.height = S; var cx2 = c.getContext('2d');
      var sx = (cx - D / 2 - (x - iw * s / 2)) / s, sy = (cy - D / 2 - (y - ih * s / 2)) / s, sw = D / s;
      cx2.imageSmoothingQuality = 'high'; cx2.drawImage(img, sx, sy, sw, sw, 0, 0, S, S);
      try { K.set('avatar', c.toDataURL('image/jpeg', 0.86)); } catch (er) {}
      try { document.dispatchEvent(new CustomEvent('kz:changed')); } catch (er) {}
      done();
    });
    K.__kzcrop = { get: function () { return { x: x, y: y, s: s, cx: cx, cy: cy, D: D, min: min, snapX: snapX, snapY: snapY }; } };
  }
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztoday-1027b.js ==== */
;try {
/* Oct 27 · kztoday-1027 (all pages). James:
   1. "Lock in my plan should be fixed below Repeat every day": in Plan today the gold button was sticky to the bottom and sat on
      top of the Repeat row. It now comes right after the Repeat row (moved in the page), in the normal flow.
   2. "This, the zoom on the Today tab, should be replaced by the second picture's view": tapping your plan on Today opens
      Plan today (the editor: tasks, ×, Repeat, Lock in my plan) instead of the "Last night's plan" view.
      After you lock it in, the view still closes straight back to Today (kzplanfix-1027).
   3. "Line all these up": the long-term milestone circle (kzseg) is moved sideways so its centre is exactly under the
      daily checks' centres in the same list. Styles: kztoday-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kztoday) return; K.__kztoday = 1;   // 1027b replaces kztoday-1027
  function wrap() {
    if (K.openPlanView && !K.openPlanView.__kzt && K.openPlanner) {
      var f = function (day) { try { return K.openPlanner(day); } catch (e) {} };
      f.__kzt = 1; f.__orig = K.openPlanView; K.openPlanView = f;
    }
  }
  function lockBelow() {
    [].forEach.call(document.querySelectorAll('.kz-pm-in'), function (box) {
      var b = box.querySelector('[data-t="pm-save"]'), rep = box.querySelector('.kz-pm-rep');
      if (!b || !rep || rep.parentNode !== box || b.parentNode !== box) return;
      if (rep.nextElementSibling !== b) box.insertBefore(b, rep.nextSibling);
      b.classList.add('kzt-lock');
    });
  }
  function align() {
    var ref = [].filter.call(document.querySelectorAll('button.kz-check'), function (x) { return x.offsetParent; })[0]; if (!ref) return;
    var rr = ref.getBoundingClientRect(), cx = rr.left + rr.width / 2;
    [].forEach.call(document.querySelectorAll('.kzseg'), function (s) {
      if (!s.offsetParent) return;
      var cur = parseFloat(s.style.getPropertyValue('--kzt-dx')) || 0, g = s.querySelector('.kzseg-g') || s, r = g.getBoundingClientRect();
      var dx = Math.round((cur + cx - (r.left + r.width / 2)) * 2) / 2;
      if (Math.abs(dx) > 24) return;   // a different column (another layout): leave it
      if (dx !== cur) s.style.setProperty('--kzt-dx', dx + 'px');
    });
  }
  var at = 0; function run() { q = 0; wrap(); lockBelow(); clearTimeout(at); at = setTimeout(align, 160); }   // 1027b: align measures positions (forces layout), so it runs once the page has been still for 160 ms, not on every frame of a check-off glide
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i]; if (t.type === 'attributes' && t.attributeName === 'style') continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', soon);
  soon(); setTimeout(soon, 400); setTimeout(soon, 1500);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsheetmo-1028.js ==== */
;try {
/* Oct 28 · a bottom sheet that closes slides down instead of vanishing (styles: kzsheetmo-1028.css). The app hides a
   sheet by setting its hidden attribute; this keeps it drawn for 260 ms with class kz-closing (taps pass through), so
   every check of sheet.hidden still sees it closed right away. Reopening mid-slide just opens it again. */
(function () {
  if (window.__kzsmo) return; window.__kzsmo = 1;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var RMO = window.__RealMO || MutationObserver;
  function seen(el, was) {
    if (!el.classList || !el.classList.contains('kz-sheet49')) return;
    if (el.hasAttribute('hidden')) {
      if (was !== null || el.classList.contains('kz-closing')) return;   // only a sheet that was showing
      el.classList.add('kz-closing'); clearTimeout(el.__kzsmo);
      el.__kzsmo = setTimeout(function () { el.classList.remove('kz-closing'); }, 270);
    } else if (el.classList.contains('kz-closing')) { clearTimeout(el.__kzsmo); el.classList.remove('kz-closing'); }
  }
  function boot() {
    new RMO(function (recs) { for (var i = 0; i < recs.length; i++) seen(recs[i].target, recs[i].oldValue); })
      .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['hidden'], attributeOldValue: true });
  }
  if (document.documentElement) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzkb-1028.js ==== */
;try {
/* Oct 29 · James: "when I try to edit my notes or add a reminder it glitches and doesn't let me click anything or exit out",
   and "no matter what page you're on, the enter button on the keyboard closes the keyboard".
   1. The note editor (Journal → Notes, + → Note to self) is a full-height sheet whose text box grows with the note. When the
      keyboard came up, the keyboard helper (1dddad8ca7f2.js) slid the whole sheet up by however far the bottom of that box sat
      under the keyboard; with a long note that was most of the screen, so Cancel / Save went off the top. Now the editor is
      never slid: while the keyboard is up it is sized to the space above the keyboard and its body scrolls on its own; the
      text box stops growing at about a third of the screen and scrolls inside (styles: kzkb-1028.css).
   2. Return closes the keyboard in every text box, multi-line ones included. Boxes whose Return already did something (add a
      to-do, save a name) still do it first (that part is 1dddad8ca7f2.js); in a multi-line box Return no longer adds a line. */
(function () {
  if (window.__kzkb28) return; window.__kzkb28 = 1;
  var vv = window.visualViewport;
  function fit() {
    var back = document.querySelector('.kznt-back'); if (!back) return;
    var open = vv && (window.innerHeight - (vv.height + vv.offsetTop)) > 100;
    if (open) { back.classList.add('kz-kbfit'); back.style.top = Math.round(vv.offsetTop) + 'px'; back.style.height = Math.round(vv.height) + 'px'; back.style.bottom = 'auto'; }
    else if (back.classList.contains('kz-kbfit')) { back.classList.remove('kz-kbfit'); back.style.top = ''; back.style.height = ''; back.style.bottom = ''; }
    var sh = back.querySelector('.kznt-sheet'); if (sh && sh.style.translate) sh.style.translate = '';
    var a = document.activeElement, body = back.querySelector('.kznt-body');
    if (open && a && body && body.contains(a) && a.getBoundingClientRect) {   // keep the box you type in inside the sheet's own scroll
      var r = a.getBoundingClientRect(), b = body.getBoundingClientRect();
      if (r.top < b.top) body.scrollTop -= (b.top - r.top) + 8; else if (r.top > b.bottom - 60) body.scrollTop += r.top - (b.bottom - 60);
    }
  }
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  document.addEventListener('focusin', function () { setTimeout(fit, 0); setTimeout(fit, 400); }, true);
  document.addEventListener('focusout', function () { setTimeout(fit, 80); }, true);
  // Return closes the keyboard in multi-line boxes too (single-line ones are handled by 1dddad8ca7f2.js)
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.key !== 'Enter' || e.isComposing || e.shiftKey || !t) return;
    if (t.tagName === 'TEXTAREA' || t.isContentEditable) { e.preventDefault(); t.blur(); }
  }, true);
  document.addEventListener('focusin', function (e) { var t = e.target; if (t && t.tagName === 'TEXTAREA' && !t.hasAttribute('enterkeyhint')) t.setAttribute('enterkeyhint', 'done'); }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kztodoany-1027b.js ==== */
;try {
/* Oct 27 b · replaces kztodoany-1027.js. The To-do in the + sheet on every tab is now the full Today to-do form
   (James: "don't make it simplified"): When (Today / Tomorrow / This week / Pick dates with the month calendar),
   Repeat (added by kzrepeat-1027, which reads the same data-t fields), Time of day bar, Exact time + reminder.
   The markup and behaviour are copied from Today's sheet (index.html) so both look and work the same. */
(function () {
  var K = window.KZ; if (!K || window.__kzta) return; window.__kzta = 1;
  function post(m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} }
  var st = { when: 'today', tFrom: '', tTo: '', tPart: 'any', calM: null, calFresh: false };
  var kd = function (d) { return K.key(d); };
  function q(sh, k) { return sh.querySelector('[data-t="' + k + '"]'); }
  var BOX = '<label class="kz-field49"><span class="kz-label49">The to-do</span><input class="kzta-in" maxlength="90" placeholder="e.g. Email my professor" autocomplete="off" enterkeyhint="done"></label>' +
    '<div class="kz-tfields" data-t="tfields">' +
    '<div class="kz-field49"><span class="kz-label49">When</span><div class="kz-chips49" data-t="twhen" role="group" aria-label="When"><button type="button" data-w="today" aria-pressed="true">Today</button><button type="button" data-w="tmr" aria-pressed="false">Tomorrow</button><button type="button" data-w="week" aria-pressed="false">This week</button><button type="button" data-w="pick" aria-pressed="false">Pick dates</button></div></div>' +
    '<div class="kz-mcal" data-t="tcal" hidden></div><p class="kz-trange" data-t="trange"></p>' +
    '<div class="kz-field49" data-t="tpart-w"><span class="kz-label49">Time of day</span><div class="kz-chips49" data-t="tpart" role="group" aria-label="Part of the day"></div></div>' +
    '<label class="kz-steprow kz-switchrow kz-tuse-old" hidden><span><strong>At a set time</strong><em>With a reminder on your phone</em></span><input type="checkbox" class="kz-sw49" data-t="tuse"></label>' +
    '<div class="kz-ttime" data-t="ttime-w" hidden><label class="kz-field49"><span class="kz-label49">Time</span><input type="time" data-t="ttime" value="09:00"></label>' +
    '<label class="kz-field49"><span class="kz-label49">Remind me</span><select data-t="tremind"></select></label><button type="button" class="kz-tl-link" data-tl="parts">Use a part of the day instead</button></div>' +
    '</div><button type="button" class="kzta-go"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Add to-do</button>';
  function inject() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-goalsheet .kz-kindseg'), function (seg) {
      if (seg.querySelector('[data-kind="todo"]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('data-kind', 'todo'); b.setAttribute('aria-checked', 'false'); b.className = 'kzta-kind'; b.textContent = 'To-do';
      seg.insertBefore(b, seg.querySelector('[data-kind="quit"]') || null);
      var form = seg.closest('form'); if (form && !form.querySelector('.kzta-box')) {
        var box = document.createElement('div'); box.className = 'kzta-box'; box.innerHTML = BOX;
        var note = form.querySelector('.kznt-entry'); (note || seg).parentNode.insertBefore(box, (note || seg).nextSibling);
        var rem = q(box, 'tremind'); rem.innerHTML = (K.REMIND || []).map(function (r) { return '<option value="' + r[0] + '">' + r[1] + '</option>'; }).join('') + '<option value="-1">No reminder</option>';
      }
    });
  }
  function sheetOf(el) { return el && el.closest && el.closest('.kz-sheet49'); }
  function setWhen(sh, w) {
    st.when = w; var t = K.today();
    if (w === 'today') { st.tFrom = kd(t); st.tTo = ''; } else if (w === 'tmr') { st.tFrom = kd(K.addDays(t, 1)); st.tTo = ''; }
    else if (w === 'week') { st.tFrom = kd(t); st.tTo = kd(K.addDays(t, (7 - t.getDay()) % 7)); }
    else if (w === 'pick') { st.tFrom = kd(t); st.tTo = ''; st.calFresh = true; }
    paintWhen(sh);
  }
  function paintWhen(sh) {
    q(sh, 'twhen').querySelectorAll('[data-w]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.w === st.when)); });
    var useT = q(sh, 'tuse').checked; q(sh, 'ttime-w').hidden = !useT; q(sh, 'tpart-w').hidden = useT;
    var BAR = (K.PARTS || []).filter(function (x) { return x[0] !== 'any'; }), cur = (K.PARTS || []).filter(function (x) { return x[0] === st.tPart; })[0];
    q(sh, 'tpart').innerHTML = '<div class="kz-tl-bar" role="radiogroup" aria-label="Time of day">' + BAR.map(function (x) { return '<button type="button" role="radio" class="kz-tl-' + x[0] + '" data-part="' + x[0] + '" aria-checked="' + (x[0] === st.tPart) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="kz-tl-ticks" aria-hidden="true"><span>Morning</span><span>12 PM</span><span>5 PM</span><span>9 PM</span><span>Late</span></div>' +
      '<div class="kz-tl-row"><span class="kz-tl-now">' + (st.tPart === 'any' ? 'Anytime' : (cur ? cur[1] : 'Anytime')) + ' · no reminder</span><span class="kz-tl-acts">' + (st.tPart !== 'any' ? '<button type="button" class="kz-tl-link" data-part="any">Anytime</button>' : '') + '<button type="button" class="kz-tl-link" data-tl="time">Exact time</button></span></div>';
    q(sh, 'tcal').hidden = st.when !== 'pick'; if (st.when === 'pick') paintCal(sh);
    var f = function (k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
    q(sh, 'trange').textContent = st.tTo && st.tTo !== st.tFrom ? 'Shows on Today from ' + f(st.tFrom) + ' to ' + f(st.tTo) + '. Done any day in between counts.' : st.when === 'pick' ? 'Shows on Today on ' + f(st.tFrom) + '. Tap a second day to make it a stretch of days.' : st.when === 'tmr' ? 'Shows up tomorrow.' : st.when === 'week' ? 'Shows every day until ' + f(st.tTo) + ', or until you check it off.' : 'Just for today.';
  }
  function paintCal(sh) {
    var t = K.today(); if (!st.calM) st.calM = new Date(t.getFullYear(), t.getMonth(), 1);
    var y = st.calM.getFullYear(), m = st.calM.getMonth(), first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), lead = first.getDay(), tk = kd(t), cells = '';
    for (var i = 0; i < lead; i++) cells += '<span></span>';
    for (var d = 1; d <= days; d++) { var k = kd(new Date(y, m, d)), past = k < tk, inR = st.tFrom && st.tTo && k > st.tFrom && k < st.tTo, ends = k === st.tFrom || k === st.tTo;
      cells += '<button type="button" data-cal="' + k + '"' + (past ? ' disabled' : '') + ' class="' + (ends ? 'end' : inR ? 'in' : '') + (k === tk ? ' today' : '') + '">' + d + '</button>'; }
    var canBack = y > t.getFullYear() || m > t.getMonth();
    q(sh, 'tcal').innerHTML = '<div class="kz-mcal-h"><button type="button" data-calnav="-1" aria-label="Previous month"' + (canBack ? '' : ' disabled') + '>‹</button><b>' + first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</b><button type="button" data-calnav="1" aria-label="Next month">›</button></div>' +
      '<div class="kz-mcal-w">' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function (x) { return '<i>' + x + '</i>'; }).join('') + '</div><div class="kz-mcal-g">' + cells + '</div>';
  }
  function setOn(sh, on) {
    sh.classList.toggle('kzta-on', on);
    var t = sh.querySelector('[data-gx="t"]'); if (t) { if (on) { if (!t.__kzta) t.__kzta = t.textContent; t.textContent = 'New to-do'; } else if (t.__kzta && t.textContent === 'New to-do') t.textContent = t.__kzta; }
    var tb = sh.querySelector('.kzta-kind'); if (tb) tb.setAttribute('aria-checked', String(on));
    if (!on && !sh.querySelector('.kz-kindseg [data-kind]:not([data-kind="todo"])[aria-checked="true"]')) {   // give the goal kinds their pick back, or the sheet won't reopen
      var pv = sh.querySelector('.kz-kindseg [data-kind="' + (sh.__kztaPrev || 'long') + '"]') || sh.querySelector('.kz-kindseg [data-kind="long"]'); if (pv) pv.setAttribute('aria-checked', 'true'); }
    if (on) { var cur = sh.querySelector('.kz-kindseg [data-kind]:not([data-kind="todo"])[aria-checked="true"]'); if (cur) sh.__kztaPrev = cur.getAttribute('data-kind');
      Array.prototype.forEach.call(sh.querySelectorAll('.kz-kindseg [data-kind]:not([data-kind="todo"])'), function (b) { b.setAttribute('aria-checked', 'false'); });
      st.tPart = 'any'; st.calM = null; var u = q(sh, 'tuse'); if (u) u.checked = false; setWhen(sh, 'today'); }
  }
  function add(sh) {
    var inp = sh.querySelector('.kzta-in'), txt = inp ? inp.value.trim() : ''; if (!txt) { if (inp) inp.focus(); return; }
    var useT = q(sh, 'tuse').checked;
    var id = K.addTodo ? K.addTodo({ txt: txt, from: st.tFrom, to: st.tTo, part: st.tPart, time: useT ? q(sh, 'ttime').value : '', remind: useT ? +q(sh, 'tremind').value : -1 }) : null; if (!id) return;
    post({ type: 'haptic', n: 2 }); try { document.dispatchEvent(new CustomEvent('kz:changed')); } catch (e) {}
    var today = st.tFrom === kd(K.today());
    inp.value = ''; inp.blur(); setOn(sh, false);
    var x = sh.querySelector('[data-gx="close"]'); if (x) x.click();
    if (K.toast) K.toast(today ? 'To-do added to Today' : 'To-do added');
  }
  // window capture: runs before the sheet's own kind handlers (kzfix3 relabels the gold button on a kind tap, which removed the label the sheet needs to reopen)
  window.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var kb = t.closest('.kz-goalsheet .kz-kindseg [data-kind]');
    if (kb) {
      var sh = sheetOf(kb); if (!sh) return;
      if (kb.getAttribute('data-kind') === 'todo') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (sh.classList.contains('kzq-on')) { var lg = sh.querySelector('.kz-kindseg [data-kind="long"]'); if (lg) lg.click(); }
        setOn(sh, true); post({ type: 'tick' }); var inp = sh.querySelector('.kzta-in'); if (inp) setTimeout(function () { inp.focus(); }, 30);
      } else if (sh.classList.contains('kzta-on')) setOn(sh, false);
      return;
    }
    var sh2 = sheetOf(t); if (!sh2 || !sh2.classList.contains('kzta-on')) return;
    var w = t.closest('[data-t="twhen"] [data-w]'); if (w) { setWhen(sh2, w.dataset.w); return; }
    var p = t.closest('[data-t="tpart"] [data-part]'); if (p) { st.tPart = p.dataset.part; paintWhen(sh2); return; }
    if (t.closest('[data-t="tpart"] [data-tl="time"]')) { var u = q(sh2, 'tuse'); u.checked = true; var hr = new Date().getHours() + 1; if (st.when === 'today' && hr < 24) q(sh2, 'ttime').value = (hr < 10 ? '0' : '') + hr + ':00'; paintWhen(sh2); return; }
    if (t.closest('[data-t="ttime-w"] [data-tl="parts"]')) { q(sh2, 'tuse').checked = false; paintWhen(sh2); return; }
    var n = t.closest('[data-t="tcal"] [data-calnav]'); if (n) { st.calM = new Date(st.calM.getFullYear(), st.calM.getMonth() + +n.dataset.calnav, 1); paintCal(sh2); return; }
    var c = t.closest('[data-t="tcal"] [data-cal]'); if (c && !c.disabled) { var k = c.dataset.cal;
      if (st.calFresh || !st.tFrom || st.tTo || k < st.tFrom) { st.tFrom = k; st.tTo = ''; st.calFresh = false; } else if (k === st.tFrom) st.tTo = ''; else st.tTo = k;
      paintWhen(sh2); return; }
    var go = t.closest('.kzta-go'); if (go) { e.preventDefault(); add(sh2); }
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('kzta-in')) { e.preventDefault(); add(sheetOf(e.target)); } }, true);
  var qq = 0;
  function run() { qq = 0; inject(); Array.prototype.forEach.call(document.querySelectorAll('.kz-sheet49.kzta-on'), function (sh) { if (sh.hidden || getComputedStyle(sh).display === 'none') setOn(sh, false); }); }
  function boot() { run(); new MutationObserver(function () { if (!qq) qq = requestAnimationFrame(run); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzrib-1027.js ==== */
;try {
/* Oct 27 · a better medal ribbon. The old one was two flat slanted blocks with stripes that ran straight down
   (not along the strap), cut off square at the top. This one: two straps in a V, stripes that follow each strap,
   rounded fabric shading, the back strap darker, a small metal loop where they meet, and the tops fade out as if
   the ribbon goes on up out of view. Same colours per metal. Replaces K.medalRibbon and redraws any already drawn. */
(function () {
  var K = window.KZ; if (!K) return;
  var RIB = { bronze: ['#6E4123', '#E8C9A3', '#C98B55'], silver: ['#1F3A66', '#E9EEF5', '#B9C3D1'], gold: ['#7E1820', '#F2D27A', '#E2B93B'], rose: ['#6E1E2B', '#F6C2A8', '#E59A8C'], platinum: ['#0F4E5C', '#DDF3F8', '#A9D6E0'], aurora: ['#4B2A8C', '#F7A8E0', '#C79BF2'] };
  function f2(n) { return Math.round(n * 100) / 100; }
  // a band across a strap from fraction a to b (0 = outer edge, 1 = inner edge)
  function band(side, a, b) {
    var tx = side ? function (f) { return 55 - 20 * f; } : function (f) { return 5 + 20 * f; };
    var bx = side ? function (f) { return 36 - 12 * f; } : function (f) { return 24 + 12 * f; };
    return f2(tx(a)) + ',0 ' + f2(tx(b)) + ',0 ' + f2(bx(b)) + ',38 ' + f2(bx(a)) + ',38';
  }
  function strap(side, c, id, back) {
    return '<g' + (back ? ' opacity=".82"' : '') + '>' +
      '<polygon points="' + band(side, 0, 1) + '" fill="' + c[0] + '"/>' +
      '<polygon points="' + band(side, .36, .45) + '" fill="' + c[1] + '"/><polygon points="' + band(side, .55, .64) + '" fill="' + c[1] + '"/>' +
      '<polygon points="' + band(side, 0, .14) + '" fill="#000" opacity=".28"/><polygon points="' + band(side, .86, 1) + '" fill="#000" opacity=".34"/>' +
      '<polygon points="' + band(side, .16, .28) + '" fill="#fff" opacity=".13"/>' +
      (back ? '<polygon points="' + band(side, 0, 1) + '" fill="#000" opacity=".22"/>' : '') + '</g>';
  }
  K.medalRibbon = function (n) {
    var m = K.medalMetal ? K.medalMetal(n) : 'bronze', c = RIB[m] || RIB.bronze, id = 'kzr2-' + m;
    return '<svg class="kzm-rib kzm-rib2" viewBox="0 0 60 40" aria-hidden="true" focusable="false" preserveAspectRatio="none" data-metal="' + m + '"><defs>' +
      '<linearGradient id="' + id + '-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".32" stop-color="#fff" stop-opacity="1"/></linearGradient>' +
      '<mask id="' + id + '-m" maskUnits="userSpaceOnUse" x="0" y="0" width="60" height="40"><rect width="60" height="40" fill="url(#' + id + '-fade)"/></mask>' +
      '<linearGradient id="' + id + '-ring" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="' + c[2] + '"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>' +
      '<linearGradient id="' + id + '-sh" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>' +
      '<g mask="url(#' + id + '-m)">' + strap(1, c, id, true) + strap(0, c, id, false) +
      '<rect x="0" y="0" width="60" height="40" fill="url(#' + id + '-sh)"/></g>' +
      '<rect x="25.5" y="32" width="9" height="7.5" rx="2.6" fill="url(#' + id + '-ring)" stroke="rgba(0,0,0,.35)" stroke-width=".6"/></svg>';
  };
  function metalOf(svg) {
    var m = svg.getAttribute('data-metal'); if (m) return m;
    var g = svg.querySelector('linearGradient[id^="kzr-"]'); return g ? g.id.replace(/^kzr-/, '').replace(/-sh$/, '') : '';
  }
  var N = { bronze: 1, silver: 7, gold: 30, rose: 75, platinum: 150, aurora: 365 }, byMetal = {};
  function redraw() {
    Array.prototype.forEach.call(document.querySelectorAll('svg.kzm-rib:not(.kzm-rib2)'), function (s) {
      var m = metalOf(s); if (!m || !RIB[m]) return;
      if (!byMetal[m]) { // find a number that maps to this metal (the drawing only depends on the metal)
        var n = N[m]; if (K.medalMetal && K.medalMetal(n) !== m) { for (var i = 1; i < 2000; i++) if (K.medalMetal(i) === m) { n = i; break; } }
        byMetal[m] = K.medalRibbon(n);
      }
      var t = document.createElement('div'); t.innerHTML = byMetal[m]; var nw = t.firstChild; if (s.getAttribute('style')) nw.setAttribute('style', s.getAttribute('style'));
      s.parentNode.replaceChild(nw, s);
    });
  }
  var q = 0;
  function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { redraw(); } catch (e) {} }); }
  function boot() { redraw(); new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) if (l[i].addedNodes.length) { soon(); return; } }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzrepeat-1103.js ==== */
;try {
/* Nov 3 · kzrepeat-1103 = kzrepeat-1027 with a new materialize (copies two weeks ahead, renames carry, a deleted day stops it).
   Oct 27 · kzrepeat-1027 (all pages). James, on New to-do: "Make it stick should not be on the to-do tab", "Exact time should
   not have sharp corners", "add an option to make it recurring every day, or every week, or specific days of the week, or
   just specific days this week".
   - New to-do gets a "Repeat" row: Never · Daily · Weekly · Pick days. Every week repeats on the weekday the to-do
     starts (Today or Tomorrow). Pick days shows S M T W T F S to pick the days. A repeating to-do is kept as a rule
     (kz_todorep) and each day it applies, a normal to-do for that day is added, so checking it off, XP, reminders and
     history all work exactly like any other to-do. Delete today's copy and the repeat stops (the hint says so).
   - "This week" (no repeat) gets the same day chips for the days left this week: pick some and you get one to-do on each
     of those days. Pick none and it works as before (shows every day until done).
   - The sheet gets a class for the chosen kind (kzk-todo …) so the to-do sheet never shows Make it stick.
   Styles: kzrepeat-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzrep) return; K.__kzrep = 1;
  var DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], DL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function key(d) { return K.key ? K.key(d) : d.toISOString().slice(0, 10); }
  function today() { return K.today ? K.today() : new Date(); }
  function addDays(d, n) { return K.addDays ? K.addDays(d, n) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function dateOf(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function rules() { return K.get('todorep', []) || []; }
  function saveRules(a) { K.set('todorep', a); }
  function todos() { return K.get('todos', []) || []; }
  function applies(r, k) {
    if (k < r.start) return false; var wd = dateOf(k).getDay();
    return r.type === 'daily' || (r.type === 'weekly' && wd === dateOf(r.start).getDay()) || (r.type === 'days' && (r.days || []).indexOf(wd) > -1);
  }
  // ---------- Nov 3 (James: a weekday to-do only showed today, kept its old name on other days, and jumped days) ----------
  // A repeat now puts its copy on every matching day for the next two weeks (so Plan shows it on every weekday), a rename on
  // any day renames every upcoming copy and the rule, and deleting a day's copy stops the repeat from that day on (as the
  // hint says). r.made = days a copy was put on, so a copy you deleted is never re-added.
  var AHEAD = 14;
  function materialize() {
    var tk = key(today()), rs = rules(); if (!rs.length) return;
    var ts = todos(), changed = false, rchanged = false, days = [];
    for (var i = 0; i < AHEAD; i++) days.push(key(addDays(today(), i)));
    rs = rs.filter(function (r) {
      var mine = ts.filter(function (t) { return t.rep === r.id; });
      if (!r.made) { r.made = mine.map(function (t) { return t.from; }); if (r.last && r.made.indexOf(r.last) < 0 && r.last < tk) r.made.push(r.last); rchanged = true; }
      var has = {}; mine.forEach(function (t) { has[t.from] = t; });
      // a copy you deleted (today or later): the repeat stops there; later copies you haven't checked go too
      var gone = r.made.filter(function (k) { return k >= tk && !has[k]; }).sort()[0];
      if (gone) { ts = ts.filter(function (t) { return !(t.rep === r.id && t.from > gone && !t.done); }); changed = rchanged = true; return false; }
      // a rename on any upcoming copy carries to the rule and every other upcoming copy
      if (r.ptxt == null) { r.ptxt = r.txt; rchanged = true; }
      if (r.txt === r.ptxt) { var up = mine.filter(function (t) { return t.from >= tk && t.txt && t.txt !== r.ptxt; })[0]; if (up) r.txt = up.txt; }
      if (r.txt !== r.ptxt) { r.ptxt = r.txt; rchanged = true; }
      mine.forEach(function (t) { if (t.from >= tk && !t.done && t.txt !== r.txt) { t.txt = r.txt; changed = true; } });
      days.forEach(function (k) {
        if (has[k] || r.made.indexOf(k) > -1 || !applies(r, k)) return;
        var twin = ts.filter(function (t) { return !t.rep && !t.done && t.from === k && (t.to || t.from) === k && String(t.txt).trim().toLowerCase() === String(r.txt).trim().toLowerCase(); })[0];
        if (twin) { twin.rep = r.id; r.made.push(k); changed = rchanged = true; return; }   // the same to-do you already had that day becomes the copy
        ts.push({ id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e6), txt: r.txt, from: k, to: k, part: r.part || 'any', time: r.time || '', remind: r.time && r.remind >= 0 ? r.remind : -1, done: null, created: tk, rep: r.id });
        r.made.push(k); changed = rchanged = true;
      });
      var keep = r.made.filter(function (k) { return k >= key(addDays(today(), -2)); }); if (keep.length !== r.made.length) { r.made = keep; rchanged = true; }
      r.last = tk;
      return true;
    });
    if (rchanged) saveRules(rs);
    if (changed) { K.set('todos', ts); try { document.dispatchEvent(new CustomEvent('kz:todos')); } catch (e) {} if (K.syncReminders) try { K.syncReminders(true); } catch (e) {} }
  }
  K.kzrepMaterialize = materialize;
  K.todoRepeats = rules;
  K.repeatText = function (r) {
    if (!r) return ''; if (r.type === 'daily') return 'Every day';
    if (r.type === 'weekly') return 'Every ' + DL[dateOf(r.start).getDay()];
    var d = (r.days || []).slice().sort(); return d.length === 7 ? 'Every day' : d.length === 5 && d.join() === '1,2,3,4,5' ? 'Weekdays' : d.map(function (x) { return DL[x].slice(0, 3); }).join(' · ');
  };

  // ---------- the New to-do sheet ----------
  var st = { rep: 'never', days: [], week: [] };
  function sheet() { return document.querySelector('.kz-addsheet'); }
  function kindNow(sh) { var b = sh && sh.querySelector('[role=radio][data-kind][aria-checked="true"]'); return b ? b.getAttribute('data-kind') : ''; }
  function isEdit(sh) { var h = sh && sh.querySelector('h2'); return /edit/i.test(h ? h.textContent : ''); }
  function whenNow(sh) { var b = sh.querySelector('[data-t="twhen"] [aria-pressed="true"]'); return b ? b.getAttribute('data-w') : 'today'; }
  function startKey(sh) { var w = whenNow(sh), t = today(); return key(w === 'tmr' ? addDays(t, 1) : t); }
  function weekLeft() { var t = today(), out = []; for (var i = 0; i <= (7 - t.getDay()) % 7; i++) out.push(key(addDays(t, i))); return out; }
  function chip(on, attr, v, label, extra) { return '<button type="button" ' + attr + '="' + v + '" aria-pressed="' + !!on + '"' + (extra || '') + '>' + label + '</button>'; }
  function html(sh) {
    var w = whenNow(sh), h = '<div class="kz-field49 kzrp"><span class="kz-label49">Repeat</span><div class="kz-chips49 kzrp-seg">' +
      chip(st.rep === 'never', 'data-rp', 'never', 'Never') + chip(st.rep === 'daily', 'data-rp', 'daily', 'Daily') + chip(st.rep === 'weekly', 'data-rp', 'weekly', 'Weekly') + chip(st.rep === 'days', 'data-rp', 'days', 'Pick days') + '</div>';
    if (st.rep === 'days') h += '<div class="kzrp-days" role="group" aria-label="Days of the week">' + DN.map(function (n, i) { return chip(st.days.indexOf(i) > -1, 'data-rd', i, n, ' aria-label="' + DL[i] + '"'); }).join('') + '</div>';
    if (st.rep === 'never' && w === 'week') {
      var wl = weekLeft();
      h += '<div class="kzrp-days kzrp-week" role="group" aria-label="Days this week">' + wl.map(function (k) { var d = dateOf(k); return chip(st.week.indexOf(k) > -1, 'data-rw', k, DN[d.getDay()] + '<small>' + d.getDate() + '</small>', ' aria-label="' + DL[d.getDay()] + '"'); }).join('') + '</div>';
    }
    var r = { type: st.rep, start: startKey(sh), days: st.days }, hint = '';
    if (st.rep === 'daily') hint = 'Shows up every day' + (r.start > key(today()) ? ' from tomorrow' : '') + '. Delete it on a day to stop it.';
    else if (st.rep === 'weekly') hint = 'Shows up every ' + DL[dateOf(r.start).getDay()] + '. Delete it on a day to stop it.';
    else if (st.rep === 'days') hint = st.days.length ? 'Shows up every ' + K.repeatText(r) + '. Delete it on a day to stop it.' : 'Pick the days it should show up.';
    else if (w === 'week') hint = st.week.length ? 'One to-do on each day you picked.' : 'Pick days to get one on each, or leave them and it stays until it’s done.';
    if (hint) h += '<p class="kzrp-hint">' + hint + '</p>';
    return h + '</div>';
  }
  function paint() {
    var sh = sheet(); if (!sh) return;
    var k = kindNow(sh); ['long', 'daily', 'todo', 'quit'].forEach(function (x) { sh.classList.toggle('kzk-' + x, x === k); });
    var tf = sh.querySelector('[data-t="tfields"]'), box = sh.querySelector('.kzrp-box');
    var show = tf && !tf.hidden && k === 'todo' && !isEdit(sh);
    if (!show) { if (box) box.hidden = true; return; }
    if (!box) { box = document.createElement('div'); box.className = 'kzrp-box'; var when = tf.querySelector('[data-t="twhen"]'); var f = when && when.closest('.kz-field49'); tf.insertBefore(box, f ? f.nextSibling : tf.firstChild); }
    box.hidden = false;
    // a repeat starts Today or Tomorrow: This week / Pick dates don't apply to it
    if (st.rep !== 'never') { var w = whenNow(sh); if (w === 'week' || w === 'pick') { var t = sh.querySelector('[data-t="twhen"] [data-w="today"]'); if (t) t.click(); } }
    sh.classList.toggle('kzrp-on', st.rep !== 'never' || (whenNow(sh) === 'week' && st.week.length > 0));
    var h = html(sh); if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzrp-box button'); if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('data-rp')) { st.rep = b.getAttribute('data-rp'); if (st.rep === 'days' && !st.days.length) st.days = [today().getDay()]; }
    else if (b.hasAttribute('data-rd')) { var i = +b.getAttribute('data-rd'), j = st.days.indexOf(i); if (j > -1) st.days.splice(j, 1); else st.days.push(i); }
    else if (b.hasAttribute('data-rw')) { var k = b.getAttribute('data-rw'), m = st.week.indexOf(k); if (m > -1) st.week.splice(m, 1); else st.week.push(k); }
    try { navigator.vibrate(4); } catch (er) {}
    paint();
  });
  // When chips: picking another start resets the this-week days
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.kz-addsheet [data-t="twhen"] [data-w]')) { st.week = []; setTimeout(paint, 0); } }, true);

  // saving: a repeat becomes a rule (+ today's copy if it applies); picked days this week become one to-do per day
  var add = K.addTodo;
  if (add && !add.__kzrep) {
    var wrapped = function (o) {
      var sh = sheet(), open = sh && !sh.hidden && getComputedStyle(sh).display !== 'none' && kindNow(sh) === 'todo' && !isEdit(sh);
      if (open && st.rep !== 'never' && !(st.rep === 'days' && !st.days.length)) {
        var tm = /^\d\d:\d\d$/.test(o.time || '') ? o.time : '';
        var r = { id: 'r' + Date.now().toString(36), txt: String(o.txt || '').trim().slice(0, 90), type: st.rep, days: st.days.slice(), start: o.from || key(today()), part: tm ? (K.partOfTime ? K.partOfTime(tm) : 'any') : (o.part || 'any'), time: tm, remind: tm && o.remind != null && o.remind >= 0 ? +o.remind : -1, last: '' };
        if (!r.txt) return null;
        var rs = rules(); rs.push(r); saveRules(rs); reset(); materialize();
        return todos().filter(function (t) { return t.rep === r.id; })[0] || r;
      }
      if (open && st.rep === 'never' && whenNow(sh) === 'week' && st.week.length) {
        var days = st.week.slice().sort(), last = null; reset();
        days.forEach(function (k) { var x = {}; for (var p in o) x[p] = o[p]; x.from = k; x.to = k; last = add.call(K, x); });
        return last;
      }
      return add.apply(K, arguments);
    };
    wrapped.__kzrep = 1; K.addTodo = wrapped;
  }
  function reset() { st = { rep: 'never', days: [], week: [] }; var b = document.querySelector('.kzrp-box'); if (b) b.__h = ''; }
  // a fresh sheet starts from Never
  var wasOpen = false;
  function watchOpen() { var sh = sheet(), open = !!(sh && !sh.hidden); if (open && !wasOpen) reset(); wasOpen = open; }

  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; watchOpen(); paint(); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzrp-box')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-checked', 'aria-pressed'] });
  materialize();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) materialize(); });
  // deleting today's copy stops the repeat: noticed right away (not only the same day), so tomorrow doesn't bring it back
  var mq = 0; document.addEventListener('kz:todos', function () { clearTimeout(mq); mq = setTimeout(materialize, 50); });
  setInterval(function () { if (!document.hidden) materialize(); }, 60000);   // past midnight with the app open
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzrpweek-1027.js ==== */
;try {
/* Oct 27 · New to-do → Repeat → Pick days: choose "Every week" (repeats on those days until you stop it) or
   "Just this week" (one to-do on each picked day left this week, no repeat). James: "pick days and have it repeat
   weekly, or never". Works on top of kzrepeat-1027 by driving its own buttons, so saving stays the same code:
   Just this week = Repeat Never + When This week + those days picked. */
(function () {
  if (window.__kzrpw) return; window.__kzrpw = 1;
  var DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  function box() { var all = document.querySelectorAll('.kzrp-box'); for (var i = 0; i < all.length; i++) if (!all[i].hidden && all[i].offsetParent) return all[i]; return null; }
  function sheetOf(b) { return b.closest('.kz-sheet49'); }
  function mode(b) {
    if (b.querySelector('.kzrp-seg [data-rp="days"][aria-pressed="true"]')) return 'every';
    var sh = sheetOf(b); if (b.querySelector('.kzrp-seg [data-rp="never"][aria-pressed="true"]') && sh && sh.querySelector('[data-t="twhen"] [data-w="week"][aria-pressed="true"]')) return 'once';
    return '';
  }
  function paint() {
    q = 0; var b = box(); if (!b) return;
    var m = mode(b), tg = b.querySelector('.kzrpw');
    if (!m) { if (tg) tg.remove(); return; }
    var anchor = b.querySelector('.kzrp-days'); if (!anchor) return;
    var h = '<button type="button" data-rpw="every" aria-pressed="' + (m === 'every') + '">Every week</button><button type="button" data-rpw="once" aria-pressed="' + (m === 'once') + '">Just this week</button>';
    if (!tg) { tg = document.createElement('div'); tg.className = 'kzrpw'; tg.setAttribute('role', 'group'); tg.setAttribute('aria-label', 'How often'); }
    if (tg.__h !== h) { tg.__h = h; tg.innerHTML = h; }
    if (tg.nextSibling !== anchor) anchor.parentNode.insertBefore(tg, anchor);
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  function later(fn) { setTimeout(fn, 30); }
  // each tap redraws the chips, so find them again before every tap
  function pickEach(sel, want) {
    for (var guard = 0; guard < 14; guard++) {
      var bx = box(); if (!bx) return;
      var c = [].filter.call(bx.querySelectorAll(sel), function (x) { return (x.getAttribute('aria-pressed') === 'true') !== !!want(x); })[0];
      if (!c) return; c.click();
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-rpw]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    var b = t.closest('.kzrp-box'), sh = b && sheetOf(b); if (!sh) return;
    var want = t.getAttribute('data-rpw'), m = mode(b); if (want === m) return;
    if (want === 'once') {
      var days = [].map.call(b.querySelectorAll('.kzrp-days [data-rd][aria-pressed="true"]'), function (x) { return +x.getAttribute('data-rd'); });
      b.querySelector('[data-rp="never"]').click();
      later(function () { var w = sh.querySelector('[data-t="twhen"] [data-w="week"]'); if (w) w.click();
        later(function () { pickEach('.kzrp-week [data-rw]', function (c) { var k = c.getAttribute('data-rw').split('-'); return days.indexOf(new Date(+k[0], +k[1] - 1, +k[2]).getDay()) > -1; }); soon(); }); });
    } else {
      var wds = [].map.call(b.querySelectorAll('.kzrp-week [data-rw][aria-pressed="true"]'), function (c) { var k = c.getAttribute('data-rw').split('-'); return new Date(+k[0], +k[1] - 1, +k[2]).getDay(); });
      var td = sh.querySelector('[data-t="twhen"] [data-w="today"]'); if (td) td.click();
      later(function () { var bx = box(); if (!bx) return; bx.querySelector('[data-rp="days"]').click();
        later(function () { if (wds.length) pickEach('.kzrp-days [data-rd]', function (c) { return wds.indexOf(+c.getAttribute('data-rd')) > -1; }); soon(); }); });
    }
    try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'tick' }); } catch (er) {}
  }, true);
  function boot() { new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'hidden'] }); soon(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzfx-1027.js ==== */
;try {
/* Oct 27 · kzfx-1027 (all pages): the little leaves that burst and fall when you check something off were added straight
   into the page (<body>), ~20 per tap. About a dozen helpers watch the page for changes, so every leaf made them all look
   again and measure the page, frame after frame, while the row was gliding: that was most of the "heavy" feel of a check-off.
   The leaves now go into their own layer next to the page (#kz-fx, outside <body>), so the helpers don't see them. They look
   and move exactly the same (they're fixed-position pieces either way). */
(function () {
  if (window.__kzfx || !document.body) return; window.__kzfx = 1;
  var fx = document.createElement('div'); fx.id = 'kz-fx'; fx.setAttribute('aria-hidden', 'true');
  document.documentElement.appendChild(fx);
  var FX = /(^|\s)kz-leaf(p|fall)(\s|$)/, ap = document.body.appendChild;
  document.body.appendChild = function (n) {
    if (n && n.nodeType === 1 && FX.test(typeof n.className === 'string' ? n.className : '')) { if (!fx.isConnected) document.documentElement.appendChild(fx); return fx.appendChild(n); }
    return ap.call(this, n);
  };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzmename-1030.js ==== */
;try {
/* Oct 30 · James (Me page): "take away the blank space below where you edit your name and make the edit your name a pop up
   not an expansion". Tapping your name on Me no longer unfolds a panel under the card (that panel also carried empty space
   from the account buttons, which are hidden). It opens a small pop-up instead: "Your name", the field (focused), Save and
   Cancel. Save uses the page's own name form (same storage, repaint and "Saved" toast). Tapping the photo still opens the
   photo options (kzfix3). Tap outside, Cancel or Escape closes it. Styles: kzmename-1030.css */
(function () {
  var K = window.KZ; if (!K || K.__kzmename) return; K.__kzmename = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var pop = null;
  function nameOf() { return K.userName ? K.userName() : String(K.get('username', '') || ''); }
  function close() {
    if (!pop) return; var p = pop; pop = null;
    var i = p.querySelector('input'); if (i) i.blur();
    p.classList.remove('on'); setTimeout(function () { p.remove(); }, 220);
  }
  function save() {
    if (!pop) return;
    var v = pop.querySelector('input').value.trim().slice(0, 24);
    var form = document.querySelector('#kz-me-panel form'), inp = document.getElementById('kz-me-name');
    if (form && inp) { inp.value = v; if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
    else { K.set('username', v); if (K.toast) K.toast(v ? 'Saved' : 'Name removed'); }
    post({ type: 'haptic', n: 1 }); close();
  }
  function open() {
    if (pop) return;
    pop = document.createElement('div'); pop.className = 'kzmn';
    pop.innerHTML = '<form class="kzmn-card" role="dialog" aria-modal="true" aria-labelledby="kzmn-t" novalidate>' +
      '<label class="kzmn-t" id="kzmn-t" for="kzmn-in">Your name</label>' +
      '<input id="kzmn-in" maxlength="24" autocomplete="given-name" enterkeyhint="done" placeholder="First name">' +
      '<div class="kzmn-acts"><button type="button" class="kzmn-b" data-kzmn="x">Cancel</button><button type="submit" class="kzmn-b gold">Save</button></div></form>';
    document.body.appendChild(pop);
    var inp = pop.querySelector('input'); inp.value = nameOf();
    pop.addEventListener('click', function (e) { if (e.target === pop || e.target.closest('[data-kzmn="x"]')) { e.preventDefault(); close(); } });
    pop.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); save(); });
    requestAnimationFrame(function () { if (pop) pop.classList.add('on'); });
    try { inp.focus({ preventScroll: true }); var n = inp.value.length; inp.setSelectionRange(n, n); } catch (e) { inp.focus(); }
  }
  addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('.kz-set-av')) return;               // the photo keeps its own options
    if (!t.closest('#kz-me .kz-set-prof')) return;
    e.preventDefault(); e.stopImmediatePropagation(); open();
  }, true);
  addEventListener('keydown', function (e) { if (pop && e.key === 'Escape') close(); });
  addEventListener('pagehide', close);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzshield-1102c.js ==== */
;try {
/* Nov 2 (b: the Tomorrow card footer redrawn in the climb's style) · one shield rule everywhere (James: "make it so you get a shield when you hit a checkpoint", "no contradictions").
   A shield comes at each checkpoint: day 7, 14, 30 and 45 in a row (the streak), check-off 7, 14, 30 and 45 (Kaizen 66). Hold 2.
   K.shieldNext(n) says how far the next one is; the shield track (Plan/Me) and the Tomorrow card count toward it instead of
   "the next 7 days". Replaces K.shieldTrack and K.tmrShield from index.html / kzbase-1026i.js. */
(function () {
  var K = window.KZ; if (!K || K.__kzshield) return; K.__kzshield = 1;
  var CPS = [7, 14, 30, 45], CYC = 66;
  K.SHIELD_AT = CPS;
  K.shieldNext = function (n) {
    n = Math.max(0, n | 0); var base = Math.floor(n / CYC) * CYC, c = n - base, prev = 0, next = null;
    for (var i = 0; i < CPS.length; i++) { if (CPS[i] > c) { next = CPS[i]; break; } prev = CPS[i]; }
    if (next === null) { prev = CPS[CPS.length - 1]; next = CYC + CPS[0]; }
    return { at: base + next, prog: c - prev, span: next - prev, left: next - c };
  };
  var SHI = function (on) { return '<svg class="kz-shi' + (on ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/>' + (on ? '<path class="t" d="M8.6 12.1l2.4 2.4 4.5-4.7"/>' : '') + '</svg>'; };
  function pipsOn(prog, span) { return Math.max(0, Math.min(7, Math.round(7 * prog / (span || 1)))); }
  K.shieldTrack = function () {
    var si = K.streakInfo(), sh = Math.min(2, si.shields || 0), st = K.streak(), full = sh >= 2, nx = K.shieldNext(st), on = full ? 7 : pipsOn(nx.prog, nx.span), left = nx.left;
    var pips = ''; for (var i = 0; i < 7; i++) pips += '<i' + (i < on ? ' class="on"' : '') + '></i>';
    return '<div class="kz-shtrack' + (full ? ' full' : '') + '" role="img" aria-label="' + sh + ' of 2 streak shields. ' + (full ? 'Full.' : left + (left === 1 ? ' day' : ' days') + ' to the next checkpoint, day ' + nx.at + '.') + '">' +
      '<div class="kz-sh-slots">' + SHI(sh > 0) + SHI(sh > 1) + '</div><div class="kz-sh-pips">' + pips + '</div>' +
      '<div class="kz-sh-next">' + (full ? '<b>FULL</b>' : '<b>' + left + '</b><small>' + (left === 1 ? 'DAY' : 'DAYS') + '</small>') + '</div></div>';
  };
  // Tomorrow card footer (Nov 2 · "fit the theme… make the words line up"): streak on one line, the two shield slots on the
  // right, then the same checkpoint track as the Kaizen 66 card (day 7, 14, 30, 45, the flag at 66) and one line under it.
  var SH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/></svg>';
  var FL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21.5V3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4.3c2.7-1.5 5.1-1.1 7.4-.2 2.2.9 4.4 1.3 6.9-.1v9.2c-2.5 1.4-4.7 1-6.9.1-2.3-.9-4.7-1.3-7.4.2z" fill="currentColor"/></svg>';
  // Nov 2 c · James: "take away the streak view from the tomorrow tab… the streak only applies to the Kaizen 66". The footer is gone (the line hides when empty).
  K.tmrShield = function () { return ''; };

})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzmtn-1104.js ==== */
;try {
/* Nov 3 b · kzmtn-1103 + K.mtnHero (setup's first mountain). */
/* Nov 2 h · a long-term climb at step 0: the trail up to YOU is orange, like a habit's (James: "should be orange").
*/
/* Nov 2 d · replaces kzmtn-1102c.js. James: "make it so you can press and hold and move the views, change the order of them".
   Growth's row of mountains: press and hold a mountain (0.35 s, a tick of haptics), it lifts, drag it left or right, the others slide aside;
   near an edge the row scrolls. Let go to drop. The order is saved (kz_mtnorder) and is also the order of the goal pages' previous / next.
   New mountains join at the end. A plain tap still opens the goal, a plain swipe still scrolls. */
/* Nov 2 c · replaces kzmtn-1102b.js. James: "make sure nothing is covering anything", "the top should show how many days left, not feet", "why is the dot and the line not in line".
   - YOU / START always sit on the trail: near the bottom edge the dot walks up the trail to the first point that's in view (it used to be lifted straight up, off the line).
   - The top's badge says how many days are left (59 DAYS TO THE TOP; it never covers the flag); a long-term goal's says THE TOP · STEP n. It moves away from any checkpoint, step or YOU it would cover.
   - Today's card: no checkpoint label on the small mountain; the 10-day strip becomes the checkpoint bar (start · 7 · 14 · 30 · 45 · top) with a shield at each checkpoint.
   - Growth rows: "shield in 7 days" for Kaizen 66.
   - No tree stages left anywhere a goal is shown: the row's stage line ("2 weeks · 5 days to 3 weeks") and the unfolded card's stage box (Seedling → Sapling) count checkpoints instead (stages()). */
/* Nov 2 b · replaces kzmtn-1102.js. James, on the Growth row: "these two just don't make sense" (long-term goals: steps in a flat line across the sky) and "the mountains are way too dark, it doesn't look like you're climbing a real mountain".
   - Long-term tiles: a trail climbs from the bottom of the tile to the ridge's highest point, one marker per step along it (done = check, next = its number, the finish = the flag), YOU on the trail.
   - Checkpoints sit on the switchback turns (the flat landings where a camp would be), not mid-slope: day 7 / 14 / 30 / 45 land exactly on the trail's turns and YOU moves between them in proportion. The Kaizen 66 checkpoints earn a shield (kz66-1102).
   - Long-term goals climb a real peak too (the lit habit photos, shared pool, so no repeats): each step is a marker on a turn, the last step is the summit, YOU on the trail. The wide ridge scene is retired.
   - The 7 darkest habit photos (silhouettes, haze, no lit face: h5, h6, p04, p10, p21, p22, p24) leave the pool; goals using one get the least-used lit peak. 24 remain. */
/* Nov 2 · replaces kzmtn-1101b.js. James: "The YOU is cut off" (Today's Kaizen 66 card and the goal page), "the view of the mountain at the top only shows 3 of them and isn't really a good representation of how it's working", and "I want it to be easy to scroll through all of them so you don't have to exit out of each one".
   - YOU / START never sit on the bottom edge: the puck is held 18 pt up and every label is kept inside the scene top to bottom.
   - Growth: the one photo with up to 4 pins becomes a row you swipe through, one small scene per mountain (every goal, its own trail and YOU), with the totals under it.
   - Goal page: a pager above the scene (previous name · 2 of 10 · next name) and swiping the scene left or right goes to the next mountain, in the Growth order; it replaces the page, so Back still goes to the list. */
/* Nov 1 · Mountains, stages 1–4 (replaces kzmtn-1101.js on every page). James: "make sure the numbers are correct …
   make all the changes necessary to make this app production level."
   ONE source of truth for every number (K.mtn):
     daily habit  – each check-off = +131 ft, day N = N × 131 ft, the top = day 66 = 8,646 ft (66 × 131; the mock's 8,660
                    could not be true with 131 ft a day). Checkpoints on days 7 / 14 / 30 / 45. A missed day costs 0 ft.
                    Kaizen 66 uses the run's check-offs; every other habit uses its total check-offs.
                    After 66: "Keep climbing" = the Seven Summits (mountain k covers check-offs 66(k−1)+1 … 66k, mountain 7 is
                    Everest; feet shown as the honest running total, never as a fake mountain height) or "Stop here".
     quit         – fog clears 1/66 per clean day (total clean days, so a slip never brings fog back); 66 = clear skies.
     roadmap goal – each step is a peak; progress = steps done ÷ steps; the finish is the due date.
   Screens: Today's Kaizen 66 card · Growth ("Your mountains") · the goal page scene (climb / expedition / storm) ·
   the day-66 "You made it." screen · share card. Retires the tree art (thumbnails swapped, tree hero hidden) and the tree
   words (kzword-1101.js). Stored: kz_mtnpic (which photo is whose), kz_summit (Keep climbing / Stop here). No network.
   Styles: kzmtn-1101b.css. Photos: /art/mtn/. */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzmtn) return; K.__kzmtn = 1;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var ART = (window.KZ_ART || '/art/') + 'mtn/';
  var TOP = 66, STEP = 131, TOPFT = TOP * STEP, CPS = [7, 14, 30, 45], SEVEN = 7;
  // 31 habit peaks, 7 fog valleys, 6 ridges: no two goals of a kind share a photo until every photo of that kind is in use
  var POOL = ["h1", "h2", "h3", "h4", "p01", "p02", "p03", "p05", "p06", "p07", "p08", "p09", "p11", "p12", "p13", "p14", "p15", "p16", "p17", "p18", "p19", "p20", "p23", "p25"];
  var SPOOL = ['storm', 's01', 's02', 's03', 's04', 's05', 's06'];
  var EPOOL = ['exped', 'e01', 'e02', 'e04', 'e05', 'e06'];
  // where each photo's peak sits (fraction of the 720×900 frame), so the route ends on the real summit
  var PEAK = { h1: [.44, .36], h2: [.52, .32], h3: [.55, .27], h4: [.82, .27], h5: [.52, .27], h6: [.70, .24], p01: [0.5, 0.307], p02: [0.491, 0.288], p03: [0.55, 0.31], p04: [0.501, 0.319], p05: [0.515, 0.406], p06: [0.5, 0.42], p07: [0.5, 0.554], p08: [0.501, 0.27], p09: [0.416, 0.3], p10: [0.533, 0.3], p11: [0.52, 0.3], p12: [0.5, 0.421], p13: [0.5, 0.277], p14: [0.5, 0.285], p15: [0.5, 0.363], p16: [0.484, 0.281], p17: [0.5, 0.347], p18: [0.504, 0.336], p19: [0.459, 0.475], p20: [0.5, 0.284], p21: [0.5, 0.626], p22: [0.5, 0.279], p23: [0.52, 0.293], p24: [0.5, 0.403], p25: [0.5, 0.28] };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function num(n) { return Math.round(n).toLocaleString('en-US'); }
  function ft(n) { return num(n * STEP) + ' ft'; }            // n check-offs → feet
  K.mtnFeet = ft;
  // Nov 3: a goal's real climb (its own photo framing and trail, climbed part only) for small tiles, e.g. Done today. No markers.
  // Nov 3 b · the whole climb for one goal at any size (photo framing, trail with footprints, camps, the flag on the real summit,
  // START / YOU): the same drawing Growth uses, for the first-goal card in setup. Returns {html, py, pic, big}.
  K.mtnHero = function (gid, W, H, pad) { var o = K.mtn(gid); if (!o || o.kind !== 'climb') return null; var h = climbSvg(o, W, H, pad == null ? Math.round(H * .2) : pad); return { html: h, py: o.py, pic: o.pic, big: o.big }; };
  K.mtnScene = function (gid, W, H) { var o = K.mtn(gid); if (!o || o.kind !== 'climb') return null; var h = climbSvg(o, W, H, Math.round(H * .16)), m = /<svg[\s\S]*?<\/svg>/.exec(h); if (!m) return null;
    return { svg: m[0].replace(/<circle[^>]*class="kzmx-ft(-sh)?"[^>]*\/>/g, ''), py: o.py, pic: o.pic, big: o.big }; }; K.MTN = { STEP: STEP, TOP: TOP, TOPFT: TOPFT, CPS: CPS };
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function allGoals() { try { return (K.allGoals ? K.allGoals() : goals()) || []; } catch (e) { return goals(); } }
  function byId(id) { var a = allGoals(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function nextCp(n) { for (var i = 0; i < CPS.length; i++) if (n < CPS[i]) return CPS[i]; return TOP; }
  function k66run() { try { var st = K.k66 && K.k66.state(), r = st && st.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  function D(k) { var p = String(k).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function key(d) { return K.key ? K.key(d) : d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function todayKey() { try { return key(K.today ? K.today() : new Date()); } catch (e) { return key(new Date()); } }
  function fmtDay(k) { var d = D(k); return MON[d.getMonth()] + ' ' + d.getDate(); }
  function summits() { var m = null; try { m = K.get('summit', null); } catch (e) {} return m && typeof m === 'object' ? m : {}; }
  function setSummit(gid, v) { var m = summits(); m[gid] = v; K.set('summit', m); }
  function kind(g) {
    if (g.quit || g.kind === 'quit') return 'storm';
    try { if (K.bd && K.bd.isMs && K.bd.isMs(g)) return 'exped'; } catch (e) {}
    return 'climb';
  }
  function doneDays(gid) {
    var d = {}; try { d = ((K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {})[gid] || {}; } catch (e) {}
    return Object.keys(d).filter(function (k) { return d[k]; }).sort();
  }

  // ---------- which photo is which goal's mountain ----------
  var picMemo = null;
  function picRaw() { try { return localStorage.getItem('kz_mtnpic') + '|' + localStorage.getItem('kz_goals') + '|' + localStorage.getItem('kz_archived'); } catch (e) { return null; } }
  function pics() {
    var raw = picRaw(); if (picMemo && raw !== null && picMemo.raw === raw) return picMemo.m;
    var m = null; try { m = K.get('mtnpic', null); } catch (e) {} var ch = false; if (!m || typeof m !== 'object') { m = {}; ch = true; }
    var all = allGoals(), act = {}; goals().forEach(function (g) { act[g.id] = 1; });
    var POOLS = { climb: POOL, storm: SPOOL, exped: POOL };
    // how much each photo is in use: an active goal counts fully, an archived one barely (so it gives its photo up first)
    var used = {}; all.forEach(function (g) { var p = m[g.id]; if (p) used[p] = (used[p] || 0) + (act[g.id] ? 1 : .001); });
    all.slice().sort(function (a, b) { return String(a.created || '').localeCompare(String(b.created || '')) || String(a.id).localeCompare(String(b.id)); })
      .forEach(function (g) {
        var pool = POOLS[kind(g)]; if (m[g.id] && pool.indexOf(m[g.id]) >= 0) return;
        var pick = pool[0], low = 1e9; pool.forEach(function (p) { if ((used[p] || 0) < low) { low = used[p] || 0; pick = p; } });
        m[g.id] = pick; used[pick] = (used[pick] || 0) + (act[g.id] ? 1 : .001); ch = true;
      });
    if (ch) try { K.set('mtnpic', m); } catch (e) {}
    raw = picRaw(); picMemo = raw === null ? null : { raw: raw, m: m }; return m;
  }
  function picKey(g) { var k = kind(g), p = pics()[g.id]; return p || (k === 'storm' ? 'storm' : k === 'exped' ? 'exped' : 'h1'); }

  // ---------- one goal as a mountain: every number on every screen comes from here ----------
  K.mtn = function (gid) {
    var g = typeof gid === 'object' ? gid : byId(gid); if (!g) return null;
    var k = kind(g), days = doneDays(g.id), total = days.length, r = k66run(), run = !!(r && r.goal === g.id), dayNo = total, n = total;
    if (run) { var pend = r.state === 'pending'; n = pend ? 0 : (r.todayDone ? r.day : r.day - 1); dayNo = pend ? 0 : r.day; }
    var pk = picKey(g), o = { g: g, id: g.id, name: g.name, kind: k, run: run, done: n, total: total, day: dayNo, pk: pk,
      pic: ART + pk + '_sm.webp', big: ART + pk + '.webp', summitAt: total >= TOP ? days[TOP - 1] : null, last: days[days.length - 1] || null };
    if (k === 'climb') {
      var choice = (summits()[g.id] || {}).c, mtn = 1, within = Math.min(n, TOP);
      if (!run && n >= TOP && choice === 'keep') { mtn = Math.min(SEVEN, Math.floor(n / TOP) + 1); within = Math.min(TOP, n - TOP * (mtn - 1)); }
      o.choice = choice || null; o.mountain = mtn; o.within = within; o.seven = !run && choice === 'keep' && n >= TOP * SEVEN;
      o.earned = !run && n >= TOP; o.atTop = within >= TOP; o.frac = within / TOP;
      o.feet = within * STEP; o.ft = num(o.feet) + ' ft'; o.totalFt = ft(n);
      var cp = nextCp(within); o.cp = cp; o.cpIn = cp - within; o.topIn = Math.max(0, TOP - within);
      o.climbing = !o.earned || (choice === 'keep' && !o.seven);
      o.value = mtn > 1 ? 'Mountain ' + mtn + ' of 7' : o.ft;
      var lead = run ? (dayNo ? 'Kaizen 66 · day ' + dayNo : 'Kaizen 66 · starts soon') : mtn > 1 ? 'Day ' + within + ' of 66 on mountain ' + mtn : within ? 'Day ' + within + ' of 66' : 'At the base';
      o.line = lead + (o.atTop ? '' : ' · ' + (cp < TOP ? (run ? 'shield in ' : 'next checkpoint in ') + plural(cp - within, 'day') : 'the top in ' + plural(TOP - within, 'day')));
      if (mtn === SEVEN) o.line = o.line.replace('on mountain 7', 'on Everest');
    } else if (k === 'storm') {
      var st = null; try { st = K.quitStats ? K.quitStats(g.id) : null; } catch (e) {}
      var sl = {}; (g.slips || []).forEach(function (k) { sl[k] = 1; }); var clean = days.filter(function (k) { return !sl[k]; }).length;
      o.clean = clean; o.streak = st ? st.clean : clean; o.slips = st ? st.slips : ((g.slips || []).length); total = clean;
      o.frac = Math.min(1, total / TOP); o.pct = Math.floor(o.frac * 100); o.earned = total >= TOP; o.toClear = Math.max(0, TOP - total);
      o.value = o.earned ? 'Clear skies' : o.pct + '% clear'; o.line = 'Quitting · ' + plural(total, 'clean day'); o.climbing = !o.earned;
    } else {
      var p = { n: 0, t: 0, frac: 0 }; try { p = K.bd.prog(g); } catch (e) {}
      o.steps = p.n; o.stepsT = p.t; o.frac = p.frac; o.earned = p.t > 0 && p.n >= p.t; o.climbing = !o.earned;
      o.next = (g.ms || []).filter(function (m) { return !m.d; })[0] || null;
      o.left = ''; try { o.left = K.bd.leftText ? K.bd.leftText(g) : ''; } catch (e) {}
      o.value = p.n + ' of ' + p.t; o.line = 'Long-term goal · ' + p.n + ' of ' + plural(p.t, 'step') + ' done';
    }
    return o;
  };
  // the most recent missed day in the last week (only days the goal was due), for "You missed Tuesday. You lost nothing."
  function lastMiss(o) {
    if (o.kind !== 'climb' || !o.total) return null;
    var done = {}; doneDays(o.id).forEach(function (k) { done[k] = 1; });
    var t = D(todayKey()), first = doneDays(o.id)[0];
    for (var i = 1; i <= 6; i++) {
      var d = new Date(t); d.setDate(d.getDate() - i); var k = key(d); if (first && k < first) break;
      var due = true; try { if (K.dueOn) due = K.dueOn(o.g, k) !== false; } catch (e) {}
      if (due && !done[k]) return { k: k, label: i === 1 ? 'yesterday' : DAYS[d.getDay()] };
    }
    return null;
  }

  // ---------- 1 · Today: the Kaizen 66 card ----------
  function card() {
    var sec = document.querySelector('section.kzf-66'); if (!sec) return;
    var a = sec.querySelector('a[href*="goal?id="]'), m = a && /[?&]id=([^&#]+)/.exec(a.getAttribute('href')), gid = m ? decodeURIComponent(m[1]) : null;
    if (!gid) { var r = k66run(); gid = r && r.goal; }
    var o = gid && K.mtn(gid); if (!o || o.kind !== 'climb') { sec.classList.remove('kzmx'); return; }
    sec.classList.add('kzmx');
    var bg = sec.querySelector(':scope > .kzmx-bg');
    if (!bg) { bg = document.createElement('img'); bg.className = 'kzmx-bg'; bg.alt = ''; bg.setAttribute('aria-hidden', 'true'); bg.decoding = 'async'; sec.insertBefore(bg, sec.firstChild); }
    if (bg.getAttribute('src') !== o.big) bg.setAttribute('src', o.big);
    var tbox = sec.querySelector('.kzf-tree');
    if (tbox) {
      var mini = tbox.querySelector(':scope > .kzmx-mini'); if (!mini) { mini = document.createElement('div'); mini.className = 'kzmx-mini kzmx-sc'; tbox.appendChild(mini); }
      var MW = Math.round(tbox.getBoundingClientRect().width || (sec.getBoundingClientRect().width - 32)), MH = 210, msig = o.id + '|' + o.done + '|' + MW;
      if (MW > 100 && mini.__sig !== msig) {
        mini.__sig = msig; var ms = climbSvg(o, MW, MH, 62).replace(/<span class="kzmx-lab side[^"]*"[^>]*>[^<]*<\/span>/g, '');
        mini.setAttribute('role', 'img'); mini.setAttribute('aria-label', o.name + ': ' + o.ft + ' of ' + num(TOPFT) + ' feet, day ' + (o.run ? o.day : o.within) + ' of 66.');
        mini.innerHTML = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="" style="object-position:50% ' + o.py + '%"><div class="kzmx-bg2"></div>' + ms;
        try { clampLabels(mini); } catch (e) {}
      }
    }
    var strip = sec.querySelector('.kzf-strip');
    if (strip) {
      var cb = sec.querySelector('.kzmx-cpbar'); if (!cb) { cb = document.createElement('div'); cb.className = 'kzmx-cpbar'; strip.parentNode.insertBefore(cb, strip); }
      var w0 = o.within, bsig = o.id + '|' + w0 + '|' + o.done;
      if (cb.__s !== bsig) {
        cb.__s = bsig; var edges = [0].concat(CPS, [TOP]), hb = '';
        for (var e = 1; e < edges.length; e++) {
          var a0 = edges[e - 1], b0 = edges[e], fill = Math.max(0, Math.min(1, (w0 - a0) / (b0 - a0)));
          hb += '<span class="seg" style="flex:' + (b0 - a0) + '"><i style="width:' + (fill * 100).toFixed(1) + '%"></i></span>';
          if (e < edges.length - 1) hb += '<b class="cps' + (w0 >= b0 ? ' on' : b0 === o.cp ? ' next' : '') + '" aria-hidden="true">' + SHLD + '<em>' + b0 + '</em></b>';
          else hb += '<b class="cpt' + (o.atTop ? ' on' : '') + '" aria-hidden="true">' + FLAG + '<em>66</em></b>';
        }
        cb.innerHTML = '<div class="row">' + hb + '</div>';
        cb.setAttribute('role', 'img'); cb.setAttribute('aria-label', 'Checkpoints at day 7, 14, 30 and 45 each earn a shield. You are on day ' + (o.run ? o.day : w0) + ' of 66.');
      }
    }
    var bar = sec.querySelector('.kzf-bar');
    if (bar) {
      var fill = bar.querySelector(':scope > i'), w = (o.frac * 100).toFixed(1) + '%'; if (fill && fill.style.width !== w) fill.style.width = w;
      var cpEl = bar.querySelector('.kzmx-cp');
      if (!cpEl) { cpEl = document.createElement('b'); cpEl.className = 'kzmx-cp'; cpEl.setAttribute('aria-hidden', 'true'); bar.appendChild(cpEl); var t = document.createElement('b'); t.className = 'kzmx-top'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 22V3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><g><rect x="6.0" y="3.5" width="3.5" height="3.2" fill="#F2CF5B"/><rect x="9.5" y="3.5" width="3.5" height="3.2" fill="#1C1C1E"/><rect x="13.0" y="3.5" width="3.5" height="3.2" fill="#F2CF5B"/><rect x="16.5" y="3.5" width="3.5" height="3.2" fill="#1C1C1E"/><rect x="6.0" y="6.7" width="3.5" height="3.2" fill="#1C1C1E"/><rect x="9.5" y="6.7" width="3.5" height="3.2" fill="#F2CF5B"/><rect x="13.0" y="6.7" width="3.5" height="3.2" fill="#1C1C1E"/><rect x="16.5" y="6.7" width="3.5" height="3.2" fill="#F2CF5B"/><rect x="6.0" y="9.9" width="3.5" height="3.2" fill="#F2CF5B"/><rect x="9.5" y="9.9" width="3.5" height="3.2" fill="#1C1C1E"/><rect x="13.0" y="9.9" width="3.5" height="3.2" fill="#F2CF5B"/><rect x="16.5" y="9.9" width="3.5" height="3.2" fill="#1C1C1E"/></g><rect x="6" y="3.5" width="14" height="9.6" fill="none" stroke="#F2CF5B" stroke-width=".8"/></svg>'; /* Nov 2 h: the bar's finish flag is checkered */ bar.appendChild(t); }
      var cpx = (o.cp / TOP * 100).toFixed(2) + '%'; if (cpEl.style.left !== cpx) cpEl.style.left = cpx; cpEl.hidden = o.cp >= TOP;
      var al = o.ft + ' of ' + num(TOPFT) + ' ft. The top is day 66.'; if (bar.getAttribute('aria-label') !== al) { bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', al); }
    }
    var left = sec.querySelector('.kzf-left');
    if (left) {
      var tail = o.atTop ? 'You made it.' : (o.cp < TOP ? (o.run ? 'Checkpoint in ' + plural(o.cpIn, 'day') + ' · earns a shield' : 'Next checkpoint in ' + plural(o.cpIn, 'day') + ' · top in ' + o.topIn) : 'The top in ' + plural(o.topIn, 'day'));
      if (left.textContent !== o.ft + tail || !left.querySelector('b')) left.innerHTML = '<b>' + o.ft + '</b><span>' + tail + '</span>';
    }
  }

  // ---------- 2 · Growth: your mountains ----------
  var SLOTS = [[48, 9], [80, 27], [19, 30], [57, 48]];
  function short(n) { n = String(n).trim(); if (n.length <= 15) return n; var w = n.split(/\s+/), o = ''; for (var i = 0; i < w.length && (o + ' ' + w[i]).trim().length <= 13; i++) o = (o + ' ' + w[i]).trim(); return (o || n.slice(0, 12)) + '…'; }
  // the Growth photo's ridgeline, traced from its pixels (fraction of the 1050×525 frame); pins stand on these summits
  var RANGE = [[0.004,0.313],[0.023,0.313],[0.042,0.313],[0.061,0.309],[0.08,0.302],[0.099,0.296],[0.118,0.3],[0.137,0.31],[0.156,0.317],[0.175,0.306],[0.194,0.293],[0.213,0.28],[0.232,0.272],[0.251,0.265],[0.27,0.265],[0.29,0.275],[0.309,0.295],[0.328,0.311],[0.347,0.318],[0.366,0.308],[0.385,0.28],[0.404,0.258],[0.423,0.272],[0.442,0.298],[0.461,0.326],[0.48,0.382],[0.499,0.467],[0.518,0.558],[0.537,0.575],[0.556,0.525],[0.575,0.437],[0.594,0.379],[0.613,0.39],[0.632,0.398],[0.651,0.397],[0.67,0.395],[0.69,0.388],[0.709,0.384],[0.728,0.389],[0.747,0.403],[0.766,0.426],[0.785,0.438],[0.804,0.435],[0.823,0.428],[0.842,0.412],[0.861,0.404],[0.88,0.41],[0.899,0.421],[0.918,0.432],[0.937,0.45],[0.956,0.46],[0.975,0.457],[0.994,0.447]];
  // summits to stand on, by how many pins there are (index 0 = the spire, for the Kaizen 66 goal or the first habit earned); the sun gap is skipped
  var RANGE_SETS = [[], [.405], [.405, .70], [.405, .17, .70], [.405, .17, .70, .885]];
  function ridgeY(x) { for (var i = 1; i < RANGE.length; i++) if (RANGE[i][0] >= x) { var a = RANGE[i - 1], b = RANGE[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return RANGE[RANGE.length - 1][1]; }
  function goalHref(id) { return '/pages/goal?id=' + encodeURIComponent(id); }
  function row(o, gold) {
    var aria = o.name + ', ' + (gold ? (o.kind === 'exped' ? 'finished, every step done' : o.kind === 'storm' ? 'clear skies, ' + plural(o.clean, 'clean day') : 'habit earned') : o.line + ', ' + o.value);
    var h = '<a class="kzmx-row' + (gold ? ' gold' : '') + '" href="' + goalHref(o.id) + '" aria-label="' + esc(aria) + '">' +
      '<img class="kzmx-th" src="' + esc(o.pic) + '" alt="" decoding="async"><span class="kzmx-rx">';
    if (gold) {
      var sub = o.kind === 'exped' ? 'Every step done' : o.kind === 'storm' ? 'Clear skies · ' + plural(o.clean, 'clean day')
        : 'Habit earned' + (o.summitAt ? ' ' + fmtDay(o.summitAt) : '') + (o.seven ? ' · all Seven Summits' : o.choice === 'stop' ? ' · stopped at the top' : '');
      h += '<b>' + esc(o.name) + '</b><em>' + esc(sub) + '</em>';
    } else {
      h += '<span class="kzmx-r1"><b>' + esc(o.name) + '</b><i>' + esc(o.value) + '</i></span>' +
        '<span class="kzmx-bar" aria-hidden="true"><i style="width:' + (o.frac * 100).toFixed(1) + '%"></i></span><em>' + esc(o.line) + '</em>';
    }
    return h + '</span></a>';
  }
  var lastG = '', carX = 0;
  document.addEventListener('scroll', function (e) { if (e.target && e.target.classList && e.target.classList.contains('kzmx-car')) carX = e.target.scrollLeft; }, true);
  function noLabels(html) { return html.replace(/<span class="kzmx-lab[^"]*"[^>]*>[^<]*<\/span>/g, ''); }
  function tileLine(o) {
    if (o.earned && !o.climbing) return o.kind === 'exped' ? 'Every step done' : o.kind === 'storm' ? 'Clear skies' : 'Habit earned';
    if (o.kind === 'climb') return 'Day ' + (o.run ? o.day : o.within) + ' \u00b7 ' + o.ft;
    if (o.kind === 'storm') return o.pct + '% clear';
    return 'Step ' + Math.min(o.steps + 1, o.stepsT) + ' of ' + o.stepsT;
  }
  // a long-term goal as a climb: the trail runs from the bottom of the tile up to the ridge's highest point; the steps sit on it
  function expTile(o, W, H) {
    var ex = EXP[o.pk] || EXP.exped, c = cover(W, H, 1440, 760, .5); c.x = (W - c.w) * ex.x;
    var R = ex.r.map(function (r) { return [c.x + r[0] * c.w, c.y + r[1] * c.h]; }).filter(function (p) { return p[0] > 6 && p[0] < W - 6; });
    if (R.length < 3) return '';
    var ry = function (x) { for (var i = 1; i < R.length; i++) if (R[i][0] >= x) { var a = R[i - 1], b = R[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return R[R.length - 1][1]; };
    var S = null; R.forEach(function (p) { if (p[0] >= W * .22 && p[0] <= W * .8 && (!S || p[1] < S[1])) S = p; }); if (!S) S = R[R.length >> 1];
    S = [S[0], S[1] + 4];
    var base = H + 8, rise = base - S[1], xs = [W * .5, W * .26, W * .72, W * .36, S[0]], fr = [0, .3, .55, .78, 1], way = [];
    for (var k = 0; k < xs.length; k++) {
      var x = k === xs.length - 1 ? S[0] : xs[k] + (S[0] - xs[k]) * fr[k] * .55, y = base - rise * fr[k];
      if (k && k < xs.length - 1) y = Math.max(y, ry(x) + 16);   // always on the slope, never in the sky
      way.push([x, y]);
    }
    for (k = 1; k < way.length; k++) if (way[k][1] > way[k - 1][1]) way[k][1] = way[k - 1][1];   // never a downhill step
    var pts = [], seg = 14;
    for (k = 1; k < way.length; k++) for (var j = 0; j < seg; j++) { var t = j / seg, a = way[k - 1], b = way[k]; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    pts.push(way[way.length - 1]);
    var ms = o.g.ms || [], n = Math.max(1, ms.length), f = Math.min(1, o.steps / n), me = along(pts, f), done = f > 0 ? pts.slice(0, me.i).concat([me.p]) : [], mk = '';
    for (var i = 0; i < n; i++) {
      var q = along(pts, (i + 1) / n).p, d = !!ms[i] && !!ms[i].d, nx = !d && i === o.steps;
      if (i === n - 1) { mk += at(q[0], q[1], 'kzmx-summit small', '<span class="kzmx-sdot"></span><span class="kzmx-stem"></span><b class="kzmx-sbadge' + (d ? '' : ' dim') + '">' + FLAG + '</b>'); continue; }
      mk += at(q[0], q[1], 'kzmx-step' + (d ? ' on' : nx ? ' next' : ''), d ? CHECK : '<b>' + (i + 1) + '</b>');
    }
    if (!o.earned) { var yp = f > 0 ? me.p : along(pts, .04).p; mk += at(yp[0], Math.min(yp[1], H - 18), 'kzmx-puck' + (calm ? '' : ' live'), '<span class="kzmx-pc"></span>'); }
    return '<svg class="kzmx-rt" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + lines(pts, done) + '</svg>' + mk;
  }
  function tile(o, W, H) {
    var gold = o.earned && !o.climbing, sc = '';
    if (o.kind === 'climb') { var sv = noLabels(climbSvg(o, W, H, 34)); sc = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="" loading="lazy" decoding="async" style="object-position:50% ' + o.py + '%"><div class="kzmx-bg2"></div>' + sv; }
    else if (o.kind === 'storm') sc = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="" loading="lazy" decoding="async" style="object-position:50% 40%"><div class="kzmx-fog" style="opacity:' + (1 - o.frac).toFixed(3) + '"><i></i><i></i><i></i></div><div class="kzmx-bg2"></div>';
    else { var sv2 = noLabels(stepsSvg(o, W, H, 34)); sc = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="" loading="lazy" decoding="async" style="object-position:50% ' + o.py + '%"><div class="kzmx-bg2"></div>' + sv2; }
    return '<a class="kzmx-tile' + (gold ? ' gold' : '') + (o.run ? ' run' : '') + '" role="listitem" href="' + goalHref(o.id) + '" aria-label="' + esc(o.name + ', ' + tileLine(o)) + '">' +
      '<span class="kzmx-sc kzmx-tsc ' + o.kind + '" style="height:' + H + 'px" aria-hidden="true">' + sc + '</span>' + (o.run ? '<i class="kzmx-t66">KAIZEN 66</i>' : '') +
      '<span class="kzmx-tx"><b>' + esc(o.name) + '</b><em>' + esc(tileLine(o)) + '</em></span></a>';
  }
  // the order James set by hand; mountains he hasn't placed keep their default place after the ones he has
  function byOrder(list) {
    var ord = []; try { ord = K.get('mtnorder', []) || []; } catch (e) {} if (!Array.isArray(ord) || !ord.length) return list;
    var at = {}; ord.forEach(function (id, i) { at[id] = i; });
    return list.map(function (o, i) { return { o: o, k: at[o.id] != null ? at[o.id] : 1e6 + i }; }).sort(function (a, b) { return a.k - b.k; }).map(function (x) { return x.o; });
  }
  var drag = null;
  function growth() {
    if (drag) return;   // never rebuild the row under a finger
    var main = document.getElementById('kz-main'); if (!main || !/\/pages\/profile/.test(location.pathname + '/')) return;
    var act = {}, list = goals().map(function (g) { act[g.id] = 1; return K.mtn(g); }).filter(Boolean);
    var arch = allGoals().filter(function (g) { return !act[g.id]; }).map(function (g) { return K.mtn(g); }).filter(Boolean);
    var now = list.filter(function (o) { return o.climbing; }).sort(function (a, b) { return (b.run ? 1 : 0) - (a.run ? 1 : 0) || b.frac - a.frac; });
    var won = list.concat(arch).filter(function (o) { return o.earned && !(o.kind === 'climb' && o.climbing); });
    var climbs = list.concat(arch).filter(function (o) { return o.kind === 'climb'; });
    var feet = 0, tops = 0; climbs.forEach(function (o) { feet += o.total * STEP; if (o.total >= TOP) tops++; });
    var h = '<h2 class="kzmx-sh kzmx-first">' + (list.length ? 'YOUR ' + list.length + ' MOUNTAIN' + (list.length === 1 ? '' : 'S') : 'YOUR MOUNTAINS') + '</h2>';
    if (!list.length && !won.length) {
      h += '<div class="kzmx-hero kzmx-empty"><img src="' + ART + 'range.webp" alt="A mountain range at dawn"><div class="kzmx-shade"></div>' +
        '<div class="kzmx-et"><b>Every goal is a mountain.</b><span>Check it off and you climb 131 ft. Day 66 is the top.</span>' +
        '<a class="kzmx-btn" href="/pages/my-goals#add">Start your first mountain</a></div></div>';
    } else {
      var all = byOrder(now.concat(won)), TW = 156, TH = 200;
      h += '<div class="kzmx-car" role="list" aria-label="Your mountains. Swipe for more.">' + all.map(function (o) { return tile(o, TW, TH); }).join('') + '</div>' +
        (all.length > 2 ? '<p class="kzmx-swipe" aria-hidden="true">Swipe to see every mountain \u00b7 hold one to move it</p>' : '') +
        '<div class="kzmx-tot" role="img" aria-label="' + esc(num(feet) + ' feet climbed, ' + plural(tops, 'habit') + ' earned, ' + now.length + ' climbing now') + '"><span><b>' + num(feet) + ' ft</b><em>CLIMBED</em></span><span><b>' + now.length + '</b><em>CLIMBING NOW</em></span>' +
        '<span><b class="gold">' + tops + '</b><em>HABITS EARNED</em></span></div>';
      if (now.length) h += '<h2 class="kzmx-sh">CLIMBING NOW</h2><div class="kzmx-list kzmx-now" aria-label="Climbing now. Hold one to move it.">' + byOrder(now).map(function (o) { return row(o, false); }).join('') + '</div>';
      if (won.length) h += '<h2 class="kzmx-sh">MOUNTAINS YOU\'VE CLIMBED</h2><div class="kzmx-list">' + won.map(function (o) { return row(o, true); }).join('') + '</div>';
    }
    h += '<p class="kzmx-why"><a href="#" data-kzg-why>Why 66 days?</a></p>';
    var sub = document.querySelector('#kz-header .kzpb-sub[data-n]'), dn = sub && sub.getAttribute('data-n');
    if (dn && /^\d+ (trees?|mountains?)$/.test(dn)) sub.setAttribute('data-n', '');   // the count lives in the section title (too wide for the header)
    var sec = document.getElementById('kzmx-g');
    if (sec && h === lastG && sec.parentNode === main && main.firstElementChild === sec) return;
    if (!sec) { sec = document.createElement('section'); sec.id = 'kzmx-g'; sec.className = 'kzmx-g'; sec.setAttribute('aria-label', 'Your mountains'); }
    if (main.firstElementChild !== sec) main.insertBefore(sec, main.firstChild);
    if (h !== lastG) { sec.innerHTML = h; lastG = h; try { var car = sec.querySelector('.kzmx-car'); if (car && carX) car.scrollLeft = carX; } catch (e) {} }
    de.classList.add('kz-mtn');
  }

  // ---------- 3 · Goal page: the scene ----------
  function pageGid() { var m = /[?&]id=([^&#]+)/.exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  function cover(W, H, iw, ih, py) { var s = Math.max(W / iw, H / ih), w = iw * s, h = ih * s; return { x: (W - w) / 2, y: (H - h) * py, w: w, h: h }; }
  // ---- scene drawing (Nov 1, v2). Map-app conventions: a casing (dark outline) under every line so it reads on any photo,
  // round caps and joins, a dotted line for the way still ahead, 12 pt checkpoints, a location-style puck for YOU, and
  // markers drawn as real icons (SF Symbols-style flag and check), not hand-made triangles. Labels are 11 pt pills.
  var FLAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21.5V3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4.3c2.7-1.5 5.1-1.1 7.4-.2 2.2.9 4.4 1.3 6.9-.1v9.2c-2.5 1.4-4.7 1-6.9.1-2.3-.9-4.7-1.3-7.4.2z" fill="currentColor"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.5l3.6 3.6L17.5 8.7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  K.mtnFlag = FLAG;
  function routePts(W, H, P) {
    var B = [W * .14, H * .97], pts = [], dx = P[0] - B[0], dy = P[1] - B[1], len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len;
    [0, .2, .42, .64, .84, 1].forEach(function (t, i) { var off = (i % 2 ? 1 : -1) * W * .12 * Math.pow(1 - t, .9) * (i ? 1 : .3); pts.push([B[0] + dx * t + nx * off, B[1] + dy * t + ny * off]); });
    return smooth(pts, 18);
  }
  // Catmull-Rom → dense polyline (smooth switchbacks instead of straight zigzags)
  function smooth(p, n) {
    if (p.length < 3) return p; var out = [p[0]];
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      for (var k = 1; k <= n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(function (c) { return .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3); })); }
    }
    return out;
  }
  function along(pts, f) {
    var L = [0], i; for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var t = Math.max(0, Math.min(1, f)) * L[L.length - 1]; for (i = 1; i < pts.length; i++) if (t <= L[i]) { var u = (t - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return { p: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u], i: i }; }
    return { p: pts[pts.length - 1], i: pts.length - 1 };
  }
  function f1(v) { return Math.round(v * 10) / 10; }
  function pl2(pts) { return pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' '); }
  function lines(all, done) {
    var s = '<polyline points="' + pl2(all) + '" class="kzmx-ln-case"/><polyline points="' + pl2(all) + '" class="kzmx-ln-todo"/>';
    if (done.length > 1) s += '<polyline points="' + pl2(done) + '" class="kzmx-ln-dcase"/><polyline points="' + pl2(done) + '" class="kzmx-ln-glow"/><polyline points="' + pl2(done) + '" class="kzmx-ln-done"/>';
    return s;
  }
  function inView(pts, i, limit) { for (var j = Math.max(0, i); j < pts.length; j++) if (pts[j][1] <= limit) return { p: pts[j], i: j }; return { p: pts[pts.length - 1], i: pts.length - 1 }; }
  function at(x, y, cls, inner, extra) { return '<span class="' + cls + '" style="left:' + f1(x) + 'px;top:' + f1(y) + 'px"' + (extra || '') + '>' + (inner || '') + '</span>'; }
  function summitBadge(P, text, W) { var right = P[0] < W * .62; return at(P[0], P[1], 'kzmx-summit', '<span class="kzmx-sdot"></span><span class="kzmx-stem"></span><b class="kzmx-sbadge">' + FLAG + '</b>') + at(P[0], P[1] - 29, 'kzmx-lab gold ' + (right ? 'r' : 'l'), text); }
  // each habit photo's mountain outline (25 samples across, fraction of the frame), traced from its pixels
  var SKY = {"h1":[0.691,0.686,0.658,0.63,0.656,0.634,0.667,0.603,0.416,0.386,0.36,0.36,0.373,0.391,0.419,0.448,0.468,0.514,0.549,0.571,0.599,0.6,0.606,0.626,0.644],"h2":[0.436,0.444,0.434,0.467,0.447,0.44,0.438,0.461,0.486,0.473,0.629,0.459,0.327,0.373,0.541,0.487,0.632,0.677,0.561,0.711,0.62,0.58,0.568,0.516,0.5],"h3":[0.297,0.287,0.28,0.276,0.278,0.289,0.313,0.336,0.343,0.34,0.352,0.356,0.27,0.27,0.279,0.299,0.331,0.354,0.374,0.576,0.6,0.9,0.9,0.679,0.9],"h4":[0.338,0.333,0.338,0.334,0.332,0.333,0.326,0.308,0.309,0.311,0.323,0.34,0.339,0.34,0.331,0.298,0.299,0.291,0.282,0.272,0.27,0.278,0.281,0.293,0.317],"h5":[0.367,0.364,0.37,0.372,0.376,0.379,0.377,0.374,0.362,0.336,0.311,0.29,0.274,0.277,0.287,0.298,0.303,0.307,0.307,0.31,0.316,0.322,0.33,0.336,0.337],"h6":[0.399,0.416,0.423,0.409,0.417,0.436,0.428,0.396,0.374,0.354,0.362,0.332,0.286,0.281,0.259,0.262,0.246,0.9,0.9,0.9,0.9,0.328,0.36,0.9,0.9],"p01":[0.58,0.9,0.9,0.53,0.508,0.477,0.483,0.409,0.386,0.366,0.334,0.317,0.307,0.313,0.316,0.326,0.359,0.353,0.363,0.376,0.389,0.433,0.9,0.9,0.9],"p02":[0.9,0.488,0.468,0.461,0.444,0.432,0.419,0.402,0.377,0.348,0.333,0.31,0.288,0.308,0.329,0.313,0.331,0.321,0.321,0.306,0.451,0.301,0.288,0.288,0.9],"p03":[0.9,0.9,0.9,0.573,0.9,0.9,0.31,0.454,0.422,0.402,0.31,0.31,0.31,0.31,0.31,0.31,0.31,0.622,0.31,0.31,0.31,0.31,0.31,0.31,0.31],"p04":[0.9,0.9,0.9,0.659,0.9,0.9,0.9,0.9,0.9,0.9,0.336,0.347,0.429,0.319,0.342,0.374,0.413,0.468,0.487,0.483,0.478,0.671,0.717,0.646,0.587],"p05":[0.662,0.642,0.617,0.594,0.561,0.544,0.531,0.519,0.503,0.482,0.457,0.429,0.406,0.412,0.432,0.448,0.464,0.483,0.494,0.494,0.508,0.513,0.516,0.518,0.532],"p06":[0.572,0.617,0.57,0.588,0.641,0.588,0.557,0.538,0.521,0.523,0.459,0.437,0.42,0.646,0.462,0.49,0.53,0.553,0.701,0.626,0.637,0.661,0.671,0.682,0.687],"p07":[0.712,0.722,0.673,0.658,0.75,0.667,0.659,0.636,0.661,0.621,0.564,0.56,0.554,0.589,0.659,0.727,0.651,0.776,0.706,0.699,0.704,0.72,0.803,0.9,0.764],"p08":[0.47,0.454,0.433,0.421,0.409,0.422,0.402,0.39,0.348,0.333,0.29,0.463,0.27,0.34,0.464,0.398,0.41,0.529,0.662,0.417,0.457,0.47,0.48,0.461,0.451],"p09":[0.467,0.463,0.467,0.471,0.484,0.5,0.48,0.451,0.428,0.343,0.3,0.311,0.332,0.347,0.376,0.409,0.439,0.472,0.513,0.521,0.429,0.46,0.451,0.468,0.428],"p10":[0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.443,0.422,0.462,0.418,0.379,0.329,0.3,0.323,0.348,0.381,0.394,0.42,0.437,0.456,0.9,0.9,0.9,0.9],"p11":[0.639,0.646,0.647,0.604,0.559,0.529,0.499,0.472,0.429,0.376,0.331,0.303,0.306,0.313,0.334,0.391,0.416,0.437,0.437,0.442,0.49,0.51,0.536,0.521,0.52],"p12":[0.68,0.654,0.637,0.647,0.631,0.604,0.587,0.56,0.538,0.493,0.462,0.433,0.421,0.428,0.446,0.461,0.484,0.504,0.532,0.558,0.578,0.609,0.62,0.64,0.661],"p13":[0.541,0.531,0.438,0.48,0.417,0.404,0.557,0.359,0.364,0.277,0.277,0.277,0.277,0.364,0.374,0.404,0.46,0.458,0.43,0.471,0.447,0.432,0.451,0.44,0.469],"p14":[0.9,0.492,0.496,0.483,0.479,0.462,0.453,0.431,0.391,0.358,0.343,0.312,0.285,0.31,0.344,0.383,0.401,0.409,0.454,0.482,0.498,0.509,0.514,0.517,0.9],"p15":[0.608,0.616,0.627,0.636,0.622,0.622,0.56,0.528,0.506,0.457,0.416,0.376,0.363,0.363,0.422,0.4,0.423,0.614,0.506,0.526,0.9,0.9,0.707,0.409,0.42],"p16":[0.9,0.9,0.9,0.619,0.593,0.553,0.536,0.517,0.48,0.431,0.378,0.334,0.281,0.294,0.331,0.403,0.9,0.9,0.801,0.829,0.9,0.804,0.771,0.9,0.9],"p17":[0.538,0.528,0.541,0.526,0.511,0.487,0.461,0.451,0.424,0.408,0.398,0.377,0.347,0.37,0.399,0.41,0.434,0.45,0.469,0.472,0.47,0.486,0.48,0.47,0.46],"p18":[0.541,0.533,0.531,0.512,0.471,0.437,0.41,0.397,0.379,0.359,0.357,0.35,0.336,0.382,0.521,0.557,0.45,0.476,0.49,0.494,0.507,0.532,0.547,0.571,0.6],"p19":[0.629,0.65,0.637,0.63,0.618,0.69,0.639,0.613,0.577,0.536,0.51,0.475,0.503,0.526,0.58,0.614,0.623,0.628,0.677,0.671,0.668,0.717,0.684,0.68,0.664],"p20":[0.507,0.536,0.601,0.52,0.492,0.418,0.346,0.43,0.402,0.558,0.421,0.333,0.284,0.341,0.284,0.47,0.3,0.318,0.451,0.499,0.481,0.488,0.473,0.45,0.446],"p21":[0.9,0.9,0.792,0.819,0.799,0.793,0.741,0.793,0.744,0.672,0.774,0.719,0.626,0.774,0.766,0.686,0.67,0.726,0.717,0.744,0.771,0.784,0.801,0.774,0.768],"p22":[0.9,0.9,0.46,0.446,0.428,0.411,0.393,0.374,0.354,0.331,0.306,0.281,0.279,0.291,0.307,0.328,0.351,0.363,0.37,0.387,0.403,0.427,0.444,0.9,0.9],"p23":[0.569,0.366,0.383,0.541,0.461,0.471,0.488,0.474,0.401,0.396,0.359,0.314,0.304,0.477,0.308,0.341,0.413,0.443,0.41,0.396,0.417,0.424,0.43,0.522,0.432],"p24":[0.9,0.9,0.9,0.9,0.534,0.538,0.571,0.54,0.562,0.474,0.442,0.416,0.403,0.412,0.431,0.447,0.564,0.536,0.558,0.596,0.9,0.9,0.9,0.9,0.9],"p25":[0.9,0.9,0.407,0.391,0.28,0.397,0.284,0.391,0.401,0.28,0.28,0.28,0.28,0.294,0.343,0.331,0.363,0.367,0.386,0.428,0.451,0.473,0.512,0.9,0.9]};
  // The trail: it enters from the bottom edge and only ever climbs (never a downhill step), switching back and forth
  // across the mountain's face, always below the mountain's outline and inside a cone under the summit, the switchbacks
  // shrinking with height so it reads as a path on the slope in perspective.
  function trail(o, W, H, c, P) {
    var sky = SKY[o.pk];
    function skyY(x) { if (!sky) return -1e9; var f = Math.max(0, Math.min(1, (x - c.x) / c.w)) * 24, i = Math.floor(f), t = f - i; return c.y + ((sky[i] + ((sky[i + 1] == null ? sky[i] : sky[i + 1]) - sky[i]) * t)) * c.h; }
    function on(x, y) { return y > skyY(x) + 12 && Math.abs(x - P[0]) <= (y - P[1]) * .9 + 4; }
    var base = H + 10, n = 5, cx0 = Math.max(W * .3, Math.min(W * .7, P[0])), ctrl = [], side = P[0] > W / 2 ? -1 : 1;
    for (var k = 0; k <= n; k++) {
      var t = k / n, y = base + (P[1] - base) * t, cx = cx0 + (P[0] - cx0) * Math.pow(t, .7);
      if (k === n) { ctrl.push([P[0], P[1]]); break; }
      var L = cx, R = cx; while (L > 8 && on(L - 4, y)) L -= 4; while (R < W - 8 && on(R + 4, y)) R += 4;
      var a = Math.min(cx - L, R - cx + 0, W * .32) * .72 * Math.pow(1 - t, .6); if (a < 0) a = 0;
      ctrl.push([k === 0 ? cx - side * a * .4 : cx + side * (k % 2 ? 1 : -1) * a, y]);
    }
    var pts = smooth(ctrl, 16);
    for (var m = 1; m < pts.length; m++) {   // never downhill, never in the sky
      if (pts[m][1] < skyY(pts[m][0]) + 6 && m < pts.length - 8) pts[m][1] = skyY(pts[m][0]) + 6;
      if (pts[m][1] > pts[m - 1][1]) pts[m][1] = pts[m - 1][1];
    }
    pts[pts.length - 1] = [P[0], P[1]];
    var cum = [0]; for (m = 1; m < pts.length; m++) cum.push(cum[m - 1] + Math.hypot(pts[m][0] - pts[m - 1][0], pts[m][1] - pts[m - 1][1]));
    var tot = cum[cum.length - 1] || 1; pts.turns = [];
    for (k = 1; k < n; k++) pts.turns.push(cum[Math.min(cum.length - 1, k * 16)] / tot);   // smooth() passes through each control point every 16 samples
    return pts;
  }
  // progress (0…1) to a place on the trail, so the given progress marks land exactly on the turns
  function knotMap(knots) { return function (f) { for (var i = 1; i < knots.length; i++) if (f <= knots[i][0]) { var a = knots[i - 1], b = knots[i], t = (f - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return 1; }; }
  var SHLD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/></svg>';
  var TENT = '<svg viewBox="0 0 24 20" aria-hidden="true"><path class="tf" d="M12 2.2 2 18h20z"/><path class="td" d="M12 9.5 8.6 18h6.8z"/><path class="tg" d="M1 18.6h22"/></svg>';
  function camp(x, y, cls, sc) { return at(x, y, 'kzmx-cp ' + cls, '', ' data-s="' + sc + '"').replace('style="', 'style="transform:scale(' + sc + ');'); }
  function stepsMap(pts, n) {   // the first steps that fit go on the turns, spread evenly
    var T = pts.turns || [], m = Math.min(n - 1, T.length), kn = [[0, 0]];
    for (var j = 1; j <= m; j++) { var ti = Math.max(0, Math.min(T.length - 1, Math.round(j * (T.length + 1) / (m + 1)) - 1)), sf = n - 1 > T.length ? Math.round(j * n / (m + 1)) / n : j / n; if (T[ti] > kn[kn.length - 1][1] && sf > kn[kn.length - 1][0]) kn.push([sf, T[ti]]); }
    kn.push([1, 1]); return knotMap(kn);
  }
  // height progress 0 (bottom) … 1 (summit) for perspective sizing
  function hp(y, base, top) { return Math.max(0, Math.min(1, (base - y) / ((base - top) || 1))); }
  function etched(pts, done, base, top) {
    var s = '', i, segs = [];
    // the way ahead: footprints that shrink and fade with distance, each with a 1 pt shadow so it sits on the snow
    var L = 0, next = 0;
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (next <= L + d) { var u = (next - L) / (d || 1), x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u, h = hp(y, base, top), r = 1.9 - .8 * h;
        if (!done.inDone || next > done.len) s += '<circle cx="' + f1(x) + '" cy="' + f1(y + .9) + '" r="' + f1(r + .7) + '" class="kzmx-ft-sh"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" class="kzmx-ft" style="opacity:' + (0.95 - .35 * h).toFixed(2) + '"/>';
        next += 7.5 - 3.5 * h; }
      L += d;
    }
    // the part already climbed: a solid orange line that thins with height
    var dpts = done.pts || [], cs = '', gl = '', ln = '';
    // Nov 2 h: one continuous path (the old per-segment pieces overlapped into beads where their caps met)
    if (dpts.length > 1) {
      var d = 'M' + dpts.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L'), yAvg = 0;
      dpts.forEach(function (p) { yAvg += p[1]; }); yAvg /= dpts.length;
      var w = 4.8 - 2.4 * hp(yAvg, base, top);
      cs = '<path d="' + d + '" class="kzmx-ln-dcase" style="stroke-width:' + f1(w + 3) + ';stroke-linejoin:round;stroke-linecap:round;fill:none"/>';
      gl = '<path d="' + d + '" class="kzmx-ln-glow" style="stroke-width:' + f1(w + 6) + ';stroke-linejoin:round;stroke-linecap:round;fill:none"/>';
      ln = '<path d="' + d + '" class="kzmx-ln-done" style="stroke-width:' + f1(w) + ';stroke-linejoin:round;stroke-linecap:round;fill:none"/>';
    }
    return s + cs + gl + ln;
  }
  function climbSvg(o, W, H, pad) {
    var pk = PEAK[o.pk] || [.5, .3], c = cover(W, H, 720, 900, .35);
    // the summit sits at least 150 pt down, so the flag never runs into the heading
    c.y = Math.max(H - c.h, Math.min(0, (pad == null ? 150 : pad) - pk[1] * c.h)); o.py = H - c.h ? Math.round(c.y / (H - c.h) * 100) : 50;
    var P = [c.x + pk[0] * c.w, c.y + pk[1] * c.h], pts = trail(o, W, H, c, P), base = H + 10;
    var T = pts.turns || [], kn = [[0, 0]]; CPS.forEach(function (d, i) { if (T[i] != null) kn.push([d / TOP, T[i]]); }); kn.push([1, 1]);
    var map = knotMap(kn), me = along(pts, map(o.frac)), done = pts.slice(0, me.i).concat([me.p]), mk = '', Ls = 0;
    for (var q = 1; q < done.length; q++) Ls += Math.hypot(done[q][0] - done[q - 1][0], done[q][1] - done[q - 1][1]);
    CPS.forEach(function (d, i) {
      var p2 = along(pts, map(d / TOP)).p, past = o.within >= d, next = d === o.cp, sc = (1 - .3 * hp(p2[1], base, P[1])).toFixed(2);
      mk += camp(p2[0], p2[1], (past ? 'on' : '') + (next ? ' next' : ''), sc);
      if (next && !o.atTop) mk += at(p2[0], p2[1] - 6, 'kzmx-lab side', 'DAY ' + d + ' · ' + (o.run ? '+1 SHIELD' : num(d * STEP) + ' FT'));
    });
    mk += summitBadge(P, o.atTop ? 'THE TOP · ' + num(TOPFT) + ' FT' : (o.topIn === 1 ? '1 DAY' : o.topIn + ' DAYS') + ' TO THE TOP', W);
    var yv = me.p[1] > H - 18 ? inView(pts, me.i, H - 18) : me;
    if (yv !== me) { done = pts.slice(0, yv.i + 1); Ls = 0; for (q = 1; q < done.length; q++) Ls += Math.hypot(done[q][0] - done[q - 1][0], done[q][1] - done[q - 1][1]); }
    if (!o.atTop && o.frac > 0) mk += at(yv.p[0], yv.p[1], 'kzmx-puck' + (calm ? '' : ' live'), '<span class="kzmx-pc"></span>') + at(yv.p[0], yv.p[1], 'kzmx-lab you', 'YOU');
    if (!o.atTop && o.frac === 0) { var st = inView(pts, 0, H - 18).p; mk += at(st[0], st[1], 'kzmx-puck' + (calm ? '' : ' live'), '<span class="kzmx-pc"></span>') + at(st[0], st[1], 'kzmx-lab you', 'START'); }
    return '<svg class="kzmx-rt" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + etched(pts, { pts: o.frac > 0 ? done : [], len: Ls, inDone: o.frac > 0 }, base, P[1]) + '</svg>' + mk;
  }
  function stepsSvg(o, W, H, pad) {
    var pk = PEAK[o.pk] || [.5, .3], c = cover(W, H, 720, 900, .35);
    c.y = Math.max(H - c.h, Math.min(0, (pad == null ? 150 : pad) - pk[1] * c.h)); o.py = H - c.h ? Math.round(c.y / (H - c.h) * 100) : 50;
    var P = [c.x + pk[0] * c.w, c.y + pk[1] * c.h], pts = trail(o, W, H, c, P), base = H + 10;
    var ms = o.g.ms || [], n = Math.max(1, ms.length), map = stepsMap(pts, n), f = Math.min(1, o.steps / n);
    var me = along(pts, map(f)), done = f > 0 ? pts.slice(0, me.i).concat([me.p]) : pts.slice(0, inView(pts, 0, H - 18).i + 1), mk = '', Ls = 0;   // at step 0 the walk up to YOU is still orange
    for (var q = 1; q < done.length; q++) Ls += Math.hypot(done[q][0] - done[q - 1][0], done[q][1] - done[q - 1][1]);
    for (var i = 0; i < n - 1; i++) {
      var p2 = along(pts, map((i + 1) / n)).p, d = !!ms[i] && !!ms[i].d, nx = !d && i === o.steps, sc = (1 - .3 * hp(p2[1], base, P[1])).toFixed(2);
      mk += at(p2[0], p2[1], 'kzmx-step' + (d ? ' on' : nx ? ' next' : ''), d ? CHECK : '<b>' + (i + 1) + '</b>');
      if (nx) mk += at(p2[0], p2[1] - 6, 'kzmx-lab side', 'STEP ' + (i + 1) + ' · ' + short(ms[i].t || 'Next step').toUpperCase());
    }
    mk += summitBadge(P, o.earned ? 'EVERY STEP DONE' : 'THE TOP · STEP ' + n, W);
    if (!o.earned) { var yv = inView(pts, f > 0 ? me.i : 0, H - 18), yp = f > 0 && me.p[1] <= H - 18 ? me.p : yv.p; mk += at(yp[0], yp[1], 'kzmx-puck' + (calm ? '' : ' live'), '<span class="kzmx-pc"></span>') + at(yp[0], yp[1], 'kzmx-lab you', f > 0 ? 'YOU' : 'START'); }
    return '<svg class="kzmx-rt" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + etched(pts, { pts: done, len: Ls, inDone: done.length > 1 }, base, P[1]) + '</svg>' + mk;
  }
  // the expedition's ridge, traced from the photo itself (fraction of the 1440×760 frame)
  var RIDGE = [[0.003,0.578],[0.025,0.573],[0.047,0.568],[0.069,0.573],[0.092,0.579],[0.114,0.580],[0.136,0.576],[0.158,0.578],[0.181,0.578],[0.203,0.573],[0.225,0.566],[0.247,0.560],[0.269,0.556],[0.292,0.553],[0.314,0.551],[0.336,0.550],[0.358,0.549],[0.381,0.550],[0.403,0.549],[0.425,0.543],[0.447,0.530],[0.469,0.522],[0.492,0.525],[0.514,0.533],[0.536,0.538],[0.558,0.546],[0.581,0.556],[0.603,0.566],[0.625,0.569],[0.647,0.569],[0.669,0.568],[0.692,0.567],[0.714,0.565],[0.736,0.562],[0.758,0.564],[0.781,0.566],[0.803,0.561],[0.825,0.548],[0.847,0.541],[0.869,0.530],[0.892,0.522],[0.914,0.518],[0.936,0.523],[0.958,0.529],[0.981,0.536]];
  var EXPOS = .62;   // object-position x of the original expedition photo (keeps both big peaks in frame)
  var EXP = {"exped":{"x":0.62},"e01":{"x":0.5,"r":[[0.004,0.667],[0.029,0.67],[0.054,0.664],[0.079,0.638],[0.104,0.607],[0.129,0.602],[0.154,0.602],[0.179,0.597],[0.204,0.579],[0.229,0.577],[0.254,0.576],[0.279,0.573],[0.304,0.566],[0.329,0.573],[0.354,0.573],[0.379,0.55],[0.404,0.519],[0.429,0.491],[0.454,0.487],[0.479,0.503],[0.504,0.513],[0.529,0.527],[0.554,0.526],[0.579,0.503],[0.604,0.521],[0.629,0.537],[0.654,0.532],[0.679,0.507],[0.704,0.502],[0.729,0.521],[0.754,0.549],[0.779,0.566],[0.804,0.585],[0.829,0.602],[0.854,0.606],[0.879,0.618],[0.904,0.622],[0.929,0.63],[0.954,0.638],[0.979,0.638]]},"e02":{"x":0.5,"r":[[0.129,0.641],[0.154,0.644],[0.179,0.631],[0.212,0.591],[0.237,0.589],[0.263,0.603],[0.287,0.614],[0.312,0.617],[0.338,0.613],[0.362,0.608],[0.388,0.607],[0.412,0.606],[0.438,0.604],[0.463,0.586],[0.487,0.557],[0.512,0.564],[0.537,0.565],[0.562,0.574],[0.588,0.58],[0.613,0.574],[0.637,0.572],[0.662,0.574],[0.688,0.574],[0.713,0.576],[0.738,0.587],[0.762,0.598],[0.787,0.612],[0.812,0.625],[0.838,0.637],[0.871,0.662],[0.896,0.663],[0.921,0.641],[0.946,0.636],[0.971,0.676]]},"e04":{"x":0.5,"r":[[0.029,0.759],[0.246,0.778],[0.271,0.774],[0.296,0.762],[0.321,0.748],[0.346,0.727],[0.371,0.7],[0.396,0.68],[0.421,0.671],[0.446,0.666],[0.471,0.655],[0.496,0.653],[0.521,0.653],[0.546,0.646],[0.571,0.652],[0.596,0.668],[0.621,0.685],[0.646,0.683],[0.671,0.666],[0.696,0.654],[0.721,0.632],[0.746,0.613],[0.771,0.611],[0.796,0.633],[0.821,0.654]]},"e05":{"x":0.5,"r":[[0.062,0.53],[0.087,0.528],[0.113,0.547],[0.163,0.568],[0.188,0.555],[0.212,0.55],[0.237,0.536],[0.263,0.532],[0.287,0.564],[0.312,0.596],[0.338,0.612],[0.362,0.611],[0.388,0.603],[0.412,0.604],[0.438,0.625],[0.463,0.67],[0.487,0.686],[0.512,0.655],[0.537,0.641],[0.562,0.643],[0.588,0.656],[0.613,0.671],[0.637,0.663],[0.662,0.64],[0.688,0.696],[0.713,0.778],[0.738,0.795],[0.762,0.764],[0.787,0.724],[0.812,0.724],[0.846,0.746],[0.871,0.761],[0.896,0.778]]},"e06":{"x":0.5,"r":[[0.004,0.579],[0.046,0.568],[0.071,0.531],[0.096,0.536],[0.121,0.562],[0.146,0.561],[0.171,0.582],[0.196,0.597],[0.221,0.589],[0.246,0.569],[0.271,0.533],[0.296,0.518],[0.321,0.506],[0.346,0.518],[0.379,0.533],[0.404,0.536],[0.438,0.546],[0.463,0.558],[0.487,0.564],[0.512,0.562],[0.537,0.568],[0.571,0.599],[0.596,0.611],[0.621,0.613],[0.646,0.628],[0.671,0.621],[0.696,0.607],[0.721,0.593],[0.746,0.563],[0.771,0.527],[0.796,0.499],[0.821,0.506],[0.846,0.525],[0.871,0.547],[0.929,0.566],[0.954,0.589],[0.988,0.601]]}};   // ridges traced from each photo's pixels
  EXP.exped.r = RIDGE;
  function expedSvg(o, W, H) {
    var ex = EXP[o.pk] || EXP.exped, c = cover(W, H, 1440, 760, .5); c.x = (W - c.w) * ex.x;
    var R = ex.r.map(function (r) { return [c.x + r[0] * c.w, c.y + r[1] * c.h - 3]; }).filter(function (p) { return p[0] > 10 && p[0] < W - 10; });
    var ms = (o.g.ms || []), n = Math.max(1, ms.length), x0 = R[0][0] + 14, x1 = Math.min(W - 26, R[R.length - 1][0] - 4), mk = '', idx = [];
    // one marker per step, evenly spaced along the ridge (snapped to the nearest traced ridge point); the finish takes the
    // highest point near the right end
    for (var i = 0; i < n; i++) {
      var tx = n === 1 ? x1 : x0 + (x1 - x0) * i / (n - 1), best = 0;
      R.forEach(function (p, k) { if (Math.abs(p[0] - tx) < Math.abs(R[best][0] - tx)) best = k; });
      if (i === n - 1 && n > 1) { var lo = x1 - (x1 - x0) / (n - 1) / 2; R.forEach(function (p, k) { if (p[0] >= lo && p[0] <= W - 18 && p[1] < R[best][1]) best = k; }); }
      idx.push(best);
    }
    var path = R.slice(0, idx[n - 1] + 1), doneTo = o.steps ? idx[Math.min(o.steps, n) - 1] : -1;
    var done = doneTo >= 0 ? R.slice(0, doneTo + 1) : [];
    idx.forEach(function (k, i) {
      var p = R[k], d = !!ms[i] && !!ms[i].d, nx = !d && i === o.steps, last = i === n - 1;
      if (last) { mk += at(p[0], p[1], 'kzmx-summit small', '<span class="kzmx-sdot"></span><span class="kzmx-stem"></span><b class="kzmx-sbadge' + (d ? '' : ' dim') + '">' + FLAG + '</b>'); return; }
      mk += at(p[0], p[1], 'kzmx-step' + (d ? ' on' : nx ? ' next' : ''), d ? CHECK : '<b>' + (i + 1) + '</b>');
    });
    if (o.next) { var nk = idx[Math.min(o.steps, n - 1)]; mk += at(R[nk][0], R[nk][1], 'kzmx-lab below', 'NEXT · STEP ' + (o.steps + 1)); }
    return '<svg class="kzmx-rt" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + lines(path, done) + '</svg>' + mk;
  }
  // after a scene is drawn: keep every label inside the card
  function hit(a, b) { var r = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return r.left < q.right + 4 && q.left < r.right + 4 && r.top < q.bottom + 2 && q.top < r.bottom + 2; }
  function clampLabels(root) {
    var box = root.getBoundingClientRect();
    [].forEach.call(root.querySelectorAll('.kzmx-lab'), function (l) {
      l.style.marginLeft = ''; var r = l.getBoundingClientRect(), dx = 0;
      if (r.right > box.right - 8) dx = box.right - 8 - r.right; if (r.left + dx < box.left + 8) dx = box.left + 8 - r.left;
      if (dx) l.style.marginLeft = Math.round(dx) + 'px';
    });
    // labels never overlap: YOU and the top win; a checkpoint label flips to the other side, then steps aside
    // the top's label never covers the heading: try its side, then the other side, then under the summit
    var top = root.querySelector('.kzmx-lab.gold'), head = [].slice.call(root.querySelectorAll('.kzmx-hd p'));
    if (top) { var tries = top.classList.contains('r') ? ['r', 'l', 'u'] : ['l', 'r', 'u'], k = 0; top.style.marginLeft = '';   // never slid back over its own flag
      var marks0 = [].slice.call(root.querySelectorAll('.kzmx-cp, .kzmx-step, .kzmx-puck, .kzmx-lab.you, .kzmx-summit .kzmx-sbadge'));
      var clash = function () { var r = top.getBoundingClientRect(); return r.left < box.left + 6 || r.right > box.right - 6 || head.some(function (h) { return hit(top, h); }) || marks0.some(function (m) { return hit(top, m); }); };
      while (clash() && ++k < tries.length) { top.classList.remove('r', 'l', 'u'); top.classList.add(tries[k]); } }
    var you = root.querySelector('.kzmx-lab.you');
    if (you && [].some.call(root.querySelectorAll('.kzmx-cp, .kzmx-camp'), function (d) { return hit(you, d); })) { you.classList.add('flip'); if (you.getBoundingClientRect().left < box.left + 6) you.classList.remove('flip'); }
    var labs = [].slice.call(root.querySelectorAll('.kzmx-lab')), pri = labs.filter(function (l) { return !l.classList.contains('side'); });
    labs.filter(function (l) { return l.classList.contains('side'); }).forEach(function (l) {
      var marks = [].slice.call(root.querySelectorAll('.kzmx-puck, .kzmx-summit .kzmx-sbadge')), bad = function () { return pri.concat(marks).some(function (o) { return hit(l, o); }); };
      if (bad()) { l.classList.add('flip'); if (bad()) l.hidden = true; }
    });
    // last pass after the flips: nothing may hang outside the card (a label that still can't fit steps aside)
    [].forEach.call(root.querySelectorAll('.kzmx-lab'), function (l) {
      if (l.hidden) return; var r = l.getBoundingClientRect(), m = parseFloat(l.style.marginLeft) || 0, dx = 0;
      if (r.right > box.right - 6) dx = box.right - 6 - r.right; if (r.left + dx < box.left + 6) dx = box.left + 6 - r.left;
      if (dx && l === top) { var sb = root.querySelector('.kzmx-summit .kzmx-sbadge'); l.style.marginLeft = Math.round(m + dx) + 'px'; if (sb && hit(l, sb)) { l.style.marginLeft = ''; l.classList.remove('r', 'l'); l.classList.add('u'); } return; }
      if (dx) { l.style.marginLeft = Math.round(m + dx) + 'px'; if (!l.classList.contains('you') && !l.classList.contains('gold') && pri.concat([].slice.call(root.querySelectorAll('.kzmx-puck'))).some(function (o) { return o !== l && hit(l, o); })) l.hidden = true; }
      l.style.marginTop = ''; var r2 = l.getBoundingClientRect(), dy = 0;
      if (r2.bottom > box.bottom - 6) dy = box.bottom - 6 - r2.bottom; if (r2.top + dy < box.top + 6) dy = box.top + 6 - r2.top;
      if (dy) l.style.marginTop = Math.round(dy) + 'px';
    });
  }

  // Growth pins: labels stay inside the photo
  // Growth pins: every label in one of two rows above the ridge, never overlapping, never outside the photo;
  // each stem runs straight down from its label to the summit it stands on
  function clampPins(hero) {
    if (!hero) return; var box = hero.getBoundingClientRect(), ROWS = [8, 34, 60], LH = 22, placed = [];
    var pins = [].slice.call(hero.querySelectorAll('.kzmx-pin')).map(function (p) { var b = p.querySelector('b'); b.style.marginLeft = ''; b.style.top = ''; b.style.bottom = ''; return { i: +p.getAttribute('data-i'), p: p, b: b, x: parseFloat(p.style.left), y: parseFloat(p.style.top), w: b.getBoundingClientRect().width, gold: p.classList.contains('gold') }; });
    pins.sort(function (a, b) { return a.i - b.i; });   // the order they were chosen in: Kaizen 66 / earned first
    pins.forEach(function (q) {
      var W = box.width, best = null;
      ROWS.forEach(function (top, r) {
        if (best || top + LH + 8 > q.y) return;
        var l = Math.min(Math.max(q.x - q.w / 2, 8), W - 8 - q.w), tries = [0, 1, -1, 2, -2, 3, -3];
        for (var t = 0; t < tries.length && !best; t++) {
          var L = l + tries[t] * 24; if (L < 8 || L + q.w > W - 8 || L > q.x - 10 || L + q.w < q.x + 10) continue;
          if (!placed.some(function (o) { return o.top === top && L < o.L + o.w + 6 && o.L < L + q.w + 6; })) best = { top: top, L: L };
        }
      });
      if (!best) { q.p.hidden = true; return; }
      placed.push({ top: best.top, L: best.L, w: q.w });
      q.b.style.top = (best.top - q.y) + 'px'; q.b.style.bottom = 'auto'; q.b.style.marginLeft = Math.round(best.L - (q.x - q.w / 2)) + 'px';
      var st = q.p.querySelector('i'); st.style.bottom = 'auto'; st.style.top = (best.top + LH - q.y) + 'px'; st.style.height = Math.max(4, q.y - 5 - best.top - LH) + 'px';
    });
  }
  function stats(cells) { return '<div class="kzmx-st3">' + cells.map(function (c) { return '<span><b' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + c[0] + '</b><em>' + c[1] + '</em></span>'; }).join('') + '</div>'; }
  var lastScene = '';
  var HDB = {};   // the goal page heading's height per width (keeps a long-term climb's summit under it)
  function scene() {
    var page = document.getElementById('kz-goalpage'); if (!page || !/\/pages\/goal/.test(location.pathname)) return;
    var gid = pageGid(), o = gid && K.mtn(gid); if (!o) return;
    var anchor = page.querySelector('.kz-g1name, .kzg-goal, .kzgq, .kz-g1row, .kz66-gp'); if (!anchor) return;
    var host = anchor.parentNode, sec = page.querySelector('#kzmx-scene');
    var W = Math.round((host.getBoundingClientRect().width) || 358), H = o.kind === 'storm' ? 300 : 340;
    var h = '', head = '', foot = '';
    if (o.kind === 'climb') {
      var eb = o.mountain > 1 ? (o.mountain === SEVEN ? 'EVEREST · MOUNTAIN 7 OF 7' : 'SEVEN SUMMITS · MOUNTAIN ' + o.mountain + ' OF 7') : (o.run ? (o.day ? 'KAIZEN 66 · DAY ' + o.day + ' OF 66' : 'KAIZEN 66 · STARTS SOON') : o.within ? 'DAY ' + o.within + ' OF 66' : 'AT THE BASE · THE TOP IS DAY 66');
      if (o.earned && !o.climbing) eb = 'HABIT EARNED' + (o.summitAt ? ' · ' + fmtDay(o.summitAt).toUpperCase() : '');
      head = '<p class="kzmx-eb">' + esc(eb) + '</p><p class="kzmx-big">' + (o.mountain > 1 ? esc(o.totalFt) : esc(o.ft)) + '</p>' + (o.mountain > 1 ? '<p class="kzmx-sub">in total · day ' + o.within + ' of 66 on this one</p>' : '');
      var svgc = climbSvg(o, W, H); h = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="' + esc('The mountain for ' + o.name) + '" style="object-position:50% ' + o.py + '%"><div class="kzmx-tg"></div><div class="kzmx-bg2"></div>' + svgc;
      var lm = lastMiss(o);
      foot = stats(o.atTop ? [[num(o.total), 'CHECK-OFFS'], [ft(o.total).replace(' ft', ''), 'FEET IN TOTAL'], [o.mountain > 1 ? o.mountain + ' of 7' : '1st', 'MOUNTAIN', 'gold']]
        : [[o.cp < TOP ? plural(o.cpIn, 'day') : plural(o.topIn, 'day'), o.cp < TOP ? (o.run ? 'TO A SHIELD' : 'TO CHECKPOINT') : 'TO THE TOP', 'orange'], [plural(o.topIn, 'day'), 'TO THE TOP'], ['+131 ft', 'EACH CHECK-OFF']]);
      if (lm && !o.atTop) foot += '<div class="kzmx-miss" role="note"><img src="' + ART + 'fog_sm.webp" alt=""><span><b>You missed ' + esc(lm.label === 'yesterday' ? 'yesterday' : lm.label) + '. You lost nothing.</b><em>Missing a day never sends you back down.</em></span></div>';
      if (o.earned && !o.climbing && o.choice !== 'stop') foot += '<button type="button" class="kzmx-cta" data-kzmx-summit="' + esc(o.id) + '">Choose: keep climbing or stop here</button>';
      if (o.seven) foot += '<p class="kzmx-note gold">All Seven Summits. 462 check-offs.</p>';
    } else if (o.kind === 'storm') {
      head = '<p class="kzmx-eb">' + esc(o.name.toUpperCase()) + '</p><p class="kzmx-big">' + plural(o.clean, 'clean day') + '</p><p class="kzmx-sub">' + (o.earned ? 'Clear skies.' : o.clean ? 'The fog is lifting. Clear skies at 66.' : 'Each clean day clears the fog.') + '</p>';
      var fog = (1 - o.frac).toFixed(3);
      h = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="Fog over the mountains" style="object-position:50% 40%"><div class="kzmx-fog" style="opacity:' + fog + '"><i></i><i></i><i></i></div><div class="kzmx-tg"></div><div class="kzmx-bg2"></div>';
      foot = '<div class="kzmx-fogbar" role="img" aria-label="' + o.pct + ' percent clear"><span class="kzmx-bar"><i style="width:' + (o.frac * 100).toFixed(1) + '%"></i></span><span class="kzmx-fl"><em>Thick fog</em><b>' + o.pct + '% clear</b><em class="gold">Clear skies</em></span></div>' +
        stats([[String(o.clean), 'CLEAN DAYS'], [String(o.slips), o.slips === 1 ? 'SLIP, NO RESET' : 'SLIPS, NO RESET'], [o.earned ? 'Clear' : String(o.toClear), o.earned ? 'SKIES' : 'TO CLEAR SKIES', o.earned ? 'gold' : 'orange']]);
    } else {
      var nx = o.next, by = o.g.by ? (K.bd && K.bd.fmtYM ? K.bd.fmtYM(o.g.by) : o.g.by) : '', byShort = o.g.by ? MON[+String(o.g.by).slice(5, 7) - 1] + ' ' + String(o.g.by).slice(0, 4) : '';
      head = '<p class="kzmx-eb">' + esc(o.name.toUpperCase()) + '</p><p class="kzmx-big">' + (o.earned ? 'Every step done' : 'Step ' + Math.min(o.steps + 1, o.stepsT) + ' of ' + o.stepsT) + '</p><p class="kzmx-sub">' + (by ? 'Finish by ' + esc(by) : '') + (o.left ? (by ? ' · ' : '') + esc(o.left) : '') + '</p>';
      var svgs = stepsSvg(o, W, H, HDB[W] ? Math.max(200, HDB[W] + 58) : 200); /* Nov 2 h: the summit sits below the heading, measured (it runs taller on a narrow phone or a long name) */ h = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="' + esc('The mountain for ' + o.name) + '" style="object-position:50% ' + o.py + '%"><div class="kzmx-tg"></div><div class="kzmx-bg2"></div>' + svgs;
      foot = stats([[o.steps + ' of ' + o.stepsT, 'STEPS DONE'], [Math.round(o.frac * 100) + '%', 'OF THE WAY', 'orange'], [byShort ? esc(byShort) : 'No date', 'THE FINISH']]) +
        (nx ? '<div class="kzmx-next"><em>NEXT PEAK</em><b>' + esc(nx.t || 'Next step') + '</b>' + (nx.by ? '<span>By ' + esc(K.bd && K.bd.fmtYM ? K.bd.fmtYM(nx.by) : nx.by) + '</span>' : '') + '</div>' : '');
    }
    var aria = o.kind === 'climb' ? o.name + '. ' + (o.run ? 'Kaizen 66 day ' + o.day : 'Day ' + o.within) + ' of 66, ' + o.ft + ' of ' + num(TOPFT) + ' feet.' + (o.atTop ? ' At the top.' : ' Next checkpoint day ' + o.cp + '.')
      : o.kind === 'storm' ? o.name + '. ' + plural(o.clean, 'clean day') + ', ' + o.pct + ' percent clear.' : o.name + '. ' + o.steps + ' of ' + o.stepsT + ' steps done.';
    var full = '<div class="kzmx-sc ' + o.kind + '" style="height:' + H + 'px" role="img" aria-label="' + esc(aria) + '">' + h + '<div class="kzmx-hd">' + head + '</div></div>' + foot;
    var sig = full + W;
    if (sec && sig === lastScene && sec.parentNode) { pager(page, sec, o); return; }   // Nov 4: a redraw elsewhere can drop the pager; put it back
    if (!sec) { sec = document.createElement('section'); sec.id = 'kzmx-scene'; sec.className = 'kzmx-scene'; sec.setAttribute('aria-label', o.kind === 'storm' ? 'Out of the storm' : 'The climb'); }
    // right under the goal's name (the page orders its parts with CSS order, so the scene takes the name's order)
    var nm = page.querySelector('.kz-g1name'), before = nm ? nm.nextElementSibling : (page.querySelector('.kzg-goal') || anchor), par = nm ? nm.parentNode : before.parentNode;
    if (before !== sec && sec.previousElementSibling !== nm) par.insertBefore(sec, before);
    if (nm) { var ord = getComputedStyle(nm).order; if (sec.style.order !== ord) sec.style.order = ord; }
    if (sig !== lastScene) { sec.innerHTML = full; lastScene = sig; try { clampLabels(sec.querySelector('.kzmx-sc')); } catch (e) {} }
    try { var scx = sec.querySelector('.kzmx-sc'), hdx = scx && scx.querySelector('.kzmx-hd'); if (hdx && o.kind === 'exped') { var hb = Math.round(hdx.getBoundingClientRect().bottom - scx.getBoundingClientRect().top); if (hb > 0 && Math.abs((HDB[W] || 0) - hb) > 2) { HDB[W] = hb; lastScene = ''; setTimeout(soon, 0); } else { var smt = scx.querySelector('.kzmx-summit'), sbg = smt && smt.querySelector('.kzmx-sbadge'); if (sbg && [].some.call(hdx.children, function (p) { return hit(sbg, p); })) { smt.classList.add('kzmx-low'); try { clampLabels(scx); } catch (e2) {} } } } } catch (e) {}
    de.classList.add('kz-mtn-goal');
    pager(page, sec, o);
  }
  function order() {   // the Growth order: Kaizen 66 first, then furthest up, then the mountains already climbed
    var list = goals().map(function (g) { return K.mtn(g); }).filter(Boolean);
    var now = list.filter(function (o) { return o.climbing; }).sort(function (a, b) { return (b.run ? 1 : 0) - (a.run ? 1 : 0) || b.frac - a.frac; });
    var won = list.filter(function (o) { return o.earned && !(o.kind === 'climb' && o.climbing); });
    return byOrder(now.concat(won));
  }
  function pager(page, sec, o) {
    var all = order(), i = -1; all.forEach(function (x, k) { if (x.id === o.id) i = k; });
    var pg = page.querySelector('#kzmx-pager');
    if (i < 0 || all.length < 2) { if (pg) pg.remove(); return; }
    var pv = all[(i - 1 + all.length) % all.length], nx = all[(i + 1) % all.length], sig = pv.id + '|' + nx.id + '|' + i + '|' + all.length + '|' + pv.name + nx.name;
    if (!pg) { pg = document.createElement('nav'); pg.id = 'kzmx-pager'; pg.className = 'kzmx-pager'; pg.setAttribute('aria-label', 'Your other mountains'); }
    if (pg.nextElementSibling !== sec) sec.parentNode.insertBefore(pg, sec);
    pg.style.order = sec.style.order;
    if (pg.__s === sig) return; pg.__s = sig;
    pg.innerHTML = '<a href="' + goalHref(pv.id) + '" data-kzmx-go="' + esc(pv.id) + '" data-dir="-1" aria-label="Previous mountain: ' + esc(pv.name) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>' + esc(short(pv.name)) + '</span></a>' +
      '<b>' + (i + 1) + ' of ' + all.length + '</b>' +
      '<a href="' + goalHref(nx.id) + '" data-kzmx-go="' + esc(nx.id) + '" data-dir="1" aria-label="Next mountain: ' + esc(nx.name) + '"><span>' + esc(short(nx.name)) + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>';
  }
  function go(id, dir) {
    var sc = document.querySelector('#kzmx-scene');
    if (sc && !calm) { sc.style.transition = 'transform .22s ease, opacity .22s ease'; sc.style.transform = 'translateX(' + (dir < 0 ? 40 : -40) + 'px)'; sc.style.opacity = '0'; }
    try { sessionStorage.setItem('kzmx-in', String(dir)); } catch (e) {}
    setTimeout(function () { location.replace(goalHref(id)); }, calm ? 0 : 160);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-kzmx-go]'); if (!a) return;
    e.preventDefault(); e.stopPropagation(); try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'tick' }); } catch (er) {}
    go(a.getAttribute('data-kzmx-go'), +a.getAttribute('data-dir'));
  }, true);
  var sw = null;
  document.addEventListener('touchstart', function (e) { var t = e.touches[0], s2 = e.target.closest && e.target.closest('#kzmx-scene .kzmx-sc'); sw = s2 && e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!sw) return; var t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y; sw = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    var a = document.querySelector('#kzmx-pager [data-dir="' + (dx < 0 ? 1 : -1) + '"]'); if (a) go(a.getAttribute('data-kzmx-go'), dx < 0 ? 1 : -1);
  }, { passive: true });
  try { var din = sessionStorage.getItem('kzmx-in'); if (din) { sessionStorage.removeItem('kzmx-in'); de.classList.add('kzmx-in' + (din === '-1' ? 'l' : 'r')); setTimeout(function () { de.classList.remove('kzmx-inl', 'kzmx-inr'); }, 400); } } catch (e) {}
  window.addEventListener('resize', function () { lastScene = ''; soon(); });

  // ---------- 4 · Day 66: "You made it." ----------
  var shownNow = {};
  // never on top of another pop-up (quote card, week recap, Kaizen 66 finish, sheets): it waits until they are closed
  var POPS = '[role="dialog"], [aria-modal="true"], .kz-tmodal:not([hidden]), .kz-qcard.in, .kz-qmodal:not([hidden]), .kz-weekpop:not([hidden]), .kz-sheet49.on, .kz66-done, .kz-p3-rc';
  function anyDialog() { return [].some.call(document.querySelectorAll(POPS), function (e) { return e.getClientRects().length && !e.closest('.kzmx-sum'); }); }
  var bootAt = Date.now(), waitT = 0;
  function summitCheck() {
    if (document.querySelector('.kzmx-sum') || anyDialog()) return;
    if (Date.now() - bootAt < 1800) { if (!waitT) waitT = setTimeout(function () { waitT = 0; soon(); }, 1900 - (Date.now() - bootAt)); return; }   // let the day's own pop-ups appear first
    var seen = null; try { seen = K.get('summitseen', null); } catch (e) {} seen = seen && typeof seen === 'object' ? seen : {};
    var today = todayKey(), pick = null, since = null;
    // the screen celebrates reaching the top from now on; goals that were already past 66 when mountains arrived
    // get the same choice from their goal page ("Choose: keep climbing or stop here") instead of a run of pop-ups
    try { since = K.get('mtnsince', null); if (!since) { since = today; K.set('mtnsince', since); } } catch (e) { since = today; }
    goals().some(function (g) {
      var o = K.mtn(g); if (!o || !o.summitAt || o.summitAt < since) return false;
      var due = o.kind === 'climb' ? (o.earned && !o.choice) : (o.kind === 'storm' && o.earned && !(summits()[o.id] || {}).c);
      if (due && seen[o.id] !== today && !shownNow[o.id]) { pick = o; return true; } return false;
    });
    if (pick) showSummit(pick, false);
  }
  function showSummit(o, asked) {
    if (!asked && anyDialog()) return;
    shownNow[o.id] = 1;
    if (!asked) { var seen = {}; try { seen = K.get('summitseen', {}) || {}; } catch (e) {} seen[o.id] = todayKey(); try { K.set('summitseen', seen); } catch (e) {} }
    var climb = o.kind === 'climb', missed = 0;
    if (climb && o.summitAt) { var ds = doneDays(o.id); missed = Math.max(0, Math.round((D(o.summitAt) - D(ds[0])) / 864e5) + 1 - TOP); }
    var s = document.createElement('div'); s.className = 'kzmx-sum'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'kzmx-sum-h');
    s.innerHTML = '<img class="kzmx-sum-ph" src="' + ART + 'summit.webp" alt="Sunrise over a dark summit ridge">' +
      '<div class="kzmx-sum-top"><button type="button" class="kzmx-x" data-sum="close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button type="button" class="kzmx-share" data-sum="share"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5"/></svg>Share</button></div>' +
      '<div class="kzmx-sum-tx"><p class="kzmx-eb gold">' + (climb ? 'DAY 66 · ' + num(TOPFT) + ' FT' : '66 CLEAN DAYS') + '</p><h1 id="kzmx-sum-h">' + (climb ? 'You made it.' : 'Clear skies.') + '</h1>' +
      '<p>' + esc(climb ? o.name + ' is a habit now. 66 check-offs' + (missed ? ', ' + plural(missed, 'day') + ' missed,' : '') + ' and you never had to start over.' : o.name + ' is behind you. 66 clean days' + (o.slips ? ', ' + plural(o.slips, 'slip') + ', and the fog never came back.' : '.')) + '</p>' +
      stats(climb ? [['66', 'CHECK-OFFS'], [String(missed), 'DAYS MISSED'], [num(TOPFT), 'FEET', 'gold']] : [['66', 'CLEAN DAYS'], [String(o.slips), 'SLIPS'], ['100%', 'CLEAR', 'gold']]) + '</div>' +
      '<div class="kzmx-sum-act">' + (climb ? '<button type="button" class="kzmx-gold" data-sum="keep"><span><b>Keep climbing</b><em>Seven Summits · mountain 2 of 7</em></span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
        '<button type="button" class="kzmx-ghost" data-sum="stop">Stop here · keep the habit, no more climbing</button>' : '<button type="button" class="kzmx-gold one" data-sum="clear"><span><b>Done</b></span></button>') + '</div>';
    document.body.appendChild(s); de.classList.add('kzmx-sum-on');
    try { K.tabbar && K.tabbar(false); } catch (e) {}
    var prev = document.activeElement, first = s.querySelector('.kzmx-gold'); setTimeout(function () { first && first.focus(); }, 30);
    function close() { s.remove(); de.classList.remove('kzmx-sum-on'); try { K.tabbar && K.tabbar(true); } catch (e) {} lastG = ''; lastScene = ''; soon(); if (prev && prev.focus) try { prev.focus(); } catch (e) {} }
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sum]'); if (!b) return; var a = b.getAttribute('data-sum');
      if (a === 'keep') { setSummit(o.id, { c: 'keep', at: todayKey() }); close(); }
      else if (a === 'stop') { setSummit(o.id, { c: 'stop', at: todayKey() }); close(); }
      else if (a === 'clear') { setSummit(o.id, { c: 'clear', at: todayKey() }); close(); }
      else if (a === 'share') { try { K.share && K.share(o.id); } catch (er) {} }
      else close();
    });
    s.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-kzmx-summit]'); if (!b) return; var o = K.mtn(b.getAttribute('data-kzmx-summit')); if (o) showSummit(o, true); });

  // ---------- 5 · Retire the tree art ----------
  function gidNear(el) {
    var n = el; for (var i = 0; n && i < 8; i++, n = n.parentElement) {
      var id = n.getAttribute && (n.getAttribute('data-id') || n.getAttribute('data-gid') || n.getAttribute('data-goal'));
      if (id && byId(id)) return id;
      var hr = n.getAttribute && n.getAttribute('href'), m = hr && /[?&]id=([^&#]+)/.exec(hr); if (m && byId(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
      var a = n.querySelector && n.querySelector(':scope > a[href*="goal?id="], :scope [data-id]');
      if (a) { var id2 = a.getAttribute('data-id'), m2 = /[?&]id=([^&#]+)/.exec(a.getAttribute('href') || ''); id2 = id2 && byId(id2) ? id2 : m2 ? decodeURIComponent(m2[1]) : null; if (id2 && byId(id2)) return id2; }
    }
    return null;
  }
  function retireArt() {
    [].forEach.call(document.querySelectorAll('img[src*="/art/trees/"]'), function (img) {
      if (img.closest('#kzmx-g, #kzmx-scene, .kzmx-sum')) return;
      var gid = gidNear(img), o = gid && K.mtn(gid);
      img.setAttribute('src', o ? o.pic : ART + 'h1_sm.webp'); img.classList.add('kzmx-thumb'); if (img.alt && /tree|oak|cherry|maple|birch|willow|bodhi|maidenhair/i.test(img.alt)) img.alt = o ? 'The mountain for ' + o.name : '';
    });
  }

  // ---------- 6 · Share ----------
  function topGoal(gid) {
    if (gid) return K.mtn(gid);
    var r = k66run(); if (r) return K.mtn(r.goal);
    var best = null; goals().forEach(function (g) { var o = K.mtn(g); if (o && o.kind === 'climb' && (!best || o.total > best.total)) best = o; }); return best;
  }
  K.share = function (gid) {
    var o = topGoal(gid), url = 'https://kaizengrow.app';
    var text = !o ? 'I’m building habits one day at a time with Kaizen.' : o.kind === 'climb'
      ? (o.atTop ? 'I made it to the top: 66 days of ' + o.name.toLowerCase() + '.' : 'Day ' + (o.run ? o.day : o.within) + ' of 66 on my climb: ' + o.ft + ' up.') + ' Start your own climb:'
      : o.kind === 'storm' ? plural(o.clean, 'clean day') + ' and counting. Start your own:' : 'Step ' + o.steps + ' of ' + o.stepsT + ' on my expedition. Start your own:';
    return K.shareCard(o).then(function (blob) {
      var file = blob && typeof File === 'function' ? new File([blob], 'kaizen-' + todayKey() + '.png', { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text + ' ' + url });
      if (navigator.share) return navigator.share({ text: text + ' ' + url });
    }).catch(function () {});
  };
  K.shareCard = function (o) {
    o = o && o.kind ? o : topGoal(); var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    return new Promise(function (res) { var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); }; img.src = o ? (o.kind === 'climb' && o.atTop ? ART + 'summit.webp' : o.big || ART + 'range.webp') : ART + 'range.webp'; })
      .then(function (img) {
        x.fillStyle = '#0B0C10'; x.fillRect(0, 0, W, H);
        if (img) { var s = Math.max(W / img.width, 1000 / img.height); x.globalAlpha = .9; x.drawImage(img, (W - img.width * s) / 2, 0, img.width * s, img.height * s); x.globalAlpha = 1; }
        var gr = x.createLinearGradient(0, 560, 0, 1000); gr.addColorStop(0, 'rgba(11,12,16,0)'); gr.addColorStop(1, '#0B0C10'); x.fillStyle = gr; x.fillRect(0, 560, W, 790);
        var F = '-apple-system, "SF Pro Display", system-ui, sans-serif'; x.textAlign = 'left';
        x.fillStyle = '#F2CF5B'; x.font = '800 36px ' + F; x.fillText('K A I Z E N', 72, 110);
        if (o) {
          var eb = o.kind === 'climb' ? (o.atTop ? 'DAY 66 · ' + num(TOPFT) + ' FT' : 'DAY ' + (o.run ? o.day : o.within) + ' OF 66') : o.kind === 'storm' ? 'QUITTING' : 'EXPEDITION';
          var big = o.kind === 'climb' ? (o.atTop ? 'I made it.' : o.ft) : o.kind === 'storm' ? plural(o.clean, 'clean day') : o.steps + ' of ' + o.stepsT + ' steps';
          x.fillStyle = '#D2D4DA'; x.font = '700 38px ' + F; x.fillText(eb, 72, 1030);
          x.fillStyle = '#FFFFFF'; x.font = '900 120px ' + F; x.fillText(big, 66, 1150);
          x.fillStyle = '#A9ACB5'; x.font = '600 40px ' + F; x.fillText(String(o.name).slice(0, 34), 72, 1215);
          if (o.kind !== 'exped' && !o.atTop) { x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(72, 1250, W - 144, 10); x.fillStyle = '#FF6A1A'; x.fillRect(72, 1250, (W - 144) * o.frac, 10); }
        }
        x.fillStyle = '#F2CF5B'; x.font = '700 32px ' + F; x.textAlign = 'right'; x.fillText('kaizengrow.app', W - 72, 110);
        return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
      });
  };

  // ---------- run ----------
  var q = 0;
  // ---------- Growth: press, hold and move a mountain (the row of tiles, and the Climbing now list; one order for both) ----------
  (function () {
    var HOLD = 350, SLOP = 8, timer = 0, start = null, blockClick = 0, SEL = '#kzmx-g .kzmx-tile, #kzmx-g .kzmx-now > .kzmx-row';
    function items(box, cls) { return [].slice.call(box.children).filter(function (t) { return t.classList.contains(cls); }); }
    function idOf(t) { var m = /[?&]id=([^&#]+)/.exec(t.getAttribute('href') || ''); return m ? decodeURIComponent(m[1]) : ''; }
    function pos(e) { var t = e.touches ? (e.touches[0] || e.changedTouches[0]) : e; return { x: t.clientX, y: t.clientY }; }
    function A(r, y) { return y ? r.top : r.left; }
    function S(r, y) { return y ? r.height : r.width; }
    function begin(it, p) {
      var y = it.classList.contains('kzmx-row'), box = it.parentNode;
      drag = { tile: it, car: box, y: y, cls: y ? 'kzmx-row' : 'kzmx-tile', v: y ? '--dy' : '--dx', p0: y ? p.y : p.x, last: y ? p.y : p.x, raf: 0, a0: A(it.getBoundingClientRect(), y) };
      it.classList.add('kzmx-lift'); box.classList.add('kzmx-dragging');
      try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'haptic', n: 1 }); } catch (e) {}
      tick();
    }
    function slot(d) {   // move the item in the DOM when the finger passes a neighbour's middle; FLIP the others
      var list = items(d.car, d.cls), i = list.indexOf(d.tile), before = {}, y = d.y, f = d.last;
      list.forEach(function (t) { if (t !== d.tile) before[idOf(t)] = A(t.getBoundingClientRect(), y); });
      var moved = false;
      if (i < list.length - 1) { var n = list[i + 1].getBoundingClientRect(); if (f > A(n, y) + S(n, y) / 2) { d.car.insertBefore(list[i + 1], d.tile); moved = true; } }
      if (!moved && i > 0) { var p2 = list[i - 1].getBoundingClientRect(); if (f < A(p2, y) + S(p2, y) / 2) { d.car.insertBefore(d.tile, list[i - 1]); moved = true; } }
      if (!moved) return false;
      items(d.car, d.cls).forEach(function (t) {
        if (t === d.tile || before[idOf(t)] == null) return; var dd = before[idOf(t)] - A(t.getBoundingClientRect(), y); if (!dd) return;
        t.style.transition = 'none'; t.style.transform = (y ? 'translateY(' : 'translateX(') + dd + 'px)'; void t.offsetWidth;
        t.style.transition = calm ? 'none' : 'transform .22s cubic-bezier(.2,.8,.2,1)'; t.style.transform = '';
      });
      try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'tick' }); } catch (e) {}
      return true;
    }
    function place(d) {
      var r = d.tile.getBoundingClientRect(), cur = parseFloat(d.tile.style.getPropertyValue(d.v)) || 0, home = A(r, d.y) - cur, want = d.a0 + d.last - d.p0;
      if (d.y) { var b = d.car.getBoundingClientRect(), h = r.height / 1.02; want = Math.max(b.top, Math.min(b.bottom - h, want)); }   // the row never leaves its list
      d.tile.style.setProperty(d.v, (want - home).toFixed(1) + 'px');
    }
    function tick() {   // follow the finger; near an edge, scroll the row (tiles) or the page (list)
      if (!drag) return; var d = drag, edge = d.y ? 80 : 44, v = 0, lo, hi;
      if (d.y) { lo = 0; hi = window.innerHeight - 84; } else { var r = d.car.getBoundingClientRect(); lo = r.left; hi = r.right; }   // 84: the tab bar
      if (d.last < lo + edge) v = -Math.ceil((lo + edge - d.last) / 5); else if (d.last > hi - edge) v = Math.ceil((d.last - (hi - edge)) / 5);
      if (d.y && v) { var lb = d.car.getBoundingClientRect(); if ((v > 0 && lb.bottom <= hi) || (v < 0 && lb.top >= lo + 60)) v = 0; }   // only scroll while the list runs past the screen
      if (v) { if (d.y) window.scrollBy(0, v); else d.car.scrollLeft += v; }
      place(d); if (slot(d)) place(d);
      d.raf = requestAnimationFrame(tick);
    }
    function save(d) {
      var ids = items(d.car, d.cls).map(idOf).filter(Boolean);
      if (d.y) {   // fold the new Climbing now order into the full order, keeping the earned mountains where they were
        var car = document.querySelector('#kzmx-g .kzmx-car'), full = car ? items(car, 'kzmx-tile').map(idOf).filter(Boolean) : ids.slice(), set = {}, k = 0;
        ids.forEach(function (id) { set[id] = 1; });
        ids.forEach(function (id) { if (full.indexOf(id) < 0) full.push(id); });
        ids = full.map(function (id) { return set[id] ? ids[k++] : id; });
      }
      try { K.set('mtnorder', ids); } catch (e) {}
    }
    function end(ok) {
      clearTimeout(timer); timer = 0; start = null; if (!drag) return;
      var d = drag; cancelAnimationFrame(d.raf); drag = null;
      d.tile.classList.remove('kzmx-lift'); d.car.classList.remove('kzmx-dragging');
      d.tile.style.transition = calm ? 'none' : 'transform .2s cubic-bezier(.2,.8,.2,1)'; d.tile.style.setProperty(d.v, '0px');
      setTimeout(function () { d.tile.style.transition = ''; }, 260);
      blockClick = Date.now() + 500;
      if (ok) {
        save(d);
        try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'haptic', n: 2 }); } catch (e) {}
        var car = document.querySelector('#kzmx-g .kzmx-car'); if (car) carX = car.scrollLeft; lastG = ''; lastScene = ''; setTimeout(soon, 280);
      }
    }
    function down(e) {
      var it = e.target.closest && e.target.closest(SEL); if (!it || (e.touches && e.touches.length > 1)) return;
      start = { tile: it, p: pos(e) }; clearTimeout(timer);
      timer = setTimeout(function () { if (start) begin(start.tile, start.p); }, HOLD);
    }
    function move(e) {
      var p = pos(e);
      if (drag) { e.preventDefault(); drag.last = drag.y ? p.y : p.x; return; }
      if (start && (Math.abs(p.x - start.p.x) > SLOP || Math.abs(p.y - start.p.y) > SLOP)) { clearTimeout(timer); timer = 0; start = null; }   // a swipe or a scroll, not a hold
    }
    document.addEventListener('touchstart', down, { passive: true });
    document.addEventListener('touchmove', move, { passive: false, capture: true });
    document.addEventListener('touchend', function () { end(true); }, { passive: true, capture: true });
    document.addEventListener('touchcancel', function () { end(false); }, { passive: true });
    document.addEventListener('mousedown', function (e) { if (e.button === 0) down(e); });
    document.addEventListener('mousemove', function (e) { if (start || drag) move(e); }, true);
    document.addEventListener('mouseup', function () { end(true); }, true);
    document.addEventListener('click', function (e) { if (Date.now() < blockClick && e.target.closest && e.target.closest(SEL)) { e.preventDefault(); e.stopPropagation(); } }, true);
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest(SEL)) e.preventDefault(); }, true);
    document.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest(SEL)) e.preventDefault(); }, true);   // a link drag would swallow the moves
  })();

  // every goal row: the checkpoint count replaces the old growth stages
  function stageLine(o) {
    if (o.kind === 'exped') return o.earned ? 'Every step done' : 'Step ' + Math.min(o.steps + 1, o.stepsT) + ' of ' + o.stepsT;
    if (o.kind !== 'climb') return null;
    var d = o.run ? o.day : o.within;
    if (o.atTop || o.cp >= TOP) return o.atTop ? 'Habit earned' : 'Day ' + d + ' · the top in ' + plural(o.topIn, 'day');
    return 'Day ' + d + ' · ' + (o.run ? 'shield' : 'checkpoint') + ' in ' + plural(o.cpIn, 'day');
  }
  function setT(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  function stages() {
    [].forEach.call(document.querySelectorAll('.kz-goal[data-goal]'), function (row) {
      var o = K.mtn(row.getAttribute('data-goal')); if (!o || o.kind === 'storm') return;
      var line = stageLine(o); if (line) setT(row.querySelector('.kz-gstage'), line);
      var gp = row.querySelector('.kzgp'); if (!gp || o.kind !== 'climb') return;
      var k = 0; CPS.forEach(function (c) { if (o.within >= c) k++; });
      var prev = k ? CPS[k - 1] : 0, next = k < CPS.length ? CPS[k] : TOP, frac = Math.max(0, Math.min(1, (o.within - prev) / ((next - prev) || 1)));
      setT(gp.querySelector('.kzgp-txt b'), o.atTop ? 'At the top' : k ? 'Checkpoint ' + k + ' of 4' : 'At the base');
      setT(gp.querySelector('.kzgp-txt em'), o.atTop ? 'Habit earned' : k < CPS.length ? 'Next checkpoint in ' + plural(next - o.within, 'day') + (o.run ? ' · earns a shield' : '') : 'The top in ' + plural(o.topIn, 'day'));
      var bi = gp.querySelector('.kzgp-bar > i'), w = (frac * 100).toFixed(1) + '%'; if (bi && bi.style.width !== w) bi.style.width = w;
      var a = gp.querySelector('img.now'), b = gp.querySelector('img.next');
      if (a && a.alt !== 'Where you are') a.alt = 'Where you are'; if (b && b.alt !== 'The next checkpoint') b.alt = 'The next checkpoint';
    });
  }
  function run() { [card, growth, scene, stages, retireArt, summitCheck].forEach(function (f) { try { f(); } catch (e) { if (window.console) console.warn('kzmtn', f.name, e); } }); }
  function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; run(); }); }
  K.mtnRefresh = function () { lastG = ''; lastScene = ''; soon(); };
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('#kzmx-g, #kzmx-scene, .kzmx-sum')) continue; soon(); return; }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-n', 'src'] });
  window.addEventListener('storage', soon); window.addEventListener('pageshow', function () { K.mtnRefresh(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) K.mtnRefresh(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzword-1101.js ==== */
;try {
/* Nov 1 · Mountains, stage 2: the words. The tree words lived in ~25 older files (several of them hashed bundles that
   can't be edited in place), in screens, sheets, toasts, VoiceOver labels and alt text. This layer rewrites them as they
   appear, before the frame is painted (MutationObserver callbacks run before rendering), so nothing flickers.
   Rules are whole phrases, never single words inside sentences, so a goal or journal entry someone wrote ("Plant a tree",
   "Water the garden") is never touched: inputs, text areas and editable text are skipped, and the bare stage words
   ("Sapling", "Tree") only change when they are the whole label. Numbers follow kzmtn-1101b: 131 ft per check-off. */
(function () {
  var K = window.KZ; if (!K || K.__kzword) return; K.__kzword = 1;
  function pl(n, w) { n = +n; return n + ' ' + w + (n === 1 ? '' : 's'); }
  // stages sat on days 7 / 14 / 30 / 45, the same days as the checkpoints
  var STAGE = { 'Planted': 'At the base', 'Just planted': 'At the base', 'Sprout': 'On the way up', 'Seedling': 'Checkpoint 1', 'Sapling': 'Checkpoint 2',
    'Young tree': 'Checkpoint 3', 'Tree': 'Checkpoint 4', 'Full tree': 'At the top', 'Habit earned': 'Habit earned', 'Mature tree': 'At the top', 'Strong tree': 'At the top',
    'Great tree': 'At the top', 'Ancient tree': 'At the top', 'Elder tree': 'At the top', 'Mighty tree': 'At the top', 'World tree': 'At the top', 'Growing': 'Climbing' };
  var SNAMES = 'Planted|Sprout|Seedling|Sapling|Young tree|Tree|Full tree|Mature tree|Strong tree|Great tree|Ancient tree';
  function stage(s) { var k = s.charAt(0).toUpperCase() + s.slice(1); return STAGE[k] || s; }
  var R = [
    [/^(Tree|Grove|Your trees|Your grove) · Kaizen$/, 'Growth · Kaizen'],
    // numbers first
    [/(\d+) of 66 days grown/g, '$1 of 66 days'],
    [/(\d+) days? grown of 66/g, '$1 of 66 days'],
    [/^days grown of 66$/, 'of 66 days'],
    [/(\d+) days your tree grew/g, function (m, n) { return pl(n, 'day') + ' climbed'; }],
    [/\+\s?1 day grown/g, '+131 ft'],
    [/(\d+) days? grown/g, function (m, n) { return pl(n, 'day') + ' climbed'; }],
    [/^days? grown$/, 'days climbed'], [/^day grown$/, 'day climbed'],
    [new RegExp('\\b(' + SNAMES + ') in (\\d+) days?', 'gi'), function (m, s, n) { return stage(s) + ' in ' + pl(n, 'day'); }],
    [new RegExp('^(' + SNAMES + ') · ', 'i'), function (m, s) { return stage(s) + ' · '; }],
    [new RegExp(' · (' + SNAMES + ')$'), function (m, s) { return ' · ' + stage(s); }],
    [new RegExp('([,:]) (' + SNAMES + ')(,|$)', 'gi'), function (m, p, s, e) { return p + ' ' + stage(s).toLowerCase() + e; }],
    [new RegExp('^(' + SNAMES + '|Elder tree|Mighty tree|World tree)\\.$'), 'At the top.'],
    [/ is fully grown\./g, ' made it to the top.'], [/, fully grown/g, ', at the top'],
    [/every branch got a step/g, 'every area got a step'],
    [/(\S)['’]s tree\b/g, '$1’s mountain'],
    [/Replanting as a different tree stresses it\. It will lose 2% of its height\./, ''],
    [/Your tree and its animals will use it\./, 'Kaizen will use it to greet you.'],
    [/(\d+) of (\d+) trees watered/g, '$1 of $2 goals checked off'],
    [/Trees watered today/g, 'Goals checked off today'],
    [/(\d+) of (\d+) branches growing/g, '$1 of $2 areas moving'],
    [/^(\d+) of (\d+) growing$/, '$1 of $2 areas moving'],
    [/ is your only branch growing/g, ' is the only area moving'],
    // whole sentences
    [/So 66 is the usual, not a promise\. Missing one day didn['’]t undo anyone['’]s progress, which is why your tree never shrinks\. It just waits for you\./,
      'So 66 is the usual, not a promise. Missing one day didn’t undo anyone’s progress, which is why you never slide back down. Your climb just waits for you.'],
    [/Its tree wears a gold badge in your Grove for good\./, 'It stays gold on your Growth tab for good.'],
    [/Every goal you add plants a tree\. Check it off and it grows\. At 66 days, the habit is yours\./, 'Every goal is its own mountain. Each check-off climbs 131 ft. Day 66 is the top, and the habit is yours.'],
    [/Each check-off grows that goal['’]s tree\. Day 66 earns the habit\./, 'Each check-off climbs 131 ft. Day 66 is the top.'],
    [/The tree grows when you do\./, 'Every check-off climbs your mountain.'],
    [/Check it off and your tree gets its first water\./, 'Check it off and you climb your first 131 ft.'],
    [/Your trees keep every day they['’]ve grown\./, 'Your mountains keep every foot you’ve climbed.'],
    [/Archiv(e|ing) keeps every step and leaf\./, 'Archiv$1 keeps every check-off.'],
    [/Its steps and leaves are erased\./, 'Its check-offs are erased.'],
    [/your streak and your tree stay safe/g, 'your streak stays safe'],
    [/Every goal you finish grows your tree\. Pick where it starts\./, 'Every goal is its own mountain. Day 66 is the top.'],
    [/^[A-Z][A-Za-z ]+\. After 66 it keeps growing\. A missed day only pauses it; it never shrinks\.$/, 'After day 66 you can keep climbing. A missed day costs nothing; you never slide back.'],
    [/Tap to pick 2 to 8\. Each one grows its own branch on your tree\./, 'Tap to pick 2 to 8 areas to work on.'],
    [/What do you want to grow in\?/, 'What do you want to get better at?'],
    [/Which branch does it grow\?/, 'Which area is it for?'],
    [/What each branch has grown/, 'Progress in each area'],
    [/Check off goals and your branches grow/, 'Check off goals and each area moves'],
    [/Your branches grew evenly in the last two weeks/, 'Every area moved in the last two weeks'],
    [/Add a goal to a branch and it starts to orbit/, 'Add a goal to an area and it starts to orbit'],
    [/Add a second branch to see balance/, 'Add a second area to see balance'],
    [/Every branch starts empty\. Add one small goal to begin\./, 'Every area starts empty. Add one small goal to begin.'],
    [/Tap a branch to rename, recolor or delete/, 'Tap an area to rename, recolor or delete'],
    [/^Edit branches$/, 'Edit areas'], [/^Done editing branches$/, 'Done editing areas'], [/^Delete branch$/, 'Delete area'], [/^Delete this branch\?$/, 'Delete this area?'],
    [/^Branches$/, 'Areas'], [/^Branch$/, 'Area'], [/^Branch name$/, 'Area name'], [/^New branch name$/, 'New area name'], [/^Grow a new branch$/, 'Add a new area'],
    [/Reset to the 5 starter branches/, 'Reset to the 5 starter areas'], [/That['’]s the most branches there can be/, 'That’s the most areas there can be'],
    [/You['’]re growing in all (\d+) areas\./, 'You’re making progress in all $1 areas.'],
    [/Save your tree, your animals and every journal entry\./, 'Save your goals, your progress and every journal entry.'],
    [/Sign up to save your tree/, 'Sign up to save your progress'],
    [/Your goals and tree are already in it\./, 'Your goals and progress are already in it.'],
    [/journal, tree and reminders/, 'journal and reminders'],
    [/Your tree grows again tomorrow\./, 'You climb again tomorrow.'],
    [/Your tree is thriving\./, 'You’re climbing well.'],
    [/Your tree remembers every one of them\./, 'Every one of them counts.'],
    [/One year\. Your tree is ancient now\./, 'One year. That’s a whole range of mountains.'],
    [/XP unlocks new trees and wildlife\./, 'XP shows how far you’ve come.'],
    [/Your tree now grows with your days, not your goal count\. A fully completed day adds 1 inch\./, ''],
    [/Something just sprouted\./, 'Your first step is done.'],
    // labels
    [/^\+?\s?Plant a new goal$/, function (m) { return (m.charAt(0) === '+' ? '+ ' : '') + 'Start a new goal'; }], [/^Plant a goal$/, 'Start a goal'], [/^Plant it now$/, 'Start it now'], [/^Plant it$/, 'Start it'],
    [/^A new tree$/, 'A new mountain'], [/^New tree$/, 'New mountain'],
    [/^Your grove: /, 'Your mountains: '], [/^Grove$/, 'Growth'], [/^(Your trees|Your grove)$/, 'Your mountains'], [/^(Your|My) tree$/, 'Your mountain'], [/^your tree$/, 'your mountain'],
    [/^Open your tree$/, 'Open your mountain'], [/^This goal['’]s tree$/, 'This goal’s mountain'], [/^Change tree$/, 'Change photo'], [/^Edit tree$/, 'Edit'],
    [/^Kaizen, Tree$/, 'Kaizen, Growth'], [/^Tree type$/, 'Photo'], [/^Name your tree$/, 'Your name'],
    [/ watered today/g, ' checked off today'], [/^Watered$/, 'Checked off'],
    [/^Your tree grew$/, 'Days you climbed'],
    [/^Your tree at the end of /, 'Your progress at the end of '],
    [/^(\d+) trees?$/, ''],
    [new RegExp('^(' + SNAMES + '|Just planted|Growing|Elder tree|Mighty tree|World tree)$'), function (m) { return STAGE[m] || m; }]
  ];
  var BARE = /^(Planted|Sprout|Seedling|Sapling|Young tree|Tree|Full tree|Mature tree|Strong tree|Great tree|Ancient tree|Just planted|Growing)$/;
  var TEST = /tree|grove|grown|grew|sapling|seedling|sprout|plant|leaf|leaves|branch|water|growing|grow in|ancient/i;
  function fix(s, el) {
    if (!s || !TEST.test(s)) return s;
    var t = s.trim(); if (!t) return s;
    // bare stage words only when they are a whole label, never in a name/title someone typed
    if (BARE.test(t) && el && el.closest && el.closest('b, strong, h1, h2, h3, .kz-g1name, [contenteditable], input, textarea, .kz-gname, .kz-name')) return s;
    var o = t; for (var i = 0; i < R.length; i++) { if (R[i][0].global) R[i][0].lastIndex = 0; if (R[i][0].test(o)) { if (R[i][0].global) R[i][0].lastIndex = 0; o = o.replace(R[i][0], R[i][1]); } }
    return o === t ? s : s.replace(t, o);
  }
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/;
  function userText(el) { return !el || SKIP.test(el.tagName) || (el.closest && el.closest('[contenteditable=""], [contenteditable="true"], .kz-jtext, .kz-note-body, .kz-todo-txt')); }
  function textNode(n) { var p = n.parentElement; if (userText(p)) return; var v = n.nodeValue, f = fix(v, p); if (f !== v) n.nodeValue = f; }
  var ATTR = ['aria-label', 'alt', 'title', 'placeholder', 'data-n'];
  function attrs(el) {
    if (!el.getAttribute || userText(el) && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    for (var i = 0; i < ATTR.length; i++) { var v = el.getAttribute(ATTR[i]); if (v) { var f = fix(v, null); if (f !== v) el.setAttribute(ATTR[i], f); } }
  }
  function walk(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 || SKIP.test(root.tagName) && root.tagName !== 'INPUT' && root.tagName !== 'TEXTAREA') { if (root.nodeType === 1) attrs(root); return; }
    attrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) textNode(n);
    var els = root.querySelectorAll('[aria-label], [alt], [title], [placeholder], [data-n]'); for (var i = 0; i < els.length; i++) attrs(els[i]);
  }
  K.mtnWords = fix;
  // weekly recap: the "Your tree grew" cell measured tree inches; it has no meaning on a mountain, so it goes
  function recap() { var g = document.querySelector('#kz-p3-rc .kz-p3-grid'); if (!g) return; [].forEach.call(g.children, function (c) { if (/Days you climbed|Your tree grew/.test(c.textContent)) c.remove(); }); }
  function title() { var t = document.title, f = fix(t, null); if (f !== t) document.title = f; }
  var busy = false;
  var mo = new MutationObserver(function (ms) {
    if (busy) return; busy = true;
    try {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'childList') for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
        else if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') attrs(m.target);
      }
      recap(); title();
    } finally { mo.takeRecords(); busy = false; }
  });
  function start() { walk(document.body); title(); mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzgm-1102.js ==== */
;try {
/* Nov 2 · goal menu mockup B "Action tiles" (James): the goal's name on top, View / Edit / Kaizen 66 as three tiles, Move up and
   Move down side by side, Delete as red text. Same buttons and actions; only labels get shorter (full names stay for VoiceOver). */
(function () {
  if (window.__kzgm1102) return; window.__kzgm1102 = 1;
  var SHORT = { 'View goal': 'View', 'Make this my Kaizen 66': 'Kaizen 66' };
  function dress(m) {
    if (m.__kzgm) return; m.__kzgm = 1; m.classList.add('kzgm');
    var nm = (m.getAttribute('aria-label') || '').replace(/^Actions for\s+/, '');
    if (nm && !m.querySelector('.kzgm-hd')) { var h = document.createElement('div'); h.className = 'kzgm-hd'; h.textContent = nm; var g = m.querySelector('.kzs-grab'); m.insertBefore(h, g ? g.nextSibling : m.firstChild); }
    [].forEach.call(m.querySelectorAll('.kzm-it > span'), function (s) { var t = s.textContent.trim(); if (SHORT[t]) { s.parentNode.setAttribute('aria-label', t); s.textContent = SHORT[t]; } });
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kzm.kzs'), function (m) { if (m.querySelector('[data-k="view"]') && m.querySelector('[data-k="del"]')) dress(m); }); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && (n.matches('.kzm') || n.querySelector('.kzm'))) { soon(); return; } } } })
    .observe(document.body, { childList: true, subtree: true });
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzntc-1102.js ==== */
;try {
/* Nov 2 · Note to self, mockup C "Writing first" (James): the page is for writing; under it three small buttons: an Apple-style mic
   (dictate), Area (shows the area picked; tap to pick) and the reminder (shows the time; tap to set). The same chips and reminder
   controls open under the buttons, so nothing is lost. */
(function () {
  if (window.__kzntc1102) return; window.__kzntc1102 = 1;
  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.6" y="2.4" width="6.8" height="12" rx="3.4" fill="currentColor"/><path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 17.8v3.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';
  var BELL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  function label(body) {
    var on = body.querySelector('.kznt-chip.on'), ar = body.querySelector('.kzntc-area');
    if (ar) { var c = on && on.getAttribute('data-nt-path') ? (on.style.getPropertyValue('--c') || '#8E8E93') : ''; var t = on && on.getAttribute('data-nt-path') ? on.textContent.trim() : 'Area';
      var h = '<i style="background:' + (c || '#5A5A5E') + '"></i>' + t; if (ar.__h !== h) { ar.innerHTML = h; ar.__h = h; } ar.classList.toggle('kzntc-set', !!c); }
    var rp = body.querySelector('.kznrp'), rb = body.querySelector('.kzntc-rem');
    if (rp && rb) { var tx = rp.textContent || '', tm = /\b\d{1,2}:\d{2}\s?[AP]M\b/i.exec(tx), rep = rp.querySelector('[aria-pressed="true"], .on'), ti = rp.querySelector('input[type="time"]');
      if (!tm && ti && ti.value) { var hm = ti.value.split(':'), hh = +hm[0]; tm = [((hh % 12) || 12) + ':' + hm[1] + (hh < 12 ? ' AM' : ' PM')]; }
      var nT = rp.querySelectorAll('input[type="time"]').length;
      var s = tm ? tm[0] + (rep && rep.textContent.trim().length < 16 ? ' · ' + rep.textContent.trim() : '') + (nT > 1 ? ' +' + (nT - 1) : '') : 'Remind me';
      if (rb.__s !== s) { rb.innerHTML = BELL + '<span>' + s + '</span>'; rb.__s = s; } rb.classList.toggle('kzntc-set', !!tm); }
    var mic = body.querySelector('.kznt-mic .kz-mic'), mb = body.querySelector('.kzntc-mic');
    if (mic && mb) mb.setAttribute('aria-pressed', mic.getAttribute('aria-pressed') || 'false');
  }
  function dress(body) {
    if (body.__kzntc) { label(body); return; } body.__kzntc = 1; body.classList.add('kzntc');
    var ta = body.querySelector('.kznt-txt'); if (!ta) return;
    var bar = document.createElement('div'); bar.className = 'kzntc-bar';
    bar.innerHTML = '<button type="button" class="kzntc-mic" aria-label="Dictate" aria-pressed="false">' + MIC + '</button><button type="button" class="kzntc-area" aria-label="Area" aria-expanded="false"></button><button type="button" class="kzntc-rem" aria-label="Reminder" aria-expanded="false"></button>';
    ta.parentNode.insertBefore(bar, ta.nextSibling);
    body.addEventListener('change', function () { label(body); }); body.addEventListener('input', function (e) { if (e.target.type === 'time') label(body); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('kzntc-mic')) { var m = body.querySelector('.kznt-mic .kz-mic'); if (m) m.click(); setTimeout(function () { label(body); }, 60); return; }
      if (b.classList.contains('kzntc-area')) { var o = !body.classList.contains('kzntc-oa'); body.classList.toggle('kzntc-oa', o); body.classList.remove('kzntc-or'); b.setAttribute('aria-expanded', String(o)); return; }
      if (b.classList.contains('kzntc-rem')) { var r = !body.classList.contains('kzntc-or'); body.classList.toggle('kzntc-or', r); body.classList.remove('kzntc-oa');
        b.setAttribute('aria-expanded', String(r)); var rp = body.querySelector('.kznrp'); if (r && rp && !/\d:\d\d/.test(rp.textContent)) { var add = rp.querySelector('[data-nrp-add]'); if (add) add.click(); } setTimeout(function () { label(body); }, 60); }
    });
    label(body);
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kznt-sheet .kznt-body'), dress); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzntc-bar')) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class'] });
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzhdr-1102.js ==== */
;try {
/* Nov 2 · header C: the date reads "MON · NOV 2" (styled orange in kzhdr-1102.css) */
(function () {
  if (window.__kzhdr1102) return; window.__kzhdr1102 = 1;
  function run() { q = 0; var el = document.querySelector('.kz-hbar [data-kz-hdate]'); if (!el) return; var d = new Date();
    try { if (window.KZ && KZ.today) d = KZ.today(); } catch (e) {}
    var t = d.toLocaleDateString(undefined, { weekday: 'short' }) + ' · ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (el.textContent !== t) el.textContent = t; }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzab-1102.js ==== */
;try {
/* Nov 3 · Add sheet (James): Long-term, Daily habit and Quit use mockup B "Big question + settings list" (the question is the big
   field, suggestions under it, then each option as one row); To-do uses mockup A "Plain form". Every option is kept. This file only
   adds the Area row (shows the area picked; tap to open the chips) and keeps its value up to date. Styles: kzab-1102.css */
(function () {
  if (window.__kzab1102) return; window.__kzab1102 = 1;
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kz-addsheet'), function (sh) {
      sh.classList.add('kzab');
      // option fields become rows only when this kind of goal shows them (each kind hides the others' fields)
      [].forEach.call(sh.querySelectorAll('#kz-add-more > label.kz-field49:not(.kz-steprow), .kzq-box > label.kz-field49, .kzbd-in > label.kz-field49'), function (l) {
        l.setAttribute('data-kzab', ''); var had = l.classList.contains('kzab-r'); if (had) l.classList.remove('kzab-r');
        var vis = !l.hidden && l.getClientRects().length > 0; if (vis) l.classList.add('kzab-r');
      });
      var area = [].filter.call(sh.querySelectorAll('.kz-field49'), function (f) { return f.querySelector(':scope > .kz-chips49 [data-p]'); })[0];
      if (!area) return; area.classList.add('kzab-area');
      var h = area.querySelector(':scope > .kzab-ah');
      if (!h) { h = document.createElement('button'); h.type = 'button'; h.className = 'kzab-ah'; h.setAttribute('aria-expanded', 'false');
        h.addEventListener('click', function () { var o = !area.classList.contains('kzab-open'); area.classList.toggle('kzab-open', o); h.setAttribute('aria-expanded', String(o)); });
        area.insertBefore(h, area.firstChild); }
      var on = area.querySelector('[data-p][aria-pressed="true"], [data-p].on, [data-p][aria-checked="true"]'), nm = on ? on.textContent.trim() : 'None';
      var c = on ? getComputedStyle(on).getPropertyValue('--c') || getComputedStyle(on).getPropertyValue('--pc') : '';
      var html = '<span>Area</span><em>' + (on ? '<i style="background:' + (c.trim() || '#8E8E93') + '"></i>' : '') + nm + '</em>';
      if (h.__h !== html) { h.innerHTML = html; h.__h = html; }
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzab-ah')) continue; if (ms[i].type === 'attributes' && t.hasAttribute && t.hasAttribute('data-kzab')) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'hidden'] });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.kzab-area [data-p]')) setTimeout(function () { var a = e.target.closest('.kzab-area'); if (a) { a.classList.remove('kzab-open'); } soon(); }, 120); }, true);
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzinput-1104.js ==== */
;try {
/* Nov 4: the add sheet's title follows the To-do tab ("New to-do"); it kept the previous tab's title. The to-do hint drops "e.g." to match Quit's */
(function () {
  function fix(s) { if (!s.classList.contains('kzk-todo')) return; var h = s.querySelector('h2.kz-t49'); if (h && h.textContent !== 'New to-do') h.textContent = 'New to-do';
    var i = s.querySelector('input.kzta-in'); if (i && /^e\.g\. /.test(i.placeholder)) i.placeholder = i.placeholder.replace(/^e\.g\. /, ''); }
  function watch(s) { if (s.__kzin) return; s.__kzin = 1; fix(s); new MutationObserver(function () { fix(s); }).observe(s, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true, characterData: true }); }
  function scan() { [].forEach.call(document.querySelectorAll('.kz-addsheet'), watch); }
  scan(); new MutationObserver(scan).observe(document.body, { childList: true });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzgm-1104.js ==== */
;try {
/* Nov 4 (James: "Delete is where the back would be"): in the goal menu, Delete moves up to the header, across from the
   goal's name, away from where a thumb lands to swipe the sheet away. It still asks twice, and the second tap only
   counts 0.6 s after the first, so a double tap can't delete a goal. */
(function () {
  if (window.__kzgm1104) return; window.__kzgm1104 = 1;
  function lift(m) {
    if (m.__kzgm4) return; var hd = m.querySelector('.kzgm-hd'), del = m.querySelector('.kzm-it[data-k="del"]'); if (!hd || !del) return;
    m.__kzgm4 = 1; m.classList.add('kzgm4');
    // keep the header where it is (the tile layout keys off it), just put the name in a span and Delete beside it
    if (!hd.querySelector('.kzgm4-nm')) { var nm = document.createElement('span'); nm.className = 'kzgm4-nm'; nm.textContent = hd.textContent; hd.textContent = ''; hd.appendChild(nm); }
    var grp = del.parentNode; hd.appendChild(del); del.classList.add('kzgm4-del');
    if (grp && grp !== m && !grp.querySelector('.kzm-it')) grp.classList.add('kzgm4-empty');
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kzm.kzgm'), lift); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  soon();
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzm-it[data-k="del"]'); if (!b) return;
    if (!b.classList.contains('sure')) { b.__kzSureAt = Date.now(); return; }
    if (Date.now() - (b.__kzSureAt || 0) < 600) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsb-1106.js ==== */
;try {
/* Nov 6 · copy of kzsb-1103c: the Milestones box on Progress also has the class .kzm, so opening the medals counted as an open
   sheet (tab bar hidden, page scroll locked: James got stuck). Milestones are now excluded. */
/* Nov 3 c · also tells the app to hide its own tab bar (the phone's bar is native, not this page's).
   Nov 3 b · also the add sheet (New to-do, Quit…), edit sheets and any open dialog (James's Quit screenshot).
   Nov 3 · James: the tab bar (Today / Plan / Growth / Progress / Me) sometimes showed on top of a sheet (timer, quick menu,
   goal menu) and the sheets left room for it at the bottom. While any sheet is open the bar now goes away (html.kzsb), and
   it comes back a moment after the sheet closes so it can't flash through the closing animation. Styles: kzsb-1103.css */
(function () {
  if (window.__kzsb1103) return; window.__kzsb1103 = 1;
  var de = document.documentElement, off = 0, q = 0;
  var KNOWN = '.kztm-pick.on, .kz-planmodal:not([hidden]), .kzm:not([hidden]):not(.kza .kzm):not(.kza > .kzm), .kzf-qs.on, .kzf-qs:not([hidden]) .kzf-qs-in, .kz-addsheet:not([hidden]), .kzo-sheet, [role=dialog]:not([hidden]), dialog[open]';
  function vis(x) {
    for (var e = x; e && e !== document.body; e = e.parentElement) { var c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; }
    return true;
  }
  function sheetOpen() {
    var vh = innerHeight, vw = innerWidth, k = document.querySelectorAll(KNOWN);
    for (var i = 0; i < k.length; i++) { var r = k[i].getBoundingClientRect(); if (r.height > 40 && vis(k[i])) return true; }
    var all = document.body.querySelectorAll('div, section, aside, dialog, form');
    for (var j = 0; j < all.length; j++) { var x = all[j];
      if (x.closest('.kz-tabbar')) continue;
      var r2 = x.getBoundingClientRect(); if (r2.width < vw * .9 || r2.height < vh * .22 || r2.top < vh * .12 || Math.abs(r2.bottom - vh) > 3) continue;
      var c = getComputedStyle(x); if (c.position !== 'fixed' && c.position !== 'absolute') continue;
      if ((parseInt(c.zIndex, 10) || 0) < 50) continue;
      if (vis(x)) return true; }
    return false;
  }
  // Nov 3 c · on the phone the tab bar is the app's own (native) bar: tell the app to hide it, the same message other sheets
  // send (pageScroll on:false hides the bar and holds the page still; on:true brings both back)
  var told = null;
  function post(open) { try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'pageScroll', on: !open }); } catch (e) {} }
  // James's phone still showed the bar over the timer, so while a sheet stays open the hide is repeated (harmless if it's hidden)
  var again = 0;
  function tell(open) { if (told === open) return; told = open; post(open); clearInterval(again); if (open) again = setInterval(function () { if (told === true && !document.hidden) post(true); }, 700); }
  function run() {
    q = 0; var o = sheetOpen();
    if (o) { clearTimeout(off); off = 0; if (!de.classList.contains('kzsb')) de.classList.add('kzsb'); tell(true); }
    else if (de.classList.contains('kzsb') && !off) off = setTimeout(function () { off = 0; if (!sheetOpen()) { de.classList.remove('kzsb'); tell(false); } }, 380);
  }
  function soon() { if (!q) { q = 1; requestAnimationFrame(run); } }
  function start() {
    run();
    new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) { var t = m[i].target; if (t === de) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style', 'open', 'aria-hidden'] });
    document.addEventListener('click', function () { soon(); setTimeout(soon, 120); setTimeout(soon, 400); }, true);
    addEventListener('resize', soon);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsheets-1106.js ==== */
;try {
/* Nov 6 · James picked sheet mockups: Journal C (write first), Timer B + Stopwatch C under one shared tab header,
   Goal options C (goal first). Restyles the existing sheets; every action still goes through the sheets' own buttons
   or the same saves (K.addNote, the 'journal' map) so nothing about what gets stored changes. Styles: kzsheets-1106.css */
(function () {
  var K = window.KZ; if (window.__kzsh6) return; window.__kzsh6 = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var clean = function (t) { return String(t || '').replace(/\s*NEXT\s*$/, '').trim(); };

  /* ---------- Timer B / Stopwatch C ---------- */
  var RING = '<div class="kzs6-ring" aria-hidden="true"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="104" fill="none" stroke="#2C2C2E" stroke-width="12"/>' +
    '<path d="M120 28v10M212 120h-10M120 212v-10M28 120h10" stroke="#48484A" stroke-width="2" stroke-linecap="round"/></svg><div><b>0:00</b><span>counts up</span></div></div>';
  function timer(ps) {
    var body = ps.querySelector('.kztm-body'), go = ps.querySelector('[data-kztm-go]'); if (!body || !go) return;
    if (!ps.querySelector('.kzs6-ring')) { var r = document.createElement('div'); r.className = 'kzs6-rw'; r.innerHTML = RING; body.insertBefore(r, body.firstChild); }
    var on = ps.classList.contains('kztmd-on'), d = ps.querySelector('.kztmd'), n = d ? parseInt(d.getAttribute('aria-valuenow'), 10) || 0 : 0;
    var lab = on ? (n > 0 ? 'Start ' + (n >= 60 && n % 60 === 0 ? (n / 60) + ' hr' : n + ' min') : 'Start') : 'Start';
    if (go.textContent !== lab) go.textContent = lab;
  }
  /* ---------- Journal C: write first ---------- */
  function journal(s) {
    var pane = s.querySelector('.kzf-qs-in'); if (!pane || pane.querySelector('.kzj6')) return;
    var x = pane.querySelector('[data-q="x"]'), qq = pane.querySelector('[data-q="q"]'), qa = pane.querySelector('[data-q="a"]');
    if (!x || !K || !K.addNote) return;
    var question = qa ? (qa.querySelector('span') || qa).textContent.trim() : '';
    var day = K.key ? K.key(K.today()) : new Date().toISOString().slice(0, 10);
    var ans = function () { var m = K.get('journal', {}) || {}; return m[day] || ''; };
    s.classList.add('kzj6-on');
    var w = document.createElement('div'); w.className = 'kzj6';
    w.innerHTML = '<div class="kzj6-top"><button type="button" data-j6="x">Cancel</button><span>Journal</span><button type="button" data-j6="save" disabled>Save</button></div>' +
      '<div class="kzj6-chips" role="tablist" aria-label="What to add">' +
      '<button type="button" role="tab" data-j6m="note" aria-selected="true">Note</button>' +
      (qa ? '<button type="button" role="tab" data-j6m="ask" aria-selected="false">Question</button>' : '') +
      (qq ? '<button type="button" data-j6m="quote">Quote</button>' : '') + '</div>' +
      '<p class="kzj6-q" hidden>' + esc(question) + '</p>' +
      '<label class="kzj6-sr" for="kzj6-ta">Journal entry</label><textarea id="kzj6-ta" class="kzj6-ta" rows="6" maxlength="2000" placeholder="What’s on your mind?"></textarea>' +
      '<p class="kzj6-msg" aria-live="polite">Saved to Journal → Notes. Private to you.</p>';
    pane.insertBefore(w, pane.firstChild);
    var ta = w.querySelector('textarea'), save = w.querySelector('[data-j6="save"]'), msg = w.querySelector('.kzj6-msg'), qp = w.querySelector('.kzj6-q'), mode = 'note';
    function setMode(m) {
      mode = m; [].forEach.call(w.querySelectorAll('[data-j6m]'), function (b) { if (b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', String(b.getAttribute('data-j6m') === m)); });
      qp.hidden = m !== 'ask'; ta.placeholder = m === 'ask' ? 'Anything on your mind.' : 'What’s on your mind?';
      if (m === 'ask') { ta.value = ans(); msg.textContent = ans() ? 'Saved. You can change it any time today.' : 'Saved to Journal → Reflections. Private to you.'; }
      else { if (ta.value === ans()) ta.value = ''; msg.textContent = 'Saved to Journal → Notes. Private to you.'; }
      upd();
    }
    function upd() { var v = ta.value.trim(); save.disabled = !v || (mode === 'ask' && v === ans()); }
    ta.addEventListener('input', upd);
    w.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      var m = b.getAttribute('data-j6m');
      if (m === 'quote') { qq.click(); return; }
      if (m) { setMode(m); return; }
      if (b.getAttribute('data-j6') === 'x') { x.click(); return; }
      if (b.getAttribute('data-j6') === 'save') {
        var v = ta.value.trim(); if (!v) return;
        try {
          if (mode === 'ask') { var mm = K.get('journal', {}) || {}; mm[day] = v; K.set('journal', mm); try { K.track('kz_reflection_saved', { length: v.length }); } catch (er) {} }
          else K.addNote(v);
          ['kz:changed', 'kz:notes'].forEach(function (n) { document.dispatchEvent(new CustomEvent(n)); });
          post({ type: 'dirty' }); post({ type: 'haptic', n: 2 });
          save.disabled = true; save.textContent = 'Saved'; msg.textContent = mode === 'ask' ? 'Saved to your journal.' : 'Saved to Journal → Notes.';
          setTimeout(function () { x.click(); }, 700);
        } catch (er) { msg.textContent = 'Couldn’t save. Try again.'; }
      }
    });
  }
  /* ---------- Goal options C: goal first ---------- */
  var ICON = { up: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>' };
  function goalInfo(name) {
    try { var gs = (K.allGoals ? K.allGoals() : K.goals ? K.goals() : []) || [], g = gs.filter(function (x) { return x && !x.archived && clean(x.title || x.name) === name; })[0]; if (!g) return '';
      var bits = []; if (g.due) { var dd = Math.round((new Date(g.due + 'T12:00') - new Date(K.key(K.today()) + 'T12:00')) / 864e5); if (!isNaN(dd)) bits.push(dd > 1 ? dd + ' days left' : dd === 1 ? 'Due tomorrow' : dd === 0 ? 'Due today' : 'Past due'); }
      var tk = K.key(K.today()), done = (K.get('done', {}) || {})[g.id]; bits.push(done && done[tk] ? 'Worked on today' : 'Not yet today'); return bits.join(' · ');
    } catch (e) { return ''; } }
  /* No nodes are moved (the menu's own code rebuilds its groups): the order and the layout are CSS (kzsheets-1106.css),
     here only labels and the info line. */
  function goal(m) {
    if (!m.querySelector('[data-k="view"]') || !m.querySelector('[data-k="del"]') || !m.classList.contains('kzgm')) return;
    if (!m.classList.contains('kzg6')) m.classList.add('kzg6');
    var nm = m.querySelector('.kzgm4-nm') || m.querySelector('.kzgm-hd');
    if (nm && !nm.querySelector('*')) { var c = clean(nm.textContent); if (nm.textContent !== c) nm.textContent = c;
      var info = goalInfo(c); if (nm.getAttribute('data-kzg6i') !== info) nm.setAttribute('data-kzg6i', info); }
    var al = m.getAttribute('aria-label') || '', al2 = 'Actions for ' + clean(al.replace(/^Actions for\s+/, '')); if (al !== al2) m.setAttribute('aria-label', al2);
    var v = m.querySelector('[data-k="view"] > span'); if (v && v.textContent !== 'View goal') v.textContent = 'View goal';
    var w = m.querySelector('[data-k="won"] > span'); if (w && w.textContent !== 'Achieved') w.textContent = 'Achieved';
    ['up', 'down'].forEach(function (k) { var b = m.querySelector('[data-k="' + k + '"]'), l = k === 'up' ? 'Move up' : 'Move down'; if (b && b.getAttribute('aria-label') !== l) b.setAttribute('aria-label', l); });
  }
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kztm-pick.on .kztm-ps'), timer);
    [].forEach.call(document.querySelectorAll('.kzf-qs'), journal);
    [].forEach.call(document.querySelectorAll('.kzm.kzs.kzgm'), goal);
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { requestAnimationFrame(run); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzj6, .kzs6-rw')) continue; soon(); return; } })
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-valuenow'] });
  document.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('.kztm-ps')) soon(); }, true);
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
