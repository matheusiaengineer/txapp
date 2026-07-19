export interface LatLng { lat: number; lng: number; }

// Haversine distance in meters (rule 87)
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);
  const h = sinHalfDLat * sinHalfDLat + sinHalfDLng * sinHalfDLng * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number { return (deg * Math.PI) / 180; }

// Check if two points differ by more than threshold meters (rule 90)
export function hasMovedSignificantly(a: LatLng, b: LatLng, threshold = 10): boolean {
  return haversineDistance(a, b) > threshold;
}

// Calculate bounding box that encompasses all points (rule 83)
export function calculateBounds(points: LatLng[]): { north: number; south: number; east: number; west: number } {
  let north = -90, south = 90, east = -180, west = 180;
  for (const p of points) {
    if (p.lat > north) north = p.lat;
    if (p.lat < south) south = p.lat;
    if (p.lng > east) east = p.lng;
    if (p.lng < west) west = p.lng;
  }
  return { north, south, east, west };
}

// Check if driver is within meters of passenger (rule 98)
export function isDriverNearby(driver: LatLng, passenger: LatLng, threshold = 50): boolean {
  return haversineDistance(driver, passenger) <= threshold;
}

// Heading between two points (degrees, 0 = north)
export function calculateHeading(from: LatLng, to: LatLng): number {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) - 
            Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function toDeg(rad: number): number { return (rad * 180) / Math.PI; }
