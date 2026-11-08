/* Oct 30 · James (Me page): "take away the blank space below where you edit your name and make the edit your name a pop up
   not an expansion". Tapping your name on Me no longer unfolds a panel under the card (that panel also carried empty space
   from the account buttons, which are hidden). It opens a small pop-up instead: "Your name", the field (focused), Save and
   Cancel. Save uses the page's own name form (same storage, repaint and "Saved" toast). Tapping the photo still opens the
   photo options (kzfix3). Tap outside, Cancel or Escape closes it. Styles: kzmename-1030.css */
(function () {
  var K = window.KZ; if (!K || K.__kzmename) return; K.__kzmename = 1;
  var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
  var pop = null;
  function nameOf() { return K.userName ? K.userName() : String(K.get('username', '') || ''); }
  function close() {
    if (!pop) return; var p = pop; pop = null;
    var i = p.querySelector('input'); if (i) i.blur();
    p.classList.remove('on'); setTimeout(function () { p.remove(); }, 220);
  }
  function save() {
    if (!pop) return;
    var v = pop.querySelector('input').value.trim().slice(0, 24);
    var form = document.querySelector('#kz-me-panel form'), inp = document.getElementById('kz-me-name');
    if (form && inp) { inp.value = v; if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }
    else { K.set('username', v); if (K.toast) K.toast(v ? 'Saved' : 'Name removed'); }
    post({ type: 'haptic', n: 1 }); close();
  }
  function open() {
    if (pop) return;
    pop = document.createElement('div'); pop.className = 'kzmn';
    pop.innerHTML = '<form class="kzmn-card" role="dialog" aria-modal="true" aria-labelledby="kzmn-t" novalidate>' +
      '<label class="kzmn-t" id="kzmn-t" for="kzmn-in">Your name</label>' +
      '<input id="kzmn-in" maxlength="24" autocomplete="given-name" enterkeyhint="done" placeholder="First name">' +
      '<div class="kzmn-acts"><button type="button" class="kzmn-b" data-kzmn="x">Cancel</button><button type="submit" class="kzmn-b gold">Save</button></div></form>';
    document.body.appendChild(pop);
    var inp = pop.querySelector('input'); inp.value = nameOf();
    pop.addEventListener('click', function (e) { if (e.target === pop || e.target.closest('[data-kzmn="x"]')) { e.preventDefault(); close(); } });
    pop.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); save(); });
    requestAnimationFrame(function () { if (pop) pop.classList.add('on'); });
    try { inp.focus({ preventScroll: true }); var n = inp.value.length; inp.setSelectionRange(n, n); } catch (e) { inp.focus(); }
  }
  addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('.kz-set-av')) return;               // the photo keeps its own options
    if (!t.closest('#kz-me .kz-set-prof')) return;
    e.preventDefault(); e.stopImmediatePropagation(); open();
  }, true);
  addEventListener('keydown', function (e) { if (pop && e.key === 'Escape') close(); });
  addEventListener('pagehide', close);
})();
