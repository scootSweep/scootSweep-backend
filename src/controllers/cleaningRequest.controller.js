import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CleaningRequest } from "../models/cleaningRequest.model.js";
import { Property } from "../models/property.model.js";
import { Cleaner } from "../models/cleaner.model.js";
import { sendEmail } from "../services/mail.service.js";
// import { sendSMS } from "../utils/sendSMS.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createCleaningRequest = asyncHandler(async (req, res, next) => {
  const {
    requesterName,
    requesterContactInfo,
    propertyAddress,
    gpsLocation,
    additionalNotes,
  } = req.body;

  const propertyId = req.property._id;

  const requiredFields = [
    propertyId,
    requesterName,
    requesterContactInfo,
    propertyAddress,
    gpsLocation,
  ];
  const devicePhoto = req.file.path;
  if (!propertyId) {
    throw new ApiError(400, `Property id is required`);
  }

  const missingFields = requiredFields.filter((field) => !field);

  if (missingFields.length) {
    return next(
      new ApiError(400, `Missing required fields: ${missingFields.join(", ")}`)
    );
  }

  const propertyExists = await Property.findById(propertyId);

  if (!propertyExists) {
    throw new ApiError(404, `Property with id ${propertyId} not found`);
  }

  const devicePhotoUrl = await uploadOnCloudinary(devicePhoto);

  if (!devicePhotoUrl) {
    throw new ApiError(500, "Error while uploading device photo");
  }

  const newCleaningRequest = await CleaningRequest.create({
    property: propertyId,
    requesterName,
    requesterContactInfo,
    propertyAddress,
    gpsLocation,
    devicePhoto: devicePhotoUrl.url,
    additionalNotes,
  });

  if (!newCleaningRequest) {
    throw new ApiError(500, "Error while submiting cleaning Request");
  }

  const freeCleaners = await Cleaner.find({ isAvailable: true });
  const data = {
    requesterName,
    requesterContactInfo,
    propertyAddress,
    gpsLocation,
    devicePhoto: devicePhotoUrl.url,
    additionalNotes,
    requestStatus: newCleaningRequest.requestStatus,
    requestDate: newCleaningRequest.requestDate,
  };
  freeCleaners.forEach(async (cleaner) => {
    await sendEmail(
      cleaner.email,
      "New Cleaning Request",
      "request_email_tamplate",
      data
    );
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newCleaningRequest,
        "cleaning request submited successfully"
      )
    );
});

const getCleaningRequests = asyncHandler(async (req, res) => {
  const cleaningRequests = await CleaningRequest.find({}).populate("property");

  return res
    .status(200)
    .json(new ApiResponse(200, cleaningRequests, "Cleaning requests fetched"));
});

export { createCleaningRequest, getCleaningRequests };
