var planetarySystemTabsLoaded;

function planetarySystemTabs() {
  if (planetarySystemTabsLoaded) {
    return;
  }

  planetarySystemTabsLoaded = true;

  try {
    if (typeof cShareSystems === "undefined") {
      return;
    }

    const multiplanetaryMaps = [];
    const multiStartMaps = [];
    const singlePlanetMaps = [];
    const mapTabOne = loc("!LOC:Multiplanetary Systems");
    const mapTabTwo = loc("!LOC:Multiplanetary Spawns");
    const mapTabThree = loc("!LOC:Single Planet Systems");

    const tabOps = {
      load: function (mapsOne, mapsTwo, mapsThree) {
        cShareSystems.load_pas(mapTabOne, mapsOne);
        cShareSystems.load_pas(mapTabTwo, mapsTwo);
        cShareSystems.load_pas(mapTabThree, mapsThree);
      },
      add: function (mapsOne, mapsTwo, mapsThree) {
        cShareSystems.addTab(mapTabOne, mapsOne);
        cShareSystems.addTab(mapTabTwo, mapsTwo);
        cShareSystems.addTab(mapTabThree, mapsThree);
      },
    };

    const checkForMultiplePlanets = function (numberOfPlanets) {
      return numberOfPlanets > 1;
    };

    const checkForMultiplanetarySpawns = function (planets, filePathOrSystem) {
      var startingPlanets = 0;
      for (const planet of planets) {
        if (planet.starting_planet === true) {
          startingPlanets++;
        }
        if (startingPlanets > 1) {
          return filePathOrSystem;
        }
      }
    };

    const processSystems = function (
      planets,
      multiPlanetMaps,
      multiSpawnMaps,
      singlePlanets,
      filePathOrSystem
    ) {
      var multiPlanetResult; // String or Object
      var singlePlanetResult; // String or Object

      if (checkForMultiplePlanets(planets.length) === true) {
        multiPlanetResult = filePathOrSystem;
      } else {
        singlePlanetResult = filePathOrSystem;
      }
      const multiStartResult = checkForMultiplanetarySpawns(
        planets,
        filePathOrSystem
      );

      if (!_.isUndefined(multiPlanetResult)) {
        multiPlanetMaps.push(multiPlanetResult);
      }
      if (!_.isUndefined(multiStartResult)) {
        multiSpawnMaps.push(multiStartResult);
      }
      if (!_.isUndefined(singlePlanetResult)) {
        singlePlanets.push(singlePlanetResult);
      }
    };

    const processDefaultSystems = function (
      systems,
      multiPlanetMaps,
      multiSpawnMaps,
      singlePlanets
    ) {
      _.forEach(systems, function (system) {
        processSystems(
          system.planets,
          multiPlanetMaps,
          multiSpawnMaps,
          singlePlanets,
          system
        );
      });
    };

    // Create an empty tab to load in time for Shared Systems for Galactic War
    tabOps.load(multiplanetaryMaps, multiStartMaps, singlePlanetMaps);

    require(["/main/shared/js/premade_systems.js"], function (premadeSystems) {
      // Protect against failure in gw_start
      if (model.cShareSystems_tabsIndex) {
        const defaultMultiplanetary = [];
        const defaultMultiStart = [];
        const defaultSingleSystem = [];

        const userSystems = ko
          .observableArray([])
          .extend({ db: { local_name: "systems", db_name: "misc" } });

        // Scan My Systems and PA for maps
        userSystems.subscribe(function (systems) {
          processDefaultSystems(
            systems,
            defaultMultiplanetary,
            defaultMultiStart,
            defaultSingleSystem
          );
        });
        processDefaultSystems(
          premadeSystems,
          defaultMultiplanetary,
          defaultMultiStart,
          defaultSingleSystem
        );

        // Add My Systems and PA maps when tabs are ready
        var addedDefaultMultiSystems = false;
        var addedDefaultMultiStart = false;
        var addedDefaultSingleSystem = false;
        model.cShareSystems_tabsIndex.subscribe(function (tabs) {
          if (
            addedDefaultMultiSystems === false ||
            addedDefaultMultiStart === false ||
            addedDefaultSingleSystem === false
          ) {
            _.forEach(tabs, function (tab) {
              if (
                tab.name === mapTabOne &&
                addedDefaultMultiSystems === false
              ) {
                tab.systems(tab.systems().concat(defaultMultiplanetary));
                addedDefaultMultiSystems = true;
              } else if (
                tab.name === mapTabTwo &&
                addedDefaultMultiStart === false
              ) {
                tab.systems(tab.systems().concat(defaultMultiStart));
                addedDefaultMultiStart = true;
              } else if (
                tab.name === mapTabThree &&
                addedDefaultSingleSystem === false
              ) {
                tab.systems(tab.systems().concat(defaultSingleSystem));
                addedDefaultSingleSystem = true;
              }
            });
          }
        });
      }

      // Process pas files from all active map packs
      api.file.list("/ui/mods/", true).then(function (fileList) {
        const deferredQueue = [];
        var mapPacksInstalled = false;

        _.forEach(fileList, function (filePath) {
          if (!_.endsWith(filePath, ".pas")) {
            return;
          }

          mapPacksInstalled = true;

          const deferred = $.Deferred();
          deferredQueue.push(deferred);

          const coherentFilePath = "coui:/" + filePath;

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
              singlePlanetMaps,
              coherentFilePath
            );
          }).always(function () {
            deferred.resolve();
          });
        });

        $.when.apply($, deferredQueue).then(function () {
          if (mapPacksInstalled === true) {
            tabOps.load(multiplanetaryMaps, multiStartMaps, singlePlanetMaps);
            // Update Shared Systems for Galactic War's systems count
            if (model.systemSources) {
              model.systemSources.valueHasMutated();
            }
          } else {
            tabOps.add(multiplanetaryMaps, multiStartMaps, singlePlanetMaps);
          }
        });
      });
    });
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
planetarySystemTabs();
