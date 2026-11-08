/* Nov 2 · Journal B "Tabs first" (James): the Reflections / Notes / Quotes tabs go to the top, today's question becomes one row
   ("Today · answered ✓" over the question, › to open it), the entry and word counts become one quiet line over the list, and
   "a week ago" sits after the entries. Nothing removed: the stats, today link, a-week-ago and every entry still show. */
(function () {
  if (window.__kzjb1102) return; window.__kzjb1102 = 1;
  function run() {
    q = 0; var wrap = document.querySelector('.kz-j2 > .kz-wrap'); if (!wrap) return; wrap.classList.add('kzjb');
    var st = document.getElementById('kz-jstats'), line = wrap.querySelector(':scope > .kzjb-sum');
    if (st) {
      var n = [].map.call(st.querySelectorAll(':scope > div'), function (d) { var b = d.querySelector('b'), s = d.querySelector('span'); return b && s ? b.textContent.trim() + ' ' + s.textContent.trim().toLowerCase() : ''; }).filter(Boolean);
      var txt = n.join(' · ').replace(/^1 entries/, '1 entry').replace(/ 1 words$/, ' 1 word');
      if (!line) { line = document.createElement('p'); line.className = 'kzjb-sum'; line.setAttribute('aria-hidden', 'true'); wrap.insertBefore(line, document.getElementById('kz-jlist')); }
      if (line.textContent !== txt) line.textContent = txt;
    }
    var t = document.getElementById('kz-jtoday');
    if (t) {
      var k = t.querySelector('.kz-j2-k'), done = t.querySelector('.kz-j2-done'), want = done && !done.hidden ? 'Today · answered ✓' : 'Today · not written yet';
      if (k && k.textContent !== want) k.textContent = want;
      t.classList.toggle('kzjb-done', !!(done && !done.hidden));
    }
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var x = ms[i].target; if (x.closest && (x.closest('.kzjb-sum') || x.closest('#kz-jtoday .kz-j2-k'))) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
