import React from 'react';
import { DIETARY_OPTIONS } from '../constants';
import { Check } from 'lucide-react';

interface DietarySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const DietarySelector: React.FC<DietarySelectorProps> = ({ selected, onChange }) => {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DIETARY_OPTIONS.map(option => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5
              ${isActive 
                ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'}
            `}
          >
            {isActive && <Check size={12} />}
            {option}
          </button>
        );
      })}
    </div>
  );
};