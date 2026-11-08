/* Oct 27 z · see kzsurf-1027z.css. Groups Plan's to-do rows (a group starts at a row with a rounded top corner and ends at a
   row with a rounded bottom corner) and tells each row the group's height and its offset, so one gradient spans the group. */
(function () {
  if (window.__kzsurf) return; window.__kzsurf = 1;   /* Oct 28: replaces kzsurf-1027z.js — Plan's to-dos (not only its plan tasks) join the card groups, so a plan task followed by a to-do no longer gets a full-width edge line between them */
  var raf = 0;
  function run() {
    raf = 0;
    var rows = [].filter.call(document.querySelectorAll('li.kz-todo.plan, [data-p="day-list"] li.kz-todo'), function (x) { return x.offsetParent !== null; }), grp = [];
    // Plan puts each to-do into its part of the day with CSS order, so group in the order they appear on screen, not DOM order
    var tops = new Map(); rows.forEach(function (x) { tops.set(x, x.getBoundingClientRect().top); }); rows.sort(function (a, b) { return tops.get(a) - tops.get(b); });
    var flush = function () {
      if (!grp.length) return;
      var top = grp[0].getBoundingClientRect().top, bot = grp[grp.length - 1].getBoundingClientRect().bottom, h = Math.max(1, Math.round(bot - top));
      grp.forEach(function (r, i) { if (!r.classList.contains('kzs-row')) r.classList.add('kzs-row'); r.__kza = 1; if (r.classList.contains('kzs-auto')) r.classList.remove('kzs-auto');   /* a row of a card is never a card of its own (kzauto) */
        r.style.setProperty('--kzs-h', h); r.style.setProperty('--kzs-y', Math.round(r.getBoundingClientRect().top - top));
        r.classList.toggle('kzs-first', i === 0); r.classList.toggle('kzs-last', i === grp.length - 1);
      });
      grp = [];
    };
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], cs = getComputedStyle(r);
      if (r.offsetParent === null) continue;
      var tl = parseFloat(cs.borderTopLeftRadius) > 0, bl = parseFloat(cs.borderBottomLeftRadius) > 0;
      if (tl) flush();
      grp.push(r);
      if (bl) flush();
    }
    flush();
  }
  function soon() { if (!raf) raf = requestAnimationFrame(run); }
  new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', soon); document.addEventListener('DOMContentLoaded', soon); soon();
})();
