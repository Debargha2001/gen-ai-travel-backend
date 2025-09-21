import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verifyJwtToken } from "./tokenHelper.js";
import { logger } from "./logger.js";

interface JwtPayload {
  uuid: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and sets userId in context
 */
export const jwtAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      logger.warn({
        message: "Missing authorization header",
        module: "JWT Auth Middleware",
      });
      throw new HTTPException(401, {
        message: "Authorization header is required",
      });
    }

    // Extract Bearer token
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      logger.warn({
        message: "Invalid authorization header format",
        module: "JWT Auth Middleware",
        data: { authHeader: authHeader.substring(0, 20) + "..." },
      });
      throw new HTTPException(401, {
        message: "Invalid authorization header format. Expected: Bearer <token>",
      });
    }

    const token = parts[1];

    // Verify JWT token
    const [verifyErr, payload] = verifyJwtToken(token);

    if (verifyErr || !payload) {
      logger.warn({
        message: "JWT token verification failed",
        module: "JWT Auth Middleware",
        error: verifyErr || new Error("No payload returned"),
      });
      throw new HTTPException(401, {
        message: "Invalid or expired token",
      });
    }

    const jwtPayload = payload as JwtPayload;

    // Set user information in context
    c.set("userId", jwtPayload.uuid);
    c.set("userEmail", jwtPayload.email);
    c.set("userName", jwtPayload.name);
    c.set("jwtPayload", jwtPayload);

    logger.debug({
      message: "JWT authentication successful",
      module: "JWT Auth Middleware",
      data: {
        userId: jwtPayload.uuid,
        email: jwtPayload.email,
      },
      skipDb: true,
    });

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    logger.error({
      message: "Unexpected error in JWT auth middleware",
      module: "JWT Auth Middleware",
      error: error as Error,
    });

    throw new HTTPException(500, {
      message: "Authentication service error",
    });
  }
};

/**
 * Optional JWT Authentication Middleware
 * Verifies JWT token if present but doesn't require it
 */
export const optionalJwtAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      // No auth header, continue without setting user context
      await next();
      return;
    }

    // Extract Bearer token
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      // Invalid format, continue without setting user context
      await next();
      return;
    }

    const token = parts[1];

    // Verify JWT token
    const [verifyErr, payload] = verifyJwtToken(token);

    if (verifyErr || !payload) {
      // Invalid token, continue without setting user context
      await next();
      return;
    }

    const jwtPayload = payload as JwtPayload;

    // Set user information in context
    c.set("userId", jwtPayload.uuid);
    c.set("userEmail", jwtPayload.email);
    c.set("userName", jwtPayload.name);
    c.set("jwtPayload", jwtPayload);

    logger.debug({
      message: "Optional JWT authentication successful",
      module: "JWT Auth Middleware",
      data: {
        userId: jwtPayload.uuid,
        email: jwtPayload.email,
      },
      skipDb: true,
    });

    await next();
  } catch (error) {
    logger.error({
      message: "Error in optional JWT auth middleware",
      module: "JWT Auth Middleware",
      error: error as Error,
    });

    // Continue without authentication for optional middleware
    await next();
  }
};
