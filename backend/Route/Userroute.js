import express from "express";
import { getUsers, Register, Login, Logout } from "../controllers/Usercontroller.js";
import { verifyToken } from "../middleware/verifytoken.js";
import { refreshToken } from "../controllers/Refreshtoken.js";

const router = express.Router();

router.get('/users', verifyToken, getUsers);
router.post('/login', Login);
router.delete('/logout', Logout);
router.post('/users', Register);

// Separate endpoints for token verification and refresh
router.get('/token/verify', verifyToken, (req, res) => {
    // If verifyToken middleware passes, the token is valid
    res.json({ 
        msg: "Token valid",
        user: {
            id: req.userId,
            username: req.username,
            role: req.userRole
        }
    });
});

router.get('/token/refresh', refreshToken);

export default router;