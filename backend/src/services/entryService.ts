import prisma from '../lib/prisma';

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
}

export interface UpdateEntryData extends Partial<CreateEntryData> {}

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
  }
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
      { platform: { contains: filters.search, mode: 'insensitive' } }
    ];
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

  return prisma.learningEntry.delete({
    where: { id: entryId }
  });
};
