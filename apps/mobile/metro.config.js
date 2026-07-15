const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Zustand's ESM build (middleware.mjs) uses `import.meta.env` which Metro's
// web bundler does not support. Disabling package exports resolution forces
// Metro to use the CommonJS build instead.
config.resolver.unstable_enablePackageExports = false;

// When Metro resolves ReactNativeSVG.web.js it looks for fetchData.web.js
// (platform-suffixed) which doesn't exist. Point it to the plain .js file.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "./utils/fetchData") {
    return {
      filePath: path.join(
        __dirname,
        "node_modules/react-native-svg/lib/commonjs/utils/fetchData.js"
      ),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
