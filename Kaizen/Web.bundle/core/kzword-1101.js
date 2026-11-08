/* Nov 1 · Mountains, stage 2: the words. The tree words lived in ~25 older files (several of them hashed bundles that
   can't be edited in place), in screens, sheets, toasts, VoiceOver labels and alt text. This layer rewrites them as they
   appear, before the frame is painted (MutationObserver callbacks run before rendering), so nothing flickers.
   Rules are whole phrases, never single words inside sentences, so a goal or journal entry someone wrote ("Plant a tree",
   "Water the garden") is never touched: inputs, text areas and editable text are skipped, and the bare stage words
   ("Sapling", "Tree") only change when they are the whole label. Numbers follow kzmtn-1101b: 131 ft per check-off. */
(function () {
  var K = window.KZ; if (!K || K.__kzword) return; K.__kzword = 1;
  function pl(n, w) { n = +n; return n + ' ' + w + (n === 1 ? '' : 's'); }
  // stages sat on days 7 / 14 / 30 / 45, the same days as the checkpoints
  var STAGE = { 'Planted': 'At the base', 'Just planted': 'At the base', 'Sprout': 'On the way up', 'Seedling': 'Checkpoint 1', 'Sapling': 'Checkpoint 2',
    'Young tree': 'Checkpoint 3', 'Tree': 'Checkpoint 4', 'Full tree': 'At the top', 'Habit earned': 'Habit earned', 'Mature tree': 'At the top', 'Strong tree': 'At the top',
    'Great tree': 'At the top', 'Ancient tree': 'At the top', 'Elder tree': 'At the top', 'Mighty tree': 'At the top', 'World tree': 'At the top', 'Growing': 'Climbing' };
  var SNAMES = 'Planted|Sprout|Seedling|Sapling|Young tree|Tree|Full tree|Mature tree|Strong tree|Great tree|Ancient tree';
  function stage(s) { var k = s.charAt(0).toUpperCase() + s.slice(1); return STAGE[k] || s; }
  var R = [
    [/^(Tree|Grove|Your trees|Your grove) · Kaizen$/, 'Growth · Kaizen'],
    // numbers first
    [/(\d+) of 66 days grown/g, '$1 of 66 days'],
    [/(\d+) days? grown of 66/g, '$1 of 66 days'],
    [/^days grown of 66$/, 'of 66 days'],
    [/(\d+) days your tree grew/g, function (m, n) { return pl(n, 'day') + ' climbed'; }],
    [/\+\s?1 day grown/g, '+131 ft'],
    [/(\d+) days? grown/g, function (m, n) { return pl(n, 'day') + ' climbed'; }],
    [/^days? grown$/, 'days climbed'], [/^day grown$/, 'day climbed'],
    [new RegExp('\\b(' + SNAMES + ') in (\\d+) days?', 'gi'), function (m, s, n) { return stage(s) + ' in ' + pl(n, 'day'); }],
    [new RegExp('^(' + SNAMES + ') · ', 'i'), function (m, s) { return stage(s) + ' · '; }],
    [new RegExp(' · (' + SNAMES + ')$'), function (m, s) { return ' · ' + stage(s); }],
    [new RegExp('([,:]) (' + SNAMES + ')(,|$)', 'gi'), function (m, p, s, e) { return p + ' ' + stage(s).toLowerCase() + e; }],
    [new RegExp('^(' + SNAMES + '|Elder tree|Mighty tree|World tree)\\.$'), 'At the top.'],
    [/ is fully grown\./g, ' made it to the top.'], [/, fully grown/g, ', at the top'],
    [/every branch got a step/g, 'every area got a step'],
    [/(\S)['’]s tree\b/g, '$1’s mountain'],
    [/Replanting as a different tree stresses it\. It will lose 2% of its height\./, ''],
    [/Your tree and its animals will use it\./, 'Kaizen will use it to greet you.'],
    [/(\d+) of (\d+) trees watered/g, '$1 of $2 goals checked off'],
    [/Trees watered today/g, 'Goals checked off today'],
    [/(\d+) of (\d+) branches growing/g, '$1 of $2 areas moving'],
    [/^(\d+) of (\d+) growing$/, '$1 of $2 areas moving'],
    [/ is your only branch growing/g, ' is the only area moving'],
    // whole sentences
    [/So 66 is the usual, not a promise\. Missing one day didn['’]t undo anyone['’]s progress, which is why your tree never shrinks\. It just waits for you\./,
      'So 66 is the usual, not a promise. Missing one day didn’t undo anyone’s progress, which is why you never slide back down. Your climb just waits for you.'],
    [/Its tree wears a gold badge in your Grove for good\./, 'It stays gold on your Growth tab for good.'],
    [/Every goal you add plants a tree\. Check it off and it grows\. At 66 days, the habit is yours\./, 'Every goal is its own mountain. Each check-off climbs 131 ft. Day 66 is the top, and the habit is yours.'],
    [/Each check-off grows that goal['’]s tree\. Day 66 earns the habit\./, 'Each check-off climbs 131 ft. Day 66 is the top.'],
    [/The tree grows when you do\./, 'Every check-off climbs your mountain.'],
    [/Check it off and your tree gets its first water\./, 'Check it off and you climb your first 131 ft.'],
    [/Your trees keep every day they['’]ve grown\./, 'Your mountains keep every foot you’ve climbed.'],
    [/Archiv(e|ing) keeps every step and leaf\./, 'Archiv$1 keeps every check-off.'],
    [/Its steps and leaves are erased\./, 'Its check-offs are erased.'],
    [/your streak and your tree stay safe/g, 'your streak stays safe'],
    [/Every goal you finish grows your tree\. Pick where it starts\./, 'Every goal is its own mountain. Day 66 is the top.'],
    [/^[A-Z][A-Za-z ]+\. After 66 it keeps growing\. A missed day only pauses it; it never shrinks\.$/, 'After day 66 you can keep climbing. A missed day costs nothing; you never slide back.'],
    [/Tap to pick 2 to 8\. Each one grows its own branch on your tree\./, 'Tap to pick 2 to 8 areas to work on.'],
    [/What do you want to grow in\?/, 'What do you want to get better at?'],
    [/Which branch does it grow\?/, 'Which area is it for?'],
    [/What each branch has grown/, 'Progress in each area'],
    [/Check off goals and your branches grow/, 'Check off goals and each area moves'],
    [/Your branches grew evenly in the last two weeks/, 'Every area moved in the last two weeks'],
    [/Add a goal to a branch and it starts to orbit/, 'Add a goal to an area and it starts to orbit'],
    [/Add a second branch to see balance/, 'Add a second area to see balance'],
    [/Every branch starts empty\. Add one small goal to begin\./, 'Every area starts empty. Add one small goal to begin.'],
    [/Tap a branch to rename, recolor or delete/, 'Tap an area to rename, recolor or delete'],
    [/^Edit branches$/, 'Edit areas'], [/^Done editing branches$/, 'Done editing areas'], [/^Delete branch$/, 'Delete area'], [/^Delete this branch\?$/, 'Delete this area?'],
    [/^Branches$/, 'Areas'], [/^Branch$/, 'Area'], [/^Branch name$/, 'Area name'], [/^New branch name$/, 'New area name'], [/^Grow a new branch$/, 'Add a new area'],
    [/Reset to the 5 starter branches/, 'Reset to the 5 starter areas'], [/That['’]s the most branches there can be/, 'That’s the most areas there can be'],
    [/You['’]re growing in all (\d+) areas\./, 'You’re making progress in all $1 areas.'],
    [/Save your tree, your animals and every journal entry\./, 'Save your goals, your progress and every journal entry.'],
    [/Sign up to save your tree/, 'Sign up to save your progress'],
    [/Your goals and tree are already in it\./, 'Your goals and progress are already in it.'],
    [/journal, tree and reminders/, 'journal and reminders'],
    [/Your tree grows again tomorrow\./, 'You climb again tomorrow.'],
    [/Your tree is thriving\./, 'You’re climbing well.'],
    [/Your tree remembers every one of them\./, 'Every one of them counts.'],
    [/One year\. Your tree is ancient now\./, 'One year. That’s a whole range of mountains.'],
    [/XP unlocks new trees and wildlife\./, 'XP shows how far you’ve come.'],
    [/Your tree now grows with your days, not your goal count\. A fully completed day adds 1 inch\./, ''],
    [/Something just sprouted\./, 'Your first step is done.'],
    // labels
    [/^\+?\s?Plant a new goal$/, function (m) { return (m.charAt(0) === '+' ? '+ ' : '') + 'Start a new goal'; }], [/^Plant a goal$/, 'Start a goal'], [/^Plant it now$/, 'Start it now'], [/^Plant it$/, 'Start it'],
    [/^A new tree$/, 'A new mountain'], [/^New tree$/, 'New mountain'],
    [/^Your grove: /, 'Your mountains: '], [/^Grove$/, 'Growth'], [/^(Your trees|Your grove)$/, 'Your mountains'], [/^(Your|My) tree$/, 'Your mountain'], [/^your tree$/, 'your mountain'],
    [/^Open your tree$/, 'Open your mountain'], [/^This goal['’]s tree$/, 'This goal’s mountain'], [/^Change tree$/, 'Change photo'], [/^Edit tree$/, 'Edit'],
    [/^Kaizen, Tree$/, 'Kaizen, Growth'], [/^Tree type$/, 'Photo'], [/^Name your tree$/, 'Your name'],
    [/ watered today/g, ' checked off today'], [/^Watered$/, 'Checked off'],
    [/^Your tree grew$/, 'Days you climbed'],
    [/^Your tree at the end of /, 'Your progress at the end of '],
    [/^(\d+) trees?$/, ''],
    [new RegExp('^(' + SNAMES + '|Just planted|Growing|Elder tree|Mighty tree|World tree)$'), function (m) { return STAGE[m] || m; }]
  ];
  var BARE = /^(Planted|Sprout|Seedling|Sapling|Young tree|Tree|Full tree|Mature tree|Strong tree|Great tree|Ancient tree|Just planted|Growing)$/;
  var TEST = /tree|grove|grown|grew|sapling|seedling|sprout|plant|leaf|leaves|branch|water|growing|grow in|ancient/i;
  function fix(s, el) {
    if (!s || !TEST.test(s)) return s;
    var t = s.trim(); if (!t) return s;
    // bare stage words only when they are a whole label, never in a name/title someone typed
    if (BARE.test(t) && el && el.closest && el.closest('b, strong, h1, h2, h3, .kz-g1name, [contenteditable], input, textarea, .kz-gname, .kz-name')) return s;
    var o = t; for (var i = 0; i < R.length; i++) { if (R[i][0].global) R[i][0].lastIndex = 0; if (R[i][0].test(o)) { if (R[i][0].global) R[i][0].lastIndex = 0; o = o.replace(R[i][0], R[i][1]); } }
    return o === t ? s : s.replace(t, o);
  }
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/;
  function userText(el) { return !el || SKIP.test(el.tagName) || (el.closest && el.closest('[contenteditable=""], [contenteditable="true"], .kz-jtext, .kz-note-body, .kz-todo-txt')); }
  function textNode(n) { var p = n.parentElement; if (userText(p)) return; var v = n.nodeValue, f = fix(v, p); if (f !== v) n.nodeValue = f; }
  var ATTR = ['aria-label', 'alt', 'title', 'placeholder', 'data-n'];
  function attrs(el) {
    if (!el.getAttribute || userText(el) && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    for (var i = 0; i < ATTR.length; i++) { var v = el.getAttribute(ATTR[i]); if (v) { var f = fix(v, null); if (f !== v) el.setAttribute(ATTR[i], f); } }
  }
  function walk(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 || SKIP.test(root.tagName) && root.tagName !== 'INPUT' && root.tagName !== 'TEXTAREA') { if (root.nodeType === 1) attrs(root); return; }
    attrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) textNode(n);
    var els = root.querySelectorAll('[aria-label], [alt], [title], [placeholder], [data-n]'); for (var i = 0; i < els.length; i++) attrs(els[i]);
  }
  K.mtnWords = fix;
  // weekly recap: the "Your tree grew" cell measured tree inches; it has no meaning on a mountain, so it goes
  function recap() { var g = document.querySelector('#kz-p3-rc .kz-p3-grid'); if (!g) return; [].forEach.call(g.children, function (c) { if (/Days you climbed|Your tree grew/.test(c.textContent)) c.remove(); }); }
  function title() { var t = document.title, f = fix(t, null); if (f !== t) document.title = f; }
  var busy = false;
  var mo = new MutationObserver(function (ms) {
    if (busy) return; busy = true;
    try {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'childList') for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
        else if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') attrs(m.target);
      }
      recap(); title();
    } finally { mo.takeRecords(); busy = false; }
  });
  function start() { walk(document.body); title(); mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
