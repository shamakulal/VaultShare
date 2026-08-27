import { z } from "zod";

export const updateVisibilitySchema = z.object({
  visibility: z.enum(["public", "private"], {
    message: "Visibility must be either public or private",
  }),
});