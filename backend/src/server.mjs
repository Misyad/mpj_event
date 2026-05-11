import http from "node:http"
import { testConnection } from "./db.mjs"
import { bootstrapDatabase } from "./schema.mjs"
import {
  createEvent,
  deleteEvent,
  getEvent,
  getParticipantByToken,
  listEvents,
  listParticipants,
  updateEvent,
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

function getAdminToken(req) {
  const authorization = req.headers.authorization || ""

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7)
  }

  return req.headers["x-admin-token"] || ""
}

function requireAdmin(req, res) {
  const expectedToken = process.env.ADMIN_API_TOKEN || "mpj-event-admin-token"

  if (getAdminToken(req) !== expectedToken) {
    sendJson(res, 401, {
      ok: false,
      error: "Unauthorized admin API request",
    })
    return false
  }

  return true
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
        "POST /events",
        "PUT /events/:id",
        "PATCH /events/:id",
        "DELETE /events/:id",
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

  if (req.method === "POST" && pathname === "/events") {
    if (!requireAdmin(req, res)) return

    try {
      const event = await createEvent(await readJson(req))

      return sendJson(res, 201, {
        ok: true,
        data: event,
      })
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create event",
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

  if ((req.method === "PUT" || req.method === "PATCH") && pathname.startsWith("/events/")) {
    if (!requireAdmin(req, res)) return

    try {
      const id = decodeURIComponent(pathname.split("/")[2] || "")
      const event = await updateEvent(id, await readJson(req))

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
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update event",
      })
    }
  }

  if (req.method === "DELETE" && pathname.startsWith("/events/")) {
    if (!requireAdmin(req, res)) return

    try {
      const id = decodeURIComponent(pathname.split("/")[2] || "")
      const deleted = await deleteEvent(id)

      if (!deleted) {
        return sendJson(res, 404, {
          ok: false,
          error: "Event not found",
        })
      }

      return sendJson(res, 200, {
        ok: true,
        data: { id },
      })
    } catch (error) {
      return sendJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete event",
      })
    }
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
