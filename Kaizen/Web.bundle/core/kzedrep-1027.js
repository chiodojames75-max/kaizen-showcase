/* Oct 27 · Plan → Edit task gets "Repeat" (James: "be able to edit the frequency, say weekdays, every week until stopped").
   Never · Daily · Weekdays · Pick days (S M T W T F S). Saving with a repeat turns the task into a repeating to-do
   (a kz_todorep rule, the same as New to-do → Repeat): it shows up on every matching day from the day you're editing,
   until you delete it on a day. A task that already repeats opens with its repeat picked; Never stops it (this day's
   copy stays). Also: the sheet's Save and picked chips use the gold glass like the rest of the app. */
(function () {
  var K = window.KZ; if (!K || window.__kzedrep) return; window.__kzedrep = 1;
  var DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], DL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var ctx = null, st = { rep: 'never', days: [] };
  function rules() { return K.get('todorep', []) || []; }
  function dateOf(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function post(m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} }
  function planDay() { var b = document.querySelector('[data-p="week"] [aria-selected="true"]'); return b ? b.getAttribute('data-day') : (K.key ? K.key(K.today()) : ''); }
  function todo(id) { return (K.todos ? K.todos() : []).filter(function (t) { return t.id === id; })[0] || null; }
  // remember which task the sheet is for (the sheet itself doesn't say)
  document.addEventListener('click', function (e) {
    var li = e.target.closest && e.target.closest('[data-p="day-list"] li.kz-todo'); if (!li || e.target.closest('button,a,input')) return;
    ctx = { day: planDay(), key: li.getAttribute('data-kzk') };
  }, true);
  function sameDays(a, b) { return a.slice().sort().join() === b.slice().sort().join(); }
  function fromRule(r) {
    if (!r) return { rep: 'never', days: [] };
    if (r.type === 'daily') return { rep: 'daily', days: [] };
    var d = r.type === 'weekly' ? [dateOf(r.start).getDay()] : (r.days || []).slice();
    if (d.length === 7) return { rep: 'daily', days: [] };
    if (sameDays(d, [1, 2, 3, 4, 5])) return { rep: 'weekdays', days: [1, 2, 3, 4, 5] };
    return { rep: 'days', days: d };
  }
  function chip(on, attr, v, label, extra) { return '<button type="button" ' + attr + '="' + v + '" aria-pressed="' + !!on + '"' + (extra || '') + '>' + label + '</button>'; }
  function html() {
    var h = '<span>Repeat</span><div class="kzer-seg">' + chip(st.rep === 'never', 'data-er', 'never', 'Never') + chip(st.rep === 'daily', 'data-er', 'daily', 'Daily') + chip(st.rep === 'weekdays', 'data-er', 'weekdays', 'Weekdays') + chip(st.rep === 'days', 'data-er', 'days', 'Pick days') + '</div>';
    if (st.rep === 'days') h += '<div class="kzer-days" role="group" aria-label="Days of the week">' + DN.map(function (n, i) { return chip(st.days.indexOf(i) > -1, 'data-erd', i, n, ' aria-label="' + DL[i] + '"'); }).join('') + '</div>';
    var hint = st.rep === 'never' ? (ctx && ctx.rule ? 'Stops repeating. This day’s task stays.' : 'Just this day.') :
      st.rep === 'daily' ? 'Every day, until you delete it on a day.' : st.rep === 'weekdays' ? 'Monday to Friday, every week, until you delete it on a day.' :
      (st.days.length ? 'Every ' + st.days.slice().sort().map(function (d) { return DL[d].slice(0, 3); }).join(' · ') + ', every week, until you delete it on a day.' : 'Pick the days it should show up.');
    return h + '<p class="kzer-hint">' + hint + '</p>';
  }
  function inject(sh) {
    if (sh.querySelector('.kzer')) return;
    var whenF = sh.querySelector('.kzo-parts'); whenF = whenF && whenF.closest('.kzo-f'); if (!whenF) return;
    var c = ctx || {}, t = c.key && c.key.indexOf('t:') === 0 ? todo(c.key.slice(2)) : null, r = t && t.rep ? rules().filter(function (x) { return x.id === t.rep; })[0] : null;
    if (ctx) ctx.rule = r || null;
    var s = fromRule(r); st.rep = s.rep; st.days = s.days;
    var f = document.createElement('div'); f.className = 'kzo-f kzer'; f.innerHTML = html(); whenF.parentNode.insertBefore(f, whenF.nextSibling);
    var note = sh.querySelector('.kzo-note'); if (note) note.textContent = 'Changes this day only, unless it repeats.';
  }
  function paint(sh) { var f = sh.querySelector('.kzer'); if (f) f.innerHTML = html(); }
  document.addEventListener('click', function (e) {
    var sh = e.target.closest && e.target.closest('.kzo-sheet'); if (!sh) return;
    var b = e.target.closest('.kzer button');
    if (b) {
      e.preventDefault(); e.stopPropagation();
      if (b.hasAttribute('data-er')) { st.rep = b.getAttribute('data-er'); if (st.rep === 'days' && !st.days.length && ctx && ctx.day) st.days = [dateOf(ctx.day).getDay()]; }
      else { var i = +b.getAttribute('data-erd'), j = st.days.indexOf(i); if (j > -1) st.days.splice(j, 1); else st.days.push(i); }
      post({ type: 'tick' }); paint(sh); return;
    }
    var save = e.target.closest('[data-kzo="save"]'); if (!save || !ctx || !ctx.day || !ctx.key) return;
    var name = (sh.querySelector('.kzo-name') || {}).value || ''; name = name.trim(); if (!name) return;   // the sheet's own Save shows the error
    var time = (sh.querySelector('.kzo-time') || {}).value || '', on = sh.querySelector('.kzo-parts [aria-checked="true"]'), part = time && K.partOfTime ? K.partOfTime(time) : (on ? on.getAttribute('data-part') : 'any');
    var rs = rules(), old = ctx.rule;
    if (st.rep === 'never') {
      if (old) { K.set('todorep', rs.filter(function (x) { return x.id !== old.id; })); var t0 = todo(ctx.key.slice(2)); if (t0) { var all0 = K.todos().map(function (x) { if (x.id === t0.id) { x = Object.assign({}, x); delete x.rep; } return x; }); K.set('todos', all0); } }
      return;   // the sheet's own Save handles the rest
    }
    if (st.rep === 'days' && !st.days.length) { e.preventDefault(); e.stopPropagation(); return; }
    var days = st.rep === 'weekdays' ? [1, 2, 3, 4, 5] : st.rep === 'days' ? st.days.slice() : [];
    var type = st.rep === 'daily' ? 'daily' : 'days';
    e.preventDefault(); e.stopImmediatePropagation();
    if (old) {
      rs = rs.map(function (x) { return x.id === old.id ? Object.assign({}, x, { txt: name, type: type, days: days, part: part, time: time }) : x; });
      K.set('todorep', rs);
      var all = K.todos().map(function (x) { return x.id === ctx.key.slice(2) ? Object.assign({}, x, { txt: name, part: part, time: time }) : x; }); K.set('todos', all);
    } else {
      var r = { id: 'r' + Date.now().toString(36), txt: name.slice(0, 90), type: type, days: days, start: ctx.day, part: part, time: time, remind: -1, last: '' };
      // this task becomes the first copy of the repeat (when it falls on a repeat day); otherwise it is replaced by the rule
      var applies = type === 'daily' || days.indexOf(dateOf(ctx.day).getDay()) > -1;
      if (ctx.key.indexOf('p:') === 0) {
        var p = K.plan(ctx.day); if (p) K.savePlan(ctx.day, p.items.filter(function (x) { return x.id !== ctx.key.slice(2); }));
        if (applies) { var k = ctx.day, t1 = { id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 1000), txt: r.txt, from: k, to: k, part: part, time: time, remind: -1, done: null, created: k, rep: r.id }; var a1 = K.todos(); a1.push(t1); K.set('todos', a1); r.last = k; }
      } else {
        var a2 = K.todos().map(function (x) { return x.id === ctx.key.slice(2) ? Object.assign({}, x, { txt: r.txt, part: part, time: time, from: ctx.day, to: ctx.day, rep: applies ? r.id : x.rep }) : x; });
        if (!applies) a2 = a2.filter(function (x) { return x.id !== ctx.key.slice(2); }); else r.last = ctx.day;
        K.set('todos', a2);
      }
      rs.push(r); K.set('todorep', rs);
    }
    try { document.dispatchEvent(new CustomEvent('kz:todos')); document.dispatchEvent(new CustomEvent('kz:changed')); } catch (er) {}
    post({ type: 'dirty' }); post({ type: 'haptic', n: 2 });
    var x = sh.querySelector('[data-kzo="x"]'); if (x) x.click();
    if (K.toast) K.toast('Repeats ' + (type === 'daily' ? 'every day' : st.rep === 'weekdays' ? 'every weekday' : 'every ' + days.slice().sort().map(function (d) { return DL[d].slice(0, 3); }).join(' · ')));
  }, true);
  new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) for (var j = 0; j < l[i].addedNodes.length; j++) { var n = l[i].addedNodes[j]; if (n.nodeType === 1 && n.classList.contains('kzo-sheet')) inject(n); } })
    .observe(document.body, { childList: true });
})();
