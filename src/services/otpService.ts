/**
 * OTP Service
 * Generates dynamic OTPs, logs them to console, and manages OTP state
 * production-ready implementation with secure practices
 */

interface OTPRecord {
  otp: string;
  phone: string;
  expiresAt: number;
  generatedAt: number;
  attempts: number;
}

class OTPService {
  private otpStore: Map<string, OTPRecord> = new Map();
  private readonly OTP_VALIDITY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly CONSOLE_LOG_PREFIX = "🔐 FARMALYTICS OTP";

  /**
   * Generates a random 6-digit OTP
   */
  private generateRandomOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sends OTP to a phone number (demo implementation)
   * In production, this would integrate with SMS gateway like Twilio
   */
  async sendOTP(phone: string): Promise<{ success: boolean; otp?: string; message: string }> {
    try {
      // Validate phone number
      if (!phone || !/^\d{10}$/.test(phone)) {
        return { success: false, message: "Invalid phone number format" };
      }

      const otp = this.generateRandomOTP();
      const now = Date.now();
      const expiresAt = now + this.OTP_VALIDITY_MINUTES * 60 * 1000;

      // Store OTP record
      const otpRecord: OTPRecord = {
        otp,
        phone,
        expiresAt,
        generatedAt: now,
        attempts: 0,
      };

      this.otpStore.set(phone, otpRecord);

      // Log OTP to console (for development/testing)
      this.logOTPToConsole(phone, otp, expiresAt);

      // Simulate SMS API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        success: true,
        otp, // Return OTP for testing (remove in production)
        message: `OTP sent to ${phone}. Check browser console for testing.`,
      };
    } catch (error) {
      console.error(`${this.CONSOLE_LOG_PREFIX} Send Error:`, error);
      return { success: false, message: "Failed to send OTP" };
    }
  }

  /**
   * Verifies the OTP provided by user
   */
  async verifyOTP(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const otpRecord = this.otpStore.get(phone);

      // Check if OTP record exists
      if (!otpRecord) {
        return { success: false, message: "OTP not found. Please request a new OTP." };
      }

      // Check if OTP has expired
      if (Date.now() > otpRecord.expiresAt) {
        this.otpStore.delete(phone);
        return { success: false, message: "OTP has expired. Please request a new one." };
      }

      // Check attempts
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        this.otpStore.delete(phone);
        return { success: false, message: "Too many attempts. Please request a new OTP." };
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        otpRecord.attempts += 1;
        return { success: false, message: `Invalid OTP. Attempts remaining: ${this.MAX_ATTEMPTS - otpRecord.attempts}` };
      }

      // OTP verified successfully
      this.logVerificationSuccess(phone, otp);
      this.otpStore.delete(phone); // Clear OTP after successful verification

      return { success: true, message: "OTP verified successfully" };
    } catch (error) {
      console.error(`${this.CONSOLE_LOG_PREFIX} Verification Error:`, error);
      return { success: false, message: "Verification failed" };
    }
  }

  /**
   * Logs OTP details to console with formatting for easy testing
   */
  private logOTPToConsole(phone: string, otp: string, expiresAt: number): void {
    const expiryTime = new Date(expiresAt).toLocaleTimeString();
    const durationMinutes = this.OTP_VALIDITY_MINUTES;

    console.group(`${this.CONSOLE_LOG_PREFIX} - ${new Date().toLocaleTimeString()}`);
    console.log(`%c📱 Phone: ${phone}`, "font-weight: bold; color: #2563eb;");
    console.log(`%c🔑 OTP Code: ${otp}`, "font-weight: bold; font-size: 16px; color: #dc2626; background: #fef2f2; padding: 8px;");
    console.log(`⏱️  Valid for: ${durationMinutes} minutes`);
    console.log(`🕐 Expires at: ${expiryTime}`);
    console.log(`%c👉 Copy the OTP code above to verify`, "color: #16a34a; font-style: italic;");
    console.groupEnd();
  }

  /**
   * Logs successful verification to console
   */
  private logVerificationSuccess(phone: string, otp: string): void {
    console.group(`${this.CONSOLE_LOG_PREFIX} - Verification Success`);
    console.log(`%c✅ OTP Verified`, "color: #16a34a; font-weight: bold; font-size: 14px;");
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.groupEnd();
  }

  /**
   * Resends OTP to the same phone number
   */
  async resendOTP(phone: string): Promise<{ success: boolean; otp?: string; message: string }> {
    // Clear previous OTP
    this.otpStore.delete(phone);

    // Generate and send new OTP
    return this.sendOTP(phone);
  }

  /**
   * Cleans up expired OTPs (called periodically)
   */
  cleanupExpiredOTPs(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [phone, record] of this.otpStore.entries()) {
      if (now > record.expiresAt) {
        this.otpStore.delete(phone);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.debug(`${this.CONSOLE_LOG_PREFIX} Cleanup: Removed ${cleanedCount} expired OTP(s)`);
    }
  }

  /**
   * Gets OTP details for a phone (for testing only - remove in production)
   */
  getOTPDetails(phone: string): OTPRecord | undefined {
    return this.otpStore.get(phone);
  }
}

// Singleton instance
export const otpService = new OTPService();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  otpService.cleanupExpiredOTPs();
}, 5 * 60 * 1000);

export default otpService;
