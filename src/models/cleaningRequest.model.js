import mongoose from "mongoose";

const cleaningRequestSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    requesterName: {
      type: String,
      required: true,
    },
    requesterContactInfo: {
      type: String,
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    propertyAddress: {
      type: String,
      required: true,
    },
    gpsLocation: {
      type: String,
      required: true,
    },
    devicePhoto: String,
    additionalNotes: {
      type: String,
      default: "",
    },
    requestStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    assignedCleaner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cleaner",
    },
    completionDate: Date,
    completionTime: Date,

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export const CleaningRequest = mongoose.model(
  "CleaningRequest",
  cleaningRequestSchema
);
