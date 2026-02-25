import React from "react";

// Minimal Login Component for Testing
export const Login: React.FC = () => {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || errorData.message || "Login failed");
            }

            const data = await response.json();
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data));
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} data-testid="login-form">
            <h1>Login</h1>
            {error && (
                <div role="alert" data-testid="error-message">
                    {error}
                </div>
            )}

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                data-testid="email-input"
                required
                aria-label="Email address"
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                data-testid="password-input"
                required
                aria-label="Password"
            />

            <button type="submit" disabled={loading} data-testid="submit-button">
                {loading ? "Logging in..." : "Login"}
            </button>
        </form>
    );
};

export default Login;
