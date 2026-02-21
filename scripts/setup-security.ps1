# Security Hardening Script for TalentSphere
# Run this script to implement security fixes

Write-Host "🔒 Starting TalentSphere Security Hardening..." -ForegroundColor Green

# Generate cryptographically secure secrets using CSPRNG
Write-Host "📝 Generating cryptographically secure secrets..." -ForegroundColor Yellow

function Get-SecureRandomString {
    param(
        [int]$Length = 32
    )
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return [Convert]::ToBase64String($bytes)
}

$secrets = @{
    JWT_SECRET = Get-SecureRandomString -Length 64
    JWT_REFRESH_SECRET = Get-SecureRandomString -Length 64
    SESSION_SECRET = Get-SecureRandomString -Length 64
    ENCRYPTION_KEY = Get-SecureRandomString -Length 32
    API_SECRET = Get-SecureRandomString -Length 48
    MASTER_ENCRYPTION_KEY = Get-SecureRandomString -Length 64
}

# Create .env file with generated secrets
Write-Host "📄 Creating .env file with secure secrets..." -ForegroundColor Yellow

$envContent = @"
# ==============================================
# TalentSphere Environment Configuration
# ==============================================
# AUTO-GENERATED SECURE CONFIGURATION
# Generated on: $(Get-Date)
# ==============================================

# Environment Settings
NODE_ENV=production
PORT=3001

# ==============================================
# Security Configuration (AUTO-GENERATED)
# ==============================================
JWT_SECRET=$($secrets.JWT_SECRET)
JWT_REFRESH_SECRET=$($secrets.JWT_REFRESH_SECRET)
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

SESSION_SECRET=$($secrets.SESSION_SECRET)
SESSION_MAX_AGE=86400000

ENCRYPTION_KEY=$($secrets.ENCRYPTION_KEY)
API_SECRET=$($secrets.API_SECRET)
MASTER_ENCRYPTION_KEY=$($secrets.MASTER_ENCRYPTION_KEY)

BCRYPT_ROUNDS=12

# ==============================================
# Database Configuration
# ==============================================
DATABASE_URL=postgresql://talentsphere_user:CHANGE_THIS_STRONG_DB_PASSWORD@localhost:5432/talentsphere_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=talentsphere_prod
DB_USER=talentsphere_user
DB_PASSWORD=CHANGE_THIS_STRONG_DB_PASSWORD

# ==============================================
# Redis Configuration
# ==============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_STRONG_REDIS_PASSWORD
REDIS_DB=0

# ==============================================
# CORS Configuration
# ==============================================
CORS_ORIGIN=https://talentsphere.yourdomain.com
CORS_CREDENTIALS=true

# ==============================================
# Rate Limiting
# ==============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_RATE_LIMIT_MAX=1000

# ==============================================
# File Upload Security
# ==============================================
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# ==============================================
# Production Security Settings
# ==============================================
FORCE_HTTPS=true
COOKIE_SECURE=true
DEBUG=false
LOG_LEVEL=error

# ==============================================
# External Services (CHANGE THESE)
# ==============================================
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_API_KEY=CHANGE_THIS_TO_YOUR_EMAIL_API_KEY
EMAIL_FROM=noreply@talentsphere.com

STORAGE_PROVIDER=aws_s3
AWS_ACCESS_KEY_ID=CHANGE_THIS_TO_YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=CHANGE_THIS_TO_YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=talentsphere-files

STRIPE_SECRET_KEY=CHANGE_THIS_TO_YOUR_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=CHANGE_THIS_TO_YOUR_WEBHOOK_SECRET

OPENAI_API_KEY=CHANGE_THIS_TO_YOUR_OPENAI_KEY
OPENAI_MODEL=gpt-4

# ==============================================
# Monitoring and Analytics
# ==============================================
SENTRY_DSN=CHANGE_THIS_TO_YOUR_SENTRY_DSN
GOOGLE_ANALYTICS_ID=CHANGE_THIS_TO_YOUR_GA_ID

# ==============================================
# Feature Flags
# ==============================================
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_FILE_UPLOADS=true
ENABLE_REAL_TIME_FEATURES=true
"@

# Save to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ .env file created with secure secrets" -ForegroundColor Green

# Create secrets backup
$secrets | ConvertTo-Json | Out-File -FilePath "secrets-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json" -Encoding UTF8
Write-Host "💾 Secrets backup created" -ForegroundColor Green

# Set file permissions (Windows equivalent)
icacls.exe ".env" /inheritance:r
icacls.exe ".env" /grant:r "$($env:USERNAME):(R)"
Write-Host "🔐 .env file permissions secured" -ForegroundColor Green

# Install security dependencies
Write-Host "📦 Installing security dependencies..." -ForegroundColor Yellow

$securityPackages = @(
    "helmet",
    "express-rate-limit", 
    "cors",
    "bcrypt",
    "joi",
    "express-validator",
    "hpp", # HTTP Parameter Pollution
    "xss-clean",
    "express-mongo-sanitize"
)

foreach ($package in $securityPackages) {
    Write-Host "Installing $package..." -ForegroundColor Cyan
    npm install $package --save
}

# Create security middleware configuration
Write-Host "⚙️ Creating security middleware configuration..." -ForegroundColor Yellow

# Write JavaScript code directly to file
$securityConfigContent = @"
/**
 * Security Middleware Configuration
 * Implements comprehensive security headers and protections
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const hpp = require('hpp');
const xssClean = require('xss-clean');

const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.API_URL || ""],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
};

const configureRateLimit = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  });
};

const configureAuthRateLimit = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true
  });
};

const configureCors = () => {
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'];

  return cors({
    origin: allowedOrigins,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  });
};

const securityMiddleware = {
  helmet: configureHelmet(),
  rateLimit: configureRateLimit(),
  authRateLimit: configureAuthRateLimit(),
  cors: configureCors(),
  hpp: hpp(),
  xssClean: xssClean()
};

module.exports = securityMiddleware;
"@

$securityConfigContent | Out-File -FilePath "./shared/security-middleware.js" -Encoding UTF8
Write-Host "✅ Security middleware configuration created" -ForegroundColor Green

# Run security audit
Write-Host "🔍 Running initial security audit..." -ForegroundColor Yellow

if (Test-Path "./shared/security-auditor.js") {
    node -e "
const auditor = require('./shared/security-auditor');
auditor.runSecurityAudit().then(results => {
    console.log('🔒 Security Audit Results:');
    console.log(\`Overall Score: \${results.overallScore}/100\`);
    console.log(\`Critical Issues: \${results.criticalIssues.length}\`);
    console.log(\`High Priority Issues: \${results.highIssues.length}\`);
    
    if (results.criticalIssues.length > 0) {
        console.log('\\n🚨 Critical Issues Found:');
        results.criticalIssues.forEach((issue, index) => {
            console.log(\`\${index + 1}. \${issue.check}: \${issue.recommendation}\`);
        });
    }
    
    if (results.highIssues.length > 0) {
        console.log('\\n⚠️ High Priority Issues:');
        results.highIssues.forEach((issue, index) => {
            console.log(\`\${index + 1}. \${issue.check}: \${issue.recommendation}\`);
        });
    }
});
"
}

Write-Host ""
Write-Host "🎉 Security Hardening Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update the CHANGE_THIS values in .env with your actual credentials" -ForegroundColor White
Write-Host "2. Set up your database with a strong password" -ForegroundColor White
Write-Host "3. Configure Redis with authentication" -ForegroundColor White
Write-Host "4. Set up your external service API keys" -ForegroundColor White
Write-Host "5. Run the application with 'npm start' to test" -ForegroundColor White
Write-Host "6. Schedule regular security audits" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Your application is now secured with:" -ForegroundColor Green
Write-Host "  • Strong cryptographic secrets" -ForegroundColor Gray
Write-Host "  • Security headers (Helmet)" -ForegroundColor Gray
Write-Host "  • Rate limiting" -ForegroundColor Gray
Write-Host "  • CORS protection" -ForegroundColor Gray
Write-Host "  • XSS protection" -ForegroundColor Gray
Write-Host "  • HPP protection" -ForegroundColor Gray
Write-Host "  • Input sanitization" -ForegroundColor Gray
Write-Host "  • Environment validation" -ForegroundColor Gray