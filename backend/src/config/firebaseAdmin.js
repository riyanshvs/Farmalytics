import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const hasFirebaseAdminConfig = Boolean(projectId && clientEmail && privateKey);

if (hasFirebaseAdminConfig && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const isFirebaseAdminReady = () => hasFirebaseAdminConfig && admin.apps.length > 0;

export const verifyFirebaseToken = async (token) => {
  if (!isFirebaseAdminReady()) {
    throw new Error("Firebase Admin SDK is not configured.");
  }

  return admin.auth().verifyIdToken(token);
};

export default admin;