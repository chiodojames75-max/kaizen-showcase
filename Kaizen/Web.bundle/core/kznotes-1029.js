/* kznotes-1029.js · Oct 29: replaces kznotes-1026j.js (Edit note no longer opens with the keyboard up). */
/* Oct 26 j · Note to self (James): a short thought, typed or dictated, at any time, optionally tagged with a branch.
   Saved on the phone as kz_notes: [{ id, t: created ISO, u: edited ISO, txt, path: branch id or '' }], newest first.
   Open it from the + sheet ("Note to self") or Journal → Notes ("New note"). Journal → Notes lists them by month,
   filters by branch, and opens one to edit or delete. Styles: kznotes-1026j.css (self-contained: every page loads it). */
(function () {
  var K = window.KZ; if (!K || K.__kznotes) return; K.__kznotes = 1;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>';
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // ---------- data ----------
  function all() { var a = K.get('notes', []); return Array.isArray(a) ? a.filter(function (n) { return n && n.id && typeof n.txt === 'string'; }) : []; }
  function save(list) { K.set('notes', list); document.dispatchEvent(new CustomEvent('kz:notes')); }
  function paths() { return (K.PATHS || []).filter(function (p) { return p && p.id && p.name; }); }
  function pathOf(id) { return paths().filter(function (p) { return p.id === id; })[0] || null; }
  function newId() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  K.notes = all;
  K.addNote = function (txt, path) { txt = String(txt || '').trim(); if (!txt) return null; var now = new Date().toISOString(), n = { id: newId(), t: now, u: now, txt: txt.slice(0, 4000), path: path || '' }; var l = all(); l.unshift(n); save(l); try { K.track('kz_note_add'); } catch (e) {} return n; };
  K.updateNote = function (id, txt, path) { var l = all(), n = l.filter(function (x) { return x.id === id; })[0]; if (!n) return; n.txt = String(txt || '').trim().slice(0, 4000); n.path = path || ''; n.u = new Date().toISOString(); save(l); };
  K.deleteNote = function (id) { save(all().filter(function (x) { return x.id !== id; })); };

  // ---------- the sheet ----------
  var layer = null;
  function chips(sel) {
    return '<button type="button" class="kznt-chip' + (!sel ? ' on' : '') + '" data-nt-path="" aria-pressed="' + !sel + '">None</button>' +
      paths().map(function (p) { var on = p.id === sel; return '<button type="button" class="kznt-chip' + (on ? ' on' : '') + '" data-nt-path="' + esc(p.id) + '" aria-pressed="' + on + '" style="--c:' + esc(p.c2 || '#E2B93B') + '"><i aria-hidden="true"></i>' + esc(p.name) + '</button>'; }).join('');
  }
  K.openNote = function (id) {
    if (layer) return;
    var n = id ? all().filter(function (x) { return x.id === id; })[0] : null, path = n ? n.path : '';
    layer = document.createElement('div'); layer.className = 'kznt-back'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-labelledby', 'kznt-t');
    layer.innerHTML = '<div class="kznt-sheet">' +
      '<div class="kznt-bar"><button type="button" class="kznt-cancel" data-nt="cancel">Cancel</button><h2 id="kznt-t">' + (n ? 'Edit note' : 'Note to self') + '</h2><button type="button" class="kznt-save" data-nt="save" disabled>Save</button></div>' +
      '<div class="kznt-body"><textarea class="kznt-txt" rows="4" maxlength="4000" placeholder="What’s on your mind?" aria-label="Note">' + (n ? esc(n.txt) : '') + '</textarea>' +
      '<div class="kznt-mic"></div>' +
      '<p class="kznt-lab">Branch</p><div class="kznt-chips" role="group" aria-label="Branch">' + chips(path) + '</div>' +
      (n ? '<button type="button" class="kznt-del" data-nt="del">Delete note</button>' : '') + '</div></div>';
    document.body.appendChild(layer); document.body.classList.add('kz-noscroll');
    var ta = layer.querySelector('.kznt-txt'), sv = layer.querySelector('[data-nt="save"]');
    var check = function () { sv.disabled = !ta.value.trim(); };
    ta.addEventListener('input', check); check();
    try { if (K.autoGrow) K.autoGrow(ta); } catch (e) {}
    try { if (K.dictate) K.dictate(ta, layer.querySelector('.kznt-mic')); } catch (e) {}
    layer.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nt-path]');
      if (b) { path = b.getAttribute('data-nt-path'); layer.querySelectorAll('[data-nt-path]').forEach(function (c) { var on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); }); return; }
      var a = e.target.closest('[data-nt]'); var act = a && a.getAttribute('data-nt');
      if (e.target === layer || act === 'cancel') { close(); return; }
      if (act === 'save' && ta.value.trim()) { if (n) K.updateNote(n.id, ta.value, path); else K.addNote(ta.value, path); close(); try { K.toast(n ? 'Note saved' : 'Saved to Journal → Notes'); } catch (er) {} return; }
      if (act === 'del') { if (a.classList.contains('sure')) { K.deleteNote(n.id); close(); try { K.toast('Note deleted'); } catch (er) {} } else { a.classList.add('sure'); a.textContent = 'Tap again to delete'; } }
    });
    layer.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    requestAnimationFrame(function () { if (layer) layer.classList.add('on'); });
    // Oct 29 (James): editing a note opens it to read first; the keyboard comes up only when you tap the text. A new note opens ready to type.
    if (!n) { try { ta.focus({ preventScroll: true }); var v = ta.value; ta.setSelectionRange(v.length, v.length); } catch (e) {} }
  };
  function close() {
    if (!layer) return; var l = layer; layer = null; l.classList.remove('on');
    try { if (document.activeElement && l.contains(document.activeElement)) document.activeElement.blur(); } catch (e) {}
    setTimeout(function () { l.remove(); if (!document.querySelector('.kz-sheet49:not([hidden]), .kzsw-back, .kznt-back')) document.body.classList.remove('kz-noscroll'); }, 260);
  }

  // ---------- entry 1: the + sheet ----------
  function addEntry() {
    var sh = document.querySelector('.kz-addsheet'); if (!sh) return;
    var seg = sh.querySelector('.kz-kindseg'), cur = sh.querySelector('.kznt-entry'), t = sh.querySelector('[id^="kz-add-t"], h2');
    var editing = !!(t && /^\s*Edit/i.test(t.textContent)); // the same sheet edits a goal: no note entry there
    if (editing) { if (cur) cur.remove(); return; }
    if (!seg || cur) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kznt-entry'; b.innerHTML = PEN + '<span>Note to self</span><em>Just a thought? Write it down</em>';
    seg.parentNode.insertBefore(b, seg.nextSibling);
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.kznt-entry')) return;
    e.preventDefault(); e.stopPropagation();
    var sh = e.target.closest('.kz-addsheet'), x = sh && sh.querySelector('.kz-iconbtn[aria-label="Close"]');
    if (x) x.click(); K.openNote();
  }, true);

  // ---------- entry 2: Journal → Notes ----------
  var filter = '';
  function when(iso) { var d = new Date(iso); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function month(iso) { return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
  function pane() {
    var el = document.getElementById('kz-nlist'); if (!el) return;
    var l = all(), used = {}; l.forEach(function (n) { if (n.path && pathOf(n.path)) used[n.path] = 1; });
    if (filter && !used[filter]) filter = '';
    var shown = l.filter(function (n) { return !filter || n.path === filter; }), last = '';
    var fl = Object.keys(used).length ? '<div class="kznt-filter" role="group" aria-label="Filter notes by branch"><button type="button" class="kznt-chip' + (!filter ? ' on' : '') + '" data-nt-filter="" aria-pressed="' + !filter + '">All</button>' +
      paths().filter(function (p) { return used[p.id]; }).map(function (p) { var on = filter === p.id; return '<button type="button" class="kznt-chip' + (on ? ' on' : '') + '" data-nt-filter="' + esc(p.id) + '" aria-pressed="' + on + '" style="--c:' + esc(p.c2 || '#E2B93B') + '"><i aria-hidden="true"></i>' + esc(p.name) + '</button>'; }).join('') + '</div>' : '';
    var h = '<button type="button" class="kznt-new" data-nt-new>' + PEN + '<span>New note</span></button>' + fl;
    if (!l.length) h += '<div class="kznt-empty"><b>No notes yet</b><span>Write or dictate a thought any time. Tag it with a branch to find it later.</span></div>';
    shown.forEach(function (n) {
      var m = month(n.t), p = pathOf(n.path);
      if (m !== last) { h += '<h3 class="kznt-month">' + esc(m) + '</h3>'; last = m; }
      h += '<article class="kznt-card" data-nt-id="' + esc(n.id) + '"' + (p ? ' style="--c:' + esc(p.c2 || '#E2B93B') + '"' : '') + '><div class="kznt-meta">' + (p ? '<span class="kznt-tag"><i aria-hidden="true"></i>' + esc(p.name) + '</span>' : '') + '<time>' + esc(when(n.t)) + '</time></div>' +
        '<p class="kznt-p">' + esc(n.txt) + '</p><button type="button" class="kznt-edit" data-nt-edit="' + esc(n.id) + '" aria-label="Edit this note">' + PEN + '<span>Edit</span></button></article>';
    });
    if (el.__h !== h) { el.__h = h; el.innerHTML = h; }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-nt-new],[data-nt-edit],[data-nt-filter]'); if (!t || !t.closest('#kz-nlist')) return;
    if (t.hasAttribute('data-nt-new')) K.openNote();
    else if (t.hasAttribute('data-nt-edit')) K.openNote(t.getAttribute('data-nt-edit'));
    else { filter = t.getAttribute('data-nt-filter'); pane(); }
  });
  document.addEventListener('kz:notes', pane);
  document.addEventListener('kz:pillars', pane);

  var q = 0;
  function soon() { if (q) return; q = requestAnimationFrame(function () { q = 0; try { addEntry(); } catch (e) {} }); }
  function boot() {
    pane(); addEntry();
    if (document.getElementById('kz-nlist') && location.hash === '#notes') { var b = document.querySelector('[data-jtab="notes"]'); if (b) b.click(); }
    new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
