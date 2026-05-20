import { getFutureLayerName } from "./templates";
import type { RoadStyleProject, ValidationIssue, ValidationResult } from "./types";

export type LispLayerMapping = {
  color: number;
  linetype: string;
  layerName: string;
};

const KNOWN_SAFE_LINETYPES = new Set(["BYLAYER", "CONTINUOUS", "CENTER", "DASHED", "HIDDEN"]);

function createIssue(field: string, message: string): ValidationIssue {
  return { severity: "error", field, message };
}

function createWarning(field: string, message: string): ValidationIssue {
  return { severity: "warning", field, message };
}

function compareStringsByCodePoint(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

function isWindowsReservedDeviceName(value: string): boolean {
  return /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(value);
}

function getRawLayerName(prefix: string, elementName: string): string {
  const trimmedPrefix = prefix.trim();
  const trimmedName = elementName.trim();

  return trimmedPrefix ? `${trimmedPrefix}-${trimmedName}` : trimmedName;
}

function getMappingKey(color: number, linetype: string): string {
  return `${color}|${linetype.toUpperCase()}`;
}

function escapeLispString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function normalizeLispLinetype(value: string): string {
  return value.trim().toUpperCase() || "BYLAYER";
}

export function getLispLayerMappings(project: RoadStyleProject): LispLayerMapping[] {
  const mappingsByPair = new Map<string, LispLayerMapping>();

  for (const element of project.elements) {
    if (!element.enabled) {
      continue;
    }

    const linetype = normalizeLispLinetype(element.linetype);
    const layerName = getFutureLayerName(project.prefix, element.name);
    const key = getMappingKey(element.color, linetype);

    if (!mappingsByPair.has(key)) {
      mappingsByPair.set(key, { color: element.color, linetype, layerName });
    }
  }

  return [...mappingsByPair.values()].sort((a, b) => {
    if (a.color !== b.color) {
      return a.color - b.color;
    }

    const linetypeComparison = compareStringsByCodePoint(a.linetype, b.linetype);
    if (linetypeComparison !== 0) {
      return linetypeComparison;
    }

    return compareStringsByCodePoint(a.layerName, b.layerName);
  });
}

export function validateLispExport(project: RoadStyleProject): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const enabledElements = project.elements.filter((element) => element.enabled);
  const layerByPair = new Map<string, string>();

  if (enabledElements.length === 0) {
    errors.push(createIssue("elements", "At least one enabled element is required for LSP export."));
  }

  for (const element of enabledElements) {
    const rawLayerName = getRawLayerName(project.prefix, element.name);
    const layerName = getFutureLayerName(project.prefix, element.name);
    const linetype = normalizeLispLinetype(element.linetype);
    const elementLabel = element.name.trim() || element.id;

    if (!element.name.trim()) {
      errors.push(createIssue(element.id, `${elementLabel} needs a layer name for LSP export.`));
    } else if (!layerName) {
      errors.push(createIssue(element.id, `${elementLabel} needs a layer name for LSP export.`));
    } else if (rawLayerName && rawLayerName !== layerName) {
      warnings.push(
        createWarning(element.id, `Layer name ${rawLayerName} will be exported as ${layerName}.`)
      );
    }

    if (!Number.isInteger(element.color) || element.color < 1 || element.color > 255) {
      errors.push(
        createIssue(
          element.id,
          `${elementLabel} needs an explicit AutoCAD color index from 1 to 255 for LSP export.`
        )
      );
    }

    if (!element.linetype.trim()) {
      errors.push(createIssue(element.id, `${elementLabel} needs a linetype for LSP export.`));
    }

    if (element.linetype.trim() && !KNOWN_SAFE_LINETYPES.has(linetype)) {
      warnings.push(
        createWarning(
          element.id,
          `${elementLabel} uses linetype ${linetype}, which may need to be loaded in AutoCAD.`
        )
      );
    }

    const key = getMappingKey(element.color, linetype);
    const existingLayerName = layerByPair.get(key);

    if (existingLayerName && existingLayerName !== layerName) {
      errors.push(
        createIssue(
          element.id,
          `Color ${element.color} with linetype ${linetype} maps to both ${existingLayerName} and ${layerName}. Use the same name for elements that share this pair.`
        )
      );
    } else if (layerName) {
      layerByPair.set(key, layerName);
    }
  }

  return { errors, warnings };
}

export function generateLisp(project: RoadStyleProject): string {
  const validation = validateLispExport(project);

  if (validation.errors.length > 0) {
    throw new Error(`Cannot export LSP: ${validation.errors[0].message}`);
  }

  const mappingLines = getLispLayerMappings(project)
    .map(
      (mapping) =>
        `    (${mapping.color} "${escapeLispString(mapping.linetype)}" "${escapeLispString(mapping.layerName)}")`
    )
    .join("\n");

  return String.raw`; Generated by Road MLN Generator
; Load this file in AutoCAD, then run ROADML2LAYER.

(setq roadml:mappings
  '(
${mappingLines}
  )
)

(defun roadml:set-dxf (code value data / pair)
  (setq pair (assoc code data))
  (if pair
    (subst (cons code value) pair data)
    (append data (list (cons code value)))
  )
)

(defun roadml:find-map (color ltype / item found)
  (setq ltype (strcase ltype))
  (foreach item roadml:mappings
    (if (and (= color (car item)) (= ltype (strcase (cadr item))))
      (setq found item)
    )
  )
  found
)

(defun roadml:ensure-layer (name color ltype / layer data)
  (if (not (tblsearch "LAYER" name))
    (entmake
      (list
        '(0 . "LAYER")
        '(100 . "AcDbSymbolTableRecord")
        '(100 . "AcDbLayerTableRecord")
        (cons 2 name)
        '(70 . 0)
        (cons 62 color)
        (cons 6 (if (tblsearch "LTYPE" ltype) ltype "CONTINUOUS"))
      )
    )
  )
  (setq layer (tblobjname "LAYER" name))
  (if layer
    (progn
      (setq data (entget layer))
      (setq data (roadml:set-dxf 62 color data))
      (if (tblsearch "LTYPE" ltype)
        (setq data (roadml:set-dxf 6 ltype data))
      )
      (entmod data)
    )
  )
)

(defun c:ROADML2LAYER (/ ss marker index ent created data color ltype mapping total matched unmatched)
  (setq ss (ssget '((0 . "MLINE"))))
  (if ss
    (progn
      (entmake '((0 . "POINT") (10 0.0 0.0 0.0)))
      (setq marker (entlast))
      (setq index 0)
      (repeat (sslength ss)
        (setq ent (ssname ss index))
        (command "_.EXPLODE" ent "")
        (setq index (1+ index))
      )
      (setq total 0 matched 0 unmatched 0)
      (setq created (entnext marker))
      (while created
        (setq data (entget created))
        (if (= "LINE" (cdr (assoc 0 data)))
          (progn
            (setq total (1+ total))
            (setq color (if (assoc 62 data) (cdr (assoc 62 data)) 256))
            (setq ltype (if (assoc 6 data) (cdr (assoc 6 data)) "BYLAYER"))
            (setq mapping (roadml:find-map color ltype))
            (if mapping
              (progn
                (roadml:ensure-layer (caddr mapping) (car mapping) (cadr mapping))
                (setq data (roadml:set-dxf 8 (caddr mapping) data))
                (entmod data)
                (setq matched (1+ matched))
              )
              (setq unmatched (1+ unmatched))
            )
          )
        )
        (setq created (entnext created))
      )
      (entdel marker)
      (princ (strcat "\nROADML2LAYER: " (itoa total) " line(s), " (itoa matched) " matched, " (itoa unmatched) " unmatched."))
    )
    (princ "\nNo MLINE objects selected.")
  )
  (princ)
)

(princ "\nType ROADML2LAYER to convert selected MLINEs to lines on layers.")
(princ)
`;
}

export function getLispFilename(styleName: string): string {
  const safeName = styleName
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safeBaseName = safeName || "road-style";

  return `${isWindowsReservedDeviceName(safeBaseName) ? `${safeBaseName}_style` : safeBaseName}.lsp`;
}
