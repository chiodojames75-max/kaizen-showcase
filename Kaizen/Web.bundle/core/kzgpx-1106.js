/* Nov 6: carry the next-checkpoint line from the hidden picture card to just under the stat tiles. Today page only. */
(function () {
  var q = 0;
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kzgp'), function (gp) {
      var host = gp.parentNode, tiles = host && host.querySelector(':scope > .kzgv'); if (!tiles) return;
      var src = gp.querySelector('.kzgp-txt em'), t = src ? src.textContent.trim() : '';
      if (!/^(Next checkpoint|The top in)/.test(t)) t = '';   // only the climb's countdown; nothing for other goal types
      var p = host.querySelector(':scope > .kzgpx-next');
      if (!t) { if (p) p.remove(); return; }
      if (!p) { p = document.createElement('p'); p.className = 'kzgpx-next'; tiles.insertAdjacentElement('afterend', p); }
      if (p.textContent !== t) p.textContent = t;
    });
  }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var n = ms[i].target; if (n.classList && n.classList.contains('kzgpx-next')) continue; soon(); return; } })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
