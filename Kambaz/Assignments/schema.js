import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    _id: String,
    title: String,
    course: { type: String, ref: "CourseModel" },
    points: Number,
    published: { type: Boolean, default: false },
    available_from: Date,
    due: Date,
    available_until: Date,
    online_or_paper: { type: String, default: "online" },
    submission_types: { type: [String], default: [] },
    assign_to: { type: String, default: "everyone" },
    description: { type: String, default: "" },
    grading_type: { type: String, default: "points" },
    modules: { type: String, default: "" },
  },
  { collection: "assignments" }
);

export default assignmentSchema;
