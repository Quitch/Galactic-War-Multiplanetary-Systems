var gwmsMultiplanetarySystemsLoaded;

if (!gwmsMultiplanetarySystemsLoaded) {
  gwmsMultiplanetarySystemsLoaded = true;

  function gwmsMultiplanetarySystems() {
    try {
      var multiplanetaryMaps = [];
      var multiStartMaps = [];

      // Create an empty tab to load in time for Shared Systems for Galactic War
      cShareSystems.load_pas("GWMS Multiplanetary Systems", multiplanetaryMaps);
      cShareSystems.load_pas("GWMS Multiplanetary Spawns", multiStartMaps);

      api.file.list("/ui/mods/", true).then(function (fileList) {
        var deferredQueue = [];

        _.forEach(fileList, function (filePath) {
          if (!_.endsWith(filePath, ".pas")) {
            return;
          }

          var deferred = $.Deferred();
          deferredQueue.push(deferred);

          var coherentFilePath = "coui:/" + filePath;

          $.getJSON(coherentFilePath, function (mapFile) {
            var startingPlanets = 0;
            if (mapFile.planets.length > 1) {
              multiplanetaryMaps.push(coherentFilePath);
            }

            for (var planet of mapFile.planets) {
              if (planet.starting_planet === true) {
                startingPlanets += 1;
              }
              if (startingPlanets > 1) {
                multiStartMaps.push(coherentFilePath);
                break;
              }
            }
          }).always(function () {
            deferred.resolve();
          });
        });

        $.when.apply($, deferredQueue).then(function () {
          cShareSystems.load_pas("GWMS Multiplanetary", multiplanetaryMaps);
          cShareSystems.load_pas("GWMS Multiplanetary Starts", multiStartMaps);
        });
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwmsMultiplanetarySystems();
}
