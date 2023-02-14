import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recipeSchema = new Schema({
  category: { type: String, required: true },
});

export default model("Recipe", recipeSchema);
