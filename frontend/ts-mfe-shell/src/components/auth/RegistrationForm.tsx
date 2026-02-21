import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import { RegistrationState } from '../../types/auth';

const RegistrationForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RegistrationState>({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT'
    });
    const [errors, setErrors] = useState<Partial<RegistrationState>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const validate = () => {
        const newErrors: Partial<RegistrationState> = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setServerError(null);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                role: formData.role as any
            });
            // Redirect to login or dashboard
            navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Join TalentSphere today</p>

                {serverError && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="error-text">{errors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="error-text">{errors.password}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">I want to be a</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ flex: 1, cursor: 'pointer', border: formData.role === 'STUDENT' ? '2px solid var(--primary)' : '1px solid #d1d5db', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', transition: 'all 0.2s', fontWeight: formData.role === 'STUDENT' ? 600 : 400 }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="STUDENT"
                                    checked={formData.role === 'STUDENT'}
                                    onChange={() => setFormData({ ...formData, role: 'STUDENT' })}
                                    style={{ display: 'none' }}
                                />
                                Student
                            </label>
                            <label style={{ flex: 1, cursor: 'pointer', border: formData.role === 'INSTRUCTOR' ? '2px solid var(--primary)' : '1px solid #d1d5db', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', transition: 'all 0.2s', fontWeight: formData.role === 'INSTRUCTOR' ? 600 : 400 }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="INSTRUCTOR"
                                    checked={formData.role === 'INSTRUCTOR'}
                                    onChange={() => setFormData({ ...formData, role: 'INSTRUCTOR' })}
                                    style={{ display: 'none' }}
                                />
                                Instructor
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="footer-link">
                    Already have an account? <a href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Log in</a>
                </p>
            </div>
        </div>
    );
};

export default RegistrationForm;
