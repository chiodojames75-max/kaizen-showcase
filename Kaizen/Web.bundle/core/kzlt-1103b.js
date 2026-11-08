/* Nov 3 b · + "Worked on it today" counts (g.wk). The day card loses its Day plan / Journal / notes (Read) rows (James).
   Nov 3 · James: "if you worked on it today for long term goals it checks off in the daily brief". A long-term goal counts as
   done on a day when you checked it, finished one of its steps (milestones) that day, or wrote its goal note that day.
   Wraps K.dayInfo (used by Progress / the day card), so it must load before the page draws its days. */
(function () {
  var K = window.KZ; if (!K || !K.dayInfo || K.dayInfo.__kzlt) return;   // 1103b replaces 1103
  var orig = K.dayInfo;
  function isLong(g) { try { if (K.bd && K.bd.isMs && K.bd.isMs(g)) return true; } catch (e) {} return g.kind === 'long'; }
  function worked(g, k) {
    if ((g.wk || []).indexOf(k) > -1) return true;   // "Worked on it today" (kzltwork-1030) / "5 min" (kzfive)
    if ((g.ms || []).some(function (m) { return m && m.d === k; })) return true;
    try { var n = K.gnotes ? (K.gnotes(g.id) || {})[k] : ''; if (n && String(n).trim()) return true; } catch (e) {}
    return false;
  }
  var w = function (k, first) {
    var r = orig.apply(this, arguments); if (!r || r.status === 'future') return r;
    var ids = {}; r.hit.forEach(function (g) { ids[g.id] = 1; });
    var all = []; try { all = K._allRO ? K._allRO() : K.allGoals(); } catch (e) {}
    var add = all.filter(function (g) { return !ids[g.id] && isLong(g) && (!g.created || g.created.slice(0, 10) <= k) && worked(g, k); });
    if (add.length) {
      r.hit = r.hit.concat(add); r.rate = Math.min(1, r.hit.length / Math.max(r.due, r.hit.length));
      if (r.hit.length && r.rate >= 1 && r.status !== 'future') r.status = 'full';
    }
    return r;
  };
  w.__kzlt = 1; K.dayInfo = w;
  // the day card (kzday-1102): only the goals and the to-dos stay
  function trim() {
    [].forEach.call(document.querySelectorAll('details.kzdy-more'), function (d) {
      var b = d.querySelector('summary b'), keep = b && /^to-dos$/i.test(b.textContent.trim());
      if (d.classList.contains('kzdy-gone') === keep) d.classList.toggle('kzdy-gone', !keep);
    });
  }
  var q = 0; function soon() { if (!q) { q = 1; requestAnimationFrame(function () { q = 0; trim(); }); } }
  function start() { trim(); new MutationObserver(function (m) { for (var i = 0; i < m.length; i++) if (m[i].type === 'childList') { soon(); return; } }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  var st = document.createElement('style'); st.textContent = 'html body details.kzdy-more.kzdy-gone{display:none!important}'; (document.head || document.documentElement).appendChild(st);
})();
