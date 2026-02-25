import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Course from "../models/Course.js";

const router = express.Router();

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
 * GET one course /api/courses
 * gets one course info based on ID
 */
router.get("/:id", protect, async (req, res) => {
  try {
    // ownership verification

    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!course) {
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

/**
 * FIXME: this might not work yet
 * PATCH /api/v1/courses/:id
 */
router.patch("/:id", protect, async (req, res) => {
  try {
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedCourse) {
      return res
        .status(404)
        .json({ status: "fail", message: "Course not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

/**
 * FIXME: this might not work yet
 * DELETE /api/v1/courses/:id
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    // pass course id and user id into findOne
    const deletedCourse = await Course.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deletedCourse) {
      return res.status(404).json({
        status: "success",
        data: null,
      });
    }

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    res.status(500).json({ status: "fails", message: error.message });
  }
});

export default router;
