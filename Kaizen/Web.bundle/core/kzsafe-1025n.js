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
