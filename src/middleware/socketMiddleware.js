// This middleware attaches the Socket.IO instance and the user-socket map
// to every incoming request object (req). This allows our route controllers
// to access them and emit real-time events.

export const attachSocketIO = (io , userSocketMap) => (req, res, next) => {
    req.io = io;
    req.userSocketMap = userSocketMap;
    next();
}