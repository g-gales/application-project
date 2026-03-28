import express from "express";
import {
  googleLogin,
  getMe,
  guestLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/google-login", googleLogin);
// protect verifies google ID with google Oauth before running additional routes
router.get("/me", protect, getMe);

router.patch("/settings", protect, async (req, res) => {
  try {
    const allowedFields = [
      "summaryFrequency",
      "darkMode",
      "dailyWorkloadLimit",
      "weeklyWorkloadLimit",
      "defaultPomodoroTime",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[`settings.${field}`] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "No valid settings provided" });
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, "summaryFrequency") &&
      !["daily", "weekly"].includes(req.body.summaryFrequency)
    ) {
      return res.status(400).json({
        status: "fail",
        message: "summaryFrequency must be either 'daily' or 'weekly'",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    res.status(200).json({ status: "success", data: { user: updatedUser } });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

router.post("/guest-login", guestLogin);

export default router;
