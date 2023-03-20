import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const usersSchema = new Schema(
  {
    firstName: { type: String, required: true },
    password: { type: String, required: false },
    email: { type: String, required: false },
    googleId: { type: String, required: false },
    avatar: {
      type: String,
      required: false,
      default:
        "https://t3.ftcdn.net/jpg/03/39/45/96/360_F_339459697_XAFacNQmwnvJRqe1Fe9VOptPWMUxlZP8.jpg",
    },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    recipeBook: [
      { type: Schema.Types.ObjectId, ref: "Recipe", required: false },
    ],
    calendar: [{ type: Schema.Types.ObjectId, ref: "Menu", required: false }],
    shoppingMenus: { type: Object, required: false },
    list: { type: Object, required: false },
    favorites: [
      { type: Schema.Types.ObjectId, ref: "Recipe", required: false },
    ],
  },
  {
    timestamps: true,
  }
);

usersSchema.pre("save", async function (next) {
  const currentUser = this;

  if (currentUser.isModified("password")) {
    const plainPW = currentUser.password;
    const hash = await bcrypt.hash(plainPW, 11);
    currentUser.password = hash;
  }
  next();
});

usersSchema.methods.toJSON = function () {
  const userDocument = this;
  const user = userDocument.toObject();

  delete user.password;
  delete user.createdAt;
  delete user.updatedAt;
  delete user.__v;
  return user;
};

usersSchema.static("checkCredentials", async function (email, password) {
  const user = await this.findOne({ email });

  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

export default model("User", usersSchema);
