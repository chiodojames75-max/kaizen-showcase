/* Oct 25 w (from v), James: "the bottom half doesn't load at the same time as the top half": the box was held at the
   current day's height while dragging, so the next day's lower part (add row, note) was cut off until it landed. The box
   now grows or shrinks with your finger toward the next day's height, so the whole next day slides in at once.
   Oct 25 v (from u), James: "use it like a fidget toy": a new touch while a day change is still settling finishes that
   change at once and starts the new drag (it used to be ignored until the slide ended); the height easing can't stack.
   Oct 25 u (from t), James: "it drags the box": the whole card moves now (the today card's shell stayed put while
   its rows slid), the next day's card sits beside it with a 14 pt gap so you can see part of it mid-swipe, and there's a
   haptic click the moment you pass the point where letting go switches day.
   Oct 25 t (from s), James: "take away the Today pill, make switching days much smoother, no glitch". The neighbouring
   day is drawn beside the box while you drag, so it follows your finger and slides in (no slide-out-then-jump); the
   box height eases to the new day's height; the Today pill is gone (swipe back, or tap the day's name to jump to today).
   Plan's day swipe slides and fades instead of jumping.
   Oct 25 s (from r): no ‹ › arrows (swipe or the Today pill), other days drawn with Today's own row style, and the slide
   transform is removed once a swipe settles (a leftover transform pulled the ×N multiplier down into the first row).
   Oct 25 r · Swipe through days (James). Swipe LEFT = the next day, swipe RIGHT = the day before (like iPhone Calendar).
   Today: the To-dos box. Today shows exactly what it showed before; other days show that day's plan + to-dos in place:
   future days can be added to (the to-do lands on that day) but not checked off; past days are read-only and show what
   was done (✓) and what was planned but not done (dimmed). 14 days back, 30 ahead; the ends rubber-band. A "Today" pill
   jumps back; ‹ › buttons do the same as swiping (VoiceOver / Switch Control). Coming back to Today always shows today.
   Plan: swiping the day area moves the selected day (the week strip follows, crossing a week edge changes week).
   One shared gesture: axis-locked after 10 pt, vertical scroll always wins at steep angles, changes after 25% of the width
   or a quick flick, settles on the shared spring, one light haptic per day. */
(function () {
  var K = window.KZ; if (!K || K.__kzswipe) return; K.__kzswipe = 'w';
  var de = document.documentElement;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function tk() { return K.key(K.today()); }
  function plus(k, n) { return K.key(K.addDays(new Date(k + 'T12:00:00'), n)); }
  function label(k) {
    var t = tk(); if (k === t) return 'Today'; if (k === plus(t, 1)) return 'Tomorrow'; if (k === plus(t, -1)) return 'Yesterday';
    var d = new Date(k + 'T12:00:00'); return DAYS[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate();
  }
  var BACK = 14, AHEAD = 30;

  // ---------- the shared gesture ----------
  K.daySwipe = function (area, opt) {
    if (!area || area.__kzds) return; area.__kzds = 1;
    var sx = 0, sy = 0, st = 0, lock = '', dx = 0, live = false, lastX = 0, lastT = 0, vx = 0;
    function target() { return opt.target ? opt.target() : area; }
    // moves the target's content (not its header) through two CSS variables, so the page's own layout code is untouched
    var peek = null, pdir = 0, GAP = 14, armed = 0, busy = 0, pending = null, hFrom = 0, hTo = 0;
    function finishNow() { if (pending) { var f = pending; pending = null; f(); } }
    function dur() { return calm ? 0 : 320; }
    function ease() { return 'cubic-bezier(.22,.8,.24,1)'; }
    function setX(x, anim, op) {
      var t = target(); if (!t) return;
      t.setAttribute('data-kzsd', '');
      t.style.setProperty('--kzsd-tr', anim ? 'transform ' + dur() + 'ms ' + ease() + ', opacity ' + dur() + 'ms ' + ease() : 'none');
      t.style.setProperty('--kzsd-x', (x || 0) + 'px');
      t.style.setProperty('--kzsd-o', op == null ? '1' : String(op));
      if (peek && hTo && Math.abs(hTo - hFrom) > 2) {
        var ww = t.offsetWidth || 340, pr = Math.min(1, Math.abs(x || 0) / (ww * 0.45));   // fully grown by the time the next day is half in view
        t.style.transition = anim ? 'height ' + dur() + 'ms ' + ease() : 'none';
        t.style.height = Math.round(hFrom + (hTo - hFrom) * pr) + 'px';
      } else if (!peek && t.__kzsdH0) { t.style.height = ''; t.style.transition = ''; }
      if (peek) { var w = t.offsetWidth || 340; peek.style.transition = anim ? 'transform ' + dur() + 'ms ' + ease() : 'none'; peek.style.transform = 'translate3d(' + (pdir * (w + GAP) + (x || 0)) + 'px,0,0)'; }
      // the today card holds the ×N pill, which is positioned against the section: a transform on the card would capture
      // it, so the card itself moves by margins (the pill stays in the header) and everything else by transform
      Array.prototype.forEach.call(t.querySelectorAll(':scope > .kz-plancard'), function (c) {
        c.style.transition = anim ? 'margin ' + dur() + 'ms ' + ease() + ', opacity ' + dur() + 'ms ' + ease() : 'none';
        if (x) { c.style.marginLeft = x + 'px'; c.style.marginRight = (-x) + 'px'; } else { c.style.marginLeft = ''; c.style.marginRight = ''; }
      });
      clearTimeout(t.__kzsdT);
      if (!x && !peek) t.__kzsdT = setTimeout(clearX, anim ? dur() + 60 : 0);
    }
    function clearX() { var t = target(); if (!t) return; t.removeAttribute('data-kzsd'); t.style.removeProperty('--kzsd-x'); t.style.removeProperty('--kzsd-tr'); t.style.removeProperty('--kzsd-o'); }
    function dropPeek() { if (peek) { peek.remove(); peek = null; pdir = 0; } hFrom = hTo = 0; var t = target(); if (t) { t.__kzsdH0 = 0; } }
    function ensurePeek(dir) {
      if (!opt.makePeek) return;
      if (peek && pdir === dir) return; dropPeek();
      var t = target(), el = opt.makePeek(dir); if (!el || !t) return;
      var top = opt.peekTop ? opt.peekTop() : 0;
      el.classList.add('kzsd-peek'); el.setAttribute('aria-hidden', 'true'); el.style.top = top + 'px';
      if (!t.__kzsdH0) t.__kzsdH0 = t.offsetHeight;
      var bottom = top; Array.prototype.forEach.call(t.children, function (c) { if (c === el || c.classList.contains('kzsd-dots') || c.classList.contains('kzsd-peek') || c.offsetParent === null) return; bottom = Math.max(bottom, c.offsetTop + c.offsetHeight); });
      t.appendChild(el); peek = el; pdir = dir;
      hFrom = t.__kzsdH0; hTo = t.__kzsdH0 + (top + el.offsetHeight) - bottom;
    }
    function skip(e) { return e.target.closest && e.target.closest('input, textarea, select, [contenteditable], .kz-swipe-x, .kz-gswipe, .kzf-card, [data-kz-drag]'); }
    area.addEventListener('touchstart', function (e) {
      finishNow();             // a day change still settling: land it now, then this touch starts a new drag
      var tt = target(); if (tt) { clearTimeout(tt.__kzsdH); tt.style.height = ''; tt.style.transition = ''; tt.__kzsdH0 = 0; }
      dropPeek(); clearX();   // never leave a preview behind from an earlier gesture
      if (e.touches.length !== 1 || skip(e) || de.classList.contains('kz-layer-open')) { live = false; return; }
      var p = e.touches[0]; sx = lastX = p.clientX; sy = p.clientY; st = lastT = Date.now(); lock = ''; dx = 0; vx = 0; live = true; armed = 0;
    }, { passive: true });
    area.addEventListener('touchmove', function (e) {
      if (!live) return; var p = e.touches[0], mx = p.clientX - sx, my = p.clientY - sy;
      if (!lock) { if (Math.abs(mx) < 10 && Math.abs(my) < 10) return; lock = Math.abs(mx) > Math.abs(my) * 1.7 ? 'x' : 'y'; }
      if (lock !== 'x') return;
      e.preventDefault();
      var now = Date.now(); vx = (p.clientX - lastX) / Math.max(1, now - lastT); lastX = p.clientX; lastT = now;
      var can = mx < 0 ? opt.canNext() : opt.canPrev();
      dx = can ? mx : (1 - 1 / (Math.abs(mx) * 0.55 / 320 + 1)) * 320 * (mx < 0 ? -1 : 1);   // rubber band at the ends
      if (can) ensurePeek(mx < 0 ? 1 : -1); else dropPeek();
      var wv = (target() || area).offsetWidth || 340, over = can && Math.abs(dx) > wv * 0.25 ? (dx < 0 ? 1 : -1) : 0;
      if (over !== armed) { armed = over; if (over) post({ type: 'haptic', n: 1 }); }   // the click as you pass the switch point
      setX(dx, false);
    }, { passive: false });
    function end() {
      if (!live) return; live = false; if (lock !== 'x') { dropPeek(); return; }
      var w = (target() || area).offsetWidth || 340, go = 0;
      if ((dx < -w * 0.25 || vx < -0.5) && opt.canNext()) go = 1; else if ((dx > w * 0.25 || vx > 0.5) && opt.canPrev()) go = -1;
      if (!go) { setX(0, true); setTimeout(function () { if (!live && !pending) { var t0 = target(); dropPeek(); clearX(); if (t0) { t0.style.height = ''; t0.style.transition = ''; } } }, dur() + 40); return; }
      move(go, dx);
    }
    area.addEventListener('touchend', end); area.addEventListener('touchcancel', end);
    function move(go, from) {
      var t = target(), w = (t || area).offsetWidth || 340;
      if (!armed) post({ type: 'tick' }); armed = 0;
      if (calm || !t) { dropPeek(); opt.go(go); clearX(); return; }
      if (opt.makePeek) {
        finishNow();
        ensurePeek(go);
        if (!from) setX(0, false);
        var raf = 0, tm = 0, done = false;
        var land = function () {
          if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(tm); pending = null; busy = 0;
          var h0 = t.offsetHeight;
          opt.go(go);                       // the real content now matches what the peek showed
          dropPeek(); setX(0, false); clearX();
          clearTimeout(t.__kzsdH); t.style.transition = 'none'; t.style.height = '';
          var h1 = t.offsetHeight;
          if (Math.abs(h1 - h0) > 6 && !calm) { t.style.height = h0 + 'px'; void t.offsetHeight; t.style.transition = 'height 180ms ' + ease(); t.style.height = h1 + 'px'; t.__kzsdH = setTimeout(function () { t.style.height = ''; t.style.transition = ''; }, 220); }
        };
        busy = 1; pending = land;
        raf = requestAnimationFrame(function () { setX(-go * (w + GAP), true); tm = setTimeout(land, dur()); });
        return;
      }
      // no peek (Plan): slide + fade out a little, swap, slide + fade in from the other side
      setX(-go * w * 0.3, true, 0);
      setTimeout(function () { opt.go(go); setX(go * w * 0.3, false, 0); void t.offsetWidth; requestAnimationFrame(function () { requestAnimationFrame(function () { setX(0, true, 1); }); }); }, 170);
    }
    return { move: move, reset: function () { dropPeek(); setX(0, false); clearX(); } };
  };

  // ---------- Today: the To-dos box ----------
  var off = 0, ctl = null;
  function day() { return plus(tk(), off); }
  function partName(p) { return K.partName ? K.partName(p) : p; }
  function render(sec) {
    var stale = sec.querySelector(':scope > .kzsd-peek'); if (stale && !sec.hasAttribute('data-kzsd')) stale.remove();
    var k = day(), panel = sec.querySelector('.kzsd-panel');
    sec.classList.toggle('kzsd-other', off !== 0);
    var h2 = sec.querySelector('.kz-tsec-h h2'); if (h2) { var want = off === 0 ? 'To-dos' : label(k); if (h2.textContent !== want) h2.textContent = want; h2.classList.toggle('kzsd-back', off !== 0); if (off) h2.setAttribute('role', 'button'); else h2.removeAttribute('role'); }
    paintDots(sec);
    if (off === 0) { if (panel) panel.hidden = true; sec.setAttribute('aria-label', 'To-dos, today'); return; }
    if (!panel) { panel = document.createElement('div'); panel.className = 'kzsd-panel'; var ul = sec.querySelector('[data-t="todos"]'); sec.insertBefore(panel, ul); }
    panel.hidden = false;
    var r = dayHTML(k);
    if (panel.__h !== r.h) { panel.__h = r.h; panel.innerHTML = r.h; }
    sec.setAttribute('aria-label', 'To-dos, ' + label(k) + ', ' + r.n + (r.n === 1 ? ' item' : ' items'));
  }
  function dayHTML(k) {
    var t = tk(), past = k < t, isT = k === t;
    var p = K.plan ? K.plan(k) : null, items = [];
    (p && p.items ? p.items.slice().sort(K.planSort || function () { return 0; }) : []).forEach(function (x) { items.push({ txt: x.txt, part: x.part, t: x.t, done: !!x.done, plan: 1 }); });
    if (isT) {
      (K.todosFor ? K.todosFor(k) : []).forEach(function (x) { items.push({ txt: x.txt, part: x.part, t: x.time, done: !!x.done }); });
    } else if (past) {
      (K.todosDoneOn ? K.todosDoneOn(k) : []).forEach(function (x) { items.push({ txt: x.txt, part: x.part, t: x.time, done: true }); });
      // goals and habits checked off that day too
      try { var dm = K.get('done', {}) || {}; (K.allGoals ? K.allGoals() : K.goals()).forEach(function (g) { if (dm[g.id] && dm[g.id][k] && g.kind !== 'quit') items.push({ txt: g.name, done: true, goal: 1 }); }); } catch (e) {}
    } else {
      (K.todosFor ? K.todosFor(k) : []).forEach(function (x) { items.push({ txt: x.txt, part: x.part, t: x.time, done: false, id: x.id }); });
    }
    var h = '';
    if (!items.length) h += '<p class="kzsd-empty">' + (isT ? 'Nothing planned for today.' : past ? 'Nothing checked off that day.' : 'Nothing planned yet.') + '</p>';
    else h += '<div class="kz-plancard kzsd-card"><ol class="kz-plan-list kzsd-list">' + items.map(function (x) {
      var when = x.t ? (K.fmtTime ? K.fmtTime(x.t) : x.t) : (x.part && x.part !== 'any' ? partName(x.part) : (x.goal ? 'Goal' : 'Anytime'));
      var cls = isT ? (x.done ? 'done kzsd-done' : '') : past ? (x.done ? 'done kzsd-done' : 'kzsd-missed') : 'kzsd-later';
      var shown = (past || isT) && x.done;
      return '<li class="' + cls + '"><time>' + esc(when) + '</time><span class="kzsd-txt"><i class="kz-tx">' + esc(x.txt) + '</i>' +
        (!past && !isT && x.id ? '<button type="button" class="kzsd-del" data-sd-del="' + esc(x.id) + '" aria-label="Remove ' + esc(x.txt) + '">×</button>' : '') + '</span>' +
        '<button type="button" class="kz-pcheck kzsd-chk' + (shown ? ' on' : '') + '" tabindex="-1" aria-disabled="true" aria-label="' + (shown ? 'Done' : past ? 'Not done' : 'Check off on the day') + '" aria-pressed="' + (shown ? 'true' : 'false') + '">' +
        '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></button></li>';
    }).join('') + '</ol></div>';
    if (isT) {}
    else if (!past) h += '<form class="kzsd-add" autocomplete="off"><input class="kzsd-in" maxlength="90" placeholder="Add to ' + esc(label(k).replace(/^\w+, /, '')) + '" aria-label="New to-do for ' + esc(label(k)) + '" enterkeyhint="done">' +
      '<select class="kzsd-part" aria-label="When in the day"><option value="any">Anytime</option><option value="am">Morning</option><option value="pm">Afternoon</option><option value="eve">Evening</option><option value="night">Night</option></select>' +
      '<button type="submit" class="kzsd-go" aria-label="Add">+</button></form><p class="kzsd-note">Check these off on the day.</p>';
    else h += '<p class="kzsd-note">Past days are read-only.</p>';
    return { h: h, n: items.length };
  }
  // what the box will look like for the day next to this one (drawn beside it while you drag)
  function peekFor(sec, dir) {
    var o = off + dir, el = document.createElement('div');
    if (false) {
    } else { el.innerHTML = dayHTML(plus(tk(), o)).h; }
    return el;
  }
  function firstTop(sec) {
    var hd = sec.querySelector('.kz-tsec-h'); if (!hd) return 0;
    for (var c = hd.nextElementSibling; c; c = c.nextElementSibling) { if (c.classList.contains('kzsd-peek') || c.classList.contains('kzsd-dots')) continue; if (c.offsetParent !== null && c.offsetHeight) return c.offsetTop; }
    return hd.offsetTop + hd.offsetHeight;
  }
  function paintDots(sec) {
    var d = sec.querySelector('.kzsd-dots'); if (!d) return;
    var h = ''; for (var i = -2; i <= 2; i++) { var o = off + i; if (o < -BACK || o > AHEAD) { h += '<i class="x"></i>'; continue; } h += '<i class="' + (i === 0 ? 'on' : '') + (o === 0 ? ' t' : '') + '"></i>'; }
    if (d.__h !== h) { d.__h = h; d.innerHTML = h; }
  }
  function setup() {
    var sec = document.querySelector('#kz-today-s1 [data-t="todosec"]'); if (!sec || sec.__kzsd) return !!sec;
    sec.__kzsd = 1;
    var hd = sec.querySelector('.kz-tsec-h');
    if (hd) {
      sec.setAttribute('aria-roledescription', 'swipe left or right to change day');
    }
    var dots = document.createElement('div'); dots.className = 'kzsd-dots'; dots.setAttribute('aria-hidden', 'true'); sec.appendChild(dots);
    ctl = K.daySwipe(sec, {
      target: function () { return sec; },
      canNext: function () { return off < AHEAD; }, canPrev: function () { return off > -BACK; },
      go: function (n) { off = Math.max(-BACK, Math.min(AHEAD, off + n)); render(sec); announce(sec); },
      makePeek: function (dir) { var o = off + dir; if (o < -BACK || o > AHEAD) return null; return peekFor(sec, dir); },
      peekTop: function () { return firstTop(sec); }
    });
    sec.addEventListener('click', function (e) {
      if (off && e.target.closest('.kz-tsec-h h2')) { e.preventDefault(); var n = -off; off = 0; render(sec); post({ type: 'tick' }); announce(sec); void n; return; }
      var d = e.target.closest('[data-sd-del]'); if (d && K.delTodo) { K.delTodo(d.getAttribute('data-sd-del')); fire(); render(sec); }
    });
    sec.addEventListener('submit', function (e) {
      var f = e.target.closest('.kzsd-add'); if (!f) return; e.preventDefault();
      var v = f.querySelector('.kzsd-in').value.trim(); if (!v || !K.addTodo) { f.querySelector('.kzsd-in').focus(); return; }
      K.addTodo({ txt: v.slice(0, 90), from: day(), part: f.querySelector('.kzsd-part').value, time: '', remind: -1 });
      post({ type: 'haptic', n: 1 }); fire(); render(sec); var ni = sec.querySelector('.kzsd-in'); if (ni) ni.focus();
    });
    render(sec);
    return true;
  }
  function fire() { ['kz:todos', 'kz:changed'].forEach(function (n) { try { document.dispatchEvent(new CustomEvent(n)); } catch (e) {} }); }
  var live = null;
  function announce(sec) { if (!live) { live = document.createElement('div'); live.className = 'kzsd-sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live); } live.textContent = sec.getAttribute('aria-label') || ''; }
  // coming back always shows today
  function reset() { if (!off) return; off = 0; var sec = document.querySelector('#kz-today-s1 [data-t="todosec"]'); if (sec) render(sec); }
  window.addEventListener('pageshow', reset); document.addEventListener('visibilitychange', function () { if (!document.hidden) reset(); });

  // ---------- Plan: the day area ----------
  function planSetup() {
    var page = document.getElementById('kz-plan-s1'); if (!page) return false;
    var area = page.querySelector('.kz-pday'), week = page.querySelector('[data-p="week"]'); if (!area || !week) return false;
    if (area.__kzds) return true;
    function btns() { return Array.prototype.slice.call(week.querySelectorAll('[data-day]')); }
    function idx() { var b = btns(); for (var i = 0; i < b.length; i++) if (b[i].getAttribute('aria-selected') === 'true') return i; return 0; }
    function wkBtn(n) { return page.querySelector('[data-wk="' + n + '"]'); }
    K.daySwipe(area, {
      target: function () { return area; },
      canNext: function () { var w = wkBtn(1); return idx() < btns().length - 1 || (w && !w.disabled); },
      canPrev: function () { var w = wkBtn(-1); return idx() > 0 || (w && !w.disabled); },
      go: function (n) {
        var b = btns(), i = idx() + n;
        if (i >= 0 && i < b.length) { b[i].click(); return; }
        var w = wkBtn(n); if (!w || w.disabled) return; w.click();
        if (n < 0) { var nb = btns(); if (nb.length) nb[nb.length - 1].click(); }
      }
    });
    return true;
  }

  var tries = 0;
  function boot() { var a = false, b = false; try { a = setup(); } catch (e) {} try { b = planSetup(); } catch (e) {} if (!a && !b && ++tries < 40) setTimeout(boot, 150); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); }); else setTimeout(boot, 0);
  ['kz:todos', 'kz:plan', 'kz:changed'].forEach(function (n) { document.addEventListener(n, function () { if (!off) return; var sec = document.querySelector('#kz-today-s1 [data-t="todosec"]'); if (sec) setTimeout(function () { render(sec); }, 0); }); });
})();
