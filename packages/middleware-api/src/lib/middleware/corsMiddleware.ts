import { NextApiRequest, NextApiResponse } from "next";

interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

const defaultOptions: CorsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
    "X-Client-ID",
    "X-Request-ID",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

export function cors(options: CorsOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    // Get origin from request
    const origin = req.headers.origin;

    // Set Access-Control-Allow-Origin
    if (opts.origin === true) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (typeof opts.origin === "string") {
      res.setHeader("Access-Control-Allow-Origin", opts.origin);
    } else if (Array.isArray(opts.origin)) {
      if (origin && opts.origin.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
    } else if (typeof opts.origin === "boolean" && !opts.origin) {
      // CORS disabled
      return next?.();
    }

    // Set Vary header if origin is not *
    if (opts.origin !== "*") {
      res.setHeader("Vary", "Origin");
    }

    // Set Access-Control-Allow-Credentials
    if (opts.credentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Set Access-Control-Allow-Methods
    if (opts.methods) {
      res.setHeader("Access-Control-Allow-Methods", opts.methods.join(", "));
    }

    // Set Access-Control-Allow-Headers
    if (opts.allowedHeaders) {
      res.setHeader(
        "Access-Control-Allow-Headers",
        opts.allowedHeaders.join(", "),
      );
    }

    // Set Access-Control-Max-Age
    if (opts.maxAge) {
      res.setHeader("Access-Control-Max-Age", opts.maxAge.toString());
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(opts.optionsSuccessStatus || 200);

      if (!opts.preflightContinue) {
        res.end();
        return;
      }
    }

    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // API-specific headers
    res.setHeader("X-API-Version", "1.0.0");
    res.setHeader("X-Response-Time", Date.now().toString());

    next?.();
  };
}

// Development CORS (allows all origins)
export const devCors = cors({
  origin: true,
  credentials: true,
});

// Production CORS (specific origins only)
export const prodCors = cors({
  origin: [
    "https://saudenow.com",
    "https://www.saudenow.com",
    "https://app.saudenow.com",
    "https://admin.saudenow.com",
  ],
  credentials: true,
});

// Get appropriate CORS middleware based on environment
export function getCorsMiddleware() {
  const env = process.env.NODE_ENV || "development";

  if (env === "production") {
    return prodCors;
  }

  return devCors;
}

// Middleware for API key validation
export function validateApiKey(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) {
  const apiKey = req.headers["x-api-key"] as string;
  const validApiKeys = process.env.API_KEYS?.split(",") || [];

  // Skip validation in development if no API keys are configured
  if (process.env.NODE_ENV === "development" && validApiKeys.length === 0) {
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API Key é obrigatória",
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: "API Key inválida",
    });
  }

  next();
}

// Middleware for JWT token validation (placeholder)
export function validateJWT(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      error: "Token de autorização é obrigatório",
    });
  }

  const token = authorization.replace("Bearer ", "");

  try {
    // TODO: Implement JWT validation
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // req.user = decoded;

    // For now, just validate that token exists
    if (!token) {
      throw new Error("Token inválido");
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token inválido",
    });
  }
}

// Optional authentication middleware
export function optionalAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) {
  const authorization = req.headers.authorization;
  const apiKey = req.headers["x-api-key"];

  // If no auth provided, continue without user context
  if (!authorization && !apiKey) {
    return next();
  }

  // If API key provided, validate it
  if (apiKey) {
    return validateApiKey(req, res, next);
  }

  // If JWT provided, validate it
  if (authorization) {
    return validateJWT(req, res, next);
  }

  next();
}

// Request logging middleware
export function requestLogger(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);

  // Add request ID to headers
  res.setHeader("X-Request-ID", requestId);

  console.log(`[${requestId}] ${req.method} ${req.url} - Started`);

  // Override res.end to log completion
  const originalEnd = res.end.bind(res);
  res.end = function (
    chunk?: string | Buffer,
    encodingOrCallback?: BufferEncoding | (() => void),
    callback?: () => void,
  ) {
    const duration = Date.now() - startTime;
    console.log(
      `[${requestId}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`,
    );
    return originalEnd(chunk, encodingOrCallback as BufferEncoding, callback);
  } as typeof res.end;

  next();
}

// Health check bypass middleware
export function healthCheckBypass(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) {
  // Skip authentication for health check endpoints
  if (req.url?.includes("/health") || req.url?.includes("/status")) {
    return next();
  }

  next();
}
