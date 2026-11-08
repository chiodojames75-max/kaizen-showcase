/* Oct 27 · New to-do → Repeat → Pick days: choose "Every week" (repeats on those days until you stop it) or
   "Just this week" (one to-do on each picked day left this week, no repeat). James: "pick days and have it repeat
   weekly, or never". Works on top of kzrepeat-1027 by driving its own buttons, so saving stays the same code:
   Just this week = Repeat Never + When This week + those days picked. */
(function () {
  if (window.__kzrpw) return; window.__kzrpw = 1;
  var DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  function box() { var all = document.querySelectorAll('.kzrp-box'); for (var i = 0; i < all.length; i++) if (!all[i].hidden && all[i].offsetParent) return all[i]; return null; }
  function sheetOf(b) { return b.closest('.kz-sheet49'); }
  function mode(b) {
    if (b.querySelector('.kzrp-seg [data-rp="days"][aria-pressed="true"]')) return 'every';
    var sh = sheetOf(b); if (b.querySelector('.kzrp-seg [data-rp="never"][aria-pressed="true"]') && sh && sh.querySelector('[data-t="twhen"] [data-w="week"][aria-pressed="true"]')) return 'once';
    return '';
  }
  function paint() {
    q = 0; var b = box(); if (!b) return;
    var m = mode(b), tg = b.querySelector('.kzrpw');
    if (!m) { if (tg) tg.remove(); return; }
    var anchor = b.querySelector('.kzrp-days'); if (!anchor) return;
    var h = '<button type="button" data-rpw="every" aria-pressed="' + (m === 'every') + '">Every week</button><button type="button" data-rpw="once" aria-pressed="' + (m === 'once') + '">Just this week</button>';
    if (!tg) { tg = document.createElement('div'); tg.className = 'kzrpw'; tg.setAttribute('role', 'group'); tg.setAttribute('aria-label', 'How often'); }
    if (tg.__h !== h) { tg.__h = h; tg.innerHTML = h; }
    if (tg.nextSibling !== anchor) anchor.parentNode.insertBefore(tg, anchor);
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  function later(fn) { setTimeout(fn, 30); }
  // each tap redraws the chips, so find them again before every tap
  function pickEach(sel, want) {
    for (var guard = 0; guard < 14; guard++) {
      var bx = box(); if (!bx) return;
      var c = [].filter.call(bx.querySelectorAll(sel), function (x) { return (x.getAttribute('aria-pressed') === 'true') !== !!want(x); })[0];
      if (!c) return; c.click();
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-rpw]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    var b = t.closest('.kzrp-box'), sh = b && sheetOf(b); if (!sh) return;
    var want = t.getAttribute('data-rpw'), m = mode(b); if (want === m) return;
    if (want === 'once') {
      var days = [].map.call(b.querySelectorAll('.kzrp-days [data-rd][aria-pressed="true"]'), function (x) { return +x.getAttribute('data-rd'); });
      b.querySelector('[data-rp="never"]').click();
      later(function () { var w = sh.querySelector('[data-t="twhen"] [data-w="week"]'); if (w) w.click();
        later(function () { pickEach('.kzrp-week [data-rw]', function (c) { var k = c.getAttribute('data-rw').split('-'); return days.indexOf(new Date(+k[0], +k[1] - 1, +k[2]).getDay()) > -1; }); soon(); }); });
    } else {
      var wds = [].map.call(b.querySelectorAll('.kzrp-week [data-rw][aria-pressed="true"]'), function (c) { var k = c.getAttribute('data-rw').split('-'); return new Date(+k[0], +k[1] - 1, +k[2]).getDay(); });
      var td = sh.querySelector('[data-t="twhen"] [data-w="today"]'); if (td) td.click();
      later(function () { var bx = box(); if (!bx) return; bx.querySelector('[data-rp="days"]').click();
        later(function () { if (wds.length) pickEach('.kzrp-days [data-rd]', function (c) { return wds.indexOf(+c.getAttribute('data-rd')) > -1; }); soon(); }); });
    }
    try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'tick' }); } catch (er) {}
  }, true);
  function boot() { new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'hidden'] }); soon(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
