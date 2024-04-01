import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

import { Property } from "../models/property.model.js";
import { Cleaner } from "../models/cleaner.model.js";
import { Admin } from "../models/admin.model.js";

const verifyJWT = async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    return decodedToken;
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
};

const verifyAdmin = asyncHandler(async (req, _, next) => {
  const decodedToken = await verifyJWT(req);
  const admin = await Admin.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );

  if (!admin) {
    throw new ApiError(401, "Invalid Access Token");
  }

  req.admin = admin;
  next();
});

const verifyCleaner = asyncHandler(async (req, _, next) => {
  const decodedToken = await verifyJWT(req);
  const cleaner = await Cleaner.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );

  if (!cleaner) {
    throw new ApiError(401, "Invalid Access Token");
  }

  req.cleaner = cleaner;
  next();
});

const verifyProperty = asyncHandler(async (req, _, next) => {
  const decodedToken = await verifyJWT(req);
  const property = await Property.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );

  if (!property) {
    throw new ApiError(401, "Invalid Access Token");
  }

  req.property = property;
  next();
});

export { verifyAdmin, verifyCleaner, verifyProperty };
