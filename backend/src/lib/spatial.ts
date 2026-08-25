import { prisma } from "./prisma";
import { logger } from "./logger";
import { decodePolyline, routeOverlapsBlocked, samplePoints } from "./geo";

let postgis: boolean | null = null;

export async function postgisAvailable() {
  if (postgis != null) return postgis;
  try {
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS postgis");
    await prisma.$queryRawUnsafe("SELECT PostGIS_Version()");
    postgis = true;
    logger.info("PostGIS available — using indexed spatial overlap");
  } catch {
    postgis = false;
  }
  return postgis;
}

function toWkt(encoded: string): string | null {
  const points = samplePoints(decodePolyline(encoded), 40);
  if (points.length < 2) return null;
  const body = points.map((p) => `${p.lng} ${p.lat}`).join(",");
  return `LINESTRING(${body})`;
}

export async function routesOverlapSpatial(
  routePolyline: string,
  blockedPolyline: string,
): Promise<boolean> {
  if (await postgisAvailable()) {
    const routeWkt = toWkt(routePolyline);
    const blockedWkt = toWkt(blockedPolyline);
    if (routeWkt && blockedWkt) {
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ hit: boolean }>>(
          `SELECT ST_DWithin(
             ST_GeogFromText($1),
             ST_GeogFromText($2),
             70
           ) AS hit`,
          `SRID=4326;${routeWkt}`,
          `SRID=4326;${blockedWkt}`,
        );
        if (rows[0]?.hit != null) return Boolean(rows[0].hit);
      } catch (error) {
        logger.warn("PostGIS overlap failed — using Haversine fallback", {
          reason: error instanceof Error ? error.message : "unknown",
        });
      }
    }
  }
  return routeOverlapsBlocked(routePolyline, blockedPolyline);
}
