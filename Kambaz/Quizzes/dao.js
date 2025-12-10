import { v4 as uuidv4 } from "uuid";
import quizModel from "./model.js";
import attemptModel from "./attemptModel.js";
import quizzesSeed from "../Database/quizzes.js";

export default function QuizzesDao(db = {}) {
  const memoryQuizzes = db.quizzes || quizzesSeed || [];
  const memoryAttempts = db.quizAttempts || [];
  let seeded = false;

  const ensureSeeded = async () => {
    if (seeded) return;
    const count = await quizModel.countDocuments();
    if (count === 0 && memoryQuizzes.length) {
      await quizModel.insertMany(memoryQuizzes);
    }
    seeded = true;
  };

  const findQuizzesForCourse = async (courseId) => {
    await ensureSeeded();
    const quizzes = await quizModel.find({ course: courseId });
    if (quizzes.length) return quizzes;
    return memoryQuizzes.filter((quiz) => quiz.course === courseId);
  };

  const findQuizById = async (quizId) => {
    await ensureSeeded();
    const quiz = await quizModel.findById(quizId);
    if (quiz) return quiz;
    return memoryQuizzes.find((quiz) => quiz._id === quizId);
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
    try {
      return await quizModel.create(newQuiz);
    } catch (e) {
      memoryQuizzes.push(newQuiz);
      return newQuiz;
    }
  };

  const updateQuiz = async (quizId, quizUpdates) => {
    const sanitizedQuestions = (quizUpdates.questions || []).map((q) => ({
      _id: q._id || uuidv4(),
      ...q,
    }));
    try {
      await quizModel.updateOne(
        { _id: quizId },
        {
          $set: {
            ...quizUpdates,
            questions: sanitizedQuestions,
          },
        }
      );
      const dbQuiz = await quizModel.findById(quizId);
      if (dbQuiz) return dbQuiz;
    } catch (e) {
      // fall through to memory
    }
    const idx = memoryQuizzes.findIndex((q) => q._id === quizId);
    if (idx >= 0) {
      memoryQuizzes[idx] = { ...memoryQuizzes[idx], ...quizUpdates, questions: sanitizedQuestions };
      return memoryQuizzes[idx];
    }
    return null;
  };

  const deleteQuiz = async (quizId) => {
    try {
      await attemptModel.deleteMany({ quiz: quizId });
      return await quizModel.deleteOne({ _id: quizId });
    } catch (e) {
      const idx = memoryQuizzes.findIndex((q) => q._id === quizId);
      if (idx >= 0) {
        memoryQuizzes.splice(idx, 1);
      }
      for (let i = memoryAttempts.length - 1; i >= 0; i -= 1) {
        if (memoryAttempts[i].quiz === quizId) {
          memoryAttempts.splice(i, 1);
        }
      }
      return { acknowledged: true, deletedCount: idx >= 0 ? 1 : 0 };
    }
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
    try {
      return await attemptModel.create(attempt);
    } catch (e) {
      memoryAttempts.push(attempt);
      return attempt;
    }
  };

  const findAttemptsForQuiz = async (quizId) => {
    const attempts = await attemptModel.find({ quiz: quizId });
    if (attempts.length) return attempts;
    return memoryAttempts.filter((a) => a.quiz === quizId);
  };

  const findAttemptsForQuizAndUser = async (quizId, userId) => {
    const attempts = await attemptModel
      .find({ quiz: quizId, user: userId })
      .sort({ submittedAt: -1 });
    if (attempts.length) return attempts;
    return memoryAttempts
      .filter((a) => a.quiz === quizId && a.user === userId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
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
