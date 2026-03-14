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
    durationMinutes: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["pomodoro", "flashcards", "reading"],
      default: "pomodoro",
    },
  },
  { timestamps: true },
);

export default mongoose.model("StudySession", studySessionSchema);
