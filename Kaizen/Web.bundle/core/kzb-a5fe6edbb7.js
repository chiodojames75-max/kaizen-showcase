/* ==== kzpa-1103b.js ==== */
;try {
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

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzwk-1103.js ==== */
;try {
/* Nov 3 · Plan week strip, mockup B "Progress rings" (James). Each day with tasks gets a thin ring around its date that fills
   gold as the day's tasks get done; days with nothing are dimmed; no dots. Reads the same tasks the strip already counts
   (to-dos for that day + that day's plan). Styles: kzwk-1103.css */
(function () {
  if (window.__kzwk1103) return; window.__kzwk1103 = 1;
  function pct(k) {
    var K = window.KZ; if (!K || !K.todosFor) return null;
    var td = [], pl = [];
    try { td = K.todosFor(k) || []; } catch (e) {}
    try { var p = K.plan && K.plan(k); pl = p && p.items ? p.items : []; } catch (e) {}
    var tot = td.length + pl.length, dn = td.filter(function (t) { return t.done; }).length + pl.filter(function (x) { return x.done; }).length;
    if (!tot) { var past = 0; try { past = K.todosDoneOn ? K.todosDoneOn(k).length : 0; } catch (e) {} return past ? 100 : -1; }
    return Math.round(dn / tot * 100);
  }
  function run() {
    [].forEach.call(document.querySelectorAll('.kz-week7 > button[data-day]'), function (b) {
      var p = pct(b.getAttribute('data-day')); if (p === null) return;
      var v = p < 0 ? 'none' : p >= 100 ? 'full' : 'some', s = String(Math.max(p, 0));
      if (b.getAttribute('data-kzwr') !== v) b.setAttribute('data-kzwr', v);
      var n = b.querySelector('b'); if (n && n.style.getPropertyValue('--kzwr') !== s + '%') n.style.setProperty('--kzwr', s + '%');
    });
  }
  var q = 0; function soon() { if (!q) { q = 1; requestAnimationFrame(function () { q = 0; run(); }); } }
  function start() {
    run();
    new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) if (m[i].type === 'childList') { soon(); return; } }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', function () { setTimeout(run, 60); }, true);
    document.addEventListener('visibilitychange', run);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzinput-1104.js ==== */
;try {
/* Nov 4: the add sheet's title follows the To-do tab ("New to-do"); it kept the previous tab's title. The to-do hint drops "e.g." to match Quit's */
(function () {
  function fix(s) { if (!s.classList.contains('kzk-todo')) return; var h = s.querySelector('h2.kz-t49'); if (h && h.textContent !== 'New to-do') h.textContent = 'New to-do';
    var i = s.querySelector('input.kzta-in'); if (i && /^e\.g\. /.test(i.placeholder)) i.placeholder = i.placeholder.replace(/^e\.g\. /, ''); }
  function watch(s) { if (s.__kzin) return; s.__kzin = 1; fix(s); new MutationObserver(function () { fix(s); }).observe(s, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true, characterData: true }); }
  function scan() { [].forEach.call(document.querySelectorAll('.kz-addsheet'), watch); }
  scan(); new MutationObserver(scan).observe(document.body, { childList: true });
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzgm-1104.js ==== */
;try {
/* Nov 4 (James: "Delete is where the back would be"): in the goal menu, Delete moves up to the header, across from the
   goal's name, away from where a thumb lands to swipe the sheet away. It still asks twice, and the second tap only
   counts 0.6 s after the first, so a double tap can't delete a goal. */
(function () {
  if (window.__kzgm1104) return; window.__kzgm1104 = 1;
  function lift(m) {
    if (m.__kzgm4) return; var hd = m.querySelector('.kzgm-hd'), del = m.querySelector('.kzm-it[data-k="del"]'); if (!hd || !del) return;
    m.__kzgm4 = 1; m.classList.add('kzgm4');
    // keep the header where it is (the tile layout keys off it), just put the name in a span and Delete beside it
    if (!hd.querySelector('.kzgm4-nm')) { var nm = document.createElement('span'); nm.className = 'kzgm4-nm'; nm.textContent = hd.textContent; hd.textContent = ''; hd.appendChild(nm); }
    var grp = del.parentNode; hd.appendChild(del); del.classList.add('kzgm4-del');
    if (grp && grp !== m && !grp.querySelector('.kzm-it')) grp.classList.add('kzgm4-empty');
  }
  function run() { q = 0; [].forEach.call(document.querySelectorAll('.kzm.kzgm'), lift); }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  soon();
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kzm-it[data-k="del"]'); if (!b) return;
    if (!b.classList.contains('sure')) { b.__kzSureAt = Date.now(); return; }
    if (Date.now() - (b.__kzSureAt || 0) < 600) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzpmadd-1104.js ==== */
;try {
/* Nov 4 (James: "add as many tasks as you want" on Plan tomorrow): there was never a cap, but it felt like one.
   "Add a task" now takes every tap: the app-wide double-tap guard (kzlock, 600 ms) matched it by its data-t, so a
   quick second tap was dropped. Each tap gets its own key for that guard; Lock in my plan keeps the guard.
   The 2 / 4 / 6 / 8 / 10+ row (the old XP multiplier) is hidden in kzpmadd-1104.css. */
(function () {
  if (window.__kzpmadd) return; window.__kzpmadd = 1;
  var n = 0, held = null;
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-t="pm-add"]'); if (!b) return;
    held = b; b.setAttribute('data-t', 'pm-add-' + (++n));   // the guard keys on this, so every tap looks new to it
  }, true);
  document.addEventListener('click', function () { if (held) { held.setAttribute('data-t', 'pm-add'); held = null; } }, true);   // runs after the guard
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsb-1106.js ==== */
;try {
/* Nov 6 · copy of kzsb-1103c: the Milestones box on Progress also has the class .kzm, so opening the medals counted as an open
   sheet (tab bar hidden, page scroll locked: James got stuck). Milestones are now excluded. */
/* Nov 3 c · also tells the app to hide its own tab bar (the phone's bar is native, not this page's).
   Nov 3 b · also the add sheet (New to-do, Quit…), edit sheets and any open dialog (James's Quit screenshot).
   Nov 3 · James: the tab bar (Today / Plan / Growth / Progress / Me) sometimes showed on top of a sheet (timer, quick menu,
   goal menu) and the sheets left room for it at the bottom. While any sheet is open the bar now goes away (html.kzsb), and
   it comes back a moment after the sheet closes so it can't flash through the closing animation. Styles: kzsb-1103.css */
(function () {
  if (window.__kzsb1103) return; window.__kzsb1103 = 1;
  var de = document.documentElement, off = 0, q = 0;
  var KNOWN = '.kztm-pick.on, .kz-planmodal:not([hidden]), .kzm:not([hidden]):not(.kza .kzm):not(.kza > .kzm), .kzf-qs.on, .kzf-qs:not([hidden]) .kzf-qs-in, .kz-addsheet:not([hidden]), .kzo-sheet, [role=dialog]:not([hidden]), dialog[open]';
  function vis(x) {
    for (var e = x; e && e !== document.body; e = e.parentElement) { var c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; }
    return true;
  }
  function sheetOpen() {
    var vh = innerHeight, vw = innerWidth, k = document.querySelectorAll(KNOWN);
    for (var i = 0; i < k.length; i++) { var r = k[i].getBoundingClientRect(); if (r.height > 40 && vis(k[i])) return true; }
    var all = document.body.querySelectorAll('div, section, aside, dialog, form');
    for (var j = 0; j < all.length; j++) { var x = all[j];
      if (x.closest('.kz-tabbar')) continue;
      var r2 = x.getBoundingClientRect(); if (r2.width < vw * .9 || r2.height < vh * .22 || r2.top < vh * .12 || Math.abs(r2.bottom - vh) > 3) continue;
      var c = getComputedStyle(x); if (c.position !== 'fixed' && c.position !== 'absolute') continue;
      if ((parseInt(c.zIndex, 10) || 0) < 50) continue;
      if (vis(x)) return true; }
    return false;
  }
  // Nov 3 c · on the phone the tab bar is the app's own (native) bar: tell the app to hide it, the same message other sheets
  // send (pageScroll on:false hides the bar and holds the page still; on:true brings both back)
  var told = null;
  function post(open) { try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'pageScroll', on: !open }); } catch (e) {} }
  // James's phone still showed the bar over the timer, so while a sheet stays open the hide is repeated (harmless if it's hidden)
  var again = 0;
  function tell(open) { if (told === open) return; told = open; post(open); clearInterval(again); if (open) again = setInterval(function () { if (told === true && !document.hidden) post(true); }, 700); }
  function run() {
    q = 0; var o = sheetOpen();
    if (o) { clearTimeout(off); off = 0; if (!de.classList.contains('kzsb')) de.classList.add('kzsb'); tell(true); }
    else if (de.classList.contains('kzsb') && !off) off = setTimeout(function () { off = 0; if (!sheetOpen()) { de.classList.remove('kzsb'); tell(false); } }, 380);
  }
  function soon() { if (!q) { q = 1; requestAnimationFrame(run); } }
  function start() {
    run();
    new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) { var t = m[i].target; if (t === de) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style', 'open', 'aria-hidden'] });
    document.addEventListener('click', function () { soon(); setTimeout(soon, 120); setTimeout(soon, 400); }, true);
    addEventListener('resize', soon);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsheets-1106.js ==== */
;try {
/* Nov 6 · James picked sheet mockups: Journal C (write first), Timer B + Stopwatch C under one shared tab header,
   Goal options C (goal first). Restyles the existing sheets; every action still goes through the sheets' own buttons
   or the same saves (K.addNote, the 'journal' map) so nothing about what gets stored changes. Styles: kzsheets-1106.css */
(function () {
  var K = window.KZ; if (window.__kzsh6) return; window.__kzsh6 = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var clean = function (t) { return String(t || '').replace(/\s*NEXT\s*$/, '').trim(); };

  /* ---------- Timer B / Stopwatch C ---------- */
  var RING = '<div class="kzs6-ring" aria-hidden="true"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="104" fill="none" stroke="#2C2C2E" stroke-width="12"/>' +
    '<path d="M120 28v10M212 120h-10M120 212v-10M28 120h10" stroke="#48484A" stroke-width="2" stroke-linecap="round"/></svg><div><b>0:00</b><span>counts up</span></div></div>';
  function timer(ps) {
    var body = ps.querySelector('.kztm-body'), go = ps.querySelector('[data-kztm-go]'); if (!body || !go) return;
    if (!ps.querySelector('.kzs6-ring')) { var r = document.createElement('div'); r.className = 'kzs6-rw'; r.innerHTML = RING; body.insertBefore(r, body.firstChild); }
    var on = ps.classList.contains('kztmd-on'), d = ps.querySelector('.kztmd'), n = d ? parseInt(d.getAttribute('aria-valuenow'), 10) || 0 : 0;
    var lab = on ? (n > 0 ? 'Start ' + (n >= 60 && n % 60 === 0 ? (n / 60) + ' hr' : n + ' min') : 'Start') : 'Start';
    if (go.textContent !== lab) go.textContent = lab;
  }
  /* ---------- Journal C: write first ---------- */
  function journal(s) {
    var pane = s.querySelector('.kzf-qs-in'); if (!pane || pane.querySelector('.kzj6')) return;
    var x = pane.querySelector('[data-q="x"]'), qq = pane.querySelector('[data-q="q"]'), qa = pane.querySelector('[data-q="a"]');
    if (!x || !K || !K.addNote) return;
    var question = qa ? (qa.querySelector('span') || qa).textContent.trim() : '';
    var day = K.key ? K.key(K.today()) : new Date().toISOString().slice(0, 10);
    var ans = function () { var m = K.get('journal', {}) || {}; return m[day] || ''; };
    s.classList.add('kzj6-on');
    var w = document.createElement('div'); w.className = 'kzj6';
    w.innerHTML = '<div class="kzj6-top"><button type="button" data-j6="x">Cancel</button><span>Journal</span><button type="button" data-j6="save" disabled>Save</button></div>' +
      '<div class="kzj6-chips" role="tablist" aria-label="What to add">' +
      '<button type="button" role="tab" data-j6m="note" aria-selected="true">Note</button>' +
      (qa ? '<button type="button" role="tab" data-j6m="ask" aria-selected="false">Question</button>' : '') +
      (qq ? '<button type="button" data-j6m="quote">Quote</button>' : '') + '</div>' +
      '<p class="kzj6-q" hidden>' + esc(question) + '</p>' +
      '<label class="kzj6-sr" for="kzj6-ta">Journal entry</label><textarea id="kzj6-ta" class="kzj6-ta" rows="6" maxlength="2000" placeholder="What’s on your mind?"></textarea>' +
      '<p class="kzj6-msg" aria-live="polite">Saved to Journal → Notes. Private to you.</p>';
    pane.insertBefore(w, pane.firstChild);
    var ta = w.querySelector('textarea'), save = w.querySelector('[data-j6="save"]'), msg = w.querySelector('.kzj6-msg'), qp = w.querySelector('.kzj6-q'), mode = 'note';
    function setMode(m) {
      mode = m; [].forEach.call(w.querySelectorAll('[data-j6m]'), function (b) { if (b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', String(b.getAttribute('data-j6m') === m)); });
      qp.hidden = m !== 'ask'; ta.placeholder = m === 'ask' ? 'Anything on your mind.' : 'What’s on your mind?';
      if (m === 'ask') { ta.value = ans(); msg.textContent = ans() ? 'Saved. You can change it any time today.' : 'Saved to Journal → Reflections. Private to you.'; }
      else { if (ta.value === ans()) ta.value = ''; msg.textContent = 'Saved to Journal → Notes. Private to you.'; }
      upd();
    }
    function upd() { var v = ta.value.trim(); save.disabled = !v || (mode === 'ask' && v === ans()); }
    ta.addEventListener('input', upd);
    w.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      var m = b.getAttribute('data-j6m');
      if (m === 'quote') { qq.click(); return; }
      if (m) { setMode(m); return; }
      if (b.getAttribute('data-j6') === 'x') { x.click(); return; }
      if (b.getAttribute('data-j6') === 'save') {
        var v = ta.value.trim(); if (!v) return;
        try {
          if (mode === 'ask') { var mm = K.get('journal', {}) || {}; mm[day] = v; K.set('journal', mm); try { K.track('kz_reflection_saved', { length: v.length }); } catch (er) {} }
          else K.addNote(v);
          ['kz:changed', 'kz:notes'].forEach(function (n) { document.dispatchEvent(new CustomEvent(n)); });
          post({ type: 'dirty' }); post({ type: 'haptic', n: 2 });
          save.disabled = true; save.textContent = 'Saved'; msg.textContent = mode === 'ask' ? 'Saved to your journal.' : 'Saved to Journal → Notes.';
          setTimeout(function () { x.click(); }, 700);
        } catch (er) { msg.textContent = 'Couldn’t save. Try again.'; }
      }
    });
  }
  /* ---------- Goal options C: goal first ---------- */
  var ICON = { up: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>' };
  function goalInfo(name) {
    try { var gs = (K.allGoals ? K.allGoals() : K.goals ? K.goals() : []) || [], g = gs.filter(function (x) { return x && !x.archived && clean(x.title || x.name) === name; })[0]; if (!g) return '';
      var bits = []; if (g.due) { var dd = Math.round((new Date(g.due + 'T12:00') - new Date(K.key(K.today()) + 'T12:00')) / 864e5); if (!isNaN(dd)) bits.push(dd > 1 ? dd + ' days left' : dd === 1 ? 'Due tomorrow' : dd === 0 ? 'Due today' : 'Past due'); }
      var tk = K.key(K.today()), done = (K.get('done', {}) || {})[g.id]; bits.push(done && done[tk] ? 'Worked on today' : 'Not yet today'); return bits.join(' · ');
    } catch (e) { return ''; } }
  /* No nodes are moved (the menu's own code rebuilds its groups): the order and the layout are CSS (kzsheets-1106.css),
     here only labels and the info line. */
  function goal(m) {
    if (!m.querySelector('[data-k="view"]') || !m.querySelector('[data-k="del"]') || !m.classList.contains('kzgm')) return;
    if (!m.classList.contains('kzg6')) m.classList.add('kzg6');
    var nm = m.querySelector('.kzgm4-nm') || m.querySelector('.kzgm-hd');
    if (nm && !nm.querySelector('*')) { var c = clean(nm.textContent); if (nm.textContent !== c) nm.textContent = c;
      var info = goalInfo(c); if (nm.getAttribute('data-kzg6i') !== info) nm.setAttribute('data-kzg6i', info); }
    var al = m.getAttribute('aria-label') || '', al2 = 'Actions for ' + clean(al.replace(/^Actions for\s+/, '')); if (al !== al2) m.setAttribute('aria-label', al2);
    var v = m.querySelector('[data-k="view"] > span'); if (v && v.textContent !== 'View goal') v.textContent = 'View goal';
    var w = m.querySelector('[data-k="won"] > span'); if (w && w.textContent !== 'Achieved') w.textContent = 'Achieved';
    ['up', 'down'].forEach(function (k) { var b = m.querySelector('[data-k="' + k + '"]'), l = k === 'up' ? 'Move up' : 'Move down'; if (b && b.getAttribute('aria-label') !== l) b.setAttribute('aria-label', l); });
  }
  function run() {
    q = 0;
    [].forEach.call(document.querySelectorAll('.kztm-pick.on .kztm-ps'), timer);
    [].forEach.call(document.querySelectorAll('.kzf-qs'), journal);
    [].forEach.call(document.querySelectorAll('.kzm.kzs.kzgm'), goal);
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { requestAnimationFrame(run); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzj6, .kzs6-rw')) continue; soon(); return; } })
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-valuenow'] });
  document.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('.kztm-ps')) soon(); }, true);
  soon();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
