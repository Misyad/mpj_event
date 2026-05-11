import http from "node:http"
import { testConnection } from "./db.mjs"
import { bootstrapDatabase } from "./schema.mjs"
import {
  getEvent,
  getParticipantByToken,
  listEvents,
  listParticipants,
} from "./repository.mjs"

const port = Number(process.env.PORT || 4000)

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": process.env.CORS_ORIGIN || "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
  })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString("utf8")
  return raw ? JSON.parse(raw) : {}
}

function notFound(res) {
  sendJson(res, 404, {
    ok: false,
    error: "Endpoint not found",
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`)
  const pathname = url.pathname.replace(/\/+$/, "") || "/"

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, null)
  }

  if (req.method === "GET" && pathname === "/") {
    return sendJson(res, 200, {
      ok: true,
      service: "mpj-event-api",
      version: "0.1.0",
      endpoints: [
        "GET /health",
        "GET /events",
        "GET /events/:id",
        "GET /participants",
        "GET /participants?event_id=1",
        "POST /tickets/verify",
      ],
    })
  }

  if (req.method === "GET" && pathname === "/health") {
    try {
      await testConnection()

      return sendJson(res, 200, {
        ok: true,
        service: "mpj-event-api",
        database: "connected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return sendJson(res, 503, {
        ok: false,
        service: "mpj-event-api",
        database: "unavailable",
        error: error instanceof Error ? error.message : "Database connection failed",
      })
    }
  }

  if (req.method === "GET" && pathname === "/events") {
    try {
      return sendJson(res, 200, {
        ok: true,
        data: await listEvents(),
      })
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load events",
      })
    }
  }

  if (req.method === "GET" && pathname.startsWith("/events/")) {
    const id = decodeURIComponent(pathname.split("/")[2] || "")
    const event = await getEvent(id)

    if (!event) {
      return sendJson(res, 404, {
        ok: false,
        error: "Event not found",
      })
    }

    return sendJson(res, 200, {
      ok: true,
      data: event,
    })
  }

  if (req.method === "GET" && pathname === "/participants") {
    try {
      return sendJson(res, 200, {
        ok: true,
        data: await listParticipants(url.searchParams.get("event_id")),
      })
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load participants",
      })
    }
  }

  if (req.method === "POST" && pathname === "/tickets/verify") {
    try {
      const payload = await readJson(req)
      const token = String(payload.qr_token || payload.token || "")
      const participant = await getParticipantByToken(token)

      if (!participant) {
        return sendJson(res, 404, {
          ok: false,
          error: "Ticket token not found",
        })
      }

      return sendJson(res, 200, {
        ok: true,
        data: participant,
      })
    } catch {
      return sendJson(res, 400, {
        ok: false,
        error: "Invalid JSON payload",
      })
    }
  }

  return notFound(res)
})

bootstrapDatabase()
  .then(() => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`MPJ Event API listening on http://0.0.0.0:${port}`)
    })
  })
  .catch((error) => {
    console.error("[MPJ Event API] Failed to initialize database:", error)
    process.exit(1)
  })
