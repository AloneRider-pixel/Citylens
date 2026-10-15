const CARDINAL_DIRECTIONS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
] as const;

/**
 * Map a heading to the nearest 16-point compass sector.
 * Sector selection uses the unrounded heading so values near 348.75° and
 * 11.25° don't cross a sector boundary because of display rounding.
 */
export function getCompassHeadingText(heading: number): string {
  if (!Number.isFinite(heading)) {
    return "0° N";
  }

  const normalized = ((heading % 360) + 360) % 360;
  const sectorIndex = Math.floor((normalized + 11.25) / 22.5) % 16;
  const displayDegrees = Math.round(normalized) % 360;

  return `${displayDegrees}° ${CARDINAL_DIRECTIONS[sectorIndex]}`;
}
