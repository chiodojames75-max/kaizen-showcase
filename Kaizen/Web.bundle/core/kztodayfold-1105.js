/* Nov 5 (James: "use the same function as the Plan tab where they get categorized in a collapsible thing").
   Today's to-do list folds what's done, like the Plan tab: a checked task stays a moment (so a quick tap can undo it), then
   leaves the list. A part of the day that's all done becomes a chip ("Morning · 8"); other done tasks are "N more done".
   Tap a chip to show them again (Hide folds them back). Uses the Plan tab's chip styles (kzpa-1103b.css). */
(function () {
  if (window.__kztf) return; window.__kztf = 1;
  var show = false, seen = {}, hold = {}, first = true, q = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cls(el, c, on) { if (el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); }
  function part(li) { var t = li.querySelector(':scope > time'); var s = t ? t.textContent.trim() : ''; var m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (m) { var h = +m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night'; } return s || 'Anytime'; }
  function run() {
    q = 0;
    var ul = document.querySelector('.kz-plancard > .kz-plan-list'); if (!ul) return;
    var rows = [].slice.call(ul.children).filter(function (x) { return x.tagName === 'LI'; });
    var groups = [], by = {};
    rows.forEach(function (li) { var p = part(li); if (!by[p]) { by[p] = { lab: p, rows: [] }; groups.push(by[p]); } by[p].rows.push(li); });
    var chips = [], loose = 0, doneN = 0;
    var idOf = function (r) { var b = r.querySelector('[data-pid],[data-tdo],[data-todo]'); return (b && (b.getAttribute('data-pid') || b.getAttribute('data-tdo') || b.getAttribute('data-todo'))) || r.textContent; };
    groups.forEach(function (g) {
      g.rows.forEach(function (r) {
        var dn = r.classList.contains('done'), b = r.querySelector('[data-pid],[data-tdo],[data-todo]'), id = (b && (b.getAttribute('data-pid') || b.getAttribute('data-tdo') || b.getAttribute('data-todo'))) || r.textContent;
        if (dn && !seen[id]) { seen[id] = 1; if (!first) { hold[id] = 1; setTimeout(function () { delete hold[id]; soon(); }, 1200); } }
        else if (!dn) { delete seen[id]; delete hold[id]; }
        cls(r, 'kztf-hide', dn && !show && !hold[id]);
      });
      // a task you just checked doesn't count in the chips until it folds away, so nothing above it moves under your finger
      var d = g.rows.filter(function (r) { return r.classList.contains('done') && !hold[idOf(r)]; }).length; doneN += d;
      if (d && d === g.rows.length) chips.push({ lab: g.lab, n: d }); else loose += d;
    });
    var top = ul.parentNode.querySelector(':scope > .kzpa-top.kztf-top');
    if (!top) { top = document.createElement('div'); top.className = 'kzpa-top kztf-top'; ul.parentNode.insertBefore(top, ul); }
    var cs = chips.map(function (c) { return '<button type="button" class="kzpa-chip" data-kztf-sd><i></i><span>' + esc(c.lab) + ' · ' + c.n + '</span></button>'; });
    if (loose) cs.push('<button type="button" class="kzpa-chip" data-kztf-sd><i></i><span>' + loose + ' more done</span></button>');
    var h = cs.length ? '<div class="kzpa-chips" data-n="' + (cs.length + (show ? 1 : 0)) + '">' + cs.join('') + (show ? '<button type="button" class="kzpa-chip kzpa-hd" data-kztf-sd><span>Hide</span></button>' : '') + '</div>' : '';
    if (doneN && doneN === rows.length && !show) h += '<p class="kzpa-all">Everything’s done. Nice climb.</p>';
    if (top.__h !== h) { top.__h = h; top.innerHTML = h; }
    top.hidden = !h; cls(top, 'kzpa-sd', show);
    first = false;
  }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kztf-sd]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); show = !show; try { navigator.vibrate(4); } catch (er) {} run();
  }, true);
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kztf-top')) continue; if (ms[i].type === 'attributes' && ms[i].attributeName === 'class' && t.tagName === 'LI' && (ms[i].oldValue || '').replace(/\s*kztf-hide/g, '') === t.className.replace(/\s*kztf-hide/g, '')) continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class'] });
  soon();
})();
