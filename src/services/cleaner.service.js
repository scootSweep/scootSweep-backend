import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cleaner } from "../models/cleaner.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidPhoneNumber } from "../utils/validation.js";
import { sendOtp } from "../services/otp.service.js";
import { verifyOtp } from "../services/otp.service.js";
import { Property } from "../models/property.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CleaningInvoice } from "../models/cleaningInvoice.model.js";
import { ContactInfo } from "../models/contactInfo.model.js";
import { sendEmail } from "../services/mail.service.js";
import { getNextSequenceValue } from "../utils/invoiceCounter.js";
import { Redeployment } from "../models/redeployment.model.js";
import { isValidObjectId } from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let doorFlag = false;
let invoiceNum = 0;
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
  const properties = await Property.find().select("-refreshToken ");

  if (!properties) {
    throw new ApiError(404, "Properties not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, properties, "Properties found"));
});

const createCleaningInvoice = asyncHandler(async (req, res) => {
  const {
    reason,
    operatorName,
    deviceID,
    deviceIDImage,
    unauthorizedParkingImage,
    gpsLocation,
    authorizationStatus,
    invoiceStatus,
    paymentStatus,
    paymentAmount,
    additionalNotes,
  } = req.body;

  // if (!req.cleaner.phoneVerified) {
  //   throw new ApiError(400, "Phone number is not verified");
  // }

  const requiredFields = [
    { name: "reason", value: reason },
    { name: "operatorName", value: operatorName },
    { name: "deviceID", value: deviceID },
    { name: "deviceIDImage", value: deviceIDImage },
    { name: "gpsLocation", value: gpsLocation },
    { name: "authorizationStatus", value: authorizationStatus },
    { name: "invoiceStatus", value: invoiceStatus },
    { name: "paymentStatus", value: paymentStatus },
    { name: "paymentAmount", value: paymentAmount },
  ];

  const missingField = requiredFields.find(
    (field) => field.value === undefined || field.value.trim() === ""
  );

  if (missingField) {
    throw new ApiError(400, `Field ${missingField.name} is required`);
  }

  const tempimage = Buffer.from(deviceIDImage, "base64");
  const tempimage2 = Buffer.from(unauthorizedParkingImage, "base64");

  const deviceIDImagePath = path.join(__dirname, "temp_deviceID_image.jpeg");
  const unauthorizedParkingImagePath = path.join(
    __dirname,
    "temp_unauthorized_parking_image.jpeg"
  );

  fs.writeFileSync(deviceIDImagePath, tempimage);
  fs.writeFileSync(unauthorizedParkingImagePath, tempimage2);

  const deviceIDImageCloudinary = await uploadOnCloudinary(deviceIDImagePath);
  const unauthorizedParkingImageCloudinary = await uploadOnCloudinary(
    unauthorizedParkingImagePath
  );

  const invoiceNumber = await getNextSequenceValue("cleaningInvoice");

  const cleaningInvoice = await CleaningInvoice.create({
    cleaner: req.cleaner._id,
    reason,
    operatorName,
    deviceID,
    deviceIDImage: deviceIDImageCloudinary.url || "",
    unauthorizedParkingImage: unauthorizedParkingImageCloudinary.url || "",
    gpsLocation,
    authorizationStatus,
    invoiceStatus,
    paymentStatus,
    paymentAmount,
    additionalNotes,
    invoiceNumber,
  });

  if (fs.existsSync(deviceIDImagePath)) {
    fs.unlinkSync(deviceIDImagePath);
  }
  if (fs.existsSync(unauthorizedParkingImagePath)) {
    fs.unlinkSync(unauthorizedParkingImagePath);
  }

  const contactInfo = await ContactInfo.find({});
  const emailList = contactInfo.map((info) => info.email);

  const [latitude, longitude] = gpsLocation.split(",");
  const googleMapsApiKey = process.env.GOOGLE_MAP_API_KEY;
  const violationLocationImage = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=14&size=400x400&key=${googleMapsApiKey}`;

  const emailPromises = emailList.map(async (email) => {
    await sendEmail(
      email,
      "Cleaning Invoice",
      "cleaningInvoice_template",
      { ...cleaningInvoice.toObject(), violationLocationImage } // Pass the violationLocationImage to the email template
    );
  });

  await Promise.all(emailPromises);

  const { email } = await Cleaner.findById(req.cleaner._id);

  await sendEmail(
    email,
    "Cleaning Invoice",
    "cleaningInvoice_template",
    { ...cleaningInvoice.toObject(), violationLocationImage } // Pass the violationLocationImage to the email template
  );

  if (!cleaningInvoice) {
    throw new ApiError(500, "Failed to create cleaning invoice");
  }

  return res.json(
    new ApiResponse(
      201,
      cleaningInvoice,
      "Cleaning invoice created successfully"
    )
  );
});

const createRedeployment = asyncHandler(async (req, res) => {
  const { operatorName, deviceID, deviceIDImage, additionalNotes } = req.body;

  if (!doorFlag) {
    throw new ApiError(400, "Door is not opened");
  }

  const requiredFields = [
    { name: "operatorName", value: operatorName },
    { name: "deviceID", value: deviceID },
    { name: "deviceIDImage", value: deviceIDImage },
  ];

  const missingField = requiredFields.find(
    (field) => field.value === undefined || field.value.trim() === ""
  );

  if (missingField) {
    throw new ApiError(400, `Field ${missingField.name} is required`);
  }

  const tempimage = Buffer.from(deviceIDImage, "base64");
  const deviceIDImagePath = path.join(__dirname, "temp_deviceID_image.jpeg");
  fs.writeFileSync(deviceIDImagePath, tempimage);

  const deviceIDImageCloudinary = await uploadOnCloudinary(deviceIDImagePath);
  const redeployment = await Redeployment.create({
    cleaner: req.cleaner._id,
    operatorName,
    deviceID,
    deviceIDImage: deviceIDImageCloudinary.url || "",
    additionalNotes,
    invoiceNumber: invoiceNum,
  });

  if (fs.existsSync(deviceIDImagePath)) {
    fs.unlinkSync(deviceIDImagePath);
  }

  if (!redeployment) {
    throw new ApiError(500, "Failed to create redeployment");
  }

  // send email to contact info list
  const contactInfo = await ContactInfo.find({});
  const emailList = contactInfo.map((info) => info.email);
  const emailPromises = emailList.map(async (email) => {
    await sendEmail(
      email,
      "Redeployment Notice",
      "redeployment_template",
      redeployment
    );
  });

  await Promise.all(emailPromises);

  doorFlag = false;

  return res.json(
    new ApiResponse(201, redeployment, "Redeployment created successfully")
  );
});

const doorOtp = asyncHandler(async (req, res) => {
  const { invoiceNumber } = req.body;

  if (!invoiceNumber) {
    throw new ApiError(400, "Invoice number is required");
  }

  if (!isValidObjectId(req.cleaner._id)) {
    throw new ApiError(400, "Invalid cleaner id");
  }

  const cleaningInvoice = await CleaningInvoice.findOne({
    invoiceNumber: invoiceNumber,
  });

  if (!cleaningInvoice) {
    throw new ApiError(404, "Cleaning invoice not found");
  }

  if (
    cleaningInvoice.invoiceStatus !== "Approved" ||
    cleaningInvoice.paymentStatus !== "Paid"
  ) {
    throw new ApiError(400, "Invoice is not approved or not paid");
  }

  const cleaner = await Cleaner.findById(req.cleaner._id).select("phone");
  if (!cleaner) {
    throw new ApiError(404, "Cleaner not found");
  }

  const otp = await sendOtp(cleaner.phone);
  if (!otp) {
    throw new ApiError(500, "Failed to send OTP");
  }

  invoiceNum = invoiceNumber;
  return res.json(new ApiResponse(200, otp, "OTP sent successfully"));
});

const verifyDoorOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  if (!verifyOtp(otp)) {
    throw new ApiError(400, "Invalid otp");
  }
  doorFlag = true;
  return res.json(new ApiResponse(200, null, "door is opened successfully"));
});

const cleanerService = {
  createCleaner,
  verifyContact,
  login,
  getAllPropertyLocation,
  createCleaningInvoice,
  createRedeployment,
  doorOtp,
  verifyDoorOtp,
};

export default cleanerService;
