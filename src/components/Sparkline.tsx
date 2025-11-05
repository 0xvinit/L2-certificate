import React from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export default function Sparkline({ data, width = 160, height = 40, stroke = "#4A70A9", fill = "rgba(143,171,212,0.35)" }: SparklineProps) {
  if (!data || data.length === 0) return null;
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const dx = width / (data.length - 1 || 1);
  const points = data.map((d, i) => {
    const x = i * dx;
    const y = height - ((d - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  });

  const path = `M ${points[0]} L ${points.slice(1).join(" ")}`;
  const area = `M 0,${height} L ${points.join(" ")} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}



