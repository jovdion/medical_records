import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
    try {
        console.log('Refresh token request received');
        console.log('Headers:', {
            ...req.headers,
            authorization: req.headers.authorization ? 
                req.headers.authorization.substring(0, 20) + '...' : 
                'none'
        });
        console.log('Cookies:', req.cookies);
        
        // Try to get refresh token from different sources
        let refreshToken = req.cookies?.refreshToken;
        
        // If no cookie, try Authorization header
        if (!refreshToken && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                refreshToken = authHeader.split(' ')[1].trim();
                console.log('Using Authorization header as refresh token');
            }
        }
        
        if (!refreshToken) {
            console.log('No refresh token found in cookies or headers');
            return res.status(401).json({ msg: "No refresh token" });
        }

        console.log('Refresh token found:', refreshToken.substring(0, 20) + '...');

        // Find user with this refresh token
        const user = await Users.findOne({
            where: {
                refresh_token: refreshToken
            }
        });

        if (!user) {
            console.log('No user found with the provided refresh token');
            return res.status(403).json({ msg: "Invalid refresh token" });
        }

        console.log('User found:', {
            id: user.id,
            username: user.username,
            role: user.role
        });

        // Verify refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                console.log('Failed to verify refresh token:', {
                    error: err.message,
                    name: err.name,
                    expiredAt: err.expiredAt ? new Date(err.expiredAt).toISOString() : null
                });
                
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ 
                        msg: "Refresh token expired",
                        expiredAt: err.expiredAt
                    });
                }
                return res.status(403).json({ 
                    msg: "Invalid refresh token",
                    error: err.message
                });
            }

            const userId = user.id;
            const username = user.username;
            const email = user.email;
            const role = user.role;

            // Generate new access token
            const accessToken = jwt.sign({
                userId,
                username,
                email,
                role
            }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '15m'  // Reduced to 15 minutes for security
            });

            console.log('New access token generated:', accessToken.substring(0, 20) + '...');

            // Generate new refresh token
            const newRefreshToken = jwt.sign({
                userId,
                username,
                email,
                role
            }, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: '7d'
            });

            console.log('New refresh token generated:', newRefreshToken.substring(0, 20) + '...');

            // Update refresh token in database
            Users.update(
                { refresh_token: newRefreshToken },
                { where: { id: userId } }
            );

            // Set new refresh token in cookie
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            console.log('New cookie set:', {
                refreshToken: newRefreshToken.substring(0, 20) + '...',
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            });

            res.json({
                msg: "Token refreshed successfully",
                accessToken,
                user: {
                    id: userId,
                    username,
                    email,
                    role
                }
            });
        });
    } catch (error) {
        console.error("Error refreshing token:", {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            msg: "Token refresh failed", 
            error: error.message 
        });
    }
};