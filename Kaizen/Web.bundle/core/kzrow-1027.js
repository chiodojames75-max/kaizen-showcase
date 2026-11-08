/* Oct 25 zb (from za): Delete is a narrow iOS-size button (88 pt, James drew it); the whole row slides (no inner wrapper,
   which left re-drawn parts like "Day 1 starts now · Undo" floating in place). za: Delete hidden until you swipe. */
(function () {
  var K = window.KZ; if (!K || K.__kzrow) return; K.__kzrow = 'zb';   // kzrow-1027 replaces kzrow-1025zb (divider measures only when still)
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  function goal(id) { try { return K.goals().filter(function (g) { return g.id === id; })[0]; } catch (e) { return null; } }
  // ---- B: the line above Tomorrow ----
  function divider() {
    var t = document.querySelector('#kz-today-s1 .kz-tomorrow, .kz-today .kz-tomorrow');
    var all = document.querySelectorAll('.kzdv'), d = all[0] || null;
    for (var i = 1; i < all.length; i++) all[i].remove();   // only ever one line (redraws used to add another each time)
    if (!t || !t.parentNode) { if (d) d.hidden = true; return; }
    if (!d) { d = document.createElement('div'); d.className = 'kzdv'; d.setAttribute('role', 'separator'); d.innerHTML = '<i></i><span>LATER</span><i></i>'; }
    if (d.nextElementSibling !== t || d.parentNode !== t.parentNode) t.parentNode.insertBefore(d, t);
    // 1027: measuring (getComputedStyle / offsetHeight) forces the page to lay out; during a check-off glide this ran every
    // frame. The line is placed right away; whether it shows is checked once things are still (120 ms).
    if (t.hidden) { if (!d.hidden) d.hidden = true; return; }
    clearTimeout(divider.t); divider.t = setTimeout(function () { if (!t.isConnected) return; var show = !t.hidden && getComputedStyle(t).display !== 'none' && t.offsetHeight > 0; if (d.hidden === show) d.hidden = !show; }, 120);
  }
  // ---- daily habits: Delete only ----
  function mark() {
    Array.prototype.forEach.call(document.querySelectorAll('#kz-today-s1 .kz-grow[data-goal]'), function (r) {
      var g = goal(r.getAttribute('data-goal')), daily = !!(g && (g.kind === 'daily' || g.quit));
      if (r.classList.contains('kzr-daily') !== daily) r.classList.toggle('kzr-daily', daily);
    });
  }
  // ---- swipe left → a red Delete that takes half the row (daily habits and Quit habits); swipe right on a habit = done ----
  var open = null;
  var DEL = 88, OPEN = 96;
  function wrapQuit() {
    Array.prototype.forEach.call(document.querySelectorAll('.kzq-row'), function (row) {
      if (row.querySelector(':scope > .kzr-qdel')) return;
      var del = document.createElement('button'); del.type = 'button'; del.className = 'kzr-qdel'; del.textContent = 'Delete'; del.setAttribute('aria-label', 'Delete this habit');
      row.appendChild(del);
    });
  }
  function half() { return OPEN; }
  function place(row, x, anim) {
    row.style.transition = anim ? 'transform .3s cubic-bezier(.22,.8,.24,1)' : 'none';
    row.style.transform = x ? 'translate3d(' + x + 'px,0,0)' : '';
    row.style.setProperty('--swp', String(Math.max(0, Math.min(1, -(x || 0) / (OPEN * 0.6)))));
    var gs = row.querySelector('.kz-gswipe'); if (gs) { gs.style.width = DEL + 'px'; gs.style.left = 'calc(100% + 8px)'; }
  }
  function shut(row) { if (!row) return; place(row, 0, true); row.classList.remove('kzr-open', 'kz-swopen'); if (open === row) open = null; setTimeout(function () { if (!row.classList.contains('kzr-open')) row.classList.remove('kzr-drag', 'kz-swiping'); }, 320); }
  function rowAt(t) { return t.closest && (t.closest('.kzq-row') || t.closest('#kz-today-s1 .kz-grow.kzr-daily')); }
  // the old swipe on these rows stops at a fixed 168 pt: this one replaces it there
  window.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' && rowAt(e.target) && !e.target.closest('.kz-gswipe, .kzr-qdel')) e.stopImmediatePropagation(); }, true);
  var st = null;
  document.addEventListener('touchstart', function (e) {
    var row = rowAt(e.target); if (open && open !== row) shut(open);
    if (!row || e.target.closest('.kzr-qdel, .kz-gswipe, input, textarea') || e.touches.length !== 1) { st = null; return; }
    var p = e.touches[0]; st = { row: row, x: p.clientX, y: p.clientY, base: row === open ? -half(row) : 0, on: false, at: 0, t: Date.now() };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!st) return; var p = e.touches[0], dx = p.clientX - st.x, dy = p.clientY - st.y;
    if (!st.on) { if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) { st = null; return; } if (Math.abs(dx) < 8) return; st.on = true; st.x = p.clientX; dx = 0; st.row.classList.add('kzr-drag', 'kz-swiping'); }
    e.preventDefault();
    var h = half(st.row), x = st.base + dx, quit = st.row.classList.contains('kzq-row');
    st.at = x > 0 ? (quit || st.base ? x * 0.2 : Math.min(x, 120) + Math.max(0, x - 120) * 0.35) : x < -h ? -h + (x + h) * 0.3 : x;
    place(st.row, st.at, false);
  }, { passive: false });
  document.addEventListener('touchend', function (e) {
    if (!st) return; var s = st; st = null; if (!s.on) return;
    var h = half(s.row), quit = s.row.classList.contains('kzq-row');
    if (s.at > 92 && !quit && !s.base) { place(s.row, 0, true); s.row.classList.remove('kzr-drag', 'kz-swiping'); var ck = s.row.querySelector('.kz-check:not(.done)'); if (ck) ck.click(); return; }
    if (s.at < -h * 0.4) { place(s.row, -h, true); s.row.classList.add('kzr-open', 'kz-swopen'); open = s.row; post({ type: 'tick' }); }
    else shut(s.row);
    // the tap that ends a swipe never opens the goal underneath
    var swallow = function (ev) { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click', swallow, true); setTimeout(function () { document.removeEventListener('click', swallow, true); }, 350);
  });
  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('.kzr-qdel'); if (!d) { if (open && !(e.target.closest && e.target.closest('.kzr-open .kz-gswipe'))) { var r = open; shut(r); if (e.target.closest && e.target.closest('.kzr-open') === r) { e.preventDefault(); e.stopPropagation(); } } return; }
    e.preventDefault(); e.stopPropagation();
    var row = d.closest('.kzq-row'), id = row.getAttribute('data-q'), g = goal(id);
    if (!window.confirm('Delete “' + (g ? g.name : 'this habit') + '” for good?')) { shut(row); return; }
    shut(row); if (K.removeGoal) K.removeGoal(id);
    try { ['kz:goals', 'kz:changed'].forEach(function (n) { document.dispatchEvent(new CustomEvent(n)); }); } catch (er) {}
  }, true);
  // ---- add sheet: an empty name never fails silently (iOS shows no "fill out this field" bubble in the app) ----
  function hints() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-sheet49 [data-t="gname"], .kz-sheet49 [data-gx="gname"]'), function (i) {
      var p = i.getAttribute('placeholder') || ''; if (p && !/^e\.g\. /.test(p)) i.setAttribute('placeholder', 'e.g. ' + p);
    });
  }
  document.addEventListener('submit', function (e) {
    var sh = e.target.closest && e.target.closest('.kz-sheet49'); if (!sh) return;
    var inp = sh.querySelector('[data-t="gname"], [data-gx="gname"]'); if (!inp || inp.closest('[hidden]') || inp.value.trim()) { var o = sh.querySelector('.kzr-need'); if (o) o.remove(); return; }
    e.preventDefault(); e.stopImmediatePropagation();
    var f = inp.closest('label') || inp; f.classList.remove('kzt-shake'); void f.offsetWidth; f.classList.add('kzt-shake');
    var need = sh.querySelector('.kzr-need');
    if (!need) { need = document.createElement('p'); need.className = 'kzr-need'; need.setAttribute('role', 'alert'); f.parentNode.insertBefore(need, f.nextSibling); }
    need.textContent = sh.classList.contains('kzq-on') ? 'Type your bad habit, or tap one below.' : 'Give it a name first, or tap a quick pick.';
    try { inp.focus(); } catch (er) {}
    post({ type: 'haptic', n: 3 });
  }, true);
  document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('[data-t="gname"], [data-gx="gname"]') && e.target.value.trim()) { var sh = e.target.closest('.kz-sheet49'), o = sh && sh.querySelector('.kzr-need'); if (o) o.remove(); } });
  document.addEventListener('click', function (e) { var pk = e.target.closest && e.target.closest('[data-q-pick], [data-kzp-pick]'); if (pk) setTimeout(function () { var sh = pk.closest('.kz-sheet49'), o = sh && sh.querySelector('.kzr-need'); if (o) o.remove(); }, 0); });
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { divider(); mark(); wrapQuit(); hints(); } catch (e) {} }); }
  function boot() { soon(); new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzdv, .kzr-qwrap, .kzr-need')) continue; if (ms[i].attributeName === 'placeholder' && /^e\.g\. /.test(t.getAttribute('placeholder') || '')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'placeholder'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
