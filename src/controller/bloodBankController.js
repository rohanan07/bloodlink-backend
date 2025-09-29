// Logic for handling blood bank inventory management.
import { query } from '../db/db.js';

// --- Get a hospital's own blood stock ---
export const getMyStock = async (req, res) => {
    try {
        const hospitalId = req.user.id; // Get user ID from token payload

        const stock = await query(
            'SELECT * FROM blood_banks WHERE hospital_id = $1',
            [hospitalId]
        );
        
        if (stock.rows.length === 0) {
            return res.status(404).json({ msg: 'No blood bank inventory found for this hospital. Please create one.' });
        }

        res.json(stock.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Update a hospital's own blood stock ---
export const updateMyStock = async (req, res) => {
    const { 
        a_positive, a_negative, 
        b_positive, b_negative, 
        o_positive, o_negative, 
        ab_positive, ab_negative 
    } = req.body;
    
    const hospitalId = req.user.id;

    try {
        // Check if stock entry already exists for this hospital
        const existingStock = await query(
            'SELECT * FROM blood_banks WHERE hospital_id = $1',
            [hospitalId]
        );

        let result;
        if (existingStock.rows.length > 0) {
            // -- UPDATE existing stock --
            const updateQuery = `
                UPDATE blood_banks
                SET a_positive = $1, a_negative = $2, b_positive = $3, b_negative = $4,
                    o_positive = $5, o_negative = $6, ab_positive = $7, ab_negative = $8,
                    last_updated = NOW()
                WHERE hospital_id = $9
                RETURNING *;
            `;
            result = await query(updateQuery, [
                a_positive, a_negative, b_positive, b_negative,
                o_positive, o_negative, ab_positive, ab_negative,
                hospitalId
            ]);
            res.json({ msg: 'Blood stock updated successfully', stock: result.rows[0] });

        } else {
            // -- INSERT new stock --
            const insertQuery = `
                INSERT INTO blood_banks (
                    hospital_id, a_positive, a_negative, b_positive, b_negative,
                    o_positive, o_negative, ab_positive, ab_negative
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *;
            `;
            result = await query(insertQuery, [
                hospitalId, a_positive, a_negative, b_positive, b_negative,
                o_positive, o_negative, ab_positive, ab_negative
            ]);
            res.status(201).json({ msg: 'Blood stock created successfully', stock: result.rows[0] });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// --- Get all public blood stock ---
export const getAllStock = async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.name AS hospital_name,
                u.latitude,
                u.longitude,
                u.contact_number,
                bb.a_positive,
                bb.a_negative,
                bb.b_positive,
                bb.b_negative,
                bb.o_positive,
                bb.o_negative,
                bb.ab_positive,
                bb.ab_negative,
                bb.last_updated
            FROM blood_banks bb
            JOIN users u ON bb.hospital_id = u.user_id
            WHERE u.role = 'hospital';
        `;

        const allStock = await query(sql);

        if (allStock.rows.length === 0) {
            return res.status(404).json({ msg: 'No hospital inventories found.' });
        }

        res.json(allStock.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
