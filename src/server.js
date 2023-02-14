import express from "express";
import cors from "cors";
import passport from "passport";
import googleStrategy from "./lib/auth/google.js";
import {
  badRequestHandler,
  genericErrorHandler,
  notFoundHandler,
} from "./errorHandlers.js";

const server = express();

passport.use("google", googleStrategy);

// * MIDDLEWARES *
server.use(cors());
server.use(express.json());
server.use(passport.initialize());

// **** ENDPOINTS ****

// ** ERROR HANDLERS **
server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

export default server;
