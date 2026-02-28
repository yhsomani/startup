# TalentSphere

> **Professional Development Platform for Developers**

TalentSphere is a comprehensive platform connecting developers with career opportunities while providing tools for skill development, networking, and professional growth.

##🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)
- Redis 6+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/talentsphere.git
cd talentsphere

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development services
npm run dev
```

### Development Setup

```bash
# Start all services
docker-compose up -d

# Run database migrations
npm run db:migrate

# Start development server
npm run start:dev
```

## Architecture Overview

TalentSphere follows a microservices architecture with:

- **Frontend**: Micro-frontend architecture (React/TypeScript)
- **API Gateway**: Central routing and authentication
- **Backend Services**: Independent Node.js/Python/.NET services
- **Database**: PostgreSQL with connection pooling
- **Messaging**: RabbitMQ for event-driven communication
- **Monitoring**: Prometheus + Grafana for observability

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SSOT.md](docs/SSOT.md) | Single Source of Truth - Complete architecture reference |
| [SYSTEM.md](docs/SYSTEM.md) | System design and components |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development setup and practices |

##🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development environment
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run build        # Build production assets
npm run lint         # Run code linting
npm run format       # Format code with Prettier
```

### Environment Variables

Key environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/talentsphere
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-here
```

##🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [SSOT.md](docs/SSOT.md) for complete contribution guidelines and architecture decisions.

## 📈 Roadmap

See the open issues for a list of proposed features and known issues.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [SSOT.md](docs/SSOT.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/talentsphere/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/talentsphere/discussions)

---

*Built with ❤️ for developers*