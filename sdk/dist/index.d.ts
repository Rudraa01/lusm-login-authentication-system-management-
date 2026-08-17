export {};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthEasyUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface AuthEasyContextValue {
  /** The currently logged in user, or null */
  user: AuthEasyUser | null;
  /** True if user is logged in */
  isAuthenticated: boolean;
  /** True while checking for an existing session */
  loading: boolean;
  /** The last error from a failed auth call */
  authError: string | null;

  // ─── Auth Methods ─────────────────────────────────────────────────────────

  /**
   * Register a new user. Sends a verification OTP to their email.
   * Follow up with verifyOtp() to complete registration.
   */
  signup(params: { email: string; password: string; name?: string; phone?: string }): Promise<{ success: boolean; message: string; data?: { userId: string; email: string } }>;

  /**
   * Verify the OTP sent after signup.
   * Automatically logs the user in on success.
   */
  verifyOtp(params: { email: string; otp: string }): Promise<{ success: boolean; data?: { user: AuthEasyUser; accessToken: string } }>;

  /**
   * Resend the OTP email to a user who hasn't verified yet.
   */
  resendOtp(params: { email: string }): Promise<{ success: boolean; message: string }>;

  /**
   * Log in with email and password.
   * Session is saved automatically.
   */
  login(params: { email: string; password: string }): Promise<{ success: boolean; data?: { user: AuthEasyUser; accessToken: string } }>;

  /**
   * Log out the current user and clear the local session.
   */
  logout(): void;

  /**
   * Send a password reset OTP to the user's email.
   */
  forgotPassword(params: { email: string }): Promise<{ success: boolean; message: string }>;

  /**
   * Reset the user's password using the OTP they received.
   */
  resetPassword(params: { email: string; otp: string; newPassword: string }): Promise<{ success: boolean; message: string }>;

  /**
   * Get the raw JWT access token for making authenticated requests to your backend.
   */
  getAccessToken(): string | null;
}

export interface AuthEasyProviderProps {
  /** Your AuthEasy project API key (get it from https://autheasy.me/dashboard) */
  apiKey: string;
  /** Optional: override the backend URL if self-hosting AuthEasy */
  baseUrl?: string;
  children: React.ReactNode;
}

export interface AuthButtonProps {
  /** Color theme for the built-in modal UI */
  theme?: 'dark' | 'light';
  /** Extra CSS class on the trigger button */
  className?: string;
  /** Label shown on the trigger button */
  buttonText?: string;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

import React from 'react';

export declare function AuthEasyProvider(props: AuthEasyProviderProps): JSX.Element;
export declare function useAuthEasy(): AuthEasyContextValue;
export declare function AuthButton(props: AuthButtonProps): JSX.Element;
