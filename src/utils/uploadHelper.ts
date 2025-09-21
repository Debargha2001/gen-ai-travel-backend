// import { Storage } from "@google-cloud/storage";
// import { IPayloadAttachment, IStorageDetails } from "../lib/Storage/storage.schema.js";
// import stream from "node:stream";
// import {
//     BlobServiceClient,
//     // BlockBlobUploadOptions,
//     StorageSharedKeyCredential,
// } from "@azure/storage-blob";
// import streamifier from "streamifier";
// import { logger } from "./logger.js";
// import { ErrorFirstResponse } from "./response.js";

// export async function uploadToAzureStorage(
//     storageInfo: IStorageDetails,
//     data: IPayloadAttachment
// ): Promise<IPayloadAttachment & { filePath: string }> {
//     logger.debug("uploading image to azure blob");
//     const sharedKeyCredential = new StorageSharedKeyCredential(
//         storageInfo.bucketAccountName,
//         storageInfo.bucketAccessKey
//     );
//     const blobServiceClient = new BlobServiceClient(
//         `https://${storageInfo.bucketAccountName}.blob.core.windows.net`,
//         sharedKeyCredential
//     );
//     const containerClient = blobServiceClient.getContainerClient(storageInfo.bucket);

//     let buffer: Buffer;

//     if (typeof data.file === "string") {
//         buffer = Buffer.from(data.file.replace(/^data:image\/\w+;base64,/, ""), "base64");
//     } else if (data.file instanceof ArrayBuffer) {
//         buffer = Buffer.from(data.file);
//     } else {
//         buffer = data.file;
//     }

//     // function
//     const rawDataStream = streamifier.createReadStream(buffer);

//     const blobName = `${data.uploadDir ? data.uploadDir : ""}/${data.fileName}`;

//     // fix
//     const pathFix = blobName
//         .split("/")
//         .filter((el) => el !== "" && el.length > 0)
//         .join("/");

//     const blockBlobClient = containerClient.getBlockBlobClient(pathFix);

//     // const blobOptions: BlockBlobUploadOptions = { blobHTTPHeaders: { blobContentType: data.mime } };
//     logger.debug("trying to upload => %s", pathFix);
//     try {
//         const resp = await blockBlobClient.uploadStream(rawDataStream, buffer.byteLength);
//         logger.debug("%s upload status => %d ", blockBlobClient.url, resp._response.status);
//         // await blockBlobClient.upload(buffer, buffer.length, blobOptions);
//         return { ...data, remoteUrl: blockBlobClient.url, filePath: pathFix };
//     } catch (err) {
//         console.error(err);
//         return { ...data, filePath: "" };
//     }
// }

// export async function moveFileAzure(
//     storageInfo: IStorageDetails,
//     data: IPayloadAttachment & { sourcePath: string }
// ): Promise<ErrorFirstResponse<IPayloadAttachment & { filePath: string }>> {
//     try {
//         const sharedKeyCredential = new StorageSharedKeyCredential(
//             storageInfo.bucketAccountName,
//             storageInfo.bucketAccessKey
//         );
//         const blobServiceClient = new BlobServiceClient(
//             `https://${storageInfo.bucketAccountName}.blob.core.windows.net`,
//             sharedKeyCredential
//         );
//         const containerClient = blobServiceClient.getContainerClient(storageInfo.bucket);

//         const destinationBlobName = `${data.uploadDir ? data.uploadDir : ""}/${data.fileName}`;
//         const destinationBlobPath = destinationBlobName
//             .split("/")
//             .filter((el) => el !== "" && el.length > 0)
//             .join("/");

//         logger.debug("Trying to upload => %s", destinationBlobPath);

//         const sourceBlobClient = containerClient.getBlobClient(data.sourcePath);
//         const destinationBlobClient = containerClient.getBlobClient(destinationBlobPath);

//         // Copy file from source to destination
//         await destinationBlobClient.beginCopyFromURL(sourceBlobClient.url);

//         // Delete the source blob
//         await sourceBlobClient.delete();

//         // Construct the remote URL
//         // const baseUrl = `https://${blobServiceClient.accountName}.blob.core.windows.net/${storageInfo.bucket}`;
//         const remoteUrl = destinationBlobClient.url;
//         data.remoteUrl = remoteUrl;

//         return ErrorFirstResponse.success({ ...data, filePath: destinationBlobPath });
//     } catch (err) {
//         console.error(err);
//         return ErrorFirstResponse.error("Cannot move file");
//     }
// }

// export async function deleteFromAzureTemp(
//     storageInfo: IStorageDetails,
//     data: { filePath: string }
// ): Promise<ErrorFirstResponse<string>> {
//     try {
//         const sharedKeyCredential = new StorageSharedKeyCredential(
//             storageInfo.bucketAccountName,
//             storageInfo.bucketAccessKey
//         );
//         const blobServiceClient = new BlobServiceClient(
//             `https://${storageInfo.bucketAccountName}.blob.core.windows.net`,
//             sharedKeyCredential
//         );
//         const containerClient = blobServiceClient.getContainerClient(storageInfo.bucket);

//         const blobClient = containerClient.getBlobClient(data.filePath);

//         // Delete the file
//         await blobClient.delete();

//         return ErrorFirstResponse.success("File deleted successfully");
//     } catch (err) {
//         console.error(err);
//         return ErrorFirstResponse.error(
//             err instanceof Error ? err.message : "Unable to delete file"
//         );
//     }
// }

// export async function uploadToGCP(
//     storageInfo: IStorageDetails,
//     data: IPayloadAttachment
// ): Promise<IPayloadAttachment & { filePath: string }> {
//     return new Promise((resolve) => {
//         try {
//             if (!(storageInfo.credentials && typeof storageInfo.credentials === "object")) {
//                 throw new Error("incorrect gcp credentials.");
//             }
//             const storage = new Storage({
//                 credentials: storageInfo.credentials,
//                 projectId: storageInfo.credentials?.project_id,
//             });
//             const bucket = storage.bucket(storageInfo.bucket);

//             const blobName = `${data.uploadDir ? data.uploadDir : ""}/${data.fileName}`;

//             // fix
//             const pathFix = blobName
//                 .split("/")
//                 .filter((el) => el !== "" && el.length > 0)
//                 .join("/");

//             // const blobOptions: BlockBlobUploadOptions = { blobHTTPHeaders: { blobContentType: data.mime } };
//             logger.debug("trying to upload => %s", pathFix);
//             const file = bucket.file(pathFix);
//             let buffer: Buffer;

//             if (typeof data.file === "string") {
//                 buffer = Buffer.from(data.file.replace(/^data:image\/\w+;base64,/, ""), "base64");
//             } else if (data.file instanceof ArrayBuffer) {
//                 buffer = Buffer.from(data.file);
//             } else {
//                 buffer = data.file;
//             }
//             const passthroughStream = new stream.PassThrough();
//             passthroughStream.write(buffer);
//             passthroughStream.end();
//             passthroughStream.pipe(file.createWriteStream()).on("finish", () => {
//                 // The file upload is complete
//                 logger.debug("file upload is complete");
//                 const baseUrl =
//                     typeof storageInfo.cdn === "string" && storageInfo.cdn.length > 0
//                         ? storageInfo.cdn
//                         : `https://storage.googleapis.com/${storageInfo.bucket}`;
//                 const remoteUrl: string = `${baseUrl}/${pathFix}`;
//                 data.remoteUrl = remoteUrl;
//                 return resolve({ ...data, filePath: pathFix });
//             });
//         } catch (err) {
//             console.error(err);
//             return resolve({ ...data, filePath: "" });
//         }
//     });
// }

// export async function uploadToGCPTemp(
//     storageInfo: IStorageDetails,
//     data: IPayloadAttachment
// ): Promise<IPayloadAttachment & { filePath: string }> {
//     return new Promise((resolve) => {
//         try {
//             if (!(storageInfo.credentials && typeof storageInfo.credentials === "object")) {
//                 throw new Error("incorrect gcp credentials.");
//             }
//             const storage = new Storage({
//                 credentials: storageInfo.credentials,
//                 projectId: storageInfo.credentials?.project_id,
//             });
//             const bucket = storage.bucket(storageInfo.bucket);

//             const blobName = `${data.uploadDir ? data.uploadDir : ""}/${data.fileName}`;

//             // fix
//             const pathFix = blobName
//                 .split("/")
//                 .filter((el) => el !== "" && el.length > 0)
//                 .join("/");

//             // const blobOptions: BlockBlobUploadOptions = { blobHTTPHeaders: { blobContentType: data.mime } };
//             logger.debug("trying to upload => %s", pathFix);
//             const file = bucket.file(pathFix);
//             const buffer = (() => {
//                 if (typeof data.file === "string") {
//                     return Buffer.from(data.file.replace(/^data:image\/\w+;base64,/, ""), "base64");
//                 }
//                 if (data.file instanceof ArrayBuffer) {
//                     return Buffer.from(data.file);
//                 }
//                 return data.file; // Assume it's already a Buffer
//             })();
//             const passthroughStream = new stream.PassThrough();
//             passthroughStream.write(buffer);
//             passthroughStream.end();
//             passthroughStream.pipe(file.createWriteStream()).on("finish", () => {
//                 // The file upload is complete
//                 logger.debug("file upload is complete");
//                 const baseUrl =
//                     typeof storageInfo.cdn === "string" && storageInfo.cdn.length > 0
//                         ? storageInfo.cdn
//                         : `https://storage.googleapis.com/${storageInfo.bucket}`;
//                 const remoteUrl: string = `${baseUrl}/${pathFix}`;
//                 data.remoteUrl = remoteUrl;
//                 return resolve({ ...data, filePath: pathFix });
//             });
//         } catch (err) {
//             console.error(err);
//             return resolve({ ...data, filePath: "" });
//         }
//     });
// }

// export async function moveFileGCP(
//     storageInfo: IStorageDetails,
//     data: IPayloadAttachment & { sourcePath: string }
// ): Promise<ErrorFirstResponse<IPayloadAttachment & { filePath: string }>> {
//     try {
//         if (!(storageInfo.credentials && typeof storageInfo.credentials === "object")) {
//             throw new Error("incorrect gcp credentials.");
//         }
//         const storage = new Storage({
//             credentials: storageInfo.credentials,
//             projectId: storageInfo.credentials?.project_id,
//         });
//         const bucket = storage.bucket(storageInfo.bucket);

//         const blobName = `${data.uploadDir ? data.uploadDir : ""}/${data.fileName}`;

//         // fix
//         const pathFix = blobName
//             .split("/")
//             .filter((el) => el !== "" && el.length > 0)
//             .join("/");

//         // const blobOptions: BlockBlobUploadOptions = { blobHTTPHeaders: { blobContentType: data.mime } };
//         logger.debug("trying to upload => %s", pathFix);
//         const destinationBlob = bucket.file(pathFix);
//         const sourceBlob = bucket.file(data.sourcePath);
//         await sourceBlob.copy(destinationBlob);
//         await sourceBlob.delete();
//         const baseUrl =
//             typeof storageInfo.cdn === "string" && storageInfo.cdn.length > 0
//                 ? storageInfo.cdn
//                 : `https://storage.googleapis.com/${storageInfo.bucket}`;
//         const remoteUrl: string = `${baseUrl}/${pathFix}`;
//         data.remoteUrl = remoteUrl;
//         return ErrorFirstResponse.success({ ...data, filePath: pathFix });
//     } catch (err) {
//         console.error(err);
//         return ErrorFirstResponse.error("can not move file");
//     }
// }

// export async function deleteFromGCPTemp(
//     storageInfo: IStorageDetails,
//     data: {
//         filePath: string;
//     }
// ): Promise<ErrorFirstResponse<string>> {
//     try {
//         if (!(storageInfo.credentials && typeof storageInfo.credentials === "object")) {
//             throw new Error("incorrect gcp credentials.");
//         }
//         const storage = new Storage({
//             credentials: storageInfo.credentials,
//             projectId: storageInfo.credentials?.project_id,
//         });
//         const bucket = storage.bucket(storageInfo.bucket);

//         const file = bucket.file(data.filePath);

//         // Delete the file
//         await file.delete();
//         return ErrorFirstResponse.success("file deleted successfully");
//     } catch (err) {
//         console.error(err);
//         return ErrorFirstResponse.error(err instanceof Error ? err : "unable to delete file");
//     }
// }

// export async function uploadToGCPByPath(
//     storageInfo: IStorageDetails,
//     data: IPayloadAttachment
// ): Promise<ErrorFirstResponse<IPayloadAttachment>> {
//     try {
//         if (!(storageInfo.credentials && typeof storageInfo.credentials === "object")) {
//             throw new Error("incorrect gcp credentials.");
//         }
//         const storage = new Storage({
//             credentials: storageInfo.credentials,
//             projectId: storageInfo.credentials?.project_id,
//         });
//         const bucket = storage.bucket(storageInfo.bucket);
//         const blobName = `${data.uploadDir ? data.uploadDir : ""}/${data.fileName}`;

//         // fix
//         const pathFix = blobName
//             .split("/")
//             .filter((el) => el !== "" && el.length > 0)
//             .join("/");
//         if (!data.file) {
//             return ErrorFirstResponse.error(new Error("file path not found"));
//         }
//         const onUpload = await bucket.upload(data.file as string, { destination: pathFix });
//         if (onUpload) {
//             logger.debug("file upload is complete");
//             const baseUrl =
//                 typeof storageInfo.cdn === "string" && storageInfo.cdn.length > 0
//                     ? storageInfo.cdn
//                     : `https://storage.googleapis.com/${storageInfo.bucket}`;
//             const remoteUrl: string = `${baseUrl}/${pathFix}`;
//             data.remoteUrl = remoteUrl;
//         }
//         return ErrorFirstResponse.success(data);
//     } catch (err) {
//         logger.error(err);
//         return ErrorFirstResponse.error(err as Error);
//     }
// }
