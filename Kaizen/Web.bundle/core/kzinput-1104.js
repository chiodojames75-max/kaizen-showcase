/* Nov 4: the add sheet's title follows the To-do tab ("New to-do"); it kept the previous tab's title. The to-do hint drops "e.g." to match Quit's */
(function () {
  function fix(s) { if (!s.classList.contains('kzk-todo')) return; var h = s.querySelector('h2.kz-t49'); if (h && h.textContent !== 'New to-do') h.textContent = 'New to-do';
    var i = s.querySelector('input.kzta-in'); if (i && /^e\.g\. /.test(i.placeholder)) i.placeholder = i.placeholder.replace(/^e\.g\. /, ''); }
  function watch(s) { if (s.__kzin) return; s.__kzin = 1; fix(s); new MutationObserver(function () { fix(s); }).observe(s, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true, characterData: true }); }
  function scan() { [].forEach.call(document.querySelectorAll('.kz-addsheet'), watch); }
  scan(); new MutationObserver(scan).observe(document.body, { childList: true });
})();
