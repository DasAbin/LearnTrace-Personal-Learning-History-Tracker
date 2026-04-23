import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';

/**
 * Get distinct classes for the staff member's scope
 */
export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const collegeName  = (req as any).adminCollegeName || (req as any).staffCollegeName;
  const staffRole    = (req as any).staffRole || 'ADMIN';
  const staffDept    = (req as any).staffDepartment || (req as any).adminDepartment;
  const staffClass   = (req as any).staffClass; // only set for TEACHER

  if (!collegeName) return res.status(400).json({ error: 'College not configured' });

  // TEACHER: return only their one assigned class
  if (staffRole === 'TEACHER') {
    if (!staffClass) return res.json([]);
    const count = await prisma.user.count({
      where: { collegeName, className: staffClass, role: 'STUDENT' }
    });
    return res.json([{ className: staffClass, studentCount: count }]);
  }

  // HOD: all classes within their department
  const whereClause: any = {
    collegeName,
    role: 'STUDENT',
    className: { not: null }
  };
  if (staffRole === 'HOD' && staffDept) {
    whereClause.department = staffDept;
  }

  const classes = await prisma.user.groupBy({
    by: ['className'],
    where: whereClause,
    _count: { id: true },
  });

  res.json(
    classes
      .filter(c => c.className)
      .map(c => ({ className: c.className, studentCount: c._count.id }))
  );
});

/**
 * Get students in a specific class (scoped by role)
 */
export const getStudentsByClass = asyncHandler(async (req: Request, res: Response) => {
  const collegeName = (req as any).adminCollegeName || (req as any).staffCollegeName;
  const staffRole   = (req as any).staffRole || 'ADMIN';
  const staffDept   = (req as any).staffDepartment;
  const staffClass  = (req as any).staffClass;
  const { className } = req.params;

  if (!collegeName) return res.status(400).json({ error: 'College not configured' });

  // TEACHER can only query their assigned class
  if (staffRole === 'TEACHER' && staffClass && staffClass !== className) {
    return res.status(403).json({ error: 'You can only view your assigned class' });
  }

  const whereClause: any = { collegeName, className, role: 'STUDENT' };
  if (staffRole === 'HOD' && staffDept) {
    whereClause.department = staffDept;
  }

  const students = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true, firstName: true, lastName: true, email: true,
      gender: true, rollNumber: true, department: true,
      className: true, createdAt: true,
      _count: { select: { entries: true } }
    },
    orderBy: { rollNumber: 'asc' }
  });

  res.json(students.map(s => ({
    id: s.id, firstName: s.firstName, lastName: s.lastName,
    email: s.email, gender: s.gender, rollNumber: s.rollNumber,
    department: s.department, className: s.className,
    createdAt: s.createdAt, entryCount: s._count.entries,
  })));
});

/**
 * Get full student detail (profile + learning entries + summary + approved VAC requests)
 */
export const getStudentDetail = asyncHandler(async (req: Request, res: Response) => {
  const collegeName = (req as any).adminCollegeName || (req as any).staffCollegeName;
  const { studentId } = req.params;

  if (!collegeName) {
    return res.status(400).json({ error: 'College not configured' });
  }

  // Verify student belongs to this staff member's college
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      collegeName,
      role: 'STUDENT',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      gender: true,
      rollNumber: true,
      department: true,
      className: true,
      createdAt: true,
    }
  });

  if (!student) {
    return res.status(404).json({ error: 'Student not found in your college' });
  }

  // Get learning entries
  const entries = await prisma.learningEntry.findMany({
    where: { userId: studentId },
    orderBy: { completionDate: 'desc' },
    take: 50,
  });

  // Get APPROVED VAC refund requests only
  const approvedVacRequests = await prisma.vacRefundRequest.findMany({
    where: { studentId, status: 'APPROVED' },
    select: {
      id: true,
      courseName: true,
      platform: true,
      courseAmount: true,
      certificatePath: true,
      reviewedAt: true,
      createdAt: true,
    },
    orderBy: { reviewedAt: 'desc' },
  });

  // Calculate summary stats
  const totalHours = entries.reduce((sum, e) => sum + (e.hoursSpent || 0), 0);
  const allSkills = new Set(entries.flatMap(e => e.skills));
  const domains: Record<string, number> = {};
  const platforms: Record<string, number> = {};

  for (const e of entries) {
    domains[e.domain] = (domains[e.domain] || 0) + 1;
    platforms[e.platform] = (platforms[e.platform] || 0) + 1;
  }

  res.json({
    student,
    entries,
    approvedVacRequests,
    summary: {
      totalEntries: entries.length,
      totalHours,
      uniqueSkills: allSkills.size,
      domains,
      platforms,
    }
  });
});


/**
 * Get college overview stats for the admin dashboard
 */
export const getCollegeOverview = asyncHandler(async (req: Request, res: Response) => {
  const collegeName = (req as any).adminCollegeName;
  if (!collegeName) {
    return res.status(400).json({ error: 'Admin college not configured' });
  }

  const [totalStudents, classGroups, recentStudents] = await Promise.all([
    prisma.user.count({
      where: { collegeName, role: 'STUDENT' }
    }),
    prisma.user.groupBy({
      by: ['className'],
      where: { collegeName, role: 'STUDENT', className: { not: null } },
      _count: { id: true },
    }),
    prisma.user.findMany({
      where: { collegeName, role: 'STUDENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        className: true,
        rollNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Count total learning entries across all students in the college
  const totalEntries = await prisma.learningEntry.count({
    where: {
      user: { collegeName, role: 'STUDENT' }
    }
  });

  res.json({
    collegeName,
    totalStudents,
    totalClasses: classGroups.filter(c => c.className).length,
    totalEntries,
    classes: classGroups
      .filter(c => c.className)
      .map(c => ({ className: c.className, studentCount: c._count.id })),
    recentStudents,
  });
});
