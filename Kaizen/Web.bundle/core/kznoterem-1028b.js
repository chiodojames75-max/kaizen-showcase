/* Oct 28 b · kznoterem-1028b.js replaces kznoterem-1028.js: James got a note he didn't pick — the rotating "Remind me of my
   notes" was still on next to his chosen note's reminder. While any note has its own reminder, the rotation pauses (and
   says so); its text now says it sends a different note each time.
   Oct 28 · kznoterem-1028.js replaces kznoterem-1027.js. James: "allow you to choose which note is the one you get reminded of
   and allow it to be multiple at different times". Each note can carry its own reminders (Edit note → "Remind me of this
   note": any number of times, each Once · Daily · Every 2 days · Weekly), saved as kz_noterems { noteId: [{ at: 'HH:MM',
   f: 'once'|'daily'|'2d'|'weekly', d0: 'YYYY-MM-DD' }] }. They go to the phone with the other reminders (ids "kzn-np-…",
   that note's own text); Journal → Notes shows a bell with the times on each such note. The rotating "Remind me of my notes"
   switch below is unchanged.
   Oct 27 · James: "in Reminders you can also get notifications for your notes to self; set how often in Reminders, and in
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
    if (!c.on || !notes.length || pinned()) return [];   // Oct 28 b: notes with their own reminders replace the rotation
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
  // ---------- Oct 28: reminders on a chosen note ----------
  var FQ = { once: 0, daily: 1, '2d': 2, weekly: 7 }, FQN = { once: 'Once', daily: 'Daily', '2d': 'Every 2 days', weekly: 'Weekly' };
  function rems() { var r = K.get('noterems', null); return r && typeof r === 'object' ? r : {}; }
  function remsFor(id) { var r = rems()[id]; return Array.isArray(r) ? r.filter(function (x) { return x && /^\d{2}:\d{2}$/.test(x.at) && x.f in FQ; }) : []; }
  function pinned() { var ns = (K.notes ? K.notes() : []) || []; for (var i = 0; i < ns.length; i++) if (remsFor(ns[i].id).length) return true; return false; }
  function setRems(id, list) { var r = rems(); if (list && list.length) r[id] = list; else delete r[id]; K.set('noterems', r); resync(); }
  function dayOf(k) { var p = String(k || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function pinItems(now) {
    var notes = (K.notes ? K.notes() : []) || [], all = [], horizon = now.getTime() + 7.5 * 864e5;
    notes.forEach(function (n) {
      remsFor(n.id).forEach(function (r) {
        var p = r.at.split(':'), d = dayOf(r.d0) || new Date(now.getFullYear(), now.getMonth(), now.getDate()), step = FQ[r.f];
        var t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1]);
        if (step) { var guard = 0; while (t <= now && guard++ < 400) t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + step, +p[0], +p[1]); }
        var txt = String(n.txt || '').replace(/\s+/g, ' ').trim(); if (!txt) return;
        for (var i = 0; i < 8 && t.getTime() < horizon; i++) {
          if (t > now) all.push({ id: 'kzn-np-' + String(n.id).replace(/[^A-Za-z0-9]/g, '').slice(0, 14) + '-' + key(t).replace(/-/g, '') + pad(t.getHours()) + pad(t.getMinutes()), at: t.getTime(), title: 'Note to self', body: txt.length > 220 ? txt.slice(0, 217) + '…' : txt });
          if (!step) break; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + step, +p[0], +p[1]);
        }
      });
    });
    all.sort(function (a, b) { return a.at - b.at; });
    var seen = {}; return all.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; }).slice(0, 24);
  }
  function remText(list) { return list.map(function (r) { return fmt(r.at) + (r.f === 'once' ? ' · ' + (dayOf(r.d0) ? dayOf(r.d0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '') : ' ' + (r.f === 'weekly' && dayOf(r.d0) ? 'every ' + dayOf(r.d0).toLocaleDateString('en-US', { weekday: 'short' }) : FQN[r.f].toLowerCase())); }).join(' · '); }
  K.noteReminders = remsFor;

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
    var now = new Date(), notes = pinItems(now).concat(noteItems(now)), items = (msg.items || []).filter(function (x) { return !/^kzn-(note|np)-/.test(x.id); }).map(listBody);
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
    var notes = pinItems(new Date()).concat(noteItems(new Date())); if (!raw && !h) return;
    var m = { type: 'notifySync', on: !!notes.length, ask: false, items: notes };
    try { (raw || h.postMessage.bind(h))(m); } catch (e) {}
  }
  K.noteRemind = cfg;

  // ---------- Me → Reminders: "Notes to self" ----------
  function chip(on, v, label) { return '<button type="button" class="kzn-chip' + (on ? ' on' : '') + '" data-nr-f="' + v + '" aria-pressed="' + !!on + '">' + label + '</button>'; }
  function section() {
    var c = cfg(), cur = c.on ? c.freq : 'off';
    return '<p class="kzn-lab">Notes to self</p><p class="kznr-hint">' + (pinned() ? 'Paused: the notes you set reminders on come instead.' : 'A different note you wrote each time. For one note, open it in Journal → Notes and add a reminder.') + '</p><div class="kzn-seg kznr-seg">' +
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
    var html = '<span><b>Remind me of my notes</b><small>' + (c.on && pinned() ? 'Paused: the notes you set reminders on come instead' : c.on ? ({ daily: 'Daily', '2d': 'Every 2 days', weekly: 'Weekly' }[c.freq] || 'Daily') + ' at ' + fmt(c.at) + ' · a different note each time. For one note, open it and add a reminder' : 'Off · a different note each time. For one note, open it and add a reminder') + '</small></span>' +
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

  // ---------- Oct 28: "Remind me of this note" in the note editor ----------
  var BELL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/></svg>';
  var XS = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  var cur = null;   // { id, draft: [...], dirty }
  function todayKey() { var t = K.today ? K.today() : new Date(); return key(t); }
  function nextHour() { var d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return pad(d.getHours()) + ':00'; }
  function onceDay(at) { var p = at.split(':'), d = new Date(), t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1]); if (t <= d) t.setDate(t.getDate() + 1); return key(t); }
  function rowHTML(r, i) {
    var chips = ['once', 'daily', '2d', 'weekly'].map(function (f) { var on = r.f === f; return '<button type="button" class="kznt-chip' + (on ? ' on' : '') + '" data-nrp-f="' + f + '" data-i="' + i + '" aria-pressed="' + on + '">' + FQN[f] + '</button>'; }).join('');
    return '<div class="kznrp-row"><div class="kznrp-top"><input type="time" class="kznrp-at" data-i="' + i + '" value="' + esc(r.at) + '" aria-label="Reminder time"><span class="kznrp-when">' + esc(r.f === 'once' ? 'on ' + (dayOf(r.d0) ? dayOf(r.d0).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '') : r.f === 'weekly' && dayOf(r.d0) ? 'every ' + dayOf(r.d0).toLocaleDateString('en-US', { weekday: 'short' }) : '') + '</span>' +
      '<button type="button" class="kznrp-x" data-nrp-x="' + i + '" aria-label="Remove this reminder">' + XS + '</button></div><div class="kznrp-fq" role="group" aria-label="How often">' + chips + '</div></div>';
  }
  function paintPin() {
    var sh = document.querySelector('.kznt-back .kznt-body'); if (!sh || !cur) return;
    var box = sh.querySelector('.kznrp');
    if (!box) { box = document.createElement('div'); box.className = 'kznrp'; var del = sh.querySelector('.kznt-del'); sh.insertBefore(box, del || null); }
    box.innerHTML = '<p class="kznt-lab">Remind me of this note</p>' + (cur.draft.length ? '<div class="kznrp-list">' + cur.draft.map(rowHTML).join('') + '</div>' : '') +
      '<button type="button" class="kznrp-add" data-nrp-add>' + BELL + '<span>' + (cur.draft.length ? 'Add another time' : 'Add a reminder') + '</span></button>';
  }
  if (K.openNote && !K.openNote.__kznrp) {
    var o0 = K.openNote;
    K.openNote = function (id) {
      var had = !!document.querySelector('.kznt-back');
      var r = o0.apply(this, arguments);
      if (!had && document.querySelector('.kznt-back')) { cur = { id: id || null, draft: remsFor(id || '').map(function (x) { return { at: x.at, f: x.f, d0: x.d0 }; }), dirty: false }; paintPin(); }
      return r;
    };
    K.openNote.__kznrp = 1;
  }
  function commit(id) { if (!cur || !cur.dirty || !id) return; setRems(id, cur.draft.slice()); var c = cur; cur = null; if (c.draft.length && !(K.notifySettings && K.notifySettings().on)) { try { var hh = window.webkit.messageHandlers.kaizen; (raw || hh.postMessage.bind(hh))({ type: 'notifySync', on: true, ask: true, items: pinItems(new Date()).concat(noteItems(new Date())) }); } catch (er) {} } }
  if (K.addNote && !K.addNote.__kznrp) { var a0 = K.addNote; K.addNote = function () { var n = a0.apply(this, arguments); try { if (n && document.querySelector('.kznt-back')) commit(n.id); } catch (e) {} return n; }; K.addNote.__kznrp = 1; }
  if (K.updateNote && !K.updateNote.__kznrp) { var u0 = K.updateNote; K.updateNote = function (id) { var r = u0.apply(this, arguments); try { if (cur && cur.id === id) commit(id); } catch (e) {} return r; }; K.updateNote.__kznrp = 1; }
  if (K.deleteNote && !K.deleteNote.__kznrp) { var d0 = K.deleteNote; K.deleteNote = function (id) { var r = d0.apply(this, arguments); try { if (remsFor(id).length) setRems(id, []); } catch (e) {} cur = null; return r; }; K.deleteNote.__kznrp = 1; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-nrp-add],[data-nrp-x],[data-nrp-f]'); if (!t || !cur) return;
    e.preventDefault(); e.stopPropagation();
    if (t.hasAttribute('data-nrp-add')) { var at = nextHour(); cur.draft.push({ at: at, f: 'daily', d0: todayKey() }); }
    else if (t.hasAttribute('data-nrp-x')) cur.draft.splice(+t.getAttribute('data-nrp-x'), 1);
    else { var r = cur.draft[+t.getAttribute('data-i')]; if (r) { r.f = t.getAttribute('data-nrp-f'); r.d0 = r.f === 'once' ? onceDay(r.at) : todayKey(); } }
    cur.dirty = true; paintPin(); enableSave();
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.matches || !t.matches('.kznrp-at') || !cur) return;
    var r = cur.draft[+t.getAttribute('data-i')]; if (!r || !t.value) return;
    r.at = t.value; if (r.f === 'once') r.d0 = onceDay(r.at); cur.dirty = true; paintPin(); enableSave();
  }, true);
  function enableSave() { var ta = document.querySelector('.kznt-back .kznt-txt'), sv = document.querySelector('.kznt-back [data-nt="save"]'); if (sv && ta) sv.disabled = !ta.value.trim(); }
  // a note's sheet closed without saving: forget the draft
  new MutationObserver(function () { if (cur && !document.querySelector('.kznt-back')) cur = null; }).observe(document.body, { childList: true });

  // ---------- Journal → Notes: a bell with the times on each note that has them ----------
  function paintBadges() {
    [].forEach.call(document.querySelectorAll('#kz-nlist .kznt-card[data-nt-id]'), function (c) {
      var l = remsFor(c.getAttribute('data-nt-id')), b = c.querySelector('.kznrp-badge'), txt = l.length ? remText(l) : '';
      if (!txt) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement('span'); b.className = 'kznrp-badge'; var m = c.querySelector('.kznt-meta'); (m || c).appendChild(b); }
      if (b.__t !== txt) { b.__t = txt; b.innerHTML = BELL + '<span>' + esc(txt) + '</span>'; }
    });
  }
  document.addEventListener('kz:notes', function () { requestAnimationFrame(paintBadges); });
  new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t.closest && t.closest('.kznrp-badge, .kznrp')) continue; requestAnimationFrame(paintBadges); return; } }).observe(document.body, { childList: true, subtree: true });
})();
