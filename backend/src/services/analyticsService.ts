import prisma from '../lib/prisma';

export const getSummary = async (userId: string) => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId },
    orderBy: { completionDate: 'desc' },
    select: {
      completionDate: true,
      hoursSpent: true,
      skills: true
    }
  });

  const totalEntries = entries.length;
  
  // Calculate total hours based on actual hours spent per entry
  const totalHours = entries.reduce((sum, e) => sum + (e.hoursSpent ?? 0), 0);

  // Calculate streak (consecutive days with entries)
  let streak = 0;
  if (entries.length > 0) {
    const sortedEntries = [...entries].sort((a, b) => 
      b.completionDate.getTime() - a.completionDate.getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecentDate = new Date(sortedEntries[0].completionDate);
    mostRecentDate.setHours(0, 0, 0, 0);

    const mostRecentTime = mostRecentDate.getTime();

    if (
      mostRecentTime !== today.getTime() &&
      mostRecentTime !== yesterday.getTime()
    ) {
      // streak is already 0, skip the loop entirely
    } else {
      let currentDate = mostRecentTime === today.getTime() ? new Date(today) : new Date(yesterday);
      let entryIndex = 0;

      while (entryIndex < sortedEntries.length) {
        const entryDate = new Date(sortedEntries[entryIndex].completionDate);
        entryDate.setHours(0, 0, 0, 0);

        if (entryDate.getTime() === currentDate.getTime()) {
          streak++;
          entryIndex++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (entryDate.getTime() < currentDate.getTime()) {
          break;
        } else {
          entryIndex++;
        }
      }
    }
  }

  // Get unique skills
  const allSkills = entries.flatMap(e => e.skills);
  const uniqueSkills = new Set(allSkills).size;

  // Get recent entries (last 5)
  const recentEntries = entries.slice(0, 5);

  return {
    totalEntries,
    totalHours,
    streak,
    uniqueSkills,
    recentEntries
  };
};

export const getDomainDistribution = async (userId: string) => {
  const groups = await prisma.learningEntry.groupBy({
    by: ['domain'],
    where: { userId },
    _count: { id: true }
  });

  const distribution: Record<string, number> = {};
  groups.forEach(group => {
    distribution[group.domain] = group._count.id;
  });

  return distribution;
};

type YearRow = { year: string; count: number };

export const getYearlyTrend = async (userId: string) => {
  const results = await prisma.$queryRaw<YearRow[]>`
    SELECT EXTRACT(YEAR FROM completion_date)::text AS year, COUNT(*)::int AS count
    FROM learning_entries
    WHERE user_id = ${userId}
    GROUP BY year
    ORDER BY year ASC
  `;

  const trend: Record<string, number> = {};
  results.forEach(row => {
    trend[row.year] = row.count;
  });

  return trend;
};

export const getPlatformUsage = async (userId: string) => {
  const groups = await prisma.learningEntry.groupBy({
    by: ['platform'],
    where: { userId },
    _count: { id: true }
  });

  const usage: Record<string, number> = {};
  groups.forEach(group => {
    usage[group.platform] = group._count.id;
  });

  return usage;
};

export const getSkillsFrequency = async (userId: string) => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId },
    select: { skills: true }
  });

  const frequency: Record<string, number> = {};
  entries.forEach(entry => {
    entry.skills.forEach(skill => {
      frequency[skill] = (frequency[skill] || 0) + 1;
    });
  });

  return frequency;
};

export const getHeatmapData = async (userId: string) => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId },
    select: { completionDate: true, hoursSpent: true }
  });

  const heatmap: Record<string, { count: number; hours: number }> = {};
  
  entries.forEach(entry => {
    const dateStr = entry.completionDate.toISOString().split('T')[0];
    if (!heatmap[dateStr]) {
      heatmap[dateStr] = { count: 0, hours: 0 };
    }
    heatmap[dateStr].count += 1;
    heatmap[dateStr].hours += (entry.hoursSpent ?? 0);
  });

  return heatmap;
};
