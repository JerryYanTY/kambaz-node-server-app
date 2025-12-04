import { v4 as uuidv4 } from "uuid";
import quizModel from "./model.js";
import attemptModel from "./attemptModel.js";
import quizzesSeed from "../Database/quizzes.js";

export default function QuizzesDao(db = {}) {
  const seedQuizzes = db.quizzes || quizzesSeed || [];
  let seeded = false;

  const ensureSeeded = async () => {
    if (seeded) return;
    const count = await quizModel.countDocuments();
    if (count === 0 && seedQuizzes.length) {
      await quizModel.insertMany(seedQuizzes);
    }
    seeded = true;
  };

  const findQuizzesForCourse = async (courseId) => {
    await ensureSeeded();
    const quizzes = await quizModel.find({ course: courseId });
    return quizzes;
  };

  const findQuizById = async (quizId) => {
    await ensureSeeded();
    return quizModel.findById(quizId);
  };

  const createQuiz = async (quiz) => {
    const newQuiz = {
      ...quiz,
      _id: uuidv4(),
      questions: (quiz.questions || []).map((q) => ({
        _id: q._id || uuidv4(),
        ...q,
      })),
      quizType: quiz.quizType || "GRADED_QUIZ",
      assignmentGroup: quiz.assignmentGroup || "QUIZZES",
      shuffleAnswers:
        quiz.shuffleAnswers === undefined ? true : quiz.shuffleAnswers,
      timeLimitMinutes: quiz.timeLimitMinutes ?? 20,
      multipleAttempts: quiz.multipleAttempts ?? false,
      maxAttempts: quiz.maxAttempts ?? 1,
      showCorrectAnswers: quiz.showCorrectAnswers ?? "Immediately",
      accessCode: quiz.accessCode ?? "",
      oneQuestionAtATime:
        quiz.oneQuestionAtATime === undefined ? true : quiz.oneQuestionAtATime,
      webcamRequired: quiz.webcamRequired ?? false,
      lockQuestionsAfterAnswering:
        quiz.lockQuestionsAfterAnswering ?? false,
    };
    return quizModel.create(newQuiz);
  };

  const updateQuiz = async (quizId, quizUpdates) => {
    const sanitizedQuestions = (quizUpdates.questions || []).map((q) => ({
      _id: q._id || uuidv4(),
      ...q,
    }));
    await quizModel.updateOne(
      { _id: quizId },
      {
        $set: {
          ...quizUpdates,
          questions: sanitizedQuestions,
        },
      }
    );
    return quizModel.findById(quizId);
  };

  const deleteQuiz = async (quizId) => {
    await attemptModel.deleteMany({ quiz: quizId });
    return quizModel.deleteOne({ _id: quizId });
  };

  const gradeAttempt = (quiz, answers) => {
    const normalize = (val) => String(val ?? "").toLowerCase().trim();
    const total = (quiz.questions || []).reduce(
      (sum, q) => sum + (Number(q.points) || 0),
      0
    );
    const score = (quiz.questions || []).reduce((sum, q) => {
      const provided = normalize(answers?.[q._id]);
      const candidates = Array.isArray(q.correctOption)
        ? q.correctOption
        : q.type === "FILL_BLANK" && Array.isArray(q.options)
          ? q.options
          : [q.correctOption ?? ""];
      const match = candidates.some((c) => {
        const expected = normalize(c);
        return expected && provided && expected === provided;
      });
      if (match) {
        return sum + (Number(q.points) || 0);
      }
      return sum;
    }, 0);
    return { score, maxPoints: total };
  };

  const gradePreview = async (quizId, answers) => {
    const quiz = await findQuizById(quizId);
    if (!quiz) return null;
    const { score, maxPoints } = gradeAttempt(quiz, answers);
    return {
      quiz: quizId,
      course: quiz.course,
      answers,
      score,
      maxPoints,
    };
  };

  const createAttempt = async (quizId, userId, answers) => {
    const quiz = await findQuizById(quizId);
    if (!quiz) return null;
    const { score, maxPoints } = gradeAttempt(quiz, answers);
    const attempt = {
      _id: uuidv4(),
      quiz: quizId,
      course: quiz.course,
      user: userId,
      answers,
      score,
      maxPoints,
      submittedAt: new Date(),
    };
    return attemptModel.create(attempt);
  };

  const findAttemptsForQuiz = async (quizId) => {
    return attemptModel.find({ quiz: quizId });
  };

  const findAttemptsForQuizAndUser = async (quizId, userId) => {
    return attemptModel
      .find({ quiz: quizId, user: userId })
      .sort({ submittedAt: -1 });
  };

  return {
    findQuizzesForCourse,
    findQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    createAttempt,
    gradePreview,
    findAttemptsForQuiz,
    findAttemptsForQuizAndUser,
  };
}
