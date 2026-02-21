/**
 * TalentSphere OAuth Service
 * Handles OAuth 2.0 integration with popular providers (Google, GitHub, LinkedIn)
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { v4: uuidv4 } = require('uuid');

class OAuthService {
    constructor() {
        this.providers = new Map();
        this.initializeStrategies();
    }

    /**
     * Initialize OAuth strategies
     */
    initializeStrategies() {
        // Google OAuth Strategy
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            passport.use(new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
                scope: ['profile', 'email']
            }, this.googleVerifyCallback.bind(this)));

            this.providers.set('google', {
                clientId: process.env.GOOGLE_CLIENT_ID,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
                scope: ['profile', 'email']
            });
        }

        // GitHub OAuth Strategy
        if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
            passport.use(new GitHubStrategy({
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback'
            }, this.githubVerifyCallback.bind(this)));

            this.providers.set('github', {
                clientId: process.env.GITHUB_CLIENT_ID,
                callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/github/callback',
                scope: ['user:email']
            });
        }

        // LinkedIn OAuth Strategy
        if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
            passport.use(new LinkedInStrategy({
                clientID: process.env.LINKEDIN_CLIENT_ID,
                clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
                callbackURL: process.env.LINKEDIN_CALLBACK_URL || '/auth/linkedin/callback',
                scope: ['r_emailaddress', 'r_liteprofile', 'r_basicprofile']
            }, this.linkedinVerifyCallback.bind(this)));

            this.providers.set('linkedin', {
                clientId: process.env.LINKEDIN_CLIENT_ID,
                callbackURL: process.env.LINKEDIN_CALLBACK_URL || '/auth/linkedin/callback',
                scope: ['r_emailaddress', 'r_liteprofile', 'r_basicprofile']
            });
        }

        // Serialize user for session
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        // Deserialize user from session
        passport.deserializeUser(async (id, done) => {
            try {
                // This would typically fetch user from database
                const user = await this.findUserById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });
    }

    /**
     * Google OAuth verification callback
     */
    async googleVerifyCallback(accessToken, refreshToken, profile, done) {
        try {
            // Create or update user based on Google profile
            const user = await this.findOrCreateUser({
                provider: 'google',
                providerId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                avatar: profile.photos[0]?.value,
                accessToken,
                refreshToken
            });

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }

    /**
     * GitHub OAuth verification callback
     */
    async githubVerifyCallback(accessToken, refreshToken, profile, done) {
        try {
            // Create or update user based on GitHub profile
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const user = await this.findOrCreateUser({
                provider: 'github',
                providerId: profile.id,
                email: email,
                username: profile.username,
                name: profile.displayName || profile.username,
                avatar: profile.photos[0]?.value,
                accessToken,
                refreshToken
            });

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }

    /**
     * LinkedIn OAuth verification callback
     */
    async linkedinVerifyCallback(accessToken, refreshToken, profile, done) {
        try {
            // Create or update user based on LinkedIn profile
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const user = await this.findOrCreateUser({
                provider: 'linkedin',
                providerId: profile.id,
                email: email,
                name: profile.displayName,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                headline: profile._json.headline, // LinkedIn-specific
                industry: profile._json.industry,
                avatar: profile.photos[0]?.value,
                accessToken,
                refreshToken
            });

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }

    /**
     * Find or create user based on OAuth profile
     */
    async findOrCreateUser(profileData) {
        // This would typically interact with your user database
        // For now, returning a mock user object
        const existingUser = await this.findUserByProviderId(profileData.provider, profileData.providerId);

        if (existingUser) {
            // Update existing user with fresh data
            return await this.updateUser(existingUser.id, profileData);
        } else {
            // Create new user
            return await this.createUser({
                id: uuidv4(),
                ...profileData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
            });
        }
    }

    /**
     * Find user by provider ID
     */
    async findUserByProviderId(provider, providerId) {
        // Mock implementation - would connect to database in real implementation
        console.log(`Finding user by provider: ${provider}, providerId: ${providerId}`);
        return null; // Return null if not found
    }

    /**
     * Find user by ID
     */
    async findUserById(id) {
        // Mock implementation - would connect to database in real implementation
        console.log(`Finding user by ID: ${id}`);
        return null; // Return null if not found
    }

    /**
     * Create new user
     */
    async createUser(userData) {
        // Mock implementation - would connect to database in real implementation
        console.log(`Creating user: ${userData.email}`);
        return userData;
    }

    /**
     * Update existing user
     */
    async updateUser(userId, userData) {
        // Mock implementation - would connect to database in real implementation
        console.log(`Updating user: ${userId}`);
        return { id: userId, ...userData, updatedAt: new Date().toISOString() };
    }

    /**
     * Get available OAuth providers
     */
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }

    /**
     * Get provider configuration
     */
    getProviderConfig(provider) {
        return this.providers.get(provider);
    }

    /**
     * Generate OAuth authorization URL
     */
    getAuthorizationURL(provider, options = {}) {
        const providerConfig = this.providers.get(provider);
        if (!providerConfig) {
            throw new Error(`Provider ${provider} not configured`);
        }

        // This would be handled by passport in a real implementation
        // Return the appropriate OAuth authorization URL
        let authUrl = '';

        switch (provider) {
            case 'google':
                authUrl = `https://accounts.google.com/oauth/authorize?` +
                    `client_id=${providerConfig.clientId}&` +
                    `redirect_uri=${providerConfig.callbackURL}&` +
                    `scope=${encodeURIComponent(providerConfig.scope.join(' '))}&` +
                    `response_type=code&` +
                    `access_type=offline&` +
                    `prompt=consent`;
                break;
            case 'github':
                authUrl = `https://github.com/login/oauth/authorize?` +
                    `client_id=${providerConfig.clientId}&` +
                    `redirect_uri=${providerConfig.callbackURL}&` +
                    `scope=${encodeURIComponent(providerConfig.scope.join(','))}`;
                break;
            case 'linkedin':
                authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
                    `client_id=${providerConfig.clientId}&` +
                    `redirect_uri=${providerConfig.callbackURL}&` +
                    `scope=${encodeURIComponent(providerConfig.scope.join(' '))}&` +
                    `response_type=code`;
                break;
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }

        return authUrl;
    }

    /**
     * Get Passport middleware
     */
    getPassportMiddleware() {
        return passport.initialize();
    }

    /**
     * Get Passport session middleware
     */
    getSessionMiddleware() {
        return passport.session();
    }

    /**
     * Authenticate with a specific provider
     */
    authenticate(provider, options = {}) {
        return passport.authenticate(provider, options);
    }

    /**
     * Handle OAuth callback
     */
    handleCallback(provider, options = {}) {
        return passport.authenticate(provider, { ...options, session: true });
    }
}

// Export singleton instance
const oauthService = new OAuthService();

module.exports = {
    OAuthService,
    oauthService,
    getPassportMiddleware: oauthService.getPassportMiddleware.bind(oauthService),
    getSessionMiddleware: oauthService.getSessionMiddleware.bind(oauthService),
    authenticate: oauthService.authenticate.bind(oauthService),
    handleCallback: oauthService.handleCallback.bind(oauthService),
    getAvailableProviders: oauthService.getAvailableProviders.bind(oauthService),
    getProviderConfig: oauthService.getProviderConfig.bind(oauthService),
    getAuthorizationURL: oauthService.getAuthorizationURL.bind(oauthService)
};