import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    index: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true,
    index: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  authProvider: {
    type: String,
    enum: ["firebase", "legacy"],
    default: "firebase",
  },
  name: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    enum: ["en", "hi"],
    default: "hi",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
