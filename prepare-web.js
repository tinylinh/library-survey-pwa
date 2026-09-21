const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "www");
const files = [
    "index.html",
    "style.css",
    "app.js",
    "config.js",
    "native-plugins.bundle.js",
    "manifest.json",
    "sw.js"
];

fs.mkdirSync(output, { recursive: true });

for (const file of files) {
    fs.copyFileSync(path.join(root, file), path.join(output, file));
}

const iconOutput = path.join(output, "icons");
fs.mkdirSync(iconOutput, { recursive: true });

for (const file of ["icon-192.png", "icon-512.png"]) {
    fs.copyFileSync(
        path.join(root, "icons", file),
        path.join(iconOutput, file)
    );
}
