// lib/session.js
export const sessionOptions = {
    password: process.env.SESSION_PASSWORD || 'complex_password_at_least_32_chars_long_change_this_in_production_123456789',
    cookieName: 'cranksmith_session',
    ttl: 60 * 60 * 24 * 7, // 7 days
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  };