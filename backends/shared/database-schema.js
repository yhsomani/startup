/**
 * TalentSphere Database Schema and Migration Manager
 * Comprehensive database setup with all required tables and indexes
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../shared/config');

class DatabaseSchema {
  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      ssl: config.database.ssl
    });
  }

  // Initialize database with all schemas
  async initialize() {
    try {
      await this.pool.connect();
      
      // Run migrations in order
      await this.createExtensions();
      await this.createUsersTable();
      await this.createCompaniesTable();
      await this.createJobsTable();
      await this.createJobApplicationsTable();
      await this.createJobViewsTable();
      await this.createConnectionsTable();
      await this.createConversationsTable();
      await this.createMessagesTable();
      await this.createNotificationsTable();
      await this.createAnalyticsTables();
      await this.createSearchIndexes();
      
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Database schema initialization failed:', error);
      throw error;
    }
  }

  // Create PostgreSQL extensions
  async createExtensions() {
    const extensions = [
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      'CREATE EXTENSION IF NOT EXISTS "pg_trgm";',  // For text search
      'CREATE EXTENSION IF NOT EXISTS "unaccent";', // For accents
      'CREATE EXTENSION IF NOT EXISTS "btree_gin";'  // For GIN indexes
    ];

    for (const extension of extensions) {
      await this.pool.query(extension);
    }
  }

  // Users table
  async createUsersTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        headline VARCHAR(200),
        bio TEXT,
        avatar_url VARCHAR(500),
        phone VARCHAR(20),
        location JSONB,
        role VARCHAR(50) DEFAULT 'employee',
        permissions TEXT[] DEFAULT ARRAY['read'],
        company_id UUID REFERENCES companies(id),
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Search vector
        search_vector tsvector GENERATED ALWAYS AS (
          to_tsvector('english', 
            COALESCE(first_name, '') || ' ' || 
            COALESCE(last_name, '') || ' ' || 
            COALESCE(headline, '') || ' ' || 
            COALESCE(bio, '') || ' ' || 
            COALESCE(role, '')
          )
        ) STORED
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN(search_vector);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `;

    await this.pool.query(query);
  }

  // Companies table
  async createCompaniesTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        industry VARCHAR(100),
        size VARCHAR(50),
        website VARCHAR(500),
        headquarters VARCHAR(255),
        founded_year INTEGER,
        logo_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Search vector
        search_vector tsvector GENERATED ALWAYS AS (
          to_tsvector('english', 
            COALESCE(name, '') || ' ' || 
            COALESCE(description, '') || ' ' || 
            COALESCE(industry, '')
          )
        ) STORED
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
      CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
      CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);
      CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING GIN(search_vector);
      CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);
    `;

    await this.pool.query(query);
  }

  // Jobs table
  async createJobsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        posted_by UUID NOT NULL REFERENCES users(id),
        employment_type VARCHAR(50) DEFAULT 'full-time',
        experience_level VARCHAR(50) DEFAULT 'mid',
        location JSONB,
        salary_min DECIMAL(12,2),
        salary_max DECIMAL(12,2),
        salary_currency VARCHAR(3) DEFAULT 'USD',
        salary_period VARCHAR(20) DEFAULT 'yearly',
        requirements TEXT[],
        benefits TEXT[],
        skills_required JSONB DEFAULT '[]',
        remote_type VARCHAR(50) DEFAULT 'onsite',
        deadline TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        application_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        
        -- Search vector
        search_vector tsvector GENERATED ALWAYS AS (
          to_tsvector('english', 
            COALESCE(title, '') || ' ' || 
            COALESCE(description, '') || ' ' || 
            COALESCE(employment_type, '') || ' ' || 
            COALESCE(experience_level, '') || ' ' || 
            array_to_string(COALESCE(requirements, ARRAY[]::text[]), ' ') || ' ' ||
            array_to_string(COALESCE(benefits, ARRAY[]::text[]), ' ')
          )
        ) STORED
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
      CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
      CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
      CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
      CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs(is_featured);
      CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);
      CREATE INDEX IF NOT EXISTS idx_jobs_salary_min ON jobs(salary_min);
      CREATE INDEX IF NOT EXISTS idx_jobs_salary_max ON jobs(salary_max);
      CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING GIN(search_vector);
      CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills_required);
    `;

    await this.pool.query(query);
  }

  // Job applications table
  async createJobApplicationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        cover_letter TEXT,
        resume_url VARCHAR(500),
        portfolio_url VARCHAR(500),
        answers JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'pending',
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_unique ON job_applications(job_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
      CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at DESC);
    `;

    await this.pool.query(query);
  }

  // Job views table
  async createJobViewsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS job_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        ip_address INET,
        user_agent TEXT,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
      CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at DESC);
    `;

    await this.pool.query(query);
  }

  // Connections table
  async createConnectionsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS connections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        message TEXT,
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT unique_connection UNIQUE (
          LEAST(user_id_1, user_id_2),
          GREATEST(user_id_1, user_id_2)
        )
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_connections_user1 ON connections(user_id_1);
      CREATE INDEX IF NOT EXISTS idx_connections_user2 ON connections(user_id_2);
      CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
      CREATE INDEX IF NOT EXISTS idx_connections_updated_at ON connections(updated_at DESC);
    `;

    await this.pool.query(query);
  }

  // Conversations table
  async createConversationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) DEFAULT '',
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
    `;

    await this.pool.query(query);
  }

  // Conversation participants table
  async createConversationParticipantsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(conversation_id, user_id)
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
    `;

    await this.pool.query(query);
  }

  // Messages table
  async createMessagesTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        attachments JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
    `;

    await this.pool.query(query);
  }

  // Notifications table
  async createNotificationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
    `;

    await this.pool.query(query);
  }

  // Analytics tables
  async createAnalyticsTables() {
    const jobAnalytics = `
      CREATE TABLE IF NOT EXISTS job_analytics (
        date DATE PRIMARY KEY,
        new_applications INTEGER DEFAULT 0,
        total_applications INTEGER DEFAULT 0,
        viewed_applications INTEGER DEFAULT 0,
        interviewing_applications INTEGER DEFAULT 0,
        offers_made INTEGER DEFAULT 0,
        offers_accepted INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const userAnalytics = `
      CREATE TABLE IF NOT EXISTS user_analytics (
        date DATE PRIMARY KEY,
        new_users INTEGER DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        total_connections INTEGER DEFAULT 0,
        messages_sent INTEGER DEFAULT 0,
        job_applications INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const searchAnalytics = `
      CREATE TABLE IF NOT EXISTS search_analytics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        search_term TEXT NOT NULL,
        search_type VARCHAR(50),
        user_id UUID REFERENCES users(id),
        results_count INTEGER DEFAULT 0,
        searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await this.pool.query(jobAnalytics);
    await this.pool.query(userAnalytics);
    await this.pool.query(searchAnalytics);
  }

  // Create optimized search indexes
  async createSearchIndexes() {
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_trgm ON jobs USING GIN (title gin_trgm_ops);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_description_trgm ON jobs USING GIN (description gin_trgm_ops);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_trgm ON users USING GIN (first_name gin_trgm_ops);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_lastname_trgm ON users USING GIN (last_name gin_trgm_ops);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_trgm ON companies USING GIN (name gin_trgm_ops);'
    ];

    for (const index of indexes) {
      try {
        await this.pool.query(index);
      } catch (error) {
        console.warn(`Index creation warning:`, error.message);
      }
    }
  }

  // Run specific migration
  async runMigration(migrationName) {
    const migrationsPath = path.join(__dirname, 'migrations', `${migrationName}.sql`);
    
    try {
      const migrationSQL = await fs.readFile(migrationsPath, 'utf8');
      await this.pool.query(migrationSQL);
      console.log(`✅ Migration ${migrationName} executed successfully`);
    } catch (error) {
      console.error(`❌ Migration ${migrationName} failed:`, error);
      throw error;
    }
  }

  // Close connection pool
  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseSchema;