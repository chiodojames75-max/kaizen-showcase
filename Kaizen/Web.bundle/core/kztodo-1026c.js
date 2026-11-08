/* Oct 26 (c, from b: only adds/removes rows; their place in the list is set by kzorder-1026f, which mirrors the Plan tab) (b, from a: to-dos follow the order set on the Plan tab): on Today, an added to-do ("Gym") is a row in the same list as the plan's to-dos:
   time on the left (its time, its part of the day, or "Anytime"), check on the right, added below.
   No remove button on Today (delete it on the Plan tab). One count in the header ("0 of 6").
   Each row is a stand-in: tapping its check taps the real to-do's check, so saving, points and the
   Plan tab work exactly as before. If there is no plan today, the to-dos still get the same list look. */
(function () {
  var K = window.KZ; if (!K || window.__kztd) return; window.__kztd = 1;
  window.addEventListener('storage', function (e) { if (e.key === 'kz_order') sync(); });
  var TICK = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
  function label(t) {
    try {
      if (t.time && K.fmtTime) return K.fmtTime(t.time);
      if (t.part && t.part !== 'any' && K.partName) return K.partName(t.part);
    } catch (e) {}
    return 'Anytime';
  }
  function txt(el, s) { if (el && el.textContent !== s) el.textContent = s; }
  function sync() {
    var sec = document.querySelector('.kz-today .kz-todosec, .kz-todosec'); if (!sec) return;
    var ul = sec.querySelector('ul.kz-todos'); if (!ul) return;
    var card = sec.querySelector('.kz-plancard'), planOl = card && !card.hidden ? card.querySelector('.kz-plan-list') : null;
    var solo = sec.querySelector('.kztd-solo');
    var src = [].slice.call(ul.querySelectorAll('li.kz-todo[data-todo]'));
    var ol = planOl;
    if (!ol) {
      if (!src.length) { if (solo) solo.hidden = true; if (sec.classList.contains('kztd-on')) sec.classList.remove('kztd-on'); return; }
      if (!solo) { solo = document.createElement('div'); solo.className = 'kztd-solo'; solo.innerHTML = '<ol class="kz-plan-list"></ol>'; ul.parentNode.insertBefore(solo, ul); }
      solo.hidden = false; ol = solo.querySelector('ol');
    } else if (solo) { solo.hidden = true; [].slice.call(solo.querySelectorAll('li.kztd')).forEach(function (li) { li.remove(); }); }
    if (!sec.classList.contains('kztd-on')) sec.classList.add('kztd-on');   // add() on a class that's already there still counts as a change
    var byId = {}, rank = {}; try { (K.todos() || []).forEach(function (t, i) { byId[t.id] = t; rank[t.id] = i; }); } catch (e) {}
    // order = the order you set on the Plan tab (kz_order), then the order you added them; checking never moves rows
    var placed = {}; try { var od = (K.get('order', {}) || {})[K.key(K.today())] || []; od.forEach(function (k, i) { if (k.indexOf('t:') === 0) placed[k.slice(2)] = i; }); } catch (e) {}
    src.sort(function (x, y) {
      var ix = x.getAttribute('data-todo'), iy = y.getAttribute('data-todo');
      var px = placed[ix] != null ? placed[ix] : 1e6, py = placed[iy] != null ? placed[iy] : 1e6;
      if (px !== py) return px - py;
      var a = rank[ix], c = rank[iy]; return (a == null ? 1e9 : a) - (c == null ? 1e9 : c);
    });
    var ids = src.map(function (li) { return li.getAttribute('data-todo'); });
    [].slice.call(ol.querySelectorAll('li.kztd')).forEach(function (li) { if (ids.indexOf(li.getAttribute('data-kztd')) < 0) li.remove(); });
    var plans = ol.querySelectorAll(':scope > li:not(.kztd)'), prev = null;
    if (plans.length) prev = plans[plans.length - 1];
    src.forEach(function (s) {
      var id = s.getAttribute('data-todo'), t = byId[id] || {}, chk = s.querySelector('.kz-tcheck'), on = !!chk && chk.getAttribute('aria-pressed') === 'true';
      var name = (s.querySelector('.kz-tbody b') || s.querySelector('.kz-tbody') || {}).textContent || t.text || t.name || '';
      var li = ol.querySelector('li.kztd[data-kztd="' + id + '"]');
      if (!li) {
        li = document.createElement('li'); li.className = 'kztd'; li.setAttribute('data-kztd', id);
        li.innerHTML = '<time></time><span><i class="kz-tx"></i></span><button type="button" class="kz-pcheck kztd-check" data-kztd-check="' + id + '" aria-pressed="false">' + TICK + '</button>';
      }
      if (li.parentNode !== ol) { if (prev) prev.after(li); else ol.appendChild(li); }   // c: a new row starts below; kzorder-1026f then puts it where the Plan tab has it (rows already in the list are never moved here)
      prev = li;
      txt(li.querySelector('time'), label(t)); txt(li.querySelector('.kz-tx'), name.trim());
      var b = li.querySelector('button');
      li.classList.toggle('done', on); b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', (on ? 'Undo: ' : 'Done: ') + name.trim());
    });
    // one count: plan items + to-dos
    var all = ol.querySelectorAll(':scope > li'), done = ol.querySelectorAll(':scope > li.done').length;
    var h = sec.querySelector('.kz-tsec-h'), n = h && h.querySelector('.kztd-n');
    if (h && !n) { n = document.createElement('span'); n.className = 'kz-tsec-n kztd-n'; var h2 = h.querySelector('h2'); h2.parentNode.insertBefore(n, h2.nextSibling); }
    txt(n, done + ' of ' + all.length);
  }
  // the stand-in check taps the real one (before any other handler sees it)
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kztd-check]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var real = document.querySelector('ul.kz-todos .kz-tcheck[data-tdo="' + b.getAttribute('data-kztd-check') + '"]');
    if (real) real.click();
    sync();
  }, true);
  var q = 0, mo = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('li.kztd, .kztd-n, .kztd-solo')) continue; if (!q) q = requestAnimationFrame(function () { q = 0; sync(); }); return; }
  });
  function boot() { sync(); mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'hidden', 'class'], characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
