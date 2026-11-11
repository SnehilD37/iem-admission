import express from 'express';
import {
  getDashboardStats,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  updateApplicationData,
  raiseDiscrepancyQuery,
  offerSeat,
  exportRoster
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard-stats', getDashboardStats);
router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id', updateApplicationData);
router.patch('/applications/:id', updateApplicationData);
router.patch('/applications/:id/status', updateApplicationStatus);
router.post('/applications/:id/raise-query', raiseDiscrepancyQuery);
router.post('/applications/:id/offer-seat', offerSeat);
router.get('/export-roster', exportRoster);

export default router;
