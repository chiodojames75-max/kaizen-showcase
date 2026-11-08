
(function () {
  var K = window.KZ; if (!K) return;
  // Pillars belong to each person. These five are only the presets: anyone can rename, recolor,
  // delete or add pillars (saved as kz_pillars, synced). Preset ids stay stable so saved goals,
  // the goal library and quote tags keep matching even after a rename.
  K.PRESETS = [
    { id: 'health', name: 'Health', c1: '#B9E3C6', c2: '#6FB58A' },
    { id: 'mind', name: 'Mind', c1: '#BFD6F5', c2: '#6E98D6' },
    { id: 'wealth', name: 'Wealth', c1: '#F7E7A6', c2: '#D4AF37' },
    { id: 'relationships', name: 'Relationships', c1: '#F3C2CF', c2: '#D27D94' },
    { id: 'passion', name: 'Personal', c1: '#F6D3A8', c2: '#D98E3F' }
  ];
  K.PILLAR_COLORS = [['#B9E3C6', '#6FB58A'], ['#BFD6F5', '#6E98D6'], ['#F7E7A6', '#D4AF37'], ['#F3C2CF', '#D27D94'], ['#F6D3A8', '#D98E3F'],
    ['#D9C8F5', '#9B7FD6'], ['#B8ECEC', '#4FB3B3'], ['#F5C2B8', '#D9705C'], ['#E8F0A8', '#A7B83A'], ['#DCE2EA', '#9AA6B8']];
  K.MAX_PILLARS = 8; K.MIN_PILLARS = 2;
  function loadPillars() {
    var p = K.get('pillars', null);
    K.PATHS = Array.isArray(p) && p.length >= K.MIN_PILLARS ? p.filter(function (x) { return x && x.id && x.name; }) : K.PRESETS.map(function (x) { return Object.assign({}, x); });
    // "School" pillar is now "Education" (Oct 20); rename it once in saved pillars
    if (Array.isArray(p) && K.PATHS.some(function (x) { return /^school$/i.test(x.name); })) { K.PATHS.forEach(function (x) { if (/^school$/i.test(x.name)) x.name = 'Education'; }); K.set('pillars', K.PATHS); }
  }
  loadPillars();
  K.reloadPillars = loadPillars;
  K.pillar = function (id) { return K.PATHS.filter(function (x) { return x.id === id; })[0] || null; };
  function savePillars(list) { K.set('pillars', list); loadPillars(); document.dispatchEvent(new CustomEvent('kz:pillars')); document.dispatchEvent(new CustomEvent('kz:changed')); }
  K.addPillar = function (name, color) {
    name = String(name || '').trim().slice(0, 24); if (!name || K.PATHS.length >= K.MAX_PILLARS) return null;
    var used = K.PATHS.map(function (p) { return p.c2; }), c = color || K.PILLAR_COLORS.filter(function (x) { return used.indexOf(x[1]) < 0; })[0] || K.PILLAR_COLORS[K.PATHS.length % K.PILLAR_COLORS.length];
    var id = 'p' + Date.now().toString(36);
    savePillars(K.PATHS.concat([{ id: id, name: name, c1: c[0], c2: c[1] }])); return id;
  };
  K.updatePillar = function (id, o) {
    savePillars(K.PATHS.map(function (p) { if (p.id !== id) return p; var q = Object.assign({}, p);
      if (o.name != null && String(o.name).trim()) q.name = String(o.name).trim().slice(0, 24);
      if (o.color) { q.c1 = o.color[0]; q.c2 = o.color[1]; } return q; }));
  };
  // Delete a pillar. Its goals (active and archived) move to another pillar, so no progress is lost.
  K.deletePillar = function (id, moveTo) {
    if (K.PATHS.length <= K.MIN_PILLARS) return false;
    var rest = K.PATHS.filter(function (p) { return p.id !== id; }); if (!rest.some(function (p) { return p.id === moveTo; })) moveTo = rest[0].id;
    var mv = function (list) { return list.map(function (g) { if (K.pathOf(g) === id) { g = Object.assign({}, g); g.path = moveTo; } return g; }); };
    K.set('goals', mv(K.goals())); K.set('archived', mv(K.archived ? K.archived() : []));
    savePillars(rest); return true;
  };
  K.resetPillars = function () {
    var ids = K.PRESETS.map(function (p) { return p.id; });
    var mv = function (list) { return list.map(function (g) { if (ids.indexOf(K.pathOf(g)) < 0) { g = Object.assign({}, g); g.path = K.guessPath(g.name); } return g; }); };
    K.set('goals', mv(K.goals())); K.set('archived', mv(K.archived ? K.archived() : []));
    savePillars(K.PRESETS.map(function (x) { return Object.assign({}, x); }));
  };
  K.goalsIn = function (id) { return K.allGoals().filter(function (g) { return K.pathOf(g) === id; }).length; };
  var OLD = { physical: 'health', mental: 'mind', creative: 'passion', work: 'wealth', people: 'relationships' };
  var WORDS = {
    passion: /hobby|hobbies|passion|dirt ?bike|motorcycle|reptile|snake|lizard|gecko|collect|fish(ing)?\b|hunt|surf|skate|snowboard|ski\b|paint|draw|music|guitar|piano|drum|\bsing(ing)?\b|\bsongs?\b|photo|film|\bart\b|craft|garden|bake|dance|\bgames?\b|\bcars?\b|woodwork|camp|hike/i,
    wealth: /save|saving|money|\$|invest|stock|real estate|business|income|job|work|career|intern|brand|shop|trad|budget|debt|side hustle|sell|client|grade|gpa/i,
    health: /run|gym|lift|walk|stretch|sport|swim|water|hydrat|sleep|workout|jiu|bjj|wrestl|bike|yoga|eat|food|diet|healthy|meal|cook|protein|veg|fruit|steps|mile|marathon|push.?up|exercise|weight/i,
    relationships: /call|family|friend|mom|dad|grandma|grandpa|brother|sister|text|girlfriend|boyfriend|partner|date|people|volunteer|trust|kind to|drama|social/i,
    mind: /read|study|learn|book|class|course|language|code|chess|focus|travel|meditat|journal|breath|gratitude|calm|pray|phone|screen|write/i };
  // Guess a pillar from a goal's words: a custom pillar whose name appears in the goal wins, then preset keywords.
  K.guessPath = function (name) {
    name = name || ''; var low = name.toLowerCase();
    var own = (K.PATHS || []).filter(function (p) { return !WORDS[p.id] && p.name.length > 2 && low.indexOf(p.name.toLowerCase()) > -1; })[0]; if (own) return own.id;
    for (var k in WORDS) if (WORDS[k].test(name) && K.pillar(k)) return k;
    return (K.pillar('mind') || K.PATHS[0]).id;
  };
  K.pathOf = function (g) {
    var p = g.path && (K.pillar(g.path) ? g.path : (OLD[g.path] && K.pillar(OLD[g.path]) ? OLD[g.path] : null));
    return p || K.guessPath(g.name);
  };
  var PM = [1, 3, 5, 10, 15, 25, 40, 60, 100, 150, 250, 400, 600, 1000, 1500, 2500];
  var GM = [[1, 'First step', 'You started. Most people never do.'], [3, '3 days', 'Three times. It is becoming real.'], [5, '5 days', 'Five days. You are building trust with yourself.'], [7, '1 week', 'One week. This is who you are now.'], [14, '2 weeks', 'Two weeks. Your days are changing.'], [21, '3 weeks', 'Three weeks. It is starting to stick.'], [30, '1 month', 'A month. Look how far you have come.'], [50, '50 days', 'Fifty days of quiet, steady growth.'], [66, 'Habit', 'Habit formed. It is part of you now.'], [100, '100 days', 'One hundred days. A different person.'], [180, '6 months', 'Half a year of getting better.'], [365, '1 year', 'One year. Your tree is ancient now.']];
  // Skill tree goal branches count steps toward each goal (not days or streaks).
  var GS = [1, 3, 5, 10, 15, 25, 40, 60, 100, 150, 250, 400].map(function (m) { return [m, m + (m === 1 ? ' step' : ' steps'), m === 1 ? 'Your first step toward this goal.' : m + ' steps toward this goal.']; });
  K.MILESTONES = GM;
  var ROW = 88, OFF = 70;
  function nice(k) { return k ? new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''; }
  function keysOn(m) { return Object.keys(m).filter(function (k) { return m[k]; }).sort(); }
  function short(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // A day is complete when every goal you had that day got its step.
  // Every goal that ever counted: today's goals plus archived ones (their progress is kept).
  K.allGoals = function () { return K.goals().concat(K.archived ? K.archived() : []); };
  var activeOn = function (g, k) { return (!g.created || g.created <= k) && (!g.archived || k < g.archived); };
  // Days shown up: any step on any goal that day (the headline number).
  K.daysShownUp = function () {
    var done = K.get('done', {}), days = {};
    for (var id in done) Object.keys(done[id] || {}).forEach(function (k) { days[k] = 1; });
    return Object.keys(days).length;
  };
  // Perfect days: every goal active that day was done (stricter, shown smaller).
  K.daysCompleted = function () {
    var goals = K.allGoals(), done = K.get('done', {}); if (!goals.length) return 0;
    var days = {}; goals.forEach(function (g) { Object.keys(done[g.id] || {}).forEach(function (k) { days[k] = 1; }); });
    return Object.keys(days).filter(function (k) {
      var active = goals.filter(function (g) { return activeOn(g, k); });
      return active.length && active.every(function (g) { return done[g.id] && done[g.id][k]; });
    }).length;
  };
  // Completion rate per path over the last 14 days, from what was actually done.
  // Only current goals count. Today counts only once its step is done, so mornings are not punished.
  K.pathRates = function (days) {
    days = days || 14;
    var done = K.get('done', {}), goals = K.goals(), t = K.key(K.today()), out = {};
    K.PATHS.forEach(function (p) { out[p.id] = { id: p.id, name: p.name, color: p.c2, goals: 0, done: 0, due: 0, rate: null }; });
    goals.forEach(function (g) {
      var o = out[K.pathOf(g)]; if (!o) return; o.goals++;
      for (var i = 0; i < days; i++) {
        var k = K.key(K.addDays(K.today(), -i)); if (g.created && k < g.created) break;
        var hit = !!(done[g.id] && done[g.id][k]);
        if (k === t && !hit) continue;
        o.due++; if (hit) o.done++;
      }
    });
    K.PATHS.forEach(function (p) { var o = out[p.id]; if (o.due) o.rate = Math.round(100 * o.done / o.due); });
    // Share: how much of all completed steps (last 14 days) landed in each pillar. Even = 20% each.
    var total = 0; K.PATHS.forEach(function (p) { total += out[p.id].done; });
    K.PATHS.forEach(function (p) { out[p.id].share = total ? Math.round(100 * out[p.id].done / total) : 0; });
    return K.PATHS.map(function (p) { return out[p.id]; });
  };
  // Balance: how EVENLY completed steps are spread across all five pillars (last 14 days).
  // 100% = each pillar gets 20% of the steps. All steps in one pillar = 0%.
  // Health 6 · Mind 4 · Wealth 1 · Relationships 1 · Personal 1 → 54%. Empty pillars count as 0 steps.
  K.balance = function () {
    var P = K.pathRates();
    if (!P.some(function (o) { return o.goals; })) return null;
    var total = P.reduce(function (a, o) { return a + o.done; }, 0); if (!total) return 0;
    var dev = P.reduce(function (a, o) { return a + Math.abs(o.done / total - 1 / P.length); }, 0), worst = 2 * (1 - 1 / P.length);
    return Math.max(0, Math.round(100 * (1 - dev / worst)));
  };
  // Skill tree: each pillar is a small tree. Its trunk grows with the pillar's total steps;
  // each goal fans out as its own branch, one node per milestone reached (no filler dots),
  // so longer branches mean more real progress and no two pillars look alike.
  K.skillTree = function (opt) {
    opt = opt || {};
    var done = K.get('done', {}), goals = K.allGoals(), nodes0 = 0, nexts = [], unlocked = 0;
    var GAP = opt.only ? 29 : 40, TG = opt.only ? 30 : 52, ATT = 64, LABEL = opt.only ? 74 : 84, rad = Math.PI / 180;
    var only = opt.only, narrow = !!opt.only;
    var lanes = K.PATHS.filter(function (p) { return !only || p.id === only; }).map(function (p) {
      var bs = goals.filter(function (g) { return K.pathOf(g) === p.id; }).map(function (g) {
        var dates = Object.keys(done[g.id] || {}).sort();
        var reached = GS.filter(function (m) { return dates.length >= m[0]; }).length;
        return { key: 'g' + g.id, name: g.name + (g.archived ? ' (archived)' : ''), dates: dates, reached: reached, show: Math.min(GS.length, reached + 1) };
      });
      var all = []; bs.forEach(function (b) { all = all.concat(b.dates); }); all.sort();
      var reachedT = PM.filter(function (m) { return all.length >= m; }).length;
      return { p: p, branches: bs, dates: all, reached: reachedT, tshow: Math.min(PM.length, reachedT + 1) };
    });
    // geometry, relative to each trunk base (0,0), y grows upward as negative
    lanes.forEach(function (L) {
      var n = L.branches.length, longest = 0;
      L.branches.forEach(function (b) { longest = Math.max(longest, GAP * 1.15 + (b.show - 1) * GAP); });
      L.T = Math.max(L.tshow * TG * 0.75, longest * 0.85, n * 34 + 60, 90);
      L.left = 70; L.right = 70; L.top = L.T;
      L.branches.forEach(function (b, i) {
        // spread attach points up the trunk; sides alternate and sit at different heights
        var side = i % 2 ? -1 : 1, f = n === 1 ? 0.35 : 0.14 + 0.62 * i / (n - 1), y0 = -L.T * f;
        var a0 = narrow ? 30 - 12 * f : 50 - 22 * f, x = 0, y = y0, pts = [];
        for (var j = 0; j < b.show; j++) {
          var a = side * a0 * (1 - 0.7 * (j + 1) / Math.max(2, b.show)) * rad, len = j === 0 ? GAP * 1.15 : GAP;
          x += Math.sin(a) * len; y -= Math.cos(a) * len; pts.push([x, y]);
        }
        b.side = side; b.y0 = y0; b.pts = pts;
        pts.forEach(function (q) {
          if (side > 0) L.right = Math.max(L.right, q[0] + LABEL); else L.left = Math.max(L.left, -q[0] + LABEL);
          L.top = Math.max(L.top, -q[1] + 40);
        });
      });
      var plateW = Math.max(118, L.p.name.length * 10.5 + 34);
      L.plateW = plateW;
      L.left = Math.max(L.left, plateW / 2 + 14); L.right = Math.max(L.right, plateW / 2 + 14);
    });
    var x = 20; lanes.forEach(function (L) { L.x = x + L.left; x += L.left + L.right; });
    var W = only ? x + 20 : Math.max(opt.width || 390, x + 20), shift = (W - x - 20) / 2;
    lanes.forEach(function (L) { L.x += shift; });
    var maxTop = Math.max.apply(null, lanes.map(function (L) { return L.top; }));
    var base = maxTop + 40, H = base + (only ? 66 : 170), cx = W / 2, root = [cx, base + 130];
    var S = ['<svg class="kz-skill" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Skill tree">', '<defs><filter id="kzsb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>'];
    lanes.forEach(function (L) { S.push('<linearGradient id="kzp-' + L.p.id + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + L.p.c2 + '"/><stop offset="1" stop-color="' + L.p.c1 + '"/></linearGradient><radialGradient id="kzg-' + L.p.id + '"><stop offset="0" stop-color="' + L.p.c2 + '" stop-opacity=".45"/><stop offset="1" stop-color="' + L.p.c2 + '" stop-opacity="0"/></radialGradient>'); });
    S.push('<radialGradient id="kzg-root"><stop offset="0" stop-color="#D4AF37" stop-opacity=".4"/><stop offset="1" stop-color="#D4AF37" stop-opacity="0"/></radialGradient></defs>');
    // smooth path through points (Catmull-Rom to Bezier)
    var smooth = function (P) {
      var d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
      for (var i = 0; i < P.length - 1; i++) {
        var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
        d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      return d;
    };
    var stroke = function (d, L, on, w, flat) {
      if (on && flat) return '<path d="' + d + '" stroke="' + L.p.c2 + '" stroke-width="' + (w + 5) + '" fill="none" opacity=".2" filter="url(#kzsb)"/><path d="' + d + '" stroke="' + L.p.c2 + '" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>';
      if (on) return '<path d="' + d + '" stroke="' + L.p.c2 + '" stroke-width="' + (w + 5) + '" fill="none" opacity=".2" filter="url(#kzsb)"/><path d="' + d + '" stroke="url(#kzp-' + L.p.id + ')" stroke-width="' + w + '" fill="none" stroke-linecap="round"/>';
      return '<path d="' + d + '" stroke="' + L.p.c2 + '" stroke-opacity=".5" stroke-width="2" fill="none" stroke-dasharray="5 5" stroke-linecap="round"/>';
    };
    var node = function (L, xx, yy, r, st, label, sub, info, id, showLabel, side) {
      var g = '<g class="kz-node ' + st + '" data-node="' + id + '" tabindex="0" role="button" aria-label="' + K.esc(label + ', ' + info) + '" data-label="' + K.esc(label) + '" data-info="' + K.esc(info) + '">';
      if (st === 'on') { unlocked++; g += (showLabel ? '<circle cx="' + xx + '" cy="' + yy + '" r="' + (r + 10) + '" fill="url(#kzg-' + L.p.id + ')"/>' : '') + '<circle cx="' + xx + '" cy="' + yy + '" r="' + r + '" fill="url(#kzp-' + L.p.id + ')"/>' + (showLabel ? '<path d="M' + (xx - 4.5) + ' ' + yy + ' l3.5 3.5 l6.5 -7" stroke="#0B0D12" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''); }
      else g += '<circle class="kz-pulse" cx="' + xx + '" cy="' + yy + '" r="' + r + '" fill="#121726" stroke="' + L.p.c2 + '" stroke-width="2" stroke-dasharray="4 3"/>';
      g += '<circle cx="' + xx + '" cy="' + yy + '" r="22" fill="transparent"/>';
      if (showLabel && label) {
        var tx = xx + side * (r + 7), anc = side > 0 ? 'start' : 'end';
        g += '<text x="' + tx + '" y="' + (yy + (sub ? 0 : 4)) + '" text-anchor="' + anc + '" class="kz-nl ' + st + '"' + (st === 'next' ? ' style="fill: ' + L.p.c1 + '"' : '') + '>' + K.esc(label) + '</text>';
        if (sub) g += '<text x="' + tx + '" y="' + (yy + 13) + '" text-anchor="' + anc + '" class="kz-ns">' + K.esc(short(sub, 16)) + '</text>';
      }
      return g + '</g>';
    };
    var lines = [], dots = [], plates = [];
    lanes.forEach(function (L) {
      var bx = L.x, by = base, at = function (q) { return [bx + q[0], by + q[1]]; }, act = L.dates.length > 0;
      // root to plate
      if (!only) lines.push(stroke('M' + root[0] + ' ' + root[1] + ' C' + root[0] + ' ' + (root[1] - 50) + ' ' + bx + ' ' + (by + 110) + ' ' + bx + ' ' + (by + 64), L, act, 4));
      // trunk with its milestone nodes, evenly spread
      var tpts = []; for (var j = 0; j < L.tshow; j++) tpts.push([bx, by - (j + 1) * L.T / L.tshow]);
      var lastOn = L.reached ? tpts[L.reached - 1] : [bx, by];
      lines.push(stroke('M' + bx + ' ' + by + ' L' + bx + ' ' + lastOn[1], L, act, 6, true));
      if (L.reached < L.tshow) lines.push(stroke('M' + bx + ' ' + lastOn[1] + ' L' + bx + ' ' + tpts[L.reached][1], L, false, 2));
      tpts.forEach(function (q, j) {
        var m = PM[j], st = j < L.reached ? 'on' : 'next';
        var info = st === 'on' ? L.p.name + ' · ' + m + (m === 1 ? ' step' : ' steps') + ' · ' + nice(L.dates[m - 1]) : L.p.name + ' · ' + (m - L.dates.length) + ' more to ' + m + ' steps';
        dots.push(node(L, q[0], q[1], j === L.reached - 1 ? 9 : 6, st, m + (m === 1 ? ' step' : ' steps'), '', info, L.p.id + '-' + j, false, 1));
      });
      // goal branches
      L.branches.forEach(function (b) {
        var P = [[0, b.y0]].concat(b.pts).map(at), on = P.slice(0, b.reached + 1);
        if (on.length > 1) lines.push(stroke(smooth(on), L, true, 3));
        if (b.reached < b.show) lines.push(stroke(smooth(P.slice(b.reached, b.reached + 2)), L, false, 2));
        b.pts.forEach(function (q, k) {
          var m = GS[k], st = k < b.reached ? 'on' : 'next', pt = at(q), latest = k === b.reached - 1;
          var info = st === 'on' ? b.name + ' · ' + m[1] + ' · ' + nice(b.dates[m[0] - 1]) : b.name + ' · ' + (m[0] - b.dates.length) + ' more ' + (m[0] - b.dates.length === 1 ? 'step' : 'steps') + ' to ' + m[1];
          dots.push(node(L, pt[0], pt[1], latest ? 11 : (st === 'next' ? 10 : 5.5), st, m[1], latest || (st === 'next' && !b.reached) ? b.name : '', info, b.key + '-' + k, latest || st === 'next', b.side));
          if (st === 'next') nexts.push({ label: m[1], sub: b.name, x: pt[0], y: pt[1], path: L.p.name, left: m[0] - b.dates.length });
        });
      });
      if (!L.branches.filter(function (b) { return b.key.charAt(0) === 'g'; }).length) dots.push('<a href="/pages/my-goals?pillar=' + L.p.id + '#add" class="kz-addpath"><text x="' + bx + '" y="' + (by - L.T - 22) + '" text-anchor="middle" class="kz-ns" style="fill: ' + L.p.c2 + '">+ add a goal</text></a>');
      // plate sized to the name
      plates.push('<g class="kz-plate" data-pillar="' + L.p.id + '" role="button" tabindex="0" aria-label="Show ' + L.p.name + ' goals"><rect x="' + (bx - L.plateW / 2) + '" y="' + (by + 8) + '" width="' + L.plateW + '" height="50" rx="14" fill="#0B0D12" stroke="' + (act ? L.p.c2 : '#283149') + '" stroke-opacity=".6"/>' +
        '<text x="' + bx + '" y="' + (by + 27) + '" text-anchor="middle" class="kz-pl" style="fill: ' + L.p.c1 + '">' + L.p.name.toUpperCase() + '</text><text x="' + bx + '" y="' + (by + 49) + '" text-anchor="middle" class="kz-pv" style="fill: ' + (act ? L.p.c1 : '#4A5266') + '">' + L.dates.length + '<tspan class="kz-pvs" dx="4">' + (L.dates.length === 1 ? 'step' : 'steps') + '</tspan></text></g>');
    });
    S.push(lines.join(''), '<g>' + dots.join('') + '</g>', plates.join(''));
    if (!only) S.push('<circle cx="' + root[0] + '" cy="' + root[1] + '" r="30" fill="url(#kzg-root)"/><circle cx="' + root[0] + '" cy="' + root[1] + '" r="20" fill="#0B0D12" stroke="#D4AF37" stroke-width="2"/><path transform="translate(' + (root[0] - 10) + ' ' + (root[1] - 9) + ') scale(.24)" d="M8 70 H80 L44 8 L26 39" fill="none" stroke="#D4AF37" stroke-width="10" stroke-linecap="square"/>');
    S.push('</svg>');
    nexts.sort(function (a, b) { return a.left - b.left; });
    var nx = nexts[0], top = lanes.slice().sort(function (a, b) { return b.dates.length - a.dates.length; })[0];
    return { svg: S.join(''), width: W, height: H, unlocked: unlocked, next: nx || null, focusX: nx ? nx.x : (top ? top.x : cx), focusY: nx ? nx.y : base - 60,
      steps: (function () { var n = 0; for (var id in done) n += Object.keys(done[id] || {}).length; return n; })(), branches: goals.length,
      paths: lanes.map(function (L) { return { id: L.p.id, name: L.p.name, level: L.reached, color: L.p.c2, x: L.x }; }) };
  };
})();
