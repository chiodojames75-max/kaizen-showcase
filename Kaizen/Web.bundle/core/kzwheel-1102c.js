/* Nov 2 c · copy of kzwheel-1102b.js drawn as mockup A (soft radar). */
/* Nov 2 b: "flat" is now "missing" everywhere (James: "take away all the spots that say flat… maybe make it missing"): an empty
   branch says "missing" under its name, the line reads "Relationships is missing." and the others "+ Fitness · also missing".
   Nov 2 (replaces kzwheel-1027b.js) · James picked mockup C: the same wheel, tidied. Each name sits evenly on the rim with its %
   on a second line ("flat" for an empty branch), the + stays on the rim, the copy speaks the climb ("You're climbing in 5 of 7
   areas. Relationships is still flat."), and the other empty branches are one quiet line under the gold pill. */
/* Oct 27 b (replaces kzwheel-1027.js): the gold + on an empty branch was a 16 pt tap target; it now has an invisible
   48 pt circle around it so it's easy to hit.
   Oct 27 · Progress → Balance as a wheel of life (James: "for people to want to add goals in different categories to become a
   well rounded person"). Every branch you have (K.PATHS) is a spoke. A branch with goals reaches out by its share of your
   check-offs over the last 2 weeks (K.pathRates); a branch with no goals is a flat, dim spoke with a gold + at its end.
   Under the wheel: one plain sentence ("You're growing in 3 of 4 areas. Relationships has nothing yet."), a gold pill to add
   a goal in the first empty branch (opens Add goal with that branch chosen: /pages/my-goals?pillar=<id>#add, the link the
   old card used), chips for the other empty ones, and the active branch that got the least of your effort.
   The old bar (kzpc-bals) stays underneath, hidden; Edit (branches) stays. Styles: kzwheel-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzwheel) return; K.__kzwheel = 1;
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function addHref(id) { return '/pages/my-goals?pillar=' + encodeURIComponent(id) + '#add'; }
  function svg(P) {
    var n = P.length, S = 300, c = S / 2, R = 96, maxSh = Math.max.apply(null, P.map(function (o) { return o.goals ? o.share : 0; }).concat([1]));
    var ang = function (i) { return -Math.PI / 2 + i * 2 * Math.PI / n; }, pt = function (i, r) { return [c + Math.cos(ang(i)) * r, c + Math.sin(ang(i)) * r]; };
    var h = '<svg class="kzwl-svg" viewBox="-66 -4 ' + (S + 132) + ' ' + (S + 14) + '" role="img" aria-label="Your balance wheel">';
    // Nov 2 c · James picked "A · Soft radar": round dashed rings, no spokes, one curved shape, gold fading to orange with a soft glow
    [0.33, 0.66, 1].forEach(function (k) { h += '<circle class="ring' + (k < 1 ? ' in' : '') + '" cx="' + c + '" cy="' + c + '" r="' + (R * k).toFixed(1) + '"/>'; });
    var V = P.map(function (o, i) { return pt(i, o.goals ? R * (0.28 + 0.72 * (o.share / maxSh)) : R * 0.12); }), m = V.length, f = function (v) { return v.toFixed(1); };
    var d = 'M' + f(V[0][0]) + ' ' + f(V[0][1]);
    for (var i = 0; i < m; i++) { var p0 = V[(i - 1 + m) % m], p1 = V[i], p2 = V[(i + 1) % m], p3 = V[(i + 2) % m];
      d += ' C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]); }
    d += 'Z';
    h += '<defs><radialGradient id="kzwl-g" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#FFB15C" stop-opacity=".55"/><stop offset=".6" stop-color="#E9C55A" stop-opacity=".28"/><stop offset="1" stop-color="#FF6A1A" stop-opacity=".18"/></radialGradient>' +
      '<linearGradient id="kzwl-ln" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2CF5B"/><stop offset="1" stop-color="#FF6A1A"/></linearGradient>' +
      '<filter id="kzwl-gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>';
    h += '<path class="glow" d="' + d + '"/><path class="shape" d="' + d + '"/>';
    P.forEach(function (o, i) {
      if (o.goals) { var d = pt(i, R * (0.28 + 0.72 * (o.share / maxSh))); h += '<circle class="dot" cx="' + d[0].toFixed(1) + '" cy="' + d[1].toFixed(1) + '" r="5" fill="' + esc(o.color) + '"/>'; }
      var l = pt(i, R + 24), anchor = Math.abs(l[0] - c) < 8 ? 'middle' : l[0] < c ? 'end' : 'start', dy = l[1] < c - R * .6 ? -12 : l[1] > c + R * .6 ? 6 : -4;
      h += '<text class="lab' + (o.goals ? '' : ' empty') + '" x="' + l[0].toFixed(1) + '" y="' + (l[1] + dy).toFixed(1) + '" text-anchor="' + anchor + '"' + (o.goals ? ' fill="' + esc(o.color) + '"' : '') + '>' + esc(o.name) + '</text>' +
        '<text class="pct' + (o.goals ? '' : ' empty') + '" x="' + l[0].toFixed(1) + '" y="' + (l[1] + dy + 17).toFixed(1) + '" text-anchor="' + anchor + '">' + (o.goals ? o.share + '%' : 'missing') + '</text>';
      if (!o.goals) { var e2 = pt(i, R); h += '<a href="' + esc(addHref(o.id)) + '" aria-label="Add a ' + esc(o.name) + ' goal"><circle class="hit" cx="' + e2[0].toFixed(1) + '" cy="' + e2[1].toFixed(1) + '" r="24"/><circle class="plus-bg" cx="' + e2[0].toFixed(1) + '" cy="' + e2[1].toFixed(1) + '" r="11"/><path class="plus" d="M' + (e2[0] - 5).toFixed(1) + ' ' + e2[1].toFixed(1) + 'h10M' + e2[0].toFixed(1) + ' ' + (e2[1] - 5).toFixed(1) + 'v10"/></a>'; }
    });
    return h + '</svg>';
  }
  function html() {
    var P = []; try { P = K.pathRates() || []; } catch (e) { return ''; }
    if (!P.length) return '';
    var active = P.filter(function (o) { return o.goals; }), empty = P.filter(function (o) { return !o.goals; });
    var line = active.length === P.length ? 'You’re climbing in all ' + P.length + ' areas.' : 'You’re climbing in ' + active.length + ' of ' + P.length + ' areas.';
    var line2 = empty.length ? '<br><em>' + esc(empty[0].name) + '</em> is missing.' : '';
    var low = active.length > 1 ? active.slice().sort(function (a, b) { return a.share - b.share; })[0] : null;
    var h = '<div class="kzwl"><p class="kzwl-say">' + line + line2 + '</p>' + svg(P);
    if (empty.length) {
      h += '<a class="kzwl-add" href="' + esc(addHref(empty[0].id)) + '"><span aria-hidden="true">+</span> Add a ' + esc(empty[0].name) + ' goal</a>';
      if (empty.length > 1) h += '<p class="kzwl-more">' + empty.slice(1).map(function (o) { return '<a href="' + esc(addHref(o.id)) + '">+ ' + esc(o.name) + '</a>'; }).join('<i aria-hidden="true">·</i>') + '<span> · also missing</span></p>';
    } else h += '<p class="kzwl-ok">★ Every area has a goal. Well rounded.</p>';
    if (low && low.share < Math.round(100 / Math.max(1, active.length)) - 5) h += '<p class="kzwl-low">Least effort these 2 weeks: <b style="color:' + esc(low.color) + '">' + esc(low.name) + ' ' + low.share + '%</b></p>';
    return h + '</div>';
  }
  function run() {
    q = 0;
    var sec = document.querySelector('.kzpc-bals'); if (!sec) return;
    var card = sec.querySelector('.kzpc-card'); if (!card) return;
    var h = html(); if (!h) return;
    var box = card.querySelector('.kzwl-box'); if (!box) { box = document.createElement('div'); box.className = 'kzwl-box'; card.insertBefore(box, card.firstChild); }
    if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
    card.classList.add('kzwl-on');
    var lab = sec.querySelector('.kzpc-lab span'); if (lab && lab.textContent !== 'BALANCE') lab.textContent = 'BALANCE';
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzwl-box')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  ['kz:goals', 'kz:changed'].forEach(function (n) { document.addEventListener(n, soon); });
  soon();
})();
