/* Nov 1 · Mountains, stage 1 (James: "I like the mountain idea since it's 66 days fixed anyway").
   Every goal is its own mountain. Daily habit = the climb (day 66 = the top = 8,660 ft, checkpoints on days 7, 14, 30, 45).
   Long-term goal with a roadmap = the expedition (each step is a peak). Quit = out of the storm (fog clears with clean days).
   This file: (1) the Kaizen 66 card on Today gets its mountain photo, a neon-orange climb bar with the next checkpoint and
   the top, and feet instead of "to go"; (2) the Growth tab shows "Your mountains" instead of the tree grid.
   The tree grid and grove stay loaded underneath (hidden by html.kz-mtn), nothing is deleted, nothing new is stored except
   which mountain photo each goal got (kz_mtnpic). Styles: kzmtn-1101.css. Photos: /art/mtn/. */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K || K.__kzmtn) return; K.__kzmtn = 1;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var ART = (window.KZ_ART || '/art/') + 'mtn/';
  var TOP = 66, FT = 8660, CPS = [7, 14, 30, 45];
  var POOL = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  function ft(n) { return Math.round(n * FT / TOP).toLocaleString('en-US') + ' ft'; }
  function goals() { try { return K.goals() || []; } catch (e) { return []; } }
  function allGoals() { try { return (K.allGoals ? K.allGoals() : goals()) || []; } catch (e) { return goals(); } }
  function byId(id) { var a = allGoals(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function nextCp(n) { for (var i = 0; i < CPS.length; i++) if (n < CPS[i]) return CPS[i]; return TOP; }
  function k66run() { try { var st = K.k66 && K.k66.state(), r = st && st.run; return r && (r.state === 'live' || r.state === 'pending') ? r : null; } catch (e) { return null; } }
  function kind(g) {
    if (g.quit || g.kind === 'quit') return 'storm';
    try { if (K.bd && K.bd.isMs && K.bd.isMs(g)) return 'exped'; } catch (e) {}
    return 'climb';
  }
  // ---------- which photo is which goal's mountain ----------
  var picMemo = null;
  function pics() {
    var raw = null; try { raw = localStorage.getItem('kz_mtnpic') + '|' + localStorage.getItem('kz_goals') + '|' + localStorage.getItem('kz_archived'); } catch (e) {}
    if (picMemo && raw !== null && picMemo.raw === raw) return picMemo.m;
    var m = K.get('mtnpic', null), ch = false; if (!m || typeof m !== 'object') { m = {}; ch = true; }
    var used = {}; Object.keys(m).forEach(function (k) { used[m[k]] = (used[m[k]] || 0) + 1; });
    allGoals().slice().sort(function (a, b) { return String(a.created || '').localeCompare(String(b.created || '')) || String(a.id).localeCompare(String(b.id)); })
      .forEach(function (g) {
        if (m[g.id] && POOL.indexOf(m[g.id]) >= 0) return;
        var pick = POOL[0], low = 1e9; POOL.forEach(function (p) { if ((used[p] || 0) < low) { low = used[p] || 0; pick = p; } });
        m[g.id] = pick; used[pick] = (used[pick] || 0) + 1; ch = true;
      });
    if (ch) K.set('mtnpic', m);
    try { raw = localStorage.getItem('kz_mtnpic') + '|' + localStorage.getItem('kz_goals') + '|' + localStorage.getItem('kz_archived'); } catch (e) { raw = null; }
    picMemo = raw === null ? null : { raw: raw, m: m }; return m;
  }
  function photo(g, big) {
    var k = kind(g), p = k === 'storm' ? 'storm' : k === 'exped' ? 'exped' : (pics()[g.id] || 'h1');
    return ART + p + (big ? '' : '_sm') + '.webp';
  }
  // ---------- one goal as a mountain ----------
  K.mtn = function (gid) {
    var g = typeof gid === 'object' ? gid : byId(gid); if (!g) return null;
    var c = K.climb(g.id), k = kind(g), r = k66run(), run = !!(r && r.goal === g.id), n = c.day, dayNo = n;
    if (run) { var pend = r.state === 'pending'; n = pend ? 0 : (r.todayDone ? r.day : r.day - 1); dayNo = pend ? 0 : r.day; }
    var o = { g: g, id: g.id, kind: k, run: run, done: n, day: dayNo, earned: !run && k !== 'exped' && n >= TOP, frac: Math.min(1, n / TOP),
      summitAt: c.summitAt, pic: photo(g), big: photo(g, true) };
    if (k === 'climb') {
      var cp = nextCp(n); o.ft = ft(Math.min(n, run ? TOP : n)); o.cp = cp; o.cpIn = cp - n; o.topIn = Math.max(0, TOP - n);
      o.value = o.ft;
      o.line = run ? (dayNo ? 'Kaizen 66 · day ' + dayNo : 'Kaizen 66 · starts soon') : 'Day ' + n + ' of 66';
      if (n < TOP) o.line += ' · ' + (cp < TOP ? (run ? '' : 'next ') + 'checkpoint in ' + plural(cp - n, 'day') : 'the top in ' + plural(TOP - n, 'day'));
    } else if (k === 'storm') {
      var pc = Math.round(o.frac * 100); o.value = pc + '% clear'; o.line = 'Quitting · day ' + n + ' clean';
    } else {
      var p = K.bd.prog(g); o.frac = p.frac; o.value = p.n + ' of ' + p.t; o.earned = p.t > 0 && p.n >= p.t;
      o.line = 'Long-term goal · ' + p.n + ' of ' + plural(p.t, 'step') + ' done';
    }
    return o;
  };

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
    var tree = sec.querySelector('.kzf-tree img'); if (tree && tree.getAttribute('src') !== o.big) { tree.setAttribute('src', o.big); tree.alt = 'The mountain for ' + o.g.name; }
    var bar = sec.querySelector('.kzf-bar');
    if (bar) {
      var cpx = (o.cp / TOP * 100).toFixed(2) + '%', cpEl = bar.querySelector('.kzmx-cp');
      if (!cpEl) { cpEl = document.createElement('b'); cpEl.className = 'kzmx-cp'; cpEl.setAttribute('aria-hidden', 'true'); bar.appendChild(cpEl); var t = document.createElement('b'); t.className = 'kzmx-top'; t.setAttribute('aria-hidden', 'true'); bar.appendChild(t); }
      cpEl.style.left = cpx; cpEl.hidden = o.cp >= TOP;
      bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', o.ft + ' of 8,660. The top is day 66.');
    }
    var left = sec.querySelector('.kzf-left');
    if (left) {
      var tail = o.done >= TOP ? 'You made it.' : (o.cp < TOP ? 'Next checkpoint in ' + plural(o.cpIn, 'day') + ' · top in ' + o.topIn : 'The top in ' + plural(o.topIn, 'day'));
      var h = '<b>' + o.ft + '</b><span>' + tail + '</span>';
      if (left.textContent !== o.ft + tail || !left.querySelector('b')) left.innerHTML = h;
    }
  }

  // ---------- 2 · Growth: your mountains ----------
  var SLOTS = [[48, 9], [80, 27], [19, 30], [57, 48]];
  function row(o, done) {
    var aria = o.g.name + ', ' + (done ? (o.kind === 'exped' ? 'finished' : 'habit earned') : o.line + ', ' + o.value);
    var h = '<a class="kzmx-row' + (done ? ' gold' : '') + '" href="/pages/goal?id=' + encodeURIComponent(o.id) + '" aria-label="' + esc(aria) + '">' +
      '<img class="kzmx-th" src="' + esc(o.pic) + '" alt="" decoding="async"><span class="kzmx-rx">';
    if (done) {
      var when = o.summitAt ? new Date(o.summitAt + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      h += '<b>' + esc(o.g.name) + '</b><em>' + (o.kind === 'exped' ? 'Finished · every step done' : 'Habit earned' + (when ? ' ' + when : '') + ' · 8,660 ft') + '</em>';
    } else {
      h += '<span class="kzmx-r1"><b>' + esc(o.g.name) + '</b><i>' + esc(o.value) + '</i></span>' +
        '<span class="kzmx-bar"><i style="width:' + (o.frac * 100).toFixed(1) + '%"></i></span><em>' + esc(o.line) + '</em>';
    }
    return h + '</span></a>';
  }
  var lastG = '';
  function growth() {
    var main = document.getElementById('kz-main'); if (!main || !/\/pages\/profile/.test(location.pathname + '/')) return;
    var act = {}, list = goals().map(function (g) { act[g.id] = 1; return K.mtn(g); }).filter(Boolean);
    var arch = allGoals().filter(function (g) { return !act[g.id]; }).map(function (g) { return K.mtn(g); }).filter(Boolean);
    var now = list.filter(function (o) { return !o.earned; }).sort(function (a, b) { return (b.run ? 1 : 0) - (a.run ? 1 : 0) || b.frac - a.frac; });
    var won = list.concat(arch).filter(function (o) { return o.earned; });
    var climbs = list.concat(arch).filter(function (o) { return o.kind !== 'exped'; });
    var high = 0, days = 0; climbs.forEach(function (o) { days += o.done; if (o.kind === 'climb' && o.done > high) high = Math.min(TOP, o.done); });   // past the top comes with Keep climbing (later stage)
    var h = '<p class="kzmx-sh kzmx-first">' + (list.length ? 'YOUR ' + plural(list.length, 'MOUNTAIN').replace('MOUNTAINs', 'MOUNTAINS') : 'YOUR MOUNTAINS') + '</p>';
    if (!list.length && !won.length) {
      h += '<div class="kzmx-hero kzmx-empty"><img src="' + ART + 'range.webp" alt="A mountain range at dawn"><div class="kzmx-shade"></div>' +
        '<div class="kzmx-et"><b>Every goal is a mountain.</b><span>Check it off and you climb. Day 66 is the top.</span>' +
        '<a class="kzmx-btn" href="/pages/my-goals#add">Start your first mountain</a></div></div>';
    } else {
      var pins = (won.length ? [won[0]] : []).concat(now).slice(0, 4), ph = '';
      pins.forEach(function (o, i) {
        var s = SLOTS[i], gold = o.earned, lab = esc(short(o.g.name)) + (gold ? '' : ' · ' + (o.kind === 'storm' ? 'day ' + o.done : o.kind === 'exped' ? o.value : 'day ' + o.day));
        ph += '<span class="kzmx-pin' + (gold ? ' gold' : '') + '" style="left:' + s[0] + '%;top:' + s[1] + '%" aria-hidden="true"><b>' + lab + '</b><i></i><u></u></span>';
      });
      h += '<div class="kzmx-hero" role="img" aria-label="Your mountains: ' + esc(pins.map(function (o) { return o.g.name; }).join(', ')) + '">' +
        '<img src="' + ART + 'range.webp" alt=""><div class="kzmx-shade"></div>' + ph +
        '<div class="kzmx-stats"><span><b>' + ft(high) + '</b><em>HIGHEST CLIMB</em></span><span><b>' + days.toLocaleString('en-US') + '</b><em>DAYS CLIMBED</em></span>' +
        '<span><b class="gold">' + Math.min(7, won.length) + ' of 7</b><em>SEVEN SUMMITS</em></span></div></div>';
      if (now.length) h += '<p class="kzmx-sh">CLIMBING NOW</p><div class="kzmx-list">' + now.map(function (o) { return row(o, false); }).join('') + '</div>';
      if (won.length) h += '<p class="kzmx-sh">MOUNTAINS YOU\'VE CLIMBED</p><div class="kzmx-list">' + won.map(function (o) { return row(o, true); }).join('') + '</div>';
    }
    h += '<p class="kzmx-why"><a href="#" data-kzg-why>Why 66 days?</a></p>';
    // the page header still counted trees ("6 trees" lives in data-n, drawn by ::after)
    var sub = document.querySelector('#kz-header .kzpb-sub[data-n]'), dn = sub && sub.getAttribute('data-n'), mm = dn && /^(\d+) trees?$/.exec(dn);
    if (mm) sub.setAttribute('data-n', '');   // "6 mountains" is too wide for the header; the count lives in the section title
    var sec = document.getElementById('kzmx-g');
    if (sec && h === lastG && sec.parentNode === main && main.firstElementChild === sec) return;
    if (!sec) { sec = document.createElement('section'); sec.id = 'kzmx-g'; sec.className = 'kzmx-g'; sec.setAttribute('aria-label', 'Your mountains'); }
    if (main.firstElementChild !== sec) main.insertBefore(sec, main.firstChild);
    if (h !== lastG) { sec.innerHTML = h; lastG = h; }
    de.classList.add('kz-mtn');
  }
  function short(n) { n = String(n); return n.length > 14 ? n.split(/\s+/)[0] : n; }

  var q = 0;
  function run() { try { card(); } catch (e) {} try { growth(); } catch (e) {} }
  function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; run(); }); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('#kzmx-g')) continue; soon(); return; }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-n'] });
  window.addEventListener('storage', soon); window.addEventListener('pageshow', soon);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
