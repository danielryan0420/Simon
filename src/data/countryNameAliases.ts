/**
 * Maps a country's in-game display name to its name in the bundled Natural Earth
 * polygon data, for the handful of cases where they differ. Shared by anything
 * that needs to match a COUNTRIES entry to its countries.geojson feature.
 */
export const NATURAL_EARTH_NAME_ALIASES: Record<string, string> = {
  "United States": "United States of America",
  "North Macedonia": "Macedonia",
  "Equatorial Guinea": "Eq. Guinea",
  Eswatini: "eSwatini",
};
