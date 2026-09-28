/* =====================================================================
   MISSIONS — Cyberpunk 2077 patch 2.31 + Phantom Liberty
   Batch 1: Main Jobs. Side Jobs and Gigs come in later batches.

   Source: the Cyberpunk Wiki (each entry's `src`), read 2026-09-28.
   id      the game's internal quest id (wiki "BaseID"); never change it
   sec     section id (see missionSections below)
   path    Act 2 thread: hellman · evelyn · alt · takemura
   after   ids that must ALL be done first
   any     ids where ANY ONE being done is enough
   branch  [choice, value]: only applies if you made that choice
           (lifepath: corpo/nomad/streetkid · pl: reed/songbird · plEnd: surrender/escape)
   items   rewards from the wiki infobox · miss = missable · dep = depends on choices · opt = optional
   pnr     point of no return: nothing outside the ending paths can be done after it
   opt     optional job (listed, but never pushed into Up next)
   verified  true = checked against the wiki page; false = open question (see `check`)
   alsoId  a second internal id the wiki gives on the mission's own page (reference only)
   Missions appear here in the wiki's order, which is also the default recommended order.
   ===================================================================== */
export const missionSections = [
  {id:"prologue", name:"Prologue", note:"Lifepath opening. Only the one matching your lifepath applies."},
  {id:"act1", name:"Act 1", note:"Watson only."},
  {id:"interlude", name:"Interlude", note:""},
  {id:"act2", name:"Act 2", note:"All of Night City opens. Most side content fits here."},
  {id:"pl", name:"Phantom Liberty", note:"Dogtown expansion."},
  {id:"pl_reed", name:"Phantom Liberty · Reed's path", note:"If you sided with Reed at Firestarter."},
  {id:"pl_songbird", name:"Phantom Liberty · Songbird's path", note:"If you sided with Songbird at Firestarter."},
  {id:"act3", name:"Act 3 · Point of no return", note:""},
  {id:"end_hanako", name:"Ending path · Hanako", note:""},
  {id:"end_aldecaldos", name:"Ending path · Aldecaldos", note:""},
  {id:"end_rogue", name:"Ending path · Rogue", note:""},
  {id:"end_secret", name:"Ending path · Secret", note:""},
  {id:"end_tower", name:"Ending path · The Tower (PL)", note:""},
  {id:"epilogue", name:"Finale & epilogues", note:"Changes is shared by the Aldecaldos, Rogue and secret paths. One epilogue plays, depending on your path and final choice."},
];

export const missions = [
  // ---------- Prologue ----------
  {id:"q000_corpo", type:"main", sec:"prologue", name:"The Corpo-Rat", giver:"Arthur Jenkins", district:"City Center", branch:["lifepath", "corpo"], items:[{n:"Arasaka clock memorabilia"}], src:"https://cyberpunk.fandom.com/wiki/The_Corpo-Rat", verified:true},
  {id:"q000_nomad", type:"main", sec:"prologue", name:"The Nomad", giver:"Willie McCoy", district:"Badlands", branch:["lifepath", "nomad"], items:[{n:"Car model memorabilia"}], src:"https://cyberpunk.fandom.com/wiki/The_Nomad", verified:true},
  {id:"q000_street_kid", type:"main", sec:"prologue", name:"The Streetkid", giver:"Pepe Najarro", district:"Heywood", branch:["lifepath", "streetkid"], items:[{n:"Night City diorama memorabilia"}], src:"https://cyberpunk.fandom.com/wiki/The_Streetkid", verified:true},
  // ---------- Act 1 ----------
  {id:"q000_tutorial", type:"main", sec:"act1", name:"Practice Makes Perfect", giver:"Jackie Welles", district:"Westbrook", any:["q000_corpo", "q000_nomad", "q000_street_kid"], opt:1, note:"Optional VR tutorial.", src:"https://cyberpunk.fandom.com/wiki/Practice_Makes_Perfect", verified:true},
  {id:"q001_intro", type:"main", sec:"act1", name:"The Rescue", giver:"Wakako Okada", district:"Westbrook", any:["q000_corpo", "q000_nomad", "q000_street_kid"], src:"https://cyberpunk.fandom.com/wiki/The_Rescue", verified:true},
  {id:"q001_01_victor", type:"main", sec:"act1", name:"The Ripperdoc", giver:"Jackie Welles", district:"Watson", after:["q001_intro"], items:[{n:"Basic Kiroshi Optics"}, {n:"Ballistic Coprocessor"}, {n:"Subdermal Armor"}], src:"https://cyberpunk.fandom.com/wiki/The_Ripperdoc", verified:true},
  {id:"q001_02_dex", type:"main", sec:"act1", name:"The Ride", giver:"Jackie Welles", district:"Watson", after:["q001_01_victor"], src:"https://cyberpunk.fandom.com/wiki/The_Ride", verified:true},
  {id:"q003_maelstrom", type:"main", sec:"act1", name:"The Pickup", giver:"Dexter DeShawn", district:"Watson", after:["q001_02_dex"], items:[{n:"Chaos", dep:1}, {n:"Black Lace", dep:1, note:"Streetkid only"}], src:"https://cyberpunk.fandom.com/wiki/The_Pickup", verified:true},
  {id:"q004_braindance", type:"main", sec:"act1", name:"The Information", giver:"Dexter DeShawn", district:"Watson", after:["q001_02_dex"], items:[{n:"Braindance Wreath"}], src:"https://cyberpunk.fandom.com/wiki/The_Information", verified:true},
  {id:"q005_heist", type:"main", sec:"act1", name:"The Heist", giver:"Dexter DeShawn", district:"Watson", after:["q003_maelstrom", "q004_braindance"], items:[{n:"Relic"}, {n:"Kongou", miss:1}, {n:"Satori", miss:1}, {n:"Nehan", miss:1}, {n:"Iguana Egg (memorabilia)", miss:1}], note:"Ends Act 1. Unique items here are missable: loot them during the mission.", src:"https://cyberpunk.fandom.com/wiki/The_Heist", verified:true},
  // ---------- Interlude ----------
  {id:"q101_01_firestorm", type:"main", sec:"interlude", name:"Love Like Fire", giver:"Johnny Silverhand", district:"City Center", after:["q005_heist"], src:"https://cyberpunk.fandom.com/wiki/Love_Like_Fire", verified:true},
  // ---------- Act 2 ----------
  {id:"q101_resurrection", type:"main", sec:"act2", name:"Playing for Time", giver:"Johnny Silverhand", district:"Badlands", after:["q101_01_firestorm"], note:"Act 2 begins; all of Night City and the Badlands open up. The main job branches into three threads (Hellman, Evelyn/Voodoo Boys, Takemura).", src:"https://cyberpunk.fandom.com/wiki/Playing_for_Time", verified:true},
  {id:"q103_warhead", type:"main", sec:"act2", path:"hellman", name:"Ghost Town", giver:"Goro Takemura", district:"Watson", after:["q101_resurrection"], items:[{n:"Widow Maker", dep:1}, {n:"Archer Quartz \"Bandit\"", dep:1}], src:"https://cyberpunk.fandom.com/wiki/Ghost_Town", verified:true},
  {id:"q104_01_sabotage", type:"main", sec:"act2", path:"hellman", name:"Lightning Breaks", giver:"Panam Palmer", district:"Badlands", after:["q103_warhead"], src:"https://cyberpunk.fandom.com/wiki/Lightning_Breaks", verified:true},
  {id:"q104_02_av_chase", type:"main", sec:"act2", path:"hellman", name:"Life During Wartime", giver:"Panam Palmer", district:"Badlands", after:["q104_01_sabotage"], items:[{n:"Scorpion's Apollo"}], src:"https://cyberpunk.fandom.com/wiki/Life_During_Wartime", verified:true},
  {id:"q105_dollhouse", type:"main", sec:"act2", path:"evelyn", name:"Automatic Love", giver:"Goro Takemura", district:"Watson", after:["q101_resurrection"], items:[{n:"Lizzie", miss:1}, {n:"Cocktail Stick", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Automatic_Love", verified:true},
  {id:"q105_02_jigjig", type:"main", sec:"act2", path:"evelyn", name:"The Space in Between", giver:"Judy Álvarez", district:"Westbrook", after:["q105_dollhouse"], items:[{n:"Cottonmouth", miss:1}], src:"https://cyberpunk.fandom.com/wiki/The_Space_in_Between", verified:true},
  {id:"q105_03_braindance_studio", type:"main", sec:"act2", path:"evelyn", name:"Disasterpiece", giver:"Judy Álvarez", district:"Westbrook", after:["q105_02_jigjig"], items:[{n:"Errata", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Disasterpiece", verified:true},
  {id:"q105_04_judys", type:"main", sec:"act2", path:"evelyn", name:"Double Life", giver:"Judy Álvarez", district:"Watson", after:["q105_03_braindance_studio"], src:"https://cyberpunk.fandom.com/wiki/Double_Life", verified:true},
  {id:"q110_01_voodoo_boys", type:"main", sec:"act2", path:"alt", name:"M'ap Tann Pèlen", giver:"Automatic", district:"Pacifica", after:["q105_04_judys"], items:[{n:"Butcher's Cleaver", miss:1}], src:"https://cyberpunk.fandom.com/wiki/M'ap_Tann_Pèlen", verified:true, alsoId:"q110_01_voodooboys"},
  {id:"q110_voodoo", type:"main", sec:"act2", path:"alt", name:"I Walk the Line", giver:"Placide", district:"Pacifica", after:["q110_01_voodoo_boys"], items:[{n:"Sasquatch's Hammer", miss:1}], src:"https://cyberpunk.fandom.com/wiki/I_Walk_the_Line", verified:true},
  {id:"q110_03_cyberspace", type:"main", sec:"act2", path:"alt", name:"Transmission", giver:"Brigitte", district:"Pacifica", after:["q110_voodoo"], items:[{n:"Virtual Jumpsuit"}], src:"https://cyberpunk.fandom.com/wiki/Transmission", verified:true},
  {id:"q108_johnny", type:"main", sec:"act2", path:"alt", name:"Never Fade Away", giver:"Johnny Silverhand", after:["q110_03_cyberspace"], src:"https://cyberpunk.fandom.com/wiki/Never_Fade_Away_(quest)", verified:true},
  {id:"q112_01_old_friend", type:"main", sec:"act2", path:"takemura", name:"Down on the Street", giver:"Goro Takemura", district:"Westbrook", after:["q101_resurrection"], src:"https://cyberpunk.fandom.com/wiki/Down_on_the_Street", verified:true},
  {id:"q112_02_industrial_park", type:"main", sec:"act2", path:"takemura", name:"Gimme Danger", giver:"Goro Takemura", district:"Westbrook", after:["q112_01_old_friend"], src:"https://cyberpunk.fandom.com/wiki/Gimme_Danger", verified:true},
  {id:"q112_03_dashi_parade", type:"main", sec:"act2", path:"takemura", name:"Play It Safe", giver:"Goro Takemura", district:"Westbrook", after:["q112_02_industrial_park", "q104_02_av_chase"], items:[{n:"Jinchu-Maru", miss:1}, {n:"Genjiroh", miss:1}], note:"The wiki lists both Gimme Danger and Life During Wartime as leading into this job.", src:"https://cyberpunk.fandom.com/wiki/Play_It_Safe", verified:true},
  {id:"q112_04_hideout", type:"main", sec:"act2", path:"takemura", name:"Search and Destroy", giver:"Goro Takemura", district:"Heywood", after:["q112_03_dashi_parade"], src:"https://cyberpunk.fandom.com/wiki/Search_and_Destroy", verified:true},
  {id:"sq032_tapeworm", type:"main", sec:"act2", name:"Tapeworm", giver:"Johnny Silverhand", district:"Pacifica", after:["q105_dollhouse", "q110_03_cyberspace", "q104_02_av_chase", "q112_04_hideout"], items:[{n:"Johnny's tank top"}], note:"Runs alongside Act 2 and completes once all four threads are finished (Automatic Love, Life During Wartime, Search and Destroy, Transmission). Completing it starts Act 3.", src:"https://cyberpunk.fandom.com/wiki/Tapeworm", verified:true},
  // ---------- Phantom Liberty ----------
  {id:"q300_phantom_liberty", type:"main", sec:"pl", name:"Phantom Liberty", giver:"Automatic", district:"Pacifica", after:["q110_03_cyberspace", "q108_johnny"], note:"Guide job for the expansion. Starts once the listed main jobs are done (through Transmission and Never Fade Away).", src:"https://cyberpunk.fandom.com/wiki/Phantom_Liberty_(quest)", verified:true},
  {id:"q301_crash", type:"main", sec:"pl", name:"Dog Eat Dog", giver:"Songbird", district:"Pacifica", after:["q300_phantom_liberty"], items:[{n:"Perk Shard", miss:1}, {n:"BARGHEST helmet", miss:1}, {n:"Cyberware Capacity Shard", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Dog_Eat_Dog", verified:true},
  {id:"q301_finding_myers", type:"main", sec:"pl", name:"Hole in the Sky", giver:"Songbird", district:"Pacifica", after:["q301_crash"], items:[{n:"NUSA suit", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Hole_in_the_Sky", verified:true},
  {id:"q301_q302_rescue_myers", type:"main", sec:"pl", name:"Spider and the Fly", giver:"Automatic", district:"Pacifica", after:["q301_finding_myers"], src:"https://cyberpunk.fandom.com/wiki/Spider_and_the_Fly", verified:true},
  {id:"q302_reed", type:"main", sec:"pl", name:"Lucretia My Reflection", giver:"Rosalind Myers", district:"Pacifica", after:["q301_q302_rescue_myers"], items:[{n:"Active Chimera Core", miss:1}, {n:"Hawk", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Lucretia_My_Reflection", verified:true},
  {id:"q303_baron", type:"main", sec:"pl", name:"The Damned", giver:"Solomon Reed", district:"Pacifica", after:["q302_reed"], items:[{n:"Gris-Gris", miss:1, dep:1}], src:"https://cyberpunk.fandom.com/wiki/The_Damned", verified:true},
  {id:"q303_hands", type:"main", sec:"pl", name:"Get It Together", giver:"Solomon Reed", district:"Pacifica", after:["q303_baron"], items:[{n:"Her Majesty"}], src:"https://cyberpunk.fandom.com/wiki/Get_It_Together", verified:true, alsoId:"mq303_hands"},
  {id:"q303_songbird", type:"main", sec:"pl", name:"You Know My Name", giver:"Solomon Reed", district:"Pacifica", after:["q303_hands"], items:[{n:"Tactical diving suit"}, {n:"Tactical diving suit"}, {n:"Tsunami Rasetsu"}, {n:"Stylish suit"}, {n:"Amikiri Sound Cutter", dep:1}, {n:"Bootleg BD from Lizzy Wizzy's Black Sapphire show"}], src:"https://cyberpunk.fandom.com/wiki/You_Know_My_Name", verified:true},
  {id:"q304_stadium", type:"main", sec:"pl", name:"Birds with Broken Wings", giver:"Solomon Reed", district:"Pacifica", after:["q303_songbird"], items:[{n:"Nokota NDI Osprey"}, {n:"Behavioral Imprint-synced Faceplate"}], src:"https://cyberpunk.fandom.com/wiki/Birds_with_Broken_Wings", verified:true},
  {id:"q304_netrunners", type:"main", sec:"pl", name:"I've Seen That Face Before", giver:"Solomon Reed", district:"Pacifica", after:["q304_stadium"], items:[{n:"Netrunner suit"}], src:"https://cyberpunk.fandom.com/wiki/I've_Seen_That_Face_Before", verified:true},
  {id:"q304_deal", type:"main", sec:"pl", name:"Firestarter", giver:"Solomon Reed", district:"Pacifica", after:["q304_netrunners"], items:[{n:"Murphy's Law", miss:1, dep:1}, {n:"Fang", miss:1, dep:1}, {n:"Bald Eagle", miss:1}, {n:"Wild Dog", miss:1}], note:"Choice: help Songbird escape, or help Reed capture her. Phantom Liberty's story branches here, and the other branch's jobs won't happen this run.", src:"https://cyberpunk.fandom.com/wiki/Firestarter", verified:true},
  // ---------- Phantom Liberty · Reed's path ----------
  {id:"q305_prison_convoy", type:"main", sec:"pl_reed", name:"Black Steel In The Hour of Chaos", giver:"Solomon Reed", district:"Pacifica", after:["q304_deal"], branch:["pl", "reed"], items:[{n:"Crowbar (iconic)", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Black_Steel_In_The_Hour_of_Chaos", verified:true},
  {id:"q305_bunker", type:"main", sec:"pl_reed", name:"Somewhat Damaged", giver:"Automatic", district:"Pacifica", after:["q305_prison_convoy"], branch:["pl", "reed"], items:[{n:"Crowbar (iconic)", miss:1}, {n:"Erebus blueprints", miss:1}, {n:"Militech Canto blueprints", miss:1}, {n:"Behavioral system component", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Somewhat_Damaged", verified:true},
  {id:"q305_border_crossing", type:"main", sec:"pl_reed", name:"Leave in Silence", giver:"Automatic", district:"Badlands", after:["q305_bunker"], branch:["pl", "reed"], items:[{n:"NUSA distinction", dep:1}], src:"https://cyberpunk.fandom.com/wiki/Leave_in_Silence", verified:true},
  {id:"q305_reed_epilogue", type:"main", sec:"pl_reed", name:"Four Score and Seven", giver:"Solomon Reed", district:"Pacifica", after:["q305_border_crossing"], branch:["pl", "reed"], src:"https://cyberpunk.fandom.com/wiki/Four_Score_and_Seven", verified:true},
  {id:"q305_postcontent", type:"main", sec:"pl_reed", name:"This Corrosion", giver:"Unknown Number", district:"Watson", after:["q305_border_crossing"], branch:["pl", "reed"], items:[{n:"Militech Canto", dep:1}, {n:"Erebus", dep:1}], note:"Listed with the Main Jobs on the wiki's overview, but its own page calls it a Side Job.", src:"https://cyberpunk.fandom.com/wiki/This_Corrosion", verified:false, check:"The wiki's Main Jobs overview lists it, but its own page calls it a Side Job. Which section is it under in your in-game Journal?"},
  // ---------- Phantom Liberty · Songbird's path ----------
  {id:"q306_devils_bargain", type:"main", sec:"pl_songbird", name:"The Killing Moon", giver:"Song So Mi", district:"Morro Rock", after:["q304_deal"], branch:["pl", "songbird"], items:[{n:"Pariah", miss:1, dep:1}], note:"Second choice on Songbird's path: surrender her to Reed (leads to Through Pain to Heaven) or help her escape (leads to Unfinished Sympathy).", src:"https://cyberpunk.fandom.com/wiki/The_Killing_Moon", verified:true},
  {id:"q306_reed_epilogue", type:"main", sec:"pl_songbird", name:"Through Pain to Heaven", giver:"Solomon Reed", district:"Santo Domingo", after:["q306_devils_bargain"], branch:["plEnd", "surrender"], src:"https://cyberpunk.fandom.com/wiki/Through_Pain_to_Heaven", verified:true},
  {id:"q306_somi_epilogue", type:"main", sec:"pl_songbird", name:"Unfinished Sympathy", giver:"Alena Xenakis", district:"Pacifica", after:["q306_devils_bargain"], branch:["plEnd", "escape"], items:[{n:"\"It's Always Sunny in Monte Carlo\""}], src:"https://cyberpunk.fandom.com/wiki/Unfinished_Sympathy", verified:true},
  {id:"q306_postcontent", type:"main", sec:"pl_songbird", name:"From Her to Eternity", giver:"Unknown Number", district:"Pacifica", after:["q306_somi_epilogue"], branch:["plEnd", "escape"], items:[{n:"Quantum Tuner"}, {n:"Metal pin"}], src:"https://cyberpunk.fandom.com/wiki/From_Her_to_Eternity", verified:true},
  // ---------- Act 3 · Point of no return ----------
  {id:"02_sickness", type:"main", sec:"act3", name:"Nocturne Op55N1", giver:"Hanako Arasaka", district:"Heywood", after:["sq032_tapeworm"], pnr:1, note:"Approaching the Embers entrance warns you that this is the point of no return: after it you can no longer free-roam Night City.\n\nWhich ending paths you're offered depends on side content:\n• Panam's help: needs the Side Job Queen of the Highway.\n• Rogue's help: needs the Side Job Blistering Love.\n• Reed's help (PL): needs Phantom Liberty finished with Songbird surrendered to the NUSA.\n• Secret ending: needs certain dialogue choices in Chippin' In, then waiting 5 minutes 8 seconds.\n• Hanako's help is always available.", src:"https://cyberpunk.fandom.com/wiki/Nocturne_Op55N1", verified:true},
  // ---------- Ending path · Hanako ----------
  {id:"q113_rescuing_hanako", type:"main", sec:"end_hanako", name:"Last Caress", giver:"Hanako Arasaka", district:"Westbrook", after:["02_sickness"], items:[{n:"Genjiroh", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Last_Caress", verified:true},
  {id:"q113_corpo", type:"main", sec:"end_hanako", name:"Totalimmortal", giver:"Hanako Arasaka", district:"City Center", after:["q113_rescuing_hanako"], items:[{n:"Access Token", miss:1}], src:"https://cyberpunk.fandom.com/wiki/Totalimmortal", verified:true},
  // ---------- Ending path · Aldecaldos ----------
  {id:"q114_01_nomad_initiation", type:"main", sec:"end_aldecaldos", name:"We Gotta Live Together", giver:"Panam Palmer", district:"Badlands", after:["02_sickness"], items:[{n:"Aldecaldos rally bolero jacket"}, {n:"Amnesty", dep:1}], src:"https://cyberpunk.fandom.com/wiki/We_Gotta_Live_Together", verified:true},
  {id:"q114_02_maglev_line_assault", type:"main", sec:"end_aldecaldos", name:"Forward to Death", giver:"Panam Palmer", district:"Badlands", after:["q114_01_nomad_initiation"], src:"https://cyberpunk.fandom.com/wiki/Forward_to_Death", verified:true},
  {id:"q114_03_attack_on_arasaka_tower", type:"main", sec:"end_aldecaldos", name:"Belly of the Beast", giver:"Panam Palmer", district:"City Center", after:["q114_02_maglev_line_assault"], items:[{n:"Access Token", opt:1}], src:"https://cyberpunk.fandom.com/wiki/Belly_of_the_Beast", verified:true},
  // ---------- Ending path · Rogue ----------
  {id:"q115_afterlife", type:"main", sec:"end_rogue", name:"For Whom the Bell Tolls", giver:"Johnny Silverhand", district:"Watson", after:["02_sickness"], items:[{n:"Prejudice", miss:1}], src:"https://cyberpunk.fandom.com/wiki/For_Whom_the_Bell_Tolls", verified:true},
  {id:"q115_rogues_last_flight", type:"main", sec:"end_rogue", name:"Knockin' on Heaven's Door", giver:"Rogue Amendiares", district:"City Center", after:["q115_afterlife"], items:[{n:"Pride", miss:1}, {n:"Caretaker's Spade", miss:1}, {n:"Access Token"}], src:"https://cyberpunk.fandom.com/wiki/Knockin'_on_Heaven's_Door", verified:true},
  // ---------- Ending path · Secret ----------
  {id:"09_solo", type:"main", sec:"end_secret", name:"(Don't Fear) The Reaper", giver:"Johnny Silverhand", district:"City Center", after:["02_sickness"], items:[{n:"Access Token", opt:1}], src:"https://cyberpunk.fandom.com/wiki/(Don't_Fear)_The_Reaper", verified:true},
  // ---------- Finale & epilogues ----------
  {id:"q116_cyberspace", type:"main", sec:"epilogue", name:"Changes", giver:"Alt Cunningham", any:["q115_rogues_last_flight", "q114_03_attack_on_arasaka_tower", "09_solo"], note:"Shared by the Aldecaldos, Rogue and secret paths. How it opens depends on what you chose for Jackie's body after The Heist.", src:"https://cyberpunk.fandom.com/wiki/Changes", verified:true},
  {id:"q201_heir", type:"main", sec:"epilogue", name:"Where is My Mind?", giver:"Automatic", after:["q113_corpo"], src:"https://cyberpunk.fandom.com/wiki/Where_is_My_Mind?", verified:true},
  {id:"q202_nomads", type:"main", sec:"epilogue", name:"All Along the Watchtower", giver:"Panam Palmer", district:"Badlands", after:["q116_cyberspace"], src:"https://cyberpunk.fandom.com/wiki/All_Along_the_Watchtower", verified:true},
  {id:"q203_legend", type:"main", sec:"epilogue", name:"Path of Glory", giver:"Johnny Silverhand", district:"Watson", after:["q116_cyberspace"], src:"https://cyberpunk.fandom.com/wiki/Path_of_Glory", verified:true},
  {id:"q204_reborn", type:"main", sec:"epilogue", name:"New Dawn Fades", giver:"Johnny Silverhand", district:"Pacifica", after:["q116_cyberspace"], src:"https://cyberpunk.fandom.com/wiki/New_Dawn_Fades", verified:true},
  // ---------- Ending path · The Tower (PL) ----------
  {id:"q307_before_tomorrow", type:"main", sec:"end_tower", name:"Who Wants to Live Forever", giver:"Solomon Reed", district:"Watson", after:["02_sickness"], any:["q305_reed_epilogue", "q306_reed_epilogue"], note:"Phantom Liberty ending path (The Tower). Chosen at the end of Nocturne Op55N1.", src:"https://cyberpunk.fandom.com/wiki/Who_Wants_to_Live_Forever", verified:true},
  {id:"q307_tomorrow", type:"main", sec:"end_tower", name:"Things Done Changed", giver:"Automatic", district:"Watson", after:["q307_before_tomorrow"], src:"https://cyberpunk.fandom.com/wiki/Things_Done_Changed", verified:true},
];
