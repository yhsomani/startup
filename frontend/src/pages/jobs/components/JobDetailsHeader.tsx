import React from 'react';
import { Building2, MapPin, Clock, IndianRupee, Bookmark, Share2 } from 'lucide-react';
import { Button } from '../../../components/atoms/Button';
import { Typography } from '../../../components/atoms/Typography';

export interface JobDetailsHeaderProps {
    title: string;
    companyName: string;
    location: string;
    type: string;
    salaryRange: string;
    onApplyClick: () => void;
}

export const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({ title, companyName, location, type, salaryRange, onApplyClick }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex gap-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-slate-700">
                        <Building2 className="text-gray-400" size={32} />
                    </div>
                    <div>
                        <Typography variant="h3" className="mb-2">
                            {title}
                        </Typography>
                        <Typography variant="h6" weight="normal" className="text-gray-600 dark:text-gray-400 mb-4">
                            {companyName}
                        </Typography>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1.5"><MapPin size={16} /> {location}</span>
                            <span className="flex items-center gap-1.5"><Clock size={16} /> {type}</span>
                            <span className="flex items-center gap-1.5"><IndianRupee size={16} /> {salaryRange}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-stretch md:items-end gap-3 min-w-[140px]">
                    <Button size="lg" onClick={onApplyClick} className="w-full md:w-auto">
                        Apply Now
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="flex-1" aria-label="Save Job">
                            <Bookmark size={18} />
                        </Button>
                        <Button variant="outline" size="icon" className="flex-1" aria-label="Share Job">
                            <Share2 size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
