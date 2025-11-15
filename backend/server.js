const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const queueRoutes = require('./routes/queue');
const examRoutes = require('./routes/exams');
const certificateRoutes = require('./routes/certificates');
const reportRoutes = require('./routes/reports');
const pdfRoutes = require('./routes/pdf');
const twoFactorRoutes = require('./routes/twoFactor');
const passwordResetRoutes = require('./routes/passwordReset');
const rankingRoutes = require('./routes/rankings');
const questionBankRoutes = require('./routes/questionBank');
const certificateCollectionRoutes = require('./routes/certificateCollection');
const publicVerifyRoutes = require('./routes/publicVerify');
const communicationRoutes = require('./routes/communication');
const userRoutes = require('./routes/users');
const programRoutes = require('./routes/programs');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    message: 'Coffee Training Center Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      sessions: '/api/sessions',
      exams: '/api/exams',
      certificates: '/api/certificates',
      reports: '/api/reports',
      twoFactor: '/api/two-factor',
      rankings: '/api/rankings',
      questionBank: '/api/question-bank',
      publicVerify: '/api/public-verify',
      communication: '/api/communication',
      programs: '/api/programs'
    },
    documentation: '/docs'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/two-factor', twoFactorRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/certificate-collection', certificateCollectionRoutes);
app.use('/api/public-verify', publicVerifyRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/programs', programRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

