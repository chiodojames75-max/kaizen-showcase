/* Oct 25 n (from 1025i): when another goal has the Kaizen 66 run, the menu offers "Make this my Kaizen 66" (asks, then resets to day 0; kz66sw-1025n). */
/* Oct 25 i · Goal actions, option B (James): an iOS-style menu instead of the bottom sheet.
   - Press and hold a goal: it lifts and the menu appears beside it. Move your finger and the menu goes away so the existing
     hold-to-drag reorder carries on as before. Let go without moving: the menu stays.
   - The ••• button opens the same menu (people don't discover press-and-hold on their own).
   - Rows: View goal, Edit, Kaizen 66 (start one / see it), Mark achieved · Move up, Move down · Archive, Delete.
     Each row presses the goal's own hidden menu item (871e…), so every action keeps its existing behaviour; Archive and
     Delete use the same K.archiveGoal / K.removeGoal calls as the old sheet. Delete asks once more in place.
   Styles: kzmenu-1025i.css */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzmenu) return; K.__kzmenu = 1;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var I = {
    view: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    k66: '<circle cx="12" cy="12" r="8.5"/><path d="M9 14.5c0-3 1-5.5 3.5-6.5M9 14.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>',
    won: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    arch: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
  var menu = null, back = null, card = null, items = [], openedAt = 0, openY = 0, sameTouch = false;

  function k66For(gid) {
    var s = null; try { s = K.k66 ? K.k66.state() : null; } catch (e) {}
    var r = s && s.run;
    if (!K.k66) return null;
    var gg = (K.goals() || []).filter(function (x) { return x.id === gid; })[0]; if (gg && gg.kind !== 'daily' && !(r && r.goal === gid)) return null;  // Oct 25 o: Kaizen 66 is for daily habits
    if (r && r.goal === gid && (r.state === 'live' || r.state === 'pending')) return { label: 'Kaizen 66 · day ' + (r.day || 0), act: 'goal' };
    if (r && (r.state === 'live' || r.state === 'pending')) return K.k66.askSwitch ? { label: 'Make this my Kaizen 66', act: 'switch' } : null; // one at a time: switching asks first
    return { label: 'Start Kaizen 66', act: 'start' };
  }
  function build(c) {
    var m = c.querySelector('.kz-gmenu'); if (!m) return null;
    var gid = c.getAttribute('data-goal'); items = [];
    var row = function (key, label, cls, el, dis) { items.push(el || null); return '<button type="button" class="kzm-it ' + (cls || '') + '" role="menuitem" data-i="' + (items.length - 1) + '" data-k="' + key + '"' + (dis ? ' disabled' : '') + '><span>' + esc(label) + '</span>' + svg(key) + '</button>'; };
    var view = m.querySelector('a'), edit = m.querySelector('[data-kz-edit]'), won = m.querySelector('[data-kz-won]'), mv = m.querySelectorAll('.kz-gm-move button');
    var h = '';
    if (view) h += row('view', 'View goal', '', view);
    if (edit) h += row('edit', 'Edit', '', edit);
    var k = k66For(gid); if (k) h += row('k66', k.label, 'gold', null);
    if (won) h += row('won', 'Mark achieved', '', won);
    if (mv.length) h += '<i class="kzm-sep"></i>' + row('up', 'Move up', '', mv[0], mv[0].disabled) + (mv[1] ? row('down', 'Move down', '', mv[1], mv[1].disabled) : '');
    h += '<i class="kzm-sep"></i>' + row('arch', 'Archive', '', null) + row('del', 'Delete', 'red', null);
    return h;
  }
  function open(c, fromHold) {
    close(true);
    var h = build(c); if (!h) return;
    card = c; openedAt = Date.now(); openY = window.scrollY;
    back = document.createElement('div'); back.className = 'kzm-back' + (calm ? ' calm' : '');
    menu = document.createElement('div'); menu.className = 'kzm' + (calm ? ' calm' : ''); menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Actions for ' + ((c.querySelector('.kz-gname') || {}).textContent || 'goal'));
    menu.innerHTML = h;
    document.body.appendChild(back); document.body.appendChild(menu);
    c.classList.add('kzm-on');
    // place under the goal, or above it when there's no room below
    var r = c.getBoundingClientRect(), mh = menu.offsetHeight, vh = window.innerHeight, below = r.bottom + 10, top = below + mh < vh - 100 ? below : Math.max(60, r.top - 10 - mh);
    menu.style.top = Math.round(top) + 'px'; menu.style.left = Math.round(Math.max(12, Math.min(r.left + 4, window.innerWidth - menu.offsetWidth - 12))) + 'px';
    menu.style.transformOrigin = (top > r.top ? 'top' : 'bottom') + ' left';
    requestAnimationFrame(function () { back.classList.add('on'); menu.classList.add('on'); });
    post({ type: 'haptic', n: 1 }); try { if (!fromHold && navigator.vibrate) navigator.vibrate(6); } catch (e) {}
    sameTouch = !!fromHold;
    back.addEventListener('click', function () { if (sameTouch) { sameTouch = false; swallowUntil = Date.now() + 300; return; } if (Date.now() < swallowUntil) return; close(); }); // the finger lifting off a long press can send a stray click
    menu.addEventListener('click', onPick);
    var f = menu.querySelector('.kzm-it:not([disabled])'); if (f && !fromHold) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }
  function close(now) {
    var m = menu, b = back, c = card; menu = back = card = null;
    if (c) c.classList.remove('kzm-on');
    if (!m) return;
    if (now || calm) { m.remove(); b.remove(); return; }
    m.classList.remove('on'); b.classList.remove('on'); m.classList.add('out');
    setTimeout(function () { m.remove(); b.remove(); }, 220);
  }
  function onPick(e) {
    var b = e.target.closest('.kzm-it'); if (!b || b.disabled) return;
    if (sameTouch) { sameTouch = false; swallowUntil = Date.now() + 300; return; } // the lift-off of the press that opened the menu
    if (Date.now() < swallowUntil) return;
    var key = b.getAttribute('data-k'), orig = items[+b.getAttribute('data-i')], c = card, gid = c && c.getAttribute('data-goal');
    if (key === 'del' && !b.classList.contains('sure')) { b.classList.add('sure'); b.querySelector('span').textContent = 'Tap again to delete for good'; post({ type: 'haptic', n: 1 }); return; }
    close();
    if (!gid) return;
    if (key === 'arch' || key === 'del') {
      if (c.isConnected) c.classList.add('kz-gone');
      setTimeout(function () { if (key === 'arch') K.archiveGoal(gid); else K.removeGoal(gid); try { K.track(key === 'arch' ? 'kz_goal_archived' : 'kz_goal_deleted'); } catch (x) {} document.dispatchEvent(new CustomEvent('kz:changed')); }, calm ? 0 : 260);
      return;
    }
    if (key === 'k66') {
      var st = k66For(gid);
      if (st && st.act === 'goal') location.href = '/pages/goal?id=' + encodeURIComponent(gid);
      else if (st && st.act === 'switch') K.k66.askSwitch(gid);
      else { var t = document.createElement('button'); t.type = 'button'; t.setAttribute('data-k66-open', gid); t.hidden = true; document.body.appendChild(t); t.click(); t.remove(); }
      return;
    }
    // rows can be re-rendered while the menu is open: find the goal's menu item again, live
    if (!orig || !orig.isConnected) {
      var live = document.querySelector('.kz-goal[data-goal="' + (window.CSS && CSS.escape ? CSS.escape(gid) : gid) + '"] .kz-gmenu');
      if (live) { var mvs = live.querySelectorAll('.kz-gm-move button'); orig = key === 'view' ? live.querySelector('a') : key === 'edit' ? live.querySelector('[data-kz-edit]') : key === 'won' ? live.querySelector('[data-kz-won]') : key === 'up' ? mvs[0] : key === 'down' ? mvs[1] : null; c = live.closest('.kz-goal'); }
    }
    if (orig) setTimeout(function () { orig.click(); var box = c.isConnected && c.querySelector('.kz-editbox:not([hidden])'); if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, calm ? 0 : 120);
  }

  // ••• opens the menu instead of the sheet
  document.addEventListener('click', function (e) {
    var more = e.target.closest && e.target.closest('[data-kz-more]'); if (!more) return;
    var c = more.closest('.kz-goal.kz-grow, .kz-goal'); if (!c || !c.querySelector('.kz-gmenu')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    open(c, false);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu) close(); });

  // press and hold (~0.45 s, finger still) on a goal opens the menu. If the page's own hold-to-drag lifts the row too, the
  // menu sits beside it; moving the finger closes the menu and the drag carries on as before.
  var tx = 0, ty = 0, moved = false, timer = 0, holdCard = null;
  document.addEventListener('touchstart', function (e) {
    clearTimeout(timer); moved = false; holdCard = null; sameTouch = false;
    var t = e.touches[0]; tx = t.clientX; ty = t.clientY;
    if (e.touches.length > 1) return;
    var c = e.target.closest && e.target.closest('.kz-goal'); if (!c || !c.querySelector('.kz-gmenu')) return;
    if (e.target.closest('button, a, input, textarea, .kz-gswipe, .kz-editbox, .kz-delbox')) return;
    holdCard = c;
    timer = setTimeout(function () { if (!moved && holdCard && holdCard.isConnected && !menu) open(holdCard, true); }, 450);
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', function (e) {
    var t = e.touches[0]; if (Math.abs(t.clientX - tx) > 8 || Math.abs(t.clientY - ty) > 8) { moved = true; clearTimeout(timer); if (menu && Date.now() - openedAt < 4000 && holdCard) { holdCard = null; close(); } }
  }, { passive: true, capture: true });
  var swallowUntil = 0;
  document.addEventListener('pointerup', function (e) { if (sameTouch && menu && e.pointerType !== 'mouse') { sameTouch = false; swallowUntil = Date.now() + 450; } }, true);
  document.addEventListener('touchend', function (e) {
    clearTimeout(timer); holdCard = null;
    if (sameTouch && menu) {
      sameTouch = false; swallowUntil = Date.now() + 450;
      // the long press opened the menu: this lift-off is not a tap on the goal (unless the page lifted the row to drag it,
      // in which case its own touchend must run to drop the row back)
      if (!(card && card.classList.contains('kz-lift'))) { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); }
    }
  }, { passive: false, capture: true });
  // lifting the finger after a long press must not also "tap" whatever is under it (the goal row would open)
  document.addEventListener('click', function (e) { if (e.isTrusted && Date.now() < swallowUntil) { swallowUntil = 0; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener('touchcancel', function () { clearTimeout(timer); holdCard = null; }, { passive: true, capture: true });
  window.addEventListener('scroll', function () { if (menu && Math.abs(window.scrollY - openY) > 40) close(); }, { passive: true });
})();
