import React, { useState } from 'react';
import api from '../services/api';

interface CourseFormProps {
    onSuccess: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        price: 0,
        currency: 'USD'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Get User ID from localStorage (Shell stores it)
        // Actually, Shell stores 'accessToken'. 
        // We need 'userId' or pass it via API token.
        // My previous backend hack used 'instructorId' query param OR 'X-User-Id' header.
        // The API service interceptor adds Authorization header (Bearer token).
        // The Backend SHOULD extract ID from token.
        // But my .NET implementation (Step 1224) checks 'X-User-Id' header or 'instructorId' query param.
        // It DOES NOT parse the JWT yet (commented out).
        // So I MUST send 'instructorId' explicitly for now.

        // Where do I get instructorId? 
        // Shell login response has 'userId'. I should store it in localStorage too.
        // I need to update Shell's `authService` to store userId. (See shell/src/services/authService.ts Step 1099)
        // Step 1099 code: "if (response.data.accessToken) { localStorage.setItem('accessToken', ...); }"
        // It does NOT store userId.
        // I should fix that first? 
        // Or I can decode the token if it has the ID.
        // Or I can prompt the user? No.

        // I'll update the Shell authService in the next step to store 'userId' and 'role'.
        // For now, I'll assume localStorage.getItem('userId') works, or fail gracefully.

        const userId = localStorage.getItem('userId');
        if (!userId) {
            setError('You must be logged in to create a course.');
            setIsLoading(false);
            return;
        }

        try {
            await api.post(`/courses?instructorId=${userId}`, {
                Title: formData.title,
                Subtitle: formData.subtitle,
                Description: formData.description,
                Price: Number(formData.price),
                Currency: formData.currency
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create course');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Create New Course</h2>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subtitle</label>
                    <input
                        type="text"
                        value={formData.subtitle}
                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Price</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        />
                    </div>
                    <div style={{ width: '100px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Currency</label>
                        <select
                            value={formData.currency}
                            onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? 'Creating...' : 'Create Course'}
                </button>
            </form>
        </div>
    );
};

export default CourseForm;
