import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

/**
 * Centralized Error Handling Middleware
 * 
 * Catches all unhandled errors and returns appropriate HTTP responses.
 * In production, hides error details for security.
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Structured Logging
  logger.error({
    err: {
      message: err.message,
      stack: isProduction ? undefined : err.stack,
      name: err.name,
      ...err
    },
    req: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      ip: req.ip,
      headers: isProduction ? undefined : req.headers
    }
  }, 'Unhandled Exception');

  // API Response
  res.status(statusCode).json({
    error: isProduction ? 'Internal server error' : err.message,
    ...( !isProduction && { stack: err.stack })
  });
};
