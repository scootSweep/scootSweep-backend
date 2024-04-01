import { ApiError } from "../utils/ApiError.js";
import nodemailer from "nodemailer";
import ejs from "ejs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendEmail(to, subject, template, data) {
  try {
    // console.log("__dirname:", __dirname);
    // console.log("Render file path:", __dirname + "/views/" + template + ".ejs");

    // const html = await renderFile(
    //   __dirname + "/views/" + template + ".ejs",
    //   data,
    //   { async: true }
    // );

    console.log("Template:", template);
    const html = await ejs.renderFile(
      "/Users/achint/Desktop/project-backend/src/views/" + template + ".ejs",
      data,
      {
        async: true,
      }
    );

    if (!html) {
      throw new ApiError(500, "Error while rendering email template");
    }

    const mailOptions = {
      from: "achintj96244@gmail.com",
      to,
      subject,
      html,
    };

    const Message = await transporter.sendMail(mailOptions);

    return Message;
  } catch (err) {
    return err;
  }
}

export { sendEmail };
