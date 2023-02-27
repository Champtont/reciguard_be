import express from "express";
import createHttpError from "http-errors";
import { JWTAuthMiddleware } from "../../lib/auth/jwtAuth.js";
import RecipesModel from "./model.js";

const recipesRouter = express.Router();

//****Recipe Endpoints****

//Post a new Recipe
recipesRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const newRecipe = new RecipesModel({
      ...req.body,
      author: req.user._id,
    });
    const { _id } = await newRecipe.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//Get All recipes
recipesRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const recipes = await RecipesModel.find().populate({
      path: "author",
      select: ["firstName", "avatar"],
    });
    res.status(200).send(accommodations);
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

export default recipesRouter;
