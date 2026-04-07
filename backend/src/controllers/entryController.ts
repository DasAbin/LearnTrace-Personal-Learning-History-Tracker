import { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { AuthRequest } from '../types';
import * as entryService from '../services/entryService';
import { asyncHandler } from '../middleware/asyncHandler';
import logger from '../lib/logger';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import { uploadToCloudinary } from '../utils/upload';

export const createEntry = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('platform').trim().notEmpty().withMessage('Platform is required'),
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('completionDate').isISO8601().withMessage('Valid completion date is required'),
  body('hoursSpent').optional().isInt({ min: 0, max: 10000 }).withMessage('Hours spent must be a positive number'),
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
          skills = [];
        }
      }
      skills = skills.map(s => s.trim().toLowerCase()).filter(Boolean);

      const hoursSpent = req.body.hoursSpent ? parseInt(req.body.hoursSpent, 10) : undefined;
      
      // Handle certificate upload
      let certificatePath: string | undefined;
      if (req.file) {
        logger.info({ filename: req.file.filename, path: req.file.path, mimetype: req.file.mimetype }, '📎 Certificate file received');
        // Try Cloudinary first, fall back to local path
        const cloudUrl = await uploadToCloudinary(req.file.path, userId);
        certificatePath = cloudUrl || `/uploads/certificates/${path.basename(req.file.path)}`;
      }

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
        status: req.body.status || 'COMPLETED',
        difficulty: req.body.difficulty || undefined,
        rating: req.body.rating ? parseInt(req.body.rating, 10) : undefined,
        resourceUrl: req.body.resourceUrl || undefined,
        certificatePath,
      };

      const idempotencyKey = req.headers['idempotency-key'] as string;
      if (idempotencyKey) {
        const existingKey = await prisma.idempotencyKey.findUnique({
          where: { key: idempotencyKey }
        });

        if (existingKey) {
          const entry = await entryService.getEntryById(userId, existingKey.entryId);
          return res.status(409).json(entry);
        }
      }

      const entry = await entryService.createEntry(userId, data);

      if (idempotencyKey) {
        await prisma.idempotencyKey.create({
          data: { key: idempotencyKey, entryId: entry.id }
        });
      }

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
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const filters: any = {};
      
      if (req.query.domain) filters.domain = req.query.domain;
      if (req.query.platform) filters.platform = req.query.platform;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.search) filters.search = req.query.search;
      
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const page = req.query.page && !cursor ? parseInt(req.query.page as string, 10) : undefined;

      const entries = await entryService.getEntries(userId, filters, cursor, limit, page);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
];

export const getEntryById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const entry = await entryService.getEntryById(userId, id);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  res.json(entry);
});

export const getMetadata = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const metadata = await entryService.getMetadata(userId);
  res.json(metadata);
});


export const updateEntry = [
  body('title').optional().trim().notEmpty(),
  body('platform').optional().trim().notEmpty(),
  body('domain').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('completionDate').optional().isISO8601(),
  body('hoursSpent').optional().isInt({ min: 0, max: 10000 }).withMessage('Hours spent must be a positive number'),
  body('skills').optional().isArray(),
  
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const { id } = req.params;
      
      // Before calling entryService.updateEntry, fetch the existing entry
      const existingEntry = await entryService.getEntryById(userId, id);
      
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
        data.skills = data.skills.map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      }
      if (req.body.description !== undefined) data.description = req.body.description || undefined;
      if (req.body.reflection !== undefined) data.reflection = req.body.reflection || undefined;
      if (req.body.status !== undefined) data.status = req.body.status;
      if (req.body.difficulty !== undefined) data.difficulty = req.body.difficulty || undefined;
      if (req.body.rating !== undefined) data.rating = req.body.rating ? parseInt(req.body.rating, 10) : undefined;
      if (req.body.resourceUrl !== undefined) data.resourceUrl = req.body.resourceUrl || undefined;
      
      if (req.file) {
        logger.info({ filename: req.file.filename, path: req.file.path, mimetype: req.file.mimetype }, '📎 Certificate file received (update)');
        const cloudUrl = await uploadToCloudinary(req.file.path, userId);
        data.certificatePath = cloudUrl || `/uploads/certificates/${path.basename(req.file.path)}`;
        
        // If req.file exists AND existing entry has a certificatePath, delete the old file
        if (existingEntry?.certificatePath) {
          try {
            if (existingEntry.certificatePath.startsWith('http')) {
              // Extract public_id from Cloudinary URL:
              // e.g. https://res.cloudinary.com/.../upload/v1234/learntrace/certificates/abc.png
              // public_id is 'learntrace/certificates/abc'
              const urlParts = existingEntry.certificatePath.split('/');
              const fileWithExt = urlParts[urlParts.length - 1];
              const folder = urlParts[urlParts.length - 2];
              const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
              
              await cloudinary.uploader.destroy(publicId);
            } else {
              const absolutePath = path.join(__dirname, '../../', existingEntry.certificatePath.replace(/^\//, ''));
              await fs.promises.unlink(absolutePath);
            }
          } catch (error) {
            logger.error({ entryId: id, error }, 'Failed to delete old certificate file');
          }
        }
      }

      const hoursSpent = req.body.hoursSpent ? parseInt(req.body.hoursSpent, 10) : undefined;
      if (hoursSpent !== undefined) data.hoursSpent = hoursSpent;

      const entry = await entryService.updateEntry(userId, id, data);
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
];

export const deleteEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  await entryService.deleteEntry(userId, id);
  res.status(204).send();
});

