import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";

const log = logger.child({ service: "auth" });
const JWT_SECRET = process.env.JWT_SECRET || "musicplay-dev-secret";
const COOKIE_NAME = "musicplay_token";
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    log.warn({ path: req.path, ip: req.ip }, "No token provided");
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = payload.userId;

    // Sliding expiration: refresh cookie on every request
    const newToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: "365d" });
    res.cookie(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
    });

    next();
  } catch (err) {
    log.warn({ path: req.path, ip: req.ip, err }, "Invalid token");
    res.status(401).json({ error: "Invalid token" });
  }
}

export { JWT_SECRET, COOKIE_NAME, MAX_AGE };
