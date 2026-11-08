/* Oct 23 Phase 1B: one goal sheet everywhere.
   The same bottom sheet as Today's "+" (same classes, same fields, same look), used to ADD a goal on every page except Today
   (Today keeps its own sheet, which also adds to-dos) and to EDIT a goal on every page, Today included.
   It writes through the same calls the old forms used: K.addGoal (add) and K.updateGoal (edit). */
(function () {
  var K = window.KZ; if (!K || K.goalSheet) return;
  var sheet = null, form = null, kind = 'long', path = '', editId = null, list = [];
  var onToday = function () { return !!document.querySelector('#kz-today-s1 [data-t="sheet"]'); };
  var $ = function (k) { return sheet.querySelector('[data-gx="' + k + '"]'); };
  var pillars = function () { return (K.PATHS || []).slice(0, 8); };
  var opt = ' <i class="kz-opt">(optional)</i>';
  function build() {
    sheet = document.createElement('div');
    sheet.className = 'kz-sheet49 kz-addsheet kz-goalsheet'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'kz-gs-t');
    sheet.innerHTML = '<form class="kz-sheet-in" data-gx="form" novalidate>' +
      '<div class="kz-sheet-top"><h2 class="kz-t49" id="kz-gs-t" data-gx="t">New goal</h2><button type="button" class="kz-iconbtn" data-gx="close" aria-label="Close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="kz-kindseg" role="radiogroup" aria-label="Type" data-gx="kinds"><button type="button" role="radio" data-kind="long" aria-checked="true">Long-term</button><button type="button" role="radio" data-kind="daily" aria-checked="false">Daily habit</button></div>' +
      '<label class="kz-field49"><span class="kz-label49" data-gx="gname-l">The goal</span><input data-gx="gname" maxlength="90" placeholder="Finish a sprint triathlon in June" autocomplete="off" required></label>' +
      '<button type="button" class="kz-morebtn" data-gx="more" aria-expanded="false" aria-controls="kz-gs-more"><span>Make it stick' + opt + '</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<div class="kz-moregrp" id="kz-gs-more" data-gx="moreBox" hidden>' +
        '<label class="kz-field49" data-gx="gstep-w"><span class="kz-label49">Daily habit for it' + opt + '</span><input data-gx="gstep" maxlength="140" placeholder="Run for 20 minutes" autocomplete="off"></label>' +
        '<label class="kz-field49"><span class="kz-label49">When will you do it?' + opt + '</span><span class="kz-cuein"><b>After I…</b><input data-gx="gcue" maxlength="80" placeholder="pour my morning coffee" autocomplete="off"></span><small class="kz-hint49">Tie it to something you already do. Plans like this make follow-through more likely.</small></label>' +
        '<label class="kz-field49"><span class="kz-label49">Bad-day version' + opt + '</span><input data-gx="gmini" maxlength="80" placeholder="Put on my running shoes" autocomplete="off"><small class="kz-hint49">A 2-minute version. On a rough day, doing it still counts. Never miss twice.</small></label>' +
        '<label class="kz-steprow kz-switchrow"><span><strong>Keep a log</strong><em>A note box for this goal, every day</em></span><input type="checkbox" class="kz-sw49" data-gx="glog"></label>' +
      '</div>' +
      '<div class="kz-field49" data-gx="picks-wrap"><span class="kz-label49 gold">Quick picks</span><div class="kz-picks49" data-gx="picks"></div><div class="kz-pdots49" data-gx="pdots" aria-hidden="true"></div></div>' +
      '<div class="kz-field49"><span class="kz-label49">Branch</span><div class="kz-chips49" data-gx="pillars" role="group" aria-label="Branch"></div></div>' +
      '<p class="kz-note kz-gs-keep" data-gx="keep" hidden>Progress and notes stay with this goal.</p>' +
      '<p class="kz-err49" data-gx="err" hidden>Name your goal first.</p>' +
      '<button type="submit" class="kz-btn gold"><svg data-gx="plus" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span data-gx="submit-l">Add goal</span></button>' +
      '</form>';
    document.body.appendChild(sheet); form = $('form');
    $('kinds').addEventListener('click', function (e) { var b = e.target.closest('[data-kind]'); if (!b) return; kind = b.dataset.kind; paintKind(); try { navigator.vibrate(4); } catch (er) {} });
    $('more').addEventListener('click', function () { setMore($('more').getAttribute('aria-expanded') !== 'true'); });
    $('close').addEventListener('click', close);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet && !sheet.hidden) close(); });
    var gT = 0; $('gname').addEventListener('input', function () { $('err').hidden = true; clearTimeout(gT); var v = this.value; gT = setTimeout(function () { guess(v); }, 180); });
    $('pillars').addEventListener('click', function (e) {
      var sg = e.target.closest('[data-psug]');
      if (sg) { var id = K.addPillar ? K.addPillar(sg.dataset.psug) : null; if (id) { path = id; K.track('kz_pillar_suggested', { name: sg.dataset.psug }); } paintPillars(); paintPicks(); return; }
      var b = e.target.closest('[data-p]'); if (!b) return; path = b.dataset.p; paintPillars(); paintPicks();
    });
    $('picks').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]'); if (!b || !b.classList.contains('on')) return; var x = list[+b.dataset.pick]; if (!x) return;
      if (kind === 'daily') { $('gname').value = x.s || x.n; $('gstep').value = ''; } else { $('gname').value = x.n; $('gstep').value = x.s || ''; }
      $('err').hidden = true; if ($('gstep').value) setMore(true);
    });
    picksCarousel();
    form.addEventListener('submit', submit);
  }
  // The quick-picks carousel: same behaviour as Today's (centre card is active; tapping a side card scrolls it in)
  function picksCarousel() {
    var c = $('picks'), d = $('pdots'), cur = -1, raf = 0;
    var cards = function () { return Array.prototype.slice.call(c.querySelectorAll('[data-pick]')); };
    var act = function () {
      var cs = cards(); if (!cs.length) { d.innerHTML = ''; return; }
      var m = c.scrollLeft + c.clientWidth / 2, best = 0, bd = 1e9;
      cs.forEach(function (b, i) { var x = b.offsetLeft + b.offsetWidth / 2, dd = Math.abs(x - m); if (dd < bd) { bd = dd; best = i; } });
      if (d.children.length !== cs.length) d.innerHTML = cs.map(function () { return '<span></span>'; }).join('');
      cs.forEach(function (b, i) { b.classList.toggle('on', i === best); }); Array.prototype.forEach.call(d.children, function (s, i) { s.classList.toggle('on', i === best); });
      if (best !== cur) { if (cur !== -1) { try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'tick' }); } catch (e) {} } cur = best; }
    };
    c.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; act(); }); }, { passive: true });
    new MutationObserver(function () { cur = -1; c.scrollLeft = 0; act(); }).observe(c, { childList: true });
    c.parentNode.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-pick]'); if (!b || !c.contains(b)) return; if (!b.classList.contains('on')) { e.stopPropagation(); e.preventDefault(); c.scrollTo({ left: b.offsetLeft - (c.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' }); } }, true);
  }
  var PSUG = [
    [/\b(run|running|gym|lift|lifting|bench|squat|triathlon|swim|bike|cycling|marathon|5k|10k|bulk|cut|muscle|workout|train|wrestl|jiu|bjj|sport|athlet|cardio|abs)\w*/i, 'Fitness'],
    [/\b(eat|diet|calorie|protein|meal|nutrition|cook|water|sugar|fast)\w*/i, 'Nutrition'],
    [/\b(study|class|gpa|exam|test|homework|school|college|grade|course|midterm|final|lecture|major)\w*/i, 'Education'],
    [/\b(save|saving|money|invest|budget|debt|stock|trade|trading|futures|finance|income|\$)\w*/i, 'Finances'],
    [/\b(job|career|internship|resume|interview|work|promotion|network|linkedin)\w*/i, 'Career'],
    [/\b(business|startup|brand|sell|selling|clothing|shop|store|client|marketing|tiktok|content)\w*/i, 'Business'],
    [/\b(read|reading|book|pages)\w*/i, 'Reading'],
    [/\b(pray|prayer|church|bible|faith|god|mass)\w*/i, 'Faith'],
    [/\b(mom|dad|family|brother|sister|grandma|grandpa|parents|home)\w*/i, 'Family'],
    [/\b(friend|girlfriend|boyfriend|date|dating|chapter|frat|social|call)\w*/i, 'Relationships'],
    [/\b(sleep|bed|wake|morning)\w*/i, 'Sleep'],
    [/\b(meditat|journal|mindful|therapy|calm|stress|phone|screen)\w*/i, 'Mind'],
    [/\b(guitar|piano|music|draw|paint|write|writing|design|photo|film|art|creat)\w*/i, 'Creativity'],
    [/\b(skin|skincare|style|groom|hair|clean|room|organiz)\w*/i, 'Self-care']
  ];
  function pillarSugs() {
    var txt = $('gname').value || '', have = (K.PATHS || []).map(function (p) { return p.name.toLowerCase(); }), out = [];
    if ((K.PATHS || []).length >= (K.MAX_PILLARS || 8)) return out;
    PSUG.forEach(function (x) { if (out.length < 3 && x[0].test(txt) && have.indexOf(x[1].toLowerCase()) < 0 && out.indexOf(x[1]) < 0) out.push(x[1]); });
    return out;
  }
  function paintPillars() {
    $('pillars').innerHTML = pillars().map(function (p) { return '<button type="button" data-p="' + p.id + '" aria-pressed="' + (p.id === path) + '" style="--pc: ' + p.c2 + '">' + K.esc(p.name) + '</button>'; }).join('') +
      pillarSugs().map(function (n) { return '<button type="button" class="sug" data-psug="' + K.esc(n) + '" aria-label="Add ' + K.esc(n) + ' as a branch">' + K.esc(n) + '</button>'; }).join('');
  }
  function paintPicks() {
    list = editId || !K.libraryList ? [] : K.libraryList(path || (pillars()[0] || {}).id) || [];
    $('picks-wrap').hidden = !list.length;
    $('picks').innerHTML = list.slice(0, 30).map(function (x, i) { return kind === 'daily' ? '<button type="button" data-pick="' + i + '"><b>' + K.esc(x.s || x.n) + '</b></button>' : '<button type="button" data-pick="' + i + '"><b>' + K.esc(x.n) + '</b>' + (x.s ? '<i>Daily</i><span>' + K.esc(x.s) + '</span>' : '') + '</button>'; }).join('');
  }
  function paintKind() {
    $('kinds').querySelectorAll('[data-kind]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.kind === kind)); });
    $('gstep-w').hidden = kind !== 'long';
    $('gname-l').textContent = kind === 'daily' ? 'The habit' : 'The goal';
    $('gname').placeholder = kind === 'daily' ? 'Read 10 pages' : 'Finish a sprint triathlon in June';
    paintPicks();
  }
  function setMore(on) { $('more').setAttribute('aria-expanded', String(on)); $('moreBox').hidden = !on; }
  function guess(v) {
    var gp = K.guessPath ? K.guessPath(v) : '';
    if (!editId && gp && gp !== path && v.length > 3 && pillars().some(function (p) { return p.id === gp; })) { path = gp; paintPicks(); }
    paintPillars();
  }
  function open(o) {
    o = o || {}; if (!sheet) build();
    form.reset(); $('err').hidden = true; setMore(false);
    var g = o.mode === 'edit' ? K.goals().filter(function (x) { return x.id === o.id; })[0] : null;
    editId = g ? g.id : null;
    if (g) {
      kind = g.kind === 'daily' ? 'daily' : 'long';
      path = (K.pathOf ? K.pathOf(g) : g.path) || (pillars()[0] || {}).id || '';
      $('gname').value = g.name || ''; $('gstep').value = g.step || ''; $('gcue').value = g.cue || ''; $('gmini').value = g.mini || ''; $('glog').checked = !!g.log;
      if (g.step || g.cue || g.mini || g.log) setMore(true);
    } else {
      kind = o.kind === 'daily' ? 'daily' : 'long';
      path = o.path && pillars().some(function (p) { return p.id === o.path; }) ? o.path : (pillars()[0] || {}).id || '';
      if (o.name) $('gname').value = o.name;
      if (o.step && kind === 'long') { $('gstep').value = o.step; setMore(true); }
    }
    $('t').textContent = g ? 'Edit goal' : 'New goal';
    $('submit-l').textContent = g ? 'Save' : 'Add goal';
    $('plus').style.display = g ? 'none' : '';
    $('keep').hidden = !g;
    paintPillars(); paintKind();
    sheet.hidden = false; document.body.classList.add('kz-noscroll');
    if (!g && !o.name) setTimeout(function () { $('gname').focus(); }, 60);
    K.track(g ? 'kz_edit_open' : 'kz_add_open', { from: 'sheet' });
  }
  function close() { if (!sheet) return; sheet.hidden = true; document.body.classList.remove('kz-noscroll'); }
  function submit(e) {
    e.preventDefault(); var name = $('gname').value.trim();
    if (!name) { $('err').hidden = false; $('gname').focus(); return; }
    var gk = kind === 'daily' ? 'daily' : 'long', st = gk === 'long' ? $('gstep').value.trim() : '', log = $('glog').checked;
    if (editId) {
      var g0 = K.goals().filter(function (x) { return x.id === editId; })[0] || {};
      if (gk === 'daily' && g0.kind === 'daily') st = g0.step || '';   // a daily habit's step isn't shown here; keep whatever it had
      K.updateGoal(editId, { name: name, step: st, cue: $('gcue').value, mini: $('gmini').value, path: path, kind: gk, log: log });
      K.track('kz_goal_edited', { from: 'sheet' });
      close(); document.dispatchEvent(new CustomEvent('kz:changed')); document.dispatchEvent(new Event('kz:goals'));
      if (K.toast) K.toast('Saved');
      return;
    }
    K.addGoal({ name: name, kind: gk, step: st, cue: $('gcue').value, mini: $('gmini').value, log: log, path: path || (K.guessPath ? K.guessPath(name + ' ' + st) : '') });
    K.track('kz_goal_added', { from: 'sheet', log: log, kind: gk });
    close(); document.dispatchEvent(new Event('kz:goals')); document.dispatchEvent(new CustomEvent('kz:changed'));
    if (K.toast) K.toast('Added: ' + name);
  }
  K.goalSheet = { open: open, close: close };
  // Every "Edit" in a goal's menu opens this sheet (the old inline edit form is no longer used)
  document.addEventListener('click', function (e) {
    var ed = e.target.closest && e.target.closest('[data-kz-edit]'); if (!ed) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var id = ed.getAttribute('data-kz-edit');
    document.body.click();   // closes the goal menu, as a tap outside it does
    setTimeout(function () { open({ mode: 'edit', id: id }); }, 30);
  }, true);
  // Every "Add a goal" link (to My goals #add, or Today's /#add-p=…) opens a goal sheet right where you are
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
    var h = u.hash || '', m = /^#add(?:-p=([\w-]+))?$/.exec(h); if (!m) return;
    if (u.pathname !== '/' && u.pathname.indexOf('my-goals') < 0) return;
    var p = m[1] || u.searchParams.get('pillar') || '';
    e.preventDefault(); e.stopImmediatePropagation();
    if (onToday() && K.openAdd) K.openAdd(p ? { path: p } : undefined); else open({ mode: 'add', path: p });
  }, true);
  if (!onToday()) K.openAdd = function (o) { open({ mode: 'add', path: typeof o === 'string' ? o : o && o.path, kind: o && o.kind }); };
})();
