import mongoose from "mongoose";

import Assignment from "./Assignment.js";

const courseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: { type: String, required: true },
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    color: { type: String, default: "#3b82f6" },

    term: { type: String, required: true },
    termStart: { type: String, required: true },
    termEnd: { type: String, required: true },

    // not required
    description: String,
    // stats for analysis and querying from the frontend
    weeklyGoalMinutes: { type: Number, default: 120 },
    pomodoroStudyTime: { type: Number, default: 0 }, // pomodoro study time
    credits: { type: Number, default: 3 },
  },
  { timestamps: true },
);

// if course is deleted, delete assignments too
courseSchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    await Assignment.deleteMany({ courseId: doc._id });
  }
  next();
});

export default mongoose.model("Course", courseSchema);
