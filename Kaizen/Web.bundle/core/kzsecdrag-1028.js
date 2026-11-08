/* Oct 28 · replaces kzsecdrag-1027.js: default order Daily habits, To-dos, Quit, Long-term (once for everyone);
   smoother moves: swaps 16 px past halfway with 160 ms rest, neighbours glide (no bounce), a new swap mid-glide starts
   from where the box is, the drop settles in 240 ms.
   Oct 27 · replaces kzsecdrag-1026l.js: swaps need a clear 24 px past halfway and 240 ms between them (no flip-flop).
   Oct 26 l · Reorder Today's sections (James): press and hold a section's title row (Daily habits, Long-term goals, Quit,
   To-dos), then drag. When the lifted section covers half of its neighbour, the neighbour springs into the gap; let go and
   it settles into its slot. The order is saved as kz_secorder and applied with flex `order` (inline, so it wins over the
   default order in kztweak-1026k.css). A goal row's own hold-to-move is untouched: only the title row starts this.
   Styles: kzsecdrag-1026l.css. */
(function () {
  var K = window.KZ; if (!K || window.__kzSecDrag) return; window.__kzSecDrag = 1;
  var KEYS = ['daily', 'todo', 'quit', 'long'], HOLD = 380, SLOP = 8;   // Oct 28 (James): default Daily habits, To-dos, Quit, Long-term
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function keyOf(s) { if (s.classList.contains('kz-todosec')) return 'todo'; if (s.classList.contains('kzq-sec')) return 'quit'; var k = s.getAttribute('data-kind'); return k === 'daily' || k === 'long' ? k : null; }
  function box() { return document.querySelector('#kz-today-s1 .kz-tgroups'); }
  function secs() { var b = box(); if (!b) return []; return [].filter.call(b.children, function (s) { return keyOf(s) && !s.classList.contains('kzq-empty') && s.offsetParent !== null; }); }
  // Oct 28: once, everyone starts from the new default (a saved order from before today is replaced; moving sections still saves)
  try { if (!K.get('secorder28', 0)) { K.set('secorder', KEYS.slice()); K.set('secorder28', 1); } } catch (e) {}
  function order() { var o = K.get('secorder', null); o = Array.isArray(o) ? o.filter(function (k) { return KEYS.indexOf(k) > -1; }) : []; KEYS.forEach(function (k) { if (o.indexOf(k) < 0) o.push(k); }); return o; }
  function setOrd(s, n) { if (s.style.getPropertyValue('order') !== String(n) || s.style.getPropertyPriority('order') !== 'important') s.style.setProperty('order', String(n), 'important'); }
  function apply() { var b = box(); if (!b) return; var o = order(); [].forEach.call(b.children, function (s) { var k = keyOf(s); if (k) setOrd(s, o.indexOf(k) + 1); }); }
  function haptic() { try { if (navigator.vibrate) navigator.vibrate(6); } catch (e) {} }

  // ---------- the drag ----------
  var d = null, swallow = false;
  function isHead(t) { var h = t.closest && t.closest('#kz-today-s1 .kz-tgroups > section > .kz-tsec-h'); if (!h) return null; if (t.closest('button, a, input, textarea, select, [role="switch"]')) return null; return h; }
  document.addEventListener('pointerdown', function (e) {
    if (d || e.button > 0) return;
    var h = isHead(e.target); if (!h) return; var s = h.parentNode; if (!keyOf(s) || secs().length < 2) return;
    d = { s: s, x0: e.clientX, y0: e.clientY, y: e.clientY, pid: e.pointerId, live: false };
    d.wait = setTimeout(function () { if (d && !d.live) lift(); }, e.pointerType === 'mouse' ? 250 : HOLD);
  });
  function tm(e) { if (!d) return; if (e.touches && e.touches[0]) { d.y = e.touches[0].clientY; if (!d.live && (Math.abs(e.touches[0].clientX - d.x0) > SLOP || Math.abs(d.y - d.y0) > SLOP)) cancel(); } if (d && d.live) e.preventDefault(); }
  document.addEventListener('pointermove', function (e) {
    if (!d || e.pointerId !== d.pid) return; d.y = e.clientY;
    if (!d.live && (Math.abs(e.clientX - d.x0) > SLOP || Math.abs(e.clientY - d.y0) > SLOP)) cancel(); // a scroll, not a hold
  });
  function cancel() { if (!d) return; clearTimeout(d.wait); d = null; /* listener stays (Oct 27) */ }
  function layoutTop(s) { var b = s.offsetParent ? s.offsetParent.getBoundingClientRect().top + scrollY : 0; return b + s.offsetTop; } // where the box sits in the page, without any transform
  function lift() {
    var s = d.s; d.live = true; d.sy0 = scrollY; d.top0 = layoutTop(s);
    s.classList.add('kzsd-lift'); document.body.classList.add('kzsd-on'); haptic();
    try { var sel = getSelection(); if (sel) sel.removeAllRanges(); } catch (e) {}
    loop();
  }
  function follow() {
    var s = d.s, want = d.top0 + (d.y - d.y0) + (scrollY - d.sy0), dy = want - layoutTop(s);
    s.__dy = dy; s.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0) scale(1.02)';
  }
  function swapCheck() {
    var list = secs().sort(function (a, b) { return (+getComputedStyle(a).order) - (+getComputedStyle(b).order); }), i = list.indexOf(d.s); if (i < 0) return;
    // layout boxes (offsetTop ignores the springs still playing on the neighbours, so a swap never flip-flops)
    var top = d.s.offsetTop + (d.s.__dy || 0), bot = top + d.s.offsetHeight, prev = list[i - 1], next = list[i + 1], other = null;
    // Oct 27: hysteresis + a short rest after each swap. Without it a finger resting near the halfway line (every real
    // finger trembles a few px) swapped the sections back and forth every frame: the Quit "flickering and glitching".
    if (Date.now() - (d.lastSwap || 0) < 160) return;
    var M = 16;   // Oct 28: smoother — swaps a little sooner, still no flip-flop
    if (prev && top < prev.offsetTop + prev.offsetHeight / 2 - M) other = prev;
    if (!other && next && bot > next.offsetTop + next.offsetHeight / 2 + M) other = next;
    if (!other) return;
    d.lastSwap = Date.now();
    // FLIP: everyone except the lifted box springs from where it was to where it now belongs
    var before = list.map(function (x) { return x === d.s ? 0 : x.getBoundingClientRect().top; });
    list.forEach(function (x) { if (x !== d.s && x.getAnimations) x.getAnimations().forEach(function (an) { if (an.id === 'kzsd') an.cancel(); }); });   // a new swap mid-spring starts from where the box is now
    var o = list.map(keyOf), a = o.indexOf(keyOf(d.s)), b = o.indexOf(keyOf(other)); o[a] = keyOf(other); o[b] = keyOf(d.s);
    var vis = {}, q2 = o.slice(), merged = []; o.forEach(function (k) { vis[k] = 1; }); // hidden sections keep their places
    order().forEach(function (k) { merged.push(vis[k] ? q2.shift() : k); });
    K.set('secorder', merged); apply(); follow();
    list.forEach(function (x, j) { if (x === d.s) return; var dlt = before[j] - x.getBoundingClientRect().top; if (dlt && x.animate && !reduce) { var sp = x.animate([{ transform: 'translateY(' + dlt + 'px)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,.8,.24,1)' }); sp.id = 'kzsd'; } });
    haptic();
  }
  function loop() {
    if (!d || !d.live) return;
    var edge = 90, vh = innerHeight;
    if (d.y < edge) scrollBy(0, -Math.ceil((edge - d.y) / 5)); else if (d.y > vh - edge) scrollBy(0, Math.ceil((d.y - (vh - edge)) / 5));
    follow(); swapCheck(); requestAnimationFrame(loop);
  }
  function drop(e) {
    if (!d || (e && e.pointerId !== undefined && e.pointerId !== d.pid && e.type !== 'touchend')) return;
    if (e && e.type === 'pointercancel' && d.live) return; // the iPhone sends this mid-hold; touchend finishes the move
    var x = d; d = null; clearTimeout(x.wait); setTimeout(function () { /* listener stays (Oct 27) */ }, 0);
    if (!x.live) return;
    var s = x.s, from = s.__dy || 0; s.__dy = 0; swallow = true; setTimeout(function () { swallow = false; }, 400);
    s.classList.remove('kzsd-lift'); s.classList.add('kzsd-drop'); s.style.transform = '';
    var done = function () { s.classList.remove('kzsd-drop'); document.body.classList.remove('kzsd-on'); };
    if (s.animate && !reduce && Math.abs(from) > .5) { var an = s.animate([{ transform: 'translate3d(0,' + from + 'px,0) scale(1.02)' }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.22,.8,.24,1)' }); an.onfinish = an.oncancel = done; } else done();
    haptic(); try { K.track('kz_sections_reordered', { order: order().join(',') }); } catch (er) {}
  }
  // Oct 27: one touchmove listener from page load. Added at pointerdown (old) it could arrive after iOS had already
  // decided the touch was a scroll, so preventDefault was ignored and the page scrolled under the lifted section (jitter).
  document.addEventListener('touchmove', tm, { passive: false });
  document.addEventListener('pointerup', drop); document.addEventListener('pointercancel', drop); document.addEventListener('touchend', drop, { passive: true });
  document.addEventListener('click', function (e) { if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('contextmenu', function (e) { if (isHead(e.target)) e.preventDefault(); });

  var q = 0; function soon() { if (q || (d && d.live)) return; q = requestAnimationFrame(function () { q = 0; try { apply(); } catch (e) {} }); }
  function boot() { apply(); var b = document.getElementById('kz-today-s1'); if (b) new MutationObserver(soon).observe(b, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
