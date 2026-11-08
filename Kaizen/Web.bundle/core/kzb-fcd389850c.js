/* ==== 0de968263346.js ==== */
;try {

  // Tapping the tab you're already on does nothing: no reload, no reset, the animals stay where they are.
  (function () { if (window.__kzTabGuard) return; window.__kzTabGuard = 1;
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('.kz-tabbar a[aria-current="page"]'); var here = function (x) { var p = x.pathname.replace(/\/index\.html$/, '/'), c = location.pathname.replace(/\/index\.html$/, '/'); return p === c; }; /* Oct 21: only block when you're really on that page (My goals lights up Today but tapping it goes back to Today) */ if (a && here(a)) { e.preventDefault(); e.stopPropagation(); try { sessionStorage.removeItem('kz_scroll:' + location.pathname); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (er) {} } /* Oct 22: tap-to-top */ }, true);
  })();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 978d80b77089.js ==== */
;try {

/* Oct 21: mark the page while a text field has focus (hides the tab bar so iOS can't carry it up with the keyboard) */
(function () { if (window.__kzTyping) return; window.__kzTyping = 1;
  var isText = function (el) { if (!el) return false; if (el.isContentEditable || el.tagName === 'TEXTAREA') return true; if (el.tagName !== 'INPUT') return false; var t = (el.type || 'text').toLowerCase(); return ['text', 'search', 'email', 'url', 'tel', 'number', 'password'].indexOf(t) >= 0; };
  var set = function () { document.documentElement.classList.toggle('kz-typing', isText(document.activeElement)); };
  document.addEventListener('focusin', set, true); document.addEventListener('focusout', function () { setTimeout(set, 60); }, true);
  // Goal note boxes get their Dictate button up front, so nothing appears (and shifts Save note) the moment you start typing
  var q = 0, prep = function () { q = 0; var K = window.KZ; if (!K || !K.dictate) return; document.querySelectorAll('.kz-gnbox').forEach(function (b) { if (b._mic) return; b._mic = 1; b._grow = 1; try { K.dictate(b); } catch (e) {} }); };
  var later = function () { if (!q) q = requestAnimationFrame(prep); };
  document.addEventListener('DOMContentLoaded', later); later();
  try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== f8bba0f02688.js ==== */
;try {

/* Oct 21: tapping "Today's goals" (the card or its folded strip) opens My goals. The fold arrow, the ⌃ button and the tree picture keep their own jobs. */
(function () { if (window.__kzGoalsTap) return; window.__kzGoalsTap = 1;
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var lab = t.closest('[data-t="pcard"] .kz-pcard-l > .kz-label49'); /* Oct 21 (11:40pm): only the words "Today's goals" open My goals; the rest of the card does nothing, the tree picture opens your tree */
    if (lab) { e.preventDefault(); e.stopImmediatePropagation(); location.href = '/pages/my-goals'; }
  }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== caac2baa40ad.js ==== */
;try {

/* Oct 21: fold buttons on Long-term goals, To-dos and Done today (remembered). Not on Tomorrow. */
(function () { if (window.__kzFold) return; window.__kzFold = 1;
  var KEY = 'kz_secfold', SECS = { 'kz-gsec': 'goals', 'kz-todosec': 'todos', 'kz-donesec': 'done' };
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  var save = function (o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
  var keyOf = function (sec) { if (sec.classList.contains('kz-tmr')) return 'tmr'; for (var c in SECS) if (sec.classList.contains(c)) return SECS[c]; return null; };
  var HEAD = ':scope > .kz-tsec-h, :scope > .kz-collhead';
  var paint = function (sec, shut) { sec.classList.toggle('kz-secshut', shut); var b = sec.querySelector(':scope > .kz-tsec-h > .kz-secfold, :scope > .kz-collhead > .kz-secfold'); if (b) { b.setAttribute('aria-expanded', String(!shut)); b.setAttribute('aria-label', (shut ? 'Show ' : 'Hide ') + ((sec.querySelector('h2, .kz-label49') || {}).textContent || 'section')); } };
  var q = 0, ensure = function () { q = 0; var st = load();
    document.querySelectorAll('section.kz-tsec, .kz-tmr').forEach(function (sec) { var k = keyOf(sec), h = sec.querySelector(HEAD); if (!k || !h) return;
      if (!h.querySelector(':scope > .kz-secfold')) { var b = document.createElement('button'); b.type = 'button'; b.className = 'kz-secfold'; b.dataset.sec = k; b.innerHTML = CHEV; h.appendChild(b); }
      paint(sec, !!st[k]); });
  };
  var later = function () { if (!q) q = requestAnimationFrame(ensure); };
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.kz-secfold'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var st = load(), k = b.dataset.sec; st[k] = !st[k]; save(st); paint(b.closest('section.kz-tsec, .kz-tmr'), !!st[k]); try { navigator.vibrate(4); } catch (er) {} }, true);
  document.addEventListener('DOMContentLoaded', later); later();
  try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== d33e08c53ba9.js ==== */
;try {

/* Oct 21: backdrop parallax + launch morph (loading triangle grows into the backdrop, gold dust scatters off it) */
(function () { if (window.__kzBd) return; window.__kzBd = 1;
  var RM = false; try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var tri = document.querySelector('#kz-bd .kz-bd-tri');
  if (tri && /growth/.test(location.pathname)) tri.style.opacity = '.4'; /* Growth's chart is a triangle too: keep the backdrop quieter there */
  var DRIFT = 0.14, MAXD = 90, lastY = -1, q = 0;
  var place = function () { q = 0; if (!tri) return; var y = Math.min(MAXD, Math.max(0, window.scrollY || 0) * DRIFT); if (y === lastY) return; lastY = y;
    tri.style.transform = 'translate3d(-50%, calc(-50% - ' + y.toFixed(1) + 'px), 0)'; };
  if (tri && !RM) { window.addEventListener('scroll', function () { if (!q) q = requestAnimationFrame(place); }, { passive: true }); place(); }

  /* gold dust along the triangle's lines; half drift outward, half fall inward */
  function dust(cv, rect) {
    var dpr = Math.min(3, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    var x = cv.getContext('2d'); if (!x) return; x.scale(dpr, dpr);
    var sx = rect.width / 88, sy = rect.height / 78, ox = rect.left - 56 * sx, oy = rect.top - 52 * sy, cx = 100, cy = 101;
    var seg = [[64, 122, 136, 122], [136, 122, 100, 60], [100, 60, 82, 91]], len = [72, 71.7, 35.8], tot = 179.5, P = [];
    for (var i = 0; i < 170; i++) { var r = Math.random() * tot, k = 0; while (k < 2 && r > len[k]) { r -= len[k]; k++; } var s = seg[k], f = Math.min(1, r / len[k]);
      var px = s[0] + (s[2] - s[0]) * f, py = s[1] + (s[3] - s[1]) * f, dx = px - cx, dy = py - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, dir = Math.random() < .55 ? 1 : -.7, sp = 18 + Math.random() * 70;
      P.push({ x: ox + px * sx, y: oy + py * sy, vx: dx / d * sp * dir + (Math.random() - .5) * 24, vy: dy / d * sp * dir + (Math.random() - .5) * 24 - 10, life: 700 + Math.random() * 600, r: .5 + Math.random() * 1.5, c: px < 100 ? '184,144,46' : '233,197,90' }); }
    var t0 = performance.now(), last = t0;
    (function frame(now) { var dt = Math.min(40, now - last) / 1000; last = now; x.clearRect(0, 0, W, H); var alive = 0;
      for (var j = 0; j < P.length; j++) { var p = P[j], age = now - t0; if (age > p.life) continue; alive++; p.vx *= .985; p.vy *= .985; p.x += p.vx * dt; p.y += p.vy * dt;
        var a = 1 - age / p.life; x.globalAlpha = a * a * .9; x.fillStyle = 'rgb(' + p.c + ')'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.2832); x.fill(); }
      if (alive && cv.isConnected) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H); })(t0);
  }

  window.__kzBdMorph = function (s, opt) { opt = opt || {};
    var end = function () { if (s.isConnected) s.remove(); };
    var sv = s.querySelector('svg'), word = s.querySelector('span'), bg = s.querySelector('.kz-sp-bg');
    if (RM || !sv || !tri || !bg || !Element.prototype.animate) { s.classList.add('out'); setTimeout(end, 550); return; }
    place(); var a = sv.getBoundingClientRect(), b = tri.getBoundingClientRect(); if (!a.width || !b.width) { s.classList.add('out'); setTimeout(end, 550); return; }
    var m = document.createElement('div'); m.className = 'kz-sp-morph'; m.innerHTML = tri.innerHTML;
    var rr = m.querySelector('.kz-bd-runs'); if (rr) rr.remove();
    m.style.left = b.left + 'px'; m.style.top = b.top + 'px'; m.style.width = b.width + 'px'; m.style.height = b.height + 'px';
    var k = a.width / b.width, dx = (a.left + a.width / 2) - (b.left + b.width / 2), dy = (a.top + a.height / 2) - (b.top + b.height / 2);
    var from = 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + k + ')', to = 'translate3d(0,0,0) scale(1)';
    var line = m.querySelector('.kz-bd-line'), glow = m.querySelector('.kz-bd-glow');
    m.style.transform = from; line.style.opacity = '1'; glow.style.opacity = '.45';
    s.appendChild(m); sv.style.visibility = 'hidden';
    var EASE = 'cubic-bezier(.65,0,.15,1)', T = 950, R = 520;
    m.animate([{ transform: from }, { transform: to }], { duration: T, easing: EASE, fill: 'forwards' });
    line.animate([{ opacity: 1 }, { opacity: .06 }], { duration: T, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    glow.animate([{ opacity: .45 }, { opacity: .05 }], { duration: T, easing: 'ease-out', fill: 'forwards' });
    if (word) word.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    var cv = document.createElement('canvas'); cv.className = 'kz-sp-dust'; s.appendChild(cv);
    if (!opt.noDust) setTimeout(function () { try { dust(cv, b); } catch (e) {} }, T * .62);
    setTimeout(function () {
      /* the backdrop triangle is already in the same spot underneath: fade the cover and the copy together so nothing pops */
      bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: R, easing: 'linear', fill: 'forwards' });
      m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: R, easing: 'linear', fill: 'forwards' });
      cv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: R + 250, easing: 'ease-in', fill: 'forwards' });
      s.style.pointerEvents = 'none';
      setTimeout(end, R + 280);
    }, T);
  };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 18390e64cbb2.js ==== */
;try {

/* Oct 21 (Oct 22 perf): solid base under see-through boxes so their left half matches their right half.
   Only known box types are checked, and a box is only recomputed when its classes change. */
/* Oct 24 (speed): retired. The page background has been plain black since Oct 22 (no more two-tone), so a black base under
   see-through boxes changes nothing on screen - but measuring every box cost ~250 ms per screen with many goals and re-ran on
   every tap. Screenshots of all 10 screens were compared pixel for pixel before and after: identical. */
(function () { if (window.__kzSolid) return; window.__kzSolid = 1; return;
  var BASE = 'linear-gradient(#000, #000)';
  var LIST = '.kz-btn.navy, .kz-btn.ghost, .kz-j2-today, .kz-quiet, .kz-planbtn, .kz-qstrip, .kz-todo-empty, details.kz-fold, .kz-mestats > div, .kz-tiles3 > div, .kz-calday, .kz-card, .kz-card49, .kz-goal, .kz-j2-empty, .kz-j2-stats, .kz-seg, .kz-rankcard, .kz-shieldrow, input.kz-input, .kz-rowlist, select, .kz-xprules > ul, .kz-rescue, .kz-undo, .kz-plancard';
  var SKIP = '#kz-bd, #kz-splash, .kz-tabbar, #kz-header, .kz-fab, [role="dialog"], .kz-wcard, .kz-delta, .kz-sheet49, .kz-qmodal, .kz-planview';
  var alpha = function (c) { var v = String(c).match(/[\d.]+/g); return !v ? 0 : v.length === 4 ? +v[3] : 1; };
  var seeThrough = function (cs) { var a = alpha(cs.backgroundColor), img = cs.backgroundImage; return (a > 0 && a < 1) || (a === 0 && !!img && img !== 'none' && /gradient/.test(img)); };
  var clear = function (cs) { return alpha(cs.backgroundColor) === 0 && (!cs.backgroundImage || cs.backgroundImage === 'none'); };
  function fix(el) {
    var key = el.className + '|' + (el.parentElement ? el.parentElement.className : ''); if (el._kzsb === key) return; el._kzsb = key;
    el.style.removeProperty('background-image'); el.style.removeProperty('background-color'); delete el.dataset.kzsb;
    if (el.closest(SKIP)) return;
    var r = el.getBoundingClientRect(); if (r.width < 110 || r.height < 26) { el._kzsb = ''; return; }
    var cs = getComputedStyle(el); if (!seeThrough(cs)) return;
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) if (!clear(getComputedStyle(p))) return;
    var layers = []; if (cs.backgroundImage && cs.backgroundImage !== 'none') layers.push(cs.backgroundImage);
    if (alpha(cs.backgroundColor) > 0) layers.push('linear-gradient(' + cs.backgroundColor + ', ' + cs.backgroundColor + ')');
    layers.push(BASE);
    el.style.setProperty('background-image', layers.join(', '), 'important'); el.style.setProperty('background-color', 'transparent', 'important'); el.dataset.kzsb = '1';
  }
  var q = 0, run = function () { q = 0; var l = document.querySelectorAll(LIST); for (var i = 0; i < l.length; i++) fix(l[i]); };
  var soon = function () { if (!q) q = requestAnimationFrame(run); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
  window.addEventListener('load', soon);
  document.addEventListener('click', function () { setTimeout(soon, 60); }, true);
  ['kz:step', 'kz:goals', 'kz:changed', 'kz:plan'].forEach(function (ev) { document.addEventListener(ev, soon); });
  try { new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var n = ms[i].target; if (n.closest && n.closest('.kz-cr, .kz-treeview, #kz-bd, #kz-splash, .kz-ambient')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 56eb096188b1.js ==== */
;try {

/* Oct 21: tap the top-left triangle -> a small card drops from the top: the triangle is delta, the symbol for change */
(function () { if (window.__kzDelta) return; window.__kzDelta = 1;
  var MK = '<svg viewBox="56 52 88 78" aria-hidden="true"><defs><linearGradient id="kzdlg" gradientUnits="userSpaceOnUse" x1="64" y1="0" x2="136" y2="0"><stop offset="0" stop-color="#B8902E"/><stop offset=".5" stop-color="#B8902E"/><stop offset=".5" stop-color="#E9C55A"/><stop offset="1" stop-color="#E9C55A"/></linearGradient></defs><path d="M64 122 H136 L100 60 L82 91" fill="none" stroke="url(#kzdlg)" stroke-width="9" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
  var cur = null, tm = 0;
  function close() { var c = cur; if (!c) return; cur = null; clearTimeout(tm); c.classList.remove('on'); c.classList.add('off'); setTimeout(function () { c.remove(); }, 320); document.removeEventListener('click', outside, true); }
  function outside(e) { if (cur && !e.target.closest('.kz-delta-in')) { close(); if (e.target.closest('#kz-header .kz-mark')) { e.preventDefault(); e.stopImmediatePropagation(); } } }
  function open() {
    if (cur) { close(); return; }
    var c = document.createElement('div'); c.className = 'kz-delta'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'What the triangle means');
    c.innerHTML = '<div class="kz-delta-in"><span class="kz-delta-mk">' + MK + '</span><span class="kz-delta-tx"><small>Δ · Delta</small><b>The triangle is delta, the symbol for change.</b><span>Kaizen means small, steady change. Every goal you check off is a little Δ.</span></span></div>';
    document.body.appendChild(c); void c.offsetWidth; c.classList.add('on'); cur = c;
    try { navigator.vibrate(6); } catch (e) {}
    c.querySelector('.kz-delta-in').addEventListener('click', close);
    setTimeout(function () { document.addEventListener('click', outside, true); }, 0);
    tm = setTimeout(close, 7000);
    var y0 = null; c.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    c.addEventListener('touchmove', function (e) { if (y0 !== null && e.touches[0].clientY - y0 < -18) { y0 = null; close(); } }, { passive: true });
  }
  document.addEventListener('click', function (e) { var m = e.target.closest && e.target.closest('#kz-header .kz-mark'); if (!m || cur) return; e.preventDefault(); e.stopImmediatePropagation(); open(); }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== cafdc737b5ae.js ==== */
;try {

/* Oct 21: app opened fresh (fully closed before) -> "Shockwave": the logo draws, pulses once, a gold outline rushes out past the edges
   while the cover pulls back toward the logo, and the logo sinks into the background.
   Reopened from the background (app still running) -> "Draw behind": the background triangle draws itself behind the cards. No wait. */
(function () { if (window.__kzShock) return; window.__kzShock = 1;
  var RM = false; try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  // Draw behind on every return from the background
  var away = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { away = 1; return; }
    if (!away) return; away = 0;
    if (document.getElementById('kz-splash')) return;
    var h = document.documentElement; h.classList.remove('kz-bd-draw'); void h.offsetWidth; h.classList.add('kz-bd-draw');
  });
  var s = document.getElementById('kz-splash'); if (!s || !s.classList.contains('kz-shock')) return;
  var fade = function () { s.classList.add('out'); setTimeout(function () { if (s.isConnected) s.remove(); }, 550); };
  var sv = s.querySelector('svg'), word = s.querySelector('span'), bg = s.querySelector('.kz-sp-bg'), tri = document.querySelector('#kz-bd .kz-bd-tri');
  if (RM || !sv || !bg || !tri || !Element.prototype.animate) return; // the splash's own timer fades it out
  s.dataset.go = 1;
  var t0 = +s.dataset.t0 || Date.now(), started = 0;
  function run() {
    if (started || !s.isConnected) return; started = 1;
    var a = sv.getBoundingClientRect(), b = tri.getBoundingClientRect(); if (!a.width || !b.width) { fade(); return; }
    var cx = a.left + a.width / 2, cy = a.top + a.height / 2, ES = 'cubic-bezier(.65,0,.15,1)';
    // the copy that grows into the background triangle (same look as the real one underneath)
    var m = document.createElement('div'); m.className = 'kz-sp-morph'; m.innerHTML = tri.innerHTML;
    m.style.left = b.left + 'px'; m.style.top = b.top + 'px'; m.style.width = b.width + 'px'; m.style.height = b.height + 'px';
    var k = a.width / b.width, from = 'translate3d(' + (cx - (b.left + b.width / 2)) + 'px,' + (cy - (b.top + b.height / 2)) + 'px,0) scale(' + k + ')';
    var line = m.querySelector('.kz-bd-line'), glow = m.querySelector('.kz-bd-glow');
    m.style.transform = from; m.style.visibility = 'hidden'; if (line) line.style.opacity = '1'; if (glow) glow.style.opacity = '.45';
    // the shockwave outline
    var ring = document.createElement('div'); ring.className = 'kz-sp-morph';
    ring.style.left = a.left + 'px'; ring.style.top = a.top + 'px'; ring.style.width = a.width + 'px'; ring.style.height = a.height + 'px'; ring.style.opacity = '0';
    ring.innerHTML = '<svg viewBox="56 52 88 78" aria-hidden="true"><path d="M64 122 H136 L100 60 L82 91" fill="none" stroke="url(#kzbdg)" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
    s.appendChild(m); s.appendChild(ring);
    if (word) word.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
    // 1. pulse
    sv.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-in-out' });
    // 2. outline rushes out; the cover pulls back toward the logo
    ring.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(14)' }], { duration: 1000, delay: 200, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    var c0 = 'circle(150% at ' + cx + 'px ' + cy + 'px)', c1 = 'circle(0% at ' + cx + 'px ' + cy + 'px)';
    try { bg.animate([{ clipPath: c0, webkitClipPath: c0 }, { clipPath: c1, webkitClipPath: c1 }], { duration: 900, delay: 250, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }); } catch (e) { bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 250, fill: 'forwards' }); }
    s.style.pointerEvents = 'none';
    // 3. the logo sinks into the background
    setTimeout(function () {
      m.style.visibility = 'visible'; sv.style.visibility = 'hidden';
      m.animate([{ transform: from }, { transform: 'translate3d(0,0,0) scale(1)' }], { duration: 900, easing: ES, fill: 'forwards' });
      if (line) line.animate([{ opacity: 1 }, { opacity: .06 }], { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      if (glow) glow.animate([{ opacity: .45 }, { opacity: .05 }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
    }, 400);
    // 4. the copy lands exactly on the real triangle, then fades so only the real one (behind the cards) remains
    setTimeout(function () { m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'linear', fill: 'forwards' }); }, 1300);
    setTimeout(function () { if (s.isConnected) s.remove(); }, 1680);
  }
  var go = function () { setTimeout(run, Math.max(0, 1300 - (Date.now() - t0))); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  setTimeout(function () { if (!started) go(); }, 3500);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 65f652c6c320.js ==== */
;try {

/* Oct 22: robustness
   1) a new day while the app is open (or when you come back to it) refreshes the page, so dates, water and goals are never stale
   2) one automatic backup copy of your data per day, keeping the newest 3 (used to repair a damaged save)
   3) a clear notice if your data can't be saved */
(function () { if (window.__kzRobust) return; window.__kzRobust = 1;
  var K = window.KZ; if (!K || !K.key) return;
  var day0 = K.key(K.today());
  var busy = function () { var a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return true; return !!document.querySelector('[role="dialog"]:not([hidden]), .kz-noscroll, #kz-splash'); };
  var check = function () { if (K.key(K.today()) === day0) return; if (busy()) return; day0 = K.key(K.today()); try { location.reload(); } catch (e) {} };
  setInterval(check, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(check, 50); });
  setTimeout(function () {
    try { var t = 'kzbak_' + K.key(K.today()); if (localStorage.getItem(t) !== null) return; var o = {};
      Object.keys(localStorage).forEach(function (x) { if (/^(kz_|kzreset)/.test(x)) o[x] = localStorage.getItem(x); });
      var s = JSON.stringify(o); if (s.length > 1500000) return; localStorage.setItem(t, s);
      Object.keys(localStorage).filter(function (x) { return x.indexOf('kzbak_') === 0; }).sort().reverse().slice(3).forEach(function (x) { localStorage.removeItem(x); });
    } catch (e) {}
  }, 4000);
  document.addEventListener('kz:savefail', function () {
    if (document.querySelector('.kz-savefail')) return; var n = document.createElement('div'); n.className = 'kz-savefail'; n.setAttribute('role', 'alert');
    n.innerHTML = '<b>Kaizen couldn’t save your last change.</b>Its storage on this iPhone is full. Go to Me → Export my data to keep a copy, then delete old journal entries.';
    document.body.appendChild(n); n.addEventListener('click', function () { n.remove(); }); setTimeout(function () { if (n.isConnected) n.remove(); }, 12000);
  });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzlock-1025s.js ==== */
;try {

/* Oct 22 (reel plan): scroll memory, one-tap lock, tab direction, rating after a win, trial reminder hook */
(function () { if (window.__kzReel) return; window.__kzReel = 1;
  var K = window.KZ, ss = function () { try { return window.sessionStorage; } catch (e) { return null; } }();
  var native = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  var post = function (m) { try { if (native()) window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };

  /* 8. Scroll memory: each page remembers where you were for this session (a cold launch starts at the top) */
  var SK = 'kz_scroll:' + location.pathname;
  var save = function () { try { if (ss) ss.setItem(SK, String(Math.round(window.scrollY || 0))); } catch (e) {} };
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  var want = 0; try { want = ss ? +(ss.getItem(SK) || 0) : 0; } catch (e) {}
  if (want > 0) {
    var tries = 0, stop = false, restore = function () {
      if (stop) return; var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max >= want - 2) { window.scrollTo(0, want); stop = true; return; }
      if (++tries < 25) setTimeout(restore, 60); else { window.scrollTo(0, Math.max(0, max)); stop = true; }
    };
    ['touchstart', 'wheel'].forEach(function (ev) { window.addEventListener(ev, function () { stop = true; }, { once: true, passive: true }); });
    if (document.readyState === 'complete') requestAnimationFrame(restore); else window.addEventListener('load', function () { requestAnimationFrame(restore); });
  }
  var st = 0; window.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(save, 120); }, { passive: true });
  window.addEventListener('pagehide', save); document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });

  /* 10. Tab direction: remember which way we're going, the next page reads it in <head> */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.kz-tabbar a'); if (!a || e.defaultPrevented) return;
    var tabs = [].slice.call(a.parentNode.querySelectorAll('a')), to = tabs.indexOf(a), cur = -1;
    tabs.forEach(function (x, i) { if (x.getAttribute('aria-current') === 'page') cur = i; });
    save(); if (cur < 0 || to === cur) return;
    try { if (ss) ss.setItem('kz_vtdir', JSON.stringify({ d: to > cur ? 'fwd' : 'back', t: Date.now() })); } catch (er) {}
  });

  /* 9. One-tap lock: a second tap on the same save / add / lock-in / check button within 600 ms is ignored */
  var last = null, lastT = 0, TEXT = /^(save|add|lock|create|done|continue|log|plant|start|finish|set|keep|confirm|send|update|delete|clear|turn)\b/i;
  var guarded = function (b) {
    if (b.matches('.kz-check, .kz-pcheck, [data-k66="check"], [data-q-clean], [data-q-undo], .kzf-check, [role="checkbox"]')) return false;   /* Oct 25 s (kzlock-1025s, from 12e29bd34a78): check boxes toggle on every tap, never locked (James: fast on/off tapping lagged) */
    if (b.matches('[data-t="pm-save"], [data-t="pm-add"], [type="submit"], .kz-btn, .kz-fab, [data-kz-once]')) return true;
    return TEXT.test(String(b.textContent || '').trim());
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, [role="button"], input[type="submit"]'); if (!b || b.closest('.kz-tabbar')) return;
    if (!guarded(b)) return; var now = Date.now(), key = b.getAttribute('data-kz-done') || b.getAttribute('data-t') || b.id || b; /* lists re-render, so match by what the button is, not the element */
    if (key === last && now - lastT < 600) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    last = key; lastT = now;
  }, true);

  if (!K) return;

  /* 5. Rating: moved to core/kzp4-1023h.js (Oct 23, Phase 4): right after every goal is done or a milestone, never in the first 3 days, at most once every 120 days. */

  /* 11. Free-trial reminder: 2 days before the trial ends, with the date and price.
     Nothing calls this yet - the paywall will, once it exists. */
  K.trialReminder = function (endsAt, price) { var t = +new Date(endsAt); if (!t || !price) return false; post({ type: 'trialReminder', ends: t, price: String(price) }); return true; };
  K.trialReminderOff = function () { post({ type: 'trialReminderOff' }); };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== 1dddad8ca7f2.js ==== */
;try {

/* Oct 22: keyboard - nothing moves. The app holds the view still from the tap until the keyboard is up;
   then, only if the keyboard covers the box, that box's own sheet (or the page content) lifts just enough. */
(function () { if (window.__kzKb) return; window.__kzKb = 1;
  var isText = function (el) { return !!el && (el.tagName === 'TEXTAREA' || el.isContentEditable || (el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range|file|hidden|color|date|time)$/i.test(el.type || ''))); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var vvH = function () { var vv = window.visualViewport; return vv ? vv.height + vv.offsetTop : window.innerHeight; };
  var kbH = function () { return Math.max(0, Math.round(window.innerHeight - vvH())); };
  var pinned = null, lifted = null;
  // A bottom sheet with the keyboard up: held at its current height and place, with room for the keyboard added
  // inside it, so it always scrolls on its own (even when it's short) and never moves.
  var pin = function (sc) {
    if (pinned === sc) return; unpin();
    var h = Math.round(sc.getBoundingClientRect().height);
    sc.dataset.kzPad = sc.style.paddingBottom || ''; sc.dataset.kzH = sc.style.height || '';
    sc.style.height = h + 'px'; sc.style.paddingBottom = 'calc(24px + env(safe-area-inset-bottom, 0px) + ' + kbH() + 'px)';
    sc.classList.add('kz-kbpin'); pinned = sc;
  };
  var unpin = function () { if (!pinned) return; var sc = pinned; pinned = null; sc.style.paddingBottom = sc.dataset.kzPad || ''; sc.style.height = sc.dataset.kzH || ''; sc.classList.remove('kz-kbpin'); };
  var drop = function () { unpin(); if (lifted) { lifted.style.translate = ''; var l = lifted; setTimeout(function () { if (l !== lifted) l.style.transition = ''; }, 260); lifted = null; } };
  var open = function () { return kbH() > 100; };
  var check = function () {
    var a = document.activeElement; if (!isText(a)) return;
    var sc = a.closest('.kz-sheet49') && a.closest('.kz-sheet-in');
    if (sc && open()) pin(sc);
    var need = Math.ceil(a.getBoundingClientRect().bottom + 12 - vvH()); if (need <= 0) return; // already visible: nothing moves
    if (sc) { sc.scrollBy({ top: need, behavior: 'smooth' }); return; } // only the sheet's own contents scroll
    var dlg = a.closest('[role="dialog"], .kz-qmodal, .kz-reveal, .kz-twelcome, .kz-welcome');
    if (dlg) { var panel = dlg.firstElementChild && dlg.firstElementChild.contains(a) ? dlg.firstElementChild : dlg;
      if (lifted && lifted !== panel) { lifted.style.translate = ''; } lifted = panel;
      var cur = parseFloat(String(panel.style.translate || '0 0').split(' ')[1]) || 0; /* 'translate', not 'transform': the sheet's own open animation holds transform */
      panel.style.transition = 'translate 200ms cubic-bezier(.2,.8,.2,1)'; panel.style.translate = '0 ' + Math.round(cur - need) + 'px'; return; }
    window.scrollBy({ top: need, behavior: 'smooth' }); // a box in the page itself: only the page content moves, never the background
  };
  window.__kzKbShown = check;
  document.addEventListener('focusin', function (e) {
    var t = e.target; if (!isText(t)) return;
    if (t.tagName === 'INPUT' && !t.hasAttribute('enterkeyhint')) t.setAttribute('enterkeyhint', 'done');
    post({ type: 'kbHold' }); if (open()) setTimeout(check, 350);
  }, true);
  document.addEventListener('focusout', function () { setTimeout(function () { if (!isText(document.activeElement)) drop(); }, 60); }, true);
  // Return puts the keyboard away. In the New goal sheet it does only that (no adding the goal by accident);
  // everywhere else the box keeps its Return action (add a to-do, save a name) and then the keyboard closes.
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.key !== 'Enter' || e.isComposing || !t || t.tagName !== 'INPUT' || !isText(t)) return;
    if (t.closest('.kz-addsheet')) { e.preventDefault(); e.stopPropagation(); t.blur(); return; }
    setTimeout(function () { var a = document.activeElement; if (a && a.tagName === 'INPUT' && isText(a)) a.blur(); }, 0);
  }, true);
  // While a sheet or pop-up is open, the page behind it can't scroll at all (the app turns that off natively).
  var bg = null, sync = function () { var on = !document.body.classList.contains('kz-noscroll'); if (on !== bg) { bg = on; post({ type: 'pageScroll', on: on }); } };
  try { new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
  sync();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
