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
    const tabOne = loc("!LOC:Multiplanetary Systems");
    const tabTwo = loc("!LOC:Multiplanetary Spawns");
    const tabThree = loc("!LOC:Single Planet Systems");

    const tabOps = {
      load: function (mapsOne, mapsTwo, mapsThree) {
        cShareSystems.load_pas(tabOne, mapsOne);
        cShareSystems.load_pas(tabTwo, mapsTwo);
        cShareSystems.load_pas(tabThree, mapsThree);
      },
      add: function (mapsOne, mapsTwo, mapsThree) {
        cShareSystems.addTab(tabOne, mapsOne);
        cShareSystems.addTab(tabTwo, mapsTwo);
        cShareSystems.addTab(tabThree, mapsThree);
      },
    };

    const checkForMultiplePlanets = function (numberOfPlanets) {
      return numberOfPlanets > 1;
    };

    const checkForMultiplanetarySpawns = function (planets) {
      var startingPlanets = 0;
      for (var planet of planets) {
        if (planet.starting_planet) {
          startingPlanets++;
        }
        if (startingPlanets > 1) {
          return "multiStart";
        }
      }
      return "multiPlanet";
    };

    const processSystems = function (
      planets,
      multiPlanetMaps,
      multiSpawnMaps,
      singlePlanets,
      filePathOrSystem
    ) {
      const systemType = checkForMultiplePlanets(planets.length)
        ? checkForMultiplanetarySpawns(planets)
        : "singlePlanet";

      if (_.startsWith(systemType, "multi")) {
        multiPlanetMaps.push(filePathOrSystem);
        if (systemType === "multiStart") {
          multiSpawnMaps.push(filePathOrSystem);
        }
      } else {
        singlePlanets.push(filePathOrSystem);
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
            !addedDefaultMultiSystems ||
            !addedDefaultMultiStart ||
            !addedDefaultSingleSystem
          ) {
            _.forEach(tabs, function (tab) {
              if (tab.name === tabOne && !addedDefaultMultiSystems) {
                tab.systems(tab.systems().concat(defaultMultiplanetary));
                addedDefaultMultiSystems = true;
              } else if (tab.name === tabTwo && !addedDefaultMultiStart) {
                tab.systems(tab.systems().concat(defaultMultiStart));
                addedDefaultMultiStart = true;
              } else if (tab.name === tabThree && !addedDefaultSingleSystem) {
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
          if (mapPacksInstalled) {
            tabOps.load(multiplanetaryMaps, multiStartMaps, singlePlanetMaps);
            if (model.systemSources) {
              // Update Shared Systems for Galactic War's systems count
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
