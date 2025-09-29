import { query } from '../db/db.js';

// --- Create a new blood request ---
export const createRequest = async (req, res) => {
    const {
        patient_name,
        blood_group,
        required_units,
        urgency,
        hospital_name,
        contact_person,
        contact_number,
        latitude,
        longitude
    } = req.body;

    const requesterId = req.user.id; // from authMiddleware

    try {
        const newRequestQuery = `
            INSERT INTO blood_requests (
                requester_id, patient_name, blood_group, required_units, urgency, 
                hospital_name, contact_person, contact_number, latitude, longitude
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        
        const newRequest = await query(newRequestQuery, [
            requesterId, patient_name, blood_group, required_units, urgency,
            hospital_name, contact_person, contact_number, latitude, longitude
        ]);

        res.status(201).json({ msg: 'Blood request created successfully', request: newRequest.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Get all active blood requests ---
export const getActiveRequests = async (req, res) => {
    try {
        const sql = `
            SELECT 
                br.request_id,
                br.patient_name,
                br.blood_group,
                br.required_units,
                br.urgency,
                br.hospital_name,
                br.contact_person,
                br.contact_number,
                br.latitude,
                br.longitude,
                br.created_at,
                u.name AS requester_name
            FROM blood_requests br
            JOIN users u ON br.requester_id = u.user_id
            WHERE br.status = 'open'
            ORDER BY br.created_at DESC;
        `;

        const activeRequests = await query(sql);

        res.json(activeRequests.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- A donor accepts a blood request ---
export const acceptRequest = async (req, res) => {
    const { requestId } = req.params;
    const donorId = req.user.id;

    try {
        await query('BEGIN'); // Start transaction

        const findRequestQuery = "SELECT requester_id, status, patient_name FROM blood_requests WHERE request_id = $1 FOR UPDATE";
        const requestResult = await query(findRequestQuery, [requestId]);

        if (requestResult.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ msg: 'Request not found.' });
        }

        const { requester_id, status, patient_name } = requestResult.rows[0];

        if (status !== 'open') {
            await query('ROLLBACK');
            return res.status(400).json({ msg: `This request is already '${status}' and cannot be accepted.` });
        }

        const updateStatusQuery = "UPDATE blood_requests SET status = 'pending' WHERE request_id = $1";
        await query(updateStatusQuery, [requestId]);

        const insertDonorQuery = "INSERT INTO request_donors (request_id, donor_id) VALUES ($1, $2)";
        await query(insertDonorQuery, [requestId, donorId]);

        await query('COMMIT'); // Commit transaction

        // --- REAL-TIME NOTIFICATION LOGIC ---
        const requesterSocketId = req.userSocketMap.get(requester_id);
        if (requesterSocketId) {
            req.io.to(requesterSocketId).emit('request_accepted', {
                requestId: requestId,
                message: `A donor has accepted your blood request for patient ${patient_name}.`
            });
            console.log(`✅ Emitting 'request_accepted' to user ${requester_id} on socket ${requesterSocketId}`);
        } else {
            console.log(`- User ${requester_id} is not connected. Could not send real-time notification.`);
        }
        // --- END NOTIFICATION LOGIC ---

        res.json({ msg: 'Request accepted successfully. The status is now pending.' });

    } catch (err) {
        await query('ROLLBACK');
        // FIX: Check for the specific 'unique violation' error code from PostgreSQL
        if (err.code === '23505') {
            return res.status(409).json({ msg: 'You have already accepted this request.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const completeRequest = async (req, res) => {
    const { requestId } = req.params;
    const requesterId = req.user.id; // The ID of the logged-in user

    try {
        // First, find the request to verify ownership and status
        const findRequestQuery = "SELECT requester_id, status FROM blood_requests WHERE request_id = $1";
        const requestResult = await query(findRequestQuery, [requestId]);

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Request not found.' });
        }

        const request = requestResult.rows[0];

        // Check if the logged-in user is the one who created the request
        if (request.requester_id !== requesterId) {
            return res.status(403).json({ msg: 'Forbidden: You are not authorized to update this request.' });
        }

        // Check if the request is in a 'pending' state
        if (request.status !== 'pending') {
            return res.status(400).json({ msg: `Cannot complete a request with status '${request.status}'.` });
        }

        // If all checks pass, update the status to 'completed'
        const updateQuery = "UPDATE blood_requests SET status = 'completed' WHERE request_id = $1 RETURNING *";
        const updatedRequest = await query(updateQuery, [requestId]);

        res.json({ msg: 'Request successfully marked as completed.', request: updatedRequest.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ... existing functions ...

// --- Get a single request by ID ---
export const getRequestById = async (req, res) => {
    const { requestId } = req.params;

    try {
        const queryText = `
            SELECT 
                br.request_id,
                br.patient_name,
                br.blood_group,
                br.required_units,
                br.urgency,
                br.hospital_name,
                br.contact_person,
                br.contact_number,
                br.latitude,
                br.longitude,
                br.status,
                br.created_at,
                u.name as requester_name
            FROM blood_requests br
            JOIN users u ON br.requester_id = u.user_id
            WHERE br.request_id = $1;
        `;
        const { rows } = await query(queryText, [requestId]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};