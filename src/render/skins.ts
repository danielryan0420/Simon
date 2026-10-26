export interface SkinConfig {
  id: string;
  color: number;
  name: string;
}

export const SKINS: Record<string, SkinConfig> = {
  "plane-classic": { id: "plane-classic", color: 0xf1f5f9, name: "Classic Biplane" },
  "plane-jet": { id: "plane-jet", color: 0x38bdf8, name: "Jet Streak" },
  "plane-rocket": { id: "plane-rocket", color: 0xff5a1f, name: "Rocket" },
  "plane-ufo": { id: "plane-ufo", color: 0x6bff6b, name: "UFO" },
  "plane-dragon": { id: "plane-dragon", color: 0xff3d6b, name: "Dragon Flyer" },
};

export function getSkin(id: string): SkinConfig {
  return SKINS[id] ?? SKINS["plane-classic"];
}
