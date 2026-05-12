import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken, type JWTPayload } from './jwt';

declare module 'express' {
  export interface Request {
    user?: JWTPayload | null;
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = extractTokenFromHeader(authHeader) || (req.cookies && (req.cookies.token as string));
    if (!token) {
      req.user = null;
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      req.user = null;
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = payload;
    return next();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requiere rol admin' });
  return next();
};

export const workerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.role !== 'worker' && req.user.role !== 'admin') return res.status(403).json({ error: 'Requiere rol worker o admin' });
  return next();
};

export default { authMiddleware, adminMiddleware, workerMiddleware };
