import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  saveWellnessEntry,
  getWellnessEntries,
} from "../controllers/wellnessController.js";

const router = express.Router();

router.post("/", protect, saveWellnessEntry);
router.get("/", protect, getWellnessEntries);

export default router;
