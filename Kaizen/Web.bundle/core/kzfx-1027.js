/* Oct 27 · kzfx-1027 (all pages): the little leaves that burst and fall when you check something off were added straight
   into the page (<body>), ~20 per tap. About a dozen helpers watch the page for changes, so every leaf made them all look
   again and measure the page, frame after frame, while the row was gliding: that was most of the "heavy" feel of a check-off.
   The leaves now go into their own layer next to the page (#kz-fx, outside <body>), so the helpers don't see them. They look
   and move exactly the same (they're fixed-position pieces either way). */
(function () {
  if (window.__kzfx || !document.body) return; window.__kzfx = 1;
  var fx = document.createElement('div'); fx.id = 'kz-fx'; fx.setAttribute('aria-hidden', 'true');
  document.documentElement.appendChild(fx);
  var FX = /(^|\s)kz-leaf(p|fall)(\s|$)/, ap = document.body.appendChild;
  document.body.appendChild = function (n) {
    if (n && n.nodeType === 1 && FX.test(typeof n.className === 'string' ? n.className : '')) { if (!fx.isConnected) document.documentElement.appendChild(fx); return fx.appendChild(n); }
    return ap.call(this, n);
  };
})();
