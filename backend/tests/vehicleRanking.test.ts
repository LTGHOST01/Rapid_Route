import { describe, expect, it } from "vitest";
import { requiredVehicleType } from "../src/services/vehicleService";

describe("vehicle type policy", () => {
  it("maps medical and trauma incidents to ambulances", () => {
    expect(requiredVehicleType("MEDICAL")).toBe("AMBULANCE");
    expect(requiredVehicleType("TRAUMA")).toBe("AMBULANCE");
  });

  it("maps fire and police incidents to matching units", () => {
    expect(requiredVehicleType("FIRE")).toBe("FIRE");
    expect(requiredVehicleType("POLICE")).toBe("POLICE");
  });
});
