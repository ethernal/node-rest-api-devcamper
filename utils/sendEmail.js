const nodemailer = require("nodemailer");

const sendEmail = async options => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_AUTH_USER,
    SMTP_AUTH_PASSWORD,
    SMTP_EMAIL_FROM,
    SMTP_EMAIL_NAME,
  } = process.env;
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_AUTH_USER,
      pass: SMTP_AUTH_PASSWORD,
    },
  });

  // send mail with defined transport object
  const message = {
    from: `"${SMTP_EMAIL_NAME}" <${SMTP_EMAIL_FROM}>`, // sender address
    to: options.receivers, // list of receivers
    subject: options.subject, // Subject line
    text: options.bodyText, // plain text body
    html: options.bodyHTML, // html body
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

module.exports = sendEmail;
