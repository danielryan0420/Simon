/**
 * Minimal declarative flag renderer. Flags are built from a handful of
 * primitive shapes rather than traced from any third-party artwork — national
 * flag designs are public-domain government symbols, so these are original,
 * simplified vector reproductions authored for this project (see CREDITS.md).
 */
export type FlagShape =
  | { t: "rect"; x: number; y: number; w: number; h: number; fill: string }
  | { t: "circle"; cx: number; cy: number; r: number; fill: string }
  | { t: "ring"; cx: number; cy: number; r: number; stroke: string; width: number }
  | { t: "star"; cx: number; cy: number; r: number; fill: string; rot?: number }
  | {
      t: "starGrid";
      x: number;
      y: number;
      w: number;
      h: number;
      rows: number;
      cols: number;
      r: number;
      fill: string;
    }
  | { t: "poly"; points: string; fill: string }
  | { t: "crescent"; cx: number; cy: number; r: number; offset: number; fill: string };

export interface FlagSpec {
  /** Canvas size; defaults to a 3:2 flag ratio. */
  w?: number;
  h?: number;
  /** Solid base fill, drawn first (covered by stripes/shapes if present). */
  bg: string;
  /** Even full-bleed stripes, drawn over the background. */
  stripes?: { dir: "h" | "v"; colors: string[] };
  /** A rectangle (usually top-hoist) containing its own nested shapes. */
  canton?: { x: number; y: number; w: number; h: number; bg: string; shapes?: FlagShape[] };
  /** Extra shapes drawn last, on top of everything else. */
  shapes?: FlagShape[];
}

function star5(cx: number, cy: number, r: number, fill: string, rotDeg = -90): string {
  const points: string[] = [];
  const rotRad = (rotDeg * Math.PI) / 180;
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.4;
    const ang = rotRad + (i * Math.PI) / 5;
    points.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${fill}" />`;
}

function renderShape(shape: FlagShape): string {
  switch (shape.t) {
    case "rect":
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" fill="${shape.fill}" />`;
    case "circle":
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.fill}" />`;
    case "ring":
      return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="none" stroke="${shape.stroke}" stroke-width="${shape.width}" />`;
    case "star":
      return star5(shape.cx, shape.cy, shape.r, shape.fill, shape.rot);
    case "starGrid": {
      const parts: string[] = [];
      for (let row = 0; row < shape.rows; row++) {
        for (let col = 0; col < shape.cols; col++) {
          const cx = shape.x + ((col + 0.5) * shape.w) / shape.cols;
          const cy = shape.y + ((row + 0.5) * shape.h) / shape.rows;
          parts.push(star5(cx, cy, shape.r, shape.fill));
        }
      }
      return parts.join("");
    }
    case "poly":
      return `<polygon points="${shape.points}" fill="${shape.fill}" />`;
    case "crescent": {
      const cutCx = shape.cx + shape.offset;
      return `<mask id="m${Math.round(shape.cx * 100 + shape.cy)}"><rect x="0" y="0" width="100%" height="100%" fill="white" /><circle cx="${cutCx}" cy="${shape.cy}" r="${shape.r * 0.85}" fill="black" /></mask><circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="${shape.fill}" mask="url(#m${Math.round(
        shape.cx * 100 + shape.cy
      )})" />`;
    }
  }
}

export function renderFlagSvg(spec: FlagSpec): string {
  const w = spec.w ?? 90;
  const h = spec.h ?? 60;
  const parts: string[] = [`<rect x="0" y="0" width="${w}" height="${h}" fill="${spec.bg}" />`];

  if (spec.stripes) {
    const { dir, colors } = spec.stripes;
    const n = colors.length;
    colors.forEach((color, i) => {
      if (dir === "h") {
        parts.push(`<rect x="0" y="${(i * h) / n}" width="${w}" height="${h / n}" fill="${color}" />`);
      } else {
        parts.push(`<rect x="${(i * w) / n}" y="0" width="${w / n}" height="${h}" fill="${color}" />`);
      }
    });
  }

  if (spec.canton) {
    const c = spec.canton;
    parts.push(`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${c.bg}" />`);
    for (const shape of c.shapes ?? []) parts.push(renderShape(shape));
  }

  for (const shape of spec.shapes ?? []) parts.push(renderShape(shape));

  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${parts.join("")}</svg>`;
}
