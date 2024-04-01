import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Property } from "../models/property.model.js";
import { sendOtp } from "../services/otp.service.js";
import propertyService from "../services/property.service.js";
import cleanerService from "../services/cleaner.service.js";
import { Cleaner } from "../models/cleaner.model.js";
import { Admin } from "../models/admin.model.js";
import { sendEmail } from "../services/mail.service.js";
import { generateOtp } from "../services/otp.service.js";

import adminService from "../services/admin.service.js";

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

const logoutProperty = asyncHandler(async (req, res) => {
  await Property.findByIdAndUpdate(
    req.property._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "property logged out"));
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

const logoutCleaner = asyncHandler(async (req, res) => {
  await Cleaner.findByIdAndUpdate(
    req.cleaner._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "cleaner logged out"));
});

// admin-Auth

const sendOtptoMail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const otp = generateOtp();

  if (!otp) {
    throw new ApiError(500, "error while sending otp");
  }

  const data = {
    otp,
    validity: "10 minutes",
    companyName: "Cleanex",
  };

  const mail = await sendEmail(
    email,
    "OTP for Email Verification",
    "otp_email_template",
    data
  );

  if (!mail) {
    throw new ApiError(500, "error while sending otp");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, mail, ` ${otp} otp sent successfully`));
});

const generatorAccessAndRefreshTokenForAdmin = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error("Property not found");
    }

    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh tokens"
    );
  }
};

const registerAdmin = asyncHandler(async (req, res) => {
  const admin = await adminService.createAdmin(req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, admin, "Admin created successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  await adminService.verifyMail(req.body);

  return res.status(200).json(new ApiResponse(200, "admin number is verified"));
});

const loginAdmin = asyncHandler(async (req, res) => {
  const admin = await adminService.loginAdmin(req.body);

  const { accessToken, refreshToken } =
    await generatorAccessAndRefreshTokenForAdmin(admin._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "you are login"));
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.admin._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "admin logged out"));
});

export {
  sendOtpToContact,
  registerProperty,
  registerCleaner,
  verifyPropertyContact,
  loginProperty,
  logoutProperty,
  verifyCleanerContact,
  loginCleaner,
  logoutCleaner,
  sendOtptoMail,
  registerAdmin,
  verifyEmail,
  loginAdmin,
  logoutAdmin,
};
