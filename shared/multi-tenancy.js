/**
 * Multi-Tenancy Middleware
 *
 * Provides tenant isolation for SaaS applications.
 * Supports:
 * - Subdomain-based tenant identification
 * - Header-based tenant identification
 * - Database row-level security
 */

class MultiTenancy {
    constructor(options = {}) {
        this.defaultTenant = options.defaultTenant || "public";
        this.resolver = options.resolver || this.resolveTenantFromSubdomain;
    }

    resolveTenantFromSubdomain(req) {
        const host = req.headers.host || "";
        const subdomain = host.split(".")[0];

        if (subdomain === "app" || subdomain === "www" || subdomain === "localhost") {
            return null;
        }

        return subdomain !== host ? subdomain : null;
    }

    resolveTenantFromHeader(req) {
        return req.headers["x-tenant-id"] || req.headers["x-tenant-name"];
    }

    resolveTenant(req) {
        if (this.resolver === "header") {
            return this.resolveTenantFromHeader(req);
        }

        if (typeof this.resolver === "function") {
            return this.resolver(req);
        }

        const headerTenant = this.resolveTenantFromHeader(req);
        if (headerTenant) return headerTenant;

        return this.resolveTenantFromSubdomain(req);
    }

    middleware(options = {}) {
        const mt = this;
        const {
            enableIsolation = true,
            tenantParam = "tenantId",
            defaultTenant = this.defaultTenant,
        } = options;

        return async (req, res, next) => {
            const tenant = mt.resolveTenant(req) || defaultTenant;

            req.tenant = {
                id: tenant,
                isDefault: tenant === defaultTenant,
            };

            if (enableIsolation) {
                req.tenantFilter = { tenant_id: tenant };
                req.tenantScope = `${tenant}`;
            }

            res.set("X-Tenant-ID", tenant);

            next();
        };
    }

    getTenantFilter(table) {
        return `${table}.tenant_id = $1`;
    }

    wrapQuery(query, params, tenantId) {
        if (!tenantId) return { query, params };

        const tenantFilter = this.getTenantFilter("tenant_id");

        const whereIndex = query.toLowerCase().indexOf("where");

        if (whereIndex === -1) {
            query += ` WHERE ${tenantFilter} = $${params.length + 1}`;
        } else {
            query = query.replace(/where/i, `WHERE ${tenantFilter} AND `);
        }

        return {
            query,
            params: [...params, tenantId],
        };
    }

    tenantScopedSchema(tenantId) {
        return `tenant_${tenantId}`;
    }
}

const multiTenancy = new MultiTenancy();

module.exports = {
    MultiTenancy,
    multiTenancy,
};
