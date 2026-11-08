/* Oct 27 b · replaces kztodoany-1027.js. The To-do in the + sheet on every tab is now the full Today to-do form
   (James: "don't make it simplified"): When (Today / Tomorrow / This week / Pick dates with the month calendar),
   Repeat (added by kzrepeat-1027, which reads the same data-t fields), Time of day bar, Exact time + reminder.
   The markup and behaviour are copied from Today's sheet (index.html) so both look and work the same. */
(function () {
  var K = window.KZ; if (!K || window.__kzta) return; window.__kzta = 1;
  function post(m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} }
  var st = { when: 'today', tFrom: '', tTo: '', tPart: 'any', calM: null, calFresh: false };
  var kd = function (d) { return K.key(d); };
  function q(sh, k) { return sh.querySelector('[data-t="' + k + '"]'); }
  var BOX = '<label class="kz-field49"><span class="kz-label49">The to-do</span><input class="kzta-in" maxlength="90" placeholder="e.g. Email my professor" autocomplete="off" enterkeyhint="done"></label>' +
    '<div class="kz-tfields" data-t="tfields">' +
    '<div class="kz-field49"><span class="kz-label49">When</span><div class="kz-chips49" data-t="twhen" role="group" aria-label="When"><button type="button" data-w="today" aria-pressed="true">Today</button><button type="button" data-w="tmr" aria-pressed="false">Tomorrow</button><button type="button" data-w="week" aria-pressed="false">This week</button><button type="button" data-w="pick" aria-pressed="false">Pick dates</button></div></div>' +
    '<div class="kz-mcal" data-t="tcal" hidden></div><p class="kz-trange" data-t="trange"></p>' +
    '<div class="kz-field49" data-t="tpart-w"><span class="kz-label49">Time of day</span><div class="kz-chips49" data-t="tpart" role="group" aria-label="Part of the day"></div></div>' +
    '<label class="kz-steprow kz-switchrow kz-tuse-old" hidden><span><strong>At a set time</strong><em>With a reminder on your phone</em></span><input type="checkbox" class="kz-sw49" data-t="tuse"></label>' +
    '<div class="kz-ttime" data-t="ttime-w" hidden><label class="kz-field49"><span class="kz-label49">Time</span><input type="time" data-t="ttime" value="09:00"></label>' +
    '<label class="kz-field49"><span class="kz-label49">Remind me</span><select data-t="tremind"></select></label><button type="button" class="kz-tl-link" data-tl="parts">Use a part of the day instead</button></div>' +
    '</div><button type="button" class="kzta-go"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Add to-do</button>';
  function inject() {
    Array.prototype.forEach.call(document.querySelectorAll('.kz-goalsheet .kz-kindseg'), function (seg) {
      if (seg.querySelector('[data-kind="todo"]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('data-kind', 'todo'); b.setAttribute('aria-checked', 'false'); b.className = 'kzta-kind'; b.textContent = 'To-do';
      seg.insertBefore(b, seg.querySelector('[data-kind="quit"]') || null);
      var form = seg.closest('form'); if (form && !form.querySelector('.kzta-box')) {
        var box = document.createElement('div'); box.className = 'kzta-box'; box.innerHTML = BOX;
        var note = form.querySelector('.kznt-entry'); (note || seg).parentNode.insertBefore(box, (note || seg).nextSibling);
        var rem = q(box, 'tremind'); rem.innerHTML = (K.REMIND || []).map(function (r) { return '<option value="' + r[0] + '">' + r[1] + '</option>'; }).join('') + '<option value="-1">No reminder</option>';
      }
    });
  }
  function sheetOf(el) { return el && el.closest && el.closest('.kz-sheet49'); }
  function setWhen(sh, w) {
    st.when = w; var t = K.today();
    if (w === 'today') { st.tFrom = kd(t); st.tTo = ''; } else if (w === 'tmr') { st.tFrom = kd(K.addDays(t, 1)); st.tTo = ''; }
    else if (w === 'week') { st.tFrom = kd(t); st.tTo = kd(K.addDays(t, (7 - t.getDay()) % 7)); }
    else if (w === 'pick') { st.tFrom = kd(t); st.tTo = ''; st.calFresh = true; }
    paintWhen(sh);
  }
  function paintWhen(sh) {
    q(sh, 'twhen').querySelectorAll('[data-w]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.w === st.when)); });
    var useT = q(sh, 'tuse').checked; q(sh, 'ttime-w').hidden = !useT; q(sh, 'tpart-w').hidden = useT;
    var BAR = (K.PARTS || []).filter(function (x) { return x[0] !== 'any'; }), cur = (K.PARTS || []).filter(function (x) { return x[0] === st.tPart; })[0];
    q(sh, 'tpart').innerHTML = '<div class="kz-tl-bar" role="radiogroup" aria-label="Time of day">' + BAR.map(function (x) { return '<button type="button" role="radio" class="kz-tl-' + x[0] + '" data-part="' + x[0] + '" aria-checked="' + (x[0] === st.tPart) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="kz-tl-ticks" aria-hidden="true"><span>Morning</span><span>12 PM</span><span>5 PM</span><span>9 PM</span><span>Late</span></div>' +
      '<div class="kz-tl-row"><span class="kz-tl-now">' + (st.tPart === 'any' ? 'Anytime' : (cur ? cur[1] : 'Anytime')) + ' · no reminder</span><span class="kz-tl-acts">' + (st.tPart !== 'any' ? '<button type="button" class="kz-tl-link" data-part="any">Anytime</button>' : '') + '<button type="button" class="kz-tl-link" data-tl="time">Exact time</button></span></div>';
    q(sh, 'tcal').hidden = st.when !== 'pick'; if (st.when === 'pick') paintCal(sh);
    var f = function (k) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
    q(sh, 'trange').textContent = st.tTo && st.tTo !== st.tFrom ? 'Shows on Today from ' + f(st.tFrom) + ' to ' + f(st.tTo) + '. Done any day in between counts.' : st.when === 'pick' ? 'Shows on Today on ' + f(st.tFrom) + '. Tap a second day to make it a stretch of days.' : st.when === 'tmr' ? 'Shows up tomorrow.' : st.when === 'week' ? 'Shows every day until ' + f(st.tTo) + ', or until you check it off.' : 'Just for today.';
  }
  function paintCal(sh) {
    var t = K.today(); if (!st.calM) st.calM = new Date(t.getFullYear(), t.getMonth(), 1);
    var y = st.calM.getFullYear(), m = st.calM.getMonth(), first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), lead = first.getDay(), tk = kd(t), cells = '';
    for (var i = 0; i < lead; i++) cells += '<span></span>';
    for (var d = 1; d <= days; d++) { var k = kd(new Date(y, m, d)), past = k < tk, inR = st.tFrom && st.tTo && k > st.tFrom && k < st.tTo, ends = k === st.tFrom || k === st.tTo;
      cells += '<button type="button" data-cal="' + k + '"' + (past ? ' disabled' : '') + ' class="' + (ends ? 'end' : inR ? 'in' : '') + (k === tk ? ' today' : '') + '">' + d + '</button>'; }
    var canBack = y > t.getFullYear() || m > t.getMonth();
    q(sh, 'tcal').innerHTML = '<div class="kz-mcal-h"><button type="button" data-calnav="-1" aria-label="Previous month"' + (canBack ? '' : ' disabled') + '>‹</button><b>' + first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</b><button type="button" data-calnav="1" aria-label="Next month">›</button></div>' +
      '<div class="kz-mcal-w">' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function (x) { return '<i>' + x + '</i>'; }).join('') + '</div><div class="kz-mcal-g">' + cells + '</div>';
  }
  function setOn(sh, on) {
    sh.classList.toggle('kzta-on', on);
    var t = sh.querySelector('[data-gx="t"]'); if (t) { if (on) { if (!t.__kzta) t.__kzta = t.textContent; t.textContent = 'New to-do'; } else if (t.__kzta && t.textContent === 'New to-do') t.textContent = t.__kzta; }
    var tb = sh.querySelector('.kzta-kind'); if (tb) tb.setAttribute('aria-checked', String(on));
    if (!on && !sh.querySelector('.kz-kindseg [data-kind]:not([data-kind="todo"])[aria-checked="true"]')) {   // give the goal kinds their pick back, or the sheet won't reopen
      var pv = sh.querySelector('.kz-kindseg [data-kind="' + (sh.__kztaPrev || 'long') + '"]') || sh.querySelector('.kz-kindseg [data-kind="long"]'); if (pv) pv.setAttribute('aria-checked', 'true'); }
    if (on) { var cur = sh.querySelector('.kz-kindseg [data-kind]:not([data-kind="todo"])[aria-checked="true"]'); if (cur) sh.__kztaPrev = cur.getAttribute('data-kind');
      Array.prototype.forEach.call(sh.querySelectorAll('.kz-kindseg [data-kind]:not([data-kind="todo"])'), function (b) { b.setAttribute('aria-checked', 'false'); });
      st.tPart = 'any'; st.calM = null; var u = q(sh, 'tuse'); if (u) u.checked = false; setWhen(sh, 'today'); }
  }
  function add(sh) {
    var inp = sh.querySelector('.kzta-in'), txt = inp ? inp.value.trim() : ''; if (!txt) { if (inp) inp.focus(); return; }
    var useT = q(sh, 'tuse').checked;
    var id = K.addTodo ? K.addTodo({ txt: txt, from: st.tFrom, to: st.tTo, part: st.tPart, time: useT ? q(sh, 'ttime').value : '', remind: useT ? +q(sh, 'tremind').value : -1 }) : null; if (!id) return;
    post({ type: 'haptic', n: 2 }); try { document.dispatchEvent(new CustomEvent('kz:changed')); } catch (e) {}
    var today = st.tFrom === kd(K.today());
    inp.value = ''; inp.blur(); setOn(sh, false);
    var x = sh.querySelector('[data-gx="close"]'); if (x) x.click();
    if (K.toast) K.toast(today ? 'To-do added to Today' : 'To-do added');
  }
  // window capture: runs before the sheet's own kind handlers (kzfix3 relabels the gold button on a kind tap, which removed the label the sheet needs to reopen)
  window.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var kb = t.closest('.kz-goalsheet .kz-kindseg [data-kind]');
    if (kb) {
      var sh = sheetOf(kb); if (!sh) return;
      if (kb.getAttribute('data-kind') === 'todo') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (sh.classList.contains('kzq-on')) { var lg = sh.querySelector('.kz-kindseg [data-kind="long"]'); if (lg) lg.click(); }
        setOn(sh, true); post({ type: 'tick' }); var inp = sh.querySelector('.kzta-in'); if (inp) setTimeout(function () { inp.focus(); }, 30);
      } else if (sh.classList.contains('kzta-on')) setOn(sh, false);
      return;
    }
    var sh2 = sheetOf(t); if (!sh2 || !sh2.classList.contains('kzta-on')) return;
    var w = t.closest('[data-t="twhen"] [data-w]'); if (w) { setWhen(sh2, w.dataset.w); return; }
    var p = t.closest('[data-t="tpart"] [data-part]'); if (p) { st.tPart = p.dataset.part; paintWhen(sh2); return; }
    if (t.closest('[data-t="tpart"] [data-tl="time"]')) { var u = q(sh2, 'tuse'); u.checked = true; var hr = new Date().getHours() + 1; if (st.when === 'today' && hr < 24) q(sh2, 'ttime').value = (hr < 10 ? '0' : '') + hr + ':00'; paintWhen(sh2); return; }
    if (t.closest('[data-t="ttime-w"] [data-tl="parts"]')) { q(sh2, 'tuse').checked = false; paintWhen(sh2); return; }
    var n = t.closest('[data-t="tcal"] [data-calnav]'); if (n) { st.calM = new Date(st.calM.getFullYear(), st.calM.getMonth() + +n.dataset.calnav, 1); paintCal(sh2); return; }
    var c = t.closest('[data-t="tcal"] [data-cal]'); if (c && !c.disabled) { var k = c.dataset.cal;
      if (st.calFresh || !st.tFrom || st.tTo || k < st.tFrom) { st.tFrom = k; st.tTo = ''; st.calFresh = false; } else if (k === st.tFrom) st.tTo = ''; else st.tTo = k;
      paintWhen(sh2); return; }
    var go = t.closest('.kzta-go'); if (go) { e.preventDefault(); add(sh2); }
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('kzta-in')) { e.preventDefault(); add(sheetOf(e.target)); } }, true);
  var qq = 0;
  function run() { qq = 0; inject(); Array.prototype.forEach.call(document.querySelectorAll('.kz-sheet49.kzta-on'), function (sh) { if (sh.hidden || getComputedStyle(sh).display === 'none') setOn(sh, false); }); }
  function boot() { run(); new MutationObserver(function () { if (!qq) qq = requestAnimationFrame(run); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
