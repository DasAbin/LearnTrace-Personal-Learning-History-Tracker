import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * requireVacIncharge — allows only VAC_INCHARGE role.
 * Attaches vacCollegeName and vacDepartment to req for scoping.
 */
export const requireVacIncharge = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, collegeName: true, department: true },
    });

    if (!user || user.role !== 'VAC_INCHARGE') {
      return res.status(403).json({ error: 'VAC Incharge access required' });
    }

    (req as any).vacCollegeName = user.collegeName;
    (req as any).vacDepartment  = user.department;
    next();
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
