import { rateLimiter } from "hono-rate-limiter";

export const rateLimiterMiddleware = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
    standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => {
        // Use X-Forwarded-For if behind valid proxy, or fallback to IP
        const ip = c.req.header("x-forwarded-for") || "unknown-ip";
        return ip;
    },
    message: { success: false, message: "Too many requests, please try again later." }
});
