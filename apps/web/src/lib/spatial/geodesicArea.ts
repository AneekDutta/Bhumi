/**
 * Geodesic Spherical Polygon Area and Uncertainty Calculation
 *
 * Implements the Chamberlain-Duquette spherical excess algorithm on the WGS-84 reference sphere.
 * Calculates exact polygon area in square meters, acres, and hectares directly from real coordinates.
 * Propagates individual GPS point accuracies to derive a deterministic, explainable area uncertainty.
 *
 * ZERO FAKE DATA: Returns null if points or accuracies are insufficient or invalid.
 */

const WGS84_RADIUS_METERS = 6378137.0; // Earth equatorial radius (WGS-84)

/**
 * Calculates great-circle Haversine distance between two points in meters.
 * Coordinates are [longitude, latitude] in decimal degrees.
 */
export function haversineDistance(p1: [number, number], p2: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;
  const lng1 = toRad(p1[0]);
  const lat1 = toRad(p1[1]);
  const lng2 = toRad(p2[0]);
  const lat2 = toRad(p2[1]);

  const dlat = lat2 - lat1;
  const dlng = lng2 - lng1;

  const a =
    Math.sin(dlat / 2.0) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2.0) ** 2;

  return 2.0 * WGS84_RADIUS_METERS * Math.asin(Math.min(1.0, Math.sqrt(a)));
}

/**
 * Calculates geodesic area of a spherical polygon in square meters.
 * Uses the Chamberlain-Duquette algorithm (discrete spherical excess).
 *
 * Coordinates are array of [longitude, latitude].
 * The polygon may be open or closed (if closed, the duplicate endpoint is ignored).
 * Requires at least 3 distinct vertices.
 */
export function calculateSphericalPolygonArea(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0.0;

  // If last point equals first point, strip the duplicate for cyclic summation
  const pts =
    coords.length > 3 &&
    coords[0][0] === coords[coords.length - 1][0] &&
    coords[0][1] === coords[coords.length - 1][1]
      ? coords.slice(0, -1)
      : coords;

  const n = pts.length;
  if (n < 3) return 0.0;

  const toRad = (deg: number) => (deg * Math.PI) / 180.0;

  let total = 0.0;
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const prevLng = toRad(prev[0]);
    const nextLng = toRad(next[0]);
    const currLat = toRad(curr[1]);

    total += (nextLng - prevLng) * Math.sin(currLat);
  }

  return Math.abs((total * WGS84_RADIUS_METERS * WGS84_RADIUS_METERS) / 2.0);
}

export interface BoundaryPointWithAccuracy {
  lat: number;
  lng: number;
  accuracy?: number; // device GPS accuracy in meters (float)
}

export interface AreaAndUncertaintyResult {
  areaSqm: number;
  areaAcres: number;
  areaHectares: number;
  perimeterMeters: number;
  uncertaintySqm: number | null;
  uncertaintyAcres: number | null;
  uncertaintyPercentage: number | null;
  uncertaintyExplanation: string;
}

/**
 * Computes polygon area, perimeter, and deterministic error propagation from actual GPS accuracies.
 *
 * Uncertainty derivation:
 * For each perimeter segment L_i between vertices i and i+1, the positional variance is
 * \sigma_i^2 = (r_i^2 + r_{i+1}^2) / 2.
 * The area uncertainty standard deviation is:
 * \sigma_Area = 0.5 * sqrt( sum_{i=1}^n L_i^2 * \sigma_i^2 )
 *
 * If any point has missing, zero, or negative accuracy, uncertainty is returned as null,
 * with explanation: "Area uncertainty cannot be reliably calculated from the available GPS data."
 */
export function calculatePolygonAreaAndUncertainty(
  points: BoundaryPointWithAccuracy[]
): AreaAndUncertaintyResult | null {
  if (!points || points.length < 3) return null;

  const coords: [number, number][] = points.map((p) => [p.lng, p.lat]);
  const areaSqm = calculateSphericalPolygonArea(coords);
  if (areaSqm <= 0) return null;

  const n = points.length;
  let perimeterMeters = 0.0;
  let sumVar = 0.0;
  let allAccuraciesValid = true;
  let totalAccuracy = 0.0;

  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];

    const acc1 = curr.accuracy;
    const acc2 = next.accuracy;

    if (acc1 === undefined || acc1 === null || acc1 <= 0 ||
        acc2 === undefined || acc2 === null || acc2 <= 0) {
      allAccuraciesValid = false;
    } else {
      totalAccuracy += acc1;
    }

    const segLen = haversineDistance([curr.lng, curr.lat], [next.lng, next.lat]);
    perimeterMeters += segLen;

    if (allAccuraciesValid && acc1 && acc2) {
      const segVar = (acc1 ** 2 + acc2 ** 2) / 2.0;
      sumVar += (segLen ** 2) * segVar;
    }
  }

  let uncertaintySqm: number | null = null;
  let uncertaintyAcres: number | null = null;
  let uncertaintyPercentage: number | null = null;
  let uncertaintyExplanation = "Area uncertainty cannot be reliably calculated from the available GPS data.";

  if (allAccuraciesValid && sumVar > 0) {
    uncertaintySqm = 0.5 * Math.sqrt(sumVar);
    uncertaintyAcres = uncertaintySqm * 0.000247105;
    uncertaintyPercentage = Number(((uncertaintySqm / areaSqm) * 100).toFixed(1));
    const meanAcc = (totalAccuracy / n).toFixed(1);
    uncertaintyExplanation = `±${uncertaintySqm.toFixed(1)} m² (±${uncertaintyAcres.toFixed(3)} acres) derived from mean vertex GPS accuracy of ±${meanAcc} m along ${perimeterMeters.toFixed(1)} m perimeter.`;
  }

  return {
    areaSqm: Number(areaSqm.toFixed(2)),
    areaAcres: Number((areaSqm * 0.000247105).toFixed(4)),
    areaHectares: Number((areaSqm / 10000.0).toFixed(4)),
    perimeterMeters: Number(perimeterMeters.toFixed(1)),
    uncertaintySqm: uncertaintySqm ? Number(uncertaintySqm.toFixed(1)) : null,
    uncertaintyAcres: uncertaintyAcres ? Number(uncertaintyAcres.toFixed(4)) : null,
    uncertaintyPercentage,
    uncertaintyExplanation
  };
}
