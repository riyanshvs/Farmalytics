import admin from "firebase-admin";

const getFirebaseAdminConfig = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return {
    projectId,
    clientEmail,
    privateKey,
    hasConfig: Boolean(projectId && clientEmail && privateKey),
  };
};

const ensureFirebaseAdminInitialized = () => {
  const config = getFirebaseAdminConfig();
  if (!config.hasConfig) {
    return false;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    });
  }

  return true;
};

export const isFirebaseAdminReady = () => ensureFirebaseAdminInitialized() && admin.apps.length > 0;

export const verifyFirebaseToken = async (token) => {
  if (!isFirebaseAdminReady()) {
    throw new Error("Firebase Admin SDK is not configured.");
  }

  return admin.auth().verifyIdToken(token);
};

export default admin;