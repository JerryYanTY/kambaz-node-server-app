import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function EnrollmentsDao() {
  const enrollUserInCourse = async (userId, courseId, extra = {}) => {
    const existing = await model.findOne({ user: userId, course: courseId });
    if (existing) return existing;
    const newEnrollment = {
      _id: uuidv4(),
      user: userId,
      course: courseId,
      ...extra,
    };
    return model.create(newEnrollment);
  };

  const unenrollUserFromCourse = (userId, courseId) =>
    model.deleteOne({ user: userId, course: courseId });

  const deleteEnrollmentsByUser = (userId) =>
    model.deleteMany({ user: userId });

  const findEnrollmentsForCourse = (courseId) =>
    model.find({ course: courseId });

  const findEnrollmentsForUser = (userId) => model.find({ user: userId });

  return {
    enrollUserInCourse,
    unenrollUserFromCourse,
    deleteEnrollmentsByUser,
    findEnrollmentsForCourse,
    findEnrollmentsForUser,
  };
}
