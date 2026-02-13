
import React from 'react';

export const COLORS = {
  primary: '#D4145A', // Amira Arts Pink
  secondary: '#1A1A1A',
  accent: '#F2C94C',
  bg: '#FCFCFC',
  border: '#E0E0E0'
};

export const LOGO = (
  <div className="flex items-center gap-3 select-none">
    <img 
      src="./components/Logos/AmiraArts-logo.png" 
      alt="Amira Arts Gallery 2026" 
      className="h-12 w-auto object-contain block"
      onError={(e) => {
        // Fallback in case image is missing or failing to load
        const target = e.currentTarget;
        const parent = target.parentElement;
        if (parent) {
          target.style.display = 'none';
          // Check if we already added fallback to prevent infinite loop
          if (!parent.querySelector('.logo-fallback')) {
            const fallback = document.createElement('div');
            fallback.className = 'logo-fallback flex items-center gap-2';
            fallback.innerHTML = `
              <div class="w-8 h-8 bg-[#D4145A] rounded-[4px] flex items-center justify-center">
                <span class="text-white font-bold text-xs">AA</span>
              </div>
              <div class="flex flex-col leading-none">
                <span class="text-xl font-bold tracking-tight text-[#1A1A1A]">Amira Arts</span>
                <span class="text-[10px] uppercase tracking-[0.2em] text-[#D4145A] font-semibold">Gallery</span>
              </div>
            `;
            parent.appendChild(fallback);
          }
        }
      }}
    />
  </div>
);
