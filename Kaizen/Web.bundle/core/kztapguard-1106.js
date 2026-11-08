/* Nov 6 · pre-launch (rapid-tap bug, regression B37). Two things made fast taps on a goal's check get lost or land on
   the wrong goal: (1) checking a goal re-orders Today at once, so a quick second tap meant as "undo" landed on whatever
   moved under the finger (the next goal got checked, or a roadmap opened); (2) the check re-draws while it animates, and
   a press whose button was replaced between finger-down and finger-up never becomes a click, so the tap did nothing.
   Now, for 0.7 s after a check is tapped, another tap within 36 pt of the same spot goes to that same goal's check,
   wherever it has moved (the press is caught before the row underneath sees it). (2) is left alone: synthesizing the lost
   tap double-counted under load, which is worse than a rare missed tap. */
(function () {
  if (window.__kztg) return; window.__kztg = 1;
  var WIN = 700, R = 36, last = null, down = null, eatClick = 0, firing = false;
  function pt(e) { var t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]); return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY }; }
  function near(p) { return last && Date.now() - last.t < WIN && Math.abs(scrollY - last.sy) < 4 && Math.abs(p.x - last.x) < R && Math.abs(p.y - last.y) < R; }
  function checkOf(e) { return e.target && e.target.closest ? e.target.closest('button.kz-check[data-kz-done]') : null; }
  function stop(e) { if (e.cancelable) e.preventDefault(); e.stopImmediatePropagation(); }
  function visibleCheck(id) {
    var all = document.querySelectorAll('button.kz-check[data-kz-done="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect(); if (r.width > 0 && r.height > 0 && getComputedStyle(all[i]).visibility !== 'hidden') return all[i]; }
    return null;
  }
  function fire(id, p) { var t = visibleCheck(id); if (!t) return; last = { id: id, x: p.x, y: p.y, t: Date.now(), sy: scrollY }; firing = true; try { t.click(); } finally { firing = false; } }
  function onDown(e) {
    if (firing || !e.isTrusted) return; if (e.type === 'mousedown' && down && Date.now() - down.t < 800) return;   // the mouse twin of a touch/pointer press
    var p = pt(e), b = checkOf(e), id = b && b.getAttribute('data-kz-done');
    // only a tap on another goal's check or on a row's plain body is redirected; any other control (a to-do's check, a
    // link, a button) is the user's real target. Nothing is redirected if the page scrolled in between.
    var other = !id && e.target.closest && e.target.closest('button, a[href], input, select, textarea, label, [role=button], [role=switch], [role=tab]');
    if (near(p) && id !== last.id && !other) { down = { redirect: last.id, p: p, t: Date.now() }; stop(e); return; }
    down = id ? { id: id, p: p, t: Date.now(), clicked: false } : null;
  }
  function onUp(e) {
    if (firing || !e.isTrusted || !down) return;
    if (down.redirect) { if (down.done) { stop(e); return; } down.done = true; stop(e); eatClick = Date.now(); fire(down.redirect, down.p); return; }
  }
  ['pointerdown', 'touchstart', 'mousedown'].forEach(function (n) { window.addEventListener(n, onDown, { capture: true, passive: false }); });
  ['pointerup', 'touchend', 'mouseup'].forEach(function (n) { window.addEventListener(n, onUp, { capture: true, passive: false }); });
  window.addEventListener('click', function (e) {
    if (firing || !e.isTrusted) return;
    if (eatClick && Date.now() - eatClick < 600) { eatClick = 0; stop(e); return; }
    var b = checkOf(e); if (!b) return;
    var id = b.getAttribute('data-kz-done');
    if (down && down.id === id && !down.clicked) { down.clicked = true; }
    else if (down && down.id && down.id !== id && down.clicked === false) { down.clicked = true; }
    last = { id: id, x: pt(e).x, y: pt(e).y, t: Date.now(), sy: scrollY };
  }, true);
})();
