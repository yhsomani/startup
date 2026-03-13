import React from 'react';
import { GraduationCap } from 'lucide-react';
import { Typography } from '../../../components/atoms/Typography';

export const ProfileEducation: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="flex items-center gap-2"><GraduationCap size={18} className="text-primary" /> Education</Typography>
            </div>
            <div className="space-y-4">
                <div>
                    <Typography variant="subtitle2" className="leading-tight">IIT Delhi</Typography>
                    <Typography variant="caption" className="block text-gray-500">B.Tech in Computer Science</Typography>
                    <Typography variant="caption" color="tertiary">2017 - 2021</Typography>
                </div>
            </div>
        </div>
    );
};
