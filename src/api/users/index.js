import express from "express";
import createHttpError from "http-errors";
import passport from "passport";
import { adminOnlyMiddleware } from "../../lib/auth/adminOnly.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwtAuth.js";
import { createAccessToken } from "../../lib/auth/tools.js";
import UsersModel from "./model.js";

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
authorsRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authorsRouter.get(
  "/googleRedirect",
  passport.authenticate("google", { session: false }),
  async (req, res, next) => {
    console.log(req.user);
    res.send({ accessToken: req.user.accessToken });
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
usersRouter.delete("/session", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await UsersModel.findByIdAndUpdate(req.user._id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
//Get My Info
usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id);
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
    const recipes = await recipesModel
      .find({
        host: req.user._id,
      })
      .populate({ path: "author", select: "firstName avatar" });

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
//Delete one of my recipies
export default usersRouter;
