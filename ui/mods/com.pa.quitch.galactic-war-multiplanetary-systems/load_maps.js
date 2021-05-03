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

        cShareSystems.load_pas("Multiplanetary", multiplanetarySystems);
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwMultiplanetarySystems();
}
