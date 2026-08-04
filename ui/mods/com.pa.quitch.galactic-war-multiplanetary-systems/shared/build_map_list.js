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

  // The ui tree keeps the release identifier even on develop.
  var SELF_URL =
    "coui://ui/mods/com.pa.quitch.galactic-war-multiplanetary-systems/shared/build_map_list.js";

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

    var deliverTabs = function () {
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
            console.warn(
              MOD_NAME + ": " + tab.name + " matched no map pack systems"
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
