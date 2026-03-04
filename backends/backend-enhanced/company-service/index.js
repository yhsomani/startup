/**
 * Enhanced Company Service with Production Database
 * 
 * Complete company management system with:
 * - PostgreSQL integration for persistence
 * - Company profiles and verification
 * - Employee management and permissions
 * - Location management
 * - Analytics and reporting
 */

const { CompanyService } = require('./index-database');
const DatabaseConnectionPool = require('../../../../shared/database-connection-pool');
const { createLogger } = require('../../../../shared/logger');

class EnhancedCompanyService extends CompanyService {
  constructor() {
    super();
    
    this.dbPool = new DatabaseConnectionPool('company-service');
    this.logger = createLogger('EnhancedCompanyService');
    
    // Override with database operations
    this.initializeDatabaseOperations();
  }

  /**
   * Initialize database-specific operations
   */
  initializeDatabaseOperations() {
    // Override company creation with database persistence
    this.createCompany = async (companyData) => {
      return this.executeWithTracing('company.createCompany.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          await client.query('BEGIN');
          
          // Check if company name already exists
          const existingCompanyResult = await client.query(`
            SELECT id FROM companies WHERE name = $1
          `, [companyData.name]);
          
          if (existingCompanyResult.rows.length > 0) {
            throw new Error('Company with this name already exists');
          }
          
          // Insert company
          const companyResult = await client.query(`
            INSERT INTO companies (
              name, description, industry, size, website, founded_year,
              headquarters, contact, social_media, benefits, culture,
              status, verification_level, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
          `, [
            companyData.name,
            companyData.description,
            companyData.industry,
            companyData.size,
            companyData.website,
            companyData.foundedYear,
            JSON.stringify(companyData.headquarters || {}),
            JSON.stringify(companyData.contact || {}),
            JSON.stringify(companyData.socialMedia || {}),
            companyData.benefits,
            JSON.stringify(companyData.culture || {}),
            'pending_verification',
            'none',
            companyData.createdBy
          ]);
          
          const company = companyResult.rows[0];
          
          // Add creator as owner
          await client.query(`
            INSERT INTO employees (
              company_id, user_id, role, permissions, status, joined_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            company.id,
            companyData.createdBy,
            'owner',
            ['full_access'],
            'active',
            new Date().toISOString()
          ]);
          
          // Insert company benefits mapping if provided
          if (companyData.benefits && companyData.benefits.length > 0) {
            const benefitPromises = companyData.benefits.map(benefit =>
              client.query(`
                INSERT INTO company_benefits (company_id, benefit_id, description)
                SELECT $1, id, $2 FROM benefits_catalog WHERE name = $3
                ON CONFLICT (company_id, benefit_id) DO NOTHING
              `, [company.id, benefit.description, benefit])
            );
            await Promise.all(benefitPromises);
          }
          
          // Insert culture values if provided
          if (companyData.culture && companyData.culture.values) {
            const culturePromises = companyData.culture.values.map(value =>
              client.query(`
                INSERT INTO company_culture_values (company_id, value_id)
                SELECT $1, id FROM culture_values_catalog WHERE value = $2
                ON CONFLICT (company_id, value_id) DO NOTHING
              `, [company.id, value])
            );
            await Promise.all(culturePromises);
          }
          
          // Log activity
          await client.query(`
            INSERT INTO company_activity_log (
              company_id, user_id, action, entity_type, entity_id, new_values
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            company.id,
            companyData.createdBy,
            'created',
            'company',
            company.id,
            JSON.stringify(company)
          ]);
          
          // Create default company settings
          await client.query(`
            INSERT INTO company_settings (
              company_id, privacy_settings, notification_settings, branding_settings, recruitment_settings
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            company.id,
            JSON.stringify({
              profile_visibility: 'public',
              contact_visibility: 'public',
              employee_list_visibility: 'private'
            }),
            JSON.stringify({
              email_notifications: true,
              job_alerts: true,
              application_notifications: true
            }),
            JSON.stringify({
              primary_color: '#0066cc',
              secondary_color: '#ffffff',
              logo_style: 'modern'
            }),
            JSON.stringify({
              auto_approve_applications: false,
              require_screening: false,
              interview_stages: ['screening', 'technical', 'final']
            })
          ]);
          
          await client.query('COMMIT');
          
          // Cache the new company
          this.companyCache.set(company.id, company);
          
          // Send notification to user
          try {
            await this.notificationServiceClient.post('notification-service', {
              recipients: [{ userId: companyData.createdBy }],
              type: 'email',
              title: 'Company Created Successfully',
              message: `Your company "${companyData.name}" has been created and is pending verification.`,
              template: 'company_created',
              data: { companyName: companyData.name, companyId: company.id }
            }, '/notifications');
          } catch (error) {
            this.logger.warn('Failed to send company creation notification', {
              companyId: company.id,
              error: error.message
            });
          }
          
          return {
            success: true,
            company: {
              id: company.id,
              name: company.name,
              status: company.status,
              verificationLevel: company.verification_level,
              createdAt: company.created_at
            }
          };
          
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    };

    // Override company retrieval with enhanced data
    this.getCompany = async (companyId) => {
      return this.executeWithTracing('company.getCompany.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          // Check cache first
          let company = this.companyCache.get(companyId);
          
          if (!company) {
            const companyResult = await client.query(`
              SELECT c.*, 
                     COUNT(DISTINCT cl.id) FILTER (WHERE cl.is_active = TRUE) as location_count,
                     COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as employee_count,
                     cv.status as verification_status,
                     cv.verification_type,
                     cv.submitted_at as verification_submitted_at
              FROM companies c
              LEFT JOIN company_locations cl ON c.id = cl.company_id
              LEFT JOIN employees e ON c.id = e.company_id
              LEFT JOIN LATERAL (
                SELECT * FROM company_verifications 
                WHERE company_id = c.id 
                ORDER BY created_at DESC 
                LIMIT 1
              ) cv ON TRUE
              WHERE c.id = $1 AND c.is_active = TRUE
              GROUP BY c.id, cv.status, cv.verification_type, cv.submitted_at
            `, [companyId]);
            
            if (companyResult.rows.length === 0) {
              throw new Error('Company not found');
            }
            
            company = companyResult.rows[0];
            
            // Cache for 5 minutes
            this.companyCache.set(companyId, company);
            setTimeout(() => this.companyCache.delete(companyId), 5 * 60 * 1000);
          }
          
          // Get detailed company information
          const [benefitsResult, cultureResult, specializationsResult, settingsResult] = await Promise.all([
            client.query(`
              SELECT bc.name, cb.description, bc.category, bc.icon
              FROM company_benefits cb
              JOIN benefits_catalog bc ON cb.benefit_id = bc.id
              WHERE cb.company_id = $1 AND cb.is_active = TRUE
            `, [companyId]),
            
            client.query(`
              SELECT cvc.value, cvc.description, cvc.icon
              FROM company_culture_values ccv
              JOIN culture_values_catalog cvc ON ccv.value_id = cvc.id
              WHERE ccv.company_id = $1
            `, [companyId]),
            
            client.query(`
              SELECT specialization, description
              FROM company_specializations
              WHERE company_id = $1
            `, [companyId]),
            
            client.query(`
              SELECT privacy_settings, notification_settings, branding_settings, recruitment_settings
              FROM company_settings
              WHERE company_id = $1
            `, [companyId])
          ]);
          
          // Get locations
          const locationsResult = await client.query(`
            SELECT * FROM company_locations
            WHERE company_id = $1 AND is_active = TRUE
            ORDER BY is_headquarters DESC, name ASC
          `, [companyId]);
          
          return {
            success: true,
            company: {
              ...company,
              benefits: benefitsResult.rows,
              culture: {
                values: cultureResult.rows,
                description: company.culture?.description
              },
              specializations: specializationsResult.rows,
              settings: settingsResult.rows[0] || {},
              locations: locationsResult.rows,
              stats: {
                locationCount: parseInt(company.location_count),
                employeeCount: parseInt(company.employee_count),
                verification: company.verification_status ? {
                  status: company.verification_status,
                  type: company.verification_type,
                  submittedAt: company.verification_submitted_at
                } : null
              }
            }
          };
          
        } finally {
          client.release();
        }
      });
    };

    // Enhanced employee management with database
    this.getEmployees = async (companyId) => {
      return this.executeWithTracing('company.getEmployees.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          // Verify company exists
          const companyResult = await client.query(`
            SELECT id, name FROM companies WHERE id = $1 AND is_active = TRUE
          `, [companyId]);
          
          if (companyResult.rows.length === 0) {
            throw new Error('Company not found');
          }
          
          const employeesResult = await client.query(`
            SELECT e.*, cl.name as location_name, cl.city as location_city
            FROM employees e
            LEFT JOIN company_locations cl ON e.company_id = cl.company_id AND cl.is_headquarters = TRUE
            WHERE e.company_id = $1 AND e.status = 'active'
            ORDER BY e.joined_at DESC
          `, [companyId]);
          
          // Get user profiles for each employee
          const employeesWithProfiles = await Promise.all(
            employeesResult.rows.map(async (employee) => {
              try {
                const userProfile = await this.userProfileClient.get('user-profile-service', `/profiles/${employee.user_id}`);
                return {
                  ...employee,
                  profile: userProfile.data
                };
              } catch (error) {
                this.logger.warn('Failed to get user profile for employee', {
                  userId: employee.user_id,
                  error: error.message
                });
                return employee;
              }
            })
          );
          
          return {
            success: true,
            employees: employeesWithProfiles
          };
          
        } finally {
          client.release();
        }
      });
    };

    // Enhanced search with full-text search and filters
    this.searchCompanies = async (searchParams) => {
      return this.executeWithTracing('company.searchCompanies.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          const { 
            query, 
            industry, 
            size, 
            location, 
            verified = false,
            limit = 20, 
            offset = 0 
          } = searchParams;
          
          let whereClause = 'WHERE c.is_active = TRUE';
          const queryParams = [];
          let paramCount = 0;
          
          if (industry) {
            paramCount++;
            whereClause += ` AND c.industry = $${paramCount}`;
            queryParams.push(industry);
          }
          
          if (size) {
            paramCount++;
            whereClause += ` AND c.size = $${paramCount}`;
            queryParams.push(size);
          }
          
          if (verified) {
            whereClause += ' AND c.verification_level != \'none\'';
          }
          
          if (location) {
            paramCount++;
            whereClause += ` AND EXISTS (
              SELECT 1 FROM company_locations cl 
              WHERE cl.company_id = c.id 
              AND (cl.city ILIKE $${paramCount} OR cl.country ILIKE $${paramCount})
            )`;
            queryParams.push(`%${location}%`);
          }
          
          // Full-text search for company name/description
          if (query) {
            paramCount++;
            whereClause += ` AND (
              to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')) 
              @@ plainto_tsquery('english', $${paramCount})
            )`;
            queryParams.push(query);
          }
          
          // Get total count
          const countQuery = `
            SELECT COUNT(*) as total
            FROM companies c
            ${whereClause}
          `;
          
          const countResult = await client.query(countQuery, queryParams);
          const total = parseInt(countResult.rows[0].total);
          
          // Get companies with pagination
          paramCount++;
          const limitParam = paramCount;
          paramCount++;
          const offsetParam = paramCount;
          
          const companiesQuery = `
            SELECT c.*, 
                   COUNT(DISTINCT cl.id) FILTER (WHERE cl.is_active = TRUE) as location_count,
                   COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as employee_count
            FROM companies c
            LEFT JOIN company_locations cl ON c.id = cl.company_id
            LEFT JOIN employees e ON c.id = e.company_id
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.is_featured DESC, c.name ASC
            LIMIT $${limitParam} OFFSET $${offsetParam}
          `;
          
          queryParams.push(limit, offset);
          
          const companiesResult = await client.query(companiesQuery, queryParams);
          
          return {
            success: true,
            companies: companiesResult.rows,
            pagination: {
              limit,
              offset,
              total,
              hasMore: offset + companiesResult.rows.length < total
            }
          };
          
        } finally {
          client.release();
        }
      });
    };

    // Enhanced company verification with database
    this.verifyCompany = async (companyId, verificationData) => {
      return this.executeWithTracing('company.verifyCompany.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          await client.query('BEGIN');
          
          // Verify company exists
          const companyResult = await client.query(`
            SELECT id, name, created_by FROM companies WHERE id = $1 AND is_active = TRUE
          `, [companyId]);
          
          if (companyResult.rows.length === 0) {
            throw new Error('Company not found');
          }
          
          const company = companyResult.rows[0];
          
          // Create verification record
          const verificationResult = await client.query(`
            INSERT INTO company_verifications (
              company_id, verification_type, verification_data, documents, status
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `, [
            companyId,
            verificationData.verificationType,
            JSON.stringify(verificationData.verificationData || {}),
            JSON.stringify(verificationData.documents || []),
            'pending'
          ]);
          
          const verification = verificationResult.rows[0];
          
          // Update company verification level
          await client.query(`
            UPDATE companies 
            SET verification_level = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [verificationData.verificationType, companyId]);
          
          // Log activity
          await client.query(`
            INSERT INTO company_activity_log (
              company_id, user_id, action, entity_type, entity_id, new_values
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            companyId,
            company.created_by,
            'verification_submitted',
            'verification',
            verification.id,
            JSON.stringify(verification)
          ]);
          
          await client.query('COMMIT');
          
          // Update cache
          const updatedCompanyResult = await client.query(`
            SELECT * FROM companies WHERE id = $1
          `, [companyId]);
          
          if (updatedCompanyResult.rows.length > 0) {
            this.companyCache.set(companyId, updatedCompanyResult.rows[0]);
          }
          
          // Send notification for admin review
          try {
            await this.notificationServiceClient.post('notification-service', {
              recipients: [{ userId: company.created_by }],
              type: 'email',
              title: 'Company Verification Submitted',
              message: `Your verification for ${company.name} has been submitted and is under review.`,
              template: 'verification_submitted',
              data: { 
                companyName: company.name,
                verificationType: verificationData.verificationType,
                verificationId: verification.id
              }
            }, '/notifications');
          } catch (error) {
            this.logger.warn('Failed to send verification notification', {
              verificationId: verification.id,
              error: error.message
            });
          }
          
          return {
            success: true,
            verification: {
              ...verification,
              verification_data: JSON.parse(verification.verification_data),
              documents: JSON.parse(verification.documents)
            }
          };
          
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      });
    };

    // Enhanced company statistics with detailed metrics
    this.getCompanyStats = async (companyId) => {
      return this.executeWithTracing('company.getCompanyStats.process', async () => {
        const client = await this.dbPool.getClient();
        
        try {
          // Get basic company info
          const companyResult = await client.query(`
            SELECT * FROM companies WHERE id = $1 AND is_active = TRUE
          `, [companyId]);
          
          if (companyResult.rows.length === 0) {
            throw new Error('Company not found');
          }
          
          const company = companyResult.rows[0];
          
          // Get detailed statistics
          const [employeeStats, locationStats, verificationStats, activityStats] = await Promise.all([
            client.query(`
              SELECT 
                COUNT(*) as total_employees,
                COUNT(*) FILTER (WHERE status = 'active') as active_employees,
                COUNT(*) FILTER (WHERE role = 'owner') as owners,
                COUNT(*) FILTER (WHERE role = 'admin') as admins,
                COUNT(*) FILTER (WHERE role = 'recruiter') as recruiters,
                COUNT(*) FILTER (WHERE role = 'hiring_manager') as hiring_managers
              FROM employees WHERE company_id = $1
            `, [companyId]),
            
            client.query(`
              SELECT 
                COUNT(*) as total_locations,
                COUNT(*) FILTER (WHERE is_headquarters = TRUE) as headquarters,
                COUNT(*) FILTER (WHERE is_active = TRUE) as active_locations,
                COUNT(DISTINCT country) as countries
              FROM company_locations WHERE company_id = $1
            `, [companyId]),
            
            client.query(`
              SELECT 
                COUNT(*) as total_verifications,
                COUNT(*) FILTER (WHERE status = 'approved') as approved_verifications,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_verifications,
                MAX(submitted_at) as last_verification_date
              FROM company_verifications WHERE company_id = $1
            `, [companyId]),
            
            client.query(`
              SELECT 
                action,
                COUNT(*) as action_count,
                MAX(created_at) as last_activity_date
              FROM company_activity_log 
              WHERE company_id = $1 AND created_at > CURRENT_DATE - INTERVAL '30 days'
              GROUP BY action
            `, [companyId])
          ]);
          
          // Get job statistics
          let jobStats = {};
          try {
            const jobResponse = await this.jobServiceClient.get('job-service', `/companies/${companyId}/stats`);
            jobStats = jobResponse.data || {};
          } catch (error) {
            this.logger.warn('Failed to get job statistics', {
              companyId,
              error: error.message
            });
          }
          
          return {
            success: true,
            stats: {
              company: {
                name: company.name,
                industry: company.industry,
                size: company.size,
                status: company.status,
                verificationLevel: company.verification_level,
                isFeatured: company.is_featured,
                createdAt: company.created_at
              },
              employees: employeeStats.rows[0],
              locations: locationStats.rows[0],
              verifications: verificationStats.rows[0],
              activity: activityStats.rows,
              jobs: jobStats
            }
          };
          
        } finally {
          client.release();
        }
      });
    };

    // Enhanced service health check with database
    this.getServiceHealth = async () => {
      const dbHealth = await this.dbPool.checkHealth();
      
      const client = await this.dbPool.getClient();
      try {
        const metricsResult = await client.query(`
          SELECT 
            COUNT(*) as total_companies,
            COUNT(*) FILTER (WHERE status = 'verified') as verified_companies,
            COUNT(*) FILTER (WHERE status = 'pending_verification') as pending_companies,
            COUNT(*) as total_employees,
            COUNT(*) FILTER (WHERE is_active = TRUE) as active_companies
          FROM companies
        `);
        
        const dbMetrics = metricsResult.rows[0];
        
        return {
          service: 'company-service',
          status: 'healthy',
          database: {
            connected: dbHealth,
            metrics: dbMetrics
          },
          cache: {
            companyCache: this.companyCache.size,
            verificationCache: this.verificationCache.size
          },
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        return {
          service: 'company-service',
          status: 'degraded',
          database: {
            connected: false,
            error: error.message
          },
          timestamp: new Date().toISOString()
        };
      } finally {
        client.release();
      }
    };

    // Initialize database schema
    this.initializeDatabase = async () => {
      const client = await this.dbPool.getClient();
      try {
        // Run migration if needed
        await client.query(`
          CREATE TABLE IF NOT EXISTS service_migrations (
            service_name VARCHAR(100) PRIMARY KEY,
            version VARCHAR(50) NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Check if migration has been applied
        const migrationResult = await client.query(`
          SELECT version FROM service_migrations 
          WHERE service_name = 'company-service'
        `);
        
        if (migrationResult.rows.length === 0) {
          this.logger.info('Running database migration for company service');
          // Migration would be run here in production
          await client.query(`
            INSERT INTO service_migrations (service_name, version)
            VALUES ('company-service', '1.0.0')
          `);
        }
        
        this.logger.info('Database initialized successfully');
        
      } finally {
        client.release();
      }
    };
  }

  /**
   * Get employee with detailed profile information
   */
  async getEmployeeProfile(companyId, employeeId) {
    return this.executeWithTracing('company.getEmployeeProfile.process', async () => {
      const client = await this.dbPool.getClient();
      
      try {
        const employeeResult = await client.query(`
          SELECT e.*, c.name as company_name, c.industry as company_industry
          FROM employees e
          JOIN companies c ON e.company_id = c.id
          WHERE e.company_id = $1 AND e.id = $2 AND e.status = 'active'
        `, [companyId, employeeId]);
        
        if (employeeResult.rows.length === 0) {
          throw new Error('Employee not found');
        }
        
        const employee = employeeResult.rows[0];
        
        // Get user profile
        try {
          const userProfile = await this.userProfileClient.get('user-profile-service', `/profiles/${employee.user_id}`);
          return {
            success: true,
            employee: {
              ...employee,
              profile: userProfile.data
            }
          };
        } catch (error) {
          this.logger.warn('Failed to get user profile for employee', {
            userId: employee.user_id,
            error: error.message
          });
          
          return {
            success: true,
            employee
          };
        }
        
      } finally {
        client.release();
      }
    });
  }

  /**
   * Update company settings
   */
  async updateCompanySettings(companyId, settingsData) {
    return this.executeWithTracing('company.updateCompanySettings.process', async () => {
      const client = await this.dbPool.getClient();
      
      try {
        const result = await client.query(`
          UPDATE company_settings 
          SET 
            privacy_settings = COALESCE($2, privacy_settings),
            notification_settings = COALESCE($3, notification_settings),
            branding_settings = COALESCE($4, branding_settings),
            recruitment_settings = COALESCE($5, recruitment_settings),
            updated_at = CURRENT_TIMESTAMP
          WHERE company_id = $1
          RETURNING *
        `, [
          companyId,
          settingsData.privacy_settings ? JSON.stringify(settingsData.privacy_settings) : null,
          settingsData.notification_settings ? JSON.stringify(settingsData.notification_settings) : null,
          settingsData.branding_settings ? JSON.stringify(settingsData.branding_settings) : null,
          settingsData.recruitment_settings ? JSON.stringify(settingsData.recruitment_settings) : null
        ]);
        
        if (result.rows.length === 0) {
          throw new Error('Company settings not found');
        }
        
        return {
          success: true,
          settings: {
            ...result.rows[0],
            privacy_settings: JSON.parse(result.rows[0].privacy_settings),
            notification_settings: JSON.parse(result.rows[0].notification_settings),
            branding_settings: JSON.parse(result.rows[0].branding_settings),
            recruitment_settings: JSON.parse(result.rows[0].recruitment_settings)
          }
        };
        
      } finally {
        client.release();
      }
    });
  }
}

module.exports = {
  EnhancedCompanyService
};

// Auto-start if this is main module
if (require.main === module) {
  const enhancedService = new EnhancedCompanyService();
  
  enhancedService.start().then(async () => {
    await enhancedService.initializeDatabase();
    logger.info('🚀 Enhanced Company Service with PostgreSQL started successfully');
  }).catch(console.error);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await enhancedService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await enhancedService.shutdown();
    process.exit(0);
  });
}