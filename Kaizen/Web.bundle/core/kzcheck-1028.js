/* kzcheck-1028.js · Oct 28 Stage C: replaces 871e20c7e358.js (same code; complete() reworked so a check-off paints first). */

(function () {
  var K = window.KZ; if (!K) return;
  var MI = (function () { var w = function (d) { return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
    return { eye: w('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'), pen: w('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/>'),
      up: w('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: w('<path d="M12 5v14M6 13l6 6 6-6"/>'), bin: w('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>') }; })();
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGES = [[1, 'First step', 'You started. Most people never do.'], [3, '3 days', 'Three times. It is becoming real.'], [5, '5 days', 'Five days. You are building trust with yourself.'], [7, '1 week', 'One week. This is who you are now.'], [14, '2 weeks', 'Two weeks. Your days are changing.'], [21, '3 weeks', 'Three weeks. It is starting to stick.'], [30, '1 month', 'A month. Look how far you have come.'], [50, '50 days', 'Fifty days of quiet, steady growth.'], [66, 'Habit', 'Habit formed. It is part of you now.'], [100, '100 days', 'One hundred days. A different person.'], [180, '6 months', 'Half a year of getting better.'], [365, '1 year', 'One year. Your tree is ancient now.']];
  function doneDays(id) { var d = (K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {}; return Object.keys(d[id] || {}).length; }
  function stage(n) {
    var cur = null, next = STAGES[0];
    for (var i = 0; i < STAGES.length; i++) { if (n >= STAGES[i][0]) { cur = STAGES[i]; next = STAGES[i + 1] || null; } }
    var from = cur ? cur[0] : 0, to = next ? next[0] : from;
    return { name: cur ? cur[1] : 'Not started', next: next, pct: next ? Math.round(((n - from) / (to - from)) * 100) : 100 };
  }
  function weekHTML(id) {
    var t = K.today(), out = '', L = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (var i = 6; i >= 0; i--) {
      var d = K.addDays(t, -i), k = K.key(d), on = K.isDone(id, k);
      out += '<span class="kz-day' + (on ? ' on' : '') + (i === 0 ? ' today' : '') + '" data-day="' + k + '"><i></i><b>' + L[d.getDay()] + '</b></span>';
    }
    return '<div class="kz-week" aria-label="Last 7 days">' + out + '</div>';
  }
  function msHTML(id) {
    var n = doneDays(id), s = stage(n);
    var left = s.next ? s.next[0] - n : 0;
    var txt = n === 0 ? 'Your first step starts it all.' : (s.next ? s.name + ' · ' + left + ' more ' + (left === 1 ? 'day' : 'days') + ' to ' + s.next[1] : s.name + ' · ' + n + ' days');
    return '<div class="kz-ms"><div class="kz-ms-bar"><i style="width: ' + s.pct + '%"></i></div><span class="kz-ms-t">' + txt + '</span></div>';
  }
  function pathTag(g) { var id = K.pathOf ? K.pathOf(g) : '', p = (K.PATHS || []).filter(function (x) { return x.id === id; })[0]; return p ? '<span class="kz-tag" style="color: ' + p.c1 + '; border-color: ' + p.c2 + '">' + p.name + '</span>' : ''; }
  // Inline edit form for one goal (hidden until the pencil is tapped).
  function editHTML(g) {
    var cur = K.pathOf ? K.pathOf(g) : '';
    var chips = (K.PATHS || []).map(function (p) { return '<button type="button" class="kz-pathchip" data-epath="' + p.id + '" aria-pressed="' + (p.id === cur) + '"><i style="background: ' + p.c2 + '"></i>' + p.name + '</button>'; }).join('');
    return '<form class="kz-editbox" data-kz-editform="' + g.id + '" hidden>' +
      '<label class="kz-label">Goal<input class="kz-input" name="name" maxlength="90" required value="' + K.esc(g.name) + '"></label>' +
      '<label class="kz-label">Daily small step <i class="kz-opt">(optional)</i><input class="kz-input" name="step" maxlength="140" placeholder="Ex. Run 2 easy miles" value="' + K.esc(g.step || '') + '"></label>' +
      '<label class="kz-label">When: after I… <i class="kz-opt">(optional)</i><input class="kz-input" name="cue" maxlength="80" placeholder="pour my morning coffee" value="' + K.esc(g.cue || '') + '"></label>' +
      '<label class="kz-label">Bad-day version <i class="kz-opt">(optional)</i><input class="kz-input" name="mini" maxlength="80" placeholder="Put on my running shoes" value="' + K.esc(g.mini || '') + '"></label>' +
      '<div class="kz-row" role="group" aria-label="Type" style="justify-content: center; gap: 8px"><button type="button" class="kz-chip" data-ekind="long" aria-pressed="' + (g.kind !== 'daily') + '">Long-term</button><button type="button" class="kz-chip" data-ekind="daily" aria-pressed="' + (g.kind === 'daily') + '">Daily habit</button></div>' +
      '<div class="kz-paths" role="group" aria-label="Branch">' + chips + '</div>' +
      '<div class="kz-logrow"><span><b>Keep a journal for this goal</b><small>A daily note box just for this goal. Private.</small></span><button type="button" class="kz-switch kz-sw2" role="switch" data-elog aria-checked="' + !!g.log + '" aria-label="Keep a journal for this goal"></button></div>' +
      '<span class="kz-note">Progress and notes stay with this goal.</span>' +
      '<div class="kz-row" style="justify-content: center; gap: 8px"><button type="button" class="kz-btn ghost" data-kz-edit-no>Cancel</button><button type="submit" class="kz-btn">Save</button></div>' +
      '</form>';
  }
  // ---------- Goal order: saved separately so it syncs as one unit (newest order wins) ----------
  var rawGoals = K.goals;
  K.goals = function () {
    var g = rawGoals(), o = (K.get('gorder', null) || {}).ids || [], pos = {};
    o.forEach(function (id, i) { pos[id] = i; });
    return g.map(function (x, i) { return { g: x, i: i, p: x.id in pos ? pos[x.id] : 1e6 + i }; }).sort(function (a, b) { return a.p - b.p; }).map(function (x) { return x.g; });
  };
  K.setGoalOrder = function (ids) { K.set('gorder', { t: Date.now(), ids: ids }); document.dispatchEvent(new Event('kz:goals')); };
  // Move within the goals the person can see (a pillar filter hides others; their slots stay put).
  K.reorderVisible = function (visibleIds) {
    var all = K.goals().map(function (g) { return g.id; }), vis = {}, q = visibleIds.slice();
    visibleIds.forEach(function (id) { vis[id] = 1; });
    K.setGoalOrder(all.map(function (id) { return vis[id] ? q.shift() : id; }));
  };
  K.moveGoal = function (id, dir, visibleIds) {
    var ids = (visibleIds || K.goals().map(function (g) { return g.id; })).slice(), i = ids.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return false;
    ids.splice(i, 1); ids.splice(j, 0, id); K.reorderVisible(ids); K.track('kz_goal_moved'); return true;
  };

  var CHECK = '<svg class="kz-chk" viewBox="0 0 24 24" aria-hidden="true"><circle class="kz-chk-ring" cx="12" cy="12" r="10.5"/><path class="kz-chk-mark" d="M7 12.6l3.3 3.3L17.2 8.8"/></svg>';
  function dotsHTML(id) {
    var t = K.today(), out = '';
    for (var i = 6; i >= 0; i--) { var k = K.key(K.addDays(t, -i)); out += '<i class="' + (K.isDone(id, k) ? 'on' : '') + (i === 0 ? ' today' : '') + '"></i>'; }
    return '<span class="kz-gdots" aria-label="Last 7 days">' + out + '</span>';
  }
  // ---------- Goal notes (a journal for each goal) and stats ----------
  K.gnotes = function (id) { return (K.get('gnotes', {}) || {})[id] || {}; };
  K.setGNote = function (id, day, text) {
    var all = K.get('gnotes', {}) || {}, v = String(text || '').replace(/\s+$/, '');
    all[id] = all[id] || {}; if (v.trim()) all[id][day] = v; else delete all[id][day];
    K.set('gnotes', all); document.dispatchEvent(new CustomEvent('kz:gnote', { detail: { id: id, day: day } }));
  };
  K.goalStats = function (g) {
    var d = (K.get('done', {}) || {})[g.id] || {}, days = Object.keys(d).filter(function (k) { return d[k]; }).sort(), set = {}, best = 0, run = 0, prev = null;
    days.forEach(function (k) { set[k] = 1; var dt = new Date(k + 'T12:00:00'); run = prev && Math.round((dt - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = dt; });
    var t = K.today(), c = set[K.key(t)] ? t : K.addDays(t, -1), cur = 0; while (set[K.key(c)]) { cur++; c = K.addDays(c, -1); }
    var since = (g.created || days[0] || K.key(t)).slice(0, 10);
    return { done: days.length, streak: cur, best: best, since: since, first: days[0] || null, set: set };
  };
  var fmtShort = function (k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
  K.goalStatLine = function (g) { var s = K.goalStats(g); return s.done + (s.done === 1 ? ' day' : ' days') + ' done · ' + s.streak + '-day streak · since ' + fmtShort(s.since); };
  K.noteBoxHTML = function (g, day) {
    day = day || K.key(K.today()); var v = K.gnotes(g.id)[day] || '';
    return '<div class="kz-gnote" data-gnote="' + g.id + '" data-day="' + day + '"><label class="kz-label" for="kz-gn-' + g.id + '-' + day + '">Today’s note</label>' +
      '<textarea id="kz-gn-' + g.id + '-' + day + '" class="kz-jbox kz-gnbox" rows="2" placeholder="How did ‘' + K.esc(K.stepFor(g) || g.name) + '’ go?">' + K.esc(v) + '</textarea>' +
      '<div class="kz-gnrow"><span class="kz-note kz-gnsaved" aria-live="polite"></span><button type="button" class="kz-btn kz-gnsave" data-gnsave>' + (v ? 'Update note' : 'Save note') + '</button></div></div>';
  };
  K.gxHTML = function (g) {
    var n66 = doneDays(g.id), p66 = Math.min(100, Math.round(n66 / 66 * 100));
    return '<div class="kz-gx"><span class="kz-gxstats">' + K.goalStatLine(g) + '</span>' +
      '<div class="kz-auto"><div class="kz-auto-top"><b>' + (n66 >= 66 ? 'Past day 66' : 'Day ' + n66 + ' of ~66') + '</b><span>' + (n66 >= 66 ? 'Most habits feel automatic by now.' : 'On average, a habit starts to feel automatic around day 66.') + '</span></div><div class="kz-auto-bar" role="progressbar" aria-label="Days toward an automatic habit" aria-valuemin="0" aria-valuemax="66" aria-valuenow="' + Math.min(66, n66) + '"><i style="width: ' + p66 + '%"></i></div></div>' +
      (g.mini && !K.isDone(g.id) ? '<button type="button" class="kz-btn ghost kz-minibtn" data-kz-mini="' + g.id + '">Did the 2-minute version: ' + K.esc(g.mini) + '</button>' : '') +
      (g.log ? K.noteBoxHTML(g) : '<button type="button" class="kz-quiet gold kz-gxlog" data-kz-logon="' + g.id + '">+ Keep a journal for this goal</button>') +
      '<a class="kz-quiet gold kz-gxview" href="/pages/goal?id=' + encodeURIComponent(g.id) + '">View goal →</a></div>';
  };
  var openId = null; // one expanded row at a time; stays open across re-renders this visit
  K.cardHTML = function (g, opts) {
    opts = opts || {}; var d = K.isDone(g.id), n = doneDays(g.id), s = stage(n);
    var pid = K.pathOf ? K.pathOf(g) : '', P = (K.PATHS || []).filter(function (x) { return x.id === pid; })[0];
    var left = s.next ? s.next[0] - n : 0, st = n ? s.name + (s.next ? ' · ' + left + (left === 1 ? ' day' : ' days') + ' to ' + s.next[1] : '') : 'Day one';
    var meta = opts.showTag && P ? '<b class="kz-gpill" style="color: ' + P.c1 + '"><i style="background: ' + P.c2 + '"></i>' + K.esc(P.name) + '</b>' : '';
    var open = openId === g.id, hasNotes = Object.keys(K.gnotes(g.id)).length > 0;
    var NOTE = hasNotes ? '<svg class="kz-gnicon" aria-label="Has notes" viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z M15 4v4h4 M8 12h8 M8 16h6"/></svg>' : '';
    var compact = g.kind !== 'daily' && !opts.noCompact && !!(K.get('gcompact', {}) || {})[g.id]; if (compact) open = false;
    return '<div class="kz-goal kz-grow' + (d ? ' is-done' : '') + (open ? ' open' : '') + (compact ? ' compact' : '') + '" data-goal="' + g.id + '"' + (P ? ' style="--pc: ' + P.c2 + '"' : '') + '>' +
      '<button type="button" class="kz-ghandle" data-kz-drag="' + g.id + '" aria-label="Reorder ' + K.esc(g.name) + '. Use arrow keys to move." title="Drag to reorder"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></button>' +
      '<div class="kz-gbody" role="button" tabindex="0" data-kz-expand aria-expanded="' + (g.kind === 'daily' ? open : !compact) + '" aria-label="' + K.esc(g.name) + (g.kind === 'daily' ? (open ? '. Tap to collapse.' : '. Tap to show more.') : (compact ? '. Tap to show today\u2019s step.' : '. Tap to fold to the title.')) + '"><span class="kz-gname">' + K.esc(g.name) + '</span>' + (g.cue ? '<span class="kz-gcue">After I ' + K.esc(g.cue.replace(/^after i\s+/i, '')) + '</span>' : '') + (K.miniToday && K.miniToday(g.id) ? '<span class="kz-gmini2">2-min version</span>' : '') + (g.kind === 'daily' ? '' : '<span class="kz-gstep kz-gsub"><i>Daily</i><span>' + K.esc(K.stepFor(g)) + '</span></span>') +
        '<span class="kz-gline">' + dotsHTML(g.id) + meta + NOTE + '<span class="kz-gstage">' + st + '</span><svg class="kz-gchev" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span>' +
        '<span class="kz-gfloat" aria-live="polite"></span></div>' +
      '<button type="button" class="kz-gmore" data-kz-more="' + g.id + '" aria-haspopup="true" aria-expanded="false" aria-label="More for ' + K.esc(g.name) + '"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>' +
      '<button type="button" class="kz-check' + (d ? ' done' : '') + '" data-kz-done="' + g.id + '" aria-pressed="' + d + '" aria-label="' + (d ? 'Completed today. Tap to undo: ' : 'Complete today’s step: ') + K.esc(g.name) + '">' + CHECK + '<span class="kz-hold-lbl">' + (d ? 'Completed ✓' : 'Complete') + '</span></button>' +
      '<div class="kz-gmenu kz-gm2" role="menu" hidden>' +
        '<a role="menuitem" href="/pages/goal?id=' + encodeURIComponent(g.id) + '"><span>View goal</span>' + MI.eye + '</a>' +
        '<button type="button" role="menuitem" data-kz-edit="' + g.id + '"><span>Edit</span>' + MI.pen + '</button>' +
        (g.kind === 'daily' ? '' : '<button type="button" role="menuitem" class="kz-gm-won" data-kz-won="' + g.id + '"><span>Goal achieved</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 12v4M8 20h8M9.5 16h5v4h-5z"/></svg></button>') +
        '<div class="kz-gm-move" role="group" aria-label="Reorder"><button type="button" role="menuitem" data-kz-move="-1" aria-label="Move up">' + MI.up + '<span>Up</span></button><button type="button" role="menuitem" data-kz-move="1" aria-label="Move down">' + MI.down + '<span>Down</span></button></div>' +
        '<button type="button" role="menuitem" class="kz-gm-del" data-kz-del="' + g.id + '"><span>Archive or delete</span>' + MI.bin + '</button></div>' +
      '<div class="kz-gswipe" aria-hidden="true"><button type="button" tabindex="-1" class="arch" data-kz-sw-arch="' + g.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10h14V9M10 13h4"/></svg>Archive</button><button type="button" tabindex="-1" class="del" data-kz-sw-del="' + g.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>Delete</button></div>' +
      (open ? K.gxHTML(g) : '') +
      editHTML(g) +
      '<div class="kz-delbox" hidden><span class="kz-delq">Archive this goal instead?</span><span>Archiving keeps every step and leaf. Deleting erases this goal’s progress for good.</span><div class="kz-row" style="justify-content: center; gap: 8px; flex-wrap: wrap"><button type="button" class="kz-btn ghost" data-kz-del-no>Keep</button><button type="button" class="kz-btn" data-kz-arch="' + g.id + '">Archive</button><button type="button" class="kz-btn kz-danger" data-kz-del-yes="' + g.id + '">Delete</button></div><span class="kz-note" data-kz-del-sure hidden>Tap Delete again to erase it.</span></div>' +
      '</div>';
  };

  // Bonsai: one leaf for every step taken. Leaves fill five foliage pads.
  var PADS = [[98, 58, 30, 12], [62, 88, 22, 10], [138, 74, 19, 9], [74, 66, 16, 8], [124, 56, 16, 8]];
  var LEAVES = (function () {
    var per = 30, ga = Math.PI * (3 - Math.sqrt(5)), order = [], pts = [];
    for (var b = 0; b < 32; b++) { var r = parseInt(('00000' + b.toString(2)).slice(-5).split('').reverse().join(''), 2); if (r < per) order.push(r); }
    for (var k = 0; k < per; k++) for (var q = 0; q < PADS.length; q++) {
      var p = PADS[q], j = order[k], rr = Math.sqrt((j + 0.5) / per) * 0.92, a = j * ga + q;
      pts.push([p[0] + Math.cos(a) * rr * p[2], p[1] + Math.sin(a) * rr * p[3]]);
    }
    return pts;
  })();
  K.totalSteps = function () { var d = K.get('done', {}), n = 0; for (var id in d) n += Object.keys(d[id] || {}).length; return n; };
  K.bonsaiSVG = function (n, fresh) {
    // Detailed bonsai: bark-textured trunk with roots, layered foliage pads, real leaf shapes in three shades,
    // glazed pot. One leaf per step; past the last leaf, small blossoms open.
    var shown = Math.min(n, LEAVES.length), blossoms = Math.max(0, n - LEAVES.length), i;
    var rnd = function (s) { var x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
    var leafPath = 'M0 -5.2 C2.8 -3.2 3 1.8 0 5.2 C-3 1.8 -2.8 -3.2 0 -5.2Z';
    // foliage pads: dark underside clusters + lighter tops
    var pads = PADS.map(function (p, q) {
      var out = '';
      for (var c = 0; c < 7; c++) { var a = c / 7 * Math.PI * 2 + q, rx = p[2] * (0.55 + 0.25 * rnd(q * 9 + c)), cx = p[0] + Math.cos(a) * p[2] * 0.55, cy = p[1] + Math.sin(a) * p[3] * 0.5 + 2;
        out += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + (rx * 0.62).toFixed(1) + '" fill="#0C2A1C"/>'; }
      out += '<ellipse cx="' + p[0] + '" cy="' + (p[1] - p[3] * 0.25) + '" rx="' + (p[2] * 0.95) + '" ry="' + (p[3] * 0.85) + '" fill="#123A28"/>';
      out += '<ellipse cx="' + (p[0] - p[2] * 0.15) + '" cy="' + (p[1] - p[3] * 0.55) + '" rx="' + (p[2] * 0.6) + '" ry="' + (p[3] * 0.45) + '" fill="#18503A" opacity=".8"/>';
      return out;
    }).join('');
    var leaves = '';
    for (i = 0; i < shown; i++) {
      var L = LEAVES[i], pad = PADS[i % PADS.length], ang = Math.atan2(L[1] - pad[1] + 6, L[0] - pad[0]) * 180 / Math.PI + 90 + (rnd(i) - 0.5) * 50;
      var shade = L[1] < pad[1] - pad[3] * 0.2 ? 'a' : (L[1] > pad[1] + pad[3] * 0.3 ? 'c' : 'b'), sc = (n > 60 ? 0.95 : 1.15) * (0.85 + rnd(i + 3) * 0.3);
      var isNew = fresh && i === shown - 1;
      leaves += '<g transform="translate(' + L[0].toFixed(1) + ' ' + L[1].toFixed(1) + ')"><g class="' + (isNew ? 'kz-leaf new' : 'kz-leaf') + '"><path d="' + leafPath + '" transform="rotate(' + ang.toFixed(0) + ') scale(' + sc.toFixed(2) + ')" fill="url(#kzl' + shade + ')"/>' +
        '<path d="M0 -4 L0 4" transform="rotate(' + ang.toFixed(0) + ') scale(' + sc.toFixed(2) + ')" stroke="#0E3B27" stroke-width=".5" opacity=".55"/></g>' +
        (isNew ? '<circle class="kz-leaf-ring" r="9" fill="none" stroke="#9BEFC0" stroke-width="1.2"/><g class="kz-leaf-sparks"><circle cx="-5" cy="-2" r=".9" fill="#E9FFF3"/><circle cx="4" cy="-4" r=".7" fill="#E9FFF3"/><circle cx="1" cy="3" r=".8" fill="#E9FFF3"/></g>' : '') + '</g>';
    }
    var flowers = '';
    for (i = 0; i < Math.min(blossoms, 60); i++) {
      var B = LEAVES[(i * 7) % LEAVES.length], fx = B[0] + (rnd(i + 11) - 0.5) * 3, fy = B[1] - 1.5, pet = '';
      for (var k = 0; k < 5; k++) { var aa = k * 72 * Math.PI / 180; pet += '<circle cx="' + (fx + Math.cos(aa) * 1.5).toFixed(2) + '" cy="' + (fy + Math.sin(aa) * 1.5).toFixed(2) + '" r="1.25" fill="#FFF4F0"/>'; }
      flowers += pet + '<circle cx="' + fx.toFixed(2) + '" cy="' + fy.toFixed(2) + '" r=".8" fill="#E8C66A"/>';
    }
    var trunk =
      // roots flaring into the soil
      '<path d="M86 150 C 92 146, 95 140, 97 132 L 107 132 C 108 140, 111 146, 118 150 Z" fill="url(#kzbark)"/>' +
      // tapered trunk with a gentle S-curve
      '<path d="M96 134 C 92 122, 112 118, 103 104 C 97 95, 92 86, 97 66 L 101 66 C 98 86, 104 94, 109 103 C 118 118, 101 124, 108 134 Z" fill="url(#kzbark)"/>' +
      // main branches, tapering
      '<path d="M101 112 C 88 108, 75 101, 63 90" stroke="url(#kzbark)" stroke-width="4.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M105 101 C 118 97, 129 90, 138 77" stroke="url(#kzbark)" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M99 86 C 90 80, 82 74, 75 67" stroke="url(#kzbark)" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M101 78 C 110 72, 118 64, 124 57" stroke="url(#kzbark)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      // bark texture
      '<path d="M100 128 C 98 122, 104 118, 102 112 M104 100 C 101 95, 98 90, 99 80" stroke="#4E3518" stroke-width=".8" fill="none" opacity=".6"/>' +
      '<path d="M103 126 C 106 120, 108 116, 106 110" stroke="#C49A5B" stroke-width=".7" fill="none" opacity=".45"/>';
    var pot =
      '<ellipse cx="100" cy="150" rx="34" ry="3.5" fill="#24331F"/>' +   // soil
      '<path d="M76 149 C 84 145, 92 147, 98 148 C 106 146, 116 145, 124 149 Z" fill="#2F5A35" opacity=".9"/>' + // moss
      '<rect x="58" y="149" width="84" height="7" rx="1.5" fill="url(#kzrim)"/>' +
      '<path d="M62 156 H138 L132 171 C131.4 172.4 130.2 173 128.8 173 H71.2 C69.8 173 68.6 172.4 68 171 Z" fill="url(#kzpot)"/>' +
      '<path d="M66 159.5 H134" stroke="#D9CFB9" stroke-width="1.2"/>' +
      '<rect x="71" y="173" width="9" height="3" rx="1" fill="#B8912F"/><rect x="120" y="173" width="9" height="3" rx="1" fill="#B8912F"/>';
    return '<svg class="kz-bonsai" viewBox="30 30 140 150" role="img" aria-label="Bonsai with ' + n + ' leaves">' +
      '<defs>' +
      '<linearGradient id="kzla" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9F5D2"/><stop offset="1" stop-color="#3FBF7F"/></linearGradient>' +
      '<linearGradient id="kzlb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FDDA1"/><stop offset="1" stop-color="#1F9A62"/></linearGradient>' +
      '<linearGradient id="kzlc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3FBF7F"/><stop offset="1" stop-color="#0F6E44"/></linearGradient>' +
      '<linearGradient id="kzbark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A3D1E"/><stop offset=".55" stop-color="#8A6A33"/><stop offset="1" stop-color="#4A3218"/></linearGradient>' +
      '<linearGradient id="kzpot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F0E2"/><stop offset="1" stop-color="#D8CDB4"/></linearGradient>' +
      '<linearGradient id="kzrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0D57A"/><stop offset="1" stop-color="#B8912F"/></linearGradient>' +
      '<radialGradient id="kzglow"><stop offset="0" stop-color="#3FBF7F" stop-opacity=".22"/><stop offset="1" stop-color="#3FBF7F" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="100" cy="78" rx="72" ry="54" fill="url(#kzglow)"/>' + trunk + pads + leaves + flowers + pot + '</svg>';
  };

  // Sound (off by default): a soft two-note chime.
  K.sound = function () {
    if (!K.get('sound', 1)) return;
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      var ctx = K._ac || (K._ac = new C()), t = ctx.currentTime;
      [[660, 0], [990, 0.09]].forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = n[0]; g.gain.setValueAtTime(0.0001, t + n[1]);
        g.gain.exponentialRampToValueAtTime(0.07, t + n[1] + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.5);
        o.connect(g); g.connect(ctx.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.55);
      });
    } catch (e) {}
  };

  // ---------- One tap to complete ----------
  var LEAF = 'M0 -5 C2.6 -3 2.8 1.7 0 5 C-2.8 1.7 -2.6 -3 0 -5Z';
  function leafBurst(el) {
    if (reduce || !el.animate) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 6; i++) {
      var look = K.leafLook ? K.leafLook() : { path: LEAF, colors: ['#2FD38A', '#2FD38A', '#2FD38A'] };
      var p = document.createElement('span'); p.className = 'kz-leafp'; p.innerHTML = '<svg viewBox="-6 -6 12 12"><path d="' + look.path + '" fill="' + look.colors[i % 3] + '"/></svg>';
      p.style.left = cx + 'px'; p.style.top = cy + 'px'; document.body.appendChild(p);
      var a = -Math.PI / 2 + (i - 2.5) * 0.5 + (Math.random() - 0.5) * 0.3, d = 34 + Math.random() * 22, rot = (Math.random() - 0.5) * 220;
      var an = p.animate([{ transform: 'translate(-50%,-50%) rotate(0deg) scale(.6)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + (Math.cos(a) * d).toFixed(1) + 'px), calc(-50% + ' + (Math.sin(a) * d).toFixed(1) + 'px)) rotate(' + rot.toFixed(0) + 'deg) scale(1)', opacity: 0 }], { duration: 560 + Math.random() * 160, easing: 'cubic-bezier(.2,.8,.2,1)' });
      an.onfinish = (function (n) { return function () { n.remove(); }; })(p);
    }
  }
  var undoEl = null, undoT = null;
  function undoChip(id, name) {
    if (!undoEl) { undoEl = document.createElement('div'); undoEl.className = 'kz-undo'; undoEl.setAttribute('role', 'status'); document.body.appendChild(undoEl); }
    var g = K.goals().filter(function (x) { return x.id === id; })[0], note = g && g.log && !document.querySelector('[data-no-expand]');
    undoEl.innerHTML = '<span>Completed · ' + K.esc(name.length > (note ? 14 : 26) ? name.slice(0, note ? 13 : 25) + '…' : name) + '</span>' + (note ? '<button type="button" class="kz-undo-note" data-kz-addnote="' + id + '">Add note</button>' : '') + '<button type="button" data-kz-undo="' + id + '">Undo</button><button type="button" class="kz-undo-x" data-kz-undo-x aria-label="Dismiss"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg></button>';
    undoY = scrollY; undoEl.classList.add('show'); document.body.classList.add('kz-undo-on'); clearTimeout(undoT); undoT = setTimeout(hideUndo, note ? 6000 : 5000);   // Oct 23: 5 s, long enough to notice and reach Undo
  }
  var undoY = 0; addEventListener('scroll', function () { if (undoEl && undoEl.classList.contains('show') && Math.abs(scrollY - undoY) > 60) hideUndo(); }, { passive: true });
  function hideUndo() { clearTimeout(undoT); if (undoEl) undoEl.classList.remove('show'); document.body.classList.remove('kz-undo-on'); }
  function setRow(id, on) {
    document.querySelectorAll('.kz-grow[data-goal="' + id + '"]').forEach(function (row) {
      row.classList.toggle('is-done', on); var b = row.querySelector('.kz-check');
      b.classList.toggle('done', on); b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? 'Completed today. Tap to undo: ' : 'Complete today’s step: ') + row.querySelector('.kz-gname').textContent);
      b.querySelector('.kz-hold-lbl').textContent = on ? 'Completed ✓' : 'Complete';
      var dot = row.querySelector('.kz-gdots i.today'); if (dot) dot.classList.toggle('on', on);
    });
  }
  function grewText() {
    var due = K.goals().length || 1, n = K.treeNamed && K.treeNamed() ? K.treeName() : 'Your tree';
    var mx = K.growMult ? K.growMult(K.key(K.today())) : 1; /* Oct 21: plan multiplier boosts each check-off */
    return '+' + (K.treeInches ? K.treeInches(mx / due) : '1 step') + (mx > 1 ? ' · ×' + (Math.round(mx * 10) / 10) : '') + ' · ' + n + ' grew';
  }
  // Oct 28 · Stage C (kzcheck-1028.js replaces 871e20c7e358.js): a check-off draws in the very next frame.
  // Before, the tap did everything at once before the phone could paint: two forced layouts (to restart the pop
  // animation and the "+ grew" float), the chime, the leaf burst, the undo chip, the falling leaves and the rain over the
  // tree — 200 ms+ on a slow phone before the check even showed. Now the tap only saves, marks the row and starts the pop;
  // everything that reacts to the step (counts, headings, glide) still hears kz:step in the same frame so the screen
  // changes once, and the decorations follow right after that frame is on screen.
  function afterPaint(fn) { requestAnimationFrame(function () { setTimeout(fn, 0); }); }
  function restart(el, cls) {
    if (!el.classList.contains(cls)) { el.classList.add(cls); return; }
    el.classList.remove(cls); requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add(cls); }); });
  }
  function complete(btn) {
    var id = btn.dataset.kzDone, row = btn.closest('.kz-goal'), before = K.shownDays().length;
    K.toggleDone(id); var after = K.shownDays().length;
    setRow(id, true);
    restart(btn, 'pop');
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    // decorations asked for while the step is being handled wait until the check is on screen
    var q = [], lf = K.leafFall, rn = K.rain;
    if (lf) K.leafFall = function () { q.push([lf, arguments]); };
    if (rn) K.rain = function () { q.push([rn, arguments]); };
    try { document.dispatchEvent(new CustomEvent('kz:step', { detail: { id: id, newDay: after > before, newLeaf: true } })); }
    finally { if (lf) K.leafFall = lf; if (rn) K.rain = rn; }
    var all = K.goals(), tk = K.key(K.today()), allDone = false;
    if (all.length && all.every(function (x) { return K.isDone(x.id); }) && K.get('alldone', '') !== tk) { K.set('alldone', tk); allDone = true; }
    afterPaint(function () {
      K.sound(); leafBurst(btn);
      q.forEach(function (c) { try { c[0].apply(K, c[1]); } catch (e) {} });
      if (row) { var f = row.querySelector('.kz-gfloat'); if (f) { f.textContent = grewText(); restart(f, 'show'); } }
      var g = K.goals().filter(function (x) { return x.id === id; })[0]; if (K.isDone(id)) undoChip(id, g ? g.name : 'goal');
      // Every goal done today: one bigger moment, once a day.
      if (allDone) { document.dispatchEvent(new CustomEvent('kz:alldone')); K.track('kz_all_done', { goals: all.length }); }
    });
  }
  function undo(id) {
    if (!K.isDone(id)) return; K.toggleDone(id); var mm = K.get('mini', {}) || {}; if (mm[id]) { delete mm[id][K.key(K.today())]; K.set('mini', mm); } setRow(id, false); hideUndo();
    if (K.get('alldone', '') === K.key(K.today())) K.set('alldone', '');
    document.dispatchEvent(new CustomEvent('kz:changed'));
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('.kz-check'); if (c) { if (c.classList.contains('done')) undo(c.dataset.kzDone); else complete(c); return; }
    if (e.target.closest('[data-kz-undo-x]')) { hideUndo(); return; }
    var u = e.target.closest('[data-kz-undo]'); if (u) { undo(u.dataset.kzUndo); return; }
    var an = e.target.closest('[data-kz-addnote]'); if (an) { hideUndo(); K.openGoalNote(an.dataset.kzAddnote); return; }
  });

  // ---------- ⋯ opens a bottom sheet in the app's own style; each row presses the matching item in the goal's hidden menu ----------
  var GS = null;
  function goalSheet(more) {
    var card = more.closest('.kz-goal'), m = card && card.querySelector('.kz-gmenu'); if (!m) return;
    var g = K.goals().filter(function (x) { return x.id === card.dataset.goal; })[0] || {};
    if (!GS) {
      GS = document.createElement('div'); GS.className = 'kz-sheet49 kz-gsheet'; GS.setAttribute('role', 'dialog'); GS.setAttribute('aria-modal', 'true'); GS.hidden = true;
      document.body.appendChild(GS);
      GS.addEventListener('click', function (e) {
        if (e.target === GS || e.target.closest('[data-gs-x]')) { closeGS(); return; }
        // Oct 21: "Archive or delete" asks right here in the sheet; nothing scrolls or jumps
        if (e.target.closest('[data-gs-no]')) { var ak = GS.querySelector('.kz-gm-ask'); if (ak) { if (ak.previousElementSibling) ak.previousElementSibling.hidden = false; ak.remove(); } return; }
        var aA = e.target.closest('[data-gs-arch]'), aD = e.target.closest('[data-gs-del]');
        if (aA || aD) {
          if (aD && !aD.classList.contains('sure')) { aD.classList.add('sure'); aD.textContent = 'Delete for good'; try { navigator.vibrate(8); } catch (er) {} return; }
          var gc = GS._card, gid = gc && gc.dataset.goal; closeGS(); if (!gid) return; if (gc.isConnected) gc.classList.add('kz-gone');
          setTimeout(function () { if (aA) K.archiveGoal(gid); else K.removeGoal(gid); K.track(aA ? 'kz_goal_archived' : 'kz_goal_deleted'); document.dispatchEvent(new CustomEvent('kz:changed')); }, reduce ? 0 : 260);
          return;
        }
        var b = e.target.closest('[data-gs]'); if (!b || !GS._items) return; var orig = GS._items[+b.dataset.gs], c = GS._card;
        if (orig && orig.classList.contains('kz-gm-del')) {
          if (b.nextElementSibling && b.nextElementSibling.classList.contains('kz-gm-ask')) return;
          var ask = document.createElement('div'); ask.className = 'kz-gm-ask'; ask.setAttribute('role', 'group');
          ask.innerHTML = '<p>Archive or delete this goal?<small>Archive keeps every step and leaf. Delete erases its progress for good.</small></p><div><button type="button" data-gs-arch>Archive</button><button type="button" data-gs-del>Delete</button></div><button type="button" data-gs-no>Cancel</button>';
          b.hidden = true; b.parentNode.insertBefore(ask, b.nextSibling); try { navigator.vibrate(4); } catch (er) {} return;
        }
        closeGS();
        setTimeout(function () { orig.click(); var box = c && c.isConnected && c.querySelector('.kz-editbox:not([hidden]), .kz-delbox:not([hidden])'); if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, reduce ? 0 : 180);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && GS && !GS.hidden) closeGS(); });
    }
    var items = [], row = function (el, tone) { items.push(el); var sp = el.querySelector('span'), sv = el.querySelector('svg');
      return '<button type="button" class="kz-gs-row ' + (tone || '') + '" data-gs="' + (items.length - 1) + '"><i aria-hidden="true">' + (sv ? sv.outerHTML : '') + '</i><span>' + K.esc(sp ? sp.textContent : el.textContent) + '</span>' + (tone === 'nav' ? '<b class="kz-gs-chev" aria-hidden="true">›</b>' : '') + '</button>'; };
    var main = '', mv = '', danger = '';
    [].forEach.call(m.children, function (el) {
      if (el.classList.contains('kz-gm-move')) { [].forEach.call(el.querySelectorAll('button'), function (b) { items.push(b); mv += '<button type="button" class="kz-gs-mv" data-gs="' + (items.length - 1) + '">' + (b.querySelector('svg') || { outerHTML: '' }).outerHTML + '<span>' + K.esc(b.textContent.trim()) + '</span></button>'; }); return; }
      if (el.classList.contains('kz-gm-del')) { danger += row(el, 'red'); return; }
      main += row(el, el.classList.contains('kz-gm-won') ? 'gold' : el.tagName === 'A' ? 'nav' : '');
    });
    GS._items = items; GS._card = card;
    GS.innerHTML = '<div class="kz-sheet-in kz-gs-in"><div class="kz-gs-top"><div><span class="kz-label49">' + (g.kind === 'daily' ? 'Daily habit' : 'Long-term goal') + '</span><h2 class="kz-t49">' + K.esc(g.name || '') + '</h2>' + (g.kind !== 'daily' && g.step ? '<p>Daily: ' + K.esc(g.step) + '</p>' : '') + '</div><button type="button" class="kz-iconbtn" data-gs-x aria-label="Close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="kz-gs-list">' + main + '</div>' + (mv ? '<div class="kz-gs-mvrow" role="group" aria-label="Reorder">' + mv + '</div>' : '') + (danger ? '<div class="kz-gs-list">' + danger + '</div>' : '') + '</div>';
    GS.hidden = false; document.body.classList.add('kz-noscroll'); requestAnimationFrame(function () { GS.classList.add('on'); var f = GS.querySelector('[data-gs]'); if (f) f.focus({ preventScroll: true }); });
    try { navigator.vibrate(4); } catch (er) {}
  }
  function closeGS() { if (!GS) return; GS.classList.remove('on'); document.body.classList.remove('kz-noscroll'); setTimeout(function () { if (!GS.classList.contains('on')) GS.hidden = true; }, reduce ? 0 : 200); }
  K.closeGoalSheet = closeGS;

  // ---------- ⋯ menu, edit, archive/delete, move ----------
  function closeMenus(except) { document.querySelectorAll('.kz-gmenu').forEach(function (m) { if (m !== except) { m.hidden = true; var b = m.parentNode.querySelector('.kz-gmore'); if (b) b.setAttribute('aria-expanded', 'false'); } }); }
  function visibleIds(row) { return [].map.call(row.parentNode.querySelectorAll(':scope > .kz-grow'), function (r) { return r.dataset.goal; }); }
  function refocus(id, sel) { var f = function () { var r = document.querySelector('.kz-grow[data-goal="' + id + '"] ' + sel); if (r && document.activeElement !== r) r.focus(); }; f(); setTimeout(f, 30); }
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-kz-editform]'); if (!f) return; e.preventDefault();
    var pick = function (a) { var b = f.querySelector('[' + a + '][aria-pressed="true"]'); return b ? b.getAttribute(a) : ''; };
    var lg = f.querySelector('[data-elog]'); K.updateGoal(f.dataset.kzEditform, { name: f.elements.name.value, step: f.elements.step.value, cue: f.elements.cue ? f.elements.cue.value : undefined, mini: f.elements.mini ? f.elements.mini.value : undefined, path: pick('data-epath'), kind: pick('data-ekind'), log: lg ? lg.getAttribute('aria-checked') === 'true' : undefined });
    K.track('kz_goal_edited'); document.dispatchEvent(new CustomEvent('kz:changed'));
  });
  K.miniToday = function (id) { var m = (K.get('mini', {}) || {})[id]; return !!(m && m[K.key(K.today())]); };
  document.addEventListener('click', function (e) {
    var mb = e.target.closest('[data-kz-mini]');
    if (mb) {
      var id = mb.dataset.kzMini, m = K.get('mini', {}) || {}, k = K.key(K.today()); (m[id] = m[id] || {})[k] = 1; K.set('mini', m); K.track('kz_mini_done');
      var row = document.querySelector('.kz-grow[data-goal="' + id + '"] .kz-check'); if (row && !K.isDone(id)) row.click(); else if (!K.isDone(id)) { K.toggleDone(id); document.dispatchEvent(new CustomEvent('kz:changed')); }
      return;
    }
    var more = e.target.closest('[data-kz-more]');
    if (more) { goalSheet(more); return; }
    if (!e.target.closest('.kz-gmenu')) closeMenus();
    var mv = e.target.closest('[data-kz-move]');
    if (mv) { var row = mv.closest('.kz-grow'), id = row.dataset.goal; closeMenus(); if (K.moveGoal(id, +mv.dataset.kzMove, visibleIds(row))) refocus(id, '.kz-gmore'); return; }
    var ed = e.target.closest('[data-kz-edit]'), edNo = e.target.closest('[data-kz-edit-no]'), ep = e.target.closest('[data-epath]'), ek = e.target.closest('[data-ekind]');
    if (ed) { closeMenus(); var f = ed.closest('.kz-goal').querySelector('.kz-editbox'); f.hidden = !f.hidden; if (!f.hidden) { ed.closest('.kz-goal').querySelector('.kz-delbox').hidden = true; f.querySelector('input').focus(); } return; }
    if (edNo) { edNo.closest('.kz-editbox').hidden = true; return; }
    if (ep || ek) { var grp = (ep || ek).parentNode, attr = ep ? 'data-epath' : 'data-ekind'; grp.querySelectorAll('[' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', String(b === (ep || ek))); }); return; }
    var del = e.target.closest('[data-kz-del]'), yes = e.target.closest('[data-kz-del-yes]'), no = e.target.closest('[data-kz-del-no]'), arch = e.target.closest('[data-kz-arch]');
    var drop = function (btn, fn, ev) { var card = btn.closest('.kz-goal'); card.classList.add('kz-gone'); setTimeout(function () { fn(); K.track(ev); document.dispatchEvent(new CustomEvent('kz:changed')); }, reduce ? 0 : 260); };
    if (arch) { drop(arch, function () { K.archiveGoal(arch.dataset.kzArch); }, 'kz_goal_archived'); return; }
    var won = e.target.closest('[data-kz-won]');
    if (won) { closeMenus(); var wid = won.dataset.kzWon, wg = K.goals().filter(function (x) { return x.id === wid; })[0]; drop(won, function () { K.updateGoal(wid, { won: K.key(K.today()) }); K.archiveGoal(wid); if (K.toast && wg) K.toast('Achieved: ' + wg.name + '. It’s saved in Archived goals.'); try { navigator.vibrate([10, 40, 10]); } catch (er) {} }, 'kz_goal_won'); return; }
    if (yes && !yes.dataset.sure) { yes.dataset.sure = '1'; yes.textContent = 'Delete for good'; yes.closest('.kz-delbox').querySelector('[data-kz-del-sure]').hidden = false; return; }
    // Oct 21: from the ⋯ menu, Archive / Delete is asked right inside the menu (no jump to the card)
    var gmA = e.target.closest('[data-kz-gm-arch]'), gmD = e.target.closest('[data-kz-gm-del]'), gmN = e.target.closest('[data-kz-gm-no]');
    if (gmN) { var ask0 = gmN.closest('.kz-gm-ask'), d0 = ask0.previousElementSibling; if (d0) d0.hidden = false; ask0.remove(); return; }
    if (gmA) { closeMenus(); drop(gmA, function () { K.archiveGoal(gmA.dataset.kzGmArch); }, 'kz_goal_archived'); return; }
    if (gmD) { if (!gmD.classList.contains('sure')) { gmD.classList.add('sure'); gmD.textContent = 'Delete for good'; return; } closeMenus(); drop(gmD, function () { K.removeGoal(gmD.dataset.kzGmDel); }, 'kz_goal_deleted'); return; }
    if (del && del.closest('.kz-gmenu')) { var gid = del.dataset.kzDel, ask = document.createElement('div'); ask.className = 'kz-gm-ask'; ask.setAttribute('role', 'group');
      ask.innerHTML = '<p>Archive or delete this goal?<small>Archive keeps every step and leaf. Delete erases its progress for good.</small></p><div><button type="button" data-kz-gm-arch="' + gid + '">Archive</button><button type="button" data-kz-gm-del="' + gid + '">Delete</button></div><button type="button" data-kz-gm-no>Cancel</button>';
      del.hidden = true; del.parentNode.insertBefore(ask, del.nextSibling); try { navigator.vibrate(4); } catch (er) {} return; }
    if (del) { closeMenus(); var box = del.closest('.kz-goal').querySelector('.kz-delbox'); box.hidden = !box.hidden; return; }
    if (no) { no.closest('.kz-delbox').hidden = true; return; }
    if (yes) { drop(yes, function () { K.removeGoal(yes.dataset.kzDelYes); }, 'kz_goal_deleted'); return; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenus();
    var h = e.target.closest && e.target.closest('[data-kz-drag]');
    if (h && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); var row = h.closest('.kz-grow'), id = row.dataset.goal; if (K.moveGoal(id, e.key === 'ArrowUp' ? -1 : 1, visibleIds(row))) refocus(id, '[data-kz-drag]'); }
  });

  // ---------- Expand / collapse a row ----------
  function rerender() { document.dispatchEvent(new CustomEvent('kz:goals')); }
  function findGoal(id) { return K.goals().filter(function (g) { return g.id === id; })[0]; }
  function setOpen(row, on) {
    var x = row.querySelector('.kz-gx'), t = row.querySelector('[data-kz-expand]'), g = findGoal(row.dataset.goal);
    if (on && !x && g) { var tmp = document.createElement('div'); tmp.innerHTML = K.gxHTML(g); x = tmp.firstChild; var after = row.querySelector('.kz-gmenu'); row.insertBefore(x, after ? after.nextSibling : null); }
    if (!on && x) x.remove();
    row.classList.toggle('open', on); if (t) { t.setAttribute('aria-expanded', String(on)); }
  }
  // Expand in place: no list re-render, so nothing jumps or flashes.
  function toggle(row, focusNote) {
    var id = row.dataset.goal, opening = openId !== id;
    document.querySelectorAll('.kz-grow.open').forEach(function (r) { if (r !== row || !opening) setOpen(r, false); });
    openId = opening ? id : null;
    document.querySelectorAll('.kz-grow[data-goal="' + id + '"]').forEach(function (r) { if (!r.closest('[data-no-expand]')) setOpen(r, opening); });
    if (opening && focusNote) { var b = row.querySelector('.kz-gnbox'); if (b) { try { b.focus({ preventScroll: true }); } catch (e) {} b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    K.track(opening ? 'kz_goal_expand' : 'kz_goal_collapse');
  }
  K.openGoalNote = function (id) { var row = [].filter.call(document.querySelectorAll('.kz-grow[data-goal="' + id + '"]'), function (r) { return !r.closest('[data-no-expand]'); })[0]; if (!row) return; if (openId !== id) toggle(row, true); else { var b = row.querySelector('.kz-gnbox'); if (b) b.focus(); } };
  K.collapseGoals = function () { document.querySelectorAll('.kz-grow.open').forEach(function (r) { setOpen(r, false); }); openId = null; };
  // Long-term goals: tap the card to fold it to just its title (title, ⋯ and check all on one line), tap again to unfold.
  // Each goal remembers. The small chevron under the step still opens the stats / journal panel.
  function toggleCompact(row) {
    var id = row.dataset.goal, m = K.get('gcompact', {}) || {}, on = !m[id];
    if (on) m[id] = 1; else delete m[id]; K.set('gcompact', m);
    document.querySelectorAll('.kz-grow[data-goal="' + id + '"]').forEach(function (r) {
      if (r.closest('[data-no-expand]')) return;
      var h0 = r.offsetHeight; if (on) setOpen(r, false); r.classList.toggle('compact', on);
      var t = r.querySelector('[data-kz-expand]'); if (t) { t.setAttribute('aria-expanded', String(!on)); t.setAttribute('aria-label', (findGoal(id) || {}).name + (on ? '. Tap to show today\u2019s step.' : '. Tap to fold to the title.')); }
      var h1 = r.offsetHeight; if (r.animate && h0 !== h1 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { r.style.overflow = 'hidden'; var a = r.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' }); a.onfinish = a.oncancel = function () { r.style.overflow = ''; }; }
    });
    if (on && openId === id) openId = null;
    try { navigator.vibrate(4); } catch (er) {} K.track(on ? 'kz_goal_fold' : 'kz_goal_unfold');
  }
  K.toggleCompact = function (id) { var r = document.querySelector('.kz-grow[data-goal="' + id + '"]'); if (r) toggleCompact(r); };
  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-kz-expand]');
    if (x && !e.target.closest('a,button,textarea,input') && !x.closest('[data-no-expand]')) {
      var row = x.closest('.kz-grow'), g = findGoal(row.dataset.goal), longTerm = g && g.kind !== 'daily';
      if (longTerm && !e.target.closest('.kz-gchev')) { toggleCompact(row); return; }
      toggle(row); return;
    }
    var on = e.target.closest('[data-kz-logon]'); if (on) { var r0 = on.closest('.kz-grow'); K.updateGoal(on.dataset.kzLogon, { log: true }); K.track('kz_goal_journal_on'); if (r0) { setOpen(r0, false); setOpen(r0, true); var b = r0.querySelector('.kz-gnbox'); if (b) b.focus(); } return; }
    var sv = e.target.closest('[data-gnsave]'); if (sv) { saveNote(sv.closest('[data-gnote]').querySelector('.kz-gnbox'), true); return; }
    var sw = e.target.closest('[data-elog]'); if (sw) { sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true')); return; }
  });
  document.addEventListener('keydown', function (e) {
    var x = e.target.closest && e.target.closest('[data-kz-expand]');
    if (x && e.target === x && !x.closest('[data-no-expand]') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); var r = x.closest('.kz-grow'), g = findGoal(r.dataset.goal); if (g && g.kind !== 'daily') toggleCompact(r); else toggle(r); }
  });
  // Goal note boxes (rows and the goal page): grow, save on their own, say "Saved".
  var noteT = {};
  var NOTE_ICON = '<svg class="kz-gnicon" aria-label="Has notes" viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z M15 4v4h4 M8 12h8 M8 16h6"/></svg>';
  function saveNote(box, submit) {
    var w = box.closest('[data-gnote]'); if (!w) return; var had = !!box.value.trim(); K.setGNote(w.dataset.gnote, w.dataset.day, box.value);
    var s = w.querySelector('.kz-gnsaved'); if (s && !submit) { s.textContent = 'Saved'; clearTimeout(s._t); s._t = setTimeout(function () { s.textContent = ''; }, 1600); }
    if (!submit) return;
    var btn = w.querySelector('[data-gnsave]'); if (!had) { box.focus(); if (s) s.textContent = 'Write something first'; return; }
    if (s) s.textContent = '';
    btn.classList.remove('kz-saved-pop'); void btn.offsetWidth; btn.classList.add('kz-saved-pop'); btn.innerHTML = '✓ Saved'; btn.disabled = true;
    try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
    K.track('kz_goal_note_saved', { length: box.value.length });
    var row = w.closest('.kz-grow');
    if (row) { // the row gets its note icon, then folds away
      document.querySelectorAll('.kz-grow[data-goal="' + row.dataset.goal + '"] .kz-gline').forEach(function (l) { if (!l.querySelector('.kz-gnicon')) { var st = l.querySelector('.kz-gstage'); st.insertAdjacentHTML('beforebegin', NOTE_ICON); } });
      setTimeout(function () { if (row.isConnected && row.classList.contains('open')) { openId = null; setOpen(row, false); } }, 900);
    } else setTimeout(function () { btn.disabled = false; btn.textContent = 'Update note'; }, 1200);
  }
  document.addEventListener('input', function (e) {
    var box = e.target.closest && e.target.closest('.kz-gnbox'); if (!box) return;
    if (K.autoGrow && !box._grow) { box._grow = 1; K.autoGrow(box); }
    var w0 = box.closest('[data-gnote]'), s0 = w0 && w0.querySelector('.kz-gnsaved'), sb = w0 && w0.querySelector('[data-gnsave]'); if (s0 && s0.textContent === 'Write something first') s0.textContent = ''; if (sb && sb.disabled) { sb.disabled = false; sb.textContent = 'Update note'; }
    var key = box.id; clearTimeout(noteT[key]); noteT[key] = setTimeout(function () { saveNote(box); }, 600);
  });
  document.addEventListener('focusout', function (e) { var box = e.target.closest && e.target.closest('.kz-gnbox'); if (box) { clearTimeout(noteT[box.id]); saveNote(box); } });
  document.addEventListener('focusin', function (e) { var box = e.target.closest && e.target.closest('.kz-gnbox'); if (box && !box._grow && K.autoGrow) { box._grow = 1; K.autoGrow(box); if (K.dictate && !box._mic) { box._mic = 1; K.dictate(box); } } });

  // ---------- Drag to reorder (handle only) ----------
  var drag = null;
  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('[data-kz-drag]'); if (!h || e.button > 0) return;
    var row = h.closest('.kz-grow'); e.preventDefault();
    if (row.classList.contains('open')) { K.collapseGoals(); row = document.querySelector('.kz-grow[data-goal="' + row.dataset.goal + '"]') || row; h = row.querySelector('[data-kz-drag]') || h; }
    drag = { row: row, h: h, x0: e.clientX, y0: e.clientY, y: e.clientY, live: false, pid: e.pointerId, list: row.parentNode }; dragOn();
    drag.wait = setTimeout(function () { if (drag && !drag.live) start(); }, e.pointerType === 'mouse' ? 0 : 150);
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
  });
  // Press and hold a goal (no handle needed), then slide it up or down
  var LP = 420;
  document.addEventListener('pointerdown', function (e) {
    if (drag || e.button > 0 || e.pointerType === 'mouse') return;
    var row = e.target.closest('.kz-grow'); if (!row || row.classList.contains('open') || row.classList.contains('kz-swopen')) return;
    if (e.target.closest('[data-kz-drag], .kz-check, .kz-gmore, .kz-gmenu, .kz-gswipe, .kz-editbox, .kz-delbox, .kz-gx, a, input, textarea')) return;
    if (!row.parentNode.querySelectorAll(':scope > .kz-grow')[1]) return; // nothing to reorder against
    drag = { row: row, h: row, x0: e.clientX, y0: e.clientY, y: e.clientY, live: false, pid: e.pointerId, list: row.parentNode, lp: true }; dragOn();
    drag.wait = setTimeout(function () { if (drag && !drag.live && drag.lp) { start(); lpSwallow = true; } }, LP);
  });
  var lpSwallow = false;
  document.addEventListener('pointermove', function (e) {
    if (!drag || !drag.lp || drag.live || e.pointerId !== drag.pid) return;
    if (Math.abs(e.clientX - drag.x0) > 8 || Math.abs(e.clientY - drag.y0) > 8) { clearTimeout(drag.wait); drag = null; } // a scroll or a swipe, not a hold
  });
  var dragTM = function (e) { if (drag && drag.live) { e.preventDefault(); if (e.touches[0]) drag.y = e.touches[0].clientY; } };
  var dragOff = function () { document.removeEventListener('touchmove', dragTM, { passive: false }); };
  var dragOn = function () { document.addEventListener('touchmove', dragTM, { passive: false }); };
  document.addEventListener('touchend', function () { if (drag && drag.lp) end(); if (!drag) dragOff(); }, { passive: true });
  document.addEventListener('click', function (e) { if (lpSwallow) { lpSwallow = false; if (e.target.closest('.kz-grow')) { e.stopPropagation(); e.preventDefault(); } } }, true);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.kz-grow')) e.preventDefault(); });
  function start() {
    var row = drag.row, r = row.getBoundingClientRect(), ph = document.createElement('div');
    ph.className = 'kz-gph'; ph.style.height = r.height + 'px'; row.parentNode.insertBefore(ph, row);
    drag.ph = ph; drag.off = drag.y - r.top; drag.live = true;
    row.classList.add('kz-lift'); row.style.width = r.width + 'px'; row.style.left = r.left + 'px'; row.style.top = r.top + 'px';
    document.body.classList.add('kz-dragging');
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
    tick();
  }
  function place() {
    var y = drag.y, sibs = [].filter.call(drag.list.querySelectorAll(':scope > .kz-grow'), function (s) { return s !== drag.row; }), target = null;
    for (var i = 0; i < sibs.length; i++) { var r = sibs[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { target = sibs[i]; break; } }
    var cur = drag.ph.nextElementSibling === drag.row ? drag.row.nextElementSibling : drag.ph.nextElementSibling;
    if (target === cur || (!target && drag.ph === lastRow())) return;
    // FLIP: rows slide out of the way
    var before = sibs.map(function (s) { return s.getBoundingClientRect().top; });
    if (target) drag.list.insertBefore(drag.ph, target); else drag.list.appendChild(drag.ph);
    sibs.forEach(function (s, i) { var d = before[i] - s.getBoundingClientRect().top; if (d && s.animate && !reduce) s.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 160, easing: 'ease-out' }); });
  }
  function lastRow() { var all = drag.list.querySelectorAll(':scope > .kz-grow, :scope > .kz-gph'); return all[all.length - 1]; }
  function tick() {
    if (!drag || !drag.live) return;
    drag.row.style.top = (drag.y - drag.off) + 'px';
    var edge = 70, vh = window.innerHeight;
    if (drag.y < edge) window.scrollBy(0, -Math.ceil((edge - drag.y) / 6)); else if (drag.y > vh - edge) window.scrollBy(0, Math.ceil((drag.y - (vh - edge)) / 6));
    place(); requestAnimationFrame(tick);
  }
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pid) return; drag.y = e.clientY;
    if (!drag.live && Math.abs(e.clientY - drag.y0) > 6 && e.pointerType === 'mouse') { clearTimeout(drag.wait); start(); }
  });
  function end(e) {
    setTimeout(function () { if (!drag) dragOff(); }, 0);
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    if (e && e.type === 'pointercancel' && drag.lp && drag.live) return; // iPhone sends this mid-hold; the touchend finishes the move
    clearTimeout(drag.wait);
    var d = drag; drag = null; if (!d.live) return;
    d.list.insertBefore(d.row, d.ph); d.ph.remove();
    d.row.classList.remove('kz-lift'); d.row.style.width = d.row.style.left = d.row.style.top = '';
    document.body.classList.remove('kz-dragging');
    var ids = [].map.call(d.list.querySelectorAll(':scope > .kz-grow'), function (r) { return r.dataset.goal; });
    var id = d.row.dataset.goal; K.reorderVisible(ids); K.track('kz_goal_dragged', { via: d.lp ? 'hold' : 'handle' }); if (!d.lp) refocus(id, '[data-kz-drag]');
    try { if (navigator.vibrate) navigator.vibrate(6); } catch (x) {}
  }
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();
