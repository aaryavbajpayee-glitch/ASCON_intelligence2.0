import type { Request, Response, NextFunction } from 'express';
import zlib from 'node:zlib';

const COMPRESSIBLE_TYPES = /json|text|javascript|css|xml|html|svg/i;

/**
 * Zero-dependency native HTTP response compression middleware using node:zlib
 * Significantly reduces network payload sizes and speeds up asset delivery
 */
export function nativeCompression(threshold: number = 1024) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const acceptEncoding = req.headers['accept-encoding'] as string || '';

    if (!acceptEncoding || req.method === 'HEAD') {
      return next();
    }

    const supportsGzip = acceptEncoding.includes('gzip');
    const supportsDeflate = acceptEncoding.includes('deflate');

    if (!supportsGzip && !supportsDeflate) {
      return next();
    }

    const originalSend = res.send.bind(res);

    res.send = function (body: any): Response {
      // Only compress if response is not already sent
      if (res.headersSent || body === undefined || body === null || res.statusCode === 204 || res.statusCode === 304) {
        return originalSend(body);
      }

      // Check content type
      const contentType = res.getHeader('Content-Type') as string || '';
      if (contentType && !COMPRESSIBLE_TYPES.test(contentType)) {
        return originalSend(body);
      }

      let buffer: Buffer;
      if (Buffer.isBuffer(body)) {
        buffer = body;
      } else if (typeof body === 'string') {
        buffer = Buffer.from(body);
      } else if (typeof body === 'object' && body !== null) {
        buffer = Buffer.from(JSON.stringify(body));
        if (!contentType) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
      } else {
        return originalSend(body);
      }

      // Do not compress if below threshold size
      if (buffer.length < threshold) {
        return originalSend(buffer);
      }

      try {
        if (supportsGzip) {
          const compressed = zlib.gzipSync(buffer, { level: 6 });
          res.setHeader('Content-Encoding', 'gzip');
          res.removeHeader('Content-Length');
          res.setHeader('Content-Length', compressed.length);
          res.setHeader('Vary', 'Accept-Encoding');
          return originalSend(compressed);
        } else if (supportsDeflate) {
          const compressed = zlib.deflateSync(buffer, { level: 6 });
          res.setHeader('Content-Encoding', 'deflate');
          res.removeHeader('Content-Length');
          res.setHeader('Content-Length', compressed.length);
          res.setHeader('Vary', 'Accept-Encoding');
          return originalSend(compressed);
        }
      } catch (err) {
        console.warn('Compression error, falling back to uncompressed stream:', err);
      }

      return originalSend(buffer);
    };

    next();
  };
}
