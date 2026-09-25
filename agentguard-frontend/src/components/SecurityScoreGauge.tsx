import React from 'react';

interface Props {
  score: number;
  size?: number;
}

export const SecurityScoreGauge: React.FC<Props> = ({ score, size = 88 }) => {
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#35B77A' : score >= 60 ? '#D6A84F' : '#E06A62';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#2A2A2A" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="40" y="44" textAnchor="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="Inter">
          {score}
        </text>
      </svg>
      <div className="text-[11px] text-[#6F6F6F] text-center">Security Score</div>
    </div>
  );
};
