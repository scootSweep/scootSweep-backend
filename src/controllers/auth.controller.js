import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Property } from "../models/property.model.js";
import { sendOtp, verifyOtp } from "../services/otp.service.js";
import propertyService from "../services/property.service.js";
import cleanerService from "../services/cleaner.service.js";
import { Cleaner } from "../models/cleaner.model.js";

// Options for setting cookies
const cookieOptions = {
  // making the cookie not modifiable by client only sever can modify it
  httpOnly: true, // Make cookies accessible only via HTTP(S)
  secure: true, // Ensure cookies are only sent over HTTPS
};

const generatorAccessAndRefreshTokenForproperty = async (propertyId) => {
  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    const accessToken = property.generateAccessToken();
    const refreshToken = property.generateRefreshToken();

    property.refreshToken = refreshToken;
    await property.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh tokens"
    );
  }
};
// sendOTP
const sendOtpToContact = asyncHandler(async (req, res) => {
  const { number } = req.body;

  if (!number) {
    throw new ApiError(400, "Phone number is required");
  }
  const otp = await sendOtp(number);

  if (!otp) {
    throw new ApiError(500, "error while sending otp");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { otp }, "otp sent successfully"));
});

// Property-Auth

const registerProperty = asyncHandler(async (req, res) => {
  const property = await propertyService.createProperty(req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, property, "property registered successfully"));
});

const verifyPropertyContact = asyncHandler(async (req, res) => {
  await propertyService.verifyContact(req.body);

  return res.status(200).json(new ApiResponse(200, "number is verified"));
});

const loginProperty = asyncHandler(async (req, res) => {
  const property = await propertyService.login(req.body);

  const { accessToken, refreshToken } =
    await generatorAccessAndRefreshTokenForproperty(property._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "you are login"));
});

// Cleaner-Auth
// src/controllers/auth.controller.js

const generatorAccessAndRefreshTokenForCleaner = async (cleanerId) => {
  try {
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) {
      throw new Error("Property not found");
    }

    const accessToken = cleaner.generateAccessToken();
    const refreshToken = cleaner.generateRefreshToken();

    cleaner.refreshToken = refreshToken;
    await cleaner.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh tokens"
    );
  }
};

const registerCleaner = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "ID image is required");
  }
  const image = req.file.path;
  if (!image) {
    throw new ApiError(400, "ID image is required");
  }
  const cleaner = await cleanerService.createCleaner(req.body, image);

  return res
    .status(200)
    .json(new ApiResponse(200, cleaner, "Cleaner created successfully"));
});

const verifyCleanerContact = asyncHandler(async (req, res) => {
  await cleanerService.verifyContact(req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "cleaner number is verified"));
});

const loginCleaner = asyncHandler(async (req, res) => {
  const cleaner = await cleanerService.login(req.body);

  const { accessToken, refreshToken } =
    await generatorAccessAndRefreshTokenForCleaner(cleaner._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "you are login"));
});

export {
  sendOtpToContact,
  registerProperty,
  registerCleaner,
  loginProperty,
  verifyPropertyContact,
  verifyCleanerContact,
  loginCleaner,
};
