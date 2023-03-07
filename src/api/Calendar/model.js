import mongoose from "mongoose";

const { Schema, model } = mongoose;

const calendarSchema = new Schema({
  menus: [{ type: Schema.Types.ObjectId, ref: "Menu", required: true }],
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export default model("Calendar", calendarSchema);
