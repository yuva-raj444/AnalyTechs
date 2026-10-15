# 🚀 AnalyTechs

**AnalyTechs** is a full-stack user analytics platform that tracks user interactions on web pages and turns them into useful session insights and click heatmaps.

It is designed as a lightweight alternative to heavy analytics tools, with a simple embeddable tracker, session-based analytics, and document-aware heatmaps that work across scrolling pages.

---

## 🌐 Hosted Version

- **Dashboard:** https://webheatmap.vercel.app/
- **Demo:** https://heatmapdemo-six.vercel.app/
- **API:** https://analyteck444.onrender.com

---

## ✨ What AnalyTechs Does

### Event Tracking
The tracking SDK automatically captures:

- Page views
- Click events
- Anonymous session ID
- Page URL
- Timestamp
- Click coordinates
- Viewport and document dimensions

Events are sent to the backend in batches to reduce unnecessary network requests.

### Session Analytics
The dashboard provides:

- List of user sessions
- Total event count per session
- Last activity
- Complete event timeline
- User journey through pages

### Click Heatmaps
AnalyTechs visualizes where users click on a page.

The heatmap supports:

- Multiple pages
- Full-page coordinates
- Scrolling pages
- Mobile, tablet and desktop filtering
- Automatic page discovery

Document coordinates are captured instead of relying only on viewport coordinates, allowing clicks to remain correctly positioned relative to the actual page.

---

## 🏗️ Architecture

```text
                    ┌──────────────────┐
                    │   Demo Website   │
                    └────────┬─────────┘
                             │
                       Tracker SDK
                             │
                             ▼
                    ┌──────────────────┐
                    │   Fastify API    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ MongoDB / Atlas  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Next.js Dashboard│
                    └──────────────────┘
```

The tracker sends immutable event records to the API. The dashboard then derives sessions, journeys, page statistics and heatmaps from the stored events.

---

## 🛠️ Tech Stack

| Area | Technology |
|---|---|
| Dashboard | Next.js 16, TypeScript, Tailwind CSS |
| API | Fastify, TypeScript |
| Validation | Zod |
| Database | MongoDB / MongoDB Atlas |
| Tracker | Vanilla TypeScript |
| Heatmap | heatmap.js |
| Testing | Vitest, Playwright |
| Monorepo | pnpm, Turborepo |
| Deployment | Vercel, Render |
| Containers | Docker |

---

# 🚀 Setup

## Requirements

- Node.js 20+
- pnpm 10+
- MongoDB 7+ or MongoDB Atlas

## Installation

```bash
git clone https://github.com/yuva-raj444/AnalyTechs.git
cd AnalyTechs
pnpm install
```

## Environment

Create the API environment file:

```env
MONGODB_URI=<your-mongodb-connection-string>
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

## Run

```bash
pnpm dev
```

Local services:

```text
Dashboard → http://localhost:3000
API       → http://localhost:4000
Demo      → http://localhost:5173
```

## Production Build

```bash
pnpm build
```

---

# 📡 Tracker Integration

The tracker can be loaded directly from the API:

```html
<script
  src="http://localhost:4000/tracker.js"
  data-api="http://localhost:4000"
  data-project-id="demo-project">
</script>
```

For production, replace the API URL with the deployed API.

The tracker automatically creates and persists an anonymous session ID using browser local storage.

---

# 📊 Event Model

The main tracked event types are:

```text
page_view
click
```

A click event contains information such as:

```text
projectId
sessionId
type
page.url
timestamp
click coordinates
viewport dimensions
document dimensions
```

This allows the analytics system to understand both **what happened** and **where it happened on the page**.

---

# 🔌 API

Main endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API health check |
| POST | `/v1/events/batch` | Store tracking events |
| GET | `/v1/sessions` | List sessions |
| GET | `/v1/sessions/:sessionId/events` | Get session events |
| GET | `/v1/heatmap` | Get heatmap click data |
| GET | `/v1/pages` | Discover tracked pages |

The API validates incoming event data before storing it.

---

# 🗺️ Heatmap Implementation

A major part of the project is making the heatmap work correctly on long and scrollable pages.

Instead of storing only viewport coordinates:

```text
x = clientX
y = clientY
```

the tracker stores document-aware coordinates:

```text
documentX = clientX + scrollX
documentY = clientY + scrollY
```

It also records:

```text
documentWidth
documentHeight
viewportWidth
viewportHeight
```

The dashboard normalizes these coordinates against the original document dimensions before rendering the heatmap.

This prevents the heatmap from simply floating over the dashboard viewport and allows clicks to stay aligned with the corresponding location on the target page.

---

# 🗄️ Database

MongoDB stores analytics as event records.

Important indexes are created for common queries:

```text
projectId + sessionId + timestamp
projectId + page.url + type
projectId + timestamp
```

This supports efficient session, page and event queries as the dataset grows.

---

# 🔐 Security & Reliability

The API includes:

- Request validation with Zod
- CORS configuration
- Rate limiting
- Security headers
- Health endpoint
- Environment-based configuration
- Anonymous session identifiers
- No required personally identifiable information

The tracker also batches events before sending them, reducing the number of requests generated by active users.

---

# 🧪 Testing

Run the test suite with:

```bash
pnpm test
```

The project includes:

- Unit tests for API/schema validation
- End-to-end testing with Playwright
- Production build verification

---

# 📁 Project Structure

```text
AnalyTechs/
│
├── apps/
│   ├── api/              # Fastify backend
│   ├── dashboard/        # Next.js analytics dashboard
│   ├── demo/             # Demo application
│   └── demo2/            # Multi-page heatmap demo
│
├── packages/
│   ├── tracker/          # Embeddable tracking SDK
│   └── types/            # Shared TypeScript types
│
├── .github/
│   └── workflows/        # CI configuration
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

# 🧠 Assumptions & Trade-offs

- **Anonymous sessions:** Client-generated session IDs provide useful journey tracking without requiring user accounts.
- **Event-based architecture:** Events are stored as immutable records, while sessions and heatmaps are derived from them.
- **Focused tracking:** The SDK tracks page views and clicks to remain lightweight.
- **Document-aware coordinates:** Coordinate and document information allows heatmaps to remain aligned across scrolling pages.
- **Privacy-conscious:** No fingerprinting, keystroke capture, session replay or PII is required.

---

## 👨‍💻 Author

**Yuvaraj G**

GitHub: https://github.com/yuva-raj444

---

⭐ Built as a full-stack analytics project demonstrating event tracking, API design, MongoDB data modeling, session analytics and interactive heatmap visualization.
