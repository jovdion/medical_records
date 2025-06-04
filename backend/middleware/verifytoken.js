import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    console.log('Verifying token...');
    console.log('Headers:', {
        ...req.headers,
        authorization: req.headers.authorization ? 
            req.headers.authorization.substring(0, 20) + '...' : 
            'none'
    });
    console.log('Cookies:', req.cookies);

    const authHeader = req.headers['authorization'];
    
    // Validate Authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Invalid Authorization header format');
        return res.status(401).json({ msg: "Invalid Authorization header format" });
    }

    // Extract and clean token
    const token = authHeader.split(' ')[1].trim();
    
    // Basic JWT format validation
    if (!token || !token.startsWith('ey')) {
        console.log('Invalid token format');
        return res.status(401).json({ msg: "Invalid token format" });
    }

    console.log('Auth header:', authHeader.substring(0, 20) + '...');
    console.log('Extracted token:', token.substring(0, 20) + '...');

    try {
        console.log('Verifying token with secret:', process.env.ACCESS_TOKEN_SECRET ? 'present' : 'missing');
        
        if (!process.env.ACCESS_TOKEN_SECRET) {
            console.error('ACCESS_TOKEN_SECRET is missing');
            return res.status(500).json({ msg: "Server configuration error" });
        }
        
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('Token verified successfully:', {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            exp: new Date(decoded.exp * 1000).toISOString()
        });
        
        // Check if token is about to expire (within 5 minutes)
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        console.log('Token expires in:', expiresIn, 'seconds');
        
        if (expiresIn < 300) { // 5 minutes
            console.log('Token is about to expire');
            res.set('X-Token-Expiring', 'true');
        }
        
        // Validate required claims
        if (!decoded.userId || !decoded.username || !decoded.role) {
            console.error('Token missing required claims');
            return res.status(401).json({ msg: "Invalid token: missing required claims" });
        }
        
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.username = decoded.username;
        next();
    } catch (err) {
        console.error('Token verification failed:', {
            error: err.message,
            name: err.name,
            expiredAt: err.expiredAt ? new Date(err.expiredAt).toISOString() : null
        });
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                msg: "Token expired",
                expiredAt: err.expiredAt
            });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                msg: "Invalid token",
                error: err.message
            });
        }
        return res.status(403).json({ 
            msg: "Token verification failed",
            error: err.message
        });
    }
};