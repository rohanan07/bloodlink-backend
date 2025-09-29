// Routes for managing blood bank inventory.

import express from 'express';
import { getMyStock, updateMyStock } from '../controller/bloodBankController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';
import { getAllStock } from '../controller/bloodBankController.js';

const router = express.Router();

// Middleware chain: First check for valid token, then check if user role is 'hospital'.

// @route   GET /api/v1/blood-bank/stock/me
// @desc    Get the blood stock for the logged-in hospital
// @access  Private (Hospital Only)
router.get('/stock/me', authMiddleware, checkRole('hospital'), getMyStock);

// @route   PUT /api/v1/blood-bank/stock
// @desc    Create or update the blood stock for the logged-in hospital
// @access  Private (Hospital Only)
router.put('/stock', authMiddleware, checkRole('hospital'), updateMyStock);

// @route GET /api/v1/blood-bank/stock/all
router.get('/stock/all' , getAllStock);

export default router;