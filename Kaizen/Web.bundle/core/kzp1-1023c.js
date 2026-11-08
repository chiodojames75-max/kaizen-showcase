/* Oct 23 Phase 1 (all pages)
   6. Accounts are off in v1.0. The sign-up / log-in code stays, behind this flag. */
(function () {
  var K = window.KZ || {};
  K.ACCOUNTS_ON = false;   // v1.0 launches with no accounts; flip only when sync ships (and the privacy policy says so)
  if (!K.ACCOUNTS_ON) {
    var de = document.documentElement; de.classList.add('kz-nosync-cfg', 'kz-noacct');
    var note = function () {
      var si = document.getElementById('kz-signin'); if (!si || si.querySelector('.kz-v1acct')) return;
      var d = document.createElement('div'); d.className = 'kz-v1acct';
      d.innerHTML = '<h1 class="kz-si-t">No account needed</h1><p class="kz-si-sub">In this version everything stays on this iPhone. There’s nothing to sign up for.</p>';
      var box = si.querySelector('.kz-si-in') || si, out = box.querySelector('[data-si="out"]');
      box.insertBefore(d, out || box.firstChild);
      var sk = si.querySelector('[data-si="skip"]'); if (sk) sk.textContent = 'Back';
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', note); else note();
  }
})();
/* 2. Visitor speech on Today's small tree picture: the picture clips anything outside it (rounded, overflow hidden),
   so a line said there is lifted out and shown above the picture, kept on screen, with its tail still on the animal. */
(function () {
  var HOST = '.kz-pcard-tree', floats = [];
  function place(b, cr) {
    var r = cr.getBoundingClientRect(), w = b.offsetWidth, h = b.offsetHeight, vw = innerWidth, cx = r.left + r.width / 2;
    var x = Math.min(Math.max(cx, 10 + w / 2), vw - 10 - w / 2), top = r.top - h - 9, below = top < 64;
    if (below) top = r.bottom + 9;
    b.style.left = x + 'px'; b.style.top = top + 'px'; b.classList.toggle('below', below);
    b.style.setProperty('--kzt', Math.min(Math.max(50 + (cx - x) / w * 100, 12), 88).toFixed(1) + '%');
  }
  function lift(b) {
    var cr = b.parentElement; if (!cr || !cr.closest(HOST)) return;
    if (cr.__kzSay && cr.__kzSay !== b && cr.__kzSay.isConnected) cr.__kzSay.remove();
    cr.__kzSay = b; b.classList.add('kz-say-float'); document.body.appendChild(b); place(b, cr); floats.push(b);
  }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
      var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && n.classList.contains('kz-say') && !n.classList.contains('kz-say-float')) lift(n);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('scroll', function () { floats = floats.filter(function (b) { if (b.isConnected) b.remove(); return false; }); }, { passive: true });
})();
