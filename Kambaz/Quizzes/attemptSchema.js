import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    _id: String,
    quiz: { type: String, ref: "QuizModel" },
    course: { type: String, ref: "CourseModel" },
    user: { type: String, ref: "UserModel" },
    answers: {},
    score: Number,
    maxPoints: Number,
    submittedAt: { type: Date, default: Date.now },
  },
  { collection: "quiz_attempts" }
);

export default attemptSchema;
