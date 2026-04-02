import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let storage: multer.StorageEngine;

const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder';

if (useCloudinary) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: Request, file: Express.Multer.File) => {
      const userId = (req as any).userId || 'anonymous';
      const timestamp = Date.now();
      const randomUUID = crypto.randomUUID();
      
      return {
        folder: 'learntrace/certificates',
        public_id: `${userId}-${timestamp}-${randomUUID}`,
        format: file.mimetype.split('/')[1] === 'pdf' ? 'pdf' : undefined 
      };
    }
  }) as unknown as multer.StorageEngine;
} else {
  // Use local disk storage
  const uploadDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const userId = (req as any).userId || 'anonymous';
      const timestamp = Date.now();
      const randomUUID = crypto.randomUUID();
      const ext = path.extname(file.originalname);
      cb(null, `${userId}-${timestamp}-${randomUUID}${ext}`);
    }
  });
}

/**
 * File Filter
 * 
 * Strictly validates MIME types: JPEG, PNG, or PDF only.
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed') as any);
  }
};

/**
 * Multer Upload Instance
 * 
 * Enforces 5MB limit and MIME validation.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * handleMulterError Middleware
 * 
 * Catches Multer-specific errors (file size, etc.) and custom validation errors.
 */
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File must be 5MB or smaller' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err && err.message === 'Only JPEG, PNG, and PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};
