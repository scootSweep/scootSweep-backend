// const isValidPhoneNumber = (phone) => {
//   // Remove any non-digit characters from the phone number
//   const cleanedPhone = phone.replace(/\D/g, "");

//   // Check if the cleaned phone number has 10 digits (without country code)
//   if (/^\d{10}$/.test(cleanedPhone)) {
//     return true;
//   }

//   // Check if the cleaned phone number has 12 digits (with country code)
//   if (/^\+?\d{12}$/.test(cleanedPhone)) {
//     return true;
//   }

//   // Otherwise, return false
//   return false;
// };

// const { parsePhoneNumberFromString } = require('libphonenumber-js');
import parsePhoneNumberFromString from "libphonenumber-js";

const isValidPhoneNumber = (phone) => {
  const phoneNumber = parsePhoneNumberFromString(phone);

  // Check if the parsed phone number is valid
  return phoneNumber && phoneNumber.isValid();
};

export { isValidPhoneNumber };
