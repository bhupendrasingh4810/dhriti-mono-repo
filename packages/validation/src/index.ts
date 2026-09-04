import { z } from "zod";

export { z };

export const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(1),
});
