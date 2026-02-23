import mongoose from "mongoose";

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
    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: ["Fall", "Spring", "Summer", "Winter"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      default: new Date().getFullYear(),
    },
    // not required
    description: String,
    // stats for analysis and querying from the frontend
    targetHoursPerWeek: { type: Number, default: 0 },
    credits: { type: Number, default: 3 },

    color: { type: String, default: "#3b82f6" },
  },
  { timestamps: true },
);

export default mongoose.model("Course", courseSchema);
