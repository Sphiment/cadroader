import { describe, expect, it } from "vitest";
import {
  generateLisp,
  getLispFilename,
  getLispLayerMappings,
  validateLispExport,
} from "@/lib/road-style/lisp";
import { createSimpleUrbanRoadProject } from "@/lib/road-style/templates";

describe("AutoLISP writer", () => {
  it("accepts duplicate color and linetype pairs when they share one layer name", () => {
    const project = createSimpleUrbanRoadProject();

    const validation = validateLispExport(project);

    expect(validation.errors).toEqual([]);
    expect(getLispLayerMappings(project).map((mapping) => mapping.layerName)).toEqual([
      "Road Centerline",
      "Road Edge",
      "Sidewalk Outer Edge",
    ]);
  });

  it("dedupes duplicate color and normalized linetype pairs", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[1].linetype = "continuous";
    project.elements[2].linetype = "CONTINUOUS";

    const validation = validateLispExport(project);
    const roadEdgeMappings = getLispLayerMappings(project).filter(
      (mapping) => mapping.color === 7 && mapping.linetype === "CONTINUOUS"
    );

    expect(validation.errors).toEqual([]);
    expect(roadEdgeMappings).toEqual([
      { color: 7, linetype: "CONTINUOUS", layerName: "Road Edge" },
    ]);
  });

  it("preserves linetype punctuation when normalizing mappings", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements = [
      {
        id: "custom-border",
        enabled: true,
        name: "Custom Border",
        offset: 0,
        color: 3,
        linetype: "border.2",
        role: "custom",
      },
    ];

    expect(getLispLayerMappings(project)).toEqual([
      { color: 3, linetype: "BORDER.2", layerName: "Custom Border" },
    ]);
    expect(generateLisp(project)).toContain('(3 "BORDER.2" "Custom Border")');
    expect(generateLisp(project)).not.toContain("BORDER_2");
  });

  it("blocks duplicate color and linetype pairs that map to different layer names", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[2].name = "Different Road Edge";

    const validation = validateLispExport(project);
    expect(validation.errors.map((issue) => issue.message)).toContain(
      "Color 7 with linetype CONTINUOUS maps to both Road Edge and Different Road Edge. Use the same name for elements that share this pair."
    );
  });

  it("blocks colors that cannot identify exploded lines reliably", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[0].color = 256;

    const validation = validateLispExport(project);
    expect(validation.errors.map((issue) => issue.message)).toContain(
      "Road Centerline needs an explicit AutoCAD color index from 1 to 255 for LSP export."
    );
  });

  it("blocks colors below and above the explicit ACI range", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[0].color = 0;
    project.elements[1].color = 256;

    const validation = validateLispExport(project);

    expect(validation.errors.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Road Centerline needs an explicit AutoCAD color index from 1 to 255 for LSP export.",
        "Road Edge needs an explicit AutoCAD color index from 1 to 255 for LSP export.",
      ])
    );
  });

  it("warns when a generated layer name is sanitized", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[0].name = "Road/Centerline?";

    const validation = validateLispExport(project);
    expect(validation.warnings.map((issue) => issue.message)).toContain(
      "Layer name Road/Centerline? will be exported as Road_Centerline_."
    );
  });

  it("blocks blank element names even when a prefix is set", () => {
    const project = createSimpleUrbanRoadProject();
    project.prefix = "C";
    project.elements[0].name = "   ";

    const validation = validateLispExport(project);

    expect(validation.errors.map((issue) => issue.message)).toContain(
      "road-centerline needs a layer name for LSP export."
    );
  });

  it("generates a minimal AutoLISP command with one mapping per pair", () => {
    const project = createSimpleUrbanRoadProject();
    project.prefix = "C";

    const lisp = generateLisp(project);

    expect(lisp).toContain("(defun c:ROADML2LAYER");
    expect(lisp).toContain('(ssget \'((0 . "MLINE")))');
    expect(lisp).toContain('(1 "CENTER" "C-Road Centerline")');
    expect(lisp).toContain('(7 "CONTINUOUS" "C-Road Edge")');
    expect(lisp).toContain('(8 "CONTINUOUS" "C-Sidewalk Outer Edge")');
    expect(lisp.match(/\(7 "CONTINUOUS" "C-Road Edge"\)/g)).toHaveLength(1);
  });

  it("throws when LSP export validation fails", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[0].color = 256;

    expect(() => generateLisp(project)).toThrow(
      "Cannot export LSP: Road Centerline needs an explicit AutoCAD color index from 1 to 255 for LSP export."
    );
  });

  it("creates a safe LSP filename", () => {
    expect(getLispFilename("Road Test")).toBe("Road_Test.lsp");
    expect(getLispFilename("***")).toBe("road-style.lsp");
    expect(getLispFilename("CON")).toBe("CON_style.lsp");
    expect(getLispFilename("com1")).toBe("com1_style.lsp");
  });
});
