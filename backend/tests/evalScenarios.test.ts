import { describe, expect, it } from "vitest";
import { toCsv } from "../src/lib/evalSchema";
import {
  evaluateRecords,
  NO_SUITABLE_ROUTE,
  parseEvalPayload,
  scenarioPassed,
  scenarioRecords,
} from "../src/services/evalService";

describe("mandatory evaluator scenarios", () => {
  it("selects the low-traffic suitable route", () => {
    const result = evaluateRecords(scenarioRecords("low_traffic"));
    expect(result.noSuitableRoute).toBe(false);
    expect(result.recommended?.trafficLevel).toBe("LOW");
    expect(result.recommended?.etaSeconds).toBe(18 * 60);
    expect(result.recommended?.score).toBeGreaterThan(90);
  });

  it("avoids heavy traffic on the primary corridor", () => {
    const result = evaluateRecords(scenarioRecords("heavy_traffic"));
    expect(result.noSuitableRoute).toBe(false);
    expect(result.recommended?.trafficLevel).toBe("LOW");
    expect(result.recommended?.etaSeconds).toBeLessThan(32 * 60);
  });

  it("removes a blocked route and keeps an alternative", () => {
    const result = evaluateRecords(scenarioRecords("road_blockage"));
    expect(result.candidates[0].blocked).toBe(true);
    expect(result.candidates[0].eligible).toBe(false);
    expect(result.recommended).not.toBeNull();
    expect(result.recommended?.roadStatus).not.toBe("BLOCKED");
  });

  it("reports an unreachable destination with the required message", () => {
    const result = evaluateRecords(scenarioRecords("destination_unreachable"));
    expect(result.noSuitableRoute).toBe(true);
    expect(result.recommended).toBeNull();
    expect(result.message).toBe(NO_SUITABLE_ROUTE);
  });

  it("marks all four mandatory scenarios as passed", () => {
    for (const id of [
      "low_traffic",
      "heavy_traffic",
      "road_blockage",
      "destination_unreachable",
    ] as const) {
      expect(scenarioPassed(id, evaluateRecords(scenarioRecords(id)))).toBe(true);
    }
  });

  it("accepts the mandatory CSV schema", () => {
    const csv = toCsv(scenarioRecords("low_traffic"));
    const result = evaluateRecords(parseEvalPayload({ csv }));
    expect(result.recordCount).toBe(3);
    expect(result.inputSchema).toContain("vehicle_id");
    expect(result.inputSchema).toContain("estimated_travel_time");
  });
});
