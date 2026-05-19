# AutoCAD Road Multiline Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side website that lets users design a road cross-section and export one AutoCAD `.mln` multiline style plus one editable project `.json` file.

**Architecture:** Use a Next.js App Router app with a single client-side road-style workspace. Keep AutoCAD-specific logic in focused pure TypeScript modules under `lib/road-style`, and keep React components under `components/road-style`. Unit tests cover model, validation, JSON, and MLN export; Playwright covers the main browser workflow.

**Tech Stack:** Next.js, React, TypeScript, CSS, Vitest, Playwright, pnpm.

---

## File Structure

- Create `package.json`: scripts and dependencies for the Next app, Vitest, and Playwright.
- Create `tsconfig.json`: strict TypeScript config with `@/*` path alias.
- Create `next.config.ts`: minimal Next config.
- Create `vitest.config.ts`: unit test config using Node environment.
- Create `playwright.config.ts`: e2e config that starts `pnpm dev`.
- Create `app/layout.tsx`: root HTML shell and metadata.
- Create `app/page.tsx`: renders the road style builder.
- Create `app/globals.css`: CAD utility visual system and responsive layout.
- Create `lib/road-style/types.ts`: project, element, validation, and JSON types.
- Create `lib/road-style/templates.ts`: Simple Urban Road defaults and guided value application.
- Create `lib/road-style/validation.ts`: export-critical errors and warnings.
- Create `lib/road-style/project-json.ts`: JSON serialize/parse helpers.
- Create `lib/road-style/mln.ts`: deterministic AutoCAD `.mln` writer.
- Create `components/road-style/road-style-app.tsx`: client-side state orchestration and file downloads/imports.
- Create `components/road-style/header-bar.tsx`: style name, prefix, import, and download controls.
- Create `components/road-style/guided-builder.tsx`: road half-width and sidewalk width controls.
- Create `components/road-style/cross-section-preview.tsx`: technical cross-section preview.
- Create `components/road-style/element-table.tsx`: advanced multiline element editor.
- Create `components/road-style/validation-panel.tsx`: visible errors and warnings.
- Create `tests/unit/templates.test.ts`: guided defaults and offset behavior.
- Create `tests/unit/validation-json.test.ts`: validation and JSON round-trip behavior.
- Create `tests/unit/mln.test.ts`: deterministic `.mln` output behavior.
- Create `tests/e2e/road-style-builder.test.ts`: browser workflow smoke test.

Commits: this workspace is currently not a git repository. For every commit checkpoint, first run `git rev-parse --is-inside-work-tree`. If it returns `true`, commit the listed files. If it returns `false`, skip the commit checkpoint and continue; do not run `git init` unless the user explicitly asks.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json` with this content:

```json
{
  "name": "autocad-road-mln-generator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "check": "tsc --noEmit && vitest run",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "test": "pnpm test:unit && pnpm test:e2e"
  },
  "dependencies": {
    "@next/env": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Create TypeScript and test config files**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 3: Create the initial App Router shell**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Road MLN Generator",
  description: "Create AutoCAD multiline styles for road cross-sections.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="app-shell">
      <section className="empty-state">
        <p className="eyebrow">AutoCAD Road Tool</p>
        <h1>Road MLN Generator</h1>
        <p>
          The implementation starts with the road style data model, then this page
          becomes the interactive builder.
        </p>
      </section>
    </main>
  );
}
```

Create `app/globals.css`:

```css
:root {
  color-scheme: dark;
  --bg: #07111f;
  --panel: #0e1a2b;
  --panel-strong: #14243a;
  --border: #28415f;
  --text: #edf6ff;
  --muted: #94a9bf;
  --accent: #46d9c4;
  --danger: #ff6b6b;
  --warning: #ffd166;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background: radial-gradient(circle at top left, #123454 0, var(--bg) 42rem);
  color: var(--text);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.empty-state {
  max-width: 720px;
  margin: 12vh auto 0;
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(14, 26, 43, 0.84);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`

Expected: dependencies install successfully and `pnpm-lock.yaml` is created.

- [ ] **Step 5: Verify the scaffold builds**

Run: `pnpm check`

Expected: TypeScript passes and Vitest reports no unit test files or an empty successful run depending on the installed Vitest version.

Run: `pnpm build`

Expected: Next.js creates a production build successfully.

- [ ] **Step 6: Commit checkpoint**

Run: `git rev-parse --is-inside-work-tree`

If output is `true`, run:

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts vitest.config.ts playwright.config.ts app/layout.tsx app/page.tsx app/globals.css
git commit -m "chore: scaffold road mln generator app"
```

If output is not `true`, skip this checkpoint.

---

### Task 2: Road Style Domain Model And Template

**Files:**
- Create: `tests/unit/templates.test.ts`
- Create: `lib/road-style/types.ts`
- Create: `lib/road-style/templates.ts`

- [ ] **Step 1: Write failing template tests**

Create `tests/unit/templates.test.ts`:

```ts
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

  it("creates a readable future layer name from prefix and element name", () => {
    expect(getFutureLayerName("C", "Left Sidewalk Outer Edge")).toBe("C-LEFT-SIDEWALK-OUTER-EDGE");
    expect(getFutureLayerName("", "Road Centerline")).toBe("ROAD-CENTERLINE");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:unit tests/unit/templates.test.ts`

Expected: FAIL because `@/lib/road-style/templates` does not exist.

- [ ] **Step 3: Implement the domain types**

Create `lib/road-style/types.ts`:

```ts
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
```

- [ ] **Step 4: Implement the Simple Urban Road template**

Create `lib/road-style/templates.ts`:

```ts
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
      name: "Left Road Edge",
      offset: values.roadHalfWidth,
      color: 7,
      linetype: "CONTINUOUS",
      role: "road-edge-left",
    },
    {
      id: "right-road-edge",
      enabled: true,
      name: "Right Road Edge",
      offset: -values.roadHalfWidth,
      color: 7,
      linetype: "CONTINUOUS",
      role: "road-edge-right",
    },
    {
      id: "left-sidewalk-outer-edge",
      enabled: true,
      name: "Left Sidewalk Outer Edge",
      offset: sidewalkOuterOffset,
      color: 8,
      linetype: "CONTINUOUS",
      role: "sidewalk-outer-left",
    },
    {
      id: "right-sidewalk-outer-edge",
      enabled: true,
      name: "Right Sidewalk Outer Edge",
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
    guidedValues: values,
    elements: [...generated, ...customElements],
  };
}

export function getFutureLayerName(prefix: string, elementName: string): string {
  const normalizedName = elementName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  const normalizedPrefix = prefix
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();

  return normalizedPrefix ? `${normalizedPrefix}-${normalizedName}` : normalizedName;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test:unit tests/unit/templates.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

Run: `git rev-parse --is-inside-work-tree`

If output is `true`, run:

```bash
git add tests/unit/templates.test.ts lib/road-style/types.ts lib/road-style/templates.ts
git commit -m "feat: add road style template model"
```

If output is not `true`, skip this checkpoint.

---

### Task 3: Validation And Project JSON

**Files:**
- Create: `tests/unit/validation-json.test.ts`
- Create: `lib/road-style/validation.ts`
- Create: `lib/road-style/project-json.ts`

- [ ] **Step 1: Write failing validation and JSON tests**

Create `tests/unit/validation-json.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:unit tests/unit/validation-json.test.ts`

Expected: FAIL because `validation.ts` and `project-json.ts` do not exist.

- [ ] **Step 3: Implement validation**

Create `lib/road-style/validation.ts`:

```ts
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

  if (enabledElements.length === 0) {
    errors.push(createIssue("elements", "At least one enabled element is required."));
  }

  if (enabledElements.length > 16) {
    errors.push(
      createIssue("elements", "AutoCAD multiline styles support at most 16 enabled elements.")
    );
  }

  const offsets = new Map<string, number>();

  for (const element of enabledElements) {
    if (!Number.isFinite(element.offset)) {
      errors.push(createIssue(element.id, `${element.name} has an invalid numeric offset.`));
    } else {
      const offsetKey = String(element.offset);
      offsets.set(offsetKey, (offsets.get(offsetKey) ?? 0) + 1);
    }

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
        createWarning(element.id, `${element.name} uses linetype ${element.linetype}, which may need to be loaded in AutoCAD.`)
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
```

- [ ] **Step 4: Implement JSON serialization and parsing**

Create `lib/road-style/project-json.ts`:

```ts
import { ROAD_STYLE_SCHEMA_VERSION, UNITS_LABEL, type RoadStyleProject } from "./types";
import { validateProject } from "./validation";

type ParseProjectResult =
  | { ok: true; project: RoadStyleProject }
  | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    Array.isArray(value.elements)
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test:unit tests/unit/validation-json.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

Run: `git rev-parse --is-inside-work-tree`

If output is `true`, run:

```bash
git add tests/unit/validation-json.test.ts lib/road-style/validation.ts lib/road-style/project-json.ts
git commit -m "feat: add road project validation and json"
```

If output is not `true`, skip this checkpoint.

---

### Task 4: AutoCAD MLN Writer

**Files:**
- Create: `tests/unit/mln.test.ts`
- Create: `lib/road-style/mln.ts`

- [ ] **Step 1: Write failing MLN export tests**

Create `tests/unit/mln.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateMln, getMlnFilename } from "@/lib/road-style/mln";
import { createSimpleUrbanRoadProject } from "@/lib/road-style/templates";

describe("MLN writer", () => {
  it("exports deterministic AutoCAD multiline style content", () => {
    const project = createSimpleUrbanRoadProject();
    project.styleName = "ROAD_TEST";

    expect(generateMln(project)).toBe(`MLSTYLE
2
 ROAD_TEST
70
 0
3
 Generated by Road MLN Generator
62
 0
51
 90.00000000000000
52
 90.00000000000000
71
 5
49
 5.50000000000000
62
 8
6
 CONTINUOUS
49
 3.50000000000000
62
 7
6
 CONTINUOUS
49
 0.00000000000000
62
 1
6
 CENTER
49
 -3.50000000000000
62
 7
6
 CONTINUOUS
49
 -5.50000000000000
62
 8
6
 CONTINUOUS
0
`);
  });

  it("excludes disabled elements", () => {
    const project = createSimpleUrbanRoadProject();
    project.elements[0].enabled = false;

    const mln = generateMln(project);

    expect(mln).toContain("71\n 4");
    expect(mln).not.toContain(" CENTER\n");
  });

  it("throws when export-critical validation fails", () => {
    const project = createSimpleUrbanRoadProject();
    project.styleName = "bad style";

    expect(() => generateMln(project)).toThrow(
      "Cannot export MLN: Style name can use only letters, numbers, underscores, and hyphens."
    );
  });

  it("creates a safe MLN filename", () => {
    expect(getMlnFilename("Road Test")).toBe("Road_Test.mln");
    expect(getMlnFilename("***")).toBe("road-style.mln");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:unit tests/unit/mln.test.ts`

Expected: FAIL because `mln.ts` does not exist.

- [ ] **Step 3: Implement deterministic MLN export**

Create `lib/road-style/mln.ts`:

```ts
import type { RoadStyleElement, RoadStyleProject } from "./types";
import { validateProject } from "./validation";

function formatMlnNumber(value: number): string {
  return value.toFixed(14);
}

function sortElementsForMln(elements: RoadStyleElement[]): RoadStyleElement[] {
  return [...elements].sort((a, b) => {
    if (b.offset !== a.offset) {
      return b.offset - a.offset;
    }

    return a.name.localeCompare(b.name);
  });
}

export function generateMln(project: RoadStyleProject): string {
  const validation = validateProject(project);
  if (validation.errors.length > 0) {
    throw new Error(`Cannot export MLN: ${validation.errors[0].message}`);
  }

  const enabledElements = sortElementsForMln(project.elements.filter((element) => element.enabled));
  const lines = [
    "MLSTYLE",
    "2",
    ` ${project.styleName.trim()}`,
    "70",
    " 0",
    "3",
    " Generated by Road MLN Generator",
    "62",
    " 0",
    "51",
    " 90.00000000000000",
    "52",
    " 90.00000000000000",
    "71",
    ` ${enabledElements.length}`,
  ];

  for (const element of enabledElements) {
    lines.push(
      "49",
      ` ${formatMlnNumber(element.offset)}`,
      "62",
      ` ${element.color}`,
      "6",
      ` ${element.linetype.trim().toUpperCase()}`
    );
  }

  lines.push("0");

  return `${lines.join("\n")}\n`;
}

export function getMlnFilename(styleName: string): string {
  const safeName = styleName
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${safeName || "road-style"}.mln`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:unit tests/unit/mln.test.ts`

Expected: PASS.

- [ ] **Step 5: Run all unit tests**

Run: `pnpm test:unit`

Expected: PASS for `templates.test.ts`, `validation-json.test.ts`, and `mln.test.ts`.

- [ ] **Step 6: Commit checkpoint**

Run: `git rev-parse --is-inside-work-tree`

If output is `true`, run:

```bash
git add tests/unit/mln.test.ts lib/road-style/mln.ts
git commit -m "feat: add autocad mln export"
```

If output is not `true`, skip this checkpoint.

---

### Task 5: Builder UI Components

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Create: `components/road-style/road-style-app.tsx`
- Create: `components/road-style/header-bar.tsx`
- Create: `components/road-style/guided-builder.tsx`
- Create: `components/road-style/cross-section-preview.tsx`
- Create: `components/road-style/element-table.tsx`
- Create: `components/road-style/validation-panel.tsx`

- [ ] **Step 1: Replace the initial page with the builder app**

Modify `app/page.tsx`:

```tsx
import { RoadStyleApp } from "@/components/road-style/road-style-app";

export default function HomePage() {
  return <RoadStyleApp />;
}
```

- [ ] **Step 2: Create the client-side app orchestrator**

Create `components/road-style/road-style-app.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { generateMln, getMlnFilename } from "@/lib/road-style/mln";
import { parseProjectJson, serializeProject } from "@/lib/road-style/project-json";
import { applyGuidedValues, createSimpleUrbanRoadProject } from "@/lib/road-style/templates";
import type { GuidedValues, RoadStyleElement, RoadStyleProject } from "@/lib/road-style/types";
import { validateProject } from "@/lib/road-style/validation";
import { CrossSectionPreview } from "./cross-section-preview";
import { ElementTable } from "./element-table";
import { GuidedBuilder } from "./guided-builder";
import { HeaderBar } from "./header-bar";
import { ValidationPanel } from "./validation-panel";

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getJsonFilename(styleName: string): string {
  return getMlnFilename(styleName).replace(/\.mln$/i, ".json");
}

function createCustomElement(): RoadStyleElement {
  const id = `custom-${Date.now()}`;
  return {
    id,
    enabled: true,
    name: "Custom Element",
    offset: 0,
    color: 7,
    linetype: "CONTINUOUS",
    role: "custom",
  };
}

export function RoadStyleApp() {
  const [project, setProject] = useState<RoadStyleProject>(() => createSimpleUrbanRoadProject());
  const [importError, setImportError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validation = validateProject(project);

  function updateProject(updater: (project: RoadStyleProject) => RoadStyleProject) {
    setProject((current) => updater(current));
  }

  function handleGuidedChange(values: GuidedValues) {
    updateProject((current) => applyGuidedValues(current, values));
  }

  function handleElementChange(elementId: string, patch: Partial<RoadStyleElement>) {
    updateProject((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === elementId ? { ...element, ...patch } : element
      ),
    }));
  }

  function handleAddElement() {
    updateProject((current) => ({
      ...current,
      template: "custom",
      elements: [...current.elements, createCustomElement()],
    }));
  }

  function handleRemoveElement(elementId: string) {
    updateProject((current) => ({
      ...current,
      template: "custom",
      elements: current.elements.filter((element) => element.id !== elementId),
    }));
  }

  function handleResetTemplate() {
    setProject(createSimpleUrbanRoadProject());
    setImportError("");
  }

  function handleClearProject() {
    setProject({
      ...createSimpleUrbanRoadProject(),
      template: "custom",
      elements: [],
    });
    setImportError("");
  }

  function handleDownloadMln() {
    if (validation.errors.length > 0) {
      return;
    }

    downloadTextFile(getMlnFilename(project.styleName), generateMln(project), "text/plain;charset=utf-8");
  }

  function handleDownloadJson() {
    downloadTextFile(
      getJsonFilename(project.styleName),
      serializeProject(project),
      "application/json;charset=utf-8"
    );
  }

  async function handleImportFile(file: File) {
    const result = parseProjectJson(await file.text());
    if (!result.ok) {
      setImportError(result.error);
      return;
    }

    setProject(result.project);
    setImportError("");
  }

  return (
    <main className="builder-shell">
      <HeaderBar
        fileInputRef={fileInputRef}
        importError={importError}
        onDownloadJson={handleDownloadJson}
        onDownloadMln={handleDownloadMln}
        onImportFile={handleImportFile}
        project={project}
        setProject={setProject}
        validation={validation}
      />

      <section className="workspace-grid">
        <div className="panel guided-panel">
          <GuidedBuilder
            guidedValues={project.guidedValues}
            onChange={handleGuidedChange}
            onClearProject={handleClearProject}
            onResetTemplate={handleResetTemplate}
          />
          <ValidationPanel validation={validation} />
        </div>

        <div className="panel preview-panel">
          <CrossSectionPreview elements={project.elements} unitsLabel={project.unitsLabel} />
        </div>

        <div className="panel table-panel">
          <ElementTable
            elements={project.elements}
            onAddElement={handleAddElement}
            onChangeElement={handleElementChange}
            onRemoveElement={handleRemoveElement}
            prefix={project.prefix}
          />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Create the header controls**

Create `components/road-style/header-bar.tsx`:

```tsx
import type { RefObject } from "react";
import type { RoadStyleProject, ValidationResult } from "@/lib/road-style/types";

type HeaderBarProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  importError: string;
  onDownloadJson: () => void;
  onDownloadMln: () => void;
  onImportFile: (file: File) => void;
  project: RoadStyleProject;
  setProject: (project: RoadStyleProject) => void;
  validation: ValidationResult;
};

export function HeaderBar({
  fileInputRef,
  importError,
  onDownloadJson,
  onDownloadMln,
  onImportFile,
  project,
  setProject,
  validation,
}: HeaderBarProps) {
  return (
    <header className="top-bar">
      <div>
        <p className="eyebrow">AutoCAD Road Tool</p>
        <h1>Road MLN Generator</h1>
      </div>

      <label className="field compact-field">
        <span>Style name</span>
        <input
          aria-label="Style name"
          onChange={(event) => setProject({ ...project, styleName: event.target.value })}
          value={project.styleName}
        />
      </label>

      <label className="field compact-field">
        <span>Future layer prefix</span>
        <input
          aria-label="Future layer prefix"
          onChange={(event) => setProject({ ...project, prefix: event.target.value })}
          value={project.prefix}
        />
      </label>

      <div className="action-group">
        <input
          accept="application/json,.json"
          className="hidden-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportFile(file);
            }
            event.currentTarget.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />
        <button className="secondary-button" onClick={() => fileInputRef.current?.click()} type="button">
          Import JSON
        </button>
        <button className="secondary-button" onClick={onDownloadJson} type="button">
          Download JSON
        </button>
        <button
          className="primary-button"
          disabled={validation.errors.length > 0}
          onClick={onDownloadMln}
          type="button"
        >
          Download MLN
        </button>
      </div>

      {importError ? <p className="inline-error">{importError}</p> : null}
    </header>
  );
}
```

- [ ] **Step 4: Create guided builder controls**

Create `components/road-style/guided-builder.tsx`:

```tsx
import type { GuidedValues } from "@/lib/road-style/types";

type GuidedBuilderProps = {
  guidedValues: GuidedValues;
  onChange: (values: GuidedValues) => void;
  onClearProject: () => void;
  onResetTemplate: () => void;
};

function readNumber(value: string): number {
  return Number.parseFloat(value);
}

export function GuidedBuilder({
  guidedValues,
  onChange,
  onClearProject,
  onResetTemplate,
}: GuidedBuilderProps) {
  return (
    <section>
      <div className="section-heading">
        <p className="eyebrow">Guided Builder</p>
        <h2>Simple Urban Road</h2>
      </div>

      <p className="muted-copy">
        Values are Drawing Units. AutoCAD applies them according to the drawing unit convention and MLINE scale.
      </p>

      <label className="field">
        <span>Road half-width</span>
        <input
          aria-label="Road half-width"
          min="0"
          onChange={(event) =>
            onChange({ ...guidedValues, roadHalfWidth: readNumber(event.target.value) })
          }
          step="0.01"
          type="number"
          value={guidedValues.roadHalfWidth}
        />
      </label>

      <label className="field">
        <span>Sidewalk width</span>
        <input
          aria-label="Sidewalk width"
          min="0"
          onChange={(event) =>
            onChange({ ...guidedValues, sidewalkWidth: readNumber(event.target.value) })
          }
          step="0.01"
          type="number"
          value={guidedValues.sidewalkWidth}
        />
      </label>

      <div className="button-row">
        <button className="secondary-button" onClick={onResetTemplate} type="button">
          Reset Template
        </button>
        <button className="danger-button" onClick={onClearProject} type="button">
          Start From Scratch
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create the technical preview**

Create `components/road-style/cross-section-preview.tsx`:

```tsx
import type { RoadStyleElement } from "@/lib/road-style/types";

type CrossSectionPreviewProps = {
  elements: RoadStyleElement[];
  unitsLabel: string;
};

const ACI_COLORS: Record<number, string> = {
  1: "#ff4d4d",
  2: "#ffd84d",
  3: "#5ee36a",
  4: "#4dd8ff",
  5: "#4f7dff",
  6: "#ff59d6",
  7: "#f3f5f7",
  8: "#8b98a7",
  9: "#c9d1d9",
  256: "#94a9bf",
};

function getColor(color: number): string {
  return ACI_COLORS[color] ?? "#edf6ff";
}

function getStrokeDasharray(linetype: string): string | undefined {
  const normalized = linetype.trim().toUpperCase();
  if (normalized === "CENTER") {
    return "16 8 3 8";
  }
  if (normalized === "DASHED" || normalized === "HIDDEN") {
    return "10 8";
  }
  return undefined;
}

export function CrossSectionPreview({ elements, unitsLabel }: CrossSectionPreviewProps) {
  const enabledElements = elements.filter((element) => element.enabled);
  const maxAbsOffset = Math.max(1, ...enabledElements.map((element) => Math.abs(element.offset)));
  const viewBoxWidth = 900;
  const viewBoxHeight = 320;
  const centerX = viewBoxWidth / 2;
  const scale = 360 / maxAbsOffset;

  return (
    <section>
      <div className="section-heading horizontal-heading">
        <div>
          <p className="eyebrow">Technical Preview</p>
          <h2>Cross-section offsets</h2>
        </div>
        <span className="unit-pill">{unitsLabel}</span>
      </div>

      <svg aria-label="Road cross-section preview" className="preview-svg" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        <line className="axis-line" x1={centerX} x2={centerX} y1="28" y2="292" />
        <text className="axis-label" x={centerX + 8} y="44">0 centerline</text>

        {enabledElements.map((element, index) => {
          const x = centerX + element.offset * scale;
          const labelY = 72 + index * 38;
          return (
            <g key={element.id}>
              <line
                stroke={getColor(element.color)}
                strokeDasharray={getStrokeDasharray(element.linetype)}
                strokeWidth="4"
                x1={x}
                x2={x}
                y1="72"
                y2="248"
              />
              <line className="offset-guide" x1={centerX} x2={x} y1={labelY} y2={labelY} />
              <text className="preview-label" x={x + 8} y={labelY - 6}>
                {element.name}: {element.offset}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
```

- [ ] **Step 6: Create the advanced element table**

Create `components/road-style/element-table.tsx`:

```tsx
import { getFutureLayerName } from "@/lib/road-style/templates";
import type { RoadStyleElement } from "@/lib/road-style/types";

type ElementTableProps = {
  elements: RoadStyleElement[];
  onAddElement: () => void;
  onChangeElement: (elementId: string, patch: Partial<RoadStyleElement>) => void;
  onRemoveElement: (elementId: string) => void;
  prefix: string;
};

const COLOR_OPTIONS = [
  { label: "Red 1", value: 1 },
  { label: "Yellow 2", value: 2 },
  { label: "Green 3", value: 3 },
  { label: "Cyan 4", value: 4 },
  { label: "Blue 5", value: 5 },
  { label: "Magenta 6", value: 6 },
  { label: "White 7", value: 7 },
  { label: "Gray 8", value: 8 },
  { label: "Light Gray 9", value: 9 },
  { label: "ByLayer 256", value: 256 },
];

const LINETYPE_OPTIONS = ["BYLAYER", "CONTINUOUS", "CENTER", "DASHED", "HIDDEN"];

export function ElementTable({
  elements,
  onAddElement,
  onChangeElement,
  onRemoveElement,
  prefix,
}: ElementTableProps) {
  return (
    <section>
      <div className="section-heading horizontal-heading">
        <div>
          <p className="eyebrow">Advanced Table</p>
          <h2>Multiline elements</h2>
        </div>
        <button className="secondary-button" onClick={onAddElement} type="button">
          Add Element
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>On</th>
              <th>Name</th>
              <th>Offset</th>
              <th>Color</th>
              <th>Linetype</th>
              <th>Future layer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {elements.map((element) => (
              <tr key={element.id}>
                <td>
                  <input
                    aria-label={`${element.name} enabled`}
                    checked={element.enabled}
                    onChange={(event) => onChangeElement(element.id, { enabled: event.target.checked })}
                    type="checkbox"
                  />
                </td>
                <td>
                  <input
                    aria-label={`${element.name} name`}
                    onChange={(event) => onChangeElement(element.id, { name: event.target.value })}
                    value={element.name}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${element.name} offset`}
                    onChange={(event) =>
                      onChangeElement(element.id, { offset: Number.parseFloat(event.target.value) })
                    }
                    step="0.01"
                    type="number"
                    value={element.offset}
                  />
                </td>
                <td>
                  <select
                    aria-label={`${element.name} color`}
                    onChange={(event) => onChangeElement(element.id, { color: Number(event.target.value) })}
                    value={element.color}
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    aria-label={`${element.name} linetype`}
                    list="linetype-options"
                    onChange={(event) => onChangeElement(element.id, { linetype: event.target.value })}
                    value={element.linetype}
                  />
                </td>
                <td className="mono-cell">{getFutureLayerName(prefix, element.name)}</td>
                <td>
                  <button className="text-button" onClick={() => onRemoveElement(element.id)} type="button">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="linetype-options">
          {LINETYPE_OPTIONS.map((linetype) => (
            <option key={linetype} value={linetype} />
          ))}
        </datalist>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Create validation panel**

Create `components/road-style/validation-panel.tsx`:

```tsx
import type { ValidationResult } from "@/lib/road-style/types";

type ValidationPanelProps = {
  validation: ValidationResult;
};

export function ValidationPanel({ validation }: ValidationPanelProps) {
  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return <p className="success-note">Ready to export MLN.</p>;
  }

  return (
    <section className="validation-panel">
      {validation.errors.length > 0 ? (
        <div>
          <h3>Export blockers</h3>
          <ul>
            {validation.errors.map((issue) => (
              <li key={`error-${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {validation.warnings.length > 0 ? (
        <div>
          <h3>Warnings</h3>
          <ul>
            {validation.warnings.map((issue) => (
              <li key={`warning-${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 8: Replace CSS with the full builder layout**

Modify `app/globals.css`:

```css
:root {
  color-scheme: dark;
  --bg: #07111f;
  --panel: #0e1a2b;
  --panel-strong: #14243a;
  --border: #28415f;
  --text: #edf6ff;
  --muted: #94a9bf;
  --accent: #46d9c4;
  --danger: #ff6b6b;
  --warning: #ffd166;
  --success: #5ee36a;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background: radial-gradient(circle at top left, #123454 0, var(--bg) 42rem);
  color: var(--text);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

button,
input,
select {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
}

h2 {
  margin-bottom: 12px;
  font-size: 1.1rem;
}

h3 {
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.builder-shell {
  min-height: 100vh;
  padding: 20px;
}

.top-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 260px) minmax(180px, 240px) auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: rgba(14, 26, 43, 0.9);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(420px, 1fr);
  gap: 18px;
}

.panel {
  border: 1px solid var(--border);
  border-radius: 22px;
  background: rgba(14, 26, 43, 0.88);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.22);
}

.guided-panel,
.preview-panel,
.table-panel {
  padding: 18px;
}

.table-panel {
  grid-column: 1 / -1;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.muted-copy {
  color: var(--muted);
  line-height: 1.55;
}

.section-heading {
  margin-bottom: 14px;
}

.horizontal-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.compact-field {
  margin-bottom: 0;
}

.field input,
.field select,
td input,
td select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #091525;
  color: var(--text);
  padding: 10px 12px;
}

.action-group,
.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-button,
.secondary-button,
.danger-button {
  border-radius: 12px;
  padding: 10px 14px;
  color: #06101d;
  font-weight: 800;
}

.primary-button {
  background: var(--accent);
}

.secondary-button {
  background: #d9e8ff;
}

.danger-button {
  background: var(--danger);
}

.text-button {
  background: transparent;
  color: var(--danger);
  font-weight: 800;
}

.hidden-file {
  display: none;
}

.inline-error {
  grid-column: 1 / -1;
  margin-bottom: 0;
  color: var(--danger);
}

.success-note {
  margin: 18px 0 0;
  border: 1px solid rgba(94, 227, 106, 0.45);
  border-radius: 14px;
  padding: 12px;
  color: var(--success);
  background: rgba(94, 227, 106, 0.08);
}

.validation-panel {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.validation-panel div {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.validation-panel ul {
  margin: 0;
  padding-left: 18px;
  color: var(--warning);
}

.preview-svg {
  display: block;
  width: 100%;
  min-height: 320px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: linear-gradient(180deg, #091525, #0d1d31);
}

.axis-line {
  stroke: var(--accent);
  stroke-width: 2;
  stroke-dasharray: 6 6;
}

.axis-label,
.preview-label {
  fill: var(--text);
  font-size: 13px;
}

.offset-guide {
  stroke: rgba(148, 169, 191, 0.38);
  stroke-width: 1;
}

.unit-pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 8px 12px;
  color: var(--accent);
  background: rgba(70, 217, 196, 0.08);
  font-size: 0.78rem;
  font-weight: 800;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

th,
td {
  border-bottom: 1px solid var(--border);
  padding: 10px;
  text-align: left;
  vertical-align: middle;
}

th {
  color: var(--muted);
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mono-cell {
  color: var(--accent);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.82rem;
}

@media (max-width: 1100px) {
  .top-bar,
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .builder-shell {
    padding: 12px;
  }

  .top-bar,
  .panel {
    border-radius: 16px;
  }

  .horizontal-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
```

- [ ] **Step 9: Run type and unit checks**

Run: `pnpm check`

Expected: PASS.

- [ ] **Step 10: Run the app manually**

Run: `pnpm dev`

Expected: Next.js starts at `http://localhost:3000`; the page shows the header, guided builder, technical preview, and advanced table.

- [ ] **Step 11: Commit checkpoint**

Run: `git rev-parse --is-inside-work-tree`

If output is `true`, run:

```bash
git add app/page.tsx app/globals.css components/road-style
git commit -m "feat: add road style builder interface"
```

If output is not `true`, skip this checkpoint.

---

### Task 6: Browser Workflow Test And Final Verification

**Files:**
- Create: `tests/e2e/road-style-builder.test.ts`

- [ ] **Step 1: Write the Playwright workflow test**

Create `tests/e2e/road-style-builder.test.ts`:

```ts
import { expect, test } from "@playwright/test";

test("edits a road style and downloads MLN", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Road MLN Generator" })).toBeVisible();
  await expect(page.getByLabel("Road half-width")).toHaveValue("3.5");
  await expect(page.getByLabel("Sidewalk width")).toHaveValue("2");

  await page.getByLabel("Road half-width").fill("4");
  await page.getByLabel("Sidewalk width").fill("1.5");

  await expect(page.getByLabel("Road cross-section preview")).toContainText("Left Road Edge: 4");
  await expect(page.getByLabel("Road cross-section preview")).toContainText("Left Sidewalk Outer Edge: 5.5");

  await page.getByLabel("Future layer prefix").fill("C");
  await expect(page.getByText("C-LEFT-SIDEWALK-OUTER-EDGE")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download MLN" }).click();
  const file = await download;

  expect(file.suggestedFilename()).toBe("ROAD_SIMPLE_URBAN.mln");
});
```

- [ ] **Step 2: Install Playwright browsers if needed**

Run: `pnpm exec playwright install chromium`

Expected: Chromium browser dependencies are installed or already present.

- [ ] **Step 3: Run the e2e test**

Run: `pnpm test:e2e`

Expected: PASS for `road-style-builder.test.ts`.

- [ ] **Step 4: Run the full verification suite**

Run: `pnpm check`

Expected: PASS.

Run: `pnpm build`

Expected: PASS.

Run: `pnpm test:e2e`

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

Run: `git rev-parse --is-inside-work-tree`

If output is `true`, run:

```bash
git add tests/e2e/road-style-builder.test.ts playwright.config.ts
git commit -m "test: add road style builder workflow"
```

If output is not `true`, skip this checkpoint.

---

## Self-Review

Spec coverage:

- Client-side website: Task 1 and Task 5.
- Simple Urban Road template: Task 2.
- Guided widths using Drawing Units: Task 2 and Task 5.
- Advanced element table: Task 5.
- Technical cross-section preview: Task 5.
- Human-readable names and optional prefix: Task 2 and Task 5.
- Per-element enabled state, offset, AutoCAD color, and linetype: Task 2 and Task 5.
- `.mln` export: Task 4 and Task 6.
- `.json` export/import: Task 3 and Task 5.
- Validation for style name, enabled element count, offsets, colors, linetypes, and duplicates: Task 3.
- Deterministic output and round-trip tests: Task 3 and Task 4.

Incomplete-section scan: no incomplete sections are present.

Type consistency: `RoadStyleProject`, `RoadStyleElement`, `GuidedValues`, `ValidationResult`, `createSimpleUrbanRoadProject`, `applyGuidedValues`, `validateProject`, `serializeProject`, `parseProjectJson`, `generateMln`, and `getMlnFilename` are defined before use.
