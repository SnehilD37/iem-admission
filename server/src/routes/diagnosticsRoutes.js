import express from 'express';
import {
  locateError,
  checkCodebaseHealth,
  scanCodebaseIssues,
  testEndpoint
} from '../controllers/diagnosticsController.js';

const router = express.Router();

// Analyze an error stack trace or message and pinpoint client vs server origin
router.post('/locate-error', locateError);
router.post('/analyze', locateError);

// Automated codebase health check (server + client + route contract alignment)
router.get('/health', checkCodebaseHealth);

// Static scan of client and server code for common anti-patterns
router.get('/scan', scanCodebaseIssues);

// Test/verify a specific server endpoint exists and is mounted
router.post('/test-endpoint', testEndpoint);

export default router;

