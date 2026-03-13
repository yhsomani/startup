import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../atoms/Input';
import { cn } from '../../utils/cn';

export interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
    className?: string;
    autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Search...',
    onSearch,
    className,
    autoFocus = false,
}) => {
    const [query, setQuery] = useState('');

    const handleClear = () => {
        setQuery('');
        onSearch?.('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        onSearch?.(e.target.value);
    };

    return (
        <div className={cn('relative w-full max-w-md', className)}>
            <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleChange}
                autoFocus={autoFocus}
                leftIcon={<Search size={18} className="text-gray-400" />}
                rightIcon={
                    query ? (
                        <button
                            onClick={handleClear}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Clear search"
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    ) : null
                }
                className="pr-10 rounded-full bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white focus:border-primary transition-all shadow-sm"
            />
        </div>
    );
};
