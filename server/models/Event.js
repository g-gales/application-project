import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date },
    allDay: { type: Boolean, default: false },
    seriesId: { type: String, default: null },

    extendedProps: {
      courseId: { type: String },
      type: {
        type: String,
        enum: ["meeting", "study", "assignment", "event"],
        default: "event",
      },
      notes: { type: String },
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Event", eventSchema);