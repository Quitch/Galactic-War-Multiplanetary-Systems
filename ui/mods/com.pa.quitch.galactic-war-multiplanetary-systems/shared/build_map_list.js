var multiplanetarySystemTabsLoaded;

if (!multiplanetarySystemTabsLoaded) {
  multiplanetarySystemTabsLoaded = true;

  function multiplanetarySystemTabs() {
    try {
      var multiplanetaryMaps = [];
      var multiStartMaps = [];
      var mapTabOne = "Multiplanetary Systems";
      var mapTabTwo = "Multiplanetary Spawns";

      // Create an empty tab to load in time for Shared Systems for Galactic War
      cShareSystems.load_pas(mapTabOne, multiplanetaryMaps);
      cShareSystems.load_pas(mapTabTwo, multiStartMaps);

      var checkForMultiplePlanets = function (
        numberOfPlanets,
        coherentFilePath
      ) {
        if (numberOfPlanets > 1) {
          multiplanetaryMaps.push(coherentFilePath);
        }
      };

      var checkForMultiplanetarySpawns = function (planets, coherentFilePath) {
        var startingPlanets = 0;
        for (var planet of planets) {
          if (planet.starting_planet === true) {
            startingPlanets += 1;
          }
          if (startingPlanets > 1) {
            multiStartMaps.push(coherentFilePath);
            break;
          }
        }
      };

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
            checkForMultiplePlanets(mapFile.planets.length, coherentFilePath);
            checkForMultiplanetarySpawns(mapFile.planets, coherentFilePath);
          }).always(function () {
            deferred.resolve();
          });
        });

        $.when.apply($, deferredQueue).then(function () {
          cShareSystems.load_pas(mapTabOne, multiplanetaryMaps);
          cShareSystems.load_pas(mapTabTwo, multiStartMaps);
        });
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  multiplanetarySystemTabs();
}
