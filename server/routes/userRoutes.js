import express from "express";
import { googleLogin, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/google-login", googleLogin);
// protect verifies google ID with google Oauth before running additional routes
router.get("/me", protect, getMe);

export default router;
