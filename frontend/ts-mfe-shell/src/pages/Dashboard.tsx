import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                <Link to="/courses" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                        <h3>Browse Courses</h3>
                        <p style={{ color: '#6b7280' }}>Explore our course catalog</p>
                    </div>
                </Link>
                <Link to="/challenges" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                        <h3>Challenges</h3>
                        <p style={{ color: '#6b7280' }}>Test your skills</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
