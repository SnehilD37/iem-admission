import express from 'express';
import { getDemoUsers, verifyCurrentSession, loginWithDemo, registerApplicant } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/demo-users', getDemoUsers);
router.post('/demo-login', loginWithDemo);
router.post('/register', registerApplicant);
router.get('/session', verifyToken, verifyCurrentSession);

export default router;
