/* Nov 2 · goal menu mockup B "Action tiles" (James): the goal's name on top, View / Edit / Kaizen 66 as three tiles, Move up and
   Move down side by side, Delete as red text. Same buttons and actions; only labels get shorter (full names stay for VoiceOver). */
(function () {
  if (window.__kzgm1102) return; window.__kzgm1102 = 1;
  var SHORT = { 'View goal': 'View', 'Make this my Kaizen 66': 'Kaizen 66' };
  function dress(m) {
    if (m.__kzgm) return; m.__kzgm = 1; m.classList.add('kzgm');
    var nm = (m.getAttribute('aria-label') || '').replace(/^Actions for\s+/, '');
    if (nm && !m.querySelector('.kzgm-hd')) { var h = document.createElement('div'); h.className = 'kzgm-hd'; h.textContent = nm; var g = m.querySelector('.kzs-grab'); m.insertBefore(h, g ? g.nextSibling : m.firstChild); }
    [].forEach.call(m.querySelectorAll('.kzm-it > span'), function (s) { var t = s.textContent.trim(); if (SHORT[t]) { s.parentNode.setAttribute('aria-label', t); s.textContent = SHORT[t]; } });
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kzm.kzs'), function (m) { if (m.querySelector('[data-k="view"]') && m.querySelector('[data-k="del"]')) dress(m); }); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && (n.matches('.kzm') || n.querySelector('.kzm'))) { soon(); return; } } } })
    .observe(document.body, { childList: true, subtree: true });
  soon();
})();
