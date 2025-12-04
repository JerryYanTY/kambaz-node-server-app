import { v4 as uuidv4 } from "uuid";
import model from "./model.js";
import EnrollmentModel from "../Enrollments/model.js";

export default function CoursesDao(db = {}) {
  const memoryCourses = db.courses || [];
  const memoryEnrollments = db.enrollments || [];

  async function findAllCourses() {
    const courses = await model.find(
      {},
      { name: 1, description: 1, image: 1, owner: 1 }
    );
    if (courses.length) return courses;
    return memoryCourses;
  }

  async function findCoursesForOwner(ownerId) {
    const courses = await model.find({ owner: ownerId });
    if (courses.length) return courses;
    return memoryCourses.filter((course) => course.owner === ownerId);
  }

  async function findCoursesForEnrolledUser(userId) {
    const enrollments = await EnrollmentModel.find({ user: userId });
    if (enrollments.length) {
      const courseIds = enrollments.map((e) => e.course);
      return model.find({ _id: { $in: courseIds } });
    }
    // fallback to in-memory seed data
    const enrolledIds = new Set(
      memoryEnrollments.filter((e) => e.user === userId).map((e) => e.course)
    );
    return memoryCourses.filter((course) => enrolledIds.has(course._id));
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
