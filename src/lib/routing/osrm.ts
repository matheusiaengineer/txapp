interface RouteResult {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
}

const cache = new Map<string, RouteResult>();

function cacheKey(o: { lat: number; lng: number }, d: { lat: number; lng: number }): string {
  return `${o.lat.toFixed(5)},${o.lng.toFixed(5)}-${d.lat.toFixed(5)},${d.lng.toFixed(5)}`;
}

export async function calculateRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
): Promise<RouteResult | null> {
  const key = cacheKey(origin, dest);
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&overview=full&alternatives=false&steps=false`;
    const res = await fetch(url, { headers: { "User-Agent": "TXDAPP/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.routes?.[0]) return null;

    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(
      (c: number[]) => [c[1], c[0]] as [number, number]
    );

    const result: RouteResult = {
      coordinates: coords,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
    };

    cache.set(key, result);
    setTimeout(() => cache.delete(key), 300000);

    return result;
  } catch {
    return null;
  }
}
