/* Oct 26 i · cleaned copy of ccc5ef4cbc0d.js: unlock reveal removed, animal list empty. */

(function () {
  var K = window.KZ; if (!K) return;
  var quiet = function () { try { return sessionStorage.getItem('kz_quiet') === '1'; } catch (e) { return false; } }; // automated tests only
  // ---------- streaks + unlocks ----------
  // Best streak: the longest run of days you showed up, with shields turning a missed day into a rest day (same rules as the live streak).
  K.bestStreak = function () {
    var days = K.shownDays(); if (!days.length) return 0;
    var have = {}, best = 0, n = 0, run = 0, sh = 0, tk = K.key(K.today()), g = 0; days.forEach(function (k) { have[k] = 1; });
    for (var d = new Date(days[0] + 'T00:00:00'); g++ < 4000; d = K.addDays(d, 1)) {
      var k = K.key(d); if (k > tk) break;
      if (have[k]) { n++; run++; if (run % 7 === 0 && sh < 2) sh++; }
      else if (k === tk) break;
      else if (sh > 0) sh--;
      else { n = 0; run = 0; sh = 0; }
      if (n > best) best = n;
    }
    return Math.max(best, K.streak());
  };
  // ---------- Rank & XP: the long game ----------
  // XP thresholds that unlock trees and wildlife. Internal only: no rank title is ever shown to the user (removed Oct 21, 2026).
  K.RANKS = [
    { id: 'sprout', name: 'Rookie', xp: 0, tier: 'common' }, { id: 'seedling', name: 'Apprentice', xp: 100, tier: 'common' },
    { id: 'sapling', name: 'Contender', xp: 300, tier: 'common' }, { id: 'grower', name: 'Builder', xp: 600, tier: 'common' },
    { id: 'gardener', name: 'Committed', xp: 1000, tier: 'rare' }, { id: 'ranger', name: 'Disciplined', xp: 1600, tier: 'rare' },
    { id: 'arborist', name: 'Relentless', xp: 2500, tier: 'rare' }, { id: 'forester', name: 'Veteran', xp: 3600, tier: 'epic' },
    { id: 'warden', name: 'Elite', xp: 5000, tier: 'epic' }, { id: 'sage', name: 'Master', xp: 7000, tier: 'epic' },
    { id: 'elder', name: 'Sensei', xp: 10000, tier: 'legendary' }, { id: 'mythic', name: 'Grandmaster', xp: 15000, tier: 'legendary' },
    { id: 'legend', name: 'Legend', xp: 25000, tier: 'mythic' }, { id: 'immortal', name: 'Immortal', xp: 40000, tier: 'mythic' }
  ];
  K.TIER_NAMES = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic' };
  // XP (halved from the first version so unlocks take real effort):
  // goal checked off +5 · every goal done that day +10 · finished day plan pays its points · daily question +3 · quote rating +1
  K.XP = { check: 5, full: 10, journal: 5, rate: 5, todo: 3 };
  K.xp = function () {
    var tk0 = K.key(K.today()), c = K._xpc; if (c && c.v === K._rover() && c.d === tk0) return c.x + (+window.KZ_DEV_XP || 0); /* Oct 22: memoized until data or the day changes */
    var d = K._getRO('done', {}) || {}, x = 0, id, k, days = {};
    for (id in d) for (k in (d[id] || {})) { x += K.XP.check; days[k] = 1; }
    for (k in days) { var di = K.dayInfo ? K.dayInfo(k) : null; if (di && di.status === 'full') x += K.XP.full; }
    if (K.planPointsTotal) x += K.planPointsTotal();
    if (K.todoXP) x += K.todoXP();
    var j = K.get('journal', {}) || {}, r = K.get('rate', {}) || {};
    for (k in j) if (j[k]) x += K.XP.journal; for (k in r) if (r[k]) x += K.XP.rate;
    K._xpc = { v: K._rover(), d: tk0, x: x };
    return x + (+window.KZ_DEV_XP || 0);
  };
  K.unlockLabel = function (n) { return n.toLocaleString() + ' XP'; };
  K.rank = function (xp) {
    xp = xp == null ? K.xp() : xp; var i = 0; K.RANKS.forEach(function (r, n) { if (xp >= r.xp) i = n; });
    var cur = K.RANKS[i], nx = K.RANKS[i + 1] || null;
    return { i: i, cur: cur, next: nx, xp: xp, pct: nx ? Math.max(0, Math.min(100, Math.round(100 * (xp - cur.xp) / (nx.xp - cur.xp)))) : 100 };
  };
  // Trees, by rank: real trees, from an everyday English Oak to the Bristlecone Pine (the oldest living tree on Earth).
  var SP_RANK = { oak: 'sprout', birch: 'seedling', emerald: 'sapling', maple: 'grower', cherry: 'gardener', golden: 'ranger', frost: 'arborist', jade: 'forester', midnight: 'warden', inferno: 'sage', aurora: 'elder', obsidian: 'mythic', celestial: 'mythic', phoenix: 'legend', voidbloom: 'immortal' };
  var rankOf = function (id) { return K.RANKS.filter(function (r) { return r.id === id; })[0] || K.RANKS[0]; };
  K.speciesRank = function (k) { return rankOf(SP_RANK[k] || 'sprout'); };
  K.speciesNeed = function (k) { return K.unlockLabel(K.speciesRank(k).xp); };
  K.speciesUnlocked = function (k, xp) {
    var r = K.speciesRank(k); if (!r.xp) return true;
    if ((K.get('unlocked', {}) || {})[k]) return true;
    if (K.get('tree', null) === k) return true; // already growing it: it stays yours
    return (xp == null ? K.xp() : xp) >= r.xp;
  };
  // Wildlife, by rank. It lives in your tree while the tree is healthy and big enough (a Sapling+).
  K.ANIMALS = [
    { id: 'robin', name: 'Robin', rank: 'sapling', bird: ['#6B4A32', '#E8793A', '#4A3222'] }, { id: 'squirrel', name: 'Squirrel', rank: 'grower' },
    { id: 'bluebird', name: 'Bluebird', rank: 'gardener', bird: ['#3E6FC4', '#E9A15A', '#284A8A'] },
    { id: 'goldfinch', name: 'Goldfinch', rank: 'arborist', bird: ['#B9952A', '#F2D25C', '#2A2A2A'] }, { id: 'tanager', name: 'Scarlet tanager', rank: 'forester', bird: ['#E0261C', '#F04A3A', '#141414'] },
    { id: 'cardinal', name: 'Cardinal', rank: 'warden', bird: ['#C8252C', '#E8574F', '#7A1418'] }, { id: 'bluejay', name: 'Blue jay', rank: 'sage', bird: ['#4A7FD0', '#E8EEF5', '#1E3A6E'] },
    { id: 'raven', name: 'Raven', rank: 'elder', bird: ['#1A1C22', '#3A3E48', '#0A0B0E'] }, { id: 'owl', name: 'Snowy owl', rank: 'mythic', bird: ['#F2F2EE', '#D9D9D2', '#9A9A92'] },
    { id: 'quetzal', name: 'Resplendent quetzal', rank: 'legend', bird: ['#1FA35A', '#D8263A', '#0E6A3A'] }
  ];
  K.ANIMALS.forEach(function (a) { var r = rankOf(a.rank); a.at = r.xp; a.tier = r.tier; a.rankName = r.name; });
  var VISIT_AT = { robin: 100, squirrel: 500 }; K.ANIMALS.forEach(function (a) { if (VISIT_AT[a.id]) a.at = VISIT_AT[a.id]; }); /* Oct 21 */
  var BIRD = function (fill) { return '<path d="M4 14c3 0 5-2 7-5 1.5-2.2 4-3 6-2l3 1-3 1c0 4-3 8-9 8-2 0-3.5-1-4-3z" fill="' + fill + '"/><circle cx="16.5" cy="8.4" r=".9" fill="#0B1020"/>'; };
  K.ANIMAL_ICON = {
    squirrel: '<path d="M17 4c3 1 4 5 2 8-1 1.5-3 2-3 4v4H8c-2 0-3-1.5-3-3 0-2 2-3 4-3 0-3 2-4 4-4 0-3 2-5 4-6z" fill="#B86A34"/>',
    nest: '<path d="M3 12h18c-1 5-5 8-9 8s-8-3-9-8z" fill="#7A5230"/><circle cx="9" cy="10" r="2" fill="#A9D4E8"/><circle cx="14" cy="9.5" r="2" fill="#B9DEEE"/>'
  };
  K.ANIMALS.forEach(function (a) { if (a.bird) K.ANIMAL_ICON[a.id] = BIRD(a.bird[1] === '#E8793A' ? '#C8693A' : a.bird[0] === '#1A1C22' ? '#3A3E48' : a.bird[0]); });
  K.ANIMALS.length = 0; K.STARTERS = []; // Oct 26 i: animals removed (was kznoanimal-1026h.js)
  K.animalsMet = function (G, xp) {
    var seen = K.get('unlocked', {}) || {}, out = {}; xp = xp == null ? K.xp() : xp;
    K.ANIMALS.forEach(function (a) { out[a.id] = xp >= a.at; /* Oct 21: unlocked by XP only */ });
    return out;
  };
  K.birdColors = function () { var met = K.animalsMet(), out = []; K.ANIMALS.forEach(function (a) { if (a.bird && met[a.id]) out.unshift(a.bird); }); return out.slice(0, 4); };
  K.collection = function () {
    var xp = K.xp(), met = K.animalsMet(null, xp);
    return {
      xp: xp, rank: K.rank(xp),
      species: Object.keys(K.SPECIES).map(function (k) { var r = K.speciesRank(k); return { id: k, name: K.SPECIES[k].name, rank: r, tier: r.tier, unlocked: K.speciesUnlocked(k, xp), current: K.treeSpecies() === k }; }),
      wildlife: K.ANIMALS.map(function (a) { return { id: a.id, name: a.name, at: a.at, rankName: a.rankName, tier: a.tier, unlocked: met[a.id] }; })
    };
  };
  // Tree pickers (setup, Edit tree): every tree you own + the next two to chase. The full list lives in the collection.
  K.pickerSpecies = function (cur) {
    var xp = K.xp(), ids = Object.keys(K.SPECIES).sort(function (a, b) { return K.speciesRank(a).xp - K.speciesRank(b).xp; });
    var own = ids.filter(function (k) { return K.speciesUnlocked(k, xp) || k === cur; }), next = ids.filter(function (k) { return own.indexOf(k) < 0; }).slice(0, 2);
    return own.concat(next);
  };
  K.nextUnlock = function () {
    var c = K.collection(), nx = c.rank.next; if (!nx) return null;
    var items = c.species.filter(function (s) { return !s.unlocked && s.rank.id === nx.id; }).map(function (s) { return { kind: 'species', id: s.id, name: s.name }; })
      .concat(c.wildlife.filter(function (w) { return !w.unlocked && w.rankName === nx.name; }).map(function (w) { return { kind: 'wildlife', id: w.id, name: w.name }; }));
    return { rank: nx, items: items, have: c.xp, need: nx.xp, left: nx.xp - c.xp };
  };

  // ---------- sheets ----------
  var open = function (el) { if (!el) return; el.hidden = false; document.body.classList.add('kz-noscroll'); var f = el.querySelector('.kz-btn, button'); if (f) setTimeout(function () { f.focus(); }, 30); };
  var close = function (el) { el.hidden = true; if (!document.querySelector('.kz-sheet49:not([hidden]), .kz-reveal:not([hidden])')) document.body.classList.remove('kz-noscroll'); };
  document.querySelectorAll('.kz-appsheet, .kz-reveal').forEach(function (el) {
    el.addEventListener('click', function (e) { if (e.target === el || e.target.closest('[data-kz-close]')) close(el); });
  });
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; document.querySelectorAll('.kz-appsheet:not([hidden]), .kz-reveal:not([hidden])').forEach(close); });

  // ---------- install ----------
  K.isStandalone = function () { try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) { return false; } };
  K.isIOS = function () { var u = navigator.userAgent || ''; return /iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1); };
  var inst = document.getElementById('kz-install');
  if (inst && K.isIOS()) inst.querySelector('[data-kz-install-note]').hidden = true; // Oct 26 i: pages without the old install sheet skip it
  K.openInstall = function () { if (inst) { open(inst); K.track('kz_install_open'); } };
  document.addEventListener('click', function (e) { if (e.target.closest('[data-kz-open-install]')) { e.preventDefault(); K.openInstall(); } });
  if (K.isStandalone()) { document.documentElement.classList.add('kz-standalone'); if (!K.get('installed', 0)) { K.set('installed', 1); K.track('kz_installed'); } }

  // ---------- reminders (Calendar) ----------
  var rem = document.getElementById('kz-reminders'), R = function () { return K.get('reminders', {}) || {}; };
  var mins = (function () { var t = String(R().morning || '07:30').split(':'), m = (+t[0] || 7) * 60 + (+t[1] || 0); return Math.round(m / 30) * 30; })();
  var fmt = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12; return h12 + ':' + String(mm).padStart(2, '0') + ' ' + ap; };
  var paintTime = function () { rem.querySelector('[data-kz-time-v]').textContent = fmt(mins); };
  var paintState = function () { var on = R().on; document.querySelectorAll('[data-kz-rem-state]').forEach(function (e) { e.textContent = on ? 'On · ' + fmt(mins) : 'Off'; }); };
  rem.addEventListener('click', function (e) {
    var t = e.target.closest('[data-kz-time]'); if (t) { mins = Math.min(11 * 60, Math.max(5 * 60, mins + (+t.dataset.kzTime))); paintTime(); }
  });
  K.openReminders = function (fromFirst) {
    rem.querySelectorAll('[data-kz-tname]').forEach(function (e) { e.textContent = K.treeNamed() ? K.treeName() : 'your tree'; });
    rem.querySelector('[data-kz-rem-badge]').hidden = !fromFirst; paintTime();
    var nat = K.remNative(), on = !!R().on, dn = rem.querySelector('[data-kz-rem-done]');
    rem.querySelector('[data-kz-rem-how]').textContent = 'One nudge in the morning, one rescue at night. Never more than two a day. ' + (nat ? 'They\u2019re phone notifications, so they alert even when Kaizen is closed.' : 'They go on your phone\u2019s Calendar, so they alert even when Kaizen is closed.');
    rem.querySelector('[data-kz-rem-go]').textContent = on ? (nat ? 'Save new time' : 'Add again at this time') : (nat ? 'Turn on reminders' : 'Add reminders to my Calendar');
    rem.querySelector('[data-kz-rem-off]').hidden = !on;
    dn.hidden = !on; if (on) dn.textContent = nat ? 'On at ' + fmt(mins) + ' every morning' + (R().evening ? ', plus 8:00 PM on days with goals left.' : '.') : 'Already on your Calendar at ' + fmt(mins) + '. To change the time, turn these off first, then add again.';
    open(rem); K.track('kz_reminders_open', { first: !!fromFirst });
  };
  document.addEventListener('click', function (e) { if (e.target.closest('[data-kz-open-reminders]')) { e.preventDefault(); K.openReminders(false); } });
  // ---------- Delete my data ----------
  var del = document.getElementById('kz-delete');
  K.openDelete = function () { var S = K.sync; del.querySelector('[data-kz-del-cloud]').hidden = !(S && S.enabled && S.user && S.user()); del.querySelector('[data-kz-del-msg]').hidden = true; open(del); };
  document.addEventListener('click', function (e) { if (e.target.closest('[data-kz-open-delete]')) { e.preventDefault(); K.openDelete(); } });
  K.deleteAll = function () {
    var S = K.sync, msg = del.querySelector('[data-kz-del-msg]'), btn = del.querySelector('[data-kz-del-go]');
    btn.disabled = true; msg.hidden = false; msg.textContent = 'Deleting…';
    var cloud = S && S.deleteAccount ? S.deleteAccount() : Promise.resolve({ cloud: false });
    return cloud.then(function () {
      if (K.remNative()) { try { var h = window.webkit.messageHandlers.kaizen; h.postMessage({ type: 'remindersOff' }); h.postMessage({ type: 'todoSync', items: [], ask: false }); } catch (e) {} }
      try { Object.keys(localStorage).forEach(function (k) { if (/^(kz_|kz\.|kzdemo_|kzreset|kzbak_|kzbad_)/.test(k)) localStorage.removeItem(k); }); localStorage.setItem('kzvault_wiped', '1'); } catch (e) {} /* Oct 22: erasing also removes the automatic backups, and marks the phone's backup copy as deleted */
      try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'wipe' }); } catch (e) {}
      try { sessionStorage.clear(); } catch (e) {}
      msg.textContent = 'Done. Everything is deleted.'; setTimeout(function () { location.href = '/'; }, 900);
    }).catch(function () {
      btn.disabled = false; msg.textContent = 'Couldn’t reach your account to delete it. Nothing was erased. Check your connection and try again.';
    });
  };
  del.querySelector('[data-kz-del-go]').addEventListener('click', function () { K.deleteAll(); });
  K.remNative = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  // Legal links: files inside the app (window.KZ_APP is set by the app build), Shopify pages on the website
  var legalLinks = function () {   // runs once the menu (rendered after this script) exists
    if (window.KZ_APP) document.querySelectorAll('[data-kz-siteonly]').forEach(function (e) { e.remove(); });
    else document.querySelectorAll('a[data-kz-legal]').forEach(function (a) { a.href = '/pages/' + ({ privacy: 'privacy-policy', terms: 'terms-of-service' }[a.dataset.kzLegal] || a.dataset.kzLegal); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', legalLinks); else legalLinks();
  // Turning reminders off: the app cancels every scheduled one. On the web they live in the phone's Calendar, which a web
  // page can't touch, so it says exactly how to delete them there.
  rem.querySelector('[data-kz-rem-off]').addEventListener('click', function () {
    var was = R(); K.set('reminders', { on: 0, morning: was.morning || '07:30', evening: was.evening ? 1 : 0, off: K.key(K.today()) });
    var dn = rem.querySelector('[data-kz-rem-done]'); dn.hidden = false;
    if (K.remNative()) { try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'remindersOff' }); } catch (e) {} dn.textContent = 'Reminders off. Kaizen won\u2019t send any more.'; }
    else dn.textContent = 'Off in Kaizen. To remove them from your phone, open the Calendar app, tap a \u201cKaizen\u201d event, then Delete Event \u2192 Delete All Future Events.';
    rem.querySelector('[data-kz-rem-off]').hidden = true;
    rem.querySelector('[data-kz-rem-go]').textContent = K.remNative() ? 'Turn on reminders' : 'Add reminders to my Calendar';
    paintState(); K.track('kz_reminders_off');
  });
  K.reminderICS = function (m, evening) {
    var d = K.addDays(K.today(), 1), ymd = K.key(d).replace(/-/g, ''), pad = function (n) { return String(n).padStart(2, '0'); };
    var url = "https://yzinwv-8v.myshopify.com/", nm = K.treeNamed() ? K.treeName() : 'your tree', stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    var ev = function (uid, hh, mm, title, desc) {
      return ['BEGIN:VEVENT', 'UID:' + uid + '-' + stamp + '@kaizen', 'DTSTAMP:' + stamp, 'DTSTART:' + ymd + 'T' + pad(hh) + pad(mm) + '00', 'DURATION:PT5M', 'RRULE:FREQ=DAILY', 'SUMMARY:' + title, 'DESCRIPTION:' + desc + '\\n' + url, 'URL:' + url, 'TRANSP:TRANSPARENT',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n');
    };
    var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kaizen//Reminders//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Kaizen',
      ev('kz-morning', Math.floor(m / 60), m % 60, 'Kaizen: plan today', 'Open Kaizen and check today\'s goals. ' + nm + ' is waiting.')];
    if (evening) out.push(ev('kz-rescue', 20, 0, 'Kaizen: rescue ' + nm, 'Goals left? One brings the water back. Already done? Ignore this.'));
    out.push('END:VCALENDAR'); return out.join('\r\n') + '\r\n';
  };
  // The calendar files are real files on Shopify's CDN (assets/kaizen-remind-HHMM[-am].ics, served as text/calendar),
  // one per half hour from 5:00 to 11:00. iPhone Safari opens them with an "Add All" sheet; it blocks generated data: links.
  var RBASE = "";
  K.reminderURL = function (m, evening) {
    var code = String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0'), f = 'kaizen-remind-' + code + (evening ? '' : '-am') + '.ics';
    return RBASE ? RBASE.replace('kaizen-remind-0730.ics', f) : '/' + f;
  };
  rem.querySelector('[data-kz-rem-go]').addEventListener('click', function () {
    var eve = rem.querySelector('[data-kz-rem-eve]').checked, url = K.reminderURL(mins, eve);
    K.set('reminders', { on: 1, morning: String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'), evening: eve ? 1 : 0, via: 'calendar', at: K.key(K.today()) });
    var dn = rem.querySelector('[data-kz-rem-done]'); dn.hidden = false;
    dn.textContent = K.isIOS() ? 'Tap "Add All" on the calendar screen that opens. Then come back here.' : 'Open the calendar file that downloads to add the reminders.';
    paintState(); rem.querySelector('[data-kz-rem-off]').hidden = false; K.track('kz_reminders_on', { morning: fmt(mins), evening: eve });
    if (K.leafFall) K.leafFall(22); try { navigator.vibrate([6, 20, 8]); } catch (e) {}   // the tree's own leaves/petals fall: you can see it worked
    K.lastReminderURL = url;
    try { if (K.isStandalone && K.isStandalone()) window.open(url, '_blank'); else location.href = url; } catch (e) {}
  });
  paintState();
  // Ask once, right after the very first completed goal (the moment it matters most).
  document.addEventListener('kz:step', function (e) {
    if (!e.detail || !e.detail.newLeaf || K.get('remasked', 0) || R().on || quiet()) return;
    K.set('remasked', K.key(K.today()));
    setTimeout(function () { K.openReminders(true); }, 1500);
  });

  // Oct 26 i: the tree/animal unlock reveal is retired (the grove replaced the single tree, and animals are gone). It was
  // force-hidden by kzgrove; its code is removed here instead.
})();
