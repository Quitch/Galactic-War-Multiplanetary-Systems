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

        cShareSystems.load_pas("Multiplanetary", multiplanetarySystems);
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwMultiplanetarySystems();
}
