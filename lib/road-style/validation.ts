import type { RoadStyleProject, ValidationIssue, ValidationResult } from "./types";

const STYLE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

function createIssue(field: string, message: string): ValidationIssue {
  return {
    severity: "error",
    field,
    message,
  };
}

function createWarning(field: string, message: string): ValidationIssue {
  return {
    severity: "warning",
    field,
    message,
  };
}

export function validateProject(project: RoadStyleProject): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const enabledElements = project.elements.filter((element) => element.enabled);

  if (!project.styleName.trim()) {
    errors.push(createIssue("styleName", "Style name is required."));
  } else if (!STYLE_NAME_PATTERN.test(project.styleName.trim())) {
    errors.push(
      createIssue(
        "styleName",
        "Style name can use only letters, numbers, underscores, and hyphens."
      )
    );
  }

  if (!Number.isFinite(project.guidedValues.roadHalfWidth)) {
    errors.push(
      createIssue("guidedValues.roadHalfWidth", "Road half-width has an invalid numeric value.")
    );
  }

  if (!Number.isFinite(project.guidedValues.sidewalkWidth)) {
    errors.push(
      createIssue("guidedValues.sidewalkWidth", "Sidewalk width has an invalid numeric value.")
    );
  }

  if (enabledElements.length === 0) {
    errors.push(createIssue("elements", "At least one enabled element is required."));
  }

  if (enabledElements.length > 16) {
    errors.push(
      createIssue("elements", "AutoCAD multiline styles support at most 16 enabled elements.")
    );
  }

  const offsets = new Map<string, number>();

  for (const element of project.elements) {
    if (!Number.isFinite(element.offset)) {
      errors.push(createIssue(element.id, `${element.name} has an invalid numeric offset.`));
    } else if (element.enabled) {
      const offsetKey = String(element.offset);
      offsets.set(offsetKey, (offsets.get(offsetKey) ?? 0) + 1);
    }
  }

  for (const element of enabledElements) {
    if (!Number.isInteger(element.color) || element.color < 1 || element.color > 256) {
      errors.push(createIssue(element.id, `${element.name} has an invalid AutoCAD color index.`));
    }

    if (!element.linetype.trim()) {
      errors.push(createIssue(element.id, `${element.name} needs a linetype.`));
    }

    if (element.name.trim().length > 64) {
      warnings.push(createWarning(element.id, `${element.name} has a very long element name.`));
    }

    const linetype = element.linetype.trim().toUpperCase();
    const knownSafeLinetypes = new Set(["BYLAYER", "CONTINUOUS", "CENTER", "DASHED", "HIDDEN"]);
    if (linetype && !knownSafeLinetypes.has(linetype)) {
      warnings.push(
        createWarning(
          element.id,
          `${element.name} uses linetype ${element.linetype}, which may need to be loaded in AutoCAD.`
        )
      );
    }
  }

  for (const [offset, count] of offsets) {
    if (count > 1) {
      warnings.push(createWarning("elements", `Multiple enabled elements use offset ${offset}.`));
    }
  }

  return { errors, warnings };
}
