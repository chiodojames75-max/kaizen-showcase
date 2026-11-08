/* Oct 27 q · Quote/question sheet (the chat button at the top of every tab) gets a third choice (James): "Note to self".
   It closes the sheet and opens the same note page as the + sheet and Journal → Notes (K.openNote, kznotes-1026j):
   type or dictate, tag a branch if you like, Save → it's in Journal → Notes.
   Works with both sheets (Today's from kzfocus-1025m, the other tabs' from kzdaily-1026m): the row is added the moment
   the sheet is created, before it is drawn. */
(function () {
  var K = window.KZ; if (!K || K.__kzqnote) return; K.__kzqnote = 1;
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>';
  function add(s) {
    var pane = s.querySelector('.kzf-qs-in'), x = pane && pane.querySelector('[data-q="x"]'); if (!pane || !x || pane.querySelector('.kzqn-b') || !K.openNote) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kzqn-b';
    b.innerHTML = '<b>' + PEN + 'Note to self</b><span>A quick thought, typed or dictated. Saved to Journal → Notes.</span>';
    pane.insertBefore(b, x);
    b.addEventListener('click', function (e) {
      e.stopPropagation(); x.click();   // the sheet closes the way it always does
      setTimeout(function () { try { K.openNote(); } catch (er) {} }, 300);
    });
  }
  function scan() { document.querySelectorAll('.kzf-qs').forEach(add); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && n.classList.contains('kzf-qs')) add(n); } }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
