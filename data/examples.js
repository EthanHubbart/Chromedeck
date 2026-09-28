/* Example builds seeded from the old planning sheet. Used only when there are no saved builds. */
export const EXAMPLE_BUILDS = [{
  name:"Sandy gunslinger (from sheet)",
  notes:"Imported from the old planning sheet. Costs updated to 2.31 numbers.",
  level:60, engineering:30, shardMode:"max", ccBonus:70,
  attrs:{body:15, reflexes:17, tech:20, int:9, cool:20},
  perks:{slippery:1, multitasker:1, muscle_memory:1, dash:2, cant_touch_this:1, steady_grip:1, mad_dash:1, mean_streak:1, air_dash:3, aerodynamic:1,
    feline_footwork:1, small_target:1, killer_instinct:1, focus:2, rinse_and_reload:1, no_sweat:1, head_to_head:1, deep_breath:1, deadeye:3, high_noon:1, california_reaper:1, long_shot:1, quick_draw:1, nerves_of_tungsten_steel:1, run_n_gun:1,
    glutton_for_war:1, first_aid:1, health_freak:2, borrowed_time:1, all_things_cyber:2, renaissance_punk:1, chrome_constitution:1, driver_update:1, chipware_connoisseur:1, license_to_chrome:3, ambidextrous:1, cyborg:1, extended_warranty:1, edgerunner:1,
    painkiller:1, comeback_kid:1, army_of_one:1, adrenaline_rush:3, juggernaut:1, calm_mind:1, optimization:1, encryption:1,
    emergency_cloaking:1, sensory_protocol:1, vulnerability_analytics:1, machine_learning:1},
  equipped:{
    frontal:["axolotl","kboost","selfice"], os:["apogee"], arms:["gorilla_e"], face:["cockatrice",null],
    skeleton:["springjoints","titanium","kinetic"], hands:["ballistic","shockabs"],
    nervous:["deepfield","kerenzikov","neofiber"], circ:["biomonitor","bloodpump","healonkill"],
    integ:["defenzikov","opticam","nanoplating"], legs:["reinforced"]
  }
},{
  name:"Netrunner (from sheet)",
  notes:"Imported from the old planning sheet. RAM Upgrade until COX-2 is available; Rippler until Raven. Combo: Sonic Shock → Overheat → Cyberware Malfunction → Short Circuit.",
  level:60, engineering:30, shardMode:"max", ccBonus:70,
  attrs:{body:15, reflexes:11, tech:20, int:20, cool:15},
  perks:{eye_in_the_sky:1, forcekill_cypher:1, warning_explosion_hazard:1, optimization:1, proximate_propagation:1, encryption:1, subordination:1, hack_queue:2, data_recycler:1, feedback_loop:1, embedded_exploit:2, icepick:1, siphon:1, system_overwhelm:1, speculation:1, queue_acceleration:3, queue_prioritization:1, live_wire:1, queue_hack_root:1, blood_daemon:1, overclock:3, sublimation:1, race_against_mind:1, power_surge:1, queue_mastery:1, spillover:1,
    glutton_for_war:1, health_freak:2, all_things_cyber:2, renaissance_punk:1, chrome_constitution:1, driver_update:1, license_to_chrome:3, cyborg:1, extended_warranty:1,
    feline_footwork:1, small_target:1, blind_spot:1, killer_instinct:1, quick_getaway:1, ninjutsu:3, creeping_death:1, vanishing_act:1,
    painkiller:1, comeback_kid:1, adrenaline_rush:2, slippery:1, multitasker:1, dash:2,
    jailbreak:1, data_tunneling:1},
  equipped:{
    frontal:["cox2","exdisk","memboost"], os:["raven"], arms:["monowire_t"], face:["oracle",null],
    skeleton:["epimorphic","unibooster","ramrecoup"], hands:["smartlink"],
    nervous:["neofiber","adrenconv",null], circ:["bloodpump","biomonitor","healonkill"],
    integ:["subdermal","nanoplating","opticam"], legs:["reinforced"]
  }
}];
