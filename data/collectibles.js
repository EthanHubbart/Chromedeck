/* =====================================================================
   COLLECTIBLES — Tarot graffiti, Cyberpsycho Sightings, Phantom Liberty
   airdrops, Relic terminals and apartments. Cyberpunk 2077 2.31 + PL.
   Source: the Cyberpunk Wiki pages in each entry's `src`, read 2026-09-28.
   id        never change it (saved progress points at it)
   dist/sub  district / sub-district · loc = where exactly
   near      mission ids whose location it's at (for context, not a requirement)
   after     mission ids the wiki says must be done first · need = other requirement (text)
   pl        Phantom Liberty content
   ===================================================================== */

/* ---------- Tarot graffiti ----------
   fool:1 = one of the 20 the Minor Job "Fool on the Hill" asks for (scan them, then
   talk to Misty). They start appearing in Act 2 (after Playing for Time).
   Judgement and The Devil only turn up in endings; the four Kings (PL) start
   "Tomorrow Never Knows". */
const T = "https://cyberpunk.fandom.com/wiki/Cyberpunk_2077_Tarot_Cards";
const TI = "https://static.wikia.nocookie.net/cyberpunk/images/";
export const tarot = [
  // ---- Major Arcana (Fool on the Hill) ----
  {id:"t_fool", n:1, name:"The Fool", fool:1, dist:"Watson", sub:"Little China", loc:"Right outside V's apartment (Megabuilding H10).", img:TI+"b/b1/TarotCard_01_TheFool.png/revision/latest?cb=20210103215616", src:T+"#The_Fool", verified:true},
  {id:"t_magician", n:2, name:"The Magician", fool:1, dist:"Watson", sub:"Kabuki", loc:"Right outside Lizzie's Bar.", near:["q004_braindance"], img:TI+"d/d6/TarotCard_02_TheMagician.png/revision/latest?cb=20210103215747", src:T+"#The_Magician", verified:true},
  {id:"t_high_priestess", n:3, name:"The High Priestess", fool:1, dist:"Heywood", sub:"Vista del Rey", loc:"At Takemura's hideout, where you meet Hanako.", near:["q112_04_hideout"], img:TI+"b/bf/TarotCard_03_TheHighPriestess.png/revision/latest?cb=20210103215846", src:T+"#The_High_Priestess", verified:true},
  {id:"t_empress", n:4, name:"The Empress", fool:1, dist:"Watson", sub:"Little China", loc:"Down the stairs, inside the Afterlife.", img:TI+"1/1d/TarotCard_04_TheEmpress.png/revision/latest?cb=20210103220157", src:T+"#The_Empress", verified:true},
  {id:"t_emperor", n:5, name:"The Emperor", fool:1, dist:"Watson", sub:"Arasaka Waterfront", loc:"Left side, next to the gate of Konpeki Plaza.", near:["q005_heist"], img:TI+"d/df/TarotCard_05_TheEmperor.png/revision/latest?cb=20210103220447", src:T+"#The_Emperor", verified:true},
  {id:"t_hierophant", n:6, name:"The Hierophant", fool:1, dist:"Westbrook", sub:"Japantown", loc:"Down at water level inside a tunnel on the Japantown waterfront, near where you meet Takemura.", near:["q112_01_old_friend"], img:TI+"d/d2/TarotCard_06_TheHierophant.png/revision/latest?cb=20210103220542", src:T+"#The_Hierophant", verified:true},
  {id:"t_lovers", n:7, name:"The Lovers", fool:1, dist:"Westbrook", sub:"North Oak", loc:"Back of the screen at the Silver Pixel Cloud drive-in.", near:["sq031_cinema"], img:TI+"f/f3/TarotCard_07_TheLovers.png/revision/latest?cb=20210103220610", src:T+"#The_Lovers", verified:true},
  {id:"t_chariot", n:8, name:"The Chariot", fool:1, dist:"Watson", sub:"Little China", loc:"Near Tom's Diner.", near:["q101_resurrection"], img:TI+"c/cb/TarotCard_08_TheChariot.png/revision/latest?cb=20210103220714", src:T+"#The_Chariot", verified:true},
  {id:"t_strength", n:9, name:"Strength", fool:1, dist:"Santo Domingo", sub:"Rancho Coronado", loc:"On a building wall at the Rancho Coronado Container Freight Station, where you meet Panam.", near:["q103_warhead"], img:TI+"8/88/TarotCard_09_Strength.png/revision/latest?cb=20210103220829", src:T+"#Strength", verified:true},
  {id:"t_hermit", n:10, name:"The Hermit", fool:1, dist:"Pacifica", sub:"Coastview", loc:"Near the Pacifica Serenity Bible Church.", near:["q110_03_cyberspace"], img:TI+"4/4f/TarotCard_10_TheHermit.png/revision/latest?cb=20210103220946", src:T+"#The_Hermit", verified:true},
  {id:"t_wheel", n:11, name:"Wheel of Fortune", fool:1, dist:"Badlands", sub:"Red Peaks", loc:"At the Sunset Motel.", near:["q104_01_sabotage", "q104_02_av_chase"], img:TI+"0/01/TarotCard_11_WheelOfFortune.png/revision/latest?cb=20210103221204", src:T+"#Wheel_of_Fortune", verified:true},
  {id:"t_justice", n:12, name:"Justice", fool:1, dist:"Santo Domingo", sub:"Arroyo", loc:"Near the Electric Corporation Power Plant.", near:["q105_03_braindance_studio"], img:TI+"4/4f/TarotCard_12_Justice.png/revision/latest?cb=20210103221316", src:T+"#Justice", verified:true},
  {id:"t_hanged_man", n:13, name:"The Hanged Man", fool:1, dist:"Badlands", sub:"Oil Fields", loc:"On the side of a water tower near Johnny's grave.", near:["sq031_rogue"], img:TI+"0/0e/TarotCard_13_TheHangedMan.png/revision/latest?cb=20210103221527", src:T+"#The_Hanged_Man", verified:true},
  {id:"t_death", n:14, name:"Death", fool:1, dist:"Heywood", sub:"The Glen", loc:"Near Embers.", near:["02_sickness"], img:TI+"8/8e/TarotCard_14_Death.png/revision/latest?cb=20210103221556", src:T+"#Death", verified:true},
  {id:"t_temperance", n:15, name:"Temperance", fool:1, dist:"Westbrook", sub:"North Oak", loc:"Near the Columbarium.", img:TI+"2/21/TarotCard_15_Temperance.png/revision/latest?cb=20210103221722", src:T+"#Temperance", verified:true},
  {id:"t_tower", n:17, name:"The Tower", fool:1, dist:"City Center", sub:"Corpo Plaza", loc:"At the Arasaka Memorial near Arasaka Tower.", img:TI+"b/b6/TarotCard_17_TheTower.png/revision/latest?cb=20210103221813", src:T+"#The_Tower", verified:true},
  {id:"t_star", n:18, name:"The Star", fool:1, dist:"Badlands", sub:"Jackson Plains", loc:"Near the solar arrays (NightCorp Solar Station).", img:TI+"5/59/TarotCard_18_TheStar.png/revision/latest?cb=20210103221837", src:T+"#The_Star", verified:true},
  {id:"t_moon", n:19, name:"The Moon", fool:1, dist:"Westbrook", sub:"North Oak", loc:"Right outside the Arasaka Estate.", img:TI+"1/15/TarotCard_19_TheMoon.png/revision/latest?cb=20210103221900", src:T+"#The_Moon", verified:true},
  {id:"t_sun", n:20, name:"The Sun", fool:1, dist:"Watson", sub:"Little China", loc:"Below V's penthouse (seen in the Path of Glory epilogue).", img:TI+"d/d1/TarotCard_20_TheSun.png/revision/latest?cb=20210103221943", src:T+"#The_Sun", verified:true},
  {id:"t_world", n:22, name:"The World", fool:1, dist:"Watson", sub:"Little China", loc:"On the rooftop near Misty's Esoterica.", near:["02_sickness"], img:TI+"a/ae/TarotCard_22_TheWorld.png/revision/latest?cb=20210103222034", src:T+"#The_World", verified:true},
  // ---- Major Arcana (endings only, not needed for Fool on the Hill) ----
  {id:"t_devil", n:16, name:"The Devil", dist:"Endings", loc:"Obtained by completing The Devil ending; seen in Where is My Mind? when V breaks the Rubik's cube.", need:"The Devil ending", near:["q201_heir"], img:TI+"1/11/TarotCard_16_TheDevil.png/revision/latest?cb=20210103221749", src:T+"#The_Devil", verified:true},
  {id:"t_judgement", n:21, name:"Judgement", dist:"Endings", loc:"Inspect it in the area where you fight Adam Smasher, before the entrance to Mikoshi.", need:"Any ending except The Devil and Path of Least Resistance", near:["q115_rogues_last_flight", "q114_03_attack_on_arasaka_tower", "09_solo"], img:TI+"1/14/TarotCard_21_Judgement.png/revision/latest?cb=20210103222014", src:T+"#Judgement", verified:true},
  // ---- Kings (Phantom Liberty, Tomorrow Never Knows) ----
  {id:"t_king_cups", n:23, name:"King of Cups", pl:1, dist:"Dogtown", sub:"Coastview", loc:"In the parking lot by Dogtown's main (northern) entrance, where you first meet Songbird.", near:["q301_crash"], img:TI+"7/72/Tarot_23_KingOfCups_CP2077PL.png/revision/latest?cb=20231024095146", src:T+"#King_of_Cups", verified:true},
  {id:"t_king_pentacles", n:24, name:"King of Pentacles", pl:1, dist:"Dogtown", sub:"Longshore Stacks", loc:"On a wall on the upper floors of the Kress Street Hideout building.", near:["q302_reed"], img:TI+"6/6b/Tarot_24_KingOfPentacles_CP2077PL.png/revision/latest?cb=20231024095145", src:T+"#King_of_Pentacles", verified:true},
  {id:"t_king_swords", n:25, name:"King of Swords", pl:1, dist:"Dogtown", sub:"Longshore Stacks", loc:"Outside wall of The Moth, next to the side entrance (northeast side).", near:["q303_baron"], img:TI+"0/0c/Tarot_25_KingOfSwords_CP2077PL.png/revision/latest?cb=20231024095143", src:T+"#King_of_Swords", verified:true},
  {id:"t_king_wands", n:26, name:"King of Wands", pl:1, dist:"Dogtown", sub:"Luxor Heights", loc:"By the basketball court at Tranquil Terrace, where you meet Reed.", near:["q302_reed"], img:TI+"f/f9/Tarot_26_KingOfWands_CP2077PL.png/revision/latest?cb=20231024095141", src:T+"#King_of_Wands", verified:true}
];

/* ---------- Cyberpsycho Sightings ----------
   Tracked by the Minor Job "Psycho Killer" (Regina Jones). Regina wants them
   alive; killing one only changes her dialogue, the reward is the same.
   id = the game's quest id (wiki BaseID) · who = the cyberpsycho · act = earliest act */
const C = "https://cyberpunk.fandom.com/wiki/Cyberpsycho_Sighting:_";
export const cyberpsychos = [
  // ---- Watson ----
  {id:"ma_wat_kab_02", name:"Demons of War", who:"Matt Liaw", dist:"Watson", sub:"Kabuki", loc:"Unfinished highway bridge south of the All Foods Plant.", act:1, after:["q003_maelstrom"], src:C+"Demons_of_War", verified:true},
  {id:"ma_wat_kab_08", name:"Lt. Mower", who:"Lt. Mower", dist:"Watson", sub:"Kabuki", loc:"Secluded area near Abraham and Allen Street, east of Lizzie's Bar.", act:1, src:C+"Lt._Mower", verified:true},
  {id:"ma_wat_nid_22", name:"Six Feet Under", who:"Lely Hein", dist:"Watson", sub:"Northside", loc:"Abandoned train station, southeast of Ebunike Docks.", act:1, src:C+"Six_Feet_Under", verified:true},
  {id:"ma_wat_lch_06", name:"Ticket to the Major Leagues", who:"Alec Johnson", dist:"Watson", sub:"Little China", loc:"Bodyweight Warehouse.", act:1, items:[{n:"M2067 Defender with Big Mags", miss:1}], src:C+"Ticket_to_the_Major_Leagues", verified:true},
  {id:"ma_wat_nid_03", name:"Where the Bodies Hit the Floor", who:"Ellis Carter", dist:"Watson", sub:"Northside", loc:"Totentanz.", act:1, src:C+"Where_the_Bodies_Hit_the_Floor", verified:true},
  {id:"ma_wat_nid_15", name:"Bloody Ritual", who:"Zaria Hughes", dist:"Watson", sub:"Northside", act:2, after:["q101_resurrection"], need:"Only between 8 PM and 5 AM in game", src:C+"Bloody_Ritual", verified:true},
  // ---- Westbrook, City Center, Heywood ----
  {id:"ma_cct_dtn_03", name:"On Deaf Ears", who:"Cedric Muller", dist:"City Center", sub:"Downtown", act:2, src:C+"On_Deaf_Ears", verified:true},
  {id:"ma_cct_dtn_07", name:"Phantom of Night City", who:"Norio Akuhara", dist:"City Center", sub:"Corpo Plaza", act:2, src:C+"Phantom_of_Night_City", verified:true},
  {id:"ma_hey_spr_06", name:"Letter of the Law", who:"Gaston Phillips", dist:"Heywood", sub:"Wellsprings", act:2, src:C+"Letter_of_the_Law", verified:true},
  {id:"ma_hey_spr_04", name:"Seaside Cafe", who:"Dao Hyunh", dist:"Heywood", sub:"Wellsprings", act:2, src:C+"Seaside_Cafe", verified:true},
  // ---- Santo Domingo, Pacifica ----
  {id:"ma_std_rcr_11", name:"Discount Doc", who:"Chase Coley", dist:"Santo Domingo", sub:"Rancho Coronado", act:2, src:C+"Discount_Doc", verified:true},
  {id:"ma_std_arr_06", name:"Under the Bridge", who:"Tamara Cosby", dist:"Santo Domingo", sub:"Arroyo", act:2, src:C+"Under_the_Bridge", verified:true},
  {id:"ma_pac_cvi_15", name:"Lex Talionis", who:"Ben DeBaillon", dist:"Pacifica", sub:"Coastview", loc:"Grand Imperial Mall.", act:2, items:[{n:"M-10AF Lexington"}, {n:"Illegally modified military infovisor"}], src:C+"Lex_Talionis", verified:true},
  {id:"ma_pac_cvi_08", name:"Smoke on the Water", who:"Diego Ramirez", dist:"Pacifica", sub:"Coastview", loc:"Pacifica Pier.", act:2, src:C+"Smoke_on_the_Water", verified:true},
  // ---- Badlands ----
  {id:"ma_bls_ina_se1_08", name:"House on a Hill", who:"Russel Greene", dist:"Badlands", sub:"Rocky Ridge", loc:"Greene Homestead.", act:2, src:C+"House_on_a_Hill", verified:true},
  {id:"ma_bls_ina_se1_22", name:"Second Chances", who:"Zion Wylde", dist:"Badlands", sub:"Vasquez Pass", act:2, src:C+"Second_Chances", verified:true},
  {id:"ma_bls_ina_se1_07", name:"The Wasteland", who:"Euralio Alma", dist:"Badlands", sub:"Rocky Ridge", act:2, after:["q104_02_av_chase"], src:C+"The_Wasteland", verified:true}
];

/* ---------- Phantom Liberty airdrops ----------
   The one-time "metaquest" airdrops, plus three one-off treasure caches. They start
   during Lucretia My Reflection and drop one at a time as you roam Dogtown.
   The wiki: skip one (let it despawn) and it and its loot are gone for good.
   After one has dropped, repeat airdrops at the same spot carry random loot.
   Every airdrop also holds a Carrying Capacity Shard.
   wpn = iconic weapon ids (Gear › Weapons) · loot = other notable contents
   rtt = contents change once Run This Town is done (wiki lists both) */
const A = "https://cyberpunk.fandom.com/wiki/Cyberpunk_2077_Airdrops#";
export const airdrops = [
  // ---- Metaquest airdrops (one time each) ----
  {id:"sa_ep1_3", name:"The first airdrop", sub:"Luxor Heights", loc:"Wild Blue Hotel, behind the Akebono Hotel. Guaranteed during Lucretia My Reflection.", near:["q302_reed"], loot:["Tetratronic Rippler", "Panoramic VR goggles", "Breathable unitard with micropore foil"], src:A+"sa_ep1_3", verified:true},
  {id:"sa_ep1_30", name:"South of the Akebono", sub:"Luxor Heights", loc:"South of the Akebono Hotel.", loot:["D5 Copperhead (BARGHEST)", "Reinforced-nylon BARGHEST combat hoodie", "Pyro", "Ready Steady"], rtt:1, src:A+"sa_ep1_30", verified:true},
  {id:"sa_ep1_31", name:"Wild Blue Hotel", sub:"Luxor Heights", loc:"Wild Blue Hotel, behind the Akebono Hotel.", loot:["M221 Saratoga (BARGHEST)", "Critochet", "Focus Fire"], rtt:1, src:A+"sa_ep1_31", verified:true},
  {id:"sa_ep1_32", name:"Kress Street construction site", sub:"Longshore Stacks", loc:"Construction site at the Kress Street Hideout.", loot:["M251s Ajax (BARGHEST)", "Handmade half-zip with vicuna wool lining", "Skill Shard: Shinobi"], rtt:1, src:A+"sa_ep1_32", verified:true},
  {id:"sa_ep1_33", name:"Los Osos Motel pool", sub:"Golden Pacific", loc:"In the swimming pool of the Los Osos Motel.", wpn:["Preset_Burya_AirDrop"], loot:["Old tac vest with mounting straps", "Gray softshell novawear pants", "Anti-corrosive mask with apochromatic visor"], src:A+"sa_ep1_33", verified:true},
  {id:"sa_ep1_34", name:"Akebono parking lot", sub:"Luxor Heights", loc:"Parking lot across the street from the Akebono Hotel.", loot:["Biotech Σ cyberdeck", "Quickhack components"], rtt:1, note:"If the gig Treating Symptoms is done, this drop's contents change again (wiki).", src:A+"sa_ep1_34", verified:true},
  {id:"sa_ep1_35", name:"High Peak construction site", sub:"Luxor Heights", loc:"Construction site of the High Peak hotel. The first drop brings Scavengers disguised as workers; per the wiki, a follow-up drop here holds the Biomonitor data shard, the vest and the mask.", loot:["M2038 Tactician (BARGHEST)", "Acid-proof ballistic mask", "Official BARGHEST tac vest", "Skill Shard: Solo"], rtt:1, note:"Wiki bug note: it can drop while you talk to Reed in his car during Lucretia My Reflection and despawn before you reach it.", src:A+"sa_ep1_35", verified:true},
  {id:"sa_ep1_36", name:"South of the stadium", sub:"Dogtown", loc:"Parking lot south of the EBM Petrochem Stadium.", loot:["HA-7 Warden (BARGHEST)", "Worn surplus helmet", "Ballistic vest with high-alloy steel armor", "Big Mag"], src:A+"sa_ep1_36", verified:true},
  {id:"sa_ep1_37", name:"Tranquil Terrace", sub:"Luxor Heights", loc:"Tranquil Terrace.", after:["q302_reed"], loot:["Kiroshi \"Clairvoyant\" Optics", "Scratched heavy netrunner helmet", "Skill Shard: Headhunter"], note:"Contents change once the gig Spy in the Jungle is done (wiki).", src:A+"sa_ep1_37", verified:true},
  {id:"sa_ep1_38", name:"Brave Atlas", sub:"Dogtown", loc:"At the Brave Atlas.", after:["q302_reed"], need:"Defeat the cyberjunkie Garry Bates first", wpn:["Preset_Grad_AirDrop"], loot:["Vest with ammunition panel", "Used outdoorsman ripstop novawear pants"], src:A+"sa_ep1_38", verified:true},
  {id:"sa_ep1_39", name:"Undersea Reverie", sub:"Dogtown", loc:"Undersea Reverie, on top of the Lions of Eden. Only after the first airdrop.", loot:["M-10AF Lexington (BARGHEST)", "Pinpoint", "Zenith"], src:A+"sa_ep1_39", verified:true},
  {id:"sa_ep1_300", name:"Black Sapphire", sub:"Dogtown", loc:"Near the Black Sapphire.", loot:["Crusher (BARGHEST)", "Vivisector", "Condenser"], src:A+"sa_ep1_300", verified:true},
  {id:"sa_ep1_301", name:"Founding Our Future Expo", sub:"Dogtown", loc:"Close to the Founding Our Future Expo, after the first airdrop. Someone loots it first: follow the blood trail to their body.", loot:["Kyubi (BARGHEST)", "Helmet with active ventilation system", "Old army surplus ballistic vest"], src:A+"sa_ep1_301", verified:true},
  {id:"sa_ep1_303", name:"Brave Atlas (second)", sub:"Dogtown", loc:"At the Brave Atlas.", after:["q302_reed"], need:"Defeat the cyberjunkie Garry Bates first", loot:["Nekomata (BARGHEST)", "C-Thru", "Headtoll"], src:A+"sa_ep1_303", verified:true},
  {id:"sa_ep1_304", name:"Montezuma's Throne", sub:"Dogtown", loc:"On top of the northernmost tower of Montezuma's Throne / Capitán Caliente.", wpn:["Preset_Metel_AirDrop"], loot:["Polyester camouflage balaclava", "Burnt fireproof hoodie", "Military novawear pants with nanoceramic seams"], src:A+"sa_ep1_304", verified:true},
  {id:"sa_ep1_306", name:"Across from the Brave Atlas", sub:"Dogtown", loc:"Across from the Brave Atlas, after the first airdrop.", wpn:["Preset_Pozhar_AirDrop"], loot:["Ultralight helmet with foam padding", "Professional tac vest with low infrared emission"], src:A+"sa_ep1_306", verified:true},
  // ---- Treasure caches (lootable once, random airdrop-style loot) ----
  {id:"ad_treasure_longshore", name:"Treasure: Longshore Stacks", treasure:1, sub:"Longshore Stacks", loc:"See the wiki's map picture for the exact spot.", src:A+"Treasure_Locations", verified:true},
  {id:"ad_treasure_luxor_spa", name:"Treasure: Luxor High Wellness Spa", treasure:1, sub:"Luxor Heights", loc:"See the wiki's map picture for the exact spot.", src:A+"Treasure_Locations", verified:true},
  {id:"ad_treasure_eden_plaza", name:"Treasure: Eden Plaza", treasure:1, sub:"Dogtown", loc:"See the wiki's map picture for the exact spot.", src:A+"Treasure_Locations", verified:true}
];

/* ---------- Relic terminals ----------
   Nine Operational Data Terminals in Dogtown, one Relic point each. Songbird gives
   3 more in Dog Eat Dog and 3 in Birds with Broken Wings (15 in total). */
const R = "https://cyberpunk.fandom.com/wiki/Relic_(attribute)#Data_Terminals";
export const relicTerminals = [
  {id:"rt_stadium", name:"EBM Petrochem Stadium", loc:"Behind some scaffolding at the northern end of the market place.", src:R, verified:true},
  {id:"rt_brave_atlas", name:"Brave Atlas", loc:"Second floor of the building's parking garage.", src:R, verified:true},
  {id:"rt_kress_street", name:"Elizabeth Kress Street", loc:"Ground floor, near the elevator entrance.", src:R, verified:true},
  {id:"rt_montezuma", name:"Montezuma's Throne", loc:"On the northeastern ruined tower.", src:R, verified:true},
  {id:"rt_eventide", name:"Eventide Resort & Spa", loc:"Right below the raised platform leading to the entrance.", src:R, verified:true},
  {id:"rt_luxor_spa", name:"Luxor High Wellness Spa", loc:"Inside the southern part of the spa complex (the Increased Criminal Activity: Voodoo Boys spot).", src:R, verified:true},
  {id:"rt_esc_explorer", name:"ESC Explorer", loc:"Inside the building (the Increased Criminal Activity: SCAVENGERS spot).", src:R, verified:true},
  {id:"rt_tunnel", name:"The Tunnel", loc:"Inside the Dogtown tunnel (the Increased Criminal Activity: BARGHEST spot).", src:R, verified:true},
  {id:"rt_washington_st", name:"George Washington Street", loc:"On a balcony up a staircase due north of Heavy Hearts.", src:R, verified:true}
];

/* ---------- Apartments ----------
   V's own places. The four rentals appear on the EZEstates netpage after talking
   with Takemura at Tom's Diner (Playing for Time); rent online or at the door.
   V's penthouse is only seen in the Path of Glory epilogue, so it isn't listed.
   dep = depends on a romance or choice (not counted in the totals)
   id: the game's quest id for the rentals, otherwise made from the name */
const AP = "https://cyberpunk.fandom.com/wiki/";
export const apartments = [
  // ---- V's apartments ----
  {id:"apt_h10", name:"V's Apartment", dist:"Watson", sub:"Little China", loc:"Megabuilding H10, 8th floor.", after:["q001_intro"], note:"Your first home, from Act 1. Memorabilia and pets show up here.", src:AP+"V's_Apartment", verified:true},
  {id:"dlc6_apart_wat_nid", name:"Northside Apartment", dist:"Watson", sub:"Northside", loc:"Unit 1242 of the motel on Martin Street.", price:10000, after:["q101_resurrection"], need:"Or free: with Intelligence 20, hack the keypad right of the door", mission:"Welcome Home: Northside", src:AP+"Welcome_Home:_Northside", verified:true},
  {id:"dlc6_apart_wbr_jpn", name:"Japantown Apartment", dist:"Westbrook", sub:"Japantown", loc:"Apartment block on Holly and Floyd Street.", price:30000, after:["q101_resurrection"], mission:"Welcome Home: Japantown", src:AP+"Welcome_Home:_Japantown", verified:true},
  {id:"dlc6_apart_hey_gle", name:"Glen Apartment", dist:"Heywood", sub:"The Glen", loc:"Hotel on Palms View Way.", price:80000, after:["q101_resurrection"], mission:"Welcome Home: The Glen", src:AP+"Welcome_Home:_The_Glen", verified:true},
  {id:"dlc6_apart_cct_dtn", name:"Corpo Plaza Apartment", dist:"City Center", sub:"Corpo Plaza", loc:"Hotel on Republic Way, next to Empathy.", price:110000, after:["q101_resurrection"], mission:"Welcome Home: Corpo Plaza", src:AP+"Welcome_Home:_Corpo_Plaza", verified:true},
  {id:"apt_kress_street", name:"Kress Street Hideout", pl:1, dist:"Pacifica", sub:"Dogtown", loc:"Rindo Hotel, 8th floor, Elizabeth Kress Street.", after:["q302_reed"], src:AP+"Kress_Street_Hideout", verified:true},
  // ---- Other places to stay (romance or choice) ----
  {id:"apt_judy", name:"Judy's Apartment", dep:1, dist:"Watson", sub:"Kabuki", after:["sq030_judy_romance"], note:"Bed only if you romanced Judy.", src:AP+"Judy's_Apartment", verified:true},
  {id:"apt_nomad_tent", name:"Aldecaldo camp tent", dep:1, dist:"Badlands", sub:"Rocky Ridge", after:["q104_02_av_chase"], near:["sq027_02_raffen_shiv_attack"], note:"Bed only if you romanced Panam. The wiki lists Life During Wartime and Queen of the Highway.", src:AP+"Aldecaldo_Camp_(2077)", verified:true},
  {id:"apt_kutcher", name:"Kutcher's home", dep:1, dist:"Badlands", sub:"Red Peaks", after:["sq029_sobchak_romance"], note:"Bed only if you romanced River.", src:AP+"Kutcher's_home", verified:true},
  {id:"apt_villa_eurodyne", name:"Villa Eurodyne", dep:1, dist:"Westbrook", sub:"North Oak", after:["sq028_kerry_romance"], note:"Bed only if you romanced Kerry.", src:AP+"Villa_Eurodyne", verified:true}
];
