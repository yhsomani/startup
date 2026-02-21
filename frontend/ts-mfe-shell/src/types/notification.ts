/**
 * Notification types
 */

export type NotificationType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'achievement'
    | 'badge'
    | 'course_update'
    | 'challenge_graded';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: NotificationData;
    read: boolean;
    createdAt: string;
}

export interface NotificationData {
    courseId?: string;
    challengeId?: string;
    submissionId?: string;
    badgeId?: string;
    achievementId?: string;
    actionUrl?: string;
}

export interface LeaderboardUpdate {
    userId: string;
    previousRank: number;
    newRank: number;
    points: number;
}
