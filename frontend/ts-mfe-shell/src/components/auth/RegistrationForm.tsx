import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RegistrationState } from '../../types/auth';

const RegistrationForm: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState<RegistrationState>({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
        firstName: '',
        lastName: ''
    });
    const [errors, setErrors] = useState<Partial<RegistrationState>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const validate = () => {
        const newErrors: Partial<RegistrationState> = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setServerError(null);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                role: formData.role as any,
                firstName: formData.firstName,
                lastName: formData.lastName,
                company: formData.company,
                title: formData.title
            });

            setSuccessMessage('Registration successful! Redirecting...');

            setTimeout(() => {
                // Redirect based on role to match E2E test expectations
                if (formData.role === 'RECRUITER') {
                    navigate('/employer/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);
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

                {successMessage && (
                    <div data-testid="success-message" style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="first-name-input">First Name</label>
                            <input
                                id="first-name-input"
                                type="text"
                                className="form-input"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="John"
                                data-testid="first-name-input"
                                required
                            />
                            {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="last-name-input">Last Name</label>
                            <input
                                id="last-name-input"
                                type="text"
                                className="form-input"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Doe"
                                data-testid="last-name-input"
                                required
                            />
                            {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email-input">Email Address</label>
                        <input
                            id="email-input"
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                            data-testid="email-input"
                            required
                        />
                        {errors.email && <p className="error-text">{errors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password-input">Password</label>
                        <input
                            id="password-input"
                            type="password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            data-testid="password-input"
                            required
                        />
                        {errors.password && <p className="error-text">{errors.password}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirm-password-input">Confirm Password</label>
                        <input
                            id="confirm-password-input"
                            type="password"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            data-testid="confirm-password-input"
                            required
                        />
                        {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">I want to be a</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ flex: 1, cursor: 'pointer', border: formData.role === 'STUDENT' ? '2px solid var(--primary)' : '1px solid #d1d5db', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', transition: 'all 0.2s', fontWeight: formData.role === 'STUDENT' ? 600 : 400 }} data-testid="user-type-jobseeker">
                                <input
                                    type="radio"
                                    name="role"
                                    value="STUDENT"
                                    checked={formData.role === 'STUDENT'}
                                    onChange={() => setFormData({ ...formData, role: 'STUDENT' })}
                                    style={{ display: 'none' }}
                                />
                                Job Seeker
                            </label>
                            <label style={{ flex: 1, cursor: 'pointer', border: formData.role === 'RECRUITER' ? '2px solid var(--primary)' : '1px solid #d1d5db', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', transition: 'all 0.2s', fontWeight: formData.role === 'RECRUITER' ? 600 : 400 }} data-testid="user-type-employer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="RECRUITER"
                                    checked={formData.role === 'RECRUITER'}
                                    onChange={() => setFormData({ ...formData, role: 'RECRUITER' })}
                                    style={{ display: 'none' }}
                                />
                                Employer
                            </label>
                        </div>
                    </div>

                    {formData.role === 'RECRUITER' && (
                        <>
                            <div className="form-group">
                                <label className="form-label" htmlFor="company-input">Company Name</label>
                                <input
                                    id="company-input"
                                    type="text"
                                    className="form-input"
                                    value={formData.company || ''}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="TechCorp Inc."
                                    data-testid="company-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="role-input">Title / Position</label>
                                <input
                                    id="role-input"
                                    type="text"
                                    className="form-input"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="HR Manager"
                                    data-testid="role-input"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn-primary" disabled={isLoading} data-testid="register-submit">
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
