/* Oct 28 · Move up / Move down in a goal's ••• menu skipped nothing it couldn't see. With the Kaizen 66 card on, the
   Kaizen 66 goal's own row is hidden from Daily habits (as are Quit habits), so the habit just below it "moved up"
   by swapping places with that hidden row: nothing changed on screen (James: "the move up and move down buttons don't
   work"). Moves now count only the rows you can see; hidden ones keep their places. */
(function () {
  var K = window.KZ; if (!K || !K.moveGoal || K.moveGoal.__kzmv) return;
  var mg = K.moveGoal;
  function shown(id) { var r = document.querySelector('.kz-grow[data-goal="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); return !r || r.offsetParent !== null; }
  var w = function (id, dir, ids) { if (ids && ids.filter) ids = ids.filter(function (x) { return x === id || shown(x); }); return mg.call(this, id, dir, ids); };
  w.__kzmv = 1; K.moveGoal = w;
})();
