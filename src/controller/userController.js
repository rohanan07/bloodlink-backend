// Contains the logic for user-related endpoints.

import { query } from '../db/db.js';

// --- Get Logged-in User's Profile ---
export const getMe = async (req, res) => {
    try {
        // The user's ID is attached to the request object by the authMiddleware
        const userId = req.user.id;

        // Fetch user data from the database, excluding the password hash
        const user = await query(
            'SELECT user_id, name, email, blood_group, role, latitude, longitude, created_at FROM users WHERE user_id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Get all requests created by the logged-in user ---
export const getMyRequests = async (req, res) => {
    const requesterId = req.user.id;

    try {
        const sql = `
            SELECT 
                request_id,
                patient_name,
                blood_group,
                status,
                urgency,
                created_at
            FROM blood_requests 
            WHERE requester_id = $1
            ORDER BY created_at DESC;
        `;

        const userRequests = await query(sql, [requesterId]);

        res.json(userRequests.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// --- Get all requests accepted by the logged-in donor ---
// --- Get all requests accepted by the logged-in donor ---
export const getMyDonations = async (req, res) => {
    const donorId = req.user.id;

    try {
        // Renamed the string variable to avoid conflict with the imported 'query' function
        const sqlQuery = `
            SELECT 
                br.request_id,
                br.patient_name,
                br.blood_group,
                br.hospital_name,
                br.status,
                rd.accepted_at
            FROM blood_requests br
            JOIN request_donors rd ON br.request_id = rd.request_id
            WHERE rd.donor_id = $1
            ORDER BY rd.accepted_at DESC;
        `;

        const donationHistory = await query(sqlQuery, [donorId]);

        res.json(donationHistory.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

