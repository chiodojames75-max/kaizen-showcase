/* Oct 29 · James: "make the reminder page easier to read and understand". Replaces kznotify-1025r.js (same settings, same
   reminders to the phone, same data-* hooks the note-reminder add-on uses). The sheet now reads top to bottom as plain
   questions: When? (each choice says what it does), On which days? (with "Every day" / "Weekdays"…), What should they
   remind you about? (each with a one-line meaning), Stop once it's all done, and a preview of the next one.
   "Repeating" no longer has a separate Quiet 10 PM–8 AM switch: Start and End are the quiet hours, so slots() ignores
   s.quiet (with the default 8 AM–10 PM window nothing changes). Styles: kznotify-1029.css */
/* Oct 25 r · Reminders you control, that stop once you're done (James).
   Me → Reminders opens a new sheet: style (Morning + evening · Just one · Every 15 min…3 h · Custom times), what to include,
   days, quiet hours, "Stop when everything's done". The page computes the exact reminders (time, title, body) for a
   rolling window and sends them to the phone (bridge type 'notifySync'); the phone only checks and schedules them.
   Every change (check-off, undo, add, edit, delete, a new day, opening the app) recomputes the window, so a reminder always
   lists what's actually left, and once everything is done today's remaining reminders are removed.
   iOS keeps at most 64 per app: this window never goes over 50 (timed to-dos keep their own). Quit habits are never named.
   Settings: kz_notify (backed up, cleared by Delete my data). Old reminder settings (kz_reminders) carry over. */
(function () {
  var K = window.KZ; if (!K || K.__kznotify) return; K.__kznotify = 1;
  var de = document.documentElement;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var CAP = 50;
  var DEF = { on: 0, style: 'twice', am: '08:00', pm: '20:00', amOn: 1, pmOn: 1, one: '20:00', every: 60, from: '08:00', to: '22:00', custom: ['08:00', '13:00', '20:00'],
    days: [1, 1, 1, 1, 1, 1, 1], quiet: 1, qFrom: '22:00', qTo: '08:00', stop: 1, inc: { k66: 1, habits: 1, todos: 1, quit: 1 } };
  function settings() {
    var s = K.get('notify', null);
    if (!s) { var old = K.get('reminders', {}) || {}; s = JSON.parse(JSON.stringify(DEF)); if (old.on) { s.on = 1; if (old.morning) s.am = old.morning; s.pmOn = old.evening ? 1 : 0; } }
    for (var k in DEF) if (!(k in s)) s[k] = JSON.parse(JSON.stringify(DEF[k]));
    return s;
  }
  K.notifySettings = settings;
  function save(s) { K.set('notify', s); }
  function mins(t) { var p = String(t || '0:0').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function hhmm(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function fmt(t) { var m = mins(t), h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h >= 12 ? ' PM' : ' AM'); }
  function slots(s) {
    var out = [];
    if (s.style === 'twice') { if (s.amOn) out.push(mins(s.am)); if (s.pmOn) out.push(mins(s.pm)); }
    else if (s.style === 'one') out.push(mins(s.one));
    else if (s.style === 'every') { var a = mins(s.from), b = mins(s.to), st = Math.max(15, +s.every || 60); if (b <= a) b += 1440; for (var m = a; m <= b && out.length < 96; m += st) out.push(m % 1440); }
    else (s.custom || []).slice(0, 8).forEach(function (t) { out.push(mins(t)); });
    out = out.filter(function (m, i, a) { return a.indexOf(m) === i; }).sort(function (x, y) { return x - y; });
    if (false && s.quiet && s.style === 'every') { var qa = mins(s.qFrom), qb = mins(s.qTo); out = out.filter(function (m) { return qa > qb ? !(m >= qa || m < qb) : !(m >= qa && m < qb); }); }
    return out;
  }
  K.notifySlots = slots;

  // ---------- what's left ----------
  function k66() { try { var st = K.k66 && K.k66.state(), r = st && st.run; return r && r.state === 'live' ? r : null; } catch (e) { return null; } }
  function left(dayKey, s, ahead) {
    var t = K.key(K.today()), isToday = dayKey === t, done = K.get('done', {}) || {}, gs = []; try { gs = K.goals() || []; } catch (e) {}
    var r = k66(), out = { k66: null, names: [], quit: 0, timed: [] };
    gs.forEach(function (g) {
      var d = !!(done[g.id] && done[g.id][dayKey]);
      if (g.quit) { if (!d && !((g.slips || []).indexOf(dayKey) >= 0)) out.quit++; return; }
      if (K.bd && K.bd.isMs && K.bd.isMs(g)) return;   // broken-down goals are tracked by milestones, not daily
      if (r && r.goal === g.id) { if (!(isToday ? r.todayDone : false) && !d) out.k66 = { name: g.name, day: isToday ? r.day : Math.min(66, r.day + (ahead || 1)) }; return; }
      if (!d && s.inc.habits) out.names.push(g.name);
    });
    if (r && out.k66 && !s.inc.k66) out.k66 = null;
    if (s.inc.todos) {
      var p = K.plan ? K.plan(dayKey) : null;
      (p && p.items || []).forEach(function (x) { if (!x.done) out.names.push(x.txt); });
      (K.todosFor ? K.todosFor(dayKey) : []).forEach(function (x) { if (!x.done) { out.names.push(x.txt); if (x.time) out.timed.push(mins(x.time)); } });
    }
    if (!s.inc.quit) out.quit = 0;
    return out;
  }
  K.notifyLeft = left;
  var TITLES = ['%n left today', 'Still %n to go', '%n left. You’ve got this'];
  function message(l, slotMin, i, first) {
    var items = [], n = l.names.length + (l.k66 ? 1 : 0) + (slotMin >= 21 * 60 && l.quit ? 1 : 0);
    if (!n) return null;
    if (l.k66) items.push('Kaizen 66: ' + l.k66.name);
    if (slotMin >= 21 * 60 && l.quit) items.push(l.quit === 1 ? '1 quit check-in' : l.quit + ' quit check-ins');   // only checkable from 9 PM, so it goes near the top
    l.names.forEach(function (x) { items.push(x); });
    var body = items.slice(0, 4).map(function (x) { return String(x).slice(0, 60); }).join(', ') + (items.length > 4 ? ' +' + (items.length - 4) + ' more' : '');
    var title = l.k66 && (first || i % 3 === 0) ? 'Kaizen 66 · Day ' + l.k66.day + ' still open' : first ? (n === 1 ? '1 thing today' : n + ' things today') : TITLES[i % TITLES.length].replace('%n', n);
    return { title: title.slice(0, 80), body: body.slice(0, 240) };
  }
  // the reminders for the next days, newest-first-capped
  function plan(now) {
    var s = settings(); now = now || new Date();
    if (!s.on) return [];
    var sl = slots(s), out = [], t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (var d = 0; d < 7 && out.length < CAP; d++) {
      var day = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + d), dk = K.key(day);
      if (!s.days[day.getDay()]) continue;
      var l = left(dk, s, d), i = 0;
      if (d === 0 && s.stop && !l.names.length && !l.k66 && !(l.quit && sl.some(function (m) { return m >= 21 * 60; }))) continue;   // all done today: no more today
      sl.forEach(function (m, si) {
        if (out.length >= CAP) return;
        var at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60);
        if (at <= now) return;
        if (l.timed.some(function (tm) { return Math.abs(tm - m) <= 10; })) return;   // a timed to-do has its own reminder
        var msg = message(l, m, i++, si === 0); if (!msg) return;
        out.push({ id: 'kzn-' + dk.replace(/-/g, '') + '-' + hhmm(m).replace(':', ''), at: at.getTime(), title: msg.title, body: msg.body });
      });
    }
    return out;
  }
  K.notifyPlan = plan;
  var tm = 0, lastSig = '';
  function sync(ask) {
    clearTimeout(tm); tm = setTimeout(function () {
      var items = [], s = settings(); try { items = plan(); } catch (e) {}
      var sig = JSON.stringify([s.on, items]); if (sig === lastSig && !ask) return; lastSig = sig;
      post({ type: 'notifySync', on: !!s.on, ask: !!ask, items: items });
      window.__kzNotifyLast = { on: !!s.on, items: items };
    }, ask ? 0 : 400);
  }
  K.notifySync = sync;

  // ---------- the sheet ----------
  var layer = null;
  function summary(s) {
    if (!s.on) return 'Off';
    if (s.style === 'twice') return [s.amOn ? fmt(s.am) : '', s.pmOn ? fmt(s.pm) : ''].filter(Boolean).join(' + ') || 'Off';
    if (s.style === 'one') return fmt(s.one);
    if (s.style === 'every') return s.every < 60 ? 'Every ' + s.every + ' min' : s.every === 60 ? 'Every hour' : 'Every ' + (s.every / 60) + ' h';
    return (s.custom || []).length + ' times a day';
  }
  K.notifySummary = function () { return summary(settings()); };
  function chip(on, attr, label) { return '<button type="button" class="kzn-chip' + (on ? ' on' : '') + '" ' + attr + ' aria-pressed="' + !!on + '">' + label + '</button>'; }
  function body(s) {
    var D = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var row2 = function (t, sub, input) { return '<label class="kzn-row kzn2-r"><span><b>' + t + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' + input + '</label>'; };
    var sw = function (attr, on) { return '<input type="checkbox" class="kz-sw49" ' + attr + (on ? ' checked' : '') + '>'; };
    var tm = function (attr, v, lab) { return '<input type="time" ' + attr + ' value="' + esc(v) + '" aria-label="' + lab + '">'; };
    var h = '<h2 class="kzsw-t" id="kzn-t">Reminders</h2><p class="kzsw-p dim">A nudge with what’s still left today. Check it all off and they stop.</p>';
    h += '<div class="kzn-card kzn2-master">' + row2('Send me reminders', s.on ? summary(s) : 'Off', sw('data-n="on"', s.on)).replace('kzn-row kzn2-r', 'kzn-row kzn2-r big2') + '</div>';
    h += '<div class="kzn-body"' + (s.on ? '' : ' hidden') + '>';
    var ST = [['twice', 'Twice a day', 'One in the morning, one in the evening.'], ['one', 'Once a day', 'One reminder at a time you pick.'], ['every', 'Repeating', 'Every so often, between a start and end time.'], ['custom', 'Pick times', 'Up to 8 times you choose.']];
    var cur = ST.filter(function (x) { return x[0] === s.style; })[0] || ST[0];
    h += '<p class="kzn-lab">When</p><div class="kzn-seg kzn2-style">' + ST.map(function (x) { return chip(s.style === x[0], 'data-n-style="' + x[0] + '"', x[1]); }).join('') + '</div><p class="kzn2-hint">' + cur[2] + '</p>';
    if (s.style === 'twice') h += '<div class="kzn-card">' + row2('Morning', '', tm('data-n="am"', s.am, 'Morning time') + sw('data-n="amOn"', s.amOn)) + row2('Evening', '', tm('data-n="pm"', s.pm, 'Evening time') + sw('data-n="pmOn"', s.pmOn)) + '</div>';
    if (s.style === 'one') h += '<div class="kzn-card">' + row2('Time', '', tm('data-n="one"', s.one, 'Reminder time')) + '</div>';
    if (s.style === 'every') h += '<div class="kzn-card"><div class="kzn2-every"><span class="kzn2-el">Every</span><div class="kzn-seg kzn2-int">' + [15, 30, 60, 120, 180].map(function (m) { return chip(+s.every === m, 'data-n-every="' + m + '" aria-label="Every ' + (m < 60 ? m + ' minutes' : m === 60 ? 'hour' : (m / 60) + ' hours') + '"', m < 60 ? m + ' min' : (m / 60) + ' hr'); }).join('') + '</div></div>' +
      row2('Start', '', tm('data-n="from"', s.from, 'Start time')) + row2('End', 'Nothing after this until the next day', tm('data-n="to"', s.to, 'End time')) + '</div>' +
      (+s.every <= 30 ? '<p class="kzn-warn">That’s a lot of buzzing. If it gets annoying, try every hour.</p>' : '');
    if (s.style === 'custom') h += '<div class="kzn-card">' + (s.custom || []).map(function (t, i) { return '<label class="kzn-row kzn2-r"><span><b>Time ' + (i + 1) + '</b></span>' + tm('data-n-c="' + i + '"', t, 'Time ' + (i + 1)) + '<button type="button" class="kzn-x" data-n-cdel="' + i + '" aria-label="Remove time ' + (i + 1) + '">×</button></label>'; }).join('') +
      ((s.custom || []).length < 8 ? '<button type="button" class="kzn-add" data-n-cadd>+ Add a time</button>' : '') + '</div>';
    var dn = s.days.filter(Boolean).length, wk = s.days.join('');
    var dl = dn === 7 ? 'Every day' : wk === '0111110' ? 'Weekdays' : wk === '1000001' ? 'Weekends' : dn === 1 ? DN[s.days.indexOf(1)] + 's only' : dn + ' days a week';
    h += '<div class="kzn2-labrow"><p class="kzn-lab">Days</p><span class="kzn2-dl">' + dl + '</span></div><div class="kzn-days">' + D.map(function (d, i) { return chip(s.days[i], 'data-n-day="' + i + '" aria-label="' + DN[i] + '"', d); }).join('') + '</div>';
    h += '<p class="kzn-lab">Remind me about</p><div class="kzn-card">' + [['k66', 'Kaizen 66', 'Your 66-day goal, if you’ve started one'], ['habits', 'Goals and habits', 'The ones not checked off yet'], ['todos', 'To-dos and plan', 'What’s still open on today’s list'], ['quit', 'Quit check-in', 'Added from 9 PM, when you can check in']].map(function (x) { return row2(x[1], x[2], sw('data-n-inc="' + x[0] + '"', s.inc[x[0]])); }).join('') +
      row2('Stop once it’s all done', 'No more reminders that day after you finish', sw('data-n="stop"', s.stop)) + '</div>';
    var nx = plan()[0];
    h += '<p class="kzn-lab">Next reminder</p><div class="kzn-prev">' + (nx ? '<span class="kzn-app">KAIZEN · ' + esc(new Date(nx.at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })) + '</span><b>' + esc(nx.title) + '</b><span>' + esc(nx.body) + '</span>' : '<span>Nothing left to remind you about today.</span>') + '</div>';
    h += '</div><div class="kzsw-acts"><button type="button" class="kzsw-btn gold" data-n-done>Done</button></div>';
    return h;
  }
  function paint() { if (!layer) return; var s = settings(), box = layer.querySelector('.kzsw'), y = box.scrollTop; box.innerHTML = '<i class="kzsw-grab" aria-hidden="true"></i>' + body(s); box.scrollTop = y; }
  function open() {
    if (layer) return;
    layer = document.createElement('div'); layer.className = 'kzsw-back kzn-sheet'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-labelledby', 'kzn-t');
    layer.innerHTML = '<div class="kzsw"></div>'; document.body.appendChild(layer); paint();
    requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
    layer.addEventListener('click', onClick); layer.addEventListener('change', onChange);
  }
  function close() { if (!layer) return; var l = layer; layer = null; l.classList.remove('on'); setTimeout(function () { l.remove(); }, 280); paintRow(); }
  function set(fn) { var s = settings(); fn(s); save(s); paint(); paintRow(); sync(false); }
  function onClick(e) {
    if (e.target === layer || e.target.closest('[data-n-done]')) { close(); return; }
    if (e.target.closest('.kzsw-p')) return;
    var b;
    if ((b = e.target.closest('[data-n-style]'))) set(function (s) { s.style = b.getAttribute('data-n-style'); });
    else if ((b = e.target.closest('[data-n-every]'))) set(function (s) { s.every = +b.getAttribute('data-n-every'); });
    else if ((b = e.target.closest('[data-n-day]'))) set(function (s) { var i = +b.getAttribute('data-n-day'); s.days[i] = s.days[i] ? 0 : 1; if (!s.days.some(Boolean)) s.days[i] = 1; });
    else if ((b = e.target.closest('[data-n-cdel]'))) set(function (s) { s.custom.splice(+b.getAttribute('data-n-cdel'), 1); });
    else if (e.target.closest('[data-n-cadd]')) set(function (s) { var last = s.custom.length ? mins(s.custom[s.custom.length - 1]) : 7 * 60; s.custom.push(hhmm(Math.min(23 * 60, last + 120))); });
    else return;
    post({ type: 'tick' });
  }
  function onChange(e) {
    var t = e.target, k = t.getAttribute('data-n'), inc = t.getAttribute('data-n-inc'), c = t.getAttribute('data-n-c');
    if (k === 'on') { var s0 = settings(); s0.on = t.checked ? 1 : 0; save(s0); paint(); paintRow(); sync(!!t.checked); if (!t.checked) post({ type: 'remindersOff' }); return; }
    if (k) set(function (s) { s[k] = t.type === 'checkbox' ? (t.checked ? 1 : 0) : t.value; });
    else if (inc) set(function (s) { s.inc[inc] = t.checked ? 1 : 0; });
    else if (c != null) set(function (s) { s.custom[+c] = t.value; s.custom.sort(); });
  }
  // Me → Reminders: open this sheet instead of the old one, and show the summary on the row
  function remRow() { var rows = document.querySelectorAll('#kz-me .kz-set-row'); for (var i = 0; i < rows.length; i++) if (/^\s*Reminders/.test(rows[i].textContent)) return rows[i]; return null; }
  function paintRow() { var r = remRow(), em = r && r.querySelector('em'); if (em) { var v = summary(settings()); if (em.textContent !== v) em.textContent = v; } }
  document.addEventListener('click', function (e) { var r = remRow(); if (r && (e.target === r || r.contains(e.target))) { e.preventDefault(); e.stopImmediatePropagation(); post({ type: 'tick' }); open(); } }, true);
  K.openNotify = open;

  // ---------- keep the phone's reminders in step ----------
  ['kz:step', 'kz:changed', 'kz:goals', 'kz:todos', 'kz:k66', 'kz:plan'].forEach(function (n) { document.addEventListener(n, function () { sync(false); }); });
  window.addEventListener('pageshow', function () { sync(false); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(false); });
  var dayAt = K.key(K.today()); setInterval(function () { var k = K.key(K.today()); if (k !== dayAt) { dayAt = k; sync(false); } }, 60000);
  function boot() { paintRow(); if (document.getElementById('kz-today-s1') || document.getElementById('kz-me')) sync(false); var n = 0, t = setInterval(function () { paintRow(); if (++n > 10) clearInterval(t); }, 300); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
