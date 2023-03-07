import mongoose from "mongoose";

const { Schema, model } = mongoose;

const menuSchema = new Schema({
  recipes: [{ type: Schema.Types.ObjectId, ref: "Recipe", required: true }],
  planDate: { type: Date, required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  calendar: { type: Schema.Types.ObjectId, ref: "Calendar" },
});

export default model("Menu", menuSchema);
