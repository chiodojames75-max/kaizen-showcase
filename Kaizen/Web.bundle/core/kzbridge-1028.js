/* Oct 28 · the tab bar never blinks between two pop-ups. When one sheet closes and the next opens (notes → Note to self),
   the page said "show the tab bar" and "hide it" a moment apart, so it faded in and straight back out. A "show" now waits
   180 ms and is dropped if a "hide" arrives first. Loads right after kzflush, before anything posts. */
(function () {
  var w = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen; if (!w || w.__kzb) return;
  var orig = w.postMessage, timer = 0;
  try {
    w.postMessage = function (m) {
      if (m && m.type === 'pageScroll') {
        if (m.on === false) { if (timer) { clearTimeout(timer); timer = 0; } return orig.call(w, m); }
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () { timer = 0; orig.call(w, m); }, 180);
        return;
      }
      return orig.call(w, m);
    };
    w.__kzb = 1;
  } catch (e) {}
})();
