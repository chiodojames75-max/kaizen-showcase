/* Oct 28 · replaces kzorder-1026m.js: smoother hold-to-move (no per-frame re-measure, no-bounce glide). */
/* Oct 26 m (from f: drag a task anywhere in the day, across Morning, Afternoon, Evening, Night and Anytime, with a dashed outline where it will land). Oct 26 (f, from e: Today mirrors the Plan tab's order exactly, to-dos mixed in by part of day and your order) (e, from d: re-applies whenever anything re-sorts the rows, so card corners follow the final order) (d, from b: Plan tab redesign support: group ends, checks on plan tasks, trimmed subtitles). Reorder a day's tasks.
   Plan tab: press and hold a task (0.4 s), drag it up or down inside its part of the day (Morning, Afternoon,
   Evening, Night, Anytime), let go. The others slide out of the way; each step gives a light tap.
   The order is saved per day in kz_order {"2026-10-26": ["p:<plan item id>", "t:<to-do id>", ...]}.
   Tasks without a saved place keep their usual order, after the ones you placed (a new to-do lands at the bottom
   of its group). Today shows the plan's tasks and your added to-dos in that same order.
   m: dragging a task into another part of the day moves it there (see the drag below). */
(function () {
  var K = window.KZ; if (!K || window.__kzOrd) return; window.__kzOrd = 1;
  var GR = [['am', 'Morning'], ['pm', 'Afternoon'], ['eve', 'Evening'], ['night', 'Night'], ['any', 'Anytime']];
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  function today() { try { return K.key(K.today()); } catch (e) { return ''; } }
  function orders() { try { return K.get('order', {}) || {}; } catch (e) { return {}; } }
  function save(day, keys) {
    var m = orders(), cut = '';
    try { cut = K.key(K.addDays(K.today(), -14)); } catch (e) {}
    Object.keys(m).forEach(function (d) { if (cut && d < cut) delete m[d]; });   // keep two weeks back
    m[day] = keys; K.set('order', m);
    post({ type: 'dirty' });
  }
  function rankOf(day) { var r = {}; (orders()[day] || []).forEach(function (k, i) { r[k] = i; }); return r; }
  function sortedPlanIds(day) {
    try { var p = K.plan && K.plan(day); return p ? p.items.slice().sort(K.planSort).map(function (x) { return x.id; }) : []; } catch (e) { return []; }
  }

  /* ---------------- Plan tab ---------------- */
  function grpOf(li) {   // same rule the Plan tab uses to group (kzpm-1025l)
    var sm = li.querySelector('.kz-tbody small:not(.kzq-sub)'), tx = sm ? sm.textContent.split('·')[0].trim() : '';
    for (var i = 0; i < 4; i++) if (tx === GR[i][1] || (K.partName && tx === K.partName(GR[i][0]))) return i;
    var m = tx.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) { var h = +m[1] % 12 + (/pm/i.test(m[3] || '') ? 12 : 0); if (!m[3]) h = +m[1]; return h < 12 ? 0 : h < 17 ? 1 : h < 21 ? 2 : 3; }
    return 4;
  }
  var page, list, week;
  function planDay() { var b = week && week.querySelector('[aria-selected="true"]'); return b && b.getAttribute('data-day'); }
  function planItems() {
    var day = planDay(), ids = sortedPlanIds(day), pi = 0;
    return [].slice.call(list.querySelectorAll(':scope > li.kz-todo')).map(function (li, i) {
      var k = li.getAttribute('data-todo') ? 't:' + li.getAttribute('data-todo') : (li.classList.contains('plan') && ids[pi] ? 'p:' + ids[pi++] : '');
      if (k && li.getAttribute('data-kzk') !== k) li.setAttribute('data-kzk', k);
      return { li: li, k: k, g: grpOf(li), i: i };
    });
  }
  function applyPlan() {
    if (!list) return;
    var day = planDay(); if (!day) return;
    var r = rankOf(day), arr = planItems(), last = -1;
    arr.forEach(function (x) { x.r = x.k && r[x.k] != null ? r[x.k] : 1000 + x.i; });
    arr.sort(function (a, b) { return a.g - b.g || a.r - b.r || a.i - b.i; });
    arr.forEach(function (x, j) {
      if (x.li.style.order !== String(j)) x.li.style.order = String(j);
      var lab = x.g !== last ? GR[x.g][1] : ''; last = x.g;
      if ((x.li.getAttribute('data-kzlab') || '') !== lab) { if (lab) x.li.setAttribute('data-kzlab', lab); else x.li.removeAttribute('data-kzlab'); }
    });
    // d: the last task of each group closes its card; rows read the same
    arr.forEach(function (x, j) {
      var end = !arr[j + 1] || arr[j + 1].g !== x.g;
      if (x.li.hasAttribute('data-kzend') !== end) { if (end) x.li.setAttribute('data-kzend', ''); else x.li.removeAttribute('data-kzend'); }
      dress(x, day);
    });
    return arr;
  }
  var TICK = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  function dress(x, day) {
    var li = x.li, sm = li.querySelector('.kz-tbody small:not(.kzq-sub)'), grp = GR[x.g][1];
    // subtitle: drop what the group heading already says and "from your plan"; keep an exact time or a date span.
    // The original <small> stays untouched (hidden): the Plan tab's own grouping reads it.
    if (sm) {
      var parts = sm.textContent.split('·').map(function (t) { return t.trim(); }).filter(function (t) { return t && !/^from your plan$/i.test(t) && !GR.some(function (g) { return t === g[1]; }); });
      var shown = parts.join(' · '), sub = li.querySelector('.kzq-sub');
      if (!sm.classList.contains('kzq-raw')) sm.classList.add('kzq-raw');
      if (!sub) { sub = document.createElement('small'); sub.className = 'kzq-sub'; sm.parentNode.insertBefore(sub, sm.nextSibling); }
      if (sub.textContent !== shown) sub.textContent = shown;
      if (sub.hidden !== !shown) sub.hidden = !shown;
    }
    // plan tasks get the same check as to-dos (today only, like to-dos)
    if (x.k && x.k.indexOf('p:') === 0 && day === today()) {
      var id = x.k.slice(2), it = null; try { it = (K.plan(day).items || []).filter(function (y) { return y.id === id; })[0]; } catch (e) {}
      var b = li.querySelector('.kzq-chk');
      if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'kzq-chk'; b.setAttribute('data-kzq-pid', id); b.innerHTML = TICK; li.appendChild(b); }
      var on = !!(it && it.done);
      if (b.classList.contains('on') !== on) b.classList.toggle('on', on);
      if (li.classList.contains('done') !== on) li.classList.toggle('done', on);
      b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', (on ? 'Undo: ' : 'Done: ') + ((it && it.txt) || ''));
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzq-chk'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var day = planDay(); if (!day || !K.togglePlanItem) return;
    K.togglePlanItem(day, b.getAttribute('data-kzq-pid'));
    post({ type: 'haptic', n: b.classList.contains('on') ? 1 : 2 }); post({ type: 'dirty' });
  }, true);
  // m: drag anywhere. Hold a task, then drag it up or down the whole day. Inside a part of the day the rows swap when
  // you pass half of a neighbour; past the last row of a part (or the first), the task steps into the next part of the
  // day, empty parts included, and the headings move with it. A dashed outline shows where it will land; the other
  // rows spring aside. Letting go in another part moves the task there (an exact time is cleared, since the time is
  // what put it in its old part). Past days only reorder inside a part.
  var HOLD = 380, drag = null, hold = null, startY = 0, startX = 0, curY = 0, eatClick = false;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function visual() { return applyPlan() || []; }
  function layoutTop(li) { var p = li.offsetParent; return (p ? p.getBoundingClientRect().top + scrollY : 0) + li.offsetTop; }
  function relabel(a) {   // the working order on screen: flex order, group headings, card ends
    a.forEach(function (x, j) {
      if (x.li.style.order !== String(j)) x.li.style.order = String(j);
      var lab = !a[j - 1] || a[j - 1].g !== x.g ? GR[x.g][1] : '';
      if ((x.li.getAttribute('data-kzlab') || '') !== lab) { if (lab) x.li.setAttribute('data-kzlab', lab); else x.li.removeAttribute('data-kzlab'); }
      var end = !a[j + 1] || a[j + 1].g !== x.g;
      if (x.li.hasAttribute('data-kzend') !== end) { if (end) x.li.setAttribute('data-kzend', ''); else x.li.removeAttribute('data-kzend'); }
    });
  }
  function ghostAt() {
    var d = drag, li = d.m.li, p = li.offsetParent; if (!p || !d.ghost) return;
    var r = p.getBoundingClientRect(), s = d.ghost.style;
    var lab = li.getAttribute('data-kzlab') || ''; if ((d.ghost.getAttribute('data-lab') || '') !== lab) { if (lab) d.ghost.setAttribute('data-lab', lab); else d.ghost.removeAttribute('data-lab'); }
    d.gtop = li.offsetTop;
    s.position = 'absolute'; s.top = (r.top + scrollY + li.offsetTop) + 'px'; s.left = (r.left + scrollX + li.offsetLeft) + 'px';   // pinned to the page: scrolling never moves it s.width = li.offsetWidth + 'px'; s.height = li.offsetHeight + 'px';
  }
  function begin(li) {
    var all = visual(), me = all.filter(function (x) { return x.li === li; })[0]; if (!me || !me.k) return;
    var day = planDay(), cross = !!day && day >= today();
    if (!cross && all.filter(function (x) { return x.g === me.g && x.k; }).length < 2) return;
    var items = all.map(function (x) { return { li: x.li, k: x.k, g: x.g }; });
    drag = { li: li, items: items, day: day, cross: cross, sy0: scrollY, y0: startY, top0: layoutTop(li), orig: items.map(function (x) { return x.k + x.g; }).join() };
    drag.m = items.filter(function (x) { return x.li === li; })[0]; drag.g0 = drag.m.g;
    var gh = document.createElement('div'); gh.className = 'kzo-ghost'; gh.setAttribute('aria-hidden', 'true'); document.body.appendChild(gh); drag.ghost = gh;
    li.classList.add('kzo-lift'); document.documentElement.classList.add('kzo-dragging');
    try { var sel = getSelection(); if (sel) sel.removeAllRanges(); } catch (e) {}
    post({ type: 'haptic', n: 1 }); try { navigator.vibrate(8); } catch (e) {}
    curY = startY; ghostAt(); requestAnimationFrame(function () { if (drag && drag.ghost) drag.ghost.classList.add('on'); }); loop();
  }
  function follow() {
    var d = drag, dy = d.top0 + (curY - d.y0) + (scrollY - d.sy0) - layoutTop(d.li);
    d.dy = dy; d.li.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0) scale(1.02)';
  }
  function change(fn) {   // FLIP: everyone but the lifted row springs from where it was to its new place
    var d = drag, others = d.items.filter(function (x) { return x !== d.m; }), before = others.map(function (x) { return x.li.getBoundingClientRect().top; });
    fn(); relabel(d.items); follow(); ghostAt();
    others.forEach(function (x, j) {
      var dl = before[j] - x.li.getBoundingClientRect().top; if (Math.abs(dl) < .5 || reduce || !x.li.animate) return;
      x.li.animate([{ transform: 'translate3d(0,' + dl.toFixed(1) + 'px,0)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,.8,.24,1)' });   // Oct 28: glide, no bounce (same as sections)
    });
    post({ type: 'tick' }); try { navigator.vibrate(4); } catch (e) {}
  }
  function step() {
    var d = drag, a = d.items, m = d.m, i = a.indexOf(m), li = m.li;
    var T = li.offsetTop, H = li.offsetHeight, c = T + H / 2 + (d.dy || 0), D = Math.max(H * .55, 30);
    var prev = a[i - 1], next = a[i + 1];
    var mid = function (x) { return x.li.offsetTop + x.li.offsetHeight / 2; };
    if (next && next.g === m.g && c > mid(next)) return change(function () { a[i] = next; a[i + 1] = m; });
    if (prev && prev.g === m.g && c < mid(prev)) return change(function () { a[i] = prev; a[i - 1] = m; });
    if (!d.cross) return;
    // past the edge of its part of the day: step into the next part (headings move, nothing swaps)
    if (c > T + H / 2 + D && m.g < 4 && (!next || next.g > m.g)) return change(function () { m.g++; });
    if (c < T + H / 2 - D && m.g > 0 && (!prev || prev.g < m.g)) return change(function () { m.g--; });
  }
  function loop() {
    if (!drag) return;
    var edge = 90, vh = innerHeight, y = curY;
    if (y < edge) scrollBy(0, -Math.ceil((edge - y) / 5)); else if (y > vh - edge) scrollBy(0, Math.ceil((y - (vh - edge)) / 5));
    follow(); step(); if (drag && drag.li.offsetTop !== drag.gtop) ghostAt(); requestAnimationFrame(loop);   // Oct 28: the ghost re-measures only when the row's slot moved (it re-measured every frame: a layout per frame)
  }
  function move(y) { curY = y; }
  function end(commit) {
    var d = drag; drag = null; if (!d) return;
    var li = d.li, from = d.dy || 0, gh = d.ghost;
    li.classList.remove('kzo-lift'); document.documentElement.classList.remove('kzo-dragging');
    li.style.transform = '';
    if (gh) { gh.classList.remove('on'); setTimeout(function () { gh.remove(); }, 220); }
    if (li.animate && !reduce && Math.abs(from) > .5) li.animate([{ transform: 'translate3d(0,' + from.toFixed(1) + 'px,0) scale(1.02)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.25,1.05)' });
    var moved = d.items.map(function (x) { return x.k + x.g; }).join() !== d.orig;
    if (commit && moved) {
      save(d.day, d.items.filter(function (x) { return x.k; }).map(function (x) { return x.k; }));
      if (d.m.g !== d.g0) {
        var part = GR[d.m.g][0], t = findTask(d.day, d.m.k), had = !!(t && t.time);
        saveTask(d.day, d.m.k, d.m.k.indexOf('p:') === 0 ? { part: part, t: undefined } : { part: part, time: '' });
        try { K.toast('Moved to ' + GR[d.m.g][1] + (had ? ' · exact time cleared' : '')); } catch (e) {}
      }
      post({ type: 'haptic', n: 2 });
    }
    applyPlan();
  }
  function planBoot() {
    page = document.getElementById('kz-plan-s1'); if (!page) return;
    list = page.querySelector('[data-p="day-list"]'); week = page.querySelector('[data-p="week"]'); if (!list || !week) return;
    list.classList.add('kzo-list');
    // run after the Plan tab's own grouping pass (its observer may fire after ours in the same batch)
    var soonPlan = function () { if (!drag) queueMicrotask(function () { if (!drag) applyPlan(); }); };
    new MutationObserver(soonPlan).observe(list, { childList: true });
    new MutationObserver(soonPlan).observe(week, { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    // e: the Plan tab's own grouping pass can run after ours and re-sort the rows (style order / data-kzlab).
    // Whenever a row's order or heading changes, apply ours again; our writes are no-ops when nothing differs, so this settles.
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.parentNode === list && (ms[i].attributeName === 'style' || ms[i].attributeName === 'data-kzlab')) { soonPlan(); return; } } })
      .observe(list, { subtree: true, attributes: true, attributeFilter: ['style', 'data-kzlab'] });
    applyPlan();
    list.addEventListener('touchstart', function (e) {
      var li = e.target.closest && e.target.closest('li.kz-todo'); if (!li || e.touches.length !== 1) return;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      clearTimeout(hold); hold = setTimeout(function () { hold = null; begin(li); }, HOLD);
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; if (!t) return;
      if (hold && (Math.abs(t.clientX - startX) > 8 || Math.abs(t.clientY - startY) > 8)) { clearTimeout(hold); hold = null; }
      if (drag) { e.preventDefault(); e.stopPropagation(); move(t.clientY); }
    }, { passive: false, capture: true });
    function up(e) { clearTimeout(hold); hold = null; if (drag) { eatClick = true; setTimeout(function () { eatClick = false; }, 400); if (e && e.cancelable) e.preventDefault(); end(e.type !== 'touchcancel'); } }
    document.addEventListener('touchend', up, { capture: true });
    document.addEventListener('touchcancel', up, { capture: true });
    window.addEventListener('click', function (e) { if (eatClick) { eatClick = false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.kzo-list li')) e.preventDefault(); }, true);
  }

  /* ---------------- Today ---------------- */
  var tq = 0;
  function partIdx(part, time) {   // the Plan tab's grouping: exact time by the hour, else the part of the day; none = Anytime
    if (time) { var h = +String(time).split(':')[0]; return h < 12 ? 0 : h < 17 ? 1 : h < 21 ? 2 : 3; }
    return { am: 0, pm: 1, eve: 2, night: 3 }[part] != null ? { am: 0, pm: 1, eve: 2, night: 3 }[part] : 4;
  }
  function applyToday() {
    var ol = document.querySelector('.kz-todosec .kz-plancard:not([hidden]) .kz-plan-list'); if (!ol) return;
    var day = today(), r = rankOf(day), ids = sortedPlanIds(day);
    var lis = [].slice.call(ol.querySelectorAll(':scope > li')); if (!lis.length) return;
    var info = {}, timeOf = {};
    try { (K.plan(day) || { items: [] }).items.forEach(function (it) { info['p:' + it.id] = partIdx(it.part, it.t); if (it.t && K.fmtTime) timeOf['p:' + it.id] = K.fmtTime(it.t); }); } catch (e) {}
    var tlist = []; try { tlist = K.todos() || []; } catch (e) {}
    tlist.forEach(function (t) { info['t:' + t.id] = partIdx(t.part, t.time); });
    // default order when you haven't moved something: the plan's tasks as planned, then your to-dos as added (same as the Plan tab)
    var base = {}; ids.forEach(function (id, n) { base['p:' + id] = n; }); tlist.forEach(function (t, n) { base['t:' + t.id] = 500 + n; });
    function k(li) {
      if (li.classList.contains('kztd')) return 't:' + li.getAttribute('data-kztd');
      var b = li.querySelector('[data-pid]'); return b ? 'p:' + b.getAttribute('data-pid') : '';
    }
    // a plan task with an exact time shows that time (Today otherwise says only the part of the day)
    lis.forEach(function (li) { var key = k(li), tm = li.querySelector('time'); if (tm && timeOf[key] && tm.textContent !== timeOf[key]) tm.textContent = timeOf[key]; });
    var want = lis.map(function (li, n) {
      var key = k(li);
      return { li: li, g: info[key] != null ? info[key] : 4, r: key && r[key] != null ? r[key] : 1000 + (base[key] != null ? base[key] : n), n: n };
    }).sort(function (a, b) { return a.g - b.g || a.r - b.r || a.n - b.n; }).map(function (x) { return x.li; });
    for (var i = 0; i < want.length; i++) if (lis[i] !== want[i]) { want.forEach(function (li) { ol.appendChild(li); }); break; }
  }
  function todayBoot() {
    if (!document.querySelector('.kz-todosec')) return;
    applyToday();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) if (ms[i].target.closest && ms[i].target.closest('.kz-plan-list')) { if (!tq) tq = requestAnimationFrame(function () { tq = 0; applyToday(); }); return; }
    }).observe(document.body, { subtree: true, childList: true });
  }
  window.addEventListener('storage', function (e) { if (e.key === 'kz_order') { applyPlan(); applyToday(); } });

  /* ---------------- Edit a task (Plan tab: tap it) ----------------
     Rename it, move it to another part of the day or an exact time, or delete it. Plan tasks change for that day
     only (the repeating plan, if on, is untouched); to-dos change everywhere they show. */
  var PARTS = [['am', 'Morning'], ['pm', 'Afternoon'], ['eve', 'Evening'], ['night', 'Night'], ['any', 'Anytime']];
  function partFromTime(t) { var h = +String(t).split(':')[0]; return h < 12 ? 'am' : h < 17 ? 'pm' : h < 21 ? 'eve' : 'night'; }
  function findTask(day, key) {
    if (key.indexOf('p:') === 0) { var p = K.plan && K.plan(day); var it = p && p.items.filter(function (x) { return x.id === key.slice(2); })[0]; return it ? { kind: 'plan', it: it, txt: it.txt, part: it.part || 'any', time: it.t || '' } : null; }
    var t = (K.todos() || []).filter(function (x) { return x.id === key.slice(2); })[0];
    return t ? { kind: 'todo', it: t, txt: t.txt, part: t.part || 'any', time: t.time || '' } : null;
  }
  function saveTask(day, key, ch) {
    if (key.indexOf('p:') === 0) {
      var p = K.plan(day); if (!p) return;
      var items = p.items.map(function (x) { return x.id === key.slice(2) ? Object.assign({}, x, ch) : x; }).filter(function (x) { return !x.__del; });
      K.savePlan(day, items);
    } else {
      var all = K.todos().map(function (x) { return x.id === key.slice(2) ? Object.assign({}, x, ch) : x; }).filter(function (x) { return !x.__del; });
      K.set('todos', all); document.dispatchEvent(new CustomEvent('kz:todos')); document.dispatchEvent(new CustomEvent('kz:changed'));
    }
    post({ type: 'dirty' }); try { if (K.notifyPlan) K.notifyPlan(); } catch (e) {}
  }
  var sheet = null;
  function closeSheet() {
    if (!sheet) return; var s = sheet; sheet = null;
    s.classList.remove('in'); setTimeout(function () { s.remove(); }, 260);
    document.body.classList.remove('kz-noscroll'); post({ type: 'pageScroll', on: true });
  }
  function openSheet(day, key) {
    var t = findTask(day, key); if (!t) return;
    closeSheet();
    var el = document.createElement('div'); el.className = 'kzo-sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Edit task');
    el.innerHTML = '<div class="kzo-bd" data-kzo="x"></div><div class="kzo-card">' +
      '<div class="kzo-grab" aria-hidden="true"></div><div class="kzo-h"><b>Edit task</b><button type="button" class="kzo-x" data-kzo="x" aria-label="Close">✕</button></div>' +
      '<label class="kzo-f"><span>Task</span><input class="kzo-name" maxlength="90" autocomplete="off"></label>' +
      '<div class="kzo-f"><span>When</span><div class="kzo-parts" role="radiogroup" aria-label="Part of the day">' +
      PARTS.map(function (p) { return '<button type="button" role="radio" data-part="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="kzo-f kzo-timef"><span>Exact time</span><div class="kzo-trow"><input type="time" class="kzo-time"><button type="button" class="kzo-clear" data-kzo="clear">No exact time</button></div></div>' +
      '<button type="button" class="kzo-save" data-kzo="save">Save</button>' +
      '<button type="button" class="kzo-del" data-kzo="del">Delete task</button>' +
      (t.kind === 'plan' ? '<p class="kzo-note">Changes this day only.</p>' : '') + '</div>';
    document.body.appendChild(el); sheet = el;
    var name = el.querySelector('.kzo-name'), time = el.querySelector('.kzo-time'), part = t.part === 'night' || t.part === 'any' || t.part === 'am' || t.part === 'pm' || t.part === 'eve' ? t.part : 'any';
    name.value = t.txt || ''; time.value = t.time || '';
    function paint() {
      el.querySelectorAll('[data-part]').forEach(function (b) { var on = b.getAttribute('data-part') === part && !time.value; b.setAttribute('aria-checked', String(on)); b.classList.toggle('on', on); });
      el.querySelector('.kzo-clear').hidden = !time.value;
    }
    paint();
    el.addEventListener('input', function (e) { if (e.target === time) { if (time.value) part = partFromTime(time.value); paint(); } });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button,[data-kzo]'); if (!b) return;
      if (b.hasAttribute('data-part')) { part = b.getAttribute('data-part'); time.value = ''; paint(); post({ type: 'tick' }); return; }
      var a = b.getAttribute('data-kzo');
      if (a === 'x') return closeSheet();
      if (a === 'clear') { time.value = ''; paint(); return; }
      if (a === 'save') {
        var nm = name.value.trim(); if (!nm) { name.focus(); name.classList.add('kzo-need'); return; }
        var ch = t.kind === 'plan' ? { txt: nm, part: part, t: time.value || '' } : { txt: nm, part: part, time: time.value || '' };
        if (t.kind === 'plan' && !time.value) delete ch.t;
        saveTask(day, key, ch); post({ type: 'haptic', n: 2 }); closeSheet(); return;
      }
      if (a === 'del') {
        if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tap again to delete'; setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Delete task'; } }, 3000); return; }
        saveTask(day, key, { __del: 1 }); post({ type: 'haptic', n: 1 }); closeSheet();
      }
    });
    document.body.classList.add('kz-noscroll'); post({ type: 'pageScroll', on: false });
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
  }
  function editBoot() {
    if (!list) return;
    list.addEventListener('click', function (e) {
      if (eatClick || drag) return;
      if (e.target.closest('button,a,input')) return;   // the check and × keep their own jobs
      var li = e.target.closest('li.kz-todo'); if (!li) return;
      var day = planDay(), key = li.getAttribute('data-kzk'); if (!day || !key || day < today()) return;
      openSheet(day, key);
    });
  }
  function boot() { planBoot(); editBoot(); todayBoot(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
