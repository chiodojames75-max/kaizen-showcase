/* Nov 2 · replaces kzorb-1024a.js: the shield ring counts toward the next checkpoint (K.shieldNext, kzshield-1102), not the next 7 days. */
/* Oct 24 (later) · Option A "Living Orrery" (James): orbit distance = days since that branch was last checked off.
   0-1 days: tight inner orbit · 2-3: middle · 4+: drifting (outer, dashed ring, dimmer planet, "drifting" label).
   Checking a branch off pulls it back in on the next render. Branches with no goals sit on the outermost rings.
   Oct 24 · Balance orbit is now real 3D: drag any direction (x, y, z), momentum, depth sorting, auto-fit so nothing clips.
   Oct 23 · Progress reset, option C "Orbit" (James), with B's shield ring and B's dashed "+ Branch" chips.
   Stats hero (gold streak number, best, days grown, this week), Balance as an orbit (planets = branches with goals,
   size = share of the last 14 days' completed steps; drag to turn), empty branches as "+ Name" chips, shields as a ring card.
   History is untouched. Every number comes from the page's own functions; the old cards stay in the page (hidden) so the
   branch editor, share image and links keep working. If anything here throws, the old page stays as it was.
   Styles: kzorb-1023ab.css */
(function () {
  var K = window.KZ, root = document.documentElement; if (!K || K.__kzorb) return; K.__kzorb = 1;
  var esc = K.esc || function (s) { return String(s); };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sec, hero, bal, shc, P = [], sig = '';
  var DL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  var SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
  var SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/></svg>';
  function n(t) { return parseInt(String(t || '').replace(/[^\d]/g, ''), 10) || 0; }

  // ---------- hero: streak ----------
  function heroHTML() {
    var st = 0, best = 0; try { st = K.streak(); best = K.bestStreak(); } catch (e) {}
    var tiles = sec.querySelectorAll('[data-p="tiles"] > div > b'), grown = tiles[2] ? n(tiles[2].textContent) : 0;
    var t = K.today(), tk = K.key(t), s0 = K.addDays(t, -t.getDay()), wk = '';
    for (var i = 0; i < 7; i++) {
      var k = K.key(K.addDays(s0, i)), s = ''; try { s = (K.dayInfo(k) || {}).status; } catch (e) {}
      var c = (s === 'full' || s === 'grew') ? 'on' : s === 'rest' ? 'rest' : s === 'future' ? 'fut' : '';
      wk += '<span class="kzo-d' + (k === tk ? ' now' : '') + '"><i class="' + c + '"></i><b>' + DL[i] + '</b></span>';
    }
    return '<button type="button" class="kzo-share" aria-label="Share your streak">' + SHARE + '</button>' +
      '<div class="kzo-big">' + st + '</div>' +
      '<div class="kzo-sub">day streak · best ' + best + ' · ' + grown + (grown === 1 ? ' day' : ' days') + ' grown</div>' +
      '<div class="kzo-week" role="img" aria-label="This week">' + wk + '</div>';
  }

  // ---------- Balance: orbit in real 3D (Oct 24, James: "a 360 axis like all ways x, y, z") ----------
  // Each branch has its own slightly tilted orbit around the gold sun. Drag any direction to turn the whole system
  // (a trackball: quaternion orientation, finger-tracked, with a little momentum). Elements are built once and only
  // their coordinates change per frame, so nothing flickers. The view zooms out just enough to keep every planet and
  // label inside the card at any angle, so nothing is ever cut off.
  var W = 358, H = 212, CX = 179, CY = 106, RP = 150, FOC = 6, SUN = 26, MRG = 6, LBL = 19, NS = 72;
  var INC = [5, -8, 11, -4, 9, -11, 6, -7, 3, -9], q = qAxis([1, 0, 0], -0.52), G = null, zoom = 1;
  function qAxis(a, t) { var s = Math.sin(t / 2); return [Math.cos(t / 2), a[0] * s, a[1] * s, a[2] * s]; }
  function qMul(a, b) { return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]]; }
  function qNorm(a) { var l = Math.hypot(a[0], a[1], a[2], a[3]) || 1; return [a[0] / l, a[1] / l, a[2] / l, a[3] / l]; }
  function qMat(a) { var w = a[0], x = a[1], y = a[2], z = a[3];
    return [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y), 2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x), 2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]; }
  function turn(dx, dy, pxPerUnit) { // finger moved (dx, dy) screen px: the point under it follows
    var l = Math.hypot(dx, dy); if (!l) return; q = qNorm(qMul(qAxis([-dy / l, dx / l, 0], l / pxPerUnit), q));
  }
  function rates() {
    var R = []; try { R = K.pathRates(14) || []; } catch (e) {}
    var paths = K.PATHS || [];
    var done = {}, gs = []; try { done = K.get('done', {}) || {}; gs = K.goals() || []; } catch (e) {}
    var tk = K.key(K.today()), t0 = new Date(tk + 'T12:00:00').getTime();
    return paths.map(function (p) {
      var r = R.filter(function (x) { return x.id === p.id; })[0] || {}, last = '';
      gs.forEach(function (g) { var pid = ''; try { pid = K.pathOf(g); } catch (e) {} if (pid !== p.id) return;
        var ks = Object.keys(done[g.id] || {}).filter(function (k) { return done[g.id][k] && k <= tk; }).sort(), lk = ks.length ? ks[ks.length - 1] : (g.created || tk);
        if (lk > last) last = lk; });
      var away = last ? Math.max(0, Math.round((t0 - new Date(last + 'T12:00:00').getTime()) / 864e5)) : 0;
      return { id: p.id, name: r.name || p.name, color: r.color || p.c2, goals: r.goals || 0, share: r.share || 0, away: away, tier: away <= 1 ? 0 : away <= 3 ? 1 : 2 };
    });
  }
  function orbitModel() { // body frame: orbits lie near the x-z plane, y is "up"
    var BASE = [0.42, 0.66, 0.86], seen = [0, 0, 0], idle = 0;
    return P.map(function (o, i) {
      var r = o.goals ? BASE[o.tier] + 0.07 * (seen[o.tier]++) : 0.96 + 0.05 * (idle++); inc = INC[i % INC.length] * Math.PI / 180, nd = i * 1.3, ph = i * 2.39996 + 0.6;
      var ax = [Math.cos(nd), 0, Math.sin(nd)], c = Math.cos(inc), s = Math.sin(inc);
      var pt = function (t) { // a point on the flat ring, tilted by inc about the node axis (Rodrigues)
        var v = [r * Math.cos(t), 0, r * Math.sin(t)], d = ax[0] * v[0] + ax[2] * v[2], cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]];
        return [v[0] * c + cr[0] * s + ax[0] * d * (1 - c), v[1] * c + cr[1] * s, v[2] * c + cr[2] * s + ax[2] * d * (1 - c)];
      };
      var ring = []; for (var k = 0; k < NS; k++) ring.push(pt(k / NS * 2 * Math.PI));
      return { ring: ring, at: pt(ph) };
    });
  }
  function orbitSVG() { // the skeleton; build3d() wires it up and frame() positions it
    var act = P.filter(function (o) { return o.goals; });
    var label = act.length ? act.map(function (o) { return o.name + ' ' + Math.round(o.share) + '%'; }).join(', ') : 'No branch has check-offs yet';
    var empty = P.length - act.length; label += empty ? ', ' + empty + (empty === 1 ? ' branch' : ' branches') + ' with no goals yet' : '';
    var defs = '<radialGradient id="kzoCore" cx="38%" cy="35%" r="70%"><stop offset="0%" stop-color="#FFF3C4"/><stop offset="45%" stop-color="#E2B93B"/><stop offset="100%" stop-color="#6B5210"/></radialGradient>' +
      '<radialGradient id="kzoHalo" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#E2B93B" stop-opacity=".32"/><stop offset="100%" stop-color="#E2B93B" stop-opacity="0"/></radialGradient>';
    P.forEach(function (o, i) { if (o.goals) defs += '<radialGradient id="kzoP' + i + '" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#fff" stop-opacity=".85"/><stop offset="35%" stop-color="' + o.color + '"/><stop offset="100%" stop-color="' + o.color + '" stop-opacity=".35"/></radialGradient>'; });
    var body = '';
    P.forEach(function (o, i) {
      var dash = o.goals && o.tier === 2 ? ' stroke-dasharray="4 5"' : '';
      body += '<path data-k="rb' + i + '" fill="none" stroke="#2C2C2E" stroke-width="1.5"' + dash + '/><path data-k="rf' + i + '" fill="none" stroke="' + (o.goals && o.tier === 2 ? '#5A4B3A' : '#48484A') + '" stroke-width="1.5"' + dash + '/>';
      body += o.goals ? '<g data-k="p' + i + '"><circle fill="#000"/><circle fill="url(#kzoP' + i + ')"/></g>' +
        '<text data-k="l' + i + '" text-anchor="middle" class="kzo-lbl" fill="' + o.color + '" stroke="#1C1C1E" stroke-width="4" paint-order="stroke">' + esc(o.name) + (o.tier === 2 ? ' · drifting' : act.length > 1 ? ' ' + Math.round(o.share) + '%' : '') + '</text>'
        : '<g data-k="p' + i + '"><circle fill="#1C1C1E" stroke="' + o.color + '" stroke-opacity=".7" stroke-width="1.5" stroke-dasharray="3 3"/></g>';
    });
    body += '<g data-k="sun"><circle r="56" fill="url(#kzoHalo)"/><circle r="' + SUN + '" fill="url(#kzoCore)"/></g>';
    return '<svg class="kzo-orbit" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Balance: ' + esc(label) + '"><defs>' + defs + '</defs><g class="kzo-sys">' + body + '</g></svg>';
  }
  function build3d() {
    var svg = bal && bal.querySelector('.kzo-orbit'); if (!svg) { G = null; return; }
    var act = P.filter(function (o) { return o.goals; }), totS = act.reduce(function (a, o) { return a + o.share; }, 0);
    var get = function (k) { return svg.querySelector('[data-k="' + k + '"]'); };
    G = { svg: svg, sys: svg.querySelector('.kzo-sys'), sun: get('sun'), model: orbitModel(), order: '', items: P.map(function (o, i) {
      var sh = o.goals ? (totS ? o.share / totS : 1 / act.length) : 0, l = get('l' + i), lw = 0;
      if (l) { try { lw = l.getComputedTextLength(); } catch (e) {} if (!lw) lw = l.textContent.length * 7.6; }
      return { goals: o.goals, dim: o.goals ? [1, 0.85, 0.5][o.tier] : 1, r: o.goals ? 9 + 16 * Math.sqrt(sh) : 7, rb: get('rb' + i), rf: get('rf' + i), p: get('p' + i), l: l, lw: lw };
    }) };
    frame();
  }
  function frame() {
    if (!G || !G.svg.isConnected) return;
    var M = qMat(q), pr = function (v) { var x = M[0] * v[0] + M[1] * v[1] + M[2] * v[2], y = M[3] * v[0] + M[4] * v[1] + M[5] * v[2], z = M[6] * v[0] + M[7] * v[1] + M[8] * v[2], s = FOC / (FOC - z); return [x * s, y * s, z, s]; };
    var hw = W / 2 - MRG, hh = H / 2 - MRG, k = Math.min(1, (hh) / (SUN + 2)), proj = [];
    // fit: the largest zoom (max 1) that keeps every ring, planet and label inside the box
    G.items.forEach(function (it, i) {
      var md = G.model[i], ring = md.ring.map(pr), c = pr(md.at), rr = it.r * c[3], lab = it.goals ? LBL : 0;
      ring.forEach(function (p) { k = Math.min(k, hw / (RP * Math.abs(p[0]) || 1e-9), hh / (RP * Math.abs(p[1]) || 1e-9)); });
      k = Math.min(k, hw / (RP * Math.abs(c[0]) + rr), hh / Math.max(1e-9, rr - RP * c[1]), (hh - lab) / Math.max(1e-9, RP * c[1] + rr));
      proj.push({ ring: ring, c: c, rr: rr });
    });
    zoom = k; G.svg.setAttribute('data-zoom', k.toFixed(3));
    var X = function (u) { return (CX + k * RP * u).toFixed(1); }, Y = function (u) { return (CY + k * RP * u).toFixed(1); }, keys = [], labs = [];
    G.items.forEach(function (it, i) {
      var pj = proj[i], S = { b: '', f: '' }, end = { b: -2, f: -2 }, n = pj.ring.length, pt = function (p) { return X(p[0]) + ' ' + Y(p[1]); };
      for (var j = 0; j < n; j++) { var a = pj.ring[j], b = pj.ring[(j + 1) % n], L = a[2] + b[2] < 0 ? 'b' : 'f';
        S[L] += (end[L] === j ? '' : 'M' + pt(a)) + 'L' + pt(b); end[L] = j + 1; }
      var back = S.b, front = S.f;
      it.rb.setAttribute('d', back || 'M0 0'); it.rf.setAttribute('d', front || 'M0 0');
      var cx = X(pj.c[0]), cy = Y(pj.c[1]), r = (pj.rr * k).toFixed(1), z = pj.c[2], lit = (0.62 + 0.38 * (z + 1) / 2).toFixed(2);
      Array.prototype.forEach.call(it.p.children, function (cc) { cc.setAttribute('cx', cx); cc.setAttribute('cy', cy); cc.setAttribute('r', r); });
      lit = (lit * it.dim).toFixed(2); it.p.setAttribute('opacity', lit);
      if (it.l) { var lx = Math.max(MRG + it.lw / 2, Math.min(W - MRG - it.lw / 2, +cx)), ly = +cy + +r + 15; it.l.setAttribute('x', lx.toFixed(1)); it.l.setAttribute('y', ly.toFixed(1)); labs.push({ el: it.l, z: z, lit: lit, b: [lx - it.lw / 2 - 2, ly - 12, lx + it.lw / 2 + 2, ly + 4] }); }
      keys.push([-10, it.rb], [1e-4, it.rf], [z, it.p]); if (it.l) keys.push([10 + z, it.l]);
    });
    // a label that would sit on top of a nearer planet's label fades out until they separate
    labs.sort(function (a, b) { return b.z - a.z; }); var kept = [];
    labs.forEach(function (L) { var hit = kept.some(function (b) { return L.b[0] < b[2] && L.b[2] > b[0] && L.b[1] < b[3] && L.b[3] > b[1]; });
      L.el.style.opacity = hit ? '0' : L.lit; if (!hit) kept.push(L.b); });
    G.sun.setAttribute('transform', 'translate(' + CX + ' ' + CY + ') scale(' + k.toFixed(3) + ')'); keys.push([0, G.sun]);
    keys.sort(function (a, b) { return a[0] - b[0]; });
    var sig = keys.map(function (x) { return x[1].getAttribute('data-k'); }).join();
    if (sig !== G.order) { G.order = sig; keys.forEach(function (x) { G.sys.appendChild(x[1]); }); }
  }
  function balHTML() {
    var act = P.filter(function (o) { return o.goals; }), idle = P.filter(function (o) { return !o.goals; });
    var top = act.slice().sort(function (a, b) { return b.share - a.share; })[0];
    var far = act.filter(function (o) { return o.tier === 2; }).sort(function (a, b) { return b.away - a.away; })[0];
    var line = far ? esc(far.name) + ' is drifting · ' + far.away + ' days. Check it off to pull it back in' : !act.length ? 'Add a goal to a branch and it starts to orbit' : act.length === 1 ? esc(top.name) + ' is your only branch growing' :
      (!top.share ? 'Check off goals and your branches grow' : act.filter(function (o) { return top.share - o.share <= 3; }).length > 1 ? 'Your branches grew evenly in the last two weeks' : esc(top.name) + ' did the most growing in the last two weeks');
    var rows = act.map(function (o) { return '<a class="kzo-row" href="/pages/my-goals?pillar=' + encodeURIComponent(o.id) + '"><i style="background:' + o.color + '"></i><span>' + esc(o.name) + '</span><em>' + o.goals + (o.goals === 1 ? ' goal' : ' goals') + '</em><b aria-hidden="true">›</b></a>'; }).join('');
    var chips = idle.length ? '<div class="kzo-chips">' + idle.map(function (o) { return '<a class="kzo-chip" href="/pages/my-goals?pillar=' + encodeURIComponent(o.id) + '#add" aria-label="Add a goal to ' + esc(o.name) + '">+ ' + esc(o.name) + '</a>'; }).join('') + '</div>' : '';
    return '<div class="kzo-h"><span>Balance</span><em>' + act.length + ' of ' + P.length + ' in orbit</em></div>' +
      '<div class="kzo-stage">' + orbitSVG() + '</div>' +
      '<p class="kzo-line">' + line + (P.length > 1 && line.length < 34 ? ' · drag to spin' : '') + '</p>' +
      (rows ? '<div class="kzo-rows">' + rows + '</div>' : '') + chips +
      '<button type="button" class="kzo-edit"><span>' + (editing() ? 'Done editing' : 'Edit branches') + '</span><b aria-hidden="true">›</b></button>';
  }
  function editing() { var w = sec.querySelector('.kz-bst2'); return !!(w && w.classList.contains('editing')); }

  // ---------- shields (B) ----------
  var shOpen = false;
  function shHTML() {
    var si = {}, st = 0; try { si = K.streakInfo() || {}; st = K.streak(); } catch (e) {}
    var sh = Math.min(2, si.shields || 0), full = sh >= 2, nx = K.shieldNext ? K.shieldNext(st) : { prog: st % 7, span: 7, left: 7 - st % 7 }, prog = full ? 1 : nx.prog, span = full ? 1 : nx.span, left = nx.left, C = 169.6;
    var title = full ? 'Shields full' : (sh ? 'Next' : 'First') + ' shield in ' + left + (left === 1 ? ' day' : ' days');
    return '<div class="kzo-ring"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="#2C2C2E" stroke-width="6"/>' +
      '<circle cx="32" cy="32" r="27" fill="none" stroke="#0A84FF" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (C * prog / span).toFixed(1) + ' ' + C + '" transform="rotate(-90 32 32)"/></svg>' + SHIELD + '</div>' +
      '<div class="kzo-shtx"><b>' + title + '</b><span>' + sh + ' of 2 shields · <button type="button" class="kzo-how" aria-expanded="' + shOpen + '">How shields work ›</button></span>' +
      (shOpen ? '<p>Every checkpoint you reach (day 7, 14, 30 and 45 in a row) earns a shield, up to 2. Miss a day and a shield turns it into a rest day: your streak stays safe.</p>' : '') + '</div>';
  }

  // ---------- render ----------
  function render(force) {
    P = rates();
    var s = JSON.stringify([P, sec.querySelector('[data-p="tiles"]') ? sec.querySelector('[data-p="tiles"]').textContent : '', K.key(K.today()), editing(), shOpen]);
    if (!force && s === sig) return; sig = s;
    hero.innerHTML = heroHTML(); bal.innerHTML = balHTML(); shc.innerHTML = shHTML(); build3d();
  }

  function setup() {
    sec = document.getElementById('kz-prog-s1'); if (!sec) return;
    var wrap = sec.querySelector('.kz-top49'), balw = sec.querySelector('[data-p="bal-wrap"]'), shw = sec.querySelector('[data-p="shields"]'), cal = sec.querySelector('#kz-cal');
    if (!wrap || !balw || !shw || !cal) return;
    hero = document.createElement('div'); hero.className = 'kzo-card kzo-hero';
    bal = document.createElement('div'); bal.className = 'kzo-bal';
    shc = document.createElement('div'); shc.className = 'kzo-card kzo-sh';
    balw.insertBefore(bal, balw.firstChild);       // the branch editor stays inside the same card, under the orbit
    wrap.insertBefore(hero, balw);
    wrap.insertBefore(shc, cal);
    try { render(true); } catch (e) { hero.remove(); bal.remove(); shc.remove(); return; }
    root.classList.add('kz-orb');
    // taps
    hero.addEventListener('click', function (e) { if (e.target.closest('.kzo-share')) { var b = sec.querySelector('.kz-p4-sb'); if (b) b.click(); } });
    bal.addEventListener('click', function (e) {
      if (e.target.closest('.kzo-edit')) { var b = sec.querySelector('.kz-bst2-edit'); if (b) b.click(); setTimeout(function () { render(true); }, 30); }
    });
    shc.addEventListener('click', function (e) { if (e.target.closest('.kzo-how')) { shOpen = !shOpen; render(true); } });
    // drag any direction to spin it in 3D; a flick keeps it turning and it eases to a stop
    var dr = null, vx = 0, vy = 0, ia = 0, pend = 0;
    var ppu = function () { var s = bal.querySelector('.kzo-orbit'), w = s ? s.getBoundingClientRect().width : W; return RP * zoom * (w / W) || RP; };
    var paint = function () { if (!pend) pend = requestAnimationFrame(function () { pend = 0; frame(); }); };
    var cap = function (v) { return Math.max(-3, Math.min(3, v)); };
    bal.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.kzo-stage') || e.button > 0) return;
      cancelAnimationFrame(ia); ia = 0; vx = vy = 0; dr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp };
      try { bal.setPointerCapture(e.pointerId); } catch (x) {}
    });
    bal.addEventListener('pointermove', function (e) {
      if (!dr || e.pointerId !== dr.id) return; e.preventDefault();
      var dx = e.clientX - dr.x, dy = e.clientY - dr.y, dt = Math.max(8, e.timeStamp - dr.t);
      if (!dx && !dy) return; turn(dx, dy, ppu());
      vx = cap(0.75 * dx / dt + 0.25 * vx); vy = cap(0.75 * dy / dt + 0.25 * vy);
      dr.x = e.clientX; dr.y = e.clientY; dr.t = e.timeStamp; paint();
    });
    var up = function (e) {
      if (!dr || e.pointerId !== dr.id) return; var idle = e.timeStamp - dr.t; dr = null;
      if (calm || idle > 90 || Math.hypot(vx, vy) < 0.05) return;
      var t0 = performance.now();
      ia = requestAnimationFrame(function spin(t) { var dt = Math.min(40, Math.max(0, t - t0)); t0 = t; turn(vx * dt, vy * dt, ppu());
        var d = Math.exp(-dt / 420); vx *= d; vy *= d; frame(); ia = Math.hypot(vx, vy) > 0.012 ? requestAnimationFrame(spin) : 0; });
    };
    bal.addEventListener('pointerup', up); bal.addEventListener('pointercancel', up);
    // the page repaints its own cards when data changes: follow it
    var watch = function (el) { if (el) new MutationObserver(function () { try { render(); } catch (e) {} }).observe(el, { childList: true, subtree: true }); };
    watch(sec.querySelector('[data-p="tiles"]')); watch(sec.querySelector('[data-p="wheel"]')); watch(shw);
    ['kz:changed', 'kz:step', 'kz:pillars', 'kz:goals'].forEach(function (ev) { document.addEventListener(ev, function () { try { render(); } catch (e) {} }); });
    window.addEventListener('pageshow', function () { try { render(); } catch (e) {} });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
