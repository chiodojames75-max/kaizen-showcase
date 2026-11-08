/* Oct 27 · James on Progress → a day: "make this easier to understand". kzprog draws the day (date, "Rough day · 2 of 8
   goals", the goals done, "Day plan 3 of 5 done ·", "To-dos done", Journal link, plus "lost water"/"grew" from the old tree).
   This re-lays it as: the date with a coloured day badge (Great / Good / Rough), three tiles with rings
   (Goals 2/8 · Plan 3/5 · To-dos N), a "Goals done" list with gold checks, the to-dos as chips, and the journal link as a
   gold pill. The old water/inches line is gone (that tree was retired). Data is read from what kzprog drew, so it always
   matches; every redraw is re-dressed. Styles: kzday-1027.css */
(function () {
  if (window.__kzday) return; window.__kzday = 1;   /* Oct 27 c: + goals missed and to-dos not done on that day. Oct 27 b: replaces kzday-1027.js (to-dos one per line, numbers centred in the rings) */
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function ring(a, b, gold) {
    var p = b ? Math.min(1, a / b) : 0, R = 19, L = 2 * Math.PI * R;
    return '<svg class="kzd2-ring" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="' + R + '" class="t"/><circle cx="23" cy="23" r="' + R + '" class="f' + (gold ? ' g' : '') + '" stroke-dasharray="' + (L * p).toFixed(1) + ' ' + L.toFixed(1) + '" transform="rotate(-90 23 23)"/></svg>';
  }
  function dayKey() { var c = document.querySelector('.kz-cald.sel[data-day], [data-day].sel, [data-day][aria-pressed="true"], [data-day][aria-selected="true"]'); return c ? c.getAttribute('data-day') : ''; }
  function missed(body, doneNames) {
    var out = { goals: [], todos: [], today: false }, K = window.KZ, k = dayKey(); if (!K || !k) return out;
    var tk = K.key(K.today()); out.today = k === tk; if (k > tk) return out;
    try {
      var d = K.get('done', {}) || {}, have = {}; doneNames.forEach(function (n) { have[n] = 1; });
      (K.goals ? K.goals() : []).forEach(function (g) {
        var made = String(g.created || '').slice(0, 10); if (made && made > k) return;
        if (g.quit) return;   // Quit habits are check-ins, shown on Today only
        if (g.kind && g.kind !== 'daily' && g.kind !== 'long') return;
        if (!(d[g.id] && d[g.id][k]) && !have[g.name]) out.goals.push(g.name);
      });
      (K.todos ? K.todos() : []).forEach(function (t) {
        if (!(t.from <= k && k <= (t.to || t.from))) return;
        if (t.done && t.done <= k) return;   // done that day (or earlier)
        if (t.done && t.done > k && (t.to || t.from) > k) return;   // a multi-day to-do finished later: not missed that day
        out.todos.push(t.txt);
      });
      // the day's plan tasks (shown under To-dos on Today) that weren't ticked
      var pl = K.plan ? K.plan(k) : null; if (pl && pl.items) pl.items.forEach(function (x) { if (!x.done && x.txt) out.todos.push(x.txt); });
    } catch (e) {}
    return out;
  }
  function dress(body) {
    var head = body.querySelector('.kz-ds-head b'), sub = body.querySelector('.kz-ds-sub');
    if (!head) return;
    var sig = body.textContent; if (body.__kzd === sig) return;
    var goals = [].map.call(body.querySelectorAll('.kz-ds-goals li'), function (li) { return li.textContent.trim(); }).filter(Boolean);
    var subT = sub ? sub.textContent.trim() : '', mood = subT.split('·')[0].trim(), gm = /(\d+)\s+of\s+(\d+)\s+goal/.exec(subT);
    var plan = null, todos = [], link = null, other = [];
    [].forEach.call(body.querySelectorAll('.kz-ds-sec'), function (s) {
      var lbl = (s.querySelector('.kz-ds-lbl') || {}).textContent || '', a = s.querySelector('a');
      if (/plan/i.test(lbl)) { var pm = /(\d+)\s+of\s+(\d+)/.exec(s.textContent); if (pm) plan = [+pm[1], +pm[2]]; }
      else if (/to-?do/i.test(lbl)) {
        // Oct 27 b: one entry per <li> (the old text split glued them into one chip: "GymLunch 2Gym again…", count 1)
        var lis = s.querySelectorAll('li');
        if (lis.length) [].forEach.call(lis, function (li) { var t = li.textContent.trim(); if (t) todos.push(t); });
        else [].forEach.call(s.children, function (c) { if (c.classList.contains('kz-ds-lbl')) return; c.textContent.split('\n').forEach(function (t) { t = t.trim(); if (t) todos.push(t); }); });
      }
      else if (a) link = a;
      else other.push(s);
    });
    var tone = /great|perfect|full/i.test(mood) ? 'great' : /good/i.test(mood) ? 'good' : /rough|missed|off/i.test(mood) ? 'rough' : 'ok';
    var g0 = gm ? +gm[1] : goals.length, g1 = gm ? +gm[2] : goals.length;
    var h = '<div class="kzd2-h"><b>' + esc(head.textContent) + '</b>' + (mood ? '<span class="kzd2-mood ' + tone + '">' + esc(mood) + '</span>' : '') + '</div>' +
      '<div class="kzd2-tiles">' +
      '<div class="kzd2-t">' + '<span class="kzd2-rw">' + ring(g0, g1, true) + '<span class="kzd2-n"><b>' + g0 + '</b><small>/' + g1 + '</small></span></span><em>Goals</em></div>' +
      '<div class="kzd2-t">' + (plan ? '<span class="kzd2-rw">' + ring(plan[0], plan[1]) + '<span class="kzd2-n"><b>' + plan[0] + '</b><small>/' + plan[1] + '</small></span></span>' : '<span class="kzd2-none">—</span>') + '<em>Plan</em></div>' +
      '<div class="kzd2-t"><span class="kzd2-big">' + todos.length + '</span><em>To-dos done</em></div></div>';
var miss = missed(body, goals);
    if (goals.length || !miss.goals.length) h += '<div class="kzd2-sec"><em>Goals done</em>' + (goals.length ? '<ul>' + goals.map(function (t) { return '<li><i aria-hidden="true"></i><span>' + esc(t) + '</span></li>'; }).join('') + '</ul>' : '<p>None checked off this day</p>') + '</div>';
    // Oct 27 c: what made it a rough day — goals not checked off and to-dos left undone on that day
    if (miss.goals.length) h += '<div class="kzd2-sec kzd2-miss"><em>' + (miss.today ? 'Goals still to do' : 'Goals missed') + '</em><ul>' + miss.goals.map(function (t) { return '<li><i aria-hidden="true"></i><span>' + esc(t) + '</span></li>'; }).join('') + '</ul></div>';
    if (todos.length) h += '<div class="kzd2-sec"><em>To-dos done</em><ul class="kzd2-todos">' + todos.map(function (t) { return '<li><i aria-hidden="true"></i><span>' + esc(t) + '</span></li>'; }).join('') + '</ul></div>';   /* Oct 27 b: listed like the goals */
    if (miss.todos.length) h += '<div class="kzd2-sec kzd2-miss"><em>' + (miss.today ? 'To-dos still to do' : 'To-dos not done') + '</em><ul>' + miss.todos.map(function (t) { return '<li><i aria-hidden="true"></i><span>' + esc(t) + '</span></li>'; }).join('') + '</ul></div>';
    var box = body.querySelector(':scope > .kzd2'); if (!box) { box = document.createElement('div'); box.className = 'kzd2'; body.appendChild(box); }
    box.innerHTML = h;
    if (link) { var l = link.cloneNode(true); l.className = 'kzd2-link'; box.appendChild(l); }
    other.forEach(function (s) { var c = s.cloneNode(true); c.classList.add('kzd2-keep'); box.appendChild(c); });
    body.classList.add('kzd2-on'); body.__kzd = body.textContent;
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kz-ds-body'), dress); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzd2')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, characterData: true });
  soon();
})();
