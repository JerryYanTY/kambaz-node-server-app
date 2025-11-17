import EnrollmentsDao from "./dao.js";

export default function EnrollmentRoutes(app, db) {
  const dao = EnrollmentsDao(db);

  const enrollInCourse = (req, res) => {
    let { userId } = req.body;
    const { courseId } = req.params;
    if (!userId) {
      const currentUser = req.session["currentUser"];
      if (!currentUser) {
        res.sendStatus(401);
        return;
      }
      userId = currentUser._id;
    }
    const enrollment = dao.enrollUserInCourse(userId, courseId);
    res.json(enrollment);
  };

  const unenrollFromCourse = (req, res) => {
    let { userId } = req.params;
    const { courseId } = req.params;
    if (userId === "current") {
      const currentUser = req.session["currentUser"];
      if (!currentUser) {
        res.sendStatus(401);
        return;
      }
      userId = currentUser._id;
    }
    const status = dao.unenrollUserFromCourse(userId, courseId);
    res.json(status);
  };

  const findEnrollmentsForCourse = (req, res) => {
    const { courseId } = req.params;
    const enrollments = dao.findEnrollmentsForCourse(courseId);
    res.json(enrollments);
  };

  const findEnrollmentsForUser = (req, res) => {
    let { userId } = req.params;
    if (userId === "current") {
      const currentUser = req.session["currentUser"];
      if (!currentUser) {
        res.sendStatus(401);
        return;
      }
      userId = currentUser._id;
    }
    const enrollments = dao.findEnrollmentsForUser(userId);
    res.json(enrollments);
  };

  app.post("/api/courses/:courseId/enrollments", enrollInCourse);
  app.delete(
    "/api/courses/:courseId/enrollments/:userId",
    unenrollFromCourse
  );
  app.get("/api/courses/:courseId/enrollments", findEnrollmentsForCourse);
  app.get("/api/users/:userId/enrollments", findEnrollmentsForUser);
}
