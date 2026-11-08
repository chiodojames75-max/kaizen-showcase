/* Oct 26 (c): classList.add / remove of a class that is already there / already gone is now a no-op.
   The browser still records those as changes, which wakes every script watching the page; one such add
   (Today's to-do list, kztodo-1026a) re-ran itself ~60 times a second. Same idea as kzpolish-1025ze. */
(function () {
  if (window.__kzNoopCls || !window.DOMTokenList) return; window.__kzNoopCls = 1;
  var P = DOMTokenList.prototype, add = P.add, rem = P.remove;
  P.add = function () { for (var i = 0; i < arguments.length; i++) if (!this.contains(arguments[i])) return add.apply(this, arguments); };
  P.remove = function () { for (var i = 0; i < arguments.length; i++) if (this.contains(arguments[i])) return rem.apply(this, arguments); };
})();
