import type { ReactNode } from 'react';

export interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: ReactNode;
}

export function CircularProgress({
  percentage,
  size = 300,
  strokeWidth = 4,
  color = '#c9a227',
  children
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track - linha fina e discreta */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(74, 64, 53, 0.3)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc - sólido e limpo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-linear"
        />
      </svg>

      {/* Conteudo central */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
