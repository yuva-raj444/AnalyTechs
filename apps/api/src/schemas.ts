import { z } from "zod";

export const eventSchema = z.object({
  projectId: z.string().min(1).max(100),
  sessionId: z.string().regex(/^sess_[a-zA-Z0-9_-]{8,100}$/),
  type: z.enum(["page_view", "click"]),
  page: z.object({
    url: z.string().url().max(2048),
    path: z.string().max(2048),
  }),
  timestamp: z.string().datetime({ offset: true }),
  click: z.object({
    // Legacy viewport coordinates. Kept for compatibility.
    x: z.number().finite().min(0).max(100000),
    y: z.number().finite().min(0).max(100000),

    // New document-relative coordinates.
    documentX: z.number().finite().min(0).max(100000).optional(),
    documentY: z.number().finite().min(0).max(100000).optional(),
    documentWidth: z.number().int().positive().max(100000).optional(),
    documentHeight: z.number().int().positive().max(100000).optional(),

    scrollX: z.number().finite().min(0).max(100000).optional(),
    scrollY: z.number().finite().min(0).max(100000).optional(),
    viewportX: z.number().finite().min(0).max(10000).optional(),
    viewportY: z.number().finite().min(0).max(10000).optional(),

    viewportWidth: z.number().int().positive().max(10000),
    viewportHeight: z.number().int().positive().max(10000),
  }).optional(),
}).superRefine((value, ctx) => {
  if (value.type === "click" && !value.click) {
    ctx.addIssue({
      code: "custom",
      path: ["click"],
      message: "click data is required for click events",
    });
  }

  if (value.type === "page_view" && value.click) {
    ctx.addIssue({
      code: "custom",
      path: ["click"],
      message: "click data is not valid for page_view",
    });
  }
});

export const querySchema = z.object({
  projectId: z.string().min(1).max(100).default("demo-project"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
