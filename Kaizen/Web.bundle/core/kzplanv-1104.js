/* Nov 4: kzplanv-1104 = kzplanv-1027 + drag to reorder (grip on each row). */

(function () {
  var K = window.KZ, root = document.getElementById('kz-planner'); if (!K || !root || root.dataset.on) return; root.dataset.on = 1;
  document.body.appendChild(root);
  var $ = function (k) { return root.querySelector('[data-t="' + k + '"]'); };
  var tdK = K.key(K.today()), tmK = K.planTargetKey(), pDay = tmK, rows = [], lockedDay = false;
  var fmtT = function (it) { return it.part && it.part !== 'any' ? K.partName(it.part) : 'Anytime'; };
  var CHK = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  // Full view: the plan laid out big, check things off as the day goes.
  var vDay = tdK;
  function paintView() {
    var st = K.planStats(vDay), p = K.plan(vDay), live = vDay === tdK; if (!p) { closeView(); return; }
    var d = new Date(vDay + 'T12:00:00'); $('pv-date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    $('pv-title').textContent = live ? 'Last night’s plan' : 'Tomorrow’s plan';
    $('pv-mult').innerHTML = K.multHTML(live ? st.mult : st.cap); $('pv-mult').classList.toggle('max', st.full);
    $('pv-count').textContent = st.done + ' of ' + st.n + ' done'; $('pv-cap').textContent = 'Up to ×' + st.cap + ' · worth ' + st.potential + ' XP';
    $('pv-bari').style.width = (st.n ? Math.round(100 * st.done / st.n) : 0) + '%'; $('pv-bar').setAttribute('aria-valuemax', String(st.n)); $('pv-bar').setAttribute('aria-valuenow', String(st.done));
    var hr = new Date().getHours(), nowP = hr < 12 ? 'am' : hr < 17 ? 'pm' : hr < 21 ? 'eve' : 'night', nextMarked = false, lastP = null;
    // grouped like a day calendar: Morning · Afternoon · Evening · Anytime
    $('pv-list').innerHTML = p.items.slice().sort(K.planSort).map(function (it) {
      var isNext = live && !it.done && !nextMarked && (it.part === nowP || it.part === 'any' || K.partOrder(it.part) > K.partOrder(nowP)); if (isNext) nextMarked = true;
      var hd = it.part !== lastP ? '<li class="kz-pv-part" aria-hidden="true">' + K.esc(fmtT(it)) + '</li>' : ''; lastP = it.part;
      return hd + '<li class="' + (it.done ? 'done' : '') + (isNext ? ' next' : '') + '"><time class="kz-sr">' + K.esc(fmtT(it)) + '</time><span><i class="kz-tx">' + K.esc(it.txt) + '</i>' + (it.t ? '<em class="kz-ptime">' + K.esc(K.fmtTime(it.t)) + '</em>' : '') + '</span>' + (live ? '<button type="button" class="kz-pcheck big' + (it.done ? ' on' : '') + '" data-vid="' + it.id + '" aria-pressed="' + !!it.done + '" aria-label="' + (it.done ? 'Undo: ' : 'Done: ') + K.esc(it.txt) + '">' + CHK + '</button>' : '<span class="kz-pv-soon" aria-hidden="true"></span>') + '</li>';
    }).join('');
    $('pv-line').textContent = live ? (st.full ? 'Plan complete · ×' + st.cap + ' · +' + st.points + ' XP' : 'Check off all ' + st.n + ' to cash in ' + st.potential + ' XP. Miss one and it pays nothing.') : 'Locked in. Tomorrow these show up in your to-dos; the multiplier climbs with every one you check off.';
    $('pv-line').hidden = !!(live && st.full); // Oct 21: no "Plan complete" line
    $('pv-edit').textContent = live ? 'Add tasks' : 'Edit plan';
  }
  function openView(day) { vDay = day; paintView(); $('pview').hidden = false; document.body.classList.add('kz-noscroll'); setTimeout(function () { $('pv-close').focus(); }, 30); K.track('kz_plan_view'); }
  function closeView() { $('pview').hidden = true; if ($('pmodal').hidden) document.body.classList.remove('kz-noscroll'); }
  $('pv-close').addEventListener('click', closeView); $('pv-done').addEventListener('click', closeView);
  $('pv-edit').addEventListener('click', function () { closeView(); openPlan(vDay); });
  $('pv-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-vid]'); if (!b) return; var st = K.togglePlanItem(tdK, b.dataset.vid); paintView();
    try { if (navigator.vibrate) navigator.vibrate(st && st.full ? [10, 40, 18] : 8); } catch (er) {}
    if (st && st.full && K.leafFall) K.leafFall(24);
    var m = $('pv-mult'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ($('pview') && !$('pview').hidden)) closeView(); });
  function rowHTML(r, i) {
    return '<li data-pr-i="' + i + '"' + (r.t ? ' class="timed"' : '') + '>' + (r.lock ? '<span class="kzpr-grip off" aria-hidden="true"></span>' : '<span class="kzpr-grip" data-pr-grip="' + i + '" role="button" aria-label="Drag to reorder task ' + (i + 1) + '"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>') + '<select data-pr-p="' + i + '" aria-label="Part of the day for task ' + (i + 1) + '"' + (r.lock ? ' disabled' : '') + '>' + K.PARTS.map(function (q) { return '<option value="' + q[0] + '"' + (!r.t && (r.part || 'any') === q[0] ? ' selected' : '') + '>' + q[1] + '</option>'; }).join('') + '<option value="time"' + (r.t ? ' selected' : '') + '>At a time\u2026</option></select>' + (r.t ? '<input type="time" class="kz-pr-time" data-pr-t="' + i + '" value="' + K.esc(r.t) + '" aria-label="Time for task ' + (i + 1) + '"' + (r.lock ? ' disabled' : '') + '>' : '') + '<input type="text" maxlength="80" value="' + K.esc(r.txt || '') + '" data-pr-x="' + i + '" placeholder="' + (['Swim 1,500 yd', 'Econ class', 'Study for the midterm', 'Chapter meeting', 'Meal prep', 'Read 10 pages'][i % 6]) + '" aria-label="Task ' + (i + 1) + '"' + (r.lock ? ' disabled' : '') + '>' + (r.lock ? '<span class="kz-pm-lock" aria-label="Locked">✓</span>' : '<button type="button" class="kz-iconbtn" data-pr-del="' + i + '" aria-label="Remove task ' + (i + 1) + '">' + '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' + '</button>') + '</li>';
  }
  function countText(n, cap) { var nt = K.planNextTier(n); return n < K.PLAN_MIN ? n + ' of ' + K.PLAN_MIN + ' tasks to lock it in' : n + ' tasks · up to ×' + cap + ' · ' + (nt ? (nt[0] - n) + ' more for ×' + nt[1] : 'max multiplier'); }
  function filled() { return rows.filter(function (r) { return String(r.txt || '').trim(); }); }
  function paintTiers(cap) { $('pm-tiers').innerHTML = K.PLAN_TIERS.map(function (t) { return '<span data-tier="' + t[1] + '" class="' + (t[1] === cap ? 'on' : t[1] < cap ? 'past' : '') + '"><b>' + t[0] + (t === K.PLAN_TIERS[K.PLAN_TIERS.length - 1] ? '+' : '') + '</b>' + K.multHTML(t[1]) + '</span>'; }).join(''); }
  function paintRows(focusLast) {
    $('pm-rows').innerHTML = rows.map(rowHTML).join('');
    var n = filled().length, cap = K.planCap(n);
    paintTiers(cap);
    $('pm-count').textContent = countText(n, cap);
    $('pm-save').disabled = n < K.PLAN_MIN;
    if (focusLast) { var ins = $('pm-rows').querySelectorAll('input[type="text"]'); if (ins.length) ins[ins.length - 1].focus(); }
  }
  function openPlan(day) {
    pDay = day; lockedDay = day === tdK && !K.lateNight(); var p = K.plan(day);
    rows = p ? p.items.map(function (x) { return { id: x.id, part: x.part, t: x.t || '', txt: x.txt, done: x.done, lock: lockedDay }; }) : [];
    var base = ['am', 'pm', 'eve']; while (rows.length < Math.max(K.PLAN_MIN, 3)) rows.push({ part: base[rows.length % 3], txt: '' });
    var dr = !lockedDay && K.get('plandraft', null); if (dr && dr.day === day && dr.rows && dr.rows.length) { rows = dr.rows.map(function (x) { return { id: x.id, part: x.part || 'any', t: x.t || '', txt: x.txt || '', done: x.done }; }); while (rows.length < Math.max(K.PLAN_MIN, 3)) rows.push({ part: 'any', txt: '' }); } // Oct 22: unsaved draft comes back
    var d = new Date(day + 'T12:00:00'); $('pm-date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    $('pm-title').textContent = day === tdK ? (K.lateNight() ? 'Plan your day' : 'Plan today') : 'Plan tomorrow';
    $('pm-clear').hidden = !p || lockedDay;
    var rp = K.planRepeat ? K.planRepeat() : null; $('pm-rep').setAttribute('aria-checked', String(!!rp)); $('pm-rep-s').textContent = rp ? 'On · this plan fills in every day until you turn it off' : 'Keep this plan for every day until you turn it off';
    paintRows(); $('pmodal').hidden = false; document.body.classList.add('kz-noscroll'); K.track('kz_plan_open', { day: day === tdK ? 'today' : 'tomorrow' });
  }
  function closePlan() { $('pmodal').hidden = true; document.body.classList.remove('kz-noscroll'); }
  $('pm-close').addEventListener('click', closePlan);
  $('pmodal').addEventListener('click', function (e) { if (e.target === $('pmodal')) closePlan(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('pmodal').hidden) closePlan(); });
  var saveDraft = function () { if (lockedDay || !pDay) return; K.set('plandraft', { day: pDay, rows: rows.map(function (r) { return { id: r.id, part: r.part, t: r.t || '', txt: r.txt, done: r.done }; }), at: Date.now() }); }; // Oct 22
  var pmInput = function (e) { var t = e.target, i;
    if ((i = t.dataset.prP) != null) { var r0 = rows[+i], was = !!r0.t; if (t.value === 'time') { r0.t = r0.t || (r0.part === 'pm' ? '13:00' : r0.part === 'eve' ? '18:00' : r0.part === 'night' ? '21:30' : '08:00'); r0.part = K.partOfTime(r0.t); } else { r0.t = ''; r0.part = t.value; } if (was !== !!r0.t) { paintRows(); if (r0.t) { var ti = $('pm-rows').querySelector('[data-pr-t="' + i + '"]'); if (ti) ti.focus(); } saveDraft(); return; } }
    if ((i = t.dataset.prT) != null && t.value) { rows[+i].t = t.value; rows[+i].part = K.partOfTime(t.value); } if ((i = t.dataset.prX) != null) rows[+i].txt = t.value; var n = filled().length; $('pm-save').disabled = n < K.PLAN_MIN; var cap = K.planCap(n); paintTiers(cap); $('pm-count').textContent = countText(n, cap); saveDraft(); };
  $('pm-rows').addEventListener('input', pmInput); $('pm-rows').addEventListener('change', pmInput);
  $('pm-rows').addEventListener('click', function (e) { var b = e.target.closest('[data-pr-del]'); if (!b) return; rows.splice(+b.dataset.prDel, 1); paintRows(); saveDraft(); });
  $('pm-add').addEventListener('click', function () { var last = rows[rows.length - 1]; rows.push({ part: last ? last.part : 'any', txt: '' }); paintRows(false); saveDraft(); try { var li = $('pm-rows').lastElementChild; if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }); // Oct 21: no keyboard until you tap the box

  // Nov 4 (James): drag a task by its grip to reorder the plan. Dropped among another part of the day, it takes that
  // part (a task added at the bottom can move up into Morning), so the saved plan keeps the order you see.
  (function () {
    var list = $('pm-rows'), d = null, ORD = function (p) { return K.partOrder ? K.partOrder(p || 'any') : 0; };
    var hap = function () { try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'haptic', n: 1 }); } catch (e) {} };
    function scroller() { var n = list; while (n && n !== document.body) { var cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 2) return n; n = n.parentElement; } return null; }
    function start(e, g) {
      var li = g.closest('li'); if (!li) return; e.preventDefault(); e.stopPropagation();
      var ae = document.activeElement; if (ae && list.contains(ae) && ae.blur) ae.blur();   // let a typed task save under its own row before rows move
      var items = [].slice.call(list.children), from = items.indexOf(li), r = li.getBoundingClientRect();
      d = { li: li, from: from, to: from, y0: e.clientY, h: r.height + 6, items: items, mids: items.map(function (x) { var b = x.getBoundingClientRect(); return b.top + b.height / 2; }), sc: scroller(), st0: 0, id: e.pointerId };
      d.st0 = d.sc ? d.sc.scrollTop : 0;
      try { g.setPointerCapture(e.pointerId); } catch (er) {}
      li.classList.add('kzpr-lift'); list.classList.add('kzpr-dragging'); hap();
      (function auto() { if (!d) return; if (d.sc && d.lastY != null) { var b = d.sc.getBoundingClientRect(), v = d.lastY < b.top + 60 ? -6 : d.lastY > b.bottom - 60 ? 6 : 0; if (v) { d.sc.scrollTop += v; move(d.lastY); } } requestAnimationFrame(auto); })();
    }
    function move(y) {
      if (!d) return; d.lastY = y; var ds = d.sc ? d.sc.scrollTop - d.st0 : 0, dy = y - d.y0 + ds, cy = d.mids[d.from] + dy, to = d.from;
      for (var k = 0; k < d.items.length; k++) { if (k < d.from && cy < d.mids[k]) { to = k; break; } }
      if (to === d.from) for (k = d.items.length - 1; k > d.from; k--) { if (cy > d.mids[k]) { to = k; break; } }
      if (to !== d.to) { d.to = to; hap(); }
      d.items.forEach(function (x, k) { if (x === d.li) return; var off = 0; if (d.from < d.to && k > d.from && k <= d.to) off = -d.h; if (d.from > d.to && k >= d.to && k < d.from) off = d.h; x.style.transform = off ? 'translateY(' + off + 'px)' : ''; });
      d.li.style.transform = 'translateY(' + dy + 'px) scale(1.02)';
    }
    function end() {
      if (!d) return; var o = d; d = null;
      o.items.forEach(function (x) { x.style.transform = ''; }); o.li.classList.remove('kzpr-lift'); list.classList.remove('kzpr-dragging');
      if (o.to === o.from) return;
      var r = rows.splice(o.from, 1)[0]; rows.splice(o.to, 0, r);
      if (r && !r.t && !r.lock) {   // take the part of the day it was dropped into
        var up = rows[o.to - 1], dn = rows[o.to + 1], a = up ? ORD(up.part) : -1, b = dn ? ORD(dn.part) : 99, me = ORD(r.part);
        if (me < a || me > b) r.part = up ? up.part : dn.part;
      }
      paintRows(); saveDraft();
    }
    list.addEventListener('pointerdown', function (e) { var g = e.target.closest('[data-pr-grip]'); if (g && !lockedDay) start(e, g); });
    list.addEventListener('pointermove', function (e) { if (d && e.pointerId === d.id) { e.preventDefault(); move(e.clientY); } });
    list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
    list.addEventListener('touchmove', function (e) { if (d) e.preventDefault(); }, { passive: false });
  })();
  $('pm-save').addEventListener('click', function () {
    var f = filled().sort(K.planSort);
    if (f.length < K.PLAN_MIN) return;
    K.savePlan(pDay, f.map(function (r, i) { var o = { id: r.id || 'p' + Date.now().toString(36) + i, part: r.t ? K.partOfTime(r.t) : (r.part || 'any'), txt: String(r.txt).trim().slice(0, 80), done: r.done ? 1 : 0 }; if (r.t) o.t = r.t; return o; }));
    if (K.syncReminders && f.some(function (r) { return r.t; })) K.syncReminders(true);
    if (K.setPlanRepeat) { if ($('pm-rep').getAttribute('aria-checked') === 'true') K.setPlanRepeat(true, f, pDay); else K.setPlanRepeat(false); }
    K.set('plandraft', null);
    K.track('kz_plan_saved', { n: f.length, cap: K.planCap(f.length), day: pDay === tdK ? 'today' : 'tomorrow' }); closePlan(); openView(pDay);
  });
  $('pm-rep').addEventListener('click', function (e) { e.preventDefault(); var on = this.getAttribute('aria-checked') !== 'true'; this.setAttribute('aria-checked', String(on)); $('pm-rep-s').textContent = on ? 'Turns on when you lock in this plan' : 'Off · tomorrow starts blank'; if (!on && K.setPlanRepeat) K.setPlanRepeat(false); try { navigator.vibrate(6); } catch (er) {} });
  $('pm-clear').addEventListener('click', function () { K.set('plandraft', null); K.savePlan(pDay, null); closePlan(); });
  K.openPlanView = openView; K.openPlanner = openPlan;
  document.addEventListener('kz:plan', function () { setTimeout(function () { if (($('pview') && !$('pview').hidden)) paintView(); }, 0); });
})();
