/* Oct 28 · James picked look 3 ("Focus") for the Plan week strip. The day you're looking at is the headline (TODAY ·
   Wed, Oct 28), the week is one glass capsule of day circles, each ringed by how much of that day's plan is done (gold dot =
   has a plan), the picked day is the gold circle, and the week arrows sit in a small "Week" pill. Only the look changes:
   the page's own buttons ([data-day], [data-wk]), swipes and counts keep working; this adds the headline, each day's ring
   value (--p) and a "3 of 5 done" line. Styles: kzweekfocus-1028.css (only under html.kzwf, added here). */
(function () {
  var K = window.KZ; if (!K || window.__kzwf) return; window.__kzwf = 1;
  document.documentElement.classList.add('kzwf');
  function pad(n) { return String(n).padStart(2, '0'); }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayOf(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function stats(k) { try { return K.planStats ? K.planStats(k) : { n: 0, done: 0 }; } catch (e) { return { n: 0, done: 0 }; } }
  function paint() {
    q = 0;
    var wk = document.querySelector('[data-p="week"]'); if (!wk) return;
    var t = K.today ? K.today() : new Date(), tk = key(t), sel = null;
    [].forEach.call(wk.querySelectorAll('button[data-day]'), function (b) {
      var k = b.getAttribute('data-day'), s = stats(k), p = s.n ? Math.min(1, s.done / s.n) : 0, v = p.toFixed(3);
      if (b.style.getPropertyValue('--p') !== v) b.style.setProperty('--p', v);
      b.classList.toggle('kzwf-has', s.n > 0); b.classList.toggle('kzwf-today', k === tk);
      var lbl = dayOf(k).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + (s.n ? ', ' + s.done + ' of ' + s.n + ' done' : '');
      if (b.getAttribute('aria-label') !== lbl) b.setAttribute('aria-label', lbl);
      if (b.getAttribute('aria-selected') === 'true') sel = k;
    });
    var h = wk.closest('.kz-tsec'), hd = h && h.querySelector('.kz-tsec-h'); if (!hd || !sel) return;
    var el = hd.querySelector('.kzwf-head'); if (!el) { el = document.createElement('div'); el.className = 'kzwf-head'; hd.insertBefore(el, hd.firstChild); }
    var d = dayOf(sel), diff = Math.round((d - dayOf(tk)) / 864e5);
    var lab = diff === 0 ? 'TODAY' : diff === 1 ? 'TOMORROW' : diff === -1 ? 'YESTERDAY' : diff > 1 ? 'IN ' + diff + ' DAYS' : (-diff) + ' DAYS AGO';
    var big = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    var html = '<span>' + lab + '</span><b>' + big + '</b>';
    if (el.__h !== html) { el.__h = html; el.innerHTML = html; }
    var s = stats(sel), pd = document.querySelector('.kz-pday-h'), n = pd && pd.querySelector('.kzwf-n');
    if (pd) {
      if (!n) { n = document.createElement('span'); n.className = 'kzwf-n'; var dn = pd.querySelector('[data-p="day-n"]'); pd.insertBefore(n, dn ? dn.nextSibling : pd.firstChild); }
      var txt = s.n ? s.done + ' of ' + s.n + ' done' : 'Nothing planned yet';
      if (n.textContent !== txt) n.textContent = txt;
    }
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  function boot() {
    paint();
    new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzwf-head, .kzwf-n')) continue; soon(); return; } })
      .observe(document.getElementById('kz-main') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    ['kz:plan', 'kz:changed', 'kz:todos'].forEach(function (n) { document.addEventListener(n, soon); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
