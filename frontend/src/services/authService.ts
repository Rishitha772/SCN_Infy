import type { UserRequest, VerificationCodeRequest, TokenResponse, MessageResponse, RefreshRequest, EmailChangeRequest, User } from '../types';
import { UserRole, UserStatus } from '../types';
import { getStoredUsers, saveStoredUsers } from '../data/mockData';


// Class to simulate authenticating against API endpoints
export class AuthService {
  // Simulated OTP storage
  private static otpStore: Record<string, { code: string; expiry: number; pendingUser?: any }> = {};

  static async register(credentials: UserRequest): Promise<MessageResponse> {
    const users = getStoredUsers();
    const existing = users.find(u => u.email === credentials.email);

    if (existing) {
      if (!existing.is_verified) {
        // Resend logic
        return this.sendSimulatedOTP(existing.email, 'register');
      }
      throw new Error("User already exists. Please log in.");
    }

    // Inst domain validation check
    const domainPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|org|ac\.[a-z]{2}|gov)$/;
    if (!domainPattern.test(credentials.email)) {
      throw new Error("Registration email must be from a recognized academic or research institution (.edu, .org, etc.)");
    }

    if (!credentials.password || credentials.password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    // Create pending user
    const newUser: User = {
      user_id: users.length + 1,
      email: credentials.email,
      role: credentials.requested_role || UserRole.RESEARCHER,
      status: UserStatus.PENDING,
      is_verified: false,
      requested_role: credentials.requested_role || null
    };

    // Temporarily save credentials (simulate DB transaction)
    users.push(newUser);
    saveStoredUsers(users);

    // Save registration credentials mock-hashed password (mocking password checking)
    localStorage.setItem(`pwd_${newUser.email}`, credentials.password);

    return this.sendSimulatedOTP(newUser.email, 'register');
  }

  static async verifyEmail(body: VerificationCodeRequest): Promise<MessageResponse> {
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.email === body.email);

    if (userIndex === -1) {
      throw new Error("User not found.");
    }

    const user = users[userIndex];
    if (user.is_verified) {
      throw new Error("Email is already verified.");
    }

    const savedOTP = this.otpStore[body.email];
    if (!savedOTP || savedOTP.code !== body.code || Date.now() > savedOTP.expiry) {
      throw new Error("Invalid or expired verification code.");
    }

    // Verify user
    users[userIndex].is_verified = true;
    saveStoredUsers(users);
    delete this.otpStore[body.email];

    return { message: "Email verified successfully. Awaiting System Admin approval." };
  }

  static async login(credentials: UserRequest): Promise<MessageResponse> {
    const users = getStoredUsers();
    const user = users.find(u => u.email === credentials.email);
    const savedPassword = localStorage.getItem(`pwd_${credentials.email}`);

    // Initial default check for default mock accounts
    const isDefaultAccount = ["dr.singhal@university.edu", "dr.khandesh@university.edu", "dr.smith@university.edu", "admin@university.edu", "reviewer@university.edu", "inst_admin@university.edu"].includes(credentials.email);
    const isPasswordMatch = isDefaultAccount ? credentials.password === "password123" : credentials.password === savedPassword;

    if (!user || !isPasswordMatch) {
      throw new Error("Invalid email or password.");
    }

    if (!user.is_verified) {
      throw new Error("Email not verified yet. Please register again to trigger verification.");
    }

    if (user.status === UserStatus.PENDING) {
      throw new Error("Account is pending approval. You will receive an email once a System Admin reviews your application.");
    }

    if (user.status === UserStatus.BANNED) {
      throw new Error("This account has been banned by administrators.");
    }

    if (user.status === UserStatus.REJECTED) {
      throw new Error("Your account application was rejected.");
    }

    return this.sendSimulatedOTP(user.email, 'login');
  }

  static async verifyLoginCode(body: VerificationCodeRequest): Promise<TokenResponse> {
    const users = getStoredUsers();
    const user = users.find(u => u.email === body.email);

    if (!user) {
      throw new Error("User not found.");
    }

    const savedOTP = this.otpStore[body.email];
    if (!savedOTP || savedOTP.code !== body.code || Date.now() > savedOTP.expiry) {
      throw new Error("Invalid or expired login code.");
    }

    delete this.otpStore[body.email];

    // Generate mock tokens
    const accessToken = `access_token_${Math.random().toString(36).substring(2)}_${user.email}`;
    const refreshToken = `refresh_token_${Math.random().toString(36).substring(2)}_${user.email}`;

    // Store in localStorage for authentication persistence
    localStorage.setItem("scn_token", accessToken);
    localStorage.setItem("scn_refresh_token", refreshToken);
    localStorage.setItem("scn_current_user_email", user.email);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer"
    };
  }

  static async refresh(body: RefreshRequest): Promise<TokenResponse> {
    if (!body.refresh_token.startsWith("refresh_token_")) {
      throw new Error("Invalid refresh token.");
    }

    const email = body.refresh_token.split("_").pop() || "";
    const users = getStoredUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error("User associated with token not found.");
    }

    const newAccessToken = `access_token_${Math.random().toString(36).substring(2)}_${user.email}`;
    localStorage.setItem("scn_token", newAccessToken);

    return {
      access_token: newAccessToken,
      refresh_token: body.refresh_token,
      token_type: "bearer"
    };
  }

  static async logout(_body: RefreshRequest): Promise<void> {
    localStorage.removeItem("scn_token");
    localStorage.removeItem("scn_refresh_token");
    localStorage.removeItem("scn_current_user_email");
  }

  static async getCurrentUser(): Promise<User | null> {
    const email = localStorage.getItem("scn_current_user_email");
    if (!email) return null;

    const users = getStoredUsers();
    return users.find(u => u.email === email) || null;
  }

  static async requestEmailChange(body: EmailChangeRequest): Promise<MessageResponse> {
    const users = getStoredUsers();
    const existing = users.find(u => u.email === body.new_email);

    if (existing) {
      throw new Error("This email address is already in use by another account.");
    }

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error("No active user session found.");
    }

    // Set pending email change in users list
    const userIndex = users.findIndex(u => u.user_id === currentUser.user_id);
    if (userIndex !== -1) {
      users[userIndex].pending_email = body.new_email;
      saveStoredUsers(users);
    }

    return this.sendSimulatedOTP(body.new_email, 'email_change');
  }

  static async verifyEmailChange(body: VerificationCodeRequest): Promise<MessageResponse> {
    const users = getStoredUsers();
    
    // Find user by pending_email
    const userIndex = users.findIndex(u => u.pending_email === body.email);
    if (userIndex === -1) {
      throw new Error("No pending email update found for this address.");
    }

    const savedOTP = this.otpStore[body.email];
    if (!savedOTP || savedOTP.code !== body.code || Date.now() > savedOTP.expiry) {
      throw new Error("Invalid or expired verification code.");
    }

    // Update email
    const originalEmail = users[userIndex].email;
    users[userIndex].email = body.email;
    users[userIndex].pending_email = null;
    saveStoredUsers(users);

    delete this.otpStore[body.email];

    // Clear password storage from old email to new email
    const password = localStorage.getItem(`pwd_${originalEmail}`);
    if (password) {
      localStorage.setItem(`pwd_${body.email}`, password);
      localStorage.removeItem(`pwd_${originalEmail}`);
    }

    return { message: "Email updated successfully." };
  }

  // Simulated OTP sending utility
  private static sendSimulatedOTP(email: string, purpose: 'register' | 'login' | 'email_change'): MessageResponse {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore[email] = {
      code,
      expiry: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    };

    // Alert the user so they can input it directly during testing!
    console.log(`[AUTH SERVICE] Verification Code for ${email} (${purpose}): ${code}`);
    setTimeout(() => {
      alert(`[DEMO SYSTEM] Verification Code sent to ${email} for ${purpose.toUpperCase()}: ${code}`);
    }, 400);

    return { message: `A 6-digit verification code has been simulated and sent to ${email}.` };
  }
}
