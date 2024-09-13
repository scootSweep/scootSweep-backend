import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, uploadPDFBuffer } from "../utils/cloudinary.js";
import { Property } from "../models/property.model.js";
import puppeteer from "puppeteer";
import { verifyOtp } from "../services/otp.service.js";
import { isValidPhoneNumber } from "../utils/validation.js";
import randomstring from "randomstring";
import { sendEmailForResetPassword } from "../services/mail.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import ejs from "ejs";
import { fileURLToPath } from "url";
import path from "path";
import { FeedbackProperty } from "../models/feedbackProperty.model.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cookieOptions = {
  // making the cookie not modifiable by client only sever can modify it
  httpOnly: true, // Make cookies accessible only via HTTP(S)
  secure: true, // Ensure cookies are only sent over HTTPS
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const createProperty = async (propertyData) => {
  const {
    propertyName,
    propertyAddress,
    gpsLocation,
    city,
    state,
    zip,
    firstName,
    lastName,
    role,
    email,
    signature,
    phone,
    password,
  } = propertyData;

  const requiredFields = [
    { name: "propertyName", value: propertyName },
    { name: "propertyAddress", value: propertyAddress },
    { name: "gpsLocation", value: gpsLocation },
    { name: "city", value: city },
    { name: "state", value: state },
    { name: "zip", value: zip },
    { name: "firstName", value: firstName },
    { name: "lastName", value: lastName },
    { name: "role", value: role },
    { name: "email", value: email },
    { name: "signature", value: signature },
    { name: "phone", value: phone },
    { name: "password", value: password },
  ];

  // Find the first missing field and throw an error if any field is missing
  const missingField = requiredFields.find(
    (field) => field.value === undefined || field.value.trim() === ""
  );

  if (missingField) {
    throw new ApiError(400, `Field ${missingField.name} is required`);
  }

  const propertyExist = await Property.findOne({ $or: [{ email }, { phone }] });

  if (propertyExist) {
    throw new ApiError(400, "Account already exist with this email or phone");
  }

  const buffer = Buffer.from(signature, "base64");
  if (!buffer) {
    throw new ApiError(400, "Invalid signature");
  }

  const tempFilePath = path.join(__dirname, "temp_image.png");
  fs.writeFileSync(tempFilePath, buffer);

  const signature_img = await uploadOnCloudinary(tempFilePath);
  if (!signature_img) {
    throw new ApiError(500, "Error while uploading signation");
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

  const normalizedEmail = email.toLowerCase();

  const property = await Property.create({
    propertyName,
    propertyAddress,
    gpsLocation,
    city,
    state,
    zip,
    firstName,
    lastName,
    role,
    email: normalizedEmail,
    signature: signature_img.url,
    phone,
    phoneVerified: false,
    password,
    isMailVerified: false,
    pdfUrl: "",
  });

  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  if (!property) {
    throw new ApiError(500, "Some went wrong while registering the property");
  }

  const dateTimeString = property.createdAt;
  const dateObject = new Date(dateTimeString);
  const date = dateObject.toLocaleDateString();
  const time = dateObject.toLocaleTimeString();

  const templatePath = path.join(
    __dirname,
    "../views/property_location_template.ejs"
  );
  console.log("templatePath", templatePath);
  const htmlContent = await ejs.renderFile(templatePath, {
    property,
    date,
    time,
  });

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  const pdfUploadResult = await uploadPDFBuffer(pdfBuffer);
  property.pdfUrl = pdfUploadResult;
  await property.save();

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

const verifyMail = async (propertyData) => {
  const { email, otp } = propertyData;
  if (!email || !otp) {
    throw new ApiError(400, "All fields are required");
  }

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (!verifyOtp(otp)) {
    throw new ApiError(400, "Invalid OTP");
  }

  const normalizedEmail = email.toLowerCase();
  let property = await Property.findOne({
    email: normalizedEmail,
  });

  if (!property) {
    throw new ApiError(400, "Invalid email");
  }
  if (property.isMailVerified) {
    throw new ApiResponse(400, "Email already verified");
  }

  property.isMailVerified = true;

  await property.save();

  property = await Property.findOne({ email }).select(
    "-password -refreshToken"
  );
  return property;
};

const loginWithEmail = async (propertyData) => {
  const { email, password } = propertyData;

  if (!email || !password) {
    throw new ApiError(400, "All fields are required");
  }
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const normalizedEmail = email.toLowerCase();
  const property = await Property.findOne({
    email: normalizedEmail,
    password,
  });

  if (!property) {
    throw new ApiError(400, "The email or password you entered is incorrect.");
  }

  if (!property.isMailVerified) {
    throw new ApiError(400, "Email not verified");
  }
  return property;
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

const forgotPassword = async (details) => {
  const { email } = details;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const normalizedEmail = email.toLowerCase();
  const property = await Property.findOne({ email: normalizedEmail }).select(
    "-refreshToken"
  );

  if (!property) {
    throw new ApiError(404, "Property not found.");
  }

  const token = randomstring.generate();

  console.log(token);
  property.token = token;

  await property.save();

  await sendEmailForResetPassword(
    property.firstName,
    property.email,
    token,
    "/property"
  );

  return property;
};

const resetPassword = async (token, password) => {
  if (!token || !password) {
    throw new ApiError(400, "Token and password are required");
  }

  const property = await Property.findOne({ token }).select("-refreshToken");

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  property.password = password;
  property.token = "";

  await property.save();
  return property;
};

const feedback = asyncHandler(async (req, res) => {
  const { email, comment } = req.body;

  if (!email || !comment) {
    throw new ApiError(400, "Email and comment are required");
  }

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const property = await Property.findOne({ email }); // Find the cleaner by email

  if (!property) {
    throw new ApiError(404, `Cleaner with ${email} not found`);
  }

  const feedback = await FeedbackProperty.create({
    ownerId: property._id,
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

const deleteProperty = asyncHandler(async (req, res) => {
  await Property.findByIdAndDelete(req.property._id);

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "property deleted"));
});

const propertyService = {
  createProperty,
  verifyContact,
  verifyMail,
  loginWithEmail,
  login,
  forgotPassword,
  resetPassword,
  feedback,
  deleteProperty,
};

export default propertyService;

// export { createProperty, loginPropertySide, propertyContactVerify };
