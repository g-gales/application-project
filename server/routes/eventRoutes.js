import express from "express";
import Event from "../models/Event.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end, courseId, seriesId } = req.query;

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

    if (seriesId) {
      query.seriesId = seriesId;
    }

    const events = await Event.find(query).sort({ start: 1 });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const created = await Event.create({
      ...req.body,
      userId,
      seriesId: req.body.seriesId || null,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to create event" });
  }
});

router.post("/bulk", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const events = Array.isArray(req.body?.events) ? req.body.events : [];

    if (!events.length) {
      return res.status(400).json({ message: "No events provided" });
    }

    const docs = events.map((event) => ({
      ...event,
      userId,
      seriesId: event.seriesId || null,
    }));

    const created = await Event.insertMany(docs);

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to create events" });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const updated = await Event.findOneAndUpdate(
      { _id: id, userId },
      {
        ...req.body,
        seriesId:
          Object.prototype.hasOwnProperty.call(req.body, "seriesId")
            ? req.body.seriesId
            : undefined,
      },
      { returnDocument: "after" },
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

router.put("/series/:seriesId", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { seriesId } = req.params;

    const update = { ...req.body };

    if (!Object.prototype.hasOwnProperty.call(update, "seriesId")) {
      delete update.seriesId;
    }

    const result = await Event.updateMany({ userId, seriesId }, update);

    res.json({
      ok: true,
      matchedCount: result.matchedCount ?? result.n ?? 0,
      modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to update series" });
  }
});

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

router.delete("/series/:seriesId", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { seriesId } = req.params;

    const result = await Event.deleteMany({ userId, seriesId });

    res.json({
      ok: true,
      deletedCount: result.deletedCount ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to delete series" });
  }
});

export default router;