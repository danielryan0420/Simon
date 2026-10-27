/** Renders a flat equirectangular "Learned" map, shading in countries the player has mastered. */

import { loadWorldGeo } from "../data/worldGeo";

/** Natural Earth name overrides for countries whose gameplay name differs. */
const NAME_ALIASES: Record<string, string> = {
  "United States": "United States of America",
};

function project(lon: number, lat: number, width: number, height: number): [number, number] {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

function pathForPolygon(rings: number[][][], width: number, height: number): Path2D {
  const path = new Path2D();
  for (const ring of rings) {
    ring.forEach(([lon, lat], i) => {
      const [x, y] = project(lon, lat, width, height);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.closePath();
  }
  return path;
}

export async function renderLearnedMap(
  canvas: HTMLCanvasElement,
  learnedCountryNames: Set<string>
): Promise<void> {
  const geo = await loadWorldGeo();
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#061024";
  ctx.fillRect(0, 0, width, height);

  const resolvedLearned = new Set<string>();
  for (const name of learnedCountryNames) {
    resolvedLearned.add(NAME_ALIASES[name] ?? name);
  }

  for (const feature of geo.features) {
    const isLearned = resolvedLearned.has(feature.properties.name);
    const polygons: number[][][][] =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates as number[][][]]
        : (feature.geometry.coordinates as number[][][][]);

    ctx.fillStyle = isLearned ? "#3ddc84" : "#1c2a44";
    ctx.strokeStyle = "#0a1628";
    ctx.lineWidth = 0.5;
    for (const polygon of polygons) {
      const path = pathForPolygon(polygon, width, height);
      ctx.fill(path);
      ctx.stroke(path);
    }
  }
}
