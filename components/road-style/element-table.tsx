import { useEffect, useState } from "react";

import { getFutureLayerName } from "@/lib/road-style/templates";
import { KNOWN_LINETYPES, type RoadStyleElement } from "@/lib/road-style/types";

type ElementTableProps = {
  elements: RoadStyleElement[];
  prefix: string;
  onElementChange: (id: string, patch: Partial<RoadStyleElement>) => void;
  onAddElement: () => void;
  onRemoveElement: (id: string) => void;
};

const COLOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 30, 40, 50, 80, 120, 160, 200, 256];

function formatNumberInputValue(value: number): string {
  return Number.isNaN(value) ? "" : String(value);
}

type OffsetInputProps = {
  elementId: string;
  offset: number;
  onElementChange: (id: string, patch: Partial<RoadStyleElement>) => void;
};

function OffsetInput({ elementId, offset, onElementChange }: OffsetInputProps) {
  const [draft, setDraft] = useState(() => formatNumberInputValue(offset));

  useEffect(() => {
    if (Number.isFinite(offset)) {
      setDraft(String(offset));
    }
  }, [offset]);

  return (
    <input
      aria-label="Element offset"
      onChange={(event) => {
        const value = event.currentTarget.value;
        setDraft(value);
        onElementChange(elementId, { offset: value === "" ? Number.NaN : Number(value) });
      }}
      step="0.01"
      type="number"
      value={draft}
    />
  );
}

export function ElementTable({
  elements,
  prefix,
  onElementChange,
  onAddElement,
  onRemoveElement,
}: ElementTableProps) {
  return (
    <section className="panel element-panel">
      <div className="panel-heading split-heading">
        <div>
          <p className="eyebrow">Advanced</p>
          <h2>Elements</h2>
        </div>
        <button className="button button-primary" onClick={onAddElement} type="button">
          Add element
        </button>
      </div>

      <div className="table-wrap">
        <table className="element-table">
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
                <td data-label="On">
                  <input
                    aria-label={`Enable ${element.name}`}
                    checked={element.enabled}
                    onChange={(event) => onElementChange(element.id, { enabled: event.target.checked })}
                    type="checkbox"
                  />
                </td>
                <td data-label="Name">
                  <input
                    aria-label="Element name"
                    onChange={(event) => onElementChange(element.id, { name: event.target.value })}
                    type="text"
                    value={element.name}
                  />
                </td>
                <td data-label="Offset">
                  <OffsetInput
                    elementId={element.id}
                    offset={element.offset}
                    onElementChange={onElementChange}
                  />
                </td>
                <td data-label="Color">
                  <select
                    aria-label="AutoCAD color index"
                    onChange={(event) => onElementChange(element.id, { color: Number(event.target.value) })}
                    value={element.color}
                  >
                    {COLOR_OPTIONS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Linetype">
                  <select
                    aria-label="Element linetype"
                    onChange={(event) => onElementChange(element.id, { linetype: event.target.value })}
                    value={element.linetype}
                  >
                    {!KNOWN_LINETYPES.some((lt) => lt.toUpperCase() === element.linetype.toUpperCase()) && element.linetype ? (
                      <option value={element.linetype}>{element.linetype}</option>
                    ) : null}
                    {KNOWN_LINETYPES.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="layer-preview" data-label="Future layer">
                  {getFutureLayerName(prefix, element.name) || "UNNAMED"}
                </td>
                <td data-label="Actions">
                  <button
                    className="button button-danger"
                    onClick={() => onRemoveElement(element.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
