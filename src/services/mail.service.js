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
    const templatePath = join(__dirname, "../views/" + template + ".ejs");
    // Render the EJS template file with the provided data
    if (!templatePath) {
      throw new ApiError(500, "Error while rendering email template");
    }
    const html = await ejs.renderFile(templatePath, data, {
      async: true,
    });
    if (!html) {
      throw new ApiError(500, "Error while rendering email template");
    }

    const mailOptions = {
      from: "scootsweep8@gmail.com",
      to,
      subject,
      html,
    };

    // const mailOptions = {
    //   from: "achintj96244@gmail.com",
    //   to,
    //   subject,
    //   html,
    // };

    const Message = await transporter.sendMail(mailOptions);
    return Message;
  } catch (err) {
    return err;
  }
}

// write send email for resetpassword function

async function sendEmailForResetPassword(name, email, token, endPoint) {
  try {
    if (!name || !email || !token) {
      throw new ApiError(400, "Name, Email and Token are required");
    }
    console.log("check point", name, email, token);
    const mailOptions = {
      from: "achintj96244@gmail.com",
      to: email,
      subject: "Reset Password",
      html: `<p> hi ${name} click on the link to reset your password <a href="https://scootsweep-backend-production.up.railway.app/api/v1/auth/reset-password${endPoint}?token=${token}">Reset Password</a></p>`,
    };

    const Message = await transporter.sendMail(mailOptions);
    if (!Message) {
      throw new ApiError(500, "Error while sending email");
    }
    console.log("Message", Message);
    return Message;
  } catch (err) {
    return err;
  }
}

export { sendEmail, sendEmailForResetPassword };
