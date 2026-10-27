import { renderFlagSvg } from "../render/flagSvg";
import { FLAG_SPECS } from "./flagSpecs";

/** Country id -> rendered inline flag SVG markup, used by Flags mode. */
export const FLAG_SVGS: Record<string, string> = Object.fromEntries(
  Object.entries(FLAG_SPECS).map(([id, spec]) => [id, renderFlagSvg(spec)])
);

export function flagSvgFor(countryId: string): string | null {
  return FLAG_SVGS[countryId] ?? null;
}
