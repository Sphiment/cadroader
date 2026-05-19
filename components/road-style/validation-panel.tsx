import type { ValidationResult } from "@/lib/road-style/types";

type ValidationPanelProps = {
  validation: ValidationResult;
  importError: string | null;
};

export function ValidationPanel({ validation, importError }: ValidationPanelProps) {
  const isReady = validation.errors.length === 0;

  return (
    <section className={`panel validation-panel ${isReady ? "is-ready" : "has-errors"}`}>
      <div className="panel-heading">
        <p className="eyebrow">Validation</p>
        <h2>{isReady ? "Ready to export" : "Export blockers"}</h2>
      </div>

      {importError ? <p className="validation-message error-message">Import failed: {importError}</p> : null}

      {isReady ? (
        <p className="validation-message ready-message">No blocking issues. MLN export is available.</p>
      ) : (
        <ul className="issue-list">
          {validation.errors.map((issue) => (
            <li className="issue error-message" key={`${issue.field}-${issue.message}`}>
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      <div className="warning-block">
        <h3>Warnings</h3>
        {validation.warnings.length > 0 ? (
          <ul className="issue-list">
            {validation.warnings.map((issue) => (
              <li className="issue warning-message" key={`${issue.field}-${issue.message}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="validation-message muted-message">No warnings.</p>
        )}
      </div>
    </section>
  );
}
