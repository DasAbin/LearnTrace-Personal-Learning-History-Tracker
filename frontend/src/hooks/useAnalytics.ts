import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../utils/api';

export const useSummary = () => {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsAPI.getSummary(),
    staleTime: 5 * 60_000,
  });
};

export const useDomainDistribution = () => {
  return useQuery({
    queryKey: ['analytics', 'domain-distribution'],
    queryFn: () => analyticsAPI.getDomainDistribution(),
    staleTime: 5 * 60_000,
  });
};

export const useYearlyTrend = () => {
  return useQuery({
    queryKey: ['analytics', 'yearly-trend'],
    queryFn: () => analyticsAPI.getYearlyTrend(),
    staleTime: 5 * 60_000,
  });
};

export const usePlatformUsage = () => {
  return useQuery({
    queryKey: ['analytics', 'platform-usage'],
    queryFn: () => analyticsAPI.getPlatformUsage(),
    staleTime: 5 * 60_000,
  });
};

export const useSkillsFrequency = () => {
  return useQuery({
    queryKey: ['analytics', 'skills-frequency'],
    queryFn: () => analyticsAPI.getSkillsFrequency(),
    staleTime: 5 * 60_000,
  });
};

export const useHeatmap = () => {
  return useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: () => analyticsAPI.getHeatmap(),
    staleTime: 5 * 60_000,
  });
};
