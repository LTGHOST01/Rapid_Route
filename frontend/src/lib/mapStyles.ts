export function routeColor(_index: number, recommended: boolean, blocked: boolean) {
  if (blocked) return "#D93025";
  if (recommended) return "#1A73E8";
  return "#9AA0A6";
}

export function midpoint<T>(points: T[]): T | null {
  if (points.length === 0) return null;
  return points[Math.floor(points.length * 0.45)];
}
