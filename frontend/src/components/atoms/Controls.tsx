import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import './Controls.css';

// --- Checkbox Component ---
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string | React.ReactNode;
    containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, containerClassName, label, id, disabled, ...props }, ref) => {
        const generatedId = React.useId();
        const checkboxId = id || generatedId;

        return (
            <label
                htmlFor={checkboxId}
                className={cn('checkbox-container', disabled && 'is-disabled', containerClassName)}
            >
                <input
                    type="checkbox"
                    id={checkboxId}
                    ref={ref}
                    className="checkbox-input"
                    disabled={disabled}
                    {...props}
                />
                <div className={cn('checkbox-custom', className)}>
                    <Check strokeWidth={3} className="checkbox-icon" />
                </div>
                {label && <div className="checkbox-label">{label}</div>}
            </label>
        );
    }
);
Checkbox.displayName = 'Checkbox';


// --- Toggle Switch Component ---
export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    containerClassName?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
    ({ className, containerClassName, label, id, disabled, ...props }, ref) => {
        const generatedId = React.useId();
        const toggleId = id || generatedId;

        return (
            <label
                htmlFor={toggleId}
                className={cn('toggle-container', disabled && 'is-disabled', containerClassName)}
            >
                <input
                    type="checkbox"
                    role="switch"
                    id={toggleId}
                    ref={ref}
                    className="toggle-input"
                    disabled={disabled}
                    {...props}
                />
                <div className={cn('toggle-track', className)}>
                    <div className="toggle-thumb" />
                </div>
                {label && <div className="toggle-label">{label}</div>}
            </label>
        );
    }
);
Toggle.displayName = 'Toggle';
