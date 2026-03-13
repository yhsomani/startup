import React from 'react';
import { Briefcase } from 'lucide-react';
import { Typography } from '../../../components/atoms/Typography';
import { Button } from '../../../components/atoms/Button';

export interface ProfileExperienceProps {
    isEditing: boolean;
}

export const ProfileExperience: React.FC<ProfileExperienceProps> = ({ isEditing }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <Typography variant="h5" className="flex items-center gap-2"><Briefcase size={20} className="text-primary" /> Experience</Typography>
                {isEditing && <Button variant="ghost" size="sm" className="h-8 text-xs">+ Add Experience</Button>}
            </div>

            <div className="space-y-6">
                <div className="relative pl-6 border-l-2 border-gray-100 dark:border-slate-800">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-white dark:ring-slate-900" />
                    <Typography variant="h6">Senior Software Engineer</Typography>
                    <Typography variant="body2" color="secondary" className="mb-2">Google • Full-time • 2023 - Present</Typography>
                    <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                        Currently working on the next generation of cloud productivity tools. Lead developer for the user interaction framework.
                    </Typography>
                </div>
                <div className="relative pl-6 border-l-2 border-gray-100 dark:border-slate-800 opacity-60">
                    <div className="absolute w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full -left-[7px] top-1.5 ring-4 ring-white dark:ring-slate-900" />
                    <Typography variant="h6">Frontend Developer</Typography>
                    <Typography variant="body2" color="secondary" className="mb-2">Razorpay • Full-time • 2021 - 2023</Typography>
                </div>
            </div>
        </div>
    );
};
