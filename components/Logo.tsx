import React from 'react';

export const SnixLogo = ({ className = "w-24 h-24" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
         <defs>
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <linearGradient id="tech-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FFFF" />
                <stop offset="100%" stopColor="#0088AA" />
            </linearGradient>
        </defs>
        
         <g filter="url(#neon-glow)">
            <path d="M85 20 H45 L35 30 V45 L45 50 H75 L85 60 V80 L75 90 H35" 
                  stroke="url(#tech-grad)" strokeWidth="6" strokeLinecap="square" strokeLinejoin="bevel" fill="none" />
            
            <path d="M48 28 H82" stroke="#00FFFF" strokeWidth="1.5" opacity="0.7"/>
            <path d="M38 82 H72" stroke="#00FFFF" strokeWidth="1.5" opacity="0.7"/>
            <path d="M35 30 L45 30" stroke="#00FFFF" strokeWidth="1.5" opacity="0.7"/>
            
            <rect x="31" y="26" width="7" height="7" fill="#050A14" stroke="#00FFFF" strokeWidth="2"/>
            <rect x="82" y="56" width="7" height="7" fill="#050A14" stroke="#00FFFF" strokeWidth="2"/>
            <rect x="71" y="86" width="7" height="7" fill="#00FFFF"/>

            <path d="M50 50 L70 50" stroke="#FFFFFF" strokeWidth="2" />
         </g>
         
         <circle cx="20" cy="85" r="2" fill="#00FFFF" opacity="0.8">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
         </circle>
         <circle cx="90" cy="15" r="2" fill="#00FFFF" opacity="0.8">
            <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
         </circle>
    </svg>
);