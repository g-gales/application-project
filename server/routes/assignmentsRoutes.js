import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Assignment from "../models/Assignment.js";

const router = express.Router();

router.use(protect);

/**
 * GET /api/v1/assignments
 * get all assignments for the current user
 */
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find({ userId: req.user._id });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/v1/assignments
 * post a new assignment linked to the current user
 */
router.post("/", async (req, res) => {
  try {
    const newAssignment = await Assignment.create({
      ...req.body,
      userId: req.user._id,
    });
    res.status(201).json(newAssignment);
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
});

/**
 * PUT /api/v1/assignments/:id
 * update for edit modal
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!updated)
      return res.status(404).json({ message: "Assignment not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /api/v1/assignments/:id/progress
 * bump progress route for CourseDetails and Pomodoro
 */
router.put("/:id/progress", async (req, res) => {
  try {
    const { minutes } = req.body;
    // find by ID AND ensure it belongs to this user
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    // Update minutes
    assignment.minutesCompleted = Math.max(
      0,
      (assignment.minutesCompleted || 0) + minutes,
    );

    // status update
    if (assignment.minutesCompleted >= assignment.estimatedMinutes) {
      assignment.status = "done";
    } else if (assignment.minutesCompleted > 0) {
      assignment.status = "in-progress";
    } else {
      assignment.status = "not-started";
    }

    await assignment.save({ validateBeforeSave: false });
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE /api/v1/assignments/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Assignment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!deleted)
      return res.status(404).json({ message: "Assignment not found" });
    res.status(204).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
