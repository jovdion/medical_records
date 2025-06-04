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
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth header:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
    console.log('Extracted token:', token ? token.substring(0, 20) + '...' : 'none');

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ msg: "No token provided" });
    }

    try {
        console.log('Verifying token with secret:', process.env.ACCESS_TOKEN_SECRET ? 'present' : 'missing');
        
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