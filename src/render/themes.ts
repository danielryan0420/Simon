export interface ThemeConfig {
  id: string;
  earthTint: number;
  atmosphereColor: number;
  bgColor: number;
  starColor: number;
}

export const THEMES: Record<string, ThemeConfig> = {
  "theme-blue": { id: "theme-blue", earthTint: 0xffffff, atmosphereColor: 0x4fb6ff, bgColor: 0x02040a, starColor: 0xffffff },
  "theme-sunset": { id: "theme-sunset", earthTint: 0xffd9b3, atmosphereColor: 0xff8a4c, bgColor: 0x12060a, starColor: 0xffe0c2 },
  "theme-neon": { id: "theme-neon", earthTint: 0xd6c9ff, atmosphereColor: 0xff3ddb, bgColor: 0x05020b, starColor: 0x9fffe8 },
  "theme-aurora": { id: "theme-aurora", earthTint: 0xc9ffe0, atmosphereColor: 0x3dffb0, bgColor: 0x020a08, starColor: 0xbdfff0 },
  "theme-gold": { id: "theme-gold", earthTint: 0xffe9a8, atmosphereColor: 0xffc84c, bgColor: 0x0a0602, starColor: 0xffedbd },
};

export function getTheme(id: string): ThemeConfig {
  return THEMES[id] ?? THEMES["theme-blue"];
}
