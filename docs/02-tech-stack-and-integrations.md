# Tech Stack and Integrations

## Technology Overview

Quantum Voice AI is built on a modern, cost-optimized stack designed for real-time voice processing with enterprise scalability.

**Stack Philosophy:** "Best-of-breed services with intelligent orchestration"

---

## Core Framework & Runtime

### Next.js 14 (App Router)
- **Purpose:** Full-stack React framework with server-side rendering and API routes
- **Version:** 14.0.0+
- **Key Features:**
  - App Router for file-based routing
  - Server Components for performance
  - API Routes for backend logic
  - Middleware for authentication and request handling
- **Docs:** https://nextjs.org/docs

### TypeScript
- **Purpose:** Type safety across frontend and backend
- **Version:** 5.0.0+
- **Configuration:** Strict type checking enabled
- **Key Uses:**
  - Interface definitions for API contracts
  - Type-safe database queries
  - Component prop validation

### Node.js
- **Purpose:** JavaScript runtime for API routes and edge functions
- **Version:** 18.x LTS
- **Use Cases:** Server-side API logic, webhook handling, background jobs

---

## Database & Data Layer

### Supabase (PostgreSQL)
- **Purpose:** Primary database with real-time capabilities and authentication
- **Version:** 2.38.0+ (supabase-js client)
- **Services Used:**
  - **PostgreSQL Database:** Primary data store with JSONB, full-text search
  - **Authentication:** Email/password auth with JWT session management
  - **Row Level Security (RLS):** Fine-grained access control on all tables
  - **Storage:** Knowledge base document storage (PDFs, DOCX, TXT)
  - **Realtime:** WebSocket subscriptions for live dashboard updates
- **Docs:** https://supabase.com/docs

### Redis
- **Purpose:** Session management, caching, and rate limiting
- **Version:** 4.6.0+
- **Use Cases:**
  - Conversation state storage during active calls
  - API rate limiting per customer
  - Temporary audio session metadata
- **Deployment:** Upstash Redis (serverless) or Redis Cloud for production

---

## AI & Voice Infrastructure

### Speech-to-Text: Deepgram Nova-3
- **Purpose:** Real-time speech recognition with high accuracy
- **Cost:** $0.0077/minute (streaming mode)
- **Features:** Punctuation, profanity filter, speaker diarization
- **Latency:** <50ms processing time
- **Docs:** https://developers.deepgram.com/docs

### Text-to-Speech: Deepgram Aura
- **Purpose:** Natural voice synthesis for AI responses
- **Cost:** $0.015-$0.03/1K characters
- **Voice Options:**
  - Aura-1 (female, professional)
  - Aura-2 (male, friendly)
- **Customization:** Speaking rate, pitch, emotion modulation
- **Docs:** https://developers.deepgram.com/docs/tts

### Large Language Model: GPT-4-mini (Primary)
- **Purpose:** Conversation intelligence and response generation
- **Cost:** ~$0.15/1M input tokens, $0.60/1M output tokens
- **Context Window:** 128K tokens
- **Fallback:** GPT-4.1-mini for complex or long conversations
- **Optimization:** Context window management, intelligent caching
- **Docs:** https://platform.openai.com/docs/models

### Real-Time Audio Transport: LiveKit
- **Purpose:** Scalable WebRTC audio streaming and room management
- **Cost:** $0.004-$0.005/participant-minute
- **Features:**
  - Audio-only WebRTC for cost optimization
  - Selective Forwarding Unit (SFU) for scalability
  - Recording capabilities (optional)
  - 10,000+ concurrent connections supported
- **Docs:** https://docs.livekit.io

### RAG & Knowledge Base: Google Gemini File Search API
- **Purpose:** Document processing, embeddings, and semantic search
- **Features:**
  - PDF/DOCX/TXT automatic processing
  - Embedding generation for semantic search
  - Citation generation for answer attribution
  - Multi-document context aggregation
- **Docs:** https://ai.google.dev/docs/file_search

### Web Search Fallback: Tavily API
- **Purpose:** Web search when RAG knowledge base has no answer
- **Cost:** $0.008/call
- **Use Case:** Third-line failsafe for unanswered questions
- **Strategy:** Max 1 search per conversation to control costs
- **Docs:** https://tavily.com/docs

---

## Integrations & Third-Party Services

### Asana API
- **Purpose:** Callback task creation and CRM workflow automation
- **Key Endpoints:**
  - `POST /tasks` - Create callback tasks with lead context
  - `PUT /tasks/{task_gid}` - Update task status after completion
  - `GET /projects` - List projects for task assignment
- **Authentication:** OAuth 2.0 or Personal Access Token
- **Docs:** https://developers.asana.com/docs

### Slack Webhooks
- **Purpose:** Real-time lead notifications to sales teams
- **Implementation:** Incoming webhooks for instant alerts
- **Payload:** Lead info, conversation summary, qualification score
- **Use Case:** Notify sales team within seconds of high-value lead capture
- **Docs:** https://api.slack.com/messaging/webhooks

### Resend (Email Service)
- **Purpose:** Transactional emails and lead confirmations
- **Use Cases:**
  - Email verification for lead gate
  - High-value lead notifications
  - Callback appointment confirmations
- **Docs:** https://resend.com/docs

---

## Frontend Technologies

### Tailwind CSS
- **Version:** 3.3.0+
- **Purpose:** Utility-first CSS with custom design system
- **Configuration:** Extended with Quantum Voice AI design tokens
- **Docs:** https://tailwindcss.com/docs

### UI Component Library: shadcn/ui
- **Purpose:** Accessible, customizable React components
- **Components Used:**
  - Button, Card, Table, Dialog, Sheet, Tabs
  - Form components with react-hook-form integration
  - Toast notifications with Sonner
- **Docs:** https://ui.shadcn.com

### Icons: Lucide React
- **Purpose:** Consistent icon system
- **Style:** Outlined, clean, minimal
- **Docs:** https://lucide.dev/icons/

### Animation (Optional): Framer Motion
- **Purpose:** Smooth transitions and micro-interactions
- **Use Cases:** Page transitions, loading states, hover effects
- **Docs:** https://www.framer.com/motion/

### Web Audio API
- **Purpose:** Browser-based audio playback and processing
- **Use Cases:**
  - Ringtone playback (2-ring sequence before call)
  - Audio context management
  - Volume monitoring for diagnostics
- **Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

## Authentication & Security

### Supabase Auth
- **Purpose:** User authentication and session management
- **Features:**
  - Email/password authentication
  - JWT token generation and validation
  - Session persistence with httpOnly cookies
  - Row Level Security (RLS) integration
- **Docs:** https://supabase.com/docs/guides/auth

### JSON Web Tokens (JWT)
- **Purpose:** Secure API authentication for callback links
- **Library:** Built into Supabase Auth
- **Use Case:** Short-lived tokens for secure callback task URLs

---

## Deployment & DevOps

### Vercel
- **Purpose:** Production hosting and edge network
- **Features:**
  - Automatic Git deployments
  - Environment variable management
  - Serverless function optimization
  - Global CDN for <50ms latency
  - Edge middleware for authentication
- **Docs:** https://vercel.com/docs

### Environment Management
- **Local:** `.env.local` files (gitignored)
- **Production:** Vercel Environment Variables (encrypted)
- **Secrets:** Supabase Vault for sensitive API keys

---

## Monitoring & Analytics

### Custom Analytics
- **Implementation:** Supabase tables + real-time dashboard
- **Metrics Tracked:**
  - Call duration and volume
  - Lead conversion rates
  - AI response times and accuracy
  - Cost per lead and per service
  - Handoff request rates

### Error Tracking: Sentry (Optional)
- **Purpose:** Error monitoring and performance tracking
- **Features:** Error boundaries, API error logging, performance profiling
- **Docs:** https://docs.sentry.io/

---

## Utility Libraries & Tools

### QR Code Generation
- **Library:** `qr-code-styling` or `qrcode`
- **Purpose:** Dynamic QR code generation with branding
- **Docs:** https://www.npmjs.com/package/qr-code-styling

### File Processing
- **PDF.js:** PDF text extraction for knowledge base
- **Native File API:** DOCX and TXT processing
- **Docs:** https://mozilla.github.io/pdf.js/

### Date/Time: date-fns
- **Purpose:** Date manipulation and formatting
- **Docs:** https://date-fns.org/

### Validation: Zod
- **Purpose:** Schema validation for API requests and forms
- **Docs:** https://zod.dev/

---

## Technology Stack Summary Table

| Service | Purpose | Where Used | Cost/Minute |
|---------|---------|------------|-------------|
| **LiveKit** | WebRTC audio transport | Call interface | $0.0045 |
| **Deepgram STT** | Speech-to-text | Voice pipeline | $0.0077 |
| **Deepgram TTS** | Text-to-speech | Voice pipeline | $0.018 |
| **GPT-4-mini** | Conversation AI | Voice pipeline | $0.00015/1K tok |
| **Gemini File Search** | RAG knowledge base | Voice pipeline | Included |
| **Supabase** | Database + auth + storage | Backend | $0.00042 |
| **Redis** | Session + cache | Backend | $0.00012 |
| **Vercel** | Hosting + edge | Deployment | Included |
| **Asana** | Task creation | Integrations | Free tier |
| **Slack** | Notifications | Integrations | Free webhooks |
| **TOTAL** | **Per-minute COGS** | **Full stack** | **$0.031** |

---

## Development Dependencies

```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@deepgram/sdk": "^2.0.0",
    "openai": "^4.20.0",
    "@google/generative-ai": "^0.8.0",
    "livekit-server-sdk": "^2.0.0",
    "livekit-client": "^2.0.0",
    "asana": "^0.18.0",
    "tavily": "^1.0.0",
    "resend": "^3.0.0",
    "redis": "^4.6.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.462.0",
    "date-fns": "^2.30.0",
    "uuid": "^9.0.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## Scaling Architecture Tiers

### Tier 1: 1-50 Concurrent Calls
- **Architecture:** Single Vercel deployment, Supabase Starter
- **Redis:** Vercel KV (built-in)
- **Cost:** $0.031/minute

### Tier 2: 50-500 Concurrent Calls
- **Architecture:** Vercel + dedicated LiveKit instance
- **Database:** Supabase Pro with connection pooling
- **Redis:** Upstash Redis (serverless)
- **Cost:** $0.028/minute (economies of scale)

### Tier 3: 500-5000+ Concurrent Calls
- **Architecture:** Multi-region Vercel deployment
- **Database:** Supabase Enterprise with read replicas
- **Redis:** Redis Cluster with sharding
- **Cost:** $0.025/minute (optimized routing)

---

**Next Steps:**  
Proceed to `docs/03-architecture-and-core-flows.md` for system architecture and data flow details.
