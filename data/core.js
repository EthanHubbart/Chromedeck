/* =====================================================================
   CORE DATA — Cyberpunk 2077 patch 2.31
   Body slots, capacity rules, capacity shards, attributes and perk-point
   progression. Edit by hand when a patch changes something, then bump
   `version` in data/index.js. Keep every `id` stable: saved builds use them.
   ===================================================================== */
export const core = {
  slots: [
    {id:"frontal",  name:"Frontal Cortex",       base:3},
    {id:"os",       name:"Operating System",     base:1},
    {id:"arms",     name:"Arms",                 base:1},
    {id:"face",     name:"Face",                 base:1, faceplate:true},
    {id:"skeleton", name:"Skeleton",             base:2, perkSlot:"licenseToChrome", perkName:"License to Chrome"},
    {id:"hands",    name:"Hands",                base:1, perkSlot:"ambidextrous",   perkName:"Ambidextrous"},
    {id:"nervous",  name:"Nervous System",       base:3},
    {id:"circ",     name:"Circulatory System",   base:3},
    {id:"integ",    name:"Integumentary System", base:3},
    {id:"legs",     name:"Legs",                 base:1}
  ],
  capacity: {
    base:21, perLevel:3, minLevel:1, maxLevel:60, hardCap:450,
    engineering:[{skill:10,bonus:5},{skill:30,bonus:10}],
    renaissancePerAttr:4, edgerunner:50, allThingsCyberPct:20,
    allThingsCyberSlots:["skeleton","integ"], chromeCompressorId:"chrome_compressor",
    perkLinks:{renaissance:"renaissance_punk", allThingsCyber:"all_things_cyber", licenseToChrome:"license_to_chrome", licenseSlotLevel:3, ambidextrous:"ambidextrous", edgerunner:"edgerunner"}
  },
  shards: [
    {id:"t2",  name:"Green shard (T2)",  each:2, max:7, group:"Base game — random drops", note:"Level 2+. At most one per character level. Random enemy/container drop."},
    {id:"t3",  name:"Blue shard (T3)",   each:3, max:4, group:"Base game — random drops", note:"Level 9+. At most one per 2 levels."},
    {id:"t4",  name:"Purple shard (T4)", each:4, max:4, group:"Base game — random drops", note:"Level 17+. At most one per 2 levels."},
    {id:"t5",  name:"Orange shard (T5)", each:6, max:2, group:"Base game — random drops", note:"Level 25+. At most one per 3 levels."},
    {id:"pk",  name:"Psycho Killer reward cache", each:6, max:1, group:"Base game — fixed", note:"Open the cache at level 25+ to get the T5 (+6) version; below 25 it downgrades to T4 (+4)."},
    {id:"plj", name:"Dogtown cyberjunkies", each:2, max:5, group:"Phantom Liberty", pl:true, note:"Five specific cyberjunkie enemies in Dogtown each drop one green shard. Loot before the body despawns."},
    {id:"plg", name:"Dog Eat Dog parking garage", each:4, max:1, group:"Phantom Liberty", pl:true, note:"Purple shard deep in the underground parking during the first Dogtown mission."}
  ],
  attributes: [
    {id:"body", name:"Body", short:"BOD", skill:"Solo", perPoint:"+2 max health per point", branches:["Shotguns, LMGs & HMGs","Health & Adrenaline","Blunt weapons"]},
    {id:"reflexes", name:"Reflexes", short:"REF", skill:"Shinobi", perPoint:"+0.5% crit chance per point", branches:["Assault rifles & SMGs","Movement & Dash","Blades"]},
    {id:"tech", name:"Technical Ability", short:"TECH", skill:"Engineer", perPoint:"+2 armor per point", branches:["Health items & explosives","Cyberware","Tech weapons"]},
    {id:"int", name:"Intelligence", short:"INT", skill:"Netrunner", perPoint:"+1 max RAM per 4 points", branches:["Access points & queues","RAM & Overclock","Smart weapons"]},
    {id:"cool", name:"Cool", short:"COOL", skill:"Headhunter", perPoint:"+1.25% crit damage per point", branches:["Stealth","Handguns & rifles","Throwables"]},
    {id:"relic", name:"Relic", short:"RELIC", skill:"", perPoint:"Phantom Liberty. 15 Relic points total: 6 from Songbird, 9 from Militech data terminals.", branches:["Relic tree"], relic:true}
  ],
  progression: {attrBase:3, attrFree:7, attrMax:20, perkBonus:21, relicPoints:15, tiers:[4,9,15,20], tierNames:{4:"Rookie",9:"Pro",15:"Phenom",20:"Legend"}},
};
