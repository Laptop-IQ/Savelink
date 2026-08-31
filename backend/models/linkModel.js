import mongoose from "mongoose";
import crypto from "crypto";

const linkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      enum: ["Work", "Personal", "Reading List", "Inspiration", "Other"],
      default: "Other",
    },

    tags: {
      type: [String],
      default: [],
    },

    note: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    starred: {
      type: Boolean,
      default: false,
    },

    visits: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    shareId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);


export default mongoose.model("Link", linkSchema);
