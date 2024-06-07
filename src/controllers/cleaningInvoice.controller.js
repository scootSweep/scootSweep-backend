import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CleaningInvoice } from "../models/cleaningInvoice.model.js";
import { ContactInfo } from "../models/contactInfo.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../services/mail.service.js";
import { getNextSequenceValue } from "../utils/invoiceCounter.js";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createCleaningInvoice = asyncHandler(async (req, res, next) => {
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
}, "createCleaningInvoice");

export { createCleaningInvoice };
