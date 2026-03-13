import React from 'react';
import { cn } from '../../utils/cn';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            containerClassName,
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            id,
            ...props
        },
        ref
    ) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        return (
            <div className={cn('input-wrapper', containerClassName)}>
                {label && (
                    <label htmlFor={inputId} className="input-label">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="input-field-container">
                    {leftIcon && (
                        <div className="input-icon input-icon-left">{leftIcon}</div>
                    )}

                    <input
                        id={inputId}
                        ref={ref}
                        className={cn(
                            'input-field',
                            error && 'has-error',
                            leftIcon && 'has-left-icon',
                            rightIcon && 'has-right-icon',
                            className
                        )}
                        {...props}
                    />

                    {rightIcon && (
                        <div className="input-icon input-icon-right">{rightIcon}</div>
                    )}
                </div>

                {error && <p className="input-error-msg">{error}</p>}
                {!error && helperText && <p className="input-helper-msg">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
