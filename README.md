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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9e7ad6e8-c810-4b96-aa75-d7a615a275d4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
