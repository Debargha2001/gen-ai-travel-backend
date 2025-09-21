// import CryptoJS from "crypto-js";
// const AES = CryptoJS.AES;
// const Hex = CryptoJS.enc.Hex;
// const Utf8 = CryptoJS.enc.Utf8;
// const ECB = CryptoJS.mode.ECB;
// import { config } from "./config.js";
// import { ErrorFirstResponse } from "./response.js";
// import { logger } from "./logger.js";

// const MODULE = "Helper";

// export function checkURLEncrypted(payload: string): ErrorFirstResponse<boolean> {
//     try {
//         const url = new URL(payload);
//         if (url.href) {
//             return ErrorFirstResponse.success(false);
//         }
//         return ErrorFirstResponse.success(true);
//     } catch (_e) {
//         return ErrorFirstResponse.success(true);
//     }
// }

// export function encryptAndDecryptWithECBMode(
//     payload: string,
//     action: "encrypt" | "decrypt"
// ): ErrorFirstResponse<string> {
//     try {
//         const key = Hex.parse(config.get("CRYPTO_SECRET"));
//         if (!payload) return ErrorFirstResponse.error("no payload provided");
//         if (action == "encrypt") {
//             const data = AES.encrypt(payload, key, { mode: ECB }).toString();
//             return ErrorFirstResponse.success(data);
//         }
//         if (action == "decrypt") {
//             const data = AES.decrypt(payload, key, { mode: ECB }).toString(Utf8);
//             return ErrorFirstResponse.success(data.trim().length > 5 ? data : payload);
//         }
//         return ErrorFirstResponse.error("invalid action provided");
//     } catch (e) {
//         logger.error({
//             message: "Error in encryptAndDecryptWithECBMode:",
//             module: MODULE,
//             error: e as Error,
//         });
//         return ErrorFirstResponse.success(payload);
//     }
// }

// export function kebabCase(str: string): ErrorFirstResponse<string> {
//     return ErrorFirstResponse.success(
//         str
//             .replace(/([a-z])([A-Z])/g, "$1-$2") // Convert camelCase to kebab-case
//             .replace(/\s+/g, "-") // Replace spaces with hyphens
//             .replace(/_/g, "-") // Replace underscores with hyphens
//             .toLowerCase()
//     ); // Convert to lowercase
// }

// export function encryptAndDecrypt(
//     payload: string,
//     action: "encrypt" | "decrypt",
//     decryptType = "string"
// ): ErrorFirstResponse<string | Record<string, unknown>> {
//     try {
//         const key = config.get("CRYPTO_SECRET");
//         if (!payload) return ErrorFirstResponse.error("no payload provided");
//         if (action == "encrypt") {
//             const data = AES.encrypt(payload, key).toString();
//             return ErrorFirstResponse.success(data);
//         }
//         if (action == "decrypt") {
//             const bytes = AES.decrypt(payload, key);
//             if (decryptType === "string") {
//                 const data = bytes.toString(Utf8);
//                 return ErrorFirstResponse.success(data.length != 0 ? data : payload);
//             } else {
//                 const data = JSON.parse(bytes.toString(Utf8));
//                 return ErrorFirstResponse.success(data);
//             }
//         }
//         return ErrorFirstResponse.error("invalid action provided");
//     } catch (e) {
//         logger.error({
//             message: "Error in encryptAndDecrypt:",
//             module: MODULE,
//             error: e as Error,
//         });
//         return ErrorFirstResponse.success(payload);
//     }
// }

// export function decryptString(
//     payload: string
// ): ErrorFirstResponse<string | Record<string, unknown>> {
//     try {
//         const key = config.get("CRYPTO_SECRET");
//         const bytes = AES.decrypt(payload, key);
//         const data = bytes.toString(Utf8);
//         return ErrorFirstResponse.success(data.length != 0 ? data : payload);
//     } catch (e) {
//         logger.error({
//             message: "Error in decryptString:",
//             module: MODULE,
//             error: e as Error,
//         });
//         return ErrorFirstResponse.success(payload);
//     }
// }

// export function decryptJSON<T = Record<string, unknown>>(payload: string): ErrorFirstResponse<T> {
//     try {
//         const key = config.get("CRYPTO_SECRET");
//         const bytes = AES.decrypt(payload, key);
//         const data = JSON.parse(bytes.toString(Utf8)) as T;
//         return ErrorFirstResponse.success(data);
//     } catch (e) {
//         logger.error({
//             message: "Error in decryptJSON:",
//             module: MODULE,
//             error: e as Error,
//         });
//         return ErrorFirstResponse.success({} as T);
//     }
// }

// export function encodeComponent(payload: string, type: string): ErrorFirstResponse<string> {
//     try {
//         payload = decodeURIComponent(payload);
//         if (type == "encode") {
//             payload = encodeURIComponent(payload);
//             if (payload.indexOf("!") > 0) {
//                 payload = payload.replace("!", "%21");
//             }
//         }
//         return ErrorFirstResponse.success(payload);
//     } catch (e) {
//         logger.error({
//             message: "Error in encodeComponent:",
//             module: MODULE,
//             error: e as Error,
//         });
//         return ErrorFirstResponse.error(payload);
//     }
// }
