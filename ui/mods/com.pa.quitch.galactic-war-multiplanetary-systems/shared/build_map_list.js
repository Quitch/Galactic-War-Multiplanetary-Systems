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
          return coherentFilePath;
        }
      };

      var checkForMultiplanetarySpawns = function (planets, coherentFilePath) {
        var startingPlanets = 0;
        for (var planet of planets) {
          if (planet.starting_planet === true) {
            startingPlanets += 1;
          }
          if (startingPlanets > 1) {
            return coherentFilePath;
          }
        }
      };

      var processMapPacks = function (planets, filePath) {
        var multiPlanetResult = checkForMultiplePlanets(
          planets.length,
          filePath
        );
        var multiStartResult = checkForMultiplanetarySpawns(planets, filePath);

        if (_.isString(multiPlanetResult)) {
          multiplanetaryMaps.push(multiPlanetResult);
        }
        if (_.isString(multiStartResult)) {
          multiStartMaps.push(multiStartResult);
        }
      };

      var defaultMultiplanetary = [];
      var defaultMultiStart = [];

      var prepareDefaultSystems = function (systems) {
        _.forEach(systems, function (system) {
          var multiPlanetResult = checkForMultiplePlanets(
            system.planets.length,
            system
          );
          var multiStartResult = checkForMultiplanetarySpawns(
            system.planets,
            system
          );
          if (_.isObject(multiPlanetResult)) {
            defaultMultiplanetary.push(multiPlanetResult);
          }
          if (_.isObject(multiStartResult)) {
            defaultMultiStart.push(multiStartResult);
          }
        });
      };

      // Scan My Systems and PA for maps when populated
      model.userSystems.subscribe(function (systems) {
        prepareDefaultSystems(systems);
      });
      model.premadeSystems.subscribe(function (systems) {
        prepareDefaultSystems(systems);
      });

      // Add My Systems and PA maps when tabs are ready
      var addedDefaultMultiSystems = false;
      var addedDefaultMultiStarts = false;
      model.cShareSystems_tabsIndex.subscribe(function (tabs) {
        if (
          addedDefaultMultiSystems === false ||
          addedDefaultMultiStarts === false
        ) {
          _.forEach(tabs, function (tab) {
            if (tab.name === mapTabOne && addedDefaultMultiSystems === false) {
              tab.systems(tab.systems().concat(defaultMultiplanetary));
              addedDefaultMultiSystems = true;
            }
            if (tab.name === mapTabTwo && addedDefaultMultiStarts === false) {
              tab.systems(tab.systems().concat(defaultMultiStart));
              addedDefaultMultiStarts = true;
            }
          });
        }
      });

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
            if (!mapFile.planets) {
              // This should never happen
              console.warn("No planets found in " + coherentFilePath);
              return;
            }

            processMapPacks(mapFile.planets, coherentFilePath);
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
