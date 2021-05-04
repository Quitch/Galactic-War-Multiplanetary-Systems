var gwmsMultiplanetarySystemsLoaded;

if (!gwmsMultiplanetarySystemsLoaded) {
  gwmsMultiplanetarySystemsLoaded = true;

  try {
    self.gwmsMountedClientMods = ko
      .observableArray()
      .extend({ session: "gwms_mounted_client_mods" });

    cShareSystems.load_pas("GW Multiplanetary", self.gwmsMountedClientMods());
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
