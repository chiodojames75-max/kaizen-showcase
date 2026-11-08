
/* Oct 21: fold buttons on Long-term goals, To-dos and Done today (remembered). Not on Tomorrow. */
(function () { if (window.__kzFold) return; window.__kzFold = 1;
  var KEY = 'kz_secfold', SECS = { 'kz-gsec': 'goals', 'kz-todosec': 'todos', 'kz-donesec': 'done' };
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  var save = function (o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
  var keyOf = function (sec) { if (sec.classList.contains('kz-tmr')) return 'tmr'; for (var c in SECS) if (sec.classList.contains(c)) return SECS[c]; return null; };
  var HEAD = ':scope > .kz-tsec-h, :scope > .kz-collhead';
  var paint = function (sec, shut) { sec.classList.toggle('kz-secshut', shut); var b = sec.querySelector(':scope > .kz-tsec-h > .kz-secfold, :scope > .kz-collhead > .kz-secfold'); if (b) { b.setAttribute('aria-expanded', String(!shut)); b.setAttribute('aria-label', (shut ? 'Show ' : 'Hide ') + ((sec.querySelector('h2, .kz-label49') || {}).textContent || 'section')); } };
  var q = 0, ensure = function () { q = 0; var st = load();
    document.querySelectorAll('section.kz-tsec, .kz-tmr').forEach(function (sec) { var k = keyOf(sec), h = sec.querySelector(HEAD); if (!k || !h) return;
      if (!h.querySelector(':scope > .kz-secfold')) { var b = document.createElement('button'); b.type = 'button'; b.className = 'kz-secfold'; b.dataset.sec = k; b.innerHTML = CHEV; h.appendChild(b); }
      paint(sec, !!st[k]); });
  };
  var later = function () { if (!q) q = requestAnimationFrame(ensure); };
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.kz-secfold'); if (!b) return; e.preventDefault(); e.stopPropagation();
    var st = load(), k = b.dataset.sec; st[k] = !st[k]; save(st); paint(b.closest('section.kz-tsec, .kz-tmr'), !!st[k]); try { navigator.vibrate(4); } catch (er) {} }, true);
  document.addEventListener('DOMContentLoaded', later); later();
  try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();
