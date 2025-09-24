import { query } from '../db/db.js';

// --- Hospital creates a new camp ---
export const createCamp = async (req, res) => {
    const organizerId = req.user.id;
    const { camp_name, address, latitude, longitude, start_time, end_time, description } = req.body;

    // Basic validation
    if (!camp_name || !address || !latitude || !longitude || !start_time || !end_time) {
        return res.status(400).json({ msg: 'Please provide all required fields for the camp.' });
    }

    try {
        const sqlQuery = `
            INSERT INTO donation_camps (organizer_id, camp_name, address, latitude, longitude, start_time, end_time, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const newCamp = await query(sqlQuery, [organizerId, camp_name, address, latitude, longitude, start_time, end_time, description]);

        res.status(201).json({ msg: 'Donation camp announced successfully!', camp: newCamp.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Get all upcoming camps ---
export const getAllCamps = async (req, res) => {
    try {
        // We only fetch camps that haven't ended yet
        const sqlQuery = `
            SELECT 
                camp_id,
                organizer_id,
                camp_name,
                address,
                latitude,
                longitude,
                start_time,
                end_time,
                description
            FROM donation_camps
            WHERE end_time > NOW()
            ORDER BY start_time ASC;
        `;

        const upcomingCamps = await query(sqlQuery);
        res.json(upcomingCamps.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
