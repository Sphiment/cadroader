import { useEffect, useLayoutEffect, useState } from "react";

import type { GuidedValues } from "@/lib/road-style/types";

type GuidedBuilderProps = {
  values: GuidedValues;
  onValuesChange: (values: Partial<GuidedValues>) => void;
  onResetTemplate: () => void;
  onStartFromScratch: () => void;
};

export function GuidedBuilder({
  values,
  onValuesChange,
  onResetTemplate,
  onStartFromScratch,
}: GuidedBuilderProps) {
  const [roadHalfWidthDraft, setRoadHalfWidthDraft] = useState(() =>
    formatNumberInputValue(values.roadHalfWidth)
  );
  const [sidewalkWidthDraft, setSidewalkWidthDraft] = useState(() =>
    formatNumberInputValue(values.sidewalkWidth)
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useLayoutEffect(() => {
    if (Number.isFinite(values.roadHalfWidth)) {
      const nextValue = String(values.roadHalfWidth);
      setRoadHalfWidthDraft(nextValue);
    }
  }, [values.roadHalfWidth]);

  useLayoutEffect(() => {
    if (Number.isFinite(values.sidewalkWidth)) {
      const nextValue = String(values.sidewalkWidth);
      setSidewalkWidthDraft(nextValue);
    }
  }, [values.sidewalkWidth]);

  const updateValue = (key: keyof GuidedValues, value: string) => {
    onValuesChange({ [key]: parseNumberInputValue(value) });
  };

  return (
    <section className="panel guided-panel">
      <div className="panel-heading">
        <p className="eyebrow">Guided Builder</p>
        <h2>Road dimensions</h2>
      </div>
      <p className="helper-copy">
        Enter distances in Drawing Units. Use the same unit scale as your AutoCAD drawing; the MLN stores
        these offsets as unitless numeric values.
      </p>
      <div className="field-grid two-columns">
        <label className="field">
          <span>Road half-width</span>
          <input
            disabled={!isHydrated}
            min="0"
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setRoadHalfWidthDraft(nextValue);
              updateValue("roadHalfWidth", nextValue);
            }}
            step="0.01"
            type="number"
            value={roadHalfWidthDraft}
          />
        </label>
        <label className="field">
          <span>Sidewalk width</span>
          <input
            disabled={!isHydrated}
            min="0"
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setSidewalkWidthDraft(nextValue);
              updateValue("sidewalkWidth", nextValue);
            }}
            step="0.01"
            type="number"
            value={sidewalkWidthDraft}
          />
        </label>
      </div>
      <div className="button-row">
        <button className="button button-secondary" onClick={onResetTemplate} type="button">
          Reset Template
        </button>
        <button className="button button-ghost" onClick={onStartFromScratch} type="button">
          Start From Scratch
        </button>
      </div>
    </section>
  );
}

function formatNumberInputValue(value: number): string {
  return Number.isNaN(value) ? "" : String(value);
}

function parseNumberInputValue(value: string): number {
  return value === "" ? Number.NaN : Number(value);
}
