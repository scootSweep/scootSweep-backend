import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cleaner } from "../models/cleaner.model.js";
import { FeedbackCleaner } from "../models/feedbackCleaner.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidPhoneNumber } from "../utils/validation.js";
import { sendEmail } from "../services/mail.service.js";
import { generateOtp } from "../services/otp.service.js";
import { verifyOtp } from "../services/otp.service.js";
import { Property } from "../models/property.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IllegalDockless } from "../models/illegalDockless.js";
import { ContactInfo } from "../models/contactInfo.model.js";
import randomstring from "randomstring";
import { sendEmailForResetPassword } from "../services/mail.service.js";
import { getNextSequenceValue } from "../utils/invoiceCounter.js";
import { Redeployment } from "../models/redeployment.model.js";
import { isValidObjectId } from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let doorFlag = false;
let invoiceNum = 0;

const cookieOptions = {
  // making the cookie not modifiable by client only sever can modify it
  httpOnly: true, // Make cookies accessible only via HTTP(S)
  secure: true, // Ensure cookies are only sent over HTTPS
};

const createCleaner = async (cleanerData) => {
  const { firstName, lastName, email, phone, DOB, idImage, password } =
    cleanerData;

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
    throw new ApiError(400, `Oops! The ${missingField.name} is required.`);
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
    throw new ApiError(400, "Please enter a valid email address");
  }

  if (!isValidPhoneNumber(phone)) {
    throw new ApiError(400, "That doesn’t look like a valid phone number");
  }

  const [day, month, year] = DOB.split("-");
  const dateOfBirth = new Date(`${month}-${day}-${year}`);

  // Check if the dateOfBirth is valid
  if (isNaN(dateOfBirth.getTime())) {
    throw new ApiError(400, "Please provide a valid date of birth");
  }

  const normalizedEmail = email.toLowerCase();
  const cleaner = await Cleaner.create({
    firstName,
    lastName,
    dateOfBirth: dateOfBirth,
    email: normalizedEmail,
    password,
    phone,
    phoneVerified: false,
    isMailVerified: false,
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
    throw new ApiError(
      400,
      "The OTP you entered is incorrect. Please try again"
    );
  }
  const cleaner = await Cleaner.findOne({ phone: number });

  if (!cleaner) {
    throw new ApiError(
      404,
      "We couldn’t find a cleaner with that information."
    );
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

const verifyMail = async (cleanerData) => {
  const { email, otp } = cleanerData;
  if (!email || !otp) {
    throw new ApiError(400, "All fields are required");
  }

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  if (!verifyOtp(otp)) {
    throw new ApiError(
      400,
      "The OTP you entered is incorrect. Please try again"
    );
  }

  const normalizedEmail = email.toLowerCase();

  const isExist = await Cleaner.findOne({
    email: normalizedEmail,
  });

  if (!isExist) {
    throw new ApiError(400, `Cleaner with ${email} not found`);
  }

  let cleaner = await Cleaner.findOne({
    email: normalizedEmail,
  });

  if (!cleaner) {
    throw new ApiError(400, "email not found");
  }
  if (cleaner.isMailVerified == true) {
    throw new ApiResponse(400, "Email already verified");
  }

  cleaner.isMailVerified = true;

  await cleaner.save();
  //to retrieve the updated admin data without password and refreshToken
  cleaner = await Cleaner.findOne({ email }).select("-password -refreshToken");
  return cleaner;
};

const loginWithEmail = async (cleanerData) => {
  const { email, password } = cleanerData;

  if (!email || !password) {
    throw new ApiError(400, "Please fill out all the required fields.");
  }
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const normalizedEmail = email.toLowerCase();

  const isExist = await Cleaner.findOne({
    email: normalizedEmail,
  });

  if (!isExist) {
    throw new ApiError(400, `Cleaner with ${email} not found`);
  }

  const cleaner = await Cleaner.findOne({
    email: normalizedEmail,
    password: password,
  });

  if (!cleaner) {
    throw new ApiError(400, "The email or password you entered is incorrect.");
  }

  if (!cleaner.isMailVerified) {
    throw new ApiError(400, "Please verify your email before logging in");
  }
  return cleaner;
};

const login = async (details) => {
  const { number, otp } = details;

  if (!number || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  if (!isValidPhoneNumber(number)) {
    throw new ApiError(400, "That doesn’t look like a valid phone number.");
  }

  if (!verifyOtp(otp)) {
    throw new ApiError(400, "otp is invalid");
  }

  const cleaner = await Cleaner.findOne({ phone: number }).select(
    "-refreshToken"
  );

  if (!cleaner) {
    throw new ApiError(
      404,
      "We couldn’t find a cleaner with that information."
    );
  }

  return cleaner;
};

const forgotPassword = async (details) => {
  const { email } = details;

  if (!email || !emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const isExist = await Cleaner.findOne({
    email: normalizedEmail,
  });

  if (!isExist) {
    throw new ApiError(400, `Cleaner with ${email} not found`);
  }

  const cleaner = await Cleaner.findOne({ email }).select("-refreshToken");

  if (!cleaner) {
    throw new ApiError(
      404,
      "We couldn’t find a cleaner with that information."
    );
  }

  const token = randomstring.generate();
  cleaner.token = token;

  await cleaner.save();
  const mail = await sendEmailForResetPassword(
    cleaner.firstName,
    cleaner.email,
    token,
    "/cleaner"
  );

  if (!mail) {
    throw new ApiError(
      500,
      "Something went wrong while sending email. Please try again"
    );
  }

  return cleaner;
};

const resetPassword = async (token, password) => {
  if (!token || !password) {
    throw new ApiError(400, "Token and password are required");
  }

  const cleaner = await Cleaner.findOne({ token }).select("-refreshToken");

  if (!cleaner) {
    throw new ApiError(404, "We couldn’t find the cleaner for password reset.");
  }

  cleaner.password = password;
  cleaner.token = "";

  await cleaner.save();
  return cleaner;
};

const getAllPropertyLocation = asyncHandler(async (req, res) => {
  const properties = await Property.find().select("-refreshToken ");

  if (!properties) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Properties not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, properties, "Properties found"));
});

const createillegalDocklessRemoval = asyncHandler(async (req, res) => {
  const {
    operatorName,
    deviceID,
    deviceIDImage,
    unauthorizedParkingImage,
    time,
    date,
    gpsLocation,
    typeOfDevice,
    additionalNotes,
  } = req.body;

  // if (!req.cleaner.phoneVerified) {
  //   throw new ApiError(400, "Phone number is not verified");
  // }

  const requiredFields = [
    // { name: "reason", value: reason },
    { name: "operatorName", value: operatorName },
    { name: "deviceID", value: deviceID },
    { name: "deviceIDImage", value: deviceIDImage },
    { name: "gpsLocation", value: gpsLocation },
    { name: "typeOfDevice", value: typeOfDevice },
    { name: "time", value: time },
    { name: "date", value: date },
  ];

  const missingField = requiredFields.find(
    (field) => field.value === undefined || field.value.trim() === ""
  );

  if (missingField) {
    throw new ApiError(400, `Oops! The ${missingField.name} is required`);
  }

  const tempimage = Buffer.from(deviceIDImage, "base64");
  const deviceIDImagePath = path.join(__dirname, "temp_deviceID_image.jpeg");
  fs.writeFileSync(deviceIDImagePath, tempimage);

  const tempUnauthorizedParkingImage = Buffer.from(
    unauthorizedParkingImage,
    "base64"
  );
  const unauthorizedParkingImagePath = path.join(
    __dirname,
    "temp_UnauthorizedParking_image.jpeg"
  );
  fs.writeFileSync(unauthorizedParkingImagePath, tempUnauthorizedParkingImage);

  const deviceIDImageCloudinary = await uploadOnCloudinary(deviceIDImagePath);
  const unauthorizedParkingImageCloudinary = await uploadOnCloudinary(
    unauthorizedParkingImagePath
  );
  const invoiceNumber = await getNextSequenceValue("cleaningInvoice");

  const dateParts = date.split("/");
  const dateObj = new Date(`${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`);

  const unauthorizedDock = await IllegalDockless.create({
    cleaner: req.cleaner._id,
    operatorName,
    deviceID,
    deviceIDImage: deviceIDImageCloudinary?.url || "",
    unauthorizedParkingImage: unauthorizedParkingImageCloudinary?.url || "",
    gpsLocation,
    typeOfDevice,
    time,
    date: dateObj,
    invoiceStatus: "Pending",
    paymentStatus: "Unpaid",
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
      "illegal Dockless Removal",
      "cleaningInvoice_template",
      { ...unauthorizedDock.toObject(), violationLocationImage } // Pass the violationLocationImage to the email template
    );
  });

  await Promise.all(emailPromises);

  const { email } = await Cleaner.findById(req.cleaner._id);

  await sendEmail(
    email,
    "illegal Dockless Removal",
    "illegalDockless_template",
    { ...unauthorizedDock.toObject(), violationLocationImage } // Pass the violationLocationImage to the email template
  );

  if (!unauthorizedDock) {
    throw new ApiError(500, "Failed to create illegal Dockless Removal");
  }

  return res.json(
    new ApiResponse(
      201,
      unauthorizedDock,
      "illegal Dockless Removal Requeset created successfully"
    )
  );
});

const createRedeployment = asyncHandler(async (req, res) => {
  const { operatorName, deviceID, deviceIDImage, additionalNotes } = req.body;

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
    deviceIDImage: deviceIDImageCloudinary?.url || "",
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

  const cleaner = await Cleaner.findById(req.cleaner._id).select("email");
  if (!cleaner) {
    throw new ApiError(
      404,
      "We couldn’t find a cleaner with that information."
    );
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
    cleaner.email,
    "OTP for Email Verification",
    "otp_email_template",
    data
  );

  if (!mail) {
    throw new ApiError(500, "error while sending otp");
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
    throw new ApiError(
      400,
      "The OTP you entered is incorrect. Please try again"
    );
  }
  doorFlag = true;
  return res.json(new ApiResponse(200, null, "door is opened successfully"));
});

// create a getList of cleaning invoice of a cleaner
const getListOfDock = asyncHandler(async (req, res) => {
  const cleaner = req.cleaner;
  const illegalDockless = await IllegalDockless.find({
    cleaner: cleaner._id,
  });

  if (!illegalDockless) {
    throw new ApiError(404, "illegal - Dockless not found");
  }

  return res.json(
    new ApiResponse(
      200,
      illegalDockless,
      "illegal - Dockless found successfully"
    )
  );
});

// feedback for cleaner
const feedback = asyncHandler(async (req, res) => {
  const { email, comment } = req.body;

  if (!email || !comment) {
    throw new ApiError(400, "Email and comment are required");
  }

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const cleaner = await Cleaner.findOne({ email }); // Find the cleaner by email

  if (!cleaner) {
    throw new ApiError(404, `Cleaner with ${email} not found`);
  }

  const feedback = await FeedbackCleaner.create({
    ownerId: cleaner._id,
    email,
    comment,
  });

  if (!feedback) {
    throw new ApiError(500, "Error while creating feedback");
  }

  return res.json(
    new ApiResponse(201, feedback, "Feedback created successfully")
  );
});

const deleteCleaner = asyncHandler(async (req, res) => {
  await Cleaner.findByIdAndDelete(req.cleaner._id);

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "cleaner deleted"));
});

const cleanerService = {
  createCleaner,
  verifyContact,
  login,
  forgotPassword,
  resetPassword,
  getAllPropertyLocation,
  createillegalDocklessRemoval,
  createRedeployment,
  doorOtp,
  verifyDoorOtp,
  verifyMail,
  loginWithEmail,
  getListOfDock,
  feedback,
  deleteCleaner,
};

export default cleanerService;
