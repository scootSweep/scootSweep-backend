import { ApiError } from "../utils/ApiError.js";
import { Cleaner } from "../models/cleaner.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidPhoneNumber } from "../utils/validation.js";
import { verifyOtp } from "../services/otp.service.js";

// src/services/cleaner.service.js
const createCleaner = async (cleanerData, localImageID) => {
  const { firstName, lastName, email, phone, DOB } = cleanerData;

  if (!firstName || !lastName || !email || !phone || !DOB) {
    throw new ApiError(400, "All fields are required");
  }

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

  const idImage = await uploadOnCloudinary(localImageID);

  if (!idImage) {
    throw new ApiError(500, "Error while uploading ID image");
  }

  const cleaner = await Cleaner.create({
    firstName,
    lastName,
    dateOfBirth: dateOfBirth,
    email,
    phone,
    phoneVerified: false,
    idImage: idImage.url,
    approved: false,
  });

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

  const cleaner = await Cleaner.findOne({ phone: number });

  if (!cleaner) {
    throw new ApiError(404, "Cleaner not found");
  }

  return cleaner;
};

const cleanerService = {
  createCleaner,
  verifyContact,
  login,
};

export default cleanerService;

// export { createCleaner, verifyContact, login };
