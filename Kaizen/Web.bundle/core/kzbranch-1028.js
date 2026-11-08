/* Oct 28 · the branch list footer: drop the " · " that wrapped onto its own line (Reset sits under the hint now) */
(function () {
  function tidy() { Array.prototype.forEach.call(document.querySelectorAll('.kz-bst-foot'), function (f) { var t = f.firstChild; if (t && t.nodeType === 3 && /\s·\s*$/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/\s·\s*$/, ''); }); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; tidy(); }); }
  function boot() { tidy(); new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) if (ms[i].addedNodes.length) { soon(); return; } }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
