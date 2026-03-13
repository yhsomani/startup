import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AvatarProps {
    src?: string;
    alt?: string;
    initials?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onClick?: () => void;
}

const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl',
};

const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32,
    xl: 48,
};

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'User avatar',
    initials,
    size = 'md',
    className,
    onClick,
}) => {
    const [imageError, setImageError] = useState(false);

    const containerClasses = cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200 text-gray-600 font-semibold flex-shrink-0',
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
    );

    if (src && !imageError) {
        return (
            <div className={containerClasses} onClick={onClick}>
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            </div>
        );
    }

    return (
        <div className={containerClasses} onClick={onClick}>
            {initials ? (
                <span>{initials.substring(0, 2).toUpperCase()}</span>
            ) : (
                <User size={iconSizes[size]} />
            )}
        </div>
    );
};
