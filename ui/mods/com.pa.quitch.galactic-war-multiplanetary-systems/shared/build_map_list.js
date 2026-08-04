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
    var hasMultipleSpawns = function (planets) {
      var spawns = 0;
      for (var planet of planets) {
        if (planet.starting_planet) {
          spawns++;
          if (spawns > 1) {
            return true;
          }
        }
      }
      return false;
    };

    var makeTab = function (name, matches) {
      return {
        name: name,
        matches: matches,
        // Map pack file URLs, for cShareSystems.load_pas.
        urls: [],
        // Premade and user system objects, kept apart so they can be
        // concatenated into the live tab in a fixed order however they arrive.
        premade: [],
        user: [],
        defaultsAdded: false,
      };
    };

    // Each tab tests the planets independently rather than sharing one verdict,
    // because a system with more than one starting planet belongs in both of
    // the first two tabs.
    var tabs = [
      makeTab(loc("!LOC:Multiplanetary Systems"), function (planets) {
        return planets.length > 1;
      }),
      // More than one spawn implies more than one planet, so no length test.
      makeTab(loc("!LOC:Multiplanetary Spawns"), hasMultipleSpawns),
      makeTab(loc("!LOC:Single Planet Systems"), function (planets) {
        return planets.length < 2;
      }),
    ];

    var matchingTabs = function (planets) {
      return _.filter(tabs, function (tab) {
        return tab.matches(planets);
      });
    };

    // Register the three names before anything else. Shared Systems for
    // Galactic War records the array we hand over by reference and re-reads its
    // length on a one-second timer, and it builds its Systems checkbox list
    // once, from whatever is registered by the time this script returns - so
    // this has to be synchronous, and the arrays filled in later have to be
    // these exact objects. In load_planet it is a no-op: stock cShareSystems
    // walks the array immediately, so an empty one creates nothing.
    _.forEach(tabs, function (tab) {
      cShareSystems.load_pas(tab.name, tab.urls);
    });

    // model.cShareSystems_tabsIndex only exists in load_planet, where
    // cShareSystems builds the tab UI. gw_start has no tab index, no premade
    // systems and no user systems, so this whole branch is skipped there.
    if (model.cShareSystems_tabsIndex) {
      // Neither read can be allowed to reject: $.when settles as soon as one of
      // its inputs fails, so a failed My Systems read would otherwise fire the
      // gate below while the PA systems were still arriving.
      var premadeSystemsRead = $.Deferred();
      var userSystemsRead = $.Deferred();

      var addDefaultSystems = function (systems, bucket) {
        _.forEach(systems, function (system) {
          _.forEach(matchingTabs(system.planets), function (tab) {
            tab[bucket].push(system);
          });
        });
      };

      var readPremadeSystems = function (systems) {
        addDefaultSystems(systems, "premade");
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
          addDefaultSystems(model.userSystems(), "user");
          userSystemsRead.resolve();
        });
      } else {
        userSystemsRead.resolve();
      }

      model.cShareSystems_tabsIndex.subscribe(function (liveTabs) {
        // Wait on both reads so neither can land after we've copied the systems
        // into the tabs.
        $.when(premadeSystemsRead, userSystemsRead).always(function () {
          _.forEach(tabs, function (tab) {
            if (tab.defaultsAdded) {
              return;
            }
            var liveTab = _.find(liveTabs, { name: tab.name });
            if (!liveTab) {
              return;
            }
            // Premade before user, matching the base game's
            // premadeSystems().concat(userSystems()).
            liveTab.systems(liveTab.systems().concat(tab.premade, tab.user));
            tab.defaultsAdded = true;
          });
        });
      });
    }

    // Process pas files from all active map packs
    api.file.list("/ui/mods/", true).then(function (fileList) {
      var deferredQueue = [];
      var mapPacksInstalled = false;

      _.forEach(fileList, function (filePath) {
        // _.endsWith, not the native: PA polyfills String.prototype.endsWith
        // with a one-argument version, so the position argument is silently
        // dropped and the answer can be wrong rather than absent.
        if (!_.endsWith(filePath, ".pas")) {
          return;
        }

        mapPacksInstalled = true;

        var deferred = $.Deferred();
        deferredQueue.push(deferred);

        // One slash - the listed path already starts with one.
        var coherentFilePath = "coui:/" + filePath;

        $.getJSON(coherentFilePath, function (mapFile) {
          if (!mapFile.planets) {
            console.warn("No planets found in " + coherentFilePath);
            return;
          }

          _.forEach(matchingTabs(mapFile.planets), function (tab) {
            tab.urls.push(coherentFilePath);
          });
        }).always(function () {
          deferred.resolve();
        });
      });

      $.when.apply($, deferredQueue).then(function () {
        if (mapPacksInstalled) {
          _.forEach(tabs, function (tab) {
            cShareSystems.load_pas(tab.name, tab.urls);
          });
          if (model.systemSources) {
            // Update Shared Systems for Galactic War's systems count
            model.systemSources.valueHasMutated();
          }
        } else if (_.isFunction(cShareSystems.addTab)) {
          // load_pas with an empty array creates no tab at all, so the premade
          // and user systems would have nowhere to land.
          _.forEach(tabs, function (tab) {
            cShareSystems.addTab(tab.name, tab.urls);
          });
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
