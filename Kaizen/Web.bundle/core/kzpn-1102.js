/* Nov 3 · Plan, mockup C "Now first" (James; replaces the timeline kzpt-1102). The part of the day you're in (Morning before noon,
   Afternoon to 5 PM, Evening to 9 PM, then Night) is open with a gold edge and "· now"; the other parts are one line each
   ("Lunch, Gym, GMilks ›") until you tap them. On another day the first part with something left is open. Styles: kzpn-1102.css */
(function () {
  if (window.__kzpn1102) return; window.__kzpn1102 = 1;
  var open = {}, closed = {};
  function nowPart() { var h = new Date().getHours(); try { if (window.KZ && KZ.now) h = new Date(KZ.now()).getHours(); } catch (e) {} return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night'; }
  function run() {
    q = 0; var ul = document.querySelector('[data-p="day-list"]'); if (!ul) return; ul.classList.add('kzpn');
    var lis = [].slice.call(ul.querySelectorAll(':scope > li.kz-todo')), parts = [], cur = null;
    lis.forEach(function (li) { if (li.hasAttribute('data-kzlab') || !cur) { cur = { lab: li.getAttribute('data-kzlab') || '', rows: [] }; parts.push(cur); } cur.rows.push(li); });
    var sel = document.querySelector('[data-p="week"] [aria-selected="true"]'), day = sel ? sel.getAttribute('data-day') : '', isToday = !!(sel && sel.classList.contains('kzwf-today'));
    var np = isToday ? nowPart() : '', hasNow = parts.some(function (p) { return p.lab === np; });
    var firstLeft = (parts.filter(function (p) { return p.rows.some(function (r) { return !r.classList.contains('done'); }); })[0] || parts[0] || {}).lab;
    var auto = hasNow ? np : firstLeft;
    parts.forEach(function (p) {
      var done = p.rows.filter(function (r) { return r.classList.contains('done'); }).length, n = p.rows.length, key = day + '|' + p.lab, first = p.rows[0];
      var isNow = isToday && p.lab === np, isOpen = open[key] || (!closed[key] && p.lab === auto) || parts.length === 1;
      var c = done + ' of ' + n; if (first.getAttribute('data-kzpnc') !== c) first.setAttribute('data-kzpnc', c);
      var nn = isNow ? ' · now' : ''; if (first.getAttribute('data-kzpnn') !== nn) first.setAttribute('data-kzpnn', nn);
      p.rows.forEach(function (r, k) {
        var want = { 'kzpn-hide': !isOpen && k > 0, 'kzpn-sum': !isOpen && k === 0, 'kzpn-now': isNow, 'kzpn-f': k === 0, 'kzpn-l': k === n - 1 || (!isOpen && k === 0) };
        for (var cl in want) if (r.classList.contains(cl) !== want[cl]) r.classList.toggle(cl, want[cl]);
      });
      var names = p.rows.map(function (r) { var b = r.querySelector('.kz-tbody b'); return b ? b.textContent.trim() : ''; }).filter(Boolean);
      var sum = names.slice(0, 3).join(', ') + (names.length > 3 ? ' +' + (names.length - 3) : '');
      var sp = first.querySelector(':scope > .kzpn-txt'); if (!sp) { sp = document.createElement('span'); sp.className = 'kzpn-txt'; sp.innerHTML = '<span></span><em>›</em>'; first.appendChild(sp); }
      if (sp.firstChild.textContent !== sum) sp.firstChild.textContent = sum;
      first.__kzpnKey = key; first.__kzpnOpen = isOpen;
    });
  }
  document.addEventListener('click', function (e) {
    var li = e.target.closest && e.target.closest('[data-p="day-list"] > li.kzpn-sum'); if (!li) return;
    e.preventDefault(); e.stopPropagation(); open[li.__kzpnKey] = 1; delete closed[li.__kzpnKey]; run();
  }, true);
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var m = ms[i], t = m.target; if (t.closest && t.closest('.kzpn-txt')) continue; if (m.type === 'attributes' && t.closest && t.closest('ul.kzpn') && m.attributeName === 'class' && t.tagName === 'LI') continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected'] });
  setInterval(soon, 60000); soon();
})();
