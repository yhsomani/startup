import React from 'react';
import { Plus, X as XIcon } from 'lucide-react';
import { Typography } from '../../../components/atoms/Typography';
import { Badge } from '../../../components/atoms/Badge';

export interface ProfileSkillsProps {
    skills: string[];
    isEditing: boolean;
    newSkill: string;
    setNewSkill: (skill: string) => void;
    addSkill: () => void;
    removeSkill: (skill: string) => void;
}

export const ProfileSkills: React.FC<ProfileSkillsProps> = ({ skills, isEditing, newSkill, setNewSkill, addSkill, removeSkill }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <Typography variant="h6">Skills & Expertise</Typography>
            </div>
            {isEditing && (
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSkill()}
                        placeholder="Add skill..."
                        className="flex-1 px-2 py-1 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button onClick={addSkill} className="p-1 px-2 bg-primary text-white rounded hover:bg-primary/90">
                        <Plus size={16} />
                    </button>
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                    skills.map((skill, index) => (
                        <Badge key={index} variant="neutral" className="py-1 px-3 flex items-center gap-1.5">
                            {skill}
                            {isEditing && (
                                <button onClick={() => removeSkill(skill)} className="hover:text-red-500">
                                    <XIcon size={12} />
                                </button>
                            )}
                        </Badge>
                    ))
                ) : (
                    <p className="text-xs text-gray-500">No skills added yet.</p>
                )}
            </div>
        </div>
    );
};
