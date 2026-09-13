'use client';

import React from 'react';
import { logoBase64 } from './logoData';

interface BiKanalLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BiKanalLogo: React.FC<BiKanalLogoProps> = ({ size = 'sm', showText = true }) => {
  const isSm = size === 'sm';
  const width = isSm ? 50 : size === 'md' ? 70 : 90;
  const height = isSm ? 50 : size === 'md' ? 70 : 90;

  return (
    <div className="flex flex-col items-center justify-center select-none shrink-0 leading-none">
      <div className="relative flex justify-center items-center" style={{ width, height }}>
        <img
          src={logoBase64}
          alt="Bi Kanal Logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          className="drop-shadow-sm"
        />
      </div>
    </div>
  );
};

