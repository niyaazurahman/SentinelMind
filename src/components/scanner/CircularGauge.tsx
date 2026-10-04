import React from "react";

interface CircularGaugeProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  label?: string;
  unit?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  size = 72,
  strokeWidth = 6,
  color = "#22d3ee",
  glowColor = "rgba(6, 182, 212, 0.4)",
  label,
  unit = "%",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(30, 41, 59, 0.7)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Glowing Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Numeric Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
          <div className="text-xs font-extrabold text-white leading-none">
            {Math.round(value)}
            <span className="text-[9px] text-slate-400 font-normal">{unit}</span>
          </div>
        </div>
      </div>

      {label && (
        <span className="text-[10px] font-sans font-semibold text-slate-300 mt-1 text-center">
          {label}
        </span>
      )}
    </div>
  );
};
