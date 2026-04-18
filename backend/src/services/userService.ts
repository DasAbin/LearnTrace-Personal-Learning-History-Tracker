import prisma from '../lib/prisma';
import { format } from 'date-fns';

export const exportUserData = async (userId: string, formatType: 'json' | 'csv') => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId },
    orderBy: { completionDate: 'desc' }
  });

  if (formatType === 'json') {
    return {
      contentType: 'application/json',
      filename: `learntrace-export-${format(new Date(), 'yyyy-MM-dd')}.json`,
      content: JSON.stringify(entries, null, 2)
    };
  } else {
    const headers = ['Title', 'Platform', 'Domain', 'Sub-domain', 'Start Date', 'Completion Date', 'Skills', 'Description', 'Reflection'];
    const csvRows = [
      headers.join(','),
      ...entries.map((entry) => {
        return [
          `"${entry.title.replace(/"/g, '""')}"`,
          `"${entry.platform.replace(/"/g, '""')}"`,
          `"${entry.domain.replace(/"/g, '""')}"`,
          `"${(entry.subDomain || '').replace(/"/g, '""')}"`,
          format(new Date(entry.startDate), 'yyyy-MM-dd'),
          format(new Date(entry.completionDate), 'yyyy-MM-dd'),
          `"${entry.skills.join('; ').replace(/"/g, '""')}"`,
          `"${(entry.description || '').replace(/"/g, '""')}"`,
          `"${(entry.reflection || '').replace(/"/g, '""')}"`,
        ].join(',');
      }),
    ];

    return {
      contentType: 'text/csv',
      filename: `learntrace-export-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      content: csvRows.join('\n')
    };
  }
};

export const getPortfolio = async (publicId: string) => {
  const user = await prisma.user.findUnique({
    where: { publicProfileId: publicId },
    include: {
      entries: {
        orderBy: { completionDate: 'desc' }
      }
    }
  });

  if (!user) throw new Error('Portfolio not found');

  return {
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
    entries: user.entries
  };
};

export const updatePublicProfileId = async (userId: string, publicProfileId: string | null) => {
  if (publicProfileId) {
    const existing = await prisma.user.findUnique({
      where: { publicProfileId }
    });
    if (existing && existing.id !== userId) {
      throw new Error('This public profile ID is already taken');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { publicProfileId },
    select: {
      id: true,
      publicProfileId: true
    }
  });
};

export const deleteUser = async (userId: string) => {
  return prisma.user.delete({
    where: { id: userId }
  });
};
