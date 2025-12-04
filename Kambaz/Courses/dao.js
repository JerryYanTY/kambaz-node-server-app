import { v4 as uuidv4 } from "uuid";
import model from "./model.js";
import EnrollmentModel from "../Enrollments/model.js";

export default function CoursesDao(db = {}) {
  const memoryCourses = db.courses || [];
  const memoryEnrollments = db.enrollments || [];

  async function findAllCourses() {
    return model.find({}, { name: 1, description: 1, image: 1, owner: 1 });
  }

  async function findCoursesForOwner(ownerId) {
    return model.find({ owner: ownerId });
  }

  async function findCoursesForEnrolledUser(userId) {
    const enrollments = await EnrollmentModel.find({ user: userId });
    const courseIds = enrollments.map((e) => e.course);
    if (courseIds.length === 0) return [];
    return model.find({ _id: { $in: courseIds } });
  }

  function createCourse(course) {
    const newCourse = { ...course, _id: uuidv4() };
    return model.create(newCourse);
  }
  async function deleteCourse(courseId) {
    await EnrollmentModel.deleteMany({ course: courseId });
    return model.deleteOne({ _id: courseId });
  }

  function updateCourse(courseId, courseUpdates) {
    return model.updateOne({ _id: courseId }, { $set: courseUpdates });
  }

  return {
    findAllCourses,
    findCoursesForOwner,
    findCoursesForEnrolledUser,
    createCourse,
    deleteCourse,
    updateCourse,
  };
}
