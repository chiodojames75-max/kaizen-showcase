/* Oct 27 · goal page tidy
   1. One journal: the composer is the only place to write today; past days appear only when they hold a note
      (tapping a dot on the Every day strip still opens that day so you can add one).
   2. Quit goals: one clean header card (days clean, three stats, your why, support row) instead of the old
      text lines plus a second, contradicting stats row. */
(function () {
  var K = window.KZ; if (!K || !document.getElementById('kz-goalpage')) return;
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var SUBST = /\b(drug|drugs|weed|marijuana|cannabis|thc|vap(e|ing)|nicotine|smok(e|ing)|cigarette|cig|juul|alcohol|drink(ing)?|beer|liquor|cocaine|coke|pills|opioid|adderall|xanax|gambl(e|ing)|bet(ting)?|meth|heroin)\b/i;
  function gid() { return new URLSearchParams(location.search).get('id') || ''; }
  function goal() { var id = gid(); return (K.goals ? K.goals() : []).filter(function (g) { return g.id === id; })[0] || null; }
  function fmt(k, o) { return new Date(k + 'T12:00:00').toLocaleDateString(undefined, o); }

  // ---------- 1 · journal ----------
  function journal() {
    var jw = document.getElementById('kz-goaljournal'); if (!jw || jw.hidden) return;
    var lab = jw.querySelector('.kz-gnote > .kz-label');
    if (lab) {
      var day = lab.parentNode.getAttribute('data-day') || K.key(K.today());
      var t = 'Today · ' + fmt(day, { weekday: 'short', month: 'short', day: 'numeric' });
      if (lab.textContent !== t) lab.textContent = t;
      var g = goal(), box = jw.querySelector('.kz-gnbox');
      var ph = g && g.quit ? 'How did today go? What helped?' : 'How did today go?'; if (box && box.placeholder !== ph) box.placeholder = ph;
    }
    // an X in the composer's corner turns this goal's journal off (notes are kept; "Keep a journal" brings it back)
    var gn = jw.querySelector('.kz-gnote');
    if (gn && !gn.querySelector('.kzgj-x')) { var xb = document.createElement('button'); xb.type = 'button'; xb.className = 'kzgj-x'; xb.setAttribute('aria-label', 'Close the journal for this goal'); xb.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'; gn.appendChild(xb); }
    var head = jw.querySelector('.kzgj-earlier');
    if (!head) { var days = jw.querySelector('[data-g1="days"]'); if (days) { head = document.createElement('span'); head.className = 'kz-label kzgj-earlier'; head.textContent = 'Earlier notes'; days.parentNode.insertBefore(head, days); } }
    if (head) {
      var any = !!jw.querySelector('.kz-g1day:not(:has(.kz-g1text.empty)), .kz-g1day.kzgj-show');
      if (head.hidden === any) head.hidden = !any;
      if (head.style.getPropertyValue('display') !== (any ? '' : 'none')) { if (any) head.style.removeProperty('display'); else head.style.setProperty('display', 'none', 'important'); }
    }
    // "Show older days" only when older days actually hold notes (empty days are never shown)
    var more = jw.querySelector('[data-g1="more"]');
    if (more) {
      var ds = jw.querySelectorAll('.kz-g1day[data-day]'), oldest = ds.length ? ds[ds.length - 1].getAttribute('data-day') : '', older = false;
      try { var nn = K.gnotes(gid()) || {}; for (var k in nn) if (nn[k] && (!oldest || k < oldest)) { older = true; break; } } catch (e) {}
      var hide = !older;
      if (hide && more.style.getPropertyValue('display') !== 'none') more.style.setProperty('display', 'none', 'important');
      else if (!hide && more.style.getPropertyValue('display')) more.style.removeProperty('display');
    }
  }
  document.addEventListener('click', function (e) {
    var x = e.target.closest && e.target.closest('.kzgj-x'); if (!x) return; e.preventDefault(); e.stopPropagation();
    var g = goal(); if (!g || !K.updateGoal) return;
    try { x.blur(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (er) {}
    K.updateGoal(g.id, { log: false });
    try { document.dispatchEvent(new CustomEvent('kz:goals')); } catch (er) {}
    try { window.webkit.messageHandlers.kaizen.postMessage({ type: 'tick' }); } catch (er) {}
    if (K.toast) K.toast('Journal closed. Your notes are kept.');
  }, true);
  // a tap on a day dot: make sure that day's card exists and is visible before goal.html scrolls to it
  document.addEventListener('click', function (e) {
    var j = e.target.closest && e.target.closest('[data-jump]'); if (!j) return;
    var k = j.getAttribute('data-jump'); if (k === K.key(K.today())) return;
    var more = document.querySelector('[data-g1="more"]'), el = document.getElementById('d-' + k), guard = 0;
    while (!el && more && !more.hidden && guard++ < 200) { more.click(); el = document.getElementById('d-' + k); }
    if (el) { el.classList.add('kzgj-show'); journal(); }
  }, true);

  // ---------- 1b · the step row on a goal page never moves (James, Oct 27): no drag handle, no hold-to-move ----------
  window.addEventListener('pointerdown', function (e) {
    var t = e.target; if (!t.closest || !t.closest('#kz-goalpage')) return;
    if (t.closest('[data-kz-drag]') || (t.closest('.kz-grow') && !t.closest('button, a, input, textarea, .kz-check, .kz-gmore, .kz-gmenu'))) { e.stopImmediatePropagation(); if (t.closest('[data-kz-drag]')) e.preventDefault(); }
  }, true);

  // ---------- 2 · quit header ----------
  function quitCard() {
    var page = document.getElementById('kz-goalpage'), g = goal(), old = page.querySelector('.kzgq');
    if (!g || !g.quit) { if (old) old.remove(); page.classList.remove('kzgq-on'); return; }
    var s = K.quitStats ? K.quitStats(g.id) : null; if (!s) return;
    var total = 0; try { var d = (K.get('done', {}) || {})[g.id] || {}, sl = g.slips || []; for (var k in d) if (d[k] && sl.indexOf(k) < 0) total++; } catch (e) {}
    var sl0 = (g.slips || []).slice().sort(), lastSlip = sl0.length ? fmt(sl0[sl0.length - 1], { month: 'short', day: 'numeric' }) : 'None';   /* Oct 27: a slip resets; no running total of clean days */
    var since = g.created ? fmt(String(g.created).slice(0, 10), { month: 'short', day: 'numeric' }) : '';
    var h = '<div class="kzgq-top"><span class="kz-label">Clean streak</span>' + (since ? '<span class="kzgq-since">Since ' + esc(since) + '</span>' : '') + '</div>' +
      '<div class="kzgq-big"><b>' + s.clean + '</b><span>' + (s.clean === 1 ? 'day clean' : 'days clean') + '</span></div>' +
      '<div class="kzgq-stats"><div><b>' + s.best + '</b><span>Best run</span></div><div><b>' + s.slips + '</b><span>' + (s.slips === 1 ? 'Slip' : 'Slips') + '</span></div><div><b>' + esc(lastSlip) + '</b><span>Last slip</span></div></div>' +
      (s.slips && !s.clean && s.strict !== false ? '<p class="kzgq-kept">Strict mode: a slip resets the count to 0. Check in clean tonight and it starts again.</p>' : '') + (s.strict === false ? '<p class="kzgq-kept">Forgiving mode: a slip doesn’t count as clean, but it doesn’t end your run.</p>' : '') +
      (g.why ? '<div class="kzgq-why"><span class="kz-label">Your why</span><p>' + esc(g.why) + '</p></div>' : '') +
      (SUBST.test(g.name || '') ? '<a class="kzgq-help" href="tel:18006624357" aria-label="Call the SAMHSA helpline, free and confidential, 24/7: 1-800-662-4357"><i aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></i><span><b>Need support?</b><small>SAMHSA · free, 24/7</small></span><em>Call</em></a>' : '');
    var box = old;
    if (!box) {
      box = document.createElement('section'); box.className = 'kzgq';
      var at = page.querySelector('.kzq-gp') || page.querySelector('.kz-g1stats');
      if (at && at.parentNode) at.parentNode.insertBefore(box, at); else return;
    }
    if (box.__h !== h) { box.__h = h; box.innerHTML = h; }
    page.classList.add('kzgq-on');
  }

  var q = 0;
  function run() { q = 0; try { quitCard(); } catch (e) {} try { journal(); } catch (e) {} }
  function soon() { if (!q) q = requestAnimationFrame(run); }
  function boot() {
    run();
    var body = document.querySelector('[data-g1="body"]'), jw = document.getElementById('kz-goaljournal');
    var mo = new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && t.closest('.kzgq')) continue; soon(); return; } });
    if (body) mo.observe(body, { childList: true });
    if (jw) mo.observe(jw, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    ['kz:goals', 'kz:changed', 'kz:step', 'kz:sync'].forEach(function (n) { document.addEventListener(n, soon); });
    var sg = window.__kzShowGoal;
    if (sg && !sg.__kzgq) { var w = function () { var r = sg.apply(this, arguments); soon(); return r; }; w.__kzgq = 1; window.__kzShowGoal = w; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
