const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Hardware an app only *implies* it needs is treated by Google Play as required, and hides the app from devices without it.
 * Locking the screen to portrait implies `screen.portrait`, and the Wi-Fi permission that NetInfo asks for (to read the
 * connection type) implies `wifi`. Hook needs neither, so both are declared optional and every device can install it.
 */
const OPTIONAL_FEATURES = ["android.hardware.screen.portrait", "android.hardware.wifi"];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = (manifest["uses-feature"] = manifest["uses-feature"] || []);
    for (const name of OPTIONAL_FEATURES) {
      const existing = features.find((feature) => feature.$["android:name"] === name);
      if (existing) existing.$["android:required"] = "false";
      else features.push({ $: { "android:name": name, "android:required": "false" } });
    }
    return config;
  });
};
