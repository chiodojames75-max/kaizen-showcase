/* ==== kzpolish-1025ze.js ==== */
;try {
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

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzpolish-1026c.js ==== */
;try {
/* Oct 26 (c): classList.add / remove of a class that is already there / already gone is now a no-op.
   The browser still records those as changes, which wakes every script watching the page; one such add
   (Today's to-do list, kztodo-1026a) re-ran itself ~60 times a second. Same idea as kzpolish-1025ze. */
(function () {
  if (window.__kzNoopCls || !window.DOMTokenList) return; window.__kzNoopCls = 1;
  var P = DOMTokenList.prototype, add = P.add, rem = P.remove;
  P.add = function () { for (var i = 0; i < arguments.length; i++) if (!this.contains(arguments[i])) return add.apply(this, arguments); };
  P.remove = function () { for (var i = 0; i < arguments.length; i++) if (this.contains(arguments[i])) return rem.apply(this, arguments); };
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
/* ==== kzsafe-1025n.js ==== */
;try {
/* Oct 25 n · HTML safety net (security pass). Loaded first on every page.
   The red-team pass found user text (goal names, cues, branch names) reaching innerHTML / insertAdjacentHTML unescaped in
   older files (Today's goal groups, Goals, a goal's page, the balance wheel). Those files can't be edited in place, so every
   HTML string written into the page passes through here: if it contains anything that could run code (on…= handlers,
   javascript: links, <script>, <iframe>, <object>, <embed>, <base>, <meta>, <link>, srcdoc, formaction), it is parsed in an
   inert <template>, the dangerous parts are removed, and only then written. Ordinary renders skip the parse (a regex check),
   so it costs nothing on normal screens. The app's own templates use no inline handlers, so nothing legitimate is removed. */
(function () {
  if (window.__kzsafe) return; window.__kzsafe = 1;
  var RISK = /\bon[a-z]+\s*=|javascript\s*:|vbscript\s*:|<\s*\/?\s*(script|iframe|object|embed|base|meta|link|frame|frameset|portal)\b|srcdoc|formaction|data\s*:\s*text\/html/i;
  var BAD_TAGS = { SCRIPT: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, BASE: 1, META: 1, LINK: 1, FRAME: 1, FRAMESET: 1, PORTAL: 1 };
  var URL_ATTR = /^(href|src|action|formaction|xlink:href|data|poster|background|lowsrc|ping)$/i;
  var EP = Element.prototype, desc = Object.getOwnPropertyDescriptor(EP, 'innerHTML'), odesc = Object.getOwnPropertyDescriptor(EP, 'outerHTML');
  if (!desc || !desc.set) return;
  var setInner = desc.set, getInner = desc.get;
  var inert = document.implementation.createHTMLDocument('');
  function scrub(root) {
    var walk = [root], n;
    while (walk.length) {
      n = walk.pop();
      var kids = n.childNodes ? Array.prototype.slice.call(n.childNodes) : [];
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i]; if (c.nodeType !== 1) continue;
        if (BAD_TAGS[c.tagName.toUpperCase()]) { c.parentNode.removeChild(c); continue; }
        var at = Array.prototype.slice.call(c.attributes);
        for (var j = 0; j < at.length; j++) {
          var a = at[j], nm = a.name.toLowerCase(), v = String(a.value).replace(/[\u0000- ]/g, '').toLowerCase();
          if (nm.indexOf('on') === 0 || nm === 'srcdoc' || nm === 'formaction' || (URL_ATTR.test(nm) && /^(javascript|vbscript|data:text\/html)/.test(v))) c.removeAttribute(a.name);
        }
        if (c.tagName === 'TEMPLATE' && c.content) walk.push(c.content);
        walk.push(c);
      }
    }
  }
  function clean(html) {
    if (typeof html !== 'string' || !RISK.test(html)) return html;
    var t = inert.createElement('template'); setInner.call(t, html); scrub(t.content);
    try { if (window.__kzsafeLog) window.__kzsafeLog.push(html.slice(0, 120)); } catch (e) {}
    return getInner.call(t);
  }
  window.__kzsafeClean = clean;
  Object.defineProperty(EP, 'innerHTML', { configurable: true, enumerable: desc.enumerable, get: getInner, set: function (v) { return setInner.call(this, this.tagName === 'SCRIPT' || this.tagName === 'STYLE' ? v : clean(v)); } });
  if (odesc && odesc.set) Object.defineProperty(EP, 'outerHTML', { configurable: true, enumerable: odesc.enumerable, get: odesc.get, set: function (v) { return odesc.set.call(this, clean(v)); } });
  var iah = EP.insertAdjacentHTML; if (iah) EP.insertAdjacentHTML = function (pos, html) { return iah.call(this, pos, clean(html)); };
  try { var ccf = Range.prototype.createContextualFragment; if (ccf) Range.prototype.createContextualFragment = function (html) { return ccf.call(this, clean(html)); }; } catch (e) {}
  try { var dw = document.write, dwl = document.writeln; document.write = function () { return dw.apply(document, Array.prototype.map.call(arguments, clean)); }; document.writeln = function () { return dwl.apply(document, Array.prototype.map.call(arguments, clean)); }; } catch (e) {}
})();

} catch (kzbErr) { setTimeout(function () { throw kzbErr; }, 0); }
