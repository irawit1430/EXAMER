"use client";

import React from "react";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SpeedChartsProps {
  speedData: DataPoint[];
  accuracyData: DataPoint[];
  className?: string;
}

function MiniBarChart({
  data,
  maxValue,
  color,
  valueSuffix = "",
}: {
  data: DataPoint[];
  maxValue: number;
  color: string;
  valueSuffix?: string;
}) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const height = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative"
          >
            {/* Tooltip on hover */}
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-surface-900 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity pointer-events-none whitespace-nowrap z-10">
              {d.value.toFixed(1).replace(/\.0$/, "")}
              {valueSuffix}
            </div>
            <div
              className="w-full rounded-t-sm relative bg-surface-100"
              style={{ height: "100%" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t-sm"
                style={{ height: `${height}%` }}
              >
                <div
                  className="absolute inset-0 rounded-t-sm transition-all duration-700 ease-out"
                  style={{
                    background: `linear-gradient(to top, ${color}40, ${color})`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              </div>
            </div>
            <span className="text-[10px] font-medium text-text-muted mt-1 truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function SpeedCharts({
  speedData,
  accuracyData,
  className = "",
}: SpeedChartsProps) {
  const maxSpeed = Math.max(...speedData.map((d) => d.value), 1);
  const maxAccuracy = 100;

  return (
    <div className={`grid grid-cols-2 gap-6 ${className}`}>
      {/* Speed Chart */}
      <div className="flex flex-col">
        <div className="flex flex-col mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-0.5">
            Avg Speed (QPM)
          </p>
          <span className="text-xl font-display font-medium text-text-primary tracking-tight">
            {speedData.length > 0
              ? speedData[speedData.length - 1].value.toFixed(1)
              : "0"}
          </span>
        </div>
        {maxSpeed === 0 && accuracyData.every((d) => d.value === 0) ? (
          <div className="h-24 flex items-center justify-center text-xs font-medium text-text-muted bg-surface-50 rounded-sm border border-border-default border-dashed">
            No recent activity
          </div>
        ) : (
          <MiniBarChart data={speedData} maxValue={maxSpeed} color="#2997ff" />
        )}
      </div>

      {/* Accuracy Chart */}
      <div className="flex flex-col">
        <div className="flex flex-col mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-0.5">
            Accuracy
          </p>
          <span className="text-xl font-display font-medium text-text-primary tracking-tight">
            {accuracyData.length > 0
              ? accuracyData[accuracyData.length - 1].value.toFixed(0)
              : "0"}
            %
          </span>
        </div>
        {maxSpeed === 0 && accuracyData.every((d) => d.value === 0) ? (
          <div className="h-24 flex items-center justify-center text-xs font-medium text-text-muted bg-surface-50 rounded-sm border border-border-default border-dashed">
            No recent activity
          </div>
        ) : (
          <MiniBarChart
            data={accuracyData}
            maxValue={maxAccuracy}
            color="#34c759"
            valueSuffix="%"
          />
        )}
      </div>
    </div>
  );
}
