import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cleaner } from "../models/cleaner.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidPhoneNumber } from "../utils/validation.js";
import { verifyOtp } from "../services/otp.service.js";
import { Property } from "../models/property.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// src/services/cleaner.service.js
const createCleaner = async (cleanerData) => {
  const { firstName, lastName, email, phone, DOB, idImage } = cleanerData;

  const requiredFields = [
    { name: "firstName", value: firstName },
    { name: "lastName", value: lastName },
    { name: "email", value: email },
    { name: "phone", value: phone },
    { name: "DOB", value: DOB },
  ];

  // Find the first missing field and throw an error if any field is missing
  const missingField = requiredFields.find(
    (field) => field.value === undefined || field.value.trim() === ""
  );

  if (missingField) {
    throw new ApiError(400, `Field ${missingField.name} is required`);
  }

  const buffer = Buffer.from(idImage, "base64");
  // if (!buffer) {
  //   throw new ApiError(400, "Invalid signature");
  // }

  const tempFilePath = path.join(__dirname, "temp_image.jpg");
  fs.writeFileSync(tempFilePath, buffer);

  const Image = await uploadOnCloudinary(tempFilePath);

  // if (!Image) {
  //   throw new ApiError(500, "Error while uploading ID image");
  // }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (!isValidPhoneNumber(phone)) {
    throw new ApiError(400, "Invalid phone number");
  }

  const [day, month, year] = DOB.split("-");
  const dateOfBirth = new Date(`${month}-${day}-${year}`);

  // Check if the dateOfBirth is valid
  if (isNaN(dateOfBirth.getTime())) {
    throw new ApiError(400, "Invalid date of birth");
  }

  const cleaner = await Cleaner.create({
    firstName,
    lastName,
    dateOfBirth: dateOfBirth,
    email,
    phone,
    phoneVerified: false,
    idImage: Image ? Image.url : "",
    approved: false,
  });

  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  if (!cleaner) {
    throw new ApiError(500, "Error while creating cleaner");
  }

  return cleaner; // Return the created cleaner object
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
  const cleaner = await Cleaner.findOne({ phone: number });

  if (!cleaner) {
    throw new ApiError(404, "Cleaner not found");
  }

  const updatedCleaner = await Cleaner.findByIdAndUpdate(
    cleaner._id,
    {
      phoneVerified: true,
    },
    { new: true }
  );

  if (!updatedCleaner) {
    throw new ApiError(500, "Error while verifying phone number");
  }

  return updatedCleaner;
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
    throw new ApiError(400, "Invalid otp");
  }

  const cleaner = await Cleaner.findOne({ phone: number }).select(
    "-refreshToken"
  );

  if (!cleaner) {
    throw new ApiError(404, "Cleaner not found");
  }

  return cleaner;
};

const getAllPropertyLocation = asyncHandler(async (req, res) => {
  const properties = await Property.find().select(
    "-email -signature -phoneVerified -refreshToken "
  );

  if (!properties) {
    throw new ApiError(404, "Properties not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, properties, "Properties found"));
});

const cleanerService = {
  createCleaner,
  verifyContact,
  login,
  getAllPropertyLocation,
};

export default cleanerService;

// export { createCleaner, verifyContact, login };
