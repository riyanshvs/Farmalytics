import User from "../models/User.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

export const resolveUserFromFirebaseClaims = async (decodedToken) => {
  const firebaseUid = String(decodedToken?.uid || "").trim();
  if (!firebaseUid) {
    return null;
  }

  const email = normalizeEmail(decodedToken?.email);
  const fallbackEmail = email || `${firebaseUid}@firebase.local`;

  let user = await User.findOne({ firebaseUid });
  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    user = await User.create({
      firebaseUid,
      email: fallbackEmail,
      name: decodedToken?.name || "",
      emailVerified: Boolean(decodedToken?.email_verified),
      authProvider: "firebase",
    });
    return user;
  }

  let changed = false;
  if (!user.firebaseUid) {
    user.firebaseUid = firebaseUid;
    changed = true;
  }
  if (email && user.email !== email) {
    user.email = email;
    changed = true;
  }
  if (typeof decodedToken?.email_verified === "boolean" && user.emailVerified !== decodedToken.email_verified) {
    user.emailVerified = decodedToken.email_verified;
    changed = true;
  }
  if (!user.name && decodedToken?.name) {
    user.name = decodedToken.name;
    changed = true;
  }

  if (changed) {
    user.updatedAt = new Date();
    await user.save();
  }

  return user;
};

export default resolveUserFromFirebaseClaims;