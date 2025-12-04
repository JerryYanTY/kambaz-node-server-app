import mongoose from "mongoose";
import moduleSchema from "../Modules/schema.js";
const courseSchema = new mongoose.Schema({
   _id: String,
   name: String,
   number: String,
   credits: Number,
   description: String,
   image: String,
   owner: { type: String, ref: "UserModel" },
   modules: [moduleSchema],
 },
 { collection: "courses" }
);
export default courseSchema;
