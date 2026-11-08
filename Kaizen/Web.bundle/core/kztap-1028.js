/* Oct 28 (kztap-1028, replaces kztap-1027): every pop-up hides the tab bar, Today's notes sheet included; a pop-up that
   opens over another re-sends the hide; showing a screen again re-sends its current state.
   Oct 27 (kztap-1027, replaces kztap-1025s): leaves/undo chip/toasts no longer re-run the overlay check; the leaf observer only works while a float exists.
   Oct 25 s (from p): the overlay check no longer runs a page-wide search after every class change (tapping a check
   toggles dozens of classes; that search was most of the delay when tapping a box quickly on and off). It runs only
   when something was added to / removed from the page, or an element that can be an overlay changed.
   Oct 25 p · Every button: the right thing on top, one scroll lock, no stuck states (James: "it only lets me add a habit
   after I exit out of that screen").
   1. Overlay manager. Every sheet, menu, full-screen moment and confirm in the app is watched here. Whatever opened last is
      on top (z-index by open order, not by whichever number each file picked). While anything is open the page behind
      can't scroll; when the last one closes the page scrolls again and the tab bar comes back. Escape closes the top one.
   2. Buttons do things, links go places. A link to "add a goal" pressed inside an overlay (the Kaizen 66 picker's "Add a
      daily habit", the Change goal sheet's "Add a goal") no longer opens the add sheet *underneath*: the overlay closes, the
      add sheet opens straight away with Daily habit picked, and after you save you're back in the Kaizen 66 picker with
      the new habit selected.
   Old files aren't edited; this file wraps them. */
(function () {
  var K = window.KZ; if (!K || K.__kztap) return; K.__kztap = 's';   // 1027: same guard (replaces kztap-1025s on every page)
  var de = document.documentElement;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  // what counts as an overlay, and how to close each one
  var OV = [
    { sel: '.kz66-over.on', close: '[data-k66="close"]' },
    { sel: '.kzsw-back.on', close: '[data-sw="close"], [data-cv="later"]' },
    { sel: '.kzm-back', close: null },
    { sel: '.kz-sheet49:not([hidden])', close: '[data-gx="close"], [data-t="close"], .kz-iconbtn[aria-label="Close"]' },
    { sel: '.kzg-over', close: '[data-kzg-done]' },
    { sel: '.kzg-why', close: '[data-kzg-x]' },
    { sel: '.kz-qmodal:not([hidden])', close: '.kz-iconbtn[aria-label="Close"]' },
    { sel: '.kzf-qsheet.on, .kzf-qs', close: '[data-q="close"], .kzf-qx, .kzf-qs-x' },   // Oct 28: Today's notes sheet has no .on class (it never hid the tab bar there)
    { sel: 'body > .kz-p3, body > .kz-p4, body > .kz-setup, #kz-reveal:not([hidden])', close: null }
  ];
  var ALL = OV.map(function (o) { return o.sel; }).join(',');
  var seq = 0, open = [], locked = false;
  function visible(el) { if (!el || !el.isConnected) return false; var cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden'; }
  function scan() {
    var now = Array.prototype.filter.call(document.querySelectorAll(ALL), function (el) { return el !== de && el !== document.body && visible(el); });  // html/body carry mode classes like kz-p4: never overlays
    var grew = false;
    now.forEach(function (el) { if (open.indexOf(el) < 0) { open.push(el); grew = true; el.__kzz = ++seq; el.style.setProperty('z-index', String(9000 + Math.min(seq, 900)), 'important'); } });
    open = open.filter(function (el) { return now.indexOf(el) >= 0; });
    var any = open.length > 0;
    if (any !== locked) {
      locked = any; de.classList.toggle('kz-layer-open', any);
      if (!any) { document.body.classList.remove('kz-noscroll'); post({ type: 'pageScroll', on: true }); }
      else post({ type: 'pageScroll', on: false });
    } else if (any && grew) post({ type: 'pageScroll', on: false });   // Oct 28: every new pop-up re-asks the app to hide the tab bar (one opened over another never did)
  }
  function top() { return open.slice().sort(function (a, b) { return (b.__kzz || 0) - (a.__kzz || 0); })[0] || null; }
  function closeEl(el) {
    if (!el) return false;
    for (var i = 0; i < OV.length; i++) {
      if (!el.matches(OV[i].sel)) continue;
      var c = OV[i].close && el.querySelector(OV[i].close);
      if (c) { c.click(); return true; }
      if (el.classList.contains('kzm-back')) { el.click(); return true; }
      el.click(); return true;   // the backdrop closes most of them
    }
    return false;
  }
  K.layer = { top: top, close: function () { return closeEl(top()); }, closeAll: function () { var n = 0; while (open.length && n++ < 6) { if (!closeEl(top())) break; scan(); } } };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open.length) { e.preventDefault(); closeEl(top()); } });

  // ---------- 2 · "add a habit" from inside an overlay ----------
  var backToK66 = 0;
  function openAddDaily() {
    if (document.getElementById('kz-today-s1') && K.openAdd) K.openAdd({ kind: 'daily' });
    else if (K.goalSheet && K.goalSheet.open) K.goalSheet.open({ mode: 'add', kind: 'daily' });
    else location.href = '/pages/my-goals#add';
  }
  // on window, capture: runs before kzgs-1023d's own #add link handler (document, capture), which opened the sheet underneath
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="my-goals#add"]'); if (!a) return;
    var ov = a.closest(ALL); if (!ov) return;
    e.preventDefault(); e.stopImmediatePropagation();
    backToK66 = ov.matches('.kz66-over, .kzsw-back') ? Date.now() : 0;
    post({ type: 'tick' });
    // outside this click's dispatch: close the overlay first, then open the add sheet on top of the page
    setTimeout(function () { closeEl(ov); setTimeout(function () { scan(); openAddDaily(); }, 90); }, 0);
  }, true);
  function wrapAdd() {
    if (!K.addGoal || K.addGoal.__tap) return;
    var add = K.addGoal, w = function (o) {
      var id = add.apply(this, arguments);
      if (backToK66 && Date.now() - backToK66 < 180000 && o && o.kind === 'daily') {
        backToK66 = 0;
        setTimeout(function () {
          scan(); if (open.length) K.layer.closeAll();
          var b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute('data-k66-open', id); document.body.appendChild(b); b.click(); b.remove();
        }, 320);
      }
      return id;
    }; w.__tap = 1; K.addGoal = w;
  }

  // ---------- 3 · no retired words in the little feedback after a tap ----------
  // The check-off float said "+0.3 in · Your tree grew" and some toasts said "+10 XP": inches and XP are gone.
  var RETIRED = /\b\d+\s*XP\b|\bXP\b|\bwater\b|\binch(es)?\b|\d\s*in\s*·/i;
  function wrapToast(fn) { if (!fn || fn.__tap) return fn; var w = function (m) { if (RETIRED.test(String(m))) return; return fn.apply(this, arguments); }; w.__tap = 1; return w; }
  (function () { var cur = wrapToast(K.toast); try { Object.defineProperty(K, 'toast', { configurable: true, enumerable: true, get: function () { return cur; }, set: function (v) { cur = wrapToast(v); } }); } catch (e) {} })();
  function floats() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-gfloat'), function (f) {
      var t = f.textContent || ''; if (!t || !RETIRED.test(t)) return;
      var nt = /grew|grown|\bin\b/i.test(t) ? '+1 day grown' : ''; if (f.textContent !== nt) f.textContent = nt;
    });
  }

  // ---------- 4 · an Add button with nothing typed: say so instead of doing nothing ----------
  document.addEventListener('click', function (e) {
    var go = e.target.closest && e.target.closest('.kz-qadd-go'); if (!go) return;
    var f = go.closest('form'), inp = f && f.querySelector('input[data-p="qtxt"], input[type="text"], input:not([type])');
    if (inp && !inp.value.trim()) { e.preventDefault(); inp.focus(); f.classList.remove('kzt-shake'); void f.offsetWidth; f.classList.add('kzt-shake'); post({ type: 'tick' }); }
  }, true);

  // ---------- 5 · update a list in place: only rows that changed are replaced (no whole-list redraw after a tap) ----------
  K.morphList = function (el, html) {
    if (!el) return;
    var t = document.createElement('template'); t.innerHTML = html;   // goes through the safety net (kzsafe)
    var next = Array.prototype.slice.call(t.content.children), cur = Array.prototype.slice.call(el.children);
    var key = function (n) { return n.getAttribute && (n.getAttribute('data-goal') || n.getAttribute('data-id') || n.getAttribute('data-todo')) || ''; };
    if (next.length !== cur.length || next.some(function (n, i) { return key(n) !== key(cur[i]); })) { el.innerHTML = html; return; }
    next.forEach(function (n, i) { if (n.outerHTML !== cur[i].outerHTML) el.replaceChild(n, cur[i]); });
  };

  // ---------- 6 · speed: K.k66.state() and K.grow(id) are computed once per data change, not once per tree/row ----------
  // (the Grove with 400 goals called them thousands of times per paint). The cache key changes on every storage write,
  // on a storage event from another tab, and at midnight, so a stale answer is never served.
  var ext = 0; window.addEventListener('storage', function () { ext++; });
  function ver() { return (K._rover ? K._rover() : Date.now()) + ':' + ext + ':' + K.key(K.today()); }
  function memoState() {
    if (!K.k66 || !K.k66.state || K.k66.state.__memo) return;
    var f = K.k66.state, v = null, val = null, w = function () { var x = ver(); if (x !== v) { v = x; val = f.apply(this, arguments); } return val; }; w.__memo = 1; K.k66.state = w;
  }
  function wrapGrowMemo(fn) {
    if (!fn || fn.__memo) return fn;
    var v = null, m = {}, w = function (gid) { var x = ver(); if (x !== v) { v = x; m = {}; } if (!(gid in m)) m[gid] = fn.apply(this, arguments); var r = m[gid]; return r && typeof r === 'object' ? Object.assign({}, r) : r; };
    w.__memo = 1; return w;
  }
  // chains onto any wrapper already on K.grow (kzbd's milestone growth), whichever file sets K.grow later
  (function () {
    var prev = Object.getOwnPropertyDescriptor(K, 'grow'), raw = prev && !prev.get ? prev.value : undefined, lastF = null, memoF = null;
    var getF = function () { return prev && prev.get ? prev.get.call(K) : raw; };
    try { Object.defineProperty(K, 'grow', { configurable: true, enumerable: true,
      get: function () { var f = getF(); if (f !== lastF) { lastF = f; memoF = wrapGrowMemo(f); } return memoF; },
      set: function (v) { if (prev && prev.set) prev.set.call(K, v); else raw = v; } }); } catch (e) {}
  })();

  // ---------- watch ----------
  // the stacking is fixed in the same microtask the overlay appears in (before the next frame is painted)
  var OVQ = /kz66-over|kzsw-back|kzm-back|kz-sheet49|kzg-over|kzg-why|kz-qmodal|kzf-qsheet|kzf-qs\b|kz-p3|kz-p4|kz-setup|kz-reveal|kzn-sheet/;
  function relevant(muts) {
    if (!muts) return true;
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'childList') {   // 1027: falling leaves, the undo chip and toasts added to <body> on every check-off are not overlays
        var ov = function (n) { return n.nodeType === 1 && (OVQ.test(typeof n.className === 'string' ? n.className : '') || n.id === 'kz-reveal' || open.indexOf(n) >= 0 || (n.querySelector && n.querySelector('.kz-sheet49, .kz66-over, .kzsw-back, .kzm-back'))); };
        if (Array.prototype.some.call(m.addedNodes, ov) || Array.prototype.some.call(m.removedNodes, ov)) return true; continue; }
      var t = m.target; if (t === de || t === document.body) continue;
      if (OVQ.test(typeof t.className === 'string' ? t.className : '') || t.id === 'kz-reveal' || open.indexOf(t) >= 0) return true;
    }
    return false;
  }
  // Oct 27 (1027): the overlay check ran synchronously inside the observer, once per batch of changes, and it reads styles
  // (getComputedStyle), so a check-off on Today (hundreds of small changes while the row glides) forced the browser to
  // recompute the page's styles over and over: ~0.45 s of observer work and ~0.6 s of style work per tap on a slow phone.
  // Now every change only marks "look again" and the check runs once, in the next frame, still before that frame is
  // painted, so a sheet is stacked before you ever see it. The cheap list check (relevant) also only runs until a scan is due.
  // (revised) An overlay that really appeared or changed is still stacked at once, in the same moment it appears. What
  // changed is that the falling leaves, the undo chip and toasts no longer count as overlay changes (see relevant()),
  // and they were the changes that kept re-running this check during a check-off.
  var q = 0; function soon(muts) { if (!relevant(muts)) { if (!q) q = requestAnimationFrame(function () { q = 0; try { wrapAdd(); memoState(); floats(); } catch (e) {} }); return; } try { scan(); } catch (e) {} if (q) return; q = requestAnimationFrame(function () { q = 0; try { wrapAdd(); memoState(); scan(); floats(); } catch (e) {} }); }
  function boot() { wrapAdd(); memoState(); scan(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'hidden', 'style'] }); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] }); new MutationObserver(function (muts) { if (!document.querySelector('.kz-gfloat')) return; for (var i = 0; i < muts.length; i++) { var m = muts[i], t = m.target.nodeType === 1 ? m.target : m.target.parentElement; if ((t && t.closest && t.closest('.kz-gfloat')) || Array.prototype.some.call(m.addedNodes || [], function (n) { return n.nodeType === 1 && (n.classList.contains('kz-gfloat') || (n.querySelector && n.querySelector('.kz-gfloat'))); })) { floats(); return; } } }).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('visibilitychange', function () { if (!document.hidden && locked) post({ type: 'pageScroll', on: false }); });
})();
