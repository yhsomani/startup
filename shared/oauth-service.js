/**
 * TalentSphere OAuth Service
 * Handles OAuth 2.0 integration with popular providers (Google, GitHub, LinkedIn)
 */

const passport = require('passport');
const { v4: uuidv4 } = require('uuid');

let db = null;
try {
    const dbModule = require('./database-connection');
    db = dbModule;
} catch (e) {
    console.warn('Database connection not available for OAuth service');
}

class OAuthService {
    constructor(options = {}) {
        this.providers = new Map();
        this.userCache = new Map();
        this.initializeStrategies(options);
    }

    initializeStrategies(options = {}) {
        const { googleClientId, googleClientSecret, googleCallbackUrl } = options;
        const { githubClientId, githubClientSecret, githubCallbackUrl } = options;
        const { linkedinClientId, linkedinClientSecret, linkedinCallbackUrl } = options;

        const GoogleStrategy = this.loadStrategy('passport-google-oauth20', 'Google');
        const GitHubStrategy = this.loadStrategy('passport-github2', 'GitHub');
        const LinkedInStrategy = this.loadStrategy('passport-linkedin-oauth2', 'LinkedIn');

        if (googleClientId && googleClientSecret && GoogleStrategy) {
            passport.use(new GoogleStrategy({
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: googleCallbackUrl || '/auth/google/callback',
                scope: ['profile', 'email']
            }, this.googleVerifyCallback.bind(this)));

            this.providers.set('google', { clientId: googleClientId, callbackURL: googleCallbackUrl, scope: ['profile', 'email'] });
        }

        if (githubClientId && githubClientSecret && GitHubStrategy) {
            passport.use(new GitHubStrategy({
                clientID: githubClientId,
                clientSecret: githubClientSecret,
                callbackURL: githubCallbackUrl || '/auth/github/callback'
            }, this.githubVerifyCallback.bind(this)));

            this.providers.set('github', { clientId: githubClientId, callbackURL: githubCallbackUrl, scope: ['user:email'] });
        }

        if (linkedinClientId && linkedinClientSecret && LinkedInStrategy) {
            passport.use(new LinkedInStrategy({
                clientID: linkedinClientId,
                clientSecret: linkedinClientSecret,
                callbackURL: linkedinCallbackUrl || '/auth/linkedin/callback',
                scope: ['r_emailaddress', 'r_liteprofile', 'r_basicprofile']
            }, this.linkedinVerifyCallback.bind(this)));

            this.providers.set('linkedin', { clientId: linkedinClientId, callbackURL: linkedinCallbackUrl, scope: ['r_emailaddress', 'r_liteprofile', 'r_basicprofile'] });
        }

        passport.serializeUser((user, done) => done(null, user.id));
        passport.deserializeUser(async (id, done) => {
            try {
                const user = await this.findUserById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });
    }

    loadStrategy(strategyName, providerName) {
        try {
            return require(strategyName);
        } catch (e) {
            console.warn(`${providerName} OAuth strategy not installed`);
            return null;
        }
    }

    getTableName() {
        return 'oauth_users';
    }

    async ensureTableExists() {
        if (!db?.pool) return false;
        try {
            await db.pool.query(`
                CREATE TABLE IF NOT EXISTS ${this.getTableName()} (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    provider VARCHAR(50) NOT NULL,
                    provider_id VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    name VARCHAR(255),
                    avatar VARCHAR(500),
                    access_token TEXT,
                    refresh_token TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(provider, provider_id)
                )
            `);
            return true;
        } catch (error) {
            console.error('Error creating OAuth users table:', error);
            return false;
        }
    }

    async findUserByProviderId(provider, providerId) {
        if (!db?.pool) {
            return this.userCache.get(`${provider}:${providerId}`) || null;
        }
        try {
            const result = await db.pool.query(
                `SELECT * FROM ${this.getTableName()} WHERE provider = $1 AND provider_id = $2`,
                [provider, providerId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error finding user by provider: ${error.message}`);
            return this.userCache.get(`${provider}:${providerId}`) || null;
        }
    }

    async findUserById(id) {
        if (!db?.pool) {
            return this.userCache.get(id) || null;
        }
        try {
            const result = await db.pool.query(
                `SELECT * FROM ${this.getTableName()} WHERE id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error finding user by ID: ${error.message}`);
            return this.userCache.get(id) || null;
        }
    }

    async createUser(userData) {
        const user = {
            id: userData.id || uuidv4(),
            provider: userData.provider,
            provider_id: userData.providerId,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            access_token: userData.accessToken,
            refresh_token: userData.refreshToken,
            created_at: new Date(),
            updated_at: new Date()
        };

        if (db?.pool) {
            try {
                await this.ensureTableExists();
                await db.pool.query(
                    `INSERT INTO ${this.getTableName()} 
                    (id, provider, provider_id, email, name, avatar, access_token, refresh_token, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (provider, provider_id) DO UPDATE SET
                    email = EXCLUDED.email, name = EXCLUDED.name, avatar = EXCLUDED.avatar,
                    access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
                    updated_at = EXCLUDED.updated_at
                    RETURNING *`,
                    [user.id, user.provider, user.provider_id, user.email, user.name, 
                     user.avatar, user.access_token, user.refresh_token, user.created_at, user.updated_at]
                );
            } catch (error) {
                console.error(`Error creating user: ${error.message}`);
            }
        }

        this.userCache.set(user.id, user);
        this.userCache.set(`${user.provider}:${user.provider_id}`, user);
        return user;
    }

    async updateUser(userId, userData) {
        const updateData = {
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            access_token: userData.accessToken,
            refresh_token: userData.refreshToken,
            updated_at: new Date()
        };

        if (db?.pool) {
            try {
                await db.pool.query(
                    `UPDATE ${this.getTableName()} SET email = $1, name = $2, avatar = $3, 
                    access_token = $4, refresh_token = $5, updated_at = $6 WHERE id = $7`,
                    [updateData.email, updateData.name, updateData.avatar, 
                     updateData.access_token, updateData.refresh_token, updateData.updated_at, userId]
                );
            } catch (error) {
                console.error(`Error updating user: ${error.message}`);
            }
        }

        const existing = this.userCache.get(userId);
        if (existing) {
            const updated = { ...existing, ...updateData };
            this.userCache.set(userId, updated);
            return updated;
        }
        return { id: userId, ...updateData };
    }

    async findOrCreateUser(profileData) {
        const existingUser = await this.findUserByProviderId(profileData.provider, profileData.providerId);

        if (existingUser) {
            return await this.updateUser(existingUser.id, profileData);
        } else {
            return await this.createUser({
                id: uuidv4(),
                ...profileData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
            });
        }
    }

    async googleVerifyCallback(accessToken, refreshToken, profile, done) {
        try {
            const user = await this.findOrCreateUser({
                provider: 'google',
                providerId: profile.id,
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                avatar: profile.photos?.[0]?.value,
                accessToken,
                refreshToken
            });
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }

    async githubVerifyCallback(accessToken, refreshToken, profile, done) {
        try {
            const email = profile.emails?.[0]?.value;
            const user = await this.findOrCreateUser({
                provider: 'github',
                providerId: profile.id,
                email,
                username: profile.username,
                name: profile.displayName || profile.username,
                avatar: profile.photos?.[0]?.value,
                accessToken,
                refreshToken
            });
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }

    async linkedinVerifyCallback(accessToken, refreshToken, profile, done) {
        try {
            const email = profile.emails?.[0]?.value;
            const user = await this.findOrCreateUser({
                provider: 'linkedin',
                providerId: profile.id,
                email,
                name: profile.displayName,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                headline: profile._json?.headline,
                industry: profile._json?.industry,
                avatar: profile.photos?.[0]?.value,
                accessToken,
                refreshToken
            });
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }

    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }

    getProviderConfig(provider) {
        return this.providers.get(provider);
    }

    getAuthorizationURL(provider, options = {}) {
        const providerConfig = this.providers.get(provider);
        if (!providerConfig) {
            throw new Error(`Provider ${provider} not configured`);
        }

        let authUrl = '';
        const redirectUri = encodeURIComponent(providerConfig.callbackURL);
        const scope = encodeURIComponent(providerConfig.scope?.join(' ') || '');

        switch (provider) {
            case 'google':
                authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${providerConfig.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&state=${options.state || ''}`;
                break;
            case 'github':
                authUrl = `https://github.com/login/oauth/authorize?client_id=${providerConfig.clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${options.state || ''}`;
                break;
            case 'linkedin':
                authUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${providerConfig.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${options.state || ''}`;
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        return authUrl;
    }

    async revokeToken(provider, token) {
        switch (provider) {
            case 'google':
                try {
                    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
                } catch (e) {
                    console.warn('Failed to revoke Google token');
                }
                break;
            case 'github':
                try {
                    await fetch('https://api.github.com/applications/' + this.providers.get('github')?.clientId + '/token', {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (e) {
                    console.warn('Failed to revoke GitHub token');
                }
                break;
        }
        return true;
    }

    getPassport() {
        return passport;
    }

    getPassportMiddleware() {
        return passport.initialize();
    }

    getSessionMiddleware() {
        return passport.session();
    }

    authenticate(provider, options = {}) {
        return passport.authenticate(provider, options);
    }

    handleCallback(provider, options = {}) {
        return passport.authenticate(provider, { ...options, session: true });
    }
}

const oauthServiceInstance = new OAuthService({
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubCallbackUrl: process.env.GITHUB_CALLBACK_URL,
    linkedinClientId: process.env.LINKEDIN_CLIENT_ID,
    linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    linkedinCallbackUrl: process.env.LINKEDIN_CALLBACK_URL
});

module.exports = {
    OAuthService,
    oauthService: oauthServiceInstance,
    getPassportMiddleware: () => passport.initialize(),
    getSessionMiddleware: () => passport.session(),
    authenticate: (provider, options) => passport.authenticate(provider, options)
};
