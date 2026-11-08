import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import meritRoutes from './routes/meritRoutes.js';
import diagnosticsRoutes from './routes/diagnosticsRoutes.js';
import { analyzeAndLocateIssue } from './controllers/diagnosticsController.js';
import { store } from './data/initialStore.js';
import { isMock as isFirebaseMock } from './config/firebaseAdmin.js';
import { isMock as isRazorpayMock } from './config/razorpayConfig.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: true, // Allow all localhost origins in development
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan('dev'));

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'IEM Admission System API (DevForge)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      firebaseAuth: isFirebaseMock ? 'Mock Provider (Ready for keys)' : 'Live Firebase Admin SDK',
      razorpay: isRazorpayMock ? 'Mock Provider (Ready for keys)' : 'Live Razorpay Gateway'
    }
  });
});

// Reset demo store endpoint
app.post('/api/reset-demo-data', (req, res) => {
  store.reset();
  res.json({
    success: true,
    message: 'Demo store reset to initial state with 5 seed candidates'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/merit', meritRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    diagnostics: {
      origin: 'SERVER_ROUTE_MISSING',
      category: 'API_ENDPOINT_NOT_FOUND',
      suggestion: 'Check if this route is defined in server/src/routes or check for typos in client/src/services/api.js'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const diagnosis = analyzeAndLocateIssue({
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    statusCode: err.status || 500,
    source: 'server'
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    diagnostics: {
      origin: diagnosis.origin,
      category: diagnosis.category,
      location: diagnosis.detectedLocation,
      suggestedFixes: diagnosis.suggestedFixes
    },
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎓 IEM Admission System Backend Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔥 Firebase Auth Mode: ${isFirebaseMock ? 'MOCK' : 'LIVE'}`);
  console.log(`💳 Razorpay PG Mode:   ${isRazorpayMock ? 'MOCK' : 'LIVE'}`);
  console.log(`====================================================`);
});
