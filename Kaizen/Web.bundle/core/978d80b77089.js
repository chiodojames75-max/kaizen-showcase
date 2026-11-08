
/* Oct 21: mark the page while a text field has focus (hides the tab bar so iOS can't carry it up with the keyboard) */
(function () { if (window.__kzTyping) return; window.__kzTyping = 1;
  var isText = function (el) { if (!el) return false; if (el.isContentEditable || el.tagName === 'TEXTAREA') return true; if (el.tagName !== 'INPUT') return false; var t = (el.type || 'text').toLowerCase(); return ['text', 'search', 'email', 'url', 'tel', 'number', 'password'].indexOf(t) >= 0; };
  var set = function () { document.documentElement.classList.toggle('kz-typing', isText(document.activeElement)); };
  document.addEventListener('focusin', set, true); document.addEventListener('focusout', function () { setTimeout(set, 60); }, true);
  // Goal note boxes get their Dictate button up front, so nothing appears (and shifts Save note) the moment you start typing
  var q = 0, prep = function () { q = 0; var K = window.KZ; if (!K || !K.dictate) return; document.querySelectorAll('.kz-gnbox').forEach(function (b) { if (b._mic) return; b._mic = 1; b._grow = 1; try { K.dictate(b); } catch (e) {} }); };
  var later = function () { if (!q) q = requestAnimationFrame(prep); };
  document.addEventListener('DOMContentLoaded', later); later();
  try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();
