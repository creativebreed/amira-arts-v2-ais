"use client";

import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle, label, description }) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 pr-4">
        <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D4145A] focus:ring-offset-2 ${
          enabled ? 'bg-[#D4145A]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
