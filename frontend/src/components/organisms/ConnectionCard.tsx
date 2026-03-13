import React from 'react';
import { UserPlus, MessageCircle, Check, Users } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { cn } from '../../utils/cn';

export interface ConnectionCardProps {
    id: string;
    name: string;
    role: string;
    company?: string;
    mutualConnections?: number;
    avatarInitials: string;
    isConnected?: boolean;
    isPending?: boolean;
    skills?: string[];
    onConnect?: (id: string) => void;
    onMessage?: (id: string) => void;
    className?: string;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
    id,
    name,
    role,
    company,
    mutualConnections,
    avatarInitials,
    isConnected = false,
    isPending = false,
    skills = [],
    onConnect,
    onMessage,
    className,
}) => {
    return (
        <div
            className={cn(
                'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm',
                'hover:shadow-md transition-all duration-200 hover:border-primary/30',
                className
            )}
        >
            <div className="flex items-start gap-4">
                <Avatar initials={avatarInitials} size="lg" className="flex-shrink-0" />

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{role}</p>
                    {company && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">{company}</p>
                    )}
                    {mutualConnections !== undefined && mutualConnections > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                            <Users size={11} />
                            <span>{mutualConnections} mutual connection{mutualConnections > 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="neutral" size="sm">{skill}</Badge>
                    ))}
                    {skills.length > 3 && (
                        <Badge variant="neutral" size="sm">+{skills.length - 3}</Badge>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
                {isConnected ? (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 flex items-center justify-center gap-1.5"
                            onClick={() => onMessage?.(id)}
                        >
                            <MessageCircle size={14} />
                            Message
                        </Button>
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 font-medium">
                            <Check size={12} />
                            Connected
                        </div>
                    </>
                ) : (
                    <>
                        <Button
                            size="sm"
                            className="flex-1 flex items-center justify-center gap-1.5"
                            disabled={isPending}
                            onClick={() => onConnect?.(id)}
                        >
                            <UserPlus size={14} />
                            {isPending ? 'Pending…' : 'Connect'}
                        </Button>
                        {onMessage && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1.5"
                                onClick={() => onMessage(id)}
                            >
                                <MessageCircle size={14} />
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
