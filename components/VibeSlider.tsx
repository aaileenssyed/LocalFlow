import React from 'react';

interface VibeSliderProps {
  value: number;
  onChange: (val: number) => void;
}

export const VibeSlider: React.FC<VibeSliderProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full h-12 flex items-center">
      {/* Track */}
      <div className="absolute w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
        <div 
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-500"
            style={{ width: '100%' }}
        />
        <div className="absolute inset-0 bg-black/20" /> {/* Dimmer */}
      </div>

      {/* Input */}
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
      />

      {/* Thumb Indicator (Visual only) */}
      <div 
        className="absolute h-8 w-8 bg-white rounded-full shadow-lg shadow-black/50 border-2 border-zinc-200 z-10 pointer-events-none transition-all duration-75 flex items-center justify-center font-bold text-[10px] text-zinc-900"
        style={{ left: `calc(${value}% - 16px)` }}
      >
        {value}
      </div>
    </div>
  );
};