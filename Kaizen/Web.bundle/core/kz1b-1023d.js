/* Oct 23 Phase 1B page helpers */
(function () {
  var K = window.KZ; if (!K) return;
  // Goal page: lay the day dots out one week per row (Sun-Sat), so each is a full 44 pt target
  var W = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  function weeks() {
    document.querySelectorAll('.kz-g1dots:not(.kz-1b-weeks)').forEach(function (box) {
      var dots = box.querySelectorAll('.kz-g1dot[data-jump]'); if (!dots.length) return;
      var first = dots[0].getAttribute('data-jump'), last = dots[dots.length - 1].getAttribute('data-jump');
      if (first > last) { var arr = Array.prototype.slice.call(dots).reverse(); arr.forEach(function (d) { box.appendChild(d); }); dots = box.querySelectorAll('.kz-g1dot[data-jump]'); first = dots[0].getAttribute('data-jump'); }
      var lead = new Date(first + 'T12:00:00').getDay(), pre = W.map(function (w) { return '<span class="kz-1b-wd" aria-hidden="true">' + w + '</span>'; }).join('');
      for (var i = 0; i < lead; i++) pre += '<span class="kz-1b-pad" aria-hidden="true"></span>';
      box.insertAdjacentHTML('afterbegin', pre); box.classList.add('kz-1b-weeks');
    });
  }
  new MutationObserver(function () { weeks(); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', weeks);
  // Progress opened from "See past days": bring the calendar up once it's drawn
  if (/#kz-cal$/.test(location.hash)) addEventListener('load', function () { setTimeout(function () { var c = document.getElementById('kz-cal'); if (c) c.scrollIntoView({ block: 'start' }); }, 120); });
})();
