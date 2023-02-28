import express from "express";
import createHttpError from "http-errors";
import q2m from "query-to-mongo";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWTAuthMiddleware } from "../../lib/auth/jwtAuth.js";
import { adminOnlyMiddleware } from "../../lib/auth/adminAuth.js";
import RecipesModel from "./model.js";
import UsersModel from "../users/model.js";

const recipesRouter = express.Router();

//****Recipe Endpoints****

//Post a new Recipe
recipesRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const newRecipe = new RecipesModel({
      ...req.body,
      author: req.user._id,
    });

    const recipeToInsert = newRecipe;
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.user._id,
      { $push: { recipeBook: recipeToInsert } },
      { new: true, runValidators: true }
    );
    if (newRecipe && updatedUser) {
      console.log(req.user._id);
      const { _id } = await newRecipe.save();
      res.send(updatedUser);
    }
  } catch (error) {
    next(error);
  }
});

//Get All recipes
recipesRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const recipes = await RecipesModel.find(mongoQuery.criteria).populate({
      path: "author",
      select: ["firstName", "avatar"],
    });
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

//get a single recipe
recipesRouter.get("/:recipeId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const recipe = await RecipesModel.findById(req.params.recipeId).populate({
      path: "author",
      select: ["firstName", "avatar"],
    });

    if (recipe) {
      res.status(200).send(recipe);
    } else {
      next(
        createHttpError(
          404,
          `No recipe with id ${req.params.recipeId} was found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

//Delete a single recipe... ADMIN Only
recipesRouter.delete(
  "/:recipeId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { $pull: { recipeBook: req.params.recipeId } },
        { new: true, runValidators: true }
      );
      const recipeToDelete = await RecipesModel.findByIdAndDelete(
        req.params.recipeId
      );
      if (updatedUser && recipeToDelete) {
        res.send(updatedUser);
      } else {
        next(
          createHttpError(404, `User with id ${req.user._id} was not found`)
        );
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

//Change Recipe Photo
const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "ReciGaurd_food",
    },
  }),
}).single("photo");

recipesRouter.post(
  "/:recipeId/photo",
  JWTAuthMiddleware,
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const recipe = await RecipesModel.findByIdAndUpdate(
        req.params.recipeId,
        { photo: req.file.path },
        { new: true }
      );
      if (!recipe)
        next(
          createError(404, `No recipe with the id of ${req.params.recipeId}`)
        );
      res.status(201).send(recipe);
    } catch (error) {
      res.send(error);
      next(error);
    }
  }
);

export default recipesRouter;
