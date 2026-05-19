export const ROAD_STYLE_SCHEMA_VERSION = 1 as const;
export const UNITS_LABEL = "Drawing Units" as const;

export type RoadTemplate = "simple-urban-road" | "custom";

export type RoadElementRole =
  | "centerline"
  | "road-edge-left"
  | "road-edge-right"
  | "sidewalk-outer-left"
  | "sidewalk-outer-right"
  | "custom";

export type GuidedValues = {
  roadHalfWidth: number;
  sidewalkWidth: number;
};

export type RoadStyleElement = {
  id: string;
  enabled: boolean;
  name: string;
  offset: number;
  color: number;
  linetype: string;
  role: RoadElementRole;
};

export type RoadStyleProject = {
  schemaVersion: typeof ROAD_STYLE_SCHEMA_VERSION;
  styleName: string;
  prefix: string;
  unitsLabel: typeof UNITS_LABEL;
  template: RoadTemplate;
  guidedValues: GuidedValues;
  elements: RoadStyleElement[];
};

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  field: string;
  message: string;
};

export type ValidationResult = {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};
