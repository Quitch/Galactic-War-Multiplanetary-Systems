# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **client mod** for Planetary Annihilation and Planetary Annihilation: TITANS that adds three tabs to the system-selection list: _Multiplanetary Systems_, _Multiplanetary Spawns_ (more than one starting planet) and _Single Planet Systems_. It ships **no maps of its own** — it classifies systems that the base game and whatever map packs you already have installed provide, and it does that by reading them at runtime rather than from a baked list.

The entire mod is one shipped file — [build_map_list.js](ui/mods/com.pa.quitch.galactic-war-multiplanetary-systems/shared/build_map_list.js) — plus [modinfo.json](modinfo.json). There is no build step, no bundler and no CI; the game loads the JS directly at launch.

**One file is a constraint, not an accident — don't split it.** Shared Systems for Galactic War delivers this mod into `gw_start` by fetching each script in `scene_mod_list.load_planet` as text and injecting it as an inline `<script>` (see below). Three properties of that loop rule out a second file: only sources matching its `load_pas` regex are injected at all, so a helper file would simply never arrive; the fetches are issued in parallel and each injects in its own completion callback, so **injection order is nondeterministic**; and each part lands in its own `<script>` element, so declarations do not hoist between them. Surviving all three needs a namespace object plus a "run once every part has registered" latch in every file — about 30 lines of scaffolding to buy nothing. `load_planet` alone would be fine, because `loadMods` loads in listed order and synchronously; `gw_start` is what forbids it.

The checkout lives in the PA user data directory (`client_mods/Galactic-War-Multiplanetary-Systems`). The game install is a separate workspace folder with its own `CLAUDE.md` covering base-game layout, file shadowing and the Coherent UI engine — read that before looking anything up under `ui/main/`. Never edit anything there.

Two naming quirks, both deliberate, neither to be "fixed":

- The repo, the folder and the `coui://` identifier still say **galactic-war-multiplanetary-systems**; the mod was renamed to **Single & Multiplanetary System Tabs** in v2.0.0 and only the display name changed. Renaming the identifier would orphan every existing install.
- `modinfo.json` on `develop` declares identifier `…-dev` and display name `… DEV` so the working copy can be installed alongside the Workshop release, but the `ui/` tree and every `coui://` path inside it use the plain release identifier.

## Commands

```sh
npm ci                  # install pinned tooling (once, or after deps change)
npm run lint:js         # eslint .
npm run format:check    # prettier --check .
npm run format:write    # prettier --write .
npm run verify          # lint:js + format:check
```

There is no CI and no test suite, so `verify` is the whole automated gate.

Both are clean as of `ebdf10b`, so any error you see is yours. Note that the shipped file was written with `const` (`5b29b03`, "Implement use of const") and deliberately reverted to `var` in `af9475d` — Chrome 40's block scoping does not create the per-iteration binding ES2015 specifies, so a `const` in a loop head misbehaves. `es-x/no-block-scoped-variables` enforces this; don't "modernise" it back.

Verification of behaviour is in-game only: enable the mod (plus at least one map pack), open skirmish system selection, and check the three tabs. For the Galactic War path you also need Shared Systems for Galactic War installed and a new war started.

## The Chrome 40 constraint

The game's Coherent UI runs Chromium 40. `var` only — **no `const`/`let`**, no arrow functions, no template literals, no `class`, no `Object.assign`/`Array.from`, no native `String.prototype.startsWith`/`endsWith`. `for…of`, `Promise`, `Set` and `Map` do work. `_` (lodash), `$`, `ko`, `model`, `api` and `loc` are globals, as is `cShareSystems` once the dependency has loaded.

[eslint.config.mjs](eslint.config.mjs) is the authoritative answer to "may I use X?" — `es-x/restrict-to-es5` bans everything post-ES5 and the whitelist block re-enables only what Chrome 40 actually shipped, each entry annotated with the Chrome version. Read the comments there before adding an exception. Note the existing code uses `_.startsWith`/`_.endsWith` rather than the native methods; that is required, because PA's own polyfill for those takes only one argument and silently drops the position argument.

## Architecture

### One file, two scenes, up to two executions

`modinfo.json` registers the same script under two scenes: `load_planet` (skirmish system selection) and `gw_start` (the Galactic War setup screen). On top of those two registrations there is a third delivery route — Shared Systems for Galactic War fetches every script in `scene_mod_list.load_planet` as text and, if the source matches `/cShareSystems.load_pas\s*\(/`, injects it into the `gw_start` document as a `<script>` element. So in a GW lobby with that mod installed the file arrives twice in the one scene: once from this mod's own `gw_start` registration, once from the injection. Two consequences:

1. The `planetarySystemTabsLoaded` global guard at the top of the file is load-bearing — without it the tabs get built twice in a GW lobby. (This is what CHANGELOG v1.0.3's duplicated Omega Belt was.)
2. The literal text `cShareSystems.load_pas(` must survive any refactor. Aliasing the call or switching to `cShareSystems["load_pas"]` would stop Shared Systems for Galactic War recognising this mod at all.

**The guard is claimed _after_ the `typeof cShareSystems === "undefined"` bail, and that order is itself load-bearing.** In `gw_start` the mod's own registration always runs first and always bails: `loadMods` → `loadScript` uses a synchronous `XMLHttpRequest`, so every scene script has finished before control returns, whereas `cShareSystems` there is created by `gw_shared_systems/map_packs.js`, an AMD module (`define([], …)`) that RequireJS only resolves afterwards. Pass one therefore never does anything, and the injected pass two is the only one that can. Claim the guard above the bail and Galactic War goes dark, silently — that was shipped once and fixed in `c652f01`.

Pass one being a guaranteed no-op is not a reason to drop the `scenes.gw_start` registration. It costs one `typeof` and one synchronous fetch, and it is the only fallback should anything ever provide `cShareSystems` in that scene by another route.

### Dependencies and load order

- `com.pa.conundrum.cShareSystems` — **System Sharing for Titans & Classic**, the one declared dependency. It creates the `cShareSystems` global, `model.cShareSystems_tabsIndex` and the tab UI itself. It registers via the legacy top-level `load_planet` key rather than `scenes`, and ships `"priority": 99` against this mod's `100`. Client mods sort **ascending** by priority (`_.sortBy(mods, 'priority')` in the game's `community-mods-manager.js`), so 99 loads before 100 and the global exists by the time this file runs. Don't lower this mod's priority — that ordering is also what makes it safe to read `cShareSystems.addTab` once, up front, as the scene discriminator. The `typeof cShareSystems === "undefined"` bail-out at the top of [build_map_list.js](ui/mods/com.pa.quitch.galactic-war-multiplanetary-systems/shared/build_map_list.js) is the belt-and-braces for when it isn't installed at all.
- `com.wondible.pa.gw_shared_systems` — **Shared Systems for Galactic War**. Dropped as a hard dependency in v2.3.0, but the code still cooperates with it closely (see below). It is optional; everything must degrade gracefully without it.

### Classification

The three tabs are one array of descriptors built by `makeTab`, each holding its own name, its `matches(planets)` predicate and the buckets it collects into. Everything — registration, classification, delivery — iterates that array, so a tab is added or changed in one place.

The predicates are deliberately **independent** rather than one dispatch returning a single verdict: more than one planet → multiplanetary; more than one `starting_planet` → multiplanetary spawns; exactly one planet → single planet. A multi-start system matches the first two and appears in **both**, which is intended. `hasMultipleSpawns` short-circuits on the second starting planet, so it never counts past two, and it implies "more than one planet" on its own, which is why tab two has no length test.

`playablePlanets` is the gate in front of all of it: a system with no `planets` array, or an empty one, matches nothing. Zero-planet systems used to count as single-planet, and selecting one made the base game dereference `planets[0].planet` in its detail pane.

### Two system sources, two payload shapes

Classification is fed from two places, and they hand over different things:

1. **Premade and user systems** — `model.premadeSystems` and `model.userSystems`, both already loaded by the base game's `load_planet.js`. These are **system objects**. The whole branch is wrapped in `if (model.cShareSystems_tabsIndex)`, which is only true in `load_planet`; `gw_start` reaches the same systems by a different route, below.
   - `model.premadeSystems` goes through `ko.extenders.memory`, which fills it asynchronously from `api.memory`, so it is **always still empty when scene mods run** and the read waits on a one-shot `subscribe`. Don't be tempted back to `require(["/main/shared/js/premade_systems.js"])`: that file is a 23 MB AMD copy of `default_systems.json` that nothing in the base game reads, and it used to gate the entire mod, Galactic War included, behind its own load. Its 157 entries are **deep-equal** to their `default_systems.json` counterparts — it is short, not stale — and the two it lacks are `Outreach` and `Skaro`, both single-planet.
   - `model.userSystems` is read through its `.ready` deferred, with `.always` rather than `.then` because `ko.extenders.db` rejects with no arguments when it cannot create the row. **Never extend a second observable with the same `db` options.** That is a live second binding on the user's real My Systems row: a redundant IndexedDB read, a second write-back subscription, and — when `localStorage["systems"]` is missing or not a UUID, as on a fresh profile — the extender's `addObject` branch mints a rival row and overwrites that key while the base game's instance is doing the same.
2. **Map-pack `.pas` files** — `api.file.list("/ui/mods/", true)` walks every installed mod recursively, `.pas` entries are fetched with `$.getJSON` at `"coui:/" + filePath` (single slash; the listed path already starts with `/`). Each tab keeps both the **URLs** and the **parsed systems**; which one is used is a scene decision, below. Note `api.file.list` returns a **Coherent** promise, not a jQuery one: no `done`/`fail`/`catch`, it rejects with the string `root + " is not listable"`, and its `then()` swallows anything the handler throws — hence `.always` plus an `_.isArray` guard.

Fetches complete out of order, so results are written into a pre-sized slot by index and the tabs are filled in a **second ordered pass**. That restores the file-listing order which stock `load_pas` used to provide via its `system_index` sort, and which nothing else provides now the mod no longer goes through it.

Both default reads are normalised into deferreds that only ever resolve, because `$.when` settles the moment one input rejects. The systems are copied onto the live tabs only once both have landed; tabs that already exist are filled straight away, and a `model.cShareSystems_tabsIndex` subscription catches the rest and disposes itself once all three are done.

### PA's own systems in `gw_start`

`load_planet` gets them from `model.premadeSystems`; `gw_start` has no such thing, so the mirrored branch reads `api.memory.load("default_systems")` — the same key `main.js` populates, holding the `JSON.stringify` form, so 9.4 MB crosses the bridge rather than the file's pretty-printed 29 MB. `$.getJSON` on the file is the fallback for the startup window where the key is still empty. Both go through `.always` plus an `_.isArray` guard, for the Coherent-promise reasons above.

Four things in that branch are load-bearing:

- **The hook is `mapPacks.loadPack`, not the option's `load`.** Shared Systems for Galactic War builds `load: function() { return mapPacks.loadPack(name, progress) }` — a property lookup on the module object **at call time** — and it only builds those options inside `mapPackList().then(...)`, which resolves in the `.always` after every injected script has run. Patching `loadPack` is therefore unconditionally in place before the first call, with no ordering to reason about. Wrapping `load` instead loses a race: reaching the options means `loadOptions()`, and `requireGW([...], cb)` routes through require.js's `nextTick`, a `setTimeout(fn, 4)`, by which time that mod can already have resolved its options and started loading. **Use the string form `requireGW(id)`** — it returns the defined module synchronously and throws when there is none, which is also the graceful-degradation path when that mod is absent or restructured.
- **`concat`, never `push`.** `loadPack` memoises its promise and resolves with the _same_ private array every time, and a galaxy rebuild calls it again. `push` would duplicate the defaults on each rebuild; `concat` makes the wrapper idempotent for free.
- **The merge has its own `try`/`catch`, not `guard()`.** `guard` returns `undefined`, and a jQuery doneFilter returning `undefined` resolves with `[undefined]`, which `_.flatten` drops into the pool as a literal `undefined` for `withoutBrokenSystems` to die on. On error the pack's own systems must pass through untouched.
- **`addSurfaceArea` is not optional.** `loadPack` only fixes up what it fetched itself, and these systems never go through it. Without it `planet.generator` is undefined and `withoutBrokenSystems` dereferences `.biome` on it without a guard. The `surface_area` formula must stay identical to the one duplicated across four files in Shared Systems for Galactic War, because it is both how that mod sizes a system to a player count and part of this mod's dedupe key.

### Deduplicating against the other selected sources

`loadSelectedSources` `_.flatten`s the ticked sources with no dedupe, so anything reachable from two of them gets roughly double weight in the random draw. This mod is the main cause: its tabs are filtered views over _everything_ installed, while every map pack also registers its own named tab that becomes its own checkbox. So a tab yields only what no other selected source supplies.

- The other sources come from `model.systemSources()` — the same option objects, each with `.selected()` and `.load()`. No `requireGW`, so no module-id fragility.
- Calling `opt.load()` is **free**: every loader that mod builds is memoised (`mapPacks[tabName].promise`, `systemsLoaded[search_url]`, `user_systems`' singleton, and Uber's already-resolved deferred), so this attaches to the promise it is already waiting on. No second request, no second parse, no change to when the galaxy builds.
- Each is wrapped so it can only resolve, and given the same watchdog as the defaults read. A source failing must never become this tab hanging.
- This mod's tabs overlap **each other** by design — a multi-spawn system is in two of them — so **tab order** decides which supplies it. That fixed precedence is also what stops a tab waiting on one that is waiting on it.
- `systemKey` is `name|planets|seed|surface_area`, which matches the same `.pas` fetched twice or a PA system reached through both a tab and Uber, without comparing whole systems.

What this does **not** fix, deliberately: two unrelated map packs shipping the same map, or one pack shipping two versions of it (the Dreadnought pack ships `Nastolda 1v1` and `Pummel 1v1` twice). Deduping within someone else's source is not ours to do, and the flattened pool is out of reach anyway — it lives in `loadSelectedSources`, and `gw_galaxy.js` captures `chooseStarSystemTemplates` as a module dependency at load time, so the function cannot be wrapped either.

### Why the code calls both `load_pas` and `addTab`

These two cShareSystems entry points are not interchangeable, and picking the wrong one is the mod's classic failure mode:

- `cShareSystems.load_pas(tabName, urls)` takes an array of **file URLs**, fetches them and calls `addTab` itself when the last one lands. Stock cShareSystems iterates the array with `for…in`, so **an empty array means `addTab` is never called and the tab never appears**.
- `cShareSystems.addTab(tabName, systems)` takes an array of **system objects** and creates the tab immediately.

That drives the calls in the file:

- **The three empty `load_pas` registrations at the top** exist purely for Shared Systems for Galactic War, which **replaces** `load_pas` with a version that only records the file array into its own `mapPacks` registry and loads lazily. Registering the three tab names early is what gets them into the GW systems list, and that mod builds its checkbox list **once**, from whatever is registered by the time this script returns — so the registration has to stay **synchronous and top-level**. It stores the array **by reference** and re-checks its length on a one-second timer, so the arrays filled in later must be **those exact objects**. In `load_planet` this is a pure no-op, because stock `load_pas` walks the array immediately.
- **Delivery is then per tab, chosen by whether `addTab` exists at all** — the same feature detection that distinguishes the two scenes.
  - `load_planet`: `addTab(name, systems)` with the systems this mod has already parsed. That halves the I/O, because `load_pas` would re-fetch and re-parse every file just read, and an empty array still creates the tab. Deciding this globally is what CHANGELOG's "a tab going missing" bug was: if any `.pas` existed anywhere, all three tabs went through `load_pas`, and a category no pack happened to match got no tab and silently lost its premade and user systems.
  - `gw_start`: filling the registered array _was_ the delivery; `load_pas` is called again only because re-registering the same object is a harmless no-op there and keeps any other implementation working.
- **An empty tab in `gw_start` gets this file's own URL pushed into it.** That mod re-checks an empty pack's file list every second and never gives up, and its deferred never rejects, so an unmatched tab would leave its checkbox spinning with Go To War disabled — and because it waits on all selected sources together, it blocks the others too. This file is certain to fetch (that mod fetched this very URL to inject us) and is not JSON, so the pack settles as an empty source instead.
- `model.systemSources.valueHasMutated()` afterwards is the nudge that makes Shared Systems for Galactic War recount its systems (CHANGELOG v2.2.0). It is guarded because `model.systemSources` only exists when that mod is present, and conditional on having found something because it forces a full galaxy rebuild via `newGameSeed`.

### Error handling

The synchronous body sits in one `try`/`catch` that logs both `e` and `(e.stack || e.message || e)` — the standard shape across Quitch's PA mods, and necessary because an exception escaping a scene script takes out the rest of the scene's JS.

That `try` covers almost nothing, though: everything that matters runs in a callback long after it has exited. jQuery abandons the rest of a callback list when one entry throws, and Coherent's promise turns a throw into a rejection nobody observes, so one malformed system used to take out either every default system or the tab creation entirely. Every asynchronous entry point is therefore wrapped in `guard()`, which logs through the same `logError`.

## Conventions

- Two-space indent, camelCase, Prettier-formatted. `.prettierrc` pins `trailingComma: "es5"` because Prettier's default `"all"` emits trailing commas in call arguments, which is ES2017 syntax Chrome 40 cannot parse — a runtime requirement, not a style choice. `endOfLine: "auto"` is there because `.gitattributes`' `* text=auto` checks the tree out CRLF on Windows.
- `curly: ["error", "all"]` is the only rule layered on top of `js/recommended`.
- No file shadowing — this mod adds only its own files under `ui/mods/`, and it should stay that way.
- `develop` is the default and working branch; `main` carries releases, tagged `vX.Y.Z`.
- SonarCloud analyses this project as `Quitch_Galactic-War-Multiplanetary-Systems` (org `quitch`) through SonarLint connected mode configured in `.vscode/settings.json`, which is gitignored. There is no Sonar CLI to run.
- `.gitattributes` `export-ignore` keeps dev files out of the distributed ZIP and already covers `CLAUDE.md`, `.claude/`, `package.json`, `eslint.config.mjs` and friends — anything new that is tooling-only belongs on that list.

## Releasing

Bump `version`, `build` (the PA build it was tested against) and `date` in [modinfo.json](modinfo.json), rename the CHANGELOG's `## Unreleased` heading to the new version, merge to `main` and tag `vX.Y.Z`. The `develop` modinfo keeps its DEV identity but tracks the same version number.

There is an unreleased entry outstanding: `modinfo.json` still reads `2.3.0` / build `116982`, and the accumulated `## Unreleased` fixes are worth `2.4.0` against the current install's build `124667`.
