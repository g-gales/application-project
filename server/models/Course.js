import mongoose from "mongoose";

// FIXME: modifying model to fit the Courses component, might need to change this later

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
    credits: { type: Number, default: 3 },

    // optional fields
    // semester: {
    //   type: String,
    //   enum: ["Fall", "Spring", "Summer", "Winter"],
    // },
    // year: {
    //   type: Number,
    //   default: new Date().getFullYear(),
    // },
  },
  { timestamps: true },
);

export default mongoose.model("Course", courseSchema);
