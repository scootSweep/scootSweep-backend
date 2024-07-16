import mongoose from "mongoose";

const feedbackCleanerSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cleaner",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FeedbackCleaner = mongoose.model(
  "FeedbackCleaner",
  feedbackCleanerSchema
);
