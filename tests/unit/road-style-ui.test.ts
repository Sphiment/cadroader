import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeaderBar } from "@/components/road-style/header-bar";
import { ValidationPanel } from "@/components/road-style/validation-panel";
import type { ValidationResult } from "@/lib/road-style/types";

const validResult: ValidationResult = { errors: [], warnings: [] };

function getButtonMarkup(html: string, label: string) {
  return html.match(new RegExp(`<button[^>]*>${label}</button>`))?.[0] ?? "";
}

describe("road style UI export controls", () => {
  it("renders a separate LSP download button that can be disabled independently", () => {
    const html = renderToStaticMarkup(
      createElement(HeaderBar, {
        canDownloadJson: true,
        canDownloadLisp: false,
        canDownloadMln: true,
        fileInputRef: { current: null },
        onDownloadJson: () => {},
        onDownloadLisp: () => {},
        onDownloadMln: () => {},
        onImportClick: () => {},
        onImportJson: () => {},
        onPrefixChange: () => {},
        onStyleNameChange: () => {},
        prefix: "CITY",
        styleName: "ROAD_TEST",
      })
    );

    expect(html).toContain("Download MLN");
    expect(getButtonMarkup(html, "Download LSP")).toContain("disabled");
  });

  it("shows LSP blockers separately from MLN export readiness", () => {
    const lispValidation: ValidationResult = {
      errors: [
        {
          field: "elements.0.color",
          message: "Road Centerline needs an explicit AutoCAD color index from 1 to 255 for LSP export.",
          severity: "error",
        },
      ],
      warnings: [],
    };

    const html = renderToStaticMarkup(
      createElement(ValidationPanel, {
        importError: null,
        lispValidation,
        validation: validResult,
      })
    );

    expect(html).toContain("MLN and JSON exports are available.");
    expect(html).toContain("LSP: Road Centerline needs an explicit AutoCAD color index from 1 to 255 for LSP export.");
  });

  it("deduplicates matching MLN and LSP warnings", () => {
    const duplicateWarning = {
      field: "elements.0.name",
      message: "Layer name Road/Centerline? will be exported as Road_Centerline_.",
      severity: "warning" as const,
    };
    const validation: ValidationResult = { errors: [], warnings: [duplicateWarning] };
    const lispValidation: ValidationResult = { errors: [], warnings: [duplicateWarning] };

    const html = renderToStaticMarkup(
      createElement(ValidationPanel, {
        importError: null,
        lispValidation,
        validation,
      })
    );

    expect(html.match(/Layer name Road\/Centerline\? will be exported as Road_Centerline_\./g)).toHaveLength(1);
  });
});
