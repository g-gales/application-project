import mongoose from "mongoose";

const wellnessEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    mood: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    stress: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    sleepHours: {
      type: Number,
      required: true,
      min: 0,
      max: 12,
    },
    focus: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

// Prevent duplicate check-ins for the same user on the same day
wellnessEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("WellnessEntry", wellnessEntrySchema);
