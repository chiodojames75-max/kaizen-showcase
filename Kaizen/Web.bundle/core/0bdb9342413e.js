
(function () {
  var K = window.KZ; if (!K) return;
  K.SPECIES = {
    emerald: { name: 'Weeping Willow', leaf: ['#C6F7DD', '#6FDDA5', '#2FAE73', '#147A4C'], mass: ['#082016', '#0F3B27', '#185C3C'], bark: ['#2E1F10', '#7A5A2C', '#3E2A14'], shape: 'lance', bloom: '#F4FFF8', fruit: '#E9C547' },
    birch: { name: 'Silver Birch', leaf: ['#E8F2C8', '#B6D27A', '#7EA846', '#4E7A2A'], mass: ['#121A0A', '#223212', '#33481C'], bark: ['#E8E6E0', '#BDB8AE', '#3A3632'], shape: 'lance', bloom: '#F6FAE8', fruit: '#B6A06A' },
    oak: { name: 'English Oak', leaf: ['#D4EAA6', '#94C25A', '#5A9233', '#2E5A1A'], mass: ['#0F1E0B', '#1D3A15', '#2C5620'], bark: ['#2A2016', '#6E5438', '#3A2C1E'], shape: 'oak', bloom: '#E4EFC0', fruit: '#8A5A2B' },
    cherry: { name: 'Japanese Cherry', leaf: ['#FFF4F7', '#FCCFDD', '#F09DB8', '#C9617F'], mass: ['#2E1720', '#5A2A3D', '#8E4462'], bark: ['#2A1616', '#6A3C3C', '#3A2020'], shape: 'petal', bloom: '#FFFFFF', fruit: '#B3243E' },
    maple: { name: 'Sugar Maple', leaf: ['#FFD9A0', '#F5A04E', '#DE5A2C', '#A3301A'], mass: ['#2E120A', '#5C2414', '#8A3519'], bark: ['#30221A', '#70533A', '#3E2C1F'], shape: 'maple', bloom: '#FFE3B0', fruit: '#B5452A' },
    golden: { name: 'Maidenhair', leaf: ['#FFF6C4', '#F5D865', '#DDB53C', '#A8832A'], mass: ['#272009', '#4C3D10', '#7A6219'], bark: ['#30251A', '#78603C', '#40331F'], shape: 'fan', bloom: '#FFF8DA', fruit: '#E59A3A' },
    frost: { name: 'Norway Spruce', leaf: ['#D7EEEA', '#6FA89C', '#2F6B60', '#173F38'], mass: ['#06191A', '#0D2B2A', '#164441'], bark: ['#2A2420', '#6A5A4E', '#3A322C'], shape: 'needle', bloom: '#EAF6FF', fruit: '#7A5230', snow: true },
    jade: { name: 'Bodhi Tree', leaf: ['#E2FFF0', '#5FE0A0', '#12A866', '#06603A'], mass: ['#02160D', '#053A22', '#0A5A36'], bark: ['#2A2410', '#8A7A3A', '#4A3F1E'], shape: 'lance', bloom: '#F5D774', fruit: '#E2B93B' },
    midnight: { name: 'Jacaranda', leaf: ['#F3E6FF', '#C9A2F2', '#9A64D9', '#5E2F9E'], mass: ['#140A22', '#2A1446', '#45206E'], bark: ['#1C1426', '#4A3A5E', '#2A1F38'], shape: 'petal', bloom: '#FFFFFF', fruit: '#E2B93B' },
    inferno: { name: 'Japanese Maple', leaf: ['#FFE08A', '#FF9A3A', '#E5381C', '#8E0F0F'], mass: ['#2A0606', '#5A0E0A', '#8A1A10'], bark: ['#1A0F0C', '#4A2A1E', '#2A1810'], shape: 'maple', bloom: '#FFD34A', fruit: '#FF5A1F' },
    aurora: { name: 'Blue Atlas Cedar', leaf: ['#CFFFF4', '#5FE3C8', '#3A8FD9', '#5B3FA8'], mass: ['#061A1E', '#0D2E36', '#123F4A'], bark: ['#20242A', '#5A6270', '#30353E'], shape: 'needle', bloom: '#E8FFFF', fruit: '#9AE8FF' },
    obsidian: { name: 'Copper Beech', leaf: ['#B88A84', '#7A3E4A', '#4E2232', '#2A1018'], mass: ['#12060A', '#260C14', '#3A1420'], bark: ['#2A2624', '#7A726A', '#4A443F'], shape: 'oak', bloom: '#E8C8C0', fruit: '#8A5A2B' },
    celestial: { name: 'Rainbow Eucalyptus', leaf: ['#D8F2D0', '#8CCB7A', '#4E9A52', '#2A6038'], mass: ['#081A0E', '#123A1E', '#1E5A2E'], bark: ['#3A6AD9', '#E85A9A', '#F5A83B'], shape: 'lance', bloom: '#F0FFE8', fruit: '#F5A83B' },
    phoenix: { name: 'Flame Tree', leaf: ['#FFE0A0', '#FF8A3A', '#E8401C', '#9A1A10'], mass: ['#1E2A0E', '#2E4214', '#3E5A1A'], bark: ['#2A1E14', '#6E5240', '#3E2E22'], shape: 'fan', bloom: '#FFD34A', fruit: '#E8401C' },
    voidbloom: { name: 'Bristlecone Pine', leaf: ['#DCE8EE', '#8AA8B6', '#506E7E', '#2A4050'], mass: ['#081218', '#102028', '#1A3038'], bark: ['#3A3430', '#A89A88', '#5E554C'], shape: 'needle', bloom: '#F2F6F8', fruit: '#8A6A4A' },
  };
  var DEFAULT_NAME = 'Your tree'; // no default name: people name their own tree
  K.treeSpecies = function () { var s = K.get('tree', 'oak'); if (s === 'sprig') s = 'oak'; return K.SPECIES[s] ? s : 'oak'; }; // everyone starts with an English Oak
  K.sproutDemo = function () { return 1 / Math.max(1, (K.PATHS || []).length); }; // a just-planted tree: the same size it is after your first full day
  // The tree is you: it isn't named separately. Its label is the first name you gave at setup; sentences just say "your tree".
  K.treeNamed = function () { return false; };
  K.treeRef = function () { return 'your tree'; }; // for use mid-sentence
  K.treeName = function () { return DEFAULT_NAME; };
  K.treeLabel = function () { var n = String(K.get('username', '') || '').trim(); return n || DEFAULT_NAME; };
  // Existing name or type from earlier versions counts as already planted.
  K.treePlanted = function () { return !!(K.get('treeplanted', 0) || K.get('treename', '') || K.get('tree', null)); };
  K.plantTree = function (name, species) {
    K.set('treename', String(name || '').trim().slice(0, 20) || DEFAULT_NAME); if (K.SPECIES[species]) K.set('tree', species); K.set('treeplanted', 1);
    document.dispatchEvent(new CustomEvent('kz:changed')); K.track('kz_tree_planted', { species: species });
  };
  // After planting, any change stresses the tree: 2% of its height, every time.
  K.editTree = function (name, species) {
    var n = '', changed = K.SPECIES[species] && species !== K.treeSpecies();
    if (!changed) return false;
    var firstName = !K.treeNamed() && n && !(K.SPECIES[species] && species !== K.treeSpecies());
    if (n) K.set('treename', n); if (K.SPECIES[species]) K.set('tree', species);
    if (!firstName) K.set('treestress', (K.get('treestress', 0) || 0) + 1); K.set('treeplanted', 1);
    document.dispatchEvent(new CustomEvent('kz:changed')); K.track('kz_tree_edited'); return true;
  };
  K.pillarSteps = function () {
    var done = K.get('done', {}), out = {}; K.PATHS.forEach(function (p) { out[p.id] = 0; });
    K.allGoals().forEach(function (g) { var id = K.pathOf(g); if (id in out) out[id] += Object.keys(done[g.id] || {}).length; });
    return out;
  };
  // Water and health.
  // Water is a slow reservoir, not a snapshot. A new tree starts half full (50%). Every finished day moves it 30% of the way
  // toward that day's completion rate, so one bad day costs ~15 points and it takes several to kill a tree. Today only counts
  // when it helps: finish every goal and it's full (100%) right away; partial days pull it up part of the way; an unfinished day isn't charged until it's over.
  // Animals feel the day as it goes (energy): a 0% evening leaves them exhausted even if the tree still has water.
  // ---------- Real sky: sunrise, day, sunset and night behind the tree, from your phone's clock ----------
  // Sun times use the date and your time zone (NOAA formula, about 40°N, longitude from the standard time zone).
  K.sunTimes = function (d) {
    d = d || new Date(); var rad = Math.PI / 180, y0 = new Date(d.getFullYear(), 0, 1), doy = Math.floor((d - y0) / 864e5) + 1;
    var std = Math.max(new Date(d.getFullYear(), 0, 1).getTimezoneOffset(), new Date(d.getFullYear(), 6, 1).getTimezoneOffset()), lng = -std / 4, lat = 40;
    var g = 2 * Math.PI / 365 * (doy - 1), eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var ha = Math.acos(Math.max(-1, Math.min(1, Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(dec)) - Math.tan(lat * rad) * Math.tan(dec)))) / rad;
    var off = -d.getTimezoneOffset(); return { rise: 720 - 4 * (lng + ha) - eq + off, set: 720 - 4 * (lng - ha) - eq + off };
  };
  K.sky = function (d) {
    d = d || new Date(); var m = d.getHours() * 60 + d.getMinutes(), t = K.sunTimes(d), r = t.rise, s2 = t.set;
    var KEYS = [ // minutes, [top, middle, horizon], stars
      [r - 100, ['#05070F', '#0B1226', '#141E3A'], 1], [r - 30, ['#141A3E', '#3A2F5E', '#8A4F66'], .5], [r + 15, ['#2C3D78', '#C0647A', '#FFB070'], .1],
      [r + 90, ['#3E7FD6', '#7DB4EA', '#CFE6F6'], 0], [s2 - 100, ['#3A78D2', '#78AEE6', '#CBE3F4'], 0], [s2 - 25, ['#3A3F86', '#C8607A', '#FF9A4D'], 0],
      [s2 + 20, ['#1E1A4A', '#5A2E5E', '#B0485A'], .35], [s2 + 90, ['#05070F', '#0B1226', '#141E3A'], 1]];
    var LAND = ['night', 'night', 'dawn', 'day', 'day', 'golden', 'dusk', 'night'], c, st, land = [['night', 1]]; // the landscape lit for each key, crossfaded in between
    if (m <= KEYS[0][0] || m >= KEYS[KEYS.length - 1][0]) { c = KEYS[0][1]; st = 1; }
    else for (var i = 0; i < KEYS.length - 1; i++) if (m >= KEYS[i][0] && m < KEYS[i + 1][0]) { var u = (m - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]); c = [0, 1, 2].map(function (j) { return mix(KEYS[i][1][j], KEYS[i + 1][1][j], u); }); st = KEYS[i][2] + (KEYS[i + 1][2] - KEYS[i][2]) * u; land = LAND[i] === LAND[i + 1] || u < .02 ? [[LAND[i], 1]] : [[LAND[i], 1], [LAND[i + 1], u]]; break; }
    var sunU = (m - r) / (s2 - r), night = m > s2 ? (m - s2) / (r + 1440 - s2) : m < r ? (m + 1440 - s2) / (r + 1440 - s2) : -1;
    var phase = st > .8 ? 'night' : m < 720 && st > .05 ? 'dawn' : st > .05 || (m > s2 - 40 && m < s2 + 90) ? 'dusk' : 'day';
    return { c: c, land: land, stars: st, sun: sunU > -0.08 && sunU < 1.08 ? sunU : null, moon: night >= 0 ? night : null, phase: phase, warm: Math.max(0, 1 - Math.abs(sunU < .5 ? sunU : 1 - sunU) * 6) };
  };
  // A real soil cross-section (grass fringe, loam, stones, roots), dimmed after dark. With clip, only a slice of it is drawn:
  // laid over the base of a plant, it makes the stem or trunk go down into the ground instead of standing on top of it.
  var soilN = 0;
  K.soilLayer = function (x0, y0, w, h, GY, S, clip) {
    var BG = window.KZ_BG; if (!BG || !BG.soil) return ''; S = S || K.sky();
    var art = (window.KZ_ART || '/art/') + 'bg/', sw = w + 4, sh = Math.max(sw * BG.soil[1] / BG.soil[0], (y0 + h - GY + 12) / 0.9), sy = GY + 2 - sh * 0.095, o = '', cid = '';
    if (clip) { cid = 'kzsc' + (++soilN); o += '<clipPath id="' + cid + '"><path d="M' + (clip[0]).toFixed(1) + ' ' + (GY + 2.6).toFixed(1) + ' Q ' + ((clip[0] + clip[1]) / 2).toFixed(1) + ' ' + (GY + 0.8).toFixed(1) + ' ' + clip[1].toFixed(1) + ' ' + (GY + 2.6).toFixed(1) + ' V ' + (GY + 80).toFixed(1) + ' H ' + clip[0].toFixed(1) + ' Z"/></clipPath><g clip-path="url(#' + cid + ')">'; }
    var simg = '<image class="kz-soil" href="' + art + 'soil.webp" x="' + (x0 - 2).toFixed(1) + '" y="' + sy.toFixed(1) + '" width="' + sw.toFixed(1) + '" height="' + sh.toFixed(1) + '" preserveAspectRatio="xMidYMin slice"';
    o += simg + '/>';
    if (!clip) o += K.mirrorSides(simg, x0 - 2, sw);
    var dim = S.stars > .8 ? .62 : S.stars * .55 + (S.phase === 'dusk' ? .18 : 0);
    if (dim > .02) o += '<rect x="' + (x0 - 2).toFixed(1) + '" y="' + (GY - 2).toFixed(1) + '" width="' + sw.toFixed(1) + '" height="' + (sh + 400).toFixed(1) + '" fill="#05070F" opacity="' + Math.min(.7, dim).toFixed(2) + '"/>';
    return clip ? o + '</g>' : o;
  };
  // Wide cards show more than the art's width: fill each side with a mirror image of the plate, reflected about its
  // edge, so the meadow and soil run seamlessly to the card's edges instead of stopping short.
  K.mirrorSides = function (img, x, w) {
    // reflected about a line just inside each edge, so the copies overlap by a hair and no light seam shows at small sizes
    return img + ' transform="translate(' + (2 * x + 1.4).toFixed(1) + ',0) scale(-1,1)"/>' + img + ' transform="translate(' + (2 * (x + w) - 1.4).toFixed(1) + ',0) scale(-1,1)"/>';
  };
  K.skySVG = function (id, x0, y0, w, h, GY) {
    var S = K.sky(), c = S.c, o = '<defs><linearGradient id="' + id + 'sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".62" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'sun"><stop offset="0" stop-color="#FFFBE8"/><stop offset=".22" stop-color="' + (S.warm > .4 ? '#FFC35A' : '#FFF4C0') + '"/><stop offset=".3" stop-color="' + (S.warm > .4 ? '#FF9A3D' : '#FFE79A') + '" stop-opacity=".55"/><stop offset="1" stop-color="' + (S.warm > .4 ? '#FF7A2A' : '#FFF2B0') + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 'moon"><stop offset="0" stop-color="#F4F2E8"/><stop offset=".3" stop-color="#E8E6DA"/><stop offset=".34" stop-color="#C8D4F0" stop-opacity=".3"/><stop offset="1" stop-color="#8AA0D8" stop-opacity="0"/></radialGradient></defs>';
    var top = y0 - 400, bot = GY + 6, X0 = x0 - 400, W2 = w + 800;
    o += '<rect class="kz-sky" data-phase="' + S.phase + '" x="' + X0.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + W2.toFixed(1) + '" height="' + (bot - top + 2).toFixed(1) + '" fill="url(#' + id + 'sk)"/>';
    if (S.stars > .05) { var r = function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
      for (var i = 0; i < 46; i++) { var sx = x0 - 40 + r(i) * (w + 80), sy = y0 - 30 + r(i + 99) * (GY - 30 - y0 + 30) * .85; o += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="' + (0.5 + r(i + 7) * 1.1).toFixed(2) + '" fill="#fff" opacity="' + (S.stars * (0.35 + r(i + 3) * 0.65)).toFixed(2) + '"/>'; } }
    var arc = function (u, rad) { var cx = x0 + w * (0.08 + 0.84 * u), cy = GY + 4 - Math.sin(Math.max(0, Math.min(1, u)) * Math.PI) * (GY - y0) * 0.78 + (u < 0 || u > 1 ? rad * 0.7 : 0); return [cx, cy]; };
    var SZ = Math.min(1.2, Math.max(0.5, h / 440)); // sun and moon keep the same size on screen whatever the zoom
    if (S.sun !== null) { var p = arc(S.sun, 30), R2 = (26 + S.warm * 10) * SZ; o += '<circle class="kz-sun" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (R2 * 3.2).toFixed(1) + '" fill="url(#' + id + 'sun)"/>'; }
    if (S.moon !== null && arc(S.moon, 14)[1] < GY - 16) { var q = arc(S.moon, 14); o += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (40 * SZ).toFixed(1) + '" fill="url(#' + id + 'moon)"/><circle cx="' + (q[0] + 4 * SZ).toFixed(1) + '" cy="' + (q[1] - 3 * SZ).toFixed(1) + '" r="' + (10.5 * SZ).toFixed(1) + '" fill="' + c[0] + '" opacity=".55"/>'; }
    var BG = window.KZ_BG, art = (window.KZ_ART || '/art/') + 'bg/';
    if (BG && BG.land) { // realistic hills, tree lines and haze; their bottom tucks under the mound
      var lw = W2 > w + 400 ? w + 4 : w + 4, lh = lw * BG.land[1] / BG.land[0], lx = x0 - 2, ly = GY + 3 - lh;
      S.land.forEach(function (L) { var im = '<image class="kz-land" href="' + art + 'land_' + L[0] + '.webp" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" width="' + lw.toFixed(1) + '" height="' + lh.toFixed(1) + '" preserveAspectRatio="none"' + (L[1] < 1 ? ' opacity="' + L[1].toFixed(2) + '"' : ''); o += im + '/>' + K.mirrorSides(im, lx, lw); });
    }
    // the ground under the mound: the same soil, getting darker with depth (no separate band)
    o += '<defs><linearGradient id="' + id + 'deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33251A"/><stop offset=".35" stop-color="#2A1F15"/><stop offset=".7" stop-color="#1F170F"/><stop offset="1" stop-color="#16100A"/></linearGradient></defs>';
    o += '<rect x="' + X0.toFixed(1) + '" y="' + (GY + 2).toFixed(1) + '" width="' + W2.toFixed(1) + '" height="320" fill="url(#' + id + 'deep)"/><rect x="' + X0.toFixed(1) + '" y="' + (GY + 321).toFixed(1) + '" width="' + W2.toFixed(1) + '" height="900" fill="#16100A"/>';
    if (BG && BG.soil) o += K.soilLayer(x0, y0, w, h, GY, S);
    return '<g class="kz-skyg">' + o + '</g>';
  };
  // Oct 21 (9pm) water model: water = how much of your long-term goals you finished.
  // It is safe overnight until WATER_SAFE_UNTIL (8am), then sinks toward what you've checked off today,
  // reaching it WATER_DRAIN_HOURS later (8pm). Checking goals off raises it right away; all done = 100%.
  K.WATER_SAFE_UNTIL = 8; K.WATER_DRAIN_HOURS = 12;
  K.waterStep = function (w, r, p) { var t = r * 100; if (r >= 1) return 100; if (t > w) return w + (t - w) * 0.55; return w + (t - w) * p; };
  K.treeHealth = function () {
    var done = K.get('done', {}) || {}, goals = K.allGoals(), today = K.today(), tk = K.key(today);
    var due = function (k) { return goals.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); }); };
    var rate = function (k) { var d = due(k); if (!d.length) return null; return d.filter(function (g) { return done[g.id] && done[g.id][k]; }).length / d.length; };
    var dueT = due(tk), doneT = dueT.filter(function (g) { return done[g.id] && done[g.id][tk]; }).length, rT = dueT.length ? doneT / dueT.length : null;
    var all = {}; for (var id in done) for (var d in (done[id] || {})) all[d] = 1;
    var list = Object.keys(all).sort(), steps = list.length;
    // No water until your first check-off. From that first day on, each day moves it 30% of the way to that day's rate.
    var W = 0, first = list.length && list[0] < K.key(today) ? list[0] : null, from = first ? new Date(first + 'T00:00:00') : today, floor = K.addDays(today, -150); if (from < floor) from = floor;
    var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (k) { rest[k] = 1; }); // shield days are rest days: no water lost
    for (var day = from, guard = 0, seeded = false; day < today && guard < 200; day = K.addDays(day, 1), guard++) { if (rest[K.key(day)]) continue; var r = rate(K.key(day)); if (r === null) continue; if (!seeded) { W = r * 100; seeded = true; } else W = K.waterStep(W, r, 1); }
    var yW = Math.round(W);
    var nowD = new Date(), hr = nowD.getHours() + nowD.getMinutes() / 60, drainP = Math.max(0, Math.min(1, (hr - K.WATER_SAFE_UNTIL) / K.WATER_DRAIN_HOURS));
    if (rT !== null) W = seeded ? K.waterStep(W, rT, drainP) : rT * 100; // first day: water = what you did
    var water = Math.round(W), energy = water;
    var wInfo = { safe: hr < K.WATER_SAFE_UNTIL, drainP: drainP, target: rT === null ? null : Math.round(rT * 100), left: dueT.length - doneT, carried: yW };
    var missed = 0;
    if (list.length) { var cur = new Date(list[0] + 'T00:00:00'), end = K.addDays(today, -1); while (cur <= end) { if (!all[K.key(cur)] && !rest[K.key(cur)]) missed++; cur = K.addDays(cur, 1); } }
    var since = list.length ? Math.round((today - new Date(list[list.length - 1] + 'T00:00:00')) / 864e5) : 0;
    var stress = K.get('treestress', 0) || 0;
    var status = !steps && !goals.length ? 'seed' : water >= 60 ? 'healthy' : water >= 40 ? 'thirsty' : water >= 25 ? 'wilting' : (water > 3 || since < 7) ? 'dying' : 'dead';
    if (!steps && goals.length) status = 'thirsty'; // planted, waiting for its first water
    if (steps && list.length <= 3 && (status === 'dying' || status === 'dead' || status === 'wilting')) status = 'thirsty'; // a brand-new tree gets a few days before it can look sick
    return { water: water, yWater: yW, energy: energy, wInfo: wInfo, rToday: rT, todayDone: doneT, todayDue: dueT.length, missed: missed, stress: stress, factor: Math.pow(0.99, missed) * Math.pow(0.98, stress), since: since, status: status, fresh: !steps,
      vitality: status === 'seed' || !steps ? 0.7 : Math.max(list.length <= 3 ? 0.55 : 0, Math.min(1, (water - 15) / 55)) };
  };
  K.treeMood = function (h) {
    var n = K.treeName();
    if (h.status === 'seed') return n + ' is a seed, waiting for the first completed goal.';
    if (h.fresh) return n + ' is waiting for its first water. Check off a goal.';
    if (h.status === 'healthy') return h.water >= 85 ? n + ' is thriving.' : n + ' is reaching for the sun.';
    return { thirsty: n + ' is thirsty.', wilting: n + '’s leaves are curling.', dying: n + ' is hanging on.', dead: n + ' lost its leaves. One step brings it back.' }[h.status];
  };
  // Growth is measured in days of care: each day adds (goals completed ÷ goals due). A perfect day = 1 growth day = 1 inch.
  // Same speed whether someone has 1 goal or 8. Penalties (1% per day with nothing done, 2% per edit) apply to the total.
  // Oct 21: growth multiplier = that day's plan multiplier (x1 with no plan; climbs as plan tasks get checked off, up to the plan's cap)
  K.growMult = function (k) { try { if (!K.planCap) return 1; var all = K._getRO ? K._getRO('plans', {}) : K.get('plans', {}), p = all && all[k], it = p && p.items || [], n = it.length; if (!n || n < (K.PLAN_MIN || 2)) return 1; var d = it.filter(function (x) { return x.done; }).length, cap = K.planCap(n), m = Math.round((1 + (cap - 1) * d / n) * 10) / 10; return m > 1 ? m : 1; } catch (e) { return 1; } }; /* Oct 22: same math as planStats, read-only and fast */
  K.treeGrowth = function () {
    var done = K.get('done', {}), goals = K.allGoals(), start = null, id, d;
    goals.forEach(function (g) { if (g.created && (!start || g.created < start)) start = g.created; });
    for (id in done) for (d in (done[id] || {})) if (!start || d < start) start = d;
    var o = { G0: 0, today: 0, week: 0 }; if (!start || !goals.length) return o;
    var end = K.today(), tk = K.key(end), wk = K.key(K.addDays(end, -6)), day = new Date(start.slice(0, 10) + 'T00:00:00'), guard = 0;
    while (day <= end && guard++ < 40000) {
      var k = K.key(day), due = 0, cnt = 0;
      goals.forEach(function (g) { if ((!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived)) due++; if (done[g.id] && done[g.id][k]) cnt++; });
      var r = cnt ? Math.min(1, cnt / Math.max(due, cnt)) : 0;
      if (r && K.growMult) r *= K.growMult(k); // Oct 21: the day plan's multiplier multiplies that day's growth (replaces the small flat bonus)
      o.G0 += r; if (k >= wk) o.week += r; if (k === tk) o.today = r;
      day = K.addDays(day, 1);
    }
    return o;
  };
  // Long, never-ending progression, in days of perfect care.
  var STAGES = [[0, 'Seed'], [0.01, 'Sprout'], [7, 'Seedling'], [30, 'Sapling'], [90, 'Young tree'], [180, 'Tree'], [365, 'Mature tree'], [730, 'Mighty tree'], [1825, 'Ancient tree'], [3650, 'Elder tree'], [7300, 'World tree']];
  K.TREE_STAGES = STAGES;
  K.treeStage = function (G) { var n = 'Seed'; STAGES.forEach(function (x) { if (G >= x[0]) n = x[1]; }); return n; };
  K.treeRings = function (G) { return Math.floor(G / 365); };
  K.treeNext = function (G) {
    for (var i = 2; i < STAGES.length; i++) if (G < STAGES[i][0]) return { at: STAGES[i][0], left: Math.ceil(STAGES[i][0] - G), label: STAGES[i][1] };
    var r = K.treeRings(G) + 1; return { at: r * 365, left: Math.ceil(r * 365 - G), label: 'growth ring ' + r };
  };
  // How big it looks: quick, visible change every day in the first weeks, slower every month, still growing at 20 years and beyond.
  var VA = [[0, 0], [1, 1], [3, 2], [7, 4], [14, 7], [30, 14], [60, 28], [90, 40], [180, 100], [365, 200], [730, 365], [1825, 1000], [3650, 2500], [7300, 5000]];
  K.treeVisual = function (G) {
    if (G <= 0) return 0;
    for (var i = 1; i < VA.length; i++) if (G <= VA[i][0]) { var a = VA[i - 1], b = VA[i]; return a[1] + (b[1] - a[1]) * (G - a[0]) / (b[0] - a[0]); }
    return 5000 * G / 7300;
  };
  K.treeHeight = function (G) {
    if (G < 12) { var v = Math.round(G * 10) / 10; return (v % 1 ? v.toFixed(1) : String(v)) + (v === 1 ? ' inch' : ' inches'); }
    var S = Math.round(G), f = Math.floor(S / 12), i = S % 12; return f + (f === 1 ? ' foot' : ' feet') + (i ? ' ' + i + ' in' : '');
  };
  K.treeInches = function (x) { var v = Math.round(x * 10) / 10; return (v % 1 ? v.toFixed(1) : String(v)) + ' in'; };
  K.treeWeek = function () { return K.treeGrowth().week; };
  // ---------- Calendar data: one day, one week ----------
  // grew = at least one goal completed (tree grew); setback = a past day after the first completed goal with nothing done (tree lost 1%).
  K._getRO = K._getRO || function (k, d) { return K.get(k, d); }; K._rover = K._rover || function () { return 0; };
  K._allRO = function () { var c = K._agc; if (c && c.v === K._rover()) return c.g; var g = K.allGoals(); K._agc = { v: K._rover(), g: g }; return g; };
  K.firstStepDay = function () { var c = K._fsd; if (c && c.v === K._rover()) return c.f; var done = K._getRO('done', {}) || {}, f = null; for (var id in done) for (var d in (done[id] || {})) if (!f || d < f) f = d; K._fsd = { v: K._rover(), f: f }; return f; };
  K.dayInfo = function (k, first) {
    var done = K._getRO('done', {}) || {}, tk = K.key(K.today()); first = first === undefined ? K.firstStepDay() : first;
    var AG = K._allRO(); var due = AG.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); });
    var hit = AG.filter(function (g) { return done[g.id] && done[g.id][k]; });
    var rate = hit.length ? Math.min(1, hit.length / Math.max(due.length, hit.length)) : 0;
    // Oct 21: gold (full) = every goal done; green (grew) = water ended above 50%; red (setback) = 50% or below
    var wd = K.waterByDay ? K.waterByDay()[k] : undefined;
    var status = k > tk ? 'future' : (hit.length && rate >= 1) ? 'full' : (wd === undefined || !due.length) ? (k === tk ? 'today' : 'none') : wd > 50 ? 'grew' : 'setback';
    return { key: k, due: due.length, hit: hit, rate: rate, water: wd, status: status, journal: (K._getRO('journal', {}) || {})[k] || '' };
  };
  // Water at the end of each day (today = right now), same rules as the tree's water
  K.waterByDay = function () {
    var now = Date.now(); if (K._wbd && now - K._wbdAt < 1500) return K._wbd; if (K._wbdBusy) return {};
    K._wbdBusy = true;
    try {
      var done = K.get('done', {}) || {}, goals = K.allGoals(), today = K.today(), tk = K.key(today), out = {};
      var due = function (k) { return goals.filter(function (g) { return (!g.created || g.created.slice(0, 10) <= k) && (!g.archived || k < g.archived); }); };
      var rate = function (k) { var d = due(k); if (!d.length) return null; return d.filter(function (g) { return done[g.id] && done[g.id][k]; }).length / d.length; };
      var all = {}; for (var id in done) for (var d in (done[id] || {})) all[d] = 1; var list = Object.keys(all).sort();
      if (list.length) {
        var rest = {}; ((K.streakInfo ? K.streakInfo() : {}).protectedDays || []).forEach(function (x) { rest[x] = 1; });
        var W = 0, seeded = false, day = new Date(list[0] + 'T00:00:00'), floor = K.addDays(today, -150); if (day < floor) day = floor;
        for (var g2 = 0; day < today && g2 < 200; day = K.addDays(day, 1), g2++) { var dk = K.key(day); if (rest[dk]) { if (seeded) out[dk] = Math.round(W); continue; } var r = rate(dk); if (r === null) continue; if (!seeded) { W = r * 100; seeded = true; } else W = K.waterStep(W, r, 1); out[dk] = Math.round(W); }
        out[tk] = K.treeHealth().water;
      }
      K._wbd = out; K._wbdAt = now; return out;
    } finally { K._wbdBusy = false; }
  };
  K.weekRecap = function (end) { // the 7 days ending on `end` (a Date)
    var days = [], steps = 0, d = K.get('done', {}), rate = K.get('rate', {}), journal = K.get('journal', {}), i, best = null;
    for (i = 6; i >= 0; i--) days.push(K.key(K.addDays(end, -i)));
    var shown = days.filter(function (k) { return K.showedUp(k); }).length;
    days.forEach(function (k) { for (var id in d) if (d[id] && d[id][k]) steps++; });
    days.forEach(function (k) { var j = journal[k]; if (!j) return; var sc = (rate[k] || 0) * 1000 + j.length; if (!best || sc > best.sc) best = { k: k, j: j, sc: sc }; });
    var q = best && window.KZQ ? (window.KZQ.all || []).filter(function (x) { return x.d === best.k; })[0] : null;
    return { from: days[0], to: days[6], shown: shown, steps: steps, best: best ? { k: best.k, a: best.j, q: q && q.n ? q.n : '' } : null };
  };

  var rnd = function (s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  var f1 = function (n) { return (Math.round(n * 10) / 10).toString(); };
  var ease = function (x, k) { return 1 - Math.exp(-x / k); };
  var mix = function (a, b, t) { t = Math.max(0, Math.min(1, t)); var p = function (h, i) { return parseInt(h.slice(1 + i * 2, 3 + i * 2), 16); }; return '#' + [0, 1, 2].map(function (i) { return ('0' + Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16)).slice(-2); }).join(''); };
  var SHAPES = {
    lance: 'M0 -1.3 C0.55 -0.85 0.62 0.45 0 1.3 C-0.62 0.45 -0.55 -0.85 0 -1.3Z',
    oak: 'M0 -1.3 C.3 -1.15 .55 -1 .42 -.74 C.75 -.66 .82 -.34 .5 -.22 C.84 -.08 .8 .3 .46 .36 C.62 .64 .36 .92 0 1.3 C-.36 .92 -.62 .64 -.46 .36 C-.8 .3 -.84 -.08 -.5 -.22 C-.82 -.34 -.75 -.66 -.42 -.74 C-.55 -1 -.3 -1.15 0 -1.3Z',
    maple: 'M0 -1.35 L.22 -.62 L.82 -.9 L.6 -.24 L1.15 .02 L.5 .24 L.56 .86 L0 .46 L-.56 .86 L-.5 .24 L-1.15 .02 L-.6 -.24 L-.82 -.9 L-.22 -.62Z',
    fan: 'M0 1.15 L-1.2 -.72 C-.7 -1.32 .7 -1.32 1.2 -.72Z',
    petal: 'M0 -1.1 C1.2 -1.35 1.35 .4 0 1.1 C-1.35 .4 -1.2 -1.35 0 -1.1Z',
    needle: 'M0 1.3 L-.56 -1.25 L-.42 -1.3 L-.02 .82 L-.07 -1.45 L.07 -1.45 L.02 .82 L.42 -1.3 L.56 -1.25Z'
  };
  var uid = 0;
  // Each species grows its own silhouette, not just its own colors.
  // h/w: trunk height/width · ang: branch angle [base, change up the trunk] in degrees · len: branch length
  // at: where branches leave the trunk [low, high] · crown: crown layout · cw: crown width · flat: squashes leaf clusters into pads
  K.TREE_FORMS = {
    oak:       { h: 1.0,  w: 1.2,  ang: [62, -20], len: 1.12, crown: 'round', cw: 1.2 },
    birch:     { h: 1.2,  w: 0.72, ang: [32, -8],  len: 0.82, crown: 'oval', cw: 0.7, bark: 'birch' },
    emerald:   { h: 0.95, w: 1.05, ang: [68, -18], len: 1.08, crown: 'dome', cw: 1.15, weep: true },
    maple:     { h: 1.05, w: 1.0,  ang: [46, -14], len: 1.0,  crown: 'oval', cw: 1.0 },
    cherry:    { h: 0.72, w: 1.1,  ang: [76, -8],  len: 1.38, at: [0.72, 0.95], crown: 'umbrella', cw: 1.6, flat: 0.68 },
    golden:    { h: 1.22, w: 0.82, ang: [26, -6],  len: 0.78, crown: 'column', cw: 0.6 },
    frost:     { h: 1.15, w: 0.9,  ang: [84, -4],  len: 0.5,  cone: true, coneW: 0.95, flat: 0.55 },
    jade:      { h: 0.95, w: 1.35, ang: [68, -16], len: 1.3,  crown: 'round', cw: 1.5, roots: true },
    midnight:  { h: 0.84, w: 0.95, ang: [70, -10], len: 1.3,  at: [0.66, 0.95], crown: 'umbrella', cw: 1.5, flat: 0.74 },
    inferno:   { h: 0.6,  w: 1.0,  ang: [79, -6],  len: 1.38, at: [0.25, 0.85], crown: 'tiers', cw: 1.45, flat: 0.45 },
    aurora:    { h: 1.1,  w: 1.0,  ang: [86, -4],  len: 0.5,  cone: true, coneW: 1.3, flatTiers: true, flat: 0.42 },
    obsidian:  { h: 1.05, w: 1.25, ang: [62, -18], len: 1.15, crown: 'dome', cw: 1.35 },
    celestial: { h: 1.48, w: 0.88, ang: [40, -10], len: 0.82, at: [0.72, 0.95], crown: 'high', cw: 0.85, bark: 'rainbow' },
    phoenix:   { h: 0.8,  w: 1.05, ang: [77, -8],  len: 1.42, at: [0.7, 0.95], crown: 'umbrella', cw: 1.75, flat: 0.6 },
    voidbloom: { h: 0.82, w: 1.3,  ang: [72, -34], len: 0.92, crown: 'tufts', cw: 0.9, bark: 'twist', gnarl: true, sparse: 0.5, flat: 0.75 }
  };

  // opt: { fresh: pillarId, mini: true, lite: true, species: id, demo: steps-per-pillar }
  K.lifeTree = function (opt) {
    opt = opt || {};
    var spId = opt.species || K.treeSpecies(), SP = K.SPECIES[spId], P = K.PATHS, HL = opt.health || (opt.demo && !opt.real ? { water: 100, vitality: 1, status: 'healthy', factor: 1 } : K.treeHealth());
    var raw = opt.demo ? (function () { var o = {}; P.forEach(function (p) { o[p.id] = opt.demo; }); return o; })() : K.pillarSteps();
    // Size comes from days of care (G); each pillar's branch gets the share of growth its completions earned.
    var GR = opt.demo ? { G0: opt.demo * P.length, today: 0, week: 0 } : (opt.growth || K.treeGrowth());
    var G0 = GR.G0, G = G0 * HL.factor, Gy = Math.max(0, G0 - GR.today) * HL.factor, rawSum = 0; P.forEach(function (p) { rawSum += raw[p.id] || 0; });
    var V = opt.demo ? G0 : K.treeVisual(G), Vy = opt.demo ? V : K.treeVisual(Gy), todayP = {};
    if (!opt.demo && GR.today > 0) { var dn = K.get('done', {}), tk = K.key(K.today()); K.allGoals().forEach(function (g) { if (dn[g.id] && dn[g.id][tk]) { var pid = K.pathOf(g); todayP[pid] = (todayP[pid] || 0) + 1; } }); }
    var S0 = G0 > 0 ? Math.max(V, 0.001) : 0, S = V, steps = {}, stepsY = {};
    P.forEach(function (p) { var sh = rawSum ? (raw[p.id] || 0) / rawSum : 0; steps[p.id] = V * sh; stepsY[p.id] = Vy * sh; });
    var FM = K.TREE_FORMS[spId] || K.TREE_FORMS.oak, FY = FM.flat || 1, ANIM = false; // the tree holds still: redrawing a full-screen tree every frame made taps lag. Life comes from the animals and drifting leaves.
    var LEAFK = 1, dry = 1 - HL.vitality, dead = HL.status === 'dead', lite = (opt.lite ? 0.5 : 1) * (FM.sparse || 1);
    var DRY = ['#E8D58F', '#CDB45A', '#A88A3A', '#7A6428'], BROWN = ['#B88A55', '#94683A', '#6E4A28', '#4A3018'];
    var leafC = SP.leaf.map(function (c, i) { return dry < 0.5 ? mix(c, DRY[i], dry * 2) : mix(DRY[i], BROWN[i], (dry - 0.5) * 2); });
    var massC = SP.mass.map(function (c) { return mix(c, '#24190E', dry); });
    // the tree is lit by the same light as the landscape behind it: moonlit blue at night, dim at dusk, warm at golden hour
    var SKL = (!opt.demo || opt.real) && !opt.nosky ? K.sky() : null, NK = SKL ? Math.min(.6, SKL.stars * .6 + (SKL.phase === 'dusk' ? .14 : 0)) : 0, WM = SKL && SKL.sun !== null && SKL.phase !== 'night' ? SKL.warm * .14 : 0;
    var lit = function (c) { if (WM) c = mix(c, '#E89A50', WM); return NK ? mix(c, '#0C1426', NK) : c; };
    leafC = leafC.map(lit); massC = massC.map(lit);
    var id = 'kzt' + (++uid), W = 360, H = 440, GY = 384, CX = 180, reach = 70;
    var out = [], shadowL = [], back = [], limbs = [], mid = [], front = [], extras = [], fallen = [], dots = [], pts = [];
    var bx0 = CX - 60, bx1 = CX + 60, by0 = GY - 40; var hit = function (x, y, r) { r = r || 0; bx0 = Math.min(bx0, x - r); bx1 = Math.max(bx1, x + r); by0 = Math.min(by0, y - r); };
    var LS = SHAPES[SP.shape];
    var barkTop = (dead ? ['#2A2622', '#6B6258', '#36312C'] : SP.bark).map(lit);
    var defs = '<defs><path id="' + id + 'lf" d="' + LS + '"/><path id="' + id + 'vn" d="M0 -1 L0 1' + (SP.shape === 'lance' || SP.shape === 'oak' ? ' M0 -.3 L.35 -.6 M0 .1 L-.35 -.2 M0 .4 L.32 .15' : '') + '"/>' +
      '<radialGradient id="' + id + 'sky" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="' + (dead ? '#5C6578' : '#E8D9A8') + '" stop-opacity=".08"/><stop offset=".5" stop-color="' + (dead ? '#5C6578' : '#A3A8B0') + '" stop-opacity=".03"/><stop offset="1" stop-color="#06070A" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + barkTop[2] + '"/><stop offset=".28" stop-color="' + barkTop[1] + '"/><stop offset=".62" stop-color="' + mix(barkTop[1], barkTop[0], .45) + '"/><stop offset="1" stop-color="' + barkTop[0] + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + lit('#45321F') + '"/><stop offset=".6" stop-color="' + lit('#3A2A1B') + '"/><stop offset="1" stop-color="' + lit('#33251A') + '"/></linearGradient>' +
      [0, 1, 2].map(function (i) { return '<linearGradient id="' + id + 'l' + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + leafC[i] + '"/><stop offset="1" stop-color="' + leafC[i + 1] + '"/></linearGradient>'; }).join('') +
      '<linearGradient id="' + id + 'lt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + lit(mix(SP.leaf[0], '#FFFFFF', .45)) + '"/><stop offset="1" stop-color="' + lit(mix(SP.leaf[1], '#E8FF9A', .4)) + '"/></linearGradient>' +
      (SP.snow ? '<linearGradient id="' + id + 'snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CFE3F2"/></linearGradient>' : '') +
      '<radialGradient id="' + id + 'sh"><stop offset="0" stop-color="#000" stop-opacity=".9"/><stop offset=".55" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      [1, 2].map(function (i) { return '<radialGradient id="' + id + 'm' + i + '"><stop offset="0" stop-color="' + massC[i] + '"/><stop offset=".6" stop-color="' + massC[i] + '" stop-opacity=".8"/><stop offset="1" stop-color="' + massC[i] + '" stop-opacity="0"/></radialGradient>'; }).join('') +
      // 3D light on every leaf cluster: lit from the upper left, core shadow lower right
      '<radialGradient id="' + id + 'vol" cx=".32" cy=".26" r=".85"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".30"/><stop offset=".38" stop-color="#FFF6D8" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>' +
      // trunk as a cylinder: rim light left, shadow right
      '<linearGradient id="' + id + 'cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".18" stop-color="#FFF2D8" stop-opacity=".22"/><stop offset=".42" stop-color="#FFF2D8" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>' +
      '<radialGradient id="' + id + 'gold"><stop offset="0" stop-color="#D4AF37" stop-opacity=".35"/><stop offset="1" stop-color="#D4AF37" stop-opacity="0"/></radialGradient></defs>';
    out.push('<rect x="-100" y="-100" width="' + (W + 200) + '" height="' + (H + 200) + '" fill="url(#' + id + 'sky)"/>');
    var leaf = function (x, y, sz, rot, shade, cls, vein) {
      return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + Math.round(rot) + ') scale(' + f1(sz) + ')"><use' + (cls ? ' class="' + cls + '"' : '') + ' href="#' + id + 'lf" fill="url(#' + id + 'l' + shade + ')"/>' +
        (vein && SP.shape !== 'petal' ? '<use href="#' + id + 'vn" stroke="' + mix(leafC[3], '#000000', .3) + '" stroke-width=".07" opacity=".6" fill="none"/>' : '') + '</g>';
    };
    var REALBG = !!(window.KZ_BG && (!opt.demo || opt.real) && !opt.nosky); // the rendered soil and meadow replace the drawn mound, pebbles and grass
    var ground = function () {
      if (REALBG) return '<ellipse cx="' + CX + '" cy="' + (GY + 1) + '" rx="' + f1(Math.max(18, reach * 0.35)) + '" ry="4" fill="url(#' + id + 'sh)" opacity=".45"/>';
      var g = '' +
        '<path d="M22 ' + (GY + 16) + ' C 80 ' + (GY - 13) + ', 280 ' + (GY - 13) + ', 338 ' + (GY + 16) + ' Z" fill="url(#' + id + 'soil)"/>' +
        ''; 
      for (var i = 0; i < 9; i++) g += '<ellipse cx="' + f1(60 + rnd(i + 400) * 240) + '" cy="' + f1(GY + 5 + rnd(i + 410) * 7) + '" rx="' + f1(1.6 + rnd(i + 420) * 2.6) + '" ry="' + f1(1.2 + rnd(i + 430) * 1.2) + '" fill="' + lit(mix('#5A4A3A', '#8A7A66', rnd(i + 440))) + '"/>';
      for (i = 0; i < 70; i++) { var gx = 40 + rnd(i + 900) * 280, gh = (5 + rnd(i + 950) * 11) * (0.45 + 0.55 * (1 - dry)), gy = GY + 4 - Math.sin(Math.max(0.03, Math.min(0.97, (gx - 22) / 316)) * Math.PI) * 15 + 7;
        g += '<path d="M' + f1(gx) + ' ' + f1(gy) + ' q ' + f1((rnd(i) - 0.5) * 5) + ' ' + f1(-gh * 0.6) + ' ' + f1((rnd(i + 7) - 0.5) * 7) + ' ' + f1(-gh) + '" stroke="' + lit(mix(['#1E4A2E', '#2C6A44', '#3E8456'][i % 3], '#6B5A33', dry)) + '" stroke-width="' + f1(0.8 + rnd(i + 3) * 0.6) + '" fill="none" stroke-linecap="round"/>'; }
      return g;
    };
    // tapered limb as a filled shape
    var seg = function (x, y, ang, len, w0, w1, bend) {
      var ex = x + Math.sin(ang) * len, ey = y - Math.cos(ang) * len, cx = x + Math.sin(ang - bend) * len * 0.55, cy = y - Math.cos(ang - bend) * len * 0.55;
      var nx = Math.cos(ang), ny = Math.sin(ang);
      var d = 'M' + f1(x - nx * w0 / 2) + ' ' + f1(y - ny * w0 / 2) + ' Q ' + f1(cx - nx * (w0 + w1) / 4) + ' ' + f1(cy - ny * (w0 + w1) / 4) + ' ' + f1(ex - nx * w1 / 2) + ' ' + f1(ey - ny * w1 / 2) +
        ' L' + f1(ex + nx * w1 / 2) + ' ' + f1(ey + ny * w1 / 2) + ' Q ' + f1(cx + nx * (w0 + w1) / 4) + ' ' + f1(cy + ny * (w0 + w1) / 4) + ' ' + f1(x + nx * w0 / 2) + ' ' + f1(y + ny * w0 / 2) + 'Z';
      limbs.push('<path d="' + d + '" fill="url(#' + id + 'bark)"/>');
      if (w0 > 3) limbs.push('<path d="' + d + '" fill="url(#' + id + 'cyl)"/>');
      hit(ex, ey, w0); return { x: ex, y: ey };
    };
    // branches fork 1 to 3 levels deep, bending upward, with side twigs
    var grow = function (x, y, ang, len, w, depth, maxDepth, seed, tips) {
      var e = seg(x, y, ang, len, w, w * 0.62, (rnd(seed) - 0.5) * 0.3 + (ang > 0 ? 0.18 : -0.18));
      if (depth >= maxDepth || len < 9) { tips.push({ x: e.x, y: e.y, w: 1 / (depth + 1) }); return; }
      var n = depth === 0 ? 2 : (rnd(seed + 5) > 0.5 ? 2 : 3);
      for (var i = 0; i < n; i++) {
        var spread = (i - (n - 1) / 2) * (0.5 + rnd(seed + i) * 0.25), up = ang * 0.82;
        grow(e.x, e.y, up + spread, len * (0.6 + rnd(seed + i * 3) * 0.16), w * 0.6, depth + 1, maxDepth, seed * 7 + i * 13, tips);
      }
      var tx = (x + e.x) / 2, ty = (y + e.y) / 2, ta = ang + (rnd(seed + 9) > 0.5 ? 0.7 : -0.7), t2 = seg(tx, ty, ta, len * 0.28, Math.max(0.8, w * 0.28), 0.6, 0.1);
      tips.push({ x: t2.x, y: t2.y, w: 0.25 });
    };
    // a foliage cluster: dark core, sunlit edge from the upper left, individual leaves on top
    var foliage = function (cx, cy, r, count, seed, freshMark, countY) {
      if (count <= 0) return;
      hit(cx, cy, r * 1.1);
      var keep = dead ? 0 : Math.round(count * (1 - Math.max(0, dry - 0.3) * 1.25)), drop = Math.min(30, count - keep);
      if (keep > 2) {
        if (r > 14 && shadowL.length < 14) shadowL.push('<ellipse cx="' + f1(cx + 8) + '" cy="' + f1(GY + 4) + '" rx="' + f1(r * 0.9) + '" ry="' + f1(r * 0.16) + '" fill="url(#' + id + 'sh)" opacity=".35"/>');
        for (var b = 0; b < 5; b++) { var a = b / 5 * Math.PI * 2 + seed, rr = r * (0.42 + 0.22 * rnd(seed + b));
          back.push('<ellipse cx="' + f1(cx + Math.cos(a) * r * 0.48) + '" cy="' + f1(cy + Math.sin(a) * r * 0.36 * FY + 3) + '" rx="' + f1(rr) + '" ry="' + f1(rr * 0.74 * FY) + '" fill="' + massC[0] + '"/>'); }
        mid.push('<ellipse cx="' + f1(cx - r * 0.1) + '" cy="' + f1(cy - r * 0.15) + '" rx="' + f1(r * 0.8) + '" ry="' + f1(r * 0.6 * FY) + '" fill="url(#' + id + 'm1)"/>' +
          '<ellipse cx="' + f1(cx - r * 0.3) + '" cy="' + f1(cy - r * 0.38) + '" rx="' + f1(r * 0.45) + '" ry="' + f1(r * 0.32) + '" fill="url(#' + id + 'm2)" opacity=".7"/>');
      }
      var base = (SP.shape === 'petal' ? 4.4 : SP.shape === 'maple' ? 5.6 : 5.4) * LEAFK;
      if (ANIM && keep > 0) front.push('<g class="kz-rustle" style="transform-origin: ' + f1(cx) + 'px ' + f1(cy + r * 0.6) + 'px; animation-delay: -' + f1(rnd(seed + 91) * 5) + 's; animation-duration: ' + f1(3.6 + rnd(seed + 93) * 2.4) + 's">');
      for (var m = 0; m < keep; m++) {
        var a2 = (seed + m) * 2.39996, r2 = Math.sqrt((m + 0.5) / keep) * r, lx = cx + Math.cos(a2) * r2, ly = cy + Math.sin(a2) * r2 * 0.75 * FY;
        var lit = (cx - lx) / r + (cy - ly) / r, shade = lit > 0.35 ? 0 : lit > -0.45 ? 1 : 2, near = m % 5 === 0 && shade < 2, isNew = freshMark && m === keep - 1, isToday = countY !== undefined && !dry && m >= Math.round(countY * keep / Math.max(1, count));
        front.push(leaf(lx, ly, base * (0.78 + rnd(seed * 3 + m) * 0.5), rnd(seed + m * 7) * 360, isToday ? 't' : shade, isNew ? 'kz-leaf new' : isToday ? 'kz-leaf today' : '', near)); if (shade < 2 && m % 3 === 0) pts.push([lx, ly]);
        if (isNew) front.push('<circle class="kz-leaf-ring" cx="' + f1(lx) + '" cy="' + f1(ly) + '" r="9" fill="none" stroke="' + leafC[0] + '" stroke-width="1.2"/>');
      }
      if (keep > 2 && !opt.mini) front.push('<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(r * 1.08) + '" ry="' + f1(r * 0.84 * FY) + '" fill="url(#' + id + 'vol)" pointer-events="none"/>');
      if (ANIM && keep > 0) front.push('</g>');
      // Snow pine: soft snow resting on top of every cluster
      if (SP.snow && !dead && keep > 2) front.push('<path d="M' + f1(cx - r * 0.85) + ' ' + f1(cy - r * 0.28) + ' Q ' + f1(cx - r * 0.5) + ' ' + f1(cy - r * 0.95) + ' ' + f1(cx) + ' ' + f1(cy - r * 0.82) + ' Q ' + f1(cx + r * 0.55) + ' ' + f1(cy - r * 0.92) + ' ' + f1(cx + r * 0.8) + ' ' + f1(cy - r * 0.3) + ' Q ' + f1(cx) + ' ' + f1(cy - r * 0.5) + ' ' + f1(cx - r * 0.85) + ' ' + f1(cy - r * 0.28) + 'Z" fill="url(#' + id + 'snow)"/>');
      for (var d2 = 0; d2 < drop; d2++) { var fx = cx + (rnd(seed + d2 * 13) - 0.5) * r * 3, fy = GY + 4 - Math.sin(Math.max(0.05, Math.min(0.95, (fx - 22) / 316)) * Math.PI) * 13 + rnd(d2 + seed) * 7;
        if (fx > 34 && fx < 326) fallen.push(leaf(fx, fy, 3.4, rnd(seed + d2) * 360, 2)); }
      if (dry > 0.35 && !dead) for (var fl = 0; fl < 2; fl++) extras.push('<g class="kz-fall" style="animation-delay: ' + f1(rnd(seed + fl) * 6) + 's">' + leaf(cx + (rnd(seed + fl * 5) - 0.5) * r, cy + r * 0.4, 3.6, rnd(seed + fl) * 360, 2) + '</g>');
    };

    out.push(ground());
    if (SP.snow && !REALBG) out.push('<path d="M22 ' + (GY + 16) + ' C 80 ' + (GY - 15) + ', 280 ' + (GY - 15) + ', 338 ' + (GY + 16) + ' Z" fill="#E6F0F8" opacity=".88"/><path d="M40 ' + (GY + 4) + ' C 110 ' + (GY - 9) + ', 250 ' + (GY - 9) + ', 320 ' + (GY + 4) + '" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".7"/>');
    // The seed and the first seedling days, rendered in Blender like the grown tree (when this species has them)
    // Growth must read as one continuous motion: neighbouring renders cross-fade near each boundary (never a pop),
    // and the seedling hands over to the first real-tree render at the same height.
    var xfade = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    var realSmall = function () {
      var TT = window.KZ_TREES && window.KZ_TREES[spId], SM = TT && TT.small; if (!SM || opt.svgTree || S >= 10) return null;
      var nm = S0 === 0 ? 'seed' : S < 1 ? 'sd1' : S < 3 ? 'sd2' : S < 6 ? 'sd3' : 'sd4', it = SM[nm]; if (!it) return null;
      var sh0 = 16 + (S < 1 ? 0.4 + 0.6 * S : S) * 7, Hs = 14 + Math.min(S, 10) * 4;
      var B = { sd1: [0, 1, 'sd2'], sd2: [1, 3, 'sd3'], sd3: [3, 6, 'sd4'], sd4: [6, 10, 's1'] }[nm], fz = 0, nx = null;
      if (B && S0 > 0) { var wv = (nm === 'sd4' ? 0.6 : 0.4) * (B[1] - B[0]); fz = xfade((S - (B[1] - wv)) / wv); nx = B[2]; }
      var lay = (dead ? 'bare' : 'full') + (opt.mini ? '_sm' : ''), RT0 = TT.stages && TT.stages[0];
      var layer = function (Wd, href, H, op) {
        var ztop = Wd[1] + Wd[3], kk = S0 === 0 ? 27 / Wd[2] : H / ztop;
        var b = { ix: CX + Wd[0] * kk, iy: GY + 3 - ztop * kk, iw: Wd[2] * kk, ih: Wd[3] * kk };
        b.box = ' x="' + f1(b.ix) + '" y="' + f1(b.iy) + '" width="' + f1(b.iw) + '" height="' + f1(b.ih) + '"';
        b.svg = '<image href="' + href + '"' + b.box + ' preserveAspectRatio="none"' + ((dead ? 0.55 : 1) * op < 0.999 ? ' opacity="' + ((dead ? 0.55 : 1) * op).toFixed(3) + '"' : '') + '/>';
        return b;
      };
      var A0 = layer(it.world, (window.KZ_ART || '/art/') + 'trees/' + spId + '/' + nm + '_full.webp', Hs, fz > 0 ? 1 - xfade((fz - 0.5) / 0.5) : 1), A1 = null;
      if (fz > 0.001) {
        if (nx === 's1' && RT0) A1 = layer(RT0.world, (window.KZ_ART || '/art/') + 'trees/' + spId + '/s1_' + lay + '.webp', Hs, fz);
        else if (SM[nx]) A1 = layer(SM[nx].world, (window.KZ_ART || '/art/') + 'trees/' + spId + '/' + nx + '_full.webp', Hs, fz);
      }
      var M = A1 && fz > 0.5 ? A1 : A0, box = M.box, o = '<g class="kz-rtree">';
      if (S0 === 0 && !REALBG) o += '<circle cx="' + CX + '" cy="' + (GY - 6) + '" r="24" fill="url(#' + id + 'gold)"/>';   // (the old glow sat under the real soil and showed as a dark box)
      o += A0.svg + (A1 ? A1.svg : '');
      var mh = M.svg.replace(/ opacity="[^"]*"/, '').replace('<image', '<image').replace(/ preserveAspectRatio="none"\/>/, ' preserveAspectRatio="none"/>');
      if (NK > 0.02 || dry > 0.05) o += '<mask id="' + id + 'sm" style="mask-type:alpha" maskUnits="userSpaceOnUse"' + box + '>' + mh + '</mask>' +
        (dry > 0.05 && S0 > 0 ? '<rect' + box + ' fill="' + mix('#C8A848', '#7A5228', dry) + '" opacity="' + Math.min(0.7, dry * 0.9).toFixed(2) + '" mask="url(#' + id + 'sm)"/>' : '') +
        (NK > 0.02 ? '<rect' + box + ' fill="#0C1426" opacity="' + NK.toFixed(2) + '" mask="url(#' + id + 'sm)"/>' : '');
      var ix = Math.min(A0.ix, A1 ? A1.ix : 1e9), iy = Math.min(A0.iy, A1 ? A1.iy : 1e9), iw = Math.max(A0.ix + A0.iw, A1 ? A1.ix + A1.iw : -1e9) - ix;
      hit(ix, iy, 0); hit(ix + iw, iy, 0);
      return { svg: o + '</g>' + (REALBG ? '%%SOIL' + f1(CX - Math.max(12, iw * .56)) + ',' + f1(CX + Math.max(12, iw * .56)) + '%%' : ''), reach: S0 === 0 ? 40 : sh0 + 40, top: iy };
    };
    var RS = realSmall();
    if (RS) { out.push(RS.svg); reach = RS.reach; var sh = GY - RS.top; }
    else if (S0 === 0) {
      out.push('<g><ellipse cx="' + CX + '" cy="' + (GY - 3) + '" rx="14" ry="9.5" fill="#6B4A2A"/><ellipse cx="' + CX + '" cy="' + (GY - 3) + '" rx="14" ry="9.5" fill="url(#' + id + 'cyl)"/>' +
        '<ellipse cx="' + (CX - 4) + '" cy="' + (GY - 7) + '" rx="6" ry="2.8" fill="#C09A68" opacity=".5"/><path d="M' + (CX + 2) + ' ' + (GY - 12) + ' l -2.4 5 l 3.2 2.2" stroke="#F0D57A" stroke-width="1.1" fill="none"/>' +
        '<circle cx="' + CX + '" cy="' + (GY - 8) + '" r="24" fill="url(#' + id + 'gold)"/></g>' +
        (REALBG ? '' : '<path d="M22 ' + (GY + 16) + ' C 80 ' + (GY - 2) + ', 280 ' + (GY - 2) + ', 338 ' + (GY + 16) + ' Z" fill="url(#' + id + 'soil)" opacity=".95"/>'));
      reach = 40;
    } else if (S < 10) {
      var sh = 16 + (S < 1 ? 0.4 + 0.6 * S : S) * 7, top = GY - sh, sx = CX + 3, stem = dead ? '#6B6258' : mix('#5E9E62', '#8A7A40', dry);
      out.push('<path d="M' + CX + ' ' + (GY + 2) + ' C ' + (CX - 5) + ' ' + (GY - sh * 0.4) + ', ' + (CX + 7) + ' ' + (GY - sh * 0.7) + ', ' + sx + ' ' + top + '" stroke="' + stem + '" stroke-width="' + (2.4 + S * 0.4) + '" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (CX - 1) + ' ' + (GY + 2) + ' C ' + (CX - 5) + ' ' + (GY - sh * 0.4) + ', ' + (CX + 5) + ' ' + (GY - sh * 0.7) + ', ' + (sx - 1) + ' ' + top + '" stroke="#CFEFC9" stroke-width=".6" fill="none" opacity=".5"/>');
      if (!dead) {
        out.push('<path d="M' + sx + ' ' + top + ' C ' + (sx - 9) + ' ' + (top - 12) + ', ' + (sx - 25) + ' ' + (top - 5) + ', ' + (sx - 27) + ' ' + (top + 2) + ' C ' + (sx - 18) + ' ' + (top + 7) + ', ' + (sx - 7) + ' ' + (top + 5) + ', ' + sx + ' ' + top + 'Z" fill="url(#' + id + 'l1)"/><path d="M' + sx + ' ' + top + ' Q ' + (sx - 14) + ' ' + (top - 3) + ' ' + (sx - 25) + ' ' + (top + 1) + '" stroke="' + leafC[3] + '" stroke-width=".7" fill="none" opacity=".6"/>');
        out.push('<path d="M' + sx + ' ' + top + ' C ' + (sx + 9) + ' ' + (top - 14) + ', ' + (sx + 25) + ' ' + (top - 9) + ', ' + (sx + 28) + ' ' + (top - 1) + ' C ' + (sx + 18) + ' ' + (top + 6) + ', ' + (sx + 7) + ' ' + (top + 4) + ', ' + sx + ' ' + top + 'Z" fill="url(#' + id + 'l2)"/><path d="M' + sx + ' ' + top + ' Q ' + (sx + 14) + ' ' + (top - 5) + ' ' + (sx + 26) + ' ' + (top - 1) + '" stroke="' + leafC[3] + '" stroke-width=".7" fill="none" opacity=".6"/>');
        var nq = Math.floor(S), gapq = Math.min(6.5, (sh - 16) / Math.max(1, nq)); // true leaves along the stem, newest at the tip
        for (var q = 2; q <= nq; q++) { var td = !opt.demo && q > Vy, ly2 = top + 5 + (nq - q) * gapq, lx2 = CX + 3 * (1 - (ly2 - top) / sh) + (q % 2 ? 5 : -5); out.push(leaf(lx2, ly2, 5.5 + Math.min(q, 6) * 0.7, q % 2 ? 52 : -52, td ? 't' : q % 3, td ? 'kz-leaf today' : '', true)); }
      }
      reach = sh + 40;
    } else {
      LEAFK = 1 + 0.3 * Math.log(1 + Math.max(0, S - 300) / 300) / Math.LN2; var g0 = S - 9, big = Math.log(1 + Math.max(0, S - 300) / 300) / Math.LN2, trunkH = (52 + 172 * ease(g0, 120) + 34 * big) * FM.h, w0 = (6 + 26 * ease(g0, 170) + 7 * big) * FM.w, w1 = Math.max(2, w0 * 0.3), topY = GY - trunkH;
      reach = Math.max(reach, trunkH + 100 * ease(S, 60) + 40 + 30 * big);
      var sway = FM.gnarl ? function (t) { return Math.sin(t * 2.6 + 0.6) * (3 + w0 * 0.22) + Math.sin(t * 7.5 + 1.2) * w0 * 0.32 + t * t * w0 * 0.9; } : function (t) { return Math.sin(t * 2.6 + 0.6) * (3 + w0 * 0.22); };
      var xAt = function (t) { return CX + sway(t); }, yAt = function (t) { return GY - trunkH * t; }, wAt = function (t) { return w0 + (w1 - w0) * Math.pow(t, 0.8); };
      var L = [], R = [];
      for (var i = 0; i <= 24; i++) { var t = i / 24; L.push([xAt(t) - wAt(t) / 2, yAt(t)]); R.push([xAt(t) + wAt(t) / 2, yAt(t)]); }
      var fl = w0 * 1.1;
      var trunk = 'M' + f1(L[0][0] - fl) + ' ' + (GY + 2) + ' Q ' + f1(L[0][0] - 1) + ' ' + f1(GY - 3) + ' ' + f1(L[3][0]) + ' ' + f1(L[3][1]) + L.slice(4).map(function (p) { return ' L' + f1(p[0]) + ' ' + f1(p[1]); }).join('') +
        R.slice(4).reverse().map(function (p) { return ' L' + f1(p[0]) + ' ' + f1(p[1]); }).join('') + ' L' + f1(R[3][0]) + ' ' + f1(R[3][1]) + ' Q ' + f1(R[0][0] + 1) + ' ' + f1(GY - 3) + ' ' + f1(R[0][0] + fl) + ' ' + (GY + 2) + ' Z';
      var roots = ''; for (var r = 0; r < 5; r++) { var side = r % 2 ? -1 : 1, rl = w0 * (1.2 + rnd(r + 60) * 1.3), rx = CX + side * (w0 * 0.25 + r * 1.5);
        roots += '<path d="M' + f1(rx) + ' ' + f1(GY - 2) + ' Q ' + f1(rx + side * rl * 0.5) + ' ' + f1(GY - 1) + ' ' + f1(rx + side * rl) + ' ' + f1(GY + 4 + rnd(r) * 3) + '" stroke="url(#' + id + 'bark)" stroke-width="' + f1(Math.max(1.2, w0 * (0.28 - r * 0.03))) + '" fill="none" stroke-linecap="round"/>'; }
      var n = P.length, allTips = [], want = 0, coneN = 0;
      P.forEach(function (p) { var s = steps[p.id] || 0, b = Math.log(1 + Math.max(0, s - 80) / 120) / Math.LN2; want += Math.min(300, s * 6) * (1 + 0.3 * b); });
      var budget = Math.min(1, 800 / Math.max(1, want)); // keeps the page light on phones however big the tree gets
      P.forEach(function (p, k) {
        var s = steps[p.id] || 0, sY = stepsY[p.id] || 0, AT = FM.at || [0.4, 0.9], f = n === 1 ? (AT[0] + AT[1]) / 2 : AT[0] + (AT[1] - AT[0]) * k / (n - 1), side = k % 2 ? -1 : 1;
        var ax = xAt(f) + side * wAt(f) * 0.3, ay = yAt(f);
        if (!s) { dots.push({ p: p, x: ax + side * 3, y: ay, bud: true }); return; }
        var gr = ease(s, 35), bigP = Math.log(1 + Math.max(0, s - 80) / 120) / Math.LN2, len = (16 + 64 * gr) * (0.6 + 0.4 * Math.min(1, trunkH / 224)) * (1 + 0.2 * bigP) * FM.len, ang = side * (FM.ang[0] + FM.ang[1] * f) * Math.PI / 180;
        var depth = s < 6 ? 1 : s < 25 ? 2 : 3, tips = [];
        grow(ax, ay, ang, len, Math.max(1.6, wAt(f) * (0.42 + 0.3 * gr)), 0, depth, k * 31 + 7, tips);
        var first = tips[0]; var far = function (tp) { return Math.hypot(tp.x - CX, tp.y - topY); }; tips = tips.slice(1).sort(function (a, b) { return far(b) - far(a); }); tips = [first].concat(tips.slice(0, 11)); // at most 10 leaf clusters per branch keeps phones fast
        var ramp = function (v) { return Math.min(1, 0.3 + Math.max(0, v - 10) / 50); }, nl = Math.round(Math.min(300, s * 6) * (1 + 0.3 * bigP) * lite * budget * ramp(S)), nlY = Math.min(nl, Math.round(Math.min(300, sY * 6) * (1 + 0.3 * bigP) * lite * budget * ramp(Vy))), usedY = 0, wsum = tips.reduce(function (a, tp) { return a + tp.w; }, 0), used = 0;
        tips.forEach(function (tp, ti) {
          var cnt = ti === tips.length - 1 ? Math.round(nl - used) : Math.round(nl * tp.w / wsum); used += cnt;
          var cY = ti === tips.length - 1 ? Math.round(nlY - usedY) : Math.round(nlY * tp.w / wsum); usedY += cY;
          if (ti === 0 && todayP[p.id]) cY = Math.min(cY, cnt - Math.min(cnt, todayP[p.id]));
          if (FM.cone) { coneN += cnt; return; }
          var rr = Math.min(32, 9 + Math.sqrt(Math.max(cnt, 1)) * 2.4) * (0.85 + 0.15 * Math.min(1, tp.w * 2)) * (1 + 0.32 * big);
          foliage(tp.x, tp.y - 2, rr, cnt, k * 101 + ti * 17, opt.fresh === p.id && ti === 0, opt.demo || (Vy >= V && !todayP[p.id]) ? undefined : Math.min(cnt, cY));
        });
        dots.push({ p: p, x: tips[0].x, y: tips[0].y - 2 }); allTips = allTips.concat(tips);
      });
      // Fill the gaps between neighbouring branch tips so the crown reads as one canopy, denser as the tree matures.
      if (S >= 30 && allTips.length > 2 && !FM.cone) {
        var oy = topY + 30, ang2 = function (tp) { return Math.atan2(tp.y - oy, tp.x - CX); };
        allTips.sort(function (a, b) { return ang2(a) - ang2(b); });
        var dens = Math.min(1, (S - 20) / 500), fid = 0;
        for (var ti2 = 0; ti2 < allTips.length - 1; ti2++) { var A = allTips[ti2], B = allTips[ti2 + 1], dd = Math.hypot(A.x - B.x, A.y - B.y);
          if (dd < 26 || dd > 120 || fid >= 14) continue;
          var mx = (A.x + B.x) / 2 + (CX - (A.x + B.x) / 2) * 0.12, my = (A.y + B.y) / 2 - 6 - dd * 0.08, fc = Math.round(Math.min(18, (6 + dd * 0.3) * (0.4 + 0.6 * dens)) * lite);
          foliage(mx, my, Math.min(30, 8 + dd * 0.22 + 8 * dens), fc, 4000 + fid++ * 23, false); }
        // close the hole in the middle of the crown, above the trunk
        var hi = allTips.filter(function (tp) { return tp.y < topY; }), minY = Math.min.apply(null, hi.map(function (tp) { return tp.y; }).concat([topY - 20]));
        for (var hc = 0; hc < 3; hc++) { var hy = topY - (topY - minY) * (0.3 + hc * 0.3), hx = xAt(1) + (hc - 1) * 10;
          foliage(hx, hy, Math.min(30, 12 + (topY - minY) * 0.18), Math.round((10 + 16 * dens) * lite), 5000 + hc * 37, false); }
      }
      var cn = Math.round(Math.min(150, S) * lite * Math.max(0.6, budget) * Math.min(1, 0.3 + Math.max(0, S - 10) / 50)), crr = Math.min(24, 8 + Math.sqrt(Math.min(150, S)) * 1.5) + 6 * big;
      var CR = {
        round: [[0, -10, .4, 1], [-0.95, 2, .3, .9], [0.95, 0, .3, .9]],
        oval: [[0, -crr * 1.4, .3, .9], [0, -10, .3, 1], [-0.7, 4, .2, .85], [0.7, 2, .2, .85]],
        dome: [[0, -crr * 0.7, .3, 1], [-1.1, -2, .2, .9], [1.1, -4, .2, .9], [-0.55, -crr * 0.5, .15, .8], [0.55, -crr * 0.55, .15, .8]],
        umbrella: [[0, -6, .24, 1], [-0.75, -2, .2, .95], [0.75, -3, .2, .95], [-1.45, 6, .18, .8], [1.45, 5, .18, .8]],
        column: [[0, -crr * 2.3, .22, .8], [0, -crr * 1.2, .3, .95], [0, -6, .3, 1], [-0.45, 10, .09, .7], [0.45, 10, .09, .7]],
        high: [[0, -crr * 0.5, .4, 1], [-0.8, 4, .3, .85], [0.8, 2, .3, .85]],
        tiers: [[0, -4, .3, 1], [-1.2, 10, .25, .9], [1.2, 8, .25, .9], [0, -crr * 0.9, .2, .75]],
        tufts: [[0.3, -6, .5, .8], [-0.9, 10, .25, .65], [1.1, 14, .25, .6]]
      }[FM.crown || 'round'];
      if (FM.cone) {
        // Conifer: a stack of drooping tiers, widest at the bottom, a spire on top
        var total = coneN + cn, apexY = topY - trunkH * (FM.flatTiers ? 0.12 : 0.24), baseY = GY - trunkH * (FM.flatTiers ? 0.3 : 0.14);
        var nT = Math.max(3, Math.min(FM.flatTiers ? 6 : 9, Math.round(trunkH / (FM.flatTiers ? 40 : 26)))), maxHW = (22 + trunkH * 0.44) * FM.coneW, per = Math.max(4, Math.round(total / nT));
        for (var ci2 = 0; ci2 < nT; ci2++) {
          var u = ci2 / nT, ty = baseY - (baseY - apexY) * u, hw = Math.max(10, maxHW * Math.pow(1 - u, FM.flatTiers ? 0.65 : 1)), tx0 = xAt(Math.min(1, (GY - ty) / trunkH)), th = FM.flatTiers ? 8 : 16 + hw * 0.2;
          if (FM.flatTiers) {
            [-1, 1].forEach(function (sd) { var pc = tx0 + sd * hw * 0.55, pw = hw * 0.5;
              back.push('<ellipse cx="' + f1(pc) + '" cy="' + f1(ty + 3) + '" rx="' + f1(pw) + '" ry="' + f1(7 + hw * 0.05) + '" fill="' + massC[0] + '"/>');
              limbs.push('<path d="M' + f1(tx0) + ' ' + f1(ty + 4) + ' Q ' + f1(tx0 + sd * pw * 0.5) + ' ' + f1(ty) + ' ' + f1(pc + sd * pw * 0.7) + ' ' + f1(ty + 2) + '" stroke="url(#' + id + 'bark)" stroke-width="' + f1(Math.max(1.2, w0 * 0.12)) + '" fill="none" stroke-linecap="round"/>');
              hit(pc - pw, ty, 6); hit(pc + pw, ty, 6);
              var np = Math.max(1, Math.round(pw / 14)); for (var pq = 0; pq < np; pq++) foliage(pc + (np === 1 ? 0 : -0.7 + 1.4 * pq / (np - 1)) * pw, ty - 2, Math.max(8, Math.min(18, pw / np + 6)), Math.round(per / 2 / np), 6000 + ci2 * 41 + pq * 7 + (sd > 0 ? 3 : 0), false); });
            continue;
          }
          back.push('<path d="M' + f1(tx0 - hw) + ' ' + f1(ty + 6) + ' Q ' + f1(tx0 - hw * 0.45) + ' ' + f1(ty - th * 0.55) + ' ' + f1(tx0) + ' ' + f1(ty - th) + ' Q ' + f1(tx0 + hw * 0.45) + ' ' + f1(ty - th * 0.55) + ' ' + f1(tx0 + hw) + ' ' + f1(ty + 6) + ' Q ' + f1(tx0) + ' ' + f1(ty + 13) + ' ' + f1(tx0 - hw) + ' ' + f1(ty + 6) + 'Z" fill="' + massC[0] + '"/>');
          hit(tx0 - hw, ty, 6); hit(tx0 + hw, ty, 6); hit(tx0, ty - th, 6);
          var nc = Math.max(1, Math.round(hw / 15));
          for (var cc = 0; cc < nc; cc++) { var fx2 = nc === 1 ? 0 : -0.78 + 1.56 * cc / (nc - 1); foliage(tx0 + fx2 * hw, ty - th * 0.3 * (1 - Math.abs(fx2)) + Math.abs(fx2) * 5, Math.max(9, Math.min(22, hw / nc + 7)), Math.round(per / nc), 6000 + ci2 * 41 + cc * 7, false); }
        }
        if (!FM.flatTiers) { foliage(xAt(1), apexY + 4, 8, Math.max(4, Math.round(per * 0.25)), 6999, false); limbs.push('<path d="M' + f1(xAt(1)) + ' ' + f1(topY) + ' L' + f1(xAt(1)) + ' ' + f1(apexY - 6) + '" stroke="url(#' + id + 'bark)" stroke-width="' + f1(Math.max(1.4, w1 * 0.6)) + '" stroke-linecap="round"/>'); hit(xAt(1), apexY - 8, 4); }
      } else CR.forEach(function (c, ci) { foliage(xAt(1) + c[0] * crr * FM.cw * (Math.abs(c[0]) > 2 ? 0 : 1) + (Math.abs(c[0]) > 2 ? c[0] : 0), topY + c[1], crr * c[3], Math.round(cn * c[2]), 777 + ci * 41, false); });
      // Weeping willow: long strands hang from the crown and swing in the wind
      if (FM.weep && !dead) {
        var ccx = (bx0 + bx1) / 2, half = Math.max(30, (bx1 - bx0) / 2 - 6), ctop = by0 + 6, cmid = topY + crr * 0.2;
        var ns = Math.min(opt.mini ? 18 : 44, Math.round(14 + S / 4)), hang = trunkH * 0.82;
        for (var si = 0; si < ns; si++) {
          var ux = -1 + 2 * (si + 0.5) / ns, sx0 = ccx + ux * half + (rnd(si + 1300) - 0.5) * 8, sy0 = cmid - (1 - ux * ux) * (cmid - ctop) * 0.55 + (rnd(si + 1310) - 0.5) * 8;
          var sl = hang * (0.5 + rnd(si + 1320) * 0.5) * (0.7 + 0.3 * Math.abs(ux)), out2 = ux * 10;
          var strand = '<path d="M' + f1(sx0) + ' ' + f1(sy0) + ' Q ' + f1(sx0 + out2 * 1.6) + ' ' + f1(sy0 + sl * 0.45) + ' ' + f1(sx0 + out2) + ' ' + f1(sy0 + sl) + '" stroke="' + mix(leafC[2], '#3A2A14', .25) + '" stroke-width="1.1" fill="none"/>';
          for (var sk = 1; sk <= Math.floor(sl / 5.5); sk++) { var tt = sk * 5.5 / sl, lx3 = sx0 + out2 * (2 * (1 - tt) * tt * 1.6 + tt * tt), ly3 = sy0 + sl * tt; strand += leaf(lx3, ly3, 4.4, 180 + (sk % 2 ? 26 : -26), sk % 3, '', false); }
          hit(sx0 + out2, sy0 + sl, 4);
          front.push(ANIM ? '<g class="kz-strand" style="transform-origin: ' + f1(sx0) + 'px ' + f1(sy0) + 'px; animation-delay: -' + f1(rnd(si + 1330) * 4) + 's">' + strand + '</g>' : strand);
        }
      }
      if (!dead && dry < 0.4 && S >= 100) {
        var nfl = Math.min(60, Math.floor((S - 90) / 4)), F = S >= 365 ? SP.fruit : SP.bloom;
        for (var b3 = 0; b3 < nfl && pts.length; b3++) { var pp0 = pts[Math.floor(rnd(b3 + 1200) * pts.length)], tx = pp0[0] + (rnd(b3) - .5) * 3, ty = pp0[1] + (rnd(b3 + 9) - .5) * 3;
          extras.push(S >= 365 ? '<circle cx="' + f1(tx) + '" cy="' + f1(ty) + '" r="2.8" fill="' + F + '"/><circle cx="' + f1(tx - .8) + '" cy="' + f1(ty - .9) + '" r=".9" fill="#fff" opacity=".5"/>'
            : [0, 1, 2, 3, 4].map(function (pp) { var a = pp * 1.2566; return '<circle cx="' + f1(tx + Math.cos(a) * 1.5) + '" cy="' + f1(ty + Math.sin(a) * 1.5) + '" r="1.25" fill="' + F + '" opacity=".95"/>'; }).join('') + '<circle cx="' + f1(tx) + '" cy="' + f1(ty) + '" r=".7" fill="#E9C547"/>'); }
      }
      // A real tree, rendered in Blender (when this species has been rendered): the growth stage nearest its size, scaled to the
      // exact height it has grown to. Thirst browns only the leaves (leaf mask), a dead tree drops them (bare layer), and the same
      // light as the landscape falls on it (tree mask). Birds perch on its real twigs.
      var RT = window.KZ_TREES && window.KZ_TREES[spId] && !opt.svgTree ? window.KZ_TREES[spId].stages : null, RTI = '';
      if (RT && RT.length) {
        var gq = Math.min(1, 0.06 + 0.94 * (1 - Math.exp(-(S - 10) / 330))), si = 0;
        RT.forEach(function (st0, i) { if (st0.g <= gq + 0.001) si = i; });
        var lay = (dead ? 'bare' : 'full') + (opt.mini ? '_sm' : ''); // thumbnails decode ~12x less
        // height: grows on from the seedling's height (54 at day 10) instead of jumping to the sapling's
        var Ht = Math.max(trunkH * 1.25, GY - by0); Ht = 54 + (Ht - 54) * xfade((S - 10) / 16);
        // cross-fade into the next render over the last 40% of each stage, so the shape changes smoothly
        var fz = 0; if (si + 1 < RT.length) { var g0s = RT[si].g, g1s = RT[si + 1].g, wv = 0.4 * (g1s - g0s); fz = xfade((gq - (g1s - wv)) / wv); }
        var rtLayer = function (k, op, sfx) {
          var ST = RT[k], Wd = ST.world, ztop = Wd[1] + Wd[3], kk = Ht / ztop;
          var ix = CX + Wd[0] * kk, iy = GY + 3 - ztop * kk, iw = Wd[2] * kk, ih = Wd[3] * kk, box = ' x="' + f1(ix) + '" y="' + f1(iy) + '" width="' + f1(iw) + '" height="' + f1(ih) + '"';
          var tb = (window.KZ_ART || '/art/') + 'trees/' + spId + '/s' + (k + 1) + '_', o = '<g class="kz-sway kz-rtree"' + (op < 0.999 ? ' opacity="' + op.toFixed(3) + '"' : '') + '><image href="' + tb + lay + '.webp"' + box + ' preserveAspectRatio="none"/>';
          if (!dead && dry > 0.02) o += '<mask id="' + id + 'lm' + sfx + '" style="mask-type:alpha" maskUnits="userSpaceOnUse"' + box + '><image href="' + tb + 'mask' + (opt.mini ? '_sm' : '') + '.webp"' + box + ' preserveAspectRatio="none"/></mask>' +
            '<rect' + box + ' fill="' + (dry < 0.5 ? mix('#D8BE5A', '#B08A3A', dry * 2) : mix('#B08A3A', '#7A5228', (dry - 0.5) * 2)) + '" opacity="' + Math.min(0.72, dry * 0.95).toFixed(2) + '" mask="url(#' + id + 'lm' + sfx + ')"/>';
          if (NK > 0.02 || WM > 0.01) o += '<mask id="' + id + 'tm' + sfx + '" style="mask-type:alpha" maskUnits="userSpaceOnUse"' + box + '><image href="' + tb + lay + '.webp"' + box + ' preserveAspectRatio="none"/></mask>' +
            (WM > 0.01 ? '<rect' + box + ' fill="#E89A50" opacity="' + (WM * 1.4).toFixed(2) + '" mask="url(#' + id + 'tm' + sfx + ')"/>' : '') +
            (NK > 0.02 ? '<rect' + box + ' fill="#0C1426" opacity="' + NK.toFixed(2) + '" mask="url(#' + id + 'tm' + sfx + ')"/>' : '');
          return { svg: o + '</g>', ix: ix, iy: iy, iw: iw, kk: kk };
        };
        var L0 = rtLayer(si, fz > 0 ? 1 - xfade((fz - 0.5) / 0.5) : 1, ''), L1 = fz > 0.001 ? rtLayer(si + 1, fz, 'n') : null, LM = L1 && fz > 0.5 ? L1 : L0;
        RTI = L0.svg + (L1 ? L1.svg : '');
        var iw = Math.max(L0.ix + L0.iw, L1 ? L1.ix + L1.iw : -1e9) - Math.min(L0.ix, L1 ? L1.ix : 1e9);
        RTI += (REALBG ? '%%SOIL' + f1(CX - Math.max(14, iw * 0.14)) + ',' + f1(CX + Math.max(14, iw * 0.14)) + '%%' : '');
        hit(Math.min(L0.ix, L1 ? L1.ix : 1e9), Math.min(L0.iy, L1 ? L1.iy : 1e9), 0); hit(Math.min(L0.ix, L1 ? L1.ix : 1e9) + iw, Math.min(L0.iy, L1 ? L1.iy : 1e9), 0);
        allTips = RT[LM === L1 ? si + 1 : si].perch.map(function (q) { return { x: CX + q[0] * LM.kk, y: GY - q[1] * LM.kk, w: 1 }; });
        dots = []; extras = [];
      }
      if (RTI) out.push(RTI); else
      out.push('<g class="kz-sway">' + back.join('') + limbs.join('') + roots + '<path d="' + trunk + '" fill="url(#' + id + 'bark)"/><path d="' + trunk + '" fill="url(#' + id + 'cyl)"/>' +
        '<path d="M' + f1(xAt(0.05) - w0 * 0.22) + ' ' + f1(yAt(0.05)) + ' Q ' + f1(xAt(0.5) - wAt(0.5) * 0.25) + ' ' + f1(yAt(0.5)) + ' ' + f1(xAt(0.9) - wAt(0.9) * 0.2) + ' ' + f1(yAt(0.9)) + '" stroke="' + mix(barkTop[1], '#FFFFFF', .2) + '" stroke-width="' + f1(Math.max(0.8, w0 * 0.08)) + '" opacity=".35" fill="none"/>' +
        (function () {
          var o = '', bt = FM.bark; if (!bt || dead) return '';
          for (var bi = 0; bi < 18; bi++) { var t3 = 0.06 + bi / 19 * 0.9, bx = xAt(t3), by = yAt(t3), bw = wAt(t3);
            if (bt === 'birch') o += '<path d="M' + f1(bx - bw * (0.15 + rnd(bi + 1500) * 0.3)) + ' ' + f1(by) + ' h' + f1(bw * (0.18 + rnd(bi + 1510) * 0.3)) + '" stroke="#1A1714" stroke-width="' + f1(1 + rnd(bi + 1520) * 1.4) + '" stroke-linecap="round" opacity=".8"/>';
            else if (bt === 'rainbow') o += '<path d="M' + f1(bx - bw * 0.42 + rnd(bi + 1530) * bw * 0.5) + ' ' + f1(by) + ' q' + f1(bw * 0.06) + ' ' + f1(trunkH * 0.04) + ' 0 ' + f1(trunkH * 0.07) + '" stroke="' + ['#3A6AD9', '#E85A9A', '#F5A83B', '#4EC27A', '#9A5AD9'][bi % 5] + '" stroke-width="' + f1(Math.max(1.2, bw * 0.2)) + '" stroke-linecap="round" opacity=".85"/>';
            else if (bt === 'twist') o += '<path d="M' + f1(bx - bw * 0.5) + ' ' + f1(by + 4) + ' Q ' + f1(bx) + ' ' + f1(by - 2) + ' ' + f1(bx + bw * 0.5) + ' ' + f1(by - 9) + '" stroke="#F2E6D2" stroke-width="' + f1(Math.max(0.8, bw * 0.06)) + '" fill="none" opacity=".35"/>';
          }
          return o;
        })() +
        mid.join('') + front.join('') + extras.join('') + '</g>');
    }
    if (HL.water >= 95 && S >= 5 && !dead && !opt.lite && !opt.mini) for (var dw = 0; dw < 7; dw++) out.push('<circle class="kz-dew" style="animation-delay: ' + f1(dw * 0.7) + 's" cx="' + f1(90 + rnd(dw + 70) * 180) + '" cy="' + f1(GY - 40 - rnd(dw + 80) * Math.min(220, reach)) + '" r="1.2" fill="#FFFFFF"/>');
    out.splice(1, 0, shadowL.join(''));
    out.push(fallen.join(''));
    if (!opt.mini && S >= 30) out.push(dots.map(function (o) { return o.bud ? '<ellipse cx="' + f1(o.x) + '" cy="' + f1(o.y) + '" rx="2.4" ry="3.4" fill="' + o.p.c2 + '" opacity=".6"/>' : '<circle cx="' + f1(o.x) + '" cy="' + f1(o.y) + '" r="3.2" fill="' + o.p.c2 + '" opacity=".45"/><circle cx="' + f1(o.x) + '" cy="' + f1(o.y) + '" r="1.8" fill="' + o.p.c1 + '"/>'; }).join(''));
    var needH = GY + 40 - Math.min(by0 - 18, GY - reach), needW = Math.max(CX - bx0, bx1 - CX) * 2 + 24;
    var vbH = Math.max(S0 === 0 ? 220 : 150 + Math.min(70, S * 7), needH, needW * H / W), vbW = vbH * W / H, vb = f1(CX - vbW / 2) + ' ' + f1(GY + 40 - vbH) + ' ' + f1(vbW) + ' ' + f1(vbH);
    for (var oi = 0; oi < out.length; oi++) if (out[oi].indexOf('%%SOIL') > -1) out[oi] = out[oi].replace(/%%SOIL([\d.-]+),([\d.-]+)%%/g, function (m0, a, b) { return K.soilLayer(CX - vbW / 2, GY + 40 - vbH, vbW, vbH, GY, null, [+a, +b]); });
    out[0] = (!opt.demo || opt.real) && !opt.nosky ? K.skySVG(id, CX - vbW / 2, GY + 40 - vbH, vbW, vbH, GY) : '<rect x="' + f1(CX - vbW / 2 - 2) + '" y="' + f1(GY + 38 - vbH) + '" width="' + f1(vbW + 4) + '" height="' + f1(vbH + 4) + '" fill="url(#' + id + 'sky)"/>';
    // ---------- Wildlife: a healthy tree attracts birds and a squirrel; an unhealthy one is left alone ----------
    var A = vbH / 185, wild = { birds: 0, squirrel: false, nest: false }, st = HL.status;
    if (S >= 10 && !opt.lite && !window.KZ_SPRITES && allTips && allTips.length) {
      // by stage (days of care): Sapling 1 bird · Young tree 2 + squirrel · Tree 3 + nest · Mighty 4
      var gd = opt.demo ? G0 : G;
      // Animals you've met (KZ.ANIMALS: robin 21 · squirrel 40 · bluebird 60 · nest 90 · goldfinch 130 · sparrow 180 days of care)
      var met = K.animalsMet && !opt.demo ? K.animalsMet(gd) : null, nb = 0;
      if (met) K.ANIMALS.forEach(function (a) { if (a.bird && met[a.id]) nb++; });
      else nb = gd < 21 ? 0 : gd < 60 ? 1 : gd < 130 ? 2 : gd < 180 ? 3 : 4;
      var sq = met ? met.squirrel : gd >= 40, ne = met ? met.nest : gd >= 90;
      if (st === 'healthy') { wild.birds = Math.min(4, nb); wild.squirrel = !!sq; wild.nest = false; }
      else if (st === 'thirsty' && nb) wild.birds = 1;
    }
    if (wild.birds || wild.squirrel) {
      var BIRDS = (K.birdColors && !opt.demo && K.birdColors().length) ? K.birdColors() : [['#6B4A32', '#E8793A', '#4A3222'], ['#3E6FC4', '#E9A15A', '#284A8A'], ['#B9952A', '#F2D25C', '#2A2A2A'], ['#5A5F6B', '#D9D2C4', '#3A3E48']]; // your rarest birds first
      var perch = allTips.slice().sort(function (a, b) { return a.y - b.y; }), spots = [];
      // spread perches out: pick tips far from the ones already chosen
      for (var pi = 0; pi < perch.length && spots.length < wild.birds; pi++) { var tp = perch[pi]; if (spots.every(function (s2) { return Math.abs(s2.x - tp.x) > 28 * A || Math.abs(s2.y - tp.y) > 22 * A; })) spots.push(tp); }
      var bird = function (c) {
        return '<g class="kz-bird-b"><path d="M-3.4 .2 L-7 -1.1 L-6.6 .4 L-7.2 1.5 Z" fill="' + c[2] + '"/>' +
          '<ellipse cx="0" cy="0" rx="4.1" ry="2.7" fill="' + c[0] + '"/><ellipse cx="1.2" cy=".9" rx="2.7" ry="1.7" fill="' + c[1] + '"/>' +
          '<g class="kz-bird-h"><circle cx="3.5" cy="-1.7" r="2" fill="' + c[0] + '"/><path d="M5.2 -2 L7.2 -1.55 L5.25 -1.05 Z" fill="#E9B44C"/><circle cx="4.1" cy="-2.1" r=".5" fill="#0B0D12"/><circle cx="4.25" cy="-2.25" r=".16" fill="#FFF"/></g>' +
          '<path class="kz-bird-w" d="M-2.6 -.6 Q .2 -2.6 2.2 -.7 Q -.1 .5 -2.6 -.6Z" fill="' + c[2] + '"/>' +
          '<path d="M.3 2.5 L-.1 4 M1.3 2.5 L1.2 4" stroke="#C9A06A" stroke-width=".45" stroke-linecap="round"/></g>';
      };
      var wl = [];
      if (wild.nest && spots.length) { var nt = perch[Math.min(perch.length - 1, Math.floor(perch.length * 0.55))];
        wl.push('<g transform="translate(' + f1(nt.x) + ' ' + f1(nt.y + 2) + ') scale(' + f1(A) + ')"><path d="M-6 0 Q0 6 6 0 Z" fill="#5A3B20"/><path d="M-6.5 -.3 Q0 2 6.5 -.3" stroke="#8A6236" stroke-width="1.2" fill="none"/><path d="M-5 .8 L4 -.6 M-4 -.4 L5 1.2" stroke="#3E2814" stroke-width=".5"/><ellipse cx="-1.4" cy="-.9" rx="1.3" ry="1" fill="#A9D4E8"/><ellipse cx="1.2" cy="-1" rx="1.3" ry="1" fill="#B9DEEE"/></g>'); }
      spots.forEach(function (sp2, bi) {
        var c = BIRDS[bi % BIRDS.length], face = sp2.x < CX ? -1 : 1, x = sp2.x, y = sp2.y - 3.2 * A;
        var fly = bi === 0 && spots.length > 1, to = spots[spots.length - 1], fx = to.x - sp2.x, fy = to.y - sp2.y;
        wl.push('<g transform="translate(' + f1(x) + ' ' + f1(y) + ')"><g class="kz-bird' + (fly ? ' kz-fly' : '') + '" style="animation-delay: ' + f1(bi * 1.7) + 's' + (fly ? '; --fx: ' + f1(fx) + 'px; --fy: ' + f1(fy) + 'px; --mx: ' + f1(fx / 2) + 'px; --my: ' + f1(Math.min(fy, 0) / 2 - 40 * A) + 'px' : '') + '"><g transform="scale(' + f1(A * face) + ' ' + f1(A) + ')">' + bird(c) + '</g></g></g>');
      });
      if (wild.squirrel) {
        var sx = CX + (typeof w0 === 'number' ? w0 : 10) * 0.9 + 8 * A, sy = GY + 1;
        wl.push('<g transform="translate(' + f1(sx) + ' ' + f1(sy) + ')"><g class="kz-squirrel" style="--sx: ' + f1(Math.min(30 * A, vbW * 0.17)) + 'px"><g class="kz-sq-flip"><g transform="scale(' + f1(A) + ')"><g class="kz-sq-hop">' +
          '<path class="kz-sq-tail" d="M-4 -2 C-11 -3 -12 -11 -8 -15 C-5 -18 -1 -16 -2 -13 C-5 -13 -7 -10 -5 -7 C-4 -5 -3 -4 -2 -3 Z" fill="#B0602E"/>' +
          '<path d="M-7.8 -14 C-6 -16.5 -3 -16 -2.6 -13.6" stroke="#D88B52" stroke-width="1" fill="none" opacity=".8"/>' +
          '<ellipse cx="0" cy="-3.6" rx="4.4" ry="3.3" fill="#B86A34"/><ellipse cx="1.4" cy="-2.6" rx="2.2" ry="2" fill="#F1D3B0"/>' +
          '<circle cx="3.9" cy="-6.6" r="2.4" fill="#B86A34"/><path d="M3 -8.6 L3.6 -10.6 L4.6 -8.6 Z" fill="#9A5226"/><circle cx="4.7" cy="-7" r=".55" fill="#0B0D12"/><circle cx="6.2" cy="-6.2" r=".45" fill="#3A2416"/>' +
          '<path d="M2 -.4 L2.6 .2 M-2.6 -.4 L-3.2 .2" stroke="#8A4A22" stroke-width=".9" stroke-linecap="round"/></g></g></g></g></g>');
      }
      out.push('<g class="kz-wild">' + wl.join('') + '</g>');
    }
    if (SP.snow && !opt.lite) { var fl = []; for (var sn = 0; sn < 16; sn++) fl.push('<circle class="kz-snow" style="animation-delay: ' + f1(rnd(sn + 500) * 9) + 's; animation-duration: ' + f1(7 + rnd(sn + 520) * 6) + 's" cx="' + f1(CX - vbW / 2 + rnd(sn + 540) * vbW) + '" cy="' + f1(GY + 40 - vbH) + '" r="' + f1((0.8 + rnd(sn + 560) * 1.2) * A) + '" fill="#FFFFFF" opacity=".85"/>'); out.push('<g style="--fall: ' + f1(vbH) + 'px">' + fl.join('') + '</g>'); }
    // Perches: where a companion can sit (branch tips, highest first; a seedling's top; the ground)
    var perchL = (allTips && allTips.length ? allTips.filter(function (t) { return t.y < GY - 24; }).sort(function (a, b) { return a.y - b.y; }).slice(0, 10) : []);
    if (!perchL.length) perchL = RS ? [{ x: CX + 34, y: GY - 1 }, { x: CX - 40, y: GY - 1 }] : S0 === 0 ? [{ x: CX + 30, y: GY - 1 }] : [{ x: CX + 4, y: GY - Math.max(12, typeof sh === 'number' ? sh : 16) + 2 }, { x: CX + 34, y: GY - 1 }];
    var perchA = perchL.map(function (t) { return f1(t.x) + ',' + f1(t.y); }).join(' ') + '|' + f1(CX + 46) + ',' + f1(GY) + ',' + f1(Math.max(CX - vbW * 0.44, 40)) + ',' + f1(Math.min(CX + vbW * 0.44, 320));
    return { vb: vb, wildlife: wild, perches: perchA, svg: '<svg class="kz-lifetree" data-perch="' + perchA + '" viewBox="' + vb + '" role="img" aria-label="' + K.esc(K.treeName() + ', ' + K.treeStage(G) + ', ' + K.treeHeight(G) + ' tall, ' + HL.water + '% water' + (wild.birds ? ', ' + wild.birds + (wild.birds === 1 ? ' bird' : ' birds') + (wild.squirrel ? ' and a squirrel' : '') + ' living there' : '')) + '">' + defs + out.join('') + '</svg>',
      steps: rawSum, growth: G, raw: G0, lost: G0 - G, today: GR.today, week: GR.week, visual: V, stage: K.treeStage(G), height: K.treeHeight(G), health: HL, perPillar: raw };
  };
})();
/* Oct 24 (speed): the tree's health was recomputed from the full history ~20 times per screen. Same answer until saved data,
   the day, or the minute changes (water drains through the day), so it's reused within that window. Each caller gets its own copy. */
(function () { var K = window.KZ; if (!K || !K.treeHealth || !K._rover || K.treeHealth.__memo) return;
  var raw = K.treeHealth, c = null;
  K.treeHealth = function () {
    if (arguments.length) return raw.apply(this, arguments);
    var v = K._rover(), d = K.key(K.today()), m = Math.floor(Date.now() / 60000);
    if (!c || c.v !== v || c.d !== d || c.m !== m) c = { v: v, d: d, m: m, x: raw() };
    return Object.assign({}, c.x);
  };
  K.treeHealth.__memo = 1;
})();
