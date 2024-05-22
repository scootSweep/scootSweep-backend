import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Property } from "../models/property.model.js";
import { verifyOtp } from "../services/otp.service.js";
import { isValidPhoneNumber } from "../utils/validation.js";

const createProperty = async (propertyData) => {
  const {
    propertyName,
    propertyAddress,
    gpsLocation,
    firstName,
    lastName,
    role,
    email,
    phone,
  } = propertyData;

  const requiredFields = [
    propertyName,
    propertyAddress,
    gpsLocation,
    firstName,
    lastName,
    role,
    email,
    phone,
  ];

  const missingField = requiredFields.some(
    (field) => field === undefined || field?.trim() === ""
  );

  if (missingField) {
    throw new ApiError(400, `Field ${missingField} is required`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (!isValidPhoneNumber(phone)) {
    throw new ApiError(400, "Invalid phone number");
  }

  const validRoles = ["owner", "manager", "resident"];

  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const property = await Property.create({
    propertyName,
    propertyAddress,
    gpsLocation,
    firstName,
    lastName,
    role,
    email,
    phone,
    phoneVerified: false,
  });

  if (!property) {
    throw new ApiError(500, "Some went wrong while registering the property");
  }

  return property;
};

const verifyContact = async (details) => {
  const { number, otp } = details;

  if (!number || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }
  if (!isValidPhoneNumber(number)) {
    throw new ApiError(400, "Invalid phone number");
  }

  if (!verifyOtp(otp)) {
    throw new ApiError(400, "Invalid otp");
  }

  const property = await Property.findOne({ phone: number });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  const propertyOwner = await Property.findByIdAndUpdate(
    property._id,
    {
      phoneVerified: true,
    },
    { new: true }
  );

  if (!propertyOwner) {
    throw new ApiError(500, "error while verifying otp");
  }
  return propertyOwner;
};

const login = async (details) => {
  const { number, otp } = details;

  if (!number || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  if (!isValidPhoneNumber(number)) {
    throw new ApiError(400, "Invalid phone number");
  }

  if (!verifyOtp(otp)) {
    throw new ApiError(300, "otp is not correct");
  }
  const property = await Property.findOne({ phone: number }).select(
    "-refreshToken"
  );

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  return property;
};

const propertyService = {
  createProperty,
  verifyContact,
  login,
};

export default propertyService;

// export { createProperty, loginPropertySide, propertyContactVerify };
