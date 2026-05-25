// ─── CONFERENCES (must match schoolUrls.js) ─────────────────────────────────
export const CONFERENCES_M = ["All","ACC","ASUN","America East","Atlantic 10","Big East","Big Ten","CAA","Ivy League","MAAC","NEC","Patriot"]
export const CONFERENCES_W = ["All","ACC","ASUN","America East","American","Atlantic 10","Big 12","Big East","Big South","Big Ten","CAA","Ivy League","MAAC","NEC","Patriot"]

// ─── GAMES ──────────────────────────────────────────────────────────────────
export const makeGames = (gender) => [
  { id:1,  status:"live",     period:"Q3 8:42",    conf:"ACC",      away:{name:"Maryland",      rank:1,  score:9,    rec:"8-1"}, home:{name:"Notre Dame",    rank:4,  score:7,    rec:"7-2"}, loc:"Arlotta Stadium · Notre Dame, IN",      gender },
  { id:2,  status:"live",     period:"Q2 3:15",    conf:"Big Ten",  away:{name:"Penn State",    rank:3,  score:5,    rec:"7-1"}, home:{name:"Ohio State",    rank:null,score:3,   rec:"5-4"}, loc:"Selby Stadium · Delaware, OH",          gender },
  { id:3,  status:"final",    period:"FINAL",      conf:"Ivy League",away:{name:"Yale",         rank:8,  score:11,   rec:"6-2"}, home:{name:"Princeton",     rank:12, score:9,    rec:"5-3"}, loc:"Class of 1952 Stadium · Princeton, NJ", gender },
  { id:4,  status:"final",    period:"FINAL/OT",   conf:"ACC",      away:{name:"Virginia",      rank:2,  score:13,   rec:"9-0"}, home:{name:"Duke",          rank:6,  score:12,   rec:"6-3"}, loc:"Koskinen Stadium · Durham, NC",         gender },
  { id:5,  status:"final",    period:"FINAL",      conf:"Patriot",  away:{name:"Lehigh",        rank:null,score:7,   rec:"4-5"}, home:{name:"Army",          rank:null,score:10,  rec:"6-3"}, loc:"Shea Stadium · West Point, NY",         gender },
  { id:6,  status:"upcoming", period:"3:00 PM ET", conf:"CAA",      away:{name:"Towson",        rank:null,score:null,rec:"5-4"}, home:{name:"Drexel",        rank:null,score:null,rec:"4-5"}, loc:"Vidas Field · Philadelphia, PA",        gender },
  { id:7,  status:"upcoming", period:"4:30 PM ET", conf:"Big Ten",  away:{name:"Michigan",      rank:9,  score:null, rec:"6-3"}, home:{name:"Johns Hopkins", rank:5,  score:null, rec:"7-2"}, loc:"Homewood Field · Baltimore, MD",        gender },
  { id:8,  status:"upcoming", period:"7:00 PM ET", conf:"ACC",      away:{name:"Syracuse",      rank:7,  score:null, rec:"7-2"}, home:{name:"North Carolina",rank:10, score:null, rec:"6-3"}, loc:"Dorrance Field · Chapel Hill, NC",      gender },
]

// ─── STANDINGS ───────────────────────────────────────────────────────────────
export const STANDINGS_M = [
  {rank:1, team:"Virginia",      w:9,  l:0, conf:"5-0", streak:"W9"},
  {rank:2, team:"Maryland",      w:8,  l:1, conf:"4-1", streak:"W3"},
  {rank:3, team:"Penn State",    w:7,  l:1, conf:"4-1", streak:"W5"},
  {rank:4, team:"Notre Dame",    w:7,  l:2, conf:"3-2", streak:"L1"},
  {rank:5, team:"Johns Hopkins", w:7,  l:2, conf:"4-1", streak:"W2"},
  {rank:6, team:"Duke",          w:6,  l:3, conf:"3-2", streak:"L1"},
  {rank:7, team:"Syracuse",      w:7,  l:2, conf:"3-2", streak:"W4"},
  {rank:8, team:"Yale",          w:6,  l:2, conf:"4-1", streak:"W1"},
  {rank:9, team:"Michigan",      w:6,  l:3, conf:"3-2", streak:"W2"},
  {rank:10,team:"Cornell",       w:5,  l:3, conf:"3-2", streak:"L2"},
]
export const STANDINGS_W = [
  {rank:1, team:"North Carolina",w:10, l:0, conf:"6-0", streak:"W10"},
  {rank:2, team:"Boston College",w:9,  l:1, conf:"5-1", streak:"W4"},
  {rank:3, team:"Northwestern",  w:8,  l:1, conf:"5-1", streak:"W3"},
  {rank:4, team:"Maryland",      w:8,  l:2, conf:"4-2", streak:"W1"},
  {rank:5, team:"Penn State",    w:7,  l:2, conf:"4-2", streak:"L1"},
  {rank:6, team:"Syracuse",      w:7,  l:3, conf:"3-2", streak:"W2"},
  {rank:7, team:"Florida",       w:6,  l:3, conf:"3-3", streak:"W1"},
  {rank:8, team:"Stony Brook",   w:6,  l:2, conf:"4-1", streak:"W3"},
  {rank:9, team:"Virginia",      w:5,  l:4, conf:"3-3", streak:"L1"},
  {rank:10,team:"James Madison", w:5,  l:3, conf:"3-2", streak:"W2"},
]

// ─── STATS ───────────────────────────────────────────────────────────────────
export const STATS_M = {
  goals: [
    {rank:1, name:"Lyle Thompson",    team:"Virginia",     pos:"ATT", gp:9, g:47, a:18, pts:65, gpg:5.2},
    {rank:2, name:"Connor Martin",    team:"Maryland",     pos:"ATT", gp:9, g:38, a:22, pts:60, gpg:4.2},
    {rank:3, name:"Miles Thompson",   team:"Syracuse",     pos:"MID", gp:9, g:34, a:28, pts:62, gpg:3.8},
    {rank:4, name:"Jeff Teat",        team:"Cornell",      pos:"ATT", gp:8, g:32, a:14, pts:46, gpg:4.0},
    {rank:5, name:"Pat Spencer",      team:"Loyola",       pos:"MID", gp:9, g:30, a:31, pts:61, gpg:3.3},
    {rank:6, name:"Michael Sowers",   team:"Duke",         pos:"ATT", gp:9, g:28, a:20, pts:48, gpg:3.1},
    {rank:7, name:"Mikey Wynne",      team:"Penn State",   pos:"ATT", gp:8, g:27, a:16, pts:43, gpg:3.4},
    {rank:8, name:"TD Ierlan",        team:"Yale",         pos:"MID", gp:8, g:26, a:19, pts:45, gpg:3.3},
    {rank:9, name:"Will Mark",        team:"Hofstra",      pos:"ATT", gp:9, g:25, a:11, pts:36, gpg:2.8},
    {rank:10,name:"Jake Froccaro",    team:"Notre Dame",   pos:"ATT", gp:9, g:24, a:13, pts:37, gpg:2.7},
    {rank:11,name:"Peter Arcaro",     team:"Johns Hopkins",pos:"ATT", gp:9, g:23, a:15, pts:38, gpg:2.6},
    {rank:12,name:"Brennan O'Neill",  team:"Duke",         pos:"ATT", gp:9, g:22, a:17, pts:39, gpg:2.4},
    {rank:13,name:"Chris Gray",       team:"Virginia",     pos:"MID", gp:9, g:21, a:20, pts:41, gpg:2.3},
    {rank:14,name:"Logan Wisnauskas", team:"Maryland",     pos:"ATT", gp:9, g:20, a:18, pts:38, gpg:2.2},
    {rank:15,name:"Michael Kraus",    team:"Virginia",     pos:"ATT", gp:9, g:19, a:22, pts:41, gpg:2.1},
  ],
  assists: [
    {rank:1, name:"Pat Spencer",      team:"Loyola",       pos:"MID", gp:9, g:30, a:31, pts:61, apg:3.4},
    {rank:2, name:"Miles Thompson",   team:"Syracuse",     pos:"MID", gp:9, g:34, a:28, pts:62, apg:3.1},
    {rank:3, name:"Connor Martin",    team:"Maryland",     pos:"ATT", gp:9, g:38, a:22, pts:60, apg:2.4},
    {rank:4, name:"Michael Kraus",    team:"Virginia",     pos:"ATT", gp:9, g:19, a:22, pts:41, apg:2.4},
    {rank:5, name:"Chris Gray",       team:"Virginia",     pos:"MID", gp:9, g:21, a:20, pts:41, apg:2.2},
    {rank:6, name:"Michael Sowers",   team:"Duke",         pos:"ATT", gp:9, g:28, a:20, pts:48, apg:2.2},
    {rank:7, name:"TD Ierlan",        team:"Yale",         pos:"MID", gp:8, g:26, a:19, pts:45, apg:2.4},
    {rank:8, name:"Logan Wisnauskas", team:"Maryland",     pos:"ATT", gp:9, g:20, a:18, pts:38, apg:2.0},
    {rank:9, name:"Lyle Thompson",    team:"Virginia",     pos:"ATT", gp:9, g:47, a:18, pts:65, apg:2.0},
    {rank:10,name:"Brennan O'Neill",  team:"Duke",         pos:"ATT", gp:9, g:22, a:17, pts:39, apg:1.9},
    {rank:11,name:"Mikey Wynne",      team:"Penn State",   pos:"ATT", gp:8, g:27, a:16, pts:43, apg:2.0},
    {rank:12,name:"Peter Arcaro",     team:"Johns Hopkins",pos:"ATT", gp:9, g:23, a:15, pts:38, apg:1.7},
    {rank:13,name:"Jake Froccaro",    team:"Notre Dame",   pos:"ATT", gp:9, g:24, a:13, pts:37, apg:1.4},
    {rank:14,name:"Jeff Teat",        team:"Cornell",      pos:"ATT", gp:8, g:32, a:14, pts:46, apg:1.8},
    {rank:15,name:"Will Mark",        team:"Hofstra",      pos:"ATT", gp:9, g:25, a:11, pts:36, apg:1.2},
  ],
  saves: [
    {rank:1, name:"Tyler Coon",       team:"Army",         pos:"GK",  gp:9, sv:112, ga:54, svpct:".675", gaa:6.0},
    {rank:2, name:"Doug Tuttle",      team:"Penn State",   pos:"GK",  gp:8, sv:98,  ga:44, svpct:".690", gaa:5.5},
    {rank:3, name:"Gunnar Waldt",     team:"Maryland",     pos:"GK",  gp:9, sv:94,  ga:48, svpct:".662", gaa:5.3},
    {rank:4, name:"Jack Sennett",     team:"Notre Dame",   pos:"GK",  gp:9, sv:90,  ga:52, svpct:".634", gaa:5.8},
    {rank:5, name:"Max Adler",        team:"Cornell",      pos:"GK",  gp:8, sv:88,  ga:46, svpct:".657", gaa:5.8},
    {rank:6, name:"Drew Adams",       team:"Yale",         pos:"GK",  gp:8, sv:85,  ga:42, svpct:".669", gaa:5.3},
    {rank:7, name:"Mike Dempsey",     team:"Villanova",    pos:"GK",  gp:9, sv:84,  ga:58, svpct:".591", gaa:6.4},
    {rank:8, name:"Colin Chell",      team:"Virginia",     pos:"GK",  gp:9, sv:82,  ga:40, svpct:".672", gaa:4.4},
    {rank:9, name:"Kyle Mullen",      team:"Rutgers",      pos:"GK",  gp:9, sv:79,  ga:55, svpct:".590", gaa:6.1},
    {rank:10,name:"Noah Cluley",      team:"Syracuse",     pos:"GK",  gp:9, sv:77,  ga:49, svpct:".611", gaa:5.4},
    {rank:11,name:"Owen McElroy",     team:"Harvard",      pos:"GK",  gp:8, sv:74,  ga:44, svpct:".627", gaa:5.5},
    {rank:12,name:"Jack Rowlett",     team:"Princeton",    pos:"GK",  gp:8, sv:71,  ga:48, svpct:".597", gaa:6.0},
    {rank:13,name:"AJ Fiore",         team:"Denver",       pos:"GK",  gp:9, sv:70,  ga:52, svpct:".574", gaa:5.8},
    {rank:14,name:"Liam Entenmann",   team:"Duke",         pos:"GK",  gp:9, sv:68,  ga:45, svpct:".602", gaa:5.0},
    {rank:15,name:"Mark Bice",        team:"Georgetown",   pos:"GK",  gp:8, sv:66,  ga:50, svpct:".569", gaa:6.3},
  ],
}

export const STATS_W = {
  goals: [
    {rank:1, name:"Kayla Treanor",    team:"Syracuse",         pos:"ATT", gp:10, g:52, a:20, pts:72, gpg:5.2},
    {rank:2, name:"Taylor Cummings",  team:"Maryland",         pos:"MID", gp:10, g:44, a:30, pts:74, gpg:4.4},
    {rank:3, name:"Marie McCool",     team:"Northwestern",     pos:"ATT", gp:9,  g:40, a:18, pts:58, gpg:4.4},
    {rank:4, name:"Ally Carey",       team:"North Carolina",   pos:"ATT", gp:10, g:38, a:22, pts:60, gpg:3.8},
    {rank:5, name:"Kenzie Kent",      team:"North Carolina",   pos:"MID", gp:10, g:35, a:28, pts:63, gpg:3.5},
    {rank:6, name:"Hannah Munro",     team:"Boston College",   pos:"ATT", gp:9,  g:33, a:14, pts:47, gpg:3.7},
    {rank:7, name:"Charlotte North",  team:"Boston College",   pos:"ATT", gp:9,  g:32, a:16, pts:48, gpg:3.6},
    {rank:8, name:"Grace Mlinaric",   team:"Penn State",       pos:"ATT", gp:9,  g:30, a:12, pts:42, gpg:3.3},
    {rank:9, name:"Gabby Rosenzweig", team:"Maryland",         pos:"ATT", gp:10, g:28, a:20, pts:48, gpg:2.8},
    {rank:10,name:"Kelsey Onwudiwe",  team:"Florida",          pos:"ATT", gp:9,  g:27, a:10, pts:37, gpg:3.0},
    {rank:11,name:"Shannon Kavanagh", team:"Notre Dame",       pos:"ATT", gp:9,  g:25, a:14, pts:39, gpg:2.8},
    {rank:12,name:"Emma Trenk",       team:"Yale",             pos:"ATT", gp:9,  g:24, a:12, pts:36, gpg:2.7},
    {rank:13,name:"Meg Hanley",       team:"Georgetown",       pos:"MID", gp:9,  g:22, a:18, pts:40, gpg:2.4},
    {rank:14,name:"Emma Gorden",      team:"Northwestern",     pos:"ATT", gp:9,  g:21, a:16, pts:37, gpg:2.3},
    {rank:15,name:"Sophia Palombo",   team:"Virginia",         pos:"ATT", gp:9,  g:20, a:14, pts:34, gpg:2.2},
  ],
  assists: [
    {rank:1, name:"Taylor Cummings",  team:"Maryland",         pos:"MID", gp:10, g:44, a:30, pts:74, apg:3.0},
    {rank:2, name:"Kenzie Kent",      team:"North Carolina",   pos:"MID", gp:10, g:35, a:28, pts:63, apg:2.8},
    {rank:3, name:"Ally Carey",       team:"North Carolina",   pos:"ATT", gp:10, g:38, a:22, pts:60, apg:2.2},
    {rank:4, name:"Kayla Treanor",    team:"Syracuse",         pos:"ATT", gp:10, g:52, a:20, pts:72, apg:2.0},
    {rank:5, name:"Gabby Rosenzweig", team:"Maryland",         pos:"ATT", gp:10, g:28, a:20, pts:48, apg:2.0},
    {rank:6, name:"Meg Hanley",       team:"Georgetown",       pos:"MID", gp:9,  g:22, a:18, pts:40, apg:2.0},
    {rank:7, name:"Charlotte North",  team:"Boston College",   pos:"ATT", gp:9,  g:32, a:16, pts:48, apg:1.8},
    {rank:8, name:"Emma Gorden",      team:"Northwestern",     pos:"ATT", gp:9,  g:21, a:16, pts:37, apg:1.8},
    {rank:9, name:"Sophia Palombo",   team:"Virginia",         pos:"ATT", gp:9,  g:20, a:14, pts:34, apg:1.6},
    {rank:10,name:"Hannah Munro",     team:"Boston College",   pos:"ATT", gp:9,  g:33, a:14, pts:47, apg:1.6},
    {rank:11,name:"Shannon Kavanagh", team:"Notre Dame",       pos:"ATT", gp:9,  g:25, a:14, pts:39, apg:1.6},
    {rank:12,name:"Emma Trenk",       team:"Yale",             pos:"ATT", gp:9,  g:24, a:12, pts:36, apg:1.3},
    {rank:13,name:"Grace Mlinaric",   team:"Penn State",       pos:"ATT", gp:9,  g:30, a:12, pts:42, apg:1.3},
    {rank:14,name:"Kelsey Onwudiwe",  team:"Florida",          pos:"ATT", gp:9,  g:27, a:10, pts:37, apg:1.1},
    {rank:15,name:"Marie McCool",     team:"Northwestern",     pos:"ATT", gp:9,  g:40, a:18, pts:58, apg:2.0},
  ],
  saves: [
    {rank:1, name:"Halle Majorana",   team:"Stony Brook",      pos:"GK",  gp:8,  sv:108, ga:40, svpct:".730", gaa:5.0},
    {rank:2, name:"Megan Levy",       team:"Maryland",         pos:"GK",  gp:10, sv:101, ga:48, svpct:".678", gaa:4.8},
    {rank:3, name:"Carly Murray",     team:"Duke",             pos:"GK",  gp:9,  sv:97,  ga:52, svpct:".651", gaa:5.8},
    {rank:4, name:"Hope Burnham",     team:"Penn State",       pos:"GK",  gp:9,  sv:92,  ga:44, svpct:".676", gaa:4.9},
    {rank:5, name:"Sarah Reeve",      team:"North Carolina",   pos:"GK",  gp:10, sv:89,  ga:38, svpct:".701", gaa:3.8},
    {rank:6, name:"Devon Knapp",      team:"Virginia",         pos:"GK",  gp:9,  sv:85,  ga:46, svpct:".649", gaa:5.1},
    {rank:7, name:"Kiera Brady",      team:"Notre Dame",       pos:"GK",  gp:9,  sv:82,  ga:50, svpct:".621", gaa:5.6},
    {rank:8, name:"Brooke Bohlander", team:"Northwestern",     pos:"GK",  gp:9,  sv:80,  ga:42, svpct:".656", gaa:4.7},
    {rank:9, name:"Lily Reeve",       team:"Florida",          pos:"GK",  gp:9,  sv:77,  ga:55, svpct:".583", gaa:6.1},
    {rank:10,name:"Ella Simmons",     team:"Boston College",   pos:"GK",  gp:9,  sv:74,  ga:44, svpct:".627", gaa:4.9},
    {rank:11,name:"Abby Kneipp",      team:"Syracuse",         pos:"GK",  gp:10, sv:72,  ga:48, svpct:".600", gaa:4.8},
    {rank:12,name:"Corinne Gillespie",team:"James Madison",    pos:"GK",  gp:8,  sv:70,  ga:42, svpct:".625", gaa:5.3},
    {rank:13,name:"Lauren Maguire",   team:"Georgetown",       pos:"GK",  gp:9,  sv:68,  ga:50, svpct:".576", gaa:5.6},
    {rank:14,name:"Hannah van Middelem",team:"Yale",           pos:"GK",  gp:9,  sv:65,  ga:44, svpct:".596", gaa:4.9},
    {rank:15,name:"Lindsey Ronbeck",  team:"Colorado",         pos:"GK",  gp:9,  sv:63,  ga:52, svpct:".548", gaa:5.8},
  ],
}

// ─── SCHEDULE ────────────────────────────────────────────────────────────────
function getScheduleLabel(daysFromToday) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  const days   = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  if (daysFromToday === 0) return `TODAY, ${months[d.getMonth()]} ${d.getDate()}`
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

export const SCHEDULE_DAYS = [
  { label: getScheduleLabel(-4), games:[
    {id:101,status:"final",   period:"FINAL",      conf:"Ivy",     gender:"M",time:"1:00 PM", away:{name:"Harvard",      rank:null,score:8, rec:"4-4"},home:{name:"Brown",      rank:null,score:6, rec:"3-5"},loc:"Stevenson Field · Providence, RI"},
    {id:102,status:"final",   period:"FINAL",      conf:"MAAC",    gender:"M",time:"3:00 PM", away:{name:"Fairfield",    rank:null,score:5, rec:"3-5"},home:{name:"Siena",       rank:null,score:9, rec:"5-3"},loc:"Siena Lacrosse Field"},
  ]},
  { label: getScheduleLabel(-2), games:[
    {id:103,status:"final",   period:"FINAL",      conf:"ACC",     gender:"W",time:"4:00 PM", away:{name:"Virginia",     rank:7,  score:11,rec:"7-2"},home:{name:"Clemson",     rank:null,score:8, rec:"4-5"},loc:"Riggs Field · Clemson, SC"},
    {id:104,status:"final",   period:"FINAL",      conf:"Big Ten", gender:"M",time:"6:00 PM", away:{name:"Rutgers",      rank:null,score:9,rec:"5-4"},home:{name:"Michigan",     rank:9,  score:12,rec:"6-3"},loc:"Fisher Stadium · Ann Arbor, MI"},
  ]},
  { label: getScheduleLabel(0), games:[
    {id:1,  status:"live",    period:"Q3 8:42",    conf:"ACC",     gender:"M",time:"LIVE",    away:{name:"Maryland",     rank:1,  score:9, rec:"8-1"},home:{name:"Notre Dame",  rank:4,  score:7, rec:"7-2"},loc:"Arlotta Stadium"},
    {id:2,  status:"live",    period:"Q2 3:15",    conf:"Big Ten", gender:"M",time:"LIVE",    away:{name:"Penn State",   rank:3,  score:5, rec:"7-1"},home:{name:"Ohio State",   rank:null,score:3,rec:"5-4"},loc:"Selby Stadium"},
    {id:5,  status:"final",   period:"FINAL",      conf:"Patriot", gender:"M",time:"12:00 PM",away:{name:"Lehigh",       rank:null,score:7,rec:"4-5"},home:{name:"Army",         rank:null,score:10,rec:"6-3"},loc:"Shea Stadium"},
    {id:6,  status:"upcoming",period:"3:00 PM ET", conf:"CAA",     gender:"M",time:"3:00 PM", away:{name:"Towson",       rank:null,score:null,rec:"5-4"},home:{name:"Drexel",    rank:null,score:null,rec:"4-5"},loc:"Vidas Field"},
    {id:7,  status:"upcoming",period:"4:30 PM ET", conf:"Big Ten", gender:"M",time:"4:30 PM", away:{name:"Michigan",     rank:9,  score:null,rec:"6-3"},home:{name:"Johns Hopkins",rank:5, score:null,rec:"7-2"},loc:"Homewood Field"},
    {id:8,  status:"upcoming",period:"7:00 PM ET", conf:"ACC",     gender:"M",time:"7:00 PM", away:{name:"Syracuse",     rank:7,  score:null,rec:"7-2"},home:{name:"North Carolina",rank:10,score:null,rec:"6-3"},loc:"Dorrance Field"},
    {id:201,status:"upcoming",period:"5:00 PM ET", conf:"ACC",     gender:"W",time:"5:00 PM", away:{name:"Virginia",     rank:7,  score:null,rec:"7-2"},home:{name:"Duke",         rank:null,score:null,rec:"5-4"},loc:"Koskinen Stadium"},
  ]},
  { label: getScheduleLabel(1), games:[
    {id:301,status:"upcoming",period:"12:00 PM ET",conf:"Ivy",     gender:"M",time:"12:00 PM",away:{name:"Yale",         rank:8,  score:null,rec:"6-2"},home:{name:"Dartmouth",   rank:null,score:null,rec:"3-5"},loc:"Memorial Field · Hanover, NH"},
    {id:302,status:"upcoming",period:"1:00 PM ET", conf:"ACC",     gender:"W",time:"1:00 PM", away:{name:"North Carolina",rank:1, score:null,rec:"10-0"},home:{name:"Syracuse",   rank:6,  score:null,rec:"7-3"},loc:"SU Turf Complex · Syracuse, NY"},
    {id:303,status:"upcoming",period:"2:00 PM ET", conf:"Big Ten", gender:"M",time:"2:00 PM", away:{name:"Maryland",     rank:1,  score:null,rec:"8-1"},home:{name:"Penn State",   rank:3,  score:null,rec:"7-1"},loc:"Panzer Stadium · University Park, PA"},
    {id:304,status:"upcoming",period:"3:30 PM ET", conf:"ACC",     gender:"M",time:"3:30 PM", away:{name:"Virginia",     rank:2,  score:null,rec:"9-0"},home:{name:"Syracuse",     rank:7,  score:null,rec:"7-2"},loc:"Carrier Dome · Syracuse, NY"},
    {id:305,status:"upcoming",period:"5:00 PM ET", conf:"ACC",     gender:"W",time:"5:00 PM", away:{name:"Maryland",     rank:4,  score:null,rec:"8-2"},home:{name:"Penn State",   rank:5,  score:null,rec:"7-2"},loc:"Panzer Stadium"},
  ]},
]

// ─── TICKER ──────────────────────────────────────────────────────────────────
export const TICKER_ITEMS = [
  {text:"MARYLAND 9 · NOTRE DAME 7",    period:"Q3 8:42",    live:true,  gender:"M"},
  {text:"PENN STATE 5 · OHIO STATE 3",  period:"Q2 3:15",    live:true,  gender:"M"},
  {text:"YALE 11 · PRINCETON 9",        period:"FINAL",      live:false, gender:"M"},
  {text:"VIRGINIA 13 · DUKE 12 OT",     period:"FINAL/OT",   live:false, gender:"M"},
  {text:"ARMY 10 · LEHIGH 7",           period:"FINAL",      live:false, gender:"M"},
  {text:"MICHIGAN @ JOHNS HOPKINS",     period:"4:30 PM ET", live:false, gender:"M"},
  {text:"SYRACUSE @ NORTH CAROLINA",    period:"7:00 PM ET", live:false, gender:"M"},
  {text:"UNC 14 · VIRGINIA 8",          period:"FINAL",      live:false, gender:"W"},
  {text:"STONY BROOK @ MARYLAND",       period:"6:00 PM ET", live:false, gender:"W"},
]

// ─── DYNAMIC DATES — always centered on today ────────────────────────────────
function generateDates() {
  const today = new Date()
  const days = []
  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT']

  for (let i = -3; i <= 3; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayDate = `${dayNames[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}`
    const label = i === 0
      ? `TODAY · ${dayDate}`
      : dayDate
    days.push({ label, date: d, isToday: i === 0 })
  }
  return days
}

export const DATE_ENTRIES = generateDates()
export const DATES = DATE_ENTRIES.map(d => d.label)

// ─── MOCK POLLS (fallback when scrapers haven't populated Firestore) ─────────
function makeEntries(standings) {
  return standings.map(s => ({
    rank:     s.rank,
    team:     s.team,
    record:   `${s.w}-${s.l}`,
    points:   '',
    prevRank: null,
    movement: 0,
  }))
}

export const MOCK_POLLS_M = {
  coachesPolls: [
    { pollId: 'imlca',            source: 'USILA Coaches Poll (sample)',  entries: makeEntries(STANDINGS_M), fetchedAt: Date.now() },
    { pollId: 'inside-lacrosse-m', source: 'KANE Media Poll (sample)',    entries: makeEntries(STANDINGS_M), fetchedAt: Date.now() },
  ],
  rpi: {
    entries: makeEntries(STANDINGS_M).map((e, i) => ({ ...e, conf: 'ACC', rank: i + 1 })),
    updatedAt: 'Sample Data',
    fetchedAt: Date.now(),
  },
}

export const MOCK_POLLS_W = {
  coachesPolls: [
    { pollId: 'iwlca',            source: 'IWLCA Coaches Poll (sample)', entries: makeEntries(STANDINGS_W), fetchedAt: Date.now() },
    { pollId: 'inside-lacrosse-w', source: 'KANE Media Poll (sample)',   entries: makeEntries(STANDINGS_W), fetchedAt: Date.now() },
  ],
  rpi: {
    entries: makeEntries(STANDINGS_W).map((e, i) => ({ ...e, conf: 'ACC', rank: i + 1 })),
    updatedAt: 'Sample Data',
    fetchedAt: Date.now(),
  },
}

export const SCORING_PLAYS = [
  {qtr:"Q3 10:21",team:"MD", desc:"C. Mullen (unassisted)",    score:"9-7"},
  {qtr:"Q3 12:44",team:"ND", desc:"P. Kavanagh (T. Sheridan)", score:"8-7"},
  {qtr:"Q3 14:02",team:"MD", desc:"J. Wiley (L. Bernhardt)",   score:"8-6"},
  {qtr:"Q2 2:11", team:"ND", desc:"T. Sheridan (C. Kavanagh)", score:"7-6"},
  {qtr:"Q2 5:30", team:"MD", desc:"L. Bernhardt (unassisted)", score:"7-5"},
  {qtr:"Q2 9:15", team:"ND", desc:"P. Kavanagh (J. Kelly)",    score:"6-5"},
  {qtr:"Q1 3:40", team:"MD", desc:"C. Mullen (J. Wiley)",      score:"5-5"},
  {qtr:"Q1 7:10", team:"ND", desc:"T. Sheridan (unassisted)",  score:"4-5"},
]
