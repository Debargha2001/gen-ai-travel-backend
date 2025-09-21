// import * as crypto from "node:crypto";
// import { Buffer } from "node:buffer";
// import { config } from "./config.js";
// import { ErrorFirstResponse } from "./response.js";

// const SECRET_KEY = config.get("WOCAM_SECRET_KEY");

// Function to encrypt text
// export function encrypt(text: string): ErrorFirstResponse<string> {
//     try {
//         const key = Buffer.from(SECRET_KEY, "hex");
//         const iv = crypto.randomBytes(12); // Generate a random IV
//         const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

//         let encrypted = cipher.update(text, "utf8", "hex");
//         encrypted += cipher.final("hex");
//         const authTag = cipher.getAuthTag().toString("hex");

//         // Combine IV, auth tag, and encrypted text
//         const resp = iv.toString("hex") + authTag + encrypted;

//         return ErrorFirstResponse.success(resp);
//     } catch (err) {
//         return ErrorFirstResponse.error(err as Error);
//     }
// }

// Function to decrypt text
// export function decrypt(encrypted: string): ErrorFirstResponse<string> {
//     try {
//         const key = Buffer.from(SECRET_KEY, "hex");
//         const iv = Buffer.from(encrypted.slice(0, 24), "hex"); // Extract IV
//         const authTag = Buffer.from(encrypted.slice(24, 56), "hex"); // Extract auth tag
//         const encryptedText = encrypted.slice(56); // Extract encrypted text

//         const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
//         decipher.setAuthTag(authTag);

//         let decrypted = decipher.update(encryptedText, "hex", "utf8");
//         decrypted += decipher.final("utf8");

//         return ErrorFirstResponse.success(decrypted);
//     } catch (err) {
//         return ErrorFirstResponse.error(err as Error);
//     }
// }
