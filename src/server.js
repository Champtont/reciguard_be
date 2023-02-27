import express from "express";
import cors from "cors";
import passport from "passport";
import googleStrategy from "./lib/auth/google.js";
import {
  badRequestHandler,
  genericErrorHandler,
  notFoundHandler,
} from "./errorHandlers.js";
import usersRouter from "./api/users/index.js";
import recipesRouter from "./api/recipes/index.js";

const server = express();

passport.use("google", googleStrategy);

// * MIDDLEWARES *
server.use(cors());
server.use(express.json());
server.use(passport.initialize());

// **** ENDPOINTS ****
server.use("/users", usersRouter);
server.use("/recipes", recipesRouter);

// ** ERROR HANDLERS **
server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

export default server;
