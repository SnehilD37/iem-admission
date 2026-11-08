import express from 'express';
import { getMyApplication, saveDraft, submitApplication, resolveQuery } from '../controllers/applicationController.js';

const router = express.Router();

router.get('/my-application', getMyApplication);
router.post('/save-draft', saveDraft);
router.post('/submit', submitApplication);
router.post('/resolve-query', resolveQuery);

export default router;
