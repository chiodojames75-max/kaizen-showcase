
window.KZ_SYNC_CFG = { url: "", key: "", lib: "/kaizen-supabase.js" };
(function () {
  var K = window.KZ; if (!K) return;
  var CFG = window.KZ_SYNC_CFG || {};
  // Accounts aren't switched on until there's a Supabase project: hide Sign up / Log in rather than show buttons that can't work.
  if (!CFG.url || !CFG.key) document.documentElement.classList.add('kz-nosync-cfg');
  var KEYS = ['pillars', 'tree', 'treename', 'treeplanted', 'treestress', 'goals', 'archived', 'done', 'rate', 'thought', 'journal', 'liked', 'tomb', 'adds', 'gorder', 'gnotes', 'unlocked', 'plans', 'companion', 'friends', 'wild', 'bond', 'seen', 'username', 'chats', 'fedlog', 'todos', 'petnames'];
  var META = 'kz_syncmeta', listeners = [], client = null, user = null, timer = null, busy = false;
  var S = K.sync = { enabled: !!(CFG.url && CFG.key), user: function () { return user; }, lastSync: function () { return meta().last || null; } };
  function meta() { try { return JSON.parse(localStorage.getItem(META)) || { seen: {}, dirty: {} }; } catch (e) { return { seen: {}, dirty: {} }; } }
  function saveMeta(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} }
  function raw(k) { try { var v = localStorage.getItem('kz_' + k); return v === null ? undefined : JSON.parse(v); } catch (e) { return undefined; } }
  function rawSet(k, v) { try { localStorage.setItem('kz_' + k, JSON.stringify(v)); } catch (e) {} }
  function emit() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); document.dispatchEvent(new CustomEvent('kz:sync')); }
  S.on = function (f) { listeners.push(f); };

  // ---------- merging (used only when the same key changed on two devices) ----------
  var obj = function (x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; };
  var arr = function (x) { return Array.isArray(x) ? x : []; };
  function unionMap(a, b) { var o = {}, k; a = obj(a); b = obj(b); for (k in b) o[k] = b[k]; for (k in a) if (a[k] !== '' && a[k] != null) o[k] = a[k]; return o; }
  function unionGoals(a, b, tomb) { var seen = {}, out = []; arr(a).concat(arr(b)).forEach(function (g) { if (g && g.id && !seen[g.id] && !tomb[g.id]) { seen[g.id] = 1; out.push(g); } }); return out; }
  S.merge = function (k, a, b, ctx) {
    var tomb = obj(ctx && ctx.tomb);
    if (k === 'tomb') return unionMap(a, b);
    if (k === 'chats') { var seenT = {}, out = []; arr(b).concat(arr(a)).forEach(function (x) { if (x && x.t && !seenT[x.t]) { seenT[x.t] = 1; out.push(x); } }); return out.sort(function (p, q) { return p.t < q.t ? -1 : 1; }).slice(-300); }
    if (k === 'pillars') return arr(a).length ? a : b;
    if (k === 'tree' || k === 'treename' || k === 'treeplanted') return a || b;
    if (k === 'treestress') return Math.max(+a || 0, +b || 0);
    if (k === 'gnotes') { var gn = {}, gi, dd; [obj(b), obj(a)].forEach(function (src) { for (gi in src) { gn[gi] = gn[gi] || {}; for (dd in obj(src[gi])) { var v = String(src[gi][dd] || ''); if (!gn[gi][dd] || v.length > String(gn[gi][dd]).length) gn[gi][dd] = v; } } }); return gn; } // per goal, per day; longer text wins
    if (k === 'plans') { var pl = {}, pd; [obj(b), obj(a)].forEach(function (src) { for (pd in src) { var cur = pl[pd], nx = src[pd]; if (!cur || (nx && nx.items && nx.items.filter(function (x) { return x.done; }).length >= cur.items.filter(function (x) { return x.done; }).length)) pl[pd] = nx; } }); return pl; }
    if (k === 'gorder') return ((obj(a).t || 0) >= (obj(b).t || 0)) ? a : b; // newest order wins
    if (k === 'adds') { var o = obj(b), x; a = obj(a); for (x in a) o[x] = Math.max(a[x] || 0, o[x] || 0); return o; }
    if (k === 'goals' || k === 'archived') return unionGoals(a, b, tomb);
    if (k === 'done') { var d = {}, id; a = obj(a); b = obj(b);
      [b, a].forEach(function (m) { for (id in m) { if (tomb[id]) continue; d[id] = d[id] || {}; for (var day in obj(m[id])) d[id][day] = 1; } }); return d; }
    return unionMap(a, b);
  };
  // A goal can't be both active and archived: keep the newest move (archive date vs restore date).
  function settleArchive() {
    var g = arr(raw('goals')), a = arr(raw('archived'));
    var arch = {}; a.forEach(function (x) { arch[x.id] = x; });
    var keep = g.filter(function (x) { var y = arch[x.id]; return !y || (x.restored && x.restored >= (y.archived || '')); });
    var act = {}; keep.forEach(function (x) { act[x.id] = 1; });
    var keepA = a.filter(function (x) { return !act[x.id]; });
    if (keep.length !== g.length) rawSet('goals', keep);
    if (keepA.length !== a.length) rawSet('archived', keepA);
  }

  // ---------- local change tracking ----------
  K._onset = function (k) {
    if (K.demo || KEYS.indexOf(k) < 0 || !user) return;   // demo mode never touches your cloud copy
    var m = meta(); m.dirty[k] = 1; saveMeta(m); schedule();
  };
  function schedule() { clearTimeout(timer); timer = setTimeout(function () { push(); }, 1500); }

  // ---------- pull / push ----------
  function pull() {
    if (K.demo || !client || !user) return Promise.resolve(false);
    return client.from('kz_state').select('k,v,updated_at').then(function (r) {
      if (r.error) throw r.error;
      var m = meta(), changed = false, rows = {}; (r.data || []).forEach(function (row) { rows[row.k] = row; });
      var order = ['pillars', 'tomb', 'archived'].concat(KEYS.filter(function (k) { return k !== 'tomb' && k !== 'archived'; }));
      order.forEach(function (k) {
        var row = rows[k]; if (!row) return;
        if (m.seen[k] && row.updated_at <= m.seen[k]) return;
        var local = raw(k), next = m.dirty[k] ? S.merge(k, local, row.v, { tomb: raw('tomb') }) : row.v;
        if (JSON.stringify(next) !== JSON.stringify(local)) { rawSet(k, next); changed = true; }
        m.seen[k] = row.updated_at;
      });
      saveMeta(m); if (changed) settleArchive();
      return changed;
    });
  }
  // Upload changed keys. Each write only succeeds if the cloud copy is still the one this device last saw;
  // if another device wrote in between, pull + merge and try again (so two devices saving at once both keep their work).
  function writeKey(k, v, now) {
    var m = meta(), seen = m.seen[k], tbl = client.from('kz_state');
    if (seen) return tbl.update({ v: v, updated_at: now }).eq('user_id', user.id).eq('k', k).eq('updated_at', seen).select('k')
      .then(function (r) { if (r.error) throw r.error; return r.data && r.data.length > 0; });
    return tbl.insert({ user_id: user.id, k: k, v: v, updated_at: now })
      .then(function (r) { if (r.error) { if (r.error.code === '23505') return false; throw r.error; } return true; });
  }
  function push(tries) {
    if (K.demo || !client || !user) return Promise.resolve();
    if (busy) { schedule(); return Promise.resolve(); }
    busy = true; tries = tries || 0;
    var anyChanged = false;
    return pull().then(function (changed) {
      anyChanged = changed;
      var m = meta(), now = new Date().toISOString(), keys = Object.keys(m.dirty).filter(function (k) { return KEYS.indexOf(k) > -1 && raw(k) !== undefined; });
      return keys.reduce(function (pr, k) { return pr.then(function (conflicts) {
        return writeKey(k, raw(k), now).then(function (ok) { var mm = meta(); if (ok) { mm.seen[k] = now; delete mm.dirty[k]; saveMeta(mm); return conflicts; } return conflicts + 1; });
      }); }, Promise.resolve(0)).then(function (conflicts) {
        busy = false;
        if (conflicts && tries < 4) return push(tries + 1);
        var mm = meta(); mm.last = new Date().toISOString(); saveMeta(mm); S.error = null; emit(); if (anyChanged) refresh();
      });
    }).catch(function (e) { busy = false; S.error = (e && e.message) || 'Sync failed'; emit(); });
  }
  S.now = function () { return push(); };
  // When data arrives from another device, re-render once so every section shows it.
  function refresh() {
    try { var t = +sessionStorage.getItem('kz_sync_reload') || 0; if (Date.now() - t < 15000) { document.dispatchEvent(new CustomEvent('kz:changed')); return; } sessionStorage.setItem('kz_sync_reload', Date.now()); } catch (e) {}
    location.reload();
  }
  // First sign-in on a device: everything already saved here counts as a change, so it merges instead of being replaced.
  function markAllDirty() { var m = meta(); KEYS.forEach(function (k) { if (raw(k) !== undefined) m.dirty[k] = 1; }); m.seen = {}; saveMeta(m); }

  // ---------- account (email + 6-digit code) ----------
  S.sendCode = function (email) { return ready().then(function () { return client.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + '/pages/profile?signedin=1' } }); }).then(function (r) { if (r.error) throw r.error; }); };
  S.verify = function (email, code) {
    return ready().then(function () { return client.auth.verifyOtp({ email: email, token: String(code).trim(), type: 'email' }); })
      .then(function (r) { if (r.error) throw r.error; user = r.data.user; var m = meta(); if (m.user !== user.id) { m.user = user.id; saveMeta(m); markAllDirty(); } K.track('kz_sync_signin'); return push(); });
  };
  // ---------- Sign in with Apple (iPhone app) ----------
  // The phone shows Apple's sheet and hands back the Apple ID (and, the first time only, name + email).
  // Without cloud sync it's a local account on this phone; with sync it signs into Supabase with Apple's token.
  S.appleUser = function () { return K.get('appleid', null); };
  S.canApple = function () { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kaizen); };
  K.appleResult = function (r) { var cb = K._appleCb; K._appleCb = null; if (cb) cb(r || {}); };
  S.apple = function () {
    return new Promise(function (res, rej) {
      if (!S.canApple()) { rej({ apple: 'web' }); return; }
      K._appleCb = function (r) { if (r.error != null) rej({ apple: r.error, message: r.message }); else res(r); };
      window.webkit.messageHandlers.kaizen.postMessage({ type: 'appleSignIn' });
    }).then(function (r) {
      var old = K.get('appleid', {}) || {}, name = [r.givenName, r.familyName].filter(Boolean).join(' ');
      K.set('appleid', { sub: r.user, email: r.email || (old.sub === r.user ? old.email : '') || '', name: name || (old.sub === r.user ? old.name : '') || '', at: new Date().toISOString() });
      if (r.givenName && !String(K.get('username', '') || '').trim()) K.set('username', r.givenName);
      K.track('kz_apple_signin', { cloud: S.enabled });
      if (!S.enabled || !r.idToken) { emit(); return { local: true }; }
      return ready().then(function () { return client.auth.signInWithIdToken({ provider: 'apple', token: r.idToken, nonce: r.rawNonce }); })
        .then(function (x) { if (x.error) throw x.error; user = x.data.user; var m = meta(); if (m.user !== user.id) { m.user = user.id; saveMeta(m); markAllDirty(); } return push(); });
    });
  };
  S.appleSignOut = function () { K.set('appleid', null); emit(); };
  // Delete my data: every synced row, then the account itself (SQL function delete_my_account, see SETUP-ACCOUNTS.md), then sign out.
  S.deleteAccount = function () {
    if (!S.enabled || !user) return Promise.resolve({ cloud: false });
    return ready().then(function () { return client.from('kz_state').delete().eq('user_id', user.id); })
      .then(function (r) { if (r.error) throw r.error; return client.rpc('delete_my_account'); })
      .then(function (r) { if (r.error) throw r.error; return client.auth.signOut(); })
      .then(function () { user = null; return { cloud: true }; });
  };
  S.signOut = function () { return ready().then(function () { return client.auth.signOut(); }).then(function () { user = null; var m = meta(); m.dirty = {}; saveMeta(m); emit(); }); };

  var loading = null;
  function ready() {
    if (client) return Promise.resolve(client);
    if (S._client) { client = S._client; return Promise.resolve(client); } // tests inject a client
    if (!S.enabled) return Promise.reject(new Error('Sync is not set up yet'));
    if (!loading) loading = new Promise(function (res, rej) {
      if (window.supabase) return res();
      var s = document.createElement('script'); s.src = CFG.lib; s.async = true; s.onload = res; s.onerror = function () { rej(new Error('Could not load sync')); }; document.head.appendChild(s);
    }).then(function () { client = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kz_auth' } }); return client; });
    return loading;
  }
  S.start = function () {
    return ready().then(function () { return client.auth.getSession(); }).then(function (r) {
      user = r && r.data && r.data.session ? r.data.session.user : null;
      if (user) { var m = meta(); if (m.user !== user.id) { m.user = user.id; saveMeta(m); markAllDirty(); S.justSignedIn = true; K.track('kz_sync_signin', { via: 'link' }); } }
      emit();
      if (user) return push();
    }).catch(function () { emit(); });
  };
  // Plain-words errors for the sign-in screen.
  S.friendly = function (err) {
    if (err && err.apple != null) { var a = err.apple; return a === 1001 ? '' : a === 'web' ? 'Sign in with Apple works in the Kaizen iPhone app.' : a === 1000 ? 'Sign in with Apple switches on when Kaizen’s Apple developer account goes live. Everything stays safe on this phone until then.' : 'Apple sign-in didn’t finish. Try again.'; }
    var m = String((err && (err.message || err.error_description)) || err || ''), st = err && err.status;
    if (typeof navigator !== 'undefined' && navigator.onLine === false || /Failed to fetch|NetworkError|network/i.test(m)) return 'You’re offline. Try again when you’re connected.';
    if (st === 429 || /rate limit|too many|security purposes|seconds/i.test(m)) return 'Too many tries. Wait a minute.';
    if (/expired/i.test(m) && !/invalid/i.test(m)) return 'That code expired. Send a new one.';
    if (/token|otp|code|invalid/i.test(m)) return 'That code didn’t work. Check the newest email.';
    if (/not set up/i.test(m)) return 'Accounts are being set up. Your data is safe on this phone.';
    return m || 'Something went wrong. Try again.';
  };
  // Returning from the email link (#access_token=… / ?code=… / ?token_hash=…) finishes sign-in on this page.
  var href = String(location.href), fromLink = /[#&?](access_token|refresh_token|code|token_hash)=/.test(href) || /[?&]signedin=1/.test(href);
  var linkErr = (href.match(/[#&]error_description=([^&]+)/) || [])[1];
  if (linkErr) S.linkError = decodeURIComponent(linkErr.replace(/\+/g, ' '));
  // Start only if this device signed in before, or is coming back from the email link (no library download for everyone else).
  var hasAuth = false; try { hasAuth = !!localStorage.getItem('kz_auth'); } catch (e) {}
  if (S.enabled && (hasAuth || fromLink)) S.start().then(function () {
    if (fromLink && user) { S.justSignedIn = true; emit(); }
    if (fromLink) try { history.replaceState(null, '', location.pathname + '#sync'); } catch (e) {}
  });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && user) push(); });
  window.addEventListener('online', function () { if (user) push(); });
})();
