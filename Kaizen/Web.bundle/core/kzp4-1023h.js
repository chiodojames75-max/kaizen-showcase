/* Oct 23 Phase 4: share images (tree, streak, milestones) and the rating prompt rules.
   Images are drawn on the phone (1080x1920, sans serif, gold on black) and handed to the iOS share sheet.
   Nothing is uploaded; the only personal detail on a card is your first name, and only if you leave it on. */
(function () {
  var K = window.KZ; if (!K || K.__kzp4) return; K.__kzp4 = 1;
  var native = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  var post = function (m) { try { if (native()) window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var W = 1080, H = 1920, GOLD = '#E2B93B', FONT = 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
  var f = function (w, s) { return w + ' ' + s + 'px ' + FONT; };
  var firstName = function () { var n = String(K.get('username', '') || '').trim(); return n ? n.split(/\s+/)[0].slice(0, 20) : ''; };
  // A picture drawn from an SVG can't load files, so the tree's painted layers (land, soil, the tree art) are inlined first
  var dataURLs = {};
  function inline(url) {
    if (dataURLs[url]) return dataURLs[url];
    return (dataURLs[url] = fetch(url).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      return b ? new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result)); }; fr.onerror = function () { res(''); }; fr.readAsDataURL(b); }) : '';
    }).catch(function () { return ''; }).then(function (d) { return d || viaImg(url); }));
  }
  function viaImg(url) {   // fallback: draw the file the page can already show, then read it back
    return new Promise(function (res) {
      var im = new Image(); im.onload = function () { try { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); res(c.toDataURL('image/png')); } catch (e) { res(''); } };
      im.onerror = function () { res(''); }; im.src = url;
    });
  }
  function svgImage(svg) {
    if (!svg) return Promise.resolve(null);
    var urls = []; svg.replace(/href="(\/[^"#]+)"/g, function (m, u) { if (urls.indexOf(u) < 0) urls.push(u); return m; });
    return Promise.all(urls.map(inline)).then(function (data) {
      urls.forEach(function (u, i) { if (data[i]) svg = svg.split('href="' + u + '"').join('href="' + data[i] + '"'); });
      var sp = svg.indexOf(' '); svg = svg.slice(0, sp) + ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' + svg.slice(sp);
      return new Promise(function (res) { var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { res(null); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    });
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); }
  function frame(x) {   // black, a soft gold glow, the kaizen mark and name at the top, the line at the bottom
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(W / 2, 700, 40, W / 2, 700, 900); g.addColorStop(0, 'rgba(226,185,59,0.16)'); g.addColorStop(1, 'rgba(226,185,59,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.translate(W / 2 - 52, 112); x.scale(104 / 88, 104 / 88); x.translate(-56, -52);
    x.strokeStyle = GOLD; x.lineWidth = 8; x.lineCap = 'square'; x.lineJoin = 'miter'; x.stroke(new Path2D('M64 122 H136 L100 60 L82 91')); x.restore();
    x.textAlign = 'center'; x.fillStyle = GOLD; x.font = f(800, 40);
    if ('letterSpacing' in x) { x.letterSpacing = '14px'; x.fillText('KAIZEN', W / 2 + 7, 290); x.letterSpacing = '0px'; } else x.fillText('K A I Z E N', W / 2, 290);
    x.fillStyle = '#8E8E93'; x.font = f(500, 40); x.fillText('One small step. Every day.', W / 2, 1830);
  }
  function fitText(x, t, max, weight, size) { x.font = f(weight, size); while (x.measureText(t).width > max && size > 24) { size -= 4; x.font = f(weight, size); } return size; }
  function treeBox(x, img, X, Y, w, h) {
    x.save(); rr(x, X, Y, w, h, 56); x.clip(); x.fillStyle = '#0b0b0d'; x.fillRect(X, Y, w, h);
    if (img) { var r = Math.max(w / img.width, h / img.height), iw = img.width * r, ih = img.height * r; x.drawImage(img, X + (w - iw) / 2, Y + (h - ih) / 2, iw, ih); }
    x.restore(); x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2; rr(x, X, Y, w, h, 56); x.stroke();
  }
  // ---------- the three cards ----------
  var MCOPY = { 7: 'One week of showing up.', 30: 'A month of small steps.', 66: 'About how long a habit takes to feel automatic.', 100: 'Triple digits.' };
  K.shareImage = function (kind, o) {
    o = o || {}; var name = o.name ? firstName() : '';
    var lt = null; try { lt = K.lifeTree({}); } catch (e) {}
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    var streak = K.streak ? K.streak() : 0, shown = K.shownDays ? K.shownDays().length : 0;
    return svgImage(lt && lt.svg).then(function (img) {
      frame(x); x.textAlign = 'center';
      if (kind === 'streak') {
        if (name) { x.fillStyle = '#fff'; x.font = f(600, 52); x.fillText(name, W / 2, 470); }
        x.fillStyle = GOLD; var sz = fitText(x, String(streak), 900, 800, 440); x.font = f(800, sz); x.fillText(String(streak), W / 2, 900);
        x.fillStyle = '#fff'; x.font = f(700, 76); x.fillText(streak === 1 ? 'day streak' : 'day streak', W / 2, 1010);
        // the last 14 days, as the calendar draws them
        var C = { full: GOLD, grew: '#5CD27A', setback: '#E5605A', rest: '#0A84FF', today: '#3A3A3C', none: '#1C1C1E', future: '#1C1C1E' }, s = 96, gap = 18, x0 = (W - (7 * s + 6 * gap)) / 2, first = K.firstStepDay ? K.firstStepDay() : undefined;
        for (var i = 0; i < 14; i++) { var k = K.key(K.addDays(K.today(), i - 13)), di = K.dayInfo(k, first), cx = x0 + (i % 7) * (s + gap), cy = 1160 + Math.floor(i / 7) * (s + gap);
          x.fillStyle = C[di.status] || '#1C1C1E'; rr(x, cx, cy, s, s, 22); x.fill(); if (di.status === 'today') { x.strokeStyle = '#fff'; x.lineWidth = 5; rr(x, cx + 2.5, cy + 2.5, s - 5, s - 5, 20); x.stroke(); } }
        x.fillStyle = '#8E8E93'; x.font = f(500, 40); x.fillText('My last two weeks', W / 2, 1460);
        x.fillStyle = '#fff'; x.font = f(600, 46); x.fillText(shown + (shown === 1 ? ' day' : ' days') + ' shown up in all', W / 2, 1640);
      } else if (kind === 'milestone') {
        var m = +o.day || shown;
        treeBox(x, img, 140, 380, 800, 640);
        x.fillStyle = GOLD; x.font = f(700, 44); x.fillText('DAY', W / 2, 1150);
        var sz2 = fitText(x, String(m), 900, 800, 340); x.font = f(800, sz2); x.fillText(String(m), W / 2, 1460);
        x.fillStyle = '#fff'; var sz3 = fitText(x, MCOPY[m] || 'Showing up, every day.', 940, 700, 56); x.font = f(700, sz3); x.fillText(MCOPY[m] || 'Showing up, every day.', W / 2, 1580);
        if (name) { x.fillStyle = '#8E8E93'; x.font = f(500, 42); x.fillText(name + ' on Kaizen', W / 2, 1660); }
      } else {   // tree
        treeBox(x, img, 90, 380, 900, 1000);
        x.fillStyle = '#fff'; var t = name ? name + '’s tree' : 'My tree', sz4 = fitText(x, t, 940, 800, 92); x.font = f(800, sz4); x.fillText(t, W / 2, 1500);
        x.fillStyle = '#8E8E93'; x.font = f(500, 46); x.fillText((lt ? lt.stage + ' · ' + lt.height + ' tall' : ''), W / 2, 1572);
        var chip = function (label, color, cxm) { x.font = f(700, 42); var w2 = x.measureText(label).width + 80; x.fillStyle = '#1C1C1E'; rr(x, cxm - w2 / 2, 1625, w2, 92, 46); x.fill(); x.strokeStyle = color; x.lineWidth = 4; rr(x, cxm - w2 / 2, 1625, w2, 92, 46); x.stroke(); x.fillStyle = color; x.fillText(label, cxm, 1686); };
        chip(streak + '-day streak', GOLD, W / 2 - 220); chip(shown + (shown === 1 ? ' day' : ' days') + ' grown', '#5CD27A', W / 2 + 220);
      }
      return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  };
  var TEXT = { tree: 'Growing a little every day on Kaizen.', streak: function () { return (K.streak ? K.streak() : 0) + '-day streak on Kaizen. One small step, every day.'; }, milestone: function (o) { return 'Day ' + o.day + ' of showing up on Kaizen.'; } };
  function shareBlob(blob, kind, o) {
    var text = typeof TEXT[kind] === 'function' ? TEXT[kind](o) : TEXT[kind], fname = 'kaizen-' + kind + '-' + K.key(K.today()) + '.png';
    K.track('kz_share', { kind: kind, name: !!(o && o.name) });
    if (native()) {
      return new Promise(function (res) { var r = new FileReader(); r.onload = function () { post({ type: 'file', name: fname, data: String(r.result).split(',')[1], text: text }); res(); }; r.readAsDataURL(blob); });
    }
    var file = new File([blob], fname, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: text }).catch(function () {});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return Promise.resolve();
  }
  // ---------- the share sheet: a preview, a "show my first name" switch, Share ----------
  K.openShare = function (kind, o) {
    o = o || {}; var hasName = !!firstName(), opts = { day: o.day, name: hasName && K.get('sharename', 1) !== 0 };
    var el = document.createElement('div'); el.className = 'kz-p4'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Share');
    el.innerHTML = '<div class="kz-p4-in"><div class="kz-p4-top"><h2 class="kz-p4-t">Share</h2><button type="button" class="kz-p4-x" data-p4="close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="kz-p4-prev"><img alt="" data-p4="img"><span class="kz-p4-wait" data-p4="wait">Making your card…</span></div>' +
      (hasName ? '<label class="kz-steprow kz-switchrow kz-p4-name"><span><strong>Show my first name</strong><em>“' + K.esc(firstName()) + '” on the card</em></span><input type="checkbox" class="kz-sw49" data-p4="name"' + (opts.name ? ' checked' : '') + '></label>' : '') +
      '<button type="button" class="kz-btn gold kz-p4-go" data-p4="share" disabled>Share</button></div>';
    var blob = null, img = el.querySelector('[data-p4="img"]'), go = el.querySelector('[data-p4="share"]'), url = '';
    var draw = function () {
      go.disabled = true; el.querySelector('[data-p4="wait"]').hidden = false;
      K.shareImage(kind, opts).then(function (b) { blob = b; if (url) URL.revokeObjectURL(url); url = b ? URL.createObjectURL(b) : ''; img.src = url; img.alt = 'Preview of your ' + kind + ' card'; el.querySelector('[data-p4="wait"]').hidden = !!b; go.disabled = !b; });
    };
    var close = function () { el.remove(); if (url) URL.revokeObjectURL(url); document.body.classList.remove('kz-noscroll'); };
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.closest('[data-p4="close"]')) return close();
      if (e.target.closest('[data-p4="share"]') && blob) { go.disabled = true; go.textContent = 'Opening…'; shareBlob(blob, kind, opts).then(function () { go.disabled = false; go.textContent = 'Share'; }); }
    });
    el.addEventListener('change', function (e) { if (e.target.matches('[data-p4="name"]')) { opts.name = e.target.checked; K.set('sharename', opts.name ? 1 : 0); draw(); } });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.body.appendChild(el); document.body.classList.add('kz-noscroll'); draw();
    K.track('kz_share_open', { kind: kind });
    return el;
  };
  K.shareMilestone = function (m) { K.openShare('milestone', { day: m }); };
  // the tree view's Share button (on every page) opens the new sheet
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kz-share]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation(); K.openShare(b.getAttribute('data-kz-share') || 'tree');
  }, true);
  // Progress: "Share your streak" under the streak tiles
  function streakButton() {
    var t = document.querySelector('#kz-prog-s1 [data-p="tiles"]'); if (!t || document.querySelector('.kz-p4-sb')) return;
    t.insertAdjacentHTML('afterend', '<button type="button" class="kz-p4-sb" data-kz-share="streak"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>Share your streak</button>');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', streakButton); else streakButton();

  // ---------- 15. Rating prompt: right after a real win, never in the first 3 days, at most once every 120 days ----------
  var DAY = 864e5;
  var rp = function () { return K.get('rateprompt', {}) || {}; };
  (function () { var r = rp(); if (!r.first) { r.first = Date.now(); K.set('rateprompt', r); } })();   // first time Kaizen ran
  var overlayUp = function () { return !!document.querySelector('.kz-p3, .kz-p4, #kz-reveal:not([hidden]), .kz-qcard.in') || document.documentElement.classList.contains('kz-setup'); };
  K.rateCheck = function (why, now) {   // returns why it did or didn't ask (tests read this)
    now = now || Date.now(); var r = rp();
    if (!native()) return 'not-app';
    if (!r.first || now - r.first < 3 * DAY) return 'first-3-days';
    if (r.asked && now - r.asked < 120 * DAY) return 'asked-recently';
    r.asked = now; r.why = why; K.set('rateprompt', r); post({ type: 'review' }); K.track('kz_rate_prompt', { why: why }); return 'asked';
  };
  var pending = 0;
  var ask = function (why, tries) { clearTimeout(pending); pending = setTimeout(function () { if (overlayUp()) { if ((tries || 0) < 40) ask(why, (tries || 0) + 1); return; } K.lastRate = K.rateCheck(why); }, 1500); };
  document.addEventListener('kz:alldone', function () { ask('alldone'); });   // waits until any milestone or reveal has been closed
  var watch = function () { new MutationObserver(function (ms) {   // a milestone moment was just closed
    ms.forEach(function (m) { Array.prototype.forEach.call(m.removedNodes, function (n) { if (n.nodeType === 1 && n.classList.contains('kz-p3-ms')) ask('milestone'); }); });
  }).observe(document.body, { childList: true }); };
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
})();
