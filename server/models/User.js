// TODO: USER schema
// 1. create mongoose schema for user
// 2. add fields as per wiki specs
// 3. export the model

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  // FIXME: Optional Profile Picture provided by Google as URL
  picture: String,
  settings: {
    darkMode: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
