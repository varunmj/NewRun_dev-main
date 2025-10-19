import { z } from "zod";

export const ProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  currentLocation: z.string().optional(),
  hometown: z.string().optional(),
  birthday: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    const date = new Date(val);
    const currentYear = new Date().getFullYear();
    return date.getFullYear() > 1900 && date.getFullYear() <= currentYear;
  }, "Please enter a valid birth year between 1900 and current year"),
  graduationDate: z.string().optional(), // "YYYY-MM" or free text
  university: z.string().optional(),
  schoolDepartment: z.string().optional(),
  campusDisplayName: z.string().optional(),
  campusPlaceId: z.string().optional(),
  cohortSeason: z.enum(["Spring", "Summer", "Fall"]).optional(),
  cohortYear: z.string().regex(/^\d{4}$/, "Year must be 4 digits").optional(),
  avatar: z.string().optional(),
  // Additional fields for testing
  bio: z.string().optional(),
  interests: z.string().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export type ProfileValues = z.infer<typeof ProfileSchema>;
