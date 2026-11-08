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
    var n = P.length, S = 300, c = S / 2, R = 104, maxSh = Math.max.apply(null, P.map(function (o) { return o.goals ? o.share : 0; }).concat([1]));
    var ang = function (i) { return -Math.PI / 2 + i * 2 * Math.PI / n; }, pt = function (i, r) { return [c + Math.cos(ang(i)) * r, c + Math.sin(ang(i)) * r]; };
    var h = '<svg class="kzwl-svg" viewBox="-60 -6 ' + (S + 120) + ' ' + (S + 12) + '" role="img" aria-label="Your balance wheel">';
    [0.33, 0.66, 1].forEach(function (k) { h += '<polygon class="ring" points="' + P.map(function (o, i) { return pt(i, R * k).map(function (v) { return v.toFixed(1); }).join(','); }).join(' ') + '"/>'; });
    P.forEach(function (o, i) { var e = pt(i, R); h += '<line class="spoke' + (o.goals ? '' : ' empty') + '" x1="' + c + '" y1="' + c + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '"/>'; });
    var shape = P.map(function (o, i) { var r = o.goals ? R * (0.28 + 0.72 * (o.share / maxSh)) : R * 0.06; return pt(i, r).map(function (v) { return v.toFixed(1); }).join(','); }).join(' ');
    h += '<defs><radialGradient id="kzwl-g" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#E9C55A" stop-opacity=".55"/><stop offset="1" stop-color="#B8902E" stop-opacity=".22"/></radialGradient></defs>';
    h += '<polygon class="shape" points="' + shape + '"/>';
    P.forEach(function (o, i) {
      if (o.goals) { var d = pt(i, R * (0.28 + 0.72 * (o.share / maxSh))); h += '<circle class="dot" cx="' + d[0].toFixed(1) + '" cy="' + d[1].toFixed(1) + '" r="5" fill="' + esc(o.color) + '"/>'; }
      var l = pt(i, R + 26), anchor = Math.abs(l[0] - c) < 8 ? 'middle' : l[0] < c ? 'end' : 'start';
      h += '<text class="lab' + (o.goals ? '' : ' empty') + '" x="' + l[0].toFixed(1) + '" y="' + (l[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '"' + (o.goals ? ' fill="' + esc(o.color) + '"' : '') + '>' + esc(o.name) + (o.goals ? ' ' + o.share + '%' : '') + '</text>';
      if (!o.goals) { var e2 = pt(i, R); h += '<a href="' + esc(addHref(o.id)) + '" aria-label="Add a ' + esc(o.name) + ' goal"><circle class="hit" cx="' + e2[0].toFixed(1) + '" cy="' + e2[1].toFixed(1) + '" r="24"/><circle class="plus-bg" cx="' + e2[0].toFixed(1) + '" cy="' + e2[1].toFixed(1) + '" r="11"/><path class="plus" d="M' + (e2[0] - 5).toFixed(1) + ' ' + e2[1].toFixed(1) + 'h10M' + e2[0].toFixed(1) + ' ' + (e2[1] - 5).toFixed(1) + 'v10"/></a>'; }
    });
    return h + '</svg>';
  }
  function html() {
    var P = []; try { P = K.pathRates() || []; } catch (e) { return ''; }
    if (!P.length) return '';
    var active = P.filter(function (o) { return o.goals; }), empty = P.filter(function (o) { return !o.goals; });
    var line = active.length === P.length ? 'You’re growing in all ' + P.length + ' areas.' : 'You’re growing in ' + active.length + ' of ' + P.length + ' areas.';
    var line2 = empty.length ? ' <em>' + esc(empty[0].name) + '</em> has nothing yet.' : '';
    var low = active.length > 1 ? active.slice().sort(function (a, b) { return a.share - b.share; })[0] : null;
    var h = '<div class="kzwl"><p class="kzwl-say">' + line + line2 + '</p>' + svg(P);
    if (empty.length) {
      h += '<a class="kzwl-add" href="' + esc(addHref(empty[0].id)) + '"><span aria-hidden="true">+</span> Add a ' + esc(empty[0].name) + ' goal</a>';
      if (empty.length > 1) h += '<div class="kzwl-chips">' + empty.slice(1).map(function (o) { return '<a href="' + esc(addHref(o.id)) + '">+ ' + esc(o.name) + '</a>'; }).join('') + '</div>';
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
