/* Oct 28 · Growth tab, design #8 (James: "2 trees in a row then you go down, without one being bigger than the next").
   Replaces kzhero-1027b.js on profile.html. Every goal is one equal tile, two per row: its tree, its name, where it is
   (Kaizen 66 day, days grown, or Full tree). The Kaizen 66 goal comes first with a gold edge; "Plant a goal" is the last
   tile, the same size. Data and links still come from kzgarden-1025y's hidden grid + K.grow. Styles: kzgrid2-1028.css */
(function () {
  var K = window.KZ; if (!K || K.__kzhero) return; K.__kzhero = 1;   // only one Growth layout may load
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var ART = (window.KZ_ART || '/art/') + 'trees/';
  function big(sp, key) { return /^(seed|sd\d)$/.test(key) ? ART + sp + '/' + key + '_v2.webp' : ART + sp + '/' + key + '_full.webp'; }
  function gidOf(a) { var m = /[?&]id=([^&#]+)/.exec(a.getAttribute('href') || ''); return m ? decodeURIComponent(m[1]) : null; }
  var last = '';
  function run() {
    var grid = document.querySelector('.kzgy-grid'); if (!grid) return;
    document.documentElement.classList.add('kz-hero', 'kz-grid2');
    var items = [].map.call(grid.querySelectorAll('.kzgy-big, .kzgy-tile:not(.kzgy-plant)'), function (a) {
      var id = gidOf(a), w = null; try { w = id && K.grow ? K.grow(id) : null; } catch (e) {}
      var img = a.querySelector('img');
      return { id: id, href: a.getAttribute('href'), k66: a.classList.contains('kzgy-big'), w: w, img: img ? img.getAttribute('src') : '', name: (a.querySelector('b') || {}).textContent || '' };
    }).filter(function (x) { return x.id && x.w; });
    items.sort(function (a, b) { return (b.k66 ? 1 : 0) - (a.k66 ? 1 : 0); });   // Kaizen 66 first, the rest as the grove orders them
    var plant = grid.querySelector('.kzgy-plant'), plantHref = plant ? plant.getAttribute('href') : '/pages/my-goals#add';
    var earned = items.filter(function (x) { return x.w.earned; }).length;
    var h = '<div class="kzg2-gh"><h2>Your trees</h2>' + (earned ? '<span>' + earned + (earned === 1 ? ' habit' : ' habits') + ' earned</span>' : '') + '</div><div class="kzg2-grid">';   // the header already counts trees
    items.forEach(function (x) {
      var w = x.w, lab = null; try { lab = K.dayLabel ? K.dayLabel(x.id) : null; } catch (e) {}
      var run66 = lab && lab.run, st;
      if (run66) st = '<i class="k66">' + (lab.day === 0 ? 'Kaizen 66 · starts soon' : 'Kaizen 66 · day ' + lab.day) + '</i>';
      else if (w.earned) st = '<i class="ok">Full tree</i>';
      else st = '<i>' + (w.day ? w.day + (w.day === 1 ? ' day' : ' days') + ' · ' + esc(w.stage) : 'Just planted') + '</i>';
      h += '<a class="kzg2-t' + (x.k66 ? ' k66' : '') + '" href="' + esc(x.href) + '" aria-label="' + esc(x.name + ', ' + w.stage) + '">' +
        '<span class="kzg2-stage"><img src="' + esc(big(w.sp, w.key)) + '" alt="" decoding="async" onerror="this.onerror=null;this.src=\'' + esc(x.img) + '\'"></span>' +
        '<b>' + esc(x.name) + '</b>' + st + '</a>';
    });
    h += '<a class="kzg2-t kzg2-plant" href="' + esc(plantHref) + '"><span class="kzg2-stage"><span class="kzg2-plus" aria-hidden="true">+</span></span><b>Plant a goal</b><i>A new tree</i></a></div>';
    if (h === last && document.querySelector('.kzh')) return; last = h;
    var box = document.querySelector('.kzh');
    if (!box) { box = document.createElement('div'); box.className = 'kzh'; grid.parentNode.insertBefore(box, grid); }
    box.innerHTML = h;
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { run(); } catch (e) {} }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzh')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
