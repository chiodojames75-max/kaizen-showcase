/* Oct 23 fix pass: the Balance star in the app's style (labels on the star, editor behind one row), and Progress tidy-ups.
   K.balStar is defined by the page (Progress) or kzbal (Growth); whatever they assign is wrapped, so their own
   click handlers and numbers stay exactly as they were. */
(function () {
  var K = window.KZ; if (!K || K.__kzfx) return; K.__kzfx = 1;
  var editing = false;
  var f1 = function (v) { return Math.round(v * 10) / 10; };
  var short = function (s) { s = String(s); return s.length > 13 ? s.slice(0, 12) + '…' : s; };
  function star(P) {
    var n = P.length, W = 380, Hh = 280, cx = W / 2, cy = 140, R = 78, live = P.filter(function (o) { return o.goals; }).length;
    var s = '<svg class="kz-bst-star kz-bst2-star" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + live + ' of ' + n + ' branches growing. ' +
      P.map(function (o) { return K.esc(o.name) + ' ' + (o.goals ? o.goals + (o.goals === 1 ? ' goal' : ' goals') : 'no goals'); }).join(', ') + '">';
    var lab = '';
    P.forEach(function (o, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n, on = !!o.goals, r = on ? R : R * 0.62, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + f1(x) + '" y2="' + f1(y) + '" stroke="' + o.color + '" stroke-width="' + (on ? 7 : 3) + '" stroke-linecap="round" opacity="' + (on ? 1 : 0.32) + '"/>' +
        '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (on ? 9 : 4.5) + '" fill="' + o.color + '" opacity="' + (on ? 1 : 0.55) + '"/>';
      var lx = cx + Math.cos(a) * (R + 18), ly = cy + Math.sin(a) * (R + 18), cs = Math.cos(a), sn = Math.sin(a);
      var anc = cs > 0.3 ? 'start' : cs < -0.3 ? 'end' : 'middle', dy = sn < -0.6 ? -22 : sn > 0.6 ? 16 : 0;
      lab += '<text x="' + f1(lx) + '" y="' + f1(ly + dy) + '" text-anchor="' + anc + '" class="kz-bst2-n' + (on ? ' on' : '') + '">' + K.esc(short(o.name)) + '</text>' +
        '<text x="' + f1(lx) + '" y="' + f1(ly + dy + 17) + '" text-anchor="' + anc + '" class="kz-bst2-c" fill="' + (on ? o.color : '#636366') + '">' + (on ? o.goals + (o.goals === 1 ? ' goal' : ' goals') : 'no goals') + '</text>';
    });
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="#E2B93B" opacity=".18"/><circle cx="' + cx + '" cy="' + cy + '" r="9" fill="#E2B93B"/>' + lab + '</svg>';
    return s;
  }
  var wrap = function (orig) {
    if (!orig || orig.__fx) return orig;
    var w = function (P) {
      var h = orig.apply(this, arguments);
      h = h.replace(/<svg class="kz-bst-star"[\s\S]*?<\/svg>/, star(P));
      h = h.replace('<div class="kz-bst">', '<div class="kz-bst kz-bst2' + (editing ? ' editing' : '') + '">');
      h = h.replace('<div class="kz-bst-trunk">', '<button type="button" class="kz-bst2-edit" data-bst2-edit aria-expanded="' + editing + '"><span>Edit branches</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button><div class="kz-bst-trunk">');
      return h;
    };
    w.__fx = 1; return w;
  };
  var cur;
  try { cur = wrap(K.balStar); Object.defineProperty(K, 'balStar', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrap(v); } }); } catch (e) {}
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-bst2-edit]'); if (!b) return;
    editing = !editing; var box = b.closest('.kz-bst'); if (box) box.classList.toggle('editing', editing); b.setAttribute('aria-expanded', String(editing));
    if (editing) setTimeout(function () { var t = box && box.querySelector('.kz-bst-trunk'); if (t) t.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30);
  });
  // Progress: the share button becomes an icon in the stats card's corner
  function statsShare() {
    var t = document.querySelector('#kz-prog-s1 [data-p="tiles"]'), sb = document.querySelector('.kz-p4-sb'); if (!t || !sb || t.parentElement.classList.contains('kz-fx-stats')) return;
    var w = document.createElement('div'); w.className = 'kz-fx-stats'; t.parentElement.insertBefore(w, t); w.appendChild(t); w.appendChild(sb);
    sb.classList.add('kz-fx-share'); sb.setAttribute('aria-label', 'Share your streak');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', statsShare); else statsShare();
})();
