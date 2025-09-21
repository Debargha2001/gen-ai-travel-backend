import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const serviceAccount: ServiceAccount = JSON.parse(
  readFileSync(join(process.cwd(), "src/config/gcp-service-account.json"), "utf-8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

export default db;
