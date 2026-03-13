import React from 'react';
import { Typography } from '../../../components/atoms/Typography';

export interface ProfileAboutProps {
    about: string;
    isEditing: boolean;
    handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({ about, isEditing, handleChange }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <Typography variant="h5" className="mb-4">About Me</Typography>
            {isEditing ? (
                <textarea
                    name="about"
                    value={about}
                    onChange={handleChange}
                    placeholder="Write a short bio about yourself..."
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/40 outline-none min-h-[120px] resize-none"
                />
            ) : (
                <Typography variant="body1" className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {about || 'No description provided yet.'}
                </Typography>
            )}
        </div>
    );
};
