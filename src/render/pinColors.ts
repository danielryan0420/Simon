/**
 * Pin colors are resolved by semantic meaning rather than passed as raw hex,
 * so a single color-blind toggle can retint every pin consistently.
 */
export type PinKind = "tap" | "miss" | "target";

export const PIN_COLORS = {
  tap: 0x38bdf8,
  miss: 0xff5a5f,
  missColorBlind: 0xffb000,
  target: 0x3ddc84,
  targetColorBlind: 0x00c2d1,
} as const;

export function resolvePinColor(kind: PinKind, colorBlindMode: boolean): number {
  if (kind === "miss") return colorBlindMode ? PIN_COLORS.missColorBlind : PIN_COLORS.miss;
  if (kind === "target") return colorBlindMode ? PIN_COLORS.targetColorBlind : PIN_COLORS.target;
  return PIN_COLORS.tap;
}
