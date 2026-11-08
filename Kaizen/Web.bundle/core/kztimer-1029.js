/* Oct 29 · Timer and stopwatch (James: "make it just a little button you can press, and you can start a timer or a
   stopwatch, one or the other", next to the quote / notes button in the header). One small clock button in every tab's
   header (#kz-header .kz-hright, before the quote button). It opens a sheet: Timer | Stopwatch.
   - Timer: pick 1–90 minutes or Custom (hours + minutes, up to 23 h 59 min), Start. Full-screen countdown with a gold ring, Pause / Resume, End. At zero: chime + buzz.
   - Stopwatch: Start counts up; Pause / Resume, Reset.
   Only one runs at a time (kz_timer). It keeps start/end times, so leaving the app or locking the phone doesn't lose it:
   the phone gets a "Time's up" notification for a timer (sent with the to-do reminders, id "kzt-timer"), and any tab
   shows the running one again. While one runs, the header button turns gold. Nothing is checked off; it's just a clock.
   Styles: kztimer-1029.css */
(function () {
  var K = window.KZ; if (!K || K.__kztimer) return; K.__kztimer = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var CHOICES = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 90];
  var CLOCK = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.6M9.5 2.8h5M12 2.8V6"/></svg>';

  // ---------- state: { mode: 'timer'|'watch', mins, total, end, started, acc, paused, left, done } ----------
  function len(m) { var hh = Math.floor(m / 60), mm = m % 60; return (hh ? hh + ' hr' + (mm ? ' ' : '') : '') + (mm || !hh ? mm + ' min' : ''); }
  function st() { var s = K.get('timer', null); return s && typeof s === 'object' && s.mode ? s : null; }
  function save(s) { K.set('timer', s || null); syncNotify(); paintBtn(); }
  function remain(s) { return s.paused ? s.left : Math.max(0, s.end - Date.now()); }
  function elapsed(s) { return (s.acc || 0) + (s.paused ? 0 : Date.now() - s.started); }

  // the timer's "Time's up" notification rides along with the to-do reminders (the phone keeps exactly the list it's sent)
  try {
    var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen;
    if (h && h.postMessage && !h.__kztm) {
      var raw = h.postMessage.bind(h);
      h.postMessage = function (m) {
        try {
          if (m && m.type === 'todoSync') {
            var s = st(), items = (m.items || []).filter(function (x) { return x.id !== 'timer'; });
            if (s && s.mode === 'timer' && !s.paused && !s.done && s.end > Date.now() + 1500) items.unshift({ id: 'timer', at: s.end, title: 'Time’s up', body: 'Your ' + len(s.mins) + ' timer is done.' });
            m = { type: 'todoSync', items: items, ask: !!m.ask };
          }
        } catch (e) {}
        return raw(m);
      };
      h.__kztm = 1;
    }
  } catch (e) {}
  function syncNotify(ask) { try { if (K.syncReminders) K.syncReminders(!!ask); } catch (e) {} }

  // ---------- the header button ----------
  function paintBtn() {
    var s = st(), on = !!(s && !s.done);
    [].forEach.call(document.querySelectorAll('.kztm-hb'), function (b) {
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', on ? (s.mode === 'timer' ? 'Timer running' : 'Stopwatch running') + '. Open it.' : 'Timer and stopwatch');
    });
  }
  function addBtn() {
    var hr = document.querySelector('#kz-header .kz-hright'); if (!hr || hr.querySelector('.kztm-hb')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kztm-hb'; b.innerHTML = CLOCK;
    var q = hr.querySelector('.kzf-q'); hr.insertBefore(b, q || hr.firstChild); paintBtn();
  }

  // ---------- the picker sheet ----------
  var sheet = null, pickMode = 'timer', pickMins = 5, custom = false;
  function openSheet() {
    closeSheet(true); try { var last = K.get('timerlast', null); if (last) { pickMode = last.mode === 'watch' ? 'watch' : 'timer'; pickMins = +last.mins || 5; } } catch (e) {} custom = CHOICES.indexOf(pickMins) < 0;
    sheet = document.createElement('div'); sheet.className = 'kztm-pick'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Timer and stopwatch');
    sheet.innerHTML = '<div class="kztm-ps"><div class="kztm-seg" role="tablist">' +
      '<button type="button" role="tab" data-kztm-mode="timer">Timer</button><button type="button" role="tab" data-kztm-mode="watch">Stopwatch</button></div>' +
      '<div class="kztm-body"></div><div class="kztm-pacts"><button type="button" class="kztm-btn gold" data-kztm-go>Start</button><button type="button" class="kztm-btn" data-kztm-px>Cancel</button></div></div>';
    document.body.appendChild(sheet); post({ type: 'pageScroll', on: false }); paintSheet();
    requestAnimationFrame(function () { if (sheet) sheet.classList.add('on'); });
    sheet.addEventListener('input', function (e) { if (e.target.closest('[data-kztm-ch], [data-kztm-cm]')) { readCustom(); var go = sheet.querySelector('[data-kztm-go]'); if (go) go.disabled = !(pickMins >= 1); } });
    sheet.addEventListener('change', function (e) { if (e.target.closest('[data-kztm-ch], [data-kztm-cm]')) { readCustom(); paintCustom(); } });
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || e.target.closest('[data-kztm-px]')) { closeSheet(); return; }
      var m = e.target.closest('[data-kztm-mode]'); if (m) { pickMode = m.getAttribute('data-kztm-mode'); post({ type: 'tick' }); paintSheet(); return; }
      var c = e.target.closest('[data-kztm-pm]'); if (c) { var v = c.getAttribute('data-kztm-pm'); if (v === 'c') { custom = true; post({ type: 'tick' }); paintSheet(); var hi = sheet.querySelector('[data-kztm-cm]'); if (hi) try { hi.focus(); hi.select(); } catch (er) {} return; } custom = false; pickMins = +v; post({ type: 'tick' }); paintSheet(); return; }
      if (e.target.closest('[data-kztm-go]')) { if (pickMode === 'timer' && custom) readCustom(); if (pickMode === 'timer' && !(pickMins >= 1)) return; K.set('timerlast', { mode: pickMode, mins: pickMins }); closeSheet(true); start(pickMode, pickMins); }
    });
  }
  function paintSheet() {
    if (!sheet) return;
    [].forEach.call(sheet.querySelectorAll('[data-kztm-mode]'), function (b) { var on = b.getAttribute('data-kztm-mode') === pickMode; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    var body = sheet.querySelector('.kztm-body');
    body.innerHTML = pickMode === 'timer'
      ? '<p class="kztm-pp">How long?</p><div class="kztm-chips" role="group" aria-label="How long">' + CHOICES.map(function (m) { var on = !custom && m === pickMins; return '<button type="button" class="kztm-chip' + (on ? ' on' : '') + '" data-kztm-pm="' + m + '" aria-pressed="' + on + '">' + m + ' min</button>'; }).join('') +
        '<button type="button" class="kztm-chip kztm-cchip' + (custom ? ' on' : '') + '" data-kztm-pm="c" aria-pressed="' + custom + '">Custom</button></div>' +
        (custom ? '<div class="kztm-custom"><label><input type="number" inputmode="numeric" min="0" max="23" step="1" data-kztm-ch value="' + Math.floor(pickMins / 60) + '" aria-label="Hours" enterkeyhint="done"><span>hr</span></label>' +
          '<label><input type="number" inputmode="numeric" min="0" max="59" step="1" data-kztm-cm value="' + (pickMins % 60) + '" aria-label="Minutes" enterkeyhint="done"><span>min</span></label></div>' : '')
      : '<p class="kztm-pp">Counts up from 0:00 until you stop it.</p>';
    var go = sheet.querySelector('[data-kztm-go]'); if (go) go.disabled = pickMode === 'timer' && !(pickMins >= 1);
  }
  function readCustom() {
    if (!sheet) return; var hi = sheet.querySelector('[data-kztm-ch]'), mi = sheet.querySelector('[data-kztm-cm]'); if (!hi || !mi) return;
    var hh = Math.max(0, Math.min(23, parseInt(hi.value, 10) || 0)), mm = Math.max(0, Math.min(1439, parseInt(mi.value, 10) || 0));
    pickMins = Math.min(23 * 60 + 59, hh * 60 + mm);
  }
  function paintCustom() {   // tidy the boxes after typing (75 min becomes 1 hr 15 min)
    if (!sheet) return; var hi = sheet.querySelector('[data-kztm-ch]'), mi = sheet.querySelector('[data-kztm-cm]'); if (!hi || !mi) return;
    hi.value = Math.floor(pickMins / 60); mi.value = pickMins % 60; var go = sheet.querySelector('[data-kztm-go]'); if (go) go.disabled = !(pickMins >= 1);
  }
  function closeSheet(now) { if (!sheet) return; var s = sheet; sheet = null; s.classList.remove('on'); if (!layer) setTimeout(function () { if (!layer) post({ type: 'pageScroll', on: true }); }, 120); setTimeout(function () { s.remove(); }, now ? 0 : 260); }

  // ---------- the full-screen clock ----------
  var layer = null, tick = 0, R = 118, C = 2 * Math.PI * R;
  function fmt(ms, up) {
    var t = up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000), hh = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sec = t % 60;
    return (hh ? hh + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  function render() {
    var s = st(); if (!s) { closeLayer(); return; }
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'kztm-over'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-labelledby', 'kztm-n');
      layer.innerHTML = '<div class="kztm-in"><p class="kztm-tag" id="kztm-n"></p>' +
        '<div class="kztm-ring"><svg viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="' + R + '" class="tr"/><circle cx="130" cy="130" r="' + R + '" class="pr" stroke-dasharray="' + C.toFixed(1) + '" transform="rotate(-90 130 130)"/></svg>' +
        '<div class="kztm-mid"><b class="kztm-t" role="timer" aria-live="off"></b><span class="kztm-sub"></span></div></div>' +
        '<div class="kztm-acts"></div><button type="button" class="kztm-min" data-kztm="hide">Hide (keeps running)</button></div>';
      document.body.appendChild(layer); document.body.classList.add('kz-noscroll'); post({ type: 'pageScroll', on: false });
      requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
      layer.addEventListener('click', onClick);
    }
    var watch = s.mode === 'watch', ms = watch ? elapsed(s) : remain(s);
    var frac = watch ? (ms % 60000) / 60000 : (s.done ? 1 : 1 - ms / s.total);
    layer.querySelector('.kztm-tag').textContent = watch ? 'STOPWATCH' : 'TIMER · ' + len(s.mins).toUpperCase();
    layer.querySelector('.pr').setAttribute('stroke-dashoffset', (C * (1 - frac)).toFixed(1));
    layer.classList.toggle('done', !!s.done); layer.classList.toggle('paused', !!s.paused); layer.classList.toggle('watch', watch);
    var t = layer.querySelector('.kztm-t'), sub = layer.querySelector('.kztm-sub'), acts = layer.querySelector('.kztm-acts'), a = '', sig;
    if (s.done) { t.textContent = 'Done'; sub.textContent = len(s.mins); sig = 'd'; a = '<button type="button" class="kztm-btn gold" data-kztm="close">Close</button><button type="button" class="kztm-btn" data-kztm="again">Again</button>'; }
    else {
      t.textContent = fmt(ms, watch); sub.textContent = s.paused ? 'Paused' : (watch ? 'Running' : 'Left'); sig = (s.paused ? 'p' : 'r') + (watch ? 'w' : 't');
      a = '<button type="button" class="kztm-btn gold" data-kztm="' + (s.paused ? 'resume' : 'pause') + '">' + (s.paused ? 'Resume' : 'Pause') + '</button>' +
        '<button type="button" class="kztm-btn" data-kztm="' + (watch ? 'reset' : 'end') + '">' + (watch ? 'Reset' : 'End') + '</button>';
    }
    t.setAttribute('aria-label', s.done ? 'Done' : fmt(ms, watch) + (watch ? ' elapsed' : ' left'));
    if (acts.__s !== sig) { acts.__s = sig; acts.innerHTML = a; }
    layer.querySelector('.kztm-min').hidden = !!s.done;
  }
  function closeLayer() {
    clearInterval(tick); tick = 0; if (!layer) return; var l = layer; layer = null; l.classList.remove('on');
    document.body.classList.remove('kz-noscroll'); setTimeout(function () { if (!layer && !sheet) post({ type: 'pageScroll', on: true }); }, 120);
    setTimeout(function () { l.remove(); }, 240);
  }
  function ring() { try { if (K.sound) { K.sound(); setTimeout(K.sound, 700); } } catch (e) {} post({ type: 'haptic', n: 2 }); }
  function loop() {
    var s = st(); if (!s || document.hidden || !layer) { if (s && s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); ring(); if (!document.hidden) render(); } return; }
    if (s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); ring(); }
    render();
  }
  function run() { render(); clearInterval(tick); tick = setInterval(loop, 200); }
  // hidden but running: keep a slow check so the chime still plays when a timer ends while the clock is hidden
  setInterval(function () { var s = st(); if (s && !layer && !document.hidden && s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); ring(); run(); } }, 1000);
  function start(mode, mins) {
    var now = Date.now(), s = mode === 'watch' ? { mode: 'watch', started: now, acc: 0 } : { mode: 'timer', mins: mins, total: mins * 60000, end: now + mins * 60000, started: now };
    K.set('timer', s); syncNotify(mode === 'timer'); paintBtn();   // the first timer asks for notifications
    post({ type: 'tick' }); run();
  }
  K.startTimer = start;
  function onClick(e) {
    var b = e.target.closest('[data-kztm]'); if (!b) return; var a = b.getAttribute('data-kztm'), s = st(); post({ type: 'tick' });
    if (a === 'hide') { closeLayer(); return; }
    if (!s) { closeLayer(); return; }
    if (a === 'pause') { if (s.mode === 'timer') s.left = remain(s); else s.acc = elapsed(s); s.paused = 1; save(s); }
    else if (a === 'resume') { if (s.mode === 'timer') s.end = Date.now() + s.left; else s.started = Date.now(); s.paused = 0; save(s); }
    else if (a === 'end' || a === 'reset' || a === 'close') { save(null); closeLayer(); return; }
    else if (a === 'again') { var mm = s.mins; save(null); start('timer', mm); return; }
    render();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kztm-hb'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); post({ type: 'tick' });
    if (st()) run(); else openSheet();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (sheet) closeSheet(); else if (layer) closeLayer(); } });

  // ---------- coming back: a timer that finished while you were away shows Done ----------
  function resume() { var s = st(); if (!s || document.hidden) return; if (s.mode === 'timer' && !s.done && !s.paused && remain(s) <= 0) { s.done = 1; s.left = 0; save(s); run(); } paintBtn(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) resume(); });
  window.addEventListener('pageshow', resume);
  var raf = 0; function soon() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; addBtn(); }); }
  function boot() {
    addBtn(); resume();
    new MutationObserver(function () { if (!document.querySelector('#kz-header .kztm-hb')) soon(); }).observe(document.getElementById('kz-header') || document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
