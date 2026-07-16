import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"]
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    },
    geminiApiKey: {
      type: String,
      default: ""
    },
    language: {
      type: String,
      enum: ["bn", "en"],
      default: "bn"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
