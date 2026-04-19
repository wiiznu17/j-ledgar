const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Forced Alias for react-native-svg to solve Monorepo "RNSVGCircle" duplication
// This forces EVERY module (including lucide-react-native) to use the local version
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  tslib: require.resolve("tslib"),
  semver: require.resolve("semver"),
  "react-native-svg": path.resolve(__dirname, "node_modules/react-native-svg"),
};

// Ensure Metro doesn't look outside the local node_modules for svg
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: "./src/styles/global.css" });
