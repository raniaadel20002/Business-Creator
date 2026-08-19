import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert string[] to SelectOption[] if needed
  const formattedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find selected option label
  const selectedOption = formattedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      dir="rtl"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-surface border rounded-xl text-right text-sm outline-none transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 shadow-soft'
            : 'border-border hover:border-primary/40 hover:shadow-sm'
        }`}
      >
        <span className={value ? 'text-text-primary font-medium' : 'text-text-muted'}>
          {displayLabel}
        </span>
        <ChevronDown
          size={18}
          className={`text-text-muted transition-transform duration-250 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-surface border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="py-1">
            {formattedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-right text-sm transition-colors duration-150 ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={16} className="text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
