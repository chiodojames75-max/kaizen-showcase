/* Oct 27 x · James's tidy-ups (styles: kztidy-1027x.css)
   1. Swipe a goal left: Edit + Delete. The Archive button becomes Edit (opens the goal's own editor, same as ••• → Edit).
   2. Archive is retired: "Archived goals" links only show while something is still archived, so old ones can be restored.
   (LATER divider → plain line and the glass checks are CSS only.) */
(function () {
  var K = window.KZ; if (!K || K.__kztidy) return; K.__kztidy = 1;
  var PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
  function patch(root) {
    [].forEach.call((root || document).querySelectorAll('.kz-gswipe .arch[data-kz-sw-arch]'), function (b) {
      var id = b.getAttribute('data-kz-sw-arch'); b.removeAttribute('data-kz-sw-arch');
      b.className = 'edit'; b.setAttribute('data-kz-sw-edit', id); b.innerHTML = PEN + 'Edit';
    });
  }
  function archLinks() {
    var n = 0; try { n = (K.archived() || []).length; } catch (e) {}
    document.documentElement.classList.toggle('kz-has-arch', n > 0);
  }
  patch(); archLinks();
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && (n.querySelector('.kz-gswipe .arch') || n.matches('.kz-gswipe, .kz-gswipe *'))) { patch(n.closest('.kz-goal') || n); } }
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('kz:changed', function () { setTimeout(archLinks, 0); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kz-sw-edit]'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    var c = b.closest('.kz-goal'), ed = c && c.querySelector('.kz-gmenu [data-kz-edit]');
    document.body.click();   // closes the open swipe the same way a tap elsewhere does
    if (ed) setTimeout(function () { ed.click(); var box = c.isConnected && c.querySelector('.kz-editbox:not([hidden])'); if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 200);
  }, true);
})();
