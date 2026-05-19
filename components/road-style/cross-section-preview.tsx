import type { RoadStyleElement } from "@/lib/road-style/types";

type CrossSectionPreviewProps = {
  elements: RoadStyleElement[];
  unitsLabel: string;
};

const COLOR_MAP: Record<number, string> = {
  1: "#ff5a5f",
  2: "#ffd166",
  3: "#5ce36f",
  4: "#38d7ff",
  5: "#5294ff",
  6: "#d782ff",
  7: "#f8fafc",
  8: "#94a3b8",
};

function getStrokeColor(color: number): string {
  return COLOR_MAP[color] ?? "#46d9c4";
}

function getDashArray(linetype: string): string | undefined {
  const normalized = linetype.trim().toUpperCase();

  if (normalized === "CENTER") {
    return "14 6 3 6";
  }

  if (normalized === "DASHED" || normalized === "HIDDEN") {
    return "8 6";
  }

  return undefined;
}

export function CrossSectionPreview({ elements, unitsLabel }: CrossSectionPreviewProps) {
  const enabledElements = elements
    .filter((element) => element.enabled && Number.isFinite(element.offset))
    .sort((a, b) => a.offset - b.offset);
  const maxOffset = Math.max(1, ...enabledElements.map((element) => Math.abs(element.offset)));
  const width = 860;
  const height = 320;
  const centerX = width / 2;
  const baselineY = 188;
  const scale = (width - 120) / (maxOffset * 2);

  return (
    <section className="panel preview-panel">
      <div className="panel-heading split-heading">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>Cross-section</h2>
        </div>
        <span className="units-pill">{unitsLabel}</span>
      </div>
      <div className="svg-frame">
        <svg aria-label="Road cross-section preview" className="cross-section-svg" viewBox={`0 0 ${width} ${height}`}>
          <title>Road cross-section preview</title>
          <desc>{enabledElements.map((element) => `${element.name}: ${formatOffset(element.offset)}`).join(" ")}</desc>
          <line className="preview-axis" x1="40" x2={width - 40} y1={baselineY} y2={baselineY} />
          <line className="preview-centerline" x1={centerX} x2={centerX} y1="42" y2={height - 42} />
          <text className="preview-center-label" textAnchor="middle" x={centerX} y="30">
            Centerline 0
          </text>

          {enabledElements.map((element, index) => {
            const x = centerX + element.offset * scale;
            const labelY = 74 + (index % 3) * 34;

            return (
              <g key={element.id}>
                <line
                  stroke={getStrokeColor(element.color)}
                  strokeDasharray={getDashArray(element.linetype)}
                  strokeLinecap="round"
                  strokeWidth="4"
                  x1={x}
                  x2={x}
                  y1="62"
                  y2={height - 58}
                />
                <circle cx={x} cy={baselineY} fill={getStrokeColor(element.color)} r="5" />
                <path className="preview-label-line" d={`M ${x} 62 L ${x} ${labelY + 8}`} />
                <text className="preview-label" textAnchor="middle" x={x} y={labelY}>
                  {element.name}
                </text>
                <text className="preview-offset" textAnchor="middle" x={x} y={labelY + 17}>
                  {element.offset.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function formatOffset(offset: number): string {
  return String(Number(offset.toFixed(2)));
}
