import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  picture: String,
  settings: {
    // added workload limits for calculating % of work being done for summary/burnout alerts
    darkMode: { type: Boolean, default: false },
    dailyWorkloadLimit: { type: Number, default: 300 }, // in minutes (5 hours)
    weeklyWorkloadLimit: { type: Number, default: 1500 }, // in minutes (25 hours)
    summaryFrequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "weekly",
    },
    defaultPomodoroTime: { type: Number, default: 25 },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
