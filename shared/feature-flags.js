/**
 * Feature Flag Service
 *
 * Supports:
 * - Boolean flags (on/off)
 * - Percentage rollouts
 * - User targeting (whitelist/blacklist)
 * - A/B testing
 * - Remote configuration via Redis
 */

const { createHash } = require("crypto");

class FeatureFlagService {
    constructor(options = {}) {
        this.flags = new Map();
        this.redisClient = options.redisClient || null;
        this.defaultFlags = {
            "new-dashboard": { enabled: false, rollout: 0 },
            "ai-recommendations": { enabled: true, rollout: 100 },
            "dark-mode": { enabled: true, rollout: 50 },
            "beta-features": { enabled: false, rollout: 0, whitelist: [] },
            "new-checkout": { enabled: true, rollout: 10 },
            "improved-search": { enabled: true, rollout: 25 },
        };
        this.refreshInterval = options.refreshInterval || 60000;
    }

    async initialize() {
        if (this.redisClient) {
            await this.loadFromRedis();
            this.startRefresh();
        } else {
            this.flags = new Map(Object.entries(this.defaultFlags));
        }
    }

    async loadFromRedis() {
        try {
            const keys = await this.redisClient.keys("feature:*");
            for (const key of keys) {
                const flagName = key.replace("feature:", "");
                const flagData = await this.redisClient.get(key);
                if (flagData) {
                    this.flags.set(flagName, JSON.parse(flagData));
                }
            }
        } catch (error) {
            console.error("Failed to load flags from Redis:", error);
            this.flags = new Map(Object.entries(this.defaultFlags));
        }
    }

    startRefresh() {
        setInterval(() => this.loadFromRedis(), this.refreshInterval);
    }

    isEnabled(flagName, userId = null) {
        const flag = this.flags.get(flagName);

        if (!flag) return false;

        if (!flag.enabled) return false;

        if (flag.whitelist && flag.whitelist.length > 0) {
            return userId && flag.whitelist.includes(userId);
        }

        if (flag.blacklist && flag.blacklist.includes(userId)) {
            return false;
        }

        if (flag.rollout !== undefined && flag.rollout < 100) {
            return this.isInRollout(flagName, userId);
        }

        return true;
    }

    isInRollout(flagName, userId) {
        if (!userId) {
            return Math.random() * 100 < (this.flags.get(flagName)?.rollout || 0);
        }

        const hash = createHash("md5").update(`${flagName}:${userId}`).digest("hex");

        const bucket = parseInt(hash.substring(0, 8), 16) % 100;
        const rollout = this.flags.get(flagName)?.rollout || 0;

        return bucket < rollout;
    }

    getVariant(flagName, userId = null, variants = {}) {
        if (!this.isEnabled(flagName, userId)) {
            return variants.control || "control";
        }

        const variantHash = createHash("md5")
            .update(`${flagName}:variant:${userId || Math.random()}`)
            .digest("hex");

        const variantKeys = Object.keys(variants);
        const bucket = parseInt(variantHash.substring(0, 8), 16) % 100;
        const bucketPerVariant = 100 / variantKeys.length;

        const variantIndex = Math.floor(bucket / bucketPerVariant);
        return variantKeys[variantIndex];
    }

    async setFlag(flagName, config) {
        this.flags.set(flagName, config);

        if (this.redisClient) {
            await this.redisClient.set(`feature:${flagName}`, JSON.stringify(config), "EX", 3600);
        }
    }

    async enableFlag(flagName) {
        const flag = this.flags.get(flagName) || { enabled: false, rollout: 0 };
        await this.setFlag(flagName, { ...flag, enabled: true });
    }

    async disableFlag(flagName) {
        const flag = this.flags.get(flagName) || { enabled: true, rollout: 100 };
        await this.setFlag(flagName, { ...flag, enabled: false });
    }

    async setRollout(flagName, percentage) {
        const flag = this.flags.get(flagName) || { enabled: true, rollout: 0 };
        await this.setFlag(flagName, { ...flag, rollout: percentage });
    }

    getAllFlags() {
        return Object.fromEntries(this.flags);
    }

    middleware() {
        const service = this;

        return (req, res, next) => {
            const userId = req.user?.id || req.headers["x-user-id"];

            req.features = {
                isEnabled: flag => service.isEnabled(flag, userId),
                getVariant: (flag, variants) => service.getVariant(flag, userId, variants),
                all: service.getAllFlags(),
            };

            next();
        };
    }
}

const featureFlags = new FeatureFlagService();

module.exports = {
    FeatureFlagService,
    featureFlags,
};
