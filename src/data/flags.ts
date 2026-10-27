/**
 * Country id -> flag SVG markup, used by Flags mode. Artwork is sourced from
 * the `flag-icons` npm package (MIT licensed) rather than hand-drawn, so
 * shapes like Canada's maple leaf or Nepal's non-rectangular pennant render
 * accurately instead of as simplified placeholders. See CREDITS.md.
 */
const rawFlags = import.meta.glob<string>("../assets/flags/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const FLAG_SVGS: Record<string, string> = Object.fromEntries(
  Object.entries(rawFlags).map(([path, svg]) => {
    const id = path.slice(path.lastIndexOf("/") + 1).replace(/\.svg$/, "");
    return [id, svg];
  })
);

export function flagSvgFor(countryId: string): string | null {
  return FLAG_SVGS[countryId] ?? null;
}
