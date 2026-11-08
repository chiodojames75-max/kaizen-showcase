/* Nov 2 b · the weekly recap: no everyday-streak shields or rest days; Feet climbed, and the Kaizen 66's shields (or Perfect days). */
/* Nov 2 · replaces kzp3-1023g.js: the weekly recap's "Your tree grew +2.8 in" cell (tree inches) becomes "Shields held" (shields come from checkpoints). */
/* Oct 23 Phase 3: milestones (days 7, 30, 66, 100) and the Monday weekly recap.
   Both are one full-screen moment, shown once, closed with one tap. Nothing leaves the phone. */
(function () {
  var K = window.KZ; if (!K || K.__kzp3) return; K.__kzp3 = 1;
  var MS = [7, 30, 66, 100];
  var COPY = {
    7: ['One week of showing up.', 'Seven days in. This is where most people quit. You didn’t.'],
    30: ['A month of small steps.', '30 days of showing up. It’s starting to be who you are.'],
    66: ['66 days.', 'That’s about how long a habit takes to feel automatic. This one is yours now.'],
    100: ['100 days.', 'Triple digits. Your tree remembers every one of them.']
  };
  var quiet = function () { try { return sessionStorage.getItem('kz_quiet') === '1'; } catch (e) { return false; } };
  var native = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var busy = function () {   // never on top of setup, a sheet, an unlock reveal or another moment
    return document.documentElement.classList.contains('kz-setup') || document.querySelector('.kz-p3') ||
      document.visibilityState === 'hidden' ||
      Array.prototype.some.call(document.querySelectorAll('[role="dialog"], [aria-modal="true"], .kz-sheet49, .kz-appsheet'), function (e) {   // the quote card, a sheet, a reveal...
        if (e.closest('.kz-p3') || e.hidden || !e.getClientRects().length) return false; var s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && (+s.opacity > 0.05 || e.id === 'kz-reveal' || /\bin\b|open|show/.test(e.className));
      });
  };
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function overlay(cls, html, onClose) {
    var o = document.createElement('div'); o.className = 'kz-p3 ' + cls; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'kz-p3-t');
    o.innerHTML = '<div class="kz-p3-in"><button type="button" class="kz-p3-x" data-p3="close" aria-label="Close">' + X + '</button>' + html + '</div>';
    var prevFocus = document.activeElement;
    var close = function () { if (!o.isConnected) return; o.classList.add('out'); document.documentElement.classList.remove('kz-p3-on'); document.body.classList.remove('kz-noscroll'); setTimeout(function () { o.remove(); }, 180); if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) {} if (onClose) onClose(); };
    o.addEventListener('click', function (e) { if (e.target.closest('[data-p3="close-link"]')) { close(); return; } if (e.target === o || e.target.closest('[data-p3="close"]')) { e.preventDefault(); close(); } });
    o.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.body.appendChild(o); document.documentElement.classList.add('kz-p3-on'); document.body.classList.add('kz-noscroll');
    setTimeout(function () { var b = o.querySelector('.kz-p3-go'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }, 60);
    o._close = close; return o;
  }
  // ---------- milestones: days you showed up ----------
  function milestoneDue() {
    var n = K.shownDays ? K.shownDays().length : 0, seen = K.get('ms', {}) || {}, top = 0;
    MS.forEach(function (m) { if (n >= m && !seen[m]) top = m; });
    return top;
  }
  function showMilestone(m) {
    var seen = K.get('ms', {}) || {}; MS.forEach(function (x) { if (x <= m) seen[x] = seen[x] || K.key(K.today()); }); K.set('ms', seen);   // once each; reaching 66 also retires 7 and 30
    var art = ''; try { art = K.lifeTree({ mini: true, lite: true }).svg; } catch (e) {}
    var c = COPY[m];
    var o = overlay('kz-p3-ms', '<div class="kz-p3-art" aria-hidden="true">' + art + '<span class="kz-p3-big">' + m + '</span></div>' +
      '<span class="kz-p3-k">Day ' + m + '</span><h2 class="kz-p3-t" id="kz-p3-t">' + c[0] + '</h2><p class="kz-p3-p">' + c[1] + '</p>' +
      '<div class="kz-p3-act"><button type="button" class="kz-btn kz-p3-go" data-p3="close">Keep going</button><button type="button" class="kz-p3-share" data-p3="share">Share</button></div>', next);
    o.addEventListener('click', function (e) {
      if (!e.target.closest('[data-p3="share"]')) return;
      var text = 'Day ' + m + ' of showing up on Kaizen. One small step, every day.';
      K.track('kz_milestone_share', { day: m });
      if (K.shareMilestone) { K.shareMilestone(m, text); return; }   // Phase 4 swaps in a share image
      if (native()) post({ type: 'text', text: text }); else if (navigator.share) navigator.share({ text: text }).catch(function () {}); else try { navigator.clipboard.writeText(text); } catch (er) {}
    });
    if (native()) post({ type: 'haptic', n: 2 }); else try { navigator.vibrate([12, 60, 18]); } catch (e) {}
    K.track('kz_milestone', { day: m });
  }
  // ---------- weekly recap: last Monday-Sunday, shown on the first open of a new week (Mon-Wed) ----------
  var mondayOf = function (d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  K.lastWeekRecap = function () {   // the same day data the Progress calendar draws from
    var mon = K.addDays(mondayOf(K.today()), -7), sun = K.addDays(mon, 6), days = [], first = K.firstStepDay ? K.firstStepDay() : undefined;
    var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (k) { rest[k] = 1; });
    var wk = K.weekRecap ? K.weekRecap(sun) : { shown: 0, steps: 0 }, grew = 0, restN = 0;
    for (var i = 0; i < 7; i++) { var k = K.key(K.addDays(mon, i)), di = K.dayInfo(k, first); days.push({ k: k, s: di.status }); grew += di.rate || 0; if (rest[k]) restN++; }
    return { from: K.key(mon), to: K.key(sun), shown: wk.shown, steps: wk.steps, rest: restN, grew: grew, days: days };
  };
  function recapDue() {
    if (!document.querySelector('#kz-today-s1')) return false;   // Today only
    var t = K.today(), dow = (t.getDay() + 6) % 7; if (dow > 2) return false;   // Monday to Wednesday
    var wkKey = K.key(mondayOf(t)); if (K.get('recap', '') === wkKey) return false;
    var v = K.get('visit', {}) || {}, lastSun = K.key(K.addDays(mondayOf(t), -1));
    if (!K.goals().length || !v.first || v.first > lastSun) return false;   // only once there's a past week to look at
    return wkKey;
  }
  function showRecap(wkKey) {
    K.set('recap', wkKey);
    var r = K.lastWeekRecap(), fd = function (k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
    var L = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], lab = { full: 'every goal', grew: 'good day', setback: 'rough day', none: 'nothing', today: 'today', future: '' };
    var dots = r.days.map(function (d, i) { return '<span class="kz-p3-d"><i class="' + d.s + '" aria-label="' + fd(d.k) + ': ' + (lab[d.s] || d.s) + '"></i><b aria-hidden="true">' + L[i] + '</b></span>'; }).join('');
    var stat = function (n, l) { return '<div class="kz-p3-st"><b>' + n + '</b><span>' + l + '</span></div>'; };
    var k66 = null; try { var s6 = K.k66 && K.k66.state(); k66 = s6 && s6.run ? { sh: Math.min(2, s6.run.sh || 0) } : null; } catch (e) {}
    var line = r.shown >= 7 ? 'Every single day. That’s how habits stick.' : r.shown >= 4 ? 'More days than not. Let\u2019s make this week a full one.' : r.shown ? 'Every day you show up counts. Let’s add one today.' : 'A fresh week. One small step today starts it.';
    overlay('kz-p3-rc', '<span class="kz-p3-k">Last week</span><h2 class="kz-p3-t" id="kz-p3-t">' + fd(r.from) + ' – ' + fd(r.to) + '</h2>' +
      '<div class="kz-p3-dots" role="img" aria-label="' + r.shown + ' of 7 days">' + dots + '</div>' +
      '<div class="kz-p3-grid">' + stat(r.shown + '<small>/7</small>', 'Days you showed up') + stat(r.steps, r.steps === 1 ? 'Step taken' : 'Steps taken') + stat((r.steps * 131).toLocaleString() + '<small> ft</small>', 'Feet climbed') + (k66 ? stat(k66.sh + '<small>/2</small>', 'Kaizen 66 shields') : stat(r.days.filter(function (d) { return d.s === 'full'; }).length, 'Perfect days')) + '</div>' +
      '<p class="kz-p3-p">' + line + '</p>' +
      '<div class="kz-p3-act"><button type="button" class="kz-btn kz-p3-go" data-p3="close">Start this week</button><a class="kz-p3-share" href="/pages/calendar#kz-cal" data-p3="close-link">See it in Progress</a></div>', next);
    K.track('kz_week_recap', { shown: r.shown, steps: r.steps });
  }
  function next() { setTimeout(check, 400); }
  function check() {
    if (quiet() || busy()) return;
    var wk = recapDue(); if (wk) return showRecap(wk);
    var m = milestoneDue(); if (m) showMilestone(m);
  }
  K.p3check = check;
  // If an unlock reveal opens while a moment is up, the moment steps aside and comes back when the reveal closes
  var rv = document.getElementById('kz-reveal');
  if (rv) new MutationObserver(function () { var o = document.querySelector('.kz-p3'); if (o) o.style.display = rv.hidden ? '' : 'none'; }).observe(rv, { attributes: true, attributeFilter: ['hidden'] });
  var later = function (ms, n) { setTimeout(function () { if (busy()) { if ((n || 0) < 60) later(1500, (n || 0) + 1); return; } check(); }, ms); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { later(1200); }); else later(1200);
  document.addEventListener('kz:step', function () { later(4500); });   // after the check-off's leaf burst, sounds and any unlock reveal (which opens at 2.6 s)
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') later(600); });
})();
