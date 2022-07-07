var gwmsMultiplanetarySystemsLoaded;

if (!gwmsMultiplanetarySystemsLoaded) {
  gwmsMultiplanetarySystemsLoaded = true;

  function gwmsMultiplanetarySystems2() {
    try {
      var maps = [];

      // Create an empty tab to load in time for Shared Systems for Galactic War
      cShareSystems.load_pas("GWMS New Multiplanetary", maps);

      api.file.list("/ui/mods/", true).then(function (fileList) {
        var deferredQueue = [];

        _.forEach(fileList, function (filePath) {
          if (!_.endsWith(filePath, ".pas")) {
            return;
          }

          var deferred = $.Deferred();
          deferredQueue.push(deferred);

          $.getJSON("coui:/" + filePath, function (mapFile) {
            var startingPlanets = 0;
            for (var planet of mapFile.planets) {
              if (planet.starting_planet === true) {
                startingPlanets += 1;
              }
              if (startingPlanets > 1) {
                maps.push("coui:/" + filePath);
                break;
              }
            }
          }).always(function () {
            deferred.resolve();
          });
        });

        $.when.apply($, deferredQueue).then(function () {
          cShareSystems.load_pas("GWMS New Multiplanetary", maps);
        });
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwmsMultiplanetarySystems2();
}
