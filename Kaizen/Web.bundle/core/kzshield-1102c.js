/* Nov 2 (b: the Tomorrow card footer redrawn in the climb's style) · one shield rule everywhere (James: "make it so you get a shield when you hit a checkpoint", "no contradictions").
   A shield comes at each checkpoint: day 7, 14, 30 and 45 in a row (the streak), check-off 7, 14, 30 and 45 (Kaizen 66). Hold 2.
   K.shieldNext(n) says how far the next one is; the shield track (Plan/Me) and the Tomorrow card count toward it instead of
   "the next 7 days". Replaces K.shieldTrack and K.tmrShield from index.html / kzbase-1026i.js. */
(function () {
  var K = window.KZ; if (!K || K.__kzshield) return; K.__kzshield = 1;
  var CPS = [7, 14, 30, 45], CYC = 66;
  K.SHIELD_AT = CPS;
  K.shieldNext = function (n) {
    n = Math.max(0, n | 0); var base = Math.floor(n / CYC) * CYC, c = n - base, prev = 0, next = null;
    for (var i = 0; i < CPS.length; i++) { if (CPS[i] > c) { next = CPS[i]; break; } prev = CPS[i]; }
    if (next === null) { prev = CPS[CPS.length - 1]; next = CYC + CPS[0]; }
    return { at: base + next, prog: c - prev, span: next - prev, left: next - c };
  };
  var SHI = function (on) { return '<svg class="kz-shi' + (on ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/>' + (on ? '<path class="t" d="M8.6 12.1l2.4 2.4 4.5-4.7"/>' : '') + '</svg>'; };
  function pipsOn(prog, span) { return Math.max(0, Math.min(7, Math.round(7 * prog / (span || 1)))); }
  K.shieldTrack = function () {
    var si = K.streakInfo(), sh = Math.min(2, si.shields || 0), st = K.streak(), full = sh >= 2, nx = K.shieldNext(st), on = full ? 7 : pipsOn(nx.prog, nx.span), left = nx.left;
    var pips = ''; for (var i = 0; i < 7; i++) pips += '<i' + (i < on ? ' class="on"' : '') + '></i>';
    return '<div class="kz-shtrack' + (full ? ' full' : '') + '" role="img" aria-label="' + sh + ' of 2 streak shields. ' + (full ? 'Full.' : left + (left === 1 ? ' day' : ' days') + ' to the next checkpoint, day ' + nx.at + '.') + '">' +
      '<div class="kz-sh-slots">' + SHI(sh > 0) + SHI(sh > 1) + '</div><div class="kz-sh-pips">' + pips + '</div>' +
      '<div class="kz-sh-next">' + (full ? '<b>FULL</b>' : '<b>' + left + '</b><small>' + (left === 1 ? 'DAY' : 'DAYS') + '</small>') + '</div></div>';
  };
  // Tomorrow card footer (Nov 2 · "fit the theme… make the words line up"): streak on one line, the two shield slots on the
  // right, then the same checkpoint track as the Kaizen 66 card (day 7, 14, 30, 45, the flag at 66) and one line under it.
  var SH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l7.5 2.8v5.8c0 4.8-3.2 8.9-7.5 10.4-4.3-1.5-7.5-5.6-7.5-10.4V5.3z"/></svg>';
  var FL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21.5V3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4.3c2.7-1.5 5.1-1.1 7.4-.2 2.2.9 4.4 1.3 6.9-.1v9.2c-2.5 1.4-4.7 1-6.9.1-2.3-.9-4.7-1.3-7.4.2z" fill="currentColor"/></svg>';
  // Nov 2 c · James: "take away the streak view from the tomorrow tab… the streak only applies to the Kaizen 66". The footer is gone (the line hides when empty).
  K.tmrShield = function () { return ''; };

})();
