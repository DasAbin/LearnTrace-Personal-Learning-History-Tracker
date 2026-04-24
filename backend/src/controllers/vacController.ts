import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import * as vacService from '../services/vacService';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadToCloudinary } from '../utils/upload';
import logger from '../lib/logger';
import path from 'path';

// ─── Helper: upload a VAC document to Cloudinary's vac-documents folder ──────
async function uploadVacFile(
  files: { [fieldname: string]: Express.Multer.File[] } | undefined,
  fieldName: string,
  userId: string
): Promise<string | undefined> {
  const fileArr = files?.[fieldName];
  if (!fileArr || fileArr.length === 0) return undefined;
  const file = fileArr[0];
  logger.info({ fieldName, filename: file.originalname }, '📎 VAC document received');

  // uploadToCloudinary goes to learntrace/certificates by default.
  // We override by calling cloudinary directly for a different folder.
  try {
    const { v2: cloudinary } = await import('cloudinary');
    const crypto = await import('crypto');
    const fs = await import('fs');

    const publicId = `${userId}-${Date.now()}-${crypto.randomUUID()}`;

    // Determine correct resource_type for Cloudinary
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isPdf = fileExt === '.pdf' || file.mimetype === 'application/pdf';
    const resourceType: 'raw' | 'image' = isPdf ? 'raw' : 'image';

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'learntrace/vac-documents',
      public_id: publicId,
      resource_type: resourceType,
    });

    // Clean up temp file
    fs.unlink(file.path, (err) => {
      if (err) logger.error({ err, filePath: file.path }, 'Failed to delete temp file');
    });

    return result.secure_url;
  } catch (error) {
    logger.warn({ fieldName, error }, '⚠️ Cloudinary upload failed for VAC doc, using local fallback');
    return `/uploads/certificates/${path.basename(file.path)}`;
  }
}

// ─── Student: Submit a VAC Refund Request ────────────────────────────────────
export const createVacRequest = [
  body('courseName').trim().notEmpty().withMessage('Course name is required'),
  body('platform').trim().notEmpty().withMessage('Platform is required'),
  body('courseAmount')
    .isFloat({ min: 0 })
    .withMessage('Course amount must be a positive number'),

  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const studentId = req.userId!;
    const courseName = req.body.courseName.trim();

    // ── Duplicate per-course guard ──
    const hasPending = await vacService.hasPendingRequestForCourse(studentId, courseName);
    if (hasPending) {
      return res.status(409).json({
        error: `You already have a pending refund request for "${courseName}". Please wait for it to be reviewed.`,
      });
    }

    // ── Handle multiple uploaded files ──
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const [preApprovalPath, certificatePath, paymentReceiptPath, additionalDocPath] =
      await Promise.all([
        uploadVacFile(files, 'preApproval', studentId),
        uploadVacFile(files, 'certificate', studentId),
        uploadVacFile(files, 'paymentReceipt', studentId),
        uploadVacFile(files, 'additionalDoc', studentId),
      ]);

    // Require at least preApproval OR certificate
    if (!preApprovalPath && !certificatePath) {
      return res.status(400).json({
        error: 'Please upload at least a pre-approval document or certificate proof.',
      });
    }

    const request = await vacService.createRequest(studentId, {
      courseName,
      platform: req.body.platform,
      courseAmount: parseFloat(req.body.courseAmount),
      notes: req.body.notes || undefined,
      preApprovalPath,
      certificatePath,
      paymentReceiptPath,
      additionalDocPath,
    });

    res.status(201).json(request);
  }),
];

// ─── Student: Get my VAC requests ────────────────────────────────────────────
export const getMyVacRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const requests = await vacService.getRequestsByStudent(req.userId!);
  res.json(requests);
});

// ─── VAC Incharge: Get all PENDING requests ───────────────────────────────────
export const getPendingVacRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeName = (req as any).vacCollegeName ?? null;
  const requests = await vacService.getPendingRequests(collegeName);
  res.json(requests);
});

// ─── VAC Incharge: Get all COMPLETED requests ─────────────────────────────────
export const getCompletedVacRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeName = (req as any).vacCollegeName ?? null;
  const requests = await vacService.getCompletedRequests(collegeName);
  res.json(requests);
});

// ─── VAC Incharge: Approve a request ─────────────────────────────────────────
export const approveVacRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const reviewerId = req.userId!;
  const updated = await vacService.approveRequest(id, reviewerId);
  res.json(updated);
});

// ─── VAC Incharge: Reject a request ──────────────────────────────────────────
export const rejectVacRequest = [
  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required — please explain why this request was rejected.'),

  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const reviewerId = req.userId!;
    const { rejectionReason } = req.body;
    const updated = await vacService.rejectRequest(id, reviewerId, rejectionReason);
    res.json(updated);
  }),
];
