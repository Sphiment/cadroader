import {
  ROAD_STYLE_SCHEMA_VERSION,
  type GuidedValues,
  type RoadElementRole,
  type RoadStyleElement,
  type RoadStyleProject,
  UNITS_LABEL,
} from "./types";

const DEFAULT_GUIDED_VALUES: GuidedValues = {
  roadHalfWidth: 3.5,
  sidewalkWidth: 2,
};

const GENERATED_ROLES: RoadElementRole[] = [
  "centerline",
  "road-edge-left",
  "road-edge-right",
  "sidewalk-outer-left",
  "sidewalk-outer-right",
];

function createGeneratedElements(values: GuidedValues): RoadStyleElement[] {
  const sidewalkOuterOffset = values.roadHalfWidth + values.sidewalkWidth;

  return [
    {
      id: "road-centerline",
      enabled: true,
      name: "Road Centerline",
      offset: 0,
      color: 1,
      linetype: "CENTER",
      role: "centerline",
    },
    {
      id: "left-road-edge",
      enabled: true,
      name: "Road Edge",
      offset: values.roadHalfWidth,
      color: 7,
      linetype: "CONTINUOUS",
      role: "road-edge-left",
    },
    {
      id: "right-road-edge",
      enabled: true,
      name: "Road Edge",
      offset: -values.roadHalfWidth,
      color: 7,
      linetype: "CONTINUOUS",
      role: "road-edge-right",
    },
    {
      id: "left-sidewalk-outer-edge",
      enabled: true,
      name: "Sidewalk Outer Edge",
      offset: sidewalkOuterOffset,
      color: 8,
      linetype: "CONTINUOUS",
      role: "sidewalk-outer-left",
    },
    {
      id: "right-sidewalk-outer-edge",
      enabled: true,
      name: "Sidewalk Outer Edge",
      offset: -sidewalkOuterOffset,
      color: 8,
      linetype: "CONTINUOUS",
      role: "sidewalk-outer-right",
    },
  ];
}

function mergeGeneratedElement(
  generated: RoadStyleElement,
  existing: RoadStyleElement | undefined
): RoadStyleElement {
  if (!existing) {
    return generated;
  }

  return {
    ...generated,
    enabled: existing.enabled,
    name: existing.name,
    color: existing.color,
    linetype: existing.linetype,
  };
}

export function createSimpleUrbanRoadProject(): RoadStyleProject {
  return {
    schemaVersion: ROAD_STYLE_SCHEMA_VERSION,
    styleName: "ROAD_SIMPLE_URBAN",
    prefix: "",
    unitsLabel: UNITS_LABEL,
    template: "simple-urban-road",
    guidedValues: { ...DEFAULT_GUIDED_VALUES },
    elements: createGeneratedElements(DEFAULT_GUIDED_VALUES),
  };
}

export function applyGuidedValues(
  project: RoadStyleProject,
  values: GuidedValues
): RoadStyleProject {
  const existingByRole = new Map(project.elements.map((element) => [element.role, element]));
  const generated = createGeneratedElements(values).map((element) =>
    mergeGeneratedElement(element, existingByRole.get(element.role))
  );
  const customElements = project.elements.filter((element) => !GENERATED_ROLES.includes(element.role));

  return {
    ...project,
    guidedValues: { ...values },
    elements: [...generated, ...customElements],
  };
}

const INVALID_LAYER_NAME_CHARS = /[<>\/\\":;?*|=`\x00-\x1f]/g;

export function sanitizeAutocadLayerName(value: string): string {
  return value.trim().replace(INVALID_LAYER_NAME_CHARS, "_");
}

export function getFutureLayerName(prefix: string, elementName: string): string {
  const sanitizedPrefix = sanitizeAutocadLayerName(prefix);
  const sanitizedName = sanitizeAutocadLayerName(elementName);

  return sanitizedPrefix ? `${sanitizedPrefix}-${sanitizedName}` : sanitizedName;
}
