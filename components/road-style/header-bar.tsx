import type { RefObject } from "react";

type HeaderBarProps = {
  styleName: string;
  prefix: string;
  canDownloadJson: boolean;
  canDownloadMln: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onStyleNameChange: (value: string) => void;
  onPrefixChange: (value: string) => void;
  onImportClick: () => void;
  onImportJson: (file: File | null) => void;
  onDownloadJson: () => void;
  onDownloadMln: () => void;
};

export function HeaderBar({
  styleName,
  prefix,
  canDownloadJson,
  canDownloadMln,
  fileInputRef,
  onStyleNameChange,
  onPrefixChange,
  onImportClick,
  onImportJson,
  onDownloadJson,
  onDownloadMln,
}: HeaderBarProps) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <p className="eyebrow">AutoCAD Road Tool</p>
        <h1>Road MLN Generator</h1>
        <p className="brand-copy">Build simple road multiline styles and export AutoCAD .mln files.</p>
      </div>

      <div className="header-controls">
        <label className="field field-compact">
          <span>Style name</span>
          <input
            onChange={(event) => onStyleNameChange(event.target.value)}
            placeholder="ROAD_SIMPLE_URBAN"
            type="text"
            value={styleName}
          />
        </label>
        <label className="field field-compact">
          <span>Future layer prefix</span>
          <input
            onChange={(event) => onPrefixChange(event.target.value)}
            placeholder="GAZIANTEP"
            type="text"
            value={prefix}
          />
        </label>

        <input
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(event) => onImportJson(event.target.files?.[0] ?? null)}
          ref={fileInputRef}
          type="file"
        />
        <div className="button-row header-actions">
          <button className="button button-secondary" onClick={onImportClick} type="button">
            Import JSON
          </button>
          <button
            className="button button-secondary"
            disabled={!canDownloadJson}
            onClick={onDownloadJson}
            type="button"
          >
            Download JSON
          </button>
          <button
            className="button button-primary"
            disabled={!canDownloadMln}
            onClick={onDownloadMln}
            type="button"
          >
            Download MLN
          </button>
        </div>
      </div>
    </header>
  );
}
