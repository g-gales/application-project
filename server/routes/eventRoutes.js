import express from "express";
import Event from "../models/Event.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/events
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end, courseId } = req.query;

    const query = { userId };

    if (start && end) {
      query.start = { $lt: new Date(end) };
      query.$or = [
        { end: { $gt: new Date(start) } },
        { end: null },
        { end: { $exists: false } },
      ];
    }

    if (courseId) {
      query["extendedProps.courseId"] = courseId;
    }

    const events = await Event.find(query).sort({ start: 1 });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// POST /api/events
router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const created = await Event.create({
      ...req.body,
      userId,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to create event" });
  }
});

// PUT /api/events/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const updated = await Event.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { returnDocument: "after" }, // ✅ updated option
    );

    if (!updated) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to update event" });
  }
});

// DELETE /api/events/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await Event.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to delete event" });
  }
});

export default router;
