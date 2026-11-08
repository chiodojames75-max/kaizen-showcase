/* Oct 30 · Habits on chosen days, part 2 (part 1, kzdays-1030.js, is the rule: K.dueOn / K.offDay).
   - New / edit daily habit: "Which days": Every day · Weekdays · Pick days (S M T W T F S). Saved on the habit as wd
     (0 = Sunday … 6 = Saturday; Every day removes it). Picking all seven days is Every day; at least one day stays picked.
   - Today: a habit on its off day isn't shown.
   - Rows on Today / My goals: the "Daily" tag says the days instead ("Weekdays", "Mon, Wed, Fri").
   - Goal page: the history grid's title says the days, and off days show as rest days (part 1 adds them to the goal's rest set). */
(function () {
  var K = window.KZ; if (!K || K.__kzdaysb) return; K.__kzdaysb = 1;
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], DS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WK = [1, 2, 3, 4, 5];
  function goals() { return K.get('goals', []) || []; }
  function goal(id) { return goals().filter(function (g) { return g.id === id; })[0]; }
  function norm(w) { if (!Array.isArray(w)) return null; var o = []; w.forEach(function (d) { d = +d; if (d >= 0 && d <= 6 && o.indexOf(d) < 0) o.push(d); }); o.sort(); return o.length && o.length < 7 ? o : null; }
  function same(a, b) { return String(a) === String(b); }
  function label(w) { w = norm(w); if (!w) return 'Every day'; if (same(w, WK)) return 'Weekdays'; if (same(w, [0, 6])) return 'Weekends'; return w.map(function (d) { return DS[d]; }).join(', '); }
  K.habitDaysLabel = label;
  function saveWd(id, w) {
    w = norm(w); var hit = false;
    var all = goals().map(function (g) { if (g.id !== id) return g; hit = true; if (w) g.wd = w; else delete g.wd; return g; });
    if (hit) K.set('goals', all);
  }

  // ---------- the sheet ----------
  var lastEdit = null, pending = null;
  function kind(sh) { var b = sh.querySelector('[data-kind][aria-checked="true"]'); return b ? b.getAttribute('data-kind') : ''; }
  function paintBox(box) {
    var w = box.__wd, mode = !w ? 'all' : same(w, WK) && !box.__pick ? 'wk' : 'pick';
    [].forEach.call(box.querySelectorAll('[data-wdm]'), function (b) { var on = b.getAttribute('data-wdm') === mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    var row = box.querySelector('.kzwd-days'); row.hidden = mode !== 'pick';
    [].forEach.call(row.querySelectorAll('[data-wdd]'), function (b) { var d = +b.getAttribute('data-wdd'), on = !w || w.indexOf(d) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  }
  function ensure(sh) {
    var form = sh.querySelector('form'); if (!form) return null;
    var box = sh.querySelector('.kzwd');
    if (!box) {
      box = document.createElement('div'); box.className = 'kz-field49 kzwd';
      box.innerHTML = '<span class="kz-label49" id="kzwd-l">Which days</span>' +
        '<div class="kzwd-seg" role="radiogroup" aria-labelledby="kzwd-l"><button type="button" role="radio" data-wdm="all">Every day</button><button type="button" role="radio" data-wdm="wk">Weekdays</button><button type="button" role="radio" data-wdm="pick">Pick days</button></div>' +
        '<div class="kzwd-days" role="group" aria-label="Days" hidden>' + DN.map(function (n, i) { return '<button type="button" data-wdd="' + i + '" aria-label="' + DL[i] + '">' + n + '</button>'; }).join('') + '</div>';
      form.appendChild(box);
      box.__wd = null;
      box.addEventListener('click', function (e) {
        var m = e.target.closest('[data-wdm]'), d = e.target.closest('[data-wdd]');
        if (m) { var v = m.getAttribute('data-wdm'); box.__pick = v === 'pick'; box.__wd = v === 'all' ? null : v === 'wk' ? WK.slice() : (box.__wd || WK.slice()); paintBox(box); }
        if (d) {
          var n = +d.getAttribute('data-wdd'), w = box.__wd ? box.__wd.slice() : [0, 1, 2, 3, 4, 5, 6], i = w.indexOf(n);
          if (i >= 0) { if (w.length > 1) w.splice(i, 1); } else w.push(n);
          box.__pick = true; box.__wd = norm(w); if (!box.__wd) box.__pick = true; paintBox(box);
        }
      });
    }
    // sits right above "Make this my Kaizen 66" (or "Make it stick"), never inside the long-term goal's "Break it down"
    var anchor = sh.querySelector('.kzp-66') || [].filter.call(sh.querySelectorAll('.kz-morebtn'), function (x) { return !x.closest('.kzbd'); })[0];
    if (anchor && anchor.parentNode && box.nextElementSibling !== anchor) anchor.parentNode.insertBefore(box, anchor);
    return box;
  }
  function sheets() {
    [].forEach.call(document.querySelectorAll('.kz-goalsheet'), function (sh) {
      var box = ensure(sh); if (!box) return;
      var daily = kind(sh) === 'daily';
      if (box.hidden !== !daily) box.hidden = !daily;
      if (sh.hidden) { sh.__wdFor = 0; return; }
      if (!sh.__wdFor) {
        sh.__wdFor = 1; var g = lastEdit ? goal(lastEdit) : null;
        box.__wd = g ? norm(g.wd) : null; box.__pick = !!(box.__wd && !same(box.__wd, WK)); paintBox(box);
        var f = sh.querySelector('form');
        if (f && !f.__wd) { f.__wd = 1; f.addEventListener('submit', function () { pending = kind(sh) === 'daily' ? { wd: box.__wd, at: Date.now() } : null; }, true); }
      }
    });
  }
  // carry the inner wrapper's own "already wrapped" marks (kzbd's __bd …) so the other add-ons don't wrap us again and again
  function keep(inner, outer) { for (var f in inner) if (/^__/.test(f)) outer[f] = inner[f]; }
  function wrapOpen() {
    if (!K.goalSheet || !K.goalSheet.open || K.goalSheet.open.__wd) return;
    var op = K.goalSheet.open, w = function (o) { lastEdit = o && o.mode === 'edit' ? o.id : null; [].forEach.call(document.querySelectorAll('.kz-goalsheet'), function (sh) { sh.__wdFor = 0; }); var r = op.apply(this, arguments); setTimeout(sheets, 0); return r; };
    keep(op, w); w.__wd = 1; K.goalSheet.open = w;
  }
  function wrapWrites() {
    ['addGoal', 'updateGoal'].forEach(function (name) {
      if (!K[name] || K[name].__wd) return;
      var fn = K[name], w = function (a, b) {
        var r = fn.apply(this, arguments), p = pending; pending = null;
        if (p && Date.now() - p.at < 5000) { var id = name === 'addGoal' ? r : a, o = name === 'addGoal' ? a : b; if (id && (!o || o.kind === undefined || o.kind === 'daily')) saveWd(id, p.wd); }
        return r;
      };
      keep(fn, w); w.__wd = 1; K[name] = w;
    });
  }

  // ---------- Today, rows, goal page ----------
  function paint() {
    q = 0; wrapOpen(); wrapWrites(); sheets();
    var tk = K.key(K.today());
    [].forEach.call(document.querySelectorAll('.kz-goal[data-goal]'), function (row) {
      var g = goal(row.getAttribute('data-goal')); if (!g) return;
      var onToday = !!row.closest('#kz-today-s1'), off = onToday && K.offDay && K.offDay(g, tk);
      if (row.classList.contains('kzwd-off') !== !!off) row.classList.toggle('kzwd-off', !!off);
      var w = (!g.kind || g.kind === 'daily') && !g.quit ? norm(g.wd) : null, tag = row.querySelector('.kz-gstep > i');
      if (tag && (!g.kind || g.kind === 'daily') && !g.quit) { var t = w ? label(w) : 'Daily'; if (tag.textContent !== t) tag.textContent = t; }
      // a daily habit row has no tag of its own: put the days next to its branch (My goals and other lists, not Today)
      var line = row.querySelector('.kz-gline'), chip = row.querySelector('.kzwd-tag');
      if (w && line && !onToday && !tag) {
        if (!chip) { chip = document.createElement('b'); chip.className = 'kzwd-tag'; line.insertBefore(chip, line.querySelector('.kz-gpill') || line.firstChild); }
        var t3 = label(w); if (chip.textContent !== t3) chip.textContent = t3;
      } else if (chip) chip.remove();
    });
    var hist = document.querySelector('.kz-g1hist > .kz-label');
    if (hist) {
      var id = (location.search.match(/[?&]id=([^&#]+)/) || [])[1], g2 = id ? goal(decodeURIComponent(id)) : null, w2 = g2 && norm(g2.wd), t2 = w2 ? label(w2) : 'Every day';
      if (hist.textContent !== t2) hist.textContent = t2;
    }
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(paint); }
  function boot() {
    paint();
    new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t.closest && (t.closest('.kzwd') || t.closest('.kzwd-tag'))) continue; soon(); return; } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-checked'] });
    ['kz:changed', 'kz:goals', 'kz:step'].forEach(function (n) { document.addEventListener(n, soon); });
    addEventListener('pageshow', soon); document.addEventListener('visibilitychange', soon);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
