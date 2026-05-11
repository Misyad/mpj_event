import http from "node:http"
import { events, participants } from "./data.mjs"

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
    return sendJson(res, 200, {
      ok: true,
      service: "mpj-event-api",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  }

  if (req.method === "GET" && pathname === "/events") {
    return sendJson(res, 200, {
      ok: true,
      data: events,
    })
  }

  if (req.method === "GET" && pathname.startsWith("/events/")) {
    const id = decodeURIComponent(pathname.split("/")[2] || "")
    const event = events.find((item) => item.id === id)

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
    const eventId = url.searchParams.get("event_id")
    const data = eventId
      ? participants.filter((item) => item.event_id === eventId)
      : participants

    return sendJson(res, 200, {
      ok: true,
      data,
    })
  }

  if (req.method === "POST" && pathname === "/tickets/verify") {
    try {
      const payload = await readJson(req)
      const token = String(payload.qr_token || payload.token || "")
      const participant = participants.find((item) => item.qr_token === token)

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

server.listen(port, "0.0.0.0", () => {
  console.log(`MPJ Event API listening on http://0.0.0.0:${port}`)
})
