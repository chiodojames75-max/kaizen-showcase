/* Oct 27 · James: "in Reminders you can also get notifications for your notes to self; set how often in Reminders, and in
   the Notes tab set if you want them or not. And clean up the notifications so they're a list of what you haven't done."
   - Settings kz_noterem { on, freq: 'daily' | '2d' | 'weekly', at: 'HH:MM' }. Notes tab (Journal → Notes): a "Remind me of
     my notes" switch. Me → Reminders: a "Notes to self" section (Off · Daily · Every 2 days · Weekly, and the time).
   - Note reminders go out with the rest (bridge 'notifySync', ids "kzn-note-…"): title "Note to self", body = one of your
     notes, newest first, taking turns. At most 7 are scheduled ahead; the task reminders keep the rest of the 50.
   - Task reminders: the body is rewritten as a list, one thing per line ("• Stretch 10 minutes"), Kaizen 66 first, up to 6
     then "+N more", built from K.notifyLeft for that reminder's day (kznotify-1025r), so it lists exactly what's left.
   kznotify-1025r is untouched: its message to the phone is adjusted on the way out. Styles: kznoterem-1027.css */
(function () {
  var K = window.KZ; if (!K || K.__kznoterem) return; K.__kznoterem = 1;
  var esc = K.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var DEF = { on: 0, freq: 'daily', at: '12:00' }, STEP = { daily: 1, '2d': 2, weekly: 7 };
  function cfg() { var c = K.get('noterem', null) || {}; for (var k in DEF) if (!(k in c)) c[k] = DEF[k]; return c; }
  function save(c) { K.set('noterem', c); resync(); }
  function resync() {   // kznotify skips a send when its own list hasn't changed, so the full message is sent from here
    clearTimeout(rt); rt = setTimeout(function () {
      var s = K.notifySettings ? K.notifySettings() : { on: 0 }, items = []; try { items = K.notifyPlan ? K.notifyPlan() : []; } catch (e) {}
      var m = rewrite({ type: 'notifySync', on: !!s.on, ask: false, items: items });
      try { (raw || window.webkit.messageHandlers.kaizen.postMessage.bind(window.webkit.messageHandlers.kaizen))(m); } catch (e) {}
    }, 300);
  }
  var rt = 0;
  function pad(n) { return String(n).padStart(2, '0'); }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmt(t) { var p = String(t).split(':'), h = +p[0], m = +p[1] || 0; return (h % 12 || 12) + (m ? ':' + pad(m) : '') + (h >= 12 ? ' PM' : ' AM'); }

  function noteItems(now) {
    var c = cfg(), notes = (K.notes ? K.notes() : []) || [];
    if (!c.on || !notes.length) return [];
    var p = String(c.at || '12:00').split(':'), step = STEP[c.freq] || 1, out = [], d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var first = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), +p[0] || 12, +p[1] || 0); if (first <= now) first.setDate(first.getDate() + 1);
    // which note: keep turns stable by the day number, so a resync doesn't reshuffle what you'll see
    for (var i = 0; out.length < 7 && i < 70; i++) {
      var at = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i * step, first.getHours(), first.getMinutes());
      var dayN = Math.floor(at.getTime() / 864e5), n = notes[dayN % notes.length], txt = String(n.txt || '').replace(/\s+/g, ' ').trim();
      if (!txt) continue;
      out.push({ id: 'kzn-note-' + key(at).replace(/-/g, '') + '-' + pad(at.getHours()) + pad(at.getMinutes()), at: at.getTime(), title: 'Note to self', body: txt.length > 220 ? txt.slice(0, 217) + '…' : txt });
    }
    return out;
  }
  function listBody(it) {
    var m = /^kzn-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(it.id || ''); if (!m || !K.notifyLeft || !K.notifySettings) return it;
    var day = new Date(+m[1], +m[2] - 1, +m[3]), dk = m[1] + '-' + m[2] + '-' + m[3], slot = (+m[4]) * 60 + (+m[5]);
    var t = K.today ? K.today() : new Date(), ahead = Math.round((day - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
    var l; try { l = K.notifyLeft(dk, K.notifySettings(), ahead); } catch (e) { return it; }
    var items = [];
    if (l.k66) items.push('Kaizen 66: ' + l.k66.name);
    if (slot >= 21 * 60 && l.quit) items.push(l.quit === 1 ? 'Quit check-in' : l.quit + ' quit check-ins');
    (l.names || []).forEach(function (x) { items.push(x); });
    if (!items.length) return it;
    var shown = items.slice(0, 6).map(function (x) { return '• ' + String(x).slice(0, 60); });
    if (items.length > 6) shown.push('+' + (items.length - 6) + ' more');
    it.body = shown.join('\n').slice(0, 400);
    return it;
  }
  function rewrite(msg) {
    if (!msg || msg.type !== 'notifySync') return msg;
    var now = new Date(), notes = noteItems(now), items = (msg.items || []).filter(function (x) { return !/^kzn-note-/.test(x.id); }).map(listBody);
    items = items.slice(0, Math.max(0, 50 - notes.length)).concat(notes).sort(function (a, b) { return a.at - b.at; });
    msg.items = items; msg.on = !!(msg.on || notes.length);
    return msg;
  }
  // adjust the reminder message on its way to the phone
  var h = null; try { h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen; } catch (e) {}
  var raw = null;
  if (h && h.postMessage && !h.__kznr) {
    raw = h.postMessage.bind(h);
    try { h.postMessage = function (m) { try { m = rewrite(m); } catch (e) {} return raw(m); }; h.__kznr = 1; } catch (e) { raw = null; }
  }
  // with task reminders off, notes still need a message of their own
  function send() {
    var notes = noteItems(new Date()); if (!raw && !h) return;
    var m = { type: 'notifySync', on: !!notes.length, ask: false, items: notes };
    try { (raw || h.postMessage.bind(h))(m); } catch (e) {}
  }
  K.noteRemind = cfg;

  // ---------- Me → Reminders: "Notes to self" ----------
  function chip(on, v, label) { return '<button type="button" class="kzn-chip' + (on ? ' on' : '') + '" data-nr-f="' + v + '" aria-pressed="' + !!on + '">' + label + '</button>'; }
  function section() {
    var c = cfg(), cur = c.on ? c.freq : 'off';
    return '<p class="kzn-lab">Notes to self</p><p class="kznr-hint">A note you wrote, sent back to you.</p><div class="kzn-seg kznr-seg">' +
      chip(cur === 'off', 'off', 'Off') + chip(cur === 'daily', 'daily', 'Daily') + chip(cur === '2d', '2d', 'Every 2 days') + chip(cur === 'weekly', 'weekly', 'Weekly') + '</div>' +
      (c.on ? '<div class="kzn-card"><label class="kzn-row"><span>At</span><input type="time" data-nr-at value="' + esc(c.at) + '"></label></div>' : '');
  }
  function paintPreview() {   // the sheet's "Next reminder" card shows the same list the phone will show
    [].forEach.call(document.querySelectorAll('.kzn-sheet .kzn-prev'), function (pv) {
      var b = pv.querySelector('b'), sp = pv.querySelectorAll(':scope > span'), body = sp[sp.length - 1]; if (!b || !body || body.classList.contains('kzn-app')) return;
      var it = null; try { var pl = K.notifyPlan ? K.notifyPlan() : []; it = pl[0] ? listBody({ id: pl[0].id, at: pl[0].at, title: pl[0].title, body: pl[0].body }) : null; } catch (e) {}
      if (it && body.__t !== it.body) { body.__t = it.body; body.textContent = it.body; body.classList.add('kznr-list'); }
    });
  }
  function paintSheet() {
    paintPreview();
    [].forEach.call(document.querySelectorAll('.kzn-sheet .kzsw'), function (sh) {
      var box = sh.querySelector('.kznr'), html = section();
      if (!box) { box = document.createElement('div'); box.className = 'kznr'; var acts = sh.querySelector('.kzsw-acts') || sh.querySelector('.kzsw-btn'); acts = acts && acts.closest('.kzsw-acts') || acts; if (acts && acts.parentNode === sh) sh.insertBefore(box, acts); else sh.appendChild(box); }
      if (box.__h !== html) { box.__h = html; box.innerHTML = html; }
    });
  }
  // ---------- Journal → Notes: "Remind me of my notes" ----------
  function paintNotes() {
    var nw = document.querySelector('.kznt-new'); if (!nw || !nw.parentNode) return;
    var row = document.querySelector('.kznr-notes'), c = cfg();
    if (!row) { row = document.createElement('label'); row.className = 'kznr-notes'; nw.parentNode.insertBefore(row, nw.nextSibling); }
    var html = '<span><b>Remind me of my notes</b><small>' + (c.on ? ({ daily: 'Daily', '2d': 'Every 2 days', weekly: 'Weekly' }[c.freq] || 'Daily') + ' at ' + fmt(c.at) + ' · change how often in Me → Reminders' : 'Off · a note comes back to you as a notification') + '</small></span>' +
      '<input type="checkbox" class="kz-sw49" data-nr-on' + (c.on ? ' checked' : '') + ' aria-label="Remind me of my notes">';
    if (row.__h !== html) { row.__h = html; row.innerHTML = html; }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-nr-f]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var c = cfg(), v = b.getAttribute('data-nr-f');
    if (v === 'off') c.on = 0; else { c.on = 1; c.freq = v; }
    save(c); paintSheet(); paintNotes();
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches) return;
    if (t.matches('[data-nr-on]')) { var c = cfg(); c.on = t.checked ? 1 : 0; save(c); paintNotes(); paintSheet(); if (t.checked && !(K.notifySettings && K.notifySettings().on)) { try { var hh = window.webkit.messageHandlers.kaizen; (raw || hh.postMessage.bind(hh))({ type: 'notifySync', on: true, ask: true, items: noteItems(new Date()) }); } catch (er) {} } }
    else if (t.matches('[data-nr-at]') && t.value) { var c2 = cfg(); c2.at = t.value; save(c2); paintNotes(); }
  }, true);
  document.addEventListener('kz:notes', function () { resync(); paintNotes(); });
  var q = 0; function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; paintSheet(); paintNotes(); }); }
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kznr, .kznr-notes')) continue; soon(); return; } }).observe(document.body, { childList: true, subtree: true });
  soon();
})();
