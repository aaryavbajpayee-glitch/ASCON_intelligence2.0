import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

interface ServerMetrics {
  totalRequests: number;
  activeRequests: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  totalDurationMs: number;
  slowRequestsCount: number; // requests taking > 500ms
  startedAt: string;
}

class TelemetryCollector {
  private metrics: ServerMetrics = {
    totalRequests: 0,
    activeRequests: 0,
    status2xx: 0,
    status3xx: 0,
    status4xx: 0,
    status5xx: 0,
    totalDurationMs: 0,
    slowRequestsCount: 0,
    startedAt: new Date().toISOString(),
  };

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // 1. Generate or forward unique correlation Request ID
      const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
      res.setHeader('X-Request-Id', requestId);
      (req as any).requestId = requestId;

      // 2. Telemetry tracking
      this.metrics.totalRequests += 1;
      this.metrics.activeRequests += 1;
      const startTime = performance.now();

      // Intercept end to set timing header before payload flush
      const originalEnd = res.end.bind(res);
      res.end = function (...args: any[]): any {
        if (!res.headersSent) {
          const duration = performance.now() - startTime;
          res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        }
        return (originalEnd as any)(...args);
      };

      res.on('finish', () => {
        this.metrics.activeRequests = Math.max(0, this.metrics.activeRequests - 1);
        const duration = performance.now() - startTime;
        this.metrics.totalDurationMs += duration;

        if (duration > 500) {
          this.metrics.slowRequestsCount += 1;
        }

        const statusCode = res.statusCode;
        if (statusCode >= 200 && statusCode < 300) this.metrics.status2xx += 1;
        else if (statusCode >= 300 && statusCode < 400) this.metrics.status3xx += 1;
        else if (statusCode >= 400 && statusCode < 500) this.metrics.status4xx += 1;
        else if (statusCode >= 500) this.metrics.status5xx += 1;

        // Structured logging in production or warning on errors
        if (statusCode >= 500) {
          console.error(
            `[ALERT] [${requestId}] ${req.method} ${req.originalUrl || req.url} ${statusCode} in ${duration.toFixed(2)}ms`
          );
        }
      });

      next();
    };
  }

  public getMetrics() {
    const memory = process.memoryUsage();
    const avgDuration =
      this.metrics.totalRequests > 0
        ? (this.metrics.totalDurationMs / this.metrics.totalRequests).toFixed(2)
        : '0.00';

    return {
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      requests: {
        total: this.metrics.totalRequests,
        active: this.metrics.activeRequests,
        status2xx: this.metrics.status2xx,
        status3xx: this.metrics.status3xx,
        status4xx: this.metrics.status4xx,
        status5xx: this.metrics.status5xx,
        slowRequests: this.metrics.slowRequestsCount,
        averageDurationMs: parseFloat(avgDuration),
      },
      memory: {
        rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
        heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
        heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2),
        externalMB: (memory.external / (1024 * 1024)).toFixed(2),
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
  }
}

export const telemetry = new TelemetryCollector();
