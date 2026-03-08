const OTP_STORE = new Map();

export const generateOTP = (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  OTP_STORE.set(phone, { otp, expiresAt });

  console.log(`\n========== OTP for ${phone} ==========`);
  console.log(`Your OTP is: ${otp}`);
  console.log(`Valid for 5 minutes`);
  console.log(`======================================\n`);

  return otp;
};

export const verifyOTP = (phone, otp) => {
  const stored = OTP_STORE.get(phone);

  if (!stored) {
    return { valid: false, message: "OTP not found or expired" };
  }

  if (Date.now() > stored.expiresAt) {
    OTP_STORE.delete(phone);
    return { valid: false, message: "OTP expired" };
  }

  if (stored.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  OTP_STORE.delete(phone);
  return { valid: true, message: "OTP verified" };
};
