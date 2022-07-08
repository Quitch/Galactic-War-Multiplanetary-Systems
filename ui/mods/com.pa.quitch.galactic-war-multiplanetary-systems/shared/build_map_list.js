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
        filePathOrSystem
      ) {
        if (numberOfPlanets > 1) {
          return filePathOrSystem;
        }
        return undefined;
      };

      var checkForMultiplanetarySpawns = function (planets, filePathOrSystem) {
        var startingPlanets = 0;
        for (var planet of planets) {
          if (planet.starting_planet === true) {
            startingPlanets += 1;
          }
          if (startingPlanets > 1) {
            return filePathOrSystem;
          }
        }
        return undefined;
      };

      var processSystems = function (
        planets,
        multiPlanetMaps,
        multiSpawnMaps,
        filePathOrSystem
      ) {
        var multiPlanetResult = checkForMultiplePlanets(
          planets.length,
          filePathOrSystem
        );
        var multiStartResult = checkForMultiplanetarySpawns(
          planets,
          filePathOrSystem
        );

        if (!_.isUndefined(multiPlanetResult)) {
          multiPlanetMaps.push(multiPlanetResult);
        }
        if (!_.isUndefined(multiStartResult)) {
          multiSpawnMaps.push(multiStartResult);
        }
      };

      var processDefaultSystems = function (
        systems,
        multiPlanetMaps,
        multiSpawnMaps
      ) {
        _.forEach(systems, function (system) {
          processSystems(
            system.planets,
            multiPlanetMaps,
            multiSpawnMaps,
            system
          );
        });
      };

      var defaultMultiplanetary = [];
      var defaultMultiStart = [];

      // Scan My Systems and PA for maps when populated and only
      // in the load_planet scene - this doesn't work in gw_start
      model.userSystems.subscribe(function (systems) {
        processDefaultSystems(
          systems,
          defaultMultiplanetary,
          defaultMultiStart
        );
      });
      model.premadeSystems.subscribe(function (systems) {
        processDefaultSystems(
          systems,
          defaultMultiplanetary,
          defaultMultiStart
        );
      });

      // Add My Systems and PA maps when tabs are ready and only
      // in the load_planet scene - this doesn't work in gw_start
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

            processSystems(
              mapFile.planets,
              multiplanetaryMaps,
              multiStartMaps,
              coherentFilePath
            );
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
