/* Oct 26 (g, from 1025ze): Education and Fitness lists; any branch matched by name. Oct 25 s · Add sheet (Today's and the Goals sheet), James:
   1. Quick picks for Long-term and Daily habit are tappable chips under the name box, like Quit's (the big one-at-a-time
      carousel is hidden, its code is untouched). Chips follow the chosen branch; tap one to fill the name.
   2. "Make this my Kaizen 66" checkbox for a new daily habit or Quit. With no run it starts on save. With a run going,
      saving shows the usual "Reset Kaizen 66 to day 0?" question first (nothing resets without that yes). */
(function () {
  var K = window.KZ; if (!K || K.__kzpick) return; K.__kzpick = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var DAILY = {
    health: ['Drink 3 bottles of water', 'Walk 10k steps', 'Work out', 'Stretch 10 minutes', 'In bed by 11', 'No sugar', 'Eat a vegetable every meal', 'Take my vitamins'],
    mind: ['Read 10 pages', 'Meditate 5 minutes', 'Journal 3 lines', 'No phone the first hour', 'Plan tomorrow tonight', 'Learn one new thing'],
    wealth: ['Track every dollar', 'Save $5', 'No impulse buys', 'Study 30 minutes', 'Work on my business 30 min', 'Send one application'],
    relationships: ['Text a friend', 'Call family', 'Thank someone', 'Phone-free dinner', 'Give one compliment'],
    passion: ['Practice 20 minutes', 'Create something', 'Post once', 'Learn a skill 15 min'],
    education: ['Study 45 minutes', 'Review class notes', 'Do one assignment early', 'Read a chapter', 'Flashcards 15 minutes', 'Plan tomorrow\'s study'],
    fitness: ['Work out', 'Walk 10k steps', 'Stretch 10 minutes', 'Hit my protein', 'Drink 3 bottles of water', 'Go to the gym']
  };
  var LONG = {
    health: ['Run a half marathon', 'Bench my body weight', 'Run a 5K under 25 min', 'Do 20 pull-ups', 'Lose 10 lb', 'Gain 10 lb of muscle'],
    mind: ['Read 12 books', 'Finish an online course', 'Learn Spanish basics', 'Journal 100 days'],
    wealth: ['Save $2,000', 'Pay off a credit card', 'Land an internship', 'Make my first $1,000 online', 'Start a side business'],
    relationships: ['Make 3 new friends', 'Plan a trip with friends', 'Reconnect with an old friend', 'Family dinner every month'],
    passion: ['Learn guitar', 'Launch a project', 'Post 30 days in a row', 'Build an app'],
    education: ['Get a 3.5 GPA this semester', 'Ace my next exam', 'Finish an online course', 'Read 12 books', 'Get a certification', 'Land an internship'],
    fitness: ['Bench my body weight', 'Run a 5K under 25 min', 'Do 20 pull-ups', 'Gain 10 lb of muscle', 'Run a half marathon', 'Lose 10 lb']
  };
  function mix(o) { var out = []; Object.keys(o).forEach(function (k) { out = out.concat(o[k].slice(0, 2)); }); return out; }
  function sheets() { return document.querySelectorAll('.kz-sheet49'); }
  function q(sh, k) { return sh.querySelector('[data-t="' + k + '"], [data-gx="' + k + '"]'); }
  function kindOf(sh) { var b = sh.querySelector('.kz-kindseg [aria-checked="true"]'); return sh.classList.contains('kzq-on') ? 'quit' : b ? b.getAttribute('data-kind') : ''; }
  // g (Oct 26): a branch you named yourself gets the list that fits its name (Education, Fitness, Gym, School, Money...),
  // instead of a mix of every branch's suggestions
  function listFor(n) {
    n = String(n || '').toLowerCase().trim();
    if (DAILY[n]) return n;
    var M = [
      [/fit|gym|workout|lift|train|sport|run|muscle|strength|athlet|wrestl|jiu|bjj/, 'fitness'],
      [/educ|school|study|class|college|uni|learn|grade|exam|academ|course/, 'education'],
      [/health|body|sleep|diet|food|nutri|well/, 'health'],
      [/mind|mental|focus|calm|faith|spirit|medit|read/, 'mind'],
      [/wealth|money|financ|career|work|job|business|income|invest|trad/, 'wealth'],
      [/relat|friend|family|love|social|people|partner/, 'relationships'],
      [/person|passion|hobby|creat|art|music|content|side/, 'passion']
    ];
    for (var i = 0; i < M.length; i++) if (M[i][0].test(n)) return M[i][1];
    return n;
  }
  function branchOf(sh) { var b = sh.querySelector('[data-t="pillars"] [aria-pressed="true"], [data-gx="pillars"] [aria-pressed="true"]'); var id = b && b.getAttribute('data-p'); var p = (K.PATHS || []).filter(function (x) { return x.id === id; })[0]; var n = ((p && p.name) || id || '').toLowerCase(); return n === 'personal' ? 'passion' : n; }
  function isNew(sh) { var t = q(sh, 'sheet-t') || q(sh, 't'); return !t || !/^\s*Edit/i.test(t.textContent); }
  function run() { try { var st = K.k66 && K.k66.state(); return st && st.run; } catch (e) { return null; } }
  function goalName(id) { try { var g = K.goals().filter(function (x) { return x.id === id; })[0]; return g ? g.name : ''; } catch (e) { return ''; } }

  function paint(sh) {
    var k = kindOf(sh), inp = q(sh, 'gname'), field = inp && inp.closest('label'); if (!field) return;
    var fresh = isNew(sh);
    // chips
    var box = sh.querySelector('.kzp-box');
    var showChips = fresh && (k === 'daily' || k === 'long');
    sh.classList.toggle('kzp-on', showChips);
    if (showChips) {
      var br = listFor(branchOf(sh)), src = k === 'daily' ? DAILY : LONG, list = src[br] || mix(src), sig = k + '|' + br;
      if (!box) { box = document.createElement('div'); box.className = 'kzp-box'; field.parentNode.insertBefore(box, field.nextSibling); }
      if (box.getAttribute('data-sig') !== sig) { box.setAttribute('data-sig', sig); box.innerHTML = '<div class="kzp-picks" role="group" aria-label="Quick picks">' + list.map(function (x) { return '<button type="button" data-kzp-pick="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>'; }
      if (box.hidden) box.hidden = false;
    } else if (box && !box.hidden) box.hidden = true;
    // Kaizen 66 checkbox
    var row = sh.querySelector('.kzp-66'), show66 = fresh && (k === 'daily' || k === 'quit') && !!K.k66;
    if (show66) {
      if (!row) {
        row = document.createElement('label'); row.className = 'kzp-66';
        row.innerHTML = '<span class="kzp-66t"><b>Make this my Kaizen 66</b><em></em></span><input type="checkbox" class="kz-sw49" data-kzp-66>';
        var anchor = sh.querySelector('.kzq-box:not([hidden])') || box || field; anchor.parentNode.insertBefore(row, anchor.nextSibling);
      } else { var a2 = sh.querySelector('.kzq-box:not([hidden])') || (box && !box.hidden ? box : field); if (row.previousSibling !== a2) a2.parentNode.insertBefore(row, a2.nextSibling); }
      var r = run(), em = row.querySelector('em'), txt = r && r.goal ? 'Resets ' + goalName(r.goal) + ' (day ' + (r.state === 'pending' ? 0 : r.day) + ') to day 0' : '66 days, starting tomorrow';
      if (em.textContent !== txt) em.textContent = txt;
      if (row.hidden) row.hidden = false;
    } else if (row) { if (!row.hidden) row.hidden = true; var cb = row.querySelector('input'); if (cb) cb.checked = false; }
  }
  function paintAll() { Array.prototype.forEach.call(sheets(), function (sh) { if (sh.offsetParent || !sh.hidden) try { paint(sh); } catch (e) {} }); }

  document.addEventListener('click', function (e) {
    var pk = e.target.closest && e.target.closest('[data-kzp-pick]');
    if (pk) {
      var sh = pk.closest('.kz-sheet49'), inp = sh && q(sh, 'gname'); if (!inp) return;
      inp.value = pk.getAttribute('data-kzp-pick'); inp.dispatchEvent(new Event('input', { bubbles: true }));
      Array.prototype.forEach.call(sh.querySelectorAll('[data-kzp-pick]'), function (b) { b.classList.toggle('on', b === pk); });
      post({ type: 'tick' }); return;
    }
    if (e.target.closest && e.target.closest('.kz-sheet49 .kz-kindseg, .kz-sheet49 [data-t="pillars"], .kz-sheet49 [data-gx="pillars"]')) setTimeout(paintAll, 0);
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.matches || !t.matches('[data-t="gname"], [data-gx="gname"]')) return;
    var sh = t.closest('.kz-sheet49'); if (!sh) return;
    Array.prototype.forEach.call(sh.querySelectorAll('[data-kzp-pick]'), function (b) { b.classList.toggle('on', b.getAttribute('data-kzp-pick') === t.value); });
  });
  // on save: remember the box, find the new goal right after, then start (or ask to switch) the run
  document.addEventListener('submit', function (e) {
    var sh = e.target.closest && e.target.closest('.kz-sheet49'); if (!sh) return;
    var cb = sh.querySelector('[data-kzp-66]'); if (!cb || !cb.checked || cb.closest('[hidden]')) return;
    var before = {}; try { K.goals().forEach(function (g) { before[g.id] = 1; }); } catch (er) {}
    var name = (q(sh, 'gname') || {}).value || '';
    cb.checked = false;
    var tries = 0;
    (function look() {
      var g = null; try { g = K.goals().filter(function (x) { return !before[x.id] && x.kind === 'daily'; }).pop(); } catch (er) {}
      if (!g) { if (++tries < 20) setTimeout(look, 100); return; }
      setTimeout(function () {
        var r = run();
        if (r && r.goal && K.k66.askSwitch) K.k66.askSwitch(g.id);
        else if (K.k66.switchTo) { K.k66.switchTo(g.id); if (K.toast) K.toast(g.name + ' is your Kaizen 66'); }
        else if (K.k66.start) K.k66.start(g.id);
      }, 380);   // after the add sheet has closed
    })();
    void name;
  }, true);

  // zc (Oct 25): "Start quitting did nothing" on the phone. Log each add-button tap, whether the form really submitted,
  // and any field that blocked it, to the Xcode console (bridge "log", debug builds only) so the next report has evidence.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kz-addsheet button[type="submit"]'); if (!b) return;
    var f = b.form, bad = f ? [].filter.call(f.elements, function (x) { return x.willValidate && !x.checkValidity(); }).map(function (x) { return (x.getAttribute('data-t') || x.getAttribute('data-gx') || x.name || x.type) + ':' + x.validationMessage; }) : ['no form'];
    post({ type: 'log', msg: '[kz add] tap "' + b.textContent.trim() + '" kind=' + kindOf(b.closest('.kz-sheet49')) + ' blocked=' + JSON.stringify(bad) });
  }, true);
  document.addEventListener('submit', function (e) { if (e.target.closest && e.target.closest('.kz-addsheet')) post({ type: 'log', msg: '[kz add] submit ok' }); }, true);
  var mo = new MutationObserver(function () { if (mo.t) return; mo.t = requestAnimationFrame(function () { mo.t = 0; paintAll(); }); });   // ze: next frame, not 30 ms later (the old list flashed under the new chips)
  function boot() { paintAll(); mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-checked', 'aria-pressed', 'hidden', 'class'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
