import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Schema for property sign up
const propertySchema = new mongoose.Schema(
  {
    propertyName: {
      type: String,
      required: true,
    },
    propertyAddress: {
      type: String,
      required: true,
    },
    gpsLocation: {
      type: String,
      required: true,
    },
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
      default: 1,
    },
    role: {
      type: String,
      enum: ["owner", "manager", "resident", "Owner", "Manager", "Resident"],
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      require: true,
    },
    phone: {
      type: String,
      required: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

propertySchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      phone: this.phone,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

propertySchema.methods.generateRefreshToken = function () {
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

export const Property = mongoose.model("Property", propertySchema);
