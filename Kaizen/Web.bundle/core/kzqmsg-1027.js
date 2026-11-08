/* Oct 27 · Quit check-in messages (James: "a nice message if you were clean, a motivational one if you slipped").
   The plain toasts ("Clean today. Keep going." / "That's okay…") become a small card above the tab bar:
   clean → gold, with the streak and a milestone or a new-best line; slipped → warm, honest encouragement that points at
   the clean days you already have and your why. Messages rotate by day so they don't repeat every night.
   The card lives under <html> (outside every page observer), shows for ~4 s, tap to close. */
(function () {
  var K = window.KZ; if (!K || window.__kzqm) return; window.__kzqm = 1;
  var OLD = { 'Clean today. Keep going.': 'clean', 'That\'s okay. Day 1 starts now.': 'slip', 'That\'s okay. Today counts.': 'slip' };
  var last = null;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-q-clean],[data-q-slip],[data-q-yslip]'); if (!b) return;
    last = { id: b.getAttribute('data-q-clean') || b.getAttribute('data-q-slip') || b.getAttribute('data-q-yslip'), at: Date.now() };
  }, true);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function pick(list) { var d = new Date(), n = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); return list[n % list.length]; }
  function goal(id) { return (K.goals ? K.goals() : []).filter(function (g) { return g.id === id; })[0] || null; }
  function totalClean(g) { var d = ((K.get('done', {}) || {})[g.id]) || {}, sl = g.slips || [], n = 0; for (var k in d) if (d[k] && sl.indexOf(k) < 0) n++; return n; }
  var MILE = { 1: 'Day 1 done. That’s the hardest one.', 3: 'Three days clean. The first wall is behind you.', 7: 'One full week clean.', 14: 'Two weeks. This is becoming who you are.', 21: 'Three weeks clean. The pull gets quieter from here.', 30: 'A whole month clean.', 50: 'Fifty days. Look how far you’ve come.', 66: '66 days. This is a habit now.', 90: 'Ninety days clean.', 100: '100 days clean.', 180: 'Half a year clean.', 365: 'One year clean.' };
  function cleanMsg(g) {
    var s = K.quitStats ? K.quitStats(g.id) : null, n = s ? s.clean : 0;
    var head = n === 1 ? '1 day clean' : n + ' days clean';
    var line = MILE[n] || (s && s.slips && n > 1 && n === s.best ? 'Your longest run so far. Keep it going.' : pick([
      'That’s ' + n + ' times you chose the harder thing.',
      'Quiet win. Those are the ones that count.',
      'One night at a time. That’s how it’s done.',
      'Future you is grateful for tonight.',
      'Another clean day in the books.',
      'Proud of you. Same again tomorrow.']));
    return { tone: 'clean', head: head, line: line };
  }
  function k66Note(g) {
    try {
      var st = K.k66 && K.k66.state(), r = st && st.run; if (!r || r.goal !== g.id || r.state !== 'live') return '';
      return r.sh > 0 ? 'Kaizen 66: a shield covers tonight. Your run is safe' + (r.sh > 1 ? ' (' + (r.sh - 1) + ' left after this).' : ' (that was your last one).')
                      : 'Kaizen 66: no shield left, so this slip ends your run at ' + Math.max(0, (r.day || 1) - 1) + (r.day === 2 ? ' day.' : ' days.');
    } catch (e) { return ''; }
  }
  function slipMsg(g) {
    var s = K.quitStats ? K.quitStats(g.id) : null, tot = totalClean(g), best = s ? s.best : 0;
    var opts = ['The count is back to 0. Tonight starts a new run.', 'A slip is one day, not the whole story.', 'Falling off isn’t failing. Not getting back on is.', 'Honest check-in. That takes guts. Tomorrow is a fresh start.'];
    if (best > 1) opts.push('Your best run is ' + best + ' days. You’ve done it before.');
    if (K.quitStrict && !K.quitStrict(g)) return { tone: 'slip', k66: k66Note(g), head: 'Slip noted', line: pick(['Your run keeps going. Make tomorrow a clean one.', 'One slip doesn’t erase ' + (s ? s.clean : 0) + ' clean days. Keep going.', 'Honest check-in. That takes guts. Back at it tomorrow.']), why: g.why || '' };
    return { tone: 'slip', k66: k66Note(g), head: 'Back to day 0', line: pick(opts), why: g.why || '' };
  }
  var el = null, hideT = 0;
  function show(m) {
    if (!el) {
      el = document.createElement('div'); el.className = 'kzqm'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      el.addEventListener('click', hide); document.documentElement.appendChild(el);
    }
    el.className = 'kzqm ' + m.tone;
    el.innerHTML = '<i aria-hidden="true">' + (m.tone === 'clean'
      ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>'
      : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>') +
      '</i><div><b>' + esc(m.head) + '</b><span>' + esc(m.line) + '</span>' + (m.k66 ? '<small class="k66">' + esc(m.k66) + '</small>' : '') + (m.why ? '<small>Remember why: ' + esc(m.why) + '</small>' : '') + '</div>';
    void el.offsetWidth; el.classList.add('in');
    clearTimeout(hideT); hideT = setTimeout(hide, (m.why || m.k66) ? (m.why && m.k66 ? 6500 : 5200) : 4200);
  }
  function hide() { if (!el) return; clearTimeout(hideT); el.classList.remove('in'); }
  function wrap() {
    var t0 = K.toast; if (!t0 || t0.__kzqm) return;
    var w = function (msg) {
      var kind = OLD[String(msg)];
      if (kind && last && Date.now() - last.at < 3000) { var g = goal(last.id); if (g) { try { show(kind === 'clean' ? cleanMsg(g) : slipMsg(g)); return; } catch (e) {} } }
      return t0.apply(this, arguments);
    };
    w.__kzqm = 1; K.toast = w;
  }
  wrap(); document.addEventListener('DOMContentLoaded', wrap); setTimeout(wrap, 0); setTimeout(wrap, 1500);
})();
