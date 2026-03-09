
import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Traçado da folha principal esquerda */}
      <path 
        d="M50 85C50 85 32 78 20 60C8 42 10 25 10 25C10 25 28 22 42 35C56 48 60 65 60 65" 
        stroke={color} 
        strokeWidth="7" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Curva superior direita */}
      <path 
        d="M48 28C48 28 65 15 85 18C105 21 95 45 95 45" 
        stroke={color} 
        strokeWidth="7" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Curva inferior direita */}
      <path 
        d="M68 45C68 45 78 35 88 38C98 41 90 60 90 60C90 60 75 75 55 85" 
        stroke={color} 
        strokeWidth="7" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
