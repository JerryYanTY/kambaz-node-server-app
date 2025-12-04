import QuizzesDao from "./dao.js";
import EnrollmentModel from "../Enrollments/model.js";
import CourseModel from "../Courses/model.js";

export default function QuizzesRoutes(app) {
  const dao = QuizzesDao();

  const requireCurrentUser = (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return null;
    }
    return currentUser;
  };

  const requireFaculty = (req, res) => {
    const currentUser = requireCurrentUser(req, res);
    if (!currentUser) return null;
    if (currentUser.role !== "FACULTY" && currentUser.role !== "ADMIN") {
      res.sendStatus(403);
      return null;
    }
    return currentUser;
  };

  const findQuizzesForCourse = async (req, res) => {
    const { courseId } = req.params;
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }
    if (currentUser.role !== "FACULTY" && currentUser.role !== "ADMIN") {
      const enrollment = await EnrollmentModel.findOne({
        course: courseId,
        user: currentUser._id,
      });
      if (!enrollment) {
        res.sendStatus(403);
        return;
      }
    } else {
      const course = await CourseModel.findById(courseId);
      if (course && course.owner && course.owner !== currentUser._id) {
        // allow admins; for faculty ensure ownership
        if (currentUser.role !== "ADMIN") {
          res.sendStatus(403);
          return;
        }
      }
    }
    const quizzes = await dao.findQuizzesForCourse(courseId);
    res.json(quizzes);
  };

  const findQuizById = async (req, res) => {
    const { quizId } = req.params;
    const quiz = await dao.findQuizById(quizId);
    if (!quiz) {
      res.sendStatus(404);
      return;
    }
    res.json(quiz);
  };

  const createQuiz = async (req, res) => {
    const currentUser = requireFaculty(req, res);
    if (!currentUser) return;
    const { courseId } = req.params;
    const quiz = { ...req.body, course: courseId, owner: currentUser._id };
    const newQuiz = await dao.createQuiz(quiz);
    res.json(newQuiz);
  };

  const updateQuiz = async (req, res) => {
    const currentUser = requireFaculty(req, res);
    if (!currentUser) return;
    const { quizId } = req.params;
    const updated = await dao.updateQuiz(quizId, req.body);
    res.json(updated);
  };

  const deleteQuiz = async (req, res) => {
    const currentUser = requireFaculty(req, res);
    if (!currentUser) return;
    const { quizId } = req.params;
    const status = await dao.deleteQuiz(quizId);
    res.json(status);
  };

  const submitAttempt = async (req, res) => {
    const currentUser = requireCurrentUser(req, res);
    if (!currentUser) return;
    const { quizId } = req.params;
    const answers = req.body.answers || {};
    const preview = req.body.preview === true;
    const quiz = await dao.findQuizById(quizId);
    if (!quiz) {
      res.sendStatus(404);
      return;
    }
    const now = new Date();
    if (!preview) {
      if (quiz.available_from && now < new Date(quiz.available_from)) {
        res.status(403).json({ message: "Quiz not available yet." });
        return;
      }
      if (quiz.available_until && now > new Date(quiz.available_until)) {
        res.status(403).json({ message: "Quiz is closed." });
        return;
      }
      if (!quiz.published) {
        res.status(403).json({ message: "Quiz is not published." });
        return;
      }
    }
    if (preview && (currentUser.role === "FACULTY" || currentUser.role === "ADMIN")) {
      const graded = await dao.gradePreview(quizId, answers);
      res.json(graded);
      return;
    }

    const maxAttempts = quiz.multipleAttempts ? quiz.maxAttempts || 1 : 1;
    const attempts = await dao.findAttemptsForQuizAndUser(quizId, currentUser._id);
    if (attempts.length >= maxAttempts) {
      res.status(403).json({ message: "No attempts remaining." });
      return;
    }

    const attempt = await dao.createAttempt(quizId, currentUser._id, answers);
    if (!attempt) {
      res.sendStatus(404);
      return;
    }
    res.json(attempt);
  };

  const findAttemptsForQuiz = async (req, res) => {
    const currentUser = requireFaculty(req, res);
    if (!currentUser) return;
    const { quizId } = req.params;
    const attempts = await dao.findAttemptsForQuiz(quizId);
    res.json(attempts);
  };

  const findAttemptsForCurrentUser = async (req, res) => {
    const currentUser = requireCurrentUser(req, res);
    if (!currentUser) return;
    const { quizId } = req.params;
    const attempts = await dao.findAttemptsForQuizAndUser(
      quizId,
      currentUser._id
    );
    res.json(attempts);
  };

  app.get("/api/courses/:courseId/quizzes", findQuizzesForCourse);
  app.get("/api/quizzes/:quizId", findQuizById);
  app.post("/api/courses/:courseId/quizzes", createQuiz);
  app.put("/api/quizzes/:quizId", updateQuiz);
  app.delete("/api/quizzes/:quizId", deleteQuiz);

  app.post("/api/quizzes/:quizId/attempts", submitAttempt);
  app.get("/api/quizzes/:quizId/attempts", findAttemptsForQuiz);
  app.get("/api/quizzes/:quizId/attempts/current", findAttemptsForCurrentUser);
}
