var gwMultiplanetarySystemsLoaded;

if (!gwMultiplanetarySystemsLoaded) {
  gwMultiplanetarySystemsLoaded = true;

  function gwMultiplanetarySystems() {
    try {
      api.mods.getMounted("client", true).then(function (mods) {
        var modPresent = function (modIdentifier) {
          return _.some(mods, { identifier: modIdentifier });
        };

        var multiplanetarySystems = [];

        if (modPresent("com.pa.grandhomie.maps")) {
          multiplanetarySystems.push(
            "coui://ui/mods/grandhomie/systems/32_ffa.pas"
          );
        }
        if (modPresent("nl.pa.wpmarshall.wpmarshall_map_pack")) {
          multiplanetarySystems.push(
            "coui://ui/mods/wpmarshall/systems/(1v1)_ubersdkhto.pas",
            "coui://ui/mods/wpmarshall/systems/(5v5)_marshall's_lament (classic).pas",
            "coui://ui/mods/wpmarshall/systems/(5v5)_marshall's_lament (redux).pas",
            "coui://ui/mods/wpmarshall/systems/(5v5)_marshall's_lament (titans).pas",
            "coui://ui/mods/wpmarshall/systems/(5v5)_world_of tomorrow 2.1.0.pas"
          );
        }
        if (modPresent("nl.pa.Pwn4two.pwn4two_map_pack")) {
          multiplanetarySystems.push(
            "coui://ui/mods/pwn4two/systems/icecream_donut utensil.pas",
            "coui://ui/mods/pwn4two/systems/war_of the worlds.pas",
            "coui://ui/mods/pwn4two/systems/attack_on titan.pas",
            "coui://ui/mods/pwn4two/systems/duel_planets.pas",
            "coui://ui/mods/pwn4two/systems/the_big squeeze.pas",
            "coui://ui/mods/pwn4two/systems/32_friends.pas",
            "coui://ui/mods/pwn4two/systems/dualdecahedron.pas"
          );
        }
        if (modPresent("com.pa.academia.maps")) {
          multiplanetarySystems.push(
            "coui://ui/mods/academia/systems/aca's_universe - s.pas",
            "coui://ui/mods/academia/systems/aca's_universe.pas"
          );
        }
        if (modPresent("uk.pa.tetcmappack")) {
          multiplanetarySystems.push(
            "coui://ui/mods/tetcmp1/systems/tg1v1.pas",
            "coui://ui/mods/tetcmp1/systems/saturn.pas"
          );
        }
        if (modPresent("com.pa.sonicblue22.maps")) {
          multiplanetarySystems.push(
            "coui://ui/mods/SonicBlue22/systems/destroyer.pas",
            "coui://ui/mods/SonicBlue22/systems/mega_asteroids.pas",
            "coui://ui/mods/SonicBlue22/systems/rice.pas",
            "coui://ui/mods/SonicBlue22/systems/rings.pas",
            "coui://ui/mods/SonicBlue22/systems/ruins.pas",
            "coui://ui/mods/SonicBlue22/systems/sula.pas",
            "coui://ui/mods/SonicBlue22/systems/tri-way.pas",
            "coui://ui/mods/SonicBlue22/systems/wreck.pas"
          );
        }
        if (modPresent("com.pa.dissonant.icarusmaps")) {
          multiplanetarySystems.push(
            "coui://ui/mods/icarus/systems/anon/battle_of midway 5v5 ns.pas",
            "coui://ui/mods/icarus/systems/anon/intrepid_16 ffa.pas",
            "coui://ui/mods/icarus/systems/anon/kuiper_18 ffa.pas",
            "coui://ui/mods/icarus/systems/anon/guns_24 ffa.pas",
            "coui://ui/mods/icarus/systems/anon/kersmash_32 ffa.pas",
            "coui://ui/mods/icarus/systems/anon/the_maul 32 ffa.pas",
            "coui://ui/mods/icarus/systems/anon/beasts_ds 4v4-8v8.pas",
            "coui://ui/mods/icarus/systems/anon/pebbles_ds 4v4-8v8.pas",
            "coui://ui/mods/icarus/systems/anon/system-shock_ds 5v5-10v10.pas",
            "coui://ui/mods/icarus/systems/anon/tale_of_two_worlds ds 6v6-8v8.pas",
            "coui://ui/mods/icarus/systems/anon/system-double_ds 8v8-10v10.pas",
            "coui://ui/mods/icarus/systems/anon/system_re-boot ds 8v8-16v16.pas",
            "coui://ui/mods/icarus/systems/anon/system-crash ds 10v10-16v16.pas",
            "coui://ui/mods/icarus/systems/anon/system-surge ds 3x3-3x5.pas"
          );
        }
        if (modPresent("com.pa.kingslayergm.maps")) {
          multiplanetarySystems.push(
            "coui://ui/mods/kingslayergm/systems/2v2v2_or_3v3v3_or_3_ffa_or_9_ffa_tripleplanet.pas",
            "coui://ui/mods/kingslayergm/systems/2v2v2v2_or_4v4_biplanet.pas",
            "coui://ui/mods/kingslayergm/systems/2v2v2v2v2_or_5_ffa_planetswar.pas"
          );
        }
        if (modPresent("nl.pa.river.mappack")) {
          multiplanetarySystems.push(
            "coui://ui/mods/river/systems/dual_lake the system.pas"
          );
        }
        if (modPresent("com.pa.therealf.maps")) {
          multiplanetarySystems.push(
            "coui://ui/mods/therealf/systems/xvx_or ffa orbital war.pas",
            "coui://ui/mods/therealf/systems/apx_system.pas",
            "coui://ui/mods/therealf/systems/star_system.pas",
            "coui://ui/mods/therealf/systems/moon_galaxy_fight.pas",
            "coui://ui/mods/therealf/systems/the_skywalker.pas",
            "coui://ui/mods/therealf/systems/new_far_away_with_gas.pas",
            "coui://ui/mods/therealf/systems/viroo.pas"
          );
        }

        cShareSystems.load_pas("Multiplanetary", multiplanetarySystems);
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwMultiplanetarySystems();
}
