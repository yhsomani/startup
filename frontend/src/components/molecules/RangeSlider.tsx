import React from 'react';
import { cn } from '../../utils/cn';

export interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
    label?: string;
    formatValue?: (val: number) => string;
    className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    value,
    onChange,
    step = 1,
    label,
    formatValue = (v) => v.toString(),
    className,
}) => {
    const minPos = ((value[0] - min) / (max - min)) * 100;
    const maxPos = ((value[1] - min) / (max - min)) * 100;

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = Math.min(Number(e.target.value), value[1] - step);
        onChange([newVal, value[1]]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = Math.max(Number(e.target.value), value[0] + step);
        onChange([value[0], newVal]);
    };

    return (
        <div className={cn('w-full py-4', className)}>
            <div className="flex items-center justify-between mb-4">
                {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
                <div className="flex gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                    <span>{formatValue(value[0])}</span>
                    <span className="text-gray-400">—</span>
                    <span>{formatValue(value[1])}</span>
                </div>
            </div>

            <div className="relative h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full">
                {/* Active track */}
                <div
                    className="absolute h-full bg-indigo-500 rounded-full"
                    style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                />

                {/* Range inputs overlay */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={handleMinChange}
                    className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md"
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[1]}
                    onChange={handleMaxChange}
                    className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md"
                />
            </div>

            <div className="flex justify-between mt-2 px-1">
                <span className="text-[10px] text-gray-400">{formatValue(min)}</span>
                <span className="text-[10px] text-gray-400">{formatValue(max)}</span>
            </div>
        </div>
    );
};
