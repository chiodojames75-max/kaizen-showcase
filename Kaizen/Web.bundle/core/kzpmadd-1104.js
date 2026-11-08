/* Nov 4 (James: "add as many tasks as you want" on Plan tomorrow): there was never a cap, but it felt like one.
   "Add a task" now takes every tap: the app-wide double-tap guard (kzlock, 600 ms) matched it by its data-t, so a
   quick second tap was dropped. Each tap gets its own key for that guard; Lock in my plan keeps the guard.
   The 2 / 4 / 6 / 8 / 10+ row (the old XP multiplier) is hidden in kzpmadd-1104.css. */
(function () {
  if (window.__kzpmadd) return; window.__kzpmadd = 1;
  var n = 0, held = null;
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-t="pm-add"]'); if (!b) return;
    held = b; b.setAttribute('data-t', 'pm-add-' + (++n));   // the guard keys on this, so every tap looks new to it
  }, true);
  document.addEventListener('click', function () { if (held) { held.setAttribute('data-t', 'pm-add'); held = null; } }, true);   // runs after the guard
})();
