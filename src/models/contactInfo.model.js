import mongoose from "mongoose";
const Schema = mongoose.Schema;

const contactInfoSchema = new Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    secondaryEmail: {
      type: String,
      unique: true,
      sparse: true, // Allows this field to be optional
    },
  },
  { timestamps: true }
);

export const ContactInfo = mongoose.model("ContactInfo", contactInfoSchema);
