import createHttpError from "http-errors";
import atob from "atob";
import UsersModel from "../../api/users/model.js";

export const basicAuthMiddleware = async (req, res, next) => {
  if (!req.headers.authorization) {
    next(
      createHttpError(
        401,
        "Please provide credentials in the Authorization header!"
      )
    );
  } else {
    const encodedCredentials = req.headers.authorization.split(" ")[1];

    const credentials = atob(encodedCredentials);

    const [email, password] = credentials.split(":");

    const user = await UsersModel.checkCredentials(email, password);
    if (user) {
      req.author = user;
      next();
    } else {
      next(createHttpError(401, "Credentials not ok!"));
    }
  }
};
