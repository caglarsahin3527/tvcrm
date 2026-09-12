'use client';

import React from 'react';

interface BiKanalLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BiKanalLogo: React.FC<BiKanalLogoProps> = ({ size = 'sm', showText = true }) => {
  const isSm = size === 'sm';
  const width = isSm ? 44 : size === 'md' ? 56 : 76;
  const height = isSm ? 32 : size === 'md' ? 42 : 56;

  return (
    <div className="flex flex-col items-center select-none shrink-0 leading-none">
      {/* 3D Box Logo */}
      <div className="relative">
        <svg
          width={width}
          height={height}
          viewBox="0 0 76 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            <linearGradient id="navBoxGradFront" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7A3D" />
              <stop offset="60%" stopColor="#F54A00" />
              <stop offset="100%" stopColor="#D83600" />
            </linearGradient>
            <linearGradient id="navBoxGradTop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFA070" />
              <stop offset="100%" stopColor="#FF7A3D" />
            </linearGradient>
            <linearGradient id="navBoxGradSide" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#BA2E00" />
              <stop offset="100%" stopColor="#8A2000" />
            </linearGradient>
            <filter id="navGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f54a00" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 3D Isometric / Slanted Box */}
          <g filter="url(#navGlow)">
            {/* Top bevel */}
            <path d="M 22 10 L 32 4 L 58 4 L 48 10 Z" fill="url(#navBoxGradTop)" />
            {/* Right dark side */}
            <path d="M 48 10 L 58 4 L 58 38 L 48 44 Z" fill="url(#navBoxGradSide)" />
            {/* Front main face */}
            <rect x="18" y="10" width="30" height="34" rx="4" fill="url(#navBoxGradFront)" />
            {/* Subtle inner reflection */}
            <path d="M 20 12 L 46 12 L 46 18 L 20 22 Z" fill="#ffffff" fillOpacity="0.22" rx="2" />
            
            {/* B! Text */}
            <text
              x="33"
              y="35"
              fill="#ffffff"
              fontSize="24"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
            >
              B!
            </text>
          </g>
        </svg>
      </div>

      {/* KANAL Text Below */}
      {showText && (
        <span
          className={`font-black tracking-[0.2em] text-slate-900 uppercase font-sans ${
            isSm ? 'text-[8px] -mt-0.5' : 'text-[11px] -mt-1'
          }`}
        >
          KANAL
        </span>
      )}
    </div>
  );
};
