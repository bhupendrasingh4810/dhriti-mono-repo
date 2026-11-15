import { z } from "zod";

const text = (max: number) => z.string().trim().max(max).default("");
const dateOnly = z
  .string()
  .refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value <= new Date().toISOString().slice(0, 10)
    );
  }, "Enter a valid date of birth that is not in the future.")
  .default("");

/** Full replacement: empty strings/arrays clear values; unknown keys and duplicate names are rejected. */
export const hrmsEmployeeProfileSchema = z
  .object({
    preferredName: text(120),
    personalEmail: z
      .string()
      .trim()
      .max(254)
      .refine((value) => !value || z.string().email().safeParse(value).success, "Enter a valid email address.")
      .default(""),
    phone: text(40),
    dateOfBirth: dateOnly,
    address: text(1000),
    emergencyContactName: text(120),
    emergencyContactPhone: text(40),
    emergencyContactRelation: text(80),
    skills: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
    customFields: z
      .array(
        z
          .object({
            name: z.string().trim().min(1, "Field name is required.").max(80),
            value: text(1000),
          })
          .strict(),
      )
      .max(50)
      .default([]),
    organizationFields: z
      .record(z.string().uuid(), z.union([z.string().max(1000), z.number().finite(), z.boolean(), z.null()]))
      .optional(),
  })
  .strict()
  .superRefine((profile, ctx) => {
    const skills = new Set<string>();
    profile.skills.forEach((skill, index) => {
      const key = skill.toLowerCase();
      if (skills.has(key))
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["skills", index], message: "Skills must be unique." });
      skills.add(key);
    });
    const names = new Set<string>();
    profile.customFields.forEach((field, index) => {
      const key = field.name.toLowerCase();
      if (names.has(key))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customFields", index, "name"],
          message: "Custom field names must be unique.",
        });
      names.add(key);
    });
  });

export const updateHrmsEmployeeProfileSchema = z
  .object({
    profile: hrmsEmployeeProfileSchema,
    version: z.number().int().min(0).max(2_147_483_646),
    catalogVersion: z.number().int().min(0).max(2_147_483_646).optional(),
  })
  .strict();
