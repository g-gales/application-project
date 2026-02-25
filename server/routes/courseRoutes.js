import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Course from "../models/Course.js";

const router = express.Router();

/**
 * GET /api/courses
 * Retrieves all courses for the current user (with the help of protect)
 */
router.get("/", protect, async (req, res) => {
  try {
    // modifying for the Courses component
    const courses = await Course.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

/**
 * POST /api/courses
 * creates a new course per user_id
 */
router.post("/", protect, async (req, res) => {
  try {
    const newCourse = await Course.create({
      ...req.body, // modifying for the Courses component
      userId: req.user._id,
    });

    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

export default router;
