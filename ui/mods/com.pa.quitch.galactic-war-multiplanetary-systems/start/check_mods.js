var gwmsMultiplanetarySystemsLoaded;

if (!gwmsMultiplanetarySystemsLoaded) {
  gwmsMultiplanetarySystemsLoaded = true;

  function gwMultiplanetarySystems() {
    try {
      api.mods.getMounted("client", true).then(function (mods) {
        var modMounted = function (modIdentifier) {
          return _.some(mods, { identifier: modIdentifier });
        };

        model.gwmsMountedClientMods = ko
          .observableArray()
          .extend({ session: "gwms_mounted_client_mods" });

        if (modMounted("com.pa.grandhomie.maps")) {
          model
            .gwmsMountedClientMods()
            .push("coui://ui/mods/grandhomie/systems/32_ffa.pas");
        }
        if (modMounted("nl.pa.wpmarshall.wpmarshall_map_pack")) {
          var wpmarshallMounted = true;
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/wpmarshall/systems/(1v1)_ubersdkhto.pas",
              "coui://ui/mods/wpmarshall/systems/(5v5)_marshall's_lament (classic).pas",
              "coui://ui/mods/wpmarshall/systems/(5v5)_marshall's_lament (redux).pas",
              "coui://ui/mods/wpmarshall/systems/(5v5)_marshall's_lament (titans).pas",
              "coui://ui/mods/wpmarshall/systems/(5v5)_world_of tomorrow 2.1.0.pas"
            );
        }
        if (modMounted("nl.pa.Pwn4two.pwn4two_map_pack")) {
          var pwn4twoMounted = true;
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/pwn4two/systems/icecream_donut utensil.pas",
              "coui://ui/mods/pwn4two/systems/war_of the worlds.pas",
              "coui://ui/mods/pwn4two/systems/attack_on titan.pas",
              "coui://ui/mods/pwn4two/systems/duel_planets.pas",
              "coui://ui/mods/pwn4two/systems/the_big squeeze.pas",
              "coui://ui/mods/pwn4two/systems/32_friends.pas",
              "coui://ui/mods/pwn4two/systems/dualdecahedron.pas"
            );
        }
        if (modMounted("com.pa.academia.maps")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/academia/systems/aca's_universe - s.pas",
              "coui://ui/mods/academia/systems/aca's_universe.pas"
            );
        }
        if (modMounted("uk.pa.tetcmappack")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/tetcmp1/systems/tg1v1.pas",
              "coui://ui/mods/tetcmp1/systems/saturn.pas"
            );
        }
        if (modMounted("com.pa.sonicblue22.maps")) {
          model
            .gwmsMountedClientMods()
            .push(
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
        if (modMounted("com.pa.dissonant.icarusmaps")) {
          model
            .gwmsMountedClientMods()
            .push(
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
        if (modMounted("com.pa.kingslayergm.maps")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/kingslayergm/systems/2v2v2_or_3v3v3_or_3_ffa_or_9_ffa_tripleplanet.pas",
              "coui://ui/mods/kingslayergm/systems/2v2v2v2_or_4v4_biplanet.pas",
              "coui://ui/mods/kingslayergm/systems/2v2v2v2v2_or_5_ffa_planetswar.pas"
            );
        }
        if (modMounted("nl.pa.river.mappack")) {
          model
            .gwmsMountedClientMods()
            .push("coui://ui/mods/river/systems/dual_lake the system.pas");
        }
        if (modMounted("com.pa.therealf.maps")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/therealf/systems/xvx_or ffa orbital war.pas",
              "coui://ui/mods/therealf/systems/apx_system.pas",
              "coui://ui/mods/therealf/systems/star_system.pas",
              "coui://ui/mods/therealf/systems/moon_galaxy_fight.pas",
              "coui://ui/mods/therealf/systems/the_skywalker.pas",
              "coui://ui/mods/therealf/systems/new_far_away_with_gas.pas",
              "coui://ui/mods/therealf/systems/viroo.pas"
            );
        }
        if (modMounted("zaktheevil.client.unified.mappack")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/zaktheevil/systems/fx211-system.pas",
              "coui://ui/mods/zaktheevil/systems/garum-system.pas",
              "coui://ui/mods/zaktheevil/systems/kagamii-nimo-system.pas",
              "coui://ui/mods/zaktheevil/systems/nu-solg-system.pas",
              "coui://ui/mods/zaktheevil/systems/tae-mu-ani-system.pas",
              "coui://ui/mods/zaktheevil/systems/tamarid-system.pas",
              "coui://ui/mods/zaktheevil/systems/vatiq-system.pas"
            );
        }
        if (modMounted("nl.pa.Alpha.alpha2546_map_pack")) {
          var alpha2546Mounted = true;
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/alpha2546/systems/carnage_system.pas",
              "coui://ui/mods/alpha2546/systems/rain_v30.pas",
              "coui://ui/mods/alpha2546/systems/system_f305.pas",
              "coui://ui/mods/alpha2546/systems/system_f205.pas",
              "coui://ui/mods/alpha2546/systems/icy_v17.pas",
              "coui://ui/mods/alpha2546/systems/elrose_v18.pas",
              "coui://ui/mods/alpha2546/systems/f-405.pas",
              "coui://ui/mods/alpha2546/systems/system_f301.pas"
            );
        }
        if (modMounted("nl.pa.andreasg.andreasg_map_pack")) {
          var andreasgMounted = true;
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/andreasg/systems/mots_recipe_for_disaster.pas"
            );
        }
        if (modMounted("nl.pa.Alpha.violetania_map_pack")) {
          model
            .gwmsMountedClientMods()
            .push("coui://ui/mods/violetania/systems/lana's_heart.pas");
        }
        if (modMounted("com.pa.elite.team_burning_systems")) {
          var teamBurningMounted;
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]canopus_system.pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]gemini_belt.pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]mek_whipping grounds (5).pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]mek_whipping grounds (6).pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]mek_whipping grounds (7).pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]mek_whipping grounds (8).pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]mek_whipping grounds (9).pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]mek_whipping grounds (10).pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]omega_belt.pas",
              "coui://ui/mods/Team_Burning_Systems/systems/[tbs]worlds_collide.pas"
            );
        }
        if (modMounted("com.exodusesports.tournamentmappack")) {
          var filteredDuplicateSystems = [
            "coui://ui/mods/maps/systems/bang_battle.pas",
            "coui://ui/mods/maps/systems/burnt_playground.pas",
            "coui://ui/mods/maps/systems/mots_recipe_for_disaster.pas",
            "coui://ui/mods/maps/systems/twbaby.pas",
          ];
          if (!wpmarshallMounted) {
            filteredDuplicateSystems.push(
              "coui://ui/mods/maps/systems/marshalls_lament_titans.pas"
            );
          }
          if (!andreasgMounted) {
            filteredDuplicateSystems.push(
              "coui://ui/mods/maps/systems/mots_recipe_for_disaster_original.pas"
            );
          }
          if (!teamBurningMounted) {
            filteredDuplicateSystems.push(
              "coui://ui/mods/maps/systems/omega_belt.pas"
            );
          }
          if (alpha2546Mounted) {
            filteredDuplicateSystems.push(
              "coui://ui/mods/maps/systems/icy_v17.pas",
              "coui://ui/mods/maps/systems/elrose_v18.pas",
              "coui://ui/mods/maps/systems/t-_rain_system.pas"
            );
          }
          if (!pwn4twoMounted) {
            filteredDuplicateSystems.push(
              "coui://ui/mods/maps/systems/war_of the worlds.pas"
            );
          }
          model.gwmsMountedClientMods(
            model.gwmsMountedClientMods().concat(filteredDuplicateSystems)
          );
        }
        if (modMounted("com.pa.tokenelt.maps")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/com.pa.tokenelt.maps/systems/gamma_system.pas"
            );
        }
        if (modMounted("com.pa.tesseracta.client.maps")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/PTMP/systems/alpha_centauri a.pas",
              "coui://ui/mods/PTMP/systems/alpha_draconois.pas",
              "coui://ui/mods/PTMP/systems/beta_draconois.pas",
              "coui://ui/mods/PTMP/systems/collide.pas",
              "coui://ui/mods/PTMP/systems/delta_hydri.pas",
              "coui://ui/mods/PTMP/systems/gelan,_ignus, aqua.pas",
              "coui://ui/mods/PTMP/systems/heck_3.pas",
              "coui://ui/mods/PTMP/systems/orbit.pas",
              "coui://ui/mods/PTMP/systems/orbit_2.pas",
              "coui://ui/mods/PTMP/systems/pax_alpha 2016.pas",
              "coui://ui/mods/PTMP/systems/pax_alpha 2017.pas",
              "coui://ui/mods/PTMP/systems/pax_beta 2016.pas",
              "coui://ui/mods/PTMP/systems/pax_fish 2015.pas",
              "coui://ui/mods/PTMP/systems/perpendicular_gas.pas",
              "coui://ui/mods/PTMP/systems/prehistoric_sol.pas",
              "coui://ui/mods/PTMP/systems/sol_2.pas",
              "coui://ui/mods/PTMP/systems/theamore.pas",
              "coui://ui/mods/PTMP/systems/unique_planets x.pas",
              "coui://ui/mods/PTMP/systems/_gas_battles.pas",
              "coui://ui/mods/PTMP/systems/_pax_earth 2016.pas",
              "coui://ui/mods/PTMP/systems/_pax_sire 2016.pas",
              "coui://ui/mods/PTMP/systems/_prodecor.pas",
              "coui://ui/mods/PTMP/systems/_theamore_ii.pas",
              "coui://ui/mods/PTMP/systems/_unrutned_beta.pas"
            );
        }
        if (modMounted("Community_Map_Pack")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/CMP/systems/gemini_belt.pas",
              "coui://ui/mods/CMP/systems/canopus_system.pas"
            );
        }
        if (modMounted("DrBoggles")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/DrBoggles_Map_Pack/systems/Brahma.pas",
              "coui://ui/mods/DrBoggles_Map_Pack/systems/Kronos.pas",
              "coui://ui/mods/DrBoggles_Map_Pack/systems/Vixitores Duel.pas",
              "coui://ui/mods/DrBoggles_Map_Pack/systems/Words-Of-Conviction.pas"
            );
        }
        if (modMounted("com.pa.conundrum.cMaps_genesis")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/cMaps_genesis/systems/faceoff.pas",
              "coui://ui/mods/cMaps_genesis/systems/honeypot.pas"
            );
        }
        if (modMounted("nl.pa.andreasg.ffa_map_pack")) {
          model
            .gwmsMountedClientMods()
            .push("coui://ui/mods/ffa_map_pack/systems/best_off_ladder.pas");
        }
        if (modMounted("com.flubbateios.mappack")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/com.flubbateios.mappack/flubb/iron_ball.pas",
              "coui://ui/mods/com.flubbateios.mappack/flubb/dennis_the_menace_v3.pas",
              "coui://ui/mods/com.flubbateios.mappack/flubb/desserted.pas",
              "coui://ui/mods/com.flubbateios.mappack/nik/french_date.pas",
              "coui://ui/mods/com.flubbateios.mappack/nik/nik2.pas"
            );
        }
        if (modMounted("com.pa.easybox.mappack")) {
          model
            .gwmsMountedClientMods()
            .push(
              "coui://ui/mods/com.pa.easybox.mappack/systems/homeworld.pas",
              "coui://ui/mods/com.pa.easybox.mappack/systems/jupiter.pas"
            );
        }
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwMultiplanetarySystems();
}