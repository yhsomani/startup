import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const message = location.state?.message;
    const from = location.state?.from?.pathname || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await login(email.trim(), password.trim());
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error('LOGIN ERROR:', err);
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Sign in to your account</p>

                {message && (
                    <div style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }} data-testid="auth-message">
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}
                        data-testid="error-message"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email-input">Email Address</label>
                        <input
                            id="email-input"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            data-testid="email-input"
                            aria-label="Email address"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password-input">Password</label>
                        <input
                            id="password-input"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            data-testid="password-input"
                            aria-label="Password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Logging In...' : 'Login'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link
                        to="/forgot-password"
                        style={{
                            color: 'var(--primary)',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}
                    >
                        Forgot your password?
                    </Link>
                </div>

                <p className="footer-link">
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
