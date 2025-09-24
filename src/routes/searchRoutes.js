import express from 'express';
import { findNearbyRequests, findNearbyDonors } from '../controller/searchController.js';

const router = express.Router();

// @route   GET /api/v1/search/requests
// @desc    Find nearby open blood requests
// @access  Public
router.get('/requests', findNearbyRequests);

// @route   GET /api/v1/search/donors
// @desc    Find nearby donors by blood group
// @access  Public
router.get('/donors', findNearbyDonors);

export default router;