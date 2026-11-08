
/* Kaizen · tree UI: Profile hero, home overview card, first-meeting welcome, Edit tree. */
(function () {
  var K = window.KZ; if (!K || !K.lifeTree) return;
  var DROP = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/></svg>';
  var pl = function (n, a, b) { return n + ' ' + (n === 1 ? a : b); };
  K.treeWaterLine = function (h) {
    if (h.status === 'seed') return 'Complete a goal to give ' + K.treeRef() + ' its first water.';
    return (h.todayDue ? h.todayDone + ' of ' + pl(h.todayDue, 'goal', 'goals') + ' done today · ' : '') + h.water + '% water';
  };
  var later = function () { try { return sessionStorage.getItem('kz_treelater') === '1'; } catch (e) { return false; } };
  var onboarding = function () { var w = document.querySelector('.kz-welcome'); return w && !w.hidden; };
  var lockScroll = function (on) { document.documentElement.style.overflow = on ? 'hidden' : ''; };
  var spButtons = function (cur, cls) {
    return (K.pickerSpecies ? K.pickerSpecies(cur) : Object.keys(K.SPECIES)).map(function (k) { var sp = K.SPECIES[k];
      var lock = K.speciesUnlocked && !K.speciesUnlocked(k); return '<button type="button" class="' + cls + (lock ? ' is-locked' : '') + '" data-sp="' + k + '" aria-pressed="' + (k === cur) + '"' + (lock ? ' disabled aria-label="' + sp.name + ', unlocks at ' + K.speciesNeed(k) + '"' : '') + '>' + (cls === 'kz-twsp' ? '<span class="kz-twsp-art">' + K.lifeTree({ species: k, demo: 6, mini: true, lite: true }).svg + '</span>' : '<i style="background: linear-gradient(135deg, ' + sp.leaf[0] + ', ' + sp.leaf[2] + ')"></i>') + '<span>' + (lock ? '🔒 ' + K.speciesNeed(k) : sp.name) + '</span></button>'; }).join('');
  };
  var pick = function (box, k) { box.querySelectorAll('[data-sp]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sp === k)); }); };

  // ---------- First meeting: full screen, needs a name ----------
  var welcomeOpen = false;
  K.openTreeWelcome = function () {
    if (welcomeOpen) return; welcomeOpen = true;
    var sp = K.treeSpecies(), el = document.createElement('div');
    el.className = 'kz-twelcome'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'kz-tw-h');
    el.innerHTML = '<div class="kz-twin">' +
      '<span class="kz-label gold">Your tree</span><h1 class="kz-serif-title" id="kz-tw-h">Something just sprouted.</h1>' +
      '<p class="kz-soft">Every goal you complete waters it. Skip days and it dries out. Look after it and it grows for years.</p>' +
      '<div class="kz-twprev" data-tw="prev"></div>' +
      '<label class="kz-twlab" for="kz-tw-name">Name it</label>' +
      '<input id="kz-tw-name" class="kz-input" maxlength="20" autocomplete="off" placeholder="Give it a name" required>' +
      '<p class="kz-twerr" data-tw="err" aria-live="polite"></p>' +
      '<span class="kz-twlab">Choose what it grows into</span>' +
      '<div class="kz-twgrid" role="group" aria-label="Tree type" data-tw="sp">' + spButtons(sp, 'kz-twsp') + '</div>' +
      '<button type="button" class="kz-btn navy pill wide" data-tw="plant">Plant it</button>' +
      '<button type="button" class="kz-quiet" data-tw="later">Decide later</button></div>';
    document.body.appendChild(el); lockScroll(true);
    var q = function (k) { return el.querySelector('[data-tw="' + k + '"]'); }, inp = el.querySelector('#kz-tw-name');
    var prev = function () { q('prev').innerHTML = K.treeHealth().status === 'seed' ? K.lifeTree({ species: sp, demo: K.sproutDemo(), mini: true }).svg : K.lifeTree({ species: sp, mini: true }).svg; }; // your tree, at its real size, in the new species
    prev();
    q('sp').addEventListener('click', function (e) { var b = e.target.closest('[data-sp]'); if (!b) return; sp = b.dataset.sp; pick(q('sp'), sp); prev(); });
    inp.addEventListener('input', function () { q('err').textContent = ''; });
    var close = function () { el.remove(); lockScroll(false); welcomeOpen = false; document.dispatchEvent(new CustomEvent('kz:changed')); };
    q('plant').addEventListener('click', function () {
      var n = inp.value.trim(); if (!n) { q('err').textContent = 'Give it a name first.'; inp.focus(); return; }
      K.plantTree(n, sp); close();
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); q('plant').click(); } });
    q('later').addEventListener('click', function () { try { sessionStorage.setItem('kz_treelater', '1'); } catch (e) {} K.track('kz_tree_later'); close(); });
    // No other way out: Escape does nothing until it has a name or "Decide later" is chosen.
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } });
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 50);
    K.track('kz_tree_welcome');
  };
  var maybeWelcome = function (delay) { if (K.treePlanted() || later() || welcomeOpen || /[?&](account|signedin)=/.test(location.search) || /access_token=/.test(location.hash)) return; setTimeout(function () { if (!K.treePlanted() && !later() && !onboarding()) K.openTreeWelcome(); }, delay || 0); };
  document.addEventListener('kz:step', function () { maybeWelcome(1300); });

  // ---------- Edit tree: costs 2% of its height ----------
  K.openTreeEdit = function (done) {
    var name = K.treeName(), sp = K.treeSpecies(), el = document.createElement('div');
    el.className = 'kz-tmodal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'kz-te-h');
    el.innerHTML = '<div class="kz-tmbox"><h2 class="kz-h2" id="kz-te-h">Edit tree</h2>' +
      '<p class="kz-twarn" data-te="warn">Replanting as a different tree stresses it. It will lose 2% of its height.</p>' +
      '<span class="kz-twlab">Tree type</span><div class="kz-species" role="group" aria-label="Tree type" data-te="sp">' + spButtons(sp, 'kz-sp') + '</div>' +
      '<div class="kz-row" style="gap: 10px; justify-content: center; width: 100%"><button type="button" class="kz-btn ghost" data-te="cancel">Cancel</button><button type="button" class="kz-btn kz-danger" data-te="ok">Confirm</button></div></div>';
    document.body.appendChild(el); lockScroll(true);
    var q = function (k) { return el.querySelector('[data-te="' + k + '"]'); }, chosen = sp;
    var close = function () { el.remove(); lockScroll(false); };
    q('sp').addEventListener('click', function (e) { var b = e.target.closest('[data-sp]'); if (b) { chosen = b.dataset.sp; pick(q('sp'), chosen); } });
    q('cancel').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    q('ok').addEventListener('click', function () {
      var changed = K.editTree('', chosen); close();
      if (done) done(changed && chosen !== sp);
    });
    setTimeout(function () { q('cancel').focus(); }, 30);
  };

  // ---------- Profile hero ----------
  // Branches: one row per pillar. The bar is that pillar's share of the tree's growth; the number is days of growth from it. (Shown on Progress.)
  K.branchesHTML = function (lt) {
          var tot = 0, mx = 0; K.PATHS.forEach(function (p) { var v = lt.perPillar[p.id] || 0; tot += v; mx = Math.max(mx, v); });
          return '<div class="kz-brbar" data-t="legend"><div class="kz-brbar-h"><span>Branches</span><small>What each branch has grown</small></div>' +
            K.PATHS.map(function (p) { var has = K.goalsIn(p.id) > 0, v = lt.perPillar[p.id] || 0;
              return '<a class="kz-br-row' + (has ? '' : ' idle') + '" href="/pages/my-goals?pillar=' + p.id + (has ? '' : '#add') + '" data-pillar="' + p.id + '"><i style="background: ' + p.c2 + '"></i><span class="kz-br-n">' + K.esc(p.name) + '</span>' +
                (has ? '<span class="kz-br-bar"><b style="width: ' + (mx ? Math.max(4, Math.round(100 * v / mx)) : 0) + '%; background: ' + p.c2 + '"></b></span><span class="kz-br-v">' + (v ? (Math.round(v * 10) / 10) + (v === 1 ? ' day' : ' days') : 'Not yet') + '</span>' : '<span class="kz-br-add">+ Add a goal</span>') + '</a>'; }).join('') + '</div>';
  };
  K.mountTreeHero = function (el) {
    var fresh = null, note = false;
    try { if (!K.get('treev35', 0) && K.totalSteps && K.totalSteps() > 0) { note = true; K.set('treev35', 1); } } catch (e) {}
    var paint = function (regrow) {
      var lt = K.lifeTree({ fresh: fresh }), h = lt.health, st = h.status, nm = K.treeName(), wk = lt.week, td = lt.today; fresh = null;
      var lostTxt = ''; if (lt.lost) { var bits = []; if (h.missed) bits.push(pl(h.missed, 'missed day', 'missed days')); if (h.stress) bits.push(pl(h.stress, 'edit', 'edits')); lostTxt = 'Lost ' + K.treeHeight(lt.lost) + ' so far (' + bits.join(' · ') + ').'; }
      var chips = K.PATHS.map(function (p) { var has = K.goalsIn(p.id) > 0;
        return '<a class="kz-pathchip' + (has ? '' : ' kz-idlechip') + '" href="/pages/my-goals?pillar=' + p.id + (has ? '' : '#add') + '" data-pillar="' + p.id + '"><i style="background: ' + p.c2 + (has ? '' : '; opacity: .5') + '"></i>' + K.esc(p.name) + ' <b>' + (has ? (lt.perPillar[p.id] || 0) : '+') + '</b></a>'; }).join('');
      el.innerHTML = '<div class="kz-treecard kz-treehero">' +
        '<span class="kz-label gold">Your tree</span>' +
        '<h1 class="kz-treename" data-t="name">' + K.esc(K.treeLabel()) + '</h1>' +
        '<div class="kz-treeart" data-t="art">' + lt.svg + '</div>' +
        '<div class="kz-water ' + st + '" data-t="water">' + DROP + '<div class="kz-waterbar"><i style="width: ' + h.water + '%"></i></div><span>' + h.water + '%</span></div>' +
        '<p class="kz-wline" data-t="wline">' + K.treeWaterLine(h) + '</p>' +
        '<p class="kz-treemood" data-t="mood">' + K.esc(K.treeMood(h)) + '</p>' +
        (function () { var w = lt.wildlife || {}, r = K.treeNamed() ? K.treeName() : 'your tree', parts = [];
          if (w.birds) parts.push(w.birds === 1 ? 'A bird' : w.birds + ' birds'); if (w.squirrel) parts.push(parts.length ? 'a squirrel' : 'A squirrel');
          if (parts.length) return '<p class="kz-twild" data-t="wild">' + parts.join(' and ') + (parts.length > 1 || w.birds > 1 ? ' live in ' : ' lives in ') + K.esc(r) + (w.nest ? ', with a nest' : '') + '.</p>';
          if (lt.steps && lt.visual >= 10 && ['wilting', 'dying', 'dead'].indexOf(st) > -1) return '<p class="kz-twild gone" data-t="wild">The birds moved away. Water ' + K.esc(r) + ' and they’ll come back.</p>';
          return ''; })() +
        (note ? '<p class="kz-tnote" data-t="note">Your tree now grows with your days, not your goal count. A fully completed day adds 1 inch.</p>' : '') +
        '<div class="kz-tstats"><span data-t="week">' + (td > 0 ? '+' + K.treeInches(td) + ' today · ' : '') + (wk > 0 ? '+' + K.treeInches(wk) + ' this week' : 'No growth yet this week') + '</span>' + (lostTxt ? '<span class="lost" data-t="lost">' + lostTxt + '</span>' : '') + '</div>' +
        '</div>';
      var hsv = el.querySelector('.kz-treeart .kz-lifetree'); if (hsv) hsv.setAttribute('preserveAspectRatio', 'xMidYMax meet'); // ground on the bottom edge, sky fills the top
      if (regrow) { var sv = el.querySelector('.kz-lifetree'); if (sv) sv.classList.add('kz-regrow'); }
      var eb = el.querySelector('[data-t="edit"]'); if (eb) eb.addEventListener('click', function () { K.openTreeEdit(function (sp) { paint(sp); }); });
    };
    paint(false);
    document.addEventListener('kz:step', function (e) { var g = K.allGoals().filter(function (x) { return x.id === (e.detail && e.detail.id); })[0]; if (g) fresh = K.pathOf(g); setTimeout(function () { paint(false); }, 900); });
    ['kz:changed', 'kz:goals', 'kz:pillars', 'kz:sky'].forEach(function (ev) { document.addEventListener(ev, function () { if (!document.querySelector('.kz-tmodal')) paint(false); }); });
    maybeWelcome(250);
  };

  // ---------- Home overview card ----------
  K.mountTreeCard = function (el) {
    var paint = function () {
      var lt = K.lifeTree({ mini: true, lite: true }), h = lt.health, nm = K.treeName(), seed = h.status === 'seed';
      el.className = 'kz-tcard' + (seed ? '' : h.water < 20 ? ' red' : h.water < 50 ? ' amber' : '');
      el.innerHTML = '<span class="kz-tcard-art">' + lt.svg + '</span>' +
        '<span class="kz-tcard-txt"><b data-t="name">' + K.esc(K.treeLabel()) + '</b><span data-t="mood">' + K.esc(K.treeMood(h)) + '</span>' +
        '<span class="kz-tcard-w ' + h.status + '" data-t="water">' + DROP + (seed ? 'No water yet' : h.water + '% water') + '</span>' +
        '<span class="kz-tcard-g" data-t="grow">' + (lt.today > 0 ? '+' + K.treeInches(lt.today) + ' today' : h.todayDue ? 'One goal today grows ' + K.esc(K.treeRef()) + ' ' + K.treeInches(1 / h.todayDue) : '') + '</span>' +
        '<a class="kz-tcard-go" href="/pages/profile#tree" data-t="visit">Visit ' + (K.treeNamed() ? K.esc(nm) : 'your tree') + ' →</a></span>';
    };
    paint();
    var cele = 0;
    document.addEventListener('kz:step', function () { setTimeout(function () { if (Date.now() - cele > 2500) paint(); }, 900); });
    ['kz:changed', 'kz:goals'].forEach(function (ev) { document.addEventListener(ev, paint); });
    // Every goal done today: the card pulses and says so (once a day; fired by the goal list).
    document.addEventListener('kz:alldone', function () {
      setTimeout(function () {
        paint(); cele = Date.now(); el.classList.remove('kz-celebrate'); void el.offsetWidth; el.classList.add('kz-celebrate');
        var m = el.querySelector('[data-t="mood"]'); if (m) m.textContent = 'Every goal done. ' + (K.treeNamed() ? K.treeName() : 'Your tree') + ' drank it all up.';
      }, 950);
    });
  };
  var boot = function () {
    document.querySelectorAll('[data-kz-treehero]').forEach(K.mountTreeHero);
    document.querySelectorAll('[data-kz-treecard]').forEach(K.mountTreeCard);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})();
