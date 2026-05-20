"use client";

import { useMemo, useRef, useState } from "react";

import { CrossSectionPreview } from "./cross-section-preview";
import { ElementTable } from "./element-table";
import { GuidedBuilder } from "./guided-builder";
import { HeaderBar } from "./header-bar";
import { ValidationPanel } from "./validation-panel";
import { generateLisp, getLispFilename, validateLispExport } from "@/lib/road-style/lisp";
import { generateMln, getMlnFilename } from "@/lib/road-style/mln";
import { parseProjectJson, serializeProject } from "@/lib/road-style/project-json";
import { applyGuidedValues, createSimpleUrbanRoadProject } from "@/lib/road-style/templates";
import {
  ROAD_STYLE_SCHEMA_VERSION,
  type GuidedValues,
  type RoadStyleElement,
  type RoadStyleProject,
  UNITS_LABEL,
} from "@/lib/road-style/types";
import { validateProject } from "@/lib/road-style/validation";

function createBlankProject(): RoadStyleProject {
  return {
    schemaVersion: ROAD_STYLE_SCHEMA_VERSION,
    styleName: "ROAD_CUSTOM",
    prefix: "",
    unitsLabel: UNITS_LABEL,
    template: "custom",
    guidedValues: {
      roadHalfWidth: 0,
      sidewalkWidth: 0,
    },
    elements: [],
  };
}

function createCustomElement(index: number): RoadStyleElement {
  return {
    id: `custom-${Date.now()}-${index}`,
    enabled: true,
    name: `Custom Element ${index}`,
    offset: 0,
    color: 7,
    linetype: "CONTINUOUS",
    role: "custom",
  };
}

function downloadTextFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function RoadStyleApp() {
  const [project, setProject] = useState<RoadStyleProject>(() => createSimpleUrbanRoadProject());
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validation = useMemo(() => validateProject(project), [project]);
  const lispValidation = useMemo(() => validateLispExport(project), [project]);
  const canDownloadExport = validation.errors.length === 0;
  const canDownloadLisp = canDownloadExport && lispValidation.errors.length === 0;

  const updateProject = (patch: Partial<RoadStyleProject>) => {
    setProject((currentProject) => ({ ...currentProject, ...patch }));
    setImportError(null);
  };

  const handleGuidedValuesChange = (values: Partial<GuidedValues>) => {
    setProject((currentProject) =>
      applyGuidedValues(currentProject, { ...currentProject.guidedValues, ...values })
    );
    setImportError(null);
  };

  const handleElementChange = (id: string, patch: Partial<RoadStyleElement>) => {
    setProject((currentProject) => ({
      ...currentProject,
      elements: currentProject.elements.map((element) =>
        element.id === id ? { ...element, ...patch } : element
      ),
    }));
    setImportError(null);
  };

  const handleAddElement = () => {
    setProject((currentProject) => ({
      ...currentProject,
      template: "custom",
      elements: [...currentProject.elements, createCustomElement(currentProject.elements.length + 1)],
    }));
    setImportError(null);
  };

  const handleRemoveElement = (id: string) => {
    setProject((currentProject) => ({
      ...currentProject,
      template: "custom",
      elements: currentProject.elements.filter((element) => element.id !== id),
    }));
    setImportError(null);
  };

  const handleResetTemplate = () => {
    setProject(createSimpleUrbanRoadProject());
    setImportError(null);
  };

  const handleStartFromScratch = () => {
    setProject(createBlankProject());
    setImportError(null);
  };

  const handleDownloadJson = () => {
    if (!canDownloadExport) {
      return;
    }

    downloadTextFile(`${project.styleName.trim() || "road-style"}.json`, serializeProject(project), "application/json");
  };

  const handleDownloadMln = () => {
    if (!canDownloadExport) {
      return;
    }

    downloadTextFile(getMlnFilename(project.styleName), generateMln(project), "text/plain");
  };

  const handleDownloadLisp = () => {
    if (!canDownloadLisp) {
      return;
    }

    downloadTextFile(getLispFilename(project.styleName), generateLisp(project), "text/plain");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportJson = (file: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = parseProjectJson(String(reader.result ?? ""));

      if (result.ok) {
        setProject(result.project);
        setImportError(null);
      } else {
        setImportError(result.error);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setImportError("Could not read the selected project file.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="app-shell">
      <HeaderBar
        canDownloadJson={canDownloadExport}
        canDownloadLisp={canDownloadLisp}
        canDownloadMln={canDownloadExport}
        fileInputRef={fileInputRef}
        onDownloadJson={handleDownloadJson}
        onDownloadLisp={handleDownloadLisp}
        onDownloadMln={handleDownloadMln}
        onImportClick={handleImportClick}
        onImportJson={handleImportJson}
        onPrefixChange={(prefix) => updateProject({ prefix })}
        onStyleNameChange={(styleName) => updateProject({ styleName })}
        prefix={project.prefix}
        styleName={project.styleName}
      />

      <div className="builder-grid">
        <div className="left-stack">
          <GuidedBuilder
            onResetTemplate={handleResetTemplate}
            onStartFromScratch={handleStartFromScratch}
            onValuesChange={handleGuidedValuesChange}
            values={project.guidedValues}
          />
          <ValidationPanel importError={importError} lispValidation={lispValidation} validation={validation} />
        </div>
        <CrossSectionPreview elements={project.elements} unitsLabel={project.unitsLabel} />
      </div>

      <ElementTable
        elements={project.elements}
        onAddElement={handleAddElement}
        onElementChange={handleElementChange}
        onRemoveElement={handleRemoveElement}
        prefix={project.prefix}
      />
    </main>
  );
}
