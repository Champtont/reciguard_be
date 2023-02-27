import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recipeSchema = new Schema({
  categoryTags: [{ type: String, required: true }],
  title: { type: String, required: true },
  photo: {
    type: String,
    required: false,
    default: "https://cdn-icons-png.flaticon.com/512/135/135161.png",
  },
  description: { type: String, required: false },
  ingredients: [{ type: String, required: false }],
  instructions: [{ type: String, required: false }],
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export default model("Recipe", recipeSchema);
