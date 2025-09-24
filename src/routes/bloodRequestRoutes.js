// Routes for managing blood requests.

import express from 'express';
import { createRequest, getActiveRequests, acceptRequest, completeRequest } from '../controller/bloodRequestController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import checkRole from '../middleware/roleMiddleware.js';

const router = express.Router();

// @route   POST /api/v1/requests
// @desc    Create a new blood request
// @access  Private (Any logged-in user)
router.post('/', authMiddleware, createRequest, completeRequest);

// @route   GET /api/v1/requests
// @desc    Get all active blood requests
// @access  Private (Any logged-in user)
router.get('/', authMiddleware, getActiveRequests);

// @route   POST /api/v1/requests/:requestId/accept
// @desc    A donor accepts a blood request
// @access  Private (Donor only)
router.post('/:requestId/accept', authMiddleware, checkRole('donor'), acceptRequest);

// @route   PUT /api/v1/requests/:requestId/complete
// @desc    The original requester marks a request as completed
// @access  Private (Requester only)
router.put('/:requestId/complete', authMiddleware, completeRequest);

export default router;