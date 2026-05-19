import { ROAD_STYLE_SCHEMA_VERSION, UNITS_LABEL, type RoadStyleProject } from "./types";
import { validateProject } from "./validation";

type ParseProjectResult =
  | { ok: true; project: RoadStyleProject }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isElementRole(value: unknown): boolean {
  return (
    value === "centerline" ||
    value === "road-edge-left" ||
    value === "road-edge-right" ||
    value === "sidewalk-outer-left" ||
    value === "sidewalk-outer-right" ||
    value === "custom"
  );
}

function isProjectElementShape(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.enabled === "boolean" &&
    typeof value.name === "string" &&
    typeof value.offset === "number" &&
    typeof value.color === "number" &&
    typeof value.linetype === "string" &&
    isElementRole(value.role)
  );
}

function isProjectShape(value: unknown): value is RoadStyleProject {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.schemaVersion === ROAD_STYLE_SCHEMA_VERSION &&
    typeof value.styleName === "string" &&
    typeof value.prefix === "string" &&
    value.unitsLabel === UNITS_LABEL &&
    (value.template === "simple-urban-road" || value.template === "custom") &&
    isObject(value.guidedValues) &&
    typeof value.guidedValues.roadHalfWidth === "number" &&
    typeof value.guidedValues.sidewalkWidth === "number" &&
    Array.isArray(value.elements) &&
    value.elements.every(isProjectElementShape)
  );
}

export function serializeProject(project: RoadStyleProject): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function parseProjectJson(json: string): ParseProjectResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Project file is not valid JSON." };
  }

  if (!isObject(parsed) || parsed.schemaVersion !== ROAD_STYLE_SCHEMA_VERSION) {
    return { ok: false, error: "Project file uses an unsupported schema version." };
  }

  if (!isProjectShape(parsed)) {
    return { ok: false, error: "Project file does not match the expected road style schema." };
  }

  const validation = validateProject(parsed);
  if (validation.errors.length > 0) {
    return { ok: false, error: validation.errors[0].message };
  }

  return { ok: true, project: parsed };
}
