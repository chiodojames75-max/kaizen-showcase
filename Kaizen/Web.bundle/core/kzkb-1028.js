/* Oct 29 · James: "when I try to edit my notes or add a reminder it glitches and doesn't let me click anything or exit out",
   and "no matter what page you're on, the enter button on the keyboard closes the keyboard".
   1. The note editor (Journal → Notes, + → Note to self) is a full-height sheet whose text box grows with the note. When the
      keyboard came up, the keyboard helper (1dddad8ca7f2.js) slid the whole sheet up by however far the bottom of that box sat
      under the keyboard; with a long note that was most of the screen, so Cancel / Save went off the top. Now the editor is
      never slid: while the keyboard is up it is sized to the space above the keyboard and its body scrolls on its own; the
      text box stops growing at about a third of the screen and scrolls inside (styles: kzkb-1028.css).
   2. Return closes the keyboard in every text box, multi-line ones included. Boxes whose Return already did something (add a
      to-do, save a name) still do it first (that part is 1dddad8ca7f2.js); in a multi-line box Return no longer adds a line. */
(function () {
  if (window.__kzkb28) return; window.__kzkb28 = 1;
  var vv = window.visualViewport;
  function fit() {
    var back = document.querySelector('.kznt-back'); if (!back) return;
    var open = vv && (window.innerHeight - (vv.height + vv.offsetTop)) > 100;
    if (open) { back.classList.add('kz-kbfit'); back.style.top = Math.round(vv.offsetTop) + 'px'; back.style.height = Math.round(vv.height) + 'px'; back.style.bottom = 'auto'; }
    else if (back.classList.contains('kz-kbfit')) { back.classList.remove('kz-kbfit'); back.style.top = ''; back.style.height = ''; back.style.bottom = ''; }
    var sh = back.querySelector('.kznt-sheet'); if (sh && sh.style.translate) sh.style.translate = '';
    var a = document.activeElement, body = back.querySelector('.kznt-body');
    if (open && a && body && body.contains(a) && a.getBoundingClientRect) {   // keep the box you type in inside the sheet's own scroll
      var r = a.getBoundingClientRect(), b = body.getBoundingClientRect();
      if (r.top < b.top) body.scrollTop -= (b.top - r.top) + 8; else if (r.top > b.bottom - 60) body.scrollTop += r.top - (b.bottom - 60);
    }
  }
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  document.addEventListener('focusin', function () { setTimeout(fit, 0); setTimeout(fit, 400); }, true);
  document.addEventListener('focusout', function () { setTimeout(fit, 80); }, true);
  // Return closes the keyboard in multi-line boxes too (single-line ones are handled by 1dddad8ca7f2.js)
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.key !== 'Enter' || e.isComposing || e.shiftKey || !t) return;
    if (t.tagName === 'TEXTAREA' || t.isContentEditable) { e.preventDefault(); t.blur(); }
  }, true);
  document.addEventListener('focusin', function (e) { var t = e.target; if (t && t.tagName === 'TEXTAREA' && !t.hasAttribute('enterkeyhint')) t.setAttribute('enterkeyhint', 'done'); }, true);
})();
