import { ApiError } from "../utils/ApiError.js";
import nodemailer from "nodemailer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";

// Convert the URL of the current module (import.meta.url) to a file path
const __filename = fileURLToPath(import.meta.url);
// Extract the directory name from the file path
const __dirname = dirname(__filename);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendEmail(to, subject, template, data) {
  try {
    // Construct the path to the EJS template file

    console.log("to", to);
    console.log("template", template);
    console.log("data", data);

    const templatePath = join(__dirname, "../views/" + template + ".ejs");

    // Render the EJS template file with the provided data
    const html = await ejs.renderFile(templatePath, data, {
      async: true,
    });

    console.log("html", html);

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
