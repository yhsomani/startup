import React from 'react';
import { Camera, MapPin, Globe, Mail, Link as LinkIcon, Edit3, Save } from 'lucide-react';
import { Typography } from '../../../components/atoms/Typography';
import { Button } from '../../../components/atoms/Button';
import { Avatar } from '../../../components/atoms/Avatar';

export interface ProfileData {
    firstName: string;
    lastName: string;
    headline: string;
    location: string;
    email: string;
    portfolioUrl: string;
    githubUrl: string;
    about: string;
    skills: string[];
}

export interface ProfileHeaderProps {
    profileData: ProfileData;
    isEditing: boolean;
    isSaving: boolean;
    setIsEditing: (editing: boolean) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSave: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileData, isEditing, isSaving, setIsEditing, handleChange, handleSave }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative group">
                {isEditing && (
                    <button className="absolute inset-0 m-auto w-12 h-12 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} />
                    </button>
                )}
            </div>

            <div className="px-6 sm:px-8 pb-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-20 mb-6">
                    <div className="relative group">
                        <Avatar
                            size="xl"
                            initials={`${profileData.firstName?.[0] || ''}${profileData.lastName?.[0] || ''}`}
                            className="border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-md text-4xl"
                        />
                        {isEditing && (
                            <button className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                                <Camera size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            {isEditing ? (
                                <div className="flex gap-2 mb-2">
                                    <input
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleChange}
                                        placeholder="First Name"
                                        className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/40 outline-none w-32"
                                    />
                                    <input
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleChange}
                                        placeholder="Last Name"
                                        className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/40 outline-none w-32"
                                    />
                                </div>
                            ) : (
                                <Typography variant="h3">{profileData.firstName} {profileData.lastName}</Typography>
                            )}

                            {isEditing ? (
                                <input
                                    name="headline"
                                    value={profileData.headline}
                                    onChange={handleChange}
                                    placeholder="Professional Headline"
                                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/40 outline-none"
                                />
                            ) : (
                                <Typography variant="body1" color="secondary">{profileData.headline}</Typography>
                            )}
                        </div>

                        <div className="flex-shrink-0">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleSave} isLoading={isSaving} leftIcon={<Save size={16} />}>Save</Button>
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} leftIcon={<Edit3 size={16} />}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2"><MapPin size={16} /> {isEditing ? <input name="location" value={profileData.location} onChange={handleChange} className="bg-transparent border-b border-gray-300 dark:border-slate-700 focus:border-primary outline-none" /> : profileData.location}</span>
                    <span className="flex items-center gap-2"><Mail size={16} /> {profileData.email}</span>
                    <span className="flex items-center gap-2"><Globe size={16} /> {isEditing ? <input name="portfolioUrl" value={profileData.portfolioUrl} onChange={handleChange} className="bg-transparent border-b border-gray-300 dark:border-slate-700 focus:border-primary outline-none" /> : <a href={profileData.portfolioUrl} target="_blank" className="hover:text-primary transition-colors hover:underline" rel="noreferrer">Portfolio</a>}</span>
                    <span className="flex items-center gap-2"><LinkIcon size={16} /> {isEditing ? <input name="githubUrl" value={profileData.githubUrl} onChange={handleChange} className="bg-transparent border-b border-gray-300 dark:border-slate-700 focus:border-primary outline-none" /> : <a href={profileData.githubUrl} target="_blank" className="hover:text-primary transition-colors hover:underline" rel="noreferrer">GitHub</a>}</span>
                </div>
            </div>
        </div>
    );
};
