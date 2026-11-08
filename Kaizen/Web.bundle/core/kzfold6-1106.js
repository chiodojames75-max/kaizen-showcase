/* Nov 6 (James: "once all the to-dos are done they should go away, as well as if you checked off worked on it today
   for a long-term goal" · "everything should go in the done today if it's done today, even the quit"). On Today:
   - every to-do done: the To-dos section folds away (after a moment, so a quick tap can still undo); "Coming up" goes with it (future to-dos live on the Plan tab).
   - "Worked on it today" on a long-term goal, and a Quit check-in answered today (Clean, or Back to day 0): the row
     leaves its list after a moment and shows in Done today, with its gold check. Tapping that check undoes it (it
     presses the row's own "Worked on it today" / Undo, so the same saves run). A Quit section with every check-in
     answered folds away. Done today is created when the page has none yet. Nothing stored changes here.
   Styles: kzfold6-1106.css */
(function () {
  if (window.__kzf6) return; window.__kzf6 = 1;
  var WAIT = 1200, since = {}, q = 0, timer = 0;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CHK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var K = window.KZ;
  // A long-term goal's tile: its own mountain photo with the orange trail as far as it has climbed (the same drawing as
  // the other Done today tiles; K.mtnScene only draws habit climbs, so it is asked for this goal as one).
  function climbTile(id) {
    if (!K || !K.mtn || !K.mtnScene) return '';
    var m = K.mtn, sc = null;
    try { K.mtn = function (g) { var o = m.apply(this, arguments); if (g === id && o) { var c = {}; for (var k in o) c[k] = o[k]; c.kind = 'climb'; return c; } return o; }; sc = K.mtnScene(id, 96, 96); } catch (e) { sc = null; } finally { K.mtn = m; }
    if (!sc) { try { var o2 = m(id); if (o2 && o2.pic) return '<img src="' + esc(o2.pic) + '" alt="" decoding="async">'; } catch (e) {} return ''; }
    return '<img src="' + esc(sc.pic) + '" alt="" decoding="async" style="object-position:50% ' + sc.py + '%">' + sc.svg.replace('<svg ', '<svg preserveAspectRatio="none" ');
  }
  // A Quit habit's tile: its fog photo, the fog as thick as it still is (clears 1/66 per clean day)
  function fogTile(id) {
    var o = null; try { o = K && K.mtn ? K.mtn(id) : null; } catch (e) {}
    if (!o || !o.pic) return '';
    var f = Math.max(0, Math.min(1, 1 - (+o.frac || 0)));
    return '<img src="' + esc(o.pic) + '" alt="" decoding="async" style="object-position:50% 40%"><span class="kzf6-fog" style="opacity:' + f.toFixed(3) + '"><i></i><i></i><i></i></span>';
  }
  function cls(el, c, on) { if (el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); }
  function later() { clearTimeout(timer); timer = setTimeout(soon, WAIT + 30); }
  function aged(key, on, now) { if (on) { since[key] = since[key] || now; return now - since[key] >= WAIT; } since[key] = 0; return false; }
  function run() {
    q = 0; var root = document.getElementById('kz-today-s1'); if (!root) return; var now = Date.now(), wait = false, items = [];
    // to-dos
    var td = root.querySelector('.kz-todosec');
    if (td) { var m = /(\d+)\s*of\s*(\d+)/.exec((td.querySelector('.kztd-n') || td.querySelector('.kz-tsec-h .kz-tsec-n') || {}).textContent || '');
      var all = !!(m && +m[2] > 0 && +m[1] === +m[2]), a = aged('td', all, now); if (all && !a) wait = true; cls(td, 'kzf6-all', a); }
    // long-term goals worked on today
    [].forEach.call(root.querySelectorAll('.kz-gsec .kz-goal.kzbd-row'), function (r) {
      var id = r.getAttribute('data-goal'), lw = r.querySelector('.kzlw'), on = !!(lw && lw.classList.contains('on')), a = aged('g' + id, on, now);
      if (on && !a) wait = true; cls(r, 'kzf6-gone', a);
      if (a) items.push({ k: 'g', id: id, name: ((r.querySelector('.kz-gname') || {}).textContent || 'Goal').trim(), sub: 'Worked on it today' });
    });
    // quit check-ins answered today
    var qs = root.querySelector('.kzq-sec'), qn = 0, qh = 0;
    if (qs) [].forEach.call(qs.querySelectorAll('.kzq-row'), function (r) {
      qn++; var id = r.getAttribute('data-q'), u = r.querySelector('.kzq-undo'), a = aged('q' + id, !!u, now);
      if (u && !a) wait = true; cls(r, 'kzf6-gone', a);
      if (a) { qh++; var st = r.querySelector('.kzq-st'); items.push({ k: 'q', id: id, name: ((r.querySelector('.kzq-main b') || {}).textContent || 'Quit').trim(), sub: st ? st.textContent.replace(/^✓\s*/, '').trim() : 'Checked in' }); }
    });
    if (qs) cls(qs, 'kzf6-all', qn > 0 && qh === qn);
    // Done today
    var ds = document.querySelector('#kz-today-s1 .kz-donesec'); if (ds && (ds.hidden || !ds.querySelector('.kz-goal.is-done') || getComputedStyle(ds).display === 'none')) ds = null;
    var mine = document.querySelector('#kz-today-s1 .kzf6-dsec'), host;
    if (ds) { if (mine) mine.remove(); host = ds.querySelector('.kz-rows') || ds; }
    else if (items.length) {
      if (!mine) { mine = document.createElement('section'); mine.className = 'kzf6-dsec'; mine.setAttribute('aria-label', 'Done today'); mine.innerHTML = '<h2 class="kzf6-dh">Done today</h2>';
        var tg = root.querySelector('.kz-tomorrow') || root.querySelector('.kz-tgroups') || root.querySelector('.kz-wrap49'); tg.appendChild(mine); }
      host = mine;
    } else if (mine) mine.remove();
    if (ds) items = items.filter(function (it) { return !ds.querySelector('.kz-goal.is-done[data-goal="' + CSS.escape(it.id) + '"]'); });
    var box = host ? host.querySelector(':scope > .kzf6-box') : null;
    if (!items.length) { if (box) box.remove(); }
    else if (host) {
      if (!box) { box = document.createElement('div'); box.className = 'kzf6-box'; host.appendChild(box); }
      var h = items.map(function (it) { return '<div class="kzf6-row"><span class="kzf6-th">' + (it.k === 'g' ? climbTile(it.id) : fogTile(it.id)) + '</span><div class="kzf6-b"><b>' + esc(it.name) + '</b><span>' + esc(it.sub) + '</span></div>' +
        '<button type="button" class="kzf6-ck" data-kzf6u="' + it.k + ':' + esc(it.id) + '" aria-label="' + esc(it.name) + ', ' + esc(it.sub) + '. Undo">' + CHK + '</button></div>'; }).join('');
      if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
    }
    [].forEach.call(document.querySelectorAll('#kz-today-s1 .kz-goal.is-done[data-goal] > .kzt-th'), function (th) {
      if (th.querySelector(':scope > .kzdt-w')) return; var t = fogTile(th.parentNode.getAttribute('data-goal')); if (!t) return;
      var o = null; try { o = K.mtn(th.parentNode.getAttribute('data-goal')); } catch (e) {} if (!o || o.kind !== 'storm') return;
      var w = document.createElement('span'); w.className = 'kzdt-w kzf6-fogw'; w.innerHTML = t; th.appendChild(w);
    });
    if (wait) later();
  }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kzf6u]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var v = b.getAttribute('data-kzf6u'), k = v.slice(0, 1), id = v.slice(2), t = null;
    if (k === 'g') { var r = document.querySelector('#kz-today-s1 .kz-goal[data-goal="' + CSS.escape(id) + '"]'); t = r && r.querySelector('.kzlw'); }
    else { var qr = document.querySelector('#kz-today-s1 .kzq-row[data-q="' + CSS.escape(id) + '"]'); t = qr && qr.querySelector('.kzq-undo'); }
    if (t) t.click();
  }, true);
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzf6-box, .kzf6-dsec')) continue; soon(); return; } })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
