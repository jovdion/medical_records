import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    console.log('Verifying token...');
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth header:', authHeader);
    console.log('Extracted token:', token ? token.substring(0, 10) + '...' : 'none');

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ msg: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('Token verified successfully:', {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        });
        
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.username = decoded.username;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: "Token expired" });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: "Invalid token" });
        }
        return res.status(403).json({ msg: err.message });
    }
};