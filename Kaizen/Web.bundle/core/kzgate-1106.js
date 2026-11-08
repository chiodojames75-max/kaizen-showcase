/* Nov 6 (James: "get rid of the chance to ever see old visuals"): copy of kzgate-1028 that waits up to 3 s (was 1.5 s) for a slow page to finish before it shows. */
/* Oct 28 · Stage A of the clean-up (James: "the app just feels glitchy"). A page draws in steps while its add-ons start
   up (some land ~1 s in), and the app showed it as soon as it was quiet for 90 ms, so you saw those late steps happen.
   Now the page stays invisible until nothing on it has changed for 160 ms (at most 1.5 s after it loaded), then fades in
   over 120 ms. The app swaps a refreshed tab in, and slides a new screen in, only after that, so every screen you see
   is already finished. Loads right after kzflush/kzbridge. Styles: kzgate-1028.css. */
(function () {
  var de = document.documentElement; if (window.__kzGate) return; window.__kzGate = 1;
  var QUIET = 160, CAP = 3000, last = Date.now(), t0 = 0, done = false, mo = null;
  function open() {
    if (done) return; done = true; if (mo) mo.disconnect();
    de.classList.add('kz-dressed');
    try { document.dispatchEvent(new CustomEvent('kz:dressed')); } catch (e) {}
  }
  function check() {
    if (done) return; var now = Date.now();
    var old = document.getElementById('kz-gate') && !de.classList.contains('kz-shown');   // Today's older gate (skeleton) must be done too
    if ((now - last >= QUIET && !old) || now - t0 >= CAP) { open(); return; }
    setTimeout(check, Math.max(16, QUIET - (now - last)));
  }
  function start() {
    t0 = Date.now(); last = t0;
    try {
      mo = new (window.MutationObserver)(function (ms) {
        for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t === de && ms[i].attributeName === 'class') continue; if (t.closest && t.closest('.kz-leafp, .kzlf')) continue; last = Date.now(); return; }
      });
      mo.observe(de, { subtree: true, childList: true, attributes: true, characterData: true });
    } catch (e) { open(); return; }
    setTimeout(check, QUIET);
  }
  // never stay hidden: if anything goes wrong, show the page anyway
  setTimeout(open, 5000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
