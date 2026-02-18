import express from "express";
import { googleLogin } from "../controllers/authController.js"; // Use your existing file!

const router = express.Router();

router.post("/google-login", googleLogin);

export default router;
