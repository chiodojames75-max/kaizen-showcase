/* Oct 28 · James: swipe left on a to-do in the Plan tab → Edit and Delete (not on Today's to-dos).
   Edit opens the same Edit task sheet a tap opens; Delete removes the task for that day, the same as the sheet's Delete.
   Swiping right on a to-do still goes to the day before; swiping anywhere else still changes day. Past days are read-only. */
(function () {
  var K = window.KZ; if (!K || window.__kzPlanSwipe) return; window.__kzPlanSwipe = 1;
  var page = document.querySelector('[data-p="day-list"]'); if (!page) return;
  var W = 168, GAP = 14, open = null, st = null, passing = false;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  function today() { try { return K.key(K.today()); } catch (e) { return ''; } }
  function day() { var b = document.querySelector('[data-p="week"] [aria-selected="true"]'); return b && b.getAttribute('data-day'); }
  function editable() { var d = day(); return !!d && d >= today(); }
  function rowAt(t) { var li = t && t.closest && t.closest('[data-p="day-list"] > li.kz-todo[data-kzk]'); return li; }
  var ICON_E = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>';
  var ICON_D = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>';
  function acts(li) {
    var a = li.querySelector(':scope > .kzps-acts');
    if (!a) { a = document.createElement('div'); a.className = 'kzps-acts'; a.innerHTML = '<button type="button" class="kzps-edit" aria-label="Edit task">' + ICON_E + '<span>Edit</span></button><button type="button" class="kzps-del" aria-label="Delete task">' + ICON_D + '<span>Delete</span></button>'; li.appendChild(a); }
    return a;
  }
  // the row stays put; its contents slide left and the buttons slide in from its right edge (the row clips both)
  function place(li, x, anim) {
    li.classList.toggle('kzps-anim', !!anim);
    li.style.setProperty('--kzx', (x || 0) + 'px');
    li.style.setProperty('--kzps', String(Math.max(0, Math.min(1, -(x || 0) / (W * 0.6)))));
  }
  function shut(li, now) {
    if (!li) return; if (open === li) open = null; li.classList.remove('kzps-open');
    place(li, 0, !now);
    setTimeout(function () { if (!li.classList.contains('kzps-open') && !(st && st.li === li)) { li.classList.remove('kzps-on', 'kzps-anim'); li.style.removeProperty('--kzx'); li.style.removeProperty('--kzps'); } }, now ? 0 : 320);
  }
  // touches: decide on the first real move. Left = this row; right on a closed row = the day swipe (unchanged).
  document.addEventListener('touchstart', function (e) {
    var li = rowAt(e.target); if (open && open !== li) shut(open);
    if (!li || e.touches.length !== 1 || e.target.closest('.kzps-acts, input, textarea') || !editable()) { st = null; return; }
    var p = e.touches[0]; st = { li: li, x: p.clientX, y: p.clientY, base: li === open ? -(W + GAP) : 0, on: false, at: 0 };
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', function (e) {
    if (!st) return; if (st.li.classList.contains('kzo-lift') || document.querySelector('.kzo-dragging')) { if (st.on) shut(st.li, true); st = null; return; }   // holding to reorder wins
    var p = e.touches[0]; if (!p) return; var dx = p.clientX - st.x, dy = p.clientY - st.y;
    if (!st.on) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) || (dx > 0 && !st.base)) { st = null; return; }
      st.on = true; st.x = p.clientX; dx = 0; acts(st.li); st.li.classList.add('kzps-on');
    }
    e.preventDefault(); e.stopPropagation();
    var h = W + GAP, x = st.base + dx;
    st.at = x > 0 ? x * 0.2 : x < -h ? -h + (x + h) * 0.3 : x;
    place(st.li, st.at, false);
  }, { passive: false, capture: true });
  function end(e) {
    if (!st) return; var s = st; st = null; if (!s.on) return;
    if (e && e.cancelable) e.preventDefault(); e.stopPropagation();
    if (s.at < -(W + GAP) * 0.4) { place(s.li, -(W + GAP), true); s.li.classList.add('kzps-open'); open = s.li; post({ type: 'tick' }); }
    else shut(s.li);
    var swallow = function (ev) { if (passing) return; ev.stopPropagation(); ev.preventDefault(); };
    window.addEventListener('click', swallow, true); setTimeout(function () { window.removeEventListener('click', swallow, true); }, 350);
  }
  document.addEventListener('touchend', end, { capture: true });
  document.addEventListener('touchcancel', function (e) { if (st && st.on) { var s = st; st = null; shut(s.li); } else st = null; }, { capture: true });
  function remove(li) {
    var key = li.getAttribute('data-kzk') || '', d = day(); if (!key || !d) return;
    if (key.indexOf('p:') === 0) {
      var pl = K.plan(d); if (!pl) return;
      K.savePlan(d, pl.items.filter(function (x) { return x.id !== key.slice(2); }));
    } else {
      K.set('todos', K.todos().filter(function (x) { return x.id !== key.slice(2); }));
      ['kz:todos', 'kz:changed'].forEach(function (n) { document.dispatchEvent(new CustomEvent(n)); });
    }
    post({ type: 'dirty' }); try { if (K.notifyPlan) K.notifyPlan(); } catch (e) {}
  }
  window.addEventListener('click', function (e) {
    if (passing) return;
    var b = e.target.closest && e.target.closest('.kzps-acts button');
    if (!b) {
      if (open) { var r = open, inRow = e.target.closest && e.target.closest('li') === r; shut(r); if (inRow) { e.preventDefault(); e.stopImmediatePropagation(); } }
      return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    var li = b.closest('li.kz-todo'); if (!li) return;
    if (b.classList.contains('kzps-edit')) {
      shut(li, true); var body = li.querySelector('.kz-tbody') || li;
      passing = true; try { body.click(); } finally { passing = false; }
      return;
    }
    post({ type: 'haptic', n: 1 });
    li.classList.add('kzps-gone'); li.style.height = li.offsetHeight + 'px'; void li.offsetHeight; li.style.height = '0px';
    setTimeout(function () { remove(li); }, 240);
  }, true);
  // a redraw of the list (new day, a check-off) never leaves a row stuck open
  new MutationObserver(function () { if (open && !open.isConnected) open = null; }).observe(page, { childList: true });
})();
