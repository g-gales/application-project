import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  dueDate: { type: String, required: true },
  estimatedMinutes: { type: Number, default: 60 },
  minutesCompleted: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["not-started", "in-progress", "done"],
    default: "not-started",
  },
  notes: { type: String, default: "" },
});

export default mongoose.model("Assignment", assignmentSchema);
