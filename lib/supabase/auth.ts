import { createClient } from './client'

// Callback signatures match the Flutter custom action patterns
interface AuthCallbacks {
  onSuccess?: () => void
  onError?: (message: string) => void
}

interface SignInCallbacks extends AuthCallbacks {
  onInvalidEmail?: () => void
  onWrongPassword?: () => void
  onUserNotFound?: () => void
}

interface SignUpCallbacks extends AuthCallbacks {
  onEmailAlreadyInUse?: () => void
  onWeakPassword?: () => void
}

interface OtpCallbacks extends AuthCallbacks {
  onInvalidEmail?: () => void
}

interface VerifyOtpCallbacks extends AuthCallbacks {
  onInvalidOtp?: () => void
  onExpiredOtp?: () => void
}

/**
 * Sign in with email and password.
 * Translated from: supabase_login.dart
 */
export async function signIn(
  email: string,
  password: string,
  callbacks: SignInCallbacks = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (!error) {
    callbacks.onSuccess?.()
    return
  }

  const msg = error.message.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('wrong password')) {
    callbacks.onWrongPassword?.()
    callbacks.onError?.(error.message)
  } else if (msg.includes('user not found') || msg.includes('no user found')) {
    callbacks.onUserNotFound?.()
    callbacks.onError?.(error.message)
  } else if (msg.includes('invalid email')) {
    callbacks.onInvalidEmail?.()
    callbacks.onError?.(error.message)
  } else {
    callbacks.onError?.(error.message)
  }
}

/**
 * Sign up with email, password, and display name.
 * Translated from: supabase_sign_up_no_snack_bar.dart
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
  callbacks: SignUpCallbacks = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, full_name: displayName },
    },
  })

  if (!error) {
    callbacks.onSuccess?.()
    return
  }

  const msg = error.message.toLowerCase()

  if (msg.includes('already registered') || msg.includes('already in use')) {
    callbacks.onEmailAlreadyInUse?.()
    callbacks.onError?.(error.message)
  } else if (msg.includes('weak password') || msg.includes('password')) {
    callbacks.onWeakPassword?.()
    callbacks.onError?.(error.message)
  } else {
    callbacks.onError?.(error.message)
  }
}

/**
 * Send OTP to email for password reset.
 * Translated from: supabase_send_password_reset_otp.dart
 */
export async function sendPasswordResetOtp(
  email: string,
  callbacks: OtpCallbacks = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (!error) {
    callbacks.onSuccess?.()
    return
  }

  const msg = error.message.toLowerCase()

  if (msg.includes('invalid email')) {
    callbacks.onInvalidEmail?.()
    callbacks.onError?.(error.message)
  } else {
    callbacks.onError?.(error.message)
  }
}

/**
 * Verify OTP code entered by user for password reset.
 * Translated from: supabase_verify_password_reset_otp.dart
 */
export async function verifyPasswordResetOtp(
  email: string,
  code: string,
  callbacks: VerifyOtpCallbacks = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'recovery',
  })

  if (!error) {
    callbacks.onSuccess?.()
    return
  }

  const msg = error.message.toLowerCase()

  if (msg.includes('expired')) {
    callbacks.onExpiredOtp?.()
    callbacks.onError?.(error.message)
  } else if (msg.includes('invalid') || msg.includes('incorrect')) {
    callbacks.onInvalidOtp?.()
    callbacks.onError?.(error.message)
  } else {
    callbacks.onError?.(error.message)
  }
}

/**
 * Update password for currently authenticated user.
 * Translated from: supabase_update_password_no_snack_bar.dart
 */
export async function updatePassword(
  newPassword: string,
  callbacks: AuthCallbacks = {}
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (!error) {
    callbacks.onSuccess?.()
    return
  }

  callbacks.onError?.(error.message)
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}
