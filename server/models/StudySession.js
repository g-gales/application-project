import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    type: {
      type: String,
      enum: ["pomodoro", "flashcards", "reading"],
      default: "pomodoro",
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("StudySession", studySessionSchema);
