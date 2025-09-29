import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import pool from './db/db.js'; // Note the .js extension is required for local modules
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bloodBankRoutes from './routes/bloodBankRoutes.js';
import bloodRequestRoutes from './routes/bloodRequestRoutes.js';
import campRoutes from './routes/campRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import { attachSocketIO } from './middleware/socketMiddleware.js';

// Load environment variables
dotenv.config();

// --- Basic Setup ---
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies from requests


// --- Socket.IO Setup ---
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity. In production, restrict this.
        methods: ['GET', 'POST'],
    },
});

const userSocketMap = new Map();

// --- Socket.IO Real-time Logic ---
io.on('connection', (socket) => {
    console.log(`🔌 A user connected with socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`👋 User with socket ID: ${socket.id} disconnected`);
    });

      // When a user logs in on the client, they should emit this event
    socket.on('register', (userId) => {
        console.log(`User ${userId} registered with socket ${socket.id}`);
        userSocketMap.set(userId, socket.id);
    });

    socket.on('disconnect', () => {
        // Find which user this socket belonged to and remove them from the map
        for (let [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                console.log(`User ${userId} with socket ${socket.id} disconnected and was removed from map.`);
                break;
            }
        }
        console.log(`👋 User with socket ID: ${socket.id} disconnected`);
    });

    // Add more real-time event listeners here in the future
});

// This makes `io` and `userSocketMap` available in all route controllers
app.use(attachSocketIO(io, userSocketMap));

// --- Start Server ---
server.listen(port, () => {
    console.log(`🚀 BloodLink server is running on http://localhost:${port}`);
});



// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error connecting to the database', err.stack);
    } else {
        console.log('✅ Database connected successfully at:', res.rows[0].now);
    }
});

// --- API Routes ---
// A simple test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the BloodLink API!' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/blood-bank', bloodBankRoutes);
app.use('/api/v1/requests', bloodRequestRoutes);
app.use('/api/v1/camps', campRoutes);
app.use('/api/v1/search', searchRoutes);

