/* Oct 25 (ze): no-op writes stay no-ops.
   Many small scripts repaint by writing a value again (same class, same hidden flag, same text). The browser still
   counts that as a change, which wakes every script watching the page, which repaints and writes again: two such
   loops ran 60+ times a second (Break it down button, Grove's Kaizen 66 badge). Writing a value that's already
   there now does nothing, so a repaint that changes nothing can't set anything off.
   Covers className, hidden, setAttribute and textContent (only when the element holds just that text).
   innerHTML is left alone on purpose (scripts attach listeners to the new nodes right after). */
(function () {
  if (window.__kzNoop) return; window.__kzNoop = 1;
  function wrap(proto, name, same) {
    var d = Object.getOwnPropertyDescriptor(proto, name); if (!d || !d.set || !d.get) return;
    Object.defineProperty(proto, name, { configurable: true, enumerable: d.enumerable, get: d.get,
      set: function (v) { try { if (same(this, d.get.call(this), v)) return; } catch (e) {} d.set.call(this, v); } });
  }
  wrap(Element.prototype, 'className', function (el, cur, v) { return cur === String(v); });
  wrap(HTMLElement.prototype, 'hidden', function (el, cur, v) {
    // hidden="until-found" and friends are strings; only short-circuit plain true/false
    return (v === true || v === false) && cur === v && (v === false ? !el.hasAttribute('hidden') : el.getAttribute('hidden') === '');
  });
  wrap(Node.prototype, 'textContent', function (el, cur, v) {
    if (el.nodeType !== 1) return false;
    var s = v == null ? '' : String(v), k = el.childNodes;
    return (k.length === 1 && k[0].nodeType === 3 && k[0].data === s) || (k.length === 0 && s === '');
  });
  var setA = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    if (typeof n === 'string' && n !== 'src' && n !== 'href' && n !== 'value' && this.getAttribute(n) === String(v)) return;
    return setA.call(this, n, v);
  };
})();

/* ze: panels that snapped open now glide. Growth "Edit branches", the Me profile card, and the Progress card's
   Calendar / Balance switch changed size or swapped content in one frame, so everything below jumped.
   Their box now animates from its old height to its new one (iOS-style ease), and a content swap crossfades. */
(function () {
  if (window.__kzGlide) return; window.__kzGlide = 1;
  var TAPS = [
    ['.kz-bst2-edit', function (b) { return b.closest('section') || b.parentElement; }],
    ['.kz-set-prof', function (b) { return b.closest('.kz-set-card') || b.parentElement; }],
    ['.kzpc-link, .kzpc-balbtn', function (b) { return b.closest('section.kzpc') || b.parentElement; }]
  ];
  var R = window.__kzRawRaf || window.requestAnimationFrame.bind(window);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', function (e) {
    if (reduce || !e.target.closest) return;
    for (var i = 0; i < TAPS.length; i++) {
      var b = e.target.closest(TAPS[i][0]); if (!b) continue;
      var box = TAPS[i][1](b); if (!box || !box.animate) return;
      if (box.__kzAnim) { try { box.__kzAnim.cancel(); } catch (er) {} }
      var h0 = box.getBoundingClientRect().height, html0 = box.childElementCount + '|' + box.firstElementChild;
      R(function () {
        var h1 = box.getBoundingClientRect().height, ease = 'cubic-bezier(.22,.8,.24,1)';
        if (Math.abs(h1 - h0) > 2) {
          box.__kzAnim = box.animate([{ height: h0 + 'px', overflow: 'hidden' }, { height: h1 + 'px', overflow: 'hidden' }], { duration: 300, easing: ease });
          box.__kzAnim.onfinish = box.__kzAnim.oncancel = function () { box.__kzAnim = null; };
        } else {
          box.__kzAnim = box.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
        }
      });
      return;
    }
  }, true);
})();
