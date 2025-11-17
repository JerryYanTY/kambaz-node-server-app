import { v4 as uuidv4 } from "uuid";
export default function EnrollmentsDao(db) {
  function enrollUserInCourse(userId, courseId) {
    const { enrollments } = db;
    const alreadyEnrolled = enrollments.some(
      (enrollment) => enrollment.user === userId && enrollment.course === courseId
    );
    if (alreadyEnrolled) return enrollments.find(
      (enrollment) => enrollment.user === userId && enrollment.course === courseId
    );
    const newEnrollment = { _id: uuidv4(), user: userId, course: courseId };
    enrollments.push(newEnrollment);
    return newEnrollment;
  }
  function unenrollUserFromCourse(userId, courseId) {
    const { enrollments } = db;
    db.enrollments = enrollments.filter(
      (enrollment) => !(enrollment.user === userId && enrollment.course === courseId)
    );
    return { status: "ok" };
  }
  
  function deleteEnrollmentsByUser(userId) {
    db.enrollments = db.enrollments.filter((enrollment) => enrollment.user !== userId);
    return { status: "ok" };
  }
  function findEnrollmentsForCourse(courseId) {
    return db.enrollments.filter((enrollment) => enrollment.course === courseId);
  }
  function findEnrollmentsForUser(userId) {
    return db.enrollments.filter((enrollment) => enrollment.user === userId);
  }
  return {
    enrollUserInCourse,
    unenrollUserFromCourse,
    deleteEnrollmentsByUser,
    findEnrollmentsForCourse,
    findEnrollmentsForUser,
  };
}
