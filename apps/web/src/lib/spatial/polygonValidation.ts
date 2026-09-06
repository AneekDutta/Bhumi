/**
 * Spatial Polygon Validation Utility
 * Enforces statutory boundary validation:
 * - Minimum 4 coordinates (N >= 4)
 * - Valid geographic range (lat [-90, 90], lng [-180, 180])
 * - No degenerate duplicate points
 * - Non-self-intersecting simple polygon (no bow-ties or crossing edges)
 * - Positive non-zero surface area
 */

import { calculateGeodesicArea } from "./geodesicArea";

export interface CoordinatePoint {
  lat: number;
  lng: number;
  sequence?: number;
  accuracy?: number;
}

export interface PolygonValidationResult {
  valid: boolean;
  error?: string;
  pointCount: number;
  areaSqm?: number;
}

/**
 * Checks if two 2D line segments (p1-q1) and (p2-q2) intersect.
 */
function onSegment(p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }): boolean {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

function orientation(p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 1e-12) return 0; // Collinear
  return val > 0 ? 1 : 2; // Clockwise or Counterclockwise
}

function doSegmentsIntersect(
  p1: { x: number; y: number },
  q1: { x: number; y: number },
  p2: { x: number; y: number },
  q2: { x: number; y: number }
): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case: segments cross
  if (o1 !== o2 && o3 !== o4) return true;

  // Special Cases: collinear points lying on segment
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

/**
 * Validates whether an array of points forms a valid polygon boundary.
 */
export function validateParcelCoordinates(points: CoordinatePoint[]): PolygonValidationResult {
  if (!points || points.length < 4) {
    return {
      valid: false,
      error: `At least 4 corner coordinates are required to demarcate a parcel boundary (provided: ${points?.length || 0}).`,
      pointCount: points?.length || 0
    };
  }

  // 1. Range validation
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (typeof pt.lat !== "number" || isNaN(pt.lat) || pt.lat < -90 || pt.lat > 90) {
      return {
        valid: false,
        error: `Point ${i + 1} has an invalid latitude: ${pt.lat}. Latitude must be between -90 and 90.`,
        pointCount: points.length
      };
    }
    if (typeof pt.lng !== "number" || isNaN(pt.lng) || pt.lng < -180 || pt.lng > 180) {
      return {
        valid: false,
        error: `Point ${i + 1} has an invalid longitude: ${pt.lng}. Longitude must be between -180 and 180.`,
        pointCount: points.length
      };
    }
  }

  // 2. Duplicate / near-identical point check
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dLat = Math.abs(points[i].lat - points[j].lat);
      const dLng = Math.abs(points[i].lng - points[j].lng);
      if (dLat < 1e-7 && dLng < 1e-7) {
        return {
          valid: false,
          error: `Points ${i + 1} and ${j + 1} are identical. Each corner point must be a distinct spatial location.`,
          pointCount: points.length
        };
      }
    }
  }

  // 3. Self-intersection check on edges
  // Project to 2D coordinates (x=lng, y=lat)
  const n = points.length;
  const edges: Array<{ p1: { x: number; y: number }; p2: { x: number; y: number }; i: number; j: number }> = [];
  for (let i = 0; i < n; i++) {
    const nextIdx = (i + 1) % n;
    edges.push({
      p1: { x: points[i].lng, y: points[i].lat },
      p2: { x: points[nextIdx].lng, y: points[nextIdx].lat },
      i,
      j: nextIdx
    });
  }

  for (let a = 0; a < edges.length; a++) {
    for (let b = a + 1; b < edges.length; b++) {
      // Adjacent edges share a common vertex; skip adjacent edge tests
      const sharesVertex =
        edges[a].i === edges[b].i ||
        edges[a].i === edges[b].j ||
        edges[a].j === edges[b].i ||
        edges[a].j === edges[b].j;

      if (!sharesVertex) {
        if (doSegmentsIntersect(edges[a].p1, edges[a].p2, edges[b].p1, edges[b].p2)) {
          return {
            valid: false,
            error: `The coordinates form a self-intersecting boundary (edges ${edges[a].i + 1}-${edges[a].j + 1} and ${edges[b].i + 1}-${edges[b].j + 1} cross). Please enter corner points in continuous clockwise or counter-clockwise order.`,
            pointCount: points.length
          };
        }
      }
    }
  }

  // 4. Geodesic area calculation & non-degeneracy check
  const areaResult = calculateGeodesicArea(points);
  if (areaResult.sqm <= 0.1) {
    return {
      valid: false,
      error: "The demarcated boundary has zero surface area. Points may be collinear. Please adjust the coordinates to enclose a parcel.",
      pointCount: points.length
    };
  }

  return {
    valid: true,
    pointCount: points.length,
    areaSqm: areaResult.sqm
  };
}
