import { z } from "zod";

export const hrmsProfileFieldDefinitionsSchema = z
  .array(
    z
      .object({
        id: z.string().uuid(),
        label: z.string().trim().min(1, "Field label is required.").max(80),
        type: z.enum(["text", "number", "date", "select", "checkbox"]),
        required: z.boolean(),
        archived: z.boolean(),
        options: z.array(z.string().trim().min(1).max(120)).max(50),
      })
      .strict(),
  )
  .max(50)
  .superRefine((fields, ctx) => {
    const ids = new Set<string>(),
      labels = new Set<string>();
    fields.forEach((field, index) => {
      if (ids.has(field.id))
        ctx.addIssue({ code: "custom", path: [index, "id"], message: "Field IDs must be unique." });
      ids.add(field.id);
      if (!field.archived && labels.has(field.label.toLowerCase()))
        ctx.addIssue({ code: "custom", path: [index, "label"], message: "Active field labels must be unique." });
      if (!field.archived) labels.add(field.label.toLowerCase());
      if ((field.type === "select" && !field.options.length) || (field.type !== "select" && field.options.length))
        ctx.addIssue({ code: "custom", path: [index, "options"], message: "Only select fields require options." });
      if (new Set(field.options.map((option) => option.toLowerCase())).size !== field.options.length)
        ctx.addIssue({ code: "custom", path: [index, "options"], message: "Options must be unique." });
    });
  });
export const updateHrmsProfileFieldCatalogSchema = z
  .object({
    definitions: hrmsProfileFieldDefinitionsSchema,
    version: z.number().int().min(0).max(2_147_483_646),
  })
  .strict();

/** Required checkboxes must be checked; optional checkboxes can be false. */
export function validateHrmsOrganizationFields(
  definitions: readonly z.infer<typeof hrmsProfileFieldDefinitionsSchema>[number][],
  values: Record<string, string | number | boolean | null>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const id of Object.keys(values)) {
    if (!definitions.some((field) => field.id === id)) errors[id] = "Unknown organization field. Reload the profile.";
  }
  for (const field of definitions) {
    if (field.archived) continue;
    const value = values[field.id];
    if (field.type === "checkbox" && field.required && value !== true) {
      errors[field.id] = `${field.label} must be checked.`;
      continue;
    }
    const empty = value === undefined || value === null || (typeof value === "string" && !value.trim());
    if (empty) {
      if (field.required) errors[field.id] = `${field.label} is required.`;
      continue;
    }
    const valid =
      field.type === "text"
        ? typeof value === "string" && value.length <= 1000
        : field.type === "number"
          ? typeof value === "number" && Number.isFinite(value)
          : field.type === "checkbox"
            ? typeof value === "boolean"
            : field.type === "select"
              ? typeof value === "string" && field.options.includes(value)
              : typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                Number.isFinite(new Date(`${value}T00:00:00Z`).getTime()) &&
                new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
    if (!valid) errors[field.id] = `Enter a valid ${field.type} value for ${field.label}.`;
  }
  return errors;
}
