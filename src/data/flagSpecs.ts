import type { FlagShape, FlagSpec } from "../render/flagSvg";

function starAt(cx: number, cy: number, r: number, fill: string): FlagShape {
  return { t: "star", cx, cy, r, fill };
}

/**
 * One simplified flag spec per country in `COUNTRIES`. These are original
 * geometric reproductions (stripes/cantons/basic emblems), not traced from
 * any third-party artwork — see CREDITS.md for the rationale.
 */
export const FLAG_SPECS: Record<string, FlagSpec> = {
  usa: {
    bg: "#B22234",
    stripes: { dir: "h", colors: Array.from({ length: 13 }, (_, i) => (i % 2 === 0 ? "#B22234" : "#FFFFFF")) },
    canton: { x: 0, y: 0, w: 36, h: 32, bg: "#3C3B6E", shapes: [{ t: "starGrid", x: 3, y: 3, w: 30, h: 26, rows: 5, cols: 6, r: 1.6, fill: "#FFFFFF" }] },
  },
  canada: {
    bg: "#FFFFFF",
    stripes: { dir: "v", colors: ["#FF0000", "#FFFFFF", "#FFFFFF", "#FF0000"] },
    shapes: [{ t: "poly", fill: "#FF0000", points: "45,16 47,25 54,22 50,29 57,32 49,33 50,41 45,36 40,41 41,33 33,32 40,29 36,22 43,25" }],
  },
  mexico: {
    bg: "#FFFFFF",
    stripes: { dir: "v", colors: ["#006847", "#FFFFFF", "#CE1126"] },
    shapes: [{ t: "circle", cx: 45, cy: 30, r: 7, fill: "#C8A64B" }],
  },
  brazil: {
    bg: "#009739",
    shapes: [
      { t: "poly", fill: "#FEDD00", points: "45,8 82,30 45,52 8,30" },
      { t: "circle", cx: 45, cy: 30, r: 12, fill: "#002776" },
      { t: "starGrid", x: 36, y: 22, w: 18, h: 16, rows: 2, cols: 3, r: 1.1, fill: "#FFFFFF" },
    ],
  },
  uk: {
    bg: "#012169",
    shapes: [
      { t: "poly", fill: "#FFFFFF", points: "0,0 14,0 90,52 90,60 76,60 0,8" },
      { t: "poly", fill: "#FFFFFF", points: "90,0 76,0 0,52 0,60 14,60 90,8" },
      { t: "rect", x: 0, y: 24, w: 90, h: 12, fill: "#C8102E" },
      { t: "rect", x: 39, y: 0, w: 12, h: 60, fill: "#C8102E" },
    ],
  },
  france: { bg: "#FFFFFF", stripes: { dir: "v", colors: ["#0055A4", "#FFFFFF", "#EF4135"] } },
  germany: { bg: "#000000", stripes: { dir: "h", colors: ["#000000", "#DD0000", "#FFCE00"] } },
  italy: { bg: "#FFFFFF", stripes: { dir: "v", colors: ["#009246", "#FFFFFF", "#CE2B37"] } },
  spain: { bg: "#AA151B", shapes: [{ t: "rect", x: 0, y: 15, w: 90, h: 30, fill: "#F1BF00" }] },
  russia: { bg: "#FFFFFF", stripes: { dir: "h", colors: ["#FFFFFF", "#0039A6", "#D52B1E"] } },
  china: {
    bg: "#DE2910",
    shapes: [
      starAt(18, 15, 7, "#FFDE00"),
      starAt(30, 6, 2, "#FFDE00"),
      starAt(34, 12, 2, "#FFDE00"),
      starAt(34, 20, 2, "#FFDE00"),
      starAt(30, 26, 2, "#FFDE00"),
    ],
  },
  japan: { bg: "#FFFFFF", shapes: [{ t: "circle", cx: 45, cy: 30, r: 12, fill: "#BC002D" }] },
  india: {
    bg: "#FFFFFF",
    stripes: { dir: "h", colors: ["#FF9933", "#FFFFFF", "#138808"] },
    shapes: [{ t: "ring", cx: 45, cy: 30, r: 8, stroke: "#000080", width: 1.4 }],
  },
  australia: {
    bg: "#00008B",
    canton: { x: 0, y: 0, w: 30, h: 20, bg: "#00008B", shapes: [{ t: "rect", x: 12, y: 0, w: 6, h: 20, fill: "#FFFFFF" }, { t: "rect", x: 0, y: 7, w: 30, h: 6, fill: "#FFFFFF" }, { t: "rect", x: 13, y: 0, w: 4, h: 20, fill: "#C8102E" }, { t: "rect", x: 0, y: 8, w: 30, h: 4, fill: "#C8102E" }] },
    shapes: [starAt(20, 45, 4, "#FFFFFF"), starAt(60, 15, 2.5, "#FFFFFF"), starAt(70, 25, 2.5, "#FFFFFF"), starAt(68, 40, 2.5, "#FFFFFF"), starAt(76, 38, 2, "#FFFFFF")],
  },
  egypt: { bg: "#CE1126", stripes: { dir: "h", colors: ["#CE1126", "#FFFFFF", "#000000"] }, shapes: [{ t: "circle", cx: 45, cy: 30, r: 5, fill: "#C8A64B" }] },
  "south-africa": { bg: "#FFFFFF", stripes: { dir: "h", colors: ["#E03C31", "#FFFFFF", "#007749", "#FFB81C", "#001489", "#000000"] } },
  argentina: { bg: "#FFFFFF", stripes: { dir: "h", colors: ["#74ACDF", "#FFFFFF", "#74ACDF"] }, shapes: [starAt(45, 30, 10, "#F6B40E"), { t: "circle", cx: 45, cy: 30, r: 5, fill: "#F6B40E" }] },
  "south-korea": { bg: "#FFFFFF", shapes: [{ t: "circle", cx: 45, cy: 30, r: 10, fill: "#C60C30" }, { t: "rect", x: 45, y: 20, w: 11, h: 20, fill: "#003478" }] },
  kenya: { bg: "#000000", stripes: { dir: "h", colors: ["#000000", "#FFFFFF", "#BB0000", "#FFFFFF", "#006600"] } },
  greece: {
    bg: "#0D5EAE",
    stripes: { dir: "h", colors: ["#0D5EAE", "#FFFFFF", "#0D5EAE", "#FFFFFF", "#0D5EAE", "#FFFFFF", "#0D5EAE", "#FFFFFF", "#0D5EAE"] },
    canton: { x: 0, y: 0, w: 26, h: 26, bg: "#0D5EAE", shapes: [{ t: "rect", x: 10, y: 0, w: 6, h: 26, fill: "#FFFFFF" }, { t: "rect", x: 0, y: 10, w: 26, h: 6, fill: "#FFFFFF" }] },
  },
  nigeria: { bg: "#FFFFFF", stripes: { dir: "v", colors: ["#008751", "#FFFFFF", "#008751"] } },
  morocco: { bg: "#C1272D", shapes: [starAt(45, 30, 10, "#006233")] },
  thailand: { bg: "#A51931", stripes: { dir: "h", colors: ["#A51931", "#F4F5F8", "#2D2A4A", "#F4F5F8", "#A51931"] } },
  vietnam: { bg: "#DA251D", shapes: [starAt(45, 30, 10, "#FFFF00")] },
  indonesia: { bg: "#CE1126", stripes: { dir: "h", colors: ["#CE1126", "#FFFFFF"] } },
  turkey: { bg: "#E30A17", shapes: [{ t: "crescent", cx: 35, cy: 30, r: 12, offset: 5, fill: "#FFFFFF" }, starAt(55, 30, 4, "#FFFFFF")] },
  sweden: { bg: "#006AA7", shapes: [{ t: "rect", x: 32, y: 0, w: 10, h: 60, fill: "#FECC02" }, { t: "rect", x: 0, y: 25, w: 90, h: 10, fill: "#FECC02" }] },
  norway: {
    bg: "#BA0C2F",
    shapes: [
      { t: "rect", x: 28, y: 0, w: 16, h: 60, fill: "#FFFFFF" },
      { t: "rect", x: 0, y: 22, w: 90, h: 16, fill: "#FFFFFF" },
      { t: "rect", x: 33, y: 0, w: 6, h: 60, fill: "#00205B" },
      { t: "rect", x: 0, y: 27, w: 90, h: 6, fill: "#00205B" },
    ],
  },
  poland: { bg: "#FFFFFF", stripes: { dir: "h", colors: ["#FFFFFF", "#DC143C"] } },
  netherlands: { bg: "#AE1C28", stripes: { dir: "h", colors: ["#AE1C28", "#FFFFFF", "#21468B"] } },
  peru: { bg: "#FFFFFF", stripes: { dir: "v", colors: ["#D91023", "#FFFFFF", "#D91023"] } },
  chile: {
    bg: "#FFFFFF",
    stripes: { dir: "h", colors: ["#FFFFFF", "#D52B1E"] },
    canton: { x: 0, y: 0, w: 30, h: 30, bg: "#0039A6", shapes: [starAt(15, 15, 6, "#FFFFFF")] },
  },
  colombia: {
    bg: "#FCD116",
    shapes: [{ t: "rect", x: 0, y: 0, w: 90, h: 30, fill: "#FCD116" }, { t: "rect", x: 0, y: 30, w: 90, h: 15, fill: "#003893" }, { t: "rect", x: 0, y: 45, w: 90, h: 15, fill: "#CE1126" }],
  },
  "new-zealand": {
    bg: "#00247D",
    canton: { x: 0, y: 0, w: 30, h: 20, bg: "#00247D", shapes: [{ t: "rect", x: 12, y: 0, w: 6, h: 20, fill: "#FFFFFF" }, { t: "rect", x: 0, y: 7, w: 30, h: 6, fill: "#FFFFFF" }, { t: "rect", x: 13, y: 0, w: 4, h: 20, fill: "#C8102E" }, { t: "rect", x: 0, y: 8, w: 30, h: 4, fill: "#C8102E" }] },
    shapes: [starAt(62, 14, 3, "#C8102E"), starAt(75, 22, 3.5, "#C8102E"), starAt(70, 38, 3, "#C8102E"), starAt(58, 44, 2.5, "#C8102E")],
  },
  "saudi-arabia": { bg: "#006C35", shapes: [{ t: "rect", x: 15, y: 48, w: 60, h: 3, fill: "#FFFFFF" }] },
  israel: {
    bg: "#FFFFFF",
    shapes: [
      { t: "rect", x: 0, y: 8, w: 90, h: 6, fill: "#0038B8" },
      { t: "rect", x: 0, y: 46, w: 90, h: 6, fill: "#0038B8" },
      { t: "poly", fill: "#0038B8", points: "45,20 55,38 35,38" },
      { t: "poly", fill: "#0038B8", points: "45,40 55,22 35,22" },
    ],
  },
  portugal: { bg: "#FF0000", stripes: { dir: "v", colors: ["#046A38", "#FF0000"] }, shapes: [{ t: "circle", cx: 36, cy: 30, r: 7, fill: "#FFCC00" }] },
  switzerland: { bg: "#D52B1E", shapes: [{ t: "rect", x: 37, y: 15, w: 16, h: 30, fill: "#FFFFFF" }, { t: "rect", x: 22, y: 22, w: 46, h: 16, fill: "#FFFFFF" }] },
  ireland: { bg: "#FFFFFF", stripes: { dir: "v", colors: ["#169B62", "#FFFFFF", "#FF883E"] } },
  philippines: {
    bg: "#0038A8",
    stripes: { dir: "h", colors: ["#0038A8", "#CE1126"] },
    shapes: [{ t: "poly", fill: "#FFFFFF", points: "0,0 30,30 0,60" }, starAt(12, 30, 5, "#FCD116")],
  },
  mongolia: { bg: "#FFFFFF", stripes: { dir: "v", colors: ["#C4272F", "#015197", "#C4272F"] } },
  bhutan: {
    bg: "#FFCC33",
    shapes: [{ t: "poly", fill: "#FFCC33", points: "0,0 90,0 0,60" }, { t: "poly", fill: "#FF4E12", points: "90,0 90,60 0,60" }, { t: "circle", cx: 45, cy: 30, r: 6, fill: "#FFFFFF" }],
  },
  iceland: {
    bg: "#02529C",
    shapes: [
      { t: "rect", x: 28, y: 0, w: 16, h: 60, fill: "#FFFFFF" },
      { t: "rect", x: 0, y: 22, w: 90, h: 16, fill: "#FFFFFF" },
      { t: "rect", x: 33, y: 0, w: 6, h: 60, fill: "#DC1E35" },
      { t: "rect", x: 0, y: 27, w: 90, h: 6, fill: "#DC1E35" },
    ],
  },
  madagascar: {
    bg: "#FFFFFF",
    shapes: [{ t: "rect", x: 0, y: 0, w: 27, h: 60, fill: "#FFFFFF" }, { t: "rect", x: 27, y: 0, w: 63, h: 30, fill: "#FC3D32" }, { t: "rect", x: 27, y: 30, w: 63, h: 30, fill: "#007E3A" }],
  },
  mali: { bg: "#14B53A", stripes: { dir: "v", colors: ["#14B53A", "#FCD116", "#CE1126"] } },
  nepal: { bg: "#DC143C", shapes: [{ t: "circle", cx: 30, cy: 20, r: 6, fill: "#FFFFFF" }, { t: "circle", cx: 55, cy: 40, r: 6, fill: "#FFFFFF" }] },
  uruguay: {
    bg: "#FFFFFF",
    stripes: { dir: "h", colors: ["#FFFFFF", "#0038A8", "#FFFFFF", "#0038A8", "#FFFFFF"] },
    canton: { x: 0, y: 0, w: 26, h: 26, bg: "#FFFFFF", shapes: [starAt(13, 13, 6, "#FCD116")] },
  },
  estonia: { bg: "#4891D9", stripes: { dir: "h", colors: ["#4891D9", "#000000", "#FFFFFF"] } },
  jordan: {
    bg: "#000000",
    stripes: { dir: "h", colors: ["#000000", "#FFFFFF", "#007A3D"] },
    shapes: [{ t: "poly", fill: "#CE1126", points: "0,0 30,30 0,60" }, starAt(12, 30, 4, "#FFFFFF")],
  },
  finland: { bg: "#FFFFFF", shapes: [{ t: "rect", x: 32, y: 0, w: 10, h: 60, fill: "#002F6C" }, { t: "rect", x: 0, y: 25, w: 90, h: 10, fill: "#002F6C" }] },
  "costa-rica": { bg: "#002B7F", stripes: { dir: "h", colors: ["#002B7F", "#FFFFFF", "#CE1126", "#FFFFFF", "#002B7F"] } },
  croatia: {
    bg: "#FFFFFF",
    stripes: { dir: "h", colors: ["#FF0000", "#FFFFFF", "#171796"] },
    shapes: [
      { t: "rect", x: 40, y: 20, w: 5, h: 7, fill: "#FF0000" },
      { t: "rect", x: 45, y: 20, w: 5, h: 7, fill: "#FFFFFF" },
      { t: "rect", x: 40, y: 27, w: 5, h: 7, fill: "#FFFFFF" },
      { t: "rect", x: 45, y: 27, w: 5, h: 7, fill: "#FF0000" },
    ],
  },
  ethiopia: { bg: "#078930", stripes: { dir: "h", colors: ["#078930", "#FCDD09", "#DA121A"] }, shapes: [{ t: "circle", cx: 45, cy: 30, r: 8, fill: "#3E72B7" }, starAt(45, 30, 5, "#FCDD09")] },
  laos: {
    bg: "#CE1126",
    shapes: [{ t: "rect", x: 0, y: 0, w: 90, h: 13, fill: "#CE1126" }, { t: "rect", x: 0, y: 13, w: 90, h: 34, fill: "#002868" }, { t: "rect", x: 0, y: 47, w: 90, h: 13, fill: "#CE1126" }, { t: "circle", cx: 45, cy: 30, r: 9, fill: "#FFFFFF" }],
  },
  latvia: { bg: "#9E3039", stripes: { dir: "h", colors: ["#9E3039", "#FFFFFF", "#9E3039"] } },
  panama: {
    bg: "#FFFFFF",
    shapes: [
      { t: "rect", x: 0, y: 0, w: 45, h: 30, fill: "#FFFFFF" },
      { t: "rect", x: 45, y: 0, w: 45, h: 30, fill: "#005293" },
      { t: "rect", x: 0, y: 30, w: 45, h: 30, fill: "#DA121A" },
      { t: "rect", x: 45, y: 30, w: 45, h: 30, fill: "#FFFFFF" },
      starAt(22, 15, 5, "#DA121A"),
      starAt(67, 45, 5, "#005293"),
    ],
  },
  zimbabwe: {
    bg: "#006600",
    stripes: { dir: "h", colors: ["#006600", "#FCD116", "#CE1126", "#000000", "#CE1126", "#FCD116", "#006600"] },
    shapes: [{ t: "poly", fill: "#FFFFFF", points: "0,0 25,30 0,60" }, starAt(10, 30, 4, "#CE1126")],
  },
  "sri-lanka": { bg: "#8D153A", stripes: { dir: "v", colors: ["#FFBE29", "#00534E", "#8D153A"] } },
  kazakhstan: { bg: "#00AFCA", shapes: [{ t: "rect", x: 0, y: 0, w: 5, h: 60, fill: "#FEC50C" }, starAt(50, 25, 10, "#FEC50C")] },
  tanzania: {
    bg: "#1EB53A",
    shapes: [
      { t: "poly", fill: "#1EB53A", points: "0,0 90,0 0,60" },
      { t: "poly", fill: "#00A3DD", points: "90,0 90,60 0,60" },
      { t: "poly", fill: "#FCD116", points: "0,48 90,0 90,12 0,60" },
      { t: "poly", fill: "#000000", points: "0,50 90,2 90,10 0,58" },
    ],
  },
  palau: { bg: "#4AADD6", shapes: [{ t: "circle", cx: 38, cy: 30, r: 14, fill: "#FFDE00" }] },
  nauru: { bg: "#002B7F", shapes: [{ t: "rect", x: 0, y: 27, w: 90, h: 5, fill: "#FFC61E" }, starAt(22, 44, 5, "#FFFFFF")] },
  "marshall-islands": {
    bg: "#003893",
    shapes: [
      { t: "poly", fill: "#FFFFFF", points: "0,60 90,10 90,16 0,60" },
      { t: "poly", fill: "#DD7500", points: "0,60 90,2 90,10 0,60" },
      starAt(20, 16, 6, "#FFFFFF"),
    ],
  },
  micronesia: { bg: "#75B2DD", shapes: [starAt(30, 18, 3, "#FFFFFF"), starAt(60, 18, 3, "#FFFFFF"), starAt(45, 34, 3, "#FFFFFF"), starAt(30, 42, 3, "#FFFFFF")] },
  tuvalu: {
    bg: "#4AADD6",
    canton: { x: 0, y: 0, w: 28, h: 18, bg: "#00247D", shapes: [{ t: "rect", x: 11, y: 0, w: 6, h: 18, fill: "#FFFFFF" }, { t: "rect", x: 0, y: 6, w: 28, h: 6, fill: "#FFFFFF" }] },
    shapes: [{ t: "starGrid", x: 40, y: 22, w: 42, h: 32, rows: 3, cols: 3, r: 1.8, fill: "#FFCC00" }],
  },
  kiribati: {
    bg: "#CE1126",
    shapes: [
      { t: "rect", x: 0, y: 24, w: 90, h: 36, fill: "#003893" },
      { t: "rect", x: 0, y: 36, w: 90, h: 3, fill: "#FFFFFF" },
      { t: "rect", x: 0, y: 44, w: 90, h: 3, fill: "#FFFFFF" },
      starAt(45, 14, 8, "#FFCC00"),
    ],
  },
  vanuatu: {
    bg: "#CE1126",
    shapes: [
      { t: "poly", fill: "#CE1126", points: "0,0 90,0 0,52" },
      { t: "poly", fill: "#006A4E", points: "90,8 90,60 0,60" },
      { t: "poly", fill: "#FFCC33", points: "0,44 90,0 90,8 0,52" },
      { t: "poly", fill: "#000000", points: "0,0 26,30 0,60" },
      { t: "circle", cx: 11, cy: 30, r: 4, fill: "#FFCC33" },
    ],
  },
  comoros: {
    bg: "#FFC61E",
    stripes: { dir: "h", colors: ["#FFC61E", "#FFFFFF", "#CE1126", "#003893"] },
    shapes: [{ t: "poly", fill: "#1EB53A", points: "0,0 26,30 0,60" }, starAt(10, 30, 4, "#FFFFFF")],
  },
  eswatini: { bg: "#3A7728", stripes: { dir: "h", colors: ["#3A7728", "#FFC61E", "#B10C0C", "#FFC61E", "#3A7728"] }, shapes: [{ t: "circle", cx: 45, cy: 30, r: 5, fill: "#000000" }] },
  liechtenstein: { bg: "#002B7F", stripes: { dir: "h", colors: ["#002B7F", "#CE1126"] }, shapes: [{ t: "circle", cx: 15, cy: 15, r: 5, fill: "#FFCC00" }] },
  "san-marino": { bg: "#FFFFFF", stripes: { dir: "h", colors: ["#FFFFFF", "#5EB6E4"] }, shapes: [{ t: "ring", cx: 45, cy: 30, r: 7, stroke: "#5EB6E4", width: 1.5 }, { t: "ring", cx: 45, cy: 30, r: 4, stroke: "#FFCC00", width: 1 }] },
  andorra: { bg: "#FEDD00", stripes: { dir: "v", colors: ["#0018A8", "#FEDD00", "#D50032"] }, shapes: [{ t: "ring", cx: 45, cy: 30, r: 6, stroke: "#D50032", width: 1.5 }] },
  brunei: {
    bg: "#FFCC00",
    shapes: [
      { t: "poly", fill: "#FFFFFF", points: "0,0 14,0 90,52 90,60 76,60 0,8" },
      { t: "poly", fill: "#000000", points: "0,14 6,10 90,56 90,60 84,60 0,18" },
      { t: "circle", cx: 45, cy: 30, r: 6, fill: "#CE1126" },
    ],
  },
  suriname: { bg: "#377E3F", stripes: { dir: "h", colors: ["#377E3F", "#FFFFFF", "#B40A2D", "#FFFFFF", "#377E3F"] }, shapes: [starAt(45, 30, 6, "#FFC726")] },
  djibouti: {
    bg: "#6AB2E7",
    stripes: { dir: "h", colors: ["#6AB2E7", "#12AD2B"] },
    shapes: [{ t: "poly", fill: "#FFFFFF", points: "0,0 28,30 0,60" }, starAt(12, 30, 5, "#CE1126")],
  },
  "burkina-faso": { bg: "#EF2B2D", stripes: { dir: "h", colors: ["#EF2B2D", "#009E49"] }, shapes: [starAt(45, 30, 7, "#FCD116")] },
  "equatorial-guinea": {
    bg: "#FFFFFF",
    stripes: { dir: "h", colors: ["#3E9A00", "#FFFFFF", "#E32118"] },
    shapes: [{ t: "poly", fill: "#0073CF", points: "0,0 26,30 0,60" }, { t: "circle", cx: 45, cy: 30, r: 5, fill: "#3E9A00" }],
  },
  maldives: {
    bg: "#D21034",
    shapes: [{ t: "rect", x: 18, y: 10, w: 54, h: 40, fill: "#007E3A" }, { t: "crescent", cx: 45, cy: 30, r: 10, offset: 4, fill: "#FFFFFF" }],
  },
  "cape-verde": {
    bg: "#003893",
    shapes: [
      { t: "rect", x: 0, y: 0, w: 90, h: 36, fill: "#003893" },
      { t: "rect", x: 0, y: 36, w: 90, h: 8, fill: "#FFFFFF" },
      { t: "rect", x: 0, y: 44, w: 90, h: 4, fill: "#CF2027" },
      { t: "rect", x: 0, y: 48, w: 90, h: 12, fill: "#003893" },
      { t: "starGrid", x: 25, y: 30, w: 40, h: 16, rows: 2, cols: 5, r: 1.4, fill: "#FCD116" },
    ],
  },
  bahrain: { bg: "#CE1126", stripes: { dir: "v", colors: ["#FFFFFF", "#CE1126", "#CE1126"] } },
  armenia: { bg: "#D90012", stripes: { dir: "h", colors: ["#D90012", "#0033A0", "#F2A800"] } },
  moldova: { bg: "#003DA5", stripes: { dir: "v", colors: ["#003DA5", "#FFD200", "#CC092F"] }, shapes: [{ t: "circle", cx: 45, cy: 30, r: 5, fill: "#C8A64B" }] },
  "north-macedonia": { bg: "#D20000", shapes: [starAt(45, 30, 14, "#FFE600"), { t: "circle", cx: 45, cy: 30, r: 4, fill: "#FFE600" }] },
};
