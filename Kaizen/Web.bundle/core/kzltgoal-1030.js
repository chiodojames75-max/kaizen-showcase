/* Oct 30 · James: "make it so you don't have to check off daily for the long-term goals. You just have to check off the
   dates … four different things on my roadmap. You just have to check those off."
   A long-term goal with a due date and a roadmap (kzbd isMs) is tracked only by its milestones. On its goal page the
   daily-habit parts go away: "N days grown / Habit earned / Next: Mature tree", the habit ladder, the daily step, the
   days-done/streak numbers and the "Every day" done/missed grid (which showed red for every day you didn't tick it).
   What's left: the tree, Change tree, the roadmap card with its milestones, and the goal journal.
   (The roadmap's "Today's progress" row, kzroadday-1027.js, is no longer loaded on Today / My goals.) Nothing is stored. */
(function () {
  var K = window.KZ; if (!K || K.__kzltgoal) return; K.__kzltgoal = 1;
  var de = document.documentElement;
  var id = (location.search.match(/[?&]id=([^&#]+)/) || [])[1]; id = id ? decodeURIComponent(id) : '';
  function goal() {
    var all = (K.get('goals', []) || []).concat(K.archived ? (K.archived() || []) : []);
    return all.filter(function (g) { return g && g.id === id; })[0];
  }
  function run() {
    var g = goal(), ms = !!(g && K.bd && K.bd.isMs && K.bd.isMs(g));
    if (de.classList.contains('kzlt-ms') !== ms) de.classList.toggle('kzlt-ms', ms);
  }
  run();
  ['kz:changed', 'kz:goals', 'kz:step'].forEach(function (n) { document.addEventListener(n, run); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  addEventListener('pageshow', run);
})();
