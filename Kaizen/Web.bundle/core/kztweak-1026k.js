/* Oct 26 k (from j): the Reminders X is placed where the sheet will land (its layout box, not its sliding image) and only
   fades in once the sheet has landed, so it never drifts up the screen.
   Oct 26 j · James's night list (behaviour; styles in kztweak-1026k.css).
   3 · Done today: completed rows always show their day dots (a folded long-term goal unfolds there) and can't be folded.
   5 · Reminders: an X pinned to the sheet's top-right closes it (it is a Done button underneath: [data-n-done]). */
(function () {
  if (window.__kzTweakK) return; window.__kzTweakK = 1;
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function done() {
    var s = document.querySelector('#kz-today-s1 .kz-donesec'); if (!s) return;
    s.querySelectorAll('.kz-grow.compact').forEach(function (r) { r.classList.remove('compact'); });
    s.querySelectorAll('[data-kz-expand]').forEach(function (t) {
      if (t.getAttribute('aria-expanded') !== 'true') t.setAttribute('aria-expanded', 'true');
      if (t.getAttribute('role') === 'button') t.removeAttribute('role');
      if (t.getAttribute('tabindex') !== '-1') t.setAttribute('tabindex', '-1');
    });
  }
  function rem() {
    var l = document.querySelector('.kzn-sheet'), w = l && l.querySelector('.kzsw'); if (!w) return;
    var b = l.querySelector(':scope > .kzn-x');
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'kzn-x'; b.setAttribute('data-n-done', ''); b.setAttribute('aria-label', 'Close'); b.innerHTML = X; l.appendChild(b); }
    // layout position (offsetTop/Left ignore the slide-up transform): where the sheet's corner ends up
    var t = Math.max(8, w.offsetTop + 14) + 'px', rt = Math.max(8, l.clientWidth - (w.offsetLeft + w.offsetWidth) + 14) + 'px';
    if (b.style.top !== t) b.style.top = t; if (b.style.right !== rt) b.style.right = rt;
  }
  window.addEventListener('resize', function () { soon(); });
  // a tap on a done row's body does nothing (its buttons and links still work); runs before the row's own fold handler
  function swallow(e) {
    var t = e.target; if (!t.closest) return;
    if (!t.closest('#kz-today-s1 .kz-donesec [data-kz-expand]') || t.closest('a, button, textarea, input')) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    e.stopPropagation();
  }
  document.addEventListener('click', swallow, true); document.addEventListener('keydown', swallow, true);
  var q = 0;
  function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { done(); } catch (e) {} try { rem(); } catch (e) {} }); }
  function boot() { soon(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
