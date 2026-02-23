import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Event from "../models/Event.js";

const router = express.Router();

/**
 * POST /api/events
 * Creates a new calendar event in the database
 */
router.post("/", protect, async (req, res) => {
  try {
    const { title, start, end, allDay, extendedProps } = req.body;

    const newEvent = new Event({
      userId: req.user._id,
      title,
      start,
      end,
      allDay,
      extendedProps,
      courseId,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: `Event didn't save: ${error.message}` });
  }
});

/**
 * GET /api/events
 * Retrieves all events for the current user
 */
router.get("/", protect, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user._id });
    res.json(events);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to fetch events: ${error.message}` });
  }
});

export default router;
