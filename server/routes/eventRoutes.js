import express from "express";

// db schema
import Event from "../models/Event.js";

const router = express.Router();

/**
 * POST /api/events
 * Creates a new calendar event in the database
 */
router.post("/", async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Please log in first." });
    }

    const { title, start, end, allDay, extendedProps } = req.body;

    // new db schema
    const newEvent = new Event({
      userId: req.user._id,
      title,
      start,
      end,
      allDay,
      extendedProps,
    });

    const savedEvent = await newEvent.save();

    // event created and returned
    res.status(201).json(savedEvent);
  } catch (error) {
    res
      .status(400)
      .json({ message: `Event didn't save: Error: ${error.message}` });
  }
});

/**
 * GET /api/events
 * Retrieves all events for the current user
 */
router.get("/", async (req, res) => {
  try {
    // fins all events in DB, return events
    const events = await Event.find({ userId: req.user._id });
    res.json(events);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to fetch events: Error: ${error.message}` });
  }
});

export default router;
