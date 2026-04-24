import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from '../lib/logger';

// ── Cloudinary detection ──────────────────────────────────────────────
const CLOUDINARY_OK = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage: multer.StorageEngine;

if (CLOUDINARY_OK) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info({ cloud: process.env.CLOUDINARY_CLOUD_NAME }, '☁️ Cloudinary configured for certificate uploads');

  // Use disk storage as temp, then upload to Cloudinary in the controller.
  // multer-storage-cloudinary has typing/compatibility issues — doing it manually
  // is more reliable and gives better error reporting.
  const tmpDir = path.join(__dirname, '../../uploads/tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  });
} else {
  logger.warn('⚠️ Cloudinary not configured — certificates will be stored on local disk (ephemeral on Railway!)');

  const uploadDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const userId = (_req as any).userId || 'anonymous';
      const ext = path.extname(file.originalname);
      cb(null, `${userId}-${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  });
}

// ── File filter ───────────────────────────────────────────────────────
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not allowed. Accepted: JPEG, PNG, WebP, PDF`) as any);
  }
};

// ── Multer instance ───────────────────────────────────────────────────
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Cloudinary uploader ───────────────────────────────────────────────
/**
 * Upload a local temp file to Cloudinary and return the secure URL.
 * Deletes the temp file afterwards.
 * Returns null if Cloudinary is not configured (caller should fall back).
 */
export async function uploadToCloudinary(
  filePath: string,
  userId: string,
  folder: string = 'learntrace/certificates',
): Promise<string | null> {
  if (!CLOUDINARY_OK) return null;

  try {
    const publicId = `${userId}-${Date.now()}-${crypto.randomUUID()}`;

    // Determine resource_type: PDFs must use 'raw' to preserve binary integrity
    const ext = path.extname(filePath).toLowerCase();
    const isPdf = ext === '.pdf';
    const resourceType: 'raw' | 'image' | 'auto' = isPdf ? 'raw' : 'image';

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: publicId,
      resource_type: resourceType,
    });

    logger.info({ publicId, url: result.secure_url }, '☁️ Certificate uploaded to Cloudinary');

    // Clean up temp file
    fs.unlink(filePath, (err) => {
      if (err) logger.error({ err, filePath }, 'Failed to delete temp file');
    });

    return result.secure_url;
  } catch (error) {
    logger.error({ error, filePath }, '❌ Cloudinary upload failed');

    // Clean up temp file even on error
    fs.unlink(filePath, () => {});

    throw error; // Re-throw so the controller can respond with 500
  }
}

// ── Error handler middleware ──────────────────────────────────────────
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    logger.error({ code: err.code, field: err.field }, '❌ Multer upload error');
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File must be 5MB or smaller' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    logger.error({ error: err.message }, '❌ File upload error');
    return res.status(400).json({ error: err.message });
  }
  next();
};

export { CLOUDINARY_OK };
