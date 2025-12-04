import express from "express";
import Hello from "./hello.js";
import Lab5 from "./Lab5/index.js";
import cors from "cors";
import db from "./Kambaz/Database/index.js";
import UserRoutes from "./Kambaz/Users/routes.js";
import "dotenv/config";
import session from "express-session";
import mongoose from "mongoose";

import CourseRoutes from "./Kambaz/Courses/routes.js";
import AssignmentRoutes from "./Kambaz/Assignments/routes.js";
import ModulesRoutes from "./Kambaz/Modules/routes.js";
import EnrollmentRoutes from "./Kambaz/Enrollments/routes.js";
import QuizzesRoutes from "./Kambaz/Quizzes/routes.js";

const CONNECTION_STRING = process.env.DATABASE_CONNECTION_STRING || "mongodb://localhost/kambaz";
mongoose.connect(CONNECTION_STRING);

const app = express();

// Support comma-separated client origins for CORS (e.g., prod + local)
const allowedOrigins = (process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "kambaz",
  resave: false,
  saveUninitialized: false,
};
if (process.env.SERVER_ENV !== "development") {
  app.set("trust proxy", 1);
  sessionOptions.proxy = true;
  sessionOptions.cookie = {
    sameSite: "none",
    secure: true,
  };
}


app.use(session(sessionOptions));

app.use(express.json());
UserRoutes(app, db);
CourseRoutes(app, db);
AssignmentRoutes(app);
ModulesRoutes(app, db);
EnrollmentRoutes(app);
QuizzesRoutes(app);

Lab5(app);
Hello(app);
app.listen(process.env.PORT || 4000);
