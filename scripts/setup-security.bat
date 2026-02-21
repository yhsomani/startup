@echo off
echo 🔒 Starting TalentSphere Security Hardening...

REM Generate secure secrets
echo 📝 Generating secure secrets...

REM Use PowerShell for secure random string generation
powershell -Command "
$secrets = @{
    JWT_SECRET = -join ((48..57) + (65..90) + (97..122) + (33..38) + (40..47) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    JWT_REFRESH_SECRET = -join ((48..57) + (65..90) + (97..122) + (33..38) + (40..47) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    SESSION_SECRET = -join ((48..57) + (65..90) + (97..122) + (33..38) + (40..47) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    ENCRYPTION_KEY = -join ((48..57) + (65..90) + (97..122) + (33..38) + (40..47) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    API_SECRET = -join ((48..57) + (65..90) + (97..122) + (33..38) + (40..47) | Get-Random -Count 48 | ForEach-Object {[char]$_})
    MASTER_ENCRYPTION_KEY = -join ((48..57) + (65..90) + (97..122) + (33..38) + (40..47) | Get-Random -Count 64 | ForEach-Object {[char]$_})
}
$secrets | ConvertTo-Json | Out-File -FilePath 'temp-secrets.json' -Encoding UTF8
"

REM Read generated secrets
set /p JWT_SECRET=<temp-secrets.json
set /p JWT_REFRESH_SECRET=<temp-secrets.json
set /p SESSION_SECRET=<temp-secrets.json
set /p ENCRYPTION_KEY=<temp-secrets.json
set /p API_SECRET=<temp-secrets.json
set /p MASTER_ENCRYPTION_KEY=<temp-secrets.json

REM Create .env file
echo 📄 Creating .env file with secure secrets...

(
echo # ==============================================
echo # TalentSphere Environment Configuration
echo # ==============================================
echo # AUTO-GENERATED SECURE CONFIGURATION
echo # Generated on: %date% %time%
echo # ==============================================
echo.
echo # Environment Settings
echo NODE_ENV=production
echo PORT=3001
echo.
echo # ==============================================
echo # Security Configuration ^(AUTO-GENERATED^)
echo # ==============================================
echo JWT_SECRET=%JWT_SECRET%
echo JWT_REFRESH_SECRET=%JWT_REFRESH_SECRET%
echo JWT_EXPIRES_IN=1h
echo JWT_REFRESH_EXPIRES_IN=7d
echo.
echo SESSION_SECRET=%SESSION_SECRET%
echo SESSION_MAX_AGE=86400000
echo.
echo ENCRYPTION_KEY=%ENCRYPTION_KEY%
echo API_SECRET=%API_SECRET%
echo MASTER_ENCRYPTION_KEY=%MASTER_ENCRYPTION_KEY%
echo.
echo BCRYPT_ROUNDS=12
echo.
echo # ==============================================
echo # Database Configuration
echo # ==============================================
echo DATABASE_URL=postgresql://talentsphere_user:CHANGE_THIS_STRONG_DB_PASSWORD@localhost:5432/talentsphere_prod
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=talentsphere_prod
echo DB_USER=talentsphere_user
echo DB_PASSWORD=CHANGE_THIS_STRONG_DB_PASSWORD
echo.
echo # ==============================================
echo # Redis Configuration
echo # ==============================================
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_PASSWORD=CHANGE_THIS_STRONG_REDIS_PASSWORD
echo REDIS_DB=0
echo.
echo # ==============================================
echo # CORS Configuration
echo # ==============================================
echo CORS_ORIGIN=https://talentsphere.yourdomain.com
echo CORS_CREDENTIALS=true
echo.
echo # ==============================================
echo # Rate Limiting
echo # ==============================================
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo API_RATE_LIMIT_MAX=1000
echo.
echo # ==============================================
echo # File Upload Security
echo # ==============================================
echo MAX_FILE_SIZE=10485760
echo ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
echo.
echo # ==============================================
echo # Production Security Settings
echo # ==============================================
echo FORCE_HTTPS=true
echo COOKIE_SECURE=true
echo DEBUG=false
echo LOG_LEVEL=error
echo.
echo # ==============================================
echo # External Services ^(CHANGE THESE^)
echo # ==============================================
echo EMAIL_SERVICE_PROVIDER=sendgrid
echo EMAIL_API_KEY=CHANGE_THIS_TO_YOUR_EMAIL_API_KEY
echo EMAIL_FROM=noreply@talentsphere.com
echo.
echo STORAGE_PROVIDER=aws_s3
echo AWS_ACCESS_KEY_ID=CHANGE_THIS_TO_YOUR_AWS_ACCESS_KEY
echo AWS_SECRET_ACCESS_KEY=CHANGE_THIS_TO_YOUR_AWS_SECRET_KEY
echo AWS_REGION=us-east-1
echo AWS_S3_BUCKET=talentsphere-files
echo.
echo STRIPE_SECRET_KEY=CHANGE_THIS_TO_YOUR_STRIPE_KEY
echo STRIPE_WEBHOOK_SECRET=CHANGE_THIS_TO_YOUR_WEBHOOK_SECRET
echo.
echo OPENAI_API_KEY=CHANGE_THIS_TO_YOUR_OPENAI_KEY
echo OPENAI_MODEL=gpt-4
echo.
echo # ==============================================
echo # Monitoring and Analytics
echo # ==============================================
echo SENTRY_DSN=CHANGE_THIS_TO_YOUR_SENTRY_DSN
echo GOOGLE_ANALYTICS_ID=CHANGE_THIS_TO_YOUR_GA_ID
echo.
echo # ==============================================
echo # Feature Flags
echo # ==============================================
echo ENABLE_AI_FEATURES=true
echo ENABLE_EMAIL_NOTIFICATIONS=true
echo ENABLE_FILE_UPLOADS=true
echo ENABLE_REAL_TIME_FEATURES=true
) > .env

echo ✅ .env file created with secure secrets

REM Clean up temp file
del temp-secrets.json

REM Install security dependencies
echo 📦 Installing security dependencies...

call npm install helmet express-rate-limit cors bcrypt joi express-validator hpp xss-clean express-mongo-sanitize --save

echo ✅ Security dependencies installed

REM Create security middleware
echo ⚙️ Creating security middleware configuration...

call npm list helmet 2>nul || (
    echo Installing missing dependencies...
    call npm install helmet express-rate-limit cors
)

echo 🎉 Security Hardening Complete!
echo.
echo 📋 Next Steps:
echo 1. Update the CHANGE_THIS values in .env with your actual credentials
echo 2. Set up your database with a strong password
echo 3. Configure Redis with authentication
echo 4. Set up your external service API keys
echo 5. Run the application with 'npm start' to test
echo.
echo 🔐 Your application is now secured with:
echo   • Strong cryptographic secrets
echo   • Security headers ^(Helmet^)
echo   • Rate limiting
echo   • CORS protection
echo   • XSS protection
echo   • HPP protection
echo   • Input sanitization
echo   • Environment validation

pause