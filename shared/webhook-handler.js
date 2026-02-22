/**
 * Webhook Handler
 *
 * Manages outbound webhooks to external systems
 * with retry logic and signature verification.
 */

const crypto = require("crypto");
const { createLogger } = require("./logger");

class WebhookHandler {
    constructor(options = {}) {
        this.logger = createLogger("webhook");
        this.redisClient = options.redisClient || null;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.timeout = options.timeout || 30000;
    }

    setRedisClient(client) {
        this.redisClient = client;
    }

    generateSignature(payload, secret) {
        return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
    }

    verifySignature(payload, signature, secret) {
        const expected = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }

    async send(webhook, payload, retries = 0) {
        const { url, secret, event } = webhook;

        const headers = {
            "Content-Type": "application/json",
            "User-Agent": "TalentSphere-Webhook/1.0",
            "X-Webhook-Event": event,
            "X-Webhook-Timestamp": Date.now().toString(),
        };

        if (secret) {
            headers["X-Webhook-Signature"] = this.generateSignature(payload, secret);
        }

        try {
            const response = await this.executeRequest({
                url,
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                timeout: this.timeout,
            });

            this.logger.info("Webhook sent", { event, url, status: response.status });

            return {
                success: true,
                status: response.status,
                body: response.body,
            };
        } catch (error) {
            this.logger.error("Webhook failed", { event, url, error: error.message });

            if (retries < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retries);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.send(webhook, payload, retries + 1);
            }

            return {
                success: false,
                error: error.message,
                retries,
            };
        }
    }

    async executeRequest({ url, method, headers, body, timeout }) {
        return new Promise((resolve, reject) => {
            const start = Date.now();

            const request = require("http").request(
                {
                    hostname: new URL(url).hostname,
                    port: new URL(url).port || (url.startsWith("https") ? 443 : 80),
                    path: new URL(url).pathname,
                    method,
                    headers,
                    timeout,
                },
                res => {
                    let data = "";
                    res.on("data", chunk => (data += chunk));
                    res.on("end", () => {
                        resolve({
                            status: res.statusCode,
                            body: data,
                        });
                    });
                }
            );

            request.on("error", reject);
            request.on("timeout", () => {
                request.destroy();
                reject(new Error("Request timeout"));
            });

            if (body) request.write(body);
            request.end();
        });
    }

    async processWebhookEvent(event, data) {
        const eventKey = `webhook:event:${event}`;

        if (this.redisClient) {
            const processed = await this.redisClient.get(eventKey);
            if (processed) {
                this.logger.warn("Duplicate webhook event", { event });
                return { duplicate: true };
            }
            await this.redisClient.setex(eventKey, 3600, "processed");
        }

        const webhooks = this.getRegisteredWebhooks(event);

        const results = await Promise.all(webhooks.map(webhook => this.send(webhook, data)));

        return { sent: results.length, results };
    }

    getRegisteredWebhooks(event) {
        return [];
    }

    middleware() {
        const handler = this;

        return async (req, res, next) => {
            const signature = req.headers["x-webhook-signature"];
            const timestamp = req.headers["x-webhook-timestamp"];

            if (!timestamp || Date.now() - parseInt(timestamp) > 300000) {
                return res.status(400).json({ error: "Webhook timestamp expired" });
            }

            const body = req.body;

            if (signature && req.webhookSecret) {
                if (!handler.verifySignature(body, signature, req.webhookSecret)) {
                    return res.status(401).json({ error: "Invalid signature" });
                }
            }

            req.webhookEvent = {
                event: req.headers["x-webhook-event"],
                data: body,
                timestamp: parseInt(timestamp),
            };

            next();
        };
    }
}

const webhookHandler = new WebhookHandler();

module.exports = {
    WebhookHandler,
    webhookHandler,
};
