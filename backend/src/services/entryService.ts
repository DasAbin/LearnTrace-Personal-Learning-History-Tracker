import fs from 'fs/promises';
import path from 'path';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export interface CreateEntryData {
  title: string;
  platform: string;
  domain: string;
  subDomain?: string;
  hoursSpent?: number;
  startDate: Date;
  completionDate: Date;
  skills: string[];
  description?: string;
  reflection?: string;
  certificatePath?: string;
  status?: string;
  difficulty?: string;
  rating?: number;
  resourceUrl?: string;
}

export interface UpdateEntryData extends Partial<CreateEntryData> {}

export const getMetadata = async (userId: string) => {
  const [platforms, domains] = await Promise.all([
    prisma.learningEntry.findMany({
      where: { userId },
      select: { platform: true },
      distinct: ['platform']
    }),
    prisma.learningEntry.findMany({
      where: { userId },
      select: { domain: true },
      distinct: ['domain']
    })
  ]);

  return {
    platforms: platforms.map(p => p.platform).filter(Boolean),
    domains: domains.map(d => d.domain).filter(Boolean)
  };
};

export const createEntry = async (userId: string, data: CreateEntryData) => {
  return prisma.learningEntry.create({
    data: {
      ...data,
      userId
    }
  });
};

export const getEntries = async (
  userId: string,
  filters?: {
    domain?: string;
    platform?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  },
  cursor?: string, // last entry id
  limit: number = 20,
  page?: number
) => {
  const where: any = { userId };

  if (filters?.domain) {
    where.domain = filters.domain;
  }

  if (filters?.platform) {
    where.platform = filters.platform;
  }

  if (filters?.startDate || filters?.endDate) {
    where.completionDate = {};
    if (filters.startDate) {
      where.completionDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.completionDate.lte = filters.endDate;
    }
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { platform: { contains: filters.search, mode: 'insensitive' } },
      { skills: { hasSome: [filters.search.toLowerCase()] } }
    ];
  }

  // Cursor-based pagination (Infinite Scroll)
  if (cursor || (limit && !page)) {
    const results = await prisma.learningEntry.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { completionDate: 'desc' },
    });

    let nextCursor: string | null = null;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem!.id;
    }

    return {
      data: results,
      nextCursor,
    };
  }

  // Offset-based pagination (Backward compatibility)
  if (page && limit) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.learningEntry.findMany({
        where,
        orderBy: { completionDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.learningEntry.count({ where })
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  return prisma.learningEntry.findMany({
    where,
    orderBy: { completionDate: 'desc' }
  });
};

export const getEntryById = async (userId: string, entryId: string) => {
  return prisma.learningEntry.findFirst({
    where: {
      id: entryId,
      userId
    }
  });
};

export const updateEntry = async (userId: string, entryId: string, data: UpdateEntryData) => {
  const entry = await getEntryById(userId, entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }

  return prisma.learningEntry.update({
    where: { id: entryId },
    data
  });
};

export const deleteEntry = async (userId: string, entryId: string) => {
  const entry = await getEntryById(userId, entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }

  if (entry.certificatePath) {
    try {
      if (entry.certificatePath.startsWith('http')) {
        const urlParts = entry.certificatePath.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
        
        const { v2: cloudinary } = require('cloudinary');
        await cloudinary.uploader.destroy(publicId);
      } else {
        const absolutePath = path.join(__dirname, '../../', entry.certificatePath.replace(/^\//, ''));
        await fs.unlink(absolutePath);
      }
    } catch (error) {
      logger.error({ entryId, error }, 'Failed to delete certificate file');
    }
  }

  return prisma.learningEntry.delete({
    where: { id: entryId }
  });
};
