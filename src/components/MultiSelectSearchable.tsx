import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, CheckSquare, Square } from 'lucide-react';
import { cn } from '../lib/utils';

interface MultiSelectSearchableProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const MultiSelectSearchable: React.FC<MultiSelectSearchableProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  className,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return value[0];
    return `${value.length} selezionati`;
  };

  return (
    <div className={cn("relative", label ? "space-y-2" : "", isOpen ? "z-50" : "z-10", className)} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          {label}
        </label>
      )}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white border border-slate-200 hover:bg-slate-50 focus-within:bg-white focus-within:border-blue-500 outline-none transition-all font-medium text-slate-700 cursor-pointer flex items-center justify-between group shadow-sm",
          compact ? "px-4 py-2.5 rounded-xl text-sm h-[42px]" : "px-6 py-4 rounded-2xl h-[58px]",
          isOpen && "bg-white border-blue-500 ring-2 ring-blue-500/20"
        )}
      >
        <span className={cn("truncate", value.length === 0 && "text-slate-400")}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-2">
          {value.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180 text-blue-500"
          )} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = value.includes(option);
                return (
                  <div
                    key={`${option}-${index}`}
                    onClick={(e) => toggleOption(option, e)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="break-words flex-1">{option}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-slate-500">Nessun risultato trovato</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
