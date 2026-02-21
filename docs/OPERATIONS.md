# TalentSphere - Operations Guide

**Last Updated:** January 28, 2026  
**Version:** v1.4.0  
**Status:** Production Ready (All services implemented)

> **Note:** This document consolidates all deployment, operations, and infrastructure management procedures. For development setup, see [DEVELOPMENT.md](./DEVELOPMENT.md). For system architecture, see [SYSTEM.md](./SYSTEM.md).

---

## 📑 Table of Contents

1. [Deployment](#-deployment)
2. [Kubernetes Operations](#-kubernetes-operations)
3. [Secrets Management](#-secrets-management)
4. [Monitoring and Logging](#-monitoring-and-logging)
5. [Database Operations](#-database-operations)
6. [Backup and Recovery](#-backup-and-recovery)
7. [Performance Optimization](#-performance-optimization)
8. [Troubleshooting](#-troubleshooting)

---

## 🌐 API Gateway (Nginx)

### Features
- **Centralized Routing**: Single entry point for all API requests on port 8000
- **Rate Limiting**: Prevents API abuse and DDoS attacks
- **CORS Management**: Centralized Cross-Origin Resource Sharing configuration
- **Load Balancing**: Distributes traffic across service instances
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Request Logging**: Comprehensive access and error logs
- **Health Checks**: Built-in health monitoring

### Usage
Instead of calling services directly, route through the gateway:

**Before (Direct):**
```bash
# Direct service calls
curl http://localhost:5000/api/v1/auth/login
curl http://localhost:5062/api/v1/courses
curl http://localhost:8080/api/v1/enrollments
```

**After (Via Gateway):**
```bash
# All requests go through port 8000
curl http://localhost:8000/api/v1/auth/login
curl http://localhost:8000/api/v1/courses
curl http://localhost:8000/api/v1/enrollments
```

### Configuration

#### Rate Limits
| Zone | Rate | Burst | Endpoints |
|------|------|-------|-----------|
| `auth_limit` | 5 req/s | 10 | `/api/v1/auth/*` |
| `api_limit` | 10 req/s | 20 | All API endpoints |
| `upload_limit` | 2 req/s | 5 | Challenge submissions |

#### Routing Rules
| Path Pattern | Backend Service | Port |
|-------------|-----------------|------|
| `/api/v1/auth/*` | Flask | 5000 |
| `/api/v1/challenges/*` | Flask | 5000 |
| `/api/v1/courses/*` | .NET | 5062 |
| `/api/v1/sections/*` | .NET | 5062 |
| `/api/v1/lessons/*` | .NET | 5062 |
| `/api/v1/enrollments/*` | Spring Boot | 8080 |
| `/api/v1/progress/*` | Spring Boot | 8080 |

### Security Headers Added
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`

### Troubleshooting

#### Gateway Not Starting
```bash
# Check logs
docker logs ts-api-gateway

# Verify configuration syntax
docker exec ts-api-gateway nginx -t

# Check port 8000 availability
netstat -ano | findstr "8000"
```

#### 502 Bad Gateway
Backend service is down:
```bash
# Check all backend services
docker-compose ps

# Restart specific service
docker-compose restart flask
docker-compose restart springboot
```

#### 504 Gateway Timeout
Increase timeouts in `nginx.conf`:
```nginx
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
```

### Monitoring
View real-time statistics:
```bash
# Number of active connections
docker exec ts-api-gateway cat /var/run/nginx.pid

# Top endpoints
docker exec ts-api-gateway tail -100 /var/log/nginx/access.log | \
  grep -oP 'GET|POST|PUT|DELETE /[^ ]*' | \
  sort | uniq -c | sort -rn
```

### Updates
After changing `nginx.conf`:
```bash
# Test configuration
docker exec ts-api-gateway nginx -t

# Reload without downtime
docker exec ts-api-gateway nginx -s reload

# Or rebuild container
docker-compose up -d --build api-gateway
```

### Production Deployment

#### SSL/TLS Configuration
Add SSL certificate support:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
```

#### Environment-Specific Config
```bash
# Development
docker-compose up api-gateway

# Production
docker-compose -f docker-compose.prod.yml up api-gateway
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

This project includes automated CI/CD pipelines using GitHub Actions.

### Workflows
1. **`backend-phase10.yml`** - Phase 10 backend services
2. **`frontend.yml`** - All frontend MFEs

### Required Secrets
Set these in GitHub Settings → Secrets and variables → Actions:

#### Docker Hub
- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub password/token

#### Kubernetes
- `KUBE_CONFIG` - Base64-encoded kubeconfig file

To encode kubeconfig:
```bash
cat ~/.kube/config | base64 -w 0
```

### Automation

#### On Pull Request
- ✅ Run tests
- ✅ Build Docker images (no push)
- ✅ Lint code
- ✅ Build frontend

#### On Push to Main
- ✅ Run tests
- ✅ Build and push Docker images
- ✅ Deploy to Kubernetes
- ✅ Build and deploy frontend

### Workflow Triggers

**Backend Phase 10**:
- Triggered when files change in:
  - `backends/backend-assistant/**`
  - `backends/backend-recruitment/**`
  - `backends/backend-gamification/**`

**Frontend**:
- Triggered when files change in:
  - `frontend/**`

### Manual Deployment
You can also trigger deployments manually:
```bash
# From GitHub UI: Actions → Select Workflow → Run workflow
```

### Monitoring Deployments
Check deployment status:
```bash
# View workflow runs
gh run list

# View specific run
gh run view RUN_ID

# Watch live logs
gh run watch
```

### Customization
Edit workflows in `.github/workflows/` to:
- Add more tests
- Change deployment targets
- Add notifications (Slack, email)
- Add security scanning
- Implement blue-green deployments

### Local Testing
Test workflows locally with [act](https://github.com/nektos/act):
```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act push
```

### Best Practices
1. **Always run tests first** - Don't deploy broken code
2. **Use semantic versioning** - Tag releases properly
3. **Monitor deployments** - Set up alerts
4. **Rollback plan** - Keep previous versions
5. **Secrets rotation** - Update regularly

---

## 🚀 Deployment

### Production Deployment Checklist

- [ ] **Environment Setup**
  - [ ] Production environment variables configured
  - [ ] SSL/TLS certificates installed
  - [ ] Database migrations applied
  - [ ] API keys configured (OpenAI, Email providers, AWS S3)
  
- [ ] **Infrastructure**
  - [ ] Load balancer configured
  - [ ] Reverse proxy (Nginx) configured
  - [ ] Database backups enabled
  - [ ] Monitoring tools installed
  
- [ ] **Security**
  - [ ] Secrets properly managed (see [Secrets Management](#-secrets-management))
  - [ ] Security headers enabled
  - [ ] Rate limiting configured
  - [ ] CORS properly configured
  
- [ ] **Testing**
  - [ ] Integration tests passed
  - [ ] Load testing completed
  - [ ] Security audit passed
  - [ ] Health checks verified

### Deployment Script

#### Using Docker Compose (Production)
```bash
# Deploy all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check service status
docker-compose -f docker-compose.production.yml ps

# Stop services
docker-compose -f docker-compose.production.yml down
```

#### Using Deployment Script
```bash
# Run production deployment
./scripts/deploy-production.sh

# Monitor deployment
./scripts/monitor-production.sh
```

### Environment Configuration

#### Production Environment Variables
```bash
# Node Environment
NODE_ENV=production
LOG_LEVEL=info

# Database
DB_HOST=production-db.example.com
DB_PORT=5432
DB_NAME=talentsphere
DB_USER=talentsphere_prod
DB_PASSWORD_FILE=/run/secrets/postgres_password
DB_SSL=true
DB_POOL_MAX=50
DB_POOL_MIN=10

# JWT Security
JWT_SECRET_FILE=/run/secrets/jwt_secret
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800

# API Keys
OPENAI_API_KEY_FILE=/run/secrets/openai_api_key
AWS_ACCESS_KEY_ID_FILE=/run/secrets/aws_access_key
AWS_SECRET_ACCESS_KEY_FILE=/run/secrets/aws_secret_key

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD_FILE=/run/secrets/smtp_password

# File Storage (S3)
STORAGE_TYPE=s3
AWS_S3_BUCKET=talentsphere-production
AWS_REGION=us-east-1

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://talentsphere.com
```

### Nginx Configuration

#### Reverse Proxy Setup
```nginx
upstream api_gateway {
    least_conn;
    server api-gateway:8000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.talentsphere.com;

    ssl_certificate /etc/ssl/certs/talentsphere.crt;
    ssl_certificate_key /etc/ssl/private/talentsphere.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location /api/ {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        proxy_pass http://api_gateway;
    }
}
```

---

## ☸️ Kubernetes Operations

### Prerequisites
- Kubernetes cluster (v1.24+)
- kubectl configured
- Docker images built and pushed to registry
- Helm (optional, for package management)

### Building and Pushing Images

#### Build All Services
```bash
# Set your registry
REGISTRY=your-registry.io/talentsphere

# Backend Enhanced Services
for service in auth user job company application network notification search file analytics video email; do
    cd backends/backend-enhanced/${service}-service
    docker build -t ${REGISTRY}/${service}-service:latest .
    docker push ${REGISTRY}/${service}-service:latest
    cd ../../..
done

# Python Services
cd backends/backend-assistant
docker build -t ${REGISTRY}/backend-assistant:latest .
docker push ${REGISTRY}/backend-assistant:latest

cd ../backend-recruitment
docker build -t ${REGISTRY}/backend-recruitment:latest .
docker push ${REGISTRY}/backend-recruitment:latest

cd ../backend-gamification
docker build -t ${REGISTRY}/backend-gamification:latest .
docker push ${REGISTRY}/backend-gamification:latest

# Collaboration Service
cd ../backend-collaboration
docker build -t ${REGISTRY}/collaboration-service:latest .
docker push ${REGISTRY}/collaboration-service:latest

# API Gateway
cd ../../api-gateway
docker build -t ${REGISTRY}/api-gateway:latest .
docker push ${REGISTRY}/api-gateway:latest

# Frontend
cd ../frontends/frontend-application
docker build -t ${REGISTRY}/frontend:latest .
docker push ${REGISTRY}/frontend:latest
```

### Kubernetes Deployment

#### Deploy Services
```bash
cd k8s

# Create namespaces
kubectl apply -f namespaces.yaml

# Deploy infrastructure
kubectl apply -f postgres.yaml
kubectl apply -f rabbitmq.yaml

# Deploy backend services
kubectl apply -f api-gateway.yaml
kubectl apply -f backend-flask.yaml
kubectl apply -f backend-assistant.yaml
kubectl apply -f backend-recruitment.yaml
kubectl apply -f backend-gamification.yaml
kubectl apply -f collaboration-service.yaml

# Deploy frontend
kubectl apply -f frontend-deployments.yaml

# Deploy ingress
kubectl apply -f ingress.yaml

# Verify deployments
kubectl get deployments -n talentsphere
kubectl get pods -n talentsphere
kubectl get services -n talentsphere
```

#### Update Deployments
```bash
# Rolling update for specific service
kubectl set image deployment/auth-service auth-service=${REGISTRY}/auth-service:v1.2.0 -n talentsphere

# Rollback if needed
kubectl rollout undo deployment/auth-service -n talentsphere

# Check rollout status
kubectl rollout status deployment/auth-service -n talentsphere
```

### Horizontal Pod Autoscaling

#### Configure HPA
```bash
# Enable HPA for services
kubectl autoscale deployment auth-service --cpu-percent=70 --min=2 --max=10 -n talentsphere
kubectl autoscale deployment user-service --cpu-percent=70 --min=2 --max=10 -n talentsphere
kubectl autoscale deployment job-service --cpu-percent=70 --min=3 --max=15 -n talentsphere
kubectl autoscale deployment search-service --cpu-percent=70 --min=2 --max=10 -n talentsphere

# Check HPA status
kubectl get hpa -n talentsphere

# Describe HPA details
kubectl describe hpa auth-service -n talentsphere
```

#### Manual Scaling
```bash
# Scale up/down manually
kubectl scale deployment auth-service --replicas=5 -n talentsphere
kubectl scale deployment job-service --replicas=10 -n talentsphere
```

### Service Monitoring

#### View Logs
```bash
# Follow logs for specific service
kubectl logs -f deployment/auth-service -n talentsphere

# View logs from multiple pods
kubectl logs -f -l app=auth-service -n talentsphere

# View logs from specific time
kubectl logs --since=1h deployment/auth-service -n talentsphere
```

#### Resource Monitoring
```bash
# Get pod metrics
kubectl top pods -n talentsphere

# Get node metrics
kubectl top nodes

# Describe pod for detailed info
kubectl describe pod <pod-name> -n talentsphere
```

### Health Checks

#### Port Forward for Testing
```bash
# Port forward API Gateway
kubectl port-forward svc/api-gateway 8000:80 -n talentsphere

# Port forward specific service
kubectl port-forward svc/auth-service 3001:3001 -n talentsphere

# Test health endpoint
curl http://localhost:8000/health
```

### Production Best Practices

#### Resource Limits
```yaml
# Example: auth-service deployment
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

#### Readiness and Liveness Probes
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  
readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
```

#### Pod Disruption Budgets
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: auth-service-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: auth-service
```

### Cleanup
```bash
# Delete all TalentSphere resources
kubectl delete namespace talentsphere

# Or delete specific deployments
kubectl delete -f k8s/ -n talentsphere
```

---

## 🔐 Secrets Management

### Current Security Issues

1. **Hardcoded secrets** in docker-compose files
2. **Default passwords** exposed in configuration
3. **No encryption** for sensitive data at rest
4. **Missing rotation** policies for credentials

# Service Deployment and Operations

The following services have been fully implemented and are ready for deployment:

1. **Job Listing Service** - Complete implementation with Dockerfile and Kubernetes configuration
2. **User Profile Service** - Complete implementation with Dockerfile and Kubernetes configuration

### Implementation Strategy

#### Phase 1: Environment Variables (Immediate - Week 1)

**Migrate from hardcoded values to environment variables:**

```bash
# Before (INSECURE)
POSTGRES_PASSWORD=talentsphere123

# After (SECURE)
POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
```

**Implementation:**
```yaml
# docker-compose.yml
services:
  postgres:
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
    secrets:
      - postgres_password

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

#### Phase 2: Docker Secrets (Short-term - Week 2-3)

**Use Docker Swarm secrets for production:**

```bash
# Create secrets
echo "$(openssl rand -base64 32)" | docker secret create postgres_password -
echo "$(openssl rand -base64 64)" | docker secret create jwt_secret -
echo "${OPENAI_API_KEY}" | docker secret create openai_api_key -

# List secrets
docker secret ls

# Inspect secret (shows metadata only, not content)
docker secret inspect postgres_password
```

**docker-compose.yml with secrets:**
```yaml
services:
  backend-flask:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      OPENAI_API_KEY_FILE: /run/secrets/openai_api_key
    secrets:
      - postgres_password
      - jwt_secret
      - openai_api_key

secrets:
  postgres_password:
    external: true
  jwt_secret:
    external: true
  openai_api_key:
    external: true
```

#### Phase 3: HashiCorp Vault (Long-term - Month 2)

**Enterprise-grade secrets management with Vault:**

**1. Setup Vault:**
```bash
# Start Vault container
docker run -d \
  --name vault \
  -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=dev-token \
  vault:latest

# Initialize Vault
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=dev-token

vault secrets enable kv-v2
```

**2. Store Secrets:**
```bash
# Store database credentials
vault kv put secret/talentsphere/postgres \
  username=talentsphere_user \
  password="$(openssl rand -base64 32)"

# Store JWT secret
vault kv put secret/talentsphere/jwt \
  secret="$(openssl rand -base64 64)"

# Store API keys
vault kv put secret/talentsphere/openai \
  api_key="${OPENAI_API_KEY}"

vault kv put secret/talentsphere/aws \
  access_key_id="${AWS_ACCESS_KEY_ID}" \
  secret_access_key="${AWS_SECRET_ACCESS_KEY}"
```

**3. Application Integration:**
```javascript
// Example: Node.js service
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function getSecret(path) {
  const result = await vault.read(`secret/data/talentsphere/${path}`);
  return result.data.data;
}

// Usage
const dbCreds = await getSecret('postgres');
const dbPassword = dbCreds.password;
```

### Secrets Categories

#### Database Secrets
- PostgreSQL credentials
- Connection strings
- Backup encryption keys
- Read replica credentials

#### Application Secrets
- JWT signing keys
- API keys (OpenAI, SendGrid, etc.)
- Encryption salts
- Session secrets
- OAuth client secrets

#### Infrastructure Secrets
- SSL/TLS certificates and keys
- SSH keys for deployment
- Cloud provider credentials (AWS, Azure, GCP)
- Registry credentials

### Rotation Policies

#### Database Credentials
- **Frequency:** Every 90 days
- **Method:** Automated via Vault
- **Process:**
  1. Generate new credentials in Vault
  2. Update application config
  3. Rolling restart services
  4. Revoke old credentials after grace period
- **Notification:** Slack/email 7 days before rotation

#### JWT Secrets
- **Frequency:** Every 30 days
- **Method:** Rolling deployment with overlap
- **Process:**
  1. Generate new JWT secret
  2. Deploy with both old and new secrets (7-day overlap)
  3. Switch to new secret only
  4. Revoke old secret
- **Grace Period:** 7 days for token validity

#### API Keys
- **Frequency:** Every 60 days
- **Method:** Provider dashboard + Vault update
- **Process:**
  1. Generate new key in provider dashboard
  2. Update in Vault
  3. Deploy updated config
  4. Test functionality
  5. Revoke old key after 24 hours
- **Fallback:** Secondary key active during rotation

### Setup Scripts

#### setup-secrets.sh
```bash
#!/bin/bash
set -e

VAULT_ADDR=${VAULT_ADDR:-http://localhost:8200}
VAULT_TOKEN=${VAULT_TOKEN}

echo "🔐 Setting up TalentSphere secrets..."

# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Database secrets
echo "📦 Creating database secrets..."
vault kv put secret/talentsphere/postgres \
  username=talentsphere_user \
  password="$(openssl rand -base64 32)"

# Application secrets
echo "🔑 Creating application secrets..."
vault kv put secret/talentsphere/jwt \
  secret="$(openssl rand -base64 64)" \
  refresh_secret="$(openssl rand -base64 64)"

vault kv put secret/talentsphere/openai \
  api_key="${OPENAI_API_KEY:-REPLACE_WITH_REAL_KEY}"

vault kv put secret/talentsphere/aws \
  access_key_id="${AWS_ACCESS_KEY_ID:-REPLACE_WITH_REAL_KEY}" \
  secret_access_key="${AWS_SECRET_ACCESS_KEY:-REPLACE_WITH_REAL_KEY}" \
  s3_bucket="${AWS_S3_BUCKET:-talentsphere-files}" \
  region="${AWS_REGION:-us-east-1}"

vault kv put secret/talentsphere/smtp \
  host="${SMTP_HOST:-smtp.sendgrid.net}" \
  port="${SMTP_PORT:-587}" \
  user="${SMTP_USER:-apikey}" \
  password="${SMTP_PASSWORD:-REPLACE_WITH_REAL_KEY}"

# Create policy
echo "📋 Creating Vault policy..."
vault policy write talentsphere - <<EOF
path "secret/data/talentsphere/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/talentsphere/*" {
  capabilities = ["read", "list"]
}
EOF

# Create token for services
echo "🎫 Creating service token..."
vault token create \
  -policy=talentsphere \
  -ttl=720h \
  -renewable=true \
  -display-name="talentsphere-services"

echo "✅ Secrets setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Save the service token above"
echo "2. Set VAULT_TOKEN in service environments"
echo "3. Update docker-compose.yml with Vault integration"
echo "4. Restart services to use new secrets"
```

#### rotate-secrets.sh
```bash
#!/bin/bash
set -e

echo "🔄 Rotating TalentSphere secrets..."

# Rotate database password
echo "🗄️ Rotating database password..."
NEW_DB_PASSWORD=$(openssl rand -base64 32)
vault kv patch secret/talentsphere/postgres password="$NEW_DB_PASSWORD"

# Rotate JWT secrets
echo "🔑 Rotating JWT secrets..."
NEW_JWT_SECRET=$(openssl rand -base64 64)
vault kv patch secret/talentsphere/jwt secret="$NEW_JWT_SECRET"

# Trigger rolling restart
echo "🔄 Restarting services..."
docker-compose restart backend-flask backend-assistant backend-recruitment backend-gamification

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Verify services
echo "✅ Verifying service health..."
curl -f http://localhost:5000/health || echo "⚠️ Flask Core service not healthy"
curl -f http://localhost:5005/health || echo "⚠️ AI Assistant service not healthy"
curl -f http://localhost:5006/health || echo "⚠️ Recruitment service not healthy"
curl -f http://localhost:5007/health || echo "⚠️ Gamification service not healthy"

echo "✅ Secret rotation complete!"
echo "📅 Next rotation: $(date -d '+90 days' '+%Y-%m-%d')"
```

### Monitoring Secret Access

#### Vault Audit Logging
```bash
# Enable audit logging
vault audit enable file file_path=/var/log/vault_audit.log

# View audit logs
tail -f /var/log/vault_audit.log | jq .

# Filter for specific operations
cat /var/log/vault_audit.log | jq 'select(.request.path | contains("talentsphere"))'
```

#### Alert on Secret Access
```bash
# Setup alerts for sensitive operations
vault policy write alert-on-secret-write - <<EOF
path "secret/data/talentsphere/postgres" {
  capabilities = ["read"]
}
EOF

# Slack notification example
curl -X POST -H 'Content-type: application/json' \
  --data '{"text": "🔐 Database secret accessed by: '"$USER"'"}' \
  $SLACK_WEBHOOK_URL
```

### Emergency Procedures

#### Secret Compromise Response

**Immediate Actions (< 5 minutes):**
1. Revoke compromised secrets in Vault
2. Generate new secrets
3. Update services with new secrets
4. Force logout all users (if auth secrets compromised)

**Investigation (< 30 minutes):**
1. Check Vault audit logs for unauthorized access
2. Review application logs for anomalous behavior
3. Identify affected systems and data
4. Document timeline of compromise

**Recovery (< 2 hours):**
1. Rotate all potentially affected secrets
2. Update all dependent systems
3. Verify service functionality
4. Monitor for continued unauthorized access

**Communication:**
1. Notify security team immediately
2. Notify affected stakeholders
3. Document incident and response
4. Update security procedures

#### Recovery Script
```bash
#!/bin/bash
# emergency-secret-rotation.sh
set -e

echo "🚨 EMERGENCY: Rotating all secrets..."

# Rotate all database credentials
vault kv put secret/talentsphere/postgres \
  username=talentsphere_user \
  password="$(openssl rand -base64 32)"

# Rotate all JWT secrets
vault kv put secret/talentsphere/jwt \
  secret="$(openssl rand -base64 64)" \
  refresh_secret="$(openssl rand -base64 64)"

# Force restart all services
docker-compose down
docker-compose up -d

echo "✅ Emergency rotation complete"
echo "📋 Create incident report"
echo "🔍 Review audit logs"
```

### Security Checklist

- [ ] Remove all hardcoded secrets from codebase
- [ ] Implement environment variable overrides
- [ ] Set up Docker secrets for all services
- [ ] Configure HashiCorp Vault
- [ ] Implement automated rotation policies
- [ ] Enable audit logging for secret access
- [ ] Create backup and recovery procedures
- [ ] Update CI/CD pipelines to use secrets
- [ ] Document secret locations and purposes
- [ ] Train team on secrets management
- [ ] Test emergency rotation procedures
- [ ] Set up monitoring and alerts

---

## 📊 Monitoring and Logging

### Application Monitoring

#### Health Checks
All services expose `/health` endpoints:
```bash
# Check all services
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health | jq .
done

# API Gateway health
curl http://localhost:8000/health
```

#### Metrics Collection
```bash
# Prometheus metrics endpoint (if configured)
curl http://localhost:8000/metrics

# Custom metrics
curl http://localhost:8000/api/v1/analytics/metrics
```

### Log Management

#### View Service Logs
```bash
# Docker logs
docker-compose logs -f auth-service
docker-compose logs -f --tail=100 job-service

# Kubernetes logs
kubectl logs -f deployment/auth-service -n talentsphere

# Application logs
tail -f logs/auth-service.log
tail -f logs/job-service.log
```

#### Log Aggregation
```bash
# Using ELK Stack (Elasticsearch, Logstash, Kibana)
# Configure Filebeat to ship logs

# Example Filebeat configuration
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/talentsphere/*.log
  fields:
    service: talentsphere

output.elasticsearch:
  hosts: ["localhost:9200"]
```

### Alerting

#### Health Check Alerts
```bash
# Simple monitoring script
#!/bin/bash
# monitor-services.sh

SERVICES=("3001:auth" "3002:user" "3003:job" "3007:company")

for service in "${SERVICES[@]}"; do
  PORT="${service%%:*}"
  NAME="${service##*:}"
  
  if ! curl -sf http://localhost:$PORT/health > /dev/null; then
    echo "⚠️ ALERT: $NAME service is down!"
    # Send alert (Slack, email, PagerDuty, etc.)
  fi
done
```

---

## 🗄️ Database Operations

### Backup Procedures

#### Automated Daily Backups
```bash
#!/bin/bash
# database-backup.sh

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="talentsphere"

# Create backup
pg_dump -h localhost -U talentsphere_user -d $DB_NAME | \
  gzip > "$BACKUP_DIR/talentsphere_$TIMESTAMP.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/talentsphere_$TIMESTAMP.sql.gz" \
  s3://talentsphere-backups/database/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup complete: talentsphere_$TIMESTAMP.sql.gz"
```

#### Database Restoration
```bash
# Restore from backup
gunzip -c talentsphere_20260127_120000.sql.gz | \
  psql -h localhost -U talentsphere_user -d talentsphere

# Restore from S3
aws s3 cp s3://talentsphere-backups/database/talentsphere_20260127_120000.sql.gz - | \
  gunzip | psql -h localhost -U talentsphere_user -d talentsphere
```

### Database Migrations

#### Apply Migrations
```bash
# Run migration script
node scripts/migrate-database.js

# Or use SQL directly
psql -h localhost -U talentsphere_user -d talentsphere -f migrations/003_add_new_table.sql
```

#### Rollback Migrations
```bash
# Restore from backup before migration
# Then re-apply up to specific version
```

### Performance Monitoring

#### Database Performance Analysis
```bash
# Run optimization check
python scripts/database_optimization.py

# Check index usage
psql -h localhost -U talentsphere_user -d talentsphere -c "
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC
LIMIT 20;"

# Check slow queries
psql -h localhost -U talentsphere_user -d talentsphere -c "
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"
```

---

## 🔄 Backup and Recovery

### Backup Strategy

#### What to Backup
1. **Database** - Daily full backups, hourly incremental
2. **Uploaded Files** - Continuous sync to S3
3. **Configuration** - Version controlled in Git
4. **Secrets** - Encrypted backups in Vault
5. **Logs** - Shipped to centralized logging

#### Backup Schedule
```bash
# Cron configuration
0 2 * * * /scripts/database-backup.sh        # Daily at 2 AM
0 * * * * /scripts/incremental-backup.sh     # Hourly
0 4 * * 0 /scripts/weekly-full-backup.sh     # Weekly full backup
```

### Disaster Recovery

#### Recovery Time Objective (RTO): 4 hours
#### Recovery Point Objective (RPO): 1 hour

#### Recovery Procedures

**Scenario 1: Database Corruption**
```bash
# 1. Stop all services
docker-compose down

# 2. Restore from latest backup
./scripts/restore-database.sh latest

# 3. Verify database integrity
psql -h localhost -U talentsphere_user -d talentsphere -c "
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM jobs;
SELECT COUNT(*) FROM applications;"

# 4. Start services
docker-compose up -d

# 5. Verify health
./scripts/verify-system.sh
```

**Scenario 2: Complete Infrastructure Loss**
```bash
# 1. Provision new infrastructure
# 2. Deploy services using Kubernetes
kubectl apply -f k8s/

# 3. Restore database from S3
aws s3 cp s3://talentsphere-backups/database/latest.sql.gz - | \
  gunzip | psql -h new-db-host -U talentsphere_user -d talentsphere

# 4. Verify and test
./scripts/verify-system.sh
```

---

## ⚡ Performance Optimization

### Database Optimization

#### Index Management
```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;

-- Create indexes based on query patterns
CREATE INDEX CONCURRENTLY idx_jobs_company_status 
ON jobs(company_id, status) 
WHERE status = 'active';
```

#### Query Optimization
```bash
# Analyze query performance
python scripts/database_optimization.py

# Vacuum and analyze
psql -h localhost -U talentsphere_user -d talentsphere -c "VACUUM ANALYZE;"
```

### Application Performance

#### Caching Strategy
```javascript
// Redis caching example
const redis = require('redis');
const client = redis.createClient();

async function getCachedData(key, fetchFunction, ttl = 3600) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFunction();
  await client.setEx(key, ttl, JSON.stringify(data));
  return data;
}
```

#### Load Testing
```bash
# Using k6
k6 run --vus 100 --duration 30s tests/load-test.js

# Using Apache Bench
ab -n 10000 -c 100 http://localhost:8000/api/v1/jobs

# Monitor during load test
./scripts/monitor-production.sh
```

---

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check environment variables
docker-compose exec service-name env | grep DB_

# Check dependencies
docker-compose exec service-name npm list
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
psql -h localhost -U talentsphere_user -d talentsphere -c "SELECT 1;"

# Check connection pool
psql -h localhost -U talentsphere_user -d talentsphere -c "
SELECT COUNT(*) FROM pg_stat_activity;"
```

#### High Memory Usage
```bash
# Check container stats
docker stats

# Kubernetes pod resources
kubectl top pods -n talentsphere

# Adjust memory limits in docker-compose.yml
```

#### Performance Degradation
```bash
# Check database performance
python scripts/database_optimization.py

# Check slow queries
psql -h localhost -U talentsphere_user -d talentsphere -c "
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"

# Check index usage
python scripts/check_database_optimization.py
```

### Debug Mode

#### Enable Debug Logging
```bash
# Set in .env
DEBUG=true
LOG_LEVEL=debug
NODE_ENV=development

# Restart services
docker-compose restart
```

#### View Debug Logs
```bash
# Follow logs with debug output
docker-compose logs -f --tail=100 service-name | grep DEBUG
```

---

## 📚 Related Documentation

- **[SYSTEM.md](./SYSTEM.md)** - Complete system architecture and service catalog
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Comprehensive API endpoint documentation
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development environment setup
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and updates

---

## 📞 Support

### Emergency Contacts
- **Database Issues:** DBA Team
- **Infrastructure Issues:** DevOps Team
- **Security Incidents:** Security Team
- **Application Issues:** Development Team

### Incident Response
1. **Identify** - Detect and classify incident
2. **Contain** - Limit impact and prevent spread
3. **Investigate** - Determine root cause
4. **Resolve** - Implement fix
5. **Document** - Create incident report
6. **Review** - Post-mortem and prevention

---

*This operations guide is maintained alongside the platform and updated with operational changes.*


