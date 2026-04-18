import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as userService from '../services/userService';

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
    
    const { contentType, filename, content } = await userService.exportUserData(userId, format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const portfolio = await userService.getPortfolio(publicId);
    res.json(portfolio);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const updatePublicProfileId = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { publicProfileId } = req.body;
    const user = await userService.updatePublicProfileId(userId, publicProfileId);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    await userService.deleteUser(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
