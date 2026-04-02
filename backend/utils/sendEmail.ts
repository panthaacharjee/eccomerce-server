const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const REFRESH_TOKEN =
  "1//04Ee9DWrM46efCgYIARAAGAQSNwF-L9Ir-lRWZm1n9YJgK0sI_qf-iVjrIbekQGHg6MXpuC2lJGTv61AC_aQGSVIshvCjaT04VmQ";
const CLIENT_ID =
  "932299062997-bgg7jdhu53s272mrqmmkt3v01v5p2kb4.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URL = "https://developers.google.com/oauthplayground";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL,
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const sendEmail = async (options: any) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transpoter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        type: "OAuth2",
        user: "pantha15-3519@diu.edu.bd",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOption = {
      from: process.env.MAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };
    await transpoter.sendMail(mailOption);
  } catch (err) {
    console.log(err);
  }
};
module.exports = sendEmail;
