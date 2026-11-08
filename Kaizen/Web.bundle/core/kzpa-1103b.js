/* Nov 3 b · the done chips stay on one line, shrinking as more parts finish; long names end in … (James).
   Nov 3 · Plan A "One clean list" (James: "it's the easiest to adjust … some people get out of order with stuff, and they
   still want to organize their thoughts"). Replaces Plan C (kzpn-1102c) on the Plan page:
   - no boxes; what's left is one list, each part of the day a small label ("Evening · now" in gold on today)
   - check off any row in any order; done rows leave the list; a part that's all done becomes a chip at the top
   - a line + bar at the top: "7 of 12 done · 5 left"; tap a chip to see (or hide) what you've done
   - drag to move still works (same rows, same order rules). Keeps kzpn-1102c's Plan tomorrow bits (multiplier text, kzpn-pm).
   Styles: kzpa-1103.css */
(function () {
  if (window.__kzpa1103) return; window.__kzpa1103 = 1;   // (1103b: same flag, replaces 1103)
  var showDone = {}, first = true, seen = {}, hold = {}, fresh = false;
  function nowPart() { var h = new Date().getHours(); try { if (window.KZ && KZ.now) h = new Date(KZ.now()).getHours(); } catch (e) {} return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night'; }
  function set(el, a, v) { if (v == null) { if (el.hasAttribute(a)) el.removeAttribute(a); } else if (el.getAttribute(a) !== v) el.setAttribute(a, v); }
  function cls(el, c, on) { if (el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kz-pm-count'), function (pc) { var t = pc.textContent, u = t.replace(/\s*·\s*up to ×\d+.*$/, '').replace(/\s*·\s*\d+ more for ×\d+/, ''); if (u !== t) pc.textContent = u; });
    var pmOn = [].some.call(document.querySelectorAll('.kz-planmodal'), function (m) { return !m.hidden && m.getClientRects().length && getComputedStyle(m).visibility !== 'hidden' && getComputedStyle(m).opacity !== '0'; });
    cls(document.documentElement, 'kzpn-pm', pmOn);
    var ul = document.querySelector('[data-p="day-list"]'); if (!ul) return;
    cls(ul, 'kzpa', true); cls(ul, 'kzpn', false);
    var lis = [].slice.call(ul.querySelectorAll(':scope > li.kz-todo')).map(function (li, i) { return { li: li, i: i, o: parseFloat(getComputedStyle(li).order) || 0 }; }).sort(function (a, b) { return a.o - b.o || a.i - b.i; }).map(function (x) { return x.li; });
    var parts = [], cur = null;
    lis.forEach(function (li) { if (li.hasAttribute('data-kzlab') || !cur) { cur = { lab: li.getAttribute('data-kzlab') || 'Anytime', rows: [] }; parts.push(cur); } cur.rows.push(li); });
    var sel = document.querySelector('[data-p="week"] [aria-selected="true"]'), day = sel ? sel.getAttribute('data-day') : '';
    var tk = ''; try { tk = KZ.key(KZ.today()); } catch (e) {}
    var isToday = !!(sel && (sel.classList.contains('kzwf-today') || day === tk)), np = isToday ? nowPart() : '';
    fresh = run.__day !== day; run.__day = day;   // a day you just opened: what's done is already done
    var sd = !!showDone[day], total = lis.length, doneN = 0, chips = [], looseDone = 0;
    parts.forEach(function (p) {
      var d = p.rows.filter(function (r) { return r.classList.contains('done'); }).length; doneN += d;
      var all = d === p.rows.length; if (all) chips.push({ lab: p.lab, n: d }); else looseDone += d;
      var firstShown = null;
      p.rows.forEach(function (r) {
        var dn = r.classList.contains('done'), id = day + '|' + (r.getAttribute('data-kzk') || r.textContent);
        if (dn && !seen[id]) { seen[id] = 1; if (!first && !fresh) { hold[id] = 1; setTimeout(function () { delete hold[id]; soon(); }, 1200); } } else if (!dn) { delete seen[id]; delete hold[id]; }
        var hide = dn && !sd && !hold[id];   // a row you just checked stays a moment, so a quick tap can undo it
        cls(r, 'kzpa-dn', dn); cls(r, 'kzpa-hide', hide); cls(r, 'kzpa-now', p.lab === np);
        if (!hide && !firstShown) firstShown = r;
      });
      p.rows.forEach(function (r) { set(r, 'data-kzpah', r === firstShown ? p.lab + (p.lab === np ? ' · now' : '') : null); cls(r, 'kzpa-h', r === firstShown); });
    });
    // the top: count, bar, chips
    var host = ul.parentNode, top = host.querySelector(':scope > .kzpa-top');
    if (!top) { top = document.createElement('div'); top.className = 'kzpa-top'; host.insertBefore(top, ul); }
    var left = total - doneN, pc = total ? Math.round(doneN / total * 100) : 0;
    var h = '';
    if (total) {
      h += '<div class="kzpa-line"><b>' + doneN + ' of ' + total + ' done</b><span>' + (left ? left + ' left' : 'All done') + '</span></div><div class="kzpa-bar"><i style="width:' + pc + '%"></i></div>';
      var cs = chips.map(function (c) { return '<button type="button" class="kzpa-chip" data-kzpa-sd><i></i><span>' + esc(c.lab) + ' · ' + c.n + '</span></button>'; });
      if (looseDone) cs.push('<button type="button" class="kzpa-chip" data-kzpa-sd><i></i><span>' + looseDone + ' more done</span></button>');
      if (cs.length) h += '<div class="kzpa-chips" data-n="' + (cs.length + (sd ? 1 : 0)) + '">' + cs.join('') + (sd ? '<button type="button" class="kzpa-chip kzpa-hd" data-kzpa-sd><span>Hide</span></button>' : '') + '</div>';
      if (!left) h += '<p class="kzpa-all">Everything’s done. Nice climb.</p>';
    }
    if (top.__h !== h) { top.__h = h; top.innerHTML = h; }
    first = false;
    cls(top, 'kzpa-sd', sd); top.__day = day;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kzpa-sd]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); var t = b.closest('.kzpa-top'), d = t ? t.__day : '';
    showDone[d] = !showDone[d]; try { navigator.vibrate(4); } catch (er) {} run();
  }, true);
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var m = ms[i], t = m.target; if (t.closest && t.closest('.kzpa-top')) continue; if (m.type === 'attributes' && t.tagName === 'LI' && t.closest && t.closest('ul.kzpa') && (m.attributeName === 'data-kzpah' || (m.attributeName === 'class' && !/\bdone\b/.test(m.oldValue || '') === !t.classList.contains('done')))) continue; if (m.type === 'attributes' && t.tagName === 'UL' && t.classList.contains('kzpa') && m.attributeName === 'class') continue; soon(); return; } })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'aria-selected', 'hidden', 'style', 'data-kzpah'] });
  setInterval(soon, 60000); soon();
})();
