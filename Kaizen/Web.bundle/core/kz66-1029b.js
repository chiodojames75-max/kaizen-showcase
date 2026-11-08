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
  var LEN = 66, EARN = 7, MAXSH = 2;
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
    var k = r.start, since = 0, guard = 0;
    var earn = function () { since++; if (since === EARN) { since = 0; if (out.sh < MAXSH) out.sh++; } };
    while (k < t && guard++ < 5000) {
      if (done(r.goal, k)) { out.covered++; out.streak++; out.log[k] = 'c'; earn(); }
      else if (out.sh > 0) { out.sh--; out.used++; out.log[k] = 's'; }
      else { out.miss++; out.streak = 0; out.log[k] = 'm'; }
      if (out.streak > out.best) out.best = out.streak;
      if (out.covered >= LEN) { out.state = 'won'; out.end = k; return out; }
      k = plus(k, 1);
    }
    out.todayDone = done(r.goal, t);
    if (out.todayDone) { out.covered++; out.streak++; out.log[t] = 'c'; earn(); if (out.streak > out.best) out.best = out.streak; if (out.covered >= LEN) { out.state = 'won'; out.end = t; return out; } }
    out.day = out.todayDone ? out.covered : out.covered + 1;
    out.end66 = plus(t, LEN - out.covered - (out.todayDone ? 0 : 1));
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
      '<li><i class="s" aria-hidden="true"></i><span>Every 7 check-offs earn a shield (hold 2). A shield covers a missed day so your in-a-row streak keeps going.</span></li>' +
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
