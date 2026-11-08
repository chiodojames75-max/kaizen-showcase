/* Oct 26 l · Struck-metal medals (James: "more realistic and really cool"). One hidden SVG sprite holds six metals
   (bronze, silver, gold, rose gold, platinum, aurora); each medal is a <use> of one: ridged rim, bevel, domed face,
   engraved rings, laurel from gold up, a star from platinum up, and a soft specular light. The metal follows the
   milestone's difficulty (days): <7 bronze, <30 silver, <100 gold, <300 rose gold, <730 platinum, then aurora.
   K.medalMetal(n), K.medalSVG(n) for new markup; the Milestones card's existing medals (.kzpc-md) are re-skinned in
   place. Static: no looping animation. Styles: kzmedal-1026l.css. */
(function () {
  var K = window.KZ; if (!K || K.__kzmedal) return; K.__kzmedal = 1;
  var M = {
    bronze: { hi: '#F6D2AE', mid: '#B87442', lo: '#5A2F12', deep: '#3E1F0A' },
    silver: { hi: '#FFFFFF', mid: '#C2C9D3', lo: '#5D6571', deep: '#3A4049' },
    gold: { hi: '#FFF3C4', mid: '#E2B93B', lo: '#7A5A0E', deep: '#4A3605', laurel: 1 },
    rose: { hi: '#FFE6DA', mid: '#E2967E', lo: '#7E3426', deep: '#4A1A12', laurel: 1 },
    platinum: { hi: '#F7FCFF', mid: '#B3C7D8', lo: '#40566A', deep: '#24323F', laurel: 1, star: 1 },
    aurora: { hi: '#FFF4D6', mid: '#E2B93B', lo: '#6A4A12', deep: '#3A2706', laurel: 1, star: 1, iri: 1 }
  };
  K.medalMetal = function (n) { n = +n || 0; return n >= 730 ? 'aurora' : n >= 300 ? 'platinum' : n >= 100 ? 'rose' : n >= 30 ? 'gold' : n >= 7 ? 'silver' : 'bronze'; };
  K.medalName = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', rose: 'Rose gold', platinum: 'Platinum', aurora: 'Aurora' };
  function laurel(c) { // two sprays of leaves around the lower half of the face, like a struck wreath
    var out = '';
    [-1, 1].forEach(function (side) {
      for (var i = 0; i < 7; i++) {
        var deg = side < 0 ? 158 - i * 11 : 22 + i * 11, a = deg * Math.PI / 180, r = 31.5, x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a), rot = deg + 90 - side * 30;
        out += '<ellipse cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" rx="3.9" ry="1.55" transform="rotate(' + rot.toFixed(1) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ')" fill="' + c.lo + '" fill-opacity=".42" stroke="' + c.hi + '" stroke-opacity=".45" stroke-width=".35"/>';
      }
    });
    return out;
  }
  function star(c) {
    var pts = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.9 : 4.4; pts.push((50 + r * Math.cos(a)).toFixed(2) + ',' + (19 + r * Math.sin(a)).toFixed(2)); }
    return '<polygon points="' + pts.join(' ') + '" fill="' + c.lo + '" fill-opacity=".5" stroke="' + c.hi + '" stroke-opacity=".6" stroke-width=".4"/>';
  }
  function symbol(id) {
    var c = M[id], p = 'kzm-' + id;
    var field = c.iri
      ? '<radialGradient id="' + p + '-f" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#FFF6DA"/><stop offset=".28" stop-color="#FFC2E6"/><stop offset=".5" stop-color="#B9A4FF"/><stop offset=".72" stop-color="#7FE0F5"/><stop offset="1" stop-color="#3D7F9C"/></radialGradient>'
      : '<radialGradient id="' + p + '-f" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="' + c.hi + '"/><stop offset=".5" stop-color="' + c.mid + '"/><stop offset="1" stop-color="' + c.lo + '"/></radialGradient>';
    return '<symbol id="' + p + '" viewBox="0 0 100 100"><defs>' +
      '<linearGradient id="' + p + '-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.hi + '"/><stop offset=".42" stop-color="' + c.mid + '"/><stop offset=".78" stop-color="' + c.lo + '"/><stop offset="1" stop-color="' + c.mid + '"/></linearGradient>' +
      '<linearGradient id="' + p + '-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.deep + '"/><stop offset=".5" stop-color="' + c.mid + '"/><stop offset="1" stop-color="' + c.hi + '"/></linearGradient>' + field +
      '<radialGradient id="' + p + '-s" cx=".3" cy=".22" r=".46"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".55" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<circle cx="50" cy="50" r="49.5" fill="url(#' + p + '-r)"/>' +
      '<circle cx="50" cy="50" r="47" fill="none" stroke="' + c.deep + '" stroke-opacity=".5" stroke-width="2.6" stroke-dasharray="1.05 1.25"/>' +
      '<circle cx="50" cy="50" r="44.2" fill="url(#' + p + '-b)"/>' +
      '<circle cx="50" cy="50" r="40.6" fill="url(#' + p + '-f)"/>' +
      '<circle cx="50" cy="50" r="37" fill="none" stroke="' + c.deep + '" stroke-opacity=".32" stroke-width=".9"/>' +
      '<circle cx="50" cy="50" r="36.1" fill="none" stroke="' + c.hi + '" stroke-opacity=".5" stroke-width=".55"/>' +
      (c.laurel ? laurel(c) : '') + (c.star ? star(c) : '') +
      '<circle cx="50" cy="50" r="49.5" fill="url(#' + p + '-s)"/>' +
      '<path d="M14 62 A38 38 0 0 0 86 62" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="1.2"/>' +
      '</symbol>';
  }
  function sprite() {
    if (document.getElementById('kzm-sprite') || !document.body) return;
    var d = document.createElement('div'); d.id = 'kzm-sprite'; d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0" focusable="false">' + Object.keys(M).map(symbol).join('') + '</svg>';
    document.body.appendChild(d);
  }
  K.medalSVG = function (n, cls) { sprite(); return '<svg class="kzm-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#kzm-' + K.medalMetal(n) + '"/></svg>'; };
  // ribbon above an earned medal, in its metal's colours
  var RIB = { bronze: ['#7A4B2A', '#E8C9A3'], silver: ['#1F3A66', '#E9EEF5'], gold: ['#8A1C24', '#F2D27A'], rose: ['#7A2230', '#F6C2A8'], platinum: ['#0F4E5C', '#DDF3F8'], aurora: ['#4B2A8C', '#F7A8E0'] };
  K.medalRibbon = function (n) {
    var m = K.medalMetal(n), c = RIB[m], id = 'kzr-' + m;
    return '<svg class="kzm-rib" viewBox="0 0 60 40" aria-hidden="true" focusable="false" preserveAspectRatio="none"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".3" stop-color="' + c[0] + '"/><stop offset=".3" stop-color="' + c[1] + '"/><stop offset=".42" stop-color="' + c[1] + '"/><stop offset=".42" stop-color="' + c[0] + '"/><stop offset=".58" stop-color="' + c[0] + '"/><stop offset=".58" stop-color="' + c[1] + '"/><stop offset=".7" stop-color="' + c[1] + '"/><stop offset=".7" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[0] + '"/></linearGradient>' +
      '<linearGradient id="' + id + '-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".6" stop-color="#000" stop-opacity="0"/></linearGradient></defs>' +
      '<polygon points="4,0 28,0 34,40 18,40" fill="url(#' + id + ')"/><polygon points="32,0 56,0 42,40 26,40" fill="url(#' + id + ')"/>' +
      '<polygon points="4,0 28,0 34,40 18,40" fill="url(#' + id + '-sh)"/><polygon points="32,0 56,0 42,40 26,40" fill="url(#' + id + '-sh)"/></svg>';
  };
  // re-skin the Milestones card's medals (.kzpc-md with a number); the "next" one keeps its progress ring look
  function num(el) { var b = el.querySelector('b'); if (!b) return 0; var t = b.textContent.trim().toLowerCase(); return /k$/.test(t) ? parseFloat(t) * 1000 : parseFloat(t) || 0; }
  function paint() {
    document.querySelectorAll('.kzpc-md:not(.nxt):not([data-kzm])').forEach(function (el) {
      if (el.closest('.kzm')) return; // the new milestones list draws its own
      var n = num(el); if (!n) return; el.setAttribute('data-kzm', K.medalMetal(n));
      el.insertAdjacentHTML('afterbegin', K.medalSVG(n));
    });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { sprite(); paint(); } catch (e) {} }); }
  function boot() { sprite(); paint(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
