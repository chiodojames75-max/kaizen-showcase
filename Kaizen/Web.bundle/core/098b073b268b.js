
(function () {
  var K = window.KZ, S = K && K.sync, q = function (k) { return document.querySelector('[data-kz-' + k + ']'); };
  var b = document.getElementById('kz-burger'), m = document.getElementById('kz-menu'), h = document.getElementById('kz-header');
  function set(open) { m.hidden = !open; b.setAttribute('aria-expanded', String(open)); h.classList.toggle('open', open); document.body.classList.toggle('kz-noscroll', open); if (open) { var c = m.querySelector('[data-kz-menu-close]'); if (c) c.focus(); } }
  b.addEventListener('click', function () { set(m.hidden); });
  m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('a, [data-kz-menu-close], [data-kz-open-install], [data-kz-open-reminders]')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) { set(false); b.focus(); } });
  // Logged in: who + Log out. Logged out: Sign up + Log in.
  var paint = function () {
    var u = S && S.user && S.user(), ap = !u && S && S.appleUser && S.appleUser(), off = !S || !S.enabled, who = u || ap;
    q('nosync').hidden = !off || !!ap;
    q('signup').hidden = !!who; q('login').hidden = !!who; q('who').hidden = !who; q('logout').hidden = !who;   // (these two used to sit inside a comment and never ran)
    if (u) { q('who').textContent = 'Signed in as ' + (u.email || 'Kaizen member') + ' · synced'; var i = q('initial'); if (i && u.email) i.textContent = u.email.charAt(0).toUpperCase(); }
    else if (ap) { q('who').textContent = 'Signed in with Apple' + (ap.name ? ' as ' + ap.name : '') + (off ? ' · saved on this phone' : ''); }
  };
  q('logout').addEventListener('click', function () {
    var x = this; x.disabled = true; x.textContent = 'Logging out…';
    (S && S.user && !S.user() && S.appleUser && S.appleUser() ? Promise.resolve(S.appleSignOut()) : S && S.signOut ? S.signOut() : Promise.resolve()).then(function () { x.disabled = false; x.textContent = 'Log out'; paint(); var w = q('who'); w.hidden = false; w.textContent = 'Logged out. Everything stays on this device.'; });
  });
  paint(); if (S && S.on) S.on(paint);
  var hd = q('hdate'); if (hd && K) hd.textContent = K.today().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  var snd = q('sound'); if (snd) { snd.checked = !!(K && K.get('sound', 1)); snd.addEventListener('change', function () { K.set('sound', snd.checked ? 1 : 0); if (snd.checked && K.sound) K.sound(); }); }
  // Water chip: the tree's water, colored by health.
  function water() {
    if (!K || !K.treeHealth) return; var hl = K.treeHealth(), c = q('water');
    if (!c || hl.status === 'seed') { if (c) c.hidden = true; return; }
    c.hidden = false; q('water-n').textContent = hl.water + '%'; c.classList.toggle('red', hl.water < 34); c.classList.toggle('amber', hl.water >= 34 && hl.water < 67); /* Oct 21: red / yellow / blue */
  }
  // Progress bar along the top: how much of today's goals are done
  function todayBar() {
    var bar = q('hprog'); if (!bar || !K || !K.treeHealth) return;
    var hl = K.treeHealth(), due = hl.todayDue || 0, done = Math.min(hl.todayDone || 0, due), pct = due ? Math.round(done / due * 100) : 0;
    bar.hidden = !due; bar.setAttribute('aria-valuenow', String(pct)); bar.setAttribute('aria-valuetext', done + ' of ' + due + ' goals done today');
    bar.classList.toggle('full', due > 0 && done >= due); bar.firstChild.style.width = pct + '%';
  }
  todayBar(); ['kz:step', 'kz:goals', 'kz:changed'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(todayBar, 0); }); });
  water(); ['kz:step', 'kz:goals', 'kz:changed'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(water, 0); }); });
})();
