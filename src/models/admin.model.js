import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unquie: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    default: "admin",
  },
  mobile: {
    type: String,
    required: true,
  },
  administeredProperties: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
  },
  accessedRequests: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CleaningRequest",
  },
  approvedCleaners: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cleaner",
  },
  handledInvoices: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CleaningInvoice",
  },
  refreshToken: {
    type: String,
  },
});

adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

adminSchema.methods.generateRefreshToken = function () {
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

export const admin = mongoose.model("Admin", adminSchema);
