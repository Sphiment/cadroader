import type { ValidationIssue, ValidationResult } from "@/lib/road-style/types";

type ValidationPanelProps = {
  validation: ValidationResult;
  lispValidation: ValidationResult;
  importError: string | null;
};

function IssueList({ issues, prefix }: { issues: ValidationIssue[]; prefix?: string }) {
  return (
    <ul className="issue-list">
      {issues.map((issue) => (
        <li className="issue error-message" key={`${prefix ?? "issue"}-${issue.field}-${issue.message}`}>
          {prefix ? `${prefix}: ${issue.message}` : issue.message}
        </li>
      ))}
    </ul>
  );
}

export function ValidationPanel({ validation, lispValidation, importError }: ValidationPanelProps) {
  const hasMlnErrors = validation.errors.length > 0;
  const hasLispErrors = lispValidation.errors.length > 0;
  const isReady = !hasMlnErrors && !hasLispErrors;
  const warnings = [...validation.warnings, ...lispValidation.warnings].filter(
    (issue, index, issues) =>
      index === issues.findIndex((candidate) => candidate.field === issue.field && candidate.message === issue.message)
  );

  return (
    <section className={`panel validation-panel ${isReady ? "is-ready" : "has-errors"}`}>
      <div className="panel-heading">
        <p className="eyebrow">Validation</p>
        <h2>{isReady ? "Ready to export" : "Export blockers"}</h2>
      </div>

      {importError ? <p className="validation-message error-message">Import failed: {importError}</p> : null}

      {hasMlnErrors ? (
        <IssueList issues={validation.errors} prefix="MLN" />
      ) : (
        <p className="validation-message ready-message">MLN and JSON exports are available.</p>
      )}

      {hasLispErrors ? (
        <IssueList issues={lispValidation.errors} prefix="LSP" />
      ) : (
        <p className="validation-message ready-message">LSP export is available.</p>
      )}

      <div className="warning-block">
        <h3>Warnings</h3>
        {warnings.length > 0 ? (
          <ul className="issue-list">
            {warnings.map((issue, index) => (
              <li className="issue warning-message" key={`warning-${index}-${issue.field}-${issue.message}`}>
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
