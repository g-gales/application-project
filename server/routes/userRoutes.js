import express from "express";
import { googleLogin, getMe } from "../controllers/authController.js"; // Use your existing file!

const router = express.Router();

router.post("/google-login", googleLogin);
router.get("/me", getMe);

export default router;
