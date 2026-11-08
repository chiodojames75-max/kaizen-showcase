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
