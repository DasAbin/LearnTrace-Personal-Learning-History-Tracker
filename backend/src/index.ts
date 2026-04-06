import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import * as authController from './controllers/authController';
import * as entryController from './controllers/entryController';
import * as analyticsController from './controllers/analyticsController';
import * as userController from './controllers/userController';
import * as aiController from './controllers/aiController';
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

// General API limiter: 100 requests per 15 minutes (much higher in dev)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 5000,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login limiter: 5 requests per 15 minutes per IP+email combo (much higher in dev)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 500,
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}_${req.body.email || ''}`,
  validate: false,
});

// Signup limiter: 3 requests per hour per IP (much higher in dev)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 3 : 500,
  message: { error: 'Too many signup attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint (Public, no rate limiting)
app.get('/health', async (req, res) => {
  try {
    // Lightweight DB check
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


// Normalise FRONTEND_URL — strip trailing slash so CORS origin comparisons
// never silently fail (e.g. "https://x.vercel.app/" vs "https://x.vercel.app")
const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "res.cloudinary.com"],
      connectSrc: ["'self'", FRONTEND_ORIGIN],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

app.use(pinoHttp({ 
  logger, 
  customProps: (req) => ({ 
    userId: (req as any).userId 
  }),
  // Clean up logs by filtering out simple health checks if needed, 
  // but for now, we keep everything.
}));

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general limiter AFTER cors and body parser!
app.use(apiLimiter);

// Serve uploaded certificates (Static - not prefixed)
app.use('/uploads/certificates', express.static(path.join(__dirname, '../uploads/certificates')));

// --- API Routes (v1 Prefix) ---
const apiRouter = express.Router();

apiRouter.post('/auth/signup', signupLimiter, authController.signup);
apiRouter.post('/auth/login', loginLimiter, authController.login);
apiRouter.post('/auth/forgot-password', authController.forgotPassword);
apiRouter.post('/auth/reset-password', authController.resetPassword);
apiRouter.post('/auth/verify-email', authController.verifyEmail);
apiRouter.post('/auth/resend-verification', authenticate, authController.resendVerification);
apiRouter.post('/auth/refresh', authController.refresh);
apiRouter.get('/auth/me', authenticate, authController.getMe);

apiRouter.post('/entries', authenticate, upload.single('certificate'), handleMulterError, entryController.createEntry);
apiRouter.get('/entries', authenticate, entryController.getEntries);
apiRouter.get('/entries/metadata', authenticate, entryController.getMetadata);
apiRouter.get('/entries/:id', authenticate, entryController.getEntryById);
apiRouter.put('/entries/:id', authenticate, upload.single('certificate'), handleMulterError, entryController.updateEntry);
apiRouter.delete('/entries/:id', authenticate, entryController.deleteEntry);


apiRouter.get('/analytics/summary', authenticate, analyticsController.getSummary);
apiRouter.get('/analytics/domain-distribution', authenticate, analyticsController.getDomainDistribution);
apiRouter.get('/analytics/yearly-trend', authenticate, analyticsController.getYearlyTrend);
apiRouter.get('/analytics/platform-usage', authenticate, analyticsController.getPlatformUsage);
apiRouter.get('/analytics/skills-frequency', authenticate, analyticsController.getSkillsFrequency);
apiRouter.get('/analytics/heatmap', authenticate, analyticsController.getHeatmapData);

apiRouter.get('/users/export', authenticate, userController.exportData);

apiRouter.post('/entries/:id/generate-bullets', authenticate, aiController.generateBullets);
apiRouter.post('/entries/extract-url', authenticate, aiController.extractUrl);
apiRouter.post('/analytics/skill-gap', authenticate, aiController.analyzeSkillGap);

apiRouter.get('/portfolio/:publicId', userController.getPortfolio);
apiRouter.put('/users/public-profile', authenticate, userController.updatePublicProfileId);

app.use('/api/v1', apiRouter);


// Error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    // Check database connection before starting the server
    await prisma.$connect();
    logger.info('📦 Connected to database successfully.');

    // Start 24h idempotency key cleanup job
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
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to the database. Please check your DATABASE_URL configuration.');
    process.exit(1);
  }
};

startServer();
