import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { AuthRequest } from '../types';
import * as entryService from '../services/entryService';
import fs from 'fs';
import path from 'path';

// Ensure the uploads directory exists before processing any file upload
const certDir = path.join(__dirname, '../../uploads/certificates');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

export const createEntry = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('platform').trim().notEmpty().withMessage('Platform is required'),
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('completionDate').isISO8601().withMessage('Valid completion date is required'),
  // Skills validation handled in controller (comes as JSON string from FormData)
  
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      
      // Parse skills from FormData (comes as JSON string)
      let skills: string[] = [];
      if (req.body.skills) {
        try {
          const parsed = typeof req.body.skills === 'string' 
            ? JSON.parse(req.body.skills) 
            : req.body.skills;
          skills = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // If parsing fails, treat as empty array
          skills = [];
        }
      }

      const hoursSpent = req.body.hoursSpent ? parseInt(req.body.hoursSpent, 10) : undefined;
      
      const data = {
        title: req.body.title,
        platform: req.body.platform,
        domain: req.body.domain,
        subDomain: req.body.subDomain || undefined,
        hoursSpent,
        startDate: new Date(req.body.startDate),
        completionDate: new Date(req.body.completionDate),
        skills,
        description: req.body.description || undefined,
        reflection: req.body.reflection || undefined,
        certificatePath: req.file ? `/uploads/certificates/${req.file.filename}` : undefined
      };

      const entry = await entryService.createEntry(userId, data);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
];

export const getEntries = [
  query('domain').optional().isString(),
  query('platform').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('search').optional().isString(),
  
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const filters: any = {};
      
      if (req.query.domain) filters.domain = req.query.domain;
      if (req.query.platform) filters.platform = req.query.platform;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.search) filters.search = req.query.search;

      const entries = await entryService.getEntries(userId, filters);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
];

export const getEntryById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const entry = await entryService.getEntryById(userId, id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEntry = [
  body('title').optional().trim().notEmpty(),
  body('platform').optional().trim().notEmpty(),
  body('domain').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('completionDate').optional().isISO8601(),
  body('skills').optional().isArray(),
  
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { id } = req.params;
      const data: any = {};
      
      if (req.body.title !== undefined) data.title = req.body.title;
      if (req.body.platform !== undefined) data.platform = req.body.platform;
      if (req.body.domain !== undefined) data.domain = req.body.domain;
      if (req.body.subDomain !== undefined) data.subDomain = req.body.subDomain || undefined;
      if (req.body.startDate) data.startDate = new Date(req.body.startDate);
      if (req.body.completionDate) data.completionDate = new Date(req.body.completionDate);
      if (req.body.skills !== undefined) {
        try {
          const parsed = typeof req.body.skills === 'string' 
            ? JSON.parse(req.body.skills) 
            : req.body.skills;
          data.skills = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          data.skills = [];
        }
      }
      if (req.body.description !== undefined) data.description = req.body.description || undefined;
      if (req.body.reflection !== undefined) data.reflection = req.body.reflection || undefined;
      if (req.file) data.certificatePath = `/uploads/certificates/${req.file.filename}`;

      const hoursSpent = req.body.hoursSpent ? parseInt(req.body.hoursSpent, 10) : undefined;
      if (hoursSpent !== undefined) data.hoursSpent = hoursSpent;

      const entry = await entryService.updateEntry(userId, id, data);
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
];

export const deleteEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await entryService.deleteEntry(userId, id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
