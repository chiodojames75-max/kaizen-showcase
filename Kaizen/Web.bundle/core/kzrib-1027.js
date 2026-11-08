/* Oct 27 · a better medal ribbon. The old one was two flat slanted blocks with stripes that ran straight down
   (not along the strap), cut off square at the top. This one: two straps in a V, stripes that follow each strap,
   rounded fabric shading, the back strap darker, a small metal loop where they meet, and the tops fade out as if
   the ribbon goes on up out of view. Same colours per metal. Replaces K.medalRibbon and redraws any already drawn. */
(function () {
  var K = window.KZ; if (!K) return;
  var RIB = { bronze: ['#6E4123', '#E8C9A3', '#C98B55'], silver: ['#1F3A66', '#E9EEF5', '#B9C3D1'], gold: ['#7E1820', '#F2D27A', '#E2B93B'], rose: ['#6E1E2B', '#F6C2A8', '#E59A8C'], platinum: ['#0F4E5C', '#DDF3F8', '#A9D6E0'], aurora: ['#4B2A8C', '#F7A8E0', '#C79BF2'] };
  function f2(n) { return Math.round(n * 100) / 100; }
  // a band across a strap from fraction a to b (0 = outer edge, 1 = inner edge)
  function band(side, a, b) {
    var tx = side ? function (f) { return 55 - 20 * f; } : function (f) { return 5 + 20 * f; };
    var bx = side ? function (f) { return 36 - 12 * f; } : function (f) { return 24 + 12 * f; };
    return f2(tx(a)) + ',0 ' + f2(tx(b)) + ',0 ' + f2(bx(b)) + ',38 ' + f2(bx(a)) + ',38';
  }
  function strap(side, c, id, back) {
    return '<g' + (back ? ' opacity=".82"' : '') + '>' +
      '<polygon points="' + band(side, 0, 1) + '" fill="' + c[0] + '"/>' +
      '<polygon points="' + band(side, .36, .45) + '" fill="' + c[1] + '"/><polygon points="' + band(side, .55, .64) + '" fill="' + c[1] + '"/>' +
      '<polygon points="' + band(side, 0, .14) + '" fill="#000" opacity=".28"/><polygon points="' + band(side, .86, 1) + '" fill="#000" opacity=".34"/>' +
      '<polygon points="' + band(side, .16, .28) + '" fill="#fff" opacity=".13"/>' +
      (back ? '<polygon points="' + band(side, 0, 1) + '" fill="#000" opacity=".22"/>' : '') + '</g>';
  }
  K.medalRibbon = function (n) {
    var m = K.medalMetal ? K.medalMetal(n) : 'bronze', c = RIB[m] || RIB.bronze, id = 'kzr2-' + m;
    return '<svg class="kzm-rib kzm-rib2" viewBox="0 0 60 40" aria-hidden="true" focusable="false" preserveAspectRatio="none" data-metal="' + m + '"><defs>' +
      '<linearGradient id="' + id + '-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".32" stop-color="#fff" stop-opacity="1"/></linearGradient>' +
      '<mask id="' + id + '-m" maskUnits="userSpaceOnUse" x="0" y="0" width="60" height="40"><rect width="60" height="40" fill="url(#' + id + '-fade)"/></mask>' +
      '<linearGradient id="' + id + '-ring" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="' + c[2] + '"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>' +
      '<linearGradient id="' + id + '-sh" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>' +
      '<g mask="url(#' + id + '-m)">' + strap(1, c, id, true) + strap(0, c, id, false) +
      '<rect x="0" y="0" width="60" height="40" fill="url(#' + id + '-sh)"/></g>' +
      '<rect x="25.5" y="32" width="9" height="7.5" rx="2.6" fill="url(#' + id + '-ring)" stroke="rgba(0,0,0,.35)" stroke-width=".6"/></svg>';
  };
  function metalOf(svg) {
    var m = svg.getAttribute('data-metal'); if (m) return m;
    var g = svg.querySelector('linearGradient[id^="kzr-"]'); return g ? g.id.replace(/^kzr-/, '').replace(/-sh$/, '') : '';
  }
  var N = { bronze: 1, silver: 7, gold: 30, rose: 75, platinum: 150, aurora: 365 }, byMetal = {};
  function redraw() {
    Array.prototype.forEach.call(document.querySelectorAll('svg.kzm-rib:not(.kzm-rib2)'), function (s) {
      var m = metalOf(s); if (!m || !RIB[m]) return;
      if (!byMetal[m]) { // find a number that maps to this metal (the drawing only depends on the metal)
        var n = N[m]; if (K.medalMetal && K.medalMetal(n) !== m) { for (var i = 1; i < 2000; i++) if (K.medalMetal(i) === m) { n = i; break; } }
        byMetal[m] = K.medalRibbon(n);
      }
      var t = document.createElement('div'); t.innerHTML = byMetal[m]; var nw = t.firstChild; if (s.getAttribute('style')) nw.setAttribute('style', s.getAttribute('style'));
      s.parentNode.replaceChild(nw, s);
    });
  }
  var q = 0;
  function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { redraw(); } catch (e) {} }); }
  function boot() { redraw(); new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) if (l[i].addedNodes.length) { soon(); return; } }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
