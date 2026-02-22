# TalentSphere

> **Single Source of Truth**: [docs/SSOT.md](./docs/SSOT.md)

TalentSphere is a comprehensive talent acquisition and professional networking platform built with modern microservices
architecture.

## Quick Links

- **Technical Documentation**: [docs/SSOT.md](./docs/SSOT.md)
- **Business Operations**: [business-ops/](./business-ops/)
- **API Reference**: See OpenAPI specs in service `/api/` directories
- **Setup Guide**: See [docs/SSOT.md](./docs/SSOT.md) → Section 6

## Project Status

| Component        | Status                |
| ---------------- | --------------------- |
| Backend Services | ✅ 14 microservices   |
| Frontend (MFE)   | ✅ React + TypeScript |
| Infrastructure   | ✅ Docker, K8s        |
| Documentation    | ✅ SSOT established   |

## Getting Started

```bash
# Clone and setup
cp .env.example .env
node scripts/generate-secrets.js

# Start infrastructure
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Start services
node scripts/start-services.js
```

See [docs/SSOT.md](./docs/SSOT.md) for complete setup instructions.

---

_For detailed architecture, feature mapping, and development guidelines, see [docs/SSOT.md](./docs/SSOT.md)_
