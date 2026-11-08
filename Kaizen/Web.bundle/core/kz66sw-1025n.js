/* Oct 25 n · Change your Kaizen 66 goal (James). Only daily habits can be the Kaizen 66 goal (Oct 25 o).
   Switching always asks first ("Reset to day 0?") and then starts the new goal from zero: Day 1 is today if it's already
   checked off today, otherwise tomorrow (kz66's own start rules). The old run is kept in history as switched; every tree
   keeps all the days it has grown. Entry points: "Change goal" on Today's Kaizen 66 card, "Make this my Kaizen 66" on
   another goal's page, and the same row in the goal menu (kzmenu-1025n). Data stays kz_k66 (kz66-1024f). */
(function () {
  var K = window.KZ; if (!K || K.__kz66sw) return; K.__kz66sw = 1;
  var de = document.documentElement;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0] || null; }
  function run() { try { var s = K.k66 && K.k66.state(), r = s && s.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  function kindName(g) { return g.kind === 'long' ? 'Long-term goal' : g.kind === 'todo' ? 'One-time goal' : 'Daily habit'; }
  function thumb(g) { try { var w = K.grow(g.id); return K.groveImg(w.sp, w.key); } catch (e) { return ''; } }
  function fire() { ['kz:k66', 'kz:changed'].forEach(function (n) { try { document.dispatchEvent(new CustomEvent(n)); } catch (e) {} }); }

  // end the current run (kept in history as switched) and start the new goal from zero
  function switchTo(id) {
    attach(); if (!goal(id) || !K.k66) return false;
    var s = K.get('k66', null); if (!s || typeof s !== 'object') s = {}; s.runs = s.runs || []; s.seen = s.seen || {};
    var r = run();
    if (s.run) { s.runs.push({ goal: s.run.goal, start: s.run.start, end: K.key(K.today()), days: r ? (r.todayDone ? r.day : Math.max(0, (r.day || 1) - 1)) : 0, shields: r ? (r.used || 0) : 0, won: 0, quit: 1, switched: id }); }
    s.run = null; s.pending = null; K.set('k66', s);
    K.k66.start(id);
    post({ type: 'haptic', n: 2 }); fire();
    return true;
  }

  // ---------- the sheet ----------
  var layer = null, from = null;
  function close() {
    if (!layer) return; var l = layer; layer = null; l.classList.remove('on'); de.classList.remove('kzsw-open');
    post({ type: 'pageScroll', on: true }); setTimeout(function () { l.remove(); }, 280);
    if (from && from.focus) try { from.focus({ preventScroll: true }); } catch (e) {}
  }
  function open(html) {
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'kzsw-back'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true');
      layer.addEventListener('click', onClick); document.body.appendChild(layer);
      post({ type: 'pageScroll', on: false }); de.classList.add('kzsw-open');
      requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
    }
    layer.innerHTML = '<div class="kzsw"><i class="kzsw-grab" aria-hidden="true"></i>' + html + '</div>';
    var f = layer.querySelector('[data-sw-focus]') || layer.querySelector('button'); if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function pickStep() {
    var r = run(), cur = r && goal(r.goal), list = goals().filter(function (g) { return (!cur || g.id !== cur.id) && g.kind === 'daily'; });  // Oct 25 o: Kaizen 66 is for daily habits
    if (!list.length) { open('<h2 class="kzsw-t">No other daily habits yet</h2><p class="kzsw-p">Kaizen 66 is for daily habits. Add one, like "Read 10 pages", then you can make it your Kaizen 66.</p><div class="kzsw-acts"><a class="kzsw-btn gold" href="/pages/my-goals#add">Add a goal</a><button type="button" class="kzsw-btn ghost" data-sw="close">Close</button></div>'); return; }
    open('<h2 class="kzsw-t" id="kzsw-t">Change your Kaizen 66</h2>' +
      '<p class="kzsw-p">Pick the daily habit you\'ll do every day for 66 days.</p>' +
      (cur ? '<p class="kzsw-now">Now: <b>' + esc(cur.name) + '</b> · ' + (r.state === 'pending' ? 'starts soon' : 'day ' + r.day + ' of 66') + '</p>' : '') +
      '<div class="kzsw-list" role="list">' + list.map(function (g) {
        var t = thumb(g);
        return '<button type="button" class="kzsw-g" role="listitem" data-sw-pick="' + esc(g.id) + '"><span class="kzsw-gt">' + (t ? '<img src="' + esc(t) + '" alt="">' : '') + '</span><span class="kzsw-gb"><b>' + esc(g.name) + '</b><em>' + kindName(g) + '</em></span><i class="kzsw-chev" aria-hidden="true">›</i></button>';
      }).join('') + '</div>' +
      '<div class="kzsw-acts"><button type="button" class="kzsw-btn ghost" data-sw="close">Cancel</button></div>');
    layer.setAttribute('aria-labelledby', 'kzsw-t');
  }
  function sureStep(id) {
    var g = goal(id); if (!g) return pickStep();
    var r = run(), cur = r && goal(r.goal);
    var today = (function () { try { var d = K.get('done', {}) || {}; return !!(d[id] && d[id][K.key(K.today())]); } catch (e) { return false; } })();
    var day1 = today ? 'Day 1 is today, because you already checked it off.' : 'Day 1 is tomorrow.';
    open('<div class="kzsw-warn" aria-hidden="true">!</div><h2 class="kzsw-t" id="kzsw-t">Reset Kaizen 66 to day 0?</h2>' +
      (cur ? '<p class="kzsw-p">You\'re on <b>' + (r.state === 'pending' ? 'day 0' : 'day ' + r.day + ' of 66') + '</b> with <b>' + esc(cur.name) + '</b>. Switching to <b>' + esc(g.name) + '</b> starts your 66 days over from zero.</p>'
        : '<p class="kzsw-p"><b>' + esc(g.name) + '</b> becomes your Kaizen 66.</p>') +
      '<p class="kzsw-p dim">' + day1 + ' Your trees keep every day they\'ve grown.</p>' +
      '<div class="kzsw-acts"><button type="button" class="kzsw-btn red" data-sw-go="' + esc(id) + '">Reset and switch</button>' +
      '<button type="button" class="kzsw-btn ghost" data-sw="close" data-sw-focus>' + (cur ? 'Keep ' + esc(cur.name) : 'Cancel') + '</button></div>');
    layer.setAttribute('aria-labelledby', 'kzsw-t');
  }
  function onClick(e) {
    if (e.target === layer) { close(); return; }
    var b = e.target.closest('[data-sw], [data-sw-pick], [data-sw-go]'); if (!b) return;
    if (b.getAttribute('data-sw') === 'close') { close(); return; }
    if (b.hasAttribute('data-sw-pick')) { post({ type: 'tick' }); sureStep(b.getAttribute('data-sw-pick')); return; }
    if (b.hasAttribute('data-sw-go')) { var id = b.getAttribute('data-sw-go'); close(); setTimeout(function () { switchTo(id); if (K.toast) { var g = goal(id); K.toast(g ? g.name + ' is your Kaizen 66' : 'Switched'); } }, 120); }
  }
  document.addEventListener('keydown', function (e) { if (layer && e.key === 'Escape') close(); });
  function ask(toId) { from = document.activeElement; if (toId && goal(toId) && goal(toId).kind !== 'daily') { if (K.toast) K.toast('Kaizen 66 is for daily habits'); return; } if (toId && run() && run().goal === toId) return; if (toId) sureStep(toId); else pickStep(); }
  function attach() { if (K.k66 && !K.k66.askSwitch) { K.k66.switchTo = switchTo; K.k66.askSwitch = ask; } }  // kz66 loads after this file on some pages
  attach();

  // ---------- entry points ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-k66-switch]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); ask(b.getAttribute('data-k66-switch') || null);
  }, true);
  function inject() {
    attach();
    // Today: "Change goal" next to "Open goal" on the Kaizen 66 card
    var more = document.querySelector('#kz-today-s1 .kzf-more, .kzf-more');
    if (more && !more.querySelector('.kzsw-chg')) {
      var link = more.querySelector('.kzf-link'), row = document.createElement('div'); row.className = 'kzsw-row';
      var c = document.createElement('button'); c.type = 'button'; c.className = 'kzsw-chg'; c.setAttribute('data-k66-switch', ''); c.textContent = 'Change goal';
      if (link) { link.parentNode.insertBefore(row, link); row.appendChild(link); row.appendChild(c); } else more.appendChild(c);
    }
    // a goal's page while another goal has the run
    var gp = document.querySelector('.kz66-gp'), id = new URLSearchParams(location.search).get('id'), r = run();
    if (gp && id && r && r.goal !== id && goal(id) && goal(id).kind === 'daily' && !gp.querySelector('.kzsw-make')) {
      var m = document.createElement('button'); m.type = 'button'; m.className = 'kz66-go kzsw-make'; m.setAttribute('data-k66-switch', id); m.textContent = 'Make this my Kaizen 66';
      gp.appendChild(m);
    }
  }
  var q = 0; function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { inject(); } catch (e) {} }); }
  function boot() { attach(); inject(); var m = document.getElementById('kz-main') || document.body; new MutationObserver(soon).observe(m, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kz:k66', 'kz:changed', 'kz:goals'].forEach(function (n) { document.addEventListener(n, soon); });
})();
