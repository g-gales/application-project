import express from "express";
import StudySession from "../models/StudySession.js";
import Course from "../models/Course.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/v1/study-sessions
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

// GET /api/v1/study-sessions/summary
// - GET ROUTE FOR WEEKLY SUMMARY
router.get("/summary", protect, async (req, res) => {
  try {
    // pagination offset from frontend, default to 0 if not provided
    const offset = Number(req.query.offset) || 0;
    // sunday midnight is start of week
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + offset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // saturday night is end of week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // aggregation query to get total study time per course for the week, along with course details
    const summary = await StudySession.aggregate([
      {
        // filter sessions by user and date range
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        // total minutes per courseID grouping
        $group: {
          _id: "$courseId",
          totalMinutes: { $sum: "$durationMinutes" },
        },
      },
      {
        // get the course name & color from the Course collection
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        // put all in a joined array
        $unwind: "$courseDetails",
      },
    ]);

    // get minutes per day
    const dailyBreakdown = await StudySession.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          // Extracts day of week (1 = Sunday, 2 = Monday ... 7 = Saturday)
          _id: { $dayOfWeek: "$createdAt" },
          minutes: { $sum: "$durationMinutes" },
        },
      },
    ]);

    // return aggregated data
    res.status(200).json({
      dateRange: { start: startOfWeek, end: endOfWeek },
      courseSummary: summary,
      dailyBreakdown: dailyBreakdown,
    });
  } catch (error) {
    console.error("Summary Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
