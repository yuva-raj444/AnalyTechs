import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";

import { config } from "./config.js";
import { events } from "./db.js";
import {
  eventSchema,
  querySchema,
} from "./schemas.js";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
  },
});

/* =========================================================
   SECURITY / CORS
   ========================================================= */

await app.register(helmet, {
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },
});

await app.register(cors, {
  origin: true,

  credentials: false,

  methods: [
    "GET",
    "POST",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
  ],
});

await app.register(rateLimit, {
  max: config.RATE_LIMIT_MAX,
  timeWindow: config.RATE_LIMIT_WINDOW_MS,
});

const heatmapSchema =
  z.object({

    projectId:
      z
        .string()
        .min(1)
        .max(100)
        .default(
          "demo-project"
        ),

    url:
      z
        .string()
        .url()
        .max(2048),
  });

/* =========================================================
   HEALTH
   ========================================================= */

app.get("/health", async () => {
  return {
    status: "ok",
    service: "analytics-api",
    timestamp: new Date().toISOString(),
  };
});

/* =========================================================
   TRACKER
   ========================================================= */

app.get("/tracker.js", async (_, reply) => {
  reply
    .header(
      "Content-Type",
      "application/javascript; charset=utf-8"
    )
    .header(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    )
    .header(
      "Access-Control-Allow-Origin",
      "*"
    )
    .header(
      "Cache-Control",
      "no-store"
    );

  return `
(() => {
  "use strict";

  /*
   * -------------------------------------------------------
   * Configuration
   * -------------------------------------------------------
   */

  const script = document.currentScript;

  const api = (
    script?.dataset.api ||
    "http://localhost:4000"
  ).replace(/\\/$/, "");

  const projectId =
    script?.dataset.projectId ||
    "demo-project";


  /*
   * -------------------------------------------------------
   * Debug
   * -------------------------------------------------------
   */

  console.log(
    "[Analytics] Tracker loaded"
  );

  console.log(
    "[Analytics] API:",
    api
  );

  console.log(
    "[Analytics] Project:",
    projectId
  );


  /*
   * -------------------------------------------------------
   * Session
   * -------------------------------------------------------
   */

  const storageKey =
    "causal_session_" + projectId;

  let sessionId =
    localStorage.getItem(storageKey);

  if (!sessionId) {

    sessionId =
      "sess_" +
      crypto
        .randomUUID()
        .replace(/-/g, "");

    localStorage.setItem(
      storageKey,
      sessionId
    );
  }

  console.log(
    "[Analytics] Session:",
    sessionId
  );


  /*
   * -------------------------------------------------------
   * Event queue
   * -------------------------------------------------------
   */

  let queue = [];

  let flushTimer = null;


  /*
   * -------------------------------------------------------
   * Send events
   * -------------------------------------------------------
   */

  async function flush() {

    if (queue.length === 0) {
      return;
    }

    const batch =
      queue.splice(0, 50);

    console.log(
      "[Analytics] Sending:",
      batch
    );

    try {

      const response =
        await fetch(
          api + "/v1/events/batch",
          {
            method: "POST",

            mode: "cors",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(batch),
          }
        );

      if (!response.ok) {

        throw new Error(
          "HTTP " +
          response.status +
          " " +
          response.statusText
        );
      }

      const result =
        await response.json();

      console.log(
        "[Analytics] Accepted:",
        result
      );

    } catch (error) {

      console.error(
        "[Analytics] Failed to send events:",
        error
      );

      /*
       * Put the events back into
       * the queue so they aren't lost.
       */

      queue.unshift(...batch);
    }
  }


  /*
   * -------------------------------------------------------
   * Schedule flush
   * -------------------------------------------------------
   */

  function scheduleFlush() {

    if (flushTimer !== null) {
      return;
    }

    flushTimer =
      window.setTimeout(
        async () => {

          flushTimer = null;

          await flush();

        },
        500
      );
  }


  /*
   * -------------------------------------------------------
   * Create event
   * -------------------------------------------------------
   */

  function emit(type, click) {

    const event = {

      projectId,

      sessionId,

      type,

      page: {

        url:
          location.href,

        path:
          location.pathname +
          location.search,
      },

      timestamp:
        new Date().toISOString(),

      ...(click
        ? { click }
        : {}),
    };

    console.log(
      "[Analytics] Event:",
      event
    );

    queue.push(event);

    scheduleFlush();
  }


  /*
   * -------------------------------------------------------
   * Click tracking
   * -------------------------------------------------------
   */

  window.addEventListener(
    "click",
    (event) => {

      emit(
        "click",
        {
          x:
            event.clientX,

          y:
            event.clientY,

          documentX:
            event.clientX +
            (window.scrollX || window.pageXOffset || 0),

          documentY:
            event.clientY +
            (window.scrollY || window.pageYOffset || 0),

          documentWidth:
            Math.max(
              document.documentElement.scrollWidth,
              document.body?.scrollWidth || 0,
              document.documentElement.clientWidth,
              window.innerWidth
            ),

          documentHeight:
            Math.max(
              document.documentElement.scrollHeight,
              document.body?.scrollHeight || 0,
              document.documentElement.clientHeight,
              window.innerHeight
            ),

          scrollX:
            window.scrollX || window.pageXOffset || 0,

          scrollY:
            window.scrollY || window.pageYOffset || 0,

          viewportX:
            event.clientX,

          viewportY:
            event.clientY,

          viewportWidth:
            window.innerWidth,

          viewportHeight:
            window.innerHeight,
        }
      );

    },
    {
      passive: true,
    }
  );


  /*
   * -------------------------------------------------------
   * Page lifecycle
   * -------------------------------------------------------
   */

  window.addEventListener(
    "pagehide",
    () => {
      flush();
    }
  );

  window.addEventListener(
    "beforeunload",
    () => {
      flush();
    }
  );


  /*
   * -------------------------------------------------------
   * Initial page view
   * -------------------------------------------------------
   */

  emit("page_view");

})();
`;
});

/* =========================================================
   SINGLE EVENT
   ========================================================= */

app.post(
  "/v1/events",
  async (req, reply) => {

    const parsed =
      eventSchema.safeParse(
        req.body
      );

    if (!parsed.success) {

      return reply
        .code(400)
        .send({
          error: "Invalid event",

          details:
            parsed.error.flatten(),
        });
    }

    const collection =
      await events();

    const document = {
      ...parsed.data,
      createdAt:
        new Date(),
    };

    const result =
      await collection.insertOne(
        document
      );

    return reply
      .code(202)
      .send({
        accepted: true,

        id:
          result.insertedId,
      });
  }
);


/* =========================================================
   BATCH EVENTS
   ========================================================= */

app.post(
  "/v1/events/batch",
  async (req, reply) => {

    const body =
      Array.isArray(req.body)
        ? req.body
        : [];

    if (
      body.length < 1 ||
      body.length > 50
    ) {

      return reply
        .code(400)
        .send({
          error:
            "Batch must contain 1-50 events",
        });
    }

    const parsed =
      body.map((event) =>
        eventSchema.safeParse(
          event
        )
      );

    const invalidIndex =
      parsed.findIndex(
        (result) =>
          !result.success
      );

    if (invalidIndex >= 0) {

      return reply
        .code(400)
        .send({
          error:
            "Invalid event in batch",

          index:
            invalidIndex,
        });
    }

    const collection =
      await events();

    const documents =
      parsed.map(
        (result) => ({
          ...result.data!,
          createdAt:
            new Date(),
        })
      );

    const result =
      await collection.insertMany(
        documents
      );

    return reply
      .code(202)
      .send({
        accepted: true,

        count:
          result.insertedCount,
      });
  }
);


/* =========================================================
   SESSIONS
   ========================================================= */

app.get(
  "/v1/sessions",
  async (req) => {

    const query =
      querySchema.parse(
        req.query
      );

    const collection =
      await events();

    return collection
      .aggregate([
        {
          $match: {
            projectId:
              query.projectId,
          },
        },

        {
          $group: {

            _id:
              "$sessionId",

            eventCount: {
              $sum: 1,
            },

            firstSeen: {
              $min:
                "$timestamp",
            },

            lastSeen: {
              $max:
                "$timestamp",
            },
          },
        },

        {
          $sort: {
            lastSeen: -1,
          },
        },

        {
          $limit:
            query.limit,
        },

        {
          $project: {

            _id: 0,

            sessionId:
              "$_id",

            projectId:
              query.projectId,

            eventCount: 1,

            firstSeen: 1,

            lastSeen: 1,
          },
        },
      ])
      .toArray();
  }
);


/* =========================================================
   SESSION EVENTS
   ========================================================= */

app.get(
  "/v1/sessions/:sessionId/events",
  async (req) => {

    const query =
      querySchema
        .pick({
          projectId: true,
        })
        .parse(
          req.query
        );

    const {
      sessionId,
    } =
      req.params as {
        sessionId: string;
      };

    const collection =
      await events();

    const rows =
      await collection
        .find({
          projectId:
            query.projectId,

          sessionId,
        })
        .sort({
          timestamp: 1,
        })
        .limit(1000)
        .toArray();

    return rows.map(
      ({
        _id,
        createdAt,
        ...event
      }) => ({
        id:
          String(_id),

        ...event,

        createdAt:
          createdAt.toISOString(),
      })
    );
  }
);


/* =========================================================
   PAGES
   ========================================================= */

app.get(
  "/v1/pages",
  async (req) => {

    const query =
      querySchema.parse(
        req.query
      );

    const collection =
      await events();

    return collection
      .aggregate([
        {
          $match: {
            projectId:
              query.projectId,
          },
        },

        {
          $group: {

            _id:
              "$page.url",

            clicks: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$type",
                      "click",
                    ],
                  },

                  1,

                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            clicks: -1,
          },
        },

        {
          $limit: 100,
        },

        {
          $project: {

            _id: 0,

            url:
              "$_id",

            clicks: 1,
          },
        },
      ])
      .toArray();
  }
);


/* =========================================================
   HEATMAP
   ========================================================= */

app.get(
  "/v1/heatmap",
  async (req) => {

    const query =
      heatmapSchema.parse(
        req.query
      );

    const collection =
      await events();

    return collection
      .aggregate([
        {
          $match: {

            projectId:
              query.projectId,

            "page.url":
              query.url,

            type:
              "click",
          },
        },

        {
          $project: {

            _id: 0,

            x: {
              $ifNull: [
                "$click.documentX",
                "$click.x",
              ],
            },

            y: {
              $ifNull: [
                "$click.documentY",
                "$click.y",
              ],
            },

            documentWidth: {
              $ifNull: [
                "$click.documentWidth",
                "$click.viewportWidth",
              ],
            },

            documentHeight: {
              $ifNull: [
                "$click.documentHeight",
                "$click.viewportHeight",
              ],
            },

            viewportWidth:
              "$click.viewportWidth",

            viewportHeight:
              "$click.viewportHeight",

            scrollX: {
              $ifNull: [
                "$click.scrollX",
                0,
              ],
            },

            scrollY: {
              $ifNull: [
                "$click.scrollY",
                0,
              ],
            },

            timestamp: 1,
          },
        },

        {
          $limit: 5000,
        },
      ])
      .toArray();
  }
);


/* =========================================================
   HEATMAP VALIDATION
   ========================================================= */



/* =========================================================
   SHUTDOWN
   ========================================================= */

const shutdown =
  async () => {

    await app.close();

    process.exit(0);
  };

process.on(
  "SIGTERM",
  shutdown
);

process.on(
  "SIGINT",
  shutdown
);


/* =========================================================
   START
   ========================================================= */

const port =
  config.PORT;

await app.listen({
  port,
  host: "0.0.0.0",
});