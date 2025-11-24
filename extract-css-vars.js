import fs from "fs";
import path from "path";

const cssFile = path.resolve("index.css");
const jsonDir = path.resolve("json");
const colorsFile = path.join(jsonDir, "colors.json");
const vippsColorsFile = path.join(jsonDir, "vipps-colors.json");
const pinkRibbonColorsFile = path.join(jsonDir, "pink-ribbon-colors.json");

const css = fs.readFileSync(cssFile, "utf8");

const kfColorVarRegex = /--kf-color-([a-zA-Z0-9-]+)-([0-9]{2,3}):\s*([^;]+);/g;
const kfColorVarNoShadeRegex =
  /--kf-color-([a-zA-Z]+)(?!-[0-9]{2,3}):\s*([^;]+);/g;
const vippsColorVarRegex = /--vipps-color-([0-9]{2,3}):\s*([^;]+);/g;
const pinkRibbonColorVarRegex = /--pink-ribbon-color-([0-9]{2,3}):\s*([^;]+);/g;

const colorGroups = {};
let match;

while ((match = kfColorVarRegex.exec(css)) !== null) {
  const [, name, shade, value] = match;
  if (!colorGroups[name]) colorGroups[name] = {};
  colorGroups[name][shade] = value.trim();
}

while ((match = kfColorVarNoShadeRegex.exec(css)) !== null) {
  const [, name, value] = match;
  if (!colorGroups[name]) colorGroups[name] = {};
  colorGroups[name].base = value.trim();
}

const vippsColors = {};
while ((match = vippsColorVarRegex.exec(css)) !== null) {
  const [, shade, value] = match;
  vippsColors[shade] = value.trim();
}

const pinkRibbonColors = {};
while ((match = pinkRibbonColorVarRegex.exec(css)) !== null) {
  const [, shade, value] = match;
  pinkRibbonColors[shade] = value.trim();
}

function parseOklch(oklchString) {
  const match = /oklch\(\s*([^\s]+)\s+([^\s]+)\s+([^\s\)]+)\s*\)/i.exec(
    oklchString
  );
  if (!match) return null;
  let [_, lStr, cStr, hStr] = match;
  let L = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
  const C = parseFloat(cStr);
  let h = hStr.endsWith("deg") ? parseFloat(hStr) : parseFloat(hStr);
  if (Number.isNaN(L) || Number.isNaN(h) || Number.isNaN(C)) return null;
  L = Math.min(1, Math.max(0, L));
  return { L, C, h };
}

function oklchToRgb({ L, C, h }) {
  const hRad = (h * Math.PI) / 180;
  const aComp = C * Math.cos(hRad);
  const bComp = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * aComp + 0.2158037573 * bComp;
  const m_ = L - 0.1055613458 * aComp - 0.0638541728 * bComp;
  const s_ = L - 0.0894841775 * aComp - 1.291485548 * bComp;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  let rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  function linToSrgb(x) {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  }

  let r = Math.round(Math.min(1, Math.max(0, linToSrgb(rLin))) * 255);
  let g = Math.round(Math.min(1, Math.max(0, linToSrgb(gLin))) * 255);
  let blue = Math.round(Math.min(1, Math.max(0, linToSrgb(bLin))) * 255);
  return { r, g, b: blue };
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToRgbaString({ r, g, b }) {
  return `rgba(${r}, ${g}, ${b}, 1)`;
}

function enrichValuesWithFormats(values) {
  const enriched = {};
  for (const [shade, oklchValue] of Object.entries(values)) {
    const parsed = parseOklch(oklchValue);
    if (!parsed) {
      enriched[shade] = { oklch: oklchValue, hex: null, rgba: null };
      continue;
    }
    const rgb = oklchToRgb(parsed);
    const hex = rgbToHex(rgb);
    const rgba = rgbToRgbaString(rgb);
    enriched[shade] = { oklch: oklchValue, hex, rgba };
  }
  return enriched;
}

const colorArray = Object.entries(colorGroups).map(([name, values]) => ({
  name,
  variable: `--kf-color-${name}`,
  values: enrichValuesWithFormats(values),
}));

const vippsArray = [
  {
    name: "vipps",
    variable: "--vipps-color",
    values: enrichValuesWithFormats(vippsColors),
  },
];

const pinkRibbonArray = [
  {
    name: "pink-ribbon",
    variable: "--pink-ribbon-color",
    values: enrichValuesWithFormats(pinkRibbonColors),
  },
];

fs.mkdirSync(jsonDir, { recursive: true });

fs.writeFileSync(colorsFile, JSON.stringify(colorArray, null, 2));
fs.writeFileSync(vippsColorsFile, JSON.stringify(vippsArray, null, 2));
fs.writeFileSync(
  pinkRibbonColorsFile,
  JSON.stringify(pinkRibbonArray, null, 2)
);
console.log(`Extracted ${colorArray.length} color groups to ${colorsFile}`);
console.log(`Extracted vipps colors to ${vippsColorsFile}`);
console.log(`Extracted pink-ribbon colors to ${pinkRibbonColorsFile}`);
