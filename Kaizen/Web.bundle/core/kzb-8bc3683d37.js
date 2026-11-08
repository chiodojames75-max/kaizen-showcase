/* ==== kzxp-1026i.js ==== */
;try {
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

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzbase-1026i.js ==== */
;try {
/* Oct 26 i · copy of be37646b32b9.js (plans, to-dos, tree view, share, toast); the tree view is optional per page. */

(function () {
  var K = window.KZ; if (!K) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. The tree, full screen, from anywhere ----------
  var tv = document.getElementById('kz-treeview'), q = function (k) { return tv.querySelector('[data-tv="' + k + '"]'); };
  K.openTreeView = function () {
    var lt = K.lifeTree({}), h = lt.health;
    q('name').textContent = K.treeName(); q('stage').textContent = lt.stage + ' · ' + lt.height;
    q('art').innerHTML = lt.svg; q('bar').querySelector('i').style.width = h.water + '%'; q('bar').setAttribute('aria-valuenow', String(h.water));
    q('mood').textContent = K.treeMood(h) + ' ' + h.water + '% water.';
    tv.hidden = false; document.body.classList.add('kz-noscroll'); K.track('kz_treeview');
    setTimeout(function () { var c = tv.querySelector('[data-kz-close]'); if (c) c.focus(); }, 30);
  };
  var closeTV = function () { tv.hidden = true; if (!document.querySelector('.kz-sheet49:not([hidden]), .kz-reveal:not([hidden])')) document.body.classList.remove('kz-noscroll'); };
  if (tv) { // Oct 26 i: pages without the tree view (Journal) skip it instead of stopping this whole file
    tv.addEventListener('click', function (e) { if (e.target.closest('[data-kz-close]')) closeTV(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tv.hidden) closeTV(); });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-kz-treeview]')) { e.preventDefault(); K.openTreeView(); } });
  } else K.openTreeView = function () {};

  // ---------- Leaf shapes: each tree drops its own kind of leaf (drawn in a -6..6 box) ----------
  K.LEAF_PATHS = {
    lance: 'M0 -5.6C1.7 -3 1.7 2.6 0 5.6C-1.7 2.6-1.7 -3 0 -5.6Z',
    oak: 'M0 -5.6C1.3 -4.7 2.7 -4.7 1.9 -3.2C3.5 -2.8 3.7 -1.3 2.2 -0.8C3.9 -0.2 3.5 1.5 2 1.6C2.8 3 1.6 4.1 0.6 3.4L0.3 5.6H-0.3L-0.6 3.4C-1.6 4.1-2.8 3-2 1.6C-3.5 1.5-3.9 -0.2-2.2 -0.8C-3.7 -1.3-3.5 -2.8-1.9 -3.2C-2.7 -4.7-1.3 -4.7 0 -5.6Z',
    petal: 'M0 5C-3.7 2.6-3.9 -2.4-1.4 -4.5C-0.8 -5-0.3 -4.5 0 -3.6C0.3 -4.5 0.8 -5 1.4 -4.5C3.9 -2.4 3.7 2.6 0 5Z',
    maple: 'M0 -5.6L1.2 -2.6L3.4 -3.6L2.6 -1L5.4 -0.4L3 1.4L3.6 3.2L1 2.6L0.35 5.6H-0.35L-1 2.6L-3.6 3.2L-3 1.4L-5.4 -0.4L-2.6 -1L-3.4 -3.6L-1.2 -2.6Z',
    fan: 'M0.45 5.4L0.5 1.2C4.8 0.6 5.6 -3.2 4.4 -4.6C2.6 -3.6 0.8 -5 0 -4.2C-0.8 -5-2.6 -3.6-4.4 -4.6C-5.6 -3.2-4.8 0.6-0.5 1.2L-0.45 5.4Z',
    needle: 'M-0.32 -5.4H0.32V5.4H-0.32ZM0 -1.4L-3.3 -4.3L-2.9 -4.8L0.2 -2ZM0 0.6L3.3 -2.3L3.7 -1.8L0.4 1.2ZM0 2.4L-3 0L-2.6 -0.5L0.3 1.8Z'
  };
  K.leafLook = function () { var sp = K.SPECIES[K.treeSpecies()] || K.SPECIES.oak; return { path: K.LEAF_PATHS[sp.shape] || K.LEAF_PATHS.lance, colors: sp.leaf }; };

  // Ambient: a few of the tree's own leaves (or petals, or needles) always drifting past it on the Tree tab
  K.addAmbient = function (art) {
    if (!art || art.querySelector('.kz-ambient')) return;
    var h = K.treeHealth ? K.treeHealth() : { status: 'healthy' }; if (h.status === 'dead') return;
    var look = K.leafLook(), n = h.status === 'healthy' || h.status === 'seed' ? 7 : 3, out = '';
    for (var i = 0; i < n; i++) {
      var r = function (a, b) { return a + Math.random() * (b - a); };
      out += '<i style="left:' + r(4, 92).toFixed(0) + '%;--d:' + r(8, 14).toFixed(1) + 's;--dl:-' + r(0, 14).toFixed(1) + 's;--dx:' + r(-40, 40).toFixed(0) + 'px;--sd:' + r(2, 4).toFixed(1) + 's;width:' + r(9, 15).toFixed(0) + 'px;height:' + r(9, 15).toFixed(0) + 'px"><svg viewBox="-6 -6 12 12"><path d="' + look.path + '" fill="' + look.colors[i % 3] + '"/></svg></i>';
    }
    var d = document.createElement('div'); d.className = 'kz-ambient'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = out; art.appendChild(d);
  };
  var ambientInit = function () {
    var host = document.querySelector('[data-kz-treehero]'); if (!host) return;
    var add = function () { K.addAmbient(host.querySelector('.kz-treeart')); };
    new MutationObserver(function () { setTimeout(add, 0); }).observe(host, { childList: true });
    setTimeout(add, 50);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ambientInit); else ambientInit();

  // ---------- Sheets: the page behind stays exactly where it was (iOS was nudging it while typing), and the sheet rides above the keyboard ----------
  (function () {
    var de = document.documentElement, y = 0, on = false, vv = window.visualViewport;
    var sync = function () {
      var want = document.body.classList.contains('kz-noscroll');
      if (want && !on) { on = true; y = scrollY; document.body.style.top = -y + 'px'; de.classList.add('kz-lock'); }
      else if (!want && on) { on = false; de.classList.remove('kz-lock'); document.body.style.top = ''; window.scrollTo(0, y); de.style.removeProperty('--kz-kb'); }
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (vv) { var kb = function () { if (!on) return; var k = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)); de.style.setProperty('--kz-kb', k + 'px'); if (vv.offsetTop) window.scrollTo(0, 0); }; vv.addEventListener('resize', kb); vv.addEventListener('scroll', kb); }
  })();
  // ---------- Smooth scrolling: endless background animations (drifting leaves, snow, dew) pause while the page moves ----------
  (function () { var t = 0, de = document.documentElement; addEventListener('scroll', function () { if (!t) de.classList.add('kz-scrolling'); clearTimeout(t); t = setTimeout(function () { t = 0; de.classList.remove('kz-scrolling'); }, 140); }, { passive: true }); })();
  // ---------- Every button answers a press: gives under the finger (kz-pressed) and a light haptic tick ----------
  (function () {
    var SEL = 'button, .kz-btn, a.kz-pcard-tree, a.kz-pathchip, .kz-chip49, summary, .kz-tabbar a, .kz-rowsw, .kz-rowfile, .kz-menu nav a, [role="button"]', cur = null, t0 = 0;
    var off = function () { if (cur) { var c = cur; cur = null; setTimeout(function () { c.classList.remove('kz-pressed'); }, Math.max(0, 90 - (Date.now() - t0))); } };
    document.addEventListener('touchstart', function (e) { var b = e.target.closest && e.target.closest(SEL); if (!b || b.disabled) return; off(); cur = b; t0 = Date.now(); b.classList.add('kz-pressed');
      try { var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen; if (h && !b.closest('.kz-check')) h.postMessage({ type: 'tick' }); } catch (er) {} }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (ev) { document.addEventListener(ev, off, { passive: true }); });
    document.addEventListener('touchmove', function (e) { if (cur && e.touches[0]) { var r = cur.getBoundingClientRect(), x = e.touches[0].clientX, y = e.touches[0].clientY; if (x < r.left - 12 || x > r.right + 12 || y < r.top - 12 || y > r.bottom + 12) off(); } }, { passive: true });
  })();

  // ---------- 2. Leaves drift down the screen when you complete a goal ----------
  K.leafFall = function (n) {
    if (reduce || !document.body.animate) return;
    var look = K.leafLook(), c = look.colors, W = window.innerWidth, H = window.innerHeight;
    for (var i = 0; i < (n || 10); i++) {
      var p = document.createElement('span'); p.className = 'kz-leaffall';
      p.innerHTML = '<svg viewBox="-6 -6 12 12"><path d="' + look.path + '" fill="' + c[i % 3] + '"/></svg>';
      var x = Math.random() * W, sz = 10 + Math.random() * 10; p.style.left = x + 'px'; p.style.width = p.style.height = sz + 'px';
      document.body.appendChild(p);
      var dx = (Math.random() - 0.5) * 140, rot = (Math.random() - 0.5) * 720, dur = 1700 + Math.random() * 1300;
      var an = p.animate([{ transform: 'translate(0,-30px) rotate(0deg)', opacity: 0 }, { opacity: 1, offset: 0.12 }, { transform: 'translate(' + (dx / 2) + 'px,' + (H * 0.5) + 'px) rotate(' + (rot / 2) + 'deg)', offset: 0.55 }, { transform: 'translate(' + dx + 'px,' + (H + 40) + 'px) rotate(' + rot + 'deg)', opacity: 0.2 }], { duration: dur, delay: Math.random() * 350, easing: 'cubic-bezier(.3,.1,.6,1)' });
      an.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  };
  document.addEventListener('kz:step', function (e) { if (e.detail && e.detail.newLeaf) K.leafFall(9); });

  // ---------- Rain: every completed goal waters the tree you can see (Today's tree picture, the Tree page) ----------
  // Drawn as a fixed overlay over the tree's picture, so it keeps falling even while the picture redraws underneath.
  K.rain = function (el, ms) {
    if (!el || reduce || !document.body.animate) return; var r = el.getBoundingClientRect(); if (r.width < 30 || r.bottom < 0 || r.top > innerHeight) return;
    if (el._kzRain && Date.now() - el._kzRain < 1400) return; el._kzRain = Date.now();
    ms = ms || 1700; var o = document.createElement('div'); o.className = 'kz-rain'; o.setAttribute('aria-hidden', 'true');
    o.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;border-radius:' + getComputedStyle(el).borderRadius;
    var n = Math.round(Math.min(60, Math.max(16, r.width / 6))), ground = r.height * (el.closest('[data-kz-treehero]') ? 0.74 : 0.7), html = '';
    for (var i = 0; i < n; i++) html += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%"></i>';
    o.innerHTML = '<b class="kz-rain-sky"></b>' + html; document.body.appendChild(o);
    o.querySelector('.kz-rain-sky').animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: ms + 500, fill: 'forwards' });
    o.querySelectorAll('i').forEach(function (d) {
      var len = 10 + Math.random() * 12, dl = Math.random() * ms * 0.75, dur = 420 + Math.random() * 260;
      d.style.height = len + 'px';
      d.animate([{ transform: 'translate(0,' + (-len) + 'px)', opacity: 0 }, { opacity: .85, offset: .15 }, { transform: 'translate(-6px,' + ground + 'px)', opacity: .85, offset: .96 }, { transform: 'translate(-6px,' + ground + 'px) scaleY(.2)', opacity: 0 }],
        { duration: dur, delay: dl, iterations: 2, easing: 'cubic-bezier(.4,0,.9,.6)', fill: 'both' });
    });
    setTimeout(function () { o.remove(); }, ms + 1100);
  };
  document.addEventListener('kz:step', function (e) {
    if (!e.detail || !e.detail.newLeaf) return;
    ['[data-t="tree"]', '[data-kz-treehero] .kz-treeart', '.kz-tcard-art'].forEach(function (s) { var el = document.querySelector(s); if (el && el.offsetParent) K.rain(el); });
  });
  document.addEventListener('kz:alldone', function () { setTimeout(function () { K.leafFall(26); }, 250); });

  // ---------- 3. Swipe a goal: right completes it, left shows Archive / Delete ----------
  // Starts anywhere on the row (even on the ⋯ or the check), follows the finger frame by frame,
  // and a quick flick counts as much as a long drag.
  var sw = null, swallow = false, openRow = null, OPENX = -168, raf = 0;
  var setX = function (row, x, animate) {
    row.classList.toggle('kz-swanim', !!animate);
    row.style.transform = x ? 'translate3d(' + x + 'px,0,0)' : '';
    row.style.setProperty('--swp', String(Math.max(0, Math.min(1, -x / -OPENX))));
  };
  var shut = function (row) { if (!row) return; setX(row, 0, true); row.classList.remove('kz-swopen'); if (openRow === row) openRow = null; };
  K.closeSwipe = function () { shut(openRow); };
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.kz-gswipe')) return;
    var row = e.target.closest('.kz-grow');
    if (openRow && openRow !== row) shut(openRow);
    if (!row || row.classList.contains('open') || document.body.classList.contains('kz-dragging')) return;
    if (e.target.closest('input, textarea, select, .kz-gmenu, .kz-editbox, .kz-delbox')) return;
    document.addEventListener('touchmove', swBlock, { passive: false }); document.addEventListener('touchend', swEnd); document.addEventListener('touchcancel', swEnd);
    sw = { row: row, x: e.clientX, y: e.clientY, at: row === openRow ? OPENX : 0, on: false, id: e.pointerId, base: row === openRow ? OPENX : 0, done: row.classList.contains('is-done'), hist: [[e.timeStamp, e.clientX]] };
  }, { passive: true });
  document.addEventListener('pointermove', function (e) {
    if (!sw || e.pointerId !== sw.id) return;
    if (document.body.classList.contains('kz-dragging')) { sw = null; return; }
    var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    sw.hist.push([e.timeStamp, e.clientX]); if (sw.hist.length > 6) sw.hist.shift();
    if (!sw.on) {
      if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; } // it's a scroll
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      sw.mode = (dx > 0 && sw.base === 0) ? 'done' : 'reveal';
      if (sw.mode === 'done' && sw.done) { sw = null; return; }
      sw.on = true; sw.x = e.clientX; dx = 0; // start from here so the row never jumps
      sw.row.classList.add('kz-swiping'); sw.row.classList.remove('kz-swanim'); try { sw.row.setPointerCapture(e.pointerId); } catch (er) {}
    }
    if (sw.mode === 'done') { var r = Math.max(0, dx); sw.at = r > 120 ? 120 + (r - 120) * 0.35 : r; sw.row.classList.toggle('kz-swipe-ok', sw.at > 92); }
    else { var x = sw.base + dx; sw.at = x > 0 ? x * 0.2 : x < OPENX ? OPENX + (x - OPENX) * 0.3 : x; }
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (sw && sw.on) setX(sw.row, sw.at, false); });
  }, { passive: true });
  // Once a sideways swipe starts, the page must not scroll under the finger
  var swBlock = function (e) { if (sw && sw.on) e.preventDefault(); };
  var swEnd = function () { document.removeEventListener('touchmove', swBlock, { passive: false }); document.removeEventListener('touchend', swEnd); document.removeEventListener('touchcancel', swEnd); };
  function velocity(h) { if (h.length < 2) return 0; var a = h[0], b = h[h.length - 1], dt = b[0] - a[0]; return dt > 0 ? (b[1] - a[1]) / dt : 0; } // px per ms
  function endSwipe(e) {
    if (!sw || (e && e.pointerId !== sw.id)) return; var s = sw; sw = null; if (!s.on) return;
    swallow = true; setTimeout(function () { swallow = false; }, 350);
    s.row.classList.remove('kz-swiping', 'kz-swipe-ok');
    var v = velocity(s.hist);
    if (s.mode === 'done') {
      setX(s.row, 0, true);
      if (s.at > 92 || (s.at > 40 && v > 0.6)) { var b = s.row.querySelector('.kz-check:not(.done)'); if (b) { swallow = false; b.click(); swallow = true; K.track('kz_swipe_done'); } }
      return;
    }
    var open = v < -0.45 ? true : v > 0.45 ? false : s.at < OPENX / 2;
    if (open) { setX(s.row, OPENX, true); s.row.classList.add('kz-swopen'); openRow = s.row; try { if (navigator.vibrate) navigator.vibrate(6); } catch (er) {} }
    else shut(s.row);
  }
  document.addEventListener('pointerup', endSwipe);
  document.addEventListener('pointercancel', function (e) { if (sw && sw.on) { endSwipe(e); return; } sw = null; });
  document.addEventListener('click', function (e) {
    if (swallow && e.isTrusted && e.target.closest('.kz-grow')) { e.stopPropagation(); e.preventDefault(); swallow = false; return; }
    var arch = e.target.closest('[data-kz-sw-arch]'), del = e.target.closest('[data-kz-sw-del]');
    if (arch || del) {
      e.stopPropagation(); e.preventDefault();
      var row = (arch || del).closest('.kz-grow'), id = (arch || del).getAttribute(arch ? 'data-kz-sw-arch' : 'data-kz-sw-del');
      var g = K.goals().filter(function (x) { return x.id === id; })[0], nm = g ? g.name : 'this goal';
      if (del && !window.confirm('Delete “' + nm + '” for good? Its steps and leaves are erased. (Archive keeps them.)')) { shut(row); return; }
      row.classList.add('kz-gone');
      setTimeout(function () { openRow = null; if (arch) { K.archiveGoal(id); K.track('kz_goal_archived', { via: 'swipe' }); if (K.toast) K.toast('Archived. Find it in Menu → Archived goals.'); } else { K.removeGoal(id); K.track('kz_goal_deleted', { via: 'swipe' }); } document.dispatchEvent(new CustomEvent('kz:changed')); }, 240);
      return;
    }
    if (openRow && !e.target.closest('.kz-gswipe')) { var r = openRow; shut(r); if (e.target.closest('.kz-grow') === r) { e.stopPropagation(); e.preventDefault(); } }
  }, true);

  // ---------- 4. Share card: the tree + the week, as an image, with a link ----------
  K.shareCard = function () {
    var lt = K.lifeTree({}), h = lt.health, st = K.streak(), wk = K.weekRecap ? K.weekRecap(K.today()) : { shown: 0, steps: 0 }, nm = K.treeName();
    var NS = ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"', sp1 = lt.svg.indexOf(' '), svg = lt.svg.slice(0, sp1) + NS + lt.svg.slice(sp1); // add the namespace right after the opening tag name
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    return new Promise(function (res) {
      var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }).then(function (img) {
      x.fillStyle = '#0D0F13'; x.fillRect(0, 0, W, H);
      var g = x.createRadialGradient(W / 2, 560, 40, W / 2, 560, 620); g.addColorStop(0, '#1C1F25'); g.addColorStop(1, '#0D0F13'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      if (img) { var r = Math.min(900 / img.width, 760 / img.height); var iw = img.width * r, ih = img.height * r; x.save(); x.beginPath(); x.roundRect ? x.roundRect((W - 900) / 2, 150, 900, 780, 56) : x.rect((W - 900) / 2, 150, 900, 780); x.clip(); x.drawImage(img, (W - iw) / 2, 150 + (780 - ih) / 2, iw, ih); x.restore(); }
      x.textAlign = 'center'; x.fillStyle = '#E2B93B'; x.font = '900 44px Archivo, sans-serif'; x.fillText('K A I Z E N', W / 2, 100);
      x.fillStyle = '#F4F4F2'; x.font = '900 96px Archivo, sans-serif'; x.fillText(nm, W / 2, 1040);
      x.fillStyle = '#B0B4BC'; x.font = '700 40px Archivo, sans-serif'; x.fillText(lt.stage + ' · ' + lt.height + ' tall · ' + h.water + '% water', W / 2, 1100);
      var chips = [[st + '-day streak', '#E2B93B'], [wk.shown + '/7 this week', '#2FD38A']], cx = W / 2 - 400;
      chips.forEach(function (c, i) { var bx = cx + i * 420, by = 1150; x.fillStyle = '#16181D'; x.strokeStyle = c[1]; x.lineWidth = 6; x.beginPath(); x.roundRect ? x.roundRect(bx, by, 380, 96, 28) : x.rect(bx, by, 380, 96); x.fill(); x.stroke(); x.fillStyle = c[1]; x.font = '900 38px Archivo, sans-serif'; x.fillText(c[0], bx + 190, by + 61); });
      x.fillStyle = '#F4F4F2'; x.font = '800 38px Archivo, sans-serif'; x.fillText('Can you beat my streak? Kaizen', W / 2, 1310);
      return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  };
  K.share = function () {
    var url = "https://yzinwv-8v.myshopify.com/?ref=share", text = K.treeName() + ' is ' + K.lifeTree({ mini: true, lite: true }).height + ' tall and I’m on a ' + K.streak() + '-day streak. Can you beat it? Grow your own tree:';
    return K.shareCard().then(function (blob) {
      var file = blob && new File([blob], 'kaizen-' + K.key(K.today()) + '.png', { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text + ' ' + url }).then(function () { K.track('kz_share', { via: 'sheet' }); }).catch(function () {});
      if (navigator.share) return navigator.share({ text: text, url: url }).then(function () { K.track('kz_share', { via: 'link' }); }).catch(function () {});
      if (blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
      try { navigator.clipboard.writeText(text + ' ' + url); } catch (e) {}
      K.track('kz_share', { via: 'download' });
    });
  };
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-kz-share]'); if (!b) return; e.preventDefault(); var t = b.textContent; b.disabled = true; b.textContent = 'Making your card…'; K.share().then(function () { b.disabled = false; b.textContent = t; }); });

  // ---------- Visual building blocks (pictures over sentences) ----------
  // Shield track: two shield slots, then 7 pips toward the next one.
  K.shieldTrack = function () {
    var si = K.streakInfo(), sh = Math.min(2, si.shields || 0), st = K.streak(), full = sh >= 2, prog = full ? 7 : st % 7, left = 7 - prog;
    var SH = function (on) { return '<svg class="kz-shi' + (on ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/>' + (on ? '<path class="t" d="M8.6 12.1l2.4 2.4 4.5-4.7"/>' : '') + '</svg>'; };
    var pips = ''; for (var i = 0; i < 7; i++) pips += '<i' + (i < prog ? ' class="on"' : '') + '></i>';
    return '<div class="kz-shtrack' + (full ? ' full' : '') + '" role="img" aria-label="' + sh + ' of 2 streak shields. ' + (full ? 'Full.' : left + (left === 1 ? ' day' : ' days') + ' to the next one.') + '">' +
      '<div class="kz-sh-slots">' + SH(sh > 0) + SH(sh > 1) + '</div><div class="kz-sh-pips">' + pips + '</div>' +
      '<div class="kz-sh-next">' + (full ? '<b>FULL</b>' : '<b>' + left + '</b><small>' + (left === 1 ? 'DAY' : 'DAYS') + '</small>') + '</div></div>';
  };
  // Stat line: big numbers, tiny labels, like a box score.
  K.statLine = function (items) {
    return '<div class="kz-statline">' + items.map(function (x) { return '<span class="kz-stat' + (x.c ? ' ' + x.c : '') + '"><b>' + (x.i || '') + x.v + '</b><small>' + x.l + '</small></span>'; }).join('') + '</div>';
  };
  K.FLAME = '<svg class="kz-fl" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.3 1.6 1.2 2.6 2.4 2.6C11 8.6 11 5.6 12 3z"/></svg>';

  // ---------- 5. Shields: say so when one saved the streak ----------
  K.shieldNews = function () {
    var si = K.streakInfo(), seen = K.get('shieldseen', '') || '', last = si.protectedDays[si.protectedDays.length - 1];
    if (!last || last <= seen) return null; K.set('shieldseen', last); return { day: last, streak: si.streak, left: si.shields };
  };
})();

// ---------- Backup / restore (a file you keep: Files, iCloud Drive, email) ----------
(function () {
  var K = window.KZ; if (!K) return;
  var when = function () { var l = K.get('lastBackup', null); if (!l) return 'Never'; var d = Math.round((K.today() - new Date(l + 'T00:00:00')) / 864e5); return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : d + ' days ago'; };
  var paint = function () { document.querySelectorAll('[data-kz-backup-when]').forEach(function (e) { e.textContent = when(); }); };
  K.toast = K.toast || function (msg) {
    var t = document.createElement('div'); t.className = 'kz-toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2600); setTimeout(function () { t.remove(); }, 3100);
  };
  K.backup = function () {
    var data = JSON.stringify(K.exportData(), null, 1), name = 'kaizen-backup-' + K.key(K.today()) + '.json', blob = new Blob([data], { type: 'application/json' });
    var done = function () { K.set('lastBackup', K.key(K.today())); paint(); K.toast('Backed up. Keep the file in Files or iCloud Drive.'); K.track('kz_backup'); };
    try { var f = new File([blob], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { return navigator.share({ files: [f], title: 'Kaizen backup' }).then(done).catch(function () {}); } } catch (e) {}
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); done();
  };
  K.restoreFile = function (file) {
    return new Promise(function (res, rej) {
      var rd = new FileReader(); rd.onerror = function () { rej(new Error('That file could not be read.')); };
      rd.onload = function () { try { res(K.importData(JSON.parse(rd.result))); } catch (e) { rej(e); } }; rd.readAsText(file);
    });
  };
  document.addEventListener('click', function (e) { if (e.target.closest('[data-kz-backup]')) { e.preventDefault(); K.backup(); } });
  document.addEventListener('change', function (e) {
    var inp = e.target.closest && e.target.closest('[data-kz-restore]'); if (!inp || !inp.files || !inp.files[0]) return;
    K.restoreFile(inp.files[0]).then(function (n) {
      K.toast('Restored ' + n + (n === 1 ? ' item' : ' items') + '. Reloading…'); K.track('kz_restore', { n: n }); setTimeout(function () { location.reload(); }, 900);
    }).catch(function (er) { K.toast(er && er.message ? er.message : 'That file could not be read.'); });
    inp.value = '';
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint(); // the menu is rendered after this script
})();

// ---------- Plan your tomorrow: tasks for a part of the day (no exact times), with a multiplier ----------
// kz_plans = { 'YYYY-MM-DD': { items: [{ id, part: 'any'|'am'|'pm'|'eve'|'night', t?: 'HH:MM', txt, done: 0|1 }], at } }
// 2+ tasks lock a plan in. The more you plan, the higher the cap: 2+ → ×2, 4+ → ×3, 6+ → ×4, 8+ → ×5, 10+ → ×6.
// The multiplier climbs with every task you check off, but the XP only pays out when ALL are done:
// 3 XP per task × the cap. A finished plan also gives the tree a small bonus.
(function () {
  var K = window.KZ; if (!K) return;
  K.PLAN_MIN = 2; K.PLAN_PTS = 3;
  K.PARTS = [['any', 'Anytime'], ['am', 'Morning'], ['pm', 'Afternoon'], ['eve', 'Evening'], ['night', 'Night']];
  K.partName = function (p) { var x = K.PARTS.filter(function (q) { return q[0] === p; })[0]; return x ? x[1] : 'Anytime'; };
  var partOfTime = K.partOfTime = function (t) { if (!t) return 'any'; var h = +String(t).split(':')[0]; return h < 12 ? 'am' : h < 17 ? 'pm' : h < 21 ? 'eve' : 'night'; };
  K.fmtTime = function (t) { if (!t) return ''; var p = String(t).split(':'), h = +p[0]; return (h % 12 || 12) + ':' + p[1] + ' ' + (h >= 12 ? 'PM' : 'AM'); };
  var ORDER = { am: 0, pm: 1, eve: 2, night: 3, any: 4 };
  K.partOrder = function (p) { return p in ORDER ? ORDER[p] : 4; };
  // Oct 22: plan tasks can have an exact time (t: 'HH:MM'). Within a part, timed tasks come first, by time.
  K.planSort = function (a, b) { var d = K.partOrder(a.part) - K.partOrder(b.part); if (d) return d; if (a.t && b.t) return a.t < b.t ? -1 : a.t > b.t ? 1 : 0; return a.t ? -1 : b.t ? 1 : 0; };
  K.plans = function () { return K.get('plans', {}) || {}; };
  // Planning runs on a night-owl clock: until 2am, "plan tomorrow" means the day that just started,
  // so a plan made at 12:30am is ready to do today instead of a day late.
  K.PLAN_ROLL = 2;
  K.lateNight = function () { return new Date().getHours() < K.PLAN_ROLL; };
  K.planTarget = function () { return K.lateNight() ? K.today() : K.addDays(K.today(), 1); };
  K.planTargetKey = function () { return K.key(K.planTarget()); };
  (function () { // one time: a plan saved between midnight and 2am under the next day belongs to today
    try {
      var all = K.get('plans', {}) || {}, td = K.key(K.today()), tm = K.key(K.addDays(K.today(), 1)), p = all[tm];
      if (all[td] || !p || !p.at) return;
      var at = new Date(p.at), t0 = K.today(), cut = new Date(t0.getTime()); cut.setHours(K.PLAN_ROLL, 0, 0, 0);
      if (at >= t0 && at < cut) { all[td] = p; delete all[tm]; K.set('plans', all); }
    } catch (e) {}
  })();
  // Oct 21: "Repeat every day" - a saved plan template that fills each new day (today and the day you plan for) until turned off
  K.planRepeat = function () { var r = K.get('planrepeat', null); return r && r.on && r.items && r.items.length ? r : null; };
  K.setPlanRepeat = function (on, items, from) { if (on && items && items.length) K.set('planrepeat', { on: 1, from: from, items: items.map(function (x) { var o = { part: x.part || 'any', txt: String(x.txt || '').trim().slice(0, 80) }; if (x.t) o.t = x.t; return o; }) }); else { var r = K.get('planrepeat', null); if (r) { r.on = 0; K.set('planrepeat', r); } } };
  K.planRepeatFill = function () { var r = K.planRepeat(); if (!r) return; var all = K.get('plans', {}) || {}, ch = 0, td = K.key(K.today());
    [td, K.planTargetKey()].forEach(function (d, j) { if (all[d] || (r.from && d < r.from)) return; all[d] = { items: r.items.map(function (x, i) { var o = { id: 'r' + Date.now().toString(36) + j + i, part: x.part || 'any', txt: x.txt, done: 0 }; if (x.t) o.t = x.t; return o; }), at: new Date().toISOString(), rep: 1 }; ch = 1; });
    if (ch) { K.set('plans', all); setTimeout(function () { document.dispatchEvent(new CustomEvent('kz:plan', { detail: { repeat: 1 } })); }, 0); } };
  try { K.planRepeatFill(); } catch (e) {}
  document.addEventListener('visibilitychange', function () { if (!document.hidden) try { K.planRepeatFill(); } catch (e) {} });
  K.plan = function (day) { var p = K.plans()[day] || null; if (p) p.items.forEach(function (x) { if (!x.part) x.part = partOfTime(x.t); }); return p; };
  K.savePlan = function (day, items) { var all = K.plans(); if (items && items.length) all[day] = { items: items, at: all[day] && all[day].at || new Date().toISOString() }; else delete all[day]; K.set('plans', all); document.dispatchEvent(new CustomEvent('kz:plan', { detail: { day: day } })); };
  K.PLAN_TIERS = [[2, 2], [4, 3], [6, 4], [8, 5], [10, 6]];
  K.planCap = function (n) { var c = 1; K.PLAN_TIERS.forEach(function (t) { if (n >= t[0]) c = t[1]; }); return c; };
  K.planNextTier = function (n) { return K.PLAN_TIERS.filter(function (t) { return n < t[0]; })[0] || null; };
  K.planStats = function (day) {
    var pa = K._getRO ? (K._getRO('plans', {}) || {}) : K.plans(), p = pa[day] || null, items = p && p.items ? p.items : [], n = items.length, d = items.filter(function (x) { return x.done; }).length, cap = K.planCap(n);   /* Oct 24 (speed): read-only, no copy per day */
    var mult = n ? Math.round((1 + (cap - 1) * d / n) * 10) / 10 : 1, full = n >= K.PLAN_MIN && d === n;
    return { n: n, done: d, cap: cap, mult: mult, full: full, valid: n >= K.PLAN_MIN, points: full ? Math.round(n * K.PLAN_PTS * cap) : 0, potential: Math.round(n * K.PLAN_PTS * cap) };
  };
  K.planPointsTotal = function () { var all = K.plans(), t = 0; for (var d in all) t += K.planStats(d).points; return t; };
  K.planBonus = function (day) { var st = K.planStats(day); return st.full ? 0.05 * st.cap : 0; }; // in days of care (1 = 1 inch)
  K.togglePlanItem = function (day, id) {
    var all = K.plans(), p = all[day]; if (!p) return null; var it = p.items.filter(function (x) { return x.id === id; })[0]; if (!it) return null;
    var was = K.planStats(day).full; it.done = it.done ? 0 : 1; K.set('plans', all);
    var st = K.planStats(day); document.dispatchEvent(new CustomEvent('kz:plan', { detail: { day: day, id: id, done: !!it.done, completed: st.full && !was } }));
    if (st.full && !was) { K.track('kz_plan_complete', { n: st.n, cap: st.cap }); document.dispatchEvent(new CustomEvent('kz:changed')); }
    return st;
  };
  // The multiplier badge: "×2" with the × centered against the number
  K.multHTML = function (v, label) { var t = typeof v === 'number' ? (Math.round(v * 10) / 10).toString() : String(v); return '<span class="kz-mx"><i aria-hidden="true">×</i><b>' + t + '</b>' + (label ? '<small>' + label + '</small>' : '') + '</span>'; };

  // ---------- To-dos: one-off things for a day or a stretch of days ----------
  // kz_todos = [{ id, txt, from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', part, done: 'YYYY-MM-DD'|null, created }]
  // Shows on Today from `from` to `to`. Done ones stay ticked for the day, then leave Today and stay in your log.
  // Each one done is +3 XP (no multiplier; that's what Plan your tomorrow is for).
  K.todos = function () { return K.get('todos', []) || []; };
  var saveT = function (a) { K.set('todos', a); document.dispatchEvent(new CustomEvent('kz:todos')); };
  K.todoOn = function (t, k) { return t.from <= k && k <= (t.to || t.from) && (!t.done || t.done === k); };
  K.todosFor = function (k) { k = k || K.key(K.today()); return K.todos().filter(function (t) { return K.todoOn(t, k); }).sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || K.partOrder(a.part) - K.partOrder(b.part) || String(a.time || '99').localeCompare(String(b.time || '99')) || (a.to || a.from).localeCompare(b.to || b.from); }); };
  K.todosUpcoming = function () { var k = K.key(K.today()); return K.todos().filter(function (t) { return !t.done && t.from > k; }).sort(function (a, b) { return a.from.localeCompare(b.from); }); };
  K.todosDoneOn = function (k) { return K.todos().filter(function (t) { return t.done === k; }); };
  K.addTodo = function (o) {
    var k = K.key(K.today()), from = o.from || k, to = o.to && o.to > from ? o.to : from;
    var tm = /^\d\d:\d\d$/.test(o.time || '') ? o.time : '';
    var t = { id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 1000), txt: String(o.txt || '').trim().slice(0, 90), from: from, to: to, part: tm ? K.partOfTime(tm) : (o.part || 'any'), time: tm, remind: tm && o.remind != null && o.remind >= 0 ? +o.remind : -1, done: null, created: k };
    if (!t.txt) return null; var a = K.todos(); a.push(t); saveT(a); if (t.remind >= 0) K.syncReminders(true); K.track('kz_todo_added', { days: Math.round((new Date(to) - new Date(from)) / 864e5) + 1, part: t.part }); return t.id;
  };
  K.toggleTodo = function (id) { var a = K.todos(), k = K.key(K.today()), t = a.filter(function (x) { return x.id === id; })[0]; if (!t) return null; t.done = t.done ? null : k; saveT(a); if (t.done) K.track('kz_todo_done'); document.dispatchEvent(new CustomEvent('kz:changed')); return !!t.done; };
  K.delTodo = function (id) { saveT(K.todos().filter(function (x) { return x.id !== id; })); };
  // Reminders on the phone: every not-done to-do with a set time, on each day it shows, up to 2 weeks out.
  // The app keeps exactly this list scheduled (native side), so checking one off or deleting it cancels its reminder.
  K.REMIND = [[0, 'At the time'], [10, '10 min before'], [30, '30 min before'], [60, '1 hour before']];
  K.syncReminders = function (ask) {
    if (K.demo) return;   // fake to-dos never schedule (or cancel) real reminders
    var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen; if (!h) return;
    var items = [], now = Date.now(), t0 = K.today();
    K.todos().forEach(function (t) {
      if (t.done || !t.time || !(t.remind >= 0)) return;
      for (var i = 0; i < 14; i++) { var d = K.addDays(t0, i), k = K.key(d); if (k < t.from || k > (t.to || t.from)) continue;
        var p = t.time.split(':'), at = new Date(d); at.setHours(+p[0], +p[1], 0, 0); at = at.getTime() - t.remind * 60000; if (at <= now) continue;
        items.push({ id: t.id + '-' + k, at: at, title: t.txt, body: t.remind ? 'In ' + (t.remind === 60 ? '1 hour' : t.remind + ' minutes') + ' (' + K.fmtTime(t.time) + ')' : 'It’s ' + K.fmtTime(t.time) + '. Check it off in Kaizen.' }); }
    });
    // Oct 22: plan tasks with a time get a reminder at that time (same native list as to-dos)
    var pl = K.plans ? K.plans() : {}, td0 = K.key(t0);
    for (var pd in pl) { if (pd < td0 || !pl[pd] || !pl[pd].items) continue; pl[pd].items.forEach(function (it) {
      if (it.done || !it.t || !it.txt) return; var q = String(it.t).split(':'), at = new Date(pd + 'T00:00:00'); at.setHours(+q[0], +q[1], 0, 0); at = at.getTime(); if (!(at > now)) return;
      items.push({ id: 'plan-' + it.id + '-' + pd, at: at, title: it.txt, body: 'It\u2019s ' + K.fmtTime(it.t) + '. Part of your plan in Kaizen.' }); }); }
    try { h.postMessage({ type: 'todoSync', items: items, ask: !!ask }); } catch (e) {}
  };
  document.addEventListener('kz:todos', function () { setTimeout(function () { K.syncReminders(false); }, 0); });
  document.addEventListener('kz:plan', function () { setTimeout(function () { K.syncReminders(false); }, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { K.syncReminders(false); }); else setTimeout(function () { K.syncReminders(false); }, 0);
  K.todoXP = function () { return K.todos().filter(function (t) { return t.done; }).length * ((K.XP && K.XP.todo) || 3); };
  K.todoWhen = function (t) {
    var k = K.key(K.today()), tm = K.key(K.addDays(K.today(), 1)), f = function (d) { return d === k ? 'Today' : d === tm ? 'Tomorrow' : new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
    var to = t.to || t.from, part = t.time ? K.fmtTime(t.time) + (t.remind >= 0 ? ' 🔔' : '') : t.part && t.part !== 'any' ? K.partName(t.part) : '';
    if (to !== t.from) { if (t.from <= k) return (to === k ? 'Due today' : 'By ' + f(to)) + (part ? ' · ' + part : ''); return f(t.from) + ' to ' + f(to) + (part ? ' · ' + part : ''); }
    return (t.from === k ? '' : f(t.from)) + (part ? (t.from === k ? '' : ' · ') + part : '');
  };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzplanlock-1105.js ==== */
;try {
/* Nov 5: kzplanlock-1105 = 1028 without the multiplier toast. */
/* Oct 28 · James: "the whole point is for you to plan your tomorrow". A task added to a day's plan on that day itself
   (after the day starts at 2 am) is a same-day add: it shows, you can tick it, and it earns +3 XP like any to-do,
   but it never counts toward that day's plan: not the task count for the multiplier, not "all done", not the Plan ring.
   Tasks planned the day before (or any earlier day, or before 2 am for today) count exactly as before. */
(function () {
  var K = window.KZ; if (!K || !K.planStats || !K.savePlan || K.__planlock) return; K.__planlock = 1;
  function lockAt(day) { var d = new Date(day + 'T00:00:00'); d.setHours(K.PLAN_ROLL || 2, 0, 0, 0); return d.getTime(); }
  function all() { try { return (K._getRO ? K._getRO('plans', {}) : K.plans()) || {}; } catch (e) { return {}; } }
  var told = false;
  var sp = K.savePlan;
  K.savePlan = function (day, items) {
    var late = 0;
    try {
      var old = ((all()[day] || {}).items) || [], had = {}; old.forEach(function (x) { had[x.id] = x; });
      var now = Date.now();
      (items || []).forEach(function (x) {
        if (!x || !x.id) return;
        if (!had[x.id]) { if (now >= lockAt(day)) { x.sameDay = 1; late++; } }
        else if (had[x.id].sameDay) x.sameDay = 1;   // an edit keeps it a same-day add
      });
    } catch (e) {}
    var r = sp.apply(this, arguments);
    // Nov 5: the "counts toward your multiplier" toast is gone (there's no multiplier anymore)
    return r;
  };
  K.planStats = function (day) {
    var p = all()[day] || null, items = p && p.items ? p.items : [], counted = items.filter(function (x) { return !x.sameDay; });
    var n = counted.length, d = counted.filter(function (x) { return x.done; }).length, cap = K.planCap(n);
    var mult = n ? Math.round((1 + (cap - 1) * d / n) * 10) / 10 : 1, full = n >= K.PLAN_MIN && d === n;
    return { n: n, done: d, cap: cap, mult: mult, full: full, valid: n >= K.PLAN_MIN, points: full ? Math.round(n * K.PLAN_PTS * cap) : 0, potential: Math.round(n * K.PLAN_PTS * cap), extra: items.length - n };
  };
  // same-day adds that are done earn what a to-do earns
  var tx = K.todoXP;
  if (tx) K.todoXP = function () {
    var x = tx.apply(this, arguments), a = all(), per = (K.XP && K.XP.todo) || 3;
    for (var d in a) ((a[d] && a[d].items) || []).forEach(function (it) { if (it.sameDay && it.done) x += per; });
    return x;
  };
  // Plan tab: a same-day add says so under its name
  function label() {
    var week = document.querySelector('[data-p="week"]'), list = document.querySelector('[data-p="day-list"]'); if (!week || !list) return;
    var b = week.querySelector('[aria-selected="true"]'), day = b && b.getAttribute('data-day'); if (!day) return;
    var p = all()[day], late = {}; ((p && p.items) || []).forEach(function (it) { if (it.sameDay) late['p:' + it.id] = 1; });
    Array.prototype.forEach.call(list.querySelectorAll(':scope > li.kz-todo[data-kzk^="p:"] .kzq-raw'), function (s) {
      var k = s.closest('li').getAttribute('data-kzk'), t = s.textContent;
      if (late[k] && / · from your plan$/.test(t)) s.textContent = t.replace(/ · from your plan$/, ' · added today');
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { label(); } catch (e) {} }); }
  function boot() { soon(); var l = document.querySelector('[data-p="day-list"]'); if (l) new MutationObserver(soon).observe(l, { childList: true, subtree: true, characterData: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
