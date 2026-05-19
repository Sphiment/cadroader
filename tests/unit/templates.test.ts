import { describe, expect, it } from "vitest";
import {
  applyGuidedValues,
  createSimpleUrbanRoadProject,
  getFutureLayerName,
} from "@/lib/road-style/templates";

describe("road style templates", () => {
  it("creates the simple urban road default project", () => {
    const project = createSimpleUrbanRoadProject();

    expect(project.schemaVersion).toBe(1);
    expect(project.unitsLabel).toBe("Drawing Units");
    expect(project.template).toBe("simple-urban-road");
    expect(project.guidedValues).toEqual({ roadHalfWidth: 3.5, sidewalkWidth: 2 });
    expect(project.elements.map((element) => [element.name, element.offset])).toEqual([
      ["Road Centerline", 0],
      ["Left Road Edge", 3.5],
      ["Right Road Edge", -3.5],
      ["Left Sidewalk Outer Edge", 5.5],
      ["Right Sidewalk Outer Edge", -5.5],
    ]);
  });

  it("updates generated offsets from guided values while preserving custom elements", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements.push({
      id: "custom-drainage-line",
      enabled: true,
      name: "Custom Drainage Line",
      offset: 7.25,
      color: 4,
      linetype: "DASHED",
      role: "custom",
    });

    const updated = applyGuidedValues(project, { roadHalfWidth: 4, sidewalkWidth: 1.5 });

    expect(updated.guidedValues).toEqual({ roadHalfWidth: 4, sidewalkWidth: 1.5 });
    expect(updated.elements.map((element) => [element.name, element.offset])).toEqual([
      ["Road Centerline", 0],
      ["Left Road Edge", 4],
      ["Right Road Edge", -4],
      ["Left Sidewalk Outer Edge", 5.5],
      ["Right Sidewalk Outer Edge", -5.5],
      ["Custom Drainage Line", 7.25],
    ]);
  });

  it("snapshots applied guided values", () => {
    const project = createSimpleUrbanRoadProject();
    const guidedValues = { roadHalfWidth: 4, sidewalkWidth: 1.5 };

    const updated = applyGuidedValues(project, guidedValues);
    guidedValues.roadHalfWidth = 9;
    guidedValues.sidewalkWidth = 3;

    expect(updated.guidedValues).toEqual({ roadHalfWidth: 4, sidewalkWidth: 1.5 });
    expect(updated.elements.map((element) => [element.name, element.offset])).toEqual([
      ["Road Centerline", 0],
      ["Left Road Edge", 4],
      ["Right Road Edge", -4],
      ["Left Sidewalk Outer Edge", 5.5],
      ["Right Sidewalk Outer Edge", -5.5],
    ]);
  });

  it("creates a readable future layer name from prefix and element name", () => {
    expect(getFutureLayerName("C", "Left Sidewalk Outer Edge")).toBe("C-LEFT-SIDEWALK-OUTER-EDGE");
    expect(getFutureLayerName("", "Road Centerline")).toBe("ROAD-CENTERLINE");
  });
});
