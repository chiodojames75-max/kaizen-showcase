/* Oct 27 · first-launch polish (what Apple's reviewer sees on a fresh install)
   Progress: when there's nothing to chart yet, one clear card says what will appear and how to start, instead of a blank page.
   Growth: "0 of 5 growing" isn't shown in success green. */
(function () {
  var K = window.KZ; if (!K) return;
  function progress() {
    var ms = document.querySelector('section.kzpc-ms'); if (!ms) return;
    var parts = document.querySelectorAll('section.kzpc-ht, section.kzpc-bals, section.kzpc-hb'), empty = parts.length > 0;
    for (var i = 0; i < parts.length; i++) if (!parts[i].hidden && parts[i].getBoundingClientRect().height > 0) { empty = false; break; }
    var card = document.querySelector('.kzemp');
    if (empty && !card) {
      card = document.createElement('section'); card.className = 'kzemp';
      card.innerHTML = '<b>Your progress shows up here</b><p>Check off a goal or a to-do and this page fills in: every day you showed up, how balanced your week was, and the habits you’ve earned.</p><button type="button" class="kzemp-go">Add your first goal</button>';
      ms.parentNode.insertBefore(card, ms);
    } else if (!empty && card) card.remove();
  }
  function growth() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-bst-grow'), function (e) { var z = /^0 of /.test(e.textContent.trim()); if (e.classList.contains('kzemp-zero') !== z) e.classList.toggle('kzemp-zero', z); });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.kzemp-go')) return;
    var add = document.querySelector('.kz-hadd'); if (add) add.click(); else location.href = '/pages/my-goals#add';
  });
  var q = 0;
  function run() { q = 0; try { progress(); growth(); } catch (e) {} }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  function boot() {
    run();
    new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && t.closest('.kzemp')) continue; soon(); return; } })
      .observe(document.getElementById('kz-main') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    ['kz:goals', 'kz:changed', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
