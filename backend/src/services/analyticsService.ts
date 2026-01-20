import prisma from '../lib/prisma';

export const getSummary = async (userId: string) => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId },
    orderBy: { completionDate: 'desc' }
  });

  const totalEntries = entries.length;
  
  // Calculate total hours (rough estimate: 1 entry = 8 hours average)
  // In a real app, you'd track hours per entry
  const totalHours = entries.length * 8;

  // Calculate streak (consecutive days with entries)
  let streak = 0;
  if (entries.length > 0) {
    const sortedEntries = [...entries].sort((a, b) => 
      b.completionDate.getTime() - a.completionDate.getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
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
  const entries = await prisma.learningEntry.findMany({
    where: { userId }
  });

  const distribution: Record<string, number> = {};
  entries.forEach(entry => {
    distribution[entry.domain] = (distribution[entry.domain] || 0) + 1;
  });

  return distribution;
};

export const getYearlyTrend = async (userId: string) => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId },
    orderBy: { completionDate: 'asc' }
  });

  const trend: Record<string, number> = {};
  entries.forEach(entry => {
    const year = entry.completionDate.getFullYear().toString();
    trend[year] = (trend[year] || 0) + 1;
  });

  return trend;
};

export const getPlatformUsage = async (userId: string) => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId }
  });

  const usage: Record<string, number> = {};
  entries.forEach(entry => {
    usage[entry.platform] = (usage[entry.platform] || 0) + 1;
  });

  return usage;
};

export const getSkillsFrequency = async (userId: string) => {
  const entries = await prisma.learningEntry.findMany({
    where: { userId }
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
    where: { userId }
  });

  const heatmap: Record<string, { count: number; hours: number }> = {};
  
  entries.forEach(entry => {
    const dateStr = entry.completionDate.toISOString().split('T')[0];
    if (!heatmap[dateStr]) {
      heatmap[dateStr] = { count: 0, hours: 0 };
    }
    heatmap[dateStr].count += 1;
    heatmap[dateStr].hours += 8; // Rough estimate
  });

  return heatmap;
};
