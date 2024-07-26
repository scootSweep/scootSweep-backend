import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      public_id: `images/properties_${Date.now()}`,
    });
    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    throw new ApiError(500, "Error uploading image to cloudinary");
  }
};

const uploadPDFBuffer = async (pdfBuffer) => {
  try {
    const response = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: `pdfs/properties_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(pdfBuffer);
    });

    return response.secure_url;
  } catch (error) {
    throw new ApiError(500, "Error uploading pdf to cloudinary");
  }
};

export { uploadOnCloudinary, uploadPDFBuffer };
