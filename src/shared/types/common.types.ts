import type {
  User,
  Session,
  MembershipPlan,
  Membership,
  GymClass,
  Booking,
  Checkin,
  Payment,
  Notification,
  TrainerAvailability,
  Company,
  CompanyMember,
  CorporateBooking,
  Reschedule,
} from "@/db/schema";

export type UserRole = "member" | "trainer" | "admin";
export type BookingStatus = "booked" | "cancelled" | "attended" | "no_show" | "waitlisted";
export type MembershipStatus = "active" | "expired" | "cancelled" | "frozen";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "card" | "cash" | "upi" | "transfer";
export type CheckinSource = "front_desk" | "kiosk" | "app";
export type NotificationType = "waitlist_promotion" | "class_cancelled" | "membership_expiring" | "announcement";

export type {
  User,
  Session,
  MembershipPlan,
  Membership,
  GymClass,
  Booking,
  Checkin,
  Payment,
  Notification,
  TrainerAvailability,
  Company,
  CompanyMember,
  CorporateBooking,
  Reschedule,
};
