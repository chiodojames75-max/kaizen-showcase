
/* Oct 21: tapping "Today's goals" (the card or its folded strip) opens My goals. The fold arrow, the ⌃ button and the tree picture keep their own jobs. */
(function () { if (window.__kzGoalsTap) return; window.__kzGoalsTap = 1;
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var lab = t.closest('[data-t="pcard"] .kz-pcard-l > .kz-label49'); /* Oct 21 (11:40pm): only the words "Today's goals" open My goals; the rest of the card does nothing, the tree picture opens your tree */
    if (lab) { e.preventDefault(); e.stopImmediatePropagation(); location.href = '/pages/my-goals'; }
  }, true);
})();
