'use client';

import React from 'react';

interface Snapshot {
  timestamp: string | Date;
  globalLp: number;
  tier: string;
  rank: string;
  leaguePoints: number;
}

interface LPChartProps {
  snapshots: Snapshot[];
}

export default function LPChart({ snapshots }: LPChartProps) {
  if (snapshots.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        No hay datos de progresión disponibles.
      </div>
    );
  }

  // If only 1 snapshot, duplicate it so we can draw a line
  const data = snapshots.length === 1 
    ? [...snapshots, { ...snapshots[0], timestamp: new Date(new Date(snapshots[0].timestamp).getTime() + 3600000).toISOString() }] 
    : snapshots;

  // Find min and max values
  const lpValues = data.map(d => d.globalLp);
  const minLp = Math.min(...lpValues);
  const maxLp = Math.max(...lpValues);
  const lpRange = maxLp - minLp;
  
  // Add some padding to Y-axis range
  let yMin = Math.max(0, minLp - (lpRange > 0 ? lpRange * 0.15 : 50));
  let yMax = maxLp + (lpRange > 0 ? lpRange * 0.15 : 50);

  // Adjust yMin and yMax to make sure we span at least 150 LP (so we always show boundaries)
  if (yMax - yMin < 150) {
    const center = (yMax + yMin) / 2;
    yMin = Math.max(0, center - 75);
    yMax = center + 75;
  }
  const yRange = yMax - yMin;

  const timestamps = data.map(d => new Date(d.timestamp).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime;

  // Chart dimensions (SVG viewBox coordinate system)
  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Helper to map snapshot to (x, y) coordinates
  const getCoordinates = (d: Snapshot, index: number) => {
    const time = new Date(d.timestamp).getTime();
    
    // Scale X (spread evenly if timestamps are identical, otherwise use time scale)
    const x = timeRange > 0 
      ? paddingLeft + ((time - minTime) / timeRange) * chartWidth
      : paddingLeft + (index / (data.length - 1)) * chartWidth;

    // Scale Y (invert since SVG y=0 is top)
    const y = yRange > 0
      ? paddingTop + chartHeight - ((d.globalLp - yMin) / yRange) * chartHeight
      : paddingTop + chartHeight / 2;

    return { x, y };
  };

  const points = data.map((d, i) => getCoordinates(d, i));

  // Generate SVG path strings
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Area path closes at the bottom of the chart
    areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Generate division/tier boundaries in range
  const tiers = [
    { base: 0, prefix: 'I' },
    { base: 400, prefix: 'B' },
    { base: 800, prefix: 'S' },
    { base: 1200, prefix: 'G' },
    { base: 1600, prefix: 'P' },
    { base: 2000, prefix: 'E' },
    { base: 2400, prefix: 'D' },
    { base: 2800, prefix: 'M' }
  ];
  
  const divisions = [0, 100, 200, 300];
  const allThresholds: { value: number; label: string }[] = [];
  
  tiers.forEach(t => {
    if (t.prefix === 'M') {
      allThresholds.push({ value: t.base, label: 'M' });
      for (let lp = 100; lp <= 3000; lp += 100) {
        allThresholds.push({ value: t.base + lp, label: `M ${lp}` });
      }
    } else {
      divisions.forEach((divOffset, idx) => {
        allThresholds.push({
          value: t.base + divOffset,
          label: `${t.prefix}${4 - idx}`
        });
      });
    }
  });

  // Find thresholds in range
  let thresholdsInRange = allThresholds.filter(t => t.value >= yMin && t.value <= yMax);
  
  // Filter thresholds if there are too many to avoid crowding
  if (thresholdsInRange.length > 5) {
    thresholdsInRange = thresholdsInRange.filter((t, idx) => {
      return t.label === 'M' || t.label.endsWith('4') || idx % 2 === 0;
    });
  }
  if (thresholdsInRange.length > 5) {
    thresholdsInRange = thresholdsInRange.filter(t => t.label === 'M' || t.label.endsWith('4') || t.label.startsWith('M '));
  }

  let gridLines: { y: number; label: string; value: number }[] = [];
  
  if (thresholdsInRange.length >= 2) {
    gridLines = thresholdsInRange.map(t => {
      const y = paddingTop + chartHeight - ((t.value - yMin) / yRange) * chartHeight;
      return { y, label: t.label, value: t.value };
    });
  } else {
    // Fallback to even divisions if not enough thresholds (e.g. unranked or very narrow elo)
    const gridLinesCount = 4;
    gridLines = Array.from({ length: gridLinesCount }).map((_, i) => {
      const ratio = i / (gridLinesCount - 1);
      const value = Math.round(yMax - ratio * yRange);
      const y = paddingTop + ratio * chartHeight;
      
      let label = '';
      if (value >= 2800) {
        label = `M ${value - 2800}`;
      } else {
        const t = tiers.slice().reverse().find(tier => value >= tier.base);
        if (t && t.prefix !== 'I') {
          const div = Math.floor((value - t.base) / 100);
          const divNum = Math.min(4, Math.max(1, 4 - div));
          const lp = (value - t.base) % 100;
          label = `${t.prefix}${divNum} ${lp}LP`;
        } else {
          label = `${value} LP`;
        }
      }
      return { y, label, value };
    });
  }

  // Format date helper for X-axis labels
  const formatXLabel = (timeMs: number) => {
    const date = new Date(timeMs);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          {/* Neon Glow Linear Gradient for the Line */}
          <linearGradient id="line-glow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent-cyan)" />
            <stop offset="100%" stopColor="var(--accent-purple)" />
          </linearGradient>

          {/* Area Fill Gradient */}
          <linearGradient id="area-fill-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--bg-obsidian)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={width - paddingRight}
              y2={line.y}
              stroke="var(--border-normal)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Y Axis labels */}
            <text
              x={paddingLeft - 8}
              y={line.y + 4}
              fill="var(--text-muted)"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
            >
              {line.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#area-fill-grad)" />
        )}

        {/* Line plot */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="url(#line-glow-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0, 210, 255, 0.4))' }}
          />
        )}

        {/* Highlight points */}
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill="#ffffff"
            stroke={i === points.length - 1 ? 'var(--accent-cyan)' : 'var(--accent-purple)'}
            strokeWidth="2.5"
            style={{ cursor: 'pointer' }}
          />
        ))}

        {/* X Axis Labels (Draw first and last timestamps) */}
        {points.length > 0 && (
          <g>
            <text
              x={points[0].x}
              y={height - 6}
              fill="var(--text-muted)"
              fontSize="10"
              fontWeight="600"
              textAnchor="start"
            >
              {formatXLabel(timestamps[0])}
            </text>
            
            {points.length > 2 && (
              <text
                x={points[points.length - 1].x}
                y={height - 6}
                fill="var(--text-muted)"
                fontSize="10"
                fontWeight="600"
                textAnchor="end"
              >
                {formatXLabel(timestamps[timestamps.length - 1])}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
