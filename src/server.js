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

/*
const corsOptions = {
  origin: 'https://reciguard.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

server.set("trust proxy",1);

{
    origin: ["https://reciguard.vercel.app"], // Allow frontend origins
    methods: "GET,POST,PUT,DELETE,OPTIONS", // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true,
    options: "*"
}
*/

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
