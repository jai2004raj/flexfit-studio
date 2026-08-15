/**
 * Studio-wide domain constants and configuration values.
 */

/**
 * Members may cancel free of charge up to this many hours before the class starts.
 * Cancelling later still frees the spot but forfeits the credit.
 */
export const FREE_CANCELLATION_HOURS = 12;

/**
 * Corporate members may cancel free of charge up to this many hours before
 * the class starts. Cancelling later still frees the spot but forfeits the credit.
 */
export const CORPORATE_FREE_CANCELLATION_HOURS = 24;

/**
 * Members may reschedule free of charge up to this many hours before the
 * original class starts. This is more generous than cancellation policy.
 */
export const FREE_RESCHEDULE_HOURS = 4;

/**
 * Plans with this many credits are treated as unlimited and never decrement.
 */
export const UNLIMITED_CREDITS = 999;

/**
 * Session duration in days for persistent cookie authentication.
 */
export const SESSION_DAYS = 30;

/**
 * Session cookie name used across the application.
 */
export const SESSION_COOKIE = "flexfit_session";
