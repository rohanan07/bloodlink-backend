import express from 'express';
import { createCamp, getAllCamps } from '../controller/campController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';

const router = express.Router();

// @route   POST /api/v1/camps
// @desc    Create a new donation camp announcement
// @access  Private (Hospital Only)
router.post('/', authMiddleware, checkRole('hospital'), createCamp);

// @route   GET /api/v1/camps
// @desc    Get a list of all upcoming donation camps
// @access  Public
router.get('/', getAllCamps);

export default router;