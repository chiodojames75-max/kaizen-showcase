/* Nov 2 · "Just 5 min". James: "it's just to get you in the groove of starting the habit, or actually starting to work on your
   long-term goal for today. You could do 5 minutes and check it off, or do 5 minutes and keep going because you're in the groove."
   An optional starter, never a nag:
   - Daily habits (Kaizen 66 included): a small timer button beside the "…" on the row (and on the Kaizen 66 card), a "Just 5 min"
     button at the top of the unfolded row, and "Just 5 minutes" in the "…" menu. Hidden once the habit is checked off today.
   - Long-term goals (roadmap): a "5 min" pill beside "Worked on it today". Finishing logs the day worked (g.wk, the same list
     kzltwork-1030 keeps); it never completes a milestone, moves a date, changes progress or adds feet.
   - Quit goals: nothing (there's no 5 minutes of not doing something).
   It runs on the existing timer (kztimer-1030b: kz_timer, its "Time's up" notification, buzz, the full-screen clock), so there is
   still only one timer at a time. The timer state carries five: { id, k: 'h' | 'r' }. At 0:00 the clock offers Check it off (or
   Log today) / Keep going; Keep going turns it into a stopwatch with Check it off. 5 minutes is a full check-off: same path as a tap.
   Styles: kzfive-1102.css */
(function () {
  var K = window.KZ; if (!K || K.__kzfive || !K.startTimer) return; K.__kzfive = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.6M9.5 2.8h5M12 2.8V6"/></svg>';

  function goals() { return K.get('goals', []) || []; }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0]; }
  function isQuit(g) { return !!(g && (g.quit || g.kind === 'quit')); }
  function isMs(g) { return !!(g && K.bd && K.bd.isMs && K.bd.isMs(g)); }
  function kindOf(g) { if (!g || isQuit(g)) return ''; if (isMs(g)) return 'r'; return g.kind === 'daily' ? 'h' : ''; }
  function tk() { return K.key(K.today()); }
  function doneToday(id) { try { return !!K.isDone(id); } catch (e) { return false; } }
  function workedToday(g) { return Array.isArray(g && g.wk) && g.wk.indexOf(tk()) >= 0; }
  function curStep(g) { var ms = (g && g.ms) || []; for (var i = 0; i < ms.length; i++) if (!ms[i].d) return ms[i].t; return ''; }
  function st() { var s = K.get('timer', null); return s && typeof s === 'object' && s.mode ? s : null; }
  function five() { var s = st(); return s && s.five && s.five.id ? s : null; }
  function running(id) { var s = five(); return !!(s && s.five.id === id); }

  // ---------- starting ----------
  function begin(id) {
    var g = goal(id), k = kindOf(g); if (!k) return;
    var s = st();
    if (s && !s.done && !(s.five && s.five.id === id)) { askSwitch(id, s); return; }
    if (s && s.five && s.five.id === id && !s.done) { reopen(); return; }
    var last = K.get('timerlast', null), alert = last && last.alert === 'buzz' ? 'buzz' : 'sound';
    K.startTimer('timer', 5, alert);
    var n = st(); if (n) { n.five = { id: id, k: k }; K.set('timer', n); }
    decorate(); paint();
  }
  function reopen() { var hb = document.querySelector('.kztm-hb'); if (hb) hb.click(); }

  var ask = null;
  function askSwitch(id, s) {
    closeAsk(); var g = goal(id), cur = s.five && goal(s.five.id);
    var what = cur ? '5 minutes on “' + esc(cur.name) + '”' : (s.mode === 'watch' ? 'a stopwatch' : 'a timer');
    ask = document.createElement('div'); ask.className = 'kzfv-ask'; ask.setAttribute('role', 'dialog'); ask.setAttribute('aria-modal', 'true'); ask.setAttribute('aria-label', 'Switch timers');
    ask.innerHTML = '<div class="kzfv-as"><b>You already have ' + what + ' running.</b><span>Switch to 5 minutes on “' + esc(g.name) + '”?</span>' +
      '<button type="button" class="kztm-btn gold" data-kzfv-sw="' + esc(id) + '">Switch</button><button type="button" class="kztm-btn" data-kzfv-sw="">Keep the current one</button></div>';
    document.body.appendChild(ask); post({ type: 'pageScroll', on: false });
    requestAnimationFrame(function () { if (ask) ask.classList.add('on'); });
    ask.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kzfv-sw]'); if (!b && e.target !== ask) return;
      var to = b ? b.getAttribute('data-kzfv-sw') : ''; closeAsk(); post({ type: 'tick' });
      if (to) { K.set('timer', null); begin(to); }
    });
  }
  function closeAsk() { if (!ask) return; var a = ask; ask = null; a.remove(); setTimeout(function () { if (!document.querySelector('.kztm-over')) post({ type: 'pageScroll', on: true }); }, 60); }

  // ---------- finishing ----------
  function checkOff(id) {
    if (doneToday(id)) return;
    var sel = window.CSS && CSS.escape ? CSS.escape(id) : id, c = document.querySelector('.kz-check[data-kz-done="' + sel + '"]');
    if (c) { c.click(); return; }
    K.toggleDone(id); document.dispatchEvent(new CustomEvent('kz:changed'));
  }
  function logDay(id) {
    var t = tk(), all = goals().map(function (g) {
      if (g.id !== id) return g; var a = Array.isArray(g.wk) ? g.wk.slice() : []; if (a.indexOf(t) < 0) a.push(t); g.wk = a.slice(-400); return g;
    });
    K.set('goals', all); post({ type: 'haptic', n: 1 }); document.dispatchEvent(new CustomEvent('kz:changed'));
  }
  var pend = null;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kzfv-a]'); if (!b) return;
    var s = five(); pend = s ? { a: b.getAttribute('data-kzfv-a'), id: s.five.id, k: s.five.k } : null;
    // the button also carries data-kztm (close / reset), so the timer's own handler stops the buzz and closes the clock; then:
    setTimeout(function () {
      var p = pend; pend = null; if (!p) return;
      if (p.a === 'done') { if (p.k === 'r') logDay(p.id); else checkOff(p.id); }
      else if (p.a === 'go') { K.startTimer('watch'); var n = st(); if (n) { n.five = { id: p.id, k: p.k }; K.set('timer', n); } decorate(); }
      paint();
    }, 0);
  }, true);

  // ---------- the clock, dressed for 5 minutes ----------
  function decorate() {
    var L = document.querySelector('.kztm-over'), s = five();
    if (!L) return;
    if (!s) { if (L.classList.contains('kzfv')) { L.classList.remove('kzfv'); [].forEach.call(L.querySelectorAll('.kzfv-x'), function (x) { x.remove(); }); } return; }
    var g = goal(s.five.id); if (!g) return;
    var r = s.five.k === 'r', watch = s.mode === 'watch', already = r ? workedToday(g) : doneToday(g.id);
    var phase = watch ? (s.paused ? 'wp' : 'w') : s.done ? 'd' : (s.paused ? 'tp' : 't');
    var sig = phase + '|' + already + '|' + g.name + '|' + (g.mini || '');
    L.classList.add('kzfv'); L.classList.toggle('kzfv-groove', watch);
    var inr = L.querySelector('.kztm-in'); if (!inr) return;
    var head = inr.querySelector('.kzfv-head');
    if (!head) { head = document.createElement('div'); head.className = 'kzfv-head kzfv-x'; inr.insertBefore(head, inr.firstChild); }
    var foot = inr.querySelector('.kzfv-acts');
    if (!foot) { foot = document.createElement('div'); foot.className = 'kzfv-acts kzfv-x'; var ref = inr.querySelector('.kztm-acts'); inr.insertBefore(foot, ref ? ref.nextSibling : null); }
    if (L.__kzfv === sig) return; L.__kzfv = sig;
    var small = r ? (curStep(g) ? 'Today’s step: ' + curStep(g) : '') : (g.mini ? 'Bad-day version: ' + g.mini : '');
    head.innerHTML = '<em>' + (watch ? 'IN THE GROOVE' : 'JUST 5 MIN') + '</em><b>' + esc(g.name) + '</b>' + (small ? '<span>' + esc(small) + '</span>' : '');
    var doneLbl = r ? 'Log today' : 'Check it off', h = '';
    if (phase === 'd') {
      h = '<p class="kzfv-msg">' + (already ? (r ? 'Today is already logged.' : 'Already checked off today.') : '5 minutes done. That counts.') + '</p>' +
        (already ? '<button type="button" class="kztm-btn gold" data-kztm="close">Close</button>'
          : '<button type="button" class="kztm-btn gold" data-kztm="close" data-kzfv-a="done">' + doneLbl + '</button>' +
            '<button type="button" class="kztm-btn" data-kztm="close" data-kzfv-a="go">Keep going</button>' +
            '<button type="button" class="kzfv-q" data-kztm="close">Close without ' + (r ? 'logging' : 'checking off') + '</button>');
    } else if (watch) {
      h = '<p class="kzfv-msg">Check it off whenever you’re done.</p>' +
        (already ? '' : '<button type="button" class="kztm-btn gold" data-kztm="reset" data-kzfv-a="done">' + doneLbl + '</button>') +
        '<button type="button" class="kztm-btn" data-kztm="' + (s.paused ? 'resume' : 'pause') + '">' + (s.paused ? 'Resume' : 'Pause') + '</button>' +
        '<button type="button" class="kzfv-q" data-kztm="reset">End without ' + (r ? 'logging' : 'checking off') + '</button>';
    } else {
      h = '<p class="kzfv-why"><b>Starting is the hard part.</b> Give it 5 focused minutes. Once you\u2019ve started, it\u2019s easy to keep going, and if you stop at 5, it still counts.</p>' +
        '<button type="button" class="kztm-btn gold" data-kztm="' + (s.paused ? 'resume' : 'pause') + '">' + (s.paused ? 'Resume' : 'Pause') + '</button>' +
        '<button type="button" class="kztm-btn" data-kztm="end">Cancel</button>';
    }
    foot.innerHTML = h;
  }
  setInterval(function () { if (document.querySelector('.kztm-over')) decorate(); }, 120);
  new MutationObserver(function (l) {
    for (var i = 0; i < l.length; i++) for (var j = 0; j < l[i].addedNodes.length; j++) { var n = l[i].addedNodes[j]; if (n.classList && n.classList.contains('kztm-over')) { decorate(); return; } }
  }).observe(document.body, { childList: true });

  // ---------- the buttons on the rows ----------
  function iconBtn(id, cls, name) {
    var b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('data-kzfv', id);
    b.innerHTML = ICON; return b;
  }
  function label(b, g, on) {
    b.classList.toggle('on', on);
    b.setAttribute('aria-label', on ? '5 minutes on ' + g.name + ' is running. Open the timer.' : 'Just 5 minutes on ' + g.name + '. Optional timer.');
  }
  var q = 0;
  function paint() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kz-goal[data-goal]'), function (row) {
      var id = row.getAttribute('data-goal'), g = goal(id), k = kindOf(g), body = row.querySelector(':scope > .kz-gbody');
      var on = running(id);
      // habits: the small button beside "…", and the full one in the unfolded part
      var ib = row.querySelector(':scope > .kzfv-ib'), showH = k === 'h' && !doneToday(id) && !row.classList.contains('is-done');
      if (!showH) { if (ib) ib.remove(); row.classList.remove('kzfv-has'); }
      else {
        if (!ib) { ib = iconBtn(id, 'kzfv-ib'); var m = row.querySelector(':scope > .kz-gmore'); row.insertBefore(ib, m || null); }
        row.classList.add('kzfv-has'); label(ib, g, on);
      }
      var gx = row.querySelector(':scope > .kz-gx'), big = gx && gx.querySelector('.kzfv-big');
      if (!showH || !gx) { if (big) big.remove(); }
      else {
        if (!big) { big = document.createElement('div'); big.className = 'kzfv-big'; gx.insertBefore(big, gx.firstChild); big.__s = ''; }
        var sig = on + '';
        if (big.__s !== sig) {
          big.__s = sig;
          big.innerHTML = '<button type="button" class="kzfv-bb' + (on ? ' on' : '') + '" data-kzfv="' + esc(id) + '">' + ICON + '<span>' + (on ? 'Timer running · open it' : 'Just 5 min') + '</span></button>' +
            '<small>Starting is the hard part. 5 focused minutes gets you moving, and it counts even if you stop there.</small>';
        }
      }
      // long-term goals: a "5 min" pill beside "Worked on it today"
      var lw = body && body.querySelector('.kzlw'), pill = body && body.querySelector('.kzfv-p');
      if (k !== 'r' || !lw) { if (pill) { var w0 = pill.parentNode; pill.remove(); if (w0 && w0.classList.contains('kzfv-pr')) { while (w0.firstChild) w0.parentNode.insertBefore(w0.firstChild, w0); w0.remove(); } } }
      else {
        var wrap = lw.parentNode.classList.contains('kzfv-pr') ? lw.parentNode : null;
        if (!wrap) { wrap = document.createElement('span'); wrap.className = 'kzfv-pr'; lw.parentNode.insertBefore(wrap, lw); wrap.appendChild(lw); }
        if (!pill) { pill = document.createElement('button'); pill.type = 'button'; pill.className = 'kzfv-p'; pill.setAttribute('data-kzfv', id); wrap.appendChild(pill); }
        var ps = on + '';
        if (pill.__s !== ps) { pill.__s = ps; pill.innerHTML = ICON; label(pill, g, on); }
      }
      // the "…" menu
      var menu = row.querySelector(':scope > .kz-gmenu'), mi = menu && menu.querySelector('.kzfv-mi');
      var showM = (k === 'h' && !doneToday(id)) || k === 'r';
      if (!menu || !showM) { if (mi) mi.remove(); }
      else if (!mi) {
        mi = document.createElement('button'); mi.type = 'button'; mi.setAttribute('role', 'menuitem'); mi.className = 'kzfv-mi'; mi.setAttribute('data-kzfv', id);
        mi.innerHTML = '<span>Just 5 minutes</span>' + ICON;
        var view = menu.querySelector('a[role="menuitem"]'); menu.insertBefore(mi, view ? view.nextSibling : menu.firstChild);
      }
    });
    // the Kaizen 66 card
    var hero = document.querySelector('section.kzf-66'), top = hero && hero.querySelector('.kzf-top'), hb = top && top.querySelector('.kzfv-hb');
    var run = K.get('k66', null), hid = run && (run.goal || (run.run && run.run.goal)), hg = hid && goal(hid);
    if (!hg) { var r66 = document.querySelector('.kz-goal.kzf-is66[data-goal]'); hg = r66 && goal(r66.getAttribute('data-goal')); }
    var showK = !!(top && hg && kindOf(hg) === 'h' && !doneToday(hg.id));
    if (!showK) { if (hb) hb.remove(); }
    else {
      if (!hb) { hb = iconBtn(hg.id, 'kzfv-hb'); top.appendChild(hb); } hb.setAttribute('data-kzfv', hg.id); label(hb, hg, running(hg.id));
      var ck = top.querySelector('.kzf-ck');   // just left of the big check circle, centred on it
      if (ck && ck.offsetWidth) { var tr = top.getBoundingClientRect(), cr = ck.getBoundingClientRect(), L = Math.round(cr.left - tr.left - 44), T = Math.round(cr.top - tr.top + cr.height / 2 - 17);
        if (hb.__p !== L + ',' + T) { hb.__p = L + ',' + T; hb.style.left = L + 'px'; hb.style.top = T + 'px'; } }
    }
  }
  function soon() { if (!q) q = requestAnimationFrame(paint); }

  function hit(e) { return e.target && e.target.closest && e.target.closest('[data-kzfv]'); }
  ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(function (n) {
    addEventListener(n, function (e) { if (hit(e)) e.stopPropagation(); }, true);
  });
  addEventListener('click', function (e) {
    var b = hit(e); if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault(); post({ type: 'tick' });
    var menu = b.closest('.kz-gmenu'); if (menu) { menu.hidden = true; var mb = menu.parentNode && menu.parentNode.querySelector('.kz-gmore'); if (mb) mb.setAttribute('aria-expanded', 'false'); }
    var id = b.getAttribute('data-kzfv'); if (running(id) && five() && !five().done) { reopen(); return; }
    begin(id);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ask) closeAsk(); });

  K.fiveStart = begin;   // for the evening reminder (opens straight into a 5-minute timer) and tests
  function boot() {
    paint();
    new MutationObserver(function (l) {
      for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && (t.closest('.kzfv-big, .kzfv-pr, .kztm-over'))) continue; soon(); return; }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    ['kz:changed', 'kz:goals', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
    addEventListener('pageshow', soon); document.addEventListener('visibilitychange', soon);
    setInterval(soon, 1500);   // the running/ended state of a timer changes without any DOM event
    // opened from the evening reminder: index.html?five=<goal id>
    try { var m = /[?&]five=([^&#]+)/.exec(location.search); if (m) setTimeout(function () { begin(decodeURIComponent(m[1])); }, 900); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
