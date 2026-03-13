import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Option {
    label: string;
    value: string;
}

export interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
    label,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(v => v !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const removeOption = (e: React.MouseEvent, value: string) => {
        e.stopPropagation();
        onChange(selected.filter(v => v !== value));
    };

    const selectedLabels = options
        .filter(opt => selected.includes(opt.value))
        .map(opt => opt.label);

    return (
        <div className={cn('relative w-full', className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex flex-wrap items-center gap-1.5 px-3 py-2 min-h-[42px] w-full border rounded-xl bg-white dark:bg-slate-900 cursor-pointer transition-all',
                    isOpen ? 'border-primary ring-2 ring-primary/20 shadow-sm' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                )}
            >
                {selected.length === 0 ? (
                    <span className="text-sm text-gray-400">{placeholder}</span>
                ) : (
                    <div className="flex flex-wrap gap-1.5 flex-1">
                        {selectedLabels.map((label, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-md border border-indigo-100 dark:border-indigo-800/50"
                            >
                                {label}
                                <X size={10} className="hover:text-indigo-900 cursor-pointer" onClick={(e) => removeOption(e, selected[idx])} />
                            </span>
                        ))}
                    </div>
                )}
                <ChevronDown size={16} className={cn('text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="p-1.5 space-y-0.5">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => toggleOption(option.value)}
                                className={cn(
                                    'flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors',
                                    selected.includes(option.value)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                )}
                            >
                                <span>{option.label}</span>
                                {selected.includes(option.value) && <Check size={14} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
