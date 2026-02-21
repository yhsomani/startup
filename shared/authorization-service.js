/**
 * TalentSphere Authorization Service
 * Implements RBAC, ABAC, and resource-based authorization
 */

const jwt = require('jsonwebtoken');

class AuthorizationService {
    constructor(options = {}) {
        this.options = {
            rbacEnabled: true,
            abacEnabled: true,
            resourceBasedAuth: true,
            ...options
        };

        // Initialize authorization policies
        this.policies = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.resourcePolicies = new Map();

        this.initializeDefaultPolicies();
    }

    /**
     * Initialize default authorization policies
     */
    initializeDefaultPolicies() {
        // Define default roles and permissions
        this.roles.set('admin', {
            name: 'Administrator',
            permissions: ['*'], // Wildcard for all permissions
            inherits: []
        });

        this.roles.set('moderator', {
            name: 'Moderator',
            permissions: ['read:user', 'write:user', 'delete:user', 'read:content', 'moderate:content'],
            inherits: ['user']
        });

        this.roles.set('user', {
            name: 'Regular User',
            permissions: ['read:own:profile', 'write:own:profile', 'read:public:content'],
            inherits: []
        });

        this.roles.set('guest', {
            name: 'Guest',
            permissions: ['read:public:content'],
            inherits: []
        });

        // Define default permissions
        this.permissions.set('read:user', { description: 'Read user information' });
        this.permissions.set('write:user', { description: 'Write user information' });
        this.permissions.set('delete:user', { description: 'Delete user' });
        this.permissions.set('read:content', { description: 'Read content' });
        this.permissions.set('write:content', { description: 'Write content' });
        this.permissions.set('moderate:content', { description: 'Moderate content' });
        this.permissions.set('read:own:profile', { description: 'Read own profile' });
        this.permissions.set('write:own:profile', { description: 'Write own profile' });
        this.permissions.set('read:public:content', { description: 'Read public content' });
    }

    /**
     * Check if user has a specific role
     */
    hasRole(user, roleName) {
        if (!user || !roleName) {return false;}

        const userRole = user.role || user.roles?.[0] || 'guest';

        if (userRole === roleName) {
            return true;
        }

        // Check inherited roles
        const role = this.roles.get(userRole);
        if (role && role.inherits) {
            return role.inherits.some(inheritedRole =>
                inheritedRole === roleName || this.hasRole({ role: inheritedRole }, roleName)
            );
        }

        return false;
    }

    /**
     * Check if user has a specific permission
     */
    hasPermission(user, permission) {
        if (!user || !permission) {return false;}

        // Check if user has wildcard permission
        if (this.hasRole(user, 'admin')) {
            return true;
        }

        // Get user permissions
        const userPermissions = user.permissions || this.getUserPermissions(user);

        // Direct permission check
        if (userPermissions.includes(permission)) {
            return true;
        }

        // Check for wildcard permissions (e.g., 'read:*' for 'read:user')
        const permissionParts = permission.split(':');
        for (let i = permissionParts.length - 1; i > 0; i--) {
            const partialPermission = [...permissionParts.slice(0, i), '*'].join(':');
            if (userPermissions.includes(partialPermission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get user permissions based on role
     */
    getUserPermissions(user) {
        if (!user) {return [];}

        const userRole = user.role || user.roles?.[0] || 'guest';
        const role = this.roles.get(userRole);

        if (!role) {
            return this.roles.get('guest').permissions || [];
        }

        // Combine role permissions with user-specific permissions
        const permissions = [...role.permissions];

        if (user.additionalPermissions) {
            permissions.push(...user.additionalPermissions);
        }

        return permissions;
    }

    /**
     * Role-Based Access Control (RBAC) check
     */
    rbac(user, requiredRole) {
        if (!this.options.rbacEnabled) {return true;}
        return this.hasRole(user, requiredRole);
    }

    /**
     * Attribute-Based Access Control (ABAC) check
     */
    abac(user, resource, action, environment = {}) {
        if (!this.options.abacEnabled) {return true;}

        // Define attribute-based policies
        const policies = [
            // Users can access their own resources
            {
                condition: (u, r, a) => u.id === r.ownerId && a.startsWith('read'),
                effect: 'allow'
            },
            // Admins can access any resource
            {
                condition: (u, r, a) => this.hasRole(u, 'admin'),
                effect: 'allow'
            },
            // Moderators can moderate content
            {
                condition: (u, r, a) => this.hasRole(u, 'moderator') && a === 'moderate:content',
                effect: 'allow'
            },
            // Users can access public content
            {
                condition: (u, r, a) => r.visibility === 'public' && a.startsWith('read'),
                effect: 'allow'
            },
            // Time-based restrictions
            {
                condition: (u, r, a, env) => {
                    const currentTime = env.time || new Date();
                    const startTime = r.startTime ? new Date(r.startTime) : null;
                    const endTime = r.endTime ? new Date(r.endTime) : null;

                    return (!startTime || currentTime >= startTime) &&
                        (!endTime || currentTime <= endTime);
                },
                effect: 'allow'
            }
        ];

        // Evaluate policies
        for (const policy of policies) {
            if (policy.condition(user, resource, action, environment)) {
                return policy.effect === 'allow';
            }
        }

        return false;
    }

    /**
     * Resource-Based Authorization check
     */
    resourceBased(user, resource, action) {
        if (!this.options.resourceBasedAuth) {return true;}

        // Check if there's a specific policy for this resource-action combination
        const resourcePolicy = this.resourcePolicies.get(`${resource.type}:${action}`);
        if (resourcePolicy) {
            return resourcePolicy(user, resource);
        }

        // Default resource-based checks
        switch (resource.type) {
            case 'profile':
                return this.checkProfileAccess(user, resource, action);
            case 'job':
                return this.checkJobAccess(user, resource, action);
            case 'application':
                return this.checkApplicationAccess(user, resource, action);
            case 'company':
                return this.checkCompanyAccess(user, resource, action);
            default:
                return this.abac(user, resource, action);
        }
    }

    /**
     * Check profile access
     */
    checkProfileAccess(user, profile, action) {
        // Users can access their own profile
        if (user.id === profile.ownerId && action.startsWith('read')) {
            return true;
        }

        // Admins can access any profile
        if (this.hasRole(user, 'admin')) {
            return true;
        }

        // Moderators can read any profile
        if (this.hasRole(user, 'moderator') && action === 'read') {
            return true;
        }

        return false;
    }

    /**
     * Check job access
     */
    checkJobAccess(user, job, action) {
        // Anyone can read published jobs
        if (job.status === 'published' && action === 'read') {
            return true;
        }

        // Job owners can manage their jobs
        if (user.id === job.ownerId && action.startsWith('manage')) {
            return true;
        }

        // Admins can manage any job
        if (this.hasRole(user, 'admin')) {
            return true;
        }

        return false;
    }

    /**
     * Check application access
     */
    checkApplicationAccess(user, application, action) {
        // Applicants can view their own applications
        if (user.id === application.applicantId && action === 'read') {
            return true;
        }

        // Job owners can view applications to their jobs
        if (user.id === application.jobOwnerId && action === 'read') {
            return true;
        }

        // Admins can manage any application
        if (this.hasRole(user, 'admin')) {
            return true;
        }

        return false;
    }

    /**
     * Check company access
     */
    checkCompanyAccess(user, company, action) {
        // Company members can access company information
        if (company.members?.includes(user.id) && action.startsWith('read')) {
            return true;
        }

        // Company owners/admins can manage company
        if ((user.id === company.ownerId || user.id === company.adminId) && action.startsWith('manage')) {
            return true;
        }

        // Admins can manage any company
        if (this.hasRole(user, 'admin')) {
            return true;
        }

        return false;
    }

    /**
     * Comprehensive authorization check combining RBAC, ABAC, and resource-based auth
     */
    authorize(user, resource, action, context = {}) {
        // Perform all authorization checks
        const rbacResult = this.rbac(user, context.requiredRole || 'user');
        const abacResult = this.abac(user, resource, action, context.environment);
        const resourceResult = this.resourceBased(user, resource, action);

        // All checks must pass (AND logic) unless configured otherwise
        return rbacResult && abacResult && resourceResult;
    }

    /**
     * Middleware for Express routes
     */
    middleware(requiredRoleOrPermission) {
        return (req, res, next) => {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            // Check if requiredRoleOrPermission is a role or permission
            let authorized = false;

            if (this.roles.has(requiredRoleOrPermission)) {
                // It's a role check
                authorized = this.rbac(user, requiredRoleOrPermission);
            } else {
                // It's a permission check
                authorized = this.hasPermission(user, requiredRoleOrPermission);
            }

            if (!authorized) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Insufficient permissions'
                    }
                });
            }

            next();
        };
    }

    /**
     * Authorization middleware for specific resources
     */
    resourceMiddleware(resourceType, action) {
        return (req, res, next) => {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            // Create resource object from request
            const resource = {
                type: resourceType,
                id: req.params.id || req.body.id,
                ownerId: req.params.userId || req.body.userId || user.id,
                ...req.body
            };

            const authorized = this.resourceBased(user, resource, action);

            if (!authorized) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Insufficient permissions for this resource'
                    }
                });
            }

            next();
        };
    }

    /**
     * Add custom policy
     */
    addPolicy(name, policyFn) {
        this.policies.set(name, policyFn);
    }

    /**
     * Add custom role
     */
    addRole(roleName, roleDefinition) {
        this.roles.set(roleName, roleDefinition);
    }

    /**
     * Add custom permission
     */
    addPermission(permissionName, permissionDefinition) {
        this.permissions.set(permissionName, permissionDefinition);
    }

    /**
     * Add resource-based policy
     */
    addResourcePolicy(resourceAction, policyFn) {
        this.resourcePolicies.set(resourceAction, policyFn);
    }

    /**
     * Get user's effective permissions
     */
    getUserEffectivePermissions(user) {
        const permissions = this.getUserPermissions(user);
        const effectivePermissions = new Set(permissions);

        // Expand wildcards
        for (const perm of effectivePermissions) {
            if (perm.includes('*')) {
                // Find all permissions that match the wildcard pattern
                for (const [knownPerm] of this.permissions) {
                    if (this.matchWildcard(perm, knownPerm)) {
                        effectivePermissions.add(knownPerm);
                    }
                }
            }
        }

        return Array.from(effectivePermissions);
    }

    /**
     * Helper to match wildcard permissions
     */
    matchWildcard(pattern, permission) {
        const patternParts = pattern.split(':');
        const permParts = permission.split(':');

        if (patternParts.length !== permParts.length) {
            return false;
        }

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i] !== '*' && patternParts[i] !== permParts[i]) {
                return false;
            }
        }

        return true;
    }
}

// Export singleton instance
const authorizationService = new AuthorizationService();

module.exports = {
    AuthorizationService,
    authorizationService,
    rbac: authorizationService.rbac.bind(authorizationService),
    abac: authorizationService.abac.bind(authorizationService),
    resourceBased: authorizationService.resourceBased.bind(authorizationService),
    authorize: authorizationService.authorize.bind(authorizationService),
    middleware: authorizationService.middleware.bind(authorizationService),
    resourceMiddleware: authorizationService.resourceMiddleware.bind(authorizationService)
};