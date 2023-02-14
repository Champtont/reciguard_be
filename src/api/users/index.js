import express from "express";
import createHttpError from "http-errors";
import passport from "passport";
import { adminOnlyMiddleware } from "../../lib/auth/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwtAuth.js";
import { createAccessToken } from "../../lib/auth/tools.js";
import UserModel from "./model.js";

const usersRouter = express.Router();
export default usersRouter;
