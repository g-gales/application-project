import express from "express";
import Course from "../models/Course.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // .countDocuments forces server and mongo connection to fire
    // in order to wake render.com
    const count = await Course.countDocuments();
    res.json({ status: "online", message: "Server and DB are warm", count });
  } catch (error) {
    res.status(500).json({ status: "error", message: "DB cold start failed" });
  }
});

export default router;
