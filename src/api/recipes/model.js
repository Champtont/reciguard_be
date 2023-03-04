import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recipeSchema = new Schema({
  categoryTags: [{ type: Object, required: true }],
  title: { type: String, required: true },
  photo: {
    type: String,
    required: false,
    default: "https://cdn-icons-png.flaticon.com/512/135/135161.png",
  },
  description: { type: String, required: false },
  ingredients: [{ type: Object, required: false }],
  instructions: [{ type: Object, required: false }],
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export default model("Recipe", recipeSchema);
