// Complete college lacrosse program database
// Structure: { id, name, shortName, gender, division, conference, state }
// This is the source of truth for team following — swap nothing when real API arrives,
// just match these IDs to API team IDs.

export const PROGRAMS = [
  // ── MEN'S D1 ─────────────────────────────────────────────────────────────
  // ACC
  { id:"m-duke",         name:"Duke",             short:"Duke",        gender:"M", div:"1", conf:"ACC",           state:"NC" },
  { id:"m-virginia",     name:"Virginia",         short:"Virginia",    gender:"M", div:"1", conf:"ACC",           state:"VA" },
  { id:"m-notre-dame",   name:"Notre Dame",       short:"Notre Dame",  gender:"M", div:"1", conf:"ACC",           state:"IN" },
  { id:"m-syracuse",     name:"Syracuse",         short:"Syracuse",    gender:"M", div:"1", conf:"ACC",           state:"NY" },
  { id:"m-unc",          name:"North Carolina",   short:"UNC",         gender:"M", div:"1", conf:"ACC",           state:"NC" },

  // Big Ten
  { id:"m-maryland",     name:"Maryland",         short:"Maryland",    gender:"M", div:"1", conf:"Big Ten",        state:"MD" },
  { id:"m-penn-state",   name:"Penn State",       short:"Penn State",  gender:"M", div:"1", conf:"Big Ten",        state:"PA" },
  { id:"m-michigan",     name:"Michigan",         short:"Michigan",    gender:"M", div:"1", conf:"Big Ten",        state:"MI" },
  { id:"m-ohio-state",   name:"Ohio State",       short:"Ohio State",  gender:"M", div:"1", conf:"Big Ten",        state:"OH" },
  { id:"m-rutgers",      name:"Rutgers",          short:"Rutgers",     gender:"M", div:"1", conf:"Big Ten",        state:"NJ" },
  { id:"m-johns-hopkins",name:"Johns Hopkins",    short:"Hopkins",     gender:"M", div:"1", conf:"Big Ten",        state:"MD" },

  // Ivy League
  { id:"m-yale",         name:"Yale",             short:"Yale",        gender:"M", div:"1", conf:"Ivy League",     state:"CT" },
  { id:"m-princeton",    name:"Princeton",        short:"Princeton",   gender:"M", div:"1", conf:"Ivy League",     state:"NJ" },
  { id:"m-cornell",      name:"Cornell",          short:"Cornell",     gender:"M", div:"1", conf:"Ivy League",     state:"NY" },
  { id:"m-harvard",      name:"Harvard",          short:"Harvard",     gender:"M", div:"1", conf:"Ivy League",     state:"MA" },
  { id:"m-brown",        name:"Brown",            short:"Brown",       gender:"M", div:"1", conf:"Ivy League",     state:"RI" },
  { id:"m-penn",         name:"Pennsylvania",     short:"Penn",        gender:"M", div:"1", conf:"Ivy League",     state:"PA" },
  { id:"m-dartmouth",    name:"Dartmouth",        short:"Dartmouth",   gender:"M", div:"1", conf:"Ivy League",     state:"NH" },

  // Patriot League
  { id:"m-army",         name:"Army West Point",  short:"Army",        gender:"M", div:"1", conf:"Patriot",        state:"NY" },
  { id:"m-navy",         name:"Navy",             short:"Navy",        gender:"M", div:"1", conf:"Patriot",        state:"MD" },
  { id:"m-lehigh",       name:"Lehigh",           short:"Lehigh",      gender:"M", div:"1", conf:"Patriot",        state:"PA" },
  { id:"m-bucknell",     name:"Bucknell",         short:"Bucknell",    gender:"M", div:"1", conf:"Patriot",        state:"PA" },
  { id:"m-lafayette",    name:"Lafayette",        short:"Lafayette",   gender:"M", div:"1", conf:"Patriot",        state:"PA" },
  { id:"m-colgate",      name:"Colgate",          short:"Colgate",     gender:"M", div:"1", conf:"Patriot",        state:"NY" },
  { id:"m-holy-cross",   name:"Holy Cross",       short:"Holy Cross",  gender:"M", div:"1", conf:"Patriot",        state:"MA" },
  { id:"m-boston-u",     name:"Boston U.",        short:"Boston U",    gender:"M", div:"1", conf:"Patriot",        state:"MA" },
  { id:"m-loyola",       name:"Loyola Maryland",  short:"Loyola",      gender:"M", div:"1", conf:"Patriot",        state:"MD" },

  // CAA
  { id:"m-towson",       name:"Towson",           short:"Towson",      gender:"M", div:"1", conf:"CAA",            state:"MD" },
  { id:"m-drexel",       name:"Drexel",           short:"Drexel",      gender:"M", div:"1", conf:"CAA",            state:"PA" },
  { id:"m-hofstra",      name:"Hofstra",          short:"Hofstra",     gender:"M", div:"1", conf:"CAA",            state:"NY" },
  { id:"m-stony-brook",  name:"Stony Brook",      short:"Stony Brook", gender:"M", div:"1", conf:"CAA",            state:"NY" },
  { id:"m-hampton",      name:"Hampton",          short:"Hampton",     gender:"M", div:"1", conf:"CAA",            state:"VA" },
  { id:"m-monmouth",     name:"Monmouth",         short:"Monmouth",    gender:"M", div:"1", conf:"CAA",            state:"NJ" },
  { id:"m-fairfield",    name:"Fairfield",        short:"Fairfield",   gender:"M", div:"1", conf:"CAA",            state:"CT" },

  // MAAC
  { id:"m-manhattan",    name:"Manhattan",        short:"Manhattan",   gender:"M", div:"1", conf:"MAAC",           state:"NY" },
  { id:"m-siena",        name:"Siena",            short:"Siena",       gender:"M", div:"1", conf:"MAAC",           state:"NY" },
  { id:"m-quinnipiac",   name:"Quinnipiac",       short:"Quinnipiac",  gender:"M", div:"1", conf:"MAAC",           state:"CT" },
  { id:"m-canisius",     name:"Canisius",         short:"Canisius",    gender:"M", div:"1", conf:"MAAC",           state:"NY" },
  { id:"m-marist",       name:"Marist",           short:"Marist",      gender:"M", div:"1", conf:"MAAC",           state:"NY" },
  { id:"m-iona",         name:"Iona",             short:"Iona",        gender:"M", div:"1", conf:"MAAC",           state:"NY" },
  { id:"m-mount-st-marys",name:"Mount St. Mary's",short:"Mount St. Mary's",gender:"M",div:"1",conf:"MAAC",       state:"MD" },
  { id:"m-merrimack",    name:"Merrimack",        short:"Merrimack",   gender:"M", div:"1", conf:"MAAC",           state:"MA" },
  { id:"m-sacred-heart", name:"Sacred Heart",     short:"Sacred Heart",gender:"M", div:"1", conf:"MAAC",           state:"CT" },

  // NEC
  { id:"m-wagner",       name:"Wagner",           short:"Wagner",      gender:"M", div:"1", conf:"NEC",            state:"NY" },
  { id:"m-le-moyne",     name:"Le Moyne",         short:"Le Moyne",    gender:"M", div:"1", conf:"NEC",            state:"NY" },
  { id:"m-liu",          name:"LIU",              short:"LIU",         gender:"M", div:"1", conf:"NEC",            state:"NY" },
  { id:"m-cleveland-st", name:"Cleveland State",  short:"Cleveland St",gender:"M", div:"1", conf:"NEC",            state:"OH" },
  { id:"m-detroit-mercy",name:"Detroit Mercy",    short:"Detroit Mercy",gender:"M",div:"1",conf:"NEC",            state:"MI" },
  { id:"m-robert-morris",name:"Robert Morris",    short:"Robert Morris",gender:"M",div:"1",conf:"NEC",            state:"PA" },
  { id:"m-vmi",          name:"VMI",              short:"VMI",         gender:"M", div:"1", conf:"NEC",            state:"VA" },
  { id:"m-mercyhurst",   name:"Mercyhurst",       short:"Mercyhurst",  gender:"M", div:"1", conf:"NEC",            state:"PA" },

  // Big East
  { id:"m-georgetown",   name:"Georgetown",       short:"Georgetown",  gender:"M", div:"1", conf:"Big East",        state:"DC" },
  { id:"m-villanova",    name:"Villanova",        short:"Villanova",   gender:"M", div:"1", conf:"Big East",        state:"PA" },
  { id:"m-marquette",    name:"Marquette",        short:"Marquette",   gender:"M", div:"1", conf:"Big East",        state:"WI" },
  { id:"m-denver",       name:"Denver",           short:"Denver",      gender:"M", div:"1", conf:"Big East",        state:"CO" },
  { id:"m-providence",   name:"Providence",       short:"Providence",  gender:"M", div:"1", conf:"Big East",        state:"RI" },
  { id:"m-st-johns",     name:"St. John's (NY)",  short:"St. John's",  gender:"M", div:"1", conf:"Big East",        state:"NY" },

  // Atlantic 10
  { id:"m-umass",        name:"Massachusetts",    short:"UMass",       gender:"M", div:"1", conf:"Atlantic 10",     state:"MA" },
  { id:"m-richmond",     name:"Richmond",         short:"Richmond",    gender:"M", div:"1", conf:"Atlantic 10",     state:"VA" },
  { id:"m-high-point",   name:"High Point",       short:"High Point",  gender:"M", div:"1", conf:"Atlantic 10",     state:"NC" },
  { id:"m-hobart",       name:"Hobart",           short:"Hobart",      gender:"M", div:"1", conf:"Atlantic 10",     state:"NY" },
  { id:"m-st-josephs",   name:"Saint Joseph's",   short:"Saint Joseph's",gender:"M",div:"1",conf:"Atlantic 10",    state:"PA" },
  { id:"m-delaware",     name:"Delaware",         short:"Delaware",    gender:"M", div:"1", conf:"Atlantic 10",     state:"DE" },
  { id:"m-st-bonav",     name:"St. Bonaventure",  short:"St. Bonaventure",gender:"M",div:"1",conf:"Atlantic 10",   state:"NY" },

  // ASUN
  { id:"m-jacksonville", name:"Jacksonville",     short:"Jacksonville",gender:"M", div:"1", conf:"ASUN",           state:"FL" },
  { id:"m-bellarmine",   name:"Bellarmine",       short:"Bellarmine",  gender:"M", div:"1", conf:"ASUN",           state:"KY" },
  { id:"m-air-force",    name:"Air Force",        short:"Air Force",   gender:"M", div:"1", conf:"ASUN",           state:"CO" },
  { id:"m-mercer",       name:"Mercer",           short:"Mercer",      gender:"M", div:"1", conf:"ASUN",           state:"GA" },
  { id:"m-queens",       name:"Queens (NC)",      short:"Queens",      gender:"M", div:"1", conf:"ASUN",           state:"NC" },
  { id:"m-utah",         name:"Utah",             short:"Utah",        gender:"M", div:"1", conf:"ASUN",           state:"UT" },

  // America East
  { id:"m-umbc",         name:"UMBC",             short:"UMBC",        gender:"M", div:"1", conf:"America East",    state:"MD" },
  { id:"m-vermont",      name:"Vermont",          short:"Vermont",     gender:"M", div:"1", conf:"America East",    state:"VT" },
  { id:"m-albany",       name:"Albany",           short:"Albany",      gender:"M", div:"1", conf:"America East",    state:"NY" },
  { id:"m-bryant",       name:"Bryant",           short:"Bryant",      gender:"M", div:"1", conf:"America East",    state:"RI" },
  { id:"m-njit",         name:"NJIT",             short:"NJIT",        gender:"M", div:"1", conf:"America East",    state:"NJ" },
  { id:"m-umass-lowell", name:"UMass Lowell",    short:"UMass Lowell",gender:"M",div:"1",conf:"America East",    state:"MA" },
  { id:"m-binghamton",   name:"Binghamton",       short:"Binghamton",  gender:"M", div:"1", conf:"America East",    state:"NY" },

  // ── WOMEN'S D1 ────────────────────────────────────────────────────────────
  // ACC
  { id:"w-stanford",     name:"Stanford",         short:"Stanford",    gender:"W", div:"1", conf:"ACC",           state:"CA" },
  { id:"w-syracuse",     name:"Syracuse",         short:"Syracuse",    gender:"W", div:"1", conf:"ACC",           state:"NY" },
  { id:"w-unc",          name:"North Carolina",   short:"UNC",         gender:"W", div:"1", conf:"ACC",           state:"NC" },
  { id:"w-notre-dame",   name:"Notre Dame",       short:"Notre Dame",  gender:"W", div:"1", conf:"ACC",           state:"IN" },
  { id:"w-duke",         name:"Duke",             short:"Duke",        gender:"W", div:"1", conf:"ACC",           state:"NC" },
  { id:"w-clemson",      name:"Clemson",          short:"Clemson",     gender:"W", div:"1", conf:"ACC",           state:"SC" },
  { id:"w-louisville",   name:"Louisville",       short:"Louisville",  gender:"W", div:"1", conf:"ACC",           state:"KY" },
  { id:"w-virginia",     name:"Virginia",         short:"Virginia",    gender:"W", div:"1", conf:"ACC",           state:"VA" },
  { id:"w-virginia-tech",name:"Virginia Tech",    short:"Virginia Tech",gender:"W",div:"1",conf:"ACC",           state:"VA" },
  { id:"w-pitt",         name:"Pittsburgh",       short:"Pittsburgh",  gender:"W", div:"1", conf:"ACC",           state:"PA" },
  { id:"w-florida-state",name:"Florida State",    short:"Florida State",gender:"W",div:"1",conf:"ACC",           state:"FL" },
  { id:"w-boston-col",   name:"Boston College",   short:"Boston College",gender:"W",div:"1",conf:"ACC",          state:"MA" },
  { id:"w-california",   name:"California",       short:"Cal",         gender:"W", div:"1", conf:"ACC",           state:"CA" },

  // Big Ten
  { id:"w-maryland",     name:"Maryland",         short:"Maryland",    gender:"W", div:"1", conf:"Big Ten",        state:"MD" },
  { id:"w-penn-state",   name:"Penn State",       short:"Penn State",  gender:"W", div:"1", conf:"Big Ten",        state:"PA" },
  { id:"w-michigan",     name:"Michigan",         short:"Michigan",    gender:"W", div:"1", conf:"Big Ten",        state:"MI" },
  { id:"w-johns-hopkins",name:"Johns Hopkins",    short:"Hopkins",     gender:"W", div:"1", conf:"Big Ten",        state:"MD" },
  { id:"w-rutgers",      name:"Rutgers",          short:"Rutgers",     gender:"W", div:"1", conf:"Big Ten",        state:"NJ" },
  { id:"w-northwestern", name:"Northwestern",     short:"Northwestern",gender:"W", div:"1", conf:"Big Ten",        state:"IL" },
  { id:"w-ohio-state",   name:"Ohio State",       short:"Ohio State",  gender:"W", div:"1", conf:"Big Ten",        state:"OH" },
  { id:"w-oregon",       name:"Oregon",           short:"Oregon",      gender:"W", div:"1", conf:"Big Ten",        state:"OR" },
  { id:"w-usc",          name:"Southern California",short:"USC",       gender:"W", div:"1", conf:"Big Ten",        state:"CA" },

  // Ivy League
  { id:"w-princeton",    name:"Princeton",        short:"Princeton",   gender:"W", div:"1", conf:"Ivy League",     state:"NJ" },
  { id:"w-yale",         name:"Yale",             short:"Yale",        gender:"W", div:"1", conf:"Ivy League",     state:"CT" },
  { id:"w-cornell",      name:"Cornell",          short:"Cornell",     gender:"W", div:"1", conf:"Ivy League",     state:"NY" },
  { id:"w-harvard",      name:"Harvard",          short:"Harvard",     gender:"W", div:"1", conf:"Ivy League",     state:"MA" },
  { id:"w-brown",        name:"Brown",            short:"Brown",       gender:"W", div:"1", conf:"Ivy League",     state:"RI" },
  { id:"w-penn",         name:"Pennsylvania",     short:"Penn",        gender:"W", div:"1", conf:"Ivy League",     state:"PA" },
  { id:"w-dartmouth",    name:"Dartmouth",        short:"Dartmouth",   gender:"W", div:"1", conf:"Ivy League",     state:"NH" },
  { id:"w-columbia",     name:"Columbia",         short:"Columbia",    gender:"W", div:"1", conf:"Ivy League",     state:"NY" },

  // Patriot League
  { id:"w-navy",         name:"Navy",             short:"Navy",        gender:"W", div:"1", conf:"Patriot",        state:"MD" },
  { id:"w-army",         name:"Army West Point",  short:"Army",        gender:"W", div:"1", conf:"Patriot",        state:"NY" },
  { id:"w-loyola",       name:"Loyola Maryland",  short:"Loyola",      gender:"W", div:"1", conf:"Patriot",        state:"MD" },
  { id:"w-holy-cross",   name:"Holy Cross",       short:"Holy Cross",  gender:"W", div:"1", conf:"Patriot",        state:"MA" },
  { id:"w-bucknell",     name:"Bucknell",         short:"Bucknell",    gender:"W", div:"1", conf:"Patriot",        state:"PA" },
  { id:"w-colgate",      name:"Colgate",          short:"Colgate",     gender:"W", div:"1", conf:"Patriot",        state:"NY" },
  { id:"w-lehigh",       name:"Lehigh",           short:"Lehigh",      gender:"W", div:"1", conf:"Patriot",        state:"PA" },
  { id:"w-boston-u",     name:"Boston University",short:"Boston U",    gender:"W", div:"1", conf:"Patriot",        state:"MA" },
  { id:"w-american",     name:"American",         short:"American",    gender:"W", div:"1", conf:"Patriot",        state:"DC" },
  { id:"w-lafayette",    name:"Lafayette",        short:"Lafayette",   gender:"W", div:"1", conf:"Patriot",        state:"PA" },

  // CAA
  { id:"w-stony-brook",  name:"Stony Brook",      short:"Stony Brook", gender:"W", div:"1", conf:"CAA",           state:"NY" },
  { id:"w-towson",       name:"Towson",           short:"Towson",      gender:"W", div:"1", conf:"CAA",           state:"MD" },
  { id:"w-drexel",       name:"Drexel",           short:"Drexel",      gender:"W", div:"1", conf:"CAA",           state:"PA" },
  { id:"w-hofstra",      name:"Hofstra",          short:"Hofstra",     gender:"W", div:"1", conf:"CAA",           state:"NY" },
  { id:"w-william-mary", name:"William & Mary",   short:"William & Mary",gender:"W",div:"1",conf:"CAA",           state:"VA" },
  { id:"w-campbell",     name:"Campbell",         short:"Campbell",    gender:"W", div:"1", conf:"CAA",           state:"NC" },
  { id:"w-elon",         name:"Elon",             short:"Elon",        gender:"W", div:"1", conf:"CAA",           state:"NC" },
  { id:"w-monmouth",     name:"Monmouth",         short:"Monmouth",    gender:"W", div:"1", conf:"CAA",           state:"NJ" },

  // America East
  { id:"w-albany",       name:"Albany",           short:"Albany",      gender:"W", div:"1", conf:"America East",   state:"NY" },
  { id:"w-umbc",         name:"UMBC",             short:"UMBC",        gender:"W", div:"1", conf:"America East",   state:"MD" },
  { id:"w-vermont",      name:"Vermont",          short:"Vermont",     gender:"W", div:"1", conf:"America East",   state:"VT" },
  { id:"w-new-hampshire",name:"New Hampshire",    short:"New Hampshire",gender:"W",div:"1",conf:"America East",   state:"NH" },
  { id:"w-binghamton",   name:"Binghamton",       short:"Binghamton",  gender:"W", div:"1", conf:"America East",   state:"NY" },
  { id:"w-bryant",       name:"Bryant",           short:"Bryant",      gender:"W", div:"1", conf:"America East",   state:"RI" },
  { id:"w-umass-lowell", name:"UMass Lowell",    short:"UMass Lowell",gender:"W",div:"1",conf:"America East",   state:"MA" },

  // MAC
  { id:"w-akron",        name:"Akron",            short:"Akron",       gender:"W", div:"1", conf:"MAC",            state:"OH" },
  { id:"w-kent-state",   name:"Kent State",       short:"Kent State",  gender:"W", div:"1", conf:"MAC",            state:"OH" },
  { id:"w-central-mich", name:"Central Michigan", short:"Central Mich",gender:"W", div:"1", conf:"MAC",            state:"MI" },
  { id:"w-eastern-mich", name:"Eastern Michigan", short:"Eastern Mich",gender:"W", div:"1", conf:"MAC",            state:"MI" },
  { id:"w-umass",        name:"Massachusetts",    short:"UMass",       gender:"W", div:"1", conf:"MAC",            state:"MA" },
  { id:"w-robert-morris",name:"Robert Morris",    short:"Robert Morris",gender:"W",div:"1",conf:"MAC",            state:"PA" },
  { id:"w-youngstown",   name:"Youngstown State", short:"Youngstown",  gender:"W", div:"1", conf:"MAC",            state:"OH" },
  { id:"w-detroit-mercy",name:"Detroit Mercy",    short:"Detroit Mercy",gender:"W",div:"1",conf:"MAC",            state:"MI" },

  // MAAC
  { id:"w-fairfield",    name:"Fairfield",        short:"Fairfield",   gender:"W", div:"1", conf:"MAAC",          state:"CT" },
  { id:"w-quinnipiac",   name:"Quinnipiac",       short:"Quinnipiac",  gender:"W", div:"1", conf:"MAAC",          state:"CT" },
  { id:"w-manhattan",    name:"Manhattan",        short:"Manhattan",   gender:"W", div:"1", conf:"MAAC",          state:"NY" },
  { id:"w-siena",        name:"Siena",            short:"Siena",       gender:"W", div:"1", conf:"MAAC",          state:"NY" },
  { id:"w-canisius",     name:"Canisius",         short:"Canisius",    gender:"W", div:"1", conf:"MAAC",          state:"NY" },
  { id:"w-niagara",      name:"Niagara",          short:"Niagara",     gender:"W", div:"1", conf:"MAAC",          state:"NY" },
  { id:"w-sacred-heart", name:"Sacred Heart",     short:"Sacred Heart",gender:"W", div:"1", conf:"MAAC",          state:"CT" },
  { id:"w-iona",         name:"Iona",             short:"Iona",        gender:"W", div:"1", conf:"MAAC",          state:"NY" },
  { id:"w-marist",       name:"Marist",           short:"Marist",      gender:"W", div:"1", conf:"MAAC",          state:"NY" },
  { id:"w-merrimack",    name:"Merrimack",        short:"Merrimack",   gender:"W", div:"1", conf:"MAAC",          state:"MA" },
  { id:"w-mount-st-marys",name:"Mount St. Mary's",short:"Mount St. Mary's",gender:"W",div:"1",conf:"MAAC",      state:"MD" },
  { id:"w-rider",        name:"Rider",            short:"Rider",       gender:"W", div:"1", conf:"MAAC",          state:"NJ" },
  { id:"w-xavier",       name:"Xavier",           short:"Xavier",      gender:"W", div:"1", conf:"MAAC",          state:"OH" },

  // NEC
  { id:"w-le-moyne",     name:"Le Moyne",         short:"Le Moyne",    gender:"W", div:"1", conf:"NEC",           state:"NY" },
  { id:"w-liu",          name:"LIU",              short:"LIU",         gender:"W", div:"1", conf:"NEC",           state:"NY" },
  { id:"w-central-conn", name:"Central Connecticut",short:"Central Conn",gender:"W",div:"1",conf:"NEC",         state:"CT" },
  { id:"w-wagner",       name:"Wagner",           short:"Wagner",      gender:"W", div:"1", conf:"NEC",           state:"NY" },
  { id:"w-howard",       name:"Howard",           short:"Howard",      gender:"W", div:"1", conf:"NEC",           state:"DC" },
  { id:"w-delaware-state",name:"Delaware State",  short:"Delaware State",gender:"W",div:"1",conf:"NEC",          state:"DE" },
  { id:"w-stonehill",    name:"Stonehill",        short:"Stonehill",   gender:"W", div:"1", conf:"NEC",           state:"MA" },
  { id:"w-fdu",          name:"FDU",              short:"FDU",         gender:"W", div:"1", conf:"NEC",           state:"NJ" },
  { id:"w-new-haven",    name:"New Haven",        short:"New Haven",   gender:"W", div:"1", conf:"NEC",           state:"CT" },
  { id:"w-mercyhurst",   name:"Mercyhurst",       short:"Mercyhurst",  gender:"W", div:"1", conf:"NEC",           state:"PA" },

  // Big East
  { id:"w-georgetown",   name:"Georgetown",       short:"Georgetown",  gender:"W", div:"1", conf:"Big East",       state:"DC" },
  { id:"w-villanova",    name:"Villanova",        short:"Villanova",   gender:"W", div:"1", conf:"Big East",       state:"PA" },
  { id:"w-butler",       name:"Butler",           short:"Butler",      gender:"W", div:"1", conf:"Big East",       state:"IN" },
  { id:"w-denver",       name:"Denver",           short:"Denver",      gender:"W", div:"1", conf:"Big East",       state:"CO" },
  { id:"w-marquette",    name:"Marquette",        short:"Marquette",   gender:"W", div:"1", conf:"Big East",       state:"WI" },
  { id:"w-uconn",        name:"UConn",            short:"UConn",       gender:"W", div:"1", conf:"Big East",       state:"CT" },

  // Big 12
  { id:"w-florida",      name:"Florida",          short:"Florida",     gender:"W", div:"1", conf:"Big 12",         state:"FL" },
  { id:"w-colorado",     name:"Colorado",         short:"Colorado",    gender:"W", div:"1", conf:"Big 12",         state:"CO" },
  { id:"w-cincinnati",   name:"Cincinnati",       short:"Cincinnati",  gender:"W", div:"1", conf:"Big 12",         state:"OH" },
  { id:"w-arizona-state",name:"Arizona State",    short:"Arizona State",gender:"W",div:"1",conf:"Big 12",         state:"AZ" },
  { id:"w-san-diego-st", name:"San Diego State",  short:"San Diego State",gender:"W",div:"1",conf:"Big 12",      state:"CA" },
  { id:"w-uc-davis",     name:"UC Davis",         short:"UC Davis",    gender:"W", div:"1", conf:"Big 12",         state:"CA" },

  // Atlantic 10
  { id:"w-davidson",     name:"Davidson",         short:"Davidson",    gender:"W", div:"1", conf:"Atlantic 10",    state:"NC" },
  { id:"w-duquesne",     name:"Duquesne",         short:"Duquesne",    gender:"W", div:"1", conf:"Atlantic 10",    state:"PA" },
  { id:"w-george-mason", name:"George Mason",     short:"George Mason",gender:"W", div:"1", conf:"Atlantic 10",    state:"VA" },
  { id:"w-richmond",     name:"Richmond",         short:"Richmond",    gender:"W", div:"1", conf:"Atlantic 10",    state:"VA" },
  { id:"w-st-josephs",   name:"Saint Joseph's",   short:"Saint Joseph's",gender:"W",div:"1",conf:"Atlantic 10",   state:"PA" },
  { id:"w-la-salle",     name:"La Salle",         short:"La Salle",    gender:"W", div:"1", conf:"Atlantic 10",    state:"PA" },
  { id:"w-rhode-island", name:"Rhode Island",     short:"Rhode Island",gender:"W", div:"1", conf:"Atlantic 10",    state:"RI" },
  { id:"w-vcu",          name:"VCU",              short:"VCU",         gender:"W", div:"1", conf:"Atlantic 10",    state:"VA" },
  { id:"w-george-wash",  name:"George Washington",short:"George Washington",gender:"W",div:"1",conf:"Atlantic 10",state:"DC" },
  { id:"w-st-bonav",     name:"St. Bonaventure",  short:"St. Bonaventure",gender:"W",div:"1",conf:"Atlantic 10",  state:"NY" },

  // American
  { id:"w-east-carolina",name:"East Carolina",    short:"East Carolina",gender:"W",div:"1",conf:"American",       state:"NC" },
  { id:"w-charlotte",    name:"Charlotte",        short:"Charlotte",   gender:"W", div:"1", conf:"American",       state:"NC" },
  { id:"w-south-fla",    name:"South Florida",    short:"South Florida",gender:"W",div:"1",conf:"American",       state:"FL" },
  { id:"w-james-madison",name:"James Madison",    short:"James Madison",gender:"W",div:"1",conf:"American",       state:"VA" },
  { id:"w-old-dominion", name:"Old Dominion",     short:"Old Dominion",gender:"W", div:"1", conf:"American",       state:"VA" },
  { id:"w-vanderbilt",   name:"Vanderbilt",       short:"Vanderbilt",  gender:"W", div:"1", conf:"American",       state:"TN" },
  { id:"w-temple",       name:"Temple",           short:"Temple",      gender:"W", div:"1", conf:"American",       state:"PA" },

  // ASUN
  { id:"w-liberty",      name:"Liberty",          short:"Liberty",     gender:"W", div:"1", conf:"ASUN",          state:"VA" },
  { id:"w-jacksonville", name:"Jacksonville",     short:"Jacksonville",gender:"W", div:"1", conf:"ASUN",          state:"FL" },
  { id:"w-kennesaw",     name:"Kennesaw State",   short:"Kennesaw State",gender:"W",div:"1",conf:"ASUN",          state:"GA" },
  { id:"w-lindenwood",   name:"Lindenwood",       short:"Lindenwood",  gender:"W", div:"1", conf:"ASUN",          state:"MO" },
  { id:"w-coastal-car",  name:"Coastal Carolina", short:"Coastal Carolina",gender:"W",div:"1",conf:"ASUN",       state:"SC" },
  { id:"w-stetson",      name:"Stetson",          short:"Stetson",     gender:"W", div:"1", conf:"ASUN",          state:"FL" },
  { id:"w-austin-peay",  name:"Austin Peay",      short:"Austin Peay",  gender:"W",div:"1",conf:"ASUN",           state:"TN" },
  { id:"w-radford",      name:"Radford",          short:"Radford",     gender:"W", div:"1", conf:"ASUN",          state:"VA" },
  { id:"w-delaware",     name:"Delaware",         short:"Delaware",    gender:"W", div:"1", conf:"ASUN",          state:"DE" },
  { id:"w-queens",       name:"Queens (NC)",      short:"Queens",      gender:"W", div:"1", conf:"ASUN",          state:"NC" },

  // Big South
  { id:"w-high-point",   name:"High Point",       short:"High Point",  gender:"W", div:"1", conf:"Big South",     state:"NC" },
  { id:"w-longwood",     name:"Longwood",         short:"Longwood",    gender:"W", div:"1", conf:"Big South",     state:"VA" },
  { id:"w-presbyterian", name:"Presbyterian",     short:"Presbyterian",gender:"W", div:"1", conf:"Big South",     state:"SC" },
  { id:"w-winthrop",     name:"Winthrop",         short:"Winthrop",    gender:"W", div:"1", conf:"Big South",     state:"SC" },
  { id:"w-mercer",       name:"Mercer",           short:"Mercer",      gender:"W", div:"1", conf:"Big South",     state:"GA" },
  { id:"w-wofford",      name:"Wofford",          short:"Wofford",     gender:"W", div:"1", conf:"Big South",     state:"SC" },
  { id:"w-furman",       name:"Furman",           short:"Furman",      gender:"W", div:"1", conf:"Big South",     state:"SC" },
  { id:"w-gardner-webb", name:"Gardner-Webb",    short:"Gardner-Webb",gender:"W", div:"1", conf:"Big South",     state:"NC" },

  // ══════════════════════════════════════════════════════════════════════════
  // MEN'S D2
  // ══════════════════════════════════════════════════════════════════════════

  // NE10
  { id:"m2-adelphi",        name:"Adelphi",            short:"Adelphi",         gender:"M", div:"2", conf:"NE10",  state:"NY" },
  { id:"m2-assumption",     name:"Assumption",         short:"Assumption",      gender:"M", div:"2", conf:"NE10",  state:"MA" },
  { id:"m2-bentley",        name:"Bentley",            short:"Bentley",         gender:"M", div:"2", conf:"NE10",  state:"MA" },
  { id:"m2-franklin-pierce",name:"Franklin Pierce",    short:"Franklin Pierce", gender:"M", div:"2", conf:"NE10",  state:"NH" },
  { id:"m2-le-moyne",       name:"Le Moyne",           short:"Le Moyne",        gender:"M", div:"2", conf:"NE10",  state:"NY" },
  { id:"m2-merrimack",      name:"Merrimack",          short:"Merrimack",       gender:"M", div:"2", conf:"NE10",  state:"MA" },
  { id:"m2-pace",           name:"Pace",               short:"Pace",            gender:"M", div:"2", conf:"NE10",  state:"NY" },
  { id:"m2-saint-anselm",   name:"Saint Anselm",       short:"Saint Anselm",    gender:"M", div:"2", conf:"NE10",  state:"NH" },
  { id:"m2-saint-michaels", name:"Saint Michael's",    short:"Saint Michael's", gender:"M", div:"2", conf:"NE10",  state:"VT" },
  { id:"m2-snhu",           name:"Southern New Hampshire",short:"SNHU",          gender:"M", div:"2", conf:"NE10",  state:"NH" },
  { id:"m2-stonehill",      name:"Stonehill",          short:"Stonehill",       gender:"M", div:"2", conf:"NE10",  state:"MA" },

  // ECC
  { id:"m2-dyouville",      name:"D'Youville",         short:"D'Youville",      gender:"M", div:"2", conf:"ECC",   state:"NY" },
  { id:"m2-mercy",          name:"Mercy",              short:"Mercy",           gender:"M", div:"2", conf:"ECC",   state:"NY" },
  { id:"m2-molloy",         name:"Molloy",             short:"Molloy",          gender:"M", div:"2", conf:"ECC",   state:"NY" },
  { id:"m2-nyit",           name:"NYIT",               short:"NYIT",            gender:"M", div:"2", conf:"ECC",   state:"NY" },
  { id:"m2-roberts-wesleyan",name:"Roberts Wesleyan",  short:"Roberts Wesleyan",gender:"M", div:"2", conf:"ECC",   state:"NY" },
  { id:"m2-st-thomas-aquinas",name:"St. Thomas Aquinas",short:"St. Thomas Aquinas",gender:"M",div:"2",conf:"ECC",  state:"NY" },
  { id:"m2-daemen",         name:"Daemen",             short:"Daemen",          gender:"M", div:"2", conf:"ECC",   state:"NY" },

  // CACC
  { id:"m2-caldwell",       name:"Caldwell",           short:"Caldwell",        gender:"M", div:"2", conf:"CACC",  state:"NJ" },
  { id:"m2-chestnut-hill",  name:"Chestnut Hill",      short:"Chestnut Hill",   gender:"M", div:"2", conf:"CACC",  state:"PA" },
  { id:"m2-dominican-ny",   name:"Dominican (NY)",     short:"Dominican NY",    gender:"M", div:"2", conf:"CACC",  state:"NY" },
  { id:"m2-felician",       name:"Felician",           short:"Felician",        gender:"M", div:"2", conf:"CACC",  state:"NJ" },
  { id:"m2-georgian-court", name:"Georgian Court",     short:"Georgian Court",  gender:"M", div:"2", conf:"CACC",  state:"NJ" },
  { id:"m2-holy-family",    name:"Holy Family",        short:"Holy Family",     gender:"M", div:"2", conf:"CACC",  state:"PA" },
  { id:"m2-post",           name:"Post",               short:"Post",            gender:"M", div:"2", conf:"CACC",  state:"CT" },
  { id:"m2-wilmington",     name:"Wilmington (DE)",    short:"Wilmington",      gender:"M", div:"2", conf:"CACC",  state:"DE" },
  { id:"m2-bloomfield",     name:"Bloomfield",         short:"Bloomfield",      gender:"M", div:"2", conf:"CACC",  state:"NJ" },

  // SAC (South Atlantic Conference)
  { id:"m2-anderson",       name:"Anderson",           short:"Anderson",        gender:"M", div:"2", conf:"SAC",   state:"SC" },
  { id:"m2-catawba",        name:"Catawba",            short:"Catawba",         gender:"M", div:"2", conf:"SAC",   state:"NC" },
  { id:"m2-coker",          name:"Coker",              short:"Coker",           gender:"M", div:"2", conf:"SAC",   state:"SC" },
  { id:"m2-emory-henry",    name:"Emory & Henry",      short:"Emory & Henry",   gender:"M", div:"2", conf:"SAC",   state:"VA" },
  { id:"m2-lenoir-rhyne",   name:"Lenoir-Rhyne",       short:"Lenoir-Rhyne",    gender:"M", div:"2", conf:"SAC",   state:"NC" },
  { id:"m2-lees-mcrae",     name:"Lees-McRae",         short:"Lees-McRae",      gender:"M", div:"2", conf:"SAC",   state:"NC" },
  { id:"m2-limestone",      name:"Limestone",          short:"Limestone",       gender:"M", div:"2", conf:"SAC",   state:"SC" },
  { id:"m2-lincoln-memorial",name:"Lincoln Memorial",  short:"Lincoln Memorial",gender:"M", div:"2", conf:"SAC",   state:"TN" },
  { id:"m2-mars-hill",      name:"Mars Hill",          short:"Mars Hill",       gender:"M", div:"2", conf:"SAC",   state:"NC" },
  { id:"m2-newberry",       name:"Newberry",           short:"Newberry",        gender:"M", div:"2", conf:"SAC",   state:"SC" },
  { id:"m2-pfeiffer",       name:"Pfeiffer",           short:"Pfeiffer",        gender:"M", div:"2", conf:"SAC",   state:"NC" },
  { id:"m2-tusculum",       name:"Tusculum",           short:"Tusculum",        gender:"M", div:"2", conf:"SAC",   state:"TN" },
  { id:"m2-wingate",        name:"Wingate",            short:"Wingate",         gender:"M", div:"2", conf:"SAC",   state:"NC" },
  { id:"m2-queens",         name:"Queens (NC)",        short:"Queens",          gender:"M", div:"2", conf:"SAC",   state:"NC" },

  // SSC (Sunshine State Conference)
  { id:"m2-embry-riddle",   name:"Embry-Riddle",       short:"Embry-Riddle",    gender:"M", div:"2", conf:"SSC",   state:"FL" },
  { id:"m2-florida-southern",name:"Florida Southern",  short:"Florida Southern",gender:"M", div:"2", conf:"SSC",   state:"FL" },
  { id:"m2-florida-tech",   name:"Florida Tech",       short:"Florida Tech",    gender:"M", div:"2", conf:"SSC",   state:"FL" },
  { id:"m2-lynn",           name:"Lynn",               short:"Lynn",            gender:"M", div:"2", conf:"SSC",   state:"FL" },
  { id:"m2-palm-beach-atl", name:"Palm Beach Atlantic", short:"Palm Beach Atl", gender:"M", div:"2", conf:"SSC",   state:"FL" },
  { id:"m2-rollins",        name:"Rollins",            short:"Rollins",         gender:"M", div:"2", conf:"SSC",   state:"FL" },
  { id:"m2-saint-leo",      name:"Saint Leo",          short:"Saint Leo",       gender:"M", div:"2", conf:"SSC",   state:"FL" },
  { id:"m2-tampa",          name:"Tampa",              short:"Tampa",           gender:"M", div:"2", conf:"SSC",   state:"FL" },

  // RMAC (Rocky Mountain Athletic Conference)
  { id:"m2-adams-state",    name:"Adams State",        short:"Adams State",     gender:"M", div:"2", conf:"RMAC",  state:"CO" },
  { id:"m2-colorado-mesa",  name:"Colorado Mesa",      short:"Colorado Mesa",   gender:"M", div:"2", conf:"RMAC",  state:"CO" },
  { id:"m2-fort-lewis",     name:"Fort Lewis",         short:"Fort Lewis",      gender:"M", div:"2", conf:"RMAC",  state:"CO" },
  { id:"m2-westminster-ut", name:"Westminster (UT)",   short:"Westminster",     gender:"M", div:"2", conf:"RMAC",  state:"UT" },

  // GLVC (Great Lakes Valley Conference)
  { id:"m2-drury",          name:"Drury",              short:"Drury",           gender:"M", div:"2", conf:"GLVC",  state:"MO" },
  { id:"m2-illinois-spring",name:"Illinois Springfield",short:"UIS",            gender:"M", div:"2", conf:"GLVC",  state:"IL" },
  { id:"m2-uindy",          name:"Indianapolis",       short:"UIndy",           gender:"M", div:"2", conf:"GLVC",  state:"IN" },
  { id:"m2-lewis",          name:"Lewis",              short:"Lewis",           gender:"M", div:"2", conf:"GLVC",  state:"IL" },
  { id:"m2-lindenwood",     name:"Lindenwood",         short:"Lindenwood",      gender:"M", div:"2", conf:"GLVC",  state:"MO" },
  { id:"m2-maryville",      name:"Maryville",          short:"Maryville",       gender:"M", div:"2", conf:"GLVC",  state:"MO" },
  { id:"m2-mckendree",      name:"McKendree",          short:"McKendree",       gender:"M", div:"2", conf:"GLVC",  state:"IL" },
  { id:"m2-missouri-st",    name:"Missouri S&T",       short:"Missouri S&T",    gender:"M", div:"2", conf:"GLVC",  state:"MO" },
  { id:"m2-rockhurst",      name:"Rockhurst",          short:"Rockhurst",       gender:"M", div:"2", conf:"GLVC",  state:"MO" },

  // Conference Carolinas
  { id:"m2-barton",         name:"Barton",             short:"Barton",          gender:"M", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"m2-belmont-abbey",  name:"Belmont Abbey",      short:"Belmont Abbey",   gender:"M", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"m2-converse",       name:"Converse",           short:"Converse",        gender:"M", div:"2", conf:"Conf. Carolinas", state:"SC" },
  { id:"m2-emmanuel",       name:"Emmanuel (GA)",      short:"Emmanuel",        gender:"M", div:"2", conf:"Conf. Carolinas", state:"GA" },
  { id:"m2-erskine",        name:"Erskine",            short:"Erskine",         gender:"M", div:"2", conf:"Conf. Carolinas", state:"SC" },
  { id:"m2-king",           name:"King",               short:"King",            gender:"M", div:"2", conf:"Conf. Carolinas", state:"TN" },
  { id:"m2-mount-olive",    name:"Mount Olive",        short:"Mount Olive",     gender:"M", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"m2-north-greenville",name:"North Greenville",  short:"North Greenville",gender:"M", div:"2", conf:"Conf. Carolinas", state:"SC" },
  { id:"m2-st-andrews",     name:"St. Andrews",        short:"St. Andrews",     gender:"M", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"m2-southern-wesleyan",name:"Southern Wesleyan", short:"Southern Wesleyan",gender:"M",div:"2",conf:"Conf. Carolinas", state:"SC" },

  // PSAC (Pennsylvania State Athletic Conference) — men's
  { id:"m2-east-stroudsburg",name:"East Stroudsburg",  short:"East Stroudsburg",gender:"M", div:"2", conf:"PSAC",  state:"PA" },
  { id:"m2-mercyhurst",     name:"Mercyhurst",         short:"Mercyhurst",      gender:"M", div:"2", conf:"PSAC",  state:"PA" },
  { id:"m2-seton-hill",     name:"Seton Hill",         short:"Seton Hill",      gender:"M", div:"2", conf:"PSAC",  state:"PA" },
  { id:"m2-shippensburg",   name:"Shippensburg",       short:"Shippensburg",    gender:"M", div:"2", conf:"PSAC",  state:"PA" },

  // MEC (Mountain East Conference)
  { id:"m2-davis-elkins",   name:"Davis & Elkins",     short:"Davis & Elkins",  gender:"M", div:"2", conf:"MEC",   state:"WV" },
  { id:"m2-frostburg-state",name:"Frostburg State",    short:"Frostburg State", gender:"M", div:"2", conf:"MEC",   state:"MD" },
  { id:"m2-shepherd",       name:"Shepherd",           short:"Shepherd",        gender:"M", div:"2", conf:"MEC",   state:"WV" },
  { id:"m2-wv-wesleyan",    name:"West Virginia Wesleyan",short:"WV Wesleyan",  gender:"M", div:"2", conf:"MEC",   state:"WV" },
  { id:"m2-wheeling",       name:"Wheeling",           short:"Wheeling",        gender:"M", div:"2", conf:"MEC",   state:"WV" },
  { id:"m2-charleston",     name:"Charleston (WV)",    short:"Charleston",      gender:"M", div:"2", conf:"MEC",   state:"WV" },

  // ══════════════════════════════════════════════════════════════════════════
  // WOMEN'S D2
  // ══════════════════════════════════════════════════════════════════════════

  // NE10
  { id:"w2-adelphi",        name:"Adelphi",            short:"Adelphi",         gender:"W", div:"2", conf:"NE10",  state:"NY" },
  { id:"w2-assumption",     name:"Assumption",         short:"Assumption",      gender:"W", div:"2", conf:"NE10",  state:"MA" },
  { id:"w2-bentley",        name:"Bentley",            short:"Bentley",         gender:"W", div:"2", conf:"NE10",  state:"MA" },
  { id:"w2-franklin-pierce",name:"Franklin Pierce",    short:"Franklin Pierce", gender:"W", div:"2", conf:"NE10",  state:"NH" },
  { id:"w2-le-moyne",       name:"Le Moyne",           short:"Le Moyne",        gender:"W", div:"2", conf:"NE10",  state:"NY" },
  { id:"w2-merrimack",      name:"Merrimack",          short:"Merrimack",       gender:"W", div:"2", conf:"NE10",  state:"MA" },
  { id:"w2-pace",           name:"Pace",               short:"Pace",            gender:"W", div:"2", conf:"NE10",  state:"NY" },
  { id:"w2-saint-anselm",   name:"Saint Anselm",       short:"Saint Anselm",    gender:"W", div:"2", conf:"NE10",  state:"NH" },
  { id:"w2-saint-michaels", name:"Saint Michael's",    short:"Saint Michael's", gender:"W", div:"2", conf:"NE10",  state:"VT" },
  { id:"w2-snhu",           name:"Southern New Hampshire",short:"SNHU",          gender:"W", div:"2", conf:"NE10",  state:"NH" },
  { id:"w2-stonehill",      name:"Stonehill",          short:"Stonehill",       gender:"W", div:"2", conf:"NE10",  state:"MA" },
  { id:"w2-saint-rose",     name:"College of Saint Rose",short:"Saint Rose",    gender:"W", div:"2", conf:"NE10",  state:"NY" },

  // ECC
  { id:"w2-dyouville",      name:"D'Youville",         short:"D'Youville",      gender:"W", div:"2", conf:"ECC",   state:"NY" },
  { id:"w2-mercy",          name:"Mercy",              short:"Mercy",           gender:"W", div:"2", conf:"ECC",   state:"NY" },
  { id:"w2-molloy",         name:"Molloy",             short:"Molloy",          gender:"W", div:"2", conf:"ECC",   state:"NY" },
  { id:"w2-nyit",           name:"NYIT",               short:"NYIT",            gender:"W", div:"2", conf:"ECC",   state:"NY" },
  { id:"w2-roberts-wesleyan",name:"Roberts Wesleyan",  short:"Roberts Wesleyan",gender:"W", div:"2", conf:"ECC",   state:"NY" },
  { id:"w2-st-thomas-aquinas",name:"St. Thomas Aquinas",short:"St. Thomas Aquinas",gender:"W",div:"2",conf:"ECC",  state:"NY" },
  { id:"w2-daemen",         name:"Daemen",             short:"Daemen",          gender:"W", div:"2", conf:"ECC",   state:"NY" },

  // CACC
  { id:"w2-caldwell",       name:"Caldwell",           short:"Caldwell",        gender:"W", div:"2", conf:"CACC",  state:"NJ" },
  { id:"w2-chestnut-hill",  name:"Chestnut Hill",      short:"Chestnut Hill",   gender:"W", div:"2", conf:"CACC",  state:"PA" },
  { id:"w2-dominican-ny",   name:"Dominican (NY)",     short:"Dominican NY",    gender:"W", div:"2", conf:"CACC",  state:"NY" },
  { id:"w2-felician",       name:"Felician",           short:"Felician",        gender:"W", div:"2", conf:"CACC",  state:"NJ" },
  { id:"w2-georgian-court", name:"Georgian Court",     short:"Georgian Court",  gender:"W", div:"2", conf:"CACC",  state:"NJ" },
  { id:"w2-holy-family",    name:"Holy Family",        short:"Holy Family",     gender:"W", div:"2", conf:"CACC",  state:"PA" },
  { id:"w2-post",           name:"Post",               short:"Post",            gender:"W", div:"2", conf:"CACC",  state:"CT" },
  { id:"w2-wilmington",     name:"Wilmington (DE)",    short:"Wilmington",      gender:"W", div:"2", conf:"CACC",  state:"DE" },
  { id:"w2-bloomfield",     name:"Bloomfield",         short:"Bloomfield",      gender:"W", div:"2", conf:"CACC",  state:"NJ" },
  { id:"w2-jefferson",      name:"Jefferson",          short:"Jefferson",       gender:"W", div:"2", conf:"CACC",  state:"PA" },

  // SAC
  { id:"w2-anderson",       name:"Anderson",           short:"Anderson",        gender:"W", div:"2", conf:"SAC",   state:"SC" },
  { id:"w2-catawba",        name:"Catawba",            short:"Catawba",         gender:"W", div:"2", conf:"SAC",   state:"NC" },
  { id:"w2-coker",          name:"Coker",              short:"Coker",           gender:"W", div:"2", conf:"SAC",   state:"SC" },
  { id:"w2-emory-henry",    name:"Emory & Henry",      short:"Emory & Henry",   gender:"W", div:"2", conf:"SAC",   state:"VA" },
  { id:"w2-lenoir-rhyne",   name:"Lenoir-Rhyne",       short:"Lenoir-Rhyne",    gender:"W", div:"2", conf:"SAC",   state:"NC" },
  { id:"w2-lees-mcrae",     name:"Lees-McRae",         short:"Lees-McRae",      gender:"W", div:"2", conf:"SAC",   state:"NC" },
  { id:"w2-limestone",      name:"Limestone",          short:"Limestone",       gender:"W", div:"2", conf:"SAC",   state:"SC" },
  { id:"w2-lincoln-memorial",name:"Lincoln Memorial",  short:"Lincoln Memorial",gender:"W", div:"2", conf:"SAC",   state:"TN" },
  { id:"w2-mars-hill",      name:"Mars Hill",          short:"Mars Hill",       gender:"W", div:"2", conf:"SAC",   state:"NC" },
  { id:"w2-newberry",       name:"Newberry",           short:"Newberry",        gender:"W", div:"2", conf:"SAC",   state:"SC" },
  { id:"w2-pfeiffer",       name:"Pfeiffer",           short:"Pfeiffer",        gender:"W", div:"2", conf:"SAC",   state:"NC" },
  { id:"w2-tusculum",       name:"Tusculum",           short:"Tusculum",        gender:"W", div:"2", conf:"SAC",   state:"TN" },
  { id:"w2-wingate",        name:"Wingate",            short:"Wingate",         gender:"W", div:"2", conf:"SAC",   state:"NC" },
  { id:"w2-queens",         name:"Queens (NC)",        short:"Queens",          gender:"W", div:"2", conf:"SAC",   state:"NC" },

  // SSC
  { id:"w2-embry-riddle",   name:"Embry-Riddle",       short:"Embry-Riddle",    gender:"W", div:"2", conf:"SSC",   state:"FL" },
  { id:"w2-florida-southern",name:"Florida Southern",  short:"Florida Southern",gender:"W", div:"2", conf:"SSC",   state:"FL" },
  { id:"w2-florida-tech",   name:"Florida Tech",       short:"Florida Tech",    gender:"W", div:"2", conf:"SSC",   state:"FL" },
  { id:"w2-lynn",           name:"Lynn",               short:"Lynn",            gender:"W", div:"2", conf:"SSC",   state:"FL" },
  { id:"w2-palm-beach-atl", name:"Palm Beach Atlantic", short:"Palm Beach Atl", gender:"W", div:"2", conf:"SSC",   state:"FL" },
  { id:"w2-rollins",        name:"Rollins",            short:"Rollins",         gender:"W", div:"2", conf:"SSC",   state:"FL" },
  { id:"w2-saint-leo",      name:"Saint Leo",          short:"Saint Leo",       gender:"W", div:"2", conf:"SSC",   state:"FL" },
  { id:"w2-tampa",          name:"Tampa",              short:"Tampa",           gender:"W", div:"2", conf:"SSC",   state:"FL" },

  // RMAC
  { id:"w2-adams-state",    name:"Adams State",        short:"Adams State",     gender:"W", div:"2", conf:"RMAC",  state:"CO" },
  { id:"w2-colorado-mesa",  name:"Colorado Mesa",      short:"Colorado Mesa",   gender:"W", div:"2", conf:"RMAC",  state:"CO" },
  { id:"w2-fort-lewis",     name:"Fort Lewis",         short:"Fort Lewis",      gender:"W", div:"2", conf:"RMAC",  state:"CO" },
  { id:"w2-westminster-ut", name:"Westminster (UT)",   short:"Westminster",     gender:"W", div:"2", conf:"RMAC",  state:"UT" },
  { id:"w2-regis",          name:"Regis",              short:"Regis",           gender:"W", div:"2", conf:"RMAC",  state:"CO" },

  // GLVC
  { id:"w2-drury",          name:"Drury",              short:"Drury",           gender:"W", div:"2", conf:"GLVC",  state:"MO" },
  { id:"w2-illinois-spring",name:"Illinois Springfield",short:"UIS",            gender:"W", div:"2", conf:"GLVC",  state:"IL" },
  { id:"w2-uindy",          name:"Indianapolis",       short:"UIndy",           gender:"W", div:"2", conf:"GLVC",  state:"IN" },
  { id:"w2-lewis",          name:"Lewis",              short:"Lewis",           gender:"W", div:"2", conf:"GLVC",  state:"IL" },
  { id:"w2-lindenwood",     name:"Lindenwood",         short:"Lindenwood",      gender:"W", div:"2", conf:"GLVC",  state:"MO" },
  { id:"w2-maryville",      name:"Maryville",          short:"Maryville",       gender:"W", div:"2", conf:"GLVC",  state:"MO" },
  { id:"w2-mckendree",      name:"McKendree",          short:"McKendree",       gender:"W", div:"2", conf:"GLVC",  state:"IL" },
  { id:"w2-missouri-st",    name:"Missouri S&T",       short:"Missouri S&T",    gender:"W", div:"2", conf:"GLVC",  state:"MO" },
  { id:"w2-rockhurst",      name:"Rockhurst",          short:"Rockhurst",       gender:"W", div:"2", conf:"GLVC",  state:"MO" },
  { id:"w2-quincy",         name:"Quincy",             short:"Quincy",          gender:"W", div:"2", conf:"GLVC",  state:"IL" },

  // Conference Carolinas
  { id:"w2-barton",         name:"Barton",             short:"Barton",          gender:"W", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"w2-belmont-abbey",  name:"Belmont Abbey",      short:"Belmont Abbey",   gender:"W", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"w2-converse",       name:"Converse",           short:"Converse",        gender:"W", div:"2", conf:"Conf. Carolinas", state:"SC" },
  { id:"w2-emmanuel",       name:"Emmanuel (GA)",      short:"Emmanuel",        gender:"W", div:"2", conf:"Conf. Carolinas", state:"GA" },
  { id:"w2-erskine",        name:"Erskine",            short:"Erskine",         gender:"W", div:"2", conf:"Conf. Carolinas", state:"SC" },
  { id:"w2-king",           name:"King",               short:"King",            gender:"W", div:"2", conf:"Conf. Carolinas", state:"TN" },
  { id:"w2-mount-olive",    name:"Mount Olive",        short:"Mount Olive",     gender:"W", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"w2-north-greenville",name:"North Greenville",  short:"North Greenville",gender:"W", div:"2", conf:"Conf. Carolinas", state:"SC" },
  { id:"w2-st-andrews",     name:"St. Andrews",        short:"St. Andrews",     gender:"W", div:"2", conf:"Conf. Carolinas", state:"NC" },
  { id:"w2-southern-wesleyan",name:"Southern Wesleyan", short:"Southern Wesleyan",gender:"W",div:"2",conf:"Conf. Carolinas", state:"SC" },
  { id:"w2-chowan",         name:"Chowan",             short:"Chowan",          gender:"W", div:"2", conf:"Conf. Carolinas", state:"NC" },

  // PSAC
  { id:"w2-bloomsburg",     name:"Bloomsburg",         short:"Bloomsburg",      gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-east-stroudsburg",name:"East Stroudsburg",  short:"East Stroudsburg",gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-edinboro",       name:"Edinboro",           short:"Edinboro",        gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-gannon",         name:"Gannon",             short:"Gannon",          gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-iup",            name:"IUP",                short:"IUP",             gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-kutztown",       name:"Kutztown",           short:"Kutztown",        gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-lock-haven",     name:"Lock Haven",         short:"Lock Haven",      gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-mercyhurst",     name:"Mercyhurst",         short:"Mercyhurst",      gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-millersville",   name:"Millersville",       short:"Millersville",    gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-seton-hill",     name:"Seton Hill",         short:"Seton Hill",      gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-shepherd",       name:"Shepherd",           short:"Shepherd",        gender:"W", div:"2", conf:"PSAC",  state:"WV" },
  { id:"w2-shippensburg",   name:"Shippensburg",       short:"Shippensburg",    gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-slippery-rock",  name:"Slippery Rock",      short:"Slippery Rock",   gender:"W", div:"2", conf:"PSAC",  state:"PA" },
  { id:"w2-west-chester",   name:"West Chester",       short:"West Chester",    gender:"W", div:"2", conf:"PSAC",  state:"PA" },

  // MEC
  { id:"w2-charleston",     name:"Charleston (WV)",    short:"Charleston",      gender:"W", div:"2", conf:"MEC",   state:"WV" },
  { id:"w2-davis-elkins",   name:"Davis & Elkins",     short:"Davis & Elkins",  gender:"W", div:"2", conf:"MEC",   state:"WV" },
  { id:"w2-frostburg-state",name:"Frostburg State",    short:"Frostburg State", gender:"W", div:"2", conf:"MEC",   state:"MD" },
  { id:"w2-wv-wesleyan",    name:"West Virginia Wesleyan",short:"WV Wesleyan",  gender:"W", div:"2", conf:"MEC",   state:"WV" },
  { id:"w2-wheeling",       name:"Wheeling",           short:"Wheeling",        gender:"W", div:"2", conf:"MEC",   state:"WV" },
  { id:"w2-alderson-broaddus",name:"Alderson Broaddus", short:"Alderson Broaddus",gender:"W",div:"2",conf:"MEC",   state:"WV" },
  { id:"w2-notre-dame-oh",  name:"Notre Dame (OH)",    short:"Notre Dame OH",   gender:"W", div:"2", conf:"MEC",   state:"OH" },
  { id:"w2-ursuline",       name:"Ursuline",           short:"Ursuline",        gender:"W", div:"2", conf:"MEC",   state:"OH" },

  // ══════════════════════════════════════════════════════════════════════════
  // MEN'S D3
  // ══════════════════════════════════════════════════════════════════════════

  // NESCAC
  { id:"m3-amherst",        name:"Amherst",            short:"Amherst",         gender:"M", div:"3", conf:"NESCAC",       state:"MA" },
  { id:"m3-bates",          name:"Bates",              short:"Bates",           gender:"M", div:"3", conf:"NESCAC",       state:"ME" },
  { id:"m3-bowdoin",        name:"Bowdoin",            short:"Bowdoin",         gender:"M", div:"3", conf:"NESCAC",       state:"ME" },
  { id:"m3-colby",          name:"Colby",              short:"Colby",           gender:"M", div:"3", conf:"NESCAC",       state:"ME" },
  { id:"m3-conn-college",   name:"Connecticut College", short:"Conn College",   gender:"M", div:"3", conf:"NESCAC",       state:"CT" },
  { id:"m3-hamilton",       name:"Hamilton",           short:"Hamilton",        gender:"M", div:"3", conf:"NESCAC",       state:"NY" },
  { id:"m3-middlebury",     name:"Middlebury",         short:"Middlebury",      gender:"M", div:"3", conf:"NESCAC",       state:"VT" },
  { id:"m3-tufts",          name:"Tufts",              short:"Tufts",           gender:"M", div:"3", conf:"NESCAC",       state:"MA" },
  { id:"m3-trinity",        name:"Trinity (CT)",       short:"Trinity",         gender:"M", div:"3", conf:"NESCAC",       state:"CT" },
  { id:"m3-wesleyan",       name:"Wesleyan",           short:"Wesleyan",        gender:"M", div:"3", conf:"NESCAC",       state:"CT" },
  { id:"m3-williams",       name:"Williams",           short:"Williams",        gender:"M", div:"3", conf:"NESCAC",       state:"MA" },

  // Centennial
  { id:"m3-dickinson",      name:"Dickinson",          short:"Dickinson",       gender:"M", div:"3", conf:"Centennial",   state:"PA" },
  { id:"m3-fm",             name:"Franklin & Marshall", short:"F&M",            gender:"M", div:"3", conf:"Centennial",   state:"PA" },
  { id:"m3-gettysburg",     name:"Gettysburg",         short:"Gettysburg",      gender:"M", div:"3", conf:"Centennial",   state:"PA" },
  { id:"m3-haverford",      name:"Haverford",          short:"Haverford",       gender:"M", div:"3", conf:"Centennial",   state:"PA" },
  { id:"m3-mcdaniel",       name:"McDaniel",           short:"McDaniel",        gender:"M", div:"3", conf:"Centennial",   state:"MD" },
  { id:"m3-muhlenberg",     name:"Muhlenberg",         short:"Muhlenberg",      gender:"M", div:"3", conf:"Centennial",   state:"PA" },
  { id:"m3-swarthmore",     name:"Swarthmore",         short:"Swarthmore",      gender:"M", div:"3", conf:"Centennial",   state:"PA" },
  { id:"m3-ursinus",        name:"Ursinus",            short:"Ursinus",         gender:"M", div:"3", conf:"Centennial",   state:"PA" },
  { id:"m3-washington-col", name:"Washington College",  short:"Washington Col", gender:"M", div:"3", conf:"Centennial",   state:"MD" },

  // Liberty League
  { id:"m3-bard",           name:"Bard",               short:"Bard",            gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-clarkson",       name:"Clarkson",           short:"Clarkson",        gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-hobart",         name:"Hobart",             short:"Hobart",          gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-ithaca",         name:"Ithaca",             short:"Ithaca",          gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-rit",            name:"RIT",                short:"RIT",             gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-rpi",            name:"RPI",                short:"RPI",             gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-rochester",      name:"Rochester",          short:"Rochester",       gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-skidmore",       name:"Skidmore",           short:"Skidmore",        gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-st-lawrence",    name:"St. Lawrence",       short:"St. Lawrence",    gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-union",          name:"Union",              short:"Union",           gender:"M", div:"3", conf:"Liberty League", state:"NY" },
  { id:"m3-vassar",         name:"Vassar",             short:"Vassar",          gender:"M", div:"3", conf:"Liberty League", state:"NY" },

  // SUNYAC
  { id:"m3-brockport",      name:"SUNY Brockport",     short:"Brockport",       gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-cortland",       name:"SUNY Cortland",      short:"Cortland",        gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-fredonia",       name:"SUNY Fredonia",      short:"Fredonia",        gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-geneseo",        name:"SUNY Geneseo",       short:"Geneseo",         gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-morrisville",    name:"SUNY Morrisville",   short:"Morrisville",     gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-oneonta",        name:"SUNY Oneonta",       short:"Oneonta",         gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-oswego",         name:"SUNY Oswego",        short:"Oswego",          gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-plattsburgh",    name:"SUNY Plattsburgh",   short:"Plattsburgh",     gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"m3-potsdam",        name:"SUNY Potsdam",       short:"Potsdam",         gender:"M", div:"3", conf:"SUNYAC",       state:"NY" },

  // CAC (Capital Athletic Conference)
  { id:"m3-salisbury",      name:"Salisbury",          short:"Salisbury",       gender:"M", div:"3", conf:"CAC",          state:"MD" },
  { id:"m3-christopher-newport",name:"Christopher Newport",short:"CNU",         gender:"M", div:"3", conf:"CAC",          state:"VA" },
  { id:"m3-frostburg",      name:"Frostburg State",    short:"Frostburg",       gender:"M", div:"3", conf:"CAC",          state:"MD" },
  { id:"m3-mary-washington",name:"Mary Washington",    short:"Mary Washington", gender:"M", div:"3", conf:"CAC",          state:"VA" },
  { id:"m3-st-marys",       name:"St. Mary's (MD)",    short:"St. Mary's",      gender:"M", div:"3", conf:"CAC",          state:"MD" },
  { id:"m3-southern-virginia",name:"Southern Virginia", short:"Southern Virginia",gender:"M",div:"3", conf:"CAC",          state:"VA" },
  { id:"m3-york-pa",        name:"York (PA)",          short:"York",            gender:"M", div:"3", conf:"CAC",          state:"PA" },
  { id:"m3-marymount",      name:"Marymount",          short:"Marymount",       gender:"M", div:"3", conf:"CAC",          state:"VA" },

  // NCAC (North Coast Athletic Conference)
  { id:"m3-denison",        name:"Denison",            short:"Denison",         gender:"M", div:"3", conf:"NCAC",         state:"OH" },
  { id:"m3-kenyon",         name:"Kenyon",             short:"Kenyon",          gender:"M", div:"3", conf:"NCAC",         state:"OH" },
  { id:"m3-oberlin",        name:"Oberlin",            short:"Oberlin",         gender:"M", div:"3", conf:"NCAC",         state:"OH" },
  { id:"m3-ohio-wesleyan",  name:"Ohio Wesleyan",      short:"Ohio Wesleyan",   gender:"M", div:"3", conf:"NCAC",         state:"OH" },
  { id:"m3-wabash",         name:"Wabash",             short:"Wabash",          gender:"M", div:"3", conf:"NCAC",         state:"IN" },
  { id:"m3-wooster",        name:"Wooster",            short:"Wooster",         gender:"M", div:"3", conf:"NCAC",         state:"OH" },
  { id:"m3-wittenberg",     name:"Wittenberg",         short:"Wittenberg",      gender:"M", div:"3", conf:"NCAC",         state:"OH" },
  { id:"m3-depauw",         name:"DePauw",             short:"DePauw",          gender:"M", div:"3", conf:"NCAC",         state:"IN" },

  // ODAC (Old Dominion Athletic Conference)
  { id:"m3-washington-lee", name:"Washington & Lee",   short:"W&L",             gender:"M", div:"3", conf:"ODAC",         state:"VA" },
  { id:"m3-lynchburg",      name:"Lynchburg",          short:"Lynchburg",       gender:"M", div:"3", conf:"ODAC",         state:"VA" },
  { id:"m3-roanoke",        name:"Roanoke",            short:"Roanoke",         gender:"M", div:"3", conf:"ODAC",         state:"VA" },
  { id:"m3-guilford",       name:"Guilford",           short:"Guilford",        gender:"M", div:"3", conf:"ODAC",         state:"NC" },
  { id:"m3-hampden-sydney", name:"Hampden-Sydney",     short:"Hampden-Sydney",  gender:"M", div:"3", conf:"ODAC",         state:"VA" },
  { id:"m3-randolph-macon", name:"Randolph-Macon",     short:"Randolph-Macon",  gender:"M", div:"3", conf:"ODAC",         state:"VA" },
  { id:"m3-shenandoah",     name:"Shenandoah",         short:"Shenandoah",      gender:"M", div:"3", conf:"ODAC",         state:"VA" },
  { id:"m3-virginia-wesleyan",name:"Virginia Wesleyan", short:"Virginia Wesleyan",gender:"M",div:"3",conf:"ODAC",         state:"VA" },
  { id:"m3-bridgewater",    name:"Bridgewater",        short:"Bridgewater",     gender:"M", div:"3", conf:"ODAC",         state:"VA" },
  { id:"m3-ferrum",         name:"Ferrum",             short:"Ferrum",          gender:"M", div:"3", conf:"ODAC",         state:"VA" },

  // MAC Commonwealth
  { id:"m3-stevenson",      name:"Stevenson",          short:"Stevenson",       gender:"M", div:"3", conf:"MAC",          state:"MD" },
  { id:"m3-alvernia",       name:"Alvernia",           short:"Alvernia",        gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-arcadia",        name:"Arcadia",            short:"Arcadia",         gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-delaware-valley",name:"Delaware Valley",    short:"Delaware Valley", gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-eastern",        name:"Eastern",            short:"Eastern",         gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-hood",           name:"Hood",               short:"Hood",            gender:"M", div:"3", conf:"MAC",          state:"MD" },
  { id:"m3-king-pa",        name:"King's (PA)",        short:"King's",          gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-lebanon-valley", name:"Lebanon Valley",     short:"Lebanon Valley",  gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-lycoming",       name:"Lycoming",           short:"Lycoming",        gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-manhattanville", name:"Manhattanville",     short:"Manhattanville",  gender:"M", div:"3", conf:"MAC",          state:"NY" },
  { id:"m3-misericordia",   name:"Misericordia",       short:"Misericordia",    gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-wilkes",         name:"Wilkes",             short:"Wilkes",          gender:"M", div:"3", conf:"MAC",          state:"PA" },
  { id:"m3-widener",        name:"Widener",            short:"Widener",         gender:"M", div:"3", conf:"MAC",          state:"PA" },

  // Empire 8
  { id:"m3-alfred",         name:"Alfred",             short:"Alfred",          gender:"M", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"m3-elmira",         name:"Elmira",             short:"Elmira",          gender:"M", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"m3-hartwick",       name:"Hartwick",           short:"Hartwick",        gender:"M", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"m3-houghton",       name:"Houghton",           short:"Houghton",        gender:"M", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"m3-nazareth",       name:"Nazareth",           short:"Nazareth",        gender:"M", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"m3-st-john-fisher", name:"St. John Fisher",    short:"St. John Fisher", gender:"M", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"m3-stevens",        name:"Stevens",            short:"Stevens",         gender:"M", div:"3", conf:"Empire 8",     state:"NJ" },
  { id:"m3-utica",          name:"Utica",              short:"Utica",           gender:"M", div:"3", conf:"Empire 8",     state:"NY" },

  // Landmark
  { id:"m3-catholic",       name:"Catholic",           short:"Catholic",        gender:"M", div:"3", conf:"Landmark",     state:"DC" },
  { id:"m3-drew",           name:"Drew",               short:"Drew",            gender:"M", div:"3", conf:"Landmark",     state:"NJ" },
  { id:"m3-elizabethtown",  name:"Elizabethtown",      short:"Elizabethtown",   gender:"M", div:"3", conf:"Landmark",     state:"PA" },
  { id:"m3-goucher",        name:"Goucher",            short:"Goucher",         gender:"M", div:"3", conf:"Landmark",     state:"MD" },
  { id:"m3-juniata",        name:"Juniata",            short:"Juniata",         gender:"M", div:"3", conf:"Landmark",     state:"PA" },
  { id:"m3-moravian",       name:"Moravian",           short:"Moravian",        gender:"M", div:"3", conf:"Landmark",     state:"PA" },
  { id:"m3-scranton",       name:"Scranton",           short:"Scranton",        gender:"M", div:"3", conf:"Landmark",     state:"PA" },
  { id:"m3-susquehanna",    name:"Susquehanna",        short:"Susquehanna",     gender:"M", div:"3", conf:"Landmark",     state:"PA" },

  // NEWMAC
  { id:"m3-babson",         name:"Babson",             short:"Babson",          gender:"M", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"m3-clark",          name:"Clark",              short:"Clark",           gender:"M", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"m3-coast-guard",    name:"Coast Guard",        short:"Coast Guard",     gender:"M", div:"3", conf:"NEWMAC",       state:"CT" },
  { id:"m3-emerson",        name:"Emerson",            short:"Emerson",         gender:"M", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"m3-mit",            name:"MIT",                short:"MIT",             gender:"M", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"m3-springfield",    name:"Springfield",        short:"Springfield",     gender:"M", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"m3-wentworth",      name:"Wentworth",          short:"Wentworth",       gender:"M", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"m3-wpi",            name:"WPI",                short:"WPI",             gender:"M", div:"3", conf:"NEWMAC",       state:"MA" },

  // CCC (Commonwealth Coast Conference)
  { id:"m3-curry",          name:"Curry",              short:"Curry",           gender:"M", div:"3", conf:"CCC",          state:"MA" },
  { id:"m3-eastern-nazarene",name:"Eastern Nazarene",  short:"Eastern Nazarene",gender:"M", div:"3", conf:"CCC",          state:"MA" },
  { id:"m3-endicott",       name:"Endicott",           short:"Endicott",        gender:"M", div:"3", conf:"CCC",          state:"MA" },
  { id:"m3-gordon",         name:"Gordon",             short:"Gordon",          gender:"M", div:"3", conf:"CCC",          state:"MA" },
  { id:"m3-nichols",        name:"Nichols",            short:"Nichols",         gender:"M", div:"3", conf:"CCC",          state:"MA" },
  { id:"m3-roger-williams", name:"Roger Williams",     short:"Roger Williams",  gender:"M", div:"3", conf:"CCC",          state:"RI" },
  { id:"m3-salve-regina",   name:"Salve Regina",       short:"Salve Regina",    gender:"M", div:"3", conf:"CCC",          state:"RI" },
  { id:"m3-wentworth-ccc",  name:"Western New England",short:"Western New England",gender:"M",div:"3",conf:"CCC",         state:"MA" },
  { id:"m3-univ-new-england",name:"New England",       short:"UNE",             gender:"M", div:"3", conf:"CCC",          state:"ME" },

  // Midwest Lacrosse Conference
  { id:"m3-adrian",         name:"Adrian",             short:"Adrian",          gender:"M", div:"3", conf:"MLC",          state:"MI" },
  { id:"m3-albion",         name:"Albion",             short:"Albion",          gender:"M", div:"3", conf:"MLC",          state:"MI" },
  { id:"m3-alma",           name:"Alma",               short:"Alma",            gender:"M", div:"3", conf:"MLC",          state:"MI" },
  { id:"m3-kalamazoo",      name:"Kalamazoo",          short:"Kalamazoo",       gender:"M", div:"3", conf:"MLC",          state:"MI" },
  { id:"m3-olivet",         name:"Olivet",             short:"Olivet",          gender:"M", div:"3", conf:"MLC",          state:"MI" },
  { id:"m3-trine",          name:"Trine",              short:"Trine",           gender:"M", div:"3", conf:"MLC",          state:"IN" },

  // Skyline Conference
  { id:"m3-farmingdale",    name:"Farmingdale State",  short:"Farmingdale",     gender:"M", div:"3", conf:"Skyline",      state:"NY" },
  { id:"m3-maritime",       name:"SUNY Maritime",      short:"Maritime",        gender:"M", div:"3", conf:"Skyline",      state:"NY" },
  { id:"m3-mount-st-mary",  name:"Mount St. Mary (NY)",short:"Mount St. Mary",  gender:"M", div:"3", conf:"Skyline",      state:"NY" },
  { id:"m3-old-westbury",   name:"SUNY Old Westbury",  short:"Old Westbury",    gender:"M", div:"3", conf:"Skyline",      state:"NY" },
  { id:"m3-purchase",       name:"SUNY Purchase",      short:"Purchase",        gender:"M", div:"3", conf:"Skyline",      state:"NY" },
  { id:"m3-sage",           name:"Sage",               short:"Sage",            gender:"M", div:"3", conf:"Skyline",      state:"NY" },
  { id:"m3-yeshiva",        name:"Yeshiva",            short:"Yeshiva",         gender:"M", div:"3", conf:"Skyline",      state:"NY" },
  { id:"m3-st-joseph-li",   name:"St. Joseph's (LI)",  short:"St. Joseph's LI", gender:"M", div:"3", conf:"Skyline",      state:"NY" },

  // Little East
  { id:"m3-castleton",      name:"Castleton",          short:"Castleton",       gender:"M", div:"3", conf:"Little East",  state:"VT" },
  { id:"m3-eastern-conn",   name:"Eastern Connecticut",short:"Eastern Conn",    gender:"M", div:"3", conf:"Little East",  state:"CT" },
  { id:"m3-keene-state",    name:"Keene State",        short:"Keene State",     gender:"M", div:"3", conf:"Little East",  state:"NH" },
  { id:"m3-plymouth-state", name:"Plymouth State",     short:"Plymouth State",  gender:"M", div:"3", conf:"Little East",  state:"NH" },
  { id:"m3-rhode-island-col",name:"Rhode Island College",short:"Rhode Island Col",gender:"M",div:"3",conf:"Little East",  state:"RI" },
  { id:"m3-umass-dartmouth",name:"UMass Dartmouth",    short:"UMass Dartmouth", gender:"M", div:"3", conf:"Little East",  state:"MA" },
  { id:"m3-west-conn",      name:"Western Connecticut",short:"Western Conn",    gender:"M", div:"3", conf:"Little East",  state:"CT" },

  // SCIAC
  { id:"m3-chapman",        name:"Chapman",            short:"Chapman",         gender:"M", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"m3-claremont-ms",   name:"Claremont-Mudd-Scripps",short:"CMS",         gender:"M", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"m3-occidental",     name:"Occidental",         short:"Occidental",      gender:"M", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"m3-pomona-pitzer",  name:"Pomona-Pitzer",      short:"Pomona-Pitzer",   gender:"M", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"m3-redlands",       name:"Redlands",           short:"Redlands",        gender:"M", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"m3-whittier",       name:"Whittier",           short:"Whittier",        gender:"M", div:"3", conf:"SCIAC",        state:"CA" },

  // ══════════════════════════════════════════════════════════════════════════
  // WOMEN'S D3
  // ══════════════════════════════════════════════════════════════════════════

  // NESCAC
  { id:"w3-amherst",        name:"Amherst",            short:"Amherst",         gender:"W", div:"3", conf:"NESCAC",       state:"MA" },
  { id:"w3-bates",          name:"Bates",              short:"Bates",           gender:"W", div:"3", conf:"NESCAC",       state:"ME" },
  { id:"w3-bowdoin",        name:"Bowdoin",            short:"Bowdoin",         gender:"W", div:"3", conf:"NESCAC",       state:"ME" },
  { id:"w3-colby",          name:"Colby",              short:"Colby",           gender:"W", div:"3", conf:"NESCAC",       state:"ME" },
  { id:"w3-conn-college",   name:"Connecticut College", short:"Conn College",   gender:"W", div:"3", conf:"NESCAC",       state:"CT" },
  { id:"w3-hamilton",       name:"Hamilton",           short:"Hamilton",        gender:"W", div:"3", conf:"NESCAC",       state:"NY" },
  { id:"w3-middlebury",     name:"Middlebury",         short:"Middlebury",      gender:"W", div:"3", conf:"NESCAC",       state:"VT" },
  { id:"w3-tufts",          name:"Tufts",              short:"Tufts",           gender:"W", div:"3", conf:"NESCAC",       state:"MA" },
  { id:"w3-trinity",        name:"Trinity (CT)",       short:"Trinity",         gender:"W", div:"3", conf:"NESCAC",       state:"CT" },
  { id:"w3-wesleyan",       name:"Wesleyan",           short:"Wesleyan",        gender:"W", div:"3", conf:"NESCAC",       state:"CT" },
  { id:"w3-williams",       name:"Williams",           short:"Williams",        gender:"W", div:"3", conf:"NESCAC",       state:"MA" },

  // Centennial
  { id:"w3-bryn-mawr",      name:"Bryn Mawr",          short:"Bryn Mawr",       gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-dickinson",      name:"Dickinson",          short:"Dickinson",       gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-fm",             name:"Franklin & Marshall", short:"F&M",            gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-gettysburg",     name:"Gettysburg",         short:"Gettysburg",      gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-haverford",      name:"Haverford",          short:"Haverford",       gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-mcdaniel",       name:"McDaniel",           short:"McDaniel",        gender:"W", div:"3", conf:"Centennial",   state:"MD" },
  { id:"w3-muhlenberg",     name:"Muhlenberg",         short:"Muhlenberg",      gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-swarthmore",     name:"Swarthmore",         short:"Swarthmore",      gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-ursinus",        name:"Ursinus",            short:"Ursinus",         gender:"W", div:"3", conf:"Centennial",   state:"PA" },
  { id:"w3-washington-col", name:"Washington College",  short:"Washington Col", gender:"W", div:"3", conf:"Centennial",   state:"MD" },

  // Liberty League
  { id:"w3-bard",           name:"Bard",               short:"Bard",            gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-clarkson",       name:"Clarkson",           short:"Clarkson",        gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-ithaca",         name:"Ithaca",             short:"Ithaca",          gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-rit",            name:"RIT",                short:"RIT",             gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-rpi",            name:"RPI",                short:"RPI",             gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-rochester",      name:"Rochester",          short:"Rochester",       gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-skidmore",       name:"Skidmore",           short:"Skidmore",        gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-st-lawrence",    name:"St. Lawrence",       short:"St. Lawrence",    gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-union",          name:"Union",              short:"Union",           gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-vassar",         name:"Vassar",             short:"Vassar",          gender:"W", div:"3", conf:"Liberty League", state:"NY" },
  { id:"w3-william-smith",  name:"William Smith",      short:"William Smith",   gender:"W", div:"3", conf:"Liberty League", state:"NY" },

  // SUNYAC
  { id:"w3-brockport",      name:"SUNY Brockport",     short:"Brockport",       gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-cortland",       name:"SUNY Cortland",      short:"Cortland",        gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-fredonia",       name:"SUNY Fredonia",      short:"Fredonia",        gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-geneseo",        name:"SUNY Geneseo",       short:"Geneseo",         gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-morrisville",    name:"SUNY Morrisville",   short:"Morrisville",     gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-new-paltz",      name:"SUNY New Paltz",     short:"New Paltz",       gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-oneonta",        name:"SUNY Oneonta",       short:"Oneonta",         gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-oswego",         name:"SUNY Oswego",        short:"Oswego",          gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-plattsburgh",    name:"SUNY Plattsburgh",   short:"Plattsburgh",     gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },
  { id:"w3-potsdam",        name:"SUNY Potsdam",       short:"Potsdam",         gender:"W", div:"3", conf:"SUNYAC",       state:"NY" },

  // CAC
  { id:"w3-salisbury",      name:"Salisbury",          short:"Salisbury",       gender:"W", div:"3", conf:"CAC",          state:"MD" },
  { id:"w3-christopher-newport",name:"Christopher Newport",short:"CNU",         gender:"W", div:"3", conf:"CAC",          state:"VA" },
  { id:"w3-mary-washington",name:"Mary Washington",    short:"Mary Washington", gender:"W", div:"3", conf:"CAC",          state:"VA" },
  { id:"w3-st-marys",       name:"St. Mary's (MD)",    short:"St. Mary's",      gender:"W", div:"3", conf:"CAC",          state:"MD" },
  { id:"w3-southern-virginia",name:"Southern Virginia", short:"Southern Virginia",gender:"W",div:"3", conf:"CAC",          state:"VA" },
  { id:"w3-york-pa",        name:"York (PA)",          short:"York",            gender:"W", div:"3", conf:"CAC",          state:"PA" },
  { id:"w3-marymount",      name:"Marymount",          short:"Marymount",       gender:"W", div:"3", conf:"CAC",          state:"VA" },

  // NCAC
  { id:"w3-denison",        name:"Denison",            short:"Denison",         gender:"W", div:"3", conf:"NCAC",         state:"OH" },
  { id:"w3-kenyon",         name:"Kenyon",             short:"Kenyon",          gender:"W", div:"3", conf:"NCAC",         state:"OH" },
  { id:"w3-oberlin",        name:"Oberlin",            short:"Oberlin",         gender:"W", div:"3", conf:"NCAC",         state:"OH" },
  { id:"w3-ohio-wesleyan",  name:"Ohio Wesleyan",      short:"Ohio Wesleyan",   gender:"W", div:"3", conf:"NCAC",         state:"OH" },
  { id:"w3-wooster",        name:"Wooster",            short:"Wooster",         gender:"W", div:"3", conf:"NCAC",         state:"OH" },
  { id:"w3-wittenberg",     name:"Wittenberg",         short:"Wittenberg",      gender:"W", div:"3", conf:"NCAC",         state:"OH" },
  { id:"w3-depauw",         name:"DePauw",             short:"DePauw",          gender:"W", div:"3", conf:"NCAC",         state:"IN" },
  { id:"w3-allegheny",      name:"Allegheny",          short:"Allegheny",       gender:"W", div:"3", conf:"NCAC",         state:"PA" },

  // ODAC
  { id:"w3-washington-lee", name:"Washington & Lee",   short:"W&L",             gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-lynchburg",      name:"Lynchburg",          short:"Lynchburg",       gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-roanoke",        name:"Roanoke",            short:"Roanoke",         gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-guilford",       name:"Guilford",           short:"Guilford",        gender:"W", div:"3", conf:"ODAC",         state:"NC" },
  { id:"w3-hollins",        name:"Hollins",            short:"Hollins",         gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-randolph",       name:"Randolph",           short:"Randolph",        gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-randolph-macon", name:"Randolph-Macon",     short:"Randolph-Macon",  gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-shenandoah",     name:"Shenandoah",         short:"Shenandoah",      gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-sweet-briar",    name:"Sweet Briar",        short:"Sweet Briar",     gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-virginia-wesleyan",name:"Virginia Wesleyan", short:"Virginia Wesleyan",gender:"W",div:"3",conf:"ODAC",         state:"VA" },
  { id:"w3-bridgewater",    name:"Bridgewater",        short:"Bridgewater",     gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-ferrum",         name:"Ferrum",             short:"Ferrum",          gender:"W", div:"3", conf:"ODAC",         state:"VA" },
  { id:"w3-emory-henry",    name:"Emory & Henry",      short:"Emory & Henry",   gender:"W", div:"3", conf:"ODAC",         state:"VA" },

  // MAC
  { id:"w3-stevenson",      name:"Stevenson",          short:"Stevenson",       gender:"W", div:"3", conf:"MAC",          state:"MD" },
  { id:"w3-alvernia",       name:"Alvernia",           short:"Alvernia",        gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-arcadia",        name:"Arcadia",            short:"Arcadia",         gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-delaware-valley",name:"Delaware Valley",    short:"Delaware Valley", gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-eastern",        name:"Eastern",            short:"Eastern",         gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-hood",           name:"Hood",               short:"Hood",            gender:"W", div:"3", conf:"MAC",          state:"MD" },
  { id:"w3-king-pa",        name:"King's (PA)",        short:"King's",          gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-lebanon-valley", name:"Lebanon Valley",     short:"Lebanon Valley",  gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-lycoming",       name:"Lycoming",           short:"Lycoming",        gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-manhattanville", name:"Manhattanville",     short:"Manhattanville",  gender:"W", div:"3", conf:"MAC",          state:"NY" },
  { id:"w3-misericordia",   name:"Misericordia",       short:"Misericordia",    gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-wilkes",         name:"Wilkes",             short:"Wilkes",          gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-widener",        name:"Widener",            short:"Widener",         gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-desales",        name:"DeSales",            short:"DeSales",         gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-gwynedd-mercy",  name:"Gwynedd Mercy",      short:"Gwynedd Mercy",   gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-immaculata",     name:"Immaculata",         short:"Immaculata",      gender:"W", div:"3", conf:"MAC",          state:"PA" },
  { id:"w3-marywood",       name:"Marywood",           short:"Marywood",        gender:"W", div:"3", conf:"MAC",          state:"PA" },

  // Empire 8
  { id:"w3-alfred",         name:"Alfred",             short:"Alfred",          gender:"W", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"w3-elmira",         name:"Elmira",             short:"Elmira",          gender:"W", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"w3-hartwick",       name:"Hartwick",           short:"Hartwick",        gender:"W", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"w3-houghton",       name:"Houghton",           short:"Houghton",        gender:"W", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"w3-nazareth",       name:"Nazareth",           short:"Nazareth",        gender:"W", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"w3-st-john-fisher", name:"St. John Fisher",    short:"St. John Fisher", gender:"W", div:"3", conf:"Empire 8",     state:"NY" },
  { id:"w3-stevens",        name:"Stevens",            short:"Stevens",         gender:"W", div:"3", conf:"Empire 8",     state:"NJ" },
  { id:"w3-utica",          name:"Utica",              short:"Utica",           gender:"W", div:"3", conf:"Empire 8",     state:"NY" },

  // Landmark
  { id:"w3-catholic",       name:"Catholic",           short:"Catholic",        gender:"W", div:"3", conf:"Landmark",     state:"DC" },
  { id:"w3-drew",           name:"Drew",               short:"Drew",            gender:"W", div:"3", conf:"Landmark",     state:"NJ" },
  { id:"w3-elizabethtown",  name:"Elizabethtown",      short:"Elizabethtown",   gender:"W", div:"3", conf:"Landmark",     state:"PA" },
  { id:"w3-goucher",        name:"Goucher",            short:"Goucher",         gender:"W", div:"3", conf:"Landmark",     state:"MD" },
  { id:"w3-juniata",        name:"Juniata",            short:"Juniata",         gender:"W", div:"3", conf:"Landmark",     state:"PA" },
  { id:"w3-moravian",       name:"Moravian",           short:"Moravian",        gender:"W", div:"3", conf:"Landmark",     state:"PA" },
  { id:"w3-scranton",       name:"Scranton",           short:"Scranton",        gender:"W", div:"3", conf:"Landmark",     state:"PA" },
  { id:"w3-susquehanna",    name:"Susquehanna",        short:"Susquehanna",     gender:"W", div:"3", conf:"Landmark",     state:"PA" },

  // NEWMAC
  { id:"w3-babson",         name:"Babson",             short:"Babson",          gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-clark",          name:"Clark",              short:"Clark",           gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-coast-guard",    name:"Coast Guard",        short:"Coast Guard",     gender:"W", div:"3", conf:"NEWMAC",       state:"CT" },
  { id:"w3-mit",            name:"MIT",                short:"MIT",             gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-mount-holyoke",  name:"Mount Holyoke",      short:"Mount Holyoke",   gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-smith",          name:"Smith",              short:"Smith",           gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-springfield",    name:"Springfield",        short:"Springfield",     gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-wellesley",      name:"Wellesley",          short:"Wellesley",       gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-wheaton-ma",     name:"Wheaton (MA)",       short:"Wheaton",         gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },
  { id:"w3-wpi",            name:"WPI",                short:"WPI",             gender:"W", div:"3", conf:"NEWMAC",       state:"MA" },

  // CCC
  { id:"w3-curry",          name:"Curry",              short:"Curry",           gender:"W", div:"3", conf:"CCC",          state:"MA" },
  { id:"w3-endicott",       name:"Endicott",           short:"Endicott",        gender:"W", div:"3", conf:"CCC",          state:"MA" },
  { id:"w3-gordon",         name:"Gordon",             short:"Gordon",          gender:"W", div:"3", conf:"CCC",          state:"MA" },
  { id:"w3-nichols",        name:"Nichols",            short:"Nichols",         gender:"W", div:"3", conf:"CCC",          state:"MA" },
  { id:"w3-roger-williams", name:"Roger Williams",     short:"Roger Williams",  gender:"W", div:"3", conf:"CCC",          state:"RI" },
  { id:"w3-salve-regina",   name:"Salve Regina",       short:"Salve Regina",    gender:"W", div:"3", conf:"CCC",          state:"RI" },
  { id:"w3-western-ne",     name:"Western New England",short:"Western New England",gender:"W",div:"3",conf:"CCC",         state:"MA" },
  { id:"w3-univ-new-england",name:"New England",       short:"UNE",             gender:"W", div:"3", conf:"CCC",          state:"ME" },
  { id:"w3-wentworth",      name:"Wentworth",          short:"Wentworth",       gender:"W", div:"3", conf:"CCC",          state:"MA" },

  // Little East
  { id:"w3-castleton",      name:"Castleton",          short:"Castleton",       gender:"W", div:"3", conf:"Little East",  state:"VT" },
  { id:"w3-eastern-conn",   name:"Eastern Connecticut",short:"Eastern Conn",    gender:"W", div:"3", conf:"Little East",  state:"CT" },
  { id:"w3-keene-state",    name:"Keene State",        short:"Keene State",     gender:"W", div:"3", conf:"Little East",  state:"NH" },
  { id:"w3-plymouth-state", name:"Plymouth State",     short:"Plymouth State",  gender:"W", div:"3", conf:"Little East",  state:"NH" },
  { id:"w3-rhode-island-col",name:"Rhode Island College",short:"Rhode Island Col",gender:"W",div:"3",conf:"Little East",  state:"RI" },
  { id:"w3-umass-dartmouth",name:"UMass Dartmouth",    short:"UMass Dartmouth", gender:"W", div:"3", conf:"Little East",  state:"MA" },
  { id:"w3-west-conn",      name:"Western Connecticut",short:"Western Conn",    gender:"W", div:"3", conf:"Little East",  state:"CT" },
  { id:"w3-bridgewater-st", name:"Bridgewater State",  short:"Bridgewater State",gender:"W",div:"3",conf:"Little East",  state:"MA" },
  { id:"w3-fitchburg-state",name:"Fitchburg State",    short:"Fitchburg State", gender:"W", div:"3", conf:"Little East",  state:"MA" },
  { id:"w3-framingham-state",name:"Framingham State",  short:"Framingham State",gender:"W", div:"3", conf:"Little East",  state:"MA" },

  // SCIAC
  { id:"w3-chapman",        name:"Chapman",            short:"Chapman",         gender:"W", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"w3-claremont-ms",   name:"Claremont-Mudd-Scripps",short:"CMS",         gender:"W", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"w3-occidental",     name:"Occidental",         short:"Occidental",      gender:"W", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"w3-pomona-pitzer",  name:"Pomona-Pitzer",      short:"Pomona-Pitzer",   gender:"W", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"w3-redlands",       name:"Redlands",           short:"Redlands",        gender:"W", div:"3", conf:"SCIAC",        state:"CA" },
  { id:"w3-whittier",       name:"Whittier",           short:"Whittier",        gender:"W", div:"3", conf:"SCIAC",        state:"CA" },

  // Skyline
  { id:"w3-farmingdale",    name:"Farmingdale State",  short:"Farmingdale",     gender:"W", div:"3", conf:"Skyline",      state:"NY" },
  { id:"w3-maritime",       name:"SUNY Maritime",      short:"Maritime",        gender:"W", div:"3", conf:"Skyline",      state:"NY" },
  { id:"w3-mount-st-mary",  name:"Mount St. Mary (NY)",short:"Mount St. Mary",  gender:"W", div:"3", conf:"Skyline",      state:"NY" },
  { id:"w3-old-westbury",   name:"SUNY Old Westbury",  short:"Old Westbury",    gender:"W", div:"3", conf:"Skyline",      state:"NY" },
  { id:"w3-purchase",       name:"SUNY Purchase",      short:"Purchase",        gender:"W", div:"3", conf:"Skyline",      state:"NY" },
  { id:"w3-sage",           name:"Sage",               short:"Sage",            gender:"W", div:"3", conf:"Skyline",      state:"NY" },
  { id:"w3-st-joseph-li",   name:"St. Joseph's (LI)",  short:"St. Joseph's LI", gender:"W", div:"3", conf:"Skyline",      state:"NY" },

  // Midwest Lacrosse Conference
  { id:"w3-adrian",         name:"Adrian",             short:"Adrian",          gender:"W", div:"3", conf:"MLC",          state:"MI" },
  { id:"w3-albion",         name:"Albion",             short:"Albion",          gender:"W", div:"3", conf:"MLC",          state:"MI" },
  { id:"w3-alma",           name:"Alma",               short:"Alma",            gender:"W", div:"3", conf:"MLC",          state:"MI" },
  { id:"w3-kalamazoo",      name:"Kalamazoo",          short:"Kalamazoo",       gender:"W", div:"3", conf:"MLC",          state:"MI" },
  { id:"w3-olivet",         name:"Olivet",             short:"Olivet",          gender:"W", div:"3", conf:"MLC",          state:"MI" },
  { id:"w3-trine",          name:"Trine",              short:"Trine",           gender:"W", div:"3", conf:"MLC",          state:"IN" },

  // GNAC (Great Northeast Athletic Conference)
  { id:"w3-albertus-magnus",name:"Albertus Magnus",    short:"Albertus Magnus", gender:"W", div:"3", conf:"GNAC",         state:"CT" },
  { id:"w3-anna-maria",     name:"Anna Maria",         short:"Anna Maria",      gender:"W", div:"3", conf:"GNAC",         state:"MA" },
  { id:"w3-colby-sawyer",   name:"Colby-Sawyer",       short:"Colby-Sawyer",    gender:"W", div:"3", conf:"GNAC",         state:"NH" },
  { id:"w3-emmanuel-ma",    name:"Emmanuel (MA)",      short:"Emmanuel",        gender:"W", div:"3", conf:"GNAC",         state:"MA" },
  { id:"w3-johnson-wales",  name:"Johnson & Wales",    short:"Johnson & Wales", gender:"W", div:"3", conf:"GNAC",         state:"RI" },
  { id:"w3-lasell",         name:"Lasell",             short:"Lasell",          gender:"W", div:"3", conf:"GNAC",         state:"MA" },
  { id:"w3-norwich",        name:"Norwich",            short:"Norwich",         gender:"W", div:"3", conf:"GNAC",         state:"VT" },
  { id:"w3-regis-ma",       name:"Regis (MA)",         short:"Regis",           gender:"W", div:"3", conf:"GNAC",         state:"MA" },
  { id:"w3-rivier",         name:"Rivier",             short:"Rivier",          gender:"W", div:"3", conf:"GNAC",         state:"NH" },
  { id:"w3-simmons",        name:"Simmons",            short:"Simmons",         gender:"W", div:"3", conf:"GNAC",         state:"MA" },
  { id:"w3-st-josephs-me",  name:"St. Joseph's (ME)",  short:"St. Joseph's ME", gender:"W", div:"3", conf:"GNAC",         state:"ME" },
  { id:"w3-suffolk",        name:"Suffolk",            short:"Suffolk",         gender:"W", div:"3", conf:"GNAC",         state:"MA" },

  // OAC (Ohio Athletic Conference)
  { id:"w3-baldwin-wallace",name:"Baldwin Wallace",    short:"Baldwin Wallace", gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-capital",        name:"Capital",            short:"Capital",         gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-heidelberg",     name:"Heidelberg",         short:"Heidelberg",      gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-john-carroll",   name:"John Carroll",       short:"John Carroll",    gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-marietta",       name:"Marietta",           short:"Marietta",        gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-muskingum",      name:"Muskingum",          short:"Muskingum",       gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-ohio-northern",  name:"Ohio Northern",      short:"Ohio Northern",   gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-otterbein",      name:"Otterbein",          short:"Otterbein",       gender:"W", div:"3", conf:"OAC",          state:"OH" },
  { id:"w3-wilmington-oh",  name:"Wilmington (OH)",    short:"Wilmington",      gender:"W", div:"3", conf:"OAC",          state:"OH" },

  // CSAC (Colonial States Athletic Conference)
  { id:"w3-cabrini",        name:"Cabrini",            short:"Cabrini",         gender:"W", div:"3", conf:"CSAC",         state:"PA" },
  { id:"w3-cedar-crest",    name:"Cedar Crest",        short:"Cedar Crest",     gender:"W", div:"3", conf:"CSAC",         state:"PA" },
  { id:"w3-centenary-nj",   name:"Centenary (NJ)",     short:"Centenary",       gender:"W", div:"3", conf:"CSAC",         state:"NJ" },
  { id:"w3-keystone",       name:"Keystone",           short:"Keystone",        gender:"W", div:"3", conf:"CSAC",         state:"PA" },
  { id:"w3-neumann",        name:"Neumann",            short:"Neumann",         gender:"W", div:"3", conf:"CSAC",         state:"PA" },
  { id:"w3-rosemont",       name:"Rosemont",           short:"Rosemont",        gender:"W", div:"3", conf:"CSAC",         state:"PA" },
  { id:"w3-wilson",         name:"Wilson",             short:"Wilson",          gender:"W", div:"3", conf:"CSAC",         state:"PA" },
]

// Normalize a team name for matching against aggregated records.
// MUST stay in sync with normTeam() in functions/src/scrapers/aggregateRecords.js
export const normTeam = (s) => (s || '')
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]/g, '')

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

// Get unique conferences for a gender (optionally filtered by division)
export function getConferences(gender, div) {
  const filtered = PROGRAMS.filter(p => {
    const gOk = !gender || gender === 'All' || p.gender === gender
    const dOk = !div    || div === 'all'    || p.div === div
    return gOk && dOk
  })
  const unique = [...new Set(filtered.map(p => p.conf))].sort()
  return ['All', ...unique]
}
