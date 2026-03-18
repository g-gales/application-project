import express from "express";
import StudySession from "../models/StudySession.js";
import Course from "../models/Course.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/v1/study-sessions
router.post("/", protect, async (req, res) => {
  try {
    const { courseId, durationMinutes, type } = req.body;

    // create schema
    const session = await StudySession.create({
      userId: req.user._id,
      courseId,
      durationMinutes,
      type,
    });

    // increment the total time in the Course model
    await Course.findOneAndUpdate(
      { _id: courseId, userId: req.user._id },
      { $inc: { pomodoroStudyTime: durationMinutes } },
    );

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
