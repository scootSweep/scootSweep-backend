import twilio from "twilio";
import { ApiError } from "../utils/ApiError.js";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;
const client = new twilio(accountSid, authToken);

let OTP, user;

async function sendOtp(number) {
  let digit = "0123456789";
  OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digit[Math.floor(Math.random() * 10)];
  }

  const message = await client.messages.create({
    body: `Your otp verification for user is ${OTP}`,
    messagingServiceSid: "MG3403a69ee58539d33b66f4093c8ea857",
    to: number,
    from: "+16502499145",
  });

  if (!message) {
    throw new ApiError(500, `error while sending otp ${message}`);
  }
  return message;
}

function verifyOtp(otp) {
  if (otp != OTP) {
    throw new ApiError(300, "otp is not correct");
  }
  return true;
}

// const sendOtp = asyncHandler(async (req, res) => {
//   const { number } = req.body;

//   let digit = "0123456789";
//   OTP = "";
//   for (let i = 0; i < 4; i++) {
//     OTP += digit[Math.floor(Math.random() * 10)];
//   }

//   // const message = await client.messages.create({
//   //   body: `Your otp verification for user ${username} is ${OTP}`,
//   //   messagingServiceSid: "MG3403a69ee58539d33b66f4093c8ea857",
//   //   to: number,
//   // });

//   const message = await client.messages.create({
//     body: `Your otp verification for user is ${OTP}`,
//     messagingServiceSid: "MG3403a69ee58539d33b66f4093c8ea857",
//     to: number,
//     from: "+16502499145",
//   });

//   if (!message) {
//     throw new ApiError(500, `error while sending otp ${message}`);
//   }

//   return res.status(200).json(new ApiResponse(200, message, "otp sent"));
// });

// const verifyOtp = asyncHandler(async (req, res) => {
//   const { otp } = req.body;
//   const { propertyId } = req.params;
//   console.log("propertyId", propertyId);

//   if (otp != OTP) {
//     throw new ApiError(300, "otp is not correct");
//   }

//   const propertyOwner = await Property.findByIdAndUpdate(
//     propertyId,
//     {
//       phoneVerified: true,
//     },
//     { new: true }
//   );

//   if (!propertyOwner) {
//     throw new ApiError(500, "error while verifying otp");
//   }

//   return res.status(200).json(new ApiResponse(200, { otp }, "you are login"));
// });

// const sendOtp = asyncHandler(async (req, res) => {
//   const { number } = req.body;

//   let digit = "0123456789";
//   OTP = "";
//   for (let i = 0; i < 4; i++) {
//     OTP += digit[Math.floor(Math.random() * 10)];
//   }

//   // const message = await client.messages.create({
//   //   body: `Your otp verification for user ${username} is ${OTP}`,
//   //   messagingServiceSid: "MG3403a69ee58539d33b66f4093c8ea857",
//   //   to: number,
//   // });

//   const message = await client.messages.create({
//     body: `Your otp verification for user is ${OTP}`,
//     messagingServiceSid: "MG3403a69ee58539d33b66f4093c8ea857",
//     to: number,
//     from: "+16502499145",
//   });

//   if (!message) {
//     throw new ApiError(500, `error while sending otp ${message}`);
//   }

//   return res.status(200).json(new ApiResponse(200, message, "otp sent"));
// });

// const verifyOtp = asyncHandler(async (req, res) => {
//   const { otp } = req.body;
//   const { propertyId } = req.params;
//   console.log("propertyId", propertyId);

//   if (otp != OTP) {
//     throw new ApiError(300, "otp is not correct");
//   }

//   const propertyOwner = await Property.findByIdAndUpdate(
//     propertyId,
//     {
//       phoneVerified: true,
//     },
//     { new: true }
//   );

//   if (!propertyOwner) {
//     throw new ApiError(500, "error while verifying otp");
//   }

//   return res.status(200).json(new ApiResponse(200, { otp }, "you are login"));
// });

export { sendOtp, verifyOtp };
