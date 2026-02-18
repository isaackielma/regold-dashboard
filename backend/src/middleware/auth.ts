import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, InvestorRole } from '../types/domain';

export interface AuthRequest extends Request {
  investor: JwtPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    (req as AuthRequest).investor = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: InvestorRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const investor = (req as AuthRequest).investor;
    if (!investor || !roles.includes(investor.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
