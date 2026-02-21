/**
 * User Repository with Database Integration
 * 
 * Handles all user-related database operations for the User Service
 */

const BaseRepository = require('../shared/base-repository');
const { v4: uuidv4 } = require('uuid');

class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'user-service');
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const query = `
        SELECT u.*, p.bio, p.location, p.avatar_url, p.visibility
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.email = $1 AND u.deleted_at IS NULL
      `;
      
      const result = await this.query(query, [email]);
      return result.rows[0] || null;

    } catch (error) {
      this.logger.error('Failed to find user by email', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find user with full profile
   */
  async findWithProfile(userId) {
    try {
      const query = `
        SELECT 
          u.*,
          p.bio, p.location, p.social_links, p.avatar_url, p.resume_url, p.visibility,
          pref.email_notifications, pref.push_notifications, pref.job_alerts,
          pref.profile_visibility, pref.language, pref.timezone
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_preferences pref ON u.id = pref.user_id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `;
      
      const result = await this.query(query, [userId]);
      const user = result.rows[0];

      if (!user) return null;

      // Parse JSON fields
      if (user.location) user.location = JSON.parse(user.location);
      if (user.social_links) user.social_links = JSON.parse(user.social_links);

      // Get user skills
      const skillsQuery = `
        SELECT * FROM user_skills 
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      const skillsResult = await this.query(skillsQuery, [userId]);
      user.skills = skillsResult.rows;

      // Get user experience
      const experienceQuery = `
        SELECT * FROM user_experience 
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY start_date DESC
      `;
      const experienceResult = await this.query(experienceQuery, [userId]);
      user.experience = experienceResult.rows;

      // Get user education
      const educationQuery = `
        SELECT * FROM user_education 
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY start_date DESC
      `;
      const educationResult = await this.query(educationQuery, [userId]);
      user.education = educationResult.rows;

      return user;

    } catch (error) {
      this.logger.error('Failed to find user with profile', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create user with profile
   */
  async createWithProfile(userData) {
    return await this.transaction(async (client) => {
      try {
        // Create user
        const userQuery = `
          INSERT INTO users (
            id, email, password_hash, first_name, last_name, phone, 
            role, is_active, is_verified, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;

        const userId = uuidv4();
        const now = new Date().toISOString();

        const userValues = [
          userId,
          userData.email,
          userData.passwordHash,
          userData.firstName,
          userData.lastName,
          userData.phone || null,
          userData.role || 'candidate',
          userData.isActive !== false,
          userData.isVerified || false,
          now,
          now
        ];

        const userResult = await client.query(userQuery, userValues);
        const user = userResult.rows[0];

        // Create profile
        const profileQuery = `
          INSERT INTO user_profiles (
            user_id, bio, location, social_links, avatar_url, resume_url, 
            visibility, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const profileValues = [
          userId,
          null, // bio
          userData.location ? JSON.stringify(userData.location) : null,
          null, // social_links
          null, // avatar_url
          null, // resume_url
          'public', // visibility
          now,
          now
        ];

        await client.query(profileQuery, profileValues);

        // Create preferences
        const preferencesQuery = `
          INSERT INTO user_preferences (
            user_id, email_notifications, push_notifications, job_alerts,
            profile_visibility, language, timezone, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const preferenceValues = [
          userId,
          true, // email_notifications
          true, // push_notifications
          true, // job_alerts
          'public', // profile_visibility
          'en', // language
          'UTC', // timezone
          now,
          now
        ];

        await client.query(preferencesQuery, preferenceValues);

        // Get complete user record
        return await this.findWithProfile(userId);

      } catch (error) {
        this.logger.error('Failed to create user with profile', {
          userData: this.sanitizeLogData(userData),
          error: error.message
        });
        throw error;
      }
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    try {
      const { firstName, lastName, phone, ...profileFields } = profileData;

      await this.transaction(async (client) => {
        // Update user basic info if provided
        if (firstName || lastName || phone) {
          const userUpdateQuery = `
            UPDATE users SET
              first_name = COALESCE($1, first_name),
              last_name = COALESCE($2, last_name),
              phone = COALESCE($3, phone),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND deleted_at IS NULL
          `;

          await client.query(userUpdateQuery, [firstName, lastName, phone, userId]);
        }

        // Update profile if profile fields provided
        if (Object.keys(profileFields).length > 0) {
          const setClauses = [];
          const values = [];
          let paramIndex = 1;

          for (const [key, value] of Object.entries(profileFields)) {
            if (key === 'location' && value) {
              setClauses.push(`${key} = $${paramIndex++}`);
              values.push(JSON.stringify(value));
            } else if (key === 'socialLinks' && value) {
              setClauses.push('social_links = $' + paramIndex++);
              values.push(JSON.stringify(value));
            } else {
              setClauses.push(`${key} = $${paramIndex++}`);
              values.push(value);
            }
          }

          setClauses.push('updated_at = CURRENT_TIMESTAMP');
          values.push(userId);

          const profileUpdateQuery = `
            UPDATE user_profiles SET
              ${setClauses.join(', ')}
            WHERE user_id = $${values.length}
          `;

          await client.query(profileUpdateQuery, values);
        }
      });

      // Return updated user
      return await this.findWithProfile(userId);

    } catch (error) {
      this.logger.error('Failed to update user profile', {
        userId,
        profileData: this.sanitizeLogData(profileData),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add user skill
   */
  async addSkill(userId, skillData) {
    try {
      const query = `
        INSERT INTO user_skills (
          user_id, skill_name, level, years_of_experience, verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const now = new Date().toISOString();
      const values = [
        userId,
        skillData.skillName,
        skillData.level,
        skillData.yearsOfExperience || 0,
        skillData.verified || false,
        now,
        now
      ];

      const result = await this.query(query, values);
      
      this.logger.debug('Skill added to user', {
        userId,
        skill: skillData.skillName,
        level: skillData.level
      });

      return result.rows[0];

    } catch (error) {
      this.logger.error('Failed to add user skill', {
        userId,
        skillData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user skills
   */
  async getSkills(userId) {
    try {
      const query = `
        SELECT * FROM user_skills 
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;

      const result = await this.query(query, [userId]);
      return result.rows;

    } catch (error) {
      this.logger.error('Failed to get user skills', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete user skill
   */
  async deleteSkill(userId, skillId) {
    try {
      const query = `
        UPDATE user_skills
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.query(query, [skillId, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Skill not found');
      }

      return result.rows[0];

    } catch (error) {
      this.logger.error('Failed to delete user skill', {
        userId,
        skillId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Search users with advanced filtering
   */
  async searchUsers(searchParams) {
    try {
      const {
        q: searchTerm,
        role,
        skills,
        location,
        limit = 20,
        offset = 0
      } = searchParams;

      let query = `
        SELECT DISTINCT 
          u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
          p.bio, p.location, p.avatar_url
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_skills s ON u.id = s.user_id AND s.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Add search conditions
      if (searchTerm) {
        conditions.push(`(
          u.first_name ILIKE $${paramIndex} OR 
          u.last_name ILIKE $${paramIndex} OR 
          u.email ILIKE $${paramIndex} OR 
          p.bio ILIKE $${paramIndex}
        )`);
        values.push(`%${searchTerm}%`);
        paramIndex++;
      }

      if (role) {
        conditions.push(`u.role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
      }

      if (skills && skills.length > 0) {
        const skillPlaceholders = skills.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`s.skill_name IN (${skillPlaceholders})`);
        values.push(...skills);
      }

      if (location) {
        conditions.push(`p.location::text ILIKE $${paramIndex}`);
        values.push(`%${location}%`);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      // Add ordering and pagination
      query += `
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      values.push(limit, offset);

      const result = await this.query(query, values);

      // Parse location for each user
      const users = result.rows.map(user => {
        if (user.location) {
          user.location = JSON.parse(user.location);
        }
        return user;
      });

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_skills s ON u.id = s.user_id AND s.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
      `;

      const countResult = await this.query(countQuery, values.slice(0, -2)); // Remove limit and offset
      const total = parseInt(countResult.rows[0].total);

      return {
        users,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < total
      };

    } catch (error) {
      this.logger.error('Failed to search users', {
        searchParams,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get users matching job requirements
   */
  async findMatchingCandidates(jobRequirements) {
    try {
      const { skills, experienceLevel, location, limit = 50 } = jobRequirements;

      let query = `
        SELECT DISTINCT
          u.id, u.email, u.first_name, u.last_name, u.role,
          p.bio, p.location, p.avatar_url,
          COUNT(DISTINCT s.skill_name) as matched_skills,
          array_agg(DISTINCT s.skill_name) as user_skills
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN user_skills s ON u.id = s.user_id AND s.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        AND u.is_active = true
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (skills && skills.length > 0) {
        const skillPlaceholders = skills.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`s.skill_name IN (${skillPlaceholders})`);
        values.push(...skills);
      }

      if (location) {
        conditions.push(`p.location::text ILIKE $${paramIndex}`);
        values.push(`%${location}%`);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += `
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, p.bio, p.location, p.avatar_url
        ORDER BY matched_skills DESC, u.created_at DESC
        LIMIT $${paramIndex}
      `;

      values.push(limit);

      const result = await this.query(query, values);

      // Calculate match scores and format results
      const candidates = result.rows.map(user => {
        if (user.location) {
          user.location = JSON.parse(user.location);
        }

        const matchScore = this.calculateMatchScore(jobRequirements, user);
        
        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          bio: user.bio,
          location: user.location,
          avatar: user.avatar_url,
          skills: user.user_skills,
          matchedSkills: user.matched_skills,
          matchScore
        };
      });

      return candidates;

    } catch (error) {
      this.logger.error('Failed to find matching candidates', {
        jobRequirements,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate match score between job requirements and user
   */
  calculateMatchScore(jobRequirements, user) {
    let score = 0;
    const { skills, experienceLevel } = jobRequirements;

    // Skills matching (60% weight)
    if (skills && skills.length > 0 && user.matched_skills > 0) {
      const skillsMatch = user.matched_skills / skills.length;
      score += skillsMatch * 60;
    }

    // Experience level (25% weight)
    if (experienceLevel) {
      // This would need to be calculated based on user's experience
      // For now, give a baseline score
      score += 25;
    }

    // Location compatibility (15% weight)
    if (jobRequirements.location && user.location) {
      // Simplified location check
      score += 15;
    }

    return Math.min(100, Math.round(score));
  }
}

module.exports = UserRepository;