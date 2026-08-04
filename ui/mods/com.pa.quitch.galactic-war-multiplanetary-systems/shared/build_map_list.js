var planetarySystemTabsLoaded;

function planetarySystemTabs() {
  if (planetarySystemTabsLoaded) {
    return;
  }

  if (typeof cShareSystems === "undefined") {
    return;
  }

  planetarySystemTabsLoaded = true;

  try {
    var multiplanetaryMaps = [];
    var multiStartMaps = [];
    var singlePlanetMaps = [];
    var tabOne = loc("!LOC:Multiplanetary Systems");
    var tabTwo = loc("!LOC:Multiplanetary Spawns");
    var tabThree = loc("!LOC:Single Planet Systems");

    var tabOps = {
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

    var checkForMultiplePlanets = function (numberOfPlanets) {
      return numberOfPlanets > 1;
    };

    var checkForMultiplanetarySpawns = function (planets) {
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

    var processSystems = function (
      planets,
      multiPlanetMaps,
      multiSpawnMaps,
      singlePlanets,
      filePathOrSystem
    ) {
      var systemType = checkForMultiplePlanets(planets.length)
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

    var processDefaultSystems = function (
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

    // model.cShareSystems_tabsIndex only exists in load_planet, where
    // cShareSystems builds the tab UI. gw_start has no tab index, no premade
    // systems and no user systems, so this whole branch is skipped there.
    if (model.cShareSystems_tabsIndex) {
      var defaultMultiplanetary = [];
      var defaultMultiStart = [];
      var defaultSingleSystem = [];

      // Neither read can be allowed to reject: $.when settles as soon as one of
      // its inputs fails, so a failed My Systems read would otherwise fire the
      // gate below while the PA systems were still arriving.
      var premadeSystemsRead = $.Deferred();
      var userSystemsRead = $.Deferred();

      var readPremadeSystems = function (systems) {
        processDefaultSystems(
          systems,
          defaultMultiplanetary,
          defaultMultiStart,
          defaultSingleSystem
        );
        premadeSystemsRead.resolve();
      };

      // The base game already holds the live system list in
      // model.premadeSystems. /main/shared/js/premade_systems.js, which this
      // used to require, is a 23 MB copy that nothing in the base game reads
      // and that is two systems out of date.
      if (!model.premadeSystems) {
        premadeSystemsRead.resolve();
      } else if (_.size(model.premadeSystems()) > 0) {
        readPremadeSystems(model.premadeSystems());
      } else {
        // ko.extenders.memory fills the observable asynchronously from
        // api.memory, so it is always still empty when scene mods run. One
        // notification is all it ever sends.
        var premadeSubscription = model.premadeSystems.subscribe(
          function (systems) {
            premadeSubscription.dispose();
            readPremadeSystems(systems);
          }
        );
      }

      // Reuse the base game's observable rather than extending our own with the
      // same db options. A second binding over local_name "systems" re-reads
      // IndexedDB for no reason, attaches a second write-back subscription to
      // the user's real My Systems row, and - when localStorage["systems"] is
      // absent or not a UUID, as on a fresh profile - takes the extender's
      // addObject branch, minting a rival row and overwriting that key while
      // the base game's own instance is doing the same. Last writer wins and
      // the user's saved systems can end up orphaned.
      if (model.userSystems && model.userSystems.ready) {
        // .always, not .then: the db extender rejects with no arguments when it
        // cannot create the row, and a failed My Systems read must still let the
        // PA systems through.
        model.userSystems.ready.always(function () {
          processDefaultSystems(
            model.userSystems(),
            defaultMultiplanetary,
            defaultMultiStart,
            defaultSingleSystem
          );
          userSystemsRead.resolve();
        });
      } else {
        userSystemsRead.resolve();
      }

      var addedDefaultMultiSystems = false;
      var addedDefaultMultiStart = false;
      var addedDefaultSingleSystem = false;
      model.cShareSystems_tabsIndex.subscribe(function (tabs) {
        // Wait on both reads so neither can land after we've copied the arrays
        // into the tabs.
        $.when(premadeSystemsRead, userSystemsRead).always(function () {
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
      });
    }

    // Process pas files from all active map packs
    api.file.list("/ui/mods/", true).then(function (fileList) {
      var deferredQueue = [];
      var mapPacksInstalled = false;

      _.forEach(fileList, function (filePath) {
        if (!_.endsWith(filePath, ".pas")) {
          return;
        }

        mapPacksInstalled = true;

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
        } else if (_.isFunction(cShareSystems.addTab)) {
          tabOps.add(multiplanetaryMaps, multiStartMaps, singlePlanetMaps);
        }
      });
    });
  } catch (e) {
    console.error(e);
    console.error(
      "Single & Multiplanetary System Tab: " + (e.stack || e.message || e)
    );
  }
}
planetarySystemTabs();
