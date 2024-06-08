import mongoose from "mongoose";

const redeploymentSchema = new mongoose.Schema(
  {
    cleaner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cleaner",
      required: true,
    },

    operatorName: {
      type: String,
      enum: ["Bird", "Lime", "Veo", "Spin"],
      required: true,
    },
    deviceID: {
      type: String,
      required: true,
    },
    deviceIDImage: String,
    additionalNotes: String,
    invoiceNumber: {
      type: Number,
      required: true,
    },
    redeployDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Redeployment = mongoose.model("Redeployment", redeploymentSchema);
