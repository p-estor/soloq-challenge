import React from 'react';

interface TierIconProps {
  tier: string;
  className?: string;
  size?: number;
}

export default function TierIcon({ tier, className = '', size = 32 }: TierIconProps) {
  const normTier = tier.toUpperCase();

  // Color mappings for SVGs
  const tierColors: Record<string, { primary: string; secondary: string; glow: string }> = {
    CHALLENGER: { primary: '#f1c40f', secondary: '#f39c12', glow: '#f5b041' },
    GRANDMASTER: { primary: '#e74c3c', secondary: '#c0392b', glow: '#ec7063' },
    MASTER: { primary: '#9b59b6', secondary: '#8e44ad', glow: '#af7ac5' },
    DIAMOND: { primary: '#5dade2', secondary: '#2980b9', glow: '#85c1e9' },
    EMERALD: { primary: '#2ecc71', secondary: '#27ae60', glow: '#58d68d' },
    PLATINUM: { primary: '#a3d3c9', secondary: '#16a085', glow: '#a2d9ce' },
    GOLD: { primary: '#f4d03f', secondary: '#d4ac0d', glow: '#f7dc6f' },
    SILVER: { primary: '#bdc3c7', secondary: '#95a5a6', glow: '#d5dbdb' },
    BRONZE: { primary: '#d35400', secondary: '#a04000', glow: '#dc7633' },
    IRON: { primary: '#7f8c8d', secondary: '#5d6d7e', glow: '#a6acaf' },
    UNRANKED: { primary: '#4d5656', secondary: '#2c3e50', glow: '#7f8c8d' },
  };

  const colors = tierColors[normTier] || tierColors.UNRANKED;

  // Render a beautiful, custom geometric SVG shield for the tier
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: `drop-shadow(0 0 4px ${colors.glow}40)`,
      }}
    >
      {/* Outer Glow Shield */}
      <path
        d="M32 4L54 14V34C54 45.5 44.5 54 32 58C19.5 54 10 45.5 10 34V14L32 4Z"
        fill={`url(#glow-grad-${normTier})`}
        opacity="0.15"
      />
      {/* Outer Border */}
      <path
        d="M32 6L51 14.8V32.8C51 42.8 42.8 50.2 32 53.8C21.2 50.2 13 42.8 13 32.8V14.8L32 6Z"
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner Shield */}
      <path
        d="M32 9L48 16.5V31.5C48 40 41.2 46.2 32 49.3C22.8 46.2 16 40 16 31.5V16.5L32 9Z"
        fill={`url(#shield-grad-${normTier})`}
        stroke={colors.secondary}
        strokeWidth="1.5"
      />
      {/* Accent Insignia (Wings / V-shape) */}
      <path
        d="M24 24L32 30L40 24"
        stroke={colors.primary}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 20L32 29L44 20"
        stroke={colors.glow}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Core Center Gem */}
      <polygon
        points="32,26 36,32 32,38 28,32"
        fill={colors.primary}
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.9"
      />

      {/* Gradients */}
      <defs>
        <linearGradient id={`shield-grad-${normTier}`} x1="32" y1="9" x2="32" y2="49.3" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
          <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`glow-grad-${normTier}`} x1="32" y1="4" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colors.glow} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
      </defs>
    </svg>
  );
}
