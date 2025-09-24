// This middleware checks if the logged-in user has the required role.

const checkRole = (role) => {
    return (req, res, next) => {
        // We assume the authMiddleware has already run and attached the user to the request.
        if (req.user && req.user.role === role) {
            next(); // User has the correct role, proceed to the next function
        } else {
            res.status(403).json({ msg: 'Forbidden: You do not have the required permissions.' });
        }
    };
};

export default checkRole;