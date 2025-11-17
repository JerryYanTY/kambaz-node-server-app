import UsersDao from "./dao.js";
import EnrollmentsDao from "../Enrollments/dao.js";

export default function UserRoutes(app, db) {
  const dao = UsersDao(db);
  const enrollmentsDao = EnrollmentsDao(db);

  const createUser = (req, res) => {
    const newUser = dao.createUser(req.body);
    res.json(newUser);
  };
  const deleteUser = (req, res) => {
    const { userId } = req.params;
    enrollmentsDao.deleteEnrollmentsByUser(userId);
    const status = dao.deleteUser(userId);
    res.json(status);
  };
  
  const findAllUsers = (req, res) => {
    const users = dao.findAllUsers();
    res.json(users);
  };
  const findUserById = (req, res) => {
    const { userId } = req.params;
    const user = dao.findUserById(userId);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.json(user);
  };
  const updateUser = (req, res) => {
    const userId = req.params.userId;
    const userUpdates = req.body;
    const currentUser = dao.updateUser(userId, userUpdates);
    req.session["currentUser"] = currentUser;
    res.json(currentUser);
  };
  const signup = (req, res) => {
    const user = dao.findUserByUsername(req.body.username);
    if (user) {
      res.status(400).json({ message: "Username already in use" });
      return;
    }
    const currentUser = dao.createUser(req.body);
    req.session["currentUser"] = currentUser;
    res.json(currentUser);
  };
  const signin = (req, res) => {
    const { username, password } = req.body;
    const currentUser = dao.findUserByCredentials(username, password);
    if (currentUser) {
      req.session["currentUser"] = currentUser;
      res.json(currentUser);
    } else {
      res.status(401).json({ message: "Unable to login. Try again later." });
    }
  };
  const signout = (req, res) => {
    req.session.destroy();
    res.sendStatus(200);
  };
  const profile = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }
    res.json(currentUser);
  };

  const findUsersForCourse = (req, res) => {
    const { courseId } = req.params;
    const enrollments = enrollmentsDao.findEnrollmentsForCourse(courseId);
    const userIds = enrollments.map((e) => e.user);
    const users = dao.findAllUsers().filter((u) => userIds.includes(u._id));
    res.json(users);
  };

  const createUserForCourse = (req, res) => {
    const { courseId } = req.params;
    const newUser = dao.createUser(req.body);
    enrollmentsDao.enrollUserInCourse(newUser._id, courseId);
    res.json(newUser);
  };

  app.post("/api/users", createUser);
  app.get("/api/users", findAllUsers);
  app.get("/api/users/:userId", findUserById);
  app.put("/api/users/:userId", updateUser);
  app.delete("/api/users/:userId", deleteUser);
  app.post("/api/users/signup", signup);
  app.post("/api/users/signin", signin);
  app.post("/api/users/signout", signout);
  app.post("/api/users/profile", profile);

  app.get("/api/courses/:courseId/users", findUsersForCourse);
  app.post("/api/courses/:courseId/users", createUserForCourse);
}
