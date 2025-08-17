export default function SizeWiseLogo({ width = 180, height = 60, className = "" }) {
  return (
    <div className={`sizewise-logo ${className}`} style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 180 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Buildings */}
        <g className="buildings">
          {/* Main building */}
          <rect x="25" y="15" width="20" height="30" fill="#6B7280" stroke="#4B5563" strokeWidth="1.5" rx="1"/>
          
          {/* House */}
          <rect x="8" y="25" width="15" height="20" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1.5" rx="1"/>
          {/* House roof */}
          <polygon points="8,25 15.5,18 23,25" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
          
          {/* Tall building */}
          <rect x="47" y="8" width="16" height="37" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1.5" rx="1"/>
          
          {/* Building windows - Main building */}
          <rect x="28" y="20" width="3" height="3" fill="#4B5563"/>
          <rect x="33" y="20" width="3" height="3" fill="#4B5563"/>
          <rect x="38" y="20" width="3" height="3" fill="#4B5563"/>
          <rect x="28" y="26" width="3" height="3" fill="#4B5563"/>
          <rect x="33" y="26" width="3" height="3" fill="#4B5563"/>
          <rect x="38" y="26" width="3" height="3" fill="#4B5563"/>
          <rect x="28" y="32" width="3" height="3" fill="#4B5563"/>
          <rect x="33" y="32" width="3" height="3" fill="#4B5563"/>
          <rect x="38" y="32" width="3" height="3" fill="#4B5563"/>
          
          {/* House window and door */}
          <rect x="11" y="30" width="3" height="3" fill="#6B7280"/>
          <rect x="17" y="35" width="3" height="10" fill="#374151"/>
          
          {/* Tall building windows */}
          <rect x="50" y="13" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="54" y="13" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="57.5" y="13" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="50" y="18" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="54" y="18" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="57.5" y="18" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="50" y="23" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="54" y="23" width="2.5" height="2.5" fill="#6B7280"/>
          <rect x="57.5" y="23" width="2.5" height="2.5" fill="#6B7280"/>
          
          {/* Base platform */}
          <rect x="5" y="45" width="60" height="3" fill="#6B7280" stroke="#4B5563" strokeWidth="1" rx="1.5"/>
        </g>
        
        {/* Cloud/Wind element */}
        <path 
          d="M68 12 Q75 8, 82 12 Q88 8, 95 15 Q90 20, 82 18 Q75 22, 68 18 Q70 15, 68 12 Z" 
          fill="#60A5FA" 
          className="cloud"
        />
        
        {/* Company name */}
        <g className="company-name">
          <text x="8" y="58" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#6B7280">
            SIZEWISE
          </text>
        </g>
      </svg>
    </div>
  );
}
