/* Oct 27 · replaces kzquit-1025s.js: Strict / Forgiving Quit (slipMode), chosen in the add sheet. */
/* Oct 25 s (from r): mutation work only when there are Quit habits, sheet relabel once per frame (fast tapping).
   Oct 25 r · Quit a bad habit (James). A fourth kind in the add sheet: "Quit" → "What's your bad habit?" → the goal is
   "Quit <it>". Shown only on Today, in its own Quit section. The day's check-in is locked until 9 PM (James); then you
   answer Clean or I slipped. If you missed last night's check-in, the morning asks "Clean yesterday?". Clean days are
   stored in the same done-map as every check-off, so a Quit habit can be your Kaizen 66 (a slip works like a missed day:
   a shield covers it, otherwise the run ends). Slips are kept in g.slips; "I slipped" never shames.
   A Quit goal is a daily habit underneath (kind 'daily', quit: 1), so streaks, history and Kaizen 66 just work.
   It's hidden on Goals, the Grove and in share text, and its name never goes into reminders. Substance quits show one
   quiet helpline line on the goal's page. */
(function () {
  var K = window.KZ; if (!K || K.__kzquit) return; K.__kzquit = 1;
  var de = document.documentElement;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var OPEN_H = 21; // 9 PM
  function tk() { return K.key(K.today()); }
  function plus(k, n) { return K.key(K.addDays(new Date(k + 'T12:00:00'), n)); }
  function nowH() { var d = new Date(); try { if (K.now) d = K.now(); } catch (e) {} return d.getHours(); }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function quits() { return goals().filter(function (g) { return g.quit; }); }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0] || null; }
  function doneMap() { return K.get('done', {}) || {}; }
  function isDone(id, k) { var d = doneMap(); return !!(d[id] && d[id][k]); }
  function setDone(id, k, on) { var d = doneMap(); d[id] = d[id] || {}; if (on) d[id][k] = 1; else delete d[id][k]; K.set('done', d); }
  function fire() { ['kz:changed', 'kz:step', 'kz:k66'].forEach(function (n) { try { document.dispatchEvent(new CustomEvent(n)); } catch (e) {} }); }
  function saveG(id, patch) { var all = K.get('goals', []) || []; all = all.map(function (g) { if (g.id === id) for (var k in patch) g[k] = patch[k]; return g; }); K.set('goals', all); }
  function started(g) { return (g.created || tk()).slice(0, 10); }
  K.isQuit = function (g) { if (typeof g === 'string') g = goal(g); return !!(g && g.quit); };
  // days clean: consecutive clean check-ins ending today (if checked) or yesterday
  // Oct 27: two kinds of Quit, picked when you make it. Strict (slipMode 'reset', and every Quit made before today):
  // a slip resets the count to 0. Forgiving ('keep'): a slip doesn't count as a clean day but doesn't end the run.
  function strict(g) { return g.slipMode !== 'keep'; }
  K.quitStrict = function (g) { if (typeof g === 'string') g = goal(g); return !!(g && strict(g)); };
  function stats(g) {
    var slips = g.slips || [], hard = strict(g), t = tk(), sl = function (k) { return slips.indexOf(k) >= 0; };
    var k = (isDone(g.id, t) || (!hard && sl(t))) ? t : plus(t, -1), n = 0, s = started(g), g2 = 0;
    while (k >= s && g2++ < 4000) { if (isDone(g.id, k) && !sl(k)) n++; else if (!(sl(k) && !hard)) break; k = plus(k, -1); }
    var best = n, run = 0, d = s, guard = 0;
    while (d <= t && guard++ < 4000) { if (isDone(g.id, d) && !sl(d)) { run++; if (run > best) best = run; } else if (!(sl(d) && !hard)) run = 0; d = plus(d, 1); }
    return { clean: n, best: best, slips: slips.length, strict: hard };
  }
  K.quitStats = function (id) { var g = goal(id); return g ? stats(g) : null; };
  var SUBST = /\b(drug|drugs|weed|marijuana|cannabis|thc|vap(e|ing)|nicotine|smok(e|ing)|cigarette|cig|juul|alcohol|drink(ing)?|beer|liquor|cocaine|coke|pills|opioid|adderall|xanax|gambl(e|ing)|bet(ting)?|meth|heroin)\b/i;

  // ---------- 1 · the add sheet: a fourth kind ----------
  var quitOn = false, pending = null;
  var PICKS = ['Vaping', 'Doom-scrolling', 'Texting my ex', 'Drinking', 'Smoking', 'Junk food', 'Gambling', 'Nail biting'];
  function sheetOf(el) { return el.closest('.kz-sheet49'); }
  function q(sh, k) { return sh.querySelector('[data-t="' + k + '"], [data-gx="' + k + '"]'); }
  function addSeg() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-kindseg'), function (seg) {
      if (seg.querySelector('[data-kind="quit"]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('data-kind', 'quit'); b.setAttribute('aria-checked', 'false'); b.className = 'kzq-kind'; b.textContent = 'Quit';
      seg.appendChild(b); seg.classList.add('kzq-seg');
    });
  }
  function paintQuit(sh) {
    var on = sh.classList.contains('kzq-on');
    Array.prototype.forEach.call(sh.querySelectorAll('.kz-kindseg [data-kind]'), function (b) { if (on) b.setAttribute('aria-checked', String(b.getAttribute('data-kind') === 'quit')); else if (b.getAttribute('data-kind') === 'quit') b.setAttribute('aria-checked', 'false'); });
    var lab = q(sh, 'gname-l'), inp = q(sh, 'gname'), t = q(sh, 'sheet-t') || q(sh, 't'), sub = q(sh, 'submit-l');
    if (on) {
      if (lab) lab.textContent = 'What\'s your bad habit?'; if (inp) inp.placeholder = 'Vaping'; if (t) t.textContent = 'Quit something'; if (sub) sub.textContent = 'Start quitting';
      var box = sh.querySelector('.kzq-box');
      if (!box) {
        box = document.createElement('div'); box.className = 'kzq-box';
        box.innerHTML = '<div class="kzq-picks">' + PICKS.map(function (p) { return '<button type="button" data-q-pick="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>' +
          '<label class="kz-field49"><span class="kz-label49">Why I\'m quitting <i class="kz-opt">(optional)</i></span><input class="kzq-why" maxlength="120" placeholder="More money, better sleep" autocomplete="off"></label>' +
          '<button type="button" class="kzq-strict" role="switch" aria-checked="false"><span><b>Strict mode</b><small>Off: a slip doesn’t end your run</small></span><i aria-hidden="true"></i></button>' +
          '<p class="kz-hint49 kzq-hint">Every night from 9 PM you check in: clean, or slipped. It only shows on Today.</p>';
        var field = inp && inp.closest('label'); if (field && field.parentNode) field.parentNode.insertBefore(box, field.nextSibling);
      }
      box.hidden = false;
    } else { var bx = sh.querySelector('.kzq-box'); if (bx) bx.hidden = true; }
  }
  document.addEventListener('click', function (e) {
    var k = e.target.closest && e.target.closest('.kz-kindseg [data-kind]'); if (!k) {
      var st0 = e.target.closest && e.target.closest('.kzq-strict'); if (st0) { var on0 = st0.getAttribute('aria-checked') !== 'true'; st0.setAttribute('aria-checked', String(on0)); var sm = st0.querySelector('small'); if (sm) sm.textContent = on0 ? 'A slip resets your count to 0' : 'Off: a slip doesn’t end your run'; post({ type: 'tick' }); return; }
      var pk = e.target.closest && e.target.closest('[data-q-pick]'); if (pk) { var sh0 = sheetOf(pk), inp0 = sh0 && q(sh0, 'gname'); if (inp0) { inp0.value = pk.getAttribute('data-q-pick'); inp0.dispatchEvent(new Event('input', { bubbles: true })); } }
      return;
    }
    var sh = sheetOf(k); if (!sh) return;
    if (k.getAttribute('data-kind') === 'quit') {
      e.preventDefault(); e.stopImmediatePropagation();
      var daily = sh.querySelector('.kz-kindseg [data-kind="daily"]'); if (daily) daily.click();   // underneath it's a daily habit
      sh.classList.add('kzq-on'); paintQuit(sh); post({ type: 'tick' });
      var inp = q(sh, 'gname'); if (inp) setTimeout(function () { inp.focus(); }, 30);
    } else if (sh.classList.contains('kzq-on')) { sh.classList.remove('kzq-on'); setTimeout(function () { paintQuit(sh); }, 0); }
  }, true);
  // the sheet's own code repaints labels when it opens or the kind changes: put the Quit labels back
  var sq = 0;
  new MutationObserver(function () { if (sq) return; sq = requestAnimationFrame(function () { sq = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.kz-sheet49'), function (sh) {
      if (sh.hidden && sh.classList.contains('kzq-on')) { sh.classList.remove('kzq-on'); paintQuit(sh); }
      else if (!sh.hidden && sh.classList.contains('kzq-on')) { var lab = q(sh, 'gname-l'); if (lab && lab.textContent !== 'What\'s your bad habit?') paintQuit(sh); }
    });
    addSeg();
  }); }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'aria-checked'] });
  document.addEventListener('submit', function (e) {
    var sh = e.target.closest && e.target.closest('.kz-sheet49'); if (!sh || !sh.classList.contains('kzq-on')) { pending = null; return; }
    var why = sh.querySelector('.kzq-why'), stb = sh.querySelector('.kzq-strict'); pending = { why: why ? why.value.trim().slice(0, 120) : '', strict: !!(stb && stb.getAttribute('aria-checked') === 'true'), at: Date.now() };
    if (why) why.value = ''; if (stb) { stb.setAttribute('aria-checked', 'false'); var sm1 = stb.querySelector('small'); if (sm1) sm1.textContent = 'Off: a slip doesn’t end your run'; }
  }, true);
  function quitName(v) { v = String(v || '').trim(); if (!v) return v; if (/^(quit|stop|no)\b/i.test(v)) return v.charAt(0).toUpperCase() + v.slice(1); return 'Quit ' + v.charAt(0).toLowerCase() + v.slice(1); }
  function wrapAdd() {
    if (!K.addGoal || K.addGoal.__quit) return;
    var add = K.addGoal, w = function (o) {
      var p = pending; pending = null;
      if (p && Date.now() - p.at < 5000 && o && o.kind === 'daily') {
        var o2 = {}; for (var k in o) o2[k] = o[k]; o2.name = quitName(o.name).slice(0, 90); o2.step = ''; o2.cue = ''; o2.mini = '';
        var id = add.call(this, o2); saveG(id, { quit: 1, why: p.why, slips: [], created: tk(), slipMode: p.strict ? 'reset' : 'keep' }); setTimeout(fire, 0); return id;
      }
      return add.apply(this, arguments);
    }; w.__quit = 1; K.addGoal = w;
  }

  // ---------- 2 · Today: the Quit section ----------
  function rowHTML(g) {
    var s = stats(g), t = tk(), h = nowH(), today = isDone(g.id, t), slipped = (g.slips || []).indexOf(t) >= 0, y = plus(t, -1);
    var yAsk = !today && !slipped && h < OPEN_H && started(g) <= y && !isDone(g.id, y) && (g.slips || []).indexOf(y) < 0;
    var right;
    if (today) right = '<span class="kzq-st ok">✓ Clean today</span><button type="button" class="kzq-undo" data-q-undo="' + esc(g.id) + '">Undo</button>';
    else if (slipped) right = '<span class="kzq-st">' + (strict(g) ? 'Back to day 0' : 'Slip noted') + '</span><button type="button" class="kzq-undo" data-q-unslip="' + esc(g.id) + '">Undo</button>';
    else if (yAsk) right = '<span class="kzq-ask">Clean yesterday?</span><button type="button" class="kzq-btn ok" data-q-y="' + esc(g.id) + '">Yes</button><button type="button" class="kzq-btn" data-q-yslip="' + esc(g.id) + '">I slipped</button>';
    else if (h < OPEN_H) right = '<span class="kzq-lock" aria-label="Check-in opens at 9 PM"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>9 PM</span>';
    else right = '<button type="button" class="kzq-btn ok" data-q-clean="' + esc(g.id) + '">✓ Clean</button><button type="button" class="kzq-btn" data-q-slip="' + esc(g.id) + '">I slipped</button>';
    return '<div class="kzq-row" data-q="' + esc(g.id) + '"><a class="kzq-main" href="/pages/goal?id=' + encodeURIComponent(g.id) + '"><b>' + esc(g.name) + '</b><em>' + s.clean + (s.clean === 1 ? ' day' : ' days') + ' clean' + (s.best > s.clean ? ' · best ' + s.best : '') + '</em></a><div class="kzq-act">' + right + '</div></div>';
  }
  function today() {
    var host = document.querySelector('#kz-today-s1 .kz-tgroups'); if (!host) return;
    var qs = quits(), ids = {}; qs.forEach(function (g) { ids[g.id] = 1; });
    // hide the quit habits' own rows in the goal groups (and fix those groups' counts)
    Array.prototype.forEach.call(host.querySelectorAll('.kz-goal[data-goal]'), function (r) { r.classList.toggle('kzq-hide', !!ids[r.getAttribute('data-goal')]); });
    Array.prototype.forEach.call(host.querySelectorAll('.kz-gsec'), function (sec) {
      var rows = sec.querySelectorAll('.kz-goal[data-goal]'), vis = sec.querySelectorAll('.kz-goal[data-goal]:not(.kzq-hide)');
      sec.classList.toggle('kzq-empty', rows.length > 0 && vis.length === 0);
      if (qs.length) { var n = sec.querySelector('.kz-tsec-n'); if (n) { var dn = 0; Array.prototype.forEach.call(vis, function (r) { var b = r.querySelector('.kz-check'); if (b && b.getAttribute('aria-pressed') === 'true') dn++; }); var vn = Array.prototype.filter.call(vis, function (r) { return !r.classList.contains('kzf-is66') && !r.classList.contains('kzbd-row'); }), want = vn.length ? Array.prototype.filter.call(vn, function (r) { var b = r.querySelector('.kz-check'); return b && b.getAttribute('aria-pressed') === 'true'; }).length + ' of ' + vn.length : ''; if (n.textContent !== want) n.textContent = want; } }
    });
    // a Quit habit as Kaizen 66: its card's check is locked until 9 PM too
    var r6 = null; try { var st6 = K.k66 && K.k66.state(); r6 = st6 && st6.run; } catch (e) {}
    var lock66 = !!(r6 && ids[r6.goal] && nowH() < OPEN_H && !r6.todayDone);
    de.classList.toggle('kzq-66lock', lock66);
    var card = document.querySelector('.kzf-card, #kz-today-s1 .kzf-top'), sub = document.querySelector('.kzf-tx > span');
    if (r6 && ids[r6.goal] && sub) { var want = lock66 ? 'Check in tonight from 9 PM' : (r6.todayDone ? 'Clean today' : 'Clean today? Check in now'); if (sub.textContent !== want) sub.textContent = want; }
    var sec = document.querySelector('.kzq-sec');
    if (!qs.length) { if (sec) sec.remove(); return; }
    if (!sec) { sec = document.createElement('section'); sec.className = 'kz-tsec kzq-sec'; sec.setAttribute('aria-label', 'Quit'); host.appendChild(sec); }
    var h = '<div class="kz-tsec-h"><h2>Quit</h2><span class="kz-tsec-n">' + (nowH() < OPEN_H ? 'check in at 9 PM' : qs.filter(function (g) { return isDone(g.id, tk()) || (g.slips || []).indexOf(tk()) >= 0; }).length + ' of ' + qs.length) + '</span></div><div class="kzq-list">' + qs.map(rowHTML).join('') + '</div>';
    if (sec.__h !== h) { sec.__h = h; sec.innerHTML = h; }
  }
  function slip(id, k) { var g = goal(id); if (!g) return; var sl = (g.slips || []).slice(); if (sl.indexOf(k) < 0) sl.push(k); saveG(id, { slips: sl }); setDone(id, k, false); }
  function unslip(id, k) { var g = goal(id); if (!g) return; saveG(id, { slips: (g.slips || []).filter(function (x) { return x !== k; }) }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-q-clean],[data-q-slip],[data-q-undo],[data-q-unslip],[data-q-y],[data-q-yslip]'); if (!b) return;
    e.preventDefault(); var t = tk(), y = plus(t, -1), id;
    if ((id = b.getAttribute('data-q-clean'))) { setDone(id, t, true); unslip(id, t); post({ type: 'haptic', n: 2 }); if (K.toast) K.toast('Clean today. Keep going.'); }
    else if ((id = b.getAttribute('data-q-slip'))) { if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tap to confirm'; setTimeout(function () { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'I slipped'; } }, 3000); return; } slip(id, t); post({ type: 'haptic', n: 1 }); if (K.toast) K.toast('That\'s okay. Day 1 starts now.'); }
    else if ((id = b.getAttribute('data-q-undo'))) { setDone(id, t, false); }
    else if ((id = b.getAttribute('data-q-unslip'))) { unslip(id, t); }
    else if ((id = b.getAttribute('data-q-y'))) { setDone(id, y, true); post({ type: 'haptic', n: 2 }); }
    else if ((id = b.getAttribute('data-q-yslip'))) { slip(id, y); if (K.toast) K.toast('That\'s okay. Today counts.'); }
    fire(); setTimeout(run, 0);
  });

  // ---------- 3 · only on Today: hidden on Goals and in the Grove; names never shared ----------
  function hideElsewhere() {
    var ids = {}; quits().forEach(function (g) { ids[g.id] = 1; }); if (!Object.keys(ids).length) return;
    Array.prototype.forEach.call(document.querySelectorAll('#kz-my .kz-goal[data-goal], #kz-my [data-goal], .kzg-tree[href], .kzg-row[href], .kzg-mini[data-g], .kzpc-row[href]'), function (el) {
      var id = el.getAttribute('data-goal') || el.getAttribute('data-g'); if (!id) { var m = /[?&]id=([^&]+)/.exec(el.getAttribute('href') || ''); id = m ? decodeURIComponent(m[1]) : ''; }
      var hide = !!ids[id]; if (el.classList.contains('kzq-gone') !== hide) el.classList.toggle('kzq-gone', hide);
    });
  }
  function goalPage() {
    var page = document.getElementById('kz-goalpage'); if (!page) return;
    var id = new URLSearchParams(location.search).get('id'), g = goal(id); if (!g || !g.quit) return;
    page.classList.add('kzq-page');
    var box = page.querySelector('.kzq-gp');
    if (!box) { box = document.createElement('section'); box.className = 'kzq-gp'; var a = page.querySelector('.kz-g1stats'); if (a && a.parentNode) a.parentNode.insertBefore(box, a); else page.appendChild(box); }
    var s = stats(g), h = '<div class="kzq-big"><b>' + s.clean + '</b><span>' + (s.clean === 1 ? 'day clean' : 'days clean') + '</span></div>' +
      '<p class="kzq-gl">Best run: ' + s.best + (s.best === 1 ? ' day' : ' days') + (s.slips ? ' · ' + s.slips + (s.slips === 1 ? ' slip' : ' slips') + ', and you kept going' : '') + '</p>' +
      (g.why ? '<p class="kzq-why2">Why: ' + esc(g.why) + '</p>' : '') +
      (SUBST.test(g.name) ? '<a class="kzq-help" href="tel:18006624357">Need support? Free, confidential help, 24/7: 1-800-662-4357 (SAMHSA)</a>' : '');
    if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
  }
  // share text: a Kaizen 66 run on a Quit habit is never named
  function wrapShare() {
    if (!K.shareText || K.shareText.__quit) return;
    var f = K.shareText, w = function () { var t = f.apply(this, arguments); quits().forEach(function (g) { if (g.name && t.indexOf(g.name) >= 0) t = t.replace(': ' + g.name, '').split(g.name).join('a habit'); }); return t; };
    w.__quit = 1; K.shareText = w;
  }
  try { if (navigator.share && !navigator.share.__quit) { var ns = navigator.share, wq = function (d) { if (d && typeof d.text === 'string') { var t = d.text; quits().forEach(function (g) { t = t.replace(': ' + g.name, '').split(g.name).join('a habit'); }); var o = {}; for (var k in d) o[k] = d[k]; o.text = t; d = o; } return ns.call(navigator, d); }; wq.__quit = 1; navigator.share = wq; } } catch (e) {}

  var queued = 0;
  function run() { queued = 0; try { addSeg(); wrapAdd(); wrapShare(); today(); hideElsewhere(); goalPage(); } catch (e) {} }
  function soon() { if (queued) return; queued = requestAnimationFrame(run); }
  function boot() {
    run();
    new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && t.closest('.kzq-sec, .kzq-gp')) continue; if (quits().length) { try { today(); hideElsewhere(); } catch (e) {} } soon(); return; } }).observe(document.body, { childList: true, subtree: true });
    setInterval(function () { var h = nowH(); if (h !== boot.h) { boot.h = h; soon(); } }, 30000); boot.h = nowH();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kz:goals', 'kz:changed', 'kz:step', 'kz:k66'].forEach(function (n) { document.addEventListener(n, soon); });
})();
