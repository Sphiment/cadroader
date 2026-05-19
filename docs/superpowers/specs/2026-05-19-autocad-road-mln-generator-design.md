# AutoCAD Road Multiline Generator Design

Date: 2026-05-19

## Context

The project starts from an empty workspace, so this spec defines the first product slice from scratch. The product is a client-side website for creating AutoCAD multiline (`.mln`) styles for road cross-sections.

The first version focuses on generating one AutoCAD multiline style from a road cross-section. Future work can add an AutoLISP workflow that explodes or converts the multiline into normal AutoCAD lines on the correct layers with the correct colors and linetypes.

## Product Direction

Use a **Guided Builder + Advanced Table** interface.

The guided builder helps normal road-design users start from a simple urban road template. The advanced table gives CAD users direct control over the actual multiline elements that will be exported.

## Scope

Version 1 includes:

- Client-side website only, with no account, backend, or database.
- One road style per project.
- One downloaded `.mln` file per export.
- One downloaded `.json` project file for reloading and editing later.
- Simple Urban Road default template.
- Width-based guided inputs using **Drawing Units**.
- Advanced offset table for direct multiline element control.
- Technical live cross-section preview.
- Human-readable element names.
- Optional naming prefix for future LISP/layer workflows.
- Per-element enabled state, offset, AutoCAD color, and linetype.

Version 1 excludes:

- User accounts.
- Online saving.
- Multiple styles in one `.mln` file.
- AutoCAD layer assignment inside `.mln`.
- AutoLISP conversion tooling.
- Full left/right asymmetric guided mode.

Advanced users can still create asymmetric designs manually through the advanced offset table.

## AutoCAD Multiline Constraints

AutoCAD multiline styles are built from 1 to 16 parallel line elements. For this product, v1 will expose offset, color, and linetype because those are the core properties needed for road-style output.

The `.mln` format does not assign separate AutoCAD layers to individual multiline elements. Layer-like names in this product are metadata for the website, JSON export, and future LISP tooling.

Multiline offsets are unitless AutoCAD drawing-unit values. The app must label dimensions as **Drawing Units**, not meters or millimeters. An offset of `3.5` exports as `3.5`; AutoCAD interprets that according to the drawing's unit convention and the MLINE scale used by the drafter.

## Default Template

The default template is **Simple Urban Road**.

It starts with:

- Centerline at offset `0`.
- Left road edge.
- Right road edge.
- Left sidewalk outer edge.
- Right sidewalk outer edge.

The default guided values are:

- Road half-width in Drawing Units.
- Sidewalk width in Drawing Units.

Calculated offsets follow this pattern:

- Centerline: `0`.
- Road edges: `+roadHalfWidth` and `-roadHalfWidth`.
- Sidewalk outer edges: `+(roadHalfWidth + sidewalkWidth)` and `-(roadHalfWidth + sidewalkWidth)`.

The user can reset to this template or clear the project and design from scratch.

## User Flow

1. User opens the road style builder.
2. App loads the Simple Urban Road template.
3. User edits guided width values using Drawing Units.
4. App calculates symmetric offsets from the centerline.
5. User reviews the technical cross-section preview.
6. User opens or edits the advanced table for custom elements.
7. User edits names, prefix, colors, linetypes, enabled states, and offsets.
8. User downloads the `.mln` file.
9. User optionally downloads the `.json` project file for future editing.
10. User can later import the `.json` file to continue editing.

The advanced table is the export source of truth. Guided builder changes update the generated standard elements, but custom advanced elements remain under user control unless the user explicitly resets the design.

## Interface Layout

The website should feel like a technical CAD utility, not a marketing landing page.

Primary layout:

- Header bar with app name, style name field, import JSON, download MLN, and download JSON actions.
- Left panel for the guided builder.
- Center panel for the technical cross-section preview.
- Right or lower panel for the advanced element table.

On desktop, the layout can use a multi-column workspace. On mobile, panels stack vertically with the preview before the advanced table.

Advanced table columns:

- Enabled.
- Name.
- Offset.
- Color.
- Linetype.
- Future layer name preview using the optional prefix.
- Row actions.

The preview must show:

- Centerline at `0`.
- Positive and negative offsets.
- Element labels.
- Drawing-unit distances.
- Element colors.
- Approximate linetype rendering.

## Data Model

The editable project is represented as one `RoadStyleProject`.

Fields:

- `schemaVersion`: version number for future migrations.
- `styleName`: AutoCAD multiline style name.
- `prefix`: optional naming prefix for future LISP/layer workflows.
- `unitsLabel`: fixed string, `Drawing Units`.
- `template`: `simple-urban-road` or `custom`.
- `guidedValues`: guided width inputs such as road half-width and sidewalk width.
- `elements`: ordered list of multiline elements.

Each element has:

- `id`: stable website identifier.
- `enabled`: whether the element exports to `.mln`.
- `name`: human-readable element name.
- `offset`: numeric multiline offset in Drawing Units.
- `color`: AutoCAD color value, using ACI color indexes plus safe defaults such as `BYLAYER`.
- `linetype`: AutoCAD linetype name.
- `role`: optional semantic role, such as `centerline`, `road-edge`, `sidewalk-outer`, or `custom`.

The generated future layer preview is derived from `prefix` and `name`; it does not need to be stored separately unless future LISP requirements need exact persisted layer names.

## Export Behavior

`.mln` export:

- Includes only enabled elements.
- Exports one multiline style.
- Uses the current style name.
- Uses each enabled element's offset, color, and linetype.
- Sorts elements deterministically by offset, then name if needed.
- Applies safe default multiline settings for caps, joints, and fill unless later requirements define user controls.

`.json` export:

- Stores the full `RoadStyleProject`.
- Includes disabled elements.
- Includes guided values and metadata.
- Is the editable source of truth for this website and future LISP tooling.

Import behavior:

- Import accepts only project JSON matching the expected schema shape.
- Import replaces the current project after user confirmation if there are unsaved changes.
- Invalid JSON or unsupported schema versions show a clear error and keep the existing project unchanged.

## Validation And Errors

Export-critical errors block `.mln` download:

- Missing style name.
- AutoCAD-unsafe style name.
- No enabled elements.
- More than 16 enabled elements.
- Invalid numeric offset.
- Invalid color value.
- Missing linetype.

Warnings do not block export:

- Duplicate offsets.
- Very long element names.
- Unknown linetype name that may not exist in the user's AutoCAD drawing.
- Style scale reminder if the user expects real-world dimensions but AutoCAD MLINE scale is not `1`.

The UI should show errors near the relevant field and summarize export blockers near the download buttons.

Style names are considered safe when they use letters, numbers, underscores, or hyphens. The app should trim whitespace and reject empty names or names containing path/file-control characters.

Color values should support AutoCAD Color Index values from `1` to `255` and safe keyword defaults where the `.mln` writer supports them. Linetype should default to `BYLAYER`; common choices can be listed, and custom text can be allowed with a warning if it may not exist in the user's AutoCAD drawing.

## Testing Strategy

Focus tests on product behavior and deterministic exports:

- Guided widths generate the expected symmetric offsets.
- Reset restores the Simple Urban Road template.
- Clear project creates a valid empty/custom starting point.
- Advanced table edits update the preview and exports.
- Disabled elements are excluded from `.mln` and preserved in `.json`.
- `.mln` output is deterministic for the same project.
- `.json` export and import round-trip to the same project.
- Validation catches missing style names, invalid offsets, invalid colors, no enabled elements, and more than 16 enabled elements.

## Future Work

Likely future improvements:

- AutoLISP export that converts multiline output to normal lines on generated layers.
- True left/right guided asymmetry.
- Median/refuge guided module.
- Lane separator and curb modules.
- Multiple road styles per project.
- Multiple styles in one `.mln` library.
- Local browser autosave.
- Online storage only if users later need account-based workflows.
