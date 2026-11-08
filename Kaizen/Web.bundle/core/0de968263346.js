
  // Tapping the tab you're already on does nothing: no reload, no reset, the animals stay where they are.
  (function () { if (window.__kzTabGuard) return; window.__kzTabGuard = 1;
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('.kz-tabbar a[aria-current="page"]'); var here = function (x) { var p = x.pathname.replace(/\/index\.html$/, '/'), c = location.pathname.replace(/\/index\.html$/, '/'); return p === c; }; /* Oct 21: only block when you're really on that page (My goals lights up Today but tapping it goes back to Today) */ if (a && here(a)) { e.preventDefault(); e.stopPropagation(); try { sessionStorage.removeItem('kz_scroll:' + location.pathname); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (er) {} } /* Oct 22: tap-to-top */ }, true);
  })();
