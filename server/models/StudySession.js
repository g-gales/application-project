// this model will be for completed study sessions with duration, startTime, type, courseId, userId etc.

const StudySession = {
  userId: ObjectId,
  courseId: ObjectId, // Links to INFO-5145
  type: { type: String, enum: ["pomodoro", "flashcards", "reading"] },
  durationMinutes: Number,
  startTime: Date,
};
