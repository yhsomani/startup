import React from 'react';
import { cn } from '../../utils/cn';

type VariantType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'overline' | 'label';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
    variant?: VariantType;
    as?: React.ElementType;
    weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    align?: 'left' | 'center' | 'right' | 'justify';
    color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'white' | 'inherit';
    truncate?: boolean;
}

const variantMapping: Record<VariantType, React.ElementType> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    subtitle1: 'h6',
    subtitle2: 'h6',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span',
    label: 'span',
};

const variantClasses: Record<VariantType, string> = {
    h1: 'text-5xl sm:text-7xl text-cinematic mb-0 transition-all duration-500',
    h2: 'text-4xl sm:text-5xl text-cinematic mb-0 transition-all duration-500',
    h3: 'text-3xl sm:text-4xl text-cinematic mb-0 transition-all duration-500',
    h4: 'text-2xl sm:text-3xl text-cinematic mb-0 transition-all duration-500',
    h5: 'text-xl sm:text-2xl text-cinematic mb-0 transition-all duration-500',
    h6: 'text-lg sm:text-xl text-cinematic mb-0 transition-all duration-500',
    subtitle1: 'text-base font-black italic uppercase tracking-[0.2em]',
    subtitle2: 'text-sm font-black italic uppercase tracking-[0.2em]',
    body1: 'text-base font-medium leading-relaxed italic',
    body2: 'text-sm font-medium leading-relaxed italic',
    caption: 'text-xs font-black uppercase tracking-[0.3em] italic',
    overline: 'text-[9px] font-black uppercase tracking-[0.4em] italic',
    label: 'text-[10px] font-black uppercase tracking-[0.4em] italic',
};

const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-black',
};

const colorClasses = {
    primary: 'text-[var(--color-text-primary)]',
    secondary: 'text-[var(--color-text-secondary)] shadow-none',
    tertiary: 'text-[var(--color-text-tertiary)] shadow-none',
    error: 'text-[var(--color-error)]',
    success: 'text-[var(--color-success)]',
    white: 'text-white',
    accent: 'text-[var(--color-secondary)]',
    purple: 'text-[var(--color-primary)]',
    inherit: 'text-inherit',
};

const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
};

export const Typography: React.FC<TypographyProps> = ({
    variant = 'body1',
    as,
    weight,
    align = 'left',
    color = 'primary',
    truncate = false,
    className,
    children,
    ...props
}) => {
    const Component = as || variantMapping[variant];

    return (
        <Component
            className={cn(
                variantClasses[variant],
                weight && weightClasses[weight],
                alignClasses[align],
                colorClasses[color],
                truncate && 'truncate',
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
};
