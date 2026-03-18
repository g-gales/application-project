import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    front: {
      type: String,
      required: [true, "Flashcard front is required"],
      trim: true,
    },
    back: {
      type: String,
      required: [true, "Flashcard back is required"],
      trim: true,
    },
    timesReviewed: {
      type: Number,
      default: 0,
    },
    timesCorrect: {
      type: Number,
      default: 0,
    },
    timesIncorrect: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const flashcardDeckSchema = new mongoose.Schema(
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
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Deck title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    term: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    cards: {
      type: [flashcardSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("FlashcardDeck", flashcardDeckSchema);
