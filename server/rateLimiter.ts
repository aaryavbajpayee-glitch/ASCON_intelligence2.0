import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  statusCode?: number;
  skip?: (req: Request) => boolean;
}

/**
 * High-performance in-memory sliding-window rate limiter
 * Protects against brute-force attacks and DoS/resource exhaustion
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests from this IP. Please wait before retrying.',
    statusCode = 429,
    skip,
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Garbage collection to prevent memory leaks from one-off client IPs
  const gcInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, Math.max(windowMs, 60000));

  // Allow Node process to exit cleanly if GC timer is running
  if (gcInterval.unref) {
    gcInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip && skip(req)) {
      return next();
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-client';

    const now = Date.now();
    let record = hits.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(clientIp, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(statusCode).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
