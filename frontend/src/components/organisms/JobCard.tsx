import React from 'react';
import { MapPin, Building2, Clock, IndianRupee } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Typography } from '../atoms/Typography';
import { cn } from '../../utils/cn';

export interface JobCardProps {
    id: string;
    title: string;
    companyName: string;
    companyLogo?: string;
    location: string;
    type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
    salary?: string;
    postedAt: string;
    tags?: string[];
    isApplied?: boolean;
    onApply?: (id: string) => void;
    onClick?: (id: string) => void;
    className?: string;
}

export const JobCard: React.FC<JobCardProps> = ({
    id,
    title,
    companyName,
    companyLogo,
    location,
    type,
    salary,
    postedAt,
    tags = [],
    isApplied = false,
    onApply,
    onClick,
    className,
}) => {
    return (
        <div
            className={cn(
                "bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 hover:shadow-md transition-all cursor-pointer group",
                className
            )}
            onClick={() => onClick?.(id)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-slate-700 overflow-hidden">
                        {companyLogo ? (
                            <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="text-gray-400" size={24} />
                        )}
                    </div>

                    <div>
                        <Typography variant="h6" className="group-hover:text-primary transition-colors">
                            {title}
                        </Typography>
                        <Typography variant="body2" color="secondary" className="mt-1">
                            {companyName}
                        </Typography>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {location}</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} /> {type}</span>
                            {salary && <span className="flex items-center gap-1.5"><IndianRupee size={14} /> {salary}</span>}
                            <span className="text-gray-400 dark:text-gray-500 ml-auto text-xs">{postedAt}</span>
                        </div>
                    </div>
                </div>

                {/* Actions inside card top-right */}
                <div onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant={isApplied ? "outline" : "primary"}
                        size="sm"
                        disabled={isApplied}
                        onClick={() => onApply?.(id)}
                    >
                        {isApplied ? 'Applied' : 'Apply Now'}
                    </Button>
                </div>
            </div>

            {tags.length > 0 && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex-wrap">
                    {tags.map((tag, idx) => (
                        <Badge key={idx} variant="neutral" size="sm">
                            {tag}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
};
