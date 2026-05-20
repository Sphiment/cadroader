import { describe, expect, it } from "vitest";
import {
  applyGuidedValues,
  createSimpleUrbanRoadProject,
  getFutureLayerName,
  sanitizeAutocadLayerName,
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
      ["Road Edge", 3.5],
      ["Road Edge", -3.5],
      ["Sidewalk Outer Edge", 5.5],
      ["Sidewalk Outer Edge", -5.5],
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
      ["Road Edge", 4],
      ["Road Edge", -4],
      ["Sidewalk Outer Edge", 5.5],
      ["Sidewalk Outer Edge", -5.5],
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
      ["Road Edge", 4],
      ["Road Edge", -4],
      ["Sidewalk Outer Edge", 5.5],
      ["Sidewalk Outer Edge", -5.5],
    ]);
  });

  it("creates a readable AutoCAD layer preview from prefix and element name", () => {
    expect(getFutureLayerName("C", "Road Edge")).toBe("C-Road Edge");
    expect(getFutureLayerName("", "Road Centerline")).toBe("Road Centerline");
    expect(getFutureLayerName("", "Drainage/Edge?")).toBe("Drainage_Edge_");
  });

  it("sanitizes AutoCAD layer names deterministically", () => {
    expect(sanitizeAutocadLayerName('Road<Main>/Edge?')).toBe("Road_Main__Edge_");
    expect(sanitizeAutocadLayerName('Road\\Main"Edge:Test;A*B|C=D`E')).toBe(
      "Road_Main_Edge_Test_A_B_C_D_E"
    );
    expect(sanitizeAutocadLayerName("Road\x00Main\x1fEdge")).toBe("Road_Main_Edge");
    expect(sanitizeAutocadLayerName("  Road Edge  ")).toBe("Road Edge");
  });
});
