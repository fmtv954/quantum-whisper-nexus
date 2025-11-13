# Architecture and Core Flows

## High-Level Architecture

Quantum Voice AI follows a **"Cost-Optimized Enterprise Reliability"** architecture - achieving enterprise-grade performance at 80% lower cost through intelligent service orchestration.

### Design Principles

1. **Real-Time First:** Voice requires <100ms latency for natural conversation
2. **Cost-Aware Scaling:** Auto-scale with cost ceilings per customer
3. **Graceful Degradation:** Maintain core functionality during partial failures
4. **Stateless Where Possible:** Enable horizontal scaling
5. **Vendor Diversity:** Avoid single-point vendor dependencies

---

## System Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Client Layer (Browser/Mobile)                          │
│  - QR Scanner, Web Widget, Voice Call Interface         │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS + WebRTC
┌─────────────────────────────────────────────────────────┐
│  Edge Layer (Vercel Edge Network)                       │
│  - Next.js 14 App Router, API Routes, Middleware        │
└─────────────────────────────────────────────────────────┘
                          ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│  Real-Time Layer (Voice Pipeline)                       │
│  - LiveKit (WebRTC), Deepgram (STT/TTS), Redis          │
└─────────────────────────────────────────────────────────┘
                          ↓ AI Processing
┌─────────────────────────────────────────────────────────┐
│  AI Services Layer                                       │
│  - GPT-4-mini, Gemini File Search, Tavily Web Search    │
└─────────────────────────────────────────────────────────┘
                          ↓ Data Persistence
┌─────────────────────────────────────────────────────────┐
│  Data Layer (Supabase)                                   │
│  - PostgreSQL, Auth, Storage, Realtime                   │
└─────────────────────────────────────────────────────────┘
                          ↓ Webhooks
┌─────────────────────────────────────────────────────────┐
│  Integration Layer                                       │
│  - Asana (Tasks), Slack (Notifications), Resend (Email) │
└─────────────────────────────────────────────────────────┘
```

---

## Main Subsystems

### 1. Authentication & Onboarding
- **Tech:** Supabase Auth with JWT tokens
- **Components:** Login, Signup, Email verification, Onboarding wizard
- **Data:** Users table with RLS policies

### 2. Dashboard & Analytics
- **Tech:** Next.js + Supabase Realtime subscriptions + Recharts
- **Components:** Real-time metrics cards, call volume charts, cost tracking
- **Data:** Conversations, leads, campaigns tables with aggregation queries

### 3. Campaign Management
- **Tech:** Next.js API routes + Supabase PostgreSQL
- **Components:** Campaign CRUD, QR code generation, widget customization
- **Data:** Campaigns, flows, qr_codes tables

### 4. Flow Engine (Visual Designer)
- **Tech:** React Flow library + Zustand state management
- **Components:** Node editor, property panels, testing interface
- **Data:** Flows table with JSONB node definitions
- **Node Types:** Start, Lead Gate, RAG Answer, Clarify, Dispatch, End

### 5. Voice Pipeline (Core AI)
- **Tech:** LiveKit + Deepgram + GPT-4-mini + Gemini RAG + Redis
- **Components:** Call interface, real-time transcript, audio visualizer
- **Data:** Conversations, transcripts, audio sessions (Redis)

### 6. Knowledge Base
- **Tech:** Supabase Storage + Gemini File Search API + PostgreSQL
- **Components:** Document upload, RAG search, Q&A management
- **Data:** Knowledge_base, documents, qna_pairs tables

### 7. Leads Management
- **Tech:** Next.js + Supabase PostgreSQL with full-text search
- **Components:** Leads table, detail view, export functionality
- **Data:** Leads table with qualification scores and metadata

### 8. Agent Workspace (Human Handoff)
- **Tech:** LiveKit + Supabase Realtime + Redis queue
- **Components:** Handoff queue, live call interface, disposition
- **Data:** Handoffs, agents, handoff_rules tables

### 9. Admin & System Monitoring
- **Tech:** Supabase queries + real-time subscriptions + custom metrics
- **Components:** System health dashboard, user management, billing
- **Data:** System_metrics, audit_logs tables

### 10. Developer Portal
- **Tech:** OpenAPI specs + Next.js API routes + webhook system
- **Components:** API docs, sandbox, webhook configuration
- **Data:** Api_keys, webhooks, webhook_events tables

---

## Core Flow 1: Create Campaign

**Steps:**
1. User clicks "Create Campaign" from dashboard
2. **Campaign Setup:** Name, description, target audience selection
3. **Flow Configuration:** Choose template or design custom flow in visual editor
4. **Knowledge Base:** Upload documents or connect web sources for RAG
5. **Integration Setup:** Configure Asana project, Slack channel for leads
6. **Deployment:** Generate QR codes, embed widgets, get voice URLs
7. **Testing:** Simulate calls with test interface before going live

**Data Flow:**
- `POST /api/campaigns` → Insert into campaigns table
- `POST /api/flows` → Create flow definition in flows table
- `POST /api/knowledge/upload` → Store documents in Supabase Storage
- `GET /api/campaigns/[id]/qr` → Generate trackable QR code

---

## Core Flow 2: Configure Flow (Visual Designer)

**Steps:**
1. Open `/flows/designer/[campaignId]` visual editor
2. **Drag Nodes:** Start → Lead Gate → RAG Answer → Dispatch → End
3. **Configure Each Node:**
   - Start: Set greeting message, voice selection
   - Lead Gate: Define email capture, consent wording
   - RAG Answer: Connect knowledge base sources, set confidence thresholds
   - Clarify: Add follow-up questions for ambiguous responses
   - Dispatch: Set handoff triggers (time, keyword, user request)
   - End: Thank you message, next steps
4. **Set Variables:** Define lead qualification fields (name, email, interest level)
5. **Test Flow:** Use built-in simulator with sample conversations
6. **Save & Activate:** Publish flow to campaign

**Data Flow:**
- Load: `GET /api/flows/[campaignId]` → Fetch JSONB node definitions
- Save: `PUT /api/flows/[campaignId]` → Update flow with new nodes
- Test: `POST /api/flows/[campaignId]/test` → Simulate conversation

---

## Core Flow 3: Upload Knowledge (RAG Setup)

**Steps:**
1. Navigate to `/knowledge/upload`
2. **Document Upload:** Drag PDF, DOCX, or TXT files
3. **Processing:** Files uploaded to Supabase Storage
4. **Embedding Generation:** Gemini File Search API processes documents
5. **Indexing:** Embeddings stored for semantic search
6. **Verification:** Test search queries in knowledge analytics panel
7. **Connect to Flow:** Link knowledge base to RAG Answer nodes

**Data Flow:**
- Upload: `POST /api/knowledge/upload` → Store in Supabase Storage
- Process: Background job → Call Gemini File Search API
- Index: Store embeddings in knowledge_base table
- Query: `POST /api/knowledge/search` → Semantic search via Gemini

---

## Core Flow 4: Run Voice Call (End-to-End)

**Steps:**
1. **User Initiates:** Scans QR code or clicks widget
2. **Email Gate:** Enter email and consent to privacy terms
3. **Consent Ticket:** System creates unique consent record with timestamp
4. **Call Initialization:**
   - Browser connects to LiveKit WebRTC room
   - Plays 2-ring audio sequence
   - Establishes bidirectional audio stream
5. **Conversation Loop:**
   - User speaks → LiveKit → Deepgram STT → Text transcript
   - GPT-4-mini processes with conversation context
   - RAG Search: Query Gemini File Search for relevant knowledge
   - If no answer: Fallback to Tavily web search (max 1/conversation)
   - GPT generates response → Deepgram TTS → Audio stream
   - LiveKit → Browser audio playback
6. **Lead Qualification:**
   - System extracts lead data from conversation
   - Calculates qualification score based on flow rules
   - Stores in leads table with full transcript
7. **Handoff Trigger (if applicable):**
   - User requests human: "Can I speak to someone?"
   - Time limit reached (e.g., >5 minutes)
   - Complexity threshold: Low confidence answers
8. **Call End:**
   - User or AI ends call
   - Final transcript saved
   - Lead data persisted
   - Integrations triggered (Asana task, Slack notification)

**Detailed Data Flow:**

```
User Audio → LiveKit WebRTC Room
  ↓
Deepgram STT (streaming)
  ↓
Transcript Text → Redis (session state)
  ↓
GPT-4-mini Conversation Processing
  ↓
RAG Query → Gemini File Search
  ↓ (if no answer)
Tavily Web Search Fallback
  ↓
GPT Response Generation
  ↓
Deepgram TTS (streaming)
  ↓
Audio Response → LiveKit → User Browser
  ↓
(Parallel) Lead Data Extraction → Supabase leads table
  ↓
(Parallel) Conversation State → Redis
  ↓
Call End → Integrations (Asana, Slack)
```

**Latency Targets:**
- User speaks → STT transcript: <50ms
- GPT processing: 200-500ms
- RAG search: 100-300ms
- TTS generation: 100-200ms
- **Total Round-Trip:** <1 second (user stops speaking → AI starts responding)

---

## Core Flow 5: Capture Lead (Data Collection)

**Steps:**
1. **During Conversation:** AI extracts structured data from natural language
   - "Hi, I'm John Smith" → `name: "John Smith"`
   - "My email is john@example.com" → `email: "john@example.com"`
   - "I'm interested in the 3-bedroom model" → `interest: "3-bedroom"`
2. **Lead Gate Node:** Explicit ask for contact info
   - "To send you more information, may I have your email?"
3. **Qualification Scoring:** Rule-based scoring from flow configuration
   - Asked about pricing: +10 points
   - Requested tour: +20 points
   - Mentioned timeline ("next month"): +15 points
4. **Lead Record Creation:**
   - Insert into `leads` table with extracted data
   - Link to campaign, flow, and conversation transcript
   - Calculate and store qualification score
5. **Enrichment (optional):**
   - Lookup company info if B2B lead
   - Append conversation summary generated by GPT
6. **Notification:** Trigger integrations based on score threshold
   - Score >70: Instant Slack notification + Asana high-priority task
   - Score 40-70: Standard Asana task
   - Score <40: Log only, follow-up queue

**Data Flow:**
- Extract: GPT structured output during conversation → Redis temp storage
- Persist: `POST /api/leads` → Insert into leads table
- Score: Apply scoring rules from flow configuration
- Notify: Webhooks to Asana + Slack if thresholds met

---

## Core Flow 6: Handoff to Human

**Steps:**
1. **Trigger Event:**
   - User request: "I'd like to speak with someone"
   - AI decision: Confidence threshold not met
   - Time-based: Call duration exceeds 5 minutes
   - Flow rule: Specific keywords detected ("pricing," "contract")
2. **Handoff Request Creation:**
   - Pause AI conversation loop
   - Save current conversation state and lead data
   - Insert into `handoffs` table with priority and skill requirements
3. **Agent Notification:**
   - Real-time alert to agent dashboard (`/agent/dashboard`)
   - Slack/email notification if no agents online
   - Display lead context: transcript, qualification score, campaign info
4. **Agent Accepts Handoff:**
   - Agent clicks "Accept" on `/agent/handoff/[handoffId]`
   - LiveKit room transitions from AI to human agent
   - Agent sees full conversation history and knowledge base access
5. **Live Conversation:**
   - Agent speaks directly with user via WebRTC
   - System records human portion of conversation
   - Agent has access to lead notes, CRM data, knowledge base
6. **Disposition:**
   - Agent marks outcome: Qualified, Not Interested, Callback Scheduled
   - Updates lead record with final notes
   - Creates follow-up tasks in Asana
7. **Post-Call:**
   - Full transcript (AI + human) saved
   - Lead score recalculated based on agent input
   - Analytics updated: handoff time, resolution, satisfaction

**Data Flow:**
- Trigger: Conversation state → `POST /api/handoff/request`
- Queue: Insert into `handoffs` table, notify agents via Supabase Realtime
- Accept: `POST /api/handoff/accept` → Update handoff status, transition LiveKit room
- Disposition: `PUT /api/handoff/[id]/complete` → Update lead + create tasks

---

## State Management Strategy

### Global App State (React Context)
- User session and authentication
- Current campaign selection
- Theme and UI preferences

### Server State (TanStack Query)
- API data caching with automatic refetch
- Optimistic updates for lead creation
- Background polling for dashboard metrics

### Complex UI State (Zustand)
- Flow designer node positions and connections
- Multi-step form wizard state
- Call interface audio controls and transcript

### Real-Time State (Supabase Realtime)
- Dashboard metric updates (new leads, active calls)
- Agent handoff queue notifications
- System health status changes

---

## Error Handling & Graceful Degradation

### Circuit Breaker Pattern

**Implementation:**
- Track failure rate per service (Deepgram, GPT, LiveKit)
- After 5 consecutive failures within 1 minute: Open circuit
- Redirect to fallback service or degraded mode
- Half-open state after 30 seconds to test recovery

### Service Fallbacks

| Primary Service | Failure Detection | Fallback Service | Impact |
|----------------|-------------------|------------------|---------|
| Deepgram STT | 3s timeout | Browser SpeechRecognition API | Reduced accuracy (~80%) |
| OpenAI GPT | 5s timeout | Cached responses + scripted fallbacks | Basic Q&A only |
| LiveKit WebRTC | Connection failed | Socket.io + MP3 streaming | Higher latency (~500ms) |
| Supabase DB | Timeout | Redis cache + async queue | Delayed persistence |
| Gemini RAG | 2s timeout | Tavily web search | External info only |

### Disaster Recovery (Regional Outage)

**Procedure:**
1. Health check detects >50% API error rate in region
2. Auto-route traffic to secondary region (if multi-region enabled)
3. Switch to fallback AI services (cached responses)
4. Queue all writes for async processing when primary recovers
5. Notify operations team via PagerDuty

**Targets:**
- Recovery Time Objective (RTO): <5 minutes
- Recovery Point Objective (RPO): <1 minute of data loss

---

## Scaling Patterns

### Horizontal Scaling (Stateless Services)
- Vercel Edge Functions: Auto-scale based on request volume
- LiveKit: Add SFU nodes dynamically for concurrent calls
- Supabase: Connection pooling + read replicas for queries

### Vertical Scaling (Stateful Services)
- Redis: Larger instance for more active conversations
- Database: Increase connection limits and memory for analytics queries

### Cost-Aware Scaling
- Per-customer budget enforcement with soft/hard limits
- Real-time cost tracking per service and customer
- Automatic downgrade to cheaper models when approaching budget cap

---

**Next Steps:**  
Proceed to `docs/04-design-system-and-ux-principles.md` for visual design specifications.
