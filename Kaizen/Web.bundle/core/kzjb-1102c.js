/* Nov 3 · James: the count line counts only what the open tab shows (reflections, notes or quotes), and "a week ago" shows only
   on Reflections. Notes get the same orange-edge look (kzjb-1102c.css).
   Nov 2 b · James: every entry looks like "a week ago you wrote": an orange edge, the day as a small orange label, the question
   (or the quote) in grey, the stars under it, then what you wrote. The day label is added here; the date column is hidden by CSS.
   Nov 2 · Journal B "Tabs first" (James): the Reflections / Notes / Quotes tabs go to the top, today's question becomes one row
   ("Today · answered ✓" over the question, › to open it), the entry and word counts become one quiet line over the list, and
   "a week ago" sits after the entries. Nothing removed: the stats, today link, a-week-ago and every entry still show. */
(function () {
  if (window.__kzjb1102c) return; window.__kzjb1102c = 1;
  function run() {
    q = 0; var wrap = document.querySelector('.kz-j2 > .kz-wrap'); if (!wrap) return; wrap.classList.add('kzjb');
    var st = document.getElementById('kz-jstats'), line = wrap.querySelector(':scope > .kzjb-sum');
    if (st) {
      var n = [].map.call(st.querySelectorAll(':scope > div'), function (d) { var b = d.querySelector('b'), s = d.querySelector('span'); return b && s ? b.textContent.trim() + ' ' + s.textContent.trim().toLowerCase() : ''; }).filter(Boolean);
      var tabB = document.querySelector('.kz-jtabs [data-jtab][aria-selected="true"]'), tab = tabB ? tabB.getAttribute('data-jtab') : 'answers';
      wrap.setAttribute('data-kzjb-tab', tab);
      var wc = function (els) { return [].reduce.call(els, function (a, e) { var t = (e.textContent || '').trim(); return a + (t ? t.split(/\s+/).length : 0); }, 0); };
      var pl = function (k, one, many) { return k + ' ' + (k === 1 ? one : many); };
      var txt;
      if (tab === 'notes') { var nc = document.querySelectorAll('#kz-nlist .kznt-card'); txt = pl(nc.length, 'note', 'notes') + ' · ' + pl(wc(document.querySelectorAll('#kz-nlist .kznt-card .kznt-p, #kz-nlist .kznt-card > p')), 'word', 'words'); }
      else if (tab === 'quotes') { var qc = document.querySelectorAll('#kz-qlist .kz-qnote'); txt = pl(qc.length, 'quote', 'quotes') + ' · ' + pl(wc(document.querySelectorAll('#kz-qlist .kz-qnote > p')), 'word', 'words'); }
      else txt = n.join(' · ').replace(/^1 entries/, '1 entry').replace(/ 1 words$/, ' 1 word');
      if (!line) { line = document.createElement('p'); line.className = 'kzjb-sum'; line.setAttribute('aria-hidden', 'true'); wrap.insertBefore(line, document.getElementById('kz-jlist')); }
      if (line.textContent !== txt) line.textContent = txt;
    }
    [].forEach.call(document.querySelectorAll('#kz-jlist .kz-j2-entry[data-day]'), function (a) {
      var body = a.querySelector('.kz-j2-body'); if (!body || body.querySelector(':scope > .kzjb-day')) return;
      var dt = new Date(a.getAttribute('data-day') + 'T12:00:00'), l = document.createElement('span'); l.className = 'kz-j2-k kzjb-day';
      l.textContent = dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); body.insertBefore(l, body.firstChild);
    });
    var t = document.getElementById('kz-jtoday');
    if (t) {
      var k = t.querySelector('.kz-j2-k'), done = t.querySelector('.kz-j2-done'), want = done && !done.hidden ? 'Today · answered ✓' : 'Today · not written yet';
      if (k && k.textContent !== want) k.textContent = want;
      t.classList.toggle('kzjb-done', !!(done && !done.hidden));
    }
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var x = ms[i].target; if (x.closest && (x.closest('.kzjb-sum') || x.closest('#kz-jtoday .kz-j2-k') || x.closest('.kzjb-day'))) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-selected'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
