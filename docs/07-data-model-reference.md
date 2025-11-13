# Data Model Reference

**Quick Reference:** Core database schema for Quantum Voice AI Platform

## Overview

The database follows a **multi-tenant SaaS architecture** where:
- **Accounts** are the root tenant entities (companies/workspaces)
- **Users** can belong to multiple accounts with different **roles** (owner/admin/member/agent)
- All data is scoped to accounts and protected by **Row Level Security (RLS)**

## Entity Relationships

```
accounts
  ├── account_memberships (many users)
  ├── campaigns
  │   ├── flows (conversation logic)
  │   ├── call_sessions
  │   │   ├── call_transcripts
  │   │   └── leads
  │   └── handoff_requests
  ├── knowledge_sources
  │   └── knowledge_documents
  └── integrations

users
  └── account_memberships (many accounts)
```

## Core Tables

### Multi-Tenancy

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `accounts` | Root tenant entities | `id`, `name`, `slug`, `plan`, `status` |
| `users` | User profiles (links to `auth.users`) | `id`, `auth_user_id`, `email`, `name` |
| `account_memberships` | User-to-account relationships with roles | `account_id`, `user_id`, `role` |

**Roles:** `owner` > `admin` > `member` > `agent`

### Campaigns & Flows

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `campaigns` | Voice AI campaigns | `id`, `account_id`, `name`, `status`, `entry_type`, `primary_flow_id` |
| `flows` | Node-based conversation logic | `id`, `account_id`, `campaign_id`, `definition` (JSONB) |

**Flow Node Types:** `start`, `lead_gate`, `rag_answer`, `clarify`, `dispatch`, `end`

### Knowledge Base (RAG)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `knowledge_sources` | Logical groupings (e.g., "Help Center") | `id`, `account_id`, `type`, `config` |
| `knowledge_documents` | Individual files/chunks | `id`, `source_id`, `status`, `uri_or_path`, `metadata` |

**Source Types:** `uploaded_doc`, `web_crawl`, `manual_qna`, `api_sync`

### Calls & Transcripts

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `call_sessions` | Each voice call instance | `id`, `account_id`, `campaign_id`, `lead_id`, `status`, `duration_ms`, `cost_cents` |
| `call_transcripts` | Conversation segments | `id`, `call_id`, `speaker`, `text`, `offset_ms` |

**Call Statuses:** `connecting` → `active` → `completed`/`failed`/`abandoned`

**Speakers:** `caller`, `ai_agent`, `human_agent`, `system`

### Leads & Handoff

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `leads` | Captured contact info | `id`, `account_id`, `email`, `phone`, `status`, `score`, `intent_summary` |
| `handoff_requests` | AI → human escalation queue | `id`, `account_id`, `lead_id`, `status`, `priority`, `assigned_to_user_id` |

**Lead Statuses:** `new` → `contacted` → `qualified`/`converted`/`unqualified`

### Integrations & Audit

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `integrations` | External service configs | `id`, `account_id`, `type`, `config`, `active` |
| `audit_logs` | Security & compliance tracking | `id`, `account_id`, `user_id`, `event_type`, `entity_type` |

**Integration Types:** `slack`, `asana`, `webhook`, `email`, `crm`

## Security (RLS)

All tables have **Row Level Security** enabled with policies that:
- Restrict access to data within user's accounts
- Enforce role-based permissions (owners/admins have elevated access)
- Use security definer functions to avoid recursive policy checks

### Helper Functions

- `get_user_account_ids()` - Returns UUIDs of accounts user belongs to
- `has_account_role(account_id, role)` - Checks if user has specific role (with inheritance)

## Indexes

Optimized indexes on:
- All `account_id` foreign keys (tenant isolation)
- Status fields for filtering
- Timestamp fields for sorting
- Email fields for lookups

## TypeScript Types

All database types are defined in `/types/db.ts` with:
- Interface for each table matching the schema
- Enum types for status fields
- Insert/Update helper types
- Extended types with joins (e.g., `CampaignWithFlow`)

**Example:**
```typescript
import { Campaign, Lead, CallSession } from '@/types/db';
import { supabase } from '@/integrations/supabase/client';

// Query with RLS automatically applied
const { data: campaigns } = await supabase
  .from('campaigns')
  .select('*')
  .eq('status', 'active');
```

## Data Flow Example

**Typical voice call journey:**
1. User creates `campaign` with `primary_flow_id`
2. QR code scanned → `call_session` created (status: `connecting`)
3. AI follows `flow` definition (nodes: start → lead_gate → rag_answer → end)
4. `call_transcripts` captured in real-time
5. Email captured → `lead` created and linked to `call_session`
6. If complex query → `handoff_request` created for human agent
7. Agent claims request (status: `pending` → `claimed` → `resolved`)
8. All actions logged to `audit_logs`

## Cost Tracking

- `call_sessions.cost_cents` tracks per-call COGS
- `call_sessions.metadata` stores provider-specific metrics
- Target: **$0.031/minute** (80% cheaper than OpenAI Realtime API)

## Migrations

Schema is defined in: `/supabase/migrations/0001_core_schema.sql`

To extend schema:
1. Use `supabase--migration` tool
2. Add new tables/columns
3. Update RLS policies
4. Regenerate TypeScript types (automatic)
5. Update this doc

## See Also

- **[Architecture & Core Flows](./03-architecture-and-core-flows.md)** - System design
- **[Tech Stack](./02-tech-stack-and-integrations.md)** - Database & storage technologies
- **[Page Inventory](./05-page-inventory-and-routing.md)** - UI pages that use this data
