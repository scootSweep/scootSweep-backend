import mongoose from "mongoose";

const cleaningInvoiceSchema = new mongoose.Schema(
  {
    cleaner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cleaner",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
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
    unauthorizedParkingImage: String,
    gpsLocation: {
      type: String,
      required: true,
    },
    authorizationStatus: {
      type: Boolean,
      default: false,
    },
    invoiceStatus: {
      type: String,
      enum: ["Pending", "Paid", "Unpaid"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
    paymentDate: Date,
    paymentAmount: Number,
    additionalNotes: String,
  },
  { timestamps: true }
);

export const CleaningInvoice = mongoose.model(
  "CleaningInvoice",
  cleaningInvoiceSchema
);
