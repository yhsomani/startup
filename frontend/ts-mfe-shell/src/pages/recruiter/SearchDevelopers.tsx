import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mocks to fallback on if backend doesn't respond
const MOCK_DEVELOPERS = [
    {
        id: 'user-1',
        firstName: 'Alice',
        lastName: 'Smith',
        title: 'Senior Frontend Engineer',
        location: 'San Francisco, CA',
        matchScore: 92,
        verifiedSkills: [
            { name: 'React', level: 'advanced', points: 1540 },
            { name: 'Node.js', level: 'intermediate', points: 820 },
            { name: 'Arrays', level: 'advanced', points: 1200 }
        ],
        challengesCompleted: 42,
        avatar: 'A'
    },
    {
        id: 'user-2',
        firstName: 'Bob',
        lastName: 'Johnson',
        title: 'Full Stack Developer',
        location: 'Remote',
        matchScore: 78,
        verifiedSkills: [
            { name: 'Python', level: 'advanced', points: 2100 },
            { name: 'React', level: 'beginner', points: 300 },
            { name: 'Hash Maps', level: 'advanced', points: 1850 }
        ],
        challengesCompleted: 56,
        avatar: 'B'
    },
    {
        id: 'user-3',
        firstName: 'Charlie',
        lastName: 'Davis',
        title: 'Backend Engineer',
        location: 'New York, NY',
        matchScore: 65,
        verifiedSkills: [
            { name: 'Go', level: 'intermediate', points: 950 },
            { name: 'Node.js', level: 'advanced', points: 1600 },
            { name: 'AWS', level: 'intermediate', points: 720 },
            { name: 'Docker', level: 'advanced', points: 1400 }
        ],
        challengesCompleted: 31,
        avatar: 'C'
    }
];

const availableSkills = ['React', 'Node.js', 'Python', 'Arrays', 'Hash Maps', 'AWS', 'Docker', 'GraphQL', 'Go'];

const SearchDevelopers: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [minProficiency, setMinProficiency] = useState('any');
    const [matchType, setMatchType] = useState('any'); // 'any' | 'all'
    const [developers, setDevelopers] = useState(MOCK_DEVELOPERS);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            // Convert simple array to proficiency requirement object for backend
            const skillParams = selectedSkills.map(s => `skills=${encodeURIComponent(s)}`).join('&');
            let proficiencyParam = '';
            if (minProficiency !== 'any' && selectedSkills.length > 0) {
                // For simplicity we apply the same minimum proficiency to all chosen skills here
                const profObj = selectedSkills.reduce((acc, skill) => {
                    acc[skill] = minProficiency;
                    return acc;
                }, {} as Record<string, string>);
                proficiencyParam = `&min_proficiency=${encodeURIComponent(JSON.stringify(profObj))}`;
            }

            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('q', searchTerm);
            if (matchType === 'all') queryParams.append('matchAll', 'true');

            const response = await fetch(`/api/search/developers?${queryParams.toString()}&${skillParams}${proficiencyParam}`);

            if (response.ok) {
                const data = await response.json();
                setDevelopers(data.results || data);
            } else {
                // Filter mocks client-side if server fails
                filterMocksClientSide();
            }
        } catch (error) {
            console.error("Failed to fetch developers", error);
            filterMocksClientSide();
        } finally {
            setIsLoading(false);
        }
    };

    // Fallback UI filtering when the backend isn't ready
    const filterMocksClientSide = () => {
        let results = [...MOCK_DEVELOPERS];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(d =>
                d.firstName.toLowerCase().includes(term) ||
                d.lastName.toLowerCase().includes(term) ||
                d.title.toLowerCase().includes(term)
            );
        }

        if (selectedSkills.length > 0) {
            results = results.filter(dev => {
                const devSkillNames = dev.verifiedSkills.map(s => s.name);

                if (matchType === 'all') {
                    return selectedSkills.every(skill => devSkillNames.includes(skill));
                } else {
                    return selectedSkills.some(skill => devSkillNames.includes(skill));
                }
            });

            // Re-calculate mock match score
            results.forEach(dev => {
                let overlap = 0;
                dev.verifiedSkills.forEach(s => {
                    if (selectedSkills.includes(s.name)) overlap++;
                });
                dev.matchScore = Math.round((overlap / selectedSkills.length) * 100);
            });
        }

        // Sort by match score
        results.sort((a, b) => b.matchScore - a.matchScore);

        setDevelopers(results);
    };

    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    // Trigger search when key filters change (except text which is manual / enter)
    useEffect(() => {
        handleSearch();
    }, [selectedSkills, minProficiency, matchType]);

    return (
        <div style={{ display: 'flex', gap: '2rem', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Sidebar Filters */}
            <div style={{ width: '300px', flexShrink: 0 }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '2rem' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>Filters</h2>

                    {/* Keyword Search */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                            Keyword Search
                        </label>
                        <div style={{ display: 'flex' }}>
                            <input
                                data-testid="search-input"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Name, Title, etc."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px 0 0 8px', border: '1px solid #d1d5db', borderRight: 'none' }}
                            />
                            <button
                                data-testid="search-button"
                                onClick={handleSearch}
                                style={{ padding: '0 1rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}
                            >
                                🔍
                            </button>
                        </div>
                    </div>

                    {/* Skill Filters */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 500, color: '#374151', margin: 0 }}>Required Skills</label>

                            <select
                                value={matchType}
                                onChange={(e) => setMatchType(e.target.value)}
                                style={{ padding: '0.25rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            >
                                <option value="any">Match Any</option>
                                <option value="all">Match All</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.25rem 0' }}>
                            {availableSkills.map(skill => (
                                <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.875rem',
                                        borderRadius: '999px',
                                        border: selectedSkills.includes(skill) ? '1px solid #4f46e5' : '1px solid #e5e7eb',
                                        background: selectedSkills.includes(skill) ? '#e0e7ff' : 'white',
                                        color: selectedSkills.includes(skill) ? '#4338ca' : '#4b5563',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minimum Proficiency */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                            Minimum Proficiency
                        </label>
                        <select
                            value={minProficiency}
                            onChange={(e) => setMinProficiency(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                        >
                            <option value="any">Any Level</option>
                            <option value="beginner">Beginner+</option>
                            <option value="intermediate">Intermediate+</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Candidate Recommendations</h2>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        Showing {developers.length} developer{developers.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        Loading matches...
                    </div>
                ) : developers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', color: '#6b7280' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                        No developers match your specific criteria.<br />
                        Try broadening your search or adjusting skill requirements.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {developers.map(dev => (
                            <div key={dev.id} style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                display: 'flex',
                                gap: '1.5rem',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer',
                                borderLeft: dev.matchScore > 80 ? '4px solid #10b981' : '4px solid transparent'
                            }}>
                                {/* Avatar & Score Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minWidth: '80px' }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem', fontWeight: 600
                                    }}>
                                        {dev.avatar}
                                    </div>

                                    {selectedSkills.length > 0 && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{
                                                fontSize: '1.25rem', fontWeight: 700,
                                                color: dev.matchScore > 80 ? '#10b981' : dev.matchScore > 60 ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {dev.matchScore}%
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Match
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>
                                                {dev.firstName} {dev.lastName}
                                            </h3>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563', fontWeight: 500 }}>
                                                {dev.title} • {dev.location}
                                            </p>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{dev.challengesCompleted}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Challenges</div>
                                        </div>
                                    </div>

                                    <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Verified Skills
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {dev.verifiedSkills.map((skill, idx) => {
                                            const isMatchedHighlight = selectedSkills.includes(skill.name);

                                            // Level colors mapping based on PRD point thresholds
                                            const levelColors = {
                                                beginner: { bg: '#dbeafe', text: '#1e3a8a', label: 'Beg' },
                                                intermediate: { bg: '#fef3c7', text: '#92400e', label: 'Int' },
                                                advanced: { bg: '#dcfce7', text: '#166534', label: 'Adv' },
                                            };
                                            const lColor = levelColors[skill.level as keyof typeof levelColors] || levelColors.beginner;

                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex', alignItems: 'center',
                                                        background: isMatchedHighlight ? '#e0e7ff' : '#f3f4f6',
                                                        border: isMatchedHighlight ? '1px solid #818cf8' : '1px solid #e5e7eb',
                                                        borderRadius: '6px', overflow: 'hidden',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    <span style={{ padding: '0.35rem 0.6rem', fontWeight: 500, color: isMatchedHighlight ? '#3730a3' : '#374151' }}>
                                                        {skill.name}
                                                    </span>
                                                    <span style={{
                                                        background: lColor.bg, color: lColor.text,
                                                        padding: '0.35rem 0.5rem', fontSize: '0.75rem', fontWeight: 600,
                                                        borderLeft: isMatchedHighlight ? '1px solid #818cf8' : '1px solid #e5e7eb'
                                                    }}>
                                                        {lColor.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                        <button style={{
                                            padding: '0.5rem 1.5rem', background: '#4f46e5', color: 'white',
                                            border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer'
                                        }}>
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => navigate(`/recruiter/messages/compose?candidateId=${dev.id}&candidateName=${encodeURIComponent(dev.firstName + ' ' + dev.lastName)}`)}
                                            style={{
                                                padding: '0.5rem 1.5rem', background: 'white', color: '#4f46e5',
                                                border: '1px solid #4f46e5', borderRadius: '6px', fontWeight: 500, cursor: 'pointer'
                                            }}>
                                            Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchDevelopers;
