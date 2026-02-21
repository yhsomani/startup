// Type declarations for JavaScript modules that don't have types

declare module "express-rate-limit" {
    import { RequestHandler } from "express";

    interface RateLimitOptions {
        windowMs?: number;
        max?: number | RequestHandler;
        standardHeaders?: boolean;
        legacyHeaders?: boolean;
        handler?: RequestHandler;
        skip?: (req: any) => boolean;
        keyGenerator?: (req: any) => string;
    }

    function rateLimit(options?: RateLimitOptions): RequestHandler;
    export = rateLimit;
}

declare module "http-proxy-middleware" {
    import { RequestHandler } from "express";

    interface ProxyConfig {
        target?: string;
        changeOrigin?: boolean;
        secure?: boolean;
        pathRewrite?: ((path: string) => string) | Record<string, string>;
        onProxyReq?: (proxyReq: any, req: any) => void;
        onProxyRes?: (proxyRes: any, req: any) => void;
        onError?: (err: Error, req: any, res: any) => void;
    }

    function createProxyMiddleware(config: ProxyConfig): RequestHandler;
    export { createProxyMiddleware };
}
