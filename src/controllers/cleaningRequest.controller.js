import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CleaningRequest } from "../models/cleaningRequest.model.js";
import { Property } from "../models/property.model.js";
import { Cleaner } from "../models/cleaner.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendSMS } from "../utils/sendSMS.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createCleaningRequest = asyncHandler(async (req, res, next) => {
  const {
    propertyId,
    requesterName,
    requesterContactInfo,
    propertyAddress,
    gpsLocation,
    devicePhoto,
    additionalNotes,
  } = req.body;

  const requiredFields = [
    propertyId,
    requesterName,
    requesterContactInfo,
    propertyAddress,
    gpsLocation,
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);

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

  const newCleaningRequest = await CleaningRequest.create({
    property: propertyId,
    requesterName,
    requesterContactInfo,
    propertyAddress,
    gpsLocation,
    devicePhoto: devicePhotoUrl.url,
    additionalNotes: "",
  });

  if (!newCleaningRequest) {
    throw new ApiError(500, "Error while submiting cleaning Request");
  }

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

export { createCleaningRequest };
