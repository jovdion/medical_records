import Users from "../models/Usermodel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ["id", "username", "email", "role"],
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

// Register a new user
export const Register = async (req, res) => {
    const { username, email, password, confPassword, role } = req.body;

    if (!username || !email || !password || !confPassword) {
        return res.status(400).json({ msg: "Semua field harus diisi" });
    }

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
    }

    try {
        // Check if email is already used
        const existingEmail = await Users.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email sudah terdaftar" });
        }

        // Check if username is already used
        const existingUsername = await Users.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ msg: "Username sudah digunakan" });
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        await Users.create({ 
            username, 
            email, 
            password: hashPassword,
            role: role || 'staff' // Default to 'staff' if no role provided
        });

        res.json({ msg: "Register Berhasil" });
    } catch (error) {
        console.error("Error saat register:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ msg: error.errors[0].message });
        }
        res.status(500).json({ msg: "Register Gagal" });
    }
};

// Login user
export const Login = async (req, res) => {
    try {
        console.log('Login attempt:', {
            email: req.body.email,
            headers: req.headers
        });

        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ msg: "Email dan password harus diisi" });
        }

        const user = await Users.findOne({
            where: { email }
        });

        if (!user) {
            console.log('User not found:', email);
            return res.status(404).json({ msg: "Email tidak ditemukan" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log('Invalid password for user:', email);
            return res.status(400).json({ msg: "Password salah" });
        }

        // JWT token generation with role
        const accessToken = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role 
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }  // Reduced to 15 minutes for security
        );

        console.log('Access token generated:', accessToken.substring(0, 20) + '...');

        // Generate refresh token
        const refreshToken = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role 
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        console.log('Refresh token generated:', refreshToken.substring(0, 20) + '...');

        // Store refresh token in database
        await Users.update(
            { refresh_token: refreshToken },
            { where: { id: user.id } }
        );

        // Set refresh token in cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log('Cookie set:', {
            refreshToken: refreshToken.substring(0, 20) + '...',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });

        // Send response with tokens and user info
        res.json({
            msg: "Login berhasil",
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ msg: "Login Gagal", error: error.message });
    }
};

// Logout user
export const Logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(204);

        const user = await Users.findOne({
            where: { refresh_token: refreshToken }
        });

        if (!user) return res.sendStatus(204);

        // Clear refresh token in database
        await Users.update(
            { refresh_token: null },
            { where: { id: user.id } }
        );

        // Clear cookie
        res.clearCookie('refreshToken');
        res.json({ msg: "Logout berhasil" });
    } catch (error) {
        console.error("Error saat logout:", error);
        res.status(500).json({ msg: "Logout Gagal" });
    }
};


