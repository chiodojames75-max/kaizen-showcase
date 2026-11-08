/* Oct 29 · replaces kzgrove-1025m.js: "Why 66 days?" adds how Kaizen 66 follows the study (pause, not reset). */
/* Oct 25 m (from 1025d): seedlings use the planted v2 art (soil + shadow in the image, leaves on the stem); one meaning per day
   number (K.dayLabel: "Day N" only for the Kaizen 66 run, other goals show days grown); the Grove lists every goal as a row
   (no "Closest" card), one-line header, a gold ring on the soil under the Kaizen 66 tree. */
/* Oct 24 · The grove (James): one goal = one tree, grown on the 66-day clock. Replaces the climb (kzclimb-1023ad) and
   the unlock road. Each goal gets its own species (stored in kz_grove; the first goal keeps the tree you already had).
   Its stage comes only from the days you checked that goal off: planted, sprout (3), seedling (7), sapling (14),
   young tree (30), tree (45), habit earned / full tree (66), then mature (100), strong (180), great (365), ancient (730).
   A missed day never shrinks it; it just doesn't grow. Milestones 66/100/180/365… are celebrated once (kz_climbseen,
   the same record the climb used, so nothing already celebrated replays).
   Where: Tree tab → "Your grove" (old tree hero, XP card and unlock road hidden, not deleted: html.kz-grove);
   Today → "Your trees" strip; goal page → that goal's growth line + change tree; Progress → "Your trees" rows.
   Research: Lally et al. 2010, habit automaticity plateaued after a median of 66 days (range 18–254). Styles: kzgrove-1025d.css (1025d = 1024b + no climbseen write with zero goals) */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzgrove) return; K.__kzgrove = 1;
  K.__kzclimb = 1; // the climb is retired; if its file is still linked somewhere it stays silent
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ART = (window.KZ_ART || '/art/') + 'trees/';
  var PEAKS = [66, 100, 180, 365];
  function peakAt(i) { return i < PEAKS.length ? PEAKS[i] : 365 * (i - PEAKS.length + 2); }
  function doneMap() { try { return (K._getRO ? K._getRO('done', {}) : K.get('done', {})) || {}; } catch (e) { return {}; } }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function allGoals() { try { return (K.allGoals ? K.allGoals() : goals()) || []; } catch (e) { return goals(); } }

  // ---------- data ----------
  // kept from the climb so anything that asked for it still gets the same numbers
  K.climb = function (gid) {
    var d = doneMap()[gid] || {}, days = Object.keys(d).filter(function (k) { return d[k]; }).sort(), day = days.length;
    var i = 0; while (day >= peakAt(i)) i++;
    var from = i ? peakAt(i - 1) : 0, to = peakAt(i);
    return { day: day, metres: day * 40, peak: i + 1, from: from, to: to, frac: (day - from) / (to - from), summits: i,
      summitAt: days.length >= 66 ? days[65] : null, last: days[days.length - 1] || null };
  };
  // what the picture shows (finer than the named stages, so the first weeks change often)
  var VIS = [[0, 'seed', .26], [1, 'sd1', .34], [3, 'sd2', .40], [5, 'sd3', .45], [7, 'sd4', .50], [14, 's1', .58], [21, 's2', .64],
    [30, 's3', .71], [45, 's4', .78], [66, 's5', .86], [100, 's6', .91], [180, 's7', .95], [365, 's8', .98], [730, 's9', 1]];
  // the named milestones (the growth line)
  var MS = [[0, 'Planted', 'seed'], [3, 'Sprout', 'sd2'], [7, 'Seedling', 'sd4'], [14, 'Sapling', 's1'], [30, 'Young tree', 's3'],
    [45, 'Tree', 's4'], [66, 'Habit earned', 's5'], [100, 'Mature tree', 's6'], [180, 'Strong tree', 's7'], [365, 'Great tree', 's8'], [730, 'Ancient tree', 's9']];
  var ORDER = ['oak', 'cherry', 'maple', 'birch', 'golden', 'jade', 'frost', 'emerald', 'midnight', 'inferno', 'aurora', 'obsidian', 'celestial', 'phoenix', 'voidbloom'];
  function img(sp, key, big) { if (/^(seed|sd\d)$/.test(key)) return ART + sp + '/' + key + '_v2.webp'; return ART + sp + '/' + key + '_full' + (/^s\d/.test(key) && !big ? '_sm' : '') + '.webp'; }
  // one meaning per number: "Day N" is the Kaizen 66 run day; every other goal shows days grown
  function k66run() { try { var st = K.k66 && K.k66.state(), r = st && st.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  K.dayLabel = function (gid) {
    var r = k66run(), w = K.grow(gid), n = w.day, grown = n + (n === 1 ? ' day grown' : ' days grown');
    if (r && r.goal === gid) {
      var pend = r.state === 'pending', d = pend ? 0 : r.day, done = pend ? 0 : (r.todayDone ? r.day : r.day - 1);
      return { run: true, day: d, left: 66 - done, frac: done / 66, short: pend ? 'Kaizen 66 · starts soon' : 'Kaizen 66 · day ' + d, text: pend ? 'Kaizen 66 starts soon' : 'Kaizen 66 · day ' + d, grown: grown, aria: pend ? 'Kaizen 66 starts soon' : 'Kaizen 66 day ' + d + ' of 66' };
    }
    return { run: false, day: n, left: Math.max(0, 66 - n), frac: w.frac, short: (w.earned ? '★ ' : '') + grown, text: grown, grown: grown, aria: grown + (w.earned ? ', habit earned' : ' of 66') };
  };
  K.groveImg = img;
  // Oct 24 (speed): grove() was rebuilt from scratch for every single tree (it re-read and sorted every goal each time),
  // so 100 goals meant ~600 full reads of the goal list per screen. It's now reused until any of what it depends on changes.
  var gmemo = null;
  function groveRaw() { try { return [localStorage.getItem('kz_grove'), localStorage.getItem('kz_goals'), localStorage.getItem('kz_archived'), localStorage.getItem('kz_tree')].join('\u0001'); } catch (e) { return null; } }
  function grove() {
    var raw = groveRaw(); if (raw !== null && gmemo && gmemo.raw === raw) return gmemo.m;
    var m = groveBuild(); gmemo = raw === null ? null : { raw: groveRaw(), m: m }; return m;
  }
  function groveBuild() {
    var m = K.get('grove', null), ch = false; if (!m || typeof m !== 'object') { m = {}; ch = true; }
    var gs = allGoals().slice().sort(function (a, b) { return String(a.created || '').localeCompare(String(b.created || '')) || String(a.id).localeCompare(String(b.id)); });
    var used = {}; Object.keys(m).forEach(function (k) { used[m[k]] = (used[m[k]] || 0) + 1; });
    var first = K.treeSpecies ? K.treeSpecies() : 'oak';
    gs.forEach(function (g) {
      if (m[g.id] && K.SPECIES[m[g.id]]) return;
      var pick = null;
      if (!Object.keys(m).length && K.SPECIES[first]) pick = first; // your first goal keeps the tree you already had
      if (!pick) { var low = 1e9; ORDER.forEach(function (s) { if (K.SPECIES[s] && (used[s] || 0) < low) { low = used[s] || 0; pick = s; } }); }
      m[g.id] = pick; used[pick] = (used[pick] || 0) + 1; ch = true;
    });
    if (ch) K.set('grove', m);
    return m;
  }
  K.groveSpecies = function (gid) { return grove()[gid] || 'oak'; };
  K.setGroveSpecies = function (gid, sp) { if (!K.SPECIES[sp]) return; var m = grove(); m[gid] = sp; K.set('grove', m); };
  K.grow = function (gid) {
    var c = K.climb(gid), d = c.day, v = VIS[0], i, ms = MS[0], nx = null;
    for (i = 0; i < VIS.length; i++) if (d >= VIS[i][0]) v = VIS[i];
    for (i = 0; i < MS.length; i++) { if (d >= MS[i][0]) ms = MS[i]; else { nx = MS[i]; break; } }
    var sp = K.groveSpecies(gid);
    return { id: gid, sp: sp, species: (K.SPECIES[sp] || {}).name || 'Tree', day: d, key: v[1], scale: v[2],
      stage: d >= 66 && d < 100 ? 'Full tree' : ms[1], earned: d >= 66, frac: Math.min(1, d / 66),
      next: nx ? { at: nx[0], name: nx[1], left: nx[0] - d } : null, summits: c.summits };
  };

  // ---------- shared bits ----------
  function sigOf(list) { return list.map(function (g) { var w = K.grow(g.id); return g.id + ':' + w.day + ':' + w.sp + ':' + g.name; }).join('|'); }
  function dayLine(w) { try { return K.dayLabel(w.id).short; } catch (e) { return w.day + ' days grown'; } }
  function goalHref(g) { return '/pages/goal?id=' + encodeURIComponent(g.id); }
  function whySheet() {
    if (document.querySelector('.kzg-why')) return;
    var s = document.createElement('div'); s.className = 'kzg-why'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'kzg-why-t');
    s.innerHTML = '<div class="kzg-why-in"><h2 id="kzg-why-t">Why 66 days?</h2>' +
      '<p>In a 2010 study at University College London, people building a new daily habit took a median of <b>66 days</b> before it felt automatic. Some took 18, some took 254.</p>' +
      '<p>So 66 is the usual, not a promise. Missing one day didn\'t undo anyone\'s progress, which is why your tree never shrinks. It just waits for you.</p>' +
      '<p>Kaizen 66 works the same way. A missed day doesn\'t count, but it doesn\'t reset you either: your run waits, and your 66th check-off finishes it. Shields keep your in-a-row streak going.</p>' +
      '<button type="button" class="kzg-btn gold" data-kzg-x>Got it</button></div>';
    document.body.appendChild(s);
    s.addEventListener('click', function (e) { if (e.target === s || e.target.closest('[data-kzg-x]')) s.remove(); });
    var b = s.querySelector('[data-kzg-x]'); if (b) b.focus();
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-kzg-why]')) { e.preventDefault(); whySheet(); } });

  // ---------- Tree tab: your grove ----------
  function groveView() {
    var main = document.getElementById('kz-main'), hero = document.getElementById('kz-treehero'); if (!main || !hero) return;
    var gs = allGoals(), act = {}; goals().forEach(function (g) { act[g.id] = 1; });
    var sec = document.getElementById('kzg-grove');
    var r6 = k66run(), sig = sigOf(gs) + '#' + Object.keys(act).join(',') + '#' + (r6 ? r6.goal + ':' + r6.day + ':' + r6.state + ':' + !!r6.todayDone : '');
    if (sec && sec.__sig === sig) return;
    if (!sec) { sec = document.createElement('section'); sec.id = 'kzg-grove'; sec.className = 'kzg-grove'; sec.setAttribute('aria-label', 'Your grove'); main.insertBefore(sec, main.firstChild); }
    sec.__sig = sig;
    var tt = document.querySelector('.kz-htitle b'); if (tt && /^Tree$/.test(tt.textContent.trim())) tt.textContent = 'Grove';
    if (/^Tree\b/.test(document.title)) document.title = document.title.replace(/^Tree/, 'Grove');
    var ws = gs.map(function (g) { var w = K.grow(g.id); w.g = g; w.arch = !act[g.id]; return w; });
    var earned = ws.filter(function (w) { return w.earned; }).length;
    var h = '<div class="kzg-gh kzg-gh2"><p class="kzg-gs">' + (earned ? '<b>★ ' + earned + (earned === 1 ? ' habit' : ' habits') + ' earned</b>' : '') + '</p>' +
      '<a class="kzg-plus" href="/pages/my-goals#add" aria-label="Plant a new goal">+</a></div>';
    var run66 = k66run();
    if (!ws.length) {
      h += '<div class="kzg-empty"><img src="' + img(K.treeSpecies ? K.treeSpecies() : 'oak', 'seed') + '" alt=""><p>Every goal you add plants a tree. Check it off and it grows. At 66 days, the habit is yours.</p>' +
        '<a class="kzg-btn gold" href="/pages/my-goals#add">Plant your first goal</a></div>';
      sec.innerHTML = h; de.classList.add('kz-grove'); return;
    }
    // biggest trees at the back, rows of up to 4 (3 at the back), front rows lower and larger
    var order = ws.slice().sort(function (a, b) { return b.day - a.day; }), rows = [], k = 0, per = [3, 4];
    while (k < order.length) { var n = per[Math.min(rows.length, 1)]; rows.push(order.slice(k, k + n)); k += n; }
    var one = rows.length === 1, sz1 = function (w) { var t = Math.round(166 * w.scale); return /^(seed|sd\d)$/.test(w.key) ? Math.max(t, 92) : t; };
    var tall = one ? Math.max.apply(null, rows[0].map(sz1)) : 0, RH = one ? Math.max(150, Math.min(190, tall + 70)) : 160, H = 26 + rows.length * RH, sc = '';
    rows.forEach(function (row, r) {
      var base = 20 + (r + 1) * RH - 44, depth = one ? 1 : r / (rows.length - 1), size = one ? 166 : 100 + 18 * depth;
      row.forEach(function (w, i) {
        var x = ((i + .5) / row.length) * 100, th = /^(seed|sd\d)$/.test(w.key) ? Math.max(Math.round(size * w.scale), one ? 92 : 64) : Math.round(size * w.scale), tw = Math.round(th * 1.15);
        var dl = K.dayLabel(w.g.id), v2 = /^(seed|sd\d)$/.test(w.key), is66 = !!(run66 && run66.goal === w.g.id);
        sc += '<a class="kzg-tree' + (w.arch ? ' arch' : '') + (v2 ? ' v2' : '') + (is66 ? ' k66' : '') + '" href="' + goalHref(w.g) + '" style="left:' + x.toFixed(2) + '%;top:' + (base - th) + 'px;--cols:' + row.length + ';--dim:' + (0.78 + 0.22 * depth).toFixed(2) + '" aria-label="' +
          esc(w.g.name) + ': ' + w.species + ', ' + w.stage.toLowerCase() + ', ' + dl.aria + (w.arch ? ', archived' : '') + '">' +
          '<i class="kzg-sh" style="width:' + Math.round(tw * .8) + 'px;top:' + (th - 7) + 'px"></i>' +
          (is66 ? '<i class="kzg-ring" style="width:' + Math.round(Math.max(54, tw * (v2 ? .78 : .7))) + 'px;top:' + (th - (v2 ? 13 : 9)) + 'px"></i>' : '') +
          '<span class="kzg-art" style="width:' + tw + 'px;height:' + th + 'px;animation-delay:-' + ((i * 1.7 + r) % 6).toFixed(1) + 's"><img src="' + img(w.sp, w.key) + '" alt="" decoding="async" loading="lazy"></span>' +
          '<span class="kzg-lbl"><b>' + esc(w.g.name) + '</b><em class="' + (w.earned ? 'e' : '') + (is66 ? ' g' : '') + '">' + esc(dl.short) + (w.arch ? ' · archived' : '') + '</em></span></a>';
      });
    });
    h += '<div class="kzg-scene" style="height:' + H + 'px"><i class="kzg-ground" style="top:' + (20 + RH - 46) + 'px"></i>' + sc + '</div>';
    // every goal gets its own row: Kaizen 66 first, then fewest days left, habits already earned last
    var live = ws.filter(function (w) { return !w.arch; }).map(function (w) { w.dl = K.dayLabel(w.g.id); return w; });
    live.sort(function (a, b) { return (b.dl.run - a.dl.run) || ((a.earned ? 1 : 0) - (b.earned ? 1 : 0)) || (a.dl.left - b.dl.left) || a.g.name.localeCompare(b.g.name); });
    if (live.length) h += '<div class="kzg-rows" role="list">' + live.map(function (w) {
      var nx = w.next, sub = w.dl.run ? w.dl.grown : (w.earned ? w.stage : (nx ? nx.name + ' in ' + nx.left + (nx.left === 1 ? ' day' : ' days') : w.stage));
      var right = w.dl.run ? (w.dl.left > 0 ? w.dl.left + (w.dl.left === 1 ? ' day' : ' days') + ' to go' : 'Last day') : w.earned ? '★ Earned' : w.dl.left + (w.dl.left === 1 ? ' day' : ' days') + ' left';
      return '<a class="kzg-row' + (w.dl.run ? ' k66' : '') + (w.earned ? ' e' : '') + '" role="listitem" href="' + goalHref(w.g) + '" aria-label="' + esc(w.g.name) + ', ' + esc(w.dl.aria) + (nx && !w.earned ? ', ' + esc(nx.name.toLowerCase()) + ' in ' + nx.left + ' days' : '') + '">' +
        '<span class="kzg-rt"><img src="' + img(w.sp, w.key) + '" alt="" loading="lazy"></span>' +
        '<span class="kzg-rb"><span class="kzg-rh"><b>' + esc(w.g.name) + '</b><em>' + esc(right) + '</em></span>' +
        '<span class="kzg-rs">' + (w.dl.run ? '<i class="kzg-66">' + esc(w.dl.short) + '</i> · ' : '') + esc(sub) + '</span>' +
        '<span class="kzg-bar sm' + (w.dl.run ? ' gold' : '') + '"><i style="width:' + Math.max(2, Math.round(Math.min(1, w.dl.frac) * 100)) + '%"></i></span></span></a>';
    }).join('') + '</div>';
    h += '<a class="kzg-plant" href="/pages/my-goals#add">+ Plant a new goal</a><button type="button" class="kzg-link" data-kzg-why>Why 66 days?</button>';
    sec.innerHTML = h; de.classList.add('kz-grove', 'kz-grove2');
    var ht = document.querySelector('#kz-header .kz-htitle'); if (ht && !ht.querySelector('.kzpb-sub')) { var su = document.createElement('span'); su.className = 'kzpb-sub'; (ht.querySelector('span') || ht).appendChild(su); }
    var su2 = document.querySelector('#kz-header .kz-htitle .kzpb-sub'); if (su2) su2.textContent = ws.length + (ws.length === 1 ? ' tree' : ' trees');
  }

  // ---------- Today: your trees ----------
  var shown = {}; try { shown = JSON.parse(sessionStorage.getItem('kz_groveshown') || '{}'); } catch (e) {}
  function todayCard() {
    var host = document.querySelector('#kz-today-s1 .kz-tgroups'); if (!host) return;
    var gs = goals(), box = document.querySelector('.kzg-today');
    if (!gs.length) { if (box) box.remove(); return; }
    var sig = sigOf(gs); if (box && box.__sig === sig) return;
    if (!box) { box = document.createElement('section'); box.className = 'kzg-today'; box.setAttribute('aria-label', 'Your trees'); host.parentNode.insertBefore(box, host.nextSibling); }
    box.__sig = sig;
    var grew = [];
    box.innerHTML = '<div class="kzg-th"><span>Your trees</span><a href="/pages/profile">Grove ›</a></div><div class="kzg-strip">' + gs.map(function (g) {
      var w = K.grow(g.id), up = shown[g.id] != null && w.day > shown[g.id]; if (up) grew.push(g.id);
      return '<a class="kzg-mini' + (w.earned ? ' e' : '') + '" href="' + goalHref(g) + '" data-g="' + esc(g.id) + '" aria-label="' + esc(g.name) + ': ' + w.stage.toLowerCase() + ', day ' + w.day + (w.earned ? ', habit earned' : ' of 66') + '">' +
        '<span class="kzg-mt"><img src="' + img(w.sp, w.key) + '" alt="" style="height:' + Math.round(34 + 66 * w.scale) + '%"></span><b>' + esc(g.name) + '</b><em>' + (w.earned ? '★ ' : '') + dayLine(w) + '</em>' +
        '<span class="kzg-bar sm"><i style="width:' + Math.round(w.frac * 100) + '%"></i></span></a>';
    }).join('') + '</div><p class="kzg-tnote">Each check-off grows that goal\'s tree. Day 66 earns the habit.</p><button type="button" class="kzg-link" data-kzg-why>Why 66 days?</button>';
    if (!calm) grew.forEach(function (id) { var a = box.querySelector('.kzg-mini[data-g="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); if (a) { a.classList.add('pop'); } });
    gs.forEach(function (g) { shown[g.id] = K.grow(g.id).day; }); try { sessionStorage.setItem('kz_groveshown', JSON.stringify(shown)); } catch (e) {}
  }

  // ---------- goal page: this goal's tree ----------
  function goalCard() {
    var page = document.getElementById('kz-goalpage'); if (!page) return;
    var anchor = page.querySelector('.kz-g1stats'); if (!anchor) return;
    var id = new URLSearchParams(location.search).get('id'); if (!id) return;
    var g = allGoals().filter(function (x) { return x.id === id; })[0]; if (!g) return;
    var w = K.grow(id), box = page.querySelector('.kzg-goal'), sig = id + ':' + w.day + ':' + w.sp;
    if (box && box.__sig === sig) return;
    if (!box) { box = document.createElement('section'); box.className = 'kzg-goal'; box.setAttribute('aria-label', 'This goal\'s tree'); anchor.parentNode.insertBefore(box, anchor.nextSibling); }
    box.__sig = sig;
    var last = Math.max(66, w.next ? w.next.at : 66), rows = MS.filter(function (m) { return m[0] <= last; });
    var ticks = MS.filter(function (m) { return m[0] > 0 && m[0] < 66; }).map(function (m) { return '<i style="left:' + (m[0] / 66 * 100).toFixed(1) + '%"></i>'; }).join('');
    box.innerHTML = '<div class="kzg-hero"><i class="kzg-glow' + (w.earned ? ' e' : '') + '"></i><img class="kzg-sway" src="' + img(w.sp, w.key, true) + '" alt="' + esc(w.species) + ', ' + w.stage.toLowerCase() + '" style="height:' + Math.round(w.scale * 190) + 'px"></div>' +
      '<div class="kzg-dayrow"><b>' + w.day + '<small>' + (w.day === 1 ? ' day grown' : ' days grown') + (w.earned ? '' : ' of 66') + '</small></b><em' + (w.earned ? ' class="e"' : '') + '>' +
      (w.earned ? '★ HABIT EARNED' : (66 - w.day) + ' DAYS TO GO') + '</em></div>' +
      '<div class="kzg-bar big">' + ticks + '<i class="f" style="width:' + Math.round(w.frac * 100) + '%"></i><span class="kzg-end' + (w.earned ? ' e' : '') + '"></span></div>' +
      '<div class="kzg-ms">' + rows.map(function (m) {
        var done = w.day >= m[0], now = done && (!w.next || w.next.at > m[0]) && MS.filter(function (x) { return x[0] <= w.day; }).pop()[0] === m[0];
        var gold = m[0] === 66, left = m[0] - w.day;
        return '<div class="kzg-mr' + (now ? ' now' : '') + (done ? ' done' : ' todo') + (gold ? ' gold' : '') + '"><span class="kzg-mi"><img src="' + img(w.sp, m[2]) + '" alt="" loading="lazy"></span>' +
          '<span class="kzg-md">' + m[0] + (m[0] === 1 ? ' DAY' : ' DAYS') + '</span><span class="kzg-mn">' + m[1] + '</span><span class="kzg-mx">' + (now ? 'NOW' : done ? '✓' : 'in ' + left + (left === 1 ? ' day' : ' days')) + '</span></div>';
      }).join('') + '</div>' +
      '<p class="kzg-note">' + esc(w.species) + '. After 66 it keeps growing. A missed day only pauses it; it never shrinks.</p>' +
      '<div class="kzg-acts"><button type="button" class="kzg-btn ghost" data-kzg-pick>Change tree</button><button type="button" class="kzg-btn ghost" data-kzg-why>Why 66 days?</button></div>';
    box.querySelector('[data-kzg-pick]').addEventListener('click', function () { picker(id); });
  }
  function picker(gid) {
    var cur = K.groveSpecies(gid), s = document.createElement('div'); s.className = 'kzg-why kzg-pick'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-labelledby', 'kzg-pick-t');
    s.innerHTML = '<div class="kzg-why-in"><h2 id="kzg-pick-t">Choose this goal\'s tree</h2><p>It keeps every day it has grown.</p><div class="kzg-pgrid">' +
      ORDER.filter(function (k) { return K.SPECIES[k]; }).map(function (k) {
        return '<button type="button" class="kzg-pc' + (k === cur ? ' on' : '') + '" data-sp="' + k + '" aria-pressed="' + (k === cur) + '"><img src="' + img(k, 's5') + '" alt="" loading="lazy"><span>' + esc(K.SPECIES[k].name) + '</span></button>';
      }).join('') + '</div><button type="button" class="kzg-btn ghost" data-kzg-x>Cancel</button></div>';
    document.body.appendChild(s);
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sp]');
      if (b) { K.setGroveSpecies(gid, b.getAttribute('data-sp')); s.remove(); run(); return; }
      if (e.target === s || e.target.closest('[data-kzg-x]')) s.remove();
    });
    var on = s.querySelector('.kzg-pc.on'); if (on) on.focus();
  }

  // ---------- Progress: your trees ----------
  function progRows() {
    var cal = document.querySelector('#kz-prog-s1 #kz-cal'); if (!cal) return;
    var gs = goals(), box = document.querySelector('.kzg-prog');
    if (!gs.length) { if (box) box.remove(); return; }
    var sig = sigOf(gs); if (box && box.__sig === sig) return;
    if (!box) { box = document.createElement('section'); box.className = 'kzg-prog'; box.setAttribute('aria-label', 'Your trees'); cal.parentNode.insertBefore(box, cal); }
    box.__sig = sig;
    var earned = gs.filter(function (g) { return K.grow(g.id).earned; }).length;
    box.innerHTML = '<div class="kzg-th"><span>Your trees</span><em>' + earned + ' of ' + gs.length + ' habits earned</em></div>' + gs.map(function (g) {
      var w = K.grow(g.id);
      return '<a class="kzg-pr" href="' + goalHref(g) + '"><span class="kzg-pt"><img src="' + img(w.sp, w.key) + '" alt=""></span><span class="kzg-pb"><span class="kzg-ph"><b>' + esc(g.name) + '</b><em' + (w.earned ? ' class="e"' : '') + '>' +
        (w.earned ? '★ ' + w.stage + ' · ' + w.day + ' days grown' : w.stage + ' · ' + w.day + ' of 66 days grown') + '</em></span><span class="kzg-bar sm"><i style="width:' + Math.round(w.frac * 100) + '%"></i></span></span></a>';
    }).join('');
  }

  // ---------- habit earned (66) and later milestones, once each ----------
  var seen = null;
  function getSeen() {
    if (seen) return seen; seen = K.get('climbseen', null);
    if (!seen) { seen = {}; var gs = allGoals(); if (!gs.length) { seen = null; return {}; } gs.forEach(function (g) { seen[g.id] = K.climb(g.id).summits; }); K.set('climbseen', seen); } // Oct 25 d: nothing is written while there are no goals (Delete all data leaves no key behind)
    return seen;
  }
  function busy() { return !!document.querySelector('.kz-p3, .kz-p4, #kz-reveal:not([hidden]), .kz-sheet49:not([hidden]).on, .kz-qcard.in, .kz-setup, .kzg-over, .kzg-why, .kz-qmodal:not([hidden])'); }
  function checkEarned(tries) {
    if (!document.querySelector('#kz-today-s1')) return;
    var s = getSeen(), hit = null;
    goals().forEach(function (g) { var c = K.climb(g.id); if (c.summits > (s[g.id] || 0) && !hit) hit = g; });
    if (!hit) return;
    if (busy()) { if ((tries || 0) < 40) setTimeout(function () { checkEarned((tries || 0) + 1); }, 1500); return; }
    var c = K.climb(hit.id); s[hit.id] = c.summits; K.set('climbseen', s);
    earnedMoment(hit, c.summits);
  }
  function earnedMoment(g, n) {
    var at = peakAt(n - 1), w = K.grow(g.id), key = at >= 730 ? 's9' : at >= 365 ? 's8' : at >= 180 ? 's7' : at >= 100 ? 's6' : 's5';
    var title = at === 66 ? 'Habit earned.' : at === 100 ? 'Mature tree.' : at === 180 ? 'Strong tree.' : at === 365 ? 'Great tree.' : 'Ancient tree.';
    var line = at === 66 ? '66 days is about how long a habit takes to stick. Your ' + esc(w.species) + ' is fully grown.' : 'Day ' + at + '. Still growing, still yours.';
    var nx = w.next;
    var o = document.createElement('div'); o.className = 'kzg-over' + (calm ? ' calm' : ''); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', title);
    o.innerHTML = '<div class="kzg-ov-in"><div class="kzg-ov-art"><i class="kzg-halo"></i>' +
      (calm ? '' : '<i class="kzg-leaf" style="left:24%;--dx:-30px;animation-delay:.8s"></i><i class="kzg-leaf" style="left:66%;--dx:24px;animation-delay:1.6s"></i><i class="kzg-leaf g" style="left:44%;--dx:-12px;animation-delay:2.4s"></i><i class="kzg-leaf g" style="left:78%;--dx:30px;animation-delay:3.1s"></i>') +
      '<img class="kzg-ov-tree" src="' + img(w.sp, key, true) + '" alt="' + esc(w.species) + ', fully grown"></div>' +
      '<div class="kzg-ov-tx"><span class="kzg-ov-k">' + esc(g.name).toUpperCase() + ' · DAY ' + at + '</span><h2>' + title + '</h2><p>' + line + '</p></div>' +
      (nx ? '<div class="kzg-ov-next"><img src="' + img(w.sp, nx.at >= 730 ? 's9' : nx.at >= 365 ? 's8' : nx.at >= 180 ? 's7' : 's6') + '" alt=""><span><b>It keeps growing</b><em>' + nx.name + ' at day ' + nx.at + ' · ' + nx.left + (nx.left === 1 ? ' day' : ' days') + '</em></span></div>' : '') +
      '<div class="kzg-ov-acts"><a class="kzg-btn gold" href="/pages/profile">See it in your grove</a><button type="button" class="kzg-btn ghost" data-kzg-done>Keep going</button></div></div>';
    document.body.appendChild(o); document.body.classList.add('kz-noscroll');
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
    var close = function () { o.remove(); if (!document.querySelector('.kz-sheet49:not([hidden]), .kz-reveal:not([hidden])')) document.body.classList.remove('kz-noscroll'); };
    o.addEventListener('click', function (e) { if (e.target.closest('[data-kzg-done]')) close(); });
    var b = o.querySelector('[data-kzg-done]'); if (b) setTimeout(function () { b.focus(); }, 50);
  }

  // ---------- the unlock road is retired: its "UNLOCKED" pop-up never shows ----------
  function noReveal() {
    var rv = document.getElementById('kz-reveal'); if (!rv || rv.__kzg) return; rv.__kzg = 1;
    var hide = function () { if (!rv.hidden) { rv.hidden = true; if (!document.querySelector('.kz-sheet49:not([hidden])')) document.body.classList.remove('kz-noscroll'); } };
    hide(); new MutationObserver(hide).observe(rv, { attributes: true, attributeFilter: ['hidden'] });
  }

  // ---------- run ----------
  var queued = false;
  function run() {
    queued = false;
    try { noReveal(); } catch (e) {}
    try { groveView(); } catch (e) { de.classList.remove('kz-grove'); }
    try { todayCard(); } catch (e) {}
    try { goalCard(); } catch (e) {}
    try { progRows(); } catch (e) {}
    try { if (document.querySelector('#kz-today-s1')) setTimeout(checkEarned, 1200); } catch (e) {}
  }
  function soon() { if (queued) return; queued = true; (window.requestAnimationFrame || setTimeout)(function () { setTimeout(run, 0); }); }
  ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync', 'kz:alldone', 'kz:k66'].forEach(function (ev) { document.addEventListener(ev, soon); window.addEventListener(ev, soon); });
  window.addEventListener('pageshow', soon); window.addEventListener('storage', soon);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) soon(); });
  // pages build themselves after load; watch the main column, but never react to our own nodes
  function watch() {
    var m = document.getElementById('kz-main'); if (!m || m.__kzgw) return; m.__kzgw = 1;
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) { var t = list[i].target; if (t.closest && t.closest('.kzg-grove, .kzg-today, .kzg-goal, .kzg-prog, #kz-header')) continue; soon(); return; }
    }).observe(m, { childList: true, subtree: true });
  }
  function boot() { watch(); run(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot, 600);
})();
