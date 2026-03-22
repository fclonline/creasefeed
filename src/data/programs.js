// Complete college lacrosse program database
// Structure: { id, name, shortName, gender, division, conference, state }
// This is the source of truth for team following — swap nothing when real API arrives,
// just match these IDs to API team IDs.

export const PROGRAMS = [
  // ── MEN'S D1 ─────────────────────────────────────────────────────────────
  // ACC
  { id:"m-duke",       name:"Duke",               short:"Duke",        gender:"M", div:"1", conf:"ACC",        state:"NC" },
  { id:"m-notre-dame", name:"Notre Dame",          short:"Notre Dame",  gender:"M", div:"1", conf:"ACC",        state:"IN" },
  { id:"m-virginia",   name:"Virginia",            short:"Virginia",    gender:"M", div:"1", conf:"ACC",        state:"VA" },
  { id:"m-syracuse",   name:"Syracuse",            short:"Syracuse",    gender:"M", div:"1", conf:"ACC",        state:"NY" },
  { id:"m-unc",        name:"North Carolina",      short:"UNC",         gender:"M", div:"1", conf:"ACC",        state:"NC" },
  { id:"m-louisville", name:"Louisville",          short:"Louisville",  gender:"M", div:"1", conf:"ACC",        state:"KY" },
  { id:"m-georgia-tech",name:"Georgia Tech",       short:"Georgia Tech",gender:"M", div:"1", conf:"ACC",        state:"GA" },

  // Big Ten
  { id:"m-maryland",   name:"Maryland",            short:"Maryland",    gender:"M", div:"1", conf:"Big Ten",    state:"MD" },
  { id:"m-penn-state", name:"Penn State",          short:"Penn State",  gender:"M", div:"1", conf:"Big Ten",    state:"PA" },
  { id:"m-michigan",   name:"Michigan",            short:"Michigan",    gender:"M", div:"1", conf:"Big Ten",    state:"MI" },
  { id:"m-ohio-state", name:"Ohio State",          short:"Ohio State",  gender:"M", div:"1", conf:"Big Ten",    state:"OH" },
  { id:"m-rutgers",    name:"Rutgers",             short:"Rutgers",     gender:"M", div:"1", conf:"Big Ten",    state:"NJ" },
  { id:"m-johns-hopkins",name:"Johns Hopkins",     short:"Hopkins",     gender:"M", div:"1", conf:"Big Ten",    state:"MD" },
  { id:"m-minnesota",  name:"Minnesota",           short:"Minnesota",   gender:"M", div:"1", conf:"Big Ten",    state:"MN" },

  // Ivy League
  { id:"m-yale",       name:"Yale",                short:"Yale",        gender:"M", div:"1", conf:"Ivy League", state:"CT" },
  { id:"m-princeton",  name:"Princeton",           short:"Princeton",   gender:"M", div:"1", conf:"Ivy League", state:"NJ" },
  { id:"m-cornell",    name:"Cornell",             short:"Cornell",     gender:"M", div:"1", conf:"Ivy League", state:"NY" },
  { id:"m-harvard",    name:"Harvard",             short:"Harvard",     gender:"M", div:"1", conf:"Ivy League", state:"MA" },
  { id:"m-brown",      name:"Brown",               short:"Brown",       gender:"M", div:"1", conf:"Ivy League", state:"RI" },
  { id:"m-penn",       name:"Pennsylvania",        short:"Penn",        gender:"M", div:"1", conf:"Ivy League", state:"PA" },
  { id:"m-dartmouth",  name:"Dartmouth",           short:"Dartmouth",   gender:"M", div:"1", conf:"Ivy League", state:"NH" },
  { id:"m-columbia",   name:"Columbia",            short:"Columbia",    gender:"M", div:"1", conf:"Ivy League", state:"NY" },

  // Patriot League
  { id:"m-army",       name:"Army",                short:"Army",        gender:"M", div:"1", conf:"Patriot",    state:"NY" },
  { id:"m-navy",       name:"Navy",                short:"Navy",        gender:"M", div:"1", conf:"Patriot",    state:"MD" },
  { id:"m-lehigh",     name:"Lehigh",              short:"Lehigh",      gender:"M", div:"1", conf:"Patriot",    state:"PA" },
  { id:"m-bucknell",   name:"Bucknell",            short:"Bucknell",    gender:"M", div:"1", conf:"Patriot",    state:"PA" },
  { id:"m-lafayette",  name:"Lafayette",           short:"Lafayette",   gender:"M", div:"1", conf:"Patriot",    state:"PA" },
  { id:"m-colgate",    name:"Colgate",             short:"Colgate",     gender:"M", div:"1", conf:"Patriot",    state:"NY" },
  { id:"m-holy-cross", name:"Holy Cross",          short:"Holy Cross",  gender:"M", div:"1", conf:"Patriot",    state:"MA" },
  { id:"m-boston-u",   name:"Boston University",   short:"Boston U",    gender:"M", div:"1", conf:"Patriot",    state:"MA" },

  // CAA
  { id:"m-towson",     name:"Towson",              short:"Towson",      gender:"M", div:"1", conf:"CAA",        state:"MD" },
  { id:"m-drexel",     name:"Drexel",              short:"Drexel",      gender:"M", div:"1", conf:"CAA",        state:"PA" },
  { id:"m-hofstra",    name:"Hofstra",             short:"Hofstra",     gender:"M", div:"1", conf:"CAA",        state:"NY" },
  { id:"m-umass",      name:"Massachusetts",       short:"UMass",       gender:"M", div:"1", conf:"CAA",        state:"MA" },
  { id:"m-stony-brook",name:"Stony Brook",         short:"Stony Brook", gender:"M", div:"1", conf:"CAA",        state:"NY" },
  { id:"m-delaware",   name:"Delaware",            short:"Delaware",    gender:"M", div:"1", conf:"CAA",        state:"DE" },
  { id:"m-virginia-tech",name:"Virginia Tech",     short:"Virginia Tech",gender:"M",div:"1", conf:"CAA",        state:"VA" },

  // MAAC
  { id:"m-manhattan",  name:"Manhattan",           short:"Manhattan",   gender:"M", div:"1", conf:"MAAC",       state:"NY" },
  { id:"m-fairfield",  name:"Fairfield",           short:"Fairfield",   gender:"M", div:"1", conf:"MAAC",       state:"CT" },
  { id:"m-siena",      name:"Siena",               short:"Siena",       gender:"M", div:"1", conf:"MAAC",       state:"NY" },
  { id:"m-quinnipiac", name:"Quinnipiac",          short:"Quinnipiac",  gender:"M", div:"1", conf:"MAAC",       state:"CT" },
  { id:"m-canisius",   name:"Canisius",            short:"Canisius",    gender:"M", div:"1", conf:"MAAC",       state:"NY" },

  // SoCon
  { id:"m-high-point", name:"High Point",          short:"High Point",  gender:"M", div:"1", conf:"SoCon",      state:"NC" },
  { id:"m-furman",     name:"Furman",              short:"Furman",      gender:"M", div:"1", conf:"SoCon",      state:"SC" },
  { id:"m-wofford",    name:"Wofford",             short:"Wofford",     gender:"M", div:"1", conf:"SoCon",      state:"SC" },
  { id:"m-mercer",     name:"Mercer",              short:"Mercer",      gender:"M", div:"1", conf:"SoCon",      state:"GA" },

  // NEC
  { id:"m-bryant",     name:"Bryant",              short:"Bryant",      gender:"M", div:"1", conf:"NEC",        state:"RI" },
  { id:"m-wagner",     name:"Wagner",              short:"Wagner",      gender:"M", div:"1", conf:"NEC",        state:"NY" },
  { id:"m-sacred-heart",name:"Sacred Heart",       short:"Sacred Heart",gender:"M", div:"1", conf:"NEC",        state:"CT" },
  { id:"m-mount-st-marys",name:"Mount St. Mary's", short:"Mount St. Mary's",gender:"M",div:"1",conf:"NEC",     state:"MD" },

  // ASUN
  { id:"m-jacksonville",name:"Jacksonville",       short:"Jacksonville",gender:"M", div:"1", conf:"ASUN",       state:"FL" },
  { id:"m-bellarmine", name:"Bellarmine",          short:"Bellarmine",  gender:"M", div:"1", conf:"ASUN",       state:"KY" },
  { id:"m-siu-edwardsville",name:"SIU Edwardsville",short:"SIUE",      gender:"M", div:"1", conf:"ASUN",       state:"IL" },
  { id:"m-detroit-mercy",name:"Detroit Mercy",     short:"Detroit Mercy",gender:"M",div:"1", conf:"ASUN",       state:"MI" },

  // Independent
  { id:"m-denver",     name:"Denver",              short:"Denver",      gender:"M", div:"1", conf:"Independent",state:"CO" },
  { id:"m-air-force",  name:"Air Force",           short:"Air Force",   gender:"M", div:"1", conf:"Independent",state:"CO" },
  { id:"m-georgetown", name:"Georgetown",          short:"Georgetown",  gender:"M", div:"1", conf:"Independent",state:"DC" },
  { id:"m-villanova",  name:"Villanova",           short:"Villanova",   gender:"M", div:"1", conf:"Independent",state:"PA" },
  { id:"m-umbc",       name:"UMBC",                short:"UMBC",        gender:"M", div:"1", conf:"Independent",state:"MD" },

  // ── WOMEN'S D1 ────────────────────────────────────────────────────────────
  // ACC
  { id:"w-unc",        name:"North Carolina",      short:"UNC",         gender:"W", div:"1", conf:"ACC",        state:"NC" },
  { id:"w-boston-col", name:"Boston College",      short:"Boston College",gender:"W",div:"1",conf:"ACC",        state:"MA" },
  { id:"w-duke",       name:"Duke",                short:"Duke",        gender:"W", div:"1", conf:"ACC",        state:"NC" },
  { id:"w-virginia",   name:"Virginia",            short:"Virginia",    gender:"W", div:"1", conf:"ACC",        state:"VA" },
  { id:"w-syracuse",   name:"Syracuse",            short:"Syracuse",    gender:"W", div:"1", conf:"ACC",        state:"NY" },
  { id:"w-notre-dame", name:"Notre Dame",          short:"Notre Dame",  gender:"W", div:"1", conf:"ACC",        state:"IN" },
  { id:"w-louisville", name:"Louisville",          short:"Louisville",  gender:"W", div:"1", conf:"ACC",        state:"KY" },
  { id:"w-clemson",    name:"Clemson",             short:"Clemson",     gender:"W", div:"1", conf:"ACC",        state:"SC" },
  { id:"w-georgia-tech",name:"Georgia Tech",       short:"Georgia Tech",gender:"W", div:"1", conf:"ACC",        state:"GA" },

  // Big Ten
  { id:"w-maryland",   name:"Maryland",            short:"Maryland",    gender:"W", div:"1", conf:"Big Ten",    state:"MD" },
  { id:"w-penn-state", name:"Penn State",          short:"Penn State",  gender:"W", div:"1", conf:"Big Ten",    state:"PA" },
  { id:"w-michigan",   name:"Michigan",            short:"Michigan",    gender:"W", div:"1", conf:"Big Ten",    state:"MI" },
  { id:"w-northwestern",name:"Northwestern",       short:"Northwestern",gender:"W", div:"1", conf:"Big Ten",    state:"IL" },
  { id:"w-ohio-state", name:"Ohio State",          short:"Ohio State",  gender:"W", div:"1", conf:"Big Ten",    state:"OH" },
  { id:"w-rutgers",    name:"Rutgers",             short:"Rutgers",     gender:"W", div:"1", conf:"Big Ten",    state:"NJ" },
  { id:"w-johns-hopkins",name:"Johns Hopkins",     short:"Hopkins",     gender:"W", div:"1", conf:"Big Ten",    state:"MD" },
  { id:"w-minnesota",  name:"Minnesota",           short:"Minnesota",   gender:"W", div:"1", conf:"Big Ten",    state:"MN" },
  { id:"w-michigan-state",name:"Michigan State",   short:"Michigan State",gender:"W",div:"1",conf:"Big Ten",    state:"MI" },

  // Ivy League
  { id:"w-yale",       name:"Yale",                short:"Yale",        gender:"W", div:"1", conf:"Ivy League", state:"CT" },
  { id:"w-princeton",  name:"Princeton",           short:"Princeton",   gender:"W", div:"1", conf:"Ivy League", state:"NJ" },
  { id:"w-cornell",    name:"Cornell",             short:"Cornell",     gender:"W", div:"1", conf:"Ivy League", state:"NY" },
  { id:"w-harvard",    name:"Harvard",             short:"Harvard",     gender:"W", div:"1", conf:"Ivy League", state:"MA" },
  { id:"w-brown",      name:"Brown",               short:"Brown",       gender:"W", div:"1", conf:"Ivy League", state:"RI" },
  { id:"w-penn",       name:"Pennsylvania",        short:"Penn",        gender:"W", div:"1", conf:"Ivy League", state:"PA" },
  { id:"w-dartmouth",  name:"Dartmouth",           short:"Dartmouth",   gender:"W", div:"1", conf:"Ivy League", state:"NH" },
  { id:"w-columbia",   name:"Columbia",            short:"Columbia",    gender:"W", div:"1", conf:"Ivy League", state:"NY" },

  // Patriot League
  { id:"w-navy",       name:"Navy",                short:"Navy",        gender:"W", div:"1", conf:"Patriot",    state:"MD" },
  { id:"w-lehigh",     name:"Lehigh",              short:"Lehigh",      gender:"W", div:"1", conf:"Patriot",    state:"PA" },
  { id:"w-bucknell",   name:"Bucknell",            short:"Bucknell",    gender:"W", div:"1", conf:"Patriot",    state:"PA" },
  { id:"w-lafayette",  name:"Lafayette",           short:"Lafayette",   gender:"W", div:"1", conf:"Patriot",    state:"PA" },
  { id:"w-colgate",    name:"Colgate",             short:"Colgate",     gender:"W", div:"1", conf:"Patriot",    state:"NY" },
  { id:"w-holy-cross", name:"Holy Cross",          short:"Holy Cross",  gender:"W", div:"1", conf:"Patriot",    state:"MA" },
  { id:"w-boston-u",   name:"Boston University",   short:"Boston U",    gender:"W", div:"1", conf:"Patriot",    state:"MA" },
  { id:"w-american",   name:"American",            short:"American",    gender:"W", div:"1", conf:"Patriot",    state:"DC" },

  // CAA
  { id:"w-stony-brook",name:"Stony Brook",         short:"Stony Brook", gender:"W", div:"1", conf:"CAA",        state:"NY" },
  { id:"w-towson",     name:"Towson",              short:"Towson",      gender:"W", div:"1", conf:"CAA",        state:"MD" },
  { id:"w-drexel",     name:"Drexel",              short:"Drexel",      gender:"W", div:"1", conf:"CAA",        state:"PA" },
  { id:"w-hofstra",    name:"Hofstra",             short:"Hofstra",     gender:"W", div:"1", conf:"CAA",        state:"NY" },
  { id:"w-umass",      name:"Massachusetts",       short:"UMass",       gender:"W", div:"1", conf:"CAA",        state:"MA" },
  { id:"w-delaware",   name:"Delaware",            short:"Delaware",    gender:"W", div:"1", conf:"CAA",        state:"DE" },
  { id:"w-virginia-tech",name:"Virginia Tech",     short:"Virginia Tech",gender:"W",div:"1", conf:"CAA",        state:"VA" },
  { id:"w-william-mary",name:"William & Mary",     short:"William & Mary",gender:"W",div:"1",conf:"CAA",        state:"VA" },

  // America East
  { id:"w-albany",     name:"Albany",              short:"Albany",      gender:"W", div:"1", conf:"America East",state:"NY" },
  { id:"w-umbc",       name:"UMBC",                short:"UMBC",        gender:"W", div:"1", conf:"America East",state:"MD" },
  { id:"w-vermont",    name:"Vermont",             short:"Vermont",     gender:"W", div:"1", conf:"America East",state:"VT" },
  { id:"w-new-hampshire",name:"New Hampshire",     short:"New Hampshire",gender:"W",div:"1", conf:"America East",state:"NH" },
  { id:"w-maine",      name:"Maine",               short:"Maine",       gender:"W", div:"1", conf:"America East",state:"ME" },
  { id:"w-binghamton", name:"Binghamton",          short:"Binghamton",  gender:"W", div:"1", conf:"America East",state:"NY" },

  // Big West
  { id:"w-ucd",        name:"UC Davis",            short:"UC Davis",    gender:"W", div:"1", conf:"Big West",   state:"CA" },
  { id:"w-cal-poly",   name:"Cal Poly",            short:"Cal Poly",    gender:"W", div:"1", conf:"Big West",   state:"CA" },
  { id:"w-colorado",   name:"Colorado",            short:"Colorado",    gender:"W", div:"1", conf:"Big West",   state:"CO" },
  { id:"w-ucsb",       name:"UC Santa Barbara",    short:"UCSB",        gender:"W", div:"1", conf:"Big West",   state:"CA" },

  // MAAC
  { id:"w-fairfield",  name:"Fairfield",           short:"Fairfield",   gender:"W", div:"1", conf:"MAAC",       state:"CT" },
  { id:"w-quinnipiac", name:"Quinnipiac",          short:"Quinnipiac",  gender:"W", div:"1", conf:"MAAC",       state:"CT" },
  { id:"w-manhattan",  name:"Manhattan",           short:"Manhattan",   gender:"W", div:"1", conf:"MAAC",       state:"NY" },
  { id:"w-siena",      name:"Siena",               short:"Siena",       gender:"W", div:"1", conf:"MAAC",       state:"NY" },
  { id:"w-canisius",   name:"Canisius",            short:"Canisius",    gender:"W", div:"1", conf:"MAAC",       state:"NY" },
  { id:"w-niagara",    name:"Niagara",             short:"Niagara",     gender:"W", div:"1", conf:"MAAC",       state:"NY" },

  // Independent / Other
  { id:"w-florida",    name:"Florida",             short:"Florida",     gender:"W", div:"1", conf:"SEC",        state:"FL" },
  { id:"w-florida-state",name:"Florida State",     short:"Florida State",gender:"W",div:"1", conf:"ACC",        state:"FL" },
  { id:"w-james-madison",name:"James Madison",     short:"James Madison",gender:"W",div:"1", conf:"Sun Belt",   state:"VA" },
  { id:"w-liberty",    name:"Liberty",             short:"Liberty",     gender:"W", div:"1", conf:"ASUN",       state:"VA" },
  { id:"w-campbell",   name:"Campbell",            short:"Campbell",    gender:"W", div:"1", conf:"ASUN",       state:"NC" },
  { id:"w-georgetown", name:"Georgetown",          short:"Georgetown",  gender:"W", div:"1", conf:"Big East",   state:"DC" },
  { id:"w-villanova",  name:"Villanova",           short:"Villanova",   gender:"W", div:"1", conf:"Big East",   state:"PA" },
  { id:"w-denver",     name:"Denver",              short:"Denver",      gender:"W", div:"1", conf:"Independent",state:"CO" },

  // ── MEN'S D2 (sample — expand as needed) ─────────────────────────────────
  { id:"m2-adelphi",   name:"Adelphi",             short:"Adelphi",     gender:"M", div:"2", conf:"ECC",        state:"NY" },
  { id:"m2-le-moyne",  name:"Le Moyne",            short:"Le Moyne",    gender:"M", div:"2", conf:"ECC",        state:"NY" },
  { id:"m2-assumption",name:"Assumption",          short:"Assumption",  gender:"M", div:"2", conf:"NE10",       state:"MA" },
  { id:"m2-mercy",     name:"Mercy",               short:"Mercy",       gender:"M", div:"2", conf:"ECC",        state:"NY" },
  { id:"m2-molloy",    name:"Molloy",              short:"Molloy",      gender:"M", div:"2", conf:"ECC",        state:"NY" },
  { id:"m2-catawba",   name:"Catawba",             short:"Catawba",     gender:"M", div:"2", conf:"SAC",        state:"NC" },
  { id:"m2-limestone", name:"Limestone",           short:"Limestone",   gender:"M", div:"2", conf:"SAC",        state:"SC" },
  { id:"m2-pfeiffer",  name:"Pfeiffer",            short:"Pfeiffer",    gender:"M", div:"2", conf:"SAC",        state:"NC" },
  { id:"m2-nyit",      name:"NYIT",                short:"NYIT",        gender:"M", div:"2", conf:"ECC",        state:"NY" },
  { id:"m2-queens",    name:"Queens (NC)",         short:"Queens",      gender:"M", div:"2", conf:"SAC",        state:"NC" },
  { id:"m2-stonehill", name:"Stonehill",           short:"Stonehill",   gender:"M", div:"2", conf:"NE10",       state:"MA" },
  { id:"m2-colorado-mesa",name:"Colorado Mesa",    short:"Colorado Mesa",gender:"M",div:"2", conf:"RMAC",       state:"CO" },

  // ── WOMEN'S D2 (sample) ───────────────────────────────────────────────────
  { id:"w2-adelphi",   name:"Adelphi",             short:"Adelphi",     gender:"W", div:"2", conf:"ECC",        state:"NY" },
  { id:"w2-le-moyne",  name:"Le Moyne",            short:"Le Moyne",    gender:"W", div:"2", conf:"ECC",        state:"NY" },
  { id:"w2-assumption",name:"Assumption",          short:"Assumption",  gender:"W", div:"2", conf:"NE10",       state:"MA" },
  { id:"w2-mercy",     name:"Mercy",               short:"Mercy",       gender:"W", div:"2", conf:"ECC",        state:"NY" },
  { id:"w2-catawba",   name:"Catawba",             short:"Catawba",     gender:"W", div:"2", conf:"SAC",        state:"NC" },
  { id:"w2-limestone", name:"Limestone",           short:"Limestone",   gender:"W", div:"2", conf:"SAC",        state:"SC" },
  { id:"w2-nyit",      name:"NYIT",                short:"NYIT",        gender:"W", div:"2", conf:"ECC",        state:"NY" },
  { id:"w2-queens",    name:"Queens (NC)",         short:"Queens",      gender:"W", div:"2", conf:"SAC",        state:"NC" },
  { id:"w2-stonehill", name:"Stonehill",           short:"Stonehill",   gender:"W", div:"2", conf:"NE10",       state:"MA" },

  // ── MEN'S D3 (sample) ────────────────────────────────────────────────────
  { id:"m3-salisbury", name:"Salisbury",           short:"Salisbury",   gender:"M", div:"3", conf:"CAC",        state:"MD" },
  { id:"m3-tufts",     name:"Tufts",               short:"Tufts",       gender:"M", div:"3", conf:"NESCAC",     state:"MA" },
  { id:"m3-amherst",   name:"Amherst",             short:"Amherst",     gender:"M", div:"3", conf:"NESCAC",     state:"MA" },
  { id:"m3-wesleyan",  name:"Wesleyan",            short:"Wesleyan",    gender:"M", div:"3", conf:"NESCAC",     state:"CT" },
  { id:"m3-middlebury",name:"Middlebury",          short:"Middlebury",  gender:"M", div:"3", conf:"NESCAC",     state:"VT" },
  { id:"m3-williams",  name:"Williams",            short:"Williams",    gender:"M", div:"3", conf:"NESCAC",     state:"MA" },
  { id:"m3-rpi",       name:"RPI",                 short:"RPI",         gender:"M", div:"3", conf:"Liberty",    state:"NY" },
  { id:"m3-cortland",  name:"SUNY Cortland",       short:"Cortland",    gender:"M", div:"3", conf:"SUNYAC",     state:"NY" },
  { id:"m3-gettysburg",name:"Gettysburg",          short:"Gettysburg",  gender:"M", div:"3", conf:"Centennial", state:"PA" },
  { id:"m3-dickinson", name:"Dickinson",           short:"Dickinson",   gender:"M", div:"3", conf:"Centennial", state:"PA" },
  { id:"m3-denison",   name:"Denison",             short:"Denison",     gender:"M", div:"3", conf:"NCAC",       state:"OH" },
  { id:"m3-ohio-wesleyan",name:"Ohio Wesleyan",    short:"Ohio Wesleyan",gender:"M",div:"3", conf:"NCAC",       state:"OH" },
  { id:"m3-washington-lee",name:"Washington & Lee",short:"W&L",         gender:"M", div:"3", conf:"OAC",        state:"VA" },
  { id:"m3-lynchburg", name:"Lynchburg",           short:"Lynchburg",   gender:"M", div:"3", conf:"OAC",        state:"VA" },
  { id:"m3-stevenson", name:"Stevenson",           short:"Stevenson",   gender:"M", div:"3", conf:"MAC",        state:"MD" },
  { id:"m3-york",      name:"York (PA)",           short:"York",        gender:"M", div:"3", conf:"MAC",        state:"PA" },

  // ── WOMEN'S D3 (sample) ───────────────────────────────────────────────────
  { id:"w3-salisbury", name:"Salisbury",           short:"Salisbury",   gender:"W", div:"3", conf:"CAC",        state:"MD" },
  { id:"w3-tufts",     name:"Tufts",               short:"Tufts",       gender:"W", div:"3", conf:"NESCAC",     state:"MA" },
  { id:"w3-amherst",   name:"Amherst",             short:"Amherst",     gender:"W", div:"3", conf:"NESCAC",     state:"MA" },
  { id:"w3-wesleyan",  name:"Wesleyan",            short:"Wesleyan",    gender:"W", div:"3", conf:"NESCAC",     state:"CT" },
  { id:"w3-middlebury",name:"Middlebury",          short:"Middlebury",  gender:"W", div:"3", conf:"NESCAC",     state:"VT" },
  { id:"w3-williams",  name:"Williams",            short:"Williams",    gender:"W", div:"3", conf:"NESCAC",     state:"MA" },
  { id:"w3-cortland",  name:"SUNY Cortland",       short:"Cortland",    gender:"W", div:"3", conf:"SUNYAC",     state:"NY" },
  { id:"w3-gettysburg",name:"Gettysburg",          short:"Gettysburg",  gender:"W", div:"3", conf:"Centennial", state:"PA" },
  { id:"w3-dickinson", name:"Dickinson",           short:"Dickinson",   gender:"W", div:"3", conf:"Centennial", state:"PA" },
  { id:"w3-denison",   name:"Denison",             short:"Denison",     gender:"W", div:"3", conf:"NCAC",       state:"OH" },
  { id:"w3-ohio-wesleyan",name:"Ohio Wesleyan",    short:"Ohio Wesleyan",gender:"W",div:"3", conf:"NCAC",       state:"OH" },
  { id:"w3-washington-lee",name:"Washington & Lee",short:"W&L",         gender:"W", div:"3", conf:"OAC",        state:"VA" },
  { id:"w3-stevenson", name:"Stevenson",           short:"Stevenson",   gender:"W", div:"3", conf:"MAC",        state:"MD" },
]

// helpers
export const getProgramById   = (id) => PROGRAMS.find(p => p.id === id)
export const getProgramsByDiv = (div) => PROGRAMS.filter(p => p.div === div)
export const getProgramsByGender = (g) => PROGRAMS.filter(p => p.gender === g)
export const searchPrograms   = (query, { gender, div } = {}) => {
  const q = query.toLowerCase()
  return PROGRAMS.filter(p => {
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.conf.toLowerCase().includes(q) || p.state.toLowerCase().includes(q)
    const matchesGender = !gender || p.gender === gender
    const matchesDiv    = !div    || p.div === div
    return matchesQuery && matchesGender && matchesDiv
  })
}

export const ALL_DIVS    = ['1', '2', '3']
export const ALL_GENDERS = ['M', 'W']
