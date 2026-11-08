import express from 'express';
import { checkApplicantEligibility, getMeritRanking, batchAllotSeats } from '../controllers/meritController.js';

const router = express.Router();

router.post('/check-eligibility', checkApplicantEligibility);
router.get('/ranking', getMeritRanking);
router.post('/batch-allot', batchAllotSeats);

export default router;
