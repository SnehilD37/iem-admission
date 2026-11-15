import express from 'express';
import { getMyApplication, saveDraft, submitApplication, resolveQuery, deleteApplication } from '../controllers/applicationController.js';

const router = express.Router();

router.get('/my-application', getMyApplication);
router.post('/save-draft', saveDraft);
router.post('/submit', submitApplication);
router.post('/resolve-query', resolveQuery);
router.delete('/:id', deleteApplication);

export default router;
