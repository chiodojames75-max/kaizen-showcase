/* Oct 25 w · goal page: the 7-row stage table becomes one line ("Next: Sprout in 2 days"); Kaizen 66 card: "Ends Dec 26". */
(function () {
  var K = window.KZ; if (!K || K.__kzlite) return; K.__kzlite = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  function goal() {
    var g = document.querySelector('#kz-goalpage .kzg-goal'); if (!g) return;
    var row = Array.prototype.filter.call(g.querySelectorAll('.kzg-ms .kzg-mr'), function (r) { return !r.classList.contains('done') && !r.classList.contains('now'); })[0];
    var txt = row ? ((row.querySelector('.kzg-mn') || {}).textContent || '') + ' ' + ((row.querySelector('.kzg-mx') || {}).textContent || '') : '';
    var line = g.querySelector('.kzl-next');
    if (!txt.trim()) { if (line) line.remove(); return; }
    if (!line) { line = document.createElement('p'); line.className = 'kzl-next'; var bar = g.querySelector('.kzg-bar') || g.querySelector('.kzg-dayrow'); if (bar && bar.parentNode) bar.parentNode.insertBefore(line, bar.nextSibling); else g.appendChild(line); }
    var h = 'Next: <b>' + esc(row.querySelector('.kzg-mn').textContent) + '</b> ' + esc(row.querySelector('.kzg-mx').textContent);
    if (line.__h !== h) { line.__h = h; line.innerHTML = h; }
  }
  function k66() {
    var e = document.querySelector('.kzf-end'); if (!e) return;
    var m = /lands on (.+)$/.exec(e.textContent || ''); if (m) e.textContent = 'Ends ' + m[1];
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { goal(); k66(); } catch (e) {} }); }
  function boot() { soon(); new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzl-next')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
