import React from 'react';
import { Calendar, Globe, Users } from 'lucide-react';
import { Typography } from '../../../components/atoms/Typography';
import { Badge } from '../../../components/atoms/Badge';

export interface JobDetailsSidebarProps {
    postedAt: string;
    location: string;
    experience: string;
    tags: string[];
}

export const JobDetailsSidebar: React.FC<JobDetailsSidebarProps> = ({ postedAt, location, experience, tags }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <Typography variant="h6" className="mb-4">
                Job Overview
            </Typography>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <Calendar className="text-gray-400 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Posted Date</p>
                        <p className="text-sm text-gray-500">{postedAt}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Globe className="text-gray-400 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                        <p className="text-sm text-gray-500">{location}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Users className="text-gray-400 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Experience</p>
                        <p className="text-sm text-gray-500">{experience}</p>
                    </div>
                </div>
            </div>

            <hr className="my-6 border-gray-100 dark:border-slate-800" />

            <Typography variant="h6" className="mb-4">
                Skills Attached
            </Typography>
            <div className="flex gap-2 flex-wrap">
                {tags.map(tag => (
                    <Badge key={tag} variant="neutral">{tag}</Badge>
                ))}
            </div>
        </div>
    );
};
