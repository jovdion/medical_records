import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
            console.log('No refresh token found in cookies');
            return res.status(401).json({ msg: "No refresh token" });
        }

        const user = await Users.findOne({
            where: {
                refresh_token: refreshToken
            }
        });

        if (!user) {
            console.log('No user found with the provided refresh token');
            return res.status(403).json({ msg: "Invalid refresh token" });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                console.log('Failed to verify refresh token:', err.message);
                return res.status(403).json({ msg: "Invalid refresh token" });
            }

            const userId = user.id;
            const username = user.username;
            const email = user.email;
            const role = user.role;

            const accessToken = jwt.sign({
                userId,
                username,
                email,
                role
            }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });

            res.json({
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
        console.error("Error refreshing token:", error);
        res.status(500).json({ msg: "Token refresh failed", error: error.message });
    }
};