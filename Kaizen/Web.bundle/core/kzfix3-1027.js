/* Oct 27 · James:
   1. Taps inside an opened goal (the growth preview, the tiles, the 14 days) no longer fall through and open the goal page;
      only the panel's own buttons and links act.
   2. My goals → Add a goal: after Quit, switching back to Long-term / Daily habit left "Quit something / Start quitting"
      (kzquit only set its texts one way). The title and button follow the chosen kind.
   3. Goal page: the tree (growth line + Change tree) sits at the top, right under the goal's name.
   4. Me: tap your picture to set a profile photo (photo library or camera). Resized on the phone to 256 px, kept only on the
      phone (kz_avatar), shown in the Me card. Tap again to change or remove it. */
(function () {
  var K = window.KZ; if (!K || K.__kzfix3) return; K.__kzfix3 = 1;
  // 1
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var gx = t.closest('.kz-gx'); if (!gx) return;
    if (t.closest('a, button, input, textarea, select, label, [role="button"]')) return;
    e.stopPropagation();
  }, true);
  // 2
  var TXT = { long: ['New long-term goal', 'Add goal'], daily: ['New daily habit', 'Add habit'], todo: ['New to-do', 'Add to-do'] };
  document.addEventListener('click', function (e) {
    var r = e.target.closest && e.target.closest('.kz-sheet49 [role="radio"][data-kind]'); if (!r) return;
    var sh = r.closest('.kz-sheet49'), k = r.getAttribute('data-kind');
    setTimeout(function () {
      if (sh.classList.contains('kzq-on') || !TXT[k]) return;
      var h = sh.querySelector('h2'), b = sh.querySelector('.kz-btn.gold'), edit = /edit/i.test(h ? h.textContent : '');
      if (h && !edit && /^(new |quit)/i.test(h.textContent.trim())) h.textContent = TXT[k][0];
      if (b && !edit && /^(\+\s*)?(add|start quitting)/i.test(b.textContent.trim()) && b.textContent.trim().replace(/^\+\s*/, '') !== TXT[k][1]) { var plus = b.querySelector('svg'); b.textContent = edit ? 'Save' : TXT[k][1]; if (plus && !edit) b.insertBefore(plus, b.firstChild); }
    }, 0);
  }, true);
  window.addEventListener('click', function (e) {   // back to Quit (kzquit stops the click below window): its own words again
    var q = e.target.closest && e.target.closest('.kz-sheet49 .kzq-kind'); if (!q) return;
    var sh = q.closest('.kz-sheet49');
    setTimeout(function () {
      if (!(sh.classList.contains('kzq-on') || q.getAttribute('aria-checked') === 'true')) return;
      var h = sh.querySelector('h2'), b = sh.querySelector('.kz-btn.gold'), edit = /edit/i.test(h ? h.textContent : '');
      if (edit) return;
      if (h && /^(new |quit)/i.test(h.textContent.trim())) h.textContent = 'Quit something';
      if (b && /^(\+\s*)?add/i.test(b.textContent.trim())) { var plus = b.querySelector('svg'); b.textContent = 'Start quitting'; if (plus) b.insertBefore(plus, b.firstChild); }
    }, 30);
  }, true);
  // 3
  function treeTop() {
    var g = document.querySelector('#kz-goalpage .kzg-goal'), nm = document.querySelector('#kz-goalpage .kz-g1name');
    if (g && nm && nm.parentNode === g.parentNode && nm.nextElementSibling !== g) nm.parentNode.insertBefore(g, nm.nextSibling);
  }
  // 4
  function avatar() { return K.get('avatar', '') || ''; }
  function paintAv() {
    [].forEach.call(document.querySelectorAll('.kz-set-av'), function (a) {
      var u = avatar(); a.classList.add('kzav');
      if (u) { a.style.setProperty('--kzav', 'url("' + u + '")'); a.classList.add('has'); } else { a.style.removeProperty('--kzav'); a.classList.remove('has'); }
      if (!a.querySelector('.kzav-cam')) { var c = document.createElement('i'); c.className = 'kzav-cam'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>'; a.appendChild(c); }
      a.setAttribute('role', 'button'); a.setAttribute('aria-label', u ? 'Change profile photo' : 'Add a profile photo');
    });
  }
  var inp = null;
  function pick() {
    if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none'; document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0]; if (!f) return;
        var img = new Image(), url = URL.createObjectURL(f);
        img.onload = function () {
          var S = 256, c = document.createElement('canvas'); c.width = c.height = S; var x = c.getContext('2d');
          var s = Math.min(img.naturalWidth, img.naturalHeight); x.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, S, S);
          try { K.set('avatar', c.toDataURL('image/jpeg', 0.85)); } catch (er) {}
          URL.revokeObjectURL(url); inp.value = ''; paintAv();
          try { document.dispatchEvent(new CustomEvent('kz:changed')); } catch (er) {}
        };
        img.onerror = function () { URL.revokeObjectURL(url); inp.value = ''; };
        img.src = url;
      });
    }
    inp.click();
  }
  function sheet() {
    var o = document.createElement('div'); o.className = 'kzsw-back kzav-sheet';
    o.innerHTML = '<div class="kzsw" role="dialog" aria-label="Profile photo"><i class="kzsw-grab"></i><h2 class="kzsw-t">Profile photo</h2><div class="kzsw-acts">' +
      '<button type="button" class="kzsw-btn gold" data-av="pick">Choose a photo</button>' + (avatar() ? '<button type="button" class="kzsw-btn ghost" data-av="rm">Remove photo</button>' : '') +
      '<button type="button" class="kzsw-btn ghost" data-av="x">Cancel</button></div></div>';
    document.body.appendChild(o); requestAnimationFrame(function () { o.classList.add('on'); });
    var close = function () { o.classList.remove('on'); setTimeout(function () { o.remove(); }, 300); };
    o.addEventListener('click', function (e) {
      var b = e.target.closest('[data-av]'); if (e.target === o) return close(); if (!b) return;
      var v = b.getAttribute('data-av'); close();
      if (v === 'pick') pick(); else if (v === 'rm') { K.set('avatar', ''); paintAv(); }
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.kz-set-av'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    if (avatar()) sheet(); else pick();
  }, true);
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; treeTop(); paintAv(); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kz-set-av')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  soon();
})();
