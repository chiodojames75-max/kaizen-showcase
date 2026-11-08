/* Oct 24 · Today, option A "Grove on top" (James). The Grove replaced the single tree, so Today shows the grove:
   - a "Your grove" card under the title: every goal's own tree, watered (checked off today) or thirsty; tap → Grove tab
   - "N of M trees watered" + bar
   - each goal row gets its tree as a thumbnail
   - the old single-tree card (sky picture, water, "grew today"), the "Your trees" strip and the visitors are hidden
   - Quote of the day / Today's question move to the bottom
   Nothing is deleted from the page: old parts are hidden only after this has built (html.kz-tA), so if anything here
   fails, Today stays exactly as it was. Header (every page): the streak replaces water, the visitor feed button goes.
   Styles: kztoday-1024e.css */
(function () {
  var K = window.KZ; if (!K || K.__kztA) return; K.__kztA = 1;
  var de = document.documentElement;
  de.classList.add('kz-hA'); // header: streak instead of water, no visitor feed (CSS)
  var page = document.getElementById('kz-today-s1'); if (!page) return;
  if (!K.grow || !K.groveImg) return; // needs the Grove
  var esc = K.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var hero, prog, sig = '', raf = 0;
  var tk = function () { return K.key(K.today()); };
  var src = function (w) { return K.groveImg(w.sp, w.key); };
  var h = function (w, box) { return Math.round(box * (0.34 + 0.66 * w.scale)); };

  function data() {
    var gs = (K.goals ? K.goals() : []) || [], k = tk();
    return gs.map(function (g) { var w = K.grow(g.id); return { g: g, w: w, done: !!(K.isDone && K.isDone(g.id, k)) }; });
  }
  function paint() {
    raf = 0;
    var L = data(), s = JSON.stringify(L.map(function (x) { return [x.g.id, x.g.name, x.w.day, x.w.key, x.w.sp, x.done]; }));
    if (s !== sig) {
      sig = s;
      if (!L.length) { hero.hidden = true; prog.hidden = true; }
      else {
        hero.hidden = false; prog.hidden = false;
        var many = L.length > 4;
        hero.innerHTML = '<span class="kzt-hh"><span>Your grove</span><b>Open ›</b></span><span class="kzt-ground" aria-hidden="true"></span>' +
          '<span class="kzt-row' + (many ? ' many' : '') + '">' + L.map(function (x) {
            return '<span class="kzt-tree' + (x.done ? ' on' : '') + '"><span class="kzt-art"><img src="' + src(x.w) + '" alt="" style="height:' + h(x.w, 104) + 'px" decoding="async"></span>' +
              '<b>' + esc(x.g.name) + '</b><em>Day ' + x.w.day + ' · ' + (x.done ? 'Watered' : 'Thirsty') + '</em></span>';
          }).join('') + '</span>';
        hero.setAttribute('aria-label', 'Your grove: ' + L.map(function (x) { return x.g.name + ', day ' + x.w.day + ', ' + (x.done ? 'watered today' : 'not checked off yet'); }).join('; ') + '. Open the Grove.');
        var n = L.filter(function (x) { return x.done; }).length, left = L.length - n;
        prog.innerHTML = '<span class="kzt-pl"><b>' + n + ' of ' + L.length + (L.length === 1 ? ' tree' : ' trees') + ' watered</b><em>' + (left ? left + ' left' : 'All done today') + '</em></span>' +
          '<span class="kzt-bar" role="progressbar" aria-label="Trees watered today" aria-valuemin="0" aria-valuemax="' + L.length + '" aria-valuenow="' + n + '"><i style="width:' + Math.round(100 * n / L.length) + '%"></i></span>';
        prog.classList.toggle('all', !left);
      }
    }
    thumbs(L);
  }
  // each goal row on Today gets its own tree
  function thumbs(L) {
    var by = {}; L.forEach(function (x) { by[x.g.id] = x; });
    Array.prototype.forEach.call(page.querySelectorAll('.kz-goal[data-goal]'), function (row) {
      var x = by[row.getAttribute('data-goal')]; if (!x) return;
      var u = src(x.w), t = row.querySelector(':scope > .kzt-th');
      if (t && t.dataset.u === u) return;
      if (!t) { t = document.createElement('span'); t.className = 'kzt-th'; t.setAttribute('aria-hidden', 'true'); var body = row.querySelector(':scope > .kz-gbody'); row.insertBefore(t, body || row.firstChild); }
      row.classList.add('kzt-has'); t.dataset.u = u; t.innerHTML = '<img src="' + u + '" alt="" style="height:' + h(x.w, 40) + 'px" decoding="async">';
    });
  }
  function soon() { if (!raf) raf = requestAnimationFrame(paint); }

  function setup() {
    var title = page.querySelector('.kzp-title'), groups = page.querySelector('.kz-tgroups'); if (!title || !groups) return;
    hero = document.createElement('a'); hero.className = 'kzt-hero'; hero.href = '/pages/profile';
    prog = document.createElement('div'); prog.className = 'kzt-prog';
    var daily = page.querySelector('.kz-dailyrow');
    title.parentNode.insertBefore(hero, title.nextSibling); title.parentNode.insertBefore(prog, hero.nextSibling);
    try { paint(); } catch (e) { hero.remove(); prog.remove(); return; }
    // Quote of the day / Today's question: to the bottom, under the lists
    if (daily) { var man = page.querySelector('.kz-manage'); if (man && man.parentNode) man.parentNode.insertBefore(daily, man); else groups.parentNode.insertBefore(daily, groups.nextSibling); daily.classList.add('kzt-dailylow'); }
    de.classList.add('kz-tA');
    new MutationObserver(soon).observe(groups, { childList: true, subtree: true });
    ['kz:step', 'kz:changed', 'kz:goals', 'kz:sync'].forEach(function (ev) { document.addEventListener(ev, soon); });
    window.addEventListener('pageshow', soon);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { sig = ''; soon(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
