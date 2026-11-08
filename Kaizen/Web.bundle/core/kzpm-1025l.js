/* Oct 25 l (from k, CSS only changes) · Plan + Me, option B ("Calendar first Plan, stats Me").
   Plan: the week strip leads; the selected day reads as a timeline grouped by part of day; quick add is a dashed row
   "Add to Saturday"; the XP boost card (XP is retired) and the "Today so far" card are hidden; "Plan tomorrow" opens the
   existing planner. Me: centred profile, a stat card (best streak, habits earned, days shown up), Your data folds into
   one row. Nothing is removed from the page: the old elements are restyled or hidden only after html.kz-pb is set. */
(function () {
  var K = window.KZ, de = document.documentElement; if (!K) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // XP is retired: drop "+N XP" toasts on these pages
  try { var t0 = K.toast; if (t0 && !t0.__pb) { var tw = function (m) { if (/^\s*\+?\d+\s*XP\s*$/i.test(String(m))) return; return t0.apply(this, arguments); }; tw.__pb = 1; K.toast = tw; } } catch (e) {}
  function hdr(sub) {
    var t = document.querySelector('#kz-header .kz-htitle'); if (!t) return;
    var s = t.querySelector('.kzpb-sub'); if (!s) { s = document.createElement('span'); s.className = 'kzpb-sub'; (t.querySelector('span') || t).appendChild(s); }
    if (s.textContent !== sub) s.textContent = sub;
  }
  // ---------- Plan ----------
  var GR = [['am', 'Morning'], ['pm', 'Afternoon'], ['eve', 'Evening'], ['night', 'Night'], ['any', 'Anytime']];
  function grpOf(li) {
    var sm = li.querySelector('.kz-tbody small'), tx = sm ? sm.textContent.split('·')[0].trim() : '';
    for (var i = 0; i < 4; i++) if (tx === GR[i][1] || (K.partName && tx === K.partName(GR[i][0]))) return i;
    var m = tx.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) { var h = +m[1] % 12 + (/pm/i.test(m[3] || '') ? 12 : 0); if (!m[3]) h = +m[1]; return h < 12 ? 0 : h < 17 ? 1 : h < 21 ? 2 : 3; }
    return 4;
  }
  function plan() {
    var page = document.getElementById('kz-plan-s1'); if (!page) return false;
    var list = page.querySelector('[data-p="day-list"]'), week = page.querySelector('[data-p="week"]'), dayT = page.querySelector('[data-p="day-t"]');
    if (!list || !week || !dayT) return false;
    var boost = page.querySelector('.kz-boost'), tsec = boost && boost.closest('.kz-tsec'); if (tsec) tsec.classList.add('kzpb-off');
    var cal = document.getElementById('kz-cal'); if (cal) cal.classList.add('kzpb-off');
    var head = page.querySelector('.kz-pday-h'), qadd = page.querySelector('[data-p="qadd"]'), qtxt = page.querySelector('[data-p="qtxt"]');
    var ed = document.createElement('button'); ed.type = 'button'; ed.className = 'kzpb-edit'; ed.hidden = true;
    if (head) head.appendChild(ed);
    ed.addEventListener('click', function () { var k = sel(); if (k && K.openPlanner) K.openPlanner(k); });
    function sel() { var b = week.querySelector('[aria-selected="true"]'); return b && b.getAttribute('data-day'); }
    var busy = false;
    function deco() {
      if (busy) return; busy = true;
      try {
        var lis = [].slice.call(list.querySelectorAll(':scope > li.kz-todo'));
        var arr = lis.map(function (li, i) { return { li: li, g: grpOf(li), i: i }; }).sort(function (a, b) { return a.g - b.g || a.i - b.i; });
        var last = -1;
        arr.forEach(function (x, j) {
          x.li.style.order = String(j);
          var lab = x.g !== last ? GR[x.g][1] : ''; last = x.g;
          if ((x.li.getAttribute('data-kzlab') || '') !== lab) { if (lab) x.li.setAttribute('data-kzlab', lab); else x.li.removeAttribute('data-kzlab'); }
        });
        var k = sel(), td = K.key(K.today()), tgt = K.planTargetKey ? K.planTargetKey() : '', has = k && K.plan && K.plan(k);
        var show = !!k && k >= td && (has || k === tgt) && !!K.openPlanner;
        ed.hidden = !show; var lt = has ? 'Edit plan' : 'Plan ' + (k === K.key(K.addDays(K.today(), 1)) ? 'tomorrow' : 'this day');
        if (ed.textContent !== lt) ed.textContent = lt;
        if (qtxt && qtxt.placeholder !== 'New task') qtxt.placeholder = 'New task';
        page.classList.toggle('kzpb-empty', !lis.length);
        var d = k ? new Date(k + 'T12:00:00') : new Date(); hdr(d.toLocaleDateString(undefined, { month: 'long' }));
      } catch (e) {}
      busy = false;
    }
    new MutationObserver(function () { deco(); }).observe(list, { childList: true });
    new MutationObserver(function () { deco(); }).observe(week, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    deco(); de.classList.add('kz-pb', 'kz-pb-plan');
    return true;
  }
  // ---------- Me ----------
  function me() {
    var page = document.getElementById('kz-me'); if (!page) return false;
    var prof = page.querySelector('.kz-set-prof'), card = prof && prof.closest('.kz-set-card'); if (!card) return false;
    var hs = [].slice.call(page.querySelectorAll('.kz-set-h')), dataH = hs.filter(function (h) { return /your data/i.test(h.textContent); })[0];
    var dataCard = dataH && dataH.nextElementSibling, danger = page.querySelector('.kz-set-danger'), dangerCard = danger && danger.closest('.kz-set-card');
    card.classList.add('kzpb-profcard');
    var st = document.createElement('a'); st.className = 'kzpb-stats'; st.href = '/pages/calendar';
    card.parentNode.insertBefore(st, card.nextSibling);
    function stats() {
      var best = 0, hab = 0, days = 0;
      try { best = K.bestStreak() || 0; } catch (e) {}
      try { (K.goals() || []).forEach(function (g) { try { if (K.grow(g.id).earned) hab++; } catch (e) {} }); } catch (e) {}
      try { days = K.daysShownUp() || 0; } catch (e) {}
      var h = [[best, 'best streak', ''], [hab, hab === 1 ? 'habit earned' : 'habits earned', ' gold'], [days, 'days shown up', '']].map(function (x) { return '<span class="kzpb-st' + x[2] + '"><b>' + x[0] + '</b><small>' + x[1] + '</small></span>'; }).join('');
      st.hidden = !days && !best && !hab;
      if (st.innerHTML !== h) { st.innerHTML = h; st.setAttribute('aria-label', 'Best streak ' + best + ' days, ' + hab + ' habits earned, ' + days + ' days shown up. Open Progress'); }
    }
    stats();
    if (dataH && dataCard) {
      var row = document.createElement('div'); row.className = 'kz-set-card kzpb-datarow';
      row.innerHTML = '<button type="button" class="kz-set-row" aria-expanded="false"><span>Your data</span><em>Export, restore, delete</em><i></i></button>';
      dataH.parentNode.insertBefore(row, dataH);
      dataH.classList.add('kzpb-dat'); dataCard.classList.add('kzpb-dat'); if (dangerCard) dangerCard.classList.add('kzpb-dat');
      var b = row.querySelector('button');
      b.addEventListener('click', function () { var on = !de.classList.contains('kz-pb-data'); de.classList.toggle('kz-pb-data', on); b.setAttribute('aria-expanded', String(on)); if (on) setTimeout(function () { (dangerCard || dataCard).scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60); });
    }
    ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(stats, 0); }); });
    window.addEventListener('pageshow', stats);
    de.classList.add('kz-pb', 'kz-pb-me');
    return true;
  }
  var n = 0;
  function setup() { var a = false, b = false; try { a = plan(); } catch (e) {} try { b = me(); } catch (e) {} if (!a && !b && ++n < 40) setTimeout(setup, 150); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 0); }); else setTimeout(setup, 0);
})();
