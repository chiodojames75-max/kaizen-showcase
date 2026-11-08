
/* Oct 21 (Oct 22 perf): solid base under see-through boxes so their left half matches their right half.
   Only known box types are checked, and a box is only recomputed when its classes change. */
/* Oct 24 (speed): retired. The page background has been plain black since Oct 22 (no more two-tone), so a black base under
   see-through boxes changes nothing on screen - but measuring every box cost ~250 ms per screen with many goals and re-ran on
   every tap. Screenshots of all 10 screens were compared pixel for pixel before and after: identical. */
(function () { if (window.__kzSolid) return; window.__kzSolid = 1; return;
  var BASE = 'linear-gradient(#000, #000)';
  var LIST = '.kz-btn.navy, .kz-btn.ghost, .kz-j2-today, .kz-quiet, .kz-planbtn, .kz-qstrip, .kz-todo-empty, details.kz-fold, .kz-mestats > div, .kz-tiles3 > div, .kz-calday, .kz-card, .kz-card49, .kz-goal, .kz-j2-empty, .kz-j2-stats, .kz-seg, .kz-rankcard, .kz-shieldrow, input.kz-input, .kz-rowlist, select, .kz-xprules > ul, .kz-rescue, .kz-undo, .kz-plancard';
  var SKIP = '#kz-bd, #kz-splash, .kz-tabbar, #kz-header, .kz-fab, [role="dialog"], .kz-wcard, .kz-delta, .kz-sheet49, .kz-qmodal, .kz-planview';
  var alpha = function (c) { var v = String(c).match(/[\d.]+/g); return !v ? 0 : v.length === 4 ? +v[3] : 1; };
  var seeThrough = function (cs) { var a = alpha(cs.backgroundColor), img = cs.backgroundImage; return (a > 0 && a < 1) || (a === 0 && !!img && img !== 'none' && /gradient/.test(img)); };
  var clear = function (cs) { return alpha(cs.backgroundColor) === 0 && (!cs.backgroundImage || cs.backgroundImage === 'none'); };
  function fix(el) {
    var key = el.className + '|' + (el.parentElement ? el.parentElement.className : ''); if (el._kzsb === key) return; el._kzsb = key;
    el.style.removeProperty('background-image'); el.style.removeProperty('background-color'); delete el.dataset.kzsb;
    if (el.closest(SKIP)) return;
    var r = el.getBoundingClientRect(); if (r.width < 110 || r.height < 26) { el._kzsb = ''; return; }
    var cs = getComputedStyle(el); if (!seeThrough(cs)) return;
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) if (!clear(getComputedStyle(p))) return;
    var layers = []; if (cs.backgroundImage && cs.backgroundImage !== 'none') layers.push(cs.backgroundImage);
    if (alpha(cs.backgroundColor) > 0) layers.push('linear-gradient(' + cs.backgroundColor + ', ' + cs.backgroundColor + ')');
    layers.push(BASE);
    el.style.setProperty('background-image', layers.join(', '), 'important'); el.style.setProperty('background-color', 'transparent', 'important'); el.dataset.kzsb = '1';
  }
  var q = 0, run = function () { q = 0; var l = document.querySelectorAll(LIST); for (var i = 0; i < l.length; i++) fix(l[i]); };
  var soon = function () { if (!q) q = requestAnimationFrame(run); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
  window.addEventListener('load', soon);
  document.addEventListener('click', function () { setTimeout(soon, 60); }, true);
  ['kz:step', 'kz:goals', 'kz:changed', 'kz:plan'].forEach(function (ev) { document.addEventListener(ev, soon); });
  try { new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var n = ms[i].target; if (n.closest && n.closest('.kz-cr, .kz-treeview, #kz-bd, #kz-splash, .kz-ambient')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();
