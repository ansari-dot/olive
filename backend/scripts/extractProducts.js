import fs from "fs";

const content = fs.readFileSync("frontend/src/data/storeData.ts", "utf8");

// Extract all import ... from '../assets/images/...'
const importRegex = /import\s+(\w+)\s+from\s+['"]\.\.\/assets\/images\/([^'"]+)['"]/g;
const imageMap = {};
let m;
while ((m = importRegex.exec(content)) !== null) {
  imageMap[m[1]] = `/assets/images/${m[2]}`;
}

function extractArray(name) {
  const start = content.indexOf(name);
  if (start === -1) return [];
  const eq = content.indexOf("=", start);
  const bracket = content.indexOf("[", eq);
  let depth = 0;
  let end = bracket;
  for (let i = bracket; i < content.length; i++) {
    if (content[i] === "[") depth++;
    else if (content[i] === "]") {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  let code = content.slice(bracket, end);
  for (const [varName, path] of Object.entries(imageMap)) {
    code = code.split(varName).join(JSON.stringify(path));
  }
  return new Function("return " + code)();
}

const grids = extractArray("FEATURED_GRID_PRODUCTS");
const uniques = extractArray("UNIQUE_PRODUCTS");
const shops = extractArray("SHOP_PRODUCTS");

console.log("Sample grid product:", JSON.stringify(grids[0], null, 2));
console.log("Sample unique product:", JSON.stringify(uniques[0], null, 2));
console.log("Sample shop product:", JSON.stringify(shops[0], null, 2));
