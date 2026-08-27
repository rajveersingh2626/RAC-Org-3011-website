import React from 'react';
import logoImg from '../../../20260803_134104_0000.jpg';

export default function DistrictLogo({ size = 'medium', className = '' }) {
  const height = size === 'small' ? 30 : size === 'large' ? 40 : 34;

  return (
    <div 
      className={`district-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        height: `${height}px`
      }}
    >
      <img
        src={logoImg}
        alt="Rotaract District 3011 Logo"
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}
