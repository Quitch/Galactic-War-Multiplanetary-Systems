var planetarySystemTabsLoaded;

function planetarySystemTabs() {
  if (planetarySystemTabsLoaded) {
    return;
  }

  if (typeof cShareSystems === "undefined") {
    return;
  }

  planetarySystemTabsLoaded = true;

  var MOD_NAME = "Single & Multiplanetary System Tab";

  var logError = function (e) {
    console.error(e);
    console.error(MOD_NAME + ": " + (e.stack || e.message || e));
  };

  // Everything below runs long after the try/catch has exited. jQuery abandons
  // the rest of a callback list when one entry throws, and Coherent's promise
  // turns a throw into a rejection nobody observes, so one bad system in one
  // file could otherwise strand the whole scan or every default system.
  var guard = function (fn) {
    return function () {
      try {
        return fn.apply(null, arguments);
      } catch (e) {
        logError(e);
      }
    };
  };

  try {
    var playablePlanets = function (system) {
      return system && _.isArray(system.planets) && system.planets.length > 0
        ? system.planets
        : null;
    };

    var hasMultipleSpawns = function (planets) {
      var spawns = 0;
      for (var planet of planets) {
        if (planet && planet.starting_planet) {
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
        return planets.length === 1;
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
          var planets = playablePlanets(system);
          if (!planets) {
            return;
          }
          _.forEach(matchingTabs(planets), function (tab) {
            tab[bucket].push(system);
          });
        });
      };

      var readPremadeSystems = guard(function (systems) {
        addDefaultSystems(systems, "premade");
      });

      var readUserSystems = guard(function () {
        addDefaultSystems(model.userSystems(), "user");
      });

      // The base game already holds the live system list in
      // model.premadeSystems. /main/shared/js/premade_systems.js, which this
      // used to require, is a 23 MB copy that nothing in the base game reads
      // and that is two systems out of date.
      if (!model.premadeSystems) {
        premadeSystemsRead.resolve();
      } else if (_.size(model.premadeSystems()) > 0) {
        readPremadeSystems(model.premadeSystems());
        premadeSystemsRead.resolve();
      } else {
        // ko.extenders.memory fills the observable asynchronously from
        // api.memory, so it is always still empty when scene mods run. One
        // notification is all it ever sends.
        var premadeSubscription = model.premadeSystems.subscribe(
          function (systems) {
            premadeSubscription.dispose();
            readPremadeSystems(systems);
            premadeSystemsRead.resolve();
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
          readUserSystems();
          userSystemsRead.resolve();
        });
      } else {
        userSystemsRead.resolve();
      }

      // Returns the number of tabs cShareSystems has not created yet.
      var addDefaultsToTabs = function () {
        var liveTabs = model.cShareSystems_tabsIndex();
        var waiting = 0;

        _.forEach(tabs, function (tab) {
          if (tab.defaultsAdded) {
            return;
          }
          var liveTab = _.find(liveTabs, { name: tab.name });
          if (!liveTab) {
            waiting++;
            return;
          }
          if (tab.premade.length > 0 || tab.user.length > 0) {
            // Premade before user, matching the base game's
            // premadeSystems().concat(userSystems()).
            liveTab.systems(liveTab.systems().concat(tab.premade, tab.user));
          }
          tab.defaultsAdded = true;
        });

        return waiting;
      };

      // Wait for both reads before touching anything, so neither can land after
      // the systems have been copied across. Tabs that already exist are filled
      // straight away and the subscription only exists to catch the ones
      // cShareSystems has yet to create - so it disposes itself once all three
      // are done, rather than living for the scene and re-running on every
      // addTab any other mod makes.
      $.when(premadeSystemsRead, userSystemsRead).done(
        guard(function () {
          if (addDefaultsToTabs() === 0) {
            return;
          }
          var tabsSubscription = model.cShareSystems_tabsIndex.subscribe(
            guard(function () {
              if (addDefaultsToTabs() === 0) {
                tabsSubscription.dispose();
              }
            })
          );
        })
      );
    }

    var deliverTabs = function () {
      var foundMapPackSystems = _.some(tabs, function (tab) {
        return tab.urls.length > 0;
      });

      if (foundMapPackSystems) {
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
    };

    // Every pas file in every active map pack.
    var scanMapPacks = guard(function (fileList) {
      if (!_.isArray(fileList)) {
        // api.file.list rejects with a string rather than throwing. Carry on
        // with nothing, so load_planet still gets its three tabs and the
        // premade and user systems that belong in them.
        console.warn(MOD_NAME + ": could not list /ui/mods/ - " + fileList);
        fileList = [];
      }

      var pasUrls = [];
      _.forEach(fileList, function (filePath) {
        // _.endsWith, not the native: PA polyfills String.prototype.endsWith
        // with a one-argument version, so the position argument is silently
        // dropped and the answer can be wrong rather than absent.
        if (_.endsWith(filePath, ".pas")) {
          // One slash - the listed path already starts with one.
          pasUrls.push("coui:/" + filePath);
        }
      });

      var matches = new Array(pasUrls.length);
      var pending = pasUrls.length;

      var readSystem = guard(function (index, system) {
        var planets = playablePlanets(system);
        if (!planets) {
          console.warn(MOD_NAME + ": no planets in " + pasUrls[index]);
          return;
        }
        matches[index] = matchingTabs(planets);
      });

      var finishScan = guard(function () {
        // Fill the tabs in a second pass so each keeps the file listing's
        // order, however the fetches interleaved.
        _.forEach(pasUrls, function (url, index) {
          _.forEach(matches[index], function (tab) {
            tab.urls.push(url);
          });
        });
        deliverTabs();
      });

      if (pending === 0) {
        finishScan();
        return;
      }

      _.forEach(pasUrls, function (url, index) {
        $.getJSON(url)
          .done(function (system) {
            readSystem(index, system);
          })
          .fail(function (jqXHR, textStatus) {
            console.warn(
              MOD_NAME + ": could not read " + url + " - " + textStatus
            );
          })
          .always(function () {
            pending--;
            if (pending === 0) {
              finishScan();
            }
          });
      });
    });

    // .always, because api.file.list returns a Coherent promise: no done/fail,
    // and its then() would swallow anything the handler threw.
    api.file.list("/ui/mods/", true).always(scanMapPacks);
  } catch (e) {
    logError(e);
  }
}
planetarySystemTabs();
