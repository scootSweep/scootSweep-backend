import mongoose from "mongoose";

const illegalDocklessSchema = new mongoose.Schema(
  {
    cleaner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cleaner",
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // reason: {
    //   type: String,
    //   enum: [
    //     "Unauthorized Parking",
    //     "Private Property",
    //     "unauthorized parking",
    //     "private property",
    //   ],
    //   required: true,
    // },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    operatorName: {
      type: String,
      enum: ["Bird", "Lime", "Veo", "Spin"],
      required: true,
    },
    typeOfDevice: {
      type: String,
      enum: ["Scooter", "Bike", "Car", "eBike", "eScooter", "eCar"],
      required: true,
    },
    deviceID: {
      type: String,
      required: true,
    },
    deviceIDImage: String,
    // unauthorizedParkingImage: String,
    gpsLocation: {
      type: String,
      required: true,
    },
    // authorizationStatus: {
    //   type: Boolean,
    //   default: false,
    // },
    invoiceStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
    paymentDate: Date,
    // paymentAmount: Number,
    additionalNotes: String,
    invoiceNumber: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const IllegalDockless = mongoose.model(
  "IllegalDockless",
  illegalDocklessSchema
);
