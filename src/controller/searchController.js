import { query } from '../db/db.js';

// --- Find nearby open blood requests ---
export const findNearbyRequests = async (req, res) => {
    const { latitude, longitude, radius = 10 } = req.query; // Default radius is 10 km

    if (!latitude || !longitude) {
        return res.status(400).json({ msg: 'Latitude and longitude are required.' });
    }

    try {
        const sqlQuery = `
            SELECT
                request_id,
                patient_name,
                blood_group,
                hospital_name,
                urgency,
                latitude,
                longitude,
                distance(latitude, longitude, $1, $2) AS distance_km
            FROM blood_requests
            WHERE status = 'open' AND distance(latitude, longitude, $1, $2) <= $3
            ORDER BY distance_km;
        `;
        const nearbyRequests = await query(sqlQuery, [latitude, longitude, radius]);
        res.json(nearbyRequests.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Find nearby donors by blood group ---
export const findNearbyDonors = async (req, res) => {
    const { latitude, longitude, blood_group, radius = 10 } = req.query; // Default radius 10 km

    if (!latitude || !longitude || !blood_group) {
        return res.status(400).json({ msg: 'Latitude, longitude, and blood_group are required.' });
    }

    try {
        // We must decode the blood group if it's URL encoded (e.g., 'A%2B' becomes 'A+')
        const decodedBloodGroup = decodeURIComponent(blood_group);

        const sqlQuery = `
            SELECT
                user_id,
                name,
                blood_group,
                latitude,
                longitude,
                distance(latitude, longitude, $1, $2) AS distance_km
            FROM users
            WHERE role = 'donor' AND blood_group = $3 AND distance(latitude, longitude, $1, $2) <= $4
            ORDER BY distance_km;
        `;
        const nearbyDonors = await query(sqlQuery, [latitude, longitude, decodedBloodGroup, radius]);
        res.json(nearbyDonors.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
