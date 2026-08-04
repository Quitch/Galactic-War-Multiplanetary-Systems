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

  // jQuery abandons the rest of a callback list when an entry throws, and
  // Coherent turns a throw into a rejection nobody observes.
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
        // Both payloads: load_pas takes URLs, addTab takes parsed systems.
        urls: [],
        systems: [],
        // Kept apart so they concatenate in a fixed order however they arrive.
        premade: [],
        user: [],
        defaultsAdded: false,
      };
    };

    // Independent predicates, so a system with more than one starting planet
    // lands in both of the first two tabs.
    var tabs = [
      makeTab(loc("!LOC:Multiplanetary Systems"), function (planets) {
        return planets.length > 1;
      }),
      // More than one spawn implies more than one planet.
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

    // Shared by both scenes: load_planet fills premade and user, gw_start
    // fills premade from default_systems.json. The two branches are mutually
    // exclusive, so reusing the one bucket is safe.
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

    // Scene discriminator: only cShareSystems defines addTab, and it registers
    // for load_planet alone. Its priority 99 against this mod's 100 is what
    // makes reading it this early safe.
    var canAddTabs = _.isFunction(cShareSystems.addTab);

    // Shared Systems for Galactic War builds its Systems list once, from
    // whatever is registered by the time this script returns, and holds the
    // array by reference - so this stays synchronous and later fills must use
    // these exact objects. A no-op in load_planet, where load_pas walks the
    // array immediately.
    _.forEach(tabs, function (tab) {
      cShareSystems.load_pas(tab.name, tab.urls);
    });

    // Only load_planet has the tab index, the premade systems and the user
    // systems; gw_start has none of them.
    if (model.cShareSystems_tabsIndex) {
      // Must not reject: $.when settles the moment one input does.
      var premadeSystemsRead = $.Deferred();
      var userSystemsRead = $.Deferred();

      var readPremadeSystems = guard(function (systems) {
        addDefaultSystems(systems, "premade");
      });

      var readUserSystems = guard(function () {
        addDefaultSystems(model.userSystems(), "user");
      });

      // premade_systems.js, which this used to require, is a 23 MB copy of the
      // same list that nothing in the base game reads and that is two systems
      // out of date.
      if (!model.premadeSystems) {
        premadeSystemsRead.resolve();
      } else if (_.size(model.premadeSystems()) > 0) {
        readPremadeSystems(model.premadeSystems());
        premadeSystemsRead.resolve();
      } else {
        // ko.extenders.memory fills this asynchronously, so it is always still
        // empty when scene mods run.
        var premadeSubscription = model.premadeSystems.subscribe(
          function (systems) {
            premadeSubscription.dispose();
            readPremadeSystems(systems);
            premadeSystemsRead.resolve();
          }
        );
      }

      // Never extend a second observable with the same db options: that is a
      // live second binding on the user's real My Systems row, and on a fresh
      // profile it mints a rival row and overwrites localStorage["systems"].
      if (model.userSystems && model.userSystems.ready) {
        // .always: the db extender rejects with no arguments when it cannot
        // create the row, which must not hold back the PA systems.
        model.userSystems.ready.always(function () {
          readUserSystems();
          userSystemsRead.resolve();
        });
      } else {
        userSystemsRead.resolve();
      }

      // True once every tab has been given its default systems.
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
            // Premade before user, as the base game orders them.
            liveTab.systems(liveTab.systems().concat(tab.premade, tab.user));
          }
          tab.defaultsAdded = true;
        });

        return waiting === 0;
      };

      // Copy only once both reads have landed. Tabs that already exist are
      // filled now; the subscription is only for the ones cShareSystems has yet
      // to create, so it disposes as soon as the last one is done.
      $.when(premadeSystemsRead, userSystemsRead).done(
        guard(function () {
          if (addDefaultsToTabs()) {
            return;
          }
          var tabsSubscription = model.cShareSystems_tabsIndex.subscribe(
            guard(function () {
              if (addDefaultsToTabs()) {
                tabsSubscription.dispose();
              }
            })
          );
        })
      );
    }

    // gw_start's mirror of the branch above. Shared Systems for Galactic War
    // is the only implementation of cShareSystems without addTab, so
    // canAddTabs identifies the mod as well as the scene.
    if (
      !canAddTabs &&
      typeof requireGW === "function" &&
      typeof UberUtility !== "undefined" &&
      model.systemSources
    ) {
      var DEFAULT_SYSTEMS_KEY = "default_systems";
      var DEFAULT_SYSTEMS_URL = "coui://ui/main/shared/default_systems.json";
      var READ_TIMEOUT_MS = 30000;

      var galacticWarDefaultsRead = $.Deferred();

      // Shared Systems for Galactic War waits on every selected source
      // together, so anything left pending disables Go To War.
      var settleWithin = function (deferred, settle) {
        setTimeout(function () {
          if (deferred.state() === "pending") {
            settle();
          }
        }, READ_TIMEOUT_MS);
        return deferred;
      };

      // Not the array form: it defers through require.js's nextTick, a
      // setTimeout(fn, 4), by which point Shared Systems for Galactic War can
      // have built its options and started loading them.
      var gwModule = function (id) {
        try {
          return requireGW(id);
        } catch (e) {
          return null;
        }
      };

      // Shared Systems for Galactic War's own progress format, tooltipped
      // "Downloaded/Total (Number of Multiplanet)".
      var countMultiplanetary = function (systems) {
        return (
          " (" +
          _.filter(systems, function (system) {
            var planets = playablePlanets(system);
            return planets && planets.length > 1;
          }).length +
          ")"
        );
      };

      // loadPack fixes up only what it fetched itself. Without this
      // planet.generator is undefined, and withoutBrokenSystems dereferences
      // it unguarded.
      var addSurfaceArea = function (system) {
        UberUtility.fixupPlanetConfig(system);
        system.surface_area = 0;
        _.forEach(system.planets, function (planet) {
          if (planet.generator && planet.generator.biome !== "gas") {
            system.surface_area +=
              4 * Math.PI * Math.pow(planet.generator.radius, 2) * 0.000001;
          }
        });
      };

      // Identifies one system across independently parsed copies - the same
      // .pas fetched by two tabs, or a PA system reached through both a tab
      // and Uber. surface_area agrees because every fix-up shares a formula.
      var systemKey = function (system) {
        var planets = playablePlanets(system);
        if (!planets) {
          return null;
        }
        var generator = planets[0].generator || {};
        return [
          system.name,
          planets.length,
          generator.seed,
          system.surface_area,
        ].join("|");
      };

      var readDefaultSystems = guard(function (systems) {
        if (!_.isArray(systems) || systems.length === 0) {
          return false;
        }
        _.forEach(systems, addSurfaceArea);
        addDefaultSystems(systems, "premade");
        return true;
      });

      var readGalacticWarDefaults = function () {
        settleWithin(galacticWarDefaultsRead, function () {
          console.warn(MOD_NAME + ": timed out reading " + DEFAULT_SYSTEMS_KEY);
          galacticWarDefaultsRead.resolve();
        });

        var readFromFile = function () {
          $.getJSON(DEFAULT_SYSTEMS_URL)
            .done(function (systems) {
              if (!readDefaultSystems(systems)) {
                console.warn(
                  MOD_NAME + ": no systems in " + DEFAULT_SYSTEMS_URL
                );
              }
            })
            .fail(function (jqXHR, textStatus) {
              console.warn(
                MOD_NAME +
                  ": could not read " +
                  DEFAULT_SYSTEMS_URL +
                  " - " +
                  textStatus
              );
            })
            .always(function () {
              galacticWarDefaultsRead.resolve();
            });
        };

        // .always plus an _.isArray guard, as with api.file.list: api.memory
        // returns a Coherent promise, with no done/fail and a then() that
        // swallows throws. main.js fills it asynchronously, so it can still be
        // empty here; the file fallback costs three times the transfer.
        api.memory.load(DEFAULT_SYSTEMS_KEY).always(
          guard(function (systems) {
            if (readDefaultSystems(systems)) {
              galacticWarDefaultsRead.resolve();
              return;
            }
            readFromFile();
          })
        );
      };

      // $.when settles the moment one input rejects, and another source
      // failing must not take this tab with it.
      var neverRejects = function (promise) {
        var settled = $.Deferred();
        var finish = function (systems) {
          settled.resolve(_.isArray(systems) ? systems : []);
        };

        promise.then(finish, function () {
          finish();
        });

        return settleWithin(settled, finish);
      };

      // Every loader Shared Systems for Galactic War builds is memoised, so
      // this attaches to the promise it is already waiting on rather than
      // fetching or parsing anything a second time.
      var systemsFromOtherSources = function (tab) {
        var precedence = _.indexOf(tabs, tab);
        var reads = [];

        _.forEach(model.systemSources(), function (source) {
          if (
            !source ||
            !_.isFunction(source.load) ||
            !_.isFunction(source.selected) ||
            !source.selected()
          ) {
            return;
          }

          // These tabs overlap each other by design - a multi-spawn system is
          // in two of them - so tab order decides which supplies it, and no
          // tab waits on one that is waiting on it.
          var ownTab = _.find(tabs, { name: source.name });
          if (ownTab && _.indexOf(tabs, ownTab) >= precedence) {
            return;
          }

          var read = null;
          try {
            read = source.load();
          } catch (e) {
            logError(e);
          }
          if (read && _.isFunction(read.then)) {
            reads.push(neverRejects(read));
          }
        });

        return reads;
      };

      // Its own try/catch, not guard(): guard returns undefined, and a
      // doneFilter returning undefined resolves with [undefined], which
      // _.flatten drops into the pool for withoutBrokenSystems to die on.
      var mergeGalacticWarDefaults = function (
        tab,
        packSystems,
        otherSystems,
        progress
      ) {
        try {
          var systems = _.isArray(packSystems) ? packSystems : [];
          var defaults = tab.premade;

          if (otherSystems.length > 0) {
            var supplied = new Set();
            _.forEach(otherSystems, function (system) {
              var key = systemKey(system);
              if (key) {
                supplied.add(key);
              }
            });
            var notSuppliedElsewhere = function (system) {
              var key = systemKey(system);
              return !key || !supplied.has(key);
            };
            systems = _.filter(systems, notSuppliedElsewhere);
            defaults = _.filter(defaults, notSuppliedElsewhere);
          }

          // concat, not push: loadPack memoises its promise and returns the
          // same array to every rebuild.
          var merged = systems.concat(defaults);
          if (_.isFunction(progress)) {
            progress(
              merged.length + "/" + merged.length + countMultiplanetary(merged)
            );
          }
          return merged;
        } catch (e) {
          logError(e);
          return packSystems;
        }
      };

      // Hooks loadPack rather than the option's load: the option looks loadPack
      // up on this module at call time, and no option exists until
      // mapPackList() resolves, which is after every injected script has run.
      var patchMapPackLoader = function (mapPacks) {
        var loadPack = mapPacks.loadPack;

        mapPacks.loadPack = function (tabName, progress) {
          var packSystems = loadPack(tabName, progress);
          var tab = _.find(tabs, { name: tabName });
          if (!tab) {
            return packSystems;
          }

          var otherSources = systemsFromOtherSources(tab);
          var waitingOn = [packSystems, galacticWarDefaultsRead].concat(
            otherSources
          );

          return $.when.apply($, waitingOn).then(function (systems) {
            // $.when resolves one argument per input, in order, so the other
            // sources are the trailing ones.
            var otherSystems = _.flatten(
              _.takeRight(_.toArray(arguments), otherSources.length)
            );
            return mergeGalacticWarDefaults(
              tab,
              systems,
              otherSystems,
              progress
            );
          });
        };
      };

      var mapPacksModule = gwModule("/mods/gw_shared_systems/map_packs.js");
      if (mapPacksModule && _.isFunction(mapPacksModule.loadPack)) {
        // Started first, so the read overlaps the .pas scan.
        readGalacticWarDefaults();
        patchMapPackLoader(mapPacksModule);
      } else {
        console.warn(
          MOD_NAME +
            ": could not reach Shared Systems for Galactic War's map packs"
        );
      }
    }

    var deliverTabs = function () {
      // This file. The ui tree keeps the release identifier even on develop.
      var SELF_URL =
        "coui://ui/mods/com.pa.quitch.galactic-war-multiplanetary-systems/shared/build_map_list.js";

      var foundMapPackSystems = _.some(tabs, function (tab) {
        return tab.urls.length > 0;
      });

      _.forEach(tabs, function (tab) {
        if (canAddTabs) {
          // The files are parsed already, so skip load_pas re-fetching every
          // one. An empty array still creates the tab; load_pas would not.
          cShareSystems.addTab(tab.name, tab.systems);
        } else {
          if (tab.urls.length === 0) {
            // Shared Systems for Galactic War re-checks an empty pack every
            // second forever, and waits on all selected sources together, so an
            // unmatched tab would hang Go To War. This file always fetches and
            // is not JSON, so the pack settles as an empty source instead.
            // Load-bearing twice over now: the merged promise derives from
            // loadPack's, so a pack that never settles takes the default
            // systems down with it.
            console.warn(
              MOD_NAME +
                ": " +
                tab.name +
                " matched no map pack systems, padding it so the pack settles"
            );
            tab.urls.push(SELF_URL);
          }
          // Already held by reference, so filling it was the delivery; this
          // only keeps other implementations of load_pas working.
          cShareSystems.load_pas(tab.name, tab.urls);
        }
      });

      // Makes Shared Systems for Galactic War recount, at the cost of a full
      // galaxy rebuild.
      if (foundMapPackSystems && model.systemSources) {
        model.systemSources.valueHasMutated();
      }
    };

    var scanMapPacks = guard(function (fileList) {
      if (!_.isArray(fileList)) {
        // api.file.list rejects with a string. Carry on, so load_planet still
        // gets its tabs and their default systems.
        console.warn(MOD_NAME + ": could not list /ui/mods/ - " + fileList);
        fileList = [];
      }

      var pasUrls = [];
      _.forEach(fileList, function (filePath) {
        // _.endsWith: PA's polyfill for the native takes one argument, silently
        // dropping the position.
        if (_.endsWith(filePath, ".pas")) {
          // One slash - the listed path already starts with one.
          pasUrls.push("coui:/" + filePath);
        }
      });

      var tabsPerFile = new Array(pasUrls.length);
      // Only worth keeping the parsed systems where addTab can take them.
      var systemPerFile = canAddTabs ? new Array(pasUrls.length) : null;
      var pending = pasUrls.length;

      var readSystem = guard(function (index, system) {
        var planets = playablePlanets(system);
        if (!planets) {
          console.warn(MOD_NAME + ": no planets in " + pasUrls[index]);
          return;
        }
        tabsPerFile[index] = matchingTabs(planets);
        if (systemPerFile) {
          systemPerFile[index] = system;
        }
      });

      var finishScan = guard(function () {
        // Second pass, so each tab keeps the listing order however the fetches
        // interleaved - the order load_pas used to restore by sorting.
        _.forEach(pasUrls, function (url, index) {
          _.forEach(tabsPerFile[index], function (tab) {
            tab.urls.push(url);
            if (systemPerFile) {
              tab.systems.push(systemPerFile[index]);
            }
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

    // .always: api.file.list returns a Coherent promise, which has no done/fail
    // and whose then() swallows a throw.
    api.file.list("/ui/mods/", true).always(scanMapPacks);
  } catch (e) {
    logError(e);
  }
}
planetarySystemTabs();
