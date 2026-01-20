import { Response } from 'express';
import { AuthRequest } from '../types';
import * as analyticsService from '../services/analyticsService';

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const summary = await analyticsService.getSummary(userId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDomainDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const distribution = await analyticsService.getDomainDistribution(userId);
    res.json(distribution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getYearlyTrend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const trend = await analyticsService.getYearlyTrend(userId);
    res.json(trend);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlatformUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const usage = await analyticsService.getPlatformUsage(userId);
    res.json(usage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSkillsFrequency = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const frequency = await analyticsService.getSkillsFrequency(userId);
    res.json(frequency);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHeatmapData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const heatmap = await analyticsService.getHeatmapData(userId);
    res.json(heatmap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
