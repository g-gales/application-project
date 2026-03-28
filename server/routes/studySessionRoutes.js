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

router.post("/", protect, async (req, res) => {
  try {
    const { courseId, durationMinutes, type } = req.body;

    // convert to Number to prevent $inc errors if duration is a string
    const duration = Number(durationMinutes);

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    const session = await StudySession.create({
      userId: req.user._id,
      courseId,
      durationMinutes: duration,
      type,
    });

    // increment the total time in the Course model
    await Course.findOneAndUpdate(
      { _id: courseId, userId: req.user._id },
      { $inc: { pomodoroStudyTime: duration } },
      {
        returnDocument: "after", // This replaces { new: true }
        runValidators: true,
      },
    );

    res.status(201).json(session);
  } catch (error) {
    console.error("Study Session Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
