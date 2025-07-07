import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '../../types/entities/produto';

export interface ApiRequest extends NextApiRequest {
  startTime?: number;
}

// Enhanced error class for API errors
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: string[];

  constructor(message: string, statusCode: number = 500, details?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
export class ValidationError extends AppError {
  constructor(message: string = 'Dados inválidos', details?: string[]) {
    super(message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados') {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403);
  }
}

// Error handler middleware
export function errorHandler(
  error: Error,
  req: ApiRequest,
  res: NextApiResponse
) {
  // Log error details
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();
  const duration = req.startTime ? Date.now() - req.startTime : 0;

  console.error('API Error:', {
    requestId,
    timestamp,
    method: req.method,
    url: req.url,
    duration: `${duration}ms`,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    headers: req.headers,
    body: req.body,
  });

  // Handle different error types
  if (error instanceof AppError) {
    const response: ApiError = {
      success: false,
      error: error.message,
      details: error.details,
    };

    return res.status(error.statusCode).json(response);
  }

  // Handle Supabase errors
  if (error.message.includes('duplicate key value violates unique constraint')) {
    const response: ApiError = {
      success: false,
      error: 'Dados já existem no sistema',
      details: ['Verifique se o SKU já não está em uso'],
    };

    return res.status(409).json(response);
  }

  if (error.message.includes('violates foreign key constraint')) {
    const response: ApiError = {
      success: false,
      error: 'Referência inválida',
      details: ['Um ou mais campos fazem referência a dados que não existem'],
    };

    return res.status(400).json(response);
  }

  // Handle validation errors from other sources
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    const response: ApiError = {
      success: false,
      error: 'Dados inválidos',
      details: [error.message],
    };

    return res.status(400).json(response);
  }

  // Handle network/connection errors
  if (error.message.includes('network') || error.message.includes('connection')) {
    const response: ApiError = {
      success: false,
      error: 'Erro de conexão com o banco de dados',
    };

    return res.status(503).json(response);
  }

  // Default server error
  const response: ApiError = {
    success: false,
    error: 'Erro interno do servidor',
  };

  // In development, include error details
  if (process.env.NODE_ENV === 'development') {
    response.details = [error.message];
  }

  return res.status(500).json(response);
}

// Async error wrapper
export function asyncHandler(
  fn: (req: ApiRequest, res: NextApiResponse) => Promise<any>
) {
  return async (req: ApiRequest, res: NextApiResponse) => {
    try {
      // Add start time for request duration tracking
      req.startTime = Date.now();

      await fn(req, res);
    } catch (error) {
      errorHandler(error as Error, req, res);
    }
  };
}

// Request validation middleware
export function validateMethod(allowedMethods: string[]) {
  return (req: ApiRequest, res: NextApiResponse, next: () => void) => {
    if (!req.method || !allowedMethods.includes(req.method)) {
      throw new AppError(`Método ${req.method} não permitido`, 405);
    }
    next();
  };
}

// Content type validation
export function validateContentType(req: ApiRequest, res: NextApiResponse, next: () => void) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new ValidationError('Content-Type deve ser application/json');
    }
  }
  next();
}

// Request size validation
export function validateRequestSize(maxSize: number = 1024 * 1024) { // 1MB default
  return (req: ApiRequest, res: NextApiResponse, next: () => void) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxSize) {
      throw new ValidationError(`Request muito grande. Máximo permitido: ${maxSize} bytes`);
    }
    next();
  };
}

// Rate limiting helper
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: ApiRequest, res: NextApiResponse, next: () => void) => {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const clientData = requests.get(clientId);
    
    if (!clientData || clientData.resetTime <= now) {
      requests.set(clientId, { count: 1, resetTime: windowStart + windowMs });
      return next();
    }

    if (clientData.count >= maxRequests) {
      const resetIn = Math.ceil((clientData.resetTime - now) / 1000);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', resetIn);
      
      throw new AppError('Muitas tentativas. Tente novamente mais tarde.', 429);
    }

    clientData.count++;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - clientData.count);
    res.setHeader('X-RateLimit-Reset', Math.ceil((clientData.resetTime - now) / 1000));

    next();
  };
}

// Utility functions
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getClientId(req: ApiRequest): string {
  // Get client identifier (IP + User-Agent for simple rate limiting)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  return `${ip}-${Buffer.from(userAgent).toString('base64').substring(0, 10)}`;
}

// Response helpers
export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  message?: string,
  meta?: { count?: number; page?: number; limit?: number }
) {
  const response = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && meta),
  };

  res.status(200).json(response);
}

export function sendCreated<T>(
  res: NextApiResponse,
  data: T,
  message: string = 'Recurso criado com sucesso'
) {
  const response = {
    success: true,
    data,
    message,
  };

  res.status(201).json(response);
}

export function sendNoContent(res: NextApiResponse) {
  res.status(204).end();
}

// Middleware composition helper
export function composeMiddleware(...middlewares: Array<(req: ApiRequest, res: NextApiResponse, next: () => void) => void>) {
  return (req: ApiRequest, res: NextApiResponse) => {
    let index = 0;

    function next(): void {
      if (index >= middlewares.length) return;
      const middleware = middlewares[index++];
      middleware(req, res, next);
    }

    next();
  };
}