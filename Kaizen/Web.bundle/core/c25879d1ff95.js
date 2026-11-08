
(function () {
  var K = window.KZ; if (!K) return;
  var L = {
    health: {
      Movement: [
        { n: 'Run my first 5K', s: 'Jog or walk for 10 minutes', k: 'long' },
        { n: 'Walk 8,000 steps a day', s: 'A 10-minute walk after dinner', k: 'daily' },
        { n: 'Do 50 push-ups in a row', s: 'One set of push-ups before a shower', k: 'long' },
        { n: 'Lift three times a week', s: 'Pack the gym bag the night before', k: 'long' }
      ],
      Food: [
        { n: 'Eat a vegetable with every lunch', s: 'Add one vegetable to lunch', k: 'daily' },
        { n: 'Cook dinner at home most nights', s: 'Pick tomorrow’s dinner before bed', k: 'long' },
        { n: 'Drink water before coffee', s: 'A full glass of water first thing', k: 'daily' },
        { n: 'Cut back on late-night snacks', s: 'Kitchen closes an hour before bed', k: 'daily' }
      ],
      Sleep: [
        { n: 'Sleep 8 hours on weeknights', s: 'In bed by 11', k: 'long' },
        { n: 'Wake up at the same time daily', s: 'Alarm across the room, same time', k: 'daily' },
        { n: 'No screens in bed', s: 'Phone charges outside the bedroom', k: 'daily' },
        { n: 'Build a wind-down routine', s: '10 minutes of no screens before sleep', k: 'long' }
      ],
      Recovery: [
        { n: 'Touch my toes again', s: 'Stretch for 5 minutes after waking up', k: 'long' },
        { n: 'Take one real rest day a week', s: 'Plan this week’s rest day', k: 'long' },
        { n: 'Foam roll after workouts', s: 'Two minutes on the tightest spot', k: 'daily' },
        { n: 'Fix my posture', s: 'Shoulders back, chin tucked for one minute', k: 'daily' }
      ]
    },
    mind: {
      Learning: [
        { n: 'Read 12 books this year', s: 'Read 10 pages before bed', k: 'long' },
        { n: 'Learn conversational Spanish', s: 'One lesson in a language app', k: 'long' },
        { n: 'Learn to code a simple app', s: '15 minutes of a coding tutorial', k: 'long' },
        { n: 'Learn one new thing every day', s: 'Write down one thing learned today', k: 'daily' }
      ],
      Focus: [
        { n: 'Spend less time on my phone', s: 'No phone for the first 30 minutes of the day', k: 'long' },
        { n: 'Do one hour of deep work daily', s: 'Phone in another room for 25 minutes', k: 'daily' },
        { n: 'Finish what I start', s: 'Finish one small thing before starting another', k: 'daily' },
        { n: 'Plan each day the night before', s: 'Write tomorrow’s top three tasks', k: 'daily' }
      ],
      Calm: [
        { n: 'Meditate every day', s: 'Two minutes of slow breathing each morning', k: 'daily' },
        { n: 'Worry less about what others think', s: 'Name one worry and let it go on paper', k: 'long' },
        { n: 'Handle stress better', s: 'Three slow breaths before reacting', k: 'long' },
        { n: 'Spend time outside every day', s: '10 minutes outside, no headphones', k: 'daily' }
      ],
      Reflection: [
        { n: 'Keep a daily journal', s: 'Write three lines about today', k: 'daily' },
        { n: 'Be kinder to myself', s: 'Write one thing done well today', k: 'long' },
        { n: 'Know what I want from life', s: 'Answer the daily question honestly', k: 'long' },
        { n: 'Practice gratitude', s: 'Name three good things before sleep', k: 'daily' }
      ]
    },
    wealth: {
      Saving: [
        { n: 'Save $1,000 emergency fund', s: 'Move $5 into savings', k: 'long' },
        { n: 'Track every dollar for a month', s: 'Write down every purchase today', k: 'long' },
        { n: 'Stop impulse buying', s: 'Wait 24 hours before buying anything over $20', k: 'daily' },
        { n: 'Pay off my credit card', s: 'Check the balance and pay something extra', k: 'long' }
      ],
      Earning: [
        { n: 'Start a side hustle', s: 'Spend 20 minutes building it', k: 'long' },
        { n: 'Make my first $100 online', s: 'Send one message to a possible customer', k: 'long' },
        { n: 'Ask for a raise', s: 'Write down one win at work this week', k: 'long' },
        { n: 'Grow my brand to 1,000 followers', s: 'Post or engage for 15 minutes', k: 'long' }
      ],
      Career: [
        { n: 'Land an internship', s: 'Send one application or one outreach message', k: 'long' },
        { n: 'Build a strong resume', s: 'Improve one line on the resume', k: 'long' },
        { n: 'Grow my network', s: 'Reach out to one person in the field', k: 'long' },
        { n: 'Get better grades this semester', s: 'Review notes for 15 minutes', k: 'long' }
      ],
      Investing: [
        { n: 'Open an investment account', s: 'Read for 10 minutes about index funds', k: 'long' },
        { n: 'Invest every month', s: 'Check the plan and move one small amount', k: 'long' },
        { n: 'Understand how the market works', s: 'Read one page about investing', k: 'long' },
        { n: 'Learn to make a budget', s: 'Fill in one line of a monthly budget', k: 'long' }
      ]
    },
    relationships: {
      Family: [
        { n: 'Call my family every week', s: 'Call or text family for 5 minutes', k: 'long' },
        { n: 'Be closer with my siblings', s: 'Send a sibling something funny', k: 'long' },
        { n: 'Have dinner with family more', s: 'Ask when the next family dinner is', k: 'long' },
        { n: 'Visit my grandparents more', s: 'Send grandma or grandpa a message', k: 'long' }
      ],
      Friends: [
        { n: 'Stay in touch with old friends', s: 'Text one friend not talked to in a while', k: 'long' },
        { n: 'Make one new friend', s: 'Start one conversation with someone new', k: 'long' },
        { n: 'Be a better listener', s: 'Ask a follow-up question before talking', k: 'daily' },
        { n: 'Plan more time with friends', s: 'Suggest one plan for this week', k: 'long' }
      ],
      Partner: [
        { n: 'Be a better partner', s: 'Say one specific thing appreciated today', k: 'long' },
        { n: 'Plan a date every week', s: 'Pick a day and an idea for the next date', k: 'long' },
        { n: 'Argue less, talk more', s: 'Pause and breathe before replying when upset', k: 'daily' },
        { n: 'Put the phone away together', s: 'Phones away for dinner', k: 'daily' }
      ],
      Community: [
        { n: 'Volunteer once a month', s: 'Look up one place to volunteer', k: 'long' },
        { n: 'Do one kind thing a day', s: 'Hold a door, give a compliment, help someone', k: 'daily' },
        { n: 'Join a club or team', s: 'Look up one club and when it meets', k: 'long' },
        { n: 'Cut out drama', s: 'Walk away from one gossip conversation', k: 'daily' }
      ]
    },
    passion: { // shown as "Personal"
      Adventure: [
        { n: 'Ride my dirt bike more', s: 'Check the bike or plan the next ride', k: 'long' },
        { n: 'Go fishing twice a month', s: 'Prep one piece of gear or pick a spot', k: 'long' },
        { n: 'Hike 10 new trails this year', s: 'Look up one new trail', k: 'long' },
        { n: 'Learn to surf or snowboard', s: 'Watch one technique video', k: 'long' }
      ],
      Making: [
        { n: 'Get better at guitar', s: 'Play guitar for 10 minutes', k: 'long' },
        { n: 'Draw or paint every week', s: 'Sketch something for 10 minutes', k: 'long' },
        { n: 'Make content I am proud of', s: 'Write one idea or film one clip', k: 'long' },
        { n: 'Build something with my hands', s: 'Work on the project for 15 minutes', k: 'long' }
      ],
      Collecting: [
        { n: 'Take great care of my reptiles', s: 'Check heat, water and humidity', k: 'daily' },
        { n: 'Set up a new reptile enclosure', s: 'Research or build one part of it', k: 'long' },
        { n: 'Grow my collection', s: 'Spend 10 minutes learning about the next piece', k: 'long' },
        { n: 'Start a plant collection', s: 'Water and check one plant', k: 'daily' }
      ],
      Dreams: [
        { n: 'Make time for hobbies every week', s: '15 minutes on something loved, no phone', k: 'long' },
        { n: 'Try one new thing each month', s: 'Look up one new thing to try', k: 'long' },
        { n: 'Travel somewhere I have never been', s: 'Save $5 or research one place', k: 'long' },
        { n: 'Write down my biggest dream', s: 'Add one line to the plan for it', k: 'long' }
      ]
    }
  };

  // ---------- More ideas (v48): 5 more per category + new categories. Same shape as above. ----------
  var MORE = {
    health: {
      Movement: [['Run a half marathon', 'Run or walk for 20 minutes', 'long'], ['Do a pull-up', 'Hang from a bar for 20 seconds', 'long'], ['Hike a big trail this year', 'Take the stairs everywhere today', 'long'], ['Move every hour at work', 'Stand and stretch once an hour', 'daily'], ['Bike to class or work', 'Check the tires and route tonight', 'long']],
      Food: [['Eat protein at every meal', 'Add one protein to breakfast', 'daily'], ['Meal prep on Sundays', 'Write this week’s grocery list', 'long'], ['Cut down on soda', 'Swap one soda for sparkling water', 'daily'], ['Eat slower and stop at full', 'Put the fork down between bites', 'daily'], ['Learn five healthy recipes', 'Save one recipe to try', 'long']],
      Sleep: [['Fall asleep without my phone', 'Read paper for 10 minutes in bed', 'daily'], ['Stop hitting snooze', 'Feet on the floor at the first alarm', 'daily'], ['Get morning sunlight', 'Five minutes outside after waking up', 'daily'], ['Cut caffeine after 2 pm', 'Last coffee before lunch', 'daily'], ['Nap smarter', 'Set a 20-minute timer for naps', 'daily']],
      Recovery: [['Do yoga twice a week', 'Ten minutes of a yoga video', 'long'], ['Get my mobility back', 'Hip openers for 5 minutes', 'long'], ['Drink enough water', 'Refill the bottle every time it’s empty', 'daily'], ['Take care of my skin', 'Wash face and sunscreen in the morning', 'daily'], ['Book the checkups I’ve skipped', 'Make one appointment call', 'long']],
      Strength: [['Squat my bodyweight', 'Three sets of goblet squats', 'long'], ['Hold a 2-minute plank', 'Plank for as long as I can, once', 'long'], ['Gain 10 pounds of muscle', 'Hit today’s protein and one lift', 'long'], ['Never skip leg day', 'Lunges while the coffee brews', 'daily'], ['Learn proper deadlift form', 'Watch one form video and practice', 'long']]
    },
    mind: {
      Learning: [['Finish an online course', 'One lesson of the course', 'long'], ['Learn to play chess well', 'One chess puzzle', 'daily'], ['Understand investing basics', 'Read one page about investing', 'long'], ['Learn to type faster', 'Five minutes of typing practice', 'daily'], ['Read the news less, books more', 'Swap one scroll for one chapter', 'daily']],
      Focus: [['Get my screen time under 2 hours', 'Delete one time-wasting app for a day', 'long'], ['Single-task my mornings', 'One task, one tab, 25 minutes', 'daily'], ['Keep a clean desk', 'Clear the desk for 2 minutes', 'daily'], ['Stop procrastinating on hard tasks', 'Start the hardest task for 5 minutes', 'daily'], ['Turn off notifications', 'Silence one more app today', 'long']],
      Calm: [['Handle stress better', 'Box breathing for one minute', 'daily'], ['Spend time in nature every week', 'Ten minutes outside without the phone', 'long'], ['Be kinder to myself', 'Write one thing I did well today', 'daily'], ['Cut back on doom scrolling', 'Phone down at the first bad headline', 'daily'], ['Have quiet mornings', 'Five minutes of silence with coffee', 'daily']],
      Reflection: [['Journal every day', 'Three lines about today', 'daily'], ['Know my values', 'Write one thing that matters to me', 'long'], ['Review my week every Sunday', 'Five minutes: wins, misses, next week', 'long'], ['Practice gratitude', 'Write one thing I’m grateful for', 'daily'], ['Write a letter to future me', 'Add one paragraph', 'long']],
      Creativity: [['Write a short story', 'Write 100 words', 'long'], ['Fill a sketchbook', 'One quick sketch', 'daily'], ['Come up with one idea a day', 'Write one idea down', 'daily'], ['Learn to take great photos', 'Take one intentional photo', 'daily'], ['Start a blog or newsletter', 'Draft one paragraph', 'long']]
    },
    wealth: {
      Saving: [['Build a $1,000 emergency fund', 'Move $5 into savings', 'long'], ['Save for a car', 'Skip one purchase and save it', 'long'], ['Stop impulse buying', 'Wait 24 hours before buying', 'daily'], ['Pack lunch instead of buying', 'Pack tomorrow’s lunch tonight', 'daily'], ['Cancel subscriptions I don’t use', 'Check one subscription', 'long']],
      Earning: [['Start a side hustle', '20 minutes on the side project', 'long'], ['Make my first $100 online', 'One step on something that could sell', 'long'], ['Ask for a raise', 'Write down one win from this month', 'long'], ['Sell things I don’t use', 'List one item for sale', 'long'], ['Pick up more shifts', 'Ask about one extra shift', 'long']],
      Career: [['Land an internship', 'Send one application or message', 'long'], ['Build my LinkedIn', 'Improve one section', 'long'], ['Get better at interviews', 'Practice one answer out loud', 'long'], ['Find a mentor', 'Reach out to one person', 'long'], ['Raise my GPA', 'Review notes for 20 minutes', 'long']],
      Investing: [['Open a Roth IRA', 'Read one guide on getting started', 'long'], ['Invest every month', 'Check the plan for this month', 'long'], ['Understand index funds', 'Read one page on index funds', 'long'], ['Track my net worth', 'Update the tracker', 'long'], ['Learn to read a stock chart', 'Study one chart for 10 minutes', 'long']],
      Money: [['Make a budget and stick to it', 'Write down every purchase today', 'daily'], ['Pay off my credit card', 'Pay a little extra this week', 'long'], ['Check my bank balance daily', 'Open the bank app every morning', 'daily'], ['Spend on what matters', 'Ask: do I need it or want it?', 'daily'], ['Learn to do my own taxes', 'Read one page about taxes', 'long']]
    },
    relationships: {
      Family: [['Have dinner with family weekly', 'Text the family to plan dinner', 'long'], ['Call my grandparents', 'Five-minute call', 'long'], ['Be more patient at home', 'Pause before reacting once today', 'daily'], ['Help out around the house', 'Do one chore nobody asked for', 'daily'], ['Learn my family’s story', 'Ask one question about the past', 'long']],
      Friends: [['Make new friends', 'Say hi to one new person', 'long'], ['Reconnect with old friends', 'Message one old friend', 'long'], ['Be the friend who plans things', 'Propose one plan', 'long'], ['Remember birthdays', 'Add one birthday to my calendar', 'long'], ['Show up when friends need me', 'Check on one friend', 'daily']],
      Partner: [['Plan a date every week', 'Plan or suggest one date', 'long'], ['Listen better', 'Ask a follow-up question', 'daily'], ['Say I appreciate them', 'Tell them one thing I appreciate', 'daily'], ['Put my phone down together', 'Phone away during time together', 'daily'], ['Grow together', 'Share one goal with each other', 'long']],
      Community: [['Volunteer once a month', 'Look up one place to volunteer', 'long'], ['Join a club or team', 'Find one club to try', 'long'], ['Be kind to strangers', 'One small kind act', 'daily'], ['Support local businesses', 'Buy one thing local this week', 'long'], ['Mentor someone younger', 'Offer help to one person', 'long']],
      Confidence: [['Speak up more in groups', 'Share one thought out loud', 'daily'], ['Get better at small talk', 'Ask one person about their day', 'daily'], ['Set healthy boundaries', 'Say no to one thing I don’t want', 'daily'], ['Make eye contact', 'Hold eye contact in one conversation', 'daily'], ['Give a speech without fear', 'Practice speaking for 2 minutes', 'long']]
    },
    passion: {
      Adventure: [['Visit 3 new states this year', 'Research one trip', 'long'], ['Go camping', 'Get one piece of gear ready', 'long'], ['Learn to surf', 'Watch one surf lesson', 'long'], ['See a sunrise every month', 'Set an early alarm for this week', 'long'], ['Say yes to new experiences', 'Say yes to one new thing', 'daily']],
      Making: [['Learn guitar', 'Practice for 15 minutes', 'long'], ['Make a short film', 'Film or edit for 15 minutes', 'long'], ['Cook a new dish every week', 'Pick this week’s dish', 'long'], ['Design my own clothing', 'Sketch one design', 'long'], ['Learn to DJ or make beats', '15 minutes in the app', 'long']],
      Collecting: [['Build a record collection', 'Listen to one album start to finish', 'long'], ['Grow a garden', 'Water and check the garden', 'daily'], ['Restore something old', '15 minutes on the project', 'long'], ['Start a sneaker collection', 'Research one pair', 'long'], ['Keep a photo journal', 'Print or save one photo', 'daily']],
      Dreams: [['Write my bucket list', 'Add one item', 'long'], ['Start my own business', 'One step on the business plan', 'long'], ['Live abroad for a while', 'Research one city', 'long'], ['Run a marathon someday', 'Run for 20 minutes', 'long'], ['Build a life I’m proud of', 'Do one thing future me will thank me for', 'daily']],
      Play: [['Get good at a video game', 'One focused practice session', 'long'], ['Play a sport again', 'Find a pickup game or court', 'long'], ['Learn a magic trick', 'Practice one trick for 10 minutes', 'long'], ['Have a weekly game night', 'Invite one person', 'long'], ['Laugh more', 'Watch or read something funny', 'daily']]
    }
  };
  Object.keys(MORE).forEach(function (p) { L[p] = L[p] || {}; Object.keys(MORE[p]).forEach(function (c) { L[p][c] = (L[p][c] || []).concat(MORE[p][c].map(function (x) { return { n: x[0], s: x[1], k: x[2] }; })); }); });
  K.LIBRARY = L;
  // Flat list with pillar and category on each item.
  K.libraryList = function (pillar) {
    var out = [];
    Object.keys(L).forEach(function (p) {
      if (pillar && p !== pillar) return;
      Object.keys(L[p]).forEach(function (c) { L[p][c].forEach(function (g) { out.push({ p: p, c: c, n: g.n, s: g.s, k: g.k }); }); });
    });
    return out;
  };
})();
