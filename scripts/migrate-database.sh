#!/bin/bash

# TalentSphere Database Migration Runner
# This script runs all database migrations in order

set -e

echo "🗄️  Starting TalentSphere Database Migration..."

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-talentsphere}
DB_USER=${DB_USER:-talentsphere_user}
DB_PASSWORD=${DB_PASSWORD:-ts_password_2024}

# Export for psql
export PGPASSWORD=$DB_PASSWORD

echo "📡 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"

# Check if database exists
echo "🔍 Checking database existence..."
psql -h $DB_HOST -p $DB_PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME

if [ $? -ne 0 ]; then
    echo "📝 Creating database: $DB_NAME"
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME;"
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

echo "🚀 Running database migrations..."

# Run the main migration file
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backends/database/migrations/000_initial_schema.sql -v ON_ERROR_STOP=1

echo "✅ Database migrations completed successfully!"

# Create seed data directory if it doesn't exist
mkdir -p backends/database/seeds

echo "🌱 Creating seed data..."

# Insert basic seed data
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF

-- Industry categories for jobs and companies
INSERT INTO industry_categories (name, description) VALUES
('Technology', 'Software, hardware, IT services, and technology companies'),
('Healthcare', 'Hospitals, medical services, pharmaceuticals, and healthcare technology'),
('Finance', 'Banking, insurance, investment, and financial services'),
('Education', 'Schools, universities, online learning, and educational technology'),
('Manufacturing', 'Production, engineering, and industrial companies'),
('Retail', 'Shopping, e-commerce, and consumer goods'),
('Media', 'Entertainment, publishing, advertising, and content creation'),
('Consulting', 'Business consulting, professional services, and advisory firms'),
('Non-Profit', 'Charitable organizations, NGOs, and social enterprises'),
('Government', 'Public sector, government agencies, and civil service')
ON CONFLICT (name) DO NOTHING;

-- Skills taxonomy
INSERT INTO skills (name, category, demand_level) VALUES
-- Technical Skills
('JavaScript', 'Programming', 'high'),
('Python', 'Programming', 'high'),
('React', 'Frontend', 'high'),
('Node.js', 'Backend', 'high'),
('TypeScript', 'Programming', 'medium'),
('AWS', 'Cloud', 'high'),
('Docker', 'DevOps', 'medium'),
('Kubernetes', 'DevOps', 'medium'),

-- Soft Skills
('Leadership', 'Soft Skills', 'high'),
('Communication', 'Soft Skills', 'high'),
('Problem Solving', 'Soft Skills', 'high'),
('Team Work', 'Soft Skills', 'high'),
('Project Management', 'Soft Skills', 'medium'),

-- Design Skills
('UI/UX Design', 'Design', 'medium'),
('Graphic Design', 'Design', 'medium'),
('Figma', 'Design', 'medium'),
('Adobe Creative Suite', 'Design', 'low'),

-- Data Skills
('Data Analysis', 'Data', 'high'),
('SQL', 'Data', 'high'),
('Machine Learning', 'Data', 'high'),
('Data Visualization', 'Data', 'medium'),
('Excel', 'Data', 'low')

ON CONFLICT (name) DO NOTHING;

-- Company sizes
INSERT INTO company_sizes (name, min_employees, max_employees) VALUES
('Startup', 1, 10),
('Small', 11, 50),
('Medium', 51, 250),
('Large', 251, 1000),
('Enterprise', 1001, NULL)

ON CONFLICT (name) DO NOTHING;

-- Job types
INSERT INTO job_types (name, description) VALUES
('Full-time', 'Permanent full-time employment'),
('Part-time', 'Part-time employment with reduced hours'),
('Contract', 'Fixed-term contract work'),
('Internship', 'Learning opportunity, often paid'),
('Freelance', 'Independent contract work'),
('Temporary', 'Short-term employment')

ON CONFLICT (name) DO NOTHING;

-- Location data (sample cities)
INSERT INTO locations (city, country, state, latitude, longitude) VALUES
('San Francisco', 'US', 'CA', 37.7749, -122.4194),
('New York', 'US', 'NY', 40.7128, -74.0060),
('London', 'GB', NULL, 51.5074, -0.1278),
('Berlin', 'DE', NULL, 52.5200, 13.4050),
('Tokyo', 'JP', NULL, 35.6762, 139.6503),
('Toronto', 'CA', 'ON', 43.6532, -79.3832),
('Sydney', 'AU', 'NSW', -33.8688, 151.2093),
('Paris', 'FR', NULL, 48.8566, 2.3522)

ON CONFLICT (city, country) DO NOTHING;

COMMIT;

EOF

echo "✅ Seed data created successfully!"

# Show migration status
echo "📊 Migration Summary:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    migration_name,
    executed_at
FROM schema_migrations 
ORDER BY executed_at DESC;"

echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Quick Info:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""
echo "🔗 Connection String:"
echo "   postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "🛠️  Management Tools:"
echo "   pgAdmin: http://localhost:8080 (if running)"
echo "   Redis Commander: http://localhost:8081 (if running)"