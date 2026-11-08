/* Nov 2 · Day card C "The day's climb" (James): one total for everything done that day plus the feet it earned and a gold-to-orange
   bar; the goals (done and missed) in one list; the day plan, to-dos, journal and notes one tap away. Replaces kzday-1027c.js.
   Oct 27 · James on Progress → a day: "make this easier to understand". kzprog draws the day (date, "Rough day · 2 of 8
   goals", the goals done, "Day plan 3 of 5 done ·", "To-dos done", Journal link, plus "lost water"/"grew" from the old tree).
   This re-lays it as: the date with a coloured day badge (Great / Good / Rough), three tiles with rings
   (Goals 2/8 · Plan 3/5 · To-dos N), a "Goals done" list with gold checks, the to-dos as chips, and the journal link as a
   gold pill. The old water/inches line is gone (that tree was retired). Data is read from what kzprog drew, so it always
   matches; every redraw is re-dressed. Styles: kzday-1027.css */
(function () {
  if (window.__kzday1102) return; window.__kzday1102 = 1;   /* Oct 27 c: + goals missed and to-dos not done on that day. Oct 27 b: replaces kzday-1027.js (to-dos one per line, numbers centred in the rings) */
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
      out.realTodos = out.todos.length; var pl = K.plan ? K.plan(k) : null; if (pl && pl.items) pl.items.forEach(function (x) { if (!x.done && x.txt) out.todos.push(x.txt); });
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
    var miss = missed(body, goals), ftM = /\+([\d,]+)\s*ft/.exec((body.querySelector('.kz-ds-head span') || {}).textContent || '');
    var D = g0 + (plan ? plan[0] : 0) + todos.length, T = Math.max(D, g1 + (plan ? plan[1] : 0) + todos.length + (miss.realTodos || 0)), pct = T ? Math.round(D / T * 100) : 0;
    var li = function (t, m) { return '<li' + (m ? ' class="kzdy-x"' : '') + '><i aria-hidden="true"></i><span>' + esc(t) + '</span></li>'; };
    var row = function (lbl, val, inner) { return '<details class="kzdy-more"><summary><b>' + lbl + '</b><em>' + esc(val) + '</em></summary>' + inner + '</details>'; };
    var h = '<div class="kzd2-h"><b>' + esc(head.textContent) + '</b>' + (mood ? '<span class="kzd2-mood ' + tone + '">' + esc(mood) + '</span>' : '') + '</div>';
    if (T) h += '<div class="kzdy-n"><b>' + D + ' of ' + T + '</b>' + (ftM ? '<em>+' + ftM[1] + ' ft</em>' : '') + '</div><span class="kzdy-bar" role="img" aria-label="' + D + ' of ' + T + ' done, ' + pct + ' percent"><i style="width:' + pct + '%"></i></span>';
    h += '<div class="kzd2-sec kzdy-g"><em>Goals · ' + g0 + ' of ' + g1 + '</em>' + ((goals.length || miss.goals.length) ? '<ul>' + goals.map(function (t) { return li(t); }).join('') + miss.goals.map(function (t) { return li(t, 1); }).join('') + '</ul>' : '<p>No goals that day</p>') + '</div>';
    var pTodo = miss.todos.slice(miss.realTodos || 0), rTodo = miss.todos.slice(0, miss.realTodos || 0);
    if (plan) h += row('Day plan', plan[0] + ' of ' + plan[1], '<p class="kzdy-p">' + plan[0] + ' of ' + plan[1] + ' done' + (pTodo.length ? '' : ' · all done') + '</p>' + (pTodo.length ? '<ul>' + pTodo.map(function (t) { return li(t, 1); }).join('') + '</ul>' : ''));
    if (todos.length || rTodo.length) h += row('To-dos', todos.length + ' done' + (rTodo.length ? ' · ' + rTodo.length + ' left' : ''), '<ul>' + todos.map(function (t) { return li(t); }).join('') + rTodo.map(function (t) { return li(t, 1); }).join('') + '</ul>');
    var box = body.querySelector(':scope > .kzd2'); if (!box) { box = document.createElement('div'); body.appendChild(box); } box.className = 'kzd2 kzdy';
    box.innerHTML = h;
    if (link) { var l = link.cloneNode(true); l.className = 'kzd2-link'; box.appendChild(l); }
    other.forEach(function (s) { var lb = s.querySelector('.kz-ds-lbl'), d = document.createElement('details'), sm = document.createElement('summary'), c = s.cloneNode(true);
      d.className = 'kzdy-more'; sm.innerHTML = '<b>' + esc(lb ? lb.textContent : '') + '</b><em>' + (/journal/i.test(lb ? lb.textContent : '') ? 'Written' : 'Read') + '</em>'; var cl = c.querySelector('.kz-ds-lbl'); if (cl) cl.remove(); c.classList.add('kzd2-keep');
      d.appendChild(sm); d.appendChild(c); box.appendChild(d); });
    body.classList.add('kzd2-on'); body.__kzd = body.textContent;
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kz-ds-body'), dress); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzd2')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, characterData: true });
  soon();
})();
