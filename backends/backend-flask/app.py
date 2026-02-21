import os
import secrets
from app import create_app

def generate_secure_jwt_secret():
    """Generate secure JWT secret for production"""
    # Generate a cryptographically secure random key
    jwt_secret = secrets.token_urlsafe(64)
    
    # In production, this should be injected from environment variables
    # For development, we generate a secure random key each time
    return jwt_secret

# Check if JWT secret is provided in environment
jwt_secret = os.getenv('JWT_SECRET_KEY')

if not jwt_secret:
    if os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError("CRITICAL: JWT_SECRET_KEY must be set in production environment.")
    print("⚠️  WARNING: Generated temporary JWT_SECRET_KEY for development only.")
    jwt_secret = generate_secure_jwt_secret()

app = create_app()
app.config['JWT_SECRET_KEY'] = jwt_secret

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
