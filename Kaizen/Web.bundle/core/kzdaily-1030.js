/* Oct 30 · replaces kzdaily-1026m.js: before 5 PM the question popup says "Tonight's question" (same as Today, index.html). */
/* Oct 26 m · The header on every tab matches Today (James): the quote / today's-question button and the gold + (add a goal).
   Today keeps its own (index.html + kzfocus-1025m). On the other tabs this file adds both buttons to #kz-header .kz-hright.
   The quote button opens the same chooser: Quote of the day (the face-down card that flips, then Rate & reflect) or
   Today's question. Everything is saved exactly as Today saves it: kz_qflip, kz_rate, kz_thought, kz_journal, kz_qseen
   is untouched (only Today opens things by itself). Needs window.KZQ (core/52fe2d066330.js) for the quote; without it
   only the + shows. Styles: kzdaily-1026m.css. */
(function () {
  var K = window.KZ; if (!K || K.__kzdaily) return; K.__kzdaily = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var X = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var STAR = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  function tk() { return K.key(K.today()); }
  function cur() { return window.KZQ && window.KZQ.today; }
  function noscroll(on) {
    if (on) { document.body.classList.add('kz-noscroll'); post({ type: 'pageScroll', on: false }); return; }
    if (!document.querySelector('.kz-qcard, .kzdy-modal:not([hidden]), .kzf-qs, .kz-sheet49:not([hidden])')) { document.body.classList.remove('kz-noscroll'); post({ type: 'pageScroll', on: true }); }
  }
  function changed() { try { if (K.updateStreak) K.updateStreak(); } catch (e) {} post({ type: 'dirty' }); document.dispatchEvent(new CustomEvent('kz:changed')); }

  // ---------- Quote of the day: the card ----------
  function openCard() {
    var q = cur(); if (!q || document.querySelector('.kz-qcard')) return;
    var f = K.get('qflip', '') === tk(), o = document.createElement('div');
    o.className = 'kz-qcard' + (f ? ' up' : ''); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Quote of the day');
    o.innerHTML = '<button type="button" class="kz-qc-card" aria-label="' + (f ? 'Quote of the day' : 'Turn the card over') + '">' +
      '<span class="kz-qc-face kz-qc-back" aria-hidden="true"><svg viewBox="56 52 88 78"><defs><linearGradient id="kzdyg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7E7A6"/><stop offset=".35" stop-color="#D4AF37"/><stop offset=".6" stop-color="#9A7424"/><stop offset=".8" stop-color="#E8CC78"/><stop offset="1" stop-color="#C9A13A"/></linearGradient></defs><path d="M64 122 H136 L100 60 L82 91" fill="none" stroke="url(#kzdyg)" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/></svg><b>KAIZEN</b><i>Tap to turn over</i></span>' +
      '<span class="kz-qc-face kz-qc-front"><span class="kz-qc-l">Quote of the day</span><span class="kz-qc-q"></span><span class="kz-qc-a"></span></span></button>' +
      '<div class="kz-qc-acts"><button type="button" class="kz-btn gold" data-qc="reflect">Rate &amp; reflect</button><button type="button" class="kz-qc-done" data-qc="close">Done</button></div>';
    o.querySelector('.kz-qc-q').textContent = '“' + q.q + '”'; o.querySelector('.kz-qc-a').textContent = q.a ? '— ' + q.a : '';
    document.body.appendChild(o); noscroll(true); try { K.track('kz_quote_card_open', { flipped: f }); } catch (e) {}
    requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add('in'); }); });
    var close = function (then) { o.classList.add('out'); setTimeout(function () { o.remove(); noscroll(false); if (then) then(); }, 320); };
    var card = o.querySelector('.kz-qc-card');
    card.addEventListener('click', function () {
      if (o.classList.contains('up')) return;
      o.classList.add('up', 'flip'); card.setAttribute('aria-label', 'Quote of the day'); post({ type: 'haptic', n: 1 }); try { if (K.sound) K.sound(); } catch (e) {}
      K.set('qflip', tk()); post({ type: 'dirty' }); try { K.track('kz_quote_card_flip'); } catch (e) {}
      setTimeout(function () { var b = o.querySelector('[data-qc=reflect]'); if (b) b.focus({ preventScroll: true }); }, 700);
    });
    o.addEventListener('click', function (e) { var b = e.target.closest('[data-qc]'); if (b && b.dataset.qc === 'reflect') close(openRate); else if (b || e.target === o) close(); });
    setTimeout(function () { card.focus({ preventScroll: true }); }, 60);
  }
  K.openQuoteCard = K.openQuoteCard || openCard;

  // ---------- popups: Rate & reflect, Today's question (same look as Today's) ----------
  function modal(inner, label) {
    var m = document.createElement('div'); m.className = 'kz-qmodal kzdy-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', label);
    m.innerHTML = '<div class="kz-qm-in">' + inner + '</div>'; document.body.appendChild(m); noscroll(true);
    var close = function () { if (!m.isConnected) return; m.remove(); noscroll(false); };
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-dy="close"]')) close(); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    setTimeout(function () { var c = m.querySelector('[data-dy="close"]'); if (c) c.focus({ preventScroll: true }); }, 30);
    return { el: m, close: close };
  }
  function openRate() {
    var q = cur(); if (!q) return; var day = tk(), stars = (K.get('rate', {}) || {})[day] || 0;
    var M = modal('<div class="kz-sheet-top"><span class="kz-label49 gold">Quote of the day</span><button type="button" class="kz-iconbtn" data-dy="close" aria-label="Close">' + X + '</button></div>' +
      '<blockquote class="kz-qm-quote"><p>' + esc('“' + q.q + '”') + '</p><cite>' + (q.a ? esc('— ' + q.a) : '') + '</cite></blockquote>' +
      '<div class="kz-qm-rate"><span class="kz-label49">How much did it land?</span><div class="kz-stars49" role="radiogroup" aria-label="Rate today\'s quote">' +
      [1, 2, 3, 4, 5].map(function (v) { return '<button type="button" role="radio" aria-checked="false" data-v="' + v + '" aria-label="' + v + ' star' + (v > 1 ? 's' : '') + '">' + STAR + '</button>'; }).join('') + '</div></div>' +
      '<label class="kz-field49"><span class="kz-label49">Your take <em>(optional)</em></span><textarea data-dy="note" rows="3" maxlength="600" placeholder="What does it mean for your day?"></textarea></label>' +
      '<button type="button" class="kz-btn gold" data-dy="save" disabled>Save to my journal</button><p class="kz-note49" data-dy="msg" aria-live="polite"></p>', 'Quote of the day');
    var el = M.el, note = el.querySelector('[data-dy="note"]'), save = el.querySelector('[data-dy="save"]'), msg = el.querySelector('[data-dy="msg"]');
    note.value = (K.get('thought', {}) || {})[day] || ''; msg.textContent = stars ? 'Saved. You can change it any time today.' : ''; save.textContent = stars ? 'Update' : 'Save to my journal';
    var paint = function () { el.querySelectorAll('[data-v]').forEach(function (b) { var on = +b.dataset.v <= stars; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(+b.dataset.v === stars)); }); save.disabled = !stars && !note.value.trim(); };
    paint();
    el.querySelector('.kz-stars49').addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b) return; stars = +b.dataset.v; paint(); post({ type: 'tick' }); });
    note.addEventListener('input', paint);
    save.addEventListener('click', function () {
      var r = K.get('rate', {}) || {}, t = K.get('thought', {}) || {}, v = note.value.trim();
      if (stars) r[day] = stars; K.set('rate', r);
      if (v) t[day] = v; else delete t[day]; K.set('thought', t);
      changed(); save.textContent = 'Update'; msg.textContent = 'Saved to Quote notes in your journal.';
      try { K.track('kz_quote_rated', { stars: stars, note: !!v }); } catch (e) {} post({ type: 'haptic', n: 2 });
      setTimeout(M.close, 1200);
    });
  }
  function openQuestion() {
    var q = cur(), day = tk(), ans = function () { return ((K.get('journal', {}) || {})[day] || '').trim(); };
    var early = new Date().getHours() < 17, LBL = early ? 'Tonight\u2019s question' : 'Today\u2019s question';   // Oct 30: the questions ask about "today"
    var PRIV = early ? 'Think about it today and answer tonight. Private to you, saved to your journal.' : 'Private to you. It\'s saved to your journal next to today\'s quote.';
    var M = modal('<div class="kz-sheet-top"><span class="kz-label49 gold">' + LBL + '</span><button type="button" class="kz-iconbtn" data-dy="close" aria-label="Close">' + X + '</button></div>' +
      '<h2 class="kz-rq" id="kzdy-rq">' + esc((q && q.n) || 'What did the quote change for you today?') + '</h2>' +
      '<textarea class="kz-jbox kz-rbox" data-dy="ta" rows="4" maxlength="2000" placeholder="Anything on your mind." aria-labelledby="kzdy-rq"></textarea>' +
      '<button type="button" class="kz-btn gold" data-dy="save" disabled>Save to my journal</button><p class="kz-note49" data-dy="msg" aria-live="polite"></p>', LBL);
    M.el.classList.add('kz-rmodal');
    var el = M.el, ta = el.querySelector('[data-dy="ta"]'), save = el.querySelector('[data-dy="save"]'), msg = el.querySelector('[data-dy="msg"]');
    ta.value = ans(); msg.textContent = ans() ? 'Saved. You can change it any time today.' : PRIV; save.textContent = ans() ? 'Update' : 'Save to my journal';
    ta.addEventListener('input', function () { var v = ta.value.trim(); save.disabled = !v || v === ans(); });
    save.addEventListener('click', function () {
      var v = ta.value.trim(); if (!v) return;
      var m = K.get('journal', {}) || {}; m[day] = v; K.set('journal', m); changed();
      try { K.track('kz_reflection_saved', { length: v.length }); } catch (e) {} post({ type: 'haptic', n: 2 });
      save.textContent = 'Update'; save.disabled = true; msg.textContent = 'Saved to your journal.';
      setTimeout(M.close, 1100);
    });
    try { K.track('kz_question_open'); } catch (e) {}
  }
  K.openQuestion = K.openQuestion || openQuestion;

  // ---------- the chooser (same sheet as Today's) ----------
  function chooser() {
    if (document.querySelector('.kzf-qs')) return;
    var q = cur(), day = tk(), flipped = K.get('qflip', '') === day, rated = (K.get('rate', {}) || {})[day], answered = !!((K.get('journal', {}) || {})[day] || '').trim();
    var s = document.createElement('div'); s.className = 'kzf-qs kzdy-qs'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', 'Quote and question');
    s.innerHTML = '<div class="kzf-qs-in"><button type="button" data-q="q"><b>Quote of the day' + (rated ? ' <i>' + rated + '★</i>' : flipped ? ' <i>✓</i>' : '') + '</b><span>' + esc(flipped ? '“' + q.q + '”' : 'Tap to turn over today’s card') + '</span></button>' +
      '<button type="button" data-q="a"><b>Today\'s question' + (answered ? ' <i>✓</i>' : '') + '</b><span>' + esc(q.n || '') + '</span></button>' +
      '<button type="button" class="kzf-qs-x" data-q="x">Close</button></div>';
    document.body.appendChild(s); noscroll(true);
    var pane = s.querySelector('.kzf-qs-in'), H = pane.getBoundingClientRect().height || 300, key = {};
    var put = function (y) { pane.style.transform = 'translateY(' + y.toFixed(1) + 'px)'; s.style.backgroundColor = 'rgba(0,0,0,' + (0.55 * Math.max(0, Math.min(1, 1 - y / H))).toFixed(3) + ')'; };
    var spring = function (a, b, fn, end) { if (K.spring && !calm) return K.spring(key, a, b, fn, 'snappy', end); fn(b); if (end) end(); return { v: 0 }; };
    put(calm ? 0 : H); spring(H, 0, put);
    var gone = false, close = function (then) { if (gone) return; var fin = function () { if (gone) return; gone = true; s.remove(); noscroll(false); if (then) then(); }; spring(0, H + 90, function (y) { put(y); if (y >= H) fin(); }, fin); };
    var y0 = null, dy = 0, t0 = 0;
    pane.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; }, { passive: true });
    pane.addEventListener('touchmove', function (e) { if (y0 == null) return; var x = e.touches[0].clientY - y0; dy = x >= 0 ? x : -(1 - 1 / (0.55 * -x / H + 1)) * H; put(dy); }, { passive: true });
    pane.addEventListener('touchend', function () { if (y0 == null) return; var v = dy / Math.max(1, Date.now() - t0) * 1000; y0 = null; if (dy > H * 0.3 || v > 900) close(); else spring(dy, 0, put); });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b && e.target !== s) return;
      if (!b) { close(); return; }
      var t = b.getAttribute('data-q'); close(function () { if (t === 'q') openCard(); else if (t === 'a') openQuestion(); });
    });
    var f = s.querySelector('button'); if (f) f.focus({ preventScroll: true });
  }

  // ---------- the header buttons ----------
  var QI = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>';
  var PI = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  function place() {
    if (document.getElementById('kz-today-s1')) return;   // Today has its own
    var hr = document.querySelector('#kz-header .kz-hright'); if (!hr) return;
    var burger = hr.querySelector('.kz-burger');
    if (!hr.querySelector('.kz-hadd') && K.openAdd) {
      var a = document.createElement('button'); a.type = 'button'; a.className = 'kz-hadd kzdy-add'; a.setAttribute('aria-label', 'Add a goal'); a.innerHTML = PI;
      a.addEventListener('click', function () { try { K.openAdd(); } catch (e) {} });
      hr.insertBefore(a, burger || null);
    }
    if (cur() && !hr.querySelector('.kzf-q')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'kz-chip kzf-q kzdy-q'; b.setAttribute('aria-label', 'Quote of the day and today\'s question'); b.innerHTML = QI;
      b.addEventListener('click', chooser); hr.insertBefore(b, hr.firstChild);
    }
    document.documentElement.classList.add('kzdy-on');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(place, 0); }); else setTimeout(place, 0);
})();
