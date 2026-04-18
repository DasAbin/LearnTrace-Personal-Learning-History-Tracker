import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { requireAdmin } from './middleware/adminMiddleware';
import * as authController from './controllers/authController';
import * as entryController from './controllers/entryController';
import * as analyticsController from './controllers/analyticsController';
import * as userController from './controllers/userController';
import * as aiController from './controllers/aiController';
import * as adminController from './controllers/adminController';
import { upload, handleMulterError } from './utils/upload';
import { asyncHandler } from './middleware/asyncHandler';
import logger from './lib/logger';
import pinoHttp from 'pino-http';
import prisma from './lib/prisma';

dotenv.config();

const validateEnv = () => {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error({ missing }, 'Missing required environment variables. Server cannot start.');
    process.exit(1);
  }
};

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 5000,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 500,
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}_${req.body.email || ''}`,
  validate: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 3 : 500,
  message: { error: 'Too many signup attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      db: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      db: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
});

const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
logger.info({ FRONTEND_ORIGIN, raw: process.env.FRONTEND_URL }, '🌐 CORS origin configured');

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, Railway health checks)
    if (!origin) return callback(null, true);
    
    const allowed = [
      FRONTEND_ORIGIN,
      'http://localhost:5173',
      'http://localhost:3000',
      // Add your actual Vercel deployment URL here:
      'https://learn-trace-personal-learning-histo.vercel.app',
      'https://learn-trace-personal-learning-history-tracker.vercel.app',
    ].filter(Boolean);

    // Also allow any *.vercel.app preview deployment
    const isAllowed = allowed.includes(origin) || origin.endsWith('.vercel.app');
    callback(null, isAllowed);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      workerSrc:     ["'self'", "blob:"],
      imgSrc:        ["'self'", "data:", "blob:", "res.cloudinary.com", "images.unsplash.com"],
      connectSrc:    ["'self'", FRONTEND_ORIGIN, "blob:"],
      mediaSrc:      ["'self'", "blob:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,   // Required for SharedArrayBuffer (Three.js uses this)
  hsts: { maxAge: 31536000 },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(pinoHttp({ 
  logger, 
  customProps: (req) => ({ 
    userId: (req as any).userId 
  }),
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.use('/uploads/certificates', express.static(path.join(__dirname, '../uploads/certificates')));

// --- API Routes (v1 Prefix) ---
const apiRouter = express.Router();

// Auth routes
apiRouter.post('/auth/signup', signupLimiter, authController.signup);
apiRouter.post('/auth/login', loginLimiter, authController.login);
apiRouter.post('/auth/forgot-password', authController.forgotPassword);
apiRouter.post('/auth/reset-password', authController.resetPassword);
apiRouter.post('/auth/refresh', authController.refresh);
apiRouter.get('/auth/me', authenticate, authController.getMe);

// Entry routes
apiRouter.post('/entries', authenticate, upload.single('certificate'), handleMulterError, entryController.createEntry);
apiRouter.get('/entries', authenticate, entryController.getEntries);
apiRouter.get('/entries/metadata', authenticate, entryController.getMetadata);
apiRouter.get('/entries/:id', authenticate, entryController.getEntryById);
apiRouter.put('/entries/:id', authenticate, upload.single('certificate'), handleMulterError, entryController.updateEntry);
apiRouter.delete('/entries/:id', authenticate, entryController.deleteEntry);

// Analytics routes
apiRouter.get('/analytics/summary', authenticate, analyticsController.getSummary);
apiRouter.get('/analytics/domain-distribution', authenticate, analyticsController.getDomainDistribution);
apiRouter.get('/analytics/yearly-trend', authenticate, analyticsController.getYearlyTrend);
apiRouter.get('/analytics/platform-usage', authenticate, analyticsController.getPlatformUsage);
apiRouter.get('/analytics/skills-frequency', authenticate, analyticsController.getSkillsFrequency);
apiRouter.get('/analytics/heatmap', authenticate, analyticsController.getHeatmapData);

// User routes
apiRouter.get('/users/export', authenticate, userController.exportData);
apiRouter.get('/portfolio/:publicId', userController.getPortfolio);
apiRouter.put('/users/public-profile', authenticate, userController.updatePublicProfileId);

// AI routes
apiRouter.post('/entries/:id/generate-bullets', authenticate, aiController.generateBullets);
apiRouter.post('/entries/extract-url', authenticate, aiController.extractUrl);
apiRouter.post('/analytics/skill-gap', authenticate, aiController.analyzeSkillGap);

// Admin routes
apiRouter.get('/admin/overview', authenticate, requireAdmin, adminController.getCollegeOverview);
apiRouter.get('/admin/classes', authenticate, requireAdmin, adminController.getClasses);
apiRouter.get('/admin/classes/:className/students', authenticate, requireAdmin, adminController.getStudentsByClass);
apiRouter.get('/admin/students/:studentId', authenticate, requireAdmin, adminController.getStudentDetail);
// Temporary secret middleware for browser-based seeding
const seedSecretMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.query.key === 'lt_seed_2026') return next();
  return res.status(401).json({ error: 'Authentication required. Pass ?key=lt_seed_2026' });
};

apiRouter.get('/admin/seed-ait', seedSecretMiddleware, adminController.runAitSeed);
apiRouter.get('/admin/update-config', seedSecretMiddleware, adminController.runUpdateConfig);

app.use('/api/v1', apiRouter);

// Error handler
app.use(errorHandler);

const startServer = () => {
  setInterval(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.idempotencyKey.deleteMany({
        where: { createdAt: { lt: oneDayAgo } }
      });
      logger.info('🧹 Cleaned up old idempotency keys');
    } catch (error) {
      logger.error({ error }, '❌ Failed to clean up idempotency keys');
    }
  }, 24 * 60 * 60 * 1000);

  app.listen(PORT, () => {
    logger.info({ port: PORT, frontendUrl: process.env.FRONTEND_URL }, '🚀 Server started successfully');
  });
};

startServer();
