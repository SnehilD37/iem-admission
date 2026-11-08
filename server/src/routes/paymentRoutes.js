import express from 'express';
import { getFeeSchedule, createRazorpayOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/fee-schedule', getFeeSchedule);
router.post('/create-order', createRazorpayOrder);
router.post('/verify-signature', verifyPayment);

export default router;
