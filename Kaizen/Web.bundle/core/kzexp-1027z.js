/* Oct 27 z (from 1027y): the text lines in an opened goal become visuals (James: "take away the bland text, satisfying visuals"):
   ring to day 66, streak tile, days-done tile, last 14 days as dots; the green stat line and the grey "days grown" line are gone.
   Was: Oct 27 y · Opening / closing a goal (James: "they bounce around and get distorted", "show a preview of your growth").
   - The panel (.kz-gx from 871e) now unfolds and folds as one clipped box (0.32 s, no overshoot). Everything below moves
     with it in layout; no transforms on other rows. While it moves, K.spring (kzfocus-1025m's FLIP springs, which made
     the rows bounce and overlap) finishes instantly, the same trick the check-off glide uses.
   - Closing: the tap is taken here, the panel folds, then K.collapseGoals() (871e) closes it for real.
   - Growth preview at the top of the panel: this goal's tree now -> its next stage (faded), the stage name, days to the
     next stage and a gold bar. Uses K.grow (kzgrove-1025m) and the same tree art. Replaces the "Day N of ~66" card
     (its number is in the preview). Styles: kzexp-1027z.css */
(function () {
  var K = window.KZ; if (!K || K.__kzexp) return; K.__kzexp = 1;
  var FL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 3.2 4.8 5.6 4.8 10.4A4.8 4.8 0 0 1 12 17.7a4.8 4.8 0 0 1-4.8-4.8c0-2 .9-3.3 1.9-4.4.2 1.5.9 2.4 1.9 2.8-.3-3.3.9-6.4 1-8.8z"/></svg>';
  function ring(n) { var p = Math.min(1, n / 66), R = 21, L = 2 * Math.PI * R; return '<svg class="kzgv-ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="' + R + '" class="t"/><circle cx="26" cy="26" r="' + R + '" class="f" stroke-dasharray="' + (L * p).toFixed(1) + ' ' + L.toFixed(1) + '" transform="rotate(-90 26 26)"/></svg>'; }
  function days14(gid) { var d = ((K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {})[gid] || {}, t = K.today(), h = ''; for (var i = 13; i >= 0; i--) { var k = K.key(K.addDays(t, -i)); h += '<i class="' + (d[k] ? 'on' : '') + (i === 0 ? ' today' : '') + '"></i>'; } return h; }
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ART = (window.KZ_ART || '/art/') + 'trees/', EASE = 'cubic-bezier(.25,.1,.25,1)', DUR = 320;
  var MSKEY = { 'Planted': 'seed', 'Sprout': 'sd2', 'Seedling': 'sd4', 'Sapling': 's1', 'Young tree': 's3', 'Tree': 's4', 'Habit earned': 's5', 'Full tree': 's5', 'Mature tree': 's6' };
  function img(sp, key) { return /^(seed|sd\d)$/.test(key) ? ART + sp + '/' + key + '_v2.webp' : ART + sp + '/' + key + '_full_sm.webp'; }
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };

  // springs finish at once while a panel moves
  var quietUntil = 0;
  function quiet(ms) {
    quietUntil = Date.now() + ms;
    if (!K.spring || K.spring.__kzexp) return;
    var o = K.spring, w = function (key, from, to, apply, preset, end) {
      if (Date.now() < quietUntil) { try { apply(to); } catch (e) {} try { if (end) end(); } catch (e) {} return { v: 0, x: to, to: to }; }
      return o.apply(this, arguments);
    }; w.__kzexp = 1; w.__kzsk = o.__kzsk; K.spring = w;
  }

  function preview(gid) {
    if (!K.grow) return '';
    var w; try { w = K.grow(gid); } catch (e) { return ''; }
    var nxKey = w.next && MSKEY[w.next.name], prevAt = 0;
    var nm = w.day >= 66 ? 'Habit earned' : w.stage, left = w.next ? w.next.left : 0;
    // progress inside the current stage
    var steps = [0, 3, 7, 14, 30, 45, 66, 100, 180, 365, 730];
    for (var i = 0; i < steps.length; i++) if (w.day >= steps[i]) prevAt = steps[i];
    var frac = w.next ? Math.max(0.03, Math.min(1, (w.day - prevAt) / Math.max(1, w.next.at - prevAt))) : 1;
    return '<div class="kzgp" aria-label="Your growth">' +
      '<div class="kzgp-art"><img class="now" src="' + img(w.sp, w.key) + '" alt="' + esc(nm) + ' now">' +
      (nxKey ? '<svg class="kzgp-to" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg><img class="next" src="' + img(w.sp, nxKey) + '" alt="' + esc(w.next.name) + ' next">' : '') + '</div>' +
      '<div class="kzgp-txt"><b>' + esc(nm) + '</b>' +
      (w.next ? '<em>' + esc(w.next.name) + ' in ' + left + (left === 1 ? ' day' : ' days') + '</em>' : '') +
      '<i class="kzgp-bar"><i style="width:' + Math.round(frac * 100) + '%"></i></i></div></div>' + stats(gid, w.day);
  }
  function stats(gid, grown) {
    var g = (K.goals() || []).filter(function (q) { return q.id === gid; })[0], st = { done: grown, streak: 0 };
    try { if (g && K.goalStats) st = K.goalStats(g); } catch (e) {}
    var n = Math.min(66, st.done);
    return '<div class="kzgv" aria-label="' + st.done + ' days done, ' + st.streak + '-day streak">' +
      '<div class="kzgv-t kzgv-66">' + ring(st.done) + '<span class="kzgv-in"><b>' + n + '</b><small>/66</small></span><em>to a habit</em></div>' +
      '<div class="kzgv-t kzgv-st' + (st.streak ? ' hot' : '') + '">' + FL + '<b>' + st.streak + '</b><em>day streak</em></div>' +
      '<div class="kzgv-t"><b class="big">' + st.done + '</b><em>' + (st.done === 1 ? 'day done' : 'days done') + '</em></div>' +
      '</div><div class="kzgv-14" aria-label="Last 14 days">' + days14(gid) + '</div>';
  }
  function dress(x) {
    if (x.__kzexp) return; x.__kzexp = 1;
    var row = x.closest('.kz-grow'), gid = row && row.getAttribute('data-goal'); if (!gid) return;
    var h = preview(gid); if (!h) return;
    var st = x.querySelector('.kz-gxstats'); if (st) st.insertAdjacentHTML('afterend', h); else x.insertAdjacentHTML('afterbegin', h);
    x.classList.add('kzgp-on', 'kzgv-on');
  }
  function unfold(x) {
    if (calm || !x.animate) return;
    quiet(DUR + 500);
    var h = x.offsetHeight; x.style.overflow = 'hidden';
    var a = x.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: DUR, easing: EASE });
    a.onfinish = a.oncancel = function () { x.style.overflow = ''; };
  }
  function fold(x, then) {
    if (calm || !x.animate) { then(); return; }
    quiet(DUR + 500);
    var h = x.offsetHeight; x.style.overflow = 'hidden';
    var a = x.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: Math.round(DUR * .85), easing: EASE, fill: 'forwards' });
    a.onfinish = function () { then(); };
  }

  // panels appear: dress + unfold (before the first paint: the observer runs in the same task)
  new MutationObserver(function (ms) {
    ms.forEach(function (r) { [].forEach.call(r.addedNodes, function (n) {
      if (n.nodeType !== 1) return;
      var xs = n.classList.contains('kz-gx') ? [n] : [].slice.call(n.querySelectorAll ? n.querySelectorAll('.kz-gx') : []);
      xs.forEach(function (x) { var fresh = !x.__kzexp; dress(x); if (fresh && n === x && tapping) unfold(x); });
    }); });
  }).observe(document.body, { childList: true, subtree: true });
  [].forEach.call(document.querySelectorAll('.kz-gx'), dress);   // a row already open on load

  // the tap that opens or closes a panel (same targets as 871e)
  var tapping = false, folding = false;
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var x = t.closest('[data-kz-expand]'), chev = t.closest('.kz-gchev');
    if (!x || x.closest('[data-no-expand]')) return;
    if (t.closest('a,textarea,input') || (t.closest('button') && !chev)) return;
    var row = x.closest('.kz-grow'); if (!row) return;
    quiet(DUR + 600);   // fold/unfold of a long-term card too: no springs
    var g = (K.goals() || []).filter(function (q) { return q.id === row.getAttribute('data-goal'); })[0];
    var opensPanel = !(g && g.kind !== 'daily') || chev;
    if (!opensPanel) return;
    if (row.classList.contains('open')) {   // closing: fold first, then let 871e close it
      e.stopImmediatePropagation(); e.preventDefault();
      if (folding) return; folding = true;
      var gx = row.querySelector('.kz-gx');
      if (!gx) { folding = false; K.collapseGoals(); return; }
      fold(gx, function () { folding = false; K.collapseGoals(); try { K.track('kz_goal_collapse'); } catch (er) {} });
      return;
    }
    tapping = true; setTimeout(function () { tapping = false; }, 0);
  }, true);
})();
