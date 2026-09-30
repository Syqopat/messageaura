const fs = require("fs");
const path = require("path");

const sourceBase = path.join(
  __dirname,
  "..",
  "frontend",
  "textures",
  "assets",
  "minecraft",
  "textures",
);
const destBase = path.join(
  __dirname,
  "node_modules",
  "prismarine-viewer",
  "public",
  "textures",
);

if (!fs.existsSync(sourceBase)) {
  console.error("Kaynak texture klasÃ¶rÃ¼ bulunamadÄ±: " + sourceBase);
  process.exit(1);
}


const sourceBlocks = fs.existsSync(path.join(sourceBase, "block"))
  ? path.join(sourceBase, "block")
  : path.join(sourceBase, "blocks");
const sourceItems = fs.existsSync(path.join(sourceBase, "item"))
  ? path.join(sourceBase, "item")
  : path.join(sourceBase, "items");

if (!fs.existsSync(destBase)) {
  console.error("Prismarine-viewer textures klasÃ¶rÃ¼ bulunamadÄ±: " + destBase);
  process.exit(1);
}

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile() && entry.name.endsWith(".png")) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const versions = fs.readdirSync(destBase);

versions.forEach((version) => {
  const versionDir = path.join(destBase, version);
  if (fs.statSync(versionDir).isDirectory()) {
    console.log(`Copying textures to version ${version}...`);

    const destBlocks = path.join(versionDir, "blocks");
    const destItems = path.join(versionDir, "items");

    if (fs.existsSync(sourceBlocks)) {
      copyDir(sourceBlocks, destBlocks);
    }

    if (fs.existsSync(sourceItems)) {
      copyDir(sourceItems, destItems);
    }
  }
});

console.log("Texture kopyalama tamamlandÄ±!");
