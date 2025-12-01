import { v4 as uuidv4 } from "uuid";
import model from "./model.js";
import assignmentsSeed from "../Database/assignments.js";

export default function AssignmentsDao(db = {}) {
  const memoryAssignments = db.assignments || assignmentsSeed || [];

  const findAssignmentsForCourse = async (courseId) => {
    const assignments = await model.find({ course: courseId });
    if (assignments.length) return assignments;
    return memoryAssignments.filter((assignment) => assignment.course === courseId);
  };

  const findAssignmentById = async (assignmentId) =>
    model.findById(assignmentId) ||
    memoryAssignments.find((assignment) => assignment._id === assignmentId);

  const createAssignment = async (assignment) => {
    const newAssignment = { ...assignment, _id: uuidv4() };
    return model.create(newAssignment);
  };

  const deleteAssignment = (assignmentId) =>
    model.deleteOne({ _id: assignmentId });

  const updateAssignment = async (assignmentId, assignmentUpdates) => {
    await model.updateOne({ _id: assignmentId }, { $set: assignmentUpdates });
    return model.findById(assignmentId);
  };

  return {
    findAssignmentsForCourse,
    findAssignmentById,
    createAssignment,
    deleteAssignment,
    updateAssignment,
  };
}
