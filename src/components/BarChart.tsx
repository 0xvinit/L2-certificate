import React from "react";

type BarChartProps = {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  barColor?: string;
};

export default function BarChart({ data, labels = [], width = 240, height = 80, barColor = "#8FABD4" }: BarChartProps) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data);
  const gap = 6;
  const barW = Math.floor((width - gap * (data.length + 1)) / data.length);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {data.map((d, i) => {
        const h = Math.round((d / max) * (height - 16));
        const x = gap + i * (barW + gap);
        const y = height - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx={3} fill={barColor} />
          </g>
        );
      })}
    </svg>
  );
}



