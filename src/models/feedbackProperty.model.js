import mongoose from "mongoose";

const feedbackPropertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FeedbackProperty = mongoose.model(
  "FeedbackProperty",
  feedbackPropertySchema
);
