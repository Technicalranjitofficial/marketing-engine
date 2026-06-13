# Marketing Engine

A high-performance email marketing platform with advanced automation, analytics, and A/B testing. Built with Next.js 15 for the frontend and a separate Node.js worker for background email processing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js 15 + React 19 + Tailwind CSS                           │
│  - Dashboard UI                                                  │
│  - API Routes (lightweight - push jobs to queue)                │
│  - Tracking endpoints                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                     ┌─────▼─────┐
                     │   Redis   │  BullMQ Job Queue
                     │  (Queue)  │
                     └─────┬─────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                         WORKER                                   │
│  Node.js Background Process                                     │
│  - Email Processor (nodemailer → Postfix)                       │
│  - Campaign Processor (batching, orchestration)                 │
│  - Automation Processor (drip campaigns, triggers)              │
│  - Analytics Processor (opens, clicks, bounces)                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                     ┌─────▼─────┐
                     │  Postfix  │  Your SMTP Server
                     │   SMTP    │  (kiitconnect.com)
                     └───────────┘
```

## Features

- **Email Campaigns**: Bulk email sending with personalization and templates
- **Contact Management**: Subscriber lists, segmentation, engagement scoring
- **Analytics Dashboard**: Open rates, click tracking, real-time stats
- **Automation Workflows**: Drip campaigns, triggers, conditional logic
- **A/B Testing**: Test subject lines, content, send times
- **Unsubscribe Handling**: CAN-SPAM compliant one-click unsubscribe
- **High Performance**: BullMQ for reliable job processing, connection pooling

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript

**Backend Worker:**
- Node.js with BullMQ
- Nodemailer (SMTP connection to Postfix)
- Prisma ORM

**Database & Queue:**
- PostgreSQL (via Prisma)
- Redis (for BullMQ)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis
- Your Postfix SMTP server (kiitconnect.com)

### Installation

```bash
# Clone and install
cd marketing-engine
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database, Redis, and SMTP settings

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### Development

Run frontend and worker in separate terminals:

```bash
# Terminal 1: Frontend (Next.js)
npm run dev

# Terminal 2: Worker (Background Jobs)
npm run worker
```

### Production

```bash
# Build frontend
npm run build

# Start frontend
npm start

# Start worker (in separate process)
npm run worker:build
npm run worker:start
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/marketing_engine"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# SMTP (Your Postfix Server)
SMTP_HOST="mail.kiitconnect.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""           # If using SASL auth
SMTP_PASS=""           # If using SASL auth

# Rate Limits
SMTP_RATE_LIMIT="50"   # Emails per second
SMTP_DAILY_LIMIT="100000"

# Sender Defaults
DEFAULT_FROM_NAME="Marketing"
DEFAULT_FROM_EMAIL="noreply@kiitconnect.com"

# App URL (for tracking)
BASE_URL="https://yourdomain.com"
```

## API Endpoints

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PATCH /api/campaigns/[id]` - Update campaign
- `POST /api/campaigns/[id]/send` - Queue campaign for sending

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts` - Bulk import contacts

### Lists
- `GET /api/lists` - List all lists
- `POST /api/lists` - Create list

### Tracking
- `GET /api/track/open/[trackingId]` - Track email open
- `GET /api/track/click/[trackingId]` - Track link click

### Stats
- `GET /api/stats` - Dashboard statistics

## Project Structure

```
marketing-engine/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (lightweight)
│   │   ├── campaigns/
│   │   ├── contacts/
│   │   ├── lists/
│   │   ├── stats/
│   │   ├── track/
│   │   └── unsubscribe/
│   ├── page.tsx            # Dashboard
│   ├── layout.tsx
│   └── globals.css         # Dark theme styles
├── components/             # React components
│   ├── layout/
│   └── ui/
├── lib/                    # Frontend utilities
│   ├── db.ts               # Prisma client
│   ├── queue.ts            # Queue client (add jobs only)
│   └── utils.ts
├── worker/                 # Background worker (separate process)
│   ├── index.ts            # Worker entry point
│   ├── queue.ts            # Queue definitions
│   ├── processors/         # Job processors
│   │   ├── email.processor.ts
│   │   ├── campaign.processor.ts
│   │   ├── automation.processor.ts
│   │   └── analytics.processor.ts
│   └── services/
│       └── email.service.ts  # Nodemailer SMTP service
├── prisma/
│   └── schema.prisma       # Database schema
└── package.json
```

## License

MIT
