import { query } from '../db/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { genSalt, hash } = bcrypt;

const { sign, verify } = jwt;


// --- User Registration Logic ---
export async function registerUser(req, res) {
    // 1. Destructure request body
    const { name, email, password, blood_group, role, latitude, longitude } = req.body;

    // 2. Basic Validation
    if (!name || !email || !password || !blood_group) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    try {
        // 3. Check if user already exists
        const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // 4. Hash the password
        const salt = await genSalt(10);
        const password_hash = await hash(password, salt);

        // 5. Insert new user into the database
        const newUserQuery = `
            INSERT INTO users (name, email, password_hash, blood_group, role, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING user_id, email, role;
        `;
        const newUser = await query(newUserQuery, [
            name,
            email,
            password_hash,
            blood_group,
            role || 'donor', // Default to 'donor' if not provided
            latitude,
            longitude,
        ]);

        const dbUser = newUser.rows[0];

        // 6. Create and sign a JSON Web Token (JWT)
        const payload = {
            user: {
                id: dbUser.user_id,
                role: dbUser.role,
            },
        };

        sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }, // Token expires in 7 days
            (err, token) => {
                if (err) throw err;
                // 7. Send the token back to the client
                res.status(201).json({
                    token,
                    message: "User registered successfully!"
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

// --- User Login Logic ---
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide an email and password' });
    }

    try {
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { user: { id: user.user_id, role: user.role } };

        sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, message: "Logged in successfully!" });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
