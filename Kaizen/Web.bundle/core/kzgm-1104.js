/* Nov 4 (James: "Delete is where the back would be"): in the goal menu, Delete moves up to the header, across from the
   goal's name, away from where a thumb lands to swipe the sheet away. It still asks twice, and the second tap only
   counts 0.6 s after the first, so a double tap can't delete a goal. */
(function () {
  if (window.__kzgm1104) return; window.__kzgm1104 = 1;
  function lift(m) {
    if (m.__kzgm4) return; var hd = m.querySelector('.kzgm-hd'), del = m.querySelector('.kzm-it[data-k="del"]'); if (!hd || !del) return;
    m.__kzgm4 = 1; m.classList.add('kzgm4');
    // keep the header where it is (the tile layout keys off it), just put the name in a span and Delete beside it
    if (!hd.querySelector('.kzgm4-nm')) { var nm = document.createElement('span'); nm.className = 'kzgm4-nm'; nm.textContent = hd.textContent; hd.textContent = ''; hd.appendChild(nm); }
    var grp = del.parentNode; hd.appendChild(del); del.classList.add('kzgm4-del');
    if (grp && grp !== m && !grp.querySelector('.kzm-it')) grp.classList.add('kzgm4-empty');
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kzm.kzgm'), lift); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  soon();
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzm-it[data-k="del"]'); if (!b) return;
    if (!b.classList.contains('sure')) { b.__kzSureAt = Date.now(); return; }
    if (Date.now() - (b.__kzSureAt || 0) < 600) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);
})();
