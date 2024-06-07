import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CleaningInvoice } from "../models/cleaningInvoice.model.js";
import { Property } from "../models/property.model.js";
import { Cleaner } from "../models/cleaner.model.js";
import { ContactInfo } from "../models/contactInfo.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidPhoneNumber } from "../utils/validation.js";
import { isValidObjectId } from "mongoose";

const Dashboard = asyncHandler(async (req, res) => {
  // calculate the statistics like number of Cleaning Invoice, number of properties, number of cleaners, number of verified phone number for properties. using mongo aggregate

  // cal the number of Cleaning Invoice with status pending with count of totalCleaningInvoice

  const totalCleaningInvoice = await CleaningInvoice.aggregate([
    {
      $match: {
        invoiceStatus: "Pending",
      },
    },
    {
      $group: {
        _id: null,
        totalCleaningInvoice: { $sum: 1 },
      },
    },
  ]);

  // number of properties, number of cleaners, number of verified phone number for properties
  const totalProperties = await Property.countDocuments({});
  const totalCleaners = await Cleaner.countDocuments({});
  const verifiedProperties = await Property.aggregate([
    {
      $match: {
        phoneVerified: true,
      },
    },
    {
      $group: {
        _id: null,
        totalVerifiedPhoneNumbers: { $sum: 1 },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCleaningInvoice,
        totalProperties,
        totalCleaners,
        verifiedProperties,
      },
      "Dashboard statistics retrieved successfully"
    )
  );
});

const registerCleanerbyAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, DOB } = req.body;

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
  if (req.file === undefined) {
    throw new ApiError(400, "ID image is required");
  }
  const image = await uploadOnCloudinary(req.file.path);

  if (!image) {
    throw new ApiError(500, "Error while uploading ID image");
  }

  const cleaner = await Cleaner.create({
    firstName,
    lastName,
    dateOfBirth: dateOfBirth,
    email,
    phone,
    phoneVerified: false,
    idImage: image.url,
    approved: false,
  });

  if (!cleaner) {
    throw new ApiError(500, "Error while creating cleaner");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, cleaner, "Cleaner registered successfully"));
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

const createContactInfo = asyncHandler(async (req, res) => {
  const { companyName, firstName, lastName, title, email, secondaryEmail } =
    req.body;

  const requiredFields = [
    { name: "companyName", value: companyName },
    { name: "firstName", value: firstName },
    { name: "lastName", value: lastName },
    { name: "title", value: title },
    { name: "email", value: email },
  ];

  // Find the first missing field and throw an error if any field is missing
  const missingField = requiredFields.find(
    (field) => field.value === undefined || field.value.trim() === ""
  );

  if (missingField) {
    throw new ApiError(400, `Field ${missingField.name} is required`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const existingEmail = await ContactInfo.findOne({ email: email });

  if (existingEmail) {
    throw new ApiError(400, "Email already exists");
  }
  const contactInfo = await ContactInfo.create({
    companyName,
    firstName,
    lastName,
    title,
    email,
    secondaryEmail,
  });

  if (!contactInfo) {
    throw new ApiError(500, "Error while creating contact info");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, contactInfo, "Contact info created successfully")
    );
});

const getAllContactInfo = asyncHandler(async (req, res) => {
  const contactInfo = await ContactInfo.find({});
  if (!contactInfo) {
    throw new ApiError(404, "No contact info found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, contactInfo, "Contact info found successfully"));
});

const deleteContactInfo = asyncHandler(async (req, res) => {
  const { contactInfoId } = req.params;

  if (!isValidObjectId(contactInfoId)) {
    throw new ApiError(400, "Contact info id is required");
  }

  const contactInfo = await ContactInfo.findByIdAndDelete(contactInfoId);
  if (!contactInfo) {
    throw new ApiError(404, `Contact info with id ${contactInfoId} not found`);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, contactInfo, "Contact info deleted successfully")
    );
});

export {
  Dashboard,
  registerCleanerbyAdmin,
  getAllProperty,
  getPropertyById,
  getAllCleaner,
  getCleanerById,
  createContactInfo,
  getAllContactInfo,
  deleteContactInfo,
};
