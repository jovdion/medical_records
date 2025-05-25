import Users from "../models/Usermodel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ["id", "username", "email"],
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

// Register a new user
export const Register = async (req, res) => {
    const { username, email, password, confPassword } = req.body;

    if (!username || !email || !password || !confPassword) {
        return res.status(400).json({ msg: "Semua field harus diisi" });
    }

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
    }

    try {
        // Cek apakah email sudah digunakan
        const existingUser = await Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ msg: "Email sudah terdaftar" });
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        await Users.create({ username, email, password: hashPassword });

        res.json({ msg: "Register Berhasil" });
    } catch (error) {
        console.error("Error saat register:", error);
        res.status(500).json({ msg: "Register Gagal" });
    }
};

// Login user
export const Login = async (req, res) => {
    try {
        const user = await Users.findOne({
            where: { email: req.body.email }
        });

        if (!user) {
            return res.status(404).json({ msg: "Email tidak ditemukan" });
        }

        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ msg: "Password salah" });

        const userId = user.id;
        const username = user.username;
        const email = user.email;

        const accessToken = jwt.sign(
            { userId, username, email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "20s" } // bisa diperpanjang nanti
        );

        const refreshToken = jwt.sign(
            { userId, username, email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
        );

        await Users.update({ refresh_token: refreshToken }, {
            where: { id: userId }
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 24 * 60 * 60 * 1000 // 1 hari
        });

        res.json({ accessToken });
    } catch (error) {
        console.error("Error saat login:", error);
        res.status(500).json({ msg: "Login Gagal" });
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

        await Users.update({ refresh_token: null }, {
            where: { id: user.id }
        });

        res.clearCookie('refreshToken');
        return res.sendStatus(200);
    } catch (error) {
        console.error("Error saat logout:", error);
        res.sendStatus(500);
    }
};
