
/* Oct 22: robustness
   1) a new day while the app is open (or when you come back to it) refreshes the page, so dates, water and goals are never stale
   2) one automatic backup copy of your data per day, keeping the newest 3 (used to repair a damaged save)
   3) a clear notice if your data can't be saved */
(function () { if (window.__kzRobust) return; window.__kzRobust = 1;
  var K = window.KZ; if (!K || !K.key) return;
  var day0 = K.key(K.today());
  var busy = function () { var a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return true; return !!document.querySelector('[role="dialog"]:not([hidden]), .kz-noscroll, #kz-splash'); };
  var check = function () { if (K.key(K.today()) === day0) return; if (busy()) return; day0 = K.key(K.today()); try { location.reload(); } catch (e) {} };
  setInterval(check, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(check, 50); });
  setTimeout(function () {
    try { var t = 'kzbak_' + K.key(K.today()); if (localStorage.getItem(t) !== null) return; var o = {};
      Object.keys(localStorage).forEach(function (x) { if (/^(kz_|kzreset)/.test(x)) o[x] = localStorage.getItem(x); });
      var s = JSON.stringify(o); if (s.length > 1500000) return; localStorage.setItem(t, s);
      Object.keys(localStorage).filter(function (x) { return x.indexOf('kzbak_') === 0; }).sort().reverse().slice(3).forEach(function (x) { localStorage.removeItem(x); });
    } catch (e) {}
  }, 4000);
  document.addEventListener('kz:savefail', function () {
    if (document.querySelector('.kz-savefail')) return; var n = document.createElement('div'); n.className = 'kz-savefail'; n.setAttribute('role', 'alert');
    n.innerHTML = '<b>Kaizen couldn’t save your last change.</b>Its storage on this iPhone is full. Go to Me → Export my data to keep a copy, then delete old journal entries.';
    document.body.appendChild(n); n.addEventListener('click', function () { n.remove(); }); setTimeout(function () { if (n.isConnected) n.remove(); }, 12000);
  });
})();
