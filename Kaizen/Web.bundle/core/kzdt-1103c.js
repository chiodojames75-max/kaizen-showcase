/* Nov 3 c · James: Done today tiles show the goal's real climb: its own mountain photo, framed the way Growth frames it, with
   the orange trail exactly as far as it has climbed (same path as Growth), no flag, camps, footprints or "YOU". Finished rows only. */
(function () {
  var K = window.KZ; if (!K || K.__kzdt1103c) return; K.__kzdt1103c = 1;
  var V = 96;   // drawn at 96 and shown at 48, so the trail keeps Growth's proportions
  function run() {
    q = 0; if (!K.mtnScene) return;
    [].forEach.call(document.querySelectorAll('#kz-today-s1 .kz-goal[data-goal] > .kzt-th'), function (th) { var on = th.parentNode.classList.contains('is-done'); if (th.classList.contains('kzdt') !== on) th.classList.toggle('kzdt', on); if (!on) th.__kzdt = ''; });
    [].forEach.call(document.querySelectorAll('#kz-today-s1 .kz-goal.is-done[data-goal] > .kzt-th'), function (th) {
      var gid = th.parentNode.getAttribute('data-goal'), o = null; try { o = K.mtn(gid); } catch (e) {}
      var key = o ? o.pk + '|' + (o.frac || 0).toFixed(4) : 'x'; if (th.__kzdt === key) return; th.__kzdt = key;
      var sc = null; try { sc = K.mtnScene(gid, V, V); } catch (e) {}
      var old = th.querySelector(':scope > .kzdt-w'); if (old) old.remove();
      if (!sc) return;
      var w = document.createElement('span'); w.className = 'kzdt-w';
      w.innerHTML = '<img src="' + sc.pic + '" alt="" decoding="async" style="object-position:50% ' + sc.py + '%">' + sc.svg.replace('<svg ', '<svg preserveAspectRatio="none" ');
      th.appendChild(w);
    });
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(run); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzt-th')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('kz:changed', soon); soon();
})();
