# Quantum Voice AI Platform

**A cost-optimized voice AI SaaS platform for intelligent lead capture and qualification through QR codes and web widgets.**

## Project Info

**URL**: https://lovable.dev/projects/9e7ad6e8-c810-4b96-aa75-d7a615a275d4

---

## 📚 Internal Knowledge & Documentation

**CRITICAL:** This project has comprehensive internal documentation in the `/docs` folder that serves as the **canonical reference** for all development work.

### Documentation Structure

| Document | Purpose | Use When... |
|----------|---------|-------------|
| **[00-knowledge-index.md](./docs/00-knowledge-index.md)** | Master index with usage guidelines | Starting any development work |
| **[01-vision-and-product-overview.md](./docs/01-vision-and-product-overview.md)** | Product vision, value prop, target market | Understanding product goals, scope, non-goals |
| **[02-tech-stack-and-integrations.md](./docs/02-tech-stack-and-integrations.md)** | Complete tech stack with versions | Setting up environments, choosing technologies |
| **[03-architecture-and-core-flows.md](./docs/03-architecture-and-core-flows.md)** | System architecture and data flows | Designing features, debugging, understanding flows |
| **[04-design-system-and-ux-principles.md](./docs/04-design-system-and-ux-principles.md)** | "Cyber Luxury" design system | Building UI components, ensuring consistency |
| **[05-page-inventory-and-routing.md](./docs/05-page-inventory-and-routing.md)** | All 87 pages with routes and priorities | Planning sprints, implementing routes |
| **[06-prompting-and-agent-guidelines.md](./docs/06-prompting-and-agent-guidelines.md)** | AI agent behavior and prompting best practices | Configuring conversation flows, AI prompts |
| **[07-data-model-reference.md](./docs/07-data-model-reference.md)** | Database schema and TypeScript types | Implementing queries, understanding data relationships |

### Golden Rules

> **These docs are the single source of truth. Do not contradict them when building features.**

1. **Always check relevant docs BEFORE implementing** new features or routes
2. **Use exact terminology** from the docs (e.g., design tokens: `space_black`, `matrix_blue`, etc.)
3. **Follow architectural boundaries** defined in `03-architecture-and-core-flows.md`
4. **Respect the page inventory** in `05-page-inventory-and-routing.md` - don't create routes not listed there
5. **Update docs immediately** when making significant architectural changes

---

## 🤖 Working with Lovable AI

### How to Reference Docs in Prompts

When working with Lovable AI, **explicitly reference the docs** to ensure consistency:

**Good Examples:**
```
"Build the /campaigns page according to docs/05-page-inventory-and-routing.md, 
using the design tokens from docs/04-design-system-and-ux-principles.md"

"Implement the Flow Designer at /flows/designer/[campaignId] as specified in 
docs/05 with the three-panel workspace layout from docs/04"

"Follow the tech stack in docs/02 - use LiveKit for WebRTC, not raw WebRTC"
```

**Bad Examples:**
```
❌ "Build a campaigns page" (too vague, doesn't reference canonical structure)
❌ "Use Twilio for voice" (contradicts docs/02 which specifies LiveKit)
❌ "Create a /settings/profile page" (not in docs/05 page inventory)
```

### AI Behavior Contract

Lovable AI follows these rules when generating code:

1. ✅ **Respect Route Structure:** Only create routes listed in `docs/05-page-inventory-and-routing.md`
2. ✅ **Follow Architecture:** Respect subsystem boundaries in `docs/03-architecture-and-core-flows.md`
3. ✅ **Use Specified Stack:** Only use technologies from `docs/02-tech-stack-and-integrations.md`
4. ✅ **Apply Design System:** Use design tokens and patterns from `docs/04-design-system-and-ux-principles.md`
5. ✅ **Implement AI Patterns:** Follow prompting guidelines in `docs/06-prompting-and-agent-guidelines.md`
6. ⚠️ **Flag Conflicts:** If a prompt contradicts the docs, ask for clarification rather than ignoring the docs

### Quick Start: Building a New Feature

```bash
# 1. Read relevant docs first
cat docs/05-page-inventory-and-routing.md  # Find the page/route
cat docs/04-design-system-and-ux-principles.md  # Understand layout patterns
cat docs/03-architecture-and-core-flows.md  # Check data flow

# 2. Prompt Lovable with explicit doc references
# Example: "Build /campaigns/new page per docs/05 using Mission Control 
# layout from docs/04 with campaign creation flow from docs/03"

# 3. Verify generated code aligns with docs
# - Routes match docs/05
# - Design tokens from docs/04
# - API calls match docs/03 data flows
```

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9e7ad6e8-c810-4b96-aa75-d7a615a275d4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

---

## 🎯 Features Implemented

### ✅ Design System & App Shell
- **Cyber Luxury Theme**: SpaceX-inspired design system with holographic effects, animated gradients, and mission control aesthetics
- **Design Tokens**: Comprehensive color palette (cyber-blue, cyber-green, cyber-purple, cyber-pink), typography scale, and CSS custom properties
- **App Shell Layout**: Collapsible sidebar, top bar with account switcher, user menu, and responsive mobile design
- **UI Components Library**: Button, Card, Badge, Input, Select, Tabs, Table, MetricCard, and more - all styled with design tokens
- **Design System Showcase**: `/dev/design-system` page displaying all components, colors, and typography

### ✅ Authentication System
- **Email/Password Authentication**: Login and signup flows using Supabase Auth
- **Protected Routes**: Route-level authentication guards for authenticated pages
- **Session Management**: Persistent sessions with auto-refresh tokens
- **Email Verification**: Optional email confirmation flow (auto-confirm enabled for development)
- **Post-Login Routing**: Smart redirects to onboarding for new users, dashboard for returning users
- **Logout Functionality**: Secure sign-out from App Shell user menu

### ✅ Onboarding Flow
- **2-Step Wizard**: Guides new users through first campaign creation
  - **Step 1 - Welcome** (`/onboarding/welcome`): Introduction to Quantum Voice AI with feature highlights
  - **Step 2 - Campaign Setup** (`/onboarding/campaign-setup`): Collect campaign name, goal, and entry type preferences
- **Smart Routing**: New signups → onboarding, existing users with campaigns → dashboard
- **Campaign Creation**: Creates first campaign with draft status in user's account
- **Multi-tenant Support**: Campaign linked to user's primary account via account_memberships
- **Success Flow**: Redirects to dashboard with welcome toast after completion
- **Skip Option**: Users can postpone onboarding if needed

### ✅ Database & Backend
- **Multi-tenant Architecture**: Accounts, users, account_memberships for team support
- **Campaign Management**: Campaigns table with status, entry_type, and metadata
- **Row-Level Security (RLS)**: All tables protected with account-scoped RLS policies
- **Helper Functions**: `get_user_account_ids()`, `has_account_role()` for secure data access
- **Audit Trail**: Audit logs table for security and compliance tracking

### 🚧 Next Steps
- Campaign list page (`/campaigns`) with filtering and search
- Flow designer for conversation logic (`/flows/designer/[campaignId]`)
- Knowledge base management (`/knowledge`)
- Leads dashboard with export (`/leads`)
- Live call interface with WebRTC
- QR code generation and widget embed code

---

## 🛠️ Technology Stack

**See [docs/02-tech-stack-and-integrations.md](./docs/02-tech-stack-and-integrations.md) for complete details.**

### Core Framework
- **Next.js 14** (App Router) - Full-stack React framework
- **TypeScript** - Type safety across frontend and backend
- **React 18** - UI library with Server Components
- **Tailwind CSS** - Utility-first styling with custom design tokens
- **shadcn/ui** - Accessible component library

### Backend & Data
- **Supabase** - PostgreSQL database, Auth, Storage, Realtime
- **Redis** - Session management and caching

### AI & Voice Stack
- **LiveKit** - WebRTC audio transport ($0.0045/min)
- **Deepgram STT (Nova-3)** - Speech-to-text ($0.0077/min)
- **Deepgram TTS (Aura)** - Text-to-speech ($0.018/min)
- **GPT-4-mini** - Primary conversation AI ($0.00015/1K tokens)
- **Gemini File Search** - RAG knowledge base
- **Tavily** - Web search fallback

### Integrations
- **Asana** - Task creation for callbacks
- **Slack** - Real-time lead notifications
- **Resend** - Transactional emails

### Deployment
- **Vercel** - Hosting and edge network

**Target COGS:** $0.031/minute (80% cheaper than OpenAI Realtime API)

---

## 🎨 Design System & Component Library

### Quick Start

```bash
# View the complete design system showcase
npm run dev
# Visit http://localhost:8080/dev/design-system
```

### "Cyber Luxury" Design Tokens

**Color Palette:**
```css
--background: 0 0% 0%;           /* Space Black #000000 */
--primary: 189 100% 42%;         /* Matrix Blue #00D4FF */
--secondary: 157 100% 50%;       /* Cyber Green #00FF88 */
--accent: 262 80% 60%;           /* Electric Purple #8B5CF6 */
--destructive: 330 100% 50%;     /* Neon Pink #FF0080 */
--card: 0 0% 10%;                /* Carbon Gray #1A1A1A */
--muted: 0 0% 17%;               /* Steel #2D2D2D */
--foreground: 0 0% 90%;          /* Silver #E5E5E5 */
```

**Typography:**
- Primary: Inter (sans-serif)
- Monospace: JetBrains Mono

**Special Effects:**
- `.cyber-grid` - Animated grid background (SpaceX inspired)
- `.glow-blue` / `.glow-green` / `.glow-purple` - Holographic glow effects
- `.glass` - Glass morphism with backdrop blur
- `.holographic-text` - Animated gradient text effect
- `.border-pulse` - Pulsing border animation

### AppShell Layout

**All authenticated pages MUST use the AppShell component:**

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Your Page Title</h1>
        {/* Your page content */}
      </div>
    </AppShell>
  );
}
```

**Features:**
- Collapsible sidebar with primary navigation (Dashboard, Campaigns, Flows, Knowledge, Leads, Team, Settings)
- Top bar with account switcher, notifications, help, and user menu
- Mission Control inspired layout (SpaceX aesthetic)
- Fully responsive - sidebar collapses to icons on mobile

### Core UI Components

**Location:** `src/components/ui/`

#### MetricCard (Dashboard KPIs)
```tsx
import { MetricCard } from '@/components/ui/metric-card';
import { Phone } from 'lucide-react';

<MetricCard
  label="Active Calls"
  value="24"
  icon={<Phone className="h-5 w-5" />}
  trend={{ value: 12, isPositive: true }}
  status="success"
/>
```

#### Buttons
```tsx
import { Button } from '@/components/ui/button';

<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button className="glow-blue">With Glow Effect</Button>
```

#### Cards
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card className="glow-green">
  <CardHeader>
    <CardTitle>Your Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content here
  </CardContent>
</Card>
```

#### Other Components
- **Badge** - Status indicators
- **Input** / **Textarea** - Form inputs
- **Switch** - Toggle switches
- **Tabs** - Tab navigation
- **Table** - Data tables
- **Dialog** / **Sheet** - Modals and side panels

**See `/dev/design-system` for complete component showcase with examples**

---

## 🗄️ Database Schema

**Multi-tenant Postgres with Row Level Security (RLS)**

### Core Tables
- `accounts` - Tenant root entities (workspaces)
- `users` - User profiles linked to auth.users
- `account_memberships` - User-to-account relationships with roles (owner/admin/member/agent)
- `campaigns` - Voice AI campaigns
- `flows` - Node-based conversation logic graphs
- `knowledge_sources` & `knowledge_documents` - RAG knowledge base
- `call_sessions` & `call_transcripts` - Voice call data and transcripts
- `leads` - Captured contact information with qualification scores
- `handoff_requests` - AI → human escalation queue
- `integrations` - External service configurations
- `audit_logs` - Security and compliance tracking

### TypeScript Types

```typescript
import { Campaign, Lead, CallSession } from '@/types/db';
import { supabase } from '@/integrations/supabase/client';

// RLS automatically filters by user's account
const { data: campaigns } = await supabase
  .from('campaigns')
  .select('*')
  .eq('status', 'active');
```

**Full schema documentation:** `docs/07-data-model-reference.md`

---

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9e7ad6e8-c810-4b96-aa75-d7a615a275d4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
