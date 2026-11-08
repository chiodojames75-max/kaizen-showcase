/* Nov 6: the calmer Today (styles in kzcalm-1106.css). Index only. */
(function () {
  var K = window.KZ || {}, q = 0;
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function vis(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function lineFor(o) {
    var d = o.run ? (o.day || 0) : (o.within || 0), top = (K.MTN && K.MTN.TOP) || 66;
    if (o.atTop) return { t: 'Habit earned', f: 1 };
    var next = o.cp < top ? (o.cpIn === 1 ? 'checkpoint tomorrow' : 'checkpoint in ' + plural(o.cpIn, 'day')) : (o.topIn === 1 ? 'the top tomorrow' : 'the top in ' + plural(o.topIn, 'day'));
    return { t: 'Day ' + d + ' · ' + next, f: Math.max(0.03, Math.min(1, (o.within || 0) / top)) };
  }
  function run() {
    q = 0;
    // 1) one thin progress line on each daily climbing habit
    [].forEach.call(document.querySelectorAll('.kz-gsec .kz-goal[data-goal]'), function (row) {
      var o = null; try { o = K.mtn ? K.mtn(row.getAttribute('data-goal')) : null; } catch (e) {}
      var climb = o && o.kind === 'climb' && !row.querySelector('.kz-gstep, .kz-gsub');
      if (climb) { if (row.getAttribute('data-kzc') !== 'climb') row.setAttribute('data-kzc', 'climb'); } else if (row.hasAttribute('data-kzc')) row.removeAttribute('data-kzc');
      var body = row.querySelector('.kz-gbody'), ln = body && body.querySelector(':scope > .kzc-line');
      if (!climb || !body) { if (ln) ln.remove(); return; }
      var L = lineFor(o), w = Math.round(L.f * 100) + '%';
      if (!ln) { ln = document.createElement('span'); ln.className = 'kzc-line'; ln.innerHTML = '<span></span>'; body.appendChild(ln); }
      var s = ln.querySelector('span');
      if (s.textContent !== L.t) s.textContent = L.t;
    });
    // 2) gold only on the next thing to do: the first unchecked habit or to-do on screen, top to bottom
    var cands = [].filter.call(document.querySelectorAll('.kz-gsec .kz-goal .kz-check[aria-pressed="false"], .kz-todosec .kz-plancard li:not(.done) .kz-pcheck:not(.on)'), vis);
    cands.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
    var next = cands[0] || null;
    [].forEach.call(document.querySelectorAll('.kzc-nextchk'), function (c) { if (c !== next) c.classList.remove('kzc-nextchk'); });
    [].forEach.call(document.querySelectorAll('.kzc-tag'), function (t) { if (!next || !(next.closest('.kz-goal, li') || {}).contains || !next.closest('.kz-goal, li').contains(t)) t.remove(); });
    if (next) {
      next.classList.add('kzc-nextchk');
      var item = next.closest('.kz-goal, li'), name = item && item.querySelector('.kz-gname, i.kz-tx');
      if (name && !item.querySelector('.kzc-tag')) { var t = document.createElement('span'); t.className = 'kzc-tag'; t.textContent = 'NEXT'; name.appendChild(t); }
    }
    // 4) Nov 6 (James): when every habit (or goal) in a section is done, the section leaves; they all sit in Done today
    [].forEach.call(document.querySelectorAll('#kz-today-s1 .kz-tsec.kz-gsec'), function (sec) {
      var n = sec.querySelector('.kz-tsec-n'), m = n && /(\d+)\s*of\s*(\d+)/.exec(n.textContent || '');
      var all = !!(m && +m[2] > 0 && +m[1] >= +m[2]);
      if (sec.classList.contains('kzc-alldone') !== all) sec.classList.toggle('kzc-alldone', all);
    });
    // 3) one card at a time: the "Kaizen 66" invite steps aside while another card is showing
    var inv = document.querySelector('.kz66-card.invite'), other = [].some.call(document.querySelectorAll('.kz-nmt'), vis);
    if (inv) inv.classList.toggle('kzc-hide', other);
  }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var t = ms[i].target;
      if (t.nodeType === 1 && (t.classList.contains('kzc-line') || (t.closest && t.closest('.kzc-line')))) continue;
      var own = [].every.call(ms[i].addedNodes, function (n) { return n.nodeType === 1 && /kzc-/.test(n.className || ''); }) && ms[i].addedNodes.length && !ms[i].removedNodes.length;
      if (own) continue;
      soon(); return;
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class'] });
  window.addEventListener('resize', soon);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
