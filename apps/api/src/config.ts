import "dotenv/config";

import { z } from "zod";


const schema = z.object({

  PORT:
    z
      .coerce
      .number()
      .int()
      .positive()
      .default(4000),

  MONGODB_URI:
    z
      .string()
      .min(1),

  MONGODB_DB:
    z
      .string()
      .min(1)
      .default(
        "causal_analytics"
      ),

  CORS_ORIGIN:
    z
      .string()
      .default(
        "http://localhost:3000,http://localhost:5173"
      ),

  RATE_LIMIT_MAX:
    z
      .coerce
      .number()
      .int()
      .positive()
      .default(300),

  RATE_LIMIT_WINDOW_MS:
    z
      .coerce
      .number()
      .int()
      .positive()
      .default(60000),

});


export const config =
  schema.parse(
    process.env
  );