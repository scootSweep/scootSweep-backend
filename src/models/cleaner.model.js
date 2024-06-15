import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const cleanerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userType: {
      type: Number,
      default: 0,
    },
    dateOfBirth: Date,
    isAvailable: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    isMailVerified: {
      type: Boolean,
      default: false,
    },
    idImage: String,
    approved: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

cleanerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      phone: this.phone, // Include phone number instead of email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

cleanerSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Cleaner = mongoose.model("Cleaner", cleanerSchema);
