/* Oct 27 b: K.dayLabel returns an object, not text, so the hero read "DAY " + days grown (Day 1) instead of the Kaizen 66
   run day (Day 2 on Progress/Today). Now uses the run's own day and days left. Replaces kzhero-1027.js.
   Oct 27 · Growth tab, design A "Hero tree" (James picked A; replaces the Path layout, kzpath-1027, on profile.html).
   One tree takes the stage: the Kaizen 66 goal if a run is on, otherwise the growing goal with the most days. Under it a gold
   bar to day 66 with the stage and days left. "Your grove" below: the other goals as a 3-across grid of small trees, then
   a "Plant a goal" tile. Data and links come from kzgarden-1025y's grid (hidden, still rebuilt on every change) + K.grow.
   Styles: kzhero-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kzhero) return; K.__kzhero = 1;   // same guard as kzhero-1027 (only one may load)
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var ART = (window.KZ_ART || '/art/') + 'trees/';
  function big(sp, key) { return /^(seed|sd\d)$/.test(key) ? ART + sp + '/' + key + '_v2.webp' : ART + sp + '/' + key + '_full.webp'; }
  function gidOf(a) { var m = /[?&]id=([^&#]+)/.exec(a.getAttribute('href') || ''); return m ? decodeURIComponent(m[1]) : null; }
  var last = '';
  function run() {
    var grid = document.querySelector('.kzgy-grid'); if (!grid) return;
    var de = document.documentElement; de.classList.add('kz-hero');
    var items = [].map.call(grid.querySelectorAll('.kzgy-big, .kzgy-tile:not(.kzgy-plant)'), function (a) {
      var id = gidOf(a), w = null; try { w = id && K.grow ? K.grow(id) : null; } catch (e) {}
      var img = a.querySelector('img');
      return { id: id, href: a.getAttribute('href'), k66: a.classList.contains('kzgy-big'), w: w, img: img ? img.getAttribute('src') : '', name: (a.querySelector('b') || {}).textContent || '' };
    }).filter(function (x) { return x.id && x.w; });
    var plant = grid.querySelector('.kzgy-plant'), plantHref = plant ? plant.getAttribute('href') : '/pages/my-goals#add';
    var hero = items.filter(function (x) { return x.k66; })[0] ||
      items.filter(function (x) { return !x.w.earned; }).sort(function (a, b) { return b.w.day - a.w.day; })[0] || items[0];
    var rest = items.filter(function (x) { return x !== hero; }), earned = items.filter(function (x) { return x.w.earned; }).length;
    var h = '';
    if (hero) {
      var w = hero.w, lab = null; try { lab = K.dayLabel ? K.dayLabel(hero.id) : null; } catch (e) {}
      var run = lab && lab.run, pend = run && lab.day === 0;
      var tag = run ? (pend ? 'KAIZEN 66 · STARTS SOON' : 'KAIZEN 66 · DAY ' + lab.day) : w.earned ? 'HABIT EARNED' : 'DAY ' + w.day;
      var left = run ? Math.max(0, lab.left) : Math.max(0, 66 - w.day), pct = Math.max(2, Math.round(Math.min(1, run ? lab.frac : w.day / 66) * 100));
      h += '<a class="kzh-hero' + (hero.k66 ? ' k66' : '') + '" href="' + esc(hero.href) + '" aria-label="' + esc(hero.name + ', ' + w.stage) + '">' +
        '<em class="kzh-tag">' + esc(tag) + '</em><b class="kzh-name">' + esc(hero.name) + '</b>' +
        '<span class="kzh-stage"><i class="kzh-ground" aria-hidden="true"></i><img src="' + esc(big(w.sp, w.key)) + '" alt="' + esc(w.species + ', ' + w.stage) + '" decoding="async" onerror="this.onerror=null;this.src=\'' + esc(hero.img) + '\'"></span>' +
        '<i class="kzh-bar" role="progressbar" aria-valuemin="0" aria-valuemax="66" aria-valuenow="' + Math.min(66, w.day) + '"><i style="width:' + pct + '%"></i></i>' +
        '<span class="kzh-meta"><span>' + esc(w.earned && w.day < 100 ? 'Full tree' : w.stage) + '</span><span>' + (left ? left + (left === 1 ? ' day' : ' days') + ' to full tree' : (w.next ? esc(w.next.name) + ' in ' + w.next.left + ' days' : 'Fully grown')) + '</span></span></a>';
    }
    h += '<div class="kzh-gh"><h2>Your grove</h2><span>' + items.length + (items.length === 1 ? ' tree' : ' trees') + (earned ? ' · ' + earned + (earned === 1 ? ' habit' : ' habits') + ' earned' : '') + '</span></div><div class="kzh-grid">';
    rest.forEach(function (x) {
      var st = x.w.earned ? '<i class="ok">Full tree</i>' : '<i>Day ' + x.w.day + '</i>';
      h += '<a class="kzh-t" href="' + esc(x.href) + '"><img src="' + esc(x.img) + '" alt="" decoding="async"><b>' + esc(x.name) + '</b>' + st + '</a>';
    });
    h += '<a class="kzh-t kzh-plant" href="' + esc(plantHref) + '"><span aria-hidden="true">+</span><b>Plant a goal</b></a></div>';
    if (h === last && document.querySelector('.kzh')) return; last = h;
    var box = document.querySelector('.kzh');
    if (!box) { box = document.createElement('div'); box.className = 'kzh'; grid.parentNode.insertBefore(box, grid); }
    box.innerHTML = h;
  }
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; try { run(); } catch (e) {} }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kzh')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', soon); else soon();
})();
