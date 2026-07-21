// Flood-fill background-to-alpha from image borders.
// Turns a flat-background crop into a transparent PNG while preserving
// enclosed interior regions that happen to match the background color.
//
// Usage: NODE_PATH=<project>/node_modules node alpha_floodfill.js <file.png> [tolerance]
//   tolerance: per-channel max diff vs the corner colors (default 14).
//              10-16 typical; lower it when light UI grays sit near the bg color.
// Requires: pngjs (npm i -D pngjs) in the project whose node_modules NODE_PATH points at.
// Edits the file in place.
const fs = require('fs');
const {PNG} = require('pngjs');

const file = process.argv[2];
const tol = Number(process.argv[3] ?? 14);
if (!file) {
  console.error('usage: node alpha_floodfill.js <file.png> [tolerance]');
  process.exit(1);
}

const png = PNG.sync.read(fs.readFileSync(file));
const {width: w, height: h, data} = png;

// Background reference = the 4 corner pixels.
const corner = (x, y) => {
  const i = (y * w + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
};
const refs = [corner(0, 0), corner(w - 1, 0), corner(0, h - 1), corner(w - 1, h - 1)];

const isBg = (i) => {
  for (const r of refs) {
    if (
      Math.abs(data[i] - r[0]) <= tol &&
      Math.abs(data[i + 1] - r[1]) <= tol &&
      Math.abs(data[i + 2] - r[2]) <= tol
    ) {
      return true;
    }
  }
  return false;
};

const visited = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, 0, x, h - 1);
for (let y = 0; y < h; y++) stack.push(0, y, w - 1, y);

while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  if (x < 0 || y < 0 || x >= w || y >= h) continue;
  const p = y * w + x;
  if (visited[p]) continue;
  visited[p] = 1;
  const i = p * 4;
  if (!isBg(i)) continue;
  data[i + 3] = 0;
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

fs.writeFileSync(file, PNG.sync.write(png));
console.log('done', file);
