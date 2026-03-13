import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    className?: string;
}

const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    className,
}) => {
    if (totalPages <= 1) return null;

    const buildPages = () => {
        const totalPageNums = siblingCount * 2 + 5;
        if (totalPages <= totalPageNums) return range(1, totalPages);

        const leftSibling = Math.max(currentPage - siblingCount, 1);
        const rightSibling = Math.min(currentPage + siblingCount, totalPages);

        const showLeft = leftSibling > 2;
        const showRight = rightSibling < totalPages - 1;

        const firstPage = 1;
        const lastPage = totalPages;

        if (!showLeft && showRight) {
            const leftCount = 3 + 2 * siblingCount;
            return [...range(firstPage, leftCount), '...', lastPage];
        }

        if (showLeft && !showRight) {
            const rightCount = 3 + 2 * siblingCount;
            return [firstPage, '...', ...range(totalPages - rightCount + 1, lastPage)];
        }

        return [firstPage, '...', ...range(leftSibling, rightSibling), '...', lastPage];
    };

    const pages = buildPages();

    const btnBase =
        'flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30';

    return (
        <nav
            aria-label="Pagination"
            className={cn('flex items-center gap-1', className)}
        >
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={cn(btnBase, 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed')}
                aria-label="First page"
            >
                <ChevronsLeft size={16} />
            </button>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(btnBase, 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed')}
                aria-label="Previous page"
            >
                <ChevronLeft size={16} />
            </button>

            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
                        …
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(Number(page))}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={cn(
                            btnBase,
                            currentPage === page
                                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        )}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(btnBase, 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed')}
                aria-label="Next page"
            >
                <ChevronRight size={16} />
            </button>
            <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={cn(btnBase, 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed')}
                aria-label="Last page"
            >
                <ChevronsRight size={16} />
            </button>
        </nav>
    );
};
