import { describe, expect, it } from "vitest";
import { parseProjectJson, serializeProject } from "@/lib/road-style/project-json";
import { createSimpleUrbanRoadProject } from "@/lib/road-style/templates";
import { validateProject } from "@/lib/road-style/validation";

describe("project validation", () => {
  it("accepts the simple urban road default project", () => {
    const result = validateProject(createSimpleUrbanRoadProject());

    expect(result.errors).toEqual([]);
  });

  it("blocks invalid export-critical values", () => {
    const project = createSimpleUrbanRoadProject();
    project.styleName = "bad name with spaces";
    project.elements[0].offset = Number.NaN;
    project.elements[1].color = 300;
    project.elements[2].linetype = "";

    const result = validateProject(project);

    expect(result.errors.map((issue) => issue.message)).toEqual([
      "Style name can use only letters, numbers, underscores, and hyphens.",
      "Road Centerline has an invalid numeric offset.",
      "Left Road Edge has an invalid AutoCAD color index.",
      "Right Road Edge needs a linetype.",
    ]);
  });

  it("reports invalid guided road half-width values", () => {
    const project = createSimpleUrbanRoadProject();
    project.guidedValues.roadHalfWidth = Number.NaN;

    const result = validateProject(project);

    expect(result.errors.map((issue) => issue.message)).toContain(
      "Road half-width has an invalid numeric value."
    );
  });

  it("reports invalid disabled element offsets because they are exported to JSON", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[1].enabled = false;
    project.elements[1].offset = Number.NaN;

    const result = validateProject(project);

    expect(result.errors.map((issue) => issue.message)).toContain(
      "Left Road Edge has an invalid numeric offset."
    );
  });

  it("warns about duplicate offsets", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[1].offset = 0;

    const result = validateProject(project);

    expect(result.errors).toEqual([]);
    expect(result.warnings.map((issue) => issue.message)).toContain(
      "Multiple enabled elements use offset 0."
    );
  });

  it("blocks more than sixteen enabled elements", () => {
    const project = createSimpleUrbanRoadProject();
    for (let index = 0; index < 12; index += 1) {
      project.elements.push({
        id: `custom-${index}`,
        enabled: true,
        name: `Custom ${index}`,
        offset: 10 + index,
        color: 7,
        linetype: "CONTINUOUS",
        role: "custom",
      });
    }

    const result = validateProject(project);

    expect(result.errors.map((issue) => issue.message)).toContain(
      "AutoCAD multiline styles support at most 16 enabled elements."
    );
  });
});

describe("project JSON", () => {
  it("round-trips a project", () => {
    const project = createSimpleUrbanRoadProject();
    project.prefix = "C";

    const parsed = parseProjectJson(serializeProject(project));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.project).toEqual(project);
    }
  });

  it("rejects invalid project JSON", () => {
    expect(parseProjectJson("not json")).toEqual({
      ok: false,
      error: "Project file is not valid JSON.",
    });
    expect(parseProjectJson(JSON.stringify({ schemaVersion: 999 }))).toEqual({
      ok: false,
      error: "Project file uses an unsupported schema version.",
    });
  });

  it("rejects project JSON with invalid element records", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements = [{ id: "bad" } as (typeof project.elements)[number]];

    expect(parseProjectJson(JSON.stringify(project))).toEqual({
      ok: false,
      error: "Project file does not match the expected road style schema.",
    });
  });
});
