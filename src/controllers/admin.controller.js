import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CleaningRequest } from "../models/cleaningRequest.model.js";
import { Property } from "../models/property.model.js";
import { Cleaner } from "../models/cleaner.model.js";
import { sendEmail } from "../services/mail.service.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// const registerCleanerbyAdmin = async (cleanerData, localImageID) => {
// const registerCleanerbyAdmin = asyncHandler(async (req, res) => {
//   const { firstName, lastName, email, phone, DOB } = req.body;

//   if (!firstName || !lastName || !email || !phone || !DOB) {
//     throw new ApiError(400, "All fields are required");
//   }

//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     throw new ApiError(400, "Invalid email format");
//   }

//   if (!isValidPhoneNumber(phone)) {
//     throw new ApiError(400, "Invalid phone number");
//   }

//   const [day, month, year] = DOB.split("-");
//   const dateOfBirth = new Date(`${month}-${day}-${year}`);

//   // Check if the dateOfBirth is valid
//   if (isNaN(dateOfBirth.getTime())) {
//     throw new ApiError(400, "Invalid date of birth");
//   }

//   const idImage = await uploadOnCloudinary(req.file.path);

//   if (!idImage) {
//     throw new ApiError(500, "Error while uploading ID image");
//   }

//   const cleaner = await Cleaner.create({
//     firstName,
//     lastName,
//     dateOfBirth: dateOfBirth,
//     email,
//     phone,
//     phoneVerified: false,
//     idImage: idImage.url,
//     approved: false,
//   });

//   if (!cleaner) {
//     throw new ApiError(500, "Error while creating cleaner");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, cleaner, "Cleaner registered successfully"));
// });

const getAllCleaningRequests = asyncHandler(async (req, res) => {
  const cleaningRequests = await CleaningRequest.find().populate("property");

  if (!cleaningRequests) {
    throw new ApiError(404, "No cleaning requests found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        cleaningRequests,
        "Cleaning requests retrieved successfully"
      )
    );
});

const getCleaningRequestById = asyncHandler(async (req, res) => {
  const { cleaningRequestId } = req.params;

  if (!cleaningRequestId.trim()) {
    throw new ApiError(400, "Cleaning request id is required");
  }
  const cleaningRequest =
    await CleaningRequest.findById(cleaningRequestId).populate("property");
  if (!cleaningRequest) {
    throw new ApiError(
      404,
      `Cleaning request with id ${cleaningRequestId} not found`
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        cleaningRequest,
        "Cleaning request retrieved successfully"
      )
    );
});

const updateCleaningRequest = asyncHandler(async (req, res) => {
  const { cleaningRequestId } = req.params;

  const cleaningRequest = await CleaningRequest.findByIdAndUpdate(
    cleaningRequestId,
    req.body,
    { new: true }
  ).populate("property");

  if (!cleaningRequest) {
    throw new ApiError(
      404,
      `Cleaning request with id ${cleaningRequestId} not found`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        cleaningRequest,
        "Cleaning request updated successfully"
      )
    );
});

const deleteCleaningRequest = asyncHandler(async (req, res) => {
  const { cleaningRequestId } = req.params;

  const cleaningRequest =
    await CleaningRequest.findByIdAndDelete(cleaningRequestId);

  if (!cleaningRequest) {
    throw new ApiError(
      404,
      `Cleaning request with id ${cleaningRequestId} not found`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        cleaningRequest,
        "Cleaning request deleted successfully"
      )
    );
});

const getAllProperty = asyncHandler(async (req, res) => {
  const property = await Property.find({});

  if (!property) {
    throw new ApiError(404, "no Property found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, property, "property found successfully"));
});

const getPropertyById = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  if (!propertyId.trim()) {
    throw new ApiError(400, "Cleaning request id is required");
  }

  const property = await Property.findById(propertyId);

  if (!property) {
    throw new ApiError(404, `Property request with id ${propertyId} not found`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, property, "property retrieved successfully"));
});

const getAllCleaner = asyncHandler(async (req, res) => {
  const cleaner = await Cleaner.find({});
  if (!cleaner) {
    throw new ApiError(404, "No cleaner found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, cleaner, "Cleaner found successfully"));
});

const getCleanerById = asyncHandler(async (req, res) => {
  const { cleanerId } = req.params;
  if (!cleanerId.trim()) {
    throw new ApiError(400, "Cleaner id is required");
  }
  const cleaner = await Cleaner.findById(cleanerId);
  if (!cleaner) {
    throw new ApiError(404, `Cleaner with id ${cleanerId} not found`);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, cleaner, "Cleaner retrieved successfully"));
});

export {
  // registerCleanerbyAdmin,
  getAllCleaningRequests,
  getCleaningRequestById,
  updateCleaningRequest,
  deleteCleaningRequest,
  getAllProperty,
  getPropertyById,
  getAllCleaner,
  getCleanerById,
};
