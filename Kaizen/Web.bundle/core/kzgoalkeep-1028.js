/* Oct 28 · goal page: no missing tree for a frame. 1.6 s after a check-off (and on any data change) the goal page redraws its
   whole body (body.innerHTML), which wiped the sections the add-ons put there: this goal's tree (kzgrove), Break it down
   (kzbd), Kaizen 66 (kz66). They rebuilt them a frame later (after a timer), so the screen showed the page without them
   for one frame — the tree vanished and everything below jumped up and back (seen in James's tests at ~1.8 s).
   The redraw only ever writes plain blocks, never <section>, so here every <section> it removes is put straight back after
   the same block it followed, in the same moment (before the phone paints). The add-ons then update them in place. */
(function () {
  if (window.__kzgk) return; window.__kzgk = 1;
  function key(el) { return el && el.classList ? (['kz-label', 'kz-g1name', 'kz-g1step', 'kz-g1row', 'kz-g1stats', 'kz-g1hist'].filter(function (c) { return el.classList.contains(c); })[0] || '') : ''; }
  function keep(box, recs) {
    for (var r = 0; r < recs.length; r++) {
      var rm = recs[r].removedNodes; if (!rm || !rm.length || !box.querySelector('.kz-g1stats')) continue;
      var after = null;   // the render block the next kept section followed
      for (var i = 0; i < rm.length; i++) {
        var n = rm[i]; if (n.nodeType !== 1) continue;
        if (n.tagName !== 'SECTION') { var k = key(n); if (k) after = k; continue; }
        if (box.querySelector(':scope > section.' + String(n.classList[0] || '').replace(/[^\w-]/g, ''))) continue;   // already rebuilt
        var a = after && box.querySelector(':scope > .' + after);
        if (!a) a = box.querySelector(':scope > .kz-g1stats');
        // keep their order: step past the sections already put back after this block
        while (a && a.nextElementSibling && a.nextElementSibling.tagName === 'SECTION' && a.nextElementSibling.__kzgk) a = a.nextElementSibling;
        n.__kzgk = 1; box.insertBefore(n, a ? a.nextSibling : null);
      }
    }
  }
  function boot() {
    var box = document.querySelector('[data-g1="body"]'); if (!box) return;
    new (window.MutationObserver)(function (recs) { keep(box, recs); }).observe(box, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
