/* Oct 27 · kzav-1027 (all pages; works with kzfix3-1027's profile photo). James: "for the profile picture allow it to be
   cropped into the circle wherever on the image you want and make it so you can line it up to be centered" and "change
   the little camera with the gold pill to be a floating gold pencil".
   - After you pick a photo, a full-screen editor opens: the photo behind a circle. Drag to move it, pinch to zoom (the photo
     always fills the circle). While you move it, faint thirds lines show; when the middle of the photo lines up with the
     middle of the circle (across or up-and-down) it snaps there and a gold centre line lights up. Use photo saves exactly
     what's in the circle (512 px JPEG, only on the phone); Cancel keeps your old picture.
   - The badge on the picture is a floating gold pencil (no pill). Styles: kzav-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzav) return; K.__kzav = 1;
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="kzav-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6DE8D"/><stop offset=".5" stop-color="#E2B93B"/><stop offset="1" stop-color="#B8902E"/></linearGradient></defs>' +
    '<path class="b" d="M15.2 4.3l4.5 4.5L9 19.5 3.6 20.4l.9-5.4z"/><path class="t" d="M15.2 4.3l1.6-1.6a1.6 1.6 0 0 1 2.3 0l2.2 2.2a1.6 1.6 0 0 1 0 2.3l-1.6 1.6z"/><path class="n" d="M4.5 15l4.5 4.5-5.4.9z"/></svg>';
  function pens() {
    [].forEach.call(document.querySelectorAll('.kzav-cam'), function (c) { if (!c.classList.contains('kzav-pen')) { c.classList.add('kzav-pen'); c.innerHTML = PEN; } });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; pens(); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzav-pen, .kzcr')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  soon();

  // take over the photo picker's file (kzfix3 centre-crops it; we open the editor instead)
  document.addEventListener('change', function (e) {
    var inp = e.target;
    if (!inp || inp.type !== 'file' || inp.parentNode !== document.body || inp.style.display !== 'none' || !/image/.test(inp.accept || '')) return;
    var f = inp.files && inp.files[0]; if (!f) return;
    e.stopImmediatePropagation(); e.stopPropagation();
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () { inp.value = ''; editor(img, url); };
    img.onerror = function () { URL.revokeObjectURL(url); inp.value = ''; };
    img.src = url;
  }, true);

  function editor(img, url) {
    var W = window.innerWidth, H = window.innerHeight, D = Math.min(W - 48, 330), cx = W / 2, cy = Math.max(D / 2 + 110, H * 0.44);
    var iw = img.naturalWidth, ih = img.naturalHeight, min = D / Math.min(iw, ih), s = min, x = cx, y = cy;   // x,y = where the photo's middle is
    var o = document.createElement('div'); o.className = 'kzcr'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Move and scale your photo');
    o.innerHTML = '<p class="kzcr-t">Move and scale</p><img class="kzcr-img" alt="" draggable="false">' +
      '<div class="kzcr-hole"><i class="kzcr-g v1"></i><i class="kzcr-g v2"></i><i class="kzcr-g h1"></i><i class="kzcr-g h2"></i><i class="kzcr-c v"></i><i class="kzcr-c h"></i></div>' +
      '<p class="kzcr-hint">Drag to move · pinch to zoom<br>The gold line shows when it’s centred</p>' +
      '<div class="kzcr-acts"><button type="button" class="kzcr-b" data-cr="x">Cancel</button><button type="button" class="kzcr-b gold" data-cr="ok">Use photo</button></div>';
    document.body.appendChild(o);
    var el = o.querySelector('.kzcr-img'), hole = o.querySelector('.kzcr-hole'), cV = o.querySelector('.kzcr-c.v'), cH = o.querySelector('.kzcr-c.h');
    el.src = url;
    hole.style.cssText = 'width:' + D + 'px;height:' + D + 'px;left:' + (cx - D / 2) + 'px;top:' + (cy - D / 2) + 'px';
    document.documentElement.classList.add('kzcr-on');
    var SNAP = 8, snapX = true, snapY = true;
    function clamp() {
      s = Math.max(min, Math.min(min * 6, s));
      var hw = iw * s / 2, hh = ih * s / 2;
      x = Math.min(cx - D / 2 + hw, Math.max(cx + D / 2 - hw, x));
      y = Math.min(cy - D / 2 + hh, Math.max(cy + D / 2 - hh, y));
      snapX = Math.abs(x - cx) < SNAP; snapY = Math.abs(y - cy) < SNAP;
      if (snapX) x = cx; if (snapY) y = cy;
    }
    function draw() {
      clamp();
      el.style.width = iw * s + 'px'; el.style.height = ih * s + 'px';
      el.style.transform = 'translate3d(' + (x - iw * s / 2) + 'px,' + (y - ih * s / 2) + 'px,0)';
      cV.classList.toggle('on', snapX); cH.classList.toggle('on', snapY);
    }
    draw();
    // touch: one finger moves, two fingers pinch (zoom about the point between them)
    var g = null;
    function pts(e) { return [].map.call(e.touches, function (t) { return [t.clientX, t.clientY]; }); }
    function start(p) {
      if (p.length >= 2) { var mx = (p[0][0] + p[1][0]) / 2, my = (p[0][1] + p[1][1]) / 2; g = { two: 1, d: Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), s: s, mx: mx, my: my, x: x, y: y }; }
      else if (p.length === 1) g = { two: 0, px: p[0][0], py: p[0][1], x: x, y: y };
      o.classList.add('moving');
    }
    o.addEventListener('touchstart', function (e) { if (e.target.closest('.kzcr-acts')) return; e.preventDefault(); start(pts(e)); }, { passive: false });
    o.addEventListener('touchmove', function (e) {
      if (!g) return; e.preventDefault(); var p = pts(e);
      if (g.two && p.length >= 2) {
        var d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), mx = (p[0][0] + p[1][0]) / 2, my = (p[0][1] + p[1][1]) / 2, ns = Math.max(min, Math.min(min * 6, g.s * d / g.d)), k = ns / g.s;
        s = ns; x = mx + (g.x - g.mx) * k; y = my + (g.y - g.my) * k;
      } else if (!g.two && p.length === 1) { x = g.x + p[0][0] - g.px; y = g.y + p[0][1] - g.py; }
      draw();
    }, { passive: false });
    o.addEventListener('touchend', function (e) { var p = pts(e); if (p.length) start(p); else { g = null; o.classList.remove('moving'); } });
    // mouse (and the test browser): drag + wheel
    o.addEventListener('mousedown', function (e) { if (e.target.closest('.kzcr-acts')) return; g = { two: 0, px: e.clientX, py: e.clientY, x: x, y: y, m: 1 }; o.classList.add('moving'); });
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    function mm(e) { if (g && g.m) { x = g.x + e.clientX - g.px; y = g.y + e.clientY - g.py; draw(); } }
    function mu() { if (g && g.m) { g = null; o.classList.remove('moving'); } }
    o.addEventListener('wheel', function (e) { e.preventDefault(); var ns = Math.max(min, Math.min(min * 6, s * Math.exp(-e.deltaY / 400))), k = ns / s; s = ns; x = cx + (x - cx) * k; y = cy + (y - cy) * k; draw(); }, { passive: false });
    function done() {
      window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu);
      document.documentElement.classList.remove('kzcr-on'); o.classList.add('out');
      setTimeout(function () { o.remove(); URL.revokeObjectURL(url); }, 220);
    }
    o.querySelector('[data-cr="x"]').addEventListener('click', done);
    o.querySelector('[data-cr="ok"]').addEventListener('click', function () {
      var S = 512, c = document.createElement('canvas'); c.width = c.height = S; var cx2 = c.getContext('2d');
      var sx = (cx - D / 2 - (x - iw * s / 2)) / s, sy = (cy - D / 2 - (y - ih * s / 2)) / s, sw = D / s;
      cx2.imageSmoothingQuality = 'high'; cx2.drawImage(img, sx, sy, sw, sw, 0, 0, S, S);
      try { K.set('avatar', c.toDataURL('image/jpeg', 0.86)); } catch (er) {}
      try { document.dispatchEvent(new CustomEvent('kz:changed')); } catch (er) {}
      done();
    });
    K.__kzcrop = { get: function () { return { x: x, y: y, s: s, cx: cx, cy: cy, D: D, min: min, snapX: snapX, snapY: snapY }; } };
  }
})();
