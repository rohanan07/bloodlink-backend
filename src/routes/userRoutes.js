// Routes for user-specific actions, like fetching a profile.

import express from 'express';
import { getMe , getMyRequests, getMyDonations} from '../controller/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';

const router = express.Router();

// @route   GET /api/v1/users/me
// @desc    Get current logged-in user's profile
// @access  Private (Requires token)
router.get('/me', authMiddleware, getMe);

// @route   GET /api/v1/users/my-requests
// @desc    Get all blood requests created by the logged-in user
// @access  Private
router.get('/my-requests', authMiddleware, getMyRequests);

// @route   GET /api/v1/users/my-donations
// @desc    Get donation history for the logged-in donor
// @access  Private (Donor only)
router.get('/my-donations', authMiddleware, checkRole('donor'), getMyDonations);

export default router;