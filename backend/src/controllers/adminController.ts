import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import bcrypt from 'bcrypt';

/**
 * Temporary endpoint to update all admins to AIT college
 */
export const runUpdateConfig = asyncHandler(async (req: Request, res: Response) => {
  const COLLEGE = 'Army Institute of Technology';
  const result = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { collegeName: COLLEGE }
  });
  res.json({ message: 'Admin config updated', count: result.count });
});

/**
 * Temporary endpoint to seed AIT students
 */
export const runAitSeed = asyncHandler(async (req: Request, res: Response) => {
  const students: any[] = [
    { rollNumber: '3201', firstName: 'Aarya',       lastName: 'Kale',              gender: 'female' },
    { rollNumber: '3202', firstName: 'Abindas',     lastName: 'P',                 gender: 'male'   },
    { rollNumber: '3203', firstName: 'Adarsh',      lastName: 'Rana',              gender: 'male'   },
    { rollNumber: '3204', firstName: 'Aditya',      lastName: 'Rawat',             gender: 'male'   },
    { rollNumber: '3205', firstName: 'Alubilli',    lastName: 'Monohar Naidu',     gender: 'male'   },
    { rollNumber: '3206', firstName: 'Aman',        lastName: 'Choudhary',         gender: 'male'   },
    { rollNumber: '3207', firstName: 'Ankit',       lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3208', firstName: 'Anuj',        lastName: 'Kumar Tomar',       gender: 'male'   },
    { rollNumber: '3209', firstName: 'Anuj',        lastName: 'Yadav',             gender: 'male'   },
    { rollNumber: '3210', firstName: 'Apurv',       lastName: 'Kumar Shukla',      gender: 'male'   },
    { rollNumber: '3211', firstName: 'Arjun',       lastName: 'Chaudhary',         gender: 'male'   },
    { rollNumber: '3212', firstName: 'Arpita',      lastName: 'Singh',             gender: 'female' },
    { rollNumber: '3213', firstName: 'Aryan',       lastName: 'Singh',             gender: 'male'   },
    { rollNumber: '3214', firstName: 'Aryan',       lastName: 'Singh Tomar',       gender: 'male'   },
    { rollNumber: '3215', firstName: 'Ashish',      lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3216', firstName: 'Ashish',      lastName: 'Yadav',             gender: 'male'   },
    { rollNumber: '3217', firstName: 'Ashutosh',    lastName: 'Mishra',            gender: 'male'   },
    { rollNumber: '3218', firstName: 'Atul',        lastName: 'Pratap',            gender: 'male'   },
    { rollNumber: '3219', firstName: 'Atul',        lastName: 'Kumar Krishania',   gender: 'male'   },
    { rollNumber: '3220', firstName: 'Ayush',       lastName: 'B Bhagwat',         gender: 'male'   },
    { rollNumber: '3221', firstName: 'Ayush',       lastName: 'Pratap Singh',      gender: 'male'   },
    { rollNumber: '3222', firstName: 'Ayushi',      lastName: 'Tripathi',          gender: 'female' },
    { rollNumber: '3223', firstName: 'Bhawesh',     lastName: 'Joshi',             gender: 'male'   },
    { rollNumber: '3224', firstName: 'Chandrapal',  lastName: 'Choudhary',         gender: 'male'   },
    { rollNumber: '3225', firstName: 'Deepanshu',   lastName: 'Saini',             gender: 'male'   },
    { rollNumber: '3226', firstName: 'Devkaran',    lastName: 'Singh',             gender: 'male'   },
    { rollNumber: '3227', firstName: 'Dikshu',      lastName: 'Chaudhary',         gender: 'male'   },
    { rollNumber: '3228', firstName: 'Harsh',       lastName: 'Sharma',            gender: 'male'   },
    { rollNumber: '3229', firstName: 'Himanshi',    lastName: 'Pathak',            gender: 'female' },
    { rollNumber: '3230', firstName: 'Hirender',    lastName: 'Singh',             gender: 'male'   },
    { rollNumber: '3231', firstName: 'Karan',       lastName: 'Singh Shekhawat',   gender: 'male'   },
    { rollNumber: '3232', firstName: 'Krish',       lastName: 'Tomar',             gender: 'male'   },
    { rollNumber: '3233', firstName: 'Laxmi',       lastName: 'Devi',              gender: 'female' },
    { rollNumber: '3234', firstName: 'Lokender',    lastName: 'Singh',             gender: 'male'   },
    { rollNumber: '3235', firstName: 'Manthan',     lastName: 'Jaswal',            gender: 'male'   },
    { rollNumber: '3236', firstName: 'Mohit',       lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3237', firstName: 'Naveen',      lastName: 'Kumar Sing',        gender: 'male'   },
    { rollNumber: '3238', firstName: 'Neha',        lastName: 'Biswas',            gender: 'female' },
    { rollNumber: '3239', firstName: 'Nitin',       lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3240', firstName: 'Parul',       lastName: 'Sharma',            gender: 'female' },
    { rollNumber: '3241', firstName: 'Piyush',      lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3242', firstName: 'Prathmesh',   lastName: 'Ashok Patil',       gender: 'male'   },
    { rollNumber: '3243', firstName: 'Praveen',     lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3244', firstName: 'Prince',      lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3245', firstName: 'Priya',       lastName: 'Rai',               gender: 'female' },
    { rollNumber: '3246', firstName: 'Rahul',       lastName: 'Singh',             gender: 'male'   },
    { rollNumber: '3247', firstName: 'Rahul',       lastName: 'Yadav',             gender: 'male'   },
    { rollNumber: '3248', firstName: 'Raj',         lastName: 'Srivastava',        gender: 'male'   },
    { rollNumber: '3249', firstName: 'Raj',         lastName: 'Raushan',           gender: 'male'   },
    { rollNumber: '3250', firstName: 'Rohit',       lastName: 'Choudhary',         gender: 'male'   },
    { rollNumber: '3251', firstName: 'Sagar',       lastName: 'Dhankhar',          gender: 'male'   },
    { rollNumber: '3252', firstName: 'Sahil',       lastName: 'Kumar',             gender: 'male'   },
    { rollNumber: '3253', firstName: 'Samiksha',    lastName: 'Sharma',            gender: 'female' },
    { rollNumber: '3254', firstName: 'Satyam',      lastName: 'Kumar Singh',       gender: 'male'   },
    { rollNumber: '3255', firstName: 'Suruchi',     lastName: 'Yadav',             gender: 'female' },
    { rollNumber: '3256', firstName: 'Tushar',      lastName: 'Singh',             gender: 'male'   },
    { rollNumber: '3257', firstName: 'Udit',        lastName: 'Pal',               gender: 'male'   },
    { rollNumber: '3258', firstName: 'Ujwal',       lastName: 'Panwar',            gender: 'male'   },
    { rollNumber: '3259', firstName: 'Vicky',       lastName: 'Yadav',             gender: 'male'   },
    { rollNumber: '3260', firstName: 'Vivek',       lastName: 'Kumar Singh',       gender: 'male'   },
    { rollNumber: '3261', firstName: 'Yash',        lastName: 'Raghuwanshi',       gender: 'male'   },
    { rollNumber: '3262', firstName: 'Pratik',      lastName: 'Kadam',             gender: 'male'   },
  ];

  const COLLEGE = 'Army Institute of Technology';
  const CLASS = 'Comp A';
  const DEPT = 'Computer Engineering';
  let created = 0, skipped = 0;

  for (const s of students) {
    const email = `${s.rollNumber}@ait.edu`;
    const password = `${s.firstName.split(' ')[0].toLowerCase()}@123`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { skipped++; continue; }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        firstName: s.firstName,
        lastName: s.lastName || 'N/A',
        email,
        passwordHash,
        role: 'STUDENT',
        gender: s.gender,
        collegeName: COLLEGE,
        department: DEPT,
        className: CLASS,
        rollNumber: s.rollNumber,
        emailVerified: true,
      },
    });
    created++;
  }
  res.json({ message: 'Seeding complete', created, skipped });
});

/**
 * Get distinct classes for the admin's college
 */
export const getClasses = asyncHandler(async (req: Request, res: Response) => {
  const collegeName = (req as any).adminCollegeName;
  if (!collegeName) {
    return res.status(400).json({ error: 'Admin college not configured' });
  }

  const classes = await prisma.user.groupBy({
    by: ['className'],
    where: {
      collegeName,
      role: 'STUDENT',
      className: { not: null }
    },
    _count: { id: true },
  });

  const result = classes
    .filter(c => c.className)
    .map(c => ({
      className: c.className,
      studentCount: c._count.id
    }));

  res.json(result);
});

/**
 * Get students in a specific class for the admin's college
 */
export const getStudentsByClass = asyncHandler(async (req: Request, res: Response) => {
  const collegeName = (req as any).adminCollegeName;
  const { className } = req.params;

  if (!collegeName) {
    return res.status(400).json({ error: 'Admin college not configured' });
  }

  const students = await prisma.user.findMany({
    where: {
      collegeName,
      className,
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
      _count: {
        select: { entries: true }
      }
    },
    orderBy: { rollNumber: 'asc' }
  });

  const result = students.map(s => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    gender: s.gender,
    rollNumber: s.rollNumber,
    department: s.department,
    className: s.className,
    createdAt: s.createdAt,
    entryCount: s._count.entries,
  }));

  res.json(result);
});

/**
 * Get full student detail (profile + learning entries + summary)
 */
export const getStudentDetail = asyncHandler(async (req: Request, res: Response) => {
  const collegeName = (req as any).adminCollegeName;
  const { studentId } = req.params;

  // Verify student belongs to admin's college
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
