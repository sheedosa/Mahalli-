import { describe, it, expect } from "vitest";
import {
  STATUS_FLOW,
  ALL_STATUSES,
  statusBadgeClass,
  nextStatus,
  prevStatus,
} from "@/components/orders/status";

describe("status flow", () => {
  it("forward flow order", () => {
    expect(STATUS_FLOW).toEqual(["new", "confirmed", "ready", "out", "delivered"]);
  });
  it("ALL_STATUSES includes cancelled", () => {
    expect(ALL_STATUSES).toContain("cancelled");
    expect(ALL_STATUSES).toHaveLength(6);
  });
});

describe("nextStatus / prevStatus", () => {
  it("advances through the flow", () => {
    expect(nextStatus("new")).toBe("confirmed");
    expect(nextStatus("out")).toBe("delivered");
  });
  it("returns null at the ends", () => {
    expect(nextStatus("delivered")).toBeNull();
    expect(prevStatus("new")).toBeNull();
    expect(nextStatus("cancelled")).toBeNull(); // not in forward flow
  });
  it("steps back", () => {
    expect(prevStatus("confirmed")).toBe("new");
    expect(prevStatus("delivered")).toBe("out");
  });
});

describe("statusBadgeClass", () => {
  it("returns a class for every status", () => {
    for (const s of ALL_STATUSES) {
      expect(statusBadgeClass(s)).toMatch(/bg-.*text-/);
    }
  });
});
