import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { Typography } from '../../../components/atoms/Typography';

export interface JobDetailsContentProps {
    description: string;
    requirements: string[];
    benefits: string[];
}

export const JobDetailsContent: React.FC<JobDetailsContentProps> = ({ description, requirements, benefits }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <section className="mb-8">
                <Typography variant="h5" className="mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Job Description
                </Typography>
                <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {description}
                </div>
            </section>

            <section className="mb-8">
                <Typography variant="h5" className="mb-4">
                    Requirements
                </Typography>
                <ul className="space-y-3">
                    {requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                            <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <Typography variant="h5" className="mb-4">
                    Benefits
                </Typography>
                <ul className="space-y-3">
                    {benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                            <CheckCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};
