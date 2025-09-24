// This middleware verifies the JWT token sent by the client.

import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    // 1. Get token from the Authorization header
    const authHeader = req.header('Authorization');

    // 2. Check if token exists
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // 3. Check if the token is in the correct format "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ msg: 'Token format is invalid, authorization denied' });
    }

    try {
        // 4. Verify the token using the secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach the decoded user payload to the request object
        req.user = decoded.user;
        
        // 6. Pass control to the next function in the chain
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

export default authMiddleware;
