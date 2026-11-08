/* Nov 2 · copy of kzsec-1025n.js: sharing no longer mentions the everyday streak (gone); Kaizen 66 text unchanged. */
/* Oct 25 n · Security pass (red team). Loaded on every page, after the core files.
   1. Nothing leaves the phone by itself: K.track is a no-op, no gtag, the old website form (/contact) can't send.
   2. Share: no link (James, Oct 25: "No link for now"), no retired words (tree height, water); the card shows the
      Kaizen 66 run or the streak. The Shopify test-store address is removed from shares and calendar reminders.
   3. Restore from a backup only writes clean data: a Kaizen backup object, <= 8 MB, known shapes, no __proto__ /
      constructor / prototype keys, capped string lengths and depth, no auth / sync keys, key names [a-z0-9_].
   K.share / K.shareCard / K.track are locked so files loaded later can't put the old versions back. */
(function () {
  var K = window.KZ; if (!K || K.__kzsec) return; K.__kzsec = 1;
  function lock(name, fn) { try { Object.defineProperty(K, name, { configurable: false, enumerable: true, get: function () { return fn; }, set: function () {} }); } catch (e) { K[name] = fn; } }
  function wrapOnSet(name, wrap) {
    var cur = K[name] ? wrap(K[name]) : undefined;
    try { Object.defineProperty(K, name, { configurable: false, enumerable: true, get: function () { return cur; }, set: function (v) { cur = v ? wrap(v) : v; } }); } catch (e) {}
  }
  K.SHARE_URL = '';
  var BAD_URL = /https?:\/\/[^\s"'<>]*myshopify\.com[^\s"'<>]*/gi;

  // ---------- 1 · no tracking ----------
  lock('track', function () {});
  try { if (window.gtag) window.gtag = function () {}; } catch (e) {}

  // ---------- 2 · share ----------
  function esc(s) { return String(s == null ? '' : s); }
  function runInfo() {
    try {
      var st = K.k66 && K.k66.state(), r = st && st.run; if (!r || r.state !== 'live') return null;
      var g = (K.goals() || []).filter(function (x) { return x.id === r.goal; })[0]; if (!g) return null;
      return { name: g.name, day: r.day, gid: g.id };
    } catch (e) { return null; }
  }
  function streak() { try { var s = K.streakInfo && K.streakInfo(); return s && s.streak != null ? s.streak : (K.streak ? K.streak() : 0); } catch (e) { return 0; } }
  function earned() { var n = 0; try { (K.goals() || []).forEach(function (g) { try { if (K.grow(g.id).earned) n++; } catch (e) {} }); } catch (e) {} return n; }
  function shareText() {
    var r = runInfo(), s = streak();
    var t = r ? 'Day ' + r.day + ' of my Kaizen 66: ' + esc(r.name) + '.' : 'I’m building a habit with Kaizen, one day at a time.';
    return t + (K.SHARE_URL ? ' ' + K.SHARE_URL : '');
  }
  function shareCard() {
    var r = runInfo(), s = streak(), e = earned(), W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    var src = null; try { if (r && K.grow && K.groveImg) { var w = K.grow(r.gid); src = K.groveImg(w.sp, w.key, true); } } catch (er) {}
    var font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';
    return new Promise(function (res) {
      if (!src) return res(null);
      var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); }; img.src = src;
    }).then(function (img) {
      x.fillStyle = '#000000'; x.fillRect(0, 0, W, H);
      var g = x.createRadialGradient(W / 2, 600, 40, W / 2, 600, 640); g.addColorStop(0, '#1C1C1E'); g.addColorStop(1, '#000000'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.textAlign = 'center'; x.fillStyle = '#E2B93B'; x.font = '800 40px ' + font; x.fillText('KAIZEN', W / 2, 110);
      if (img) { var k = Math.min(760 / img.width, 680 / img.height), iw = img.width * k, ih = img.height * k; x.drawImage(img, (W - iw) / 2, 200 + (680 - ih), iw, ih); }
      x.fillStyle = '#FFFFFF'; x.font = '800 92px ' + font;
      x.fillText(r ? 'Day ' + r.day + ' of 66' : s + (s === 1 ? ' day' : ' days'), W / 2, img ? 1010 : 640);
      x.fillStyle = '#AEAEB2'; x.font = '600 44px ' + font;
      var sub = r ? String(r.name) : 'in a row';
      if (x.measureText(sub).width > 940) { while (sub.length > 4 && x.measureText(sub + '…').width > 940) sub = sub.slice(0, -1); sub += '…'; }
      x.fillText(sub, W / 2, img ? 1080 : 710);
      var dsu = 0; try { dsu = K.daysShownUp() || 0; } catch (er) {} var chips = [[dsu + (dsu === 1 ? ' day shown up' : ' days shown up'), '#E2B93B']]; if (e) chips.push([e + (e === 1 ? ' habit earned' : ' habits earned'), '#30D158']);
      var cw = 400, gap = 30, tot = chips.length * cw + (chips.length - 1) * gap, cx = (W - tot) / 2;
      chips.forEach(function (c, i) { var bx = cx + i * (cw + gap), by = 1150; x.fillStyle = '#1C1C1E'; x.strokeStyle = c[1]; x.lineWidth = 5; x.beginPath(); if (x.roundRect) x.roundRect(bx, by, cw, 92, 46); else x.rect(bx, by, cw, 92); x.fill(); x.stroke(); x.fillStyle = c[1]; x.font = '800 36px ' + font; x.fillText(c[0], bx + cw / 2, by + 59); });
      return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  }
  function share() {
    var text = shareText();
    return shareCard().then(function (blob) {
      var file = blob && new File([blob], 'kaizen-' + K.key(K.today()) + '.png', { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text }).catch(function () {});
      if (navigator.share) return navigator.share({ text: text }).catch(function () {});
      try { navigator.clipboard.writeText(text); if (K.toast) K.toast('Copied'); } catch (e) {}
    }).catch(function () {});
  }
  lock('shareCard', shareCard); lock('share', share); K.shareText = shareText;
  // calendar reminders (.ics) carried the store address in DESCRIPTION and URL
  wrapOnSet('reminderICS', function (fn) { if (fn.__kzsec) return fn; var w = function () { var s = fn.apply(this, arguments); return typeof s === 'string' ? s.replace(/\\n?https?:\/\/[^\r\n\\]*myshopify\.com[^\r\n\\]*/gi, '').replace(/\r?\nURL:[^\r\n]*/g, '') : s; }; w.__kzsec = 1; return w; });
  // last line of defence: nothing handed to the share sheet carries the store address
  try {
    if (navigator.share && !navigator.share.__kzsec) {
      var ns = navigator.share.bind(navigator), clean = function (d) { if (!d) return d; var o = {}; for (var k in d) o[k] = d[k]; if (typeof o.text === 'string') o.text = o.text.replace(BAD_URL, '').replace(/\s+$/, ''); if (typeof o.url === 'string' && BAD_URL.test(o.url)) delete o.url; BAD_URL.lastIndex = 0; return o; };
      var wrapped = function (d) { return ns(clean(d)); }; wrapped.__kzsec = 1; navigator.share = wrapped;
    }
  } catch (e) {}

  // ---------- 3 · restore only clean data ----------
  var DENY = /^(auth|sync|syncmeta|appleid|kzdemo.*|demo.*)$/;
  var CAP = { name: 90, txt: 120, step: 160, cue: 160, mini: 160, username: 60, treename: 60, note: 5000 };
  function cleanVal(v, depth, keyName) {
    if (depth > 12) return undefined;
    if (v === null || typeof v === 'number' || typeof v === 'boolean') return typeof v === 'number' && !isFinite(v) ? 0 : v;
    if (typeof v === 'string') { var cap = CAP[keyName] || 5000; return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, cap); }
    if (Array.isArray(v)) { var a = []; for (var i = 0; i < v.length && i < 5000; i++) { var c = cleanVal(v[i], depth + 1, keyName); if (c !== undefined) a.push(c); } return a; }
    if (typeof v === 'object') {
      var o = {}, n = 0;
      for (var k in v) {
        if (!Object.prototype.hasOwnProperty.call(v, k) || k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        if (++n > 20000) break;
        var c2 = cleanVal(v[k], depth + 1, k); if (c2 !== undefined) o[k] = c2;
      }
      return o;
    }
    return undefined;
  }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function cleanBackup(o) {
    if (!isObj(o) || o.app !== 'kaizen' || !isObj(o.data)) throw new Error('That file is not a Kaizen backup.');
    var d = {}, src = o.data;
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k) || !/^[a-z0-9_]{1,40}$/.test(k) || DENY.test(k)) continue;
      var v = cleanVal(src[k], 0, k); if (v !== undefined) d[k] = v;
    }
    // shapes the restore code relies on
    var arr = { goals: 1, archived: 1, todos: 1 }, obj = { done: 1, gnotes: 1, journal: 1, rate: 1, thought: 1, liked: 1, unlocked: 1, tomb: 1, plans: 1, grove: 1, k66: 1, visit: 1, pillars: 0 };
    Object.keys(arr).forEach(function (k) { if (k in d && !Array.isArray(d[k])) delete d[k]; });
    Object.keys(obj).forEach(function (k) { if (obj[k] && k in d && !isObj(d[k])) delete d[k]; });
    ['goals', 'archived'].forEach(function (k) {
      if (!d[k]) return;
      d[k] = d[k].filter(function (g) { return isObj(g) && typeof g.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(g.id) && typeof g.name === 'string' && g.name.trim(); }).slice(0, 500);
    });
    if (d.todos) d.todos = d.todos.filter(function (t) { return isObj(t) && typeof t.txt === 'string'; }).slice(0, 2000);
    if (d.done) { for (var gid in d.done) { if (!isObj(d.done[gid])) { delete d.done[gid]; continue; } for (var day in d.done[gid]) if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) delete d.done[gid][day]; } }
    return { app: 'kaizen', v: o.v, at: o.at, data: d };
  }
  K.cleanBackup = cleanBackup;
  if (K.importData && !K.importData.__kzsec) {
    var imp = K.importData, wi = function (o) { return imp.call(this, cleanBackup(o)); }; wi.__kzsec = 1; K.importData = wi;
  }
  (function () {
    var rf = function (file) {
      if (!file || file.size > 8 * 1024 * 1024) return Promise.reject(new Error('That file is too big to be a Kaizen backup.'));
      return new Promise(function (res, rej) {
        var rd = new FileReader(); rd.onerror = function () { rej(new Error('That file could not be read.')); };
        rd.onload = function () { var o; try { o = JSON.parse(rd.result); } catch (e) { return rej(new Error('That file is not a Kaizen backup.')); } try { res(K.importData(o)); } catch (e) { rej(new Error(e && e.message ? e.message : 'That file could not be restored.')); } };
        rd.readAsText(file);
      });
    };
    rf.__kzsec = 1; lock('restoreFile', rf);
  })();
})();
