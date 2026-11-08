/* Oct 26 m · The Grove tab is called Growth (James), and its header counts only the goals you're growing now
   (it counted archived ones too: "10 trees" with 7 on screen). The count is shown from a data attribute so the
   grove's own redraw (which writes the old text) and this file never fight. Links that said "Grove ›" say "Growth ›". */
(function () {
  var K = window.KZ; if (!K || window.__kzGrowth) return; window.__kzGrowth = 1;
  function run() {
    var b = document.querySelector('#kz-header .kz-htitle b'); if (b && b.textContent.trim() === 'Grove') b.textContent = 'Growth';
    if (/^(Grove|Tree)\b/.test(document.title)) document.title = document.title.replace(/^(Grove|Tree)/, 'Growth');
    var sub = document.querySelector('#kz-header .kz-htitle .kzpb-sub'), rows = document.querySelectorAll('.kzg-rows > .kzg-row');
    if (sub && document.querySelector('.kzg-rows')) { var n = rows.length, t = n + (n === 1 ? ' tree' : ' trees'); if (sub.getAttribute('data-n') !== t) sub.setAttribute('data-n', t); }
    document.querySelectorAll('a[href="/pages/profile"]').forEach(function (a) { if (a.textContent.trim() === 'Grove ›') a.textContent = 'Growth ›'; });
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { run(); } catch (e) {} }); }
  function boot() { run(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
