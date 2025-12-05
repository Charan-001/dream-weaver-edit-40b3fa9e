import { z } from "zod";

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept terms" }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Withdrawal form validation
export const withdrawalSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  bankName: z.string().min(2, "Bank name is required"),
  branch: z.string().min(2, "Branch is required"),
  accountNumber: z.string().regex(/^[0-9]{9,18}$/, "Invalid account number (9-18 digits)"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  panCard: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g., ABCDE1234F)"),
  aadharCard: z.string().regex(/^[0-9]{12}$/, "Aadhar must be 12 digits"),
});

// Lottery creation validation
export const lotterySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  lottery_type: z.enum(["weekly", "monthly", "special", "bumper"]),
  draw_date: z.string().min(1, "Draw date is required"),
  ticket_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Invalid price"),
  first_prize: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Invalid prize amount"),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]),
});

// Profile validation
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits").optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type LotteryInput = z.infer<typeof lotterySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
