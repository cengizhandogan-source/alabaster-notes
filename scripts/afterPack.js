const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  const appName = context.packager.appInfo.productFilename;
  const resourcesDir = path.join(
    context.appOutDir,
    `${appName}.app`,
    "Contents",
    "Resources"
  );
  const src = path.join(process.cwd(), ".next", "standalone", "node_modules");
  const dest = path.join(resourcesDir, "standalone", "node_modules");

  console.log("  • copying standalone node_modules to packaged app");
  fs.cpSync(src, dest, { recursive: true });
};
