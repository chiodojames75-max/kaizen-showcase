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
