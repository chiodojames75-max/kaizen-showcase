/* Nov 4: the climb on check-off (goal page) + the day-66 light at the top.
   Tap "Complete" on a goal page: the camera leans in on YOU, the orange line walks the new 131 ft, the number counts up,
   "+131 ft" rises, then it pulls back. On the check-off that reaches day 66 the flag pops and light breaks over the peak,
   and the existing "You made it." screen fades in after it instead of covering it.
   Skipped with Reduce Motion. Nothing is saved; it only animates what the page already drew. */
(function () {
  if (!/goal(\.html)?$/.test(location.pathname.replace(/\/$/, ''))) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var now = function () { return performance.now(); };
  var ease = { out: function (t) { return 1 - Math.pow(1 - t, 3); }, inOut: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; } };
  function anim(dur, fn, done) { var t0 = now(); (function f() { var t = Math.min(1, (now() - t0) / dur); fn(t); if (t < 1) requestAnimationFrame(f); else if (done) done(); })(); }
  var sc = function () { return document.querySelector('.kzmx-sc'); };
  var pathOf = function () { var s = sc(); return s && s.querySelector('svg.kzmx-rt .kzmx-ln-done'); };
  var gid = function () { var m = /[?&]id=([^&#]+)/.exec(location.search); return m ? decodeURIComponent(m[1]) : null; };
  var mtn = function () { try { var id = gid(); return id && K.mtn ? K.mtn(id) : null; } catch (e) { return null; } };
  var K = window.KZ || {};
  var busy = false, holdSum = false;

  // camera: photo + trail scale about a point; markers move with it but keep their size
  var cam = { k: 1, ox: 0, oy: 0 };
  function camApply() {
    var s = sc(); if (!s) return; var k = cam.k, o = cam.ox + 'px ' + cam.oy + 'px';
    [].forEach.call(s.querySelectorAll(':scope > img, :scope > canvas, :scope > svg'), function (el) { el.style.transformOrigin = o; el.style.transform = k === 1 ? '' : 'scale(' + k + ')'; });
    [].forEach.call(s.querySelectorAll(':scope > span:not(.kzfx-ft):not(.kzfx-ring)'), function (el) {
      if (el.__bx == null) { el.__bx = parseFloat(el.style.left); el.__by = parseFloat(el.style.top); }
      if (isNaN(el.__bx)) return;
      var bx = el.__live ? el.__lx : el.__bx, by = el.__live ? el.__ly : el.__by;
      el.style.left = (cam.ox + (bx - cam.ox) * k) + 'px'; el.style.top = (cam.oy + (by - cam.oy) * k) + 'px';
      if (!el.__live) el.style.opacity = k === 1 ? '' : String(Math.max(.08, 1 - (k - 1) / .5));
    });
  }
  function camReset() {
    cam.k = 1; camApply(); var s = sc(); if (!s) return;
    [].forEach.call(s.querySelectorAll(':scope > span'), function (q) { q.__live = 0; q.__bx = null; q.__by = null; q.style.scale = ''; });
    s.classList.remove('kzfx-run');
  }
  function ftEl() { var s = sc(), hd = s && s.querySelector('.kzmx-hd'); if (!hd) return null; return [].filter.call(hd.querySelectorAll('*'), function (x) { return !x.children.length && /^[\d,]+ ?ft$/.test(x.textContent.trim()); })[0] || null; }
  function setNum(v) { var e = ftEl(); if (e) e.textContent = Math.round(v).toLocaleString('en-US') + ' ft'; }

  function climb(L0, n0, top) {
    var STEP = (K.MTN && K.MTN.STEP) || 131, n1 = n0 + STEP, dur = 1800, ZK = 1.65, settle = now(), lastL = -1, t00 = now();
    busy = true; holdSum = top;
    (function wait() {
      var p = pathOf(), L = p ? p.getTotalLength() : 0;
      if (L !== lastL) { lastL = L; settle = now(); }
      if (now() - t00 > 1500) return done();                        // the trail never grew (undo, or nothing to draw)
      if (L <= L0 + .5 || now() - settle < 260) { setNum(n0); return requestAnimationFrame(wait); }
      go();
    })();
    function go() {
      var s = sc(); s.classList.add('kzfx-run');
      var ft = document.createElement('span'); ft.className = 'kzfx-ft'; ft.textContent = '+' + STEP + ' ft'; ft.setAttribute('aria-hidden', 'true'); s.appendChild(ft);
      var st0 = pathOf().getPointAtLength(L0), Z = 1, zin = now(); cam.ox = st0.x; cam.oy = st0.y;
      [].forEach.call(s.querySelectorAll('.kzmx-puck, .kzmx-lab.you'), function (q) { q.__live = 1; q.__lx = st0.x; q.__ly = st0.y; });
      (function zoomIn() { var u = Math.min(1, (now() - zin) / 550); Z = 1 + (ZK - 1) * ease.inOut(u); cam.k = Z; camApply(); setNum(n0); if (u < 1) requestAnimationFrame(zoomIn); else { t0 = now(); frame(); } })();
      var t0 = 0;
      function frame() {
        var t = Math.min(1, (now() - t0) / dur), e = ease.inOut(t), s = sc(), p = pathOf(); if (!s || !p) { ft.remove(); return done(); }
        var svg = s.querySelector('svg.kzmx-rt'), L1 = p.getTotalLength();
        if (L1 < L0) { ft.remove(); return done(); }                 // undone mid-climb: let the page's own drawing stand
        var len = L0 + (L1 - L0) * e, pt = p.getPointAtLength(len);
        [].forEach.call(svg.querySelectorAll('.kzmx-ln-dcase, .kzmx-ln-glow, .kzmx-ln-done'), function (q) { q.style.strokeDasharray = L1 + ' ' + (L1 + 10); q.style.strokeDashoffset = (L1 - len); });
        [].forEach.call(s.querySelectorAll('.kzmx-puck, .kzmx-lab.you'), function (q) { q.__live = 1; q.__lx = pt.x; q.__ly = pt.y; });
        cam.ox = pt.x; cam.oy = pt.y; cam.k = Z; camApply(); setNum(n0 + (n1 - n0) * e);
        if (ft.parentNode !== s) s.appendChild(ft);
        var pk = s.querySelector('.kzmx-puck'); if (pk) pk.style.scale = String(1 + .28 * Math.sin(e * Math.PI));
        var fu = Math.max(0, (t - .6) / .4); ft.style.left = pt.x + 'px'; ft.style.top = (pt.y - 26 - 22 * ease.out(fu)) + 'px'; ft.style.opacity = t < .6 ? 0 : Math.min(1, fu * 2.5);
        if (t < 1) return requestAnimationFrame(frame);
        if (pk) pk.style.scale = '';
        [].forEach.call(svg.querySelectorAll('.kzmx-ln-dcase, .kzmx-ln-glow, .kzmx-ln-done'), function (q) { q.style.strokeDasharray = ''; q.style.strokeDashoffset = ''; });
        var ring = document.createElement('span'); ring.className = 'kzfx-ring'; ring.style.left = pt.x + 'px'; ring.style.top = pt.y + 'px'; s.appendChild(ring);
        anim(700, function (u) { ring.style.transform = 'translate(-50%,-50%) scale(' + (1 + 2.4 * ease.out(u)) + ')'; ring.style.opacity = 1 - u; }, function () { ring.remove(); });
        var gl = svg.querySelector('.kzmx-ln-glow'); if (gl) anim(900, function (u) { gl.style.filter = 'brightness(' + (1 + 1.2 * Math.sin(u * Math.PI)) + ') drop-shadow(0 0 ' + (6 * Math.sin(u * Math.PI)) + 'px #FF8A3D)'; }, function () { gl.style.filter = ''; });
        anim(1300, function (u) { ft.style.opacity = u < .5 ? 1 : 1 - (u - .5) / .5; }, function () { ft.remove(); });
        setTimeout(function () {
          var zo = now();
          (function zoomOut() { var u = Math.min(1, (now() - zo) / 800); cam.k = ZK - (ZK - 1) * ease.inOut(u); camApply(); if (u < 1) requestAnimationFrame(zoomOut); else { camReset(); if (top) summit(); else done(); } })();
        }, 650);
      }
    }
  }

  function summit() {
    var s = sc(), flag = s && s.querySelector('.kzmx-summit'); if (!s || !flag) return done();
    var sr = s.getBoundingClientRect(), fr = flag.getBoundingClientRect(), cx = fr.left - sr.left + fr.width / 2, cy = fr.top - sr.top + fr.height * .5;
    var burst = document.createElement('div'); burst.className = 'kzfx-burst'; burst.style.left = cx + 'px'; burst.style.top = cy + 'px'; s.appendChild(burst);
    var tf = flag.style.transform, img = s.querySelector('img.kzmx-ph');
    flag.style.transformOrigin = '50% 100%';
    anim(650, function (u) { flag.style.scale = String(1 + .45 * Math.sin(u * Math.PI)); }, function () { flag.style.scale = ''; });
    if (img) anim(2600, function (u) { img.style.filter = 'brightness(' + (1 + .14 * Math.sin(u * Math.PI)) + ')'; }, function () { img.style.filter = ''; });
    anim(2800, function (u) { var e = ease.out(u); burst.style.opacity = Math.min(1, u * 4) * (1 - Math.max(0, (u - .45) / .55) * .5) * .8; burst.style.transform = 'translate(-50%,-50%) scale(' + (.25 + 1.5 * e) + ') rotate(' + (u * 18) + 'deg)'; },
      function () { done(); anim(900, function (u) { burst.style.opacity = .4 * (1 - u); }, function () { burst.remove(); }); });
  }

  function done() { busy = false; camReset(); if (holdSum) { holdSum = false; showHeld(); } }
  // the "You made it." screen: keep it hidden while the light plays, then fade it in
  function showHeld() { [].forEach.call(document.querySelectorAll('.kzmx-sum.kzfx-wait'), function (d) { d.classList.remove('kzfx-wait'); d.classList.add('kzfx-in'); }); }
  new MutationObserver(function (ms) {
    if (!holdSum) return;
    ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && n.classList.contains('kzmx-sum')) n.classList.add('kzfx-wait'); }); });
  }).observe(document.body, { childList: true });
  setTimeout(function safety() { if (holdSum && !busy) showHeld(); setTimeout(safety, 1000); }, 1000);

  // capture phase: read the "before" state, then let the app's own check-off run as usual
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kz-check'); if (!b || reduce || busy || !sc()) return;
    if (b.classList.contains('done') || b.getAttribute('aria-pressed') === 'true') return;   // undoing, not climbing
    var o = mtn(); if (!o || o.kind !== 'climb' || o.atTop) return;
    var p = pathOf(), L0 = p ? p.getTotalLength() : 0, f = ftEl(), n0 = f ? parseInt(f.textContent.replace(/\D/g, ''), 10) || 0 : 0;
    climb(L0, n0, (o.within || 0) + 1 >= ((K.MTN && K.MTN.TOP) || 66));
  }, true);
})();
