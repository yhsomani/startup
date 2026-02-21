import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Badge {
    id: string;
    name: string;
    icon: string;
    earned_at: string;
}

interface GamificationDashboardProps {
    userId: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ userId }) => {
    const [streaks, setStreaks] = useState<any>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [points, setPoints] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [streaksRes, badgesRes, pointsRes] = await Promise.all([
                    api.get(`/users/${userId}/streaks`),
                    api.get(`/users/${userId}/badges`),
                    api.get(`/users/${userId}/points`)
                ]);

                setStreaks(streaksRes.data);
                setBadges(badgesRes.data.badges || []);
                setPoints(pointsRes.data);
            } catch (error) {
                console.error('Gamification error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
                Your Progress
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Streak Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔥</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {streaks?.current_streak || 0} Days
                    </div>
                    <div style={{ opacity: 0.9 }}>Current Streak</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.8 }}>
                        Best: {streaks?.longest_streak || 0} days
                    </div>
                </div>

                {/* Points Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {points?.total_points || 0}
                    </div>
                    <div style={{ opacity: 0.9 }}>Total Points</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.8 }}>
                        Level {points?.level || 1} • {points?.points_to_next_level || 0} to next level
                    </div>
                </div>

                {/* Badges Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {badges.length}
                    </div>
                    <div style={{ opacity: 0.9 }}>Badges Earned</div>
                </div>
            </div>

            {/* Badges Grid */}
            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Your Badges
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1rem'
                }}>
                    {badges.map(badge => (
                        <div
                            key={badge.id}
                            style={{
                                background: 'white',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '1rem',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                                {badge.icon}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                {badge.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                {new Date(badge.earned_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
