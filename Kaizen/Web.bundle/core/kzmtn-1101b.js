/* Nov 1 · Mountains, stages 1–4 (replaces kzmtn-1101.js on every page). James: "make sure the numbers are correct …
   make all the changes necessary to make this app production level."
   ONE source of truth for every number (K.mtn):
     daily habit  – each check-off = +131 ft, day N = N × 131 ft, the top = day 66 = 8,646 ft (66 × 131; the mock's 8,660
                    could not be true with 131 ft a day). Checkpoints on days 7 / 14 / 30 / 45. A missed day costs 0 ft.
                    Kaizen 66 uses the run's check-offs; every other habit uses its total check-offs.
                    After 66: "Keep climbing" = the Seven Summits (mountain k covers check-offs 66(k−1)+1 … 66k, mountain 7 is
                    Everest; feet shown as the honest running total, never as a fake mountain height) or "Stop here".
     quit         – fog clears 1/66 per clean day (total clean days, so a slip never brings fog back); 66 = clear skies.
     roadmap goal – each step is a peak; progress = steps done ÷ steps; the finish is the due date.
   Screens: Today's Kaizen 66 card · Growth ("Your mountains") · the goal page scene (climb / expedition / storm) ·
   the day-66 "You made it." screen · share card. Retires the tree art (thumbnails swapped, tree hero hidden) and the tree
   words (kzword-1101.js). Stored: kz_mtnpic (which photo is whose), kz_summit (Keep climbing / Stop here). No network.
   Styles: kzmtn-1101b.css. Photos: /art/mtn/. */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzmtn) return; K.__kzmtn = 1;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var ART = (window.KZ_ART || '/art/') + 'mtn/';
  var TOP = 66, STEP = 131, TOPFT = TOP * STEP, CPS = [7, 14, 30, 45], SEVEN = 7;
  // 31 habit peaks, 7 fog valleys, 6 ridges: no two goals of a kind share a photo until every photo of that kind is in use
  var POOL = ["h1", "h2", "h3", "h4", "h5", "h6", "p01", "p02", "p03", "p04", "p05", "p06", "p07", "p08", "p09", "p10", "p11", "p12", "p13", "p14", "p15", "p16", "p17", "p18", "p19", "p20", "p21", "p22", "p23", "p24", "p25"];
  var SPOOL = ['storm', 's01', 's02', 's03', 's04', 's05', 's06'];
  var EPOOL = ['exped', 'e01', 'e02', 'e04', 'e05', 'e06'];
  // where each photo's peak sits (fraction of the 720×900 frame), so the route ends on the real summit
  var PEAK = { h1: [.44, .36], h2: [.52, .32], h3: [.55, .27], h4: [.82, .27], h5: [.52, .27], h6: [.70, .24], p01: [0.5, 0.307], p02: [0.491, 0.288], p03: [0.55, 0.31], p04: [0.501, 0.319], p05: [0.515, 0.406], p06: [0.5, 0.42], p07: [0.5, 0.554], p08: [0.501, 0.27], p09: [0.416, 0.3], p10: [0.533, 0.3], p11: [0.52, 0.3], p12: [0.5, 0.421], p13: [0.5, 0.277], p14: [0.5, 0.285], p15: [0.5, 0.363], p16: [0.484, 0.281], p17: [0.5, 0.347], p18: [0.504, 0.336], p19: [0.459, 0.475], p20: [0.5, 0.284], p21: [0.5, 0.626], p22: [0.5, 0.279], p23: [0.52, 0.293], p24: [0.5, 0.403], p25: [0.5, 0.28] };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function num(n) { return Math.round(n).toLocaleString('en-US'); }
  function ft(n) { return num(n * STEP) + ' ft'; }            // n check-offs → feet
  K.mtnFeet = ft; K.MTN = { STEP: STEP, TOP: TOP, TOPFT: TOPFT, CPS: CPS };
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function allGoals() { try { return (K.allGoals ? K.allGoals() : goals()) || []; } catch (e) { return goals(); } }
  function byId(id) { var a = allGoals(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function nextCp(n) { for (var i = 0; i < CPS.length; i++) if (n < CPS[i]) return CPS[i]; return TOP; }
  function k66run() { try { var st = K.k66 && K.k66.state(), r = st && st.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  function D(k) { var p = String(k).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function key(d) { return K.key ? K.key(d) : d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function todayKey() { try { return key(K.today ? K.today() : new Date()); } catch (e) { return key(new Date()); } }
  function fmtDay(k) { var d = D(k); return MON[d.getMonth()] + ' ' + d.getDate(); }
  function summits() { var m = null; try { m = K.get('summit', null); } catch (e) {} return m && typeof m === 'object' ? m : {}; }
  function setSummit(gid, v) { var m = summits(); m[gid] = v; K.set('summit', m); }
  function kind(g) {
    if (g.quit || g.kind === 'quit') return 'storm';
    try { if (K.bd && K.bd.isMs && K.bd.isMs(g)) return 'exped'; } catch (e) {}
    return 'climb';
  }
  function doneDays(gid) {
    var d = {}; try { d = ((K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {})[gid] || {}; } catch (e) {}
    return Object.keys(d).filter(function (k) { return d[k]; }).sort();
  }

  // ---------- which photo is which goal's mountain ----------
  var picMemo = null;
  function picRaw() { try { return localStorage.getItem('kz_mtnpic') + '|' + localStorage.getItem('kz_goals') + '|' + localStorage.getItem('kz_archived'); } catch (e) { return null; } }
  function pics() {
    var raw = picRaw(); if (picMemo && raw !== null && picMemo.raw === raw) return picMemo.m;
    var m = null; try { m = K.get('mtnpic', null); } catch (e) {} var ch = false; if (!m || typeof m !== 'object') { m = {}; ch = true; }
    var all = allGoals(), act = {}; goals().forEach(function (g) { act[g.id] = 1; });
    var POOLS = { climb: POOL, storm: SPOOL, exped: EPOOL };
    // how much each photo is in use: an active goal counts fully, an archived one barely (so it gives its photo up first)
    var used = {}; all.forEach(function (g) { var p = m[g.id]; if (p) used[p] = (used[p] || 0) + (act[g.id] ? 1 : .001); });
    all.slice().sort(function (a, b) { return String(a.created || '').localeCompare(String(b.created || '')) || String(a.id).localeCompare(String(b.id)); })
      .forEach(function (g) {
        var pool = POOLS[kind(g)]; if (m[g.id] && pool.indexOf(m[g.id]) >= 0) return;
        var pick = pool[0], low = 1e9; pool.forEach(function (p) { if ((used[p] || 0) < low) { low = used[p] || 0; pick = p; } });
        m[g.id] = pick; used[pick] = (used[pick] || 0) + (act[g.id] ? 1 : .001); ch = true;
      });
    if (ch) try { K.set('mtnpic', m); } catch (e) {}
    raw = picRaw(); picMemo = raw === null ? null : { raw: raw, m: m }; return m;
  }
  function picKey(g) { var k = kind(g), p = pics()[g.id]; return p || (k === 'storm' ? 'storm' : k === 'exped' ? 'exped' : 'h1'); }

  // ---------- one goal as a mountain: every number on every screen comes from here ----------
  K.mtn = function (gid) {
    var g = typeof gid === 'object' ? gid : byId(gid); if (!g) return null;
    var k = kind(g), days = doneDays(g.id), total = days.length, r = k66run(), run = !!(r && r.goal === g.id), dayNo = total, n = total;
    if (run) { var pend = r.state === 'pending'; n = pend ? 0 : (r.todayDone ? r.day : r.day - 1); dayNo = pend ? 0 : r.day; }
    var pk = picKey(g), o = { g: g, id: g.id, name: g.name, kind: k, run: run, done: n, total: total, day: dayNo, pk: pk,
      pic: ART + pk + '_sm.webp', big: ART + pk + '.webp', summitAt: total >= TOP ? days[TOP - 1] : null, last: days[days.length - 1] || null };
    if (k === 'climb') {
      var choice = (summits()[g.id] || {}).c, mtn = 1, within = Math.min(n, TOP);
      if (!run && n >= TOP && choice === 'keep') { mtn = Math.min(SEVEN, Math.floor(n / TOP) + 1); within = Math.min(TOP, n - TOP * (mtn - 1)); }
      o.choice = choice || null; o.mountain = mtn; o.within = within; o.seven = !run && choice === 'keep' && n >= TOP * SEVEN;
      o.earned = !run && n >= TOP; o.atTop = within >= TOP; o.frac = within / TOP;
      o.feet = within * STEP; o.ft = num(o.feet) + ' ft'; o.totalFt = ft(n);
      var cp = nextCp(within); o.cp = cp; o.cpIn = cp - within; o.topIn = Math.max(0, TOP - within);
      o.climbing = !o.earned || (choice === 'keep' && !o.seven);
      o.value = mtn > 1 ? 'Mountain ' + mtn + ' of 7' : o.ft;
      var lead = run ? (dayNo ? 'Kaizen 66 · day ' + dayNo : 'Kaizen 66 · starts soon') : mtn > 1 ? 'Day ' + within + ' of 66 on mountain ' + mtn : within ? 'Day ' + within + ' of 66' : 'At the base';
      o.line = lead + (o.atTop ? '' : ' · ' + (cp < TOP ? (run ? '' : 'next ') + 'checkpoint in ' + plural(cp - within, 'day') : 'the top in ' + plural(TOP - within, 'day')));
      if (mtn === SEVEN) o.line = o.line.replace('on mountain 7', 'on Everest');
    } else if (k === 'storm') {
      var st = null; try { st = K.quitStats ? K.quitStats(g.id) : null; } catch (e) {}
      var sl = {}; (g.slips || []).forEach(function (k) { sl[k] = 1; }); var clean = days.filter(function (k) { return !sl[k]; }).length;
      o.clean = clean; o.streak = st ? st.clean : clean; o.slips = st ? st.slips : ((g.slips || []).length); total = clean;
      o.frac = Math.min(1, total / TOP); o.pct = Math.floor(o.frac * 100); o.earned = total >= TOP; o.toClear = Math.max(0, TOP - total);
      o.value = o.earned ? 'Clear skies' : o.pct + '% clear'; o.line = 'Quitting · ' + plural(total, 'clean day'); o.climbing = !o.earned;
    } else {
      var p = { n: 0, t: 0, frac: 0 }; try { p = K.bd.prog(g); } catch (e) {}
      o.steps = p.n; o.stepsT = p.t; o.frac = p.frac; o.earned = p.t > 0 && p.n >= p.t; o.climbing = !o.earned;
      o.next = (g.ms || []).filter(function (m) { return !m.d; })[0] || null;
      o.left = ''; try { o.left = K.bd.leftText ? K.bd.leftText(g) : ''; } catch (e) {}
      o.value = p.n + ' of ' + p.t; o.line = 'Long-term goal · ' + p.n + ' of ' + plural(p.t, 'step') + ' done';
    }
    return o;
  };
  // the most recent missed day in the last week (only days the goal was due), for "You missed Tuesday. You lost nothing."
  function lastMiss(o) {
    if (o.kind !== 'climb' || !o.total) return null;
    var done = {}; doneDays(o.id).forEach(function (k) { done[k] = 1; });
    var t = D(todayKey()), first = doneDays(o.id)[0];
    for (var i = 1; i <= 6; i++) {
      var d = new Date(t); d.setDate(d.getDate() - i); var k = key(d); if (first && k < first) break;
      var due = true; try { if (K.dueOn) due = K.dueOn(o.g, k) !== false; } catch (e) {}
      if (due && !done[k]) return { k: k, label: i === 1 ? 'yesterday' : DAYS[d.getDay()] };
    }
    return null;
  }

  // ---------- 1 · Today: the Kaizen 66 card ----------
  function card() {
    var sec = document.querySelector('section.kzf-66'); if (!sec) return;
    var a = sec.querySelector('a[href*="goal?id="]'), m = a && /[?&]id=([^&#]+)/.exec(a.getAttribute('href')), gid = m ? decodeURIComponent(m[1]) : null;
    if (!gid) { var r = k66run(); gid = r && r.goal; }
    var o = gid && K.mtn(gid); if (!o || o.kind !== 'climb') { sec.classList.remove('kzmx'); return; }
    sec.classList.add('kzmx');
    var bg = sec.querySelector(':scope > .kzmx-bg');
    if (!bg) { bg = document.createElement('img'); bg.className = 'kzmx-bg'; bg.alt = ''; bg.setAttribute('aria-hidden', 'true'); bg.decoding = 'async'; sec.insertBefore(bg, sec.firstChild); }
    if (bg.getAttribute('src') !== o.big) bg.setAttribute('src', o.big);
    var tbox = sec.querySelector('.kzf-tree');
    if (tbox) {
      var mini = tbox.querySelector(':scope > .kzmx-mini'); if (!mini) { mini = document.createElement('div'); mini.className = 'kzmx-mini kzmx-sc'; tbox.appendChild(mini); }
      var MW = Math.round(tbox.getBoundingClientRect().width || (sec.getBoundingClientRect().width - 32)), MH = 210, msig = o.id + '|' + o.done + '|' + MW;
      if (MW > 100 && mini.__sig !== msig) {
        mini.__sig = msig; var ms = climbSvg(o, MW, MH, 62);
        mini.setAttribute('role', 'img'); mini.setAttribute('aria-label', o.name + ': ' + o.ft + ' of ' + num(TOPFT) + ' feet, day ' + (o.run ? o.day : o.within) + ' of 66.');
        mini.innerHTML = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="" style="object-position:50% ' + o.py + '%"><div class="kzmx-bg2"></div>' + ms;
        try { clampLabels(mini); } catch (e) {}
      }
    }
    var bar = sec.querySelector('.kzf-bar');
    if (bar) {
      var fill = bar.querySelector(':scope > i'), w = (o.frac * 100).toFixed(1) + '%'; if (fill && fill.style.width !== w) fill.style.width = w;
      var cpEl = bar.querySelector('.kzmx-cp');
      if (!cpEl) { cpEl = document.createElement('b'); cpEl.className = 'kzmx-cp'; cpEl.setAttribute('aria-hidden', 'true'); bar.appendChild(cpEl); var t = document.createElement('b'); t.className = 'kzmx-top'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = FLAG; bar.appendChild(t); }
      var cpx = (o.cp / TOP * 100).toFixed(2) + '%'; if (cpEl.style.left !== cpx) cpEl.style.left = cpx; cpEl.hidden = o.cp >= TOP;
      var al = o.ft + ' of ' + num(TOPFT) + ' ft. The top is day 66.'; if (bar.getAttribute('aria-label') !== al) { bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', al); }
    }
    var left = sec.querySelector('.kzf-left');
    if (left) {
      var tail = o.atTop ? 'You made it.' : (o.cp < TOP ? 'Next checkpoint in ' + plural(o.cpIn, 'day') + ' · top in ' + o.topIn : 'The top in ' + plural(o.topIn, 'day'));
      if (left.textContent !== o.ft + tail || !left.querySelector('b')) left.innerHTML = '<b>' + o.ft + '</b><span>' + tail + '</span>';
    }
  }

  // ---------- 2 · Growth: your mountains ----------
  var SLOTS = [[48, 9], [80, 27], [19, 30], [57, 48]];
  function short(n) { n = String(n).trim(); if (n.length <= 15) return n; var w = n.split(/\s+/), o = ''; for (var i = 0; i < w.length && (o + ' ' + w[i]).trim().length <= 13; i++) o = (o + ' ' + w[i]).trim(); return (o || n.slice(0, 12)) + '…'; }
  // the Growth photo's ridgeline, traced from its pixels (fraction of the 1050×525 frame); pins stand on these summits
  var RANGE = [[0.004,0.313],[0.023,0.313],[0.042,0.313],[0.061,0.309],[0.08,0.302],[0.099,0.296],[0.118,0.3],[0.137,0.31],[0.156,0.317],[0.175,0.306],[0.194,0.293],[0.213,0.28],[0.232,0.272],[0.251,0.265],[0.27,0.265],[0.29,0.275],[0.309,0.295],[0.328,0.311],[0.347,0.318],[0.366,0.308],[0.385,0.28],[0.404,0.258],[0.423,0.272],[0.442,0.298],[0.461,0.326],[0.48,0.382],[0.499,0.467],[0.518,0.558],[0.537,0.575],[0.556,0.525],[0.575,0.437],[0.594,0.379],[0.613,0.39],[0.632,0.398],[0.651,0.397],[0.67,0.395],[0.69,0.388],[0.709,0.384],[0.728,0.389],[0.747,0.403],[0.766,0.426],[0.785,0.438],[0.804,0.435],[0.823,0.428],[0.842,0.412],[0.861,0.404],[0.88,0.41],[0.899,0.421],[0.918,0.432],[0.937,0.45],[0.956,0.46],[0.975,0.457],[0.994,0.447]];
  // summits to stand on, by how many pins there are (index 0 = the spire, for the Kaizen 66 goal or the first habit earned); the sun gap is skipped
  var RANGE_SETS = [[], [.405], [.405, .70], [.405, .17, .70], [.405, .17, .70, .885]];
  function ridgeY(x) { for (var i = 1; i < RANGE.length; i++) if (RANGE[i][0] >= x) { var a = RANGE[i - 1], b = RANGE[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return RANGE[RANGE.length - 1][1]; }
  function goalHref(id) { return '/pages/goal?id=' + encodeURIComponent(id); }
  function row(o, gold) {
    var aria = o.name + ', ' + (gold ? (o.kind === 'exped' ? 'finished, every step done' : o.kind === 'storm' ? 'clear skies, ' + plural(o.clean, 'clean day') : 'habit earned') : o.line + ', ' + o.value);
    var h = '<a class="kzmx-row' + (gold ? ' gold' : '') + '" href="' + goalHref(o.id) + '" aria-label="' + esc(aria) + '">' +
      '<img class="kzmx-th" src="' + esc(o.pic) + '" alt="" decoding="async"><span class="kzmx-rx">';
    if (gold) {
      var sub = o.kind === 'exped' ? 'Every step done' : o.kind === 'storm' ? 'Clear skies · ' + plural(o.clean, 'clean day')
        : 'Habit earned' + (o.summitAt ? ' ' + fmtDay(o.summitAt) : '') + (o.seven ? ' · all Seven Summits' : o.choice === 'stop' ? ' · stopped at the top' : '');
      h += '<b>' + esc(o.name) + '</b><em>' + esc(sub) + '</em>';
    } else {
      h += '<span class="kzmx-r1"><b>' + esc(o.name) + '</b><i>' + esc(o.value) + '</i></span>' +
        '<span class="kzmx-bar" aria-hidden="true"><i style="width:' + (o.frac * 100).toFixed(1) + '%"></i></span><em>' + esc(o.line) + '</em>';
    }
    return h + '</span></a>';
  }
  var lastG = '';
  function growth() {
    var main = document.getElementById('kz-main'); if (!main || !/\/pages\/profile/.test(location.pathname + '/')) return;
    var act = {}, list = goals().map(function (g) { act[g.id] = 1; return K.mtn(g); }).filter(Boolean);
    var arch = allGoals().filter(function (g) { return !act[g.id]; }).map(function (g) { return K.mtn(g); }).filter(Boolean);
    var now = list.filter(function (o) { return o.climbing; }).sort(function (a, b) { return (b.run ? 1 : 0) - (a.run ? 1 : 0) || b.frac - a.frac; });
    var won = list.concat(arch).filter(function (o) { return o.earned && !(o.kind === 'climb' && o.climbing); });
    var climbs = list.concat(arch).filter(function (o) { return o.kind === 'climb'; });
    var feet = 0, tops = 0; climbs.forEach(function (o) { feet += o.total * STEP; if (o.total >= TOP) tops++; });
    var h = '<h2 class="kzmx-sh kzmx-first">' + (list.length ? 'YOUR ' + list.length + ' MOUNTAIN' + (list.length === 1 ? '' : 'S') : 'YOUR MOUNTAINS') + '</h2>';
    if (!list.length && !won.length) {
      h += '<div class="kzmx-hero kzmx-empty"><img src="' + ART + 'range.webp" alt="A mountain range at dawn"><div class="kzmx-shade"></div>' +
        '<div class="kzmx-et"><b>Every goal is a mountain.</b><span>Check it off and you climb 131 ft. Day 66 is the top.</span>' +
        '<a class="kzmx-btn" href="/pages/my-goals#add">Start your first mountain</a></div></div>';
    } else {
      var lead = now.filter(function (o) { return o.run; }), pins = lead.concat(won.slice(0, 1), now.filter(function (o) { return !o.run; })).slice(0, 4), ph = '';
      var BW = Math.max(300, (main.getBoundingClientRect().width || 390) - 32), BH = 214, cv = cover(BW, BH, 1050, 525, .5);
      // spire first, then left to right so neighbouring labels alternate short / tall stems and never collide
      var spots = RANGE_SETS[pins.length].map(function (x) { return { x: x, px: cv.x + x * cv.w, py: cv.y + ridgeY(x) * cv.h }; });
      var order = spots.slice().sort(function (a, b) { return a.x - b.x; });
      pins.forEach(function (o, i) {
        var sp = spots[i], k = order.indexOf(sp), stem = k % 2 ? 40 : 14, gold = o.earned && !o.climbing;
        var lab = esc(short(o.name)) + (gold ? '' : ' · ' + (o.kind === 'exped' ? o.value : o.kind === 'storm' ? o.pct + '%' : 'day ' + (o.run ? o.day : o.within)));
        ph += '<span class="kzmx-pin' + (gold ? ' gold' : '') + '" data-i="' + i + '" style="left:' + sp.px.toFixed(1) + 'px;top:' + (sp.py + 2).toFixed(1) + 'px;--stem:' + stem + 'px" aria-hidden="true"><b>' + (gold ? '<em class="kzmx-pf">' + FLAG + '</em>' : '') + lab + '</b><i></i><u></u></span>';
      });
      h += '<div class="kzmx-hero" role="img" aria-label="' + esc(num(feet) + ' feet climbed, ' + plural(tops, 'habit') + ' earned, ' + now.length + ' climbing now') + '">' +
        '<img src="' + ART + 'range.webp" alt=""><div class="kzmx-shade"></div>' + ph +
        '<div class="kzmx-stats" aria-hidden="true"><span><b>' + num(feet) + ' ft</b><em>CLIMBED</em></span><span><b>' + now.length + '</b><em>CLIMBING NOW</em></span>' +
        '<span><b class="gold">' + tops + '</b><em>HABITS EARNED</em></span></div></div>';
      if (now.length) h += '<h2 class="kzmx-sh">CLIMBING NOW</h2><div class="kzmx-list">' + now.map(function (o) { return row(o, false); }).join('') + '</div>';
      if (won.length) h += '<h2 class="kzmx-sh">MOUNTAINS YOU\'VE CLIMBED</h2><div class="kzmx-list">' + won.map(function (o) { return row(o, true); }).join('') + '</div>';
    }
    h += '<p class="kzmx-why"><a href="#" data-kzg-why>Why 66 days?</a></p>';
    var sub = document.querySelector('#kz-header .kzpb-sub[data-n]'), dn = sub && sub.getAttribute('data-n');
    if (dn && /^\d+ (trees?|mountains?)$/.test(dn)) sub.setAttribute('data-n', '');   // the count lives in the section title (too wide for the header)
    var sec = document.getElementById('kzmx-g');
    if (sec && h === lastG && sec.parentNode === main && main.firstElementChild === sec) return;
    if (!sec) { sec = document.createElement('section'); sec.id = 'kzmx-g'; sec.className = 'kzmx-g'; sec.setAttribute('aria-label', 'Your mountains'); }
    if (main.firstElementChild !== sec) main.insertBefore(sec, main.firstChild);
    if (h !== lastG) { sec.innerHTML = h; lastG = h; try { clampPins(sec.querySelector('.kzmx-hero')); } catch (e) {} }
    de.classList.add('kz-mtn');
  }

  // ---------- 3 · Goal page: the scene ----------
  function pageGid() { var m = /[?&]id=([^&#]+)/.exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  function cover(W, H, iw, ih, py) { var s = Math.max(W / iw, H / ih), w = iw * s, h = ih * s; return { x: (W - w) / 2, y: (H - h) * py, w: w, h: h }; }
  // ---- scene drawing (Nov 1, v2). Map-app conventions: a casing (dark outline) under every line so it reads on any photo,
  // round caps and joins, a dotted line for the way still ahead, 12 pt checkpoints, a location-style puck for YOU, and
  // markers drawn as real icons (SF Symbols-style flag and check), not hand-made triangles. Labels are 11 pt pills.
  var FLAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21.5V3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4.3c2.7-1.5 5.1-1.1 7.4-.2 2.2.9 4.4 1.3 6.9-.1v9.2c-2.5 1.4-4.7 1-6.9.1-2.3-.9-4.7-1.3-7.4.2z" fill="currentColor"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.5l3.6 3.6L17.5 8.7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  K.mtnFlag = FLAG;
  function routePts(W, H, P) {
    var B = [W * .14, H * .97], pts = [], dx = P[0] - B[0], dy = P[1] - B[1], len = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / len, ny = dx / len;
    [0, .2, .42, .64, .84, 1].forEach(function (t, i) { var off = (i % 2 ? 1 : -1) * W * .12 * Math.pow(1 - t, .9) * (i ? 1 : .3); pts.push([B[0] + dx * t + nx * off, B[1] + dy * t + ny * off]); });
    return smooth(pts, 18);
  }
  // Catmull-Rom → dense polyline (smooth switchbacks instead of straight zigzags)
  function smooth(p, n) {
    if (p.length < 3) return p; var out = [p[0]];
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      for (var k = 1; k <= n; k++) { var t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(function (c) { return .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3); })); }
    }
    return out;
  }
  function along(pts, f) {
    var L = [0], i; for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var t = Math.max(0, Math.min(1, f)) * L[L.length - 1]; for (i = 1; i < pts.length; i++) if (t <= L[i]) { var u = (t - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return { p: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u], i: i }; }
    return { p: pts[pts.length - 1], i: pts.length - 1 };
  }
  function f1(v) { return Math.round(v * 10) / 10; }
  function pl2(pts) { return pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' '); }
  function lines(all, done) {
    var s = '<polyline points="' + pl2(all) + '" class="kzmx-ln-case"/><polyline points="' + pl2(all) + '" class="kzmx-ln-todo"/>';
    if (done.length > 1) s += '<polyline points="' + pl2(done) + '" class="kzmx-ln-dcase"/><polyline points="' + pl2(done) + '" class="kzmx-ln-glow"/><polyline points="' + pl2(done) + '" class="kzmx-ln-done"/>';
    return s;
  }
  function at(x, y, cls, inner, extra) { return '<span class="' + cls + '" style="left:' + f1(x) + 'px;top:' + f1(y) + 'px"' + (extra || '') + '>' + (inner || '') + '</span>'; }
  function summitBadge(P, text, W) { var right = P[0] < W * .62; return at(P[0], P[1], 'kzmx-summit', '<span class="kzmx-sdot"></span><span class="kzmx-stem"></span><b class="kzmx-sbadge">' + FLAG + '</b>') + at(P[0], P[1] - 29, 'kzmx-lab gold ' + (right ? 'r' : 'l'), text); }
  // each habit photo's mountain outline (25 samples across, fraction of the frame), traced from its pixels
  var SKY = {"h1":[0.691,0.686,0.658,0.63,0.656,0.634,0.667,0.603,0.416,0.386,0.36,0.36,0.373,0.391,0.419,0.448,0.468,0.514,0.549,0.571,0.599,0.6,0.606,0.626,0.644],"h2":[0.436,0.444,0.434,0.467,0.447,0.44,0.438,0.461,0.486,0.473,0.629,0.459,0.327,0.373,0.541,0.487,0.632,0.677,0.561,0.711,0.62,0.58,0.568,0.516,0.5],"h3":[0.297,0.287,0.28,0.276,0.278,0.289,0.313,0.336,0.343,0.34,0.352,0.356,0.27,0.27,0.279,0.299,0.331,0.354,0.374,0.576,0.6,0.9,0.9,0.679,0.9],"h4":[0.338,0.333,0.338,0.334,0.332,0.333,0.326,0.308,0.309,0.311,0.323,0.34,0.339,0.34,0.331,0.298,0.299,0.291,0.282,0.272,0.27,0.278,0.281,0.293,0.317],"h5":[0.367,0.364,0.37,0.372,0.376,0.379,0.377,0.374,0.362,0.336,0.311,0.29,0.274,0.277,0.287,0.298,0.303,0.307,0.307,0.31,0.316,0.322,0.33,0.336,0.337],"h6":[0.399,0.416,0.423,0.409,0.417,0.436,0.428,0.396,0.374,0.354,0.362,0.332,0.286,0.281,0.259,0.262,0.246,0.9,0.9,0.9,0.9,0.328,0.36,0.9,0.9],"p01":[0.58,0.9,0.9,0.53,0.508,0.477,0.483,0.409,0.386,0.366,0.334,0.317,0.307,0.313,0.316,0.326,0.359,0.353,0.363,0.376,0.389,0.433,0.9,0.9,0.9],"p02":[0.9,0.488,0.468,0.461,0.444,0.432,0.419,0.402,0.377,0.348,0.333,0.31,0.288,0.308,0.329,0.313,0.331,0.321,0.321,0.306,0.451,0.301,0.288,0.288,0.9],"p03":[0.9,0.9,0.9,0.573,0.9,0.9,0.31,0.454,0.422,0.402,0.31,0.31,0.31,0.31,0.31,0.31,0.31,0.622,0.31,0.31,0.31,0.31,0.31,0.31,0.31],"p04":[0.9,0.9,0.9,0.659,0.9,0.9,0.9,0.9,0.9,0.9,0.336,0.347,0.429,0.319,0.342,0.374,0.413,0.468,0.487,0.483,0.478,0.671,0.717,0.646,0.587],"p05":[0.662,0.642,0.617,0.594,0.561,0.544,0.531,0.519,0.503,0.482,0.457,0.429,0.406,0.412,0.432,0.448,0.464,0.483,0.494,0.494,0.508,0.513,0.516,0.518,0.532],"p06":[0.572,0.617,0.57,0.588,0.641,0.588,0.557,0.538,0.521,0.523,0.459,0.437,0.42,0.646,0.462,0.49,0.53,0.553,0.701,0.626,0.637,0.661,0.671,0.682,0.687],"p07":[0.712,0.722,0.673,0.658,0.75,0.667,0.659,0.636,0.661,0.621,0.564,0.56,0.554,0.589,0.659,0.727,0.651,0.776,0.706,0.699,0.704,0.72,0.803,0.9,0.764],"p08":[0.47,0.454,0.433,0.421,0.409,0.422,0.402,0.39,0.348,0.333,0.29,0.463,0.27,0.34,0.464,0.398,0.41,0.529,0.662,0.417,0.457,0.47,0.48,0.461,0.451],"p09":[0.467,0.463,0.467,0.471,0.484,0.5,0.48,0.451,0.428,0.343,0.3,0.311,0.332,0.347,0.376,0.409,0.439,0.472,0.513,0.521,0.429,0.46,0.451,0.468,0.428],"p10":[0.9,0.9,0.9,0.9,0.9,0.9,0.9,0.443,0.422,0.462,0.418,0.379,0.329,0.3,0.323,0.348,0.381,0.394,0.42,0.437,0.456,0.9,0.9,0.9,0.9],"p11":[0.639,0.646,0.647,0.604,0.559,0.529,0.499,0.472,0.429,0.376,0.331,0.303,0.306,0.313,0.334,0.391,0.416,0.437,0.437,0.442,0.49,0.51,0.536,0.521,0.52],"p12":[0.68,0.654,0.637,0.647,0.631,0.604,0.587,0.56,0.538,0.493,0.462,0.433,0.421,0.428,0.446,0.461,0.484,0.504,0.532,0.558,0.578,0.609,0.62,0.64,0.661],"p13":[0.541,0.531,0.438,0.48,0.417,0.404,0.557,0.359,0.364,0.277,0.277,0.277,0.277,0.364,0.374,0.404,0.46,0.458,0.43,0.471,0.447,0.432,0.451,0.44,0.469],"p14":[0.9,0.492,0.496,0.483,0.479,0.462,0.453,0.431,0.391,0.358,0.343,0.312,0.285,0.31,0.344,0.383,0.401,0.409,0.454,0.482,0.498,0.509,0.514,0.517,0.9],"p15":[0.608,0.616,0.627,0.636,0.622,0.622,0.56,0.528,0.506,0.457,0.416,0.376,0.363,0.363,0.422,0.4,0.423,0.614,0.506,0.526,0.9,0.9,0.707,0.409,0.42],"p16":[0.9,0.9,0.9,0.619,0.593,0.553,0.536,0.517,0.48,0.431,0.378,0.334,0.281,0.294,0.331,0.403,0.9,0.9,0.801,0.829,0.9,0.804,0.771,0.9,0.9],"p17":[0.538,0.528,0.541,0.526,0.511,0.487,0.461,0.451,0.424,0.408,0.398,0.377,0.347,0.37,0.399,0.41,0.434,0.45,0.469,0.472,0.47,0.486,0.48,0.47,0.46],"p18":[0.541,0.533,0.531,0.512,0.471,0.437,0.41,0.397,0.379,0.359,0.357,0.35,0.336,0.382,0.521,0.557,0.45,0.476,0.49,0.494,0.507,0.532,0.547,0.571,0.6],"p19":[0.629,0.65,0.637,0.63,0.618,0.69,0.639,0.613,0.577,0.536,0.51,0.475,0.503,0.526,0.58,0.614,0.623,0.628,0.677,0.671,0.668,0.717,0.684,0.68,0.664],"p20":[0.507,0.536,0.601,0.52,0.492,0.418,0.346,0.43,0.402,0.558,0.421,0.333,0.284,0.341,0.284,0.47,0.3,0.318,0.451,0.499,0.481,0.488,0.473,0.45,0.446],"p21":[0.9,0.9,0.792,0.819,0.799,0.793,0.741,0.793,0.744,0.672,0.774,0.719,0.626,0.774,0.766,0.686,0.67,0.726,0.717,0.744,0.771,0.784,0.801,0.774,0.768],"p22":[0.9,0.9,0.46,0.446,0.428,0.411,0.393,0.374,0.354,0.331,0.306,0.281,0.279,0.291,0.307,0.328,0.351,0.363,0.37,0.387,0.403,0.427,0.444,0.9,0.9],"p23":[0.569,0.366,0.383,0.541,0.461,0.471,0.488,0.474,0.401,0.396,0.359,0.314,0.304,0.477,0.308,0.341,0.413,0.443,0.41,0.396,0.417,0.424,0.43,0.522,0.432],"p24":[0.9,0.9,0.9,0.9,0.534,0.538,0.571,0.54,0.562,0.474,0.442,0.416,0.403,0.412,0.431,0.447,0.564,0.536,0.558,0.596,0.9,0.9,0.9,0.9,0.9],"p25":[0.9,0.9,0.407,0.391,0.28,0.397,0.284,0.391,0.401,0.28,0.28,0.28,0.28,0.294,0.343,0.331,0.363,0.367,0.386,0.428,0.451,0.473,0.512,0.9,0.9]};
  // The trail: it enters from the bottom edge and only ever climbs (never a downhill step), switching back and forth
  // across the mountain's face, always below the mountain's outline and inside a cone under the summit, the switchbacks
  // shrinking with height so it reads as a path on the slope in perspective.
  function trail(o, W, H, c, P) {
    var sky = SKY[o.pk];
    function skyY(x) { if (!sky) return -1e9; var f = Math.max(0, Math.min(1, (x - c.x) / c.w)) * 24, i = Math.floor(f), t = f - i; return c.y + ((sky[i] + ((sky[i + 1] == null ? sky[i] : sky[i + 1]) - sky[i]) * t)) * c.h; }
    function on(x, y) { return y > skyY(x) + 12 && Math.abs(x - P[0]) <= (y - P[1]) * .9 + 4; }
    var base = H + 10, n = 5, cx0 = Math.max(W * .3, Math.min(W * .7, P[0])), ctrl = [], side = P[0] > W / 2 ? -1 : 1;
    for (var k = 0; k <= n; k++) {
      var t = k / n, y = base + (P[1] - base) * t, cx = cx0 + (P[0] - cx0) * Math.pow(t, .7);
      if (k === n) { ctrl.push([P[0], P[1]]); break; }
      var L = cx, R = cx; while (L > 8 && on(L - 4, y)) L -= 4; while (R < W - 8 && on(R + 4, y)) R += 4;
      var a = Math.min(cx - L, R - cx + 0, W * .32) * .72 * Math.pow(1 - t, .6); if (a < 0) a = 0;
      ctrl.push([k === 0 ? cx - side * a * .4 : cx + side * (k % 2 ? 1 : -1) * a, y]);
    }
    var pts = smooth(ctrl, 16);
    for (var m = 1; m < pts.length; m++) {   // never downhill, never in the sky
      if (pts[m][1] < skyY(pts[m][0]) + 6 && m < pts.length - 8) pts[m][1] = skyY(pts[m][0]) + 6;
      if (pts[m][1] > pts[m - 1][1]) pts[m][1] = pts[m - 1][1];
    }
    pts[pts.length - 1] = [P[0], P[1]];
    return pts;
  }
  // height progress 0 (bottom) … 1 (summit) for perspective sizing
  function hp(y, base, top) { return Math.max(0, Math.min(1, (base - y) / ((base - top) || 1))); }
  function etched(pts, done, base, top) {
    var s = '', i, segs = [];
    // the way ahead: footprints that shrink and fade with distance, each with a 1 pt shadow so it sits on the snow
    var L = 0, next = 0;
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (next <= L + d) { var u = (next - L) / (d || 1), x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u, h = hp(y, base, top), r = 1.9 - .8 * h;
        if (!done.inDone || next > done.len) s += '<circle cx="' + f1(x) + '" cy="' + f1(y + .9) + '" r="' + f1(r + .7) + '" class="kzmx-ft-sh"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" class="kzmx-ft" style="opacity:' + (0.95 - .35 * h).toFixed(2) + '"/>';
        next += 7.5 - 3.5 * h; }
      L += d;
    }
    // the part already climbed: a solid orange line that thins with height
    var dpts = done.pts || [];
    for (i = 1; i < dpts.length; i++) segs.push([dpts[i - 1], dpts[i], 4.8 - 2.4 * hp(dpts[i][1], base, top)]);
    var cs = '', gl = '', ln = '';
    segs.forEach(function (g) { var d = 'M' + f1(g[0][0]) + ' ' + f1(g[0][1]) + 'L' + f1(g[1][0]) + ' ' + f1(g[1][1]);
      cs += '<path d="' + d + '" class="kzmx-ln-dcase" style="stroke-width:' + f1(g[2] + 3) + '"/>'; gl += '<path d="' + d + '" class="kzmx-ln-glow" style="stroke-width:' + f1(g[2] + 6) + '"/>'; ln += '<path d="' + d + '" class="kzmx-ln-done" style="stroke-width:' + f1(g[2]) + '"/>'; });
    return s + cs + gl + ln;
  }
  function climbSvg(o, W, H, pad) {
    var pk = PEAK[o.pk] || [.5, .3], c = cover(W, H, 720, 900, .35);
    // the summit sits at least 150 pt down, so the flag never runs into the heading
    c.y = Math.max(H - c.h, Math.min(0, (pad == null ? 150 : pad) - pk[1] * c.h)); o.py = H - c.h ? Math.round(c.y / (H - c.h) * 100) : 50;
    var P = [c.x + pk[0] * c.w, c.y + pk[1] * c.h], pts = trail(o, W, H, c, P), base = H + 10;
    var me = along(pts, o.frac), done = pts.slice(0, me.i).concat([me.p]), mk = '', Ls = 0;
    for (var q = 1; q < done.length; q++) Ls += Math.hypot(done[q][0] - done[q - 1][0], done[q][1] - done[q - 1][1]);
    CPS.forEach(function (d) {
      var p2 = along(pts, d / TOP).p, past = o.within >= d, next = d === o.cp, sc = (1 - .3 * hp(p2[1], base, P[1])).toFixed(2);
      mk += at(p2[0], p2[1], 'kzmx-cp' + (past ? ' on' : '') + (next ? ' next' : ''), '', ' data-s="' + sc + '"').replace('style="', 'style="transform:scale(' + sc + ');');
      if (next && !o.atTop) mk += at(p2[0], p2[1], 'kzmx-lab side', 'DAY ' + d + ' · ' + num(d * STEP) + ' FT');
    });
    mk += summitBadge(P, 'THE TOP · ' + num(TOPFT) + ' FT', W);
    if (!o.atTop && o.frac > 0) mk += at(me.p[0], me.p[1], 'kzmx-puck' + (calm ? '' : ' live'), '<span class="kzmx-pc"></span>') + at(me.p[0], me.p[1], 'kzmx-lab you', 'YOU');
    if (!o.atTop && o.frac === 0) { var st = along(pts, .02).p; mk += at(st[0], Math.min(st[1], H - 16), 'kzmx-puck' + (calm ? '' : ' live'), '<span class="kzmx-pc"></span>') + at(st[0], Math.min(st[1], H - 16), 'kzmx-lab you', 'START'); }
    return '<svg class="kzmx-rt" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + etched(pts, { pts: o.frac > 0 ? done : [], len: Ls, inDone: o.frac > 0 }, base, P[1]) + '</svg>' + mk;
  }
  // the expedition's ridge, traced from the photo itself (fraction of the 1440×760 frame)
  var RIDGE = [[0.003,0.578],[0.025,0.573],[0.047,0.568],[0.069,0.573],[0.092,0.579],[0.114,0.580],[0.136,0.576],[0.158,0.578],[0.181,0.578],[0.203,0.573],[0.225,0.566],[0.247,0.560],[0.269,0.556],[0.292,0.553],[0.314,0.551],[0.336,0.550],[0.358,0.549],[0.381,0.550],[0.403,0.549],[0.425,0.543],[0.447,0.530],[0.469,0.522],[0.492,0.525],[0.514,0.533],[0.536,0.538],[0.558,0.546],[0.581,0.556],[0.603,0.566],[0.625,0.569],[0.647,0.569],[0.669,0.568],[0.692,0.567],[0.714,0.565],[0.736,0.562],[0.758,0.564],[0.781,0.566],[0.803,0.561],[0.825,0.548],[0.847,0.541],[0.869,0.530],[0.892,0.522],[0.914,0.518],[0.936,0.523],[0.958,0.529],[0.981,0.536]];
  var EXPOS = .62;   // object-position x of the original expedition photo (keeps both big peaks in frame)
  var EXP = {"exped":{"x":0.62},"e01":{"x":0.5,"r":[[0.004,0.667],[0.029,0.67],[0.054,0.664],[0.079,0.638],[0.104,0.607],[0.129,0.602],[0.154,0.602],[0.179,0.597],[0.204,0.579],[0.229,0.577],[0.254,0.576],[0.279,0.573],[0.304,0.566],[0.329,0.573],[0.354,0.573],[0.379,0.55],[0.404,0.519],[0.429,0.491],[0.454,0.487],[0.479,0.503],[0.504,0.513],[0.529,0.527],[0.554,0.526],[0.579,0.503],[0.604,0.521],[0.629,0.537],[0.654,0.532],[0.679,0.507],[0.704,0.502],[0.729,0.521],[0.754,0.549],[0.779,0.566],[0.804,0.585],[0.829,0.602],[0.854,0.606],[0.879,0.618],[0.904,0.622],[0.929,0.63],[0.954,0.638],[0.979,0.638]]},"e02":{"x":0.5,"r":[[0.129,0.641],[0.154,0.644],[0.179,0.631],[0.212,0.591],[0.237,0.589],[0.263,0.603],[0.287,0.614],[0.312,0.617],[0.338,0.613],[0.362,0.608],[0.388,0.607],[0.412,0.606],[0.438,0.604],[0.463,0.586],[0.487,0.557],[0.512,0.564],[0.537,0.565],[0.562,0.574],[0.588,0.58],[0.613,0.574],[0.637,0.572],[0.662,0.574],[0.688,0.574],[0.713,0.576],[0.738,0.587],[0.762,0.598],[0.787,0.612],[0.812,0.625],[0.838,0.637],[0.871,0.662],[0.896,0.663],[0.921,0.641],[0.946,0.636],[0.971,0.676]]},"e04":{"x":0.5,"r":[[0.029,0.759],[0.246,0.778],[0.271,0.774],[0.296,0.762],[0.321,0.748],[0.346,0.727],[0.371,0.7],[0.396,0.68],[0.421,0.671],[0.446,0.666],[0.471,0.655],[0.496,0.653],[0.521,0.653],[0.546,0.646],[0.571,0.652],[0.596,0.668],[0.621,0.685],[0.646,0.683],[0.671,0.666],[0.696,0.654],[0.721,0.632],[0.746,0.613],[0.771,0.611],[0.796,0.633],[0.821,0.654]]},"e05":{"x":0.5,"r":[[0.062,0.53],[0.087,0.528],[0.113,0.547],[0.163,0.568],[0.188,0.555],[0.212,0.55],[0.237,0.536],[0.263,0.532],[0.287,0.564],[0.312,0.596],[0.338,0.612],[0.362,0.611],[0.388,0.603],[0.412,0.604],[0.438,0.625],[0.463,0.67],[0.487,0.686],[0.512,0.655],[0.537,0.641],[0.562,0.643],[0.588,0.656],[0.613,0.671],[0.637,0.663],[0.662,0.64],[0.688,0.696],[0.713,0.778],[0.738,0.795],[0.762,0.764],[0.787,0.724],[0.812,0.724],[0.846,0.746],[0.871,0.761],[0.896,0.778]]},"e06":{"x":0.5,"r":[[0.004,0.579],[0.046,0.568],[0.071,0.531],[0.096,0.536],[0.121,0.562],[0.146,0.561],[0.171,0.582],[0.196,0.597],[0.221,0.589],[0.246,0.569],[0.271,0.533],[0.296,0.518],[0.321,0.506],[0.346,0.518],[0.379,0.533],[0.404,0.536],[0.438,0.546],[0.463,0.558],[0.487,0.564],[0.512,0.562],[0.537,0.568],[0.571,0.599],[0.596,0.611],[0.621,0.613],[0.646,0.628],[0.671,0.621],[0.696,0.607],[0.721,0.593],[0.746,0.563],[0.771,0.527],[0.796,0.499],[0.821,0.506],[0.846,0.525],[0.871,0.547],[0.929,0.566],[0.954,0.589],[0.988,0.601]]}};   // ridges traced from each photo's pixels
  EXP.exped.r = RIDGE;
  function expedSvg(o, W, H) {
    var ex = EXP[o.pk] || EXP.exped, c = cover(W, H, 1440, 760, .5); c.x = (W - c.w) * ex.x;
    var R = ex.r.map(function (r) { return [c.x + r[0] * c.w, c.y + r[1] * c.h - 3]; }).filter(function (p) { return p[0] > 10 && p[0] < W - 10; });
    var ms = (o.g.ms || []), n = Math.max(1, ms.length), x0 = R[0][0] + 14, x1 = Math.min(W - 26, R[R.length - 1][0] - 4), mk = '', idx = [];
    // one marker per step, evenly spaced along the ridge (snapped to the nearest traced ridge point); the finish takes the
    // highest point near the right end
    for (var i = 0; i < n; i++) {
      var tx = n === 1 ? x1 : x0 + (x1 - x0) * i / (n - 1), best = 0;
      R.forEach(function (p, k) { if (Math.abs(p[0] - tx) < Math.abs(R[best][0] - tx)) best = k; });
      if (i === n - 1 && n > 1) { var lo = x1 - (x1 - x0) / (n - 1) / 2; R.forEach(function (p, k) { if (p[0] >= lo && p[0] <= W - 18 && p[1] < R[best][1]) best = k; }); }
      idx.push(best);
    }
    var path = R.slice(0, idx[n - 1] + 1), doneTo = o.steps ? idx[Math.min(o.steps, n) - 1] : -1;
    var done = doneTo >= 0 ? R.slice(0, doneTo + 1) : [];
    idx.forEach(function (k, i) {
      var p = R[k], d = !!ms[i] && !!ms[i].d, nx = !d && i === o.steps, last = i === n - 1;
      if (last) { mk += at(p[0], p[1], 'kzmx-summit small', '<span class="kzmx-sdot"></span><span class="kzmx-stem"></span><b class="kzmx-sbadge' + (d ? '' : ' dim') + '">' + FLAG + '</b>'); return; }
      mk += at(p[0], p[1], 'kzmx-step' + (d ? ' on' : nx ? ' next' : ''), d ? CHECK : '<b>' + (i + 1) + '</b>');
    });
    if (o.next) { var nk = idx[Math.min(o.steps, n - 1)]; mk += at(R[nk][0], R[nk][1], 'kzmx-lab below', 'NEXT · STEP ' + (o.steps + 1)); }
    return '<svg class="kzmx-rt" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + lines(path, done) + '</svg>' + mk;
  }
  // after a scene is drawn: keep every label inside the card
  function hit(a, b) { var r = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return r.left < q.right + 4 && q.left < r.right + 4 && r.top < q.bottom + 2 && q.top < r.bottom + 2; }
  function clampLabels(root) {
    var box = root.getBoundingClientRect();
    [].forEach.call(root.querySelectorAll('.kzmx-lab'), function (l) {
      l.style.marginLeft = ''; var r = l.getBoundingClientRect(), dx = 0;
      if (r.right > box.right - 8) dx = box.right - 8 - r.right; if (r.left + dx < box.left + 8) dx = box.left + 8 - r.left;
      if (dx) l.style.marginLeft = Math.round(dx) + 'px';
    });
    // labels never overlap: YOU and the top win; a checkpoint label flips to the other side, then steps aside
    // the top's label never covers the heading: try its side, then the other side, then under the summit
    var top = root.querySelector('.kzmx-lab.gold'), head = [].slice.call(root.querySelectorAll('.kzmx-hd p'));
    if (top) { var tries = top.classList.contains('r') ? ['r', 'l', 'u'] : ['l', 'r', 'u'], k = 0;
      var clash = function () { var r = top.getBoundingClientRect(); return r.left < box.left + 6 || r.right > box.right - 6 || head.some(function (h) { return hit(top, h); }); };
      while (clash() && ++k < tries.length) { top.classList.remove('r', 'l', 'u'); top.classList.add(tries[k]); } }
    var you = root.querySelector('.kzmx-lab.you');
    if (you && [].some.call(root.querySelectorAll('.kzmx-cp'), function (d) { return hit(you, d); })) { you.classList.add('flip'); if (you.getBoundingClientRect().left < box.left + 6) you.classList.remove('flip'); }
    var labs = [].slice.call(root.querySelectorAll('.kzmx-lab')), pri = labs.filter(function (l) { return !l.classList.contains('side'); });
    labs.filter(function (l) { return l.classList.contains('side'); }).forEach(function (l) {
      var marks = [].slice.call(root.querySelectorAll('.kzmx-puck, .kzmx-summit .kzmx-sbadge')), bad = function () { return pri.concat(marks).some(function (o) { return hit(l, o); }); };
      if (bad()) { l.classList.add('flip'); if (bad()) l.hidden = true; }
    });
    // last pass after the flips: nothing may hang outside the card (a label that still can't fit steps aside)
    [].forEach.call(root.querySelectorAll('.kzmx-lab'), function (l) {
      if (l.hidden) return; var r = l.getBoundingClientRect(), m = parseFloat(l.style.marginLeft) || 0, dx = 0;
      if (r.right > box.right - 6) dx = box.right - 6 - r.right; if (r.left + dx < box.left + 6) dx = box.left + 6 - r.left;
      if (dx) { l.style.marginLeft = Math.round(m + dx) + 'px'; if (!l.classList.contains('you') && !l.classList.contains('gold') && pri.concat([].slice.call(root.querySelectorAll('.kzmx-puck'))).some(function (o) { return o !== l && hit(l, o); })) l.hidden = true; }
    });
  }

  // Growth pins: labels stay inside the photo
  // Growth pins: every label in one of two rows above the ridge, never overlapping, never outside the photo;
  // each stem runs straight down from its label to the summit it stands on
  function clampPins(hero) {
    if (!hero) return; var box = hero.getBoundingClientRect(), ROWS = [8, 34, 60], LH = 22, placed = [];
    var pins = [].slice.call(hero.querySelectorAll('.kzmx-pin')).map(function (p) { var b = p.querySelector('b'); b.style.marginLeft = ''; b.style.top = ''; b.style.bottom = ''; return { i: +p.getAttribute('data-i'), p: p, b: b, x: parseFloat(p.style.left), y: parseFloat(p.style.top), w: b.getBoundingClientRect().width, gold: p.classList.contains('gold') }; });
    pins.sort(function (a, b) { return a.i - b.i; });   // the order they were chosen in: Kaizen 66 / earned first
    pins.forEach(function (q) {
      var W = box.width, best = null;
      ROWS.forEach(function (top, r) {
        if (best || top + LH + 8 > q.y) return;
        var l = Math.min(Math.max(q.x - q.w / 2, 8), W - 8 - q.w), tries = [0, 1, -1, 2, -2, 3, -3];
        for (var t = 0; t < tries.length && !best; t++) {
          var L = l + tries[t] * 24; if (L < 8 || L + q.w > W - 8 || L > q.x - 10 || L + q.w < q.x + 10) continue;
          if (!placed.some(function (o) { return o.top === top && L < o.L + o.w + 6 && o.L < L + q.w + 6; })) best = { top: top, L: L };
        }
      });
      if (!best) { q.p.hidden = true; return; }
      placed.push({ top: best.top, L: best.L, w: q.w });
      q.b.style.top = (best.top - q.y) + 'px'; q.b.style.bottom = 'auto'; q.b.style.marginLeft = Math.round(best.L - (q.x - q.w / 2)) + 'px';
      var st = q.p.querySelector('i'); st.style.bottom = 'auto'; st.style.top = (best.top + LH - q.y) + 'px'; st.style.height = Math.max(4, q.y - 5 - best.top - LH) + 'px';
    });
  }
  function stats(cells) { return '<div class="kzmx-st3">' + cells.map(function (c) { return '<span><b' + (c[2] ? ' class="' + c[2] + '"' : '') + '>' + c[0] + '</b><em>' + c[1] + '</em></span>'; }).join('') + '</div>'; }
  var lastScene = '';
  function scene() {
    var page = document.getElementById('kz-goalpage'); if (!page || !/\/pages\/goal/.test(location.pathname)) return;
    var gid = pageGid(), o = gid && K.mtn(gid); if (!o) return;
    var anchor = page.querySelector('.kz-g1name, .kzg-goal, .kzgq, .kz-g1row, .kz66-gp'); if (!anchor) return;
    var host = anchor.parentNode, sec = page.querySelector('#kzmx-scene');
    var W = Math.round((host.getBoundingClientRect().width) || 358), H = o.kind === 'climb' ? 340 : o.kind === 'exped' ? 236 : 300;
    var h = '', head = '', foot = '';
    if (o.kind === 'climb') {
      var eb = o.mountain > 1 ? (o.mountain === SEVEN ? 'EVEREST · MOUNTAIN 7 OF 7' : 'SEVEN SUMMITS · MOUNTAIN ' + o.mountain + ' OF 7') : (o.run ? (o.day ? 'KAIZEN 66 · DAY ' + o.day + ' OF 66' : 'KAIZEN 66 · STARTS SOON') : o.within ? 'DAY ' + o.within + ' OF 66' : 'AT THE BASE · THE TOP IS DAY 66');
      if (o.earned && !o.climbing) eb = 'HABIT EARNED' + (o.summitAt ? ' · ' + fmtDay(o.summitAt).toUpperCase() : '');
      head = '<p class="kzmx-eb">' + esc(eb) + '</p><p class="kzmx-big">' + (o.mountain > 1 ? esc(o.totalFt) : esc(o.ft)) + '</p>' + (o.mountain > 1 ? '<p class="kzmx-sub">in total · day ' + o.within + ' of 66 on this one</p>' : '');
      var svgc = climbSvg(o, W, H); h = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="' + esc('The mountain for ' + o.name) + '" style="object-position:50% ' + o.py + '%"><div class="kzmx-tg"></div><div class="kzmx-bg2"></div>' + svgc;
      var lm = lastMiss(o);
      foot = stats(o.atTop ? [[num(o.total), 'CHECK-OFFS'], [ft(o.total).replace(' ft', ''), 'FEET IN TOTAL'], [o.mountain > 1 ? o.mountain + ' of 7' : '1st', 'MOUNTAIN', 'gold']]
        : [[o.cp < TOP ? plural(o.cpIn, 'day') : plural(o.topIn, 'day'), o.cp < TOP ? 'TO CHECKPOINT' : 'TO THE TOP', 'orange'], [plural(o.topIn, 'day'), 'TO THE TOP'], ['+131 ft', 'EACH CHECK-OFF']]);
      if (lm && !o.atTop) foot += '<div class="kzmx-miss" role="note"><img src="' + ART + 'fog_sm.webp" alt=""><span><b>You missed ' + esc(lm.label === 'yesterday' ? 'yesterday' : lm.label) + '. You lost nothing.</b><em>Missing a day never sends you back down.</em></span></div>';
      if (o.earned && !o.climbing && o.choice !== 'stop') foot += '<button type="button" class="kzmx-cta" data-kzmx-summit="' + esc(o.id) + '">Choose: keep climbing or stop here</button>';
      if (o.seven) foot += '<p class="kzmx-note gold">All Seven Summits. 462 check-offs.</p>';
    } else if (o.kind === 'storm') {
      head = '<p class="kzmx-eb">' + esc(o.name.toUpperCase()) + '</p><p class="kzmx-big">' + plural(o.clean, 'clean day') + '</p><p class="kzmx-sub">' + (o.earned ? 'Clear skies.' : o.clean ? 'The fog is lifting. Clear skies at 66.' : 'Each clean day clears the fog.') + '</p>';
      var fog = (1 - o.frac).toFixed(3);
      h = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="Fog over the mountains" style="object-position:50% 40%"><div class="kzmx-fog" style="opacity:' + fog + '"><i></i><i></i><i></i></div><div class="kzmx-tg"></div><div class="kzmx-bg2"></div>';
      foot = '<div class="kzmx-fogbar" role="img" aria-label="' + o.pct + ' percent clear"><span class="kzmx-bar"><i style="width:' + (o.frac * 100).toFixed(1) + '%"></i></span><span class="kzmx-fl"><em>Thick fog</em><b>' + o.pct + '% clear</b><em class="gold">Clear skies</em></span></div>' +
        stats([[String(o.clean), 'CLEAN DAYS'], [String(o.slips), o.slips === 1 ? 'SLIP, NO RESET' : 'SLIPS, NO RESET'], [o.earned ? 'Clear' : String(o.toClear), o.earned ? 'SKIES' : 'TO CLEAR SKIES', o.earned ? 'gold' : 'orange']]);
    } else {
      var nx = o.next, by = o.g.by ? (K.bd && K.bd.fmtYM ? K.bd.fmtYM(o.g.by) : o.g.by) : '', byShort = o.g.by ? MON[+String(o.g.by).slice(5, 7) - 1] + ' ' + String(o.g.by).slice(0, 4) : '';
      head = '<p class="kzmx-eb">' + esc(o.name.toUpperCase()) + '</p><p class="kzmx-big">' + (o.earned ? 'Every step done' : 'Step ' + Math.min(o.steps + 1, o.stepsT) + ' of ' + o.stepsT) + '</p><p class="kzmx-sub">' + (by ? 'Finish by ' + esc(by) : '') + (o.left ? (by ? ' · ' : '') + esc(o.left) : '') + '</p>';
      h = '<img class="kzmx-ph" src="' + esc(o.big) + '" alt="A ridge of peaks" style="object-position:' + ((EXP[o.pk] || EXP.exped).x * 100) + '% 50%"><div class="kzmx-tg"></div><div class="kzmx-bg2"></div>' + expedSvg(o, W, H);
      foot = stats([[o.steps + ' of ' + o.stepsT, 'STEPS DONE'], [Math.round(o.frac * 100) + '%', 'OF THE WAY', 'orange'], [byShort ? esc(byShort) : 'No date', 'THE FINISH']]) +
        (nx ? '<div class="kzmx-next"><em>NEXT PEAK</em><b>' + esc(nx.t || 'Next step') + '</b>' + (nx.by ? '<span>By ' + esc(K.bd && K.bd.fmtYM ? K.bd.fmtYM(nx.by) : nx.by) + '</span>' : '') + '</div>' : '');
    }
    var aria = o.kind === 'climb' ? o.name + '. ' + (o.run ? 'Kaizen 66 day ' + o.day : 'Day ' + o.within) + ' of 66, ' + o.ft + ' of ' + num(TOPFT) + ' feet.' + (o.atTop ? ' At the top.' : ' Next checkpoint day ' + o.cp + '.')
      : o.kind === 'storm' ? o.name + '. ' + plural(o.clean, 'clean day') + ', ' + o.pct + ' percent clear.' : o.name + '. ' + o.steps + ' of ' + o.stepsT + ' steps done.';
    var full = '<div class="kzmx-sc ' + o.kind + '" style="height:' + H + 'px" role="img" aria-label="' + esc(aria) + '">' + h + '<div class="kzmx-hd">' + head + '</div></div>' + foot;
    var sig = full + W;
    if (sec && sig === lastScene && sec.parentNode) return;
    if (!sec) { sec = document.createElement('section'); sec.id = 'kzmx-scene'; sec.className = 'kzmx-scene'; sec.setAttribute('aria-label', o.kind === 'climb' ? 'The climb' : o.kind === 'storm' ? 'Out of the storm' : 'The expedition'); }
    // right under the goal's name (the page orders its parts with CSS order, so the scene takes the name's order)
    var nm = page.querySelector('.kz-g1name'), before = nm ? nm.nextElementSibling : (page.querySelector('.kzg-goal') || anchor), par = nm ? nm.parentNode : before.parentNode;
    if (before !== sec && sec.previousElementSibling !== nm) par.insertBefore(sec, before);
    if (nm) { var ord = getComputedStyle(nm).order; if (sec.style.order !== ord) sec.style.order = ord; }
    if (sig !== lastScene) { sec.innerHTML = full; lastScene = sig; try { clampLabels(sec.querySelector('.kzmx-sc')); } catch (e) {} }
    de.classList.add('kz-mtn-goal');
  }
  window.addEventListener('resize', function () { lastScene = ''; soon(); });

  // ---------- 4 · Day 66: "You made it." ----------
  var shownNow = {};
  // never on top of another pop-up (quote card, week recap, Kaizen 66 finish, sheets): it waits until they are closed
  var POPS = '[role="dialog"], [aria-modal="true"], .kz-tmodal:not([hidden]), .kz-qcard.in, .kz-qmodal:not([hidden]), .kz-weekpop:not([hidden]), .kz-sheet49.on, .kz66-done, .kz-p3-rc';
  function anyDialog() { return [].some.call(document.querySelectorAll(POPS), function (e) { return e.getClientRects().length && !e.closest('.kzmx-sum'); }); }
  var bootAt = Date.now(), waitT = 0;
  function summitCheck() {
    if (document.querySelector('.kzmx-sum') || anyDialog()) return;
    if (Date.now() - bootAt < 1800) { if (!waitT) waitT = setTimeout(function () { waitT = 0; soon(); }, 1900 - (Date.now() - bootAt)); return; }   // let the day's own pop-ups appear first
    var seen = null; try { seen = K.get('summitseen', null); } catch (e) {} seen = seen && typeof seen === 'object' ? seen : {};
    var today = todayKey(), pick = null, since = null;
    // the screen celebrates reaching the top from now on; goals that were already past 66 when mountains arrived
    // get the same choice from their goal page ("Choose: keep climbing or stop here") instead of a run of pop-ups
    try { since = K.get('mtnsince', null); if (!since) { since = today; K.set('mtnsince', since); } } catch (e) { since = today; }
    goals().some(function (g) {
      var o = K.mtn(g); if (!o || !o.summitAt || o.summitAt < since) return false;
      var due = o.kind === 'climb' ? (o.earned && !o.choice) : (o.kind === 'storm' && o.earned && !(summits()[o.id] || {}).c);
      if (due && seen[o.id] !== today && !shownNow[o.id]) { pick = o; return true; } return false;
    });
    if (pick) showSummit(pick, false);
  }
  function showSummit(o, asked) {
    if (!asked && anyDialog()) return;
    shownNow[o.id] = 1;
    if (!asked) { var seen = {}; try { seen = K.get('summitseen', {}) || {}; } catch (e) {} seen[o.id] = todayKey(); try { K.set('summitseen', seen); } catch (e) {} }
    var climb = o.kind === 'climb', missed = 0;
    if (climb && o.summitAt) { var ds = doneDays(o.id); missed = Math.max(0, Math.round((D(o.summitAt) - D(ds[0])) / 864e5) + 1 - TOP); }
    var s = document.createElement('div'); s.className = 'kzmx-sum'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'kzmx-sum-h');
    s.innerHTML = '<img class="kzmx-sum-ph" src="' + ART + 'summit.webp" alt="Sunrise over a dark summit ridge">' +
      '<div class="kzmx-sum-top"><button type="button" class="kzmx-x" data-sum="close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button type="button" class="kzmx-share" data-sum="share"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5"/></svg>Share</button></div>' +
      '<div class="kzmx-sum-tx"><p class="kzmx-eb gold">' + (climb ? 'DAY 66 · ' + num(TOPFT) + ' FT' : '66 CLEAN DAYS') + '</p><h1 id="kzmx-sum-h">' + (climb ? 'You made it.' : 'Clear skies.') + '</h1>' +
      '<p>' + esc(climb ? o.name + ' is a habit now. 66 check-offs' + (missed ? ', ' + plural(missed, 'day') + ' missed,' : '') + ' and you never had to start over.' : o.name + ' is behind you. 66 clean days' + (o.slips ? ', ' + plural(o.slips, 'slip') + ', and the fog never came back.' : '.')) + '</p>' +
      stats(climb ? [['66', 'CHECK-OFFS'], [String(missed), 'DAYS MISSED'], [num(TOPFT), 'FEET', 'gold']] : [['66', 'CLEAN DAYS'], [String(o.slips), 'SLIPS'], ['100%', 'CLEAR', 'gold']]) + '</div>' +
      '<div class="kzmx-sum-act">' + (climb ? '<button type="button" class="kzmx-gold" data-sum="keep"><span><b>Keep climbing</b><em>Seven Summits · mountain 2 of 7</em></span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
        '<button type="button" class="kzmx-ghost" data-sum="stop">Stop here · keep the habit, no more climbing</button>' : '<button type="button" class="kzmx-gold one" data-sum="clear"><span><b>Done</b></span></button>') + '</div>';
    document.body.appendChild(s); de.classList.add('kzmx-sum-on');
    try { K.tabbar && K.tabbar(false); } catch (e) {}
    var prev = document.activeElement, first = s.querySelector('.kzmx-gold'); setTimeout(function () { first && first.focus(); }, 30);
    function close() { s.remove(); de.classList.remove('kzmx-sum-on'); try { K.tabbar && K.tabbar(true); } catch (e) {} lastG = ''; lastScene = ''; soon(); if (prev && prev.focus) try { prev.focus(); } catch (e) {} }
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sum]'); if (!b) return; var a = b.getAttribute('data-sum');
      if (a === 'keep') { setSummit(o.id, { c: 'keep', at: todayKey() }); close(); }
      else if (a === 'stop') { setSummit(o.id, { c: 'stop', at: todayKey() }); close(); }
      else if (a === 'clear') { setSummit(o.id, { c: 'clear', at: todayKey() }); close(); }
      else if (a === 'share') { try { K.share && K.share(o.id); } catch (er) {} }
      else close();
    });
    s.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-kzmx-summit]'); if (!b) return; var o = K.mtn(b.getAttribute('data-kzmx-summit')); if (o) showSummit(o, true); });

  // ---------- 5 · Retire the tree art ----------
  function gidNear(el) {
    var n = el; for (var i = 0; n && i < 8; i++, n = n.parentElement) {
      var id = n.getAttribute && (n.getAttribute('data-id') || n.getAttribute('data-gid') || n.getAttribute('data-goal'));
      if (id && byId(id)) return id;
      var hr = n.getAttribute && n.getAttribute('href'), m = hr && /[?&]id=([^&#]+)/.exec(hr); if (m && byId(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
      var a = n.querySelector && n.querySelector(':scope > a[href*="goal?id="], :scope [data-id]');
      if (a) { var id2 = a.getAttribute('data-id'), m2 = /[?&]id=([^&#]+)/.exec(a.getAttribute('href') || ''); id2 = id2 && byId(id2) ? id2 : m2 ? decodeURIComponent(m2[1]) : null; if (id2 && byId(id2)) return id2; }
    }
    return null;
  }
  function retireArt() {
    [].forEach.call(document.querySelectorAll('img[src*="/art/trees/"]'), function (img) {
      if (img.closest('#kzmx-g, #kzmx-scene, .kzmx-sum')) return;
      var gid = gidNear(img), o = gid && K.mtn(gid);
      img.setAttribute('src', o ? o.pic : ART + 'h1_sm.webp'); img.classList.add('kzmx-thumb'); if (img.alt && /tree|oak|cherry|maple|birch|willow|bodhi|maidenhair/i.test(img.alt)) img.alt = o ? 'The mountain for ' + o.name : '';
    });
  }

  // ---------- 6 · Share ----------
  function topGoal(gid) {
    if (gid) return K.mtn(gid);
    var r = k66run(); if (r) return K.mtn(r.goal);
    var best = null; goals().forEach(function (g) { var o = K.mtn(g); if (o && o.kind === 'climb' && (!best || o.total > best.total)) best = o; }); return best;
  }
  K.share = function (gid) {
    var o = topGoal(gid), url = 'https://kaizengrow.app';
    var text = !o ? 'I’m building habits one day at a time with Kaizen.' : o.kind === 'climb'
      ? (o.atTop ? 'I made it to the top: 66 days of ' + o.name.toLowerCase() + '.' : 'Day ' + (o.run ? o.day : o.within) + ' of 66 on my climb: ' + o.ft + ' up.') + ' Start your own climb:'
      : o.kind === 'storm' ? plural(o.clean, 'clean day') + ' and counting. Start your own:' : 'Step ' + o.steps + ' of ' + o.stepsT + ' on my expedition. Start your own:';
    return K.shareCard(o).then(function (blob) {
      var file = blob && typeof File === 'function' ? new File([blob], 'kaizen-' + todayKey() + '.png', { type: 'image/png' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text + ' ' + url });
      if (navigator.share) return navigator.share({ text: text + ' ' + url });
    }).catch(function () {});
  };
  K.shareCard = function (o) {
    o = o && o.kind ? o : topGoal(); var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    return new Promise(function (res) { var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); }; img.src = o ? (o.kind === 'climb' && o.atTop ? ART + 'summit.webp' : o.big || ART + 'range.webp') : ART + 'range.webp'; })
      .then(function (img) {
        x.fillStyle = '#0B0C10'; x.fillRect(0, 0, W, H);
        if (img) { var s = Math.max(W / img.width, 1000 / img.height); x.globalAlpha = .9; x.drawImage(img, (W - img.width * s) / 2, 0, img.width * s, img.height * s); x.globalAlpha = 1; }
        var gr = x.createLinearGradient(0, 560, 0, 1000); gr.addColorStop(0, 'rgba(11,12,16,0)'); gr.addColorStop(1, '#0B0C10'); x.fillStyle = gr; x.fillRect(0, 560, W, 790);
        var F = '-apple-system, "SF Pro Display", system-ui, sans-serif'; x.textAlign = 'left';
        x.fillStyle = '#F2CF5B'; x.font = '800 36px ' + F; x.fillText('K A I Z E N', 72, 110);
        if (o) {
          var eb = o.kind === 'climb' ? (o.atTop ? 'DAY 66 · ' + num(TOPFT) + ' FT' : 'DAY ' + (o.run ? o.day : o.within) + ' OF 66') : o.kind === 'storm' ? 'QUITTING' : 'EXPEDITION';
          var big = o.kind === 'climb' ? (o.atTop ? 'I made it.' : o.ft) : o.kind === 'storm' ? plural(o.clean, 'clean day') : o.steps + ' of ' + o.stepsT + ' steps';
          x.fillStyle = '#D2D4DA'; x.font = '700 38px ' + F; x.fillText(eb, 72, 1030);
          x.fillStyle = '#FFFFFF'; x.font = '900 120px ' + F; x.fillText(big, 66, 1150);
          x.fillStyle = '#A9ACB5'; x.font = '600 40px ' + F; x.fillText(String(o.name).slice(0, 34), 72, 1215);
          if (o.kind !== 'exped' && !o.atTop) { x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(72, 1250, W - 144, 10); x.fillStyle = '#FF6A1A'; x.fillRect(72, 1250, (W - 144) * o.frac, 10); }
        }
        x.fillStyle = '#F2CF5B'; x.font = '700 32px ' + F; x.textAlign = 'right'; x.fillText('kaizengrow.app', W - 72, 110);
        return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
      });
  };

  // ---------- run ----------
  var q = 0;
  function run() { [card, growth, scene, retireArt, summitCheck].forEach(function (f) { try { f(); } catch (e) { if (window.console) console.warn('kzmtn', f.name, e); } }); }
  function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; run(); }); }
  K.mtnRefresh = function () { lastG = ''; lastScene = ''; soon(); };
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('#kzmx-g, #kzmx-scene, .kzmx-sum')) continue; soon(); return; }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-n', 'src'] });
  window.addEventListener('storage', soon); window.addEventListener('pageshow', function () { K.mtnRefresh(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) K.mtnRefresh(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
