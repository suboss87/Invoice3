import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  hideTagline?: boolean;
}

const Logo = ({ 
  size = 'md', 
  variant = 'full', 
  className = '',
  hideTagline = false
}: LogoProps) => {
  // Size mapping
  const iconSizes = {
    sm: { size: 20, container: 'h-7 w-7' },
    md: { size: 24, container: 'h-8 w-8' },
    lg: { size: 32, container: 'h-10 w-10' },
  };
  
  const textSizes = {
    sm: 'text-base tracking-tight',
    md: 'text-lg tracking-tight',
    lg: 'text-xl tracking-tight',
  };
  
  const iconSize = iconSizes[size];
  const textSize = textSizes[size];

  // Professional logo combining document and scales of justice for legal contract analysis
  const ProfessionalLegalLogo = ({ size }: { size: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      {/* Rounded square background with professional gradient */}
      <rect width="24" height="24" rx="5" fill="url(#blue_gradient)" />
      
      {/* Document base with folded corner */}
      <path 
        d="M6 5C6 4.44772 6.44772 4 7 4H14.5L18 7.5V19C18 19.5523 17.5523 20 17 20H7C6.44772 20 6 19.5523 6 19V5Z" 
        fill="#FFFFFF" 
        filter="drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.05))"
      />
      <path 
        d="M14.5 4V7.5H18L14.5 4Z" 
        fill="#E6EFFF" 
      />
      
      {/* Document lines */}
      <rect x="8" y="9.5" width="8" height="0.75" rx="0.375" fill="#2563EB" opacity="0.7" />
      <rect x="8" y="12" width="8" height="0.75" rx="0.375" fill="#2563EB" opacity="0.7" />
      <rect x="8" y="14.5" width="5" height="0.75" rx="0.375" fill="#2563EB" opacity="0.7" />
      
      {/* Scales of justice overlay - subtle indication of legal focus */}
      <path 
        d="M12 8.5V10.5M9 10.5H15M9 10.5C9 11.5 9.75 12.5 11 12.5M15 10.5C15 11.5 14.25 12.5 13 12.5" 
        stroke="#2563EB" 
        strokeWidth="0.75" 
        strokeLinecap="round" 
        strokeOpacity="0.9"
      />
      
      {/* Checkmark indicating analysis/approval */}
      <path 
        d="M10 17L11.5 18.5L14.5 15.5" 
        stroke="#2563EB" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="blue_gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
    </svg>
  );

  // Icon only
  if (variant === 'icon') {
    return (
      <div className={className}>
        <div className={`${iconSize.container} flex items-center justify-center`}>
          <ProfessionalLegalLogo size={iconSize.size} />
        </div>
      </div>
    );
  }

  // Text only
  if (variant === 'text') {
    return (
      <div className={className}>
        <span className={`font-semibold ${textSize}`}>
          <span className="text-gray-800">Invoice</span><span className="text-blue-600">³</span>
        </span>
        {!hideTagline && (
          <div className="text-xs text-slate-500 mt-0.5">
            AI-Powered Invoice Processing
          </div>
        )}
      </div>
    );
  }

  // Full logo (icon + text)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${iconSize.container} flex items-center justify-center`}>
        <ProfessionalLegalLogo size={iconSize.size} />
      </div>
      <span className={`font-semibold ${textSize}`}>
        <span className="text-gray-800">Invoice</span><span className="text-blue-600">³</span>
      </span>
    </div>
  );
};

export default Logo;