import express from "express";
import createHttpError from "http-errors";
import passport from "passport";
import q2m from "query-to-mongo";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { adminOnlyMiddleware } from "../../lib/auth/adminAuth.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwtAuth.js";
import { createAccessToken } from "../../lib/auth/tools.js";
import UsersModel from "./model.js";
import RecipesModel from "../recipes/model.js";
import MenusModel from "../Menu/model.js";
import { model } from "mongoose";
import mongooseDeepPopulate from "mongoose-deep-populate";

const usersRouter = express.Router();
//*********User Endpoints******
//register
usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body);
    const { _id } = await newUser.save();
    if ({ _id }) {
      const payload = { _id: newUser._id, role: newUser.role };
      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    }
  } catch (error) {
    next(error);
  }
});
//googleEnd points
usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

usersRouter.get(
  "/googleRedirect",
  passport.authenticate("google", { session: false }),
  async (req, res, next) => {
    console.log(req.user);
    res.redirect(`${process.env.FE_URL}/${req.user.accessToken}`);
  }
);
//logIn
usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UsersModel.checkCredentials(email, password);

    if (user) {
      const payload = { _id: user._id, role: user.role };

      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    } else {
      next(createHttpError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});
//logOut
usersRouter.get("/logout", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id);
    res.clearCookie("jwt");
    await user.save();
    res.status(200).send({ message: "You're logged out" });
  } catch (error) {
    next(error);
  }
});
//Get My Info
usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id)
      .populate([
        {
          path: "calendar",
          model: "Menu",
          populate: { path: "recipes", model: "Recipe" },
        },
      ])
      .populate("recipeBook")
      .populate([
        {
          path: "shoppingMenus",
          populate: { path: "recipes", model: "Recipe" },
        },
      ]);
    res.send(user);
  } catch (error) {
    next(error);
  }
});
//Edit My info
usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      next(createError(404, `User with id ${req.user._id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});
//Edit My profile pic
const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "ReciGaurd_profiles",
    },
  }),
}).single("avatar");

usersRouter.post(
  "/me/avatar",
  JWTAuthMiddleware,
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const user = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { avatar: req.file.path },
        { new: true }
      );
      if (!user)
        next(createError(404, `No user wtih the id of ${req.user._id}`));
      res.status(201).send(user);
    } catch (error) {
      res.send(error);
      next(error);
    }
  }
);
//*********Recipe Endpoints*****
//Get All My recipes
usersRouter.get("/me/recipes", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const recipes = await RecipesModel.find({
      author: req.user._id,
    }).populate({ path: "author", select: "firstName avatar" });

    if (recipes) {
      res.send(recipes);
    } else {
      next(
        createHttpError(
          404,
          `No recipes hosted by user ${req.user._id} were found.`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
//Edit My recipes
usersRouter.put("/me/:recipeId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedRecipe = await RecipesModel.findByIdAndUpdate(
      req.params.recipeId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedRecipe) {
      res.send(updatedRecipe);
    } else {
      next(
        createError(404, `Recipe with id ${req.params.recipeId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});
//Delete one of my recipies
usersRouter.delete(
  "/me/:recipeId",
  JWTAuthMiddleware,
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
          createHttpError(
            404,
            `Recipe with id ${req.params.recipeId} was not found`
          )
        );
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

export default usersRouter;

/*** NEW FEATURES****/
//Post A Menu - this creates a "menu event that should be pushed into the user calendar.menus"
usersRouter.post(
  "/calendar/:date",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const newDailyMenu = new MenusModel({
        ...req.body,
        planDate: new Date(`${req.params.date}`), //don't forget to check this out
        author: req.user._id,
      });

      const menuToInsert = newDailyMenu;
      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { $push: { calendar: menuToInsert } },
        { new: true, runValidators: true }
      );
      if (newDailyMenu && updatedUser) {
        console.log(req.user._id);
        const { _id } = await newDailyMenu.save();
        res.send(updatedUser);
      }
    } catch (error) {
      next(error);
    }
  }
);
//get all of My menus
usersRouter.get("/calendar", JWTAuthMiddleware, async (req, res, next) => {
  const mongoQuery = q2m(req.query);
  try {
    const menus = await MenusModel.find(
      { author: req.user._id },
      mongoQuery.criteria
    ).populate();
    res.status(200).send(menus);
  } catch (error) {
    next(error);
  }
});
//get Menus within a date range
usersRouter.get(
  "/calendar/:start/:end",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const menus = await MenusModel.find({
        author: req.user._id,
        planDate: { $gte: req.params.start, $lte: req.params.end },
      }).populate({
        path: "recipes",
      });
      const updateUser = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { shoppingMenus: menus },
        { new: true, runValidators: true }
      );
      if (menus && updateUser) {
        res.status(200).send(menus);
      }
    } catch (error) {
      next(error);
    }
  }
);
//get specific menu
usersRouter.get(
  "/calendar/:menuId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const menu = await MenusModel.findById(req.params.menuId).populate({
        path: "recipes",
      });
      res.status(200).send(menu);
    } catch (error) {
      next(error);
    }
  }
);
//edit menu
usersRouter.put(
  "/calendar/:menuId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const updatedMenu = await MenusModel.findByIdAndUpdate(
        req.params.menuId,
        req.body,
        { new: true, runValidators: true }
      );
      if (updatedMenu) {
        res.send(updatedMenu);
      } else {
        next(createError(404, `Menu with id ${req.params.menuId} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);
//delete a menu
usersRouter.delete(
  "/calendar/:menuId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { $pull: { calendar: req.params.menuId } },
        { new: true, runValidators: true }
      );
      const menuToDelete = await MenusModel.findByIdAndDelete(
        req.params.menuId
      );
      if (updatedUser && menuToDelete) {
        res.send(updatedUser);
      } else {
        next(
          createHttpError(
            404,
            `Menu with id ${req.params.menuId} was not found`
          )
        );
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);
//shopping list stuff
//post a list
usersRouter.post("/list", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const listToInsert = req.body;
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.user._id,
      { list: listToInsert },
      { new: true, runValidators: true }
    );
    if (listToInsert && updatedUser) {
      res.send(updatedUser);
    }
  } catch (error) {
    next(error);
  }
});
