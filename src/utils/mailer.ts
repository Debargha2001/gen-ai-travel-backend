// import * as nodemailer from "nodemailer";
// import { config } from "./config.js";
// import { logger } from "./logger.js";
// import { ServiceResponse } from "./response.js";
// import { MailerPayload } from "../types/utils/mailer.js";

// export async function mailer(data: MailerPayload, html: string): Promise<ServiceResponse<unknown>> {
//     const transporter = nodemailer.createTransport({
//         host: config.get("SMTP_HOST"),
//         port: config.get("SMTP_PORT"),
//         secure: false,
//         auth: {
//             user: config.get("SMTP_USER"),
//             pass: config.get("SMTP_PASS"),
//         },
//     });

//     const mailStatus = await transporter.sendMail({
//         from: data.emailFrom
//             ? data.emailFrom
//             : data.emailType == "account"
//               ? config.get("EMAIL")
//               : config.get("ALERT_EMAIL"),
//         to: data.email,
//         subject: data.subject,
//         html: html || data.message,
//         attachments: data.emailAttachments,
//     });

//     if (!mailStatus.messageId) {
//         logger.error("unable to send mail %o", mailStatus);
//         return ServiceResponse.error(mailStatus, "unable to send mail.");
//     }

//     return ServiceResponse.success(mailStatus.messageId);
// }
