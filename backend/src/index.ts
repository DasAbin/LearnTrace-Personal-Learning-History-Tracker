import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import * as authController from './controllers/authController';
import * as entryController from './controllers/entryController';
import * as analyticsController from './controllers/analyticsController';
import { upload } from './utils/upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded certificates
app.use('/uploads/certificates', express.static(path.join(__dirname, '../uploads/certificates')));

// Routes
app.post('/auth/signup', authController.signup);
app.post('/auth/login', authController.login);
app.get('/auth/me', authenticate, authController.getMe);

app.post('/entries', authenticate, upload.single('certificate'), entryController.createEntry);
app.get('/entries', authenticate, entryController.getEntries);
app.get('/entries/:id', authenticate, entryController.getEntryById);
app.put('/entries/:id', authenticate, upload.single('certificate'), entryController.updateEntry);
app.delete('/entries/:id', authenticate, entryController.deleteEntry);

app.get('/analytics/summary', authenticate, analyticsController.getSummary);
app.get('/analytics/domain-distribution', authenticate, analyticsController.getDomainDistribution);
app.get('/analytics/yearly-trend', authenticate, analyticsController.getYearlyTrend);
app.get('/analytics/platform-usage', authenticate, analyticsController.getPlatformUsage);
app.get('/analytics/skills-frequency', authenticate, analyticsController.getSkillsFrequency);
app.get('/analytics/heatmap', authenticate, analyticsController.getHeatmapData);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
